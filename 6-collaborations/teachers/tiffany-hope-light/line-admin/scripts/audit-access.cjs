const fs = require('node:fs');
const path = require('node:path');
const {
  openLineOfficialAccountManager,
  waitForAuthenticatedAccountPage,
} = require('../lib/line-oa-session.cjs');

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function emitResult(result, error = false) {
  const serialized = JSON.stringify(result, null, 2);
  const outputFile = argumentValue('--output');
  if (outputFile) {
    fs.writeFileSync(path.resolve(outputFile), `${serialized}\n`, 'utf8');
  }
  (error ? console.error : console.log)(serialized);
}

async function main() {
  const session = await openLineOfficialAccountManager({
    headless: !process.argv.includes('--visible'),
    browserPath: argumentValue('--browser'),
    profileDir: argumentValue('--profile'),
  });
  const { context, page } = session;
  try {
    if (!(await waitForAuthenticatedAccountPage(page))) {
      const current = new URL(page.url());
      const safeState = await page.evaluate(() => ({
        title: String(document.title || '').replace(/\s+/gu, ' ').trim(),
        headings: [...document.querySelectorAll('h1, h2, [role="heading"]')]
          .map((element) => String(element.textContent || '').replace(/\s+/gu, ' ').trim())
          .filter(Boolean)
          .slice(0, 10),
      })).catch(() => ({ title: '', headings: [] }));
      emitResult({
        ok: false,
        needsLogin: true,
        checkedAt: new Date().toISOString(),
        currentPage: `${current.origin}${current.pathname}`,
        documentTitle: safeState.title,
        headings: safeState.headings,
        message: 'Run npm run login and complete LINE authentication in the opened browser.',
      }, true);
      process.exitCode = 1;
      return;
    }

    await page.waitForTimeout(1500);
    const safeUi = await page.evaluate(() => {
      const normalize = (value) => String(value || '')
        .replace(/\s+/gu, ' ')
        .trim();
      const collect = (selector) => [...document.querySelectorAll(selector)]
        .map((element) => normalize(element.textContent))
        .filter((value) => value && value.length <= 50);
      return {
        documentTitle: normalize(document.title),
        headings: collect('h1, h2, [role="heading"]').slice(0, 20),
        navigationLabels: collect(
          'nav a, aside a, [role="navigation"] a, [class*="SideMenu"] a',
        ).slice(0, 80),
      };
    });

    emitResult({
      ok: true,
      checkedAt: new Date().toISOString(),
      loginMode: 'cached-session',
      accountUrl: session.accountUrl,
      browser: path.basename(session.browserPath),
      documentTitle: safeUi.documentTitle,
      headings: [...new Set(safeUi.headings)],
      navigationLabels: [...new Set(safeUi.navigationLabels)],
      chatContentRead: false,
    });
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  emitResult({
    ok: false,
    error: String(error.message || error)
      .replace(/\s+/gu, ' ')
      .trim()
      .slice(0, 800),
  }, true);
  process.exitCode = 1;
});
