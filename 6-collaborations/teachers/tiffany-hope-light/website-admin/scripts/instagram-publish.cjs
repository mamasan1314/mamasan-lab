#!/usr/bin/env node

// Instagram 圖片發布工具。
//
// 安全設計：
//   1. 預設只做預檢與建立媒體容器，不發布。要發布必須明確加上 --publish。
//   2. production 設定檔另需 --confirm-production，避免誤發到真實客戶帳號。
//   3. 發布前比對權杖實際打到的帳號與設定檔登記的名稱，不符即中止。
//   4. Caption 一律由檔案讀入，避免命令列跳脫造成內容被截斷或竄改。
//   5. 影片由 Meta 非同步轉檔，必須等容器狀態變成 FINISHED 才能發布；
//      工具會輪詢並在 ERROR 或逾時時中止，不會拿未就緒的容器去發。
//   6. --result-json 會把每個階段的結果原子性寫成機器可讀 JSON。呼叫端不必
//      解析人類可讀輸出，也就不會把「發布類型」之類的前段欄位誤讀成結果。
//      關鍵在於送出 /media_publish 之前就先落地 publishAttempted=true：
//      回應遺失時，呼叫端有依據可以對帳，而不是盲目重送。
//      JSON 只含非機密欄位；權杖與 App Secret 一律不寫入。

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { fetchAccountIdentity, graphGet, loadApiConfig, redact } = require('../lib/instagram-api.cjs');

const GRAPH_HOST = 'https://graph.instagram.com';
const API_VERSION = 'v23.0';

function optionValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

// 結果檔以「先寫暫存再 rename」落地，避免呼叫端讀到寫了一半的 JSON。
function createResultWriter(resultPath) {
  const state = {
    schemaVersion: 1,
    tool: 'instagram-publish',
    stage: 'starting',
    outcome: 'pending',
    publishRequested: false,
    publishAttempted: false,
    mediaType: null,
    profileName: null,
    isProduction: null,
    actualHandle: null,
    captionSha256: null,
    containerId: null,
    containerStatus: null,
    mediaId: null,
    permalink: null,
    publishedAt: null,
    error: null,
    updatedAt: null,
  };
  // 未指定結果檔時仍在記憶體維護狀態，錯誤分類才不會因為少一個旗標而失準。
  if (!resultPath) {
    return { update: (patch) => { Object.assign(state, patch); }, enabled: false, state };
  }
  const resolved = path.resolve(resultPath);
  const update = (patch) => {
    Object.assign(state, patch);
    state.updatedAt = new Date().toISOString();
    const temporary = resolved + '.' + crypto.randomBytes(6).toString('hex') + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(temporary, resolved);
  };
  return { update, enabled: true, state };
}

function safeErrorClass(state) {
  if (state.publishAttempted && !state.mediaId) return 'publish_outcome_unknown';
  if (state.containerId) return 'failed_after_container';
  return 'failed_before_container';
}

async function graphPost(endpoint, params, config) {
  const response = await fetch(`${GRAPH_HOST}/${API_VERSION}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const body = await response.json();
  if (body.error) {
    const error = new Error(body.error.message);
    error.apiCode = body.error.code;
    error.apiSubcode = body.error.error_subcode;
    throw error;
  }
  return body;
}

let resultWriter = createResultWriter(null);
// 僅供錯誤訊息脫敏使用；不得整包印出或寫入任何檔案。
let activeConfig = null;

async function main() {
  const args = process.argv.slice(2);
  resultWriter = createResultWriter(optionValue(args, '--result-json'));
  const imageUrl = optionValue(args, '--image');
  const videoUrl = optionValue(args, '--video');
  const coverUrl = optionValue(args, '--cover');
  const shareToFeed = !args.includes('--no-share-to-feed');
  const mediaUrl = imageUrl || videoUrl;
  const isReel = Boolean(videoUrl);
  const captionFile = optionValue(args, '--caption-file');
  const shouldPublish = args.includes('--publish');
  const confirmedProduction = args.includes('--confirm-production');

  if ((!imageUrl && !videoUrl) || !captionFile) {
    console.error('用法：node scripts/instagram-publish.cjs (--image <網址> | --video <網址>) --caption-file <檔案> [--cover <網址>] [--profile <名稱>] [--no-share-to-feed] [--publish] [--result-json <檔案>]');
    process.exitCode = 1;
    return;
  }
  if (imageUrl && videoUrl) {
    throw new Error('--image 與 --video 只能擇一。');
  }
  for (const [label, value] of [['素材', mediaUrl], ['封面', coverUrl]]) {
    if (value && !/^https:\/\//u.test(value)) {
      throw new Error(`${label}網址必須是公開的 HTTPS 網址，Meta 無法讀取本機檔案。`);
    }
  }

  const caption = fs.readFileSync(path.resolve(captionFile), 'utf8').replace(/\s+$/u, '');
  const config = loadApiConfig({ profile: optionValue(args, '--profile') });
  activeConfig = config;

  console.log(
    config.isProduction
      ? '*** 正式帳號 PRODUCTION — 這是真實客戶帳號 ***'
      : '--- 沙盒帳號 SANDBOX — 可安全測試 ---',
  );
  console.log(`帳號設定檔  : ${config.profileName}（${config.mode}）`);

  const identity = await fetchAccountIdentity(config);
  console.log(`實際帳號    : @${identity.username}`);

  if (config.targetUsername && identity.username.toLowerCase() !== config.targetUsername.toLowerCase()) {
    throw new Error(
      `帳號比對失敗：設定檔登記 @${config.targetUsername}，權杖實際打到 @${identity.username}。已中止。`,
    );
  }

  resultWriter.update({
    stage: 'preflight',
    publishRequested: shouldPublish,
    mediaType: isReel ? 'REELS' : 'IMAGE',
    profileName: config.profileName,
    isProduction: config.isProduction,
    actualHandle: '@' + identity.username,
    captionSha256: crypto.createHash('sha256').update(caption, 'utf8').digest('hex'),
  });

  console.log(`發布類型    : ${isReel ? 'REELS（影片）' : 'IMAGE（圖片）'}`);
  console.log(`素材網址    : ${mediaUrl}`);
  if (coverUrl) console.log(`封面網址    : ${coverUrl}`);
  if (isReel) console.log(`同時發到動態: ${shareToFeed ? '是' : '否'}`);
  console.log(`Caption     : ${caption.length} 字元、${caption.split('\n').length} 行`);
  const mentions = caption.match(/@[A-Za-z0-9._]+/gu) || [];
  const tags = caption.match(/#[^\s#]+/gu) || [];
  console.log(`提及帳號    : ${mentions.length ? mentions.join('、') : '無'}`);
  console.log(`Hashtag     : ${tags.length ? tags.join(' ') : '無'}`);
  console.log('');

  if (config.isProduction && shouldPublish && !confirmedProduction) {
    throw new Error('目標是正式帳號。若確定要發布，請加上 --confirm-production。已中止。');
  }

  console.log('步驟 1／2：建立媒體容器…');
  const params = { caption };
  if (isReel) {
    params.media_type = 'REELS';
    params.video_url = videoUrl;
    params.share_to_feed = String(shareToFeed);
    if (coverUrl) params.cover_url = coverUrl;
  } else {
    params.image_url = imageUrl;
  }
  const container = await graphPost('/me/media', params, config);
  resultWriter.update({ stage: 'container_created', containerId: String(container.id) });
  console.log(`容器已建立  : ${container.id}`);

  // 影片由 Meta 非同步轉檔。未達 FINISHED 就發布會失敗，因此一律等到就緒。
  const deadline = Date.now() + (isReel ? 10 * 60_000 : 60_000);
  let statusCode = '';
  while (Date.now() < deadline) {
    const status = await graphGet(`/${container.id}`, {
      config,
      fields: 'status_code,status',
    }).catch(() => null);
    statusCode = status?.status_code || '';
    if (statusCode === 'FINISHED') break;
    if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
      throw new Error(`容器處理失敗，狀態 ${statusCode}：${status?.status ?? '無細節'}`);
    }
    process.stdout.write(`容器狀態    : ${statusCode || '查詢中'}…            `);
    await new Promise((resolve) => setTimeout(resolve, isReel ? 5000 : 2000));
  }
  console.log(`容器狀態    : ${statusCode || '未回報'}            `);
  resultWriter.update({ containerStatus: statusCode || null });
  if (statusCode !== 'FINISHED') {
    throw new Error(`容器在時限內未就緒（最後狀態 ${statusCode || '未知'}），已中止，未發布。`);
  }

  if (!shouldPublish) {
    resultWriter.update({ stage: 'preflight_complete', outcome: 'not_published' });
    console.log('');
    console.log('預檢完成，未發布。容器 24 小時後自動失效。');
    console.log(`要實際發布請重跑並加上 --publish（容器 ID：${container.id}）。`);
    return;
  }

  console.log('');
  console.log('步驟 2／2：發布…');
  // 送出前先落地。回應若遺失，這個欄位是「已經送出過」的唯一憑據；
  // 呼叫端必須據此對帳，不得重送。
  resultWriter.update({ stage: 'publishing', publishAttempted: true });
  const published = await graphPost('/me/media_publish', { creation_id: container.id }, config);
  resultWriter.update({ mediaId: String(published.id) });
  console.log(`已發布      : media ID ${published.id}`);

  const detail = await graphGet(`/${published.id}`, {
    config,
    fields: 'id,permalink,timestamp,media_type',
  });
  console.log(`公開網址    : ${detail.permalink}`);
  console.log(`發布時間    : ${detail.timestamp}`);
  resultWriter.update({
    stage: 'published',
    outcome: 'published',
    permalink: detail.permalink,
    publishedAt: detail.timestamp,
    mediaType: detail.media_type,
  });
  console.log(`類型        : ${detail.media_type}`);
  console.log('');
  console.log('請把 media ID、公開網址、實際 Caption 與來源檔記入發布帳本。');
}

module.exports = { createResultWriter, safeErrorClass };

// 只有直接執行時才會發動。被 require 時僅暴露純函式，不觸發任何網路動作。
if (require.main === module) {
  main().catch((error) => {
    try {
      resultWriter.update({
        stage: 'failed',
        outcome: resultWriter.state.publishAttempted && !resultWriter.state.mediaId
          ? 'unknown'
          : 'failed',
        error: {
          class: safeErrorClass(resultWriter.state),
          message: redact(error.message, activeConfig),
          apiCode: error.apiCode ?? null,
          apiSubcode: error.apiSubcode ?? null,
        },
      });
    } catch {
      // 結果檔寫入失敗不得掩蓋原始錯誤。
    }
    console.error('失敗：', error.message);
    if (error.apiCode) console.error(`Meta 錯誤代碼：${error.apiCode}／子代碼 ${error.apiSubcode ?? '無'}`);
    process.exitCode = 1;
  });
}
