<?php
if (!defined('ABSPATH')) { exit; }

/** Read stored snapshots only. Works even when the commerce plugin is disabled. */
function hopelight_crm_c21_item($item) {
    if ((string) $item->get_meta('_hopelight_c21_schema_version') !== '1') { return array(); }
    $mix = json_decode((string) $item->get_meta('_hopelight_c21_mix'), true);
    $offer = json_decode((string) $item->get_meta('_hopelight_c21_offer'), true);
    if (!is_array($mix) || !is_array($offer)) { return array('快照格式無法讀取，請開啟 Woo 訂單確認。'); }
    $text = array();
    foreach ($mix as $row) {
        if (is_array($row) && isset($row['name'], $row['quantity']) && is_string($row['name']) && is_int($row['quantity']) && $row['quantity'] > 0) {
            $text[] = $row['name'] . ' × ' . $row['quantity'];
        }
    }
    $lines = array('每組配置：' . implode('、', $text));
    $bundle = array_filter(is_array($offer['bundle_items'] ?? null) ? $offer['bundle_items'] : array(), 'is_string');
    if ($bundle) { $lines[] = '每組內容：' . implode('、', $bundle); }
    if (is_string($offer['shipping_promise'] ?? null) && $offer['shipping_promise'] !== '') { $lines[] = '運送：' . $offer['shipping_promise']; }
    $c = $offer['consultation'] ?? null;
    if (is_array($c) && isset($c['description'], $c['minutes'], $c['count'], $c['expires_at'])
        && is_string($c['description']) && is_string($c['expires_at']) && is_int($c['minutes']) && is_int($c['count'])) {
        $lines[] = '諮詢（每筆訂單）：' . $c['description'] . '｜' . $c['minutes'] . ' 分鐘／' . $c['count'] . ' 次｜期限 ' . $c['expires_at'];
    }
    return $lines;
}
function hopelight_crm_c21_source($order) {
    $raw = $order->get_meta('_hopelight_c21_traffic_source');
    if (!$raw) { return ''; }
    $labels = array('lp_direct' => 'LP 直接訂購', 'line_direct' => 'LINE 直接訂購', 'line_consult' => 'LINE 諮詢連結', 'unknown' => '來源不明');
    $label = $labels[is_string($raw) ? $raw : 'unknown'] ?? '來源不明';
    $path = $order->get_meta('_hopelight_c21_journey_path');
    return $label . ($path === 'via_consult_link' ? '｜由諮詢連結進入' : '｜直接選購路徑') . '｜諮詢狀態未追蹤';
}
function hopelight_crm_c21_render($order) {
    $has = false;
    foreach ($order['items'] as $item) {
        if (empty($item['candle21'])) { continue; }
        $has = true;
        echo '<details><summary>21 顆配置與下單優惠</summary>';
        foreach ($item['candle21'] as $line) { echo '<p>' . esc_html($line) . '</p>'; }
        echo '</details>';
    }
    if ($has && !empty($order['candle21_source'])) { echo '<small>' . esc_html($order['candle21_source']) . '</small>'; }
}
