<?php
require __DIR__ . '/bootstrap.php';
use function HopeLight\Candle21\{mix,settings,offer,summary,attribution,validate_add,cart_data,refresh_cart,cart_errors,order_item,order_data,shortcode,store_api_guard,ready};
set_error_handler(function ($level, $message, $file, $line) { throw new ErrorException($message, 0, $level, $file, $line); });
$passed = 0;
function test($name, $fn) { global $passed; fixture(); $fn(); $passed++; echo 'PASS ' . $name . "\n"; }
function eq($a, $b) { if ($a !== $b) { throw new RuntimeException('Assertion failed: ' . json_encode(array($a, $b), JSON_UNESCAPED_UNICODE)); } }
function rejects($fn) { try { $fn(); } catch (InvalidArgumentException $e) { return; } throw new RuntimeException('Expected validation rejection'); }
test('valid integer counts and exact total', function () { eq(array_sum(mix($_POST['hopelight_c21_mix'])), 21); });
foreach (array('20','22','-1','0.5','1e1',' 21','021','21.0',true,null,array(),21.0,'99999999999999999999') as $i => $bad) {
    test('reject malformed quantity ' . $i, function () use ($bad) { $q = $_POST['hopelight_c21_mix']; $q['peaceful-night'] = $bad; rejects(function () use ($q) { mix($q); }); });
}
test('reject missing and foreign keys', function () {
    $q = $_POST['hopelight_c21_mix']; unset($q['good-luck']); rejects(function () use ($q) { mix($q); });
    $q['unknown'] = 0; rejects(function () use ($q) { mix($q); });
});
test('add-to-cart cannot bypass nonce or count', function () {
    eq(validate_add(true, 101, 1), true); unset($_POST['hopelight_c21_nonce']); eq(validate_add(true, 101, 1), false);
    eq(validate_add(true, 999, 1), true);
});
test('browser names price gifts and status are ignored', function () {
    $_POST['price'] = 1; $_POST['offer'] = array('gift_id' => 999); $_POST['display_names'] = array('bad');
    $data = cart_data(array(), 101)['hopelight_c21']; eq($data['offer']['gift_product_id'], 103);
    eq($data['offer']['display_names']['peaceful-night']['name'], '安然入夜');
});
test('source allowlist never means consultation completed', function () {
    eq(attribution('<script>')['traffic_source'], 'unknown'); eq(attribution(array())['traffic_source'], 'unknown');
    eq(attribution('line_consult')['consultation_status'], 'not_scheduled');
    eq(attribution('line_consult')['journey_path'], 'via_consult_link');
});
test('missing promises never use promotion defaults', function () {
    $o = offer(array(), true, new DateTimeImmutable()); eq($o['gift_product_id'], 0); eq($o['shipping_promise'], ''); eq($o['consultation'], null);
    eq($o['display_names']['peaceful-night']['name'], '安然入夜');
});
test('bad admin settings preserve caller previous value', function () {
    $raw = fixture(); $before = get_option(HopeLight\Candle21\OPTION);
    foreach (array('', '<b>bad</b>', str_repeat('燭', 41)) as $name) {
        $bad = $raw; $bad['names']['good-luck']['name'] = $name; rejects(function () use ($bad) { settings($bad); });
    }
    $raw['consultation']['days'] = -1; rejects(function () use ($raw) { settings($raw); }); eq(get_option(HopeLight\Candle21\OPTION), $before);
});
test('shipping cannot be promised without verification', function () { $raw = fixture(); $raw['shipping_verified'] = 0; rejects(function () use ($raw) { settings($raw); }); });
test('dynamic price and stock never use hardcoded fallback', function () {
    eq(shortcode(array('field' => 'difference')), 'NT$61'); $GLOBALS['test_products'][101]->price = '3100'; eq(shortcode(array('field' => 'price')), 'NT$3,100');
    eq(shortcode(array('field' => 'difference')), 'NT$181'); $GLOBALS['test_products'][101]->stock = 0; eq(shortcode(array('field' => 'stock')), '本批已售罄');
    $GLOBALS['test_products'][101]->price = ''; eq(ready(), false);
});
test('gift disappears at zero or fully reserved stock', function () {
    $GLOBALS['test_products'][103]->stock = 0; eq(strpos(shortcode(array('field' => 'bundle')), '玻璃燭台'), false);
    $GLOBALS['test_products'][103]->stock = 4; $GLOBALS['test_products'][103]->held = 4; eq(strpos(shortcode(array('field' => 'bundle')), '玻璃燭台'), false);
});
test('cart checks gift stock across distinct bundle rows', function () {
    $data = cart_data(array(), 101); $row = array_merge(array('product_id' => 101, 'quantity' => 3), $data);
    WC()->cart->cart_contents = array('a' => $row, 'b' => $row); eq(count(cart_errors()), 1);
});
test('kill switch and settings loss close only marked products', function () {
    delete_option(HopeLight\Candle21\OPTION); eq(ready(), false); eq(validate_add(true, 101, 1), false); eq(validate_add(true, 999, 1), true);
});
test('changing target cannot reopen old marked product', function () {
    $c = get_option(HopeLight\Candle21\OPTION); $c['product_id'] = 999; update_option(HopeLight\Candle21\OPTION, $c);
    eq(validate_add(true, 101, 1), false);
});
test('immutable order snapshots, readable meta and independent CRM', function () {
    $data = cart_data(array(), 101); $row = array_merge(array('product_id' => 101, 'quantity' => 1), $data);
    WC()->cart->cart_contents = array('a' => $row); $order = new FakeOrder(); $item = new WC_Order_Item_Product();
    order_item($item, 'a', $row, $order); $order->add_item($item); order_data($order, array());
    eq(count($order->get_items()), 2); eq($order->items[1]->total, 0); eq($order->items[1]->product->id, 103);
    $before = serialize($item->meta); $crm = hopelight_crm_c21_item($item);
    $snapshot = json_decode($item->get_meta('_hopelight_c21_offer'), true); eq($snapshot['consultation']['expires_at'], '2026-10-08T12:00:00+08:00');
    $c = get_option(HopeLight\Candle21\OPTION); $c['gift_enabled'] = 0; $c['shipping_enabled'] = 0; $c['names']['peaceful-night']['name'] = '新名稱'; $c['consultation']['days'] = 14; $c['offer_version']++;
    update_option(HopeLight\Candle21\OPTION, $c); refresh_cart(WC()->cart);
    eq(serialize($item->meta), $before); eq(hopelight_crm_c21_item($item), $crm);
    eq(strpos(hopelight_crm_c21_source($order), '已諮詢'), false);
    $new = new WC_Order_Item_Product(); order_item($new, 'a', WC()->cart->get_cart()['a'], new FakeOrder());
    eq(strpos($new->get_meta('21 顆配置（每組）'), '新名稱') !== false, true);
    eq(strpos($new->get_meta('組合內容（每組）'), '玻璃燭台'), false);
    eq(count(array_filter(array_keys($item->meta), function ($key) { return $key[0] !== '_'; })), 4);
});
test('changed promise between review and order requires confirmation', function () {
    $row = array_merge(array('product_id' => 101, 'quantity' => 1), cart_data(array(), 101));
    $c = get_option(HopeLight\Candle21\OPTION); $c['gift_enabled'] = 0; update_option(HopeLight\Candle21\OPTION, $c);
    try { order_item(new WC_Order_Item_Product(), 'a', $row, new FakeOrder()); } catch (Exception $e) { return; } throw new RuntimeException('Stale offer was accepted');
});
test('unsupported Store API blocks candle only', function () {
    $cart = new FakeCart(); $cart->cart_contents = array(array('product_id' => 999)); $errors = new FakeErrors(); store_api_guard($errors, $cart); eq(count($errors->errors), 0);
    $cart->cart_contents[] = array('product_id' => 101); store_api_guard($errors, $cart); eq(count($errors->errors), 1);
});
test('CRM malformed and historical items degrade safely and escape output', function () {
    $item = new WC_Order_Item_Product(); eq(hopelight_crm_c21_item($item), array());
    $item->add_meta_data('_hopelight_c21_schema_version', 1); $item->add_meta_data('_hopelight_c21_mix', 'broken'); eq(count(hopelight_crm_c21_item($item)), 1);
    ob_start(); hopelight_crm_c21_render(array('items' => array(array('candle21' => array('<script>alert(1)</script>'))), 'candle21_source' => '<img>')); $html = ob_get_clean();
    eq(strpos($html, '<script>'), false); eq(strpos($html, '<img>'), false);
});
test('admin save requires Woo capability before nonce or mutations', function () {
    $GLOBALS['test_can'] = false;
    try { HopeLight\Candle21\save_settings(); } catch (RuntimeException $e) { eq($e->getMessage(), 'Forbidden'); $GLOBALS['test_can'] = true; return; }
    throw new RuntimeException('Unauthorized save accepted');
});
test('malformed stored configuration fails closed without warnings', function () {
    $c = get_option(HopeLight\Candle21\OPTION); $c['bundle_items'] = 'broken'; update_option(HopeLight\Candle21\OPTION, $c);
    eq(ready(), false); eq(shortcode(array('field' => 'shipping')), '');
    eq(validate_add(true, 101, 1), false);
});
test('shipping projection includes gift quantity without changing product price', function () {
    $row = array_merge(array('product_id' => 101, 'quantity' => 2), cart_data(array(), 101));
    $packages = HopeLight\Candle21\shipping_gifts(array(array('contents' => array('a' => $row))));
    eq($packages[0]['contents']['hlc21_gift_103']['quantity'], 2);
    eq($packages[0]['contents']['hlc21_gift_103']['data']->get_price(), 0);
    eq(wc_get_product(103)->get_price(), '100');
});
test('nonzero shipping blocks promised free delivery and hides unverified promise', function () {
    $row = array_merge(array('product_id' => 101, 'quantity' => 1), cart_data(array(), 101)); WC()->cart->cart_contents = array('a' => $row);
    $rate = new class { function get_cost() { return 80; } function get_taxes() { return array(); } };
    WC()->rates = array(array('rates' => array('free_shipping:1' => $rate)));
    $errors = new FakeErrors(); HopeLight\Candle21\validate_checkout(array('billing_country' => 'TW'), $errors);
    eq(isset($errors->errors['hlc21_shipping']), true); eq(shortcode(array('field' => 'shipping')), '');
});
test('eligible free delivery succeeds and foreign address cannot disable site promise', function () {
    $row = array_merge(array('product_id' => 101, 'quantity' => 1), cart_data(array(), 101)); WC()->cart->cart_contents = array('a' => $row);
    $rate = new class { function get_cost() { return 0; } function get_taxes() { return array(); } };
    WC()->rates = array(array('rates' => array('free_shipping:1' => $rate)));
    $errors = new FakeErrors(); HopeLight\Candle21\validate_checkout(array('billing_country' => 'TW'), $errors); eq($errors->errors, array());
    HopeLight\Candle21\validate_checkout(array('billing_country' => 'US'), $errors); eq(isset($errors->errors['hlc21_shipping']), true); eq(get_option('hopelight_c21_shipping_mismatch'), false);
});
echo "\n$passed checks passed (synthetic adapters; not a WordPress integration test).\n";
