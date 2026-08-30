#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  META_BUSINESS_ORIGIN,
  hasMetaLoginSession,
  openMetaBusinessSuite,
} = require('../lib/meta-business-session.cjs');

const PORTFOLIO_ID = '889448907217740';
const TARGET_INSTAGRAM_HANDLE = 'hopelight.ig';
const TARGET_INSTAGRAM_ASSET_ID = '17841480182265940';
const LOGIN_TIMEOUT_MS = 15 * 60 * 1000;
const PAGE_SETTLE_MS = 4500;
const PROFILE_BINDING_FILE = '.mamasan-meta-content-identity.json';
const IDENTITIES = new Set(['owner', 'delegate']);
const SAFE_CONTENT_PATHS = [
  '/latest/posts_and_stories',
  '/latest/content',
];

class SafeAuditError extends Error {
  constructor(errorType) {
    super(errorType);
    this.name = 'SafeAuditError';
    this.errorType = errorType;
  }
}

function defaultProfileRoot() {
  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || os.homedir(),
      'mamasan-lab',
      'meta-business-profiles',
    );
  }
  if (process.platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'mamasan-lab',
      'meta-business-profiles',
    );
  }
  return path.join(
    process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'),
    'mamasan-lab',
    'meta-business-profiles',
  );
}

function defaultProfileDir(identity) {
  return path.join(defaultProfileRoot(), `hopelight-ig-${identity}`);
}

function comparablePath(value) {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLocaleLowerCase() : resolved;
}

function optionValues(args, name) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name) values.push(args[index + 1]);
  }
  return values;
}

function parseArgs(args) {
  const allowedFlags = new Set(['--visible', '--wait-for-login']);
  const allowedOptions = new Set(['--identity', '--profile', '--browser']);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (allowedFlags.has(argument)) continue;
    if (allowedOptions.has(argument)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new SafeAuditError('invalid-arguments');
      }
      index += 1;
      continue;
    }
    throw new SafeAuditError('invalid-arguments');
  }

  const identityValues = optionValues(args, '--identity');
  const profileValues = optionValues(args, '--profile');
  const browserValues = optionValues(args, '--browser');
  if (
    identityValues.length !== 1 ||
    profileValues.length > 1 ||
    browserValues.length > 1 ||
    !IDENTITIES.has(identityValues[0])
  ) {
    throw new SafeAuditError('invalid-arguments');
  }

  const waitForLogin = args.includes('--wait-for-login');
  return {
    identity: identityValues[0],
    profile: profileValues[0],
    browser: browserValues[0],
    waitForLogin,
    visible: args.includes('--visible') || waitForLogin,
  };
}

function resolveIdentityProfile(identity, requestedProfile) {
  const expectedDefault = path.resolve(defaultProfileDir(identity));
  const otherIdentity = identity === 'owner' ? 'delegate' : 'owner';
  const otherDefault = path.resolve(defaultProfileDir(otherIdentity));
  const profileDir = path.resolve(requestedProfile || expectedDefault);

  if (comparablePath(profileDir) === comparablePath(otherDefault)) {
    throw new SafeAuditError('profile-identity-mismatch');
  }

  return {
    profileDir,
    profileKind:
      comparablePath(profileDir) === comparablePath(expectedDefault)
        ? 'default'
        : 'custom',
  };
}

function readProfileBinding(bindingFile) {
  try {
    const parsed = JSON.parse(fs.readFileSync(bindingFile, 'utf8'));
    if (
      parsed?.schemaVersion !== 1 ||
      !IDENTITIES.has(parsed?.identity) ||
      parsed?.portfolioId !== PORTFOLIO_ID ||
      parsed?.instagramAssetId !== TARGET_INSTAGRAM_ASSET_ID
    ) {
      throw new SafeAuditError('profile-binding-invalid');
    }
    return parsed;
  } catch (error) {
    if (error instanceof SafeAuditError) throw error;
    throw new SafeAuditError('profile-binding-invalid');
  }
}

function bindProfileToIdentity(profileDir, identity) {
  fs.mkdirSync(profileDir, { recursive: true });
  const bindingFile = path.join(profileDir, PROFILE_BINDING_FILE);
  let binding;

  if (fs.existsSync(bindingFile)) {
    binding = readProfileBinding(bindingFile);
  } else {
    const newBinding = {
      schemaVersion: 1,
      identity,
      portfolioId: PORTFOLIO_ID,
      instagramAssetId: TARGET_INSTAGRAM_ASSET_ID,
    };
    try {
      fs.writeFileSync(bindingFile, `${JSON.stringify(newBinding)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
      binding = newBinding;
    } catch (error) {
      if (error?.code !== 'EEXIST') {
        throw new SafeAuditError('profile-binding-failed');
      }
      binding = readProfileBinding(bindingFile);
    }
  }

  if (binding.identity !== identity) {
    throw new SafeAuditError('profile-identity-mismatch');
  }
}

function buildBusinessUrl(pathname) {
  const url = new URL(pathname, META_BUSINESS_ORIGIN);
  url.searchParams.set('business_id', PORTFOLIO_ID);
  url.searchParams.set('asset_id', TARGET_INSTAGRAM_ASSET_ID);
  return url.toString();
}

function pageCategory(page) {
  try {
    const current = new URL(page.url());
    if (/login|checkpoint|recover|two_step_verification/iu.test(current.pathname)) {
      return 'authentication';
    }
    if (current.origin !== META_BUSINESS_ORIGIN) {
      return current.hostname.endsWith('.facebook.com')
        ? 'facebook'
        : 'non-meta-host';
    }
    if (/^\/latest\/home\/?$/iu.test(current.pathname)) {
      return 'meta-business-home';
    }
    if (SAFE_CONTENT_PATHS.some((item) =>
      current.pathname.replace(/\/$/u, '') === item)) {
      return 'meta-business-content';
    }
    return 'meta-business-other';
  } catch {
    return 'unparseable-url';
  }
}

function currentUrlSignals(page) {
  try {
    const current = new URL(page.url());
    const businessId = current.searchParams.get('business_id');
    const assetIds = [
      current.searchParams.get('asset_id'),
      current.searchParams.get('profile_id'),
      current.searchParams.get('instagram_account_id'),
    ].filter(Boolean);
    return {
      metaBusinessOrigin: current.origin === META_BUSINESS_ORIGIN,
      contentPath: SAFE_CONTENT_PATHS.some((item) =>
        current.pathname.replace(/\/$/u, '') === item),
      targetPortfolioInUrl: businessId === PORTFOLIO_ID,
      differentPortfolioInUrl: Boolean(businessId && businessId !== PORTFOLIO_ID),
      targetAssetInUrl: assetIds.includes(TARGET_INSTAGRAM_ASSET_ID),
      differentAssetInUrl: assetIds.some((value) =>
        value !== TARGET_INSTAGRAM_ASSET_ID),
    };
  } catch {
    return {
      metaBusinessOrigin: false,
      contentPath: false,
      targetPortfolioInUrl: false,
      differentPortfolioInUrl: false,
      targetAssetInUrl: false,
      differentAssetInUrl: false,
    };
  }
}

async function inspectSafePageSignals(page) {
  const urlSignals = currentUrlSignals(page);
  const domSignals = await page.evaluate((expected) => {
    const bodyText = String(document.body?.innerText || '');
    const normalized = bodyText.replace(/\s+/gu, ' ').trim();
    const lower = normalized.toLocaleLowerCase();
    return {
      businessShellVisible: Boolean(
        document.querySelector('nav, aside, [role="navigation"]'),
      ),
      loginFormVisible: Boolean(
        document.querySelector('input[type="password"], input[name="email"]'),
      ),
      targetPortfolioIdVisible: normalized.includes(expected.portfolioId),
      targetAssetIdVisible: normalized.includes(expected.assetId),
      targetHandleVisible:
        lower.includes(`@${expected.handle}`) || lower.includes(expected.handle),
      accessDeniedSignal:
        /you don.?t have permission|you don.?t have access|permission denied|無權限|沒有權限|無法存取/iu.test(
          normalized,
        ),
      selectedAssetUnavailableSignal:
        /selected (?:instagram )?(?:profile|account).{0,100}(?:can.?t|cannot|unable to).{0,50}use (?:this|that) tool|先前選定的 Instagram 個人檔案無法使用該工具|選定的 Instagram 帳號.{0,80}無法使用.{0,30}工具/iu.test(
          normalized,
        ),
      contentUnavailableSignal:
        /content isn.?t available|content is not available|sorry.{0,80}(?:can.?t|cannot|unable to) (?:view|see) this content|很抱歉.{0,80}無法查看此內容|此內容目前無法使用/iu.test(
          normalized,
        ),
      temporaryErrorSignal:
        /something went wrong|try again later|發生錯誤|稍後再試/iu.test(normalized),
      contentSurfaceSignal:
        /posts and reels|posts & reels|posts and stories|貼文和 reels|貼文與 reels|貼文和限時動態|內容資料庫|content library/iu.test(
          normalized,
        ),
    };
  }, {
    portfolioId: PORTFOLIO_ID,
    assetId: TARGET_INSTAGRAM_ASSET_ID,
    handle: TARGET_INSTAGRAM_HANDLE,
  }).catch(() => ({
    businessShellVisible: false,
    loginFormVisible: false,
    targetPortfolioIdVisible: false,
    targetAssetIdVisible: false,
    targetHandleVisible: false,
    accessDeniedSignal: false,
    selectedAssetUnavailableSignal: false,
    contentUnavailableSignal: false,
    temporaryErrorSignal: false,
    contentSurfaceSignal: false,
  }));

  const targetPortfolioSignal = Boolean(
    urlSignals.targetPortfolioInUrl || domSignals.targetPortfolioIdVisible,
  );
  const targetAssetSignal = Boolean(
    urlSignals.targetAssetInUrl ||
      domSignals.targetAssetIdVisible ||
      domSignals.targetHandleVisible,
  );

  return {
    pageCategory: pageCategory(page),
    businessShellVisible: domSignals.businessShellVisible,
    loginFormVisible: domSignals.loginFormVisible,
    targetPortfolioSignal,
    targetAssetSignal,
    differentPortfolioSignal: urlSignals.differentPortfolioInUrl,
    differentAssetSignal: urlSignals.differentAssetInUrl,
    accessDeniedSignal: domSignals.accessDeniedSignal,
    selectedAssetUnavailableSignal: domSignals.selectedAssetUnavailableSignal,
    contentUnavailableSignal: domSignals.contentUnavailableSignal,
    temporaryErrorSignal: domSignals.temporaryErrorSignal,
    contentSurfaceSignal: domSignals.contentSurfaceSignal,
    contentPath: urlSignals.contentPath,
    metaBusinessOrigin: urlSignals.metaBusinessOrigin,
  };
}

async function waitForLogin(context, timeoutMs) {
  const deadline = Date.now() + Math.min(timeoutMs, LOGIN_TIMEOUT_MS);
  while (Date.now() < deadline) {
    if (await hasMetaLoginSession(context)) return true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return hasMetaLoginSession(context);
}

async function navigateSafely(page, url) {
  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForTimeout(PAGE_SETTLE_MS);
    return true;
  } catch {
    return false;
  }
}

async function findHomepageContentPath(page) {
  return page.evaluate((expected) => {
    const normalize = (value) => String(value || '')
      .replace(/\s+/gu, ' ')
      .trim();
    const allowedPaths = new Set(expected.allowedPaths);
    const candidates = [...document.querySelectorAll(
      'nav a[href], aside a[href], [role="navigation"] a[href]',
    )];
    let routeOnlyCandidate = null;

    for (const candidate of candidates) {
      let url;
      try {
        url = new URL(candidate.href, window.location.href);
      } catch {
        continue;
      }
      const pathname = url.pathname.replace(/\/$/u, '');
      if (url.origin !== expected.origin || !allowedPaths.has(pathname)) continue;

      const businessId = url.searchParams.get('business_id');
      if (businessId && businessId !== expected.portfolioId) continue;
      const assetIds = [
        url.searchParams.get('asset_id'),
        url.searchParams.get('profile_id'),
        url.searchParams.get('instagram_account_id'),
      ].filter(Boolean);
      if (assetIds.some((value) => value !== expected.assetId)) continue;

      const label = normalize([
        candidate.getAttribute('aria-label'),
        candidate.getAttribute('title'),
        candidate.textContent,
      ].filter(Boolean).join(' '));
      if (/^(?:content|內容)$/iu.test(label) || /(?:^|\s)(?:content|內容)(?:\s|$)/iu.test(label)) {
        return pathname;
      }
      routeOnlyCandidate ||= pathname;
    }

    return routeOnlyCandidate;
  }, {
    origin: META_BUSINESS_ORIGIN,
    portfolioId: PORTFOLIO_ID,
    assetId: TARGET_INSTAGRAM_ASSET_ID,
    allowedPaths: SAFE_CONTENT_PATHS,
  }).catch(() => null);
}

function homepageAvailable(signals) {
  return Boolean(
    signals.metaBusinessOrigin &&
      signals.businessShellVisible &&
      signals.targetPortfolioSignal &&
      !signals.differentPortfolioSignal &&
      !signals.differentAssetSignal &&
      !signals.loginFormVisible &&
      !signals.accessDeniedSignal
  );
}

function contentAvailable(signals) {
  return Boolean(
    signals.metaBusinessOrigin &&
      signals.contentPath &&
      signals.businessShellVisible &&
      signals.targetPortfolioSignal &&
      signals.targetAssetSignal &&
      !signals.differentPortfolioSignal &&
      !signals.differentAssetSignal &&
      !signals.loginFormVisible &&
      !signals.accessDeniedSignal &&
      !signals.selectedAssetUnavailableSignal &&
      !signals.contentUnavailableSignal &&
      !signals.temporaryErrorSignal
  );
}

function contentErrorType(signals, navigationSucceeded) {
  if (!navigationSucceeded) return 'navigation-failed';
  if (signals.loginFormVisible || signals.pageCategory === 'authentication') {
    return 'authentication-required';
  }
  if (signals.differentPortfolioSignal) return 'different-portfolio-selected';
  if (signals.differentAssetSignal) return 'different-asset-selected';
  if (signals.accessDeniedSignal) return 'access-denied';
  if (signals.selectedAssetUnavailableSignal) return 'selected-asset-unavailable';
  if (signals.contentUnavailableSignal) return 'content-unavailable';
  if (signals.temporaryErrorSignal) return 'temporary-meta-error';
  if (!signals.targetPortfolioSignal) return 'target-portfolio-unconfirmed';
  if (!signals.targetAssetSignal) return 'target-asset-unconfirmed';
  if (!signals.contentPath || !signals.businessShellVisible) {
    return 'content-surface-unconfirmed';
  }
  return 'none';
}

function baseReport(options, profileKind) {
  return {
    auditType: 'meta-business-content-read-only-access',
    auditedAt: new Date().toISOString(),
    identity: options.identity,
    profileIsolation: {
      binding: 'identity-bound',
      profileKind,
      ownerAndDelegateShared: false,
    },
    targetPortfolioId: PORTFOLIO_ID,
    targetInstagramAccount: `@${TARGET_INSTAGRAM_HANDLE}`,
    targetInstagramAssetId: TARGET_INSTAGRAM_ASSET_ID,
    constraints: {
      homepageOnlyBeforeContent: true,
      individualPostsOpened: false,
      messagesOpened: false,
      messagesSent: false,
      commentsChanged: false,
      publishControlsClicked: false,
      contentChanged: false,
      permissionsChanged: false,
      credentialsPrinted: false,
      cookiesPrinted: false,
      customerDataPrinted: false,
      postTextPrinted: false,
      otherPeoplePrinted: false,
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const profile = resolveIdentityProfile(options.identity, options.profile);
  bindProfileToIdentity(profile.profileDir, options.identity);

  const homeUrl = buildBusinessUrl('/latest/home');
  const session = await openMetaBusinessSuite({
    headless: !options.visible,
    browserPath: options.browser,
    profileDir: profile.profileDir,
    targetUrl: homeUrl,
  });
  const { context, page } = session;

  try {
    let authenticated = await hasMetaLoginSession(context);
    let login = authenticated ? 'success' : 'required';
    if (!authenticated && options.waitForLogin) {
      authenticated = await waitForLogin(context, LOGIN_TIMEOUT_MS);
      login = authenticated ? 'success' : 'timeout';
    }

    const report = {
      ...baseReport(options, profile.profileKind),
      login,
      homepage: {
        checked: false,
        available: false,
        pageCategory: pageCategory(page),
        targetPortfolioSignal: false,
        targetAssetSignal: false,
        accessDeniedSignal: false,
      },
      content: {
        checked: false,
        pageAvailable: false,
        navigationSource: 'not-checked',
        route: 'not-checked',
        pageCategory: 'not-checked',
        targetPortfolioSignal: false,
        targetAssetSignal: false,
        contentSurfaceSignal: false,
        accessDeniedSignal: false,
        selectedAssetUnavailableSignal: false,
        contentUnavailableSignal: false,
        errorType: authenticated ? 'not-checked' : `login-${login}`,
      },
      errorType: authenticated ? 'none' : `login-${login}`,
    };

    if (!authenticated) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      process.exitCode = 2;
      return;
    }

    const homeNavigationSucceeded = await navigateSafely(page, homeUrl);
    const homeSignals = await inspectSafePageSignals(page);
    report.homepage = {
      checked: true,
      available: homeNavigationSucceeded && homepageAvailable(homeSignals),
      pageCategory: homeSignals.pageCategory,
      targetPortfolioSignal: homeSignals.targetPortfolioSignal,
      targetAssetSignal: homeSignals.targetAssetSignal,
      accessDeniedSignal: homeSignals.accessDeniedSignal,
    };

    if (!homeNavigationSucceeded) {
      report.errorType = 'homepage-navigation-failed';
      report.content.errorType = 'homepage-navigation-failed';
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      process.exitCode = 2;
      return;
    }

    const homepagePath = await findHomepageContentPath(page);
    const routes = homepagePath
      ? [homepagePath]
      : [...SAFE_CONTENT_PATHS];
    let finalSignals = null;
    let finalRoute = null;
    let finalNavigationSucceeded = false;

    for (const route of routes) {
      const navigationSucceeded = await navigateSafely(
        page,
        buildBusinessUrl(route),
      );
      const signals = await inspectSafePageSignals(page);
      finalSignals = signals;
      finalRoute = route;
      finalNavigationSucceeded = navigationSucceeded;
      if (contentAvailable(signals)) break;
    }

    const routeName = finalRoute === '/latest/posts_and_stories'
      ? 'posts_and_stories'
      : finalRoute === '/latest/content'
        ? 'content'
        : 'unknown';
    const contentIsAvailable = Boolean(
      finalSignals &&
        finalNavigationSucceeded &&
        contentAvailable(finalSignals),
    );
    const contentError = finalSignals
      ? contentErrorType(finalSignals, finalNavigationSucceeded)
      : 'content-navigation-not-attempted';
    report.content = {
      checked: true,
      pageAvailable: contentIsAvailable,
      navigationSource: homepagePath
        ? 'homepage-navigation'
        : 'fixed-safe-route',
      route: routeName,
      pageCategory: finalSignals?.pageCategory || 'unparseable-url',
      targetPortfolioSignal: Boolean(finalSignals?.targetPortfolioSignal),
      targetAssetSignal: Boolean(finalSignals?.targetAssetSignal),
      contentSurfaceSignal: Boolean(finalSignals?.contentSurfaceSignal),
      accessDeniedSignal: Boolean(finalSignals?.accessDeniedSignal),
      selectedAssetUnavailableSignal: Boolean(
        finalSignals?.selectedAssetUnavailableSignal,
      ),
      contentUnavailableSignal: Boolean(finalSignals?.contentUnavailableSignal),
      errorType: contentError,
    };
    report.errorType = contentIsAvailable ? 'none' : contentError;

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!contentIsAvailable) process.exitCode = 2;
  } finally {
    await context.close().catch(() => null);
  }
}

main().catch((error) => {
  const errorType = error instanceof SafeAuditError
    ? error.errorType
    : 'audit-runtime-failed';
  process.stderr.write(`${JSON.stringify({
    auditType: 'meta-business-content-read-only-access',
    status: 'failed-before-safe-content-check',
    errorType,
    constraints: {
      credentialsPrinted: false,
      cookiesPrinted: false,
      customerDataPrinted: false,
      postTextPrinted: false,
      otherPeoplePrinted: false,
    },
  }, null, 2)}\n`);
  process.exitCode = 1;
});
