// 從 HopeBox 停用並刪除希望之光 CRM 外掛（含安裝失敗留下的重複副本）。
// 只會處理路徑含 hopelight-crm 的項目，不會碰其他 hopelight-* 外掛。
// 預設是預演模式，加 --apply 才會真的刪除。
const { openHopeBoxAdmin } = require('../lib/hopebox-session.cjs');

const PLUGIN_SLUG = 'hopelight-crm-board';

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function emitResult(result, error = false) {
  const serialized = JSON.stringify(result, null, 2);
  (error ? console.error : console.log)(serialized);
}

async function listTargets(page, siteRoot) {
  await page.goto(`${siteRoot}/wp-admin/plugins.php`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  return page.evaluate(
    (slug) =>
      Array.from(document.querySelectorAll('a[href*="plugins.php?action="]'))
        .map((anchor) => ({
          text: anchor.textContent.trim(),
          href: anchor.getAttribute('href'),
        }))
        // 只比對 plugin= 或 checked[0]= 參數裡的外掛代稱，避免誤傷其他 hopelight-* 外掛。
        .filter((entry) =>
          new RegExp(`(?:plugin|checked%5B0%5D)=[^&]*${slug}`, 'u').test(entry.href),
        ),
    PLUGIN_SLUG,
  );
}

async function main() {
  const apply = process.argv.includes('--apply');
  const session = await openHopeBoxAdmin({
    headless: !process.argv.includes('--visible'),
    credentialFile: argumentValue('--credential'),
    browserPath: argumentValue('--browser'),
    profileDir: argumentValue('--profile'),
  });

  const { context, page, siteRoot } = session;
  const steps = [];
  try {
    const before = await listTargets(page, siteRoot);
    const deletable = before.filter((entry) => entry.href.includes('delete-selected'));
    const active = before.filter((entry) => entry.href.includes('action=deactivate'));

    if (!apply) {
      emitResult({
        ok: true,
        mode: 'dry-run',
        siteRoot,
        found: before.length,
        wouldDeactivate: active.length,
        wouldDelete: deletable.length,
        entries: before,
        note: '預演完成，沒有修改網站。確認無誤後加上 --apply 才會實際刪除。',
      });
      return;
    }

    // 先停用，WordPress 不允許刪除啟用中的外掛。
    for (let index = 0; index < 20; index += 1) {
      const current = await listTargets(page, siteRoot);
      const deactivate = current.find((entry) => entry.href.includes('action=deactivate'));
      if (!deactivate) break;
      await page.goto(new URL(deactivate.href, `${siteRoot}/wp-admin/`).href, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      steps.push({ step: 'deactivate', href: deactivate.href });
    }

    // 用後台實際的批次操作流程刪除。直接以網址觸發 delete-selected 會過不了 WordPress 的驗證。
    await page.goto(`${siteRoot}/wp-admin/plugins.php`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    const checkboxes = page.locator(
      `#the-list input[type="checkbox"][value*="${PLUGIN_SLUG}"]`,
    );
    const checkboxCount = await checkboxes.count();
    steps.push({ step: 'select-checkboxes', count: checkboxCount });

    if (checkboxCount === 0) {
      emitResult({ ok: true, mode: 'apply', siteRoot, removed: 0, remaining: 0, steps });
      return;
    }

    for (let index = 0; index < checkboxCount; index += 1) {
      await checkboxes.nth(index).check();
    }

    await page.selectOption('#bulk-action-selector-top', 'delete-selected');
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 60000 }),
      page.click('#doaction'),
    ]);

    const confirmText = await page.locator('#wpbody-content').innerText().catch(() => '');
    const confirm = page.locator('#submit, input[name="submit"]').first();
    if ((await confirm.count()) > 0) {
      await Promise.all([
        page.waitForLoadState('domcontentloaded', { timeout: 60000 }),
        confirm.click(),
      ]);
      steps.push({ step: 'confirm-delete', clicked: true });
    } else {
      steps.push({
        step: 'confirm-delete',
        clicked: false,
        page: confirmText.replace(/\s+/gu, ' ').trim().slice(0, 400),
      });
    }

    const after = await listTargets(page, siteRoot);
    emitResult({
      ok: after.length === 0,
      mode: 'apply',
      siteRoot,
      removed: before.length,
      remaining: after.length,
      remainingEntries: after,
      steps,
    });
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  emitResult(
    {
      ok: false,
      error: String(error.message || error).replace(/\s+/gu, ' ').trim().slice(0, 800),
    },
    true,
  );
  process.exitCode = 1;
});
