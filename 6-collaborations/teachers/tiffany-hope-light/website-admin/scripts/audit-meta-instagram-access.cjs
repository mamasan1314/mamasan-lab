#!/usr/bin/env node

const path = require('node:path');
const {
  DEFAULT_TARGET_URL,
  TARGET_BUSINESS_PORTFOLIO_ID,
  TARGET_INSTAGRAM_ASSET_ID,
  TARGET_INSTAGRAM_HANDLE,
  hasMetaLoginSession,
  inspectTargetAssetPage,
  openMetaBusinessSuite,
  safeCurrentPage,
  waitForTargetAssetAccess,
} = require('../lib/meta-business-session.cjs');

async function discoverTargetPortfolioId(page) {
  return page.evaluate((handle) => {
    const normalize = (value) => String(value || '')
      .replace(/\s+/gu, ' ')
      .trim();
    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    };
    const candidates = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const text = normalize(element.textContent).toLocaleLowerCase();
        return (
          text.includes(handle.toLocaleLowerCase()) &&
          text.length <= 1200 &&
          isVisible(element)
        );
      })
      .sort((left, right) =>
        normalize(left.textContent).length - normalize(right.textContent).length,
      );

    for (const candidate of candidates) {
      let container = candidate;
      for (let depth = 0; depth < 8 && container; depth += 1) {
        const links = [
          ...(container.matches?.('a[href]') ? [container] : []),
          ...container.querySelectorAll('a[href]'),
        ];
        const ids = new Set();
        for (const link of links) {
          try {
            const url = new URL(link.href, window.location.href);
            const businessId = url.searchParams.get('business_id');
            if (/^\d+$/u.test(businessId || '')) ids.add(businessId);
          } catch {
            // Ignore malformed or non-URL controls.
          }
        }
        if (ids.size === 1) return [...ids][0];
        container = container.parentElement;
      }
    }
    return null;
  }, TARGET_INSTAGRAM_HANDLE).catch(() => null);
}

function optionValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const visible = args.includes('--visible');
  const session = await openMetaBusinessSuite({
    headless: !visible,
    browserPath: optionValue(args, '--browser'),
    profileDir: optionValue(args, '--profile'),
  });
  const { context } = session;

  try {
    let target = await waitForTargetAssetAccess(context, {
      targetUrl: session.targetUrl,
      timeoutMs: 10000,
    });
    let targetPortfolioId = TARGET_BUSINESS_PORTFOLIO_ID;
    let page = target?.page || context.pages()[0] || session.page;
    if (!target && /\/select\/?$/iu.test(new URL(page.url()).pathname)) {
      targetPortfolioId = await discoverTargetPortfolioId(page);
      if (targetPortfolioId) {
        const targetUrl = new URL(DEFAULT_TARGET_URL);
        targetUrl.searchParams.set('business_id', targetPortfolioId);
        await page.goto(targetUrl.toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 45000,
        });
        target = await waitForTargetAssetAccess(context, {
          targetUrl: targetUrl.toString(),
          timeoutMs: 15000,
        });
        page = target?.page || page;
      }
    }
    const state = target?.state || await inspectTargetAssetPage(page, context);
    const report = {
      auditType: 'meta-business-instagram-read-only-access',
      auditedAt: new Date().toISOString(),
      targetAccount: `@${TARGET_INSTAGRAM_HANDLE}`,
      targetAssetId: TARGET_INSTAGRAM_ASSET_ID,
      targetPortfolioId,
      login: (await hasMetaLoginSession(context)) ? 'success' : 'required',
      targetAccessible: state.targetAccessible,
      currentPage: safeCurrentPage(page),
      pageCategory: state.pageCategory,
      targetHandleVisible: state.targetHandleVisible,
      targetAssetIdVisible: state.targetAssetIdVisible,
      businessShellVisible: state.businessShellVisible,
      accessDeniedSignal: state.accessDeniedSignal,
      browser: path.basename(session.browserPath),
      constraints: {
        otherInstagramAccountsInspected: false,
        messagesOpened: false,
        messagesSent: false,
        commentsChanged: false,
        settingsChanged: false,
        credentialsPrinted: false,
      },
    };

    console.log(JSON.stringify(report, null, 2));
    if (report.login !== 'success' || !report.targetAccessible) {
      process.exitCode = 2;
    }
  } finally {
    await context.close().catch(() => null);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    auditType: 'meta-business-instagram-read-only-access',
    status: 'failed-before-target-check',
    targetAccount: `@${TARGET_INSTAGRAM_HANDLE}`,
    targetAssetId: TARGET_INSTAGRAM_ASSET_ID,
    errorType: error && error.name ? String(error.name) : 'Error',
  }, null, 2));
  process.exitCode = 1;
});
