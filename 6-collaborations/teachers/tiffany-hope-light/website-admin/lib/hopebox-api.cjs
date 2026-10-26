// HopeBox only. Credentials stay encrypted for the current Windows user.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SITE = 'https://hopebox.com.tw';
const AUTH_FILE = path.join(process.env.LOCALAPPDATA || '', 'mamasan-lab', 'hopebox-api', 'auth.dpapi');

function protect(value, decrypt = false) {
  if (process.platform !== 'win32' || !process.env.LOCALAPPDATA) {
    throw new Error('This local credential store requires Windows.');
  }
  const script = '[Console]::InputEncoding = [Text.UTF8Encoding]::new(); ' +
    '[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); ' +
    '$apiPayload = [Console]::In.ReadToEnd(); ' + (decrypt
      ? '$apiSecure = ConvertTo-SecureString -String $apiPayload; ' +
        '$apiPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiSecure); ' +
        'try { [Console]::Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($apiPointer)) } ' +
        'finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($apiPointer) }'
      : '$apiSecure = ConvertTo-SecureString -String $apiPayload -AsPlainText -Force; ' +
        '[Console]::Write((ConvertFrom-SecureString -SecureString $apiSecure))');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    input: value, encoding: 'utf8', windowsHide: true, timeout: 15000,
  });
  if (result.status !== 0 || !result.stdout) throw new Error('Local credential protection failed.');
  return result.stdout;
}

async function connectHopeBoxApi() {
  if (fs.existsSync(AUTH_FILE)) return { created: false };
  const { openHopeBoxAdmin } = require('./hopebox-session.cjs');
  const session = await openHopeBoxAdmin();
  let createdUuid;
  let wroteAuth = false;
  try {
    await session.page.goto(`${SITE}/wp-admin/profile.php`, { waitUntil: 'domcontentloaded' });
    const auth = await session.page.evaluate(async () => {
      const nonce = window.wpApiSettings?.nonce;
      const user = document.querySelector('#user_login')?.value;
      if (!nonce || !user) return null;
      const response = await fetch('/wp-json/wp/v2/users/me/application-passwords', {
        method: 'POST',
        headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'HopeBox local maintenance' }),
      });
      if (!response.ok) return null;
      const body = await response.json();
      return { user, password: body.password, uuid: body.uuid };
    });
    if (!auth?.password || !auth.uuid) throw new Error('Application Password creation did not succeed.');
    createdUuid = auth.uuid;
    try {
      const encrypted = protect(JSON.stringify(auth));
      fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
      fs.writeFileSync(AUTH_FILE, encrypted, { encoding: 'utf8', flag: 'wx' });
      wroteAuth = true;
      const api = openHopeBoxApi();
      await api.request('/wp/v2/users/me?context=edit');
      return { created: true };
    } finally {
      auth.password = '';
    }
  } catch (error) {
    if (createdUuid) {
      const revoked = await session.page.evaluate(async (uuid) => {
        const nonce = window.wpApiSettings?.nonce;
        if (!nonce) return false;
        const r = await fetch('/wp-json/wp/v2/users/me/application-passwords/' + encodeURIComponent(uuid), {
          method: 'DELETE', headers: { 'X-WP-Nonce': nonce },
        });
        return r.ok;
      }, createdUuid).catch(() => false);
      if (!revoked) throw new Error('Connection setup failed; check the newly created maintenance credential in wp-admin.');
      if (wroteAuth) fs.unlinkSync(AUTH_FILE);
    }
    throw error;
  } finally {
    await session.context.close();
  }
}

function openHopeBoxApi() {
  if (!fs.existsSync(AUTH_FILE)) throw new Error('Run npm.cmd run hopebox:api -- connect first.');
  const auth = JSON.parse(protect(fs.readFileSync(AUTH_FILE, 'utf8'), true));
  const authorization = 'Basic ' + Buffer.from(`${auth.user}:${auth.password}`).toString('base64');
  auth.password = '';
  async function request(route, { method = 'GET', body, headers = {} } = {}) {
    if (!route.startsWith('/') || route.startsWith('//')) throw new Error('Use a relative WordPress REST route.');
    const url = new URL('/wp-json' + route, SITE);
    if (url.origin !== SITE) throw new Error('HopeBox origin required.');
    const response = await fetch(url, {
      method, redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { ...headers, Authorization: authorization, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const raw = await response.text();
    let data;
    try {
      const event = raw.split('\n').find(line => line.startsWith('data:'));
      data = JSON.parse(event ? event.slice(5) : raw || 'null');
    } catch { throw new Error(`HopeBox returned non-JSON content (HTTP ${response.status}).`); }
    if (!response.ok) {
      const code = /^[a-z0-9_-]+$/i.test(data?.code || '') ? data.code : 'request_failed';
      throw new Error(`HopeBox HTTP ${response.status}: ${code}`);
    }
    return { data, headers: response.headers };
  }
  return { request };
}

module.exports = { connectHopeBoxApi, openHopeBoxApi };
