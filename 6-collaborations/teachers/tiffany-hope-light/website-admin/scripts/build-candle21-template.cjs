// Preserve the reviewed visual source; replace commerce copy with dynamic shortcodes.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'landing-pages/hopelight-candle21-lp.html'), 'utf8');
const field = name => `<?php echo hl_c21_lp_field('${name}'); ?>`;
const replace = (from, to) => {
  if (!html.includes(from)) throw new Error('LP source changed; review template mapping.');
  html = html.replaceAll(from, to);
};
replace('<title>21顆頻率蠟燭限定組</title>', '');
// Keep the decorative glow inside the hero; the source's +/-40vw bleeds off mobile screens.
replace('inset:-5rem -40vw auto -40vw', 'inset:-5rem 0 auto 0');
replace('<p class="draft">內部草稿 v0.3 ｜ 已更新產品款名；下單與諮詢流程仍待確認</p>', '');
replace('NT$2,980', field('price'));
replace('NT$139', field('single_price'));
replace('NT$2,919', field('single_total'));
replace('全台含運 ｜ 限量製作，售完即止', field('stock'));
replace('10 款頻率蠟燭，任選 21 顆。不知道怎麼選，可以先跟老師聊 10 分鐘，再決定。', '10 款頻率蠟燭，任選 21 顆。不知道怎麼選，可以先透過 LINE 詢問。');
replace('<a class="btn btn-primary" href="https://lin.ee/vG7eI1Dv">用 LINE 詢問這一批</a>', field('cta'));
html = html.replace(/<div class="groups"[\s\S]*?(?=\s*<div class="pick">)/u, `<div class="groups">${field('names')}</div>\n`);
replace('同一款可以多拿幾顆。最近特別想讓學習或事業往前推進，就多留幾顆學/事業進步；想好好照顧睡前的自己，就多幾顆安然入夜。', '同一款可以多拿幾顆，依照自己現在的狀態，自由組合。');
html = html.replace(/<section id="consult">[\s\S]*?<\/section>/u, `<section id="consult"><p class="label">先聊再選</p><h2>不確定怎麼選，先聊聊也可以</h2><p>在 LINE 傳送「蠟燭」，由小幫手安排。聊完後，再回商品頁選滿 21 顆結帳。</p>${field('consultation')}${field('cta')}</section>`);
html = html.replace(/<ul class="includes">[\s\S]*?<\/ul>/u, `${field('bundle')}${field('shipping')}${field('consultation')}`);
replace('单顆也可以買，但這一組划算'.replace('单', '單'), '選擇適合自己的方式');
replace('21 × 139，仍不含運，無贈品', '以目前單顆售價計算，運費依結帳顯示');
replace('任選 21 顆 ＋ 玻璃燭台 ＋ 10 分鐘靈魂藍圖諮詢 ＋ 全台含運', field('bundle') + field('shipping') + field('consultation'));
replace('同樣是 21 顆，限定組只多 <strong>61 元</strong>，多的是運費、一個玻璃燭台，以及老師的 10 分鐘靈魂藍圖諮詢。', `限定組與單顆買滿 21 顆的目前價差：<strong>${field('difference')}</strong>。組合內容以上方顯示為準。`);
replace('10 款可任選，不含運', '10 款可任選，運費依結帳顯示');
replace('數量有限，售完即止。', field('stock'));
replace('限量製作，售完即止。這不是每天都有的商品。', field('stock'));
html = html.replace(/<section id="order">[\s\S]*?<\/section>/u, `<section id="order"><p class="label">怎麼買</p><h2>選好 21 顆，再安心結帳</h2><ol class="steps"><li><span class="mark">01</span><div><h3>直接選款，或先到 LINE 聊聊</h3><p>已經知道想要什麼，就直接訂購；不確定時，在 LINE 傳「蠟燭」。</p></div></li><li><span class="mark">02</span><div><h3>在商品頁選滿 21 顆</h3><p>十款任選，同款可重複。選滿後加入購物車。</p></div></li><li><span class="mark">03</span><div><h3>確認內容與寄送資訊後付款</h3><p>付款方式與運費以 WooCommerce 結帳頁顯示為準。</p></div></li></ol><div class="actions">${field('cta')}</div></section>`);
replace('希望之光 Hope Light ｜ 本頁為內部版型草稿，所有款式、價格、贈品與流程以老師最終確認為準。', '希望之光 Hope Light');
if (/2,980|2,919|NT\$139|61 元|全台含運|玻璃燭台|10 分鐘/u.test(html)) throw new Error('Static commerce promise remains.');
const prefix = `<?php
/** Template Name: 21 顆頻率蠟燭 */
if (!defined('ABSPATH')) { exit; }
if (!defined('DONOTCACHEPAGE')) { define('DONOTCACHEPAGE', true); }
nocache_headers();
function hl_c21_lp_field($field) {
    if (shortcode_exists('hopelight_c21')) { return do_shortcode('[hopelight_c21 field="' . $field . '"]'); }
    return $field === 'cta' ? '<a class="btn btn-primary" href="https://lin.ee/vG7eI1Dv">LINE 傳「蠟燭」聯絡我們</a>' : '';
}
?><!doctype html><html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width, initial-scale=1"><title><?php echo esc_html(get_the_title()); ?></title><?php wp_head(); ?></head><body <?php body_class('candle21-lp'); ?>><?php wp_body_open(); ?>
`;
const dir = path.join(root, 'wp-themes/hopebox-candle21-child');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'page-candle21.php'), prefix + html + '\n<?php wp_footer(); ?></body></html>\n');
console.log('Generated child-theme template from reviewed LP; commerce values are dynamic.');
