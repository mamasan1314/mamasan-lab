// 把蠟燭 LP 的正本與圖片複製進 wp-plugins/hopelight-candles-lp/，供 pack.ps1 打包。
// 正本在 landing-pages/；外掛裡的 page.html 與 assets/ 是產物，已被 Git 忽略。
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_HTML = path.join(ROOT, 'landing-pages', 'hopelight-candle21-lp.html');
const SOURCE_ASSETS = path.join(ROOT, 'landing-pages', 'assets', 'candle21');
const PLUGIN_DIR = path.join(ROOT, 'wp-plugins', 'hopelight-candles-lp');
const TARGET_ASSETS = path.join(PLUGIN_DIR, 'assets', 'candle21');

const html = fs.readFileSync(SOURCE_HTML, 'utf8');

// 頁面引用的每一張圖都要在 assets 裡，缺一張就停，不打包半套。
const referenced = [...new Set([...html.matchAll(/"assets\/candle21\/([^"]+)"/gu)].map((m) => m[1]))];
const missing = referenced.filter((name) => !fs.existsSync(path.join(SOURCE_ASSETS, name)));
if (missing.length) {
  throw new Error(`頁面引用了不存在的圖片：${missing.join(', ')}`);
}
if (!fs.existsSync(path.join(SOURCE_ASSETS, 'og-candles-mood.jpg'))) {
  throw new Error('缺少分享預覽圖 og-candles-mood.jpg');
}

fs.rmSync(path.join(PLUGIN_DIR, 'assets'), { recursive: true, force: true });
fs.mkdirSync(TARGET_ASSETS, { recursive: true });
const copied = [...referenced, 'og-candles-mood.jpg'];
for (const name of new Set(copied)) {
  fs.copyFileSync(path.join(SOURCE_ASSETS, name), path.join(TARGET_ASSETS, name));
}
fs.writeFileSync(path.join(PLUGIN_DIR, 'page.html'), html);

console.log(
  JSON.stringify({ ok: true, pluginDir: PLUGIN_DIR, page: 'page.html', assets: [...new Set(copied)] }, null, 2),
);
