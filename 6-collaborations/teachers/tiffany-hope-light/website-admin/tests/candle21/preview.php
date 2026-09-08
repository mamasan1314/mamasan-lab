<?php
require __DIR__ . '/bootstrap.php';
fixture();
$output = $argv[1] ?? (__DIR__ . '/../../projects/2026-09-candle21-commerce/preview');
if (!is_dir($output)) { mkdir($output, 0777, true); }
$base = __DIR__ . '/../../wp-plugins/hopelight-candle21-commerce/assets/';
$css = file_get_contents($base . 'commerce.css');
$picker_js = file_get_contents($base . 'commerce.js');
$admin_js = file_get_contents($base . 'admin.js');
$notice = '<aside style="padding:12px;background:#fff3cd;color:#392d0d;font:16px/1.6 sans-serif;text-align:center">mamasan 內部工程預覽・全部為假商品與測試數量，尚未上線／未經 Tiffany 核准。<br><a href="index.html">預覽目錄</a> · <a href="admin.html">後台設定</a> · <a href="product.html">商品選款</a> · <a href="landing.html">動態 LP</a> · <a href="order.html">訂單／CRM 快照</a></aside>';
$head = '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>21 顆蠟燭・內部工程預覽</title><style>body{margin:0;background:#f4f1f6;color:#231b30;font:16px/1.7 system-ui,sans-serif}main{max-width:1040px;margin:24px auto;padding:16px}a{color:#69427e}button,.button{padding:10px 18px;display:inline-block;background:#614171;color:white;border:0;border-radius:6px;text-decoration:none}input,textarea,select{box-sizing:border-box}table{width:100%}td{vertical-align:top}small{display:block}button:disabled{opacity:.5}</style><style>' . $css . '</style><body>' . $notice;
ob_start(); HopeLight\Candle21\admin_page(); $admin = ob_get_clean();
$admin = preg_replace('/href="\/wp-admin\/[^\"]*"/', 'href="#" onclick="event.preventDefault();alert(\'正式後台會開啟對應商品或設定，此處僅供介面預覽。\')"', $admin);
file_put_contents($output . '/admin.html', $head . '<main>' . $admin . '</main><script>' . $admin_js . '</script><script>document.querySelector("form").addEventListener("submit",e=>{e.preventDefault();document.querySelector("[role=alert]").textContent="本機介面預覽：欄位格式通過，資料不會儲存到正式站。"})</script></body></html>');
$GLOBALS['product'] = wc_get_product(101);
ob_start(); HopeLight\Candle21\fields(); $fields = ob_get_clean();
$product = '<main style="max-width:660px"><h1>希望之光・21 顆限定組</h1><p>' . HopeLight\Candle21\shortcode(array('field' => 'price')) . '</p>' . HopeLight\Candle21\shortcode(array('field' => 'bundle')) . HopeLight\Candle21\shortcode(array('field' => 'consultation'));
file_put_contents($output . '/product.html', $head . $product . '<form>' . $fields . '<button class="single_add_to_cart_button">加入購物車</button><p id="result" role="status"></p></form></main><script>' . $picker_js . '</script><script>document.querySelector("form").addEventListener("submit",e=>{e.preventDefault();if(!e.defaultPrevented)return;document.querySelector("#result").textContent="本機假資料預覽：已選滿，正式交易尚未啟用。"})</script></body></html>');
function shortcode_exists($tag) { return true; }
function do_shortcode($tag) { preg_match('/field="([a-z_]+)"/', $tag, $m); return HopeLight\Candle21\shortcode(array('field' => $m[1] ?? 'cta')); }
function nocache_headers() {}
function language_attributes() { echo 'lang="zh-Hant"'; }
function bloginfo($key) { echo 'UTF-8'; }
function get_the_title() { return '21 顆頻率蠟燭限定組・內部假資料'; }
function wp_head() { global $css; echo '<style>' . $css . '</style>'; }
function body_class($class) { echo 'class="' . $class . '"'; }
function wp_body_open() { global $notice; echo $notice; }
function wp_footer() {}
ob_start(); require __DIR__ . '/../../wp-themes/hopebox-candle21-child/page-candle21.php'; $lp = ob_get_clean();
file_put_contents($output . '/landing.html', str_replace('/product/candle21/?source=lp_direct', 'product.html?source=lp_direct', $lp));
$row = array_merge(array('product_id' => 101, 'quantity' => 1), HopeLight\Candle21\cart_data(array(), 101));
$order = new FakeOrder(); $item = new WC_Order_Item_Product(); HopeLight\Candle21\order_item($item, 'a', $row, $order);
$order->add_item($item); $order->update_meta_data('_hopelight_c21_traffic_source', 'line_consult'); $order->update_meta_data('_hopelight_c21_journey_path', 'via_consult_link');
$html = '<main><h1>訂單與 CRM 的同一份快照</h1><p>測試訂單 EXAMPLE-001，非真實顧客。</p><h2>顧客訂單／Email 顯示內容</h2><dl>';
foreach ($item->meta as $key => $value) { if ($key[0] !== '_') { $html .= '<dt><strong>' . esc_html($key) . '</strong></dt><dd>' . esc_html($value) . '</dd>'; } }
$html .= '</dl><h2>CRM 唯讀摘要</h2>';
ob_start(); hopelight_crm_c21_render(array('items' => array(array('candle21' => hopelight_crm_c21_item($item))), 'candle21_source' => hopelight_crm_c21_source($order))); $html .= ob_get_clean();
file_put_contents($output . '/order.html', $head . $html . '</main></body></html>');
copy(__DIR__ . '/review-index.html', $output . '/index.html');
echo "Generated five synthetic preview pages.\n";
