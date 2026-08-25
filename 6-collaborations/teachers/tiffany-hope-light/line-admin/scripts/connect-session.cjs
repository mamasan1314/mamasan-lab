const path = require('node:path');
const {
  DEFAULT_ACCOUNT_URL,
  isAuthenticatedAccountPage,
  openLineOfficialAccountManager,
} = require('../lib/line-oa-session.cjs');

const LOGIN_TIMEOUT_MS = 15 * 60 * 1000;

async function findAuthenticatedPage(context) {
  for (const candidate of context.pages()) {
    if (await isAuthenticatedAccountPage(candidate)) return candidate;
  }
  return null;
}

async function main() {
  const session = await openLineOfficialAccountManager({ headless: false });
  const { context } = session;
  try {
    if (!session.authenticated) {
      console.log(
        'LINE Official Account Manager login is required. Complete login and any phone verification in the opened browser window.',
      );
    }

    const deadline = Date.now() + LOGIN_TIMEOUT_MS;
    let authenticatedPage = session.authenticated ? session.page : null;
    while (!authenticatedPage && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      authenticatedPage = await findAuthenticatedPage(context);
    }

    if (!authenticatedPage) {
      throw new Error('Login was not completed within 15 minutes. Run npm run login to try again.');
    }

    if (authenticatedPage.url() !== DEFAULT_ACCOUNT_URL) {
      await authenticatedPage.goto(DEFAULT_ACCOUNT_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
    }
    await authenticatedPage.waitForTimeout(1500);
    if (!(await isAuthenticatedAccountPage(authenticatedPage))) {
      throw new Error('The browser is signed in, but the target LINE official account was not accessible.');
    }

    console.log(JSON.stringify({
      ok: true,
      connectedAt: new Date().toISOString(),
      accountUrl: DEFAULT_ACCOUNT_URL,
      browser: path.basename(session.browserPath),
      sessionStoredLocally: true,
    }, null, 2));
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: String(error.message || error).replace(/\s+/gu, ' ').trim(),
  }, null, 2));
  process.exitCode = 1;
});

