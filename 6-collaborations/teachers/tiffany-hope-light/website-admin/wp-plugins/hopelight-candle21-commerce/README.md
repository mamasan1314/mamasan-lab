# hopelight-candle21-commerce

狀態：**source scaffold only；目前沒有可安裝 PHP 外掛，也沒有修改正式站。**

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

開始寫 PHP 前必須先通過部署計畫 Phase 0，確認 WordPress／WooCommerce／PHP／HPOS、
付款 gateway、備份、同 slug 更新能力與主機檔案復原入口。

