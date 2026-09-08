const { openHopeBoxAdmin } = require('../lib/hopebox-session.cjs');
(async () => {
  const {context, page, siteRoot} = await openHopeBoxAdmin();
  try {
    await page.goto(`${siteRoot}/wp-admin/admin.php?page=wpcode`, {waitUntil:'domcontentloaded'});
    const snippets = await page.evaluate(() => ({
      editLinks: [...document.querySelectorAll('a[href*="page=wpcode-snippet-manager"]')].map(a => ({
        name: a.textContent.trim().slice(0, 100), id: new URL(a.href).searchParams.get('snippet_id'),
      })).filter(a => a.id),
      exportForm: !!document.querySelector('form[action*="export"]'),
    }));
    await page.goto('https://jetpack.com/redirect/?source=calypso-backups&site=hopebox.com.tw', {waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForTimeout(2000);
    const backup = await page.evaluate(() => ({
      origin: location.origin, pathname: location.pathname,
      loginRequired: !!document.querySelector('input[type=password],input[name=usernameOrEmail]'),
      restoreControlVisible: [...document.querySelectorAll('button,a')].some(e => /^(Restore|還原|復原)/iu.test(e.textContent.trim())),
    }));
    console.log(JSON.stringify({checkedAt:new Date().toISOString(),mode:'read-only',snippets,backup,restoreTested:false},null,2));
  } finally { await context.close(); }
})().catch(() => { console.error('Recovery entry audit unavailable. No page content recorded.'); process.exitCode=1; });
