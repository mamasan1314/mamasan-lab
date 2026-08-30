#!/usr/bin/env node

// 唯讀身分核對：確認 .env 裡的權杖打到的是哪一個 Instagram 帳號。
// 不發布、不修改、不讀取貼文內容、留言或私訊，也不印出權杖。

const { fetchAccountIdentity, loadApiConfig } = require('../lib/instagram-api.cjs');

function describeTokenShape(token) {
  const prefix = token.slice(0, 3);
  const family =
    prefix === 'IGA'
      ? 'Instagram API with Instagram Login（正確路線）'
      : prefix === 'IGQ'
        ? '舊版 Instagram Basic Display'
        : token.startsWith('EAA')
          ? 'Facebook Graph（走錯路線，不是 Instagram Login）'
          : '無法辨識';
  return { prefix, family, length: token.length };
}

async function main() {
  const config = loadApiConfig();
  const shape = describeTokenShape(config.accessToken);

  console.log('Instagram 權杖唯讀核對');
  console.log('------------------------------------');
  console.log(`設定檔      : ${config.envFile}`);
  console.log(`App ID      : ${config.appId || '(未設定)'}`);
  console.log(`權杖前綴    : ${shape.prefix}… 長度 ${shape.length}`);
  console.log(`權杖類型    : ${shape.family}`);
  console.log('');

  const identity = await fetchAccountIdentity(config);
  console.log('API 回報的帳號');
  console.log('------------------------------------');
  console.log(`username    : @${identity.username}`);
  console.log(`帳號類型    : ${identity.account_type ?? '(未回報)'}`);
  console.log(`IG user id  : ${identity.user_id ?? '(未回報)'}`);
  console.log(`app scoped  : ${identity.id}`);
  console.log(`貼文數      : ${identity.media_count ?? '(未回報)'}`);
  console.log('');

  if (!config.targetUsername) {
    console.log('提醒：.env 沒有設定 INSTAGRAM_TARGET_USERNAME，略過目標帳號比對。');
    return;
  }

  if (identity.username?.toLowerCase() === config.targetUsername.toLowerCase()) {
    console.log(`核對結果    : 通過，與預期的 @${config.targetUsername} 相同。`);
  } else {
    console.log(`核對結果    : 不符。預期 @${config.targetUsername}，實際 @${identity.username}。`);
    console.log('在確認原因之前，不要用這個權杖發布任何內容。');
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error('核對失敗。');
  console.error(`原因：${error.message}`);
  if (error.apiCode) console.error(`Meta 錯誤代碼：${error.apiCode}／子代碼 ${error.apiSubcode ?? '無'}`);
  if (error.apiCode === 190) {
    console.error('代碼 190 通常代表權杖無效或已過期，需要重新產生。');
  }
  process.exitCode = 1;
});
