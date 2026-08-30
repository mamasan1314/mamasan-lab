const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { findBrowser } = require('./hopebox-session.cjs');

const TARGET_INSTAGRAM_HANDLE = 'hopelight.moment';
const TARGET_INSTAGRAM_ASSET_ID = '17841439133515848';
const TARGET_BUSINESS_PORTFOLIO_ID = '1564680272358249';
const META_BUSINESS_ORIGIN = 'https://business.facebook.com';
const DEFAULT_TARGET_URL =
  `${META_BUSINESS_ORIGIN}/settings/instagram-account-v2s/${TARGET_INSTAGRAM_ASSET_ID}` +
  `?business_id=${TARGET_BUSINESS_PORTFOLIO_ID}`;

function defaultMetaBusinessProfileDir() {
  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || os.homedir(),
      'mamasan-lab',
      'meta-business-profiles',
      'hopelight-moment',
    );
  }
  if (process.platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'mamasan-lab',
      'meta-business-profiles',
      'hopelight-moment',
    );
  }
  return path.join(
    process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'),
    'mamasan-lab',
    'meta-business-profiles',
    'hopelight-moment',
  );
}

async function hasMetaLoginSession(context) {
  const cookies = await context.cookies([
    'https://www.facebook.com/',
    META_BUSINESS_ORIGIN,
  ]);
  return cookies.some((cookie) => cookie.name === 'c_user' && cookie.value);
}

function safeCurrentPage(page) {
  try {
    const current = new URL(page.url());
    return `${current.origin}${current.pathname}`;
  } catch {
    return 'unparseable-url';
  }
}

async function inspectTargetAssetPage(page, context) {
  const authenticated = await hasMetaLoginSession(context);
  let current;
  try {
    current = new URL(page.url());
  } catch {
    return {
      authenticated,
      targetAccessible: false,
      pageCategory: 'unparseable-url',
      targetHandleVisible: false,
      targetAssetIdVisible: false,
      accessDeniedSignal: false,
      loginFormVisible: false,
    };
  }

  const signals = await page
    .evaluate(({ handle, assetId }) => {
      const text = String(document.body?.innerText || '');
      const normalized = text.toLocaleLowerCase();
      const normalizedHandle = handle.toLocaleLowerCase();
      const targetHandleVisible =
        normalized.includes(`@${normalizedHandle}`) ||
        new RegExp(`(^|[^a-z0-9_.])${normalizedHandle.replace('.', '\\.')}(?=$|[^a-z0-9_.])`, 'iu')
          .test(normalized);
      return {
        targetHandleVisible,
        targetAssetIdVisible: text.includes(assetId),
        businessShellVisible: Boolean(
          document.querySelector(
            'nav, aside, [role="navigation"], a[href*="business.facebook.com"]',
          ),
        ),
        accessDeniedSignal:
          /you don.?t have permission|you don.?t have access|content isn.?t available|無權限|沒有權限|無法存取|內容無法使用/iu.test(
            text,
          ),
        loginFormVisible: Boolean(
          document.querySelector('input[type="password"], input[name="email"]'),
        ),
      };
    }, {
      handle: TARGET_INSTAGRAM_HANDLE,
      assetId: TARGET_INSTAGRAM_ASSET_ID,
    })
    .catch(() => ({
      targetHandleVisible: false,
      targetAssetIdVisible: false,
      businessShellVisible: false,
      accessDeniedSignal: false,
      loginFormVisible: false,
    }));

  let pageCategory = 'other';
  if (current.hostname === 'business.facebook.com' || current.hostname.endsWith('.facebook.com')) {
    if (/login|checkpoint|recover|two_step_verification/iu.test(current.pathname)) {
      pageCategory = 'authentication';
    } else if (/instagram-account-v2s|instagram_account/iu.test(current.pathname)) {
      pageCategory = 'instagram-asset-settings';
    } else if (/business\.facebook\.com$/iu.test(current.hostname)) {
      pageCategory = 'meta-business';
    } else {
      pageCategory = 'facebook';
    }
  } else {
    pageCategory = 'non-meta-host';
  }

  const targetInUrl =
    current.pathname.split('/').filter(Boolean).includes(TARGET_INSTAGRAM_ASSET_ID) ||
    current.searchParams.get('asset_id') === TARGET_INSTAGRAM_ASSET_ID;
  const modernTargetPage =
    /^\/latest\/settings\/instagram_account\/?$/iu.test(current.pathname) &&
    signals.targetAssetIdVisible;
  const targetAccessible = Boolean(
    authenticated &&
      current.origin === META_BUSINESS_ORIGIN &&
      (targetInUrl || modernTargetPage) &&
      !signals.loginFormVisible &&
      !signals.accessDeniedSignal &&
      signals.businessShellVisible &&
      signals.targetHandleVisible,
  );

  return {
    authenticated,
    targetAccessible,
    pageCategory,
    targetHandleVisible: signals.targetHandleVisible,
    targetAssetIdVisible: signals.targetAssetIdVisible,
    businessShellVisible: signals.businessShellVisible,
    accessDeniedSignal: signals.accessDeniedSignal,
    loginFormVisible: signals.loginFormVisible,
  };
}

async function findTargetAssetPage(context) {
  for (const candidate of context.pages()) {
    const state = await inspectTargetAssetPage(candidate, context);
    if (state.targetAccessible) return { page: candidate, state };
  }
  return null;
}

async function waitForTargetAssetAccess(context, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 30000);
  const targetUrl = options.targetUrl || DEFAULT_TARGET_URL;
  const deadline = Date.now() + timeoutMs;
  let targetNavigationAttempted = false;

  while (Date.now() < deadline) {
    const target = await findTargetAssetPage(context);
    if (target) return target;

    if (!targetNavigationAttempted && (await hasMetaLoginSession(context))) {
      const page = context.pages()[0] || (await context.newPage());
      await page
        .goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
        .catch(() => null);
      targetNavigationAttempted = true;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return findTargetAssetPage(context);
}

async function openMetaBusinessSuite(options = {}) {
  const browserPath = findBrowser(
    options.browserPath || process.env.META_BUSINESS_BROWSER_PATH,
  );
  const profileDir = path.resolve(
    options.profileDir ||
      process.env.META_BUSINESS_PROFILE_DIR ||
      defaultMetaBusinessProfileDir(),
  );
  const targetUrl = options.targetUrl || DEFAULT_TARGET_URL;

  fs.mkdirSync(profileDir, { recursive: true });
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: browserPath,
    headless: options.headless !== false,
    locale: 'zh-TW',
    viewport: { width: 1365, height: 900 },
    acceptDownloads: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });

  return {
    browserPath,
    context,
    page,
    profileDir,
    targetUrl,
    authenticated: await hasMetaLoginSession(context),
    safeCurrentPage: safeCurrentPage(page),
  };
}

module.exports = {
  DEFAULT_TARGET_URL,
  META_BUSINESS_ORIGIN,
  TARGET_INSTAGRAM_ASSET_ID,
  TARGET_INSTAGRAM_HANDLE,
  TARGET_BUSINESS_PORTFOLIO_ID,
  defaultMetaBusinessProfileDir,
  hasMetaLoginSession,
  inspectTargetAssetPage,
  openMetaBusinessSuite,
  safeCurrentPage,
  waitForTargetAssetAccess,
};
