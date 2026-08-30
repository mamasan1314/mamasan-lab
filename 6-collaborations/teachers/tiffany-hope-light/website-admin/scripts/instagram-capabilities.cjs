#!/usr/bin/env node

// 權限盤點：逐項確認這支權杖實際被授予了哪些能力。
//
// 設計原則：每一項都要能分辨「權限沒有」與「權限有但因其他原因失敗」。
// 無法分辨時一律回報「無法判定」，不猜測。
// 全程唯讀或不產生任何內容；不輸出權杖、留言內容或訊息內容。

const { fetchAccountIdentity, graphGet, loadApiConfig } = require('../lib/instagram-api.cjs');

const GRAPH_HOST = 'https://graph.instagram.com';

function optionValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

// Meta 的權限不足錯誤集中在這些代碼與訊息特徵上。
function classify(error) {
  const message = String(error?.message || '');
  const code = error?.apiCode;
  if (code === 190) return { verdict: 'token', detail: '權杖無效或已過期' };
  if (code === 10 || code === 200 || code === 3 || /permission|scope|授權|權限/iu.test(message)) {
    return { verdict: 'denied', detail: message };
  }
  return { verdict: 'other', detail: message };
}

async function probe(label, scope, run) {
  try {
    const value = await run();
    return { label, scope, verdict: 'granted', detail: value || '呼叫成功' };
  } catch (error) {
    const { verdict, detail } = classify(error);
    return { label, scope, verdict, detail };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const config = loadApiConfig({ profile: optionValue(args, '--profile') });

  console.log(
    config.isProduction
      ? '*** 正式帳號 PRODUCTION — 這是真實客戶帳號 ***'
      : '--- 沙盒帳號 SANDBOX — 可安全測試 ---',
  );
  console.log(`帳號設定檔  : ${config.profileName}（${config.mode}）`);

  const identity = await fetchAccountIdentity(config);
  console.log(`帳號        : @${identity.username}（${identity.account_type}）`);
  console.log(`貼文數      : ${identity.media_count ?? '未知'}`);
  console.log('');

  const media = await graphGet('/me/media', { config, fields: 'id' }).catch(() => ({ data: [] }));
  const firstMediaId = (media.data || [])[0]?.id;

  const results = [];

  results.push(await probe('讀取個人檔案', 'instagram_business_basic', async () => '已確認'));

  results.push(
    await probe('讀取貼文清單', 'instagram_business_basic', async () => {
      const page = await graphGet('/me/media', { config, fields: 'id,timestamp' });
      return `讀到 ${(page.data || []).length} 筆`;
    }),
  );

  // 建立媒體容器時故意送出無效素材網址：不會建立任何東西，
  // 但足以分辨「被權限擋下」還是「被素材擋下」。
  results.push(
    await probe('發布內容', 'instagram_business_content_publish', async () => {
      const response = await fetch(`${GRAPH_HOST}/v23.0/me/media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          image_url: 'https://example.invalid/capability-probe.jpg',
          caption: 'capability probe - never published',
        }),
      });
      const body = await response.json();
      if (body.id) return `注意：意外建立了容器 ${body.id}（24 小時後自動失效，未發布）`;
      const error = Object.assign(new Error(body.error?.message || '未知'), {
        apiCode: body.error?.code,
      });
      // 卡在素材代表已經通過權限檢查。
      if (/media type|擷取影音素材|URI/iu.test(error.message)) return '通過權限檢查，被素材擋下';
      throw error;
    }),
  );

  results.push(
    await probe('讀取留言', 'instagram_business_manage_comments', async () => {
      if (!firstMediaId) throw Object.assign(new Error('帳號沒有貼文可供測試'), { apiCode: 0 });
      const page = await graphGet(`/${firstMediaId}/comments`, { config, fields: 'id' });
      return `可讀取，最新一則貼文有 ${(page.data || []).length} 則留言`;
    }),
  );

  results.push(
    await probe('讀取私訊會話', 'instagram_business_manage_messages', async () => {
      const page = await graphGet('/me/conversations', { config, fields: 'id' });
      return `可讀取，${(page.data || []).length} 個會話（未讀取任何訊息內容）`;
    }),
  );

  const symbol = { granted: '[有]', denied: '[無]', other: '[?]', token: '[!]' };
  console.log('權限盤點');
  console.log('--------------------------------------------------------------');
  for (const r of results) {
    console.log(`${symbol[r.verdict]} ${r.label.padEnd(12)} ${r.scope}`);
    console.log(`     ${r.detail}`);
  }
  console.log('');
  console.log('[有] 已授予　[無] 未授予　[?] 無法判定，需人工確認　[!] 權杖問題');
}

main().catch((error) => {
  console.error('盤點失敗：', error.message);
  process.exitCode = 1;
});
