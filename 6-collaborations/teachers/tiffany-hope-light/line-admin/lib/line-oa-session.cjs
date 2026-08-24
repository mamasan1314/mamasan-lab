const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright-core');

const ACCOUNT_ID = '@290ykfry';
const MANAGER_ORIGIN = 'https://manager.line.biz';
const DEFAULT_ACCOUNT_URL = `${MANAGER_ORIGIN}/account/${ACCOUNT_ID}`;

function defaultProfileDir() {
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || os.homedir();
    return path.join(base, 'mamasan-lab', 'hope-light-line-oa-browser-profile');
  }
  if (process.platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'mamasan-lab',
      'hope-light-line-oa-browser-profile',
    );
  }
  return path.join(
    process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'),
    'mamasan-lab',
    'hope-light-line-oa-browser-profile',
  );
}

function browserCandidates() {
  if (process.platform === 'win32') {
    return [
      process.env.LINE_OA_BROWSER_PATH,
      process.env.PROGRAMFILES &&
        path.join(
          process.env.PROGRAMFILES,
          'Google',
          'Chrome',
          'Application',
          'chrome.exe',
        ),
      process.env['PROGRAMFILES(X86)'] &&
        path.join(
          process.env['PROGRAMFILES(X86)'],
          'Google',
          'Chrome',
          'Application',
          'chrome.exe',
        ),
      process.env.PROGRAMFILES &&
        path.join(
          process.env.PROGRAMFILES,
          'Microsoft',
          'Edge',
          'Application',
          'msedge.exe',
        ),
      process.env['PROGRAMFILES(X86)'] &&
        path.join(
          process.env['PROGRAMFILES(X86)'],
          'Microsoft',
          'Edge',
          'Application',
          'msedge.exe',
        ),
    ];
  }
  if (process.platform === 'darwin') {
    return [
      process.env.LINE_OA_BROWSER_PATH,
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
  }
  return [
    process.env.LINE_OA_BROWSER_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/microsoft-edge',
    '/usr/bin/microsoft-edge-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
}

function findBrowser(explicitPath) {
  const candidates = [explicitPath, ...browserCandidates()].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      'Chrome, Edge, or Chromium was not found. Set LINE_OA_BROWSER_PATH to the browser executable.',
    );
  }
  return path.resolve(found);
}

function isTargetAccountPath(pathname) {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Use the original path when it contains malformed escapes.
  }
  return decoded === `/account/${ACCOUNT_ID}` || decoded.startsWith(`/account/${ACCOUNT_ID}/`);
}

async function isAuthenticatedAccountPage(page) {
  let current;
  try {
    current = new URL(page.url());
  } catch {
    return false;
  }
  if (
    current.origin !== MANAGER_ORIGIN ||
    !isTargetAccountPath(current.pathname)
  ) {
    return false;
  }
  if ((await page.locator('input[type="password"]').count()) > 0) return false;
  const uiState = await page.evaluate(() => {
    const bodyText = String(document.body?.innerText || '')
      .replace(/\s+/gu, ' ')
      .trim();
    const labels = [
      ...document.querySelectorAll(
        'nav a, aside a, [role="navigation"] a, [class*="SideMenu"] a',
      ),
    ]
      .map((element) => String(element.textContent || '').replace(/\s+/gu, ' ').trim())
      .filter(Boolean);
    return { bodyText, labels };
  }).catch(() => ({ bodyText: '', labels: [] }));
  const managerWords = [
    '主頁',
    '聊天',
    '群發訊息',
    '圖文選單',
    '分析',
    '設定',
    'Home',
    'Chat',
    'Broadcast',
    'Rich menu',
    'Insight',
    'Settings',
  ];
  const combined = `${uiState.labels.join(' ')} ${uiState.bodyText}`;
  const managerWordCount = managerWords.filter((word) => combined.includes(word)).length;
  return uiState.labels.length >= 2 || managerWordCount >= 2;
}

async function waitForAuthenticatedAccountPage(page, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isAuthenticatedAccountPage(page)) return true;
    await page.waitForTimeout(500);
  }
  return isAuthenticatedAccountPage(page);
}

async function openLineOfficialAccountManager(options = {}) {
  const browserPath = findBrowser(options.browserPath);
  const profileDir = path.resolve(
    options.profileDir ||
      process.env.LINE_OA_PROFILE_DIR ||
      defaultProfileDir(),
  );
  const accountUrl = options.accountUrl || DEFAULT_ACCOUNT_URL;
  const headless = options.headless !== false;

  fs.mkdirSync(profileDir, { recursive: true });
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: browserPath,
    headless,
    locale: 'zh-TW',
    acceptDownloads: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(accountUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });

  return {
    accountUrl,
    browserPath,
    context,
    page,
    profileDir,
    authenticated: await isAuthenticatedAccountPage(page),
  };
}

module.exports = {
  ACCOUNT_ID,
  DEFAULT_ACCOUNT_URL,
  MANAGER_ORIGIN,
  defaultProfileDir,
  findBrowser,
  isAuthenticatedAccountPage,
  openLineOfficialAccountManager,
  waitForAuthenticatedAccountPage,
};
