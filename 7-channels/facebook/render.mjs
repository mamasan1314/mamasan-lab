// 把一頁 HTML 截成固定尺寸的 JPEG（粉專封面、分享預覽圖用）。
// 用法：node render.mjs <page.html> <out.jpg> [寬 1200] [高 630]
// 需要本機的 Chrome；字型用本機的 Noto Serif TC，沒裝的機器截出來字會不一樣。
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [page, out, W = '1200', H = '630'] = process.argv.slice(2);
if (!page || !out) throw new Error('用法：node render.mjs <page.html> <out.jpg> [寬] [高]');
const width = Number(W);
const height = Number(H);
const port = 9338;
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'render-'))}`,
  '--hide-scrollbars', '--no-first-run', '--allow-file-access-from-files', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; }
  catch { await sleep(200); }
}
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((resolve) => {
  const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params }));
});

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(page).href });
await sleep(1500);
const imagesOk = (await send('Runtime.evaluate', {
  expression: `[...document.images].every((i) => i.naturalWidth > 0)`, returnByValue: true,
})).result.result.value;
const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90, clip: { x: 0, y: 0, width, height, scale: 1 } });
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log(`${out}（${width}×${height}），圖片都載入：${imagesOk}`);
ws.close();
chrome.kill();
