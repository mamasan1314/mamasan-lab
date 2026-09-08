# hopelight-candle21-commerce

狀態：**0.1.0 本機工程候選；已有 PHP、介面、測試與 ZIP，尚未部署。**

本次實作與限制詳見[施工交接](../../projects/2026-09-candle21-commerce/IMPLEMENTATION-2026-09-08.md)，可操作的[假資料預覽](../../projects/2026-09-candle21-commerce/preview/index.html)不會寫入正式站。

以下原 scaffold 規格作為開發邊界保留，不代表每項驗收已完成。

未來此處只放「21 顆限定組」需要的 WooCommerce glue code：十款數量欄位、合計 21 的
伺服器驗證、cart／order item meta、source／consult path 與 feature flag。

另含本案的**自助維護介面**（C21-P08）：一個 wp-admin 設定頁（十款顯示名稱與描述、
組合內容、含運承諾、諮詢條件），以及給 LP 讀值的短碼（組售價、單顆價、差額、庫存／
售罄、含運承諾、組合內容、十款款名），儲存後自動清除相關頁面快取。外掛**不保存**
售價、庫存與運費，一律即時向 WooCommerce 讀取——Tiffany 改 Woo 商品，前台就跟著變，
不需要工程協助。

三條不可退讓的規則：

- **優惠快照**：下單當下把組合內容、是否附燭台、含運承諾、諮詢條件與款名固化進 order
  item meta。後台設定只影響新訂單，永不追溯改寫舊訂單（C21-P10）。
- **fail closed**：承諾類設定讀不到就隱藏並告警，**不得**退回「附燭台」「全台含運」
  這類預設值（C21-P11）。
- **來源三分**：`traffic_source`／`journey_path`／`consultation_status` 各自獨立；
  點過諮詢連結不等於諮詢完成，MVP 不得輸出「已諮詢」（C21-P12）。

不在此實作購物車、金流、訂單、退款、LINE Bot、預約或新的 CRM 資料庫；這些分別沿用
WooCommerce、LINE OA、既有預約流程與 `hopelight-crm-board`。

本次依使用者指示先收在本機候選，交 mamasan 檢視。後續自製程式以 repo 保留前版，準備 wp-admin 可操作的回復程序；WordPress.com 權限不再是施工前提。傳統購物車／結帳已唯讀確認；本版不支援 Cart／Checkout Blocks，限定組 Store API 會明確拒絕。

短碼：`[hopelight_c21 field="price"]`，field 支援 `price`、`single_price`、`single_total`、`difference`、`stock`、`names`、`bundle`、`shipping`、`consultation`、`cta`。

在 website-admin 執行：

```powershell
php tests/candle21/run.php
node scripts/build-candle21-template.cjs
php tests/candle21/preview.php
node tests/candle21/browser.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File wp-plugins/pack.ps1 -PluginName hopelight-candle21-commerce
```

若 PHP 不在 PATH，本次可用 `$env:TEMP/hopebox-c21-php/php.exe`；換主機需提供 PHP。測試不含真實顧客資料。LP 子主題在 `wp-themes/hopebox-candle21-child/`；切換前需驗證現有 Hello Elementor 設定及全站。

本版 `tw_bundle_only` 需分開結帳；尚未完成混購只免限定組的運費拆包。主機／CDN purge、Woo 庫存併發與付款取消退款仍待真實整合測試。

緊急停用先關選購開關；若停用整個外掛，必須先把目標商品改為草稿，因 PHP 防護也會停止。設定會保留前一版 option，但不提供一鍵重新公開舊促銷承諾。
