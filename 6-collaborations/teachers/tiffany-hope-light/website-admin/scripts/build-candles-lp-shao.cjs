// 從蠟燭 LP 的正本產生「媽媽燒」版本，寫進 mamasan 官網 repo 的 /shao/candles/。
//
// 同一份頁面有兩個出口：HopeBox 的 /candles（build-candles-lp-plugin.cjs）與這裡。
// 內容只維護一份正本 —— landing-pages/hopelight-candle21-lp.html；這支腳本只換掉
// 「屬於哪個通路」的部分：導流入口（mamasan 的 LINE）、品牌標示、聯絡方式、頁尾、配色。
// 導流入口必須換：媽媽燒每賣一顆 mamasan 分潤，從她頁面來的客人不能被導到 Tiffany 的 LINE，
// 否則對不了帳（Three-Quarters-International/ORGANIZATION/OPERATING_NOTES/2026-09-09-mamasan-hope-light/）。
//
// 每一個替換點都要求在正本裡剛好出現預期的次數。正本改版後對不上就停下，
// 不產出一份「一半換了、一半還指向 Tiffany」的頁面。
//
// 產物（index.html 與 assets/）進 mamasan 官網 repo 並由那邊 push 上線；不要在那邊直接改。
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_HTML = path.join(ROOT, 'landing-pages', 'hopelight-candle21-lp.html');
const SOURCE_ASSETS = path.join(ROOT, 'landing-pages', 'assets', 'candle21');
const OG_IMAGE = 'og-candles-mood.jpg';

// mamasan 官網 repo 在這台機器上的位置。預設是 Fourth-Life/ 底下的同層 repo，可用環境變數覆寫。
const SITE_ROOT = process.env.MAMASAN_SITE_ROOT
  ? path.resolve(process.env.MAMASAN_SITE_ROOT)
  : path.resolve(ROOT, '..', '..', '..', '..', '..', 'mamasan.three-quarters.net');
const PAGE_DIR = path.join(SITE_ROOT, 'shao', 'candles');
const SITE_URL = 'https://mamasan.three-quarters.net';
const PAGE_URL = `${SITE_URL}/shao/candles/`;

const LINE_ADD_FRIEND = 'https://line.me/R/ti/p/@941hfdmj';

// [找什麼, 換成什麼, 正本裡應該出現幾次]
const REPLACEMENTS = [
  // <title> 改由下面組的 <head> 提供
  ['<title>21顆頻率蠟燭限定組</title>\n', '', 1],

  // 淺色配色換成宇宙媽媽賞官網的家族色（紙感米色、乾燥玫瑰）；深色模式沿用正本。
  // 強調色用她官網文字用的 rose-deep（#7D4753），在米色底上對比約 6.5:1；她的香檳金 #B48A4A 做文字不夠清楚。
  ['--ground:#F1EFF3;', '--ground:#F8F3EC;', 1],
  ['--surface:#FBFAFC;', '--surface:#FFFDFA;', 1],
  ['--ink:#15111F;', '--ink:#2A2320;', 1],
  ['--muted:#4B4560;', '--muted:#6D5F58;', 1],
  ['--line:#D6D0DF;', '--line:#E6DCD1;', 1],
  ['--gold:#8A5A12;', '--gold:#7D4753;', 1],
  ['--gold-soft:#E0CDA9;', '--gold-soft:#E6D2CC;', 1],
  ['--glow:rgba(200,150,60,.20);', '--glow:rgba(157,95,107,.16);', 1],

  // 品牌標示：媽媽燒是賣方，希望之光是產品
  ['<p class="eyebrow">希望之光 Hope Light</p>', '<p class="eyebrow">媽媽燒 × 希望之光 Hope Light</p>', 1],

  // 導流入口：mamasan 的官方 LINE（2026-09-27 確認沒有自訂 ID，@941hfdmj 就是對外 ID）
  ['https://lin.ee/vG7eI1Dv', LINE_ADD_FRIEND, 2],
  ['<p>小幫手會回覆你這一批的狀況與付款方式。</p>', '<p>私訊之後，會回覆你這一批的狀況與付款方式。</p>', 1],
  [
    `      <ul class="contact-lines">
        <li><span>LINE</span>@happy139</li>
        <li><span>IG</span>.hopelight.ig ／ hopelight.moment</li>
        <li><span>Web</span>hopebox.com.tw</li>
      </ul>`,
    `      <ul class="contact-lines">
        <li><span>LINE</span>@941hfdmj</li>
        <li><span>Web</span>mamasan.three-quarters.net</li>
      </ul>`,
    1,
  ],
  [
    '<p style="margin-top:1.1rem">希望之光 Hope Light ｜ <a href="https://hopebox.com.tw/">回到官網</a></p>',
    '<p style="margin-top:1.1rem">蠟燭由希望之光 Hope Light 製作與出貨。</p>\n'
      + '      <p>媽媽燒・宇宙媽媽賞 ｜ <a href="../../">回到宇宙媽媽賞</a></p>',
    1,
  ],
];

// 換完之後，這些字串一個都不能留在頁面上：留著就代表有客人會被導去 Tiffany 那邊。
const MUST_NOT_REMAIN = ['lin.ee/vG7eI1Dv', 'happy139', 'hopebox.com.tw', '.hopelight.ig', 'hopelight.moment'];

const TITLE = '21 顆頻率蠟燭限定組｜媽媽燒 × 希望之光';
// 不寫價格：mamasan 要價格只出現在頁面最後（2026-09-27），分享預覽比開場還早被看到。
const DESCRIPTION = '10 款頻率蠟燭任選 21 顆，附 10 分鐘靈魂藍圖諮詢，全台含運。限量製作，售完即止。';

function escapeAttr(text) {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function countOf(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function main() {
  if (!fs.existsSync(path.join(SITE_ROOT, 'CNAME'))) {
    throw new Error(`找不到 mamasan 官網 repo：${SITE_ROOT}（沒有 CNAME）。用 MAMASAN_SITE_ROOT 指定位置。`);
  }

  let body = fs.readFileSync(SOURCE_HTML, 'utf8').replace(/\r\n/g, '\n');
  const mismatches = [];
  for (const [from, to, expected] of REPLACEMENTS) {
    const found = countOf(body, from);
    if (found !== expected) {
      mismatches.push(`預期 ${expected} 次、找到 ${found} 次：${from.split('\n')[0].trim().slice(0, 80)}`);
      continue;
    }
    body = body.split(from).join(to);
  }
  if (mismatches.length) {
    throw new Error('正本和替換規則對不上，什麼都沒寫入：\n  ' + mismatches.join('\n  '));
  }
  const leftovers = MUST_NOT_REMAIN.filter((needle) => body.includes(needle));
  if (leftovers.length) {
    throw new Error('換完之後仍留有 Tiffany 通路的字串，什麼都沒寫入：' + leftovers.join('、'));
  }

  // 頁面引用的每一個檔案都要在 assets 裡，缺一個就停。
  const referenced = [...new Set([...body.matchAll(/"assets\/candle21\/([^"]+)"/gu)].map((m) => m[1]))];
  const assets = [...new Set([...referenced, OG_IMAGE])];
  const missing = assets.filter((name) => !fs.existsSync(path.join(SOURCE_ASSETS, name)));
  if (missing.length) {
    throw new Error('頁面引用了不存在的檔案：' + missing.join(', '));
  }

  const head = [
    '<!DOCTYPE html>',
    '<html lang="zh-Hant-TW">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    `<title>${TITLE}</title>`,
    `<meta name="description" content="${escapeAttr(DESCRIPTION)}">`,
    `<link rel="canonical" href="${PAGE_URL}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="${escapeAttr(TITLE)}">`,
    `<meta property="og:description" content="${escapeAttr(DESCRIPTION)}">`,
    `<meta property="og:url" content="${PAGE_URL}">`,
    `<meta property="og:image" content="${PAGE_URL}assets/candle21/${OG_IMAGE}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    // 正本是給 Artifact 的片段，外框原本提供的最小重設（與 HopeBox 外掛相同）
    '<style>body{margin:0}img{max-width:100%}</style>',
    '</head>',
    '<body>',
    '<!-- 產物：由 mamasan-lab/6-collaborations/teachers/tiffany-hope-light/website-admin/scripts/build-candles-lp-shao.cjs',
    '     從 landing-pages/hopelight-candle21-lp.html 產生。不要在這裡改，改正本後重跑。 -->',
  ].join('\n');
  const html = `${head}\n${body.trimEnd()}\n</body>\n</html>\n`;

  const targetAssets = path.join(PAGE_DIR, 'assets', 'candle21');
  fs.rmSync(path.join(PAGE_DIR, 'assets'), { recursive: true, force: true });
  fs.mkdirSync(targetAssets, { recursive: true });
  for (const name of assets) {
    fs.copyFileSync(path.join(SOURCE_ASSETS, name), path.join(targetAssets, name));
  }
  fs.writeFileSync(path.join(PAGE_DIR, 'index.html'), html);

  console.log(JSON.stringify({ ok: true, page: path.join(PAGE_DIR, 'index.html'), url: PAGE_URL, assets }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: String(error.message || error) }, null, 2));
  process.exitCode = 1;
}
