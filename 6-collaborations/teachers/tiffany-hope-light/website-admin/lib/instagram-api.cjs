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

// 具名帳號設定檔：INSTAGRAM_PROFILE_<名稱>_TOKEN／_USERNAME／_MODE
// mode 為 production 的設定檔代表真實客戶帳號，寫入類工具必須額外要求明確確認。
function collectProfiles(values) {
  const profiles = new Map();

  for (const [key, value] of Object.entries(values)) {
    const match = key.match(/^INSTAGRAM_PROFILE_([A-Z0-9]+)_(TOKEN|USERNAME|MODE)$/u);
    if (!match) continue;
    const name = match[1].toLowerCase();
    const entry = profiles.get(name) || { name, accessToken: '', username: '', mode: '' };
    if (match[2] === 'TOKEN') entry.accessToken = value;
    if (match[2] === 'USERNAME') entry.username = value.replace(/^@/u, '');
    if (match[2] === 'MODE') entry.mode = value.toLowerCase();
    profiles.set(name, entry);
  }

  // 相容舊格式：單一 INSTAGRAM_LONG_LIVED_TOKEN 視為 hopelight 正式帳號。
  if (values.INSTAGRAM_LONG_LIVED_TOKEN && !profiles.has('hopelight')) {
    profiles.set('hopelight', {
      name: 'hopelight',
      accessToken: values.INSTAGRAM_LONG_LIVED_TOKEN,
      username: (values.INSTAGRAM_TARGET_USERNAME || '').replace(/^@/u, ''),
      mode: 'production',
      legacy: true,
    });
  }

  for (const entry of profiles.values()) {
    if (!entry.mode) entry.mode = 'sandbox';
    entry.isProduction = entry.mode === 'production';
  }
  return profiles;
}

function loadApiConfig({ envFile = DEFAULT_ENV_FILE, profile } = {}) {
  const resolved = path.resolve(envFile);
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `找不到 ${path.basename(resolved)}。請複製 .env.example 成 .env 並填入實際值。`,
    );
  }

  const values = parseEnvFile(fs.readFileSync(resolved, 'utf8'));
  const profiles = collectProfiles(values);
  const usable = [...profiles.values()].filter((entry) => entry.accessToken);

  if (usable.length === 0) {
    throw new Error('.env 裡沒有任何可用的帳號設定檔，請參考 .env.example。');
  }

  const requested = (profile || values.INSTAGRAM_DEFAULT_PROFILE || '').toLowerCase();
  let selected;

  if (requested) {
    selected = profiles.get(requested);
    if (!selected || !selected.accessToken) {
      throw new Error(
        `找不到名為 ${requested} 的帳號設定檔。可用：${usable.map((e) => e.name).join('、')}`,
      );
    }
  } else if (usable.length === 1) {
    selected = usable[0];
  } else {
    // 多個設定檔但沒有指定預設，寧可停下來，也不要替使用者猜要打哪個帳號。
    throw new Error(
      `設定了多個帳號（${usable.map((e) => e.name).join('、')}）但沒有指定要用哪一個。` +
        '請加上 --profile <名稱>，或在 .env 設定 INSTAGRAM_DEFAULT_PROFILE。',
    );
  }

  return {
    appId: values.INSTAGRAM_APP_ID || '',
    appSecret: values.INSTAGRAM_APP_SECRET || '',
    accessToken: selected.accessToken,
    profileName: selected.name,
    mode: selected.mode,
    isProduction: selected.isProduction,
    targetUsername: selected.username,
    availableProfiles: usable.map((e) => ({ name: e.name, mode: e.mode, username: e.username })),
    envFile: resolved,
  };
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
  collectProfiles,
  fetchAccountIdentity,
  graphGet,
  loadApiConfig,
  parseEnvFile,
  redact,
};
