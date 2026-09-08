<?php
// Pure data contract; also exercised without WordPress using synthetic fixtures.
namespace HopeLight\Candle21;

function defaults() {
    return array(
        'peaceful-night' => array('name' => '安然入夜', 'description' => '回到溫柔、安靜與放鬆的節奏'),
        'good-luck' => array('name' => '好運爆棚', 'description' => '開啟美好、迎接好事發生'),
        'boundaries' => array('name' => '小人退散', 'description' => '界線、降低干擾與內在穩定'),
        'abundance' => array('name' => '財富豐盛', 'description' => '顯化意圖、豐盛意識與行動提醒'),
        'customers' => array('name' => '吸引顧客', 'description' => '服務曝光、客源連結與經營意圖'),
        'romance' => array('name' => '吸引桃花', 'description' => '良緣、人際與關係開放度'),
        'study-career-growth' => array('name' => '學/事業進步', 'description' => '學習節奏、工作聚焦與事業行動提醒'),
        'benefactors' => array('name' => '貴人常臨', 'description' => '貴人相助、良緣與合作機會'),
        'relationship-warmth' => array('name' => '感情升溫', 'description' => '關係溫度、理解與互動回暖'),
        'cleansing' => array('name' => '淨化除穢', 'description' => '整理場域、清理雜訊與穩定空間'),
    );
}

function integer($value, $min, $max) {
    if ((!is_int($value) && !is_string($value)) || !preg_match('/^(0|[1-9][0-9]*)$/D', (string) $value)
        || strlen((string) $value) > 9 || (int) $value < $min || (int) $value > $max) {
        throw new \InvalidArgumentException('請填寫 ' . $min . ' 至 ' . $max . ' 的整數。');
    }
    return (int) $value;
}

function mix($raw) {
    $keys = array_keys(defaults());
    if (!is_array($raw) || count($raw) !== 10 || array_diff(array_keys($raw), $keys) || array_diff($keys, array_keys($raw))) {
        throw new \InvalidArgumentException('請完整填寫十款數量，未選的款式填 0。');
    }
    $out = array();
    foreach ($keys as $key) { $out[$key] = integer($raw[$key], 0, 21); }
    if (array_sum($out) !== 21) { throw new \InvalidArgumentException('請選滿 21 顆；目前合計 ' . array_sum($out) . ' 顆。'); }
    return $out;
}

function plain($value, $max, $required = true) {
    if (!is_string($value) || preg_match('//u', $value) !== 1) { throw new \InvalidArgumentException('請填寫文字。'); }
    $value = trim($value);
    preg_match_all('/./us', $value, $chars);
    if (($required && $value === '') || count($chars[0]) > $max || strip_tags($value) !== $value || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', $value)) {
        throw new \InvalidArgumentException('文字不可空白、含 HTML 或超過 ' . $max . ' 字。');
    }
    return $value;
}

function settings($raw, $version = 0) {
    if (!is_array($raw)) { throw new \InvalidArgumentException('設定格式不正確。'); }
    $out = array('offer_version' => $version + 1);
    foreach (array('enabled', 'gift_enabled', 'shipping_enabled', 'shipping_verified', 'consultation_enabled') as $key) {
        $out[$key] = isset($raw[$key]) ? integer($raw[$key], 0, 1) : 0;
    }
    foreach (array('product_id', 'single_id', 'gift_id', 'lp_id') as $key) {
        $out[$key] = integer($raw[$key] ?? 0, 0, 999999999);
    }
    $ids = array_filter(array($out['product_id'], $out['single_id'], $out['gift_id']));
    if (count(array_unique($ids)) !== count($ids)) { throw new \InvalidArgumentException('限定組、單顆與燭台必須是不同商品。'); }
    if ($out['enabled'] && (!$out['product_id'] || !$out['single_id'])) { throw new \InvalidArgumentException('啟用前請指定限定組與單顆商品。'); }
    if ($out['gift_enabled'] && !$out['gift_id']) { throw new \InvalidArgumentException('附燭台前請指定有庫存的燭台商品。'); }
    $out['shipping_promise'] = plain($raw['shipping_promise'] ?? '', 120, (bool) $out['shipping_enabled']);
    $out['shipping_scope'] = $raw['shipping_scope'] ?? 'unverified';
    if (!in_array($out['shipping_scope'], array('unverified', 'tw_bundle_only', 'tw_whole_order'), true)) { throw new \InvalidArgumentException('請選擇運送承諾範圍。'); }
    if ($out['shipping_enabled'] && (!$out['shipping_verified'] || $out['shipping_scope'] === 'unverified')) {
        throw new \InvalidArgumentException('含運需先完成台灣本島、離島與混合購物車運費實測，才能開啟承諾。');
    }
    $out['bundle_items'] = array();
    $lines = plain($raw['bundle_text'] ?? '', 1200, false);
    foreach (preg_split('/\R/u', $lines) as $line) {
        if (trim($line) !== '') { $out['bundle_items'][] = plain($line, 120); }
    }
    if (count($out['bundle_items']) > 10) { throw new \InvalidArgumentException('其他組合內容最多十項。'); }
    // Stock-controlled gifts, shipping and consultation have dedicated fields; do not duplicate promises here.
    foreach (array('minutes' => array(1, 120), 'count' => array(1, 10), 'days' => array(1, 365)) as $key => $range) {
        $out['consultation'][$key] = integer($raw['consultation'][$key] ?? 0, $range[0], $range[1]);
    }
    $out['consultation']['description'] = plain($raw['consultation']['description'] ?? '', 300, (bool) $out['consultation_enabled']);
    foreach (defaults() as $key => $default) {
        foreach (array('name' => 40, 'description' => 120) as $field => $max) {
            $out['names'][$key][$field] = plain($raw['names'][$key][$field] ?? '', $max);
        }
    }
    return $out;
}

function source($raw) {
    return is_string($raw) && in_array($raw, array('lp_direct', 'line_consult', 'line_direct'), true) ? $raw : 'unknown';
}

function attribution($raw) {
    $source = source($raw);
    return array('traffic_source' => $source, 'journey_path' => $source === 'line_consult' ? 'via_consult_link' : 'direct', 'consultation_status' => 'not_scheduled');
}

function names($config) {
    $out = defaults();
    foreach ($out as $key => $row) {
        foreach (array('name' => 40, 'description' => 120) as $field => $max) {
            try { $out[$key][$field] = plain($config['names'][$key][$field] ?? '', $max); }
            catch (\InvalidArgumentException $e) { /* Only labels may fall back. */ }
        }
    }
    return $out;
}

function offer($config, $gift_available, \DateTimeImmutable $now) {
    $out = array('offer_version' => (int) ($config['offer_version'] ?? 0), 'bundle_items' => array('希望之光∞頻率蠟燭 21 顆'),
        'gift_product_id' => 0, 'shipping_promise' => '', 'shipping_scope' => '', 'consultation' => null,
        'display_names' => names($config), 'captured_at' => $now->format(DATE_ATOM));
    foreach (($config['bundle_items'] ?? array()) as $line) { $out['bundle_items'][] = plain($line, 120); }
    if (!empty($config['gift_enabled']) && $gift_available && !empty($config['gift_id'])) {
        $out['gift_product_id'] = (int) $config['gift_id'];
        $out['bundle_items'][] = '玻璃燭台 1 個／組';
    }
    if (!empty($config['shipping_enabled']) && !empty($config['shipping_verified']) && in_array($config['shipping_scope'] ?? '', array('tw_bundle_only', 'tw_whole_order'), true)) {
        $out['shipping_promise'] = plain($config['shipping_promise'] ?? '', 120);
        $out['shipping_scope'] = $config['shipping_scope'];
    }
    if (!empty($config['consultation_enabled'])) {
        $c = $config['consultation'] ?? array();
        $out['consultation'] = array('minutes' => integer($c['minutes'] ?? 0, 1, 120), 'count' => integer($c['count'] ?? 0, 1, 10),
            'description' => plain($c['description'] ?? '', 300),
            'expires_at' => $now->modify('+' . integer($c['days'] ?? 0, 1, 365) . ' days')->format(DATE_ATOM));
    }
    return $out;
}

function mix_snapshot($quantities, $display_names) {
    $out = array();
    foreach (mix($quantities) as $key => $quantity) { $out[$key] = array('quantity' => $quantity, 'name' => $display_names[$key]['name']); }
    return $out;
}

function summary($mix, $offer) {
    $rows = array();
    foreach ($mix as $row) { if (!empty($row['quantity'])) { $rows[] = $row['name'] . ' × ' . $row['quantity']; } }
    $out = array('21 顆配置（每組）' => implode('、', $rows), '組合內容（每組）' => implode('、', $offer['bundle_items'] ?? array()));
    if (!empty($offer['shipping_promise'])) { $out['運送承諾'] = $offer['shipping_promise']; }
    if (!empty($offer['consultation'])) {
        $c = $offer['consultation'];
        $out['諮詢（每筆訂單）'] = $c['description'] . '｜' . $c['minutes'] . ' 分鐘／' . $c['count'] . ' 次｜期限 ' . $c['expires_at'];
    }
    return $out;
}
