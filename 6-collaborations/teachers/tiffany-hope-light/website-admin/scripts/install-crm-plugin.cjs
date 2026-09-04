// 把 wp-plugins/hopelight-crm-board.zip 上傳到 HopeBox 並啟用。
// 這個腳本會「修改網站」：安裝並啟用一個外掛。預設是預演模式，加 --apply 才會真的執行。
const fs = require('node:fs');
const path = require('node:path');
const { openHopeBoxAdmin } = require('../lib/hopebox-session.cjs');

const PLUGIN_SLUG = 'hopelight-crm-board';
const ZIP_PATH = path.resolve(__dirname, '..', 'wp-plugins', `${PLUGIN_SLUG}.zip`);

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function emitResult(result, error = false) {
  const serialized = JSON.stringify(result, null, 2);
  (error ? console.error : console.log)(serialized);
}

// 外掛列表的 row id 由外掛名稱產生，中文名稱會失效，所以一律用操作連結的網址判斷狀態。
function activateLink(page) {
  return page.locator(`a[href*="action=activate"][href*="${PLUGIN_SLUG}"]`).first();
}

function deactivateLink(page) {
  return page.locator(`a[href*="action=deactivate"][href*="${PLUGIN_SLUG}"]`).first();
}

async function readInstalledState(page, siteRoot) {
  await page.goto(`${siteRoot}/wp-admin/plugins.php`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  const canActivate = (await activateLink(page).count()) > 0;
  const canDeactivate = (await deactivateLink(page).count()) > 0;
  return {
    installed: canActivate || canDeactivate,
    active: canDeactivate,
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(`找不到外掛封裝檔：${ZIP_PATH}`);
  }

  const session = await openHopeBoxAdmin({
    headless: !process.argv.includes('--visible'),
    credentialFile: argumentValue('--credential'),
    browserPath: argumentValue('--browser'),
    profileDir: argumentValue('--profile'),
  });

  const { context, page, siteRoot, loginMode } = session;
  const steps = [];
  try {
    const before = await readInstalledState(page, siteRoot);
    steps.push({ step: 'read-current-state', ...before });

    // 上傳外掛的表單存在，才代表這個站允許從後台安裝外掛。
    await page.goto(`${siteRoot}/wp-admin/plugin-install.php?tab=upload`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    const uploadAvailable = (await page.locator('#pluginzip').count()) > 0;
    steps.push({ step: 'check-upload-form', uploadAvailable });

    if (!uploadAvailable) {
      throw new Error(
        '這個 WordPress 不允許從後台上傳外掛（可能設定了 DISALLOW_FILE_MODS）。需要改用 FTP 或主機檔案管理員。',
      );
    }

    if (!apply) {
      emitResult({
        ok: true,
        mode: 'dry-run',
        loginMode,
        siteRoot,
        zip: ZIP_PATH,
        currentState: before,
        uploadAvailable,
        note: '預演完成，沒有修改網站。確認無誤後加上 --apply 才會實際安裝。',
        steps,
      });
      return;
    }

    await page.setInputFiles('#pluginzip', ZIP_PATH);
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 120000 }),
      page.click('#install-plugin-submit'),
    ]);
    await page.waitForTimeout(2000);

    let uploadText = await page.locator('#wpbody-content').innerText().catch(() => '');

    // 資料夾已存在代表這是覆蓋安裝，WordPress 會要求先確認替換現有版本。
    const replaceButton = page
      .locator(
        'a:has-text("使用已上傳版本取代現有版本"), a:has-text("替換目前安裝的版本"), a:has-text("Replace current with uploaded")',
      )
      .first();
    if ((await replaceButton.count()) > 0) {
      await Promise.all([
        page.waitForLoadState('domcontentloaded', { timeout: 120000 }),
        replaceButton.click(),
      ]);
      await page.waitForTimeout(2000);
      uploadText = await page.locator('#wpbody-content').innerText().catch(() => '');
      steps.push({ step: 'confirm-replace', clicked: true });
    }
    // WordPress 的中英文成功訊息有多種寫法，覆蓋安裝時還會回「已更新但無法重新啟用」。
    const installedOk =
      /成功安裝|安裝成功|Plugin installed successfully|plugin has been updated|資料夾已存在|Destination folder already exists/u.test(
        uploadText,
      );
    steps.push({
      step: 'upload-zip',
      installedOk,
      message: uploadText.replace(/\s+/gu, ' ').trim().slice(0, 300),
    });

    if (!installedOk) {
      throw new Error(`上傳後沒有看到成功訊息：${uploadText.replace(/\s+/gu, ' ').trim().slice(0, 300)}`);
    }

    // 從外掛列表啟用，比點安裝畫面上的連結穩定（覆蓋安裝時不一定有那個連結）。
    await page.goto(`${siteRoot}/wp-admin/plugins.php`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    const activate = activateLink(page);
    if ((await activate.count()) > 0) {
      await Promise.all([
        page.waitForLoadState('domcontentloaded', { timeout: 60000 }),
        activate.click(),
      ]);
      const activationText = await page.locator('#wpbody-content').innerText().catch(() => '');
      steps.push({
        step: 'activate',
        clicked: true,
        message: activationText.replace(/\s+/gu, ' ').trim().slice(0, 300),
      });
    } else if ((await deactivateLink(page).count()) > 0) {
      steps.push({ step: 'activate', clicked: false, note: '外掛已經是啟用狀態。' });
    } else {
      throw new Error('外掛列表裡找不到這個外掛的啟用或停用連結，無法確認安裝結果。');
    }

    const after = await readInstalledState(page, siteRoot);
    steps.push({ step: 'verify', ...after });

    // 最後確認後台頁面真的打得開，而不是白畫面或致命錯誤。
    const pageResponse = await page.goto(`${siteRoot}/wp-admin/admin.php?page=hopelight-crm`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const dashboardLoaded =
      Boolean(pageResponse && pageResponse.ok()) && /希望之光 CRM 看板/u.test(bodyText);
    const fatalError = /Fatal error|致命錯誤|There has been a critical error/u.test(bodyText);
    steps.push({ step: 'open-dashboard', dashboardLoaded, fatalError });

    emitResult({
      ok: after.installed && after.active && dashboardLoaded && !fatalError,
      mode: 'apply',
      loginMode,
      siteRoot,
      adminUrl: `${siteRoot}/wp-admin/admin.php?page=hopelight-crm`,
      installed: after.installed,
      active: after.active,
      dashboardLoaded,
      fatalError,
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
