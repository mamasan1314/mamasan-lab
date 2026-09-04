// 唯讀盤點 HopeBox 已安裝的外掛：名稱、版本、啟用狀態、是否有更新。
// 不修改網站，也不安裝或停用任何東西。
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
    await page.goto(`${siteRoot}/wp-admin/plugins.php`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    const data = await page.evaluate(() => {
      const clean = (value) => (value || '').replace(/\s+/gu, ' ').trim();

      const plugins = Array.from(document.querySelectorAll('#the-list tr')).reduce(
        (accumulator, row) => {
          // 更新提示是獨立的一列，屬於它前面那個外掛。
          if (row.classList.contains('plugin-update-tr')) {
            const notice = clean(row.innerText);
            if (accumulator.length > 0) {
              accumulator[accumulator.length - 1].updateNotice = notice.slice(0, 200);
              accumulator[accumulator.length - 1].updateAvailable = true;
            }
            return accumulator;
          }

          const title = clean((row.querySelector('.plugin-title strong') || {}).textContent);
          if (!title) return accumulator;

          const description = clean(
            (row.querySelector('.plugin-description p') || {}).textContent,
          );
          const meta = clean((row.querySelector('.plugin-version-author-uri') || {}).textContent);
          const versionMatch = meta.match(/(?:版本|Version)\s*([0-9][^\s|]*)/u);
          const authorMatch = meta.match(/(?:作者|By)\s*[:：]?\s*([^|]+)/u);
          const checkbox = row.querySelector('input[type="checkbox"]');

          accumulator.push({
            name: title,
            file: checkbox ? checkbox.value : '',
            slug: checkbox ? String(checkbox.value).split('/')[0] : '',
            active: row.classList.contains('active'),
            version: versionMatch ? versionMatch[1] : '',
            author: authorMatch ? clean(authorMatch[1]) : '',
            description: description.slice(0, 160),
            updateAvailable: false,
            updateNotice: '',
          });
          return accumulator;
        },
        [],
      );

      const counts = clean(
        (document.querySelector('.subsubsub') || {}).textContent,
      );

      return { plugins, counts };
    });

    const active = data.plugins.filter((plugin) => plugin.active);
    emitResult({
      ok: true,
      siteRoot,
      checkedAt: new Date().toISOString(),
      counts: data.counts,
      total: data.plugins.length,
      activeCount: active.length,
      inactiveCount: data.plugins.length - active.length,
      updatesAvailable: data.plugins.filter((plugin) => plugin.updateAvailable).length,
      plugins: data.plugins,
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
