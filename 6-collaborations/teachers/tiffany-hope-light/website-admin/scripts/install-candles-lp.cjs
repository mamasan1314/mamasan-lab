// 把 wp-plugins/hopelight-candles-lp.zip 上傳到 HopeBox 並啟用，讓 /candles 上線。
// 這個腳本會「修改網站」。預設是預演模式，加 --apply 才會真的執行。
// 撤下：到 wp-admin → 外掛，停用「希望之光 21 顆頻率蠟燭頁」即可，/candles 會回到 404。
// 流程沿用 install-crm-plugin.cjs；差別在最後以未登入的方式驗收公開頁面。
const fs = require('node:fs');
const path = require('node:path');
const { openHopeBoxAdmin } = require('../lib/hopebox-session.cjs');

const PLUGIN_SLUG = 'hopelight-candles-lp';
const ZIP_PATH = path.resolve(__dirname, '..', 'wp-plugins', `${PLUGIN_SLUG}.zip`);
const PAGE_MARKER = '給自己 21 次';

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function emitResult(result, error = false) {
  const serialized = JSON.stringify(result, null, 2);
  (error ? console.error : console.log)(serialized);
}

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
  return { installed: canActivate || canDeactivate, active: canDeactivate };
}

// 未登入的訪客看到什麼：狀態碼、頁面標記、分享預覽圖是否打得開。
async function checkPublicPage(siteRoot) {
  const url = `${siteRoot}/candles/`;
  const response = await fetch(url, { redirect: 'follow', headers: { 'Cache-Control': 'no-cache' } });
  const html = await response.text();
  const ogImage = (html.match(/<meta property="og:image" content="([^"]+)"/u) || [])[1] || null;
  let ogImageStatus = null;
  if (ogImage) {
    ogImageStatus = (await fetch(ogImage, { method: 'HEAD' })).status;
  }
  return {
    url,
    status: response.status,
    finalUrl: response.url,
    markerFound: html.includes(PAGE_MARKER),
    ogImage,
    ogImageStatus,
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(`找不到外掛封裝檔：${ZIP_PATH}。先執行 npm run candles-lp:pack。`);
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
    const publicBefore = await checkPublicPage(siteRoot);
    steps.push({ step: 'public-page-before', ...publicBefore });

    await page.goto(`${siteRoot}/wp-admin/plugin-install.php?tab=upload`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    const uploadAvailable = (await page.locator('#pluginzip').count()) > 0;
    steps.push({ step: 'check-upload-form', uploadAvailable });
    if (!uploadAvailable) {
      throw new Error('這個 WordPress 不允許從後台上傳外掛。需要改用主機檔案管理員。');
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

    // 覆蓋安裝（改版重裝）時 WordPress 會要求確認替換現有版本。
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
      steps.push({ step: 'activate', clicked: true });
    } else if ((await deactivateLink(page).count()) > 0) {
      steps.push({ step: 'activate', clicked: false, note: '外掛已經是啟用狀態。' });
    } else {
      throw new Error('外掛列表裡找不到這個外掛的啟用或停用連結，無法確認安裝結果。');
    }

    const after = await readInstalledState(page, siteRoot);
    steps.push({ step: 'verify-plugin', ...after });

    // 首頁沒有被外掛弄壞（致命錯誤會讓全站白畫面）。
    const homeResponse = await fetch(`${siteRoot}/`);
    const homeText = await homeResponse.text();
    const homeFatal = /Fatal error|致命錯誤|There has been a critical error/u.test(homeText);
    steps.push({ step: 'home-still-ok', status: homeResponse.status, fatal: homeFatal });

    const publicAfter = await checkPublicPage(siteRoot);
    steps.push({ step: 'public-page-after', ...publicAfter });

    emitResult({
      ok:
        after.installed &&
        after.active &&
        homeResponse.ok &&
        !homeFatal &&
        publicAfter.status === 200 &&
        publicAfter.markerFound &&
        publicAfter.ogImageStatus === 200,
      mode: 'apply',
      loginMode,
      siteRoot,
      pageUrl: publicAfter.url,
      steps,
    });
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  emitResult(
    { ok: false, error: String(error.message || error).replace(/\s+/gu, ' ').trim().slice(0, 800) },
    true,
  );
  process.exitCode = 1;
});
