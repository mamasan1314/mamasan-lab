<?php
// Synthetic adapters only. No network, database, real customers or real orders.
define('ABSPATH', __DIR__ . '/');
$GLOBALS['test_options'] = array();
$GLOBALS['test_hooks'] = array();
$GLOBALS['test_products'] = array();
$GLOBALS['test_notices'] = array();
function add_action($hook, $fn, $priority = 10, $args = 1) { $GLOBALS['test_hooks'][$hook][] = $fn; }
function add_filter($hook, $fn, $priority = 10, $args = 1) { add_action($hook, $fn); }
function add_shortcode($tag, $fn) {}
function apply_filters($hook, $value, ...$args) { foreach ($GLOBALS['test_hooks'][$hook] ?? array() as $fn) { $value = $fn($value, ...$args); } return $value; }
function do_action($hook, ...$args) { foreach ($GLOBALS['test_hooks'][$hook] ?? array() as $fn) { $fn(...$args); } }
function get_option($key, $default = false) { return $GLOBALS['test_options'][$key] ?? $default; }
function update_option($key, $value, $autoload = null) { $GLOBALS['test_options'][$key] = $value; }
function delete_option($key) { unset($GLOBALS['test_options'][$key]); }
function wp_timezone() { return new DateTimeZone('Asia/Taipei'); }
function wc_get_product($id) { return $GLOBALS['test_products'][$id] ?? false; }
function wc_get_held_stock_quantity($p) { return $p->held; }
function wp_unslash($value) { return $value; }
function wp_verify_nonce($value, $action) { return $value === 'synthetic-nonce'; }
function wp_json_encode($value) { return json_encode($value, JSON_UNESCAPED_UNICODE); }
function wc_add_notice($message, $type) { $GLOBALS['test_notices'][] = $message; }
function esc_html($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
function esc_attr($value) { return esc_html($value); }
function esc_textarea($value) { return esc_html($value); }
function esc_url($value) { return esc_html($value); }
function wp_kses_post($value) { return $value; }
function wc_get_price_to_display($p) { return (float) $p->price; }
function wc_price($price) { return 'NT$' . number_format($price); }
function is_admin() { return false; }
function wp_doing_ajax() { return false; }
function clean_post_cache($id) {}
function has_action($name) { return false; }
function WC() { return $GLOBALS['test_wc']; }
function current_user_can($cap) { return $GLOBALS['test_can'] ?? true; }
function wp_die($message, $title = '', $args = array()) { throw new RuntimeException('Forbidden'); }
function check_admin_referer($action) { throw new RuntimeException('Nonce required'); }
function wp_enqueue_style(...$args) {}
function wp_enqueue_script(...$args) {}
function plugins_url($path, $file) { return '/assets/' . basename($path); }
function wp_nonce_field($action, $name = '_wpnonce') { echo '<input type="hidden" name="' . esc_attr($name) . '" value="synthetic-nonce">'; }
function admin_url($path) { return '/wp-admin/' . $path; }
function checked($a, $b, $echo = true) { return $a == $b ? 'checked' : ''; }
function selected($a, $b, $echo = true) { return $a == $b ? 'selected' : ''; }
function get_transient($key) { return false; }
function get_current_user_id() { return 999999; }
function add_query_arg($key, $value, $url) { return $url . '?' . $key . '=' . rawurlencode($value); }
class WooCommerce {}
class FakeProduct {
    public $id; public $price; public $stock; public $held = 0; public $meta = array(); public $backorders = false;
    function __construct($id, $price, $stock) { $this->id = $id; $this->price = $price; $this->stock = $stock; }
    function get_id() { return $this->id; }
    function is_type($type) { return $type === 'simple'; }
    function get_price() { return $this->price; }
    function set_price($value) { $this->price = $value; }
    function managing_stock() { return true; }
    function backorders_allowed() { return $this->backorders; }
    function is_in_stock() { return $this->stock > 0; }
    function get_stock_quantity() { return $this->stock; }
    function get_meta($key) { return $this->meta[$key] ?? ''; }
    function get_permalink() { return '/product/candle21/'; }
    function is_purchasable() { return $this->stock > 0; }
    function get_name() { return array(101 => '21 顆限定組', 102 => '單顆蠟燭', 103 => '玻璃燭台')[$this->id] ?? '其他商品'; }
    function get_price_html() { return wc_price($this->price); }
}
class FakeCart {
    public $cart_contents = array();
    function get_cart() { return $this->cart_contents; }
}
class WC_Order_Item_Product {
    public $meta = array(); public $quantity = 1; public $product; public $name; public $total;
    function add_meta_data($key, $value, $unique = false) { $this->meta[$key] = $value; }
    function get_meta($key) { return $this->meta[$key] ?? ''; }
    function set_product($p) { $this->product = $p; }
    function set_name($name) { $this->name = $name; }
    function set_quantity($q) { $this->quantity = $q; }
    function get_quantity() { return $this->quantity; }
    function set_subtotal($v) {}
    function set_total($v) { $this->total = $v; }
    function set_taxes($v) {}
}
class FakeOrder {
    public $items = array(); public $meta = array();
    function get_items() { return $this->items; }
    function add_item($item) { $this->items[] = $item; }
    function update_meta_data($key, $value) { $this->meta[$key] = $value; }
    function get_meta($key) { return $this->meta[$key] ?? ''; }
    function get_date_created() { return new DateTimeImmutable('2026-09-08T12:00:00+08:00'); }
}
class FakeErrors {
    public $errors = array();
    function add($key, $value) { $this->errors[$key] = $value; }
}
require_once __DIR__ . '/../../wp-plugins/hopelight-candle21-commerce/hopelight-candle21-commerce.php';
require_once __DIR__ . '/../../wp-plugins/hopelight-crm-board/candle21.php';
do_action('plugins_loaded');
function fixture() {
    $raw = array('enabled' => 1, 'product_id' => 101, 'single_id' => 102, 'gift_id' => 103, 'lp_id' => 201,
        'gift_enabled' => 1, 'shipping_enabled' => 1, 'shipping_verified' => 1,
        'shipping_scope' => 'tw_whole_order', 'shipping_promise' => '台灣本島與離島含運（測試設定）',
        'consultation_enabled' => 1, 'consultation' => array('minutes' => 10, 'count' => 1, 'days' => 30, 'description' => '靈魂藍圖諮詢'),
        'bundle_text' => '', 'names' => HopeLight\Candle21\defaults());
    $GLOBALS['test_options'] = array(HopeLight\Candle21\OPTION => HopeLight\Candle21\settings($raw));
    $GLOBALS['test_products'] = array(101 => new FakeProduct(101, '2980', 12), 102 => new FakeProduct(102, '139', 50), 103 => new FakeProduct(103, '100', 4), 999 => new FakeProduct(999, '1000', 8));
    $GLOBALS['test_products'][101]->meta['_hopelight_c21_required'] = 'yes';
    $GLOBALS['test_wc'] = new class {
        public $cart; public $session; public $rates = array();
        function __construct() { $this->cart = new FakeCart(); $this->session = new class { function get($key, $default = null) { return array('free_shipping:1'); } }; }
        function shipping() { return $this; }
        function get_packages() { return $this->rates; }
    };
    $mix = array_fill_keys(array_keys(HopeLight\Candle21\defaults()), '0'); $mix['peaceful-night'] = '21';
    $_POST = array('hopelight_c21_nonce' => 'synthetic-nonce', 'hopelight_c21_mix' => $mix, 'hopelight_c21_source' => 'line_consult');
    return $raw;
}
