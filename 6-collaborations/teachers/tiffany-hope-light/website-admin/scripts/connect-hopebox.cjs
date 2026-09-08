// Owner-assisted login, using exactly the reusable helper's browser and profile.
const { chromium } = require('playwright-core');
const { findBrowser, defaultProfileDir } = require('../lib/hopebox-session.cjs');

(async () => {
  const context = await chromium.launchPersistentContext(defaultProfileDir(), {
    executablePath: findBrowser(), headless: false, locale: 'zh-TW',
    args: ['--disable-blink-features=AutomationControlled'],
  });
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto('https://hopebox.com.tw/wp-admin/', { waitUntil: 'domcontentloaded' });
    console.log('HopeBox login window opened. Waiting for owner login; credentials are never recorded.');
    const end = Date.now() + 15 * 60 * 1000;
    while (Date.now() < end) {
      for (const p of context.pages()) {
        if (new URL(p.url()).origin === 'https://hopebox.com.tw' && new URL(p.url()).pathname.startsWith('/wp-admin')
          && await p.locator('#adminmenu').count()) {
          console.log('Owner login confirmed; reusable session saved.');
          return;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('Login window timeout; login has not been confirmed.');
    process.exitCode = 1;
  } finally { await context.close(); }
})().catch(() => { console.error('Owner login session ended without confirmation.'); process.exitCode = 1; });
