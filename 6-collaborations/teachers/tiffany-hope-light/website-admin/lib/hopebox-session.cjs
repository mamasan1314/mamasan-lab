const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright-core');

const ADMIN_DIR = path.resolve(__dirname, '..');
const DEFAULT_CREDENTIAL_FILE = path.resolve(
  ADMIN_DIR,
  '..',
  'Hope_Light 帳號密碼.txt',
);

function parseLabeledValue(line) {
  const match = line.match(/^.*?[:：=](.*)$/u);
  if (!match) throw new Error('Credential label could not be parsed.');
  return match[1].trim();
}

function loadCredentials(credentialFile = DEFAULT_CREDENTIAL_FILE) {
  const resolved = path.resolve(credentialFile);
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `Credential file is missing. Expected a local file at: ${resolved}`,
    );
  }

  const lines = fs
    .readFileSync(resolved, 'utf8')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 3) throw new Error('Credential handoff is incomplete.');

  return {
    loginUrl: lines[0],
    user: parseLabeledValue(lines[1]),
    password: parseLabeledValue(lines[2]),
  };
}

function defaultProfileDir() {
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || os.homedir();
    return path.join(base, 'mamasan-lab', 'hopebox-browser-profile');
  }
  if (process.platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'mamasan-lab',
      'hopebox-browser-profile',
    );
  }
  return path.join(
    process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'),
    'mamasan-lab',
    'hopebox-browser-profile',
  );
}

function browserCandidates() {
  if (process.platform === 'win32') {
    return [
      process.env.HOPEBOX_BROWSER_PATH,
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
      process.env.HOPEBOX_BROWSER_PATH,
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
  }
  return [
    process.env.HOPEBOX_BROWSER_PATH,
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
      'Chrome, Edge, or Chromium was not found. Set HOPEBOX_BROWSER_PATH to the browser executable.',
    );
  }
  return path.resolve(found);
}

function solveEquation(text) {
  const match = text.match(/(\d{1,3})\s*([+\-×xX*])\s*(\d{1,3})/u);
  if (!match) throw new Error('Jetpack challenge equation was not found.');
  const left = Number(match[1]);
  const right = Number(match[3]);
  if (match[2] === '+') return left + right;
  if (match[2] === '-') return left - right;
  return left * right;
}

async function waitForNavigationFrom(page, action) {
  await Promise.all([
    page
      .waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 })
      .catch(() => null),
    action(),
  ]);
  await page.waitForTimeout(500);
}

async function isAdmin(page) {
  let pathname = '';
  try {
    pathname = new URL(page.url()).pathname;
  } catch {
    return false;
  }
  return (
    pathname.startsWith('/wp-admin') &&
    (await page.locator('#adminmenu, #wpadminbar').count()) > 0
  );
}

async function waitForEntryPage(page, timeoutSeconds = 45) {
  for (let second = 0; second < timeoutSeconds; second += 1) {
    if (
      (await isAdmin(page)) ||
      (await page.locator('#user_login').count()) > 0 ||
      (await page.locator('input[name="jetpack_protect_num"]').count()) > 0
    ) {
      return;
    }
    await page.waitForTimeout(1000);
  }
}

async function fillJetpackAnswer(page) {
  const field = page.locator('input[name="jetpack_protect_num"]');
  if (!(await field.count())) return false;
  const answer = solveEquation(await page.locator('body').innerText());
  await field.fill(String(answer));
  return true;
}

async function submitLogin(page, user, password) {
  await page.locator('#user_login').fill(user);
  await page.locator('#user_pass').fill(password);
  const rememberMe = page.locator('#rememberme');
  if ((await rememberMe.count()) > 0 && !(await rememberMe.isChecked())) {
    await rememberMe.check();
  }
  const challengeIncluded = await fillJetpackAnswer(page);
  await waitForNavigationFrom(page, () => page.locator('#wp-submit').click());
  return challengeIncluded;
}

async function solveJetpackChallenge(page) {
  const field = page.locator('input[name="jetpack_protect_num"]');
  if (!(await field.count())) return false;

  await fillJetpackAnswer(page);
  const challengeForm = field.locator('xpath=ancestor::form[1]');
  await waitForNavigationFrom(page, () =>
    challengeForm.evaluate((form) => form.requestSubmit()),
  );
  return true;
}

async function safeLoginMessage(page, user, password) {
  const locator = page.locator('#login_error, .message, body').first();
  let message = (await locator.count()) ? await locator.innerText() : '';
  message = String(message || '')
    .replaceAll(user, '[ACCOUNT_REDACTED]')
    .replaceAll(password, '[PASSWORD_REDACTED]')
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/gu, '[EMAIL_REDACTED]')
    .replace(/\s+/gu, ' ')
    .trim();
  return message.slice(0, 600);
}

async function openHopeBoxAdmin(options = {}) {
  const credentialFile =
    options.credentialFile ||
    process.env.HOPEBOX_CREDENTIAL_FILE ||
    DEFAULT_CREDENTIAL_FILE;
  const credentials = loadCredentials(credentialFile);
  const browserPath = findBrowser(options.browserPath);
  const profileDir = path.resolve(
    options.profileDir ||
      process.env.HOPEBOX_PROFILE_DIR ||
      defaultProfileDir(),
  );
  const headless = options.headless !== false;
  const siteRoot = new URL(credentials.loginUrl).origin;

  fs.mkdirSync(profileDir, { recursive: true });
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: browserPath,
    headless,
    locale: 'zh-TW',
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());
  let challengesSolved = 0;

  try {
    await page.goto(`${siteRoot}/wp-admin/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    if (await isAdmin(page)) {
      return {
        context,
        page,
        siteRoot,
        browserPath,
        profileDir,
        challengesSolved,
        loginMode: 'cached-session',
      };
    }

    await page.goto(credentials.loginUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await waitForEntryPage(page);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (await isAdmin(page)) break;

      if ((await page.locator('#user_login').count()) > 0) {
        const challengeIncluded = await submitLogin(
          page,
          credentials.user,
          credentials.password,
        );
        if (challengeIncluded) challengesSolved += 1;
        await waitForEntryPage(page);
        continue;
      }

      if (await solveJetpackChallenge(page)) {
        challengesSolved += 1;
        await waitForEntryPage(page);
        continue;
      }

      await waitForEntryPage(page, 10);
    }

    if (!(await isAdmin(page))) {
      const currentPath = new URL(page.url()).pathname;
      const message = await safeLoginMessage(
        page,
        credentials.user,
        credentials.password,
      );
      throw new Error(
        `WordPress login did not reach the dashboard (${currentPath}). ${message}`,
      );
    }

    return {
      context,
      page,
      siteRoot,
      browserPath,
      profileDir,
      challengesSolved,
      loginMode: 'credential-login',
    };
  } catch (error) {
    await context.close().catch(() => null);
    throw error;
  } finally {
    credentials.password = '';
  }
}

module.exports = {
  DEFAULT_CREDENTIAL_FILE,
  defaultProfileDir,
  findBrowser,
  openHopeBoxAdmin,
};
