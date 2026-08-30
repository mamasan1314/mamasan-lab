#!/usr/bin/env node

const path = require('node:path');
const {
  TARGET_INSTAGRAM_ASSET_ID,
  TARGET_INSTAGRAM_HANDLE,
  hasMetaLoginSession,
  inspectTargetAssetPage,
  openMetaBusinessSuite,
  safeCurrentPage,
  waitForTargetAssetAccess,
} = require('../lib/meta-business-session.cjs');

const LOGIN_TIMEOUT_MS = 15 * 60 * 1000;

async function main() {
  const session = await openMetaBusinessSuite({ headless: false });
  const { context } = session;

  try {
    if (!session.authenticated) {
      console.log(
        'Meta login is required. Complete Facebook/Meta login and any security verification only in the opened browser window.',
      );
    }

    const target = await waitForTargetAssetAccess(context, {
      targetUrl: session.targetUrl,
      timeoutMs: LOGIN_TIMEOUT_MS,
    });

    if (!target) {
      const authenticated = await hasMetaLoginSession(context);
      const page = context.pages()[0] || session.page;
      const state = await inspectTargetAssetPage(page, context);
      console.log(JSON.stringify({
        ok: false,
        authenticated,
        targetAccount: `@${TARGET_INSTAGRAM_HANDLE}`,
        targetAssetId: TARGET_INSTAGRAM_ASSET_ID,
        targetAccessible: false,
        currentPage: safeCurrentPage(page),
        pageCategory: state.pageCategory,
        accessDeniedSignal: state.accessDeniedSignal,
        sessionStoredLocally: authenticated,
        message: authenticated
          ? 'Meta login succeeded, but access to the target Instagram asset was not confirmed.'
          : 'Meta login was not completed within 15 minutes.',
      }, null, 2));
      process.exitCode = 2;
      return;
    }

    console.log(JSON.stringify({
      ok: true,
      connectedAt: new Date().toISOString(),
      targetAccount: `@${TARGET_INSTAGRAM_HANDLE}`,
      targetAssetId: TARGET_INSTAGRAM_ASSET_ID,
      targetAccessible: true,
      pageCategory: target.state.pageCategory,
      browser: path.basename(session.browserPath),
      sessionStoredLocally: true,
      otherInstagramAccountsInspected: false,
      messagesOpened: false,
      settingsChanged: false,
    }, null, 2));
  } finally {
    await context.close().catch(() => null);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    targetAccount: `@${TARGET_INSTAGRAM_HANDLE}`,
    targetAssetId: TARGET_INSTAGRAM_ASSET_ID,
    errorType: error && error.name ? String(error.name) : 'Error',
  }, null, 2));
  process.exitCode = 1;
});
