const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { findBrowser } = require('./hopebox-session.cjs');

const ADMIN_DIR = path.resolve(__dirname, '..');
const DEFAULT_CREDENTIAL_FILE = path.resolve(
  ADMIN_DIR,
  '..',
  'IG 帳密.txt',
);

function parseLabeledValue(line) {
  const match = String(line).match(/^.*?[:：=](.*)$/u);
  if (!match) return '';
  return match[1].trim().replace(/^[(（]|[)）]$/gu, '').trim();
}

function loadInstagramCredentials(credentialFile = DEFAULT_CREDENTIAL_FILE) {
  const resolved = path.resolve(credentialFile);
  if (!fs.existsSync(resolved)) {
    throw new Error('The local Instagram credential handoff file is missing.');
  }

  const groups = fs
    .readFileSync(resolved, 'utf8')
    .split(/(?:\r?\n){2,}/u)
    .map((group) =>
      group
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((group) => group.length > 0);

  const accounts = groups.map((lines, index) => {
    const passwordLine = lines.find((line) => /^\s*(?:pw|password)\s*[:：=]/iu.test(line));
    const labeledLoginLine = lines.find(
      (line) =>
        /(?:email|e-mail|帳號|账号|username|user)/iu.test(line) &&
        /[:：=]/u.test(line) &&
        line !== passwordLine,
    );
    const standaloneEmail = lines.find((line) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(line));
    const login = labeledLoginLine
      ? parseLabeledValue(labeledLoginLine)
      : standaloneEmail || '';
    const password = passwordLine ? parseLabeledValue(passwordLine) : '';

    if (!login || !password) {
      throw new Error(`Instagram credential group ${index + 1} is incomplete.`);
    }

    return {
      alias: `account-${index + 1}`,
      login,
      password,
    };
  });

  if (accounts.length !== 2) {
    throw new Error(`Expected 2 Instagram credential groups; found ${accounts.length}.`);
  }

  return accounts;
}

function defaultInstagramProfileRoot() {
  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || os.homedir(),
      'mamasan-lab',
      'instagram-browser-profiles',
    );
  }
  if (process.platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'mamasan-lab',
      'instagram-browser-profiles',
    );
  }
  return path.join(
    process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'),
    'mamasan-lab',
    'instagram-browser-profiles',
  );
}

async function sessionCookieExists(context) {
  const cookies = await context.cookies('https://www.instagram.com/');
  return cookies.some((cookie) => cookie.name === 'sessionid' && cookie.value);
}

async function dismissCookiePrompt(page) {
  const selectors = [
    'button:has-text("Allow all cookies")',
    'button:has-text("Accept all")',
    'button:has-text("允許所有 Cookie")',
    'button:has-text("接受所有 Cookie")',
  ];
  for (const selector of selectors) {
    const button = page.locator(selector).first();
    if ((await button.count()) > 0 && (await button.isVisible().catch(() => false))) {
      await button.click().catch(() => null);
      await page.waitForTimeout(500);
      return;
    }
  }
}

async function classifyLoginState(page, context) {
  if (await sessionCookieExists(context)) return 'authenticated';

  const url = page.url();
  if (/two_factor|challenge|checkpoint|consent|auth_platform/iu.test(url)) {
    return 'verification-required';
  }

  const hasVerificationField =
    (await page
      .locator(
        'input[name="verificationCode"], input[name="security_code"], input[autocomplete="one-time-code"]',
      )
      .count()) > 0;
  if (hasVerificationField) return 'verification-required';

  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (
    /incorrect password|password you entered is incorrect|密碼不正確|找不到帳號|couldn.t log in/iu.test(
      bodyText,
    )
  ) {
    return 'credentials-rejected';
  }
  if (
    /enter the .*code|security code|確認是你本人|驗證碼|suspicious login|登入要求/iu.test(
      bodyText,
    )
  ) {
    return 'verification-required';
  }
  if ((await page.locator('input[name="username"]').count()) > 0) {
    return 'login-form';
  }
  return 'unknown';
}

async function safePageDiagnostics(page) {
  let pageCategory = 'unknown';
  try {
    const current = new URL(page.url());
    if (current.protocol === 'chrome-error:') pageCategory = 'browser-network-error';
    else if (!/instagram\.com$/iu.test(current.hostname)) pageCategory = 'non-instagram-host';
    else if (/two_factor/iu.test(current.pathname)) pageCategory = 'two-factor';
    else if (/challenge|checkpoint/iu.test(current.pathname)) pageCategory = 'challenge';
    else if (/accounts\/login/iu.test(current.pathname)) pageCategory = 'login';
    else if (/accounts/iu.test(current.pathname)) pageCategory = 'instagram-account-page';
    else pageCategory = 'other-instagram-page';
  } catch {
    pageCategory = 'unparseable-url';
  }

  const bodyText = await page.locator('body').innerText().catch(() => '');
  return {
    pageCategory,
    usernameField: (await page.locator('input[name="username"]').count()) > 0,
    alternateLoginField:
      (await page
        .locator(
          'input[name="email"], input[autocomplete="username"], input[autocomplete="email"], input[type="text"]',
        )
        .count()) > 0,
    passwordField: (await page.locator('input[name="password"]').count()) > 0,
    anyPasswordField: (await page.locator('input[type="password"]').count()) > 0,
    frameCount: page.frames().length,
    cookiePrompt: /cookies|cookie|Cookie/iu.test(bodyText),
    loginText: /log in|登入/iu.test(bodyText),
    retryText: /try again|再試一次|something went wrong|發生錯誤/iu.test(bodyText),
    bodyHasText: bodyText.trim().length > 0,
  };
}

async function waitForLoginResult(page, context, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  let state = 'unknown';
  while (Date.now() < deadline) {
    state = await classifyLoginState(page, context);
    if (
      state === 'authenticated' ||
      state === 'verification-required' ||
      state === 'credentials-rejected'
    ) {
      return state;
    }
    await page.waitForTimeout(1000);
  }
  return state;
}

async function waitForHumanVerification(context, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await sessionCookieExists(context)) return true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function performCredentialLogin(page, context, login, password) {
  await page.goto('https://www.instagram.com/accounts/login/', {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await dismissCookiePrompt(page);

  if (await sessionCookieExists(context)) return 'cached-session';

  let userField = page
    .locator(
      'input[name="username"], input[name="email"], input[autocomplete="username"], input[autocomplete="email"], input[type="text"]',
    )
    .first();
  let passwordField = page
    .locator('input[name="password"], input[type="password"]')
    .first();

  if ((await userField.count()) === 0 || !(await userField.isVisible().catch(() => false))) {
    const loginEntry = page
      .locator(
        'a:has-text("Log in"), button:has-text("Log in"), div[role="button"]:has-text("Log in"), a:has-text("登入"), button:has-text("登入"), div[role="button"]:has-text("登入")',
      )
      .first();
    if ((await loginEntry.count()) > 0 && (await loginEntry.isVisible().catch(() => false))) {
      await loginEntry.click().catch(() => null);
      await page.waitForTimeout(2500);
      userField = page
        .locator(
          'input[name="username"], input[name="email"], input[autocomplete="username"], input[autocomplete="email"], input[type="text"]',
        )
        .first();
      passwordField = page
        .locator('input[name="password"], input[type="password"]')
        .first();
    }
  }

  await userField.waitFor({ state: 'visible', timeout: 30000 });
  await passwordField.waitFor({ state: 'visible', timeout: 30000 });
  await userField.fill(login);
  await passwordField.fill(password);
  const submit = page
    .locator(
      'button[type="submit"], div[role="button"]:has-text("Log in"), div[role="button"]:has-text("登入")',
    )
    .first();
  await submit.click();

  const result = await waitForLoginResult(page, context);
  return result === 'authenticated' ? 'credential-login' : result;
}

function detectAccountType(text) {
  const normalized = String(text || '').replace(/\s+/gu, ' ').trim();
  if (/business tools and controls|商家工具和控制項|商業工具和控制項/iu.test(normalized)) {
    return { accountType: 'professional-business', signal: 'business-tools' };
  }
  if (/creator tools and controls|創作者工具和控制項/iu.test(normalized)) {
    return { accountType: 'professional-creator', signal: 'creator-tools' };
  }
  if (/professional dashboard|專業主控板|專業儀表板/iu.test(normalized)) {
    return { accountType: 'professional', signal: 'professional-dashboard' };
  }
  if (/switch to professional account|切換為專業帳號/iu.test(normalized)) {
    return { accountType: 'personal', signal: 'professional-upgrade-offer' };
  }
  return { accountType: 'unknown', signal: 'no-stable-ui-signal' };
}

async function inspectAccountType(page) {
  const texts = [];
  const urls = [
    'https://www.instagram.com/',
    'https://www.instagram.com/accounts/edit/',
    'https://www.instagram.com/professional_dashboard/',
  ];

  for (const url of urls) {
    await page
      .goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      .catch(() => null);
    await page.waitForTimeout(2500);
    texts.push(await page.locator('body').innerText().catch(() => ''));
  }

  return detectAccountType(texts.join('\n'));
}

async function inspectInstagramAccount(account, options = {}) {
  const browserPath = findBrowser(options.browserPath);
  const profileRoot = path.resolve(
    options.profileRoot ||
      process.env.INSTAGRAM_PROFILE_ROOT ||
      defaultInstagramProfileRoot(),
  );
  const profileDir = path.join(profileRoot, account.alias);
  fs.mkdirSync(profileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: browserPath,
    headless: options.headless !== false,
    locale: 'zh-TW',
    viewport: { width: 1365, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = context.pages()[0] || (await context.newPage());

  try {
    let loginMode = await performCredentialLogin(
      page,
      context,
      account.login,
      account.password,
    );
    if (loginMode === 'verification-required') {
      const verified =
        Number(options.waitForVerificationMs || 0) > 0 &&
        (await waitForHumanVerification(
          context,
          Number(options.waitForVerificationMs),
        ));
      if (verified) loginMode = 'credential-login-with-verification';
      else {
        return {
          account: account.alias,
          login: 'verification-required',
          accountType: 'unknown',
          professionalSignal: 'not-checked',
          metaBusinessSuite: 'not-checked',
          apiAuthorization: 'not-configured',
        };
      }
    }
    if (
      loginMode !== 'cached-session' &&
      loginMode !== 'credential-login' &&
      loginMode !== 'credential-login-with-verification'
    ) {
      return {
        account: account.alias,
        login: loginMode,
        accountType: 'unknown',
        professionalSignal: 'not-checked',
        metaBusinessSuite: 'not-checked',
        apiAuthorization: 'not-configured',
      };
    }

    const typeResult = await inspectAccountType(page);
    return {
      account: account.alias,
      login: 'success',
      loginMode,
      accountType: typeResult.accountType,
      professionalSignal: typeResult.signal,
      metaBusinessSuite: 'requires-separate-meta-access-check',
      apiAuthorization: 'not-configured',
    };
  } catch (error) {
    const safeName = error && error.name ? String(error.name) : 'Error';
    return {
      account: account.alias,
      login: 'error',
      errorType: safeName,
      diagnostics: await safePageDiagnostics(page),
      accountType: 'unknown',
      professionalSignal: 'not-checked',
      metaBusinessSuite: 'not-checked',
      apiAuthorization: 'not-configured',
    };
  } finally {
    account.login = '';
    account.password = '';
    await context.close().catch(() => null);
  }
}

module.exports = {
  DEFAULT_CREDENTIAL_FILE,
  defaultInstagramProfileRoot,
  inspectInstagramAccount,
  loadInstagramCredentials,
};
