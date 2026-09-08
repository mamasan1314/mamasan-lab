<?php
/**
 * Plugin Name: 希望之光 21 顆選購
 * Description: 十款選滿 21 顆、營運設定與不可追溯改寫的訂單快照。初始關閉。
 * Version: 0.1.0
 * Requires PHP: 7.4
 * Requires at least: 6.5
 * Requires Plugins: woocommerce
 */
namespace HopeLight\Candle21;
if (!defined('ABSPATH')) { exit; }
require_once __DIR__ . '/includes/contract.php';
require_once __DIR__ . '/includes/admin.php';

const OPTION = 'hopelight_c21_settings';
const VERSION = '0.1.0';

function config() {
    $raw = get_option(OPTION, array());
    if (!is_array($raw) || !$raw) { return array(); }
    try {
        $version = integer($raw['offer_version'] ?? 0, 1, 999999999);
        if (!is_array($raw['bundle_items'] ?? null)) { return array(); }
        $raw['bundle_text'] = implode("\n", array_map(function ($line) { return plain($line, 120); }, $raw['bundle_items']));
        $raw['names'] = names($raw); // Only missing labels may use defaults.
        return settings($raw, $version - 1);
    } catch (\InvalidArgumentException $e) { return array(); }
}
function now() { return new \DateTimeImmutable('now', wp_timezone()); }
function target($id) {
    // Marker survives missing settings, so settings loss cannot open an unvalidated purchase path.
    $p = wc_get_product($id);
    return $p && ((int) (config()['product_id'] ?? 0) === (int) $id || $p->get_meta('_hopelight_c21_required') === 'yes');
}
function ready() {
    $c = config();
    $p = wc_get_product((int) ($c['product_id'] ?? 0));
    try { current_offer(); } catch (\Throwable $e) { return false; }
    return !empty($c['enabled']) && !empty($c['offer_version']) && $p && $p->is_type('simple')
        && get_option('woocommerce_manage_stock', 'yes') === 'yes' && (int) get_option('woocommerce_hold_stock_minutes', 60) > 0
        && apply_filters('woocommerce_hold_stock_for_checkout', true)
        && $p->get_price() !== '' && is_numeric($p->get_price()) && (float) $p->get_price() > 0
        && $p->managing_stock() && !$p->backorders_allowed() && $p->is_in_stock();
}
function enabled_for($id) { return (int) $id === (int) (config()['product_id'] ?? 0) && ready(); }
function gift_available() {
    $c = config();
    if (empty($c['gift_enabled'])) { return false; }
    $p = wc_get_product((int) ($c['gift_id'] ?? 0));
    return $p && $p->is_type('simple') && $p->managing_stock() && !$p->backorders_allowed() && $p->is_in_stock()
        && $p->get_stock_quantity() - wc_get_held_stock_quantity($p) > 0;
}
function current_offer() {
    $c = config();
    if (get_option('hopelight_c21_shipping_mismatch')) { $c['shipping_enabled'] = 0; }
    return offer($c, gift_available(), now());
}
function fail($message) { wc_add_notice($message, 'error'); return false; }
function contact() { return 'https://lin.ee/vG7eI1Dv'; }

add_action('before_woocommerce_init', function () {
    if (class_exists('Automattic\\WooCommerce\\Utilities\\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
        // Classic cart/checkout is the MVP. Store API is explicitly guarded below.
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', __FILE__, false);
    }
});

add_action('plugins_loaded', function () {
    if (!class_exists('WooCommerce')) { return; }
    add_filter('woocommerce_is_purchasable', function ($allowed, $p) { return target($p->get_id()) ? $allowed && enabled_for($p->get_id()) : $allowed; }, 10, 2);
    add_filter('woocommerce_product_add_to_cart_url', function ($url, $p) { return target($p->get_id()) ? $p->get_permalink() : $url; }, 10, 2);
    add_filter('woocommerce_product_supports', function ($allowed, $feature, $p) { return $feature === 'ajax_add_to_cart' && target($p->get_id()) ? false : $allowed; }, 10, 3);
    add_action('woocommerce_before_add_to_cart_button', __NAMESPACE__ . '\\fields');
    add_action('woocommerce_single_product_summary', __NAMESPACE__ . '\\product_summary', 25);
    add_filter('woocommerce_add_to_cart_validation', __NAMESPACE__ . '\\validate_add', 10, 6);
    add_filter('woocommerce_add_cart_item_data', __NAMESPACE__ . '\\cart_data', 10, 4);
    add_action('woocommerce_before_calculate_totals', __NAMESPACE__ . '\\refresh_cart', 20);
    add_filter('woocommerce_get_item_data', __NAMESPACE__ . '\\cart_summary', 10, 2);
    add_action('woocommerce_check_cart_items', __NAMESPACE__ . '\\validate_cart');
    add_action('woocommerce_after_checkout_validation', __NAMESPACE__ . '\\validate_checkout', 10, 2);
    add_filter('woocommerce_cart_shipping_packages', __NAMESPACE__ . '\\shipping_gifts', 20);
    add_action('woocommerce_checkout_create_order_line_item', __NAMESPACE__ . '\\order_item', 10, 4);
    add_action('woocommerce_checkout_create_order', __NAMESPACE__ . '\\order_data', 20, 2);
    add_action('woocommerce_store_api_cart_errors', __NAMESPACE__ . '\\store_api_guard', 10, 2);
    add_action('woocommerce_store_api_checkout_update_order_from_request', function ($order) {
        foreach ($order->get_items() as $item) {
            if (target($item->get_product_id())) { throw new \Exception('此限定組請使用網站的傳統結帳頁，或先透過 LINE 聯絡。'); }
        }
    }, 10, 1);
    add_action('woocommerce_process_product_meta', __NAMESPACE__ . '\\purge');
    add_action('woocommerce_product_set_stock', __NAMESPACE__ . '\\purge');
    add_action('woocommerce_update_product', __NAMESPACE__ . '\\purge');
    add_action('woocommerce_scheduled_sales', __NAMESPACE__ . '\\purge');
    add_action('template_redirect', __NAMESPACE__ . '\\no_cache');
    add_shortcode('hopelight_c21', __NAMESPACE__ . '\\shortcode');
});

function fields() {
    global $product;
    if (!$product || !target($product->get_id()) || !enabled_for($product->get_id())) { return; }
    wp_enqueue_style('hopelight-c21', plugins_url('assets/commerce.css', __FILE__), array(), VERSION);
    wp_enqueue_script('hopelight-c21', plugins_url('assets/commerce.js', __FILE__), array(), VERSION, true);
    echo '<fieldset class="hlc21-picker"><legend>選你的 21 顆（每組）</legend><p>十款任選，同款可重複。未選的款式填 0。</p>';
    wp_nonce_field('hopelight_c21_mix', 'hopelight_c21_nonce');
    $src = source(isset($_GET['source']) ? wp_unslash($_GET['source']) : 'unknown');
    echo '<input type="hidden" name="hopelight_c21_source" value="' . esc_attr($src) . '">';
    foreach (names(config()) as $key => $row) {
        echo '<label class="hlc21-row"><span><strong>' . esc_html($row['name']) . '</strong><small>' . esc_html($row['description']) . '</small></span>';
        echo '<input aria-label="' . esc_attr($row['name'] . '顆數') . '" type="number" min="0" max="21" step="1" inputmode="numeric" required name="hopelight_c21_mix[' . esc_attr($key) . ']" value="0"></label>';
    }
    echo '<p class="hlc21-total" role="status" aria-live="polite">請選滿 21 顆。</p><noscript>填完十款後送出，系統會檢查總數。</noscript></fieldset>';
}
function product_summary() {
    global $product;
    if (!$product || !target($product->get_id())) { return; }
    if (!enabled_for($product->get_id())) { echo '<p>限定組暫停訂購。<a href="' . esc_url(contact()) . '">請透過 LINE 聯絡</a></p>'; return; }
    echo '<div class="hlc21-offer">' . shortcode(array('field' => 'bundle')) . shortcode(array('field' => 'shipping')) . shortcode(array('field' => 'consultation')) . '</div>';
}
function validate_add($passed, $id, $quantity, $variation_id = 0, $variations = array(), $data = array()) {
    if (!target($id)) { return $passed; }
    if (!enabled_for($id) || $variation_id) { return fail('限定組目前無法訂購，請透過 LINE 聯絡。'); }
    if (!isset($_POST['hopelight_c21_nonce']) || !is_string($_POST['hopelight_c21_nonce']) || !wp_verify_nonce(wp_unslash($_POST['hopelight_c21_nonce']), 'hopelight_c21_mix')) {
        return fail('請回限定組商品頁重新選款。');
    }
    try {
        integer($quantity, 1, 999);
        mix(wp_unslash($_POST['hopelight_c21_mix'] ?? null));
        current_offer();
    } catch (\InvalidArgumentException $e) { return fail($e->getMessage()); }
    return $passed;
}
function cart_data($data, $id, $variation_id = 0, $quantity = 1) {
    if (!target($id)) { return $data; }
    // No browser-supplied names, totals, offer, gift ID or prices are copied.
    $data['hopelight_c21'] = array('mix' => mix(wp_unslash($_POST['hopelight_c21_mix'] ?? null)),
        'source' => source(wp_unslash($_POST['hopelight_c21_source'] ?? 'unknown')), 'offer' => current_offer());
    return $data;
}
function refresh_cart($cart) {
    if (is_admin() && !wp_doing_ajax()) { return; }
    foreach ($cart->get_cart() as $key => $row) {
        if (!target($row['product_id']) || empty($row['hopelight_c21']) || !enabled_for($row['product_id'])) { continue; }
        try {
            $offer = current_offer();
            // Cart is not an order: refresh promises on recalculation; old orders are never read here.
            $cart->cart_contents[$key]['hopelight_c21']['offer'] = $offer;
        } catch (\InvalidArgumentException $e) { fail('限定組設定不完整，請透過 LINE 聯絡。'); }
    }
}
function cart_summary($out, $row) {
    if (empty($row['hopelight_c21']['offer'])) { return $out; }
    try {
        $data = $row['hopelight_c21'];
        foreach (summary(mix_snapshot($data['mix'], $data['offer']['display_names']), $data['offer']) as $name => $value) {
            $out[] = array('key' => $name, 'value' => esc_html($value));
        }
    } catch (\InvalidArgumentException $e) { $out[] = array('key' => '選款', 'value' => '請移除後重新選滿 21 顆。'); }
    return $out;
}
function cart_errors() {
    $errors = array(); $gifts = array();
    if (!WC()->cart) { return $errors; }
    foreach (WC()->cart->get_cart() as $row) {
        if (!target($row['product_id'])) { continue; }
        try {
            if (!enabled_for($row['product_id']) || empty($row['hopelight_c21']['offer'])) { throw new \InvalidArgumentException('限定組暫停訂購，請移除後再結帳或聯絡 LINE。'); }
            mix($row['hopelight_c21']['mix'] ?? null);
            $qty = integer($row['quantity'], 1, 999);
            $gift = (int) ($row['hopelight_c21']['offer']['gift_product_id'] ?? 0);
            if ($gift) { $gifts[$gift] = ($gifts[$gift] ?? 0) + $qty; }
        } catch (\InvalidArgumentException $e) { $errors[] = $e->getMessage(); }
    }
    foreach ($gifts as $id => $qty) {
        $p = wc_get_product($id);
        // Include any separately purchased units of the same SKU.
        foreach (WC()->cart->get_cart() as $row) { if ((int) $row['product_id'] === $id) { $qty += $row['quantity']; } }
        if (!$p || !$p->managing_stock() || $p->backorders_allowed() || $p->get_stock_quantity() - wc_get_held_stock_quantity($p) < $qty) {
            $errors[] = '燭台庫存不足，請更新購物車，確認目前組合內容後再結帳。';
        }
    }
    return array_unique($errors);
}
function validate_cart() { foreach (cart_errors() as $error) { fail($error); } }
function shipping_gifts($packages) {
    // Shipping-only projection: lets Woo shipping methods see the gift's weight/dimensions.
    // This is not a payable cart line; the real zero-price order line is added at order creation.
    foreach ($packages as &$package) {
        $gifts = array();
        foreach ($package['contents'] as $row) {
            $id = (int) ($row['hopelight_c21']['offer']['gift_product_id'] ?? 0);
            if ($id) { $gifts[$id] = ($gifts[$id] ?? 0) + $row['quantity']; }
        }
        foreach ($gifts as $id => $qty) {
            $p = wc_get_product($id);
            if (!$p) { continue; }
            $p = clone $p; $p->set_price(0);
            $package['contents']['hlc21_gift_' . $id] = array('product_id' => $id, 'variation_id' => 0, 'variation' => array(),
                'quantity' => $qty, 'data' => $p, 'line_total' => 0, 'line_subtotal' => 0, 'line_tax' => 0, 'line_subtotal_tax' => 0,
                'line_tax_data' => array('total' => array(), 'subtotal' => array()));
        }
    }
    unset($package);
    return $packages;
}
function validate_checkout($data, $errors) {
    foreach (cart_errors() as $i => $error) { $errors->add('hlc21_' . $i, $error); }
    $promises = array(); $mixed = false;
    foreach (WC()->cart->get_cart() as $row) {
        if (!target($row['product_id'])) { $mixed = true; continue; }
        if (!empty($row['hopelight_c21']['offer']['shipping_promise'])) { $promises[] = $row['hopelight_c21']['offer']; }
    }
    foreach ($promises as $offer) {
        $country = !empty($data['ship_to_different_address']) ? ($data['shipping_country'] ?? '') : ($data['billing_country'] ?? '');
        $invalid = $country !== 'TW' || ($mixed && $offer['shipping_scope'] === 'tw_bundle_only');
        $packages = WC()->shipping()->get_packages();
        if (!$packages) { $invalid = true; }
        foreach ($packages as $index => $package) {
            $method = WC()->session->get('chosen_shipping_methods', array())[$index] ?? '';
            $rate = $package['rates'][$method] ?? null;
            if (!$rate || (float) $rate->get_cost() !== 0.0 || array_sum($rate->get_taxes()) !== 0) { $invalid = true; }
        }
        if ($invalid) {
            $errors->add('hlc21_shipping', '此地址或混合購物車不符合目前含運方案，請分開訂購或透過 LINE 確認。');
            // No guesswork: stop showing a contradicted promise until a manager revalidates it.
            if ($country === 'TW' && !($mixed && $offer['shipping_scope'] === 'tw_bundle_only')) {
                update_option('hopelight_c21_shipping_mismatch', 1, false);
                purge();
            }
        }
    }
}
function order_item($item, $key, $values, $order) {
    if (!target($values['product_id'])) { return; }
    if (!enabled_for($values['product_id']) || empty($values['hopelight_c21']['offer'])) { throw new \Exception('限定組選款資料不完整。'); }
    $data = $values['hopelight_c21'];
    $snapshot = $data['offer'];
    // Capture the absolute deadline from order creation, not the original cart timestamp.
    $timestamp = $order->get_date_created();
    $created = $timestamp ? (new \DateTimeImmutable('@' . $timestamp->getTimestamp()))->setTimezone(wp_timezone()) : now();
    $current = current_offer();
    $compare = static function ($offer) {
        unset($offer['captured_at']);
        if (!empty($offer['consultation'])) { unset($offer['consultation']['expires_at']); }
        return $offer;
    };
    if ($compare($snapshot) !== $compare($current)) { throw new \Exception('組合內容已更新，請重新整理購物車後確認。'); }
    $snapshot['captured_at'] = $created->format(DATE_ATOM);
    if ($snapshot['consultation']) { $snapshot['consultation']['expires_at'] = $created->modify('+' . config()['consultation']['days'] . ' days')->format(DATE_ATOM); }
    $mix = mix_snapshot($data['mix'], $snapshot['display_names']);
    $item->add_meta_data('_hopelight_c21_schema_version', 1, true);
    $item->add_meta_data('_hopelight_c21_mix', wp_json_encode($mix), true);
    $item->add_meta_data('_hopelight_c21_offer', wp_json_encode($snapshot), true);
    // Public meta is a frozen human-readable projection, including plain-text emails.
    foreach (summary($mix, $snapshot) as $name => $value) { $item->add_meta_data($name, $value, true); }
}
function order_data($order, $data) {
    $sources = array(); $gifts = array();
    foreach (WC()->cart->get_cart() as $row) {
        if (target($row['product_id'])) { $sources[] = source($row['hopelight_c21']['source'] ?? 'unknown'); }
    }
    if (!$sources) { return; }
    foreach (cart_errors() as $error) { throw new \Exception($error); }
    // Conflicting entry paths are explicitly unknown, not falsely attributed to a consultation.
    $sources = array_unique($sources);
    foreach (attribution(count($sources) === 1 ? reset($sources) : 'unknown') as $key => $value) {
        $order->update_meta_data('_hopelight_c21_' . $key, $value);
    }
    foreach ($order->get_items() as $item) {
        $offer = json_decode($item->get_meta('_hopelight_c21_offer'), true);
        $id = (int) ($offer['gift_product_id'] ?? 0);
        if ($id) { $gifts[$id] = ($gifts[$id] ?? 0) + $item->get_quantity(); }
    }
    foreach ($gifts as $id => $qty) {
        $product = wc_get_product($id);
        if (!$product) { throw new \Exception('燭台商品不存在，請更新購物車。'); }
        // Native order line: Woo reserves/reduces/restores stock with the rest of the order.
        // No separate inventory ledger and no custom stock subtraction.
        $gift = new \WC_Order_Item_Product();
        $gift->set_product($product);
        $gift->set_name('玻璃燭台（限定組贈品）');
        $gift->set_quantity($qty);
        $gift->set_subtotal(0); $gift->set_total(0); $gift->set_taxes(array('subtotal' => array(), 'total' => array()));
        $gift->add_meta_data('_hopelight_c21_gift', 1, true);
        $order->add_item($gift);
    }
}
function store_api_guard($errors, $cart) {
    foreach ($cart->get_cart() as $row) {
        if (target($row['product_id'])) { $errors->add('hlc21_classic_checkout', '限定組需使用網站傳統結帳頁；請透過 LINE 聯絡。'); break; }
    }
}

function no_cache() {
    global $post;
    if ($post && (target($post->ID) || (int) (config()['lp_id'] ?? 0) === $post->ID || has_shortcode($post->post_content, 'hopelight_c21') || get_page_template_slug($post->ID) === 'page-candle21.php')) {
        if (!defined('DONOTCACHEPAGE')) { define('DONOTCACHEPAGE', true); }
        nocache_headers();
    }
}
function purge($ignored = null) {
    if ($ignored !== null) {
        $id = is_object($ignored) && method_exists($ignored, 'get_id') ? $ignored->get_id() : (int) $ignored;
        if (!in_array($id, array_map('intval', array(config()['product_id'] ?? 0, config()['single_id'] ?? 0, config()['gift_id'] ?? 0)), true)) { return; }
    }
    $ids = array_filter(array((int) (config()['product_id'] ?? 0), (int) (config()['single_id'] ?? 0), (int) (config()['lp_id'] ?? 0)));
    foreach ($ids as $id) { clean_post_cache($id); }
    // These calls only cover installed WP cache adapters. Hosting/CDN cache must still be verified.
    if (function_exists('wp_cache_clear_cache')) { wp_cache_clear_cache(); }
    if (function_exists('rocket_clean_domain')) { rocket_clean_domain(); }
    if (has_action('litespeed_purge_all')) { do_action('litespeed_purge_all'); }
    if (function_exists('w3tc_flush_all')) { w3tc_flush_all(); }
    update_option('hopelight_c21_cache_notice', 1, false);
}
function shortcode($atts = array()) {
    $field = $atts['field'] ?? 'cta';
    $c = config();
    $p = wc_get_product((int) ($c['product_id'] ?? 0));
    if ($field === 'cta') {
        $html = ready() && $p && $p->is_purchasable() ? '<a class="btn btn-primary" href="' . esc_url(add_query_arg('source', 'lp_direct', $p->get_permalink())) . '">直接訂購・選滿 21 顆</a> ' : '<span>限定組暫停訂購</span> ';
        return $html . '<a class="btn btn-ghost" href="' . esc_url(contact()) . '">先諮詢・LINE 傳「蠟燭」</a>';
    }
    if ($field === 'stock' && $p && !$p->is_in_stock()) { return '本批已售罄'; }
    if (!ready()) { return in_array($field, array('price', 'stock'), true) ? '目前暫停訂購' : ''; }
    if (in_array($field, array('price', 'single_price', 'single_total', 'difference'), true)) {
        $single = wc_get_product((int) ($c['single_id'] ?? 0));
        if ($field !== 'price' && (!$single || $single->get_price() === '' || !is_numeric($single->get_price()))) { return ''; }
        $price = wc_get_price_to_display($p);
        if ($field === 'single_price') { $price = wc_get_price_to_display($single); }
        if ($field === 'single_total') { $price = 21 * wc_get_price_to_display($single); }
        if ($field === 'difference') { $price -= 21 * wc_get_price_to_display($single); }
        return wp_kses_post(wc_price($price));
    }
    if ($field === 'stock') { return esc_html('目前剩餘 ' . max(0, $p->get_stock_quantity() - wc_get_held_stock_quantity($p)) . ' 組'); }
    if ($field === 'names') {
        $html = '<ul class="hlc21-names">';
        foreach (names($c) as $row) { $html .= '<li><strong>' . esc_html($row['name']) . '</strong> <span>' . esc_html($row['description']) . '</span></li>'; }
        return $html . '</ul>';
    }
    try { $offer = current_offer(); } catch (\InvalidArgumentException $e) { return ''; }
    if ($field === 'shipping') { return $offer['shipping_promise'] ? '<p>' . esc_html($offer['shipping_promise']) . '</p>' : ''; }
    if ($field === 'bundle') { return '<ul><li>' . implode('</li><li>', array_map('esc_html', $offer['bundle_items'])) . '</li></ul>'; }
    if ($field === 'consultation' && $offer['consultation']) {
        $item = $offer['consultation'];
        return '<p>' . esc_html($item['description'] . '｜' . $item['minutes'] . ' 分鐘，每筆訂單 ' . $item['count'] . ' 次，購買後 ' . $c['consultation']['days'] . ' 天內使用。') . '</p>';
    }
    return '';
}
