# hopelight-candle21-commerce

狀態：**source scaffold only；目前沒有可安裝 PHP 外掛，也沒有修改正式站。**

未來此處只放「21 顆限定組」需要的 WooCommerce glue code：十款數量欄位、合計 21 的
伺服器驗證、cart／order item meta、source／consult path 與 feature flag。

不在此實作購物車、金流、訂單、退款、LINE Bot、預約或新的 CRM 資料庫；這些分別沿用
WooCommerce、LINE OA、既有預約流程與 `hopelight-crm-board`。

開始寫 PHP 前必須先通過部署計畫 Phase 0，確認 WordPress／WooCommerce／PHP／HPOS、
付款 gateway、備份、同 slug 更新能力與主機檔案復原入口。

