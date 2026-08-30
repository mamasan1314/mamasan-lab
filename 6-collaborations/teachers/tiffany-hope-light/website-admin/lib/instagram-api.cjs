const fs = require('node:fs');
const path = require('node:path');

const ADMIN_DIR = path.resolve(__dirname, '..');
const DEFAULT_ENV_FILE = path.resolve(ADMIN_DIR, '.env');
const GRAPH_HOST = 'https://graph.instagram.com';

// Token 與 App Secret 絕不進入 stdout、stderr、錯誤訊息或任何檔案。
// 這個模組只回傳非機密欄位；呼叫端不應該再把設定物件整包印出來。
function redact(text, config) {
  let output = String(text ?? '');
  for (const secret of [config?.accessToken, config?.appSecret]) {
    if (secret && secret.length >= 8) {
      output = output.split(secret).join('[redacted]');
    }
  }
  return output;
}

function parseEnvFile(contents) {
  const values = {};
  for (const rawLine of String(contents).split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/u);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^["']|["']$/gu, '');
  }
  return values;
}

function loadApiConfig(envFile = DEFAULT_ENV_FILE) {
  const resolved = path.resolve(envFile);
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `找不到 ${path.basename(resolved)}。請複製 .env.example 成 .env 並填入實際值。`,
    );
  }

  const values = parseEnvFile(fs.readFileSync(resolved, 'utf8'));
  const config = {
    appId: values.INSTAGRAM_APP_ID || '',
    appSecret: values.INSTAGRAM_APP_SECRET || '',
    accessToken: values.INSTAGRAM_LONG_LIVED_TOKEN || '',
    targetUsername: (values.INSTAGRAM_TARGET_USERNAME || '').replace(/^@/u, ''),
    envFile: resolved,
  };

  if (!config.accessToken) {
    throw new Error('.env 裡的 INSTAGRAM_LONG_LIVED_TOKEN 是空的。');
  }
  return config;
}

// 權杖只放在 header，不放 query string，避免出現在轉址紀錄或伺服器 log。
async function graphGet(endpoint, { config, fields }) {
  const url = new URL(`${GRAPH_HOST}${endpoint}`);
  if (fields) url.searchParams.set('fields', fields);

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });
  } catch (error) {
    throw new Error(`連線 Instagram Graph API 失敗：${redact(error.message, config)}`);
  }

  const bodyText = await response.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    throw new Error(`回應不是 JSON（HTTP ${response.status}）`);
  }

  if (!response.ok || body.error) {
    const apiError = body.error || {};
    const error = new Error(
      redact(apiError.message || `HTTP ${response.status}`, config),
    );
    error.apiType = apiError.type;
    error.apiCode = apiError.code;
    error.apiSubcode = apiError.error_subcode;
    throw error;
  }
  return body;
}

// 唯讀。只讀取帳號識別欄位，不讀貼文、留言、私訊或洞察報告。
async function fetchAccountIdentity(config) {
  return graphGet('/me', {
    config,
    fields: 'id,user_id,username,account_type,media_count',
  });
}

module.exports = {
  DEFAULT_ENV_FILE,
  fetchAccountIdentity,
  graphGet,
  loadApiConfig,
  parseEnvFile,
  redact,
};
