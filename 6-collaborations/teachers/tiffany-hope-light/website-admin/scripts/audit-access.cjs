const fs = require('node:fs');
const path = require('node:path');
const { openHopeBoxAdmin } = require('../lib/hopebox-session.cjs');

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
  const session = await openHopeBoxAdmin({
    headless: !process.argv.includes('--visible'),
    credentialFile: argumentValue('--credential'),
    browserPath: argumentValue('--browser'),
    profileDir: argumentValue('--profile'),
  });

  const { context, page, siteRoot } = session;
  try {
    const dashboardMenus = (await page
      .locator('#adminmenu .wp-menu-name')
      .allInnerTexts())
      .map((name) => name.replace(/\s+/gu, ' ').trim())
      .filter(Boolean);

    const pagesResponse = await page.goto(
      `${siteRoot}/wp-admin/edit.php?post_type=page`,
      { waitUntil: 'domcontentloaded', timeout: 30000 },
    );
    const pagesAccessible = Boolean(pagesResponse && pagesResponse.ok());
    const pageCountOnScreen = await page
      .locator('.wp-list-table tbody tr:not(.no-items)')
      .count();
    const bulkPages =
      (await page.locator('#bulk-action-selector-top').count()) > 0;
    const firstEditHref = await page
      .locator('.wp-list-table a.row-title')
      .first()
      .getAttribute('href')
      .catch(() => null);

    let pageEditorLoaded = false;
    if (firstEditHref) {
      const editResponse = await page.goto(
        new URL(firstEditHref, siteRoot).href,
        { waitUntil: 'domcontentloaded', timeout: 30000 },
      );
      await page
        .locator('#post, .block-editor, .edit-post-layout, #editor')
        .first()
        .waitFor({ state: 'attached', timeout: 10000 })
        .catch(() => null);
      pageEditorLoaded =
        Boolean(editResponse && editResponse.ok()) &&
        new URL(page.url()).pathname === '/wp-admin/post.php' &&
        (await page
          .locator('#post, .block-editor, .edit-post-layout, #editor')
          .count()) > 0;
    }

    const productResponse = await page.goto(
      `${siteRoot}/wp-admin/edit.php?post_type=product`,
      { waitUntil: 'domcontentloaded', timeout: 30000 },
    );
    const productsAccessible =
      Boolean(productResponse && productResponse.ok()) &&
      new URL(page.url()).pathname === '/wp-admin/edit.php' &&
      (await page.locator('body.post-type-product').count()) > 0;
    const productCountOnScreen = productsAccessible
      ? await page.locator('.wp-list-table tbody tr:not(.no-items)').count()
      : 0;
    const bulkProducts =
      productsAccessible &&
      (await page.locator('#bulk-action-selector-top').count()) > 0;

    emitResult({
      ok: true,
      checkedAt: new Date().toISOString(),
      loginMode: session.loginMode,
      challengesSolved: session.challengesSolved,
      browser: path.basename(session.browserPath),
      dashboardMenus,
      pages: {
        accessible: pagesAccessible,
        countOnScreen: pageCountOnScreen,
        bulkActionsAvailable: bulkPages,
        editorLoaded: pageEditorLoaded,
      },
      products: {
        accessible: productsAccessible,
        countOnScreen: productCountOnScreen,
        bulkActionsAvailable: bulkProducts,
      },
    });
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  emitResult(
    {
      ok: false,
      error: String(error.message || error)
        .replace(/\s+/gu, ' ')
        .trim()
        .slice(0, 800),
    },
    true,
  );
  process.exitCode = 1;
});
