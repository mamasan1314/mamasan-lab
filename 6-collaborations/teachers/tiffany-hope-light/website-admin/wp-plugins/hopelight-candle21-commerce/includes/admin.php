<?php
namespace HopeLight\Candle21;
if (!defined('ABSPATH')) { exit; }

add_action('admin_menu', function () {
    add_submenu_page('woocommerce', '21 顆蠟燭設定', '21 顆蠟燭', 'manage_woocommerce', 'hopelight-candle21', __NAMESPACE__ . '\\admin_page');
});
add_action('admin_post_hopelight_c21_save', __NAMESPACE__ . '\\save_settings');
add_action('admin_notices', function () {
    if (!current_user_can('manage_woocommerce')) { return; }
    if (get_option('hopelight_c21_shipping_mismatch')) {
        echo '<div class="notice notice-error"><p>21 顆組：結帳運費與含運承諾不一致，已隱藏含運文字。請在 WooCommerce → 21 顆蠟燭重新核對運送設定。</p></div>';
    }
    if (!config() || empty(config()['offer_version'])) {
        echo '<div class="notice notice-warning"><p>21 顆組尚未完成設定，選購功能保持關閉。</p></div>';
    }
});

function save_settings() {
    if (!current_user_can('manage_woocommerce')) { wp_die('權限不足。', '', array('response' => 403)); }
    check_admin_referer('hopelight_c21_save');
    $old = config();
    try {
        $raw = wp_unslash($_POST['c21'] ?? null);
        if (!is_array($raw)) { throw new \InvalidArgumentException('設定格式不正確。'); }
        $shipping_unchanged = ($raw['shipping_promise'] ?? '') === ($old['shipping_promise'] ?? '')
            && ($raw['shipping_scope'] ?? '') === ($old['shipping_scope'] ?? '')
            && (int) ($raw['shipping_enabled'] ?? 0) === (int) ($old['shipping_enabled'] ?? 0);
        $raw['shipping_verified'] = !empty($raw['shipping_confirm']) || ($shipping_unchanged && !empty($old['shipping_verified']) && !get_option('hopelight_c21_shipping_mismatch')) ? 1 : 0;
        $new = settings($raw, (int) ($old['offer_version'] ?? 0));
        if (!class_exists('WooCommerce')) { throw new \InvalidArgumentException('請先啟用 WooCommerce。'); }
        foreach (array('product_id' => '限定組', 'single_id' => '單顆', 'gift_id' => '燭台') as $key => $name) {
            if (!$new[$key]) { continue; }
            $p = wc_get_product($new[$key]);
            if (!$p || !$p->is_type('simple') || $p->get_status() === 'trash') { throw new \InvalidArgumentException($name . '請指定有效的簡單商品。'); }
            if ($key !== 'single_id' && (!$p->managing_stock() || $p->backorders_allowed())) {
                throw new \InvalidArgumentException($name . '請開啟「追蹤庫存數量」並禁止預購。');
            }
            if ($key !== 'single_id' && $p->get_sku() === '') { throw new \InvalidArgumentException($name . '請先填商品 SKU。'); }
            if ($key !== 'gift_id' && ($p->get_price() === '' || (float) $p->get_price() <= 0)) { throw new \InvalidArgumentException($name . '請先填有效售價。'); }
        }
        if ($new['lp_id'] && get_post_type($new['lp_id']) !== 'page') { throw new \InvalidArgumentException('LP 請指定有效頁面。'); }
        if ($new['enabled']) {
            foreach (array('cart', 'checkout') as $type) {
                $page = get_post(wc_get_page_id($type));
                if (!$page || has_block('woocommerce/' . $type, $page) || !has_shortcode($page->post_content, 'woocommerce_' . $type)) {
                    throw new \InvalidArgumentException('目前版本需 WooCommerce 傳統購物車與結帳頁，請先由工程確認。');
                }
            }
        }
        // Changing the target does not remove the old marker: old product must be reviewed/drafted deliberately.
        if ($new['product_id']) {
            $p = wc_get_product($new['product_id']);
            $p->update_meta_data('_hopelight_c21_required', 'yes'); $p->save();
        }
        update_option('hopelight_c21_settings_previous', $old, false);
        update_option(OPTION, $new, false);
        if ($new['shipping_verified']) { delete_option('hopelight_c21_shipping_mismatch'); }
        delete_transient('hopelight_c21_error_' . get_current_user_id());
        purge();
        wp_safe_redirect(admin_url('admin.php?page=hopelight-candle21&saved=1'));
    } catch (\InvalidArgumentException $e) {
        set_transient('hopelight_c21_error_' . get_current_user_id(), $e->getMessage(), 300);
        wp_safe_redirect(admin_url('admin.php?page=hopelight-candle21'));
    }
    exit;
}
function input($name, $value, $label, $type = 'text', $extra = '') {
    echo '<label class="hlc21-setting">' . esc_html($label) . '<input type="' . esc_attr($type) . '" name="c21[' . esc_attr($name) . ']" value="' . esc_attr($value) . '" ' . $extra . '></label>';
}
function check($key, $value, $label) {
    echo '<label class="hlc21-checkbox"><input type="checkbox" name="c21[' . esc_attr($key) . ']" value="1" ' . checked($value, 1, false) . '>' . esc_html($label) . '</label>';
}
function admin_page() {
    if (!current_user_can('manage_woocommerce')) { wp_die('權限不足。', '', array('response' => 403)); }
    wp_enqueue_style('hopelight-c21', plugins_url('../assets/commerce.css', __FILE__), array(), VERSION);
    wp_enqueue_script('hopelight-c21-admin', plugins_url('../assets/admin.js', __FILE__), array(), VERSION, true);
    $c = config();
    $error = get_transient('hopelight_c21_error_' . get_current_user_id());
    echo '<div class="wrap hlc21-admin"><h1>21 顆蠟燭</h1><p>改價格與數量，點下面的商品；改組合內容與款名，在本頁儲存。已成立的訂單保留原本內容。</p>';
    if ($error) { echo '<div class="notice notice-error"><p>' . esc_html($error) . ' 原設定已保留。</p></div>'; }
    if (isset($_GET['saved'])) { echo '<div class="notice notice-success"><p>設定已儲存，僅影響新訂單。</p></div>'; }
    echo '<div class="hlc21-products">';
    foreach (array('product_id' => '限定組：改價格／庫存組數', 'single_id' => '單顆：改價格', 'gift_id' => '玻璃燭台：改數量／設 0 停止附贈') as $key => $label) {
        $p = function_exists('wc_get_product') ? wc_get_product((int) ($c[$key] ?? 0)) : null;
        echo '<section><h2>' . esc_html($label) . '</h2>';
        if ($p) {
            echo '<p>' . esc_html($p->get_name()) . '</p><p>售價 ' . wp_kses_post($p->get_price_html()) . '／庫存 ' . esc_html($p->get_stock_quantity()) . '</p>';
            echo '<a class="button" href="' . esc_url(admin_url('post.php?post=' . $p->get_id() . '&action=edit')) . '">開啟商品編輯</a>';
        } else { echo '<p>尚未指定商品，請由工程完成下方首次連接。</p>'; }
        echo '</section>';
    }
    echo '</div><form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" class="hlc21-settings"><input type="hidden" name="action" value="hopelight_c21_save">';
    wp_nonce_field('hopelight_c21_save');
    echo '<section><h2>組合內容</h2><p>每組包含任選 21 顆蠟燭。燭台、運送與諮詢請用專屬欄位管理，避免重複承諾。</p>';
    check('gift_enabled', $c['gift_enabled'] ?? 0, '有庫存時，每組附 1 個玻璃燭台');
    echo '<label>其他組合內容（每行一項，刪除整行即可關閉；不填價格、運費或燭台）<textarea name="c21[bundle_text]" maxlength="1200" rows="4">' . esc_textarea(implode("\n", $c['bundle_items'] ?? array())) . '</textarea></label></section>';
    echo '<section><h2>運送承諾</h2><p>這裡改的是頁面文字；實際運費在 <a href="' . esc_url(admin_url('admin.php?page=wc-settings&tab=shipping')) . '">WooCommerce 運送設定</a>。未核對前不顯示含運承諾。</p>';
    check('shipping_enabled', $c['shipping_enabled'] ?? 0, '顯示含運承諾');
    input('shipping_promise', $c['shipping_promise'] ?? '', '含運文字', 'text', 'maxlength="120"');
    echo '<label>適用範圍<select name="c21[shipping_scope]">';
    foreach (array('unverified' => '尚未核對', 'tw_bundle_only' => '台灣含離島；僅限限定組單獨結帳', 'tw_whole_order' => '台灣含離島；含限定組的整張訂單') as $key => $label) {
        echo '<option value="' . esc_attr($key) . '" ' . selected($c['shipping_scope'] ?? 'unverified', $key, false) . '>' . esc_html($label) . '</option>';
    }
    echo '</select></label>';
    check('shipping_confirm', 0, '首次開啟或更改承諾時：已確認本島、離島、混合購物車與贈品重量的實際運費符合文字');
    echo '<p>只改款名或諮詢條件，不必重複勾選。</p>';
    echo '</section><section><h2>諮詢</h2>';
    check('consultation_enabled', $c['consultation_enabled'] ?? 0, '組合包含諮詢服務');
    $consult = $c['consultation'] ?? array('minutes' => 10, 'count' => 1, 'days' => 30, 'description' => '靈魂藍圖諮詢，透過 LINE 人工安排');
    foreach (array('minutes' => array('分鐘', 120), 'count' => array('每筆訂單次數', 10), 'days' => array('購買後幾天內使用', 365)) as $key => $spec) {
        input('consultation][' . $key, $consult[$key], $spec[0], 'number', 'min="1" max="' . $spec[1] . '" required step="1"');
    }
    input('consultation][description', $consult['description'], '服務說明', 'text', 'maxlength="300"');
    echo '</section><section><h2>十款名稱與一句話描述</h2><p>顯示名稱可改；代碼固定，不影響舊訂單。</p><table class="widefat"><thead><tr><th>名稱</th><th>一句話描述</th></tr></thead><tbody>';
    foreach (names($c) as $key => $row) {
        echo '<tr><td>';
        input('names][' . $key . '][name', $row['name'], '款名', 'text', 'required maxlength="40"');
        echo '<small>' . esc_html($key) . '</small></td><td>';
        input('names][' . $key . '][description', $row['description'], '描述', 'text', 'required maxlength="120"');
        echo '</td></tr>';
    }
    echo '</tbody></table></section><details><summary>首次連接／工程設定</summary><p>請先建立有 SKU 的 Woo 簡單商品。限定組與燭台須管理庫存、禁止預購；商品 ID 只在此連接，不另存價格。</p>';
    foreach (array('product_id' => '限定組商品 ID', 'single_id' => '單顆商品 ID', 'gift_id' => '燭台商品 ID', 'lp_id' => 'LP 頁面 ID') as $key => $label) {
        input($key, $c[$key] ?? 0, $label, 'number', 'min="0" max="999999999" required step="1"');
    }
    check('enabled', $c['enabled'] ?? 0, '啟用限定組選購（緊急暫停時取消勾選）');
    echo '</details><p class="hlc21-form-error" role="alert"></p><button class="button button-primary button-hero" type="submit">儲存組合與款名</button></form>';
    if (get_option('hopelight_c21_cache_notice')) {
        echo '<div class="notice notice-warning inline"><p>已要求清除 WordPress 可辨識的快取。主機／CDN 是否同步仍待無痕視窗驗證；若仍是舊值，請到主機管理的快取頁清除。尚未確認本主機清除入口，不能宣稱全站即時同步。</p></div>';
    }
    echo '</div>';
}
