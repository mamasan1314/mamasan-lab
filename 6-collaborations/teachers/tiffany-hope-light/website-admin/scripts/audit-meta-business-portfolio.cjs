#!/usr/bin/env node

const path = require('node:path');
const {
  META_BUSINESS_ORIGIN,
  hasMetaLoginSession,
  openMetaBusinessSuite,
  safeCurrentPage,
} = require('../lib/meta-business-session.cjs');

const PORTFOLIO_ID = '889448907217740';
const PORTFOLIO_NAME = '珈語老師';
const TARGET_INSTAGRAM_HANDLE = 'hopelight.ig';
const TARGET_INSTAGRAM_ASSET_ID = '17841480182265940';
const SELF_NAMES = ['大倫 黃', '黃大倫'];

const URLS = {
  businessInfo:
    `${META_BUSINESS_ORIGIN}/latest/settings/business_info?business_id=${PORTFOLIO_ID}`,
  people:
    `${META_BUSINESS_ORIGIN}/latest/settings/business_users?business_id=${PORTFOLIO_ID}`,
  instagramAccounts:
    `${META_BUSINESS_ORIGIN}/latest/settings/instagram_account?business_id=${PORTFOLIO_ID}`,
};

function optionValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function loadPage(page, url) {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await page.waitForTimeout(4500);
}

async function inspectPage(page, kind) {
  const current = new URL(page.url());
  const signals = await page.evaluate((expected) => {
    const normalize = (value) => String(value || '')
      .replace(/\s+/gu, ' ')
      .trim();
    const bodyText = normalize(document.body?.innerText || '');
    const lower = bodyText.toLocaleLowerCase();
    const navigationText = [...document.querySelectorAll(
      'nav a, aside a, [role="navigation"] a, [role="navigation"] button',
    )]
      .map((element) => `${normalize(element.textContent)} ${element.getAttribute('href') || ''}`)
      .join(' ');

    const isSelfNameText = (text) =>
      expected.selfNames.some((name) => text === name || text.startsWith(name));
    const isSelfText = (text) =>
      isSelfNameText(text) ||
      /(?:\(|（)\s*(?:you|你)\s*(?:\)|）)/iu.test(text) ||
      /^(?:you|你)$/iu.test(text);
    const visibleElements = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const text = normalize(element.textContent);
        if (!text || text.length > 200 || !isSelfText(text)) return false;
        const style = window.getComputedStyle(element);
        return style.visibility !== 'hidden' && style.display !== 'none';
      })
      .sort((left, right) =>
        Number(isSelfNameText(normalize(right.textContent))) -
          Number(isSelfNameText(normalize(left.textContent))) ||
        normalize(left.textContent).length - normalize(right.textContent).length,
      );
    const selfElement = visibleElements[0] || null;
    let selfContext = '';
    if (selfElement) {
      let candidate = selfElement;
      for (let index = 0; index < 6 && candidate; index += 1) {
        const candidateText = normalize(candidate.textContent);
        if (
          candidateText.length >= normalize(selfElement.textContent).length &&
          candidateText.length <= 600
        ) {
          selfContext = candidateText;
        }
        if (
          candidate.matches?.('tr, [role="row"], li, [role="listitem"]') &&
          candidateText.length <= 600
        ) {
          selfContext = candidateText;
          break;
        }
        candidate = candidate.parentElement;
      }
    }

    let targetAssociatedWithSelf = false;
    if (selfElement) {
      let candidate = selfElement;
      for (let index = 0; index < 8 && candidate; index += 1) {
        const candidateText = normalize(candidate.textContent).toLocaleLowerCase();
        if (
          candidateText.length <= 1500 &&
          candidateText.includes(expected.instagramHandle.toLocaleLowerCase())
        ) {
          targetAssociatedWithSelf = true;
          break;
        }
        candidate = candidate.parentElement;
      }
    }

    const accessDeniedSignal =
      /you don.?t have permission|you don.?t have access|content isn.?t available|無權限|沒有權限|無法存取|內容無法使用/iu.test(
        bodyText,
      );
    const fullControlSignal =
      /full control|full access|完整管理權限|完整存取權限|完整控制權|完全控制權/iu.test(selfContext);
    const partialAccessSignal =
      /partial access|limited access|部分管理權限|部分權限|部分存取|有限權限/iu.test(selfContext);

    return {
      portfolioNameVisible: bodyText.includes(expected.portfolioName),
      portfolioIdVisible: bodyText.includes(expected.portfolioId),
      targetInstagramVisible: lower.includes(expected.instagramHandle.toLocaleLowerCase()),
      targetInstagramAssetIdVisible: bodyText.includes(expected.instagramAssetId),
      businessShellVisible: Boolean(
        document.querySelector('nav, aside, [role="navigation"]'),
      ),
      loginFormVisible: Boolean(
        document.querySelector('input[type="password"], input[name="email"]'),
      ),
      accessDeniedSignal,
      ownPersonVisible: Boolean(selfElement),
      targetInstagramAssociatedWithSelf: targetAssociatedWithSelf,
      ownFullControlSignal: fullControlSignal,
      ownPartialAccessSignal: partialAccessSignal,
      navigation: {
        people: /business_users|\/people|人員|people/iu.test(navigationText),
        businessAssets: /business_assets|商家資產|business assets/iu.test(navigationText),
        instagramAccounts: /instagram_account|instagram accounts|instagram 帳號/iu.test(navigationText),
        businessInfo: /business_info|商家資訊|business info/iu.test(navigationText),
        security: /security|安全中心|安全性/iu.test(navigationText),
      },
      primaryPageNoneSignal:
        /(?:主要粉絲專頁|primary page).{0,100}(?:無|none|not set)/iu.test(bodyText),
      noAssignedInstagramAccountsSignal:
        /沒有已指派的 Instagram 帳號|no assigned Instagram accounts|no Instagram accounts (?:have been )?assigned/iu.test(
          bodyText,
        ),
      partialPortfolioWarningSignal:
        /只擁有商家資產管理組合的部分管理權限|partial (?:management |administrative )?(?:access|permission).{0,100}business portfolio/iu.test(
          bodyText,
        ),
    };
  }, {
    portfolioId: PORTFOLIO_ID,
    portfolioName: PORTFOLIO_NAME,
    instagramHandle: TARGET_INSTAGRAM_HANDLE,
    instagramAssetId: TARGET_INSTAGRAM_ASSET_ID,
    selfNames: SELF_NAMES,
  }).catch(() => ({
    portfolioNameVisible: false,
    portfolioIdVisible: false,
    targetInstagramVisible: false,
    targetInstagramAssetIdVisible: false,
    businessShellVisible: false,
    loginFormVisible: false,
    accessDeniedSignal: false,
    ownPersonVisible: false,
    targetInstagramAssociatedWithSelf: false,
    ownFullControlSignal: false,
    ownPartialAccessSignal: false,
    navigation: {
      people: false,
      businessAssets: false,
      instagramAccounts: false,
      businessInfo: false,
      security: false,
    },
    primaryPageNoneSignal: false,
    noAssignedInstagramAccountsSignal: false,
    partialPortfolioWarningSignal: false,
  }));

  const requestedBusinessId = current.searchParams.get('business_id');
  return {
    kind,
    currentPage: safeCurrentPage(page),
    requestedPortfolioRetained: requestedBusinessId === PORTFOLIO_ID,
    redirectedToDifferentPortfolio: Boolean(
      requestedBusinessId && requestedBusinessId !== PORTFOLIO_ID,
    ),
    ...signals,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const session = await openMetaBusinessSuite({
    headless: !args.includes('--visible'),
    browserPath: optionValue(args, '--browser'),
    profileDir: optionValue(args, '--profile'),
    targetUrl: URLS.businessInfo,
  });
  const { context, page } = session;

  try {
    const authenticated = await hasMetaLoginSession(context);
    const pages = {};
    if (authenticated) {
      await loadPage(page, URLS.businessInfo);
      pages.businessInfo = await inspectPage(page, 'business-info');

      await loadPage(page, URLS.instagramAccounts);
      pages.instagramAccounts = await inspectPage(page, 'instagram-accounts');

      await loadPage(page, URLS.people);
      pages.people = await inspectPage(page, 'people');
    }

    const portfolioVisible = Boolean(
      authenticated &&
      pages.businessInfo?.portfolioNameVisible &&
      pages.businessInfo?.portfolioIdVisible &&
      pages.businessInfo?.businessShellVisible &&
      !pages.businessInfo?.loginFormVisible &&
      !pages.businessInfo?.accessDeniedSignal &&
      !pages.businessInfo?.redirectedToDifferentPortfolio,
    );
    const instagramAssetVisible = Boolean(
      portfolioVisible &&
      pages.instagramAccounts?.targetInstagramVisible &&
      pages.instagramAccounts?.targetInstagramAssetIdVisible &&
      !pages.instagramAccounts?.accessDeniedSignal &&
      !pages.instagramAccounts?.redirectedToDifferentPortfolio,
    );

    let permissionScope = 'not-visible';
    if (portfolioVisible) permissionScope = 'visible-scope-unconfirmed';
    if (
      (pages.people?.ownPersonVisible && pages.people?.ownPartialAccessSignal) ||
      pages.instagramAccounts?.partialPortfolioWarningSignal
    ) {
      permissionScope = 'partial-access-signal';
    }
    if (pages.people?.ownPersonVisible && pages.people?.ownFullControlSignal) {
      permissionScope = 'full-control-signal';
    }

    const report = {
      auditType: 'meta-business-portfolio-read-only-access',
      auditedAt: new Date().toISOString(),
      login: authenticated ? 'success' : 'required',
      targetPortfolio: PORTFOLIO_NAME,
      targetPortfolioId: PORTFOLIO_ID,
      targetInstagramAccount: TARGET_INSTAGRAM_HANDLE,
      targetInstagramAssetId: TARGET_INSTAGRAM_ASSET_ID,
      portfolioVisible,
      instagramAssetVisible,
      permissionScope,
      instagramAssetPermissionScope:
        !instagramAssetVisible
          ? 'not-visible'
          : pages.instagramAccounts?.ownFullControlSignal
            ? 'full-control-signal'
            : pages.instagramAccounts?.ownPartialAccessSignal
              ? 'partial-access-signal'
              : 'visible-scope-unconfirmed',
      instagramAssignmentStatus:
        pages.instagramAccounts?.noAssignedInstagramAccountsSignal
          ? 'none-assigned'
          : instagramAssetVisible
            ? 'target-visible'
            : 'unknown',
      primaryPageNoneSignal: Boolean(pages.businessInfo?.primaryPageNoneSignal),
      signals: {
        businessInfo: pages.businessInfo || null,
        instagramAccounts: pages.instagramAccounts || null,
        people: pages.people || null,
      },
      browser: path.basename(session.browserPath),
      constraints: {
        messagesOpened: false,
        messagesSent: false,
        contentChanged: false,
        permissionsChanged: false,
        otherPeoplePrinted: false,
        otherAssetsPrinted: false,
        credentialsPrinted: false,
      },
    };

    console.log(JSON.stringify(report, null, 2));
    if (!authenticated || !portfolioVisible) process.exitCode = 2;
  } finally {
    await context.close().catch(() => null);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    auditType: 'meta-business-portfolio-read-only-access',
    status: 'failed-before-portfolio-check',
    targetPortfolio: PORTFOLIO_NAME,
    targetPortfolioId: PORTFOLIO_ID,
    errorType: error && error.name ? String(error.name) : 'Error',
  }, null, 2));
  process.exitCode = 1;
});
