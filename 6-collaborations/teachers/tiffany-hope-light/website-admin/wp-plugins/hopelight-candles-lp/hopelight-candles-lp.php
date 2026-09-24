<?php
/**
 * Plugin Name: 希望之光 21 顆頻率蠟燭頁
 * Description: 在 /candles 提供 21 顆頻率蠟燭限定組的獨立頁面。頁面與圖片都在外掛內；停用外掛即撤下頁面。
 * Version: 0.1.0
 * Author: Darren
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

// page.html 與 assets/ 由 `npm run candles-lp:build` 從 landing-pages/ 複製進來。
// 正本是 website-admin/landing-pages/hopelight-candle21-lp.html，不要在這裡改。

// 在 redirect_canonical（priority 10）之前接手，WordPress 才不會把 /candles 當 404 猜去別頁。
add_action('template_redirect', 'hopelight_candles_lp_render', 0);

function hopelight_candles_lp_render()
{
    $request_path = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    $page_path = trim((string) wp_parse_url(home_url('/candles'), PHP_URL_PATH), '/');
    if ($request_path !== $page_path) {
        return;
    }

    $file = __DIR__ . '/page.html';
    if (!is_readable($file)) {
        return; // 檔案缺漏時照常走 WordPress 的 404，不輸出半頁。
    }

    $body = (string) file_get_contents($file);
    // 頁面檔是給 Artifact 用的片段，<title> 寫在內文；這裡改由 <head> 提供完整標題。
    $without_title = preg_replace('#<title>.*?</title>\s*#su', '', $body, 1);
    if (is_string($without_title)) {
        $body = $without_title;
    }
    $assets = plugins_url('assets/candle21/', __FILE__);
    $body = str_replace('"assets/candle21/', '"' . $assets, $body);

    $title = '21 顆頻率蠟燭限定組｜希望之光 Hope Light';
    $description = '10 款頻率蠟燭任選 21 顆，附 10 分鐘靈魂藍圖諮詢，全台含運 NT$2,980。限量製作，售完即止。';
    $url = home_url('/candles/');
    $image = $assets . 'og-candles.jpg';

    status_header(200);
    header('Content-Type: text/html; charset=utf-8');

    echo "<!doctype html>\n<html lang=\"zh-Hant-TW\">\n<head>\n";
    echo "<meta charset=\"utf-8\">\n";
    echo "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n";
    echo '<title>' . esc_html($title) . "</title>\n";
    echo '<meta name="description" content="' . esc_attr($description) . "\">\n";
    echo '<link rel="canonical" href="' . esc_url($url) . "\">\n";
    echo "<meta property=\"og:type\" content=\"website\">\n";
    echo '<meta property="og:title" content="' . esc_attr($title) . "\">\n";
    echo '<meta property="og:description" content="' . esc_attr($description) . "\">\n";
    echo '<meta property="og:url" content="' . esc_url($url) . "\">\n";
    echo '<meta property="og:image" content="' . esc_url($image) . "\">\n";
    echo "<meta property=\"og:image:width\" content=\"1200\">\n";
    echo "<meta property=\"og:image:height\" content=\"630\">\n";
    echo "<meta name=\"twitter:card\" content=\"summary_large_image\">\n";
    // Artifact 外框原本提供的最小重設；頁面自己的樣式在 page.html 裡。
    echo "<style>body{margin:0}img{max-width:100%}</style>\n";
    echo "</head>\n<body>\n";
    echo $body; // 內容來自外掛自己的檔案，沒有任何使用者輸入。
    echo "\n</body>\n</html>\n";
    exit;
}
