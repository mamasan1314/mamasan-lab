# 21 顆頻率蠟燭 commerce｜部署計畫

文件狀態：`v0.1｜草稿／dry-run only`  
日期：`2026-09-08（Asia/Taipei）`  
重要：**這份計畫不是正式站或 LINE 的寫入授權。**

## 1. 部署原則

- WooCommerce 繼續負責商品、購物車、結帳、付款與訂單。
- 先本機／測試資料驗證，再做正式站預演，最後才取得逐項寫入授權。
- 每一步都要有退出條件與回復方式；LINE 與網站分開部署、分開驗證。
- 正式發布前由 mamasan 完成 QC／QA，Tiffany 確認產品與營運承諾。

## 2. Phase 0｜關閉決策與唯讀基線

### 2.1 必須取得的答案

- 關閉 `C21-Q01`～`C21-Q08`。
- 確認 LP、Woo 商品、LINE 回覆與諮詢流程的負責人。
- 確認本次授權是否包含：商品建立、外掛安裝／更新、CRM 更新、LP 上線、LINE 設定。

### 2.2 唯讀查核

1. 執行網站 access audit，確認登入與權限，結果不得包含個資。
2. 確認 WordPress、WooCommerce、PHP 版本與 HPOS 狀態。
3. 確認可用付款 gateway；至少完成一種測試付款／銀行轉帳流程。
4. 確認 WooCommerce Order Attribution 是否存在與可讀。
5. 匯出並版控 WPCode 的 20 個片段，先排除與 cart／checkout 衝突的全站程式碼。
6. 確認主機備份與還原點可用。
7. 重新預演外掛上傳、同 slug 更新與停用能力；**不得用正式功能外掛當探針**。

完成條件：有日期化、非敏感的基線報告；同 slug 更新能力與緊急復原入口已確認。

## 3. Phase 1｜本機 scaffold 與測試

預定原始碼位置：`wp-plugins/hopelight-candle21-commerce/`。

1. 建立最小外掛 header、feature flag 與指定商品 allowlist。
2. 建立十款 schema 與顯示名稱 mapping。
3. 建立 Woo 商品欄位、即時合計與無 JavaScript 降級。
4. 實作 cart／checkout server-side validation。
5. 寫入 cart item data 與 order item meta，顯示於購物車、結帳、Email、後台訂單。
6. 以假 product／order／customer 資料測試，不使用正式顧客資料。
7. 增加自動測試：合法總數、20／22、負數、小數、缺欄、未知 key、payload 竄改、
   其他商品不受影響。

完成條件：所有驗收案例在本機通過；尚未產生正式站變更。

## 4. Phase 2｜CRM 與來源欄位

1. 擴充 `hopelight-crm-board`，只讀取本案 order item／order meta。
2. 顯示十款摘要、source、consult path 與訂單連結。
3. 對沒有本案 meta 的歷史／其他商品訂單正常降級，不顯示 PHP warning。
4. 用假資料完成權限、escaping、CSV 邊界與 1000 筆上限回歸測試。

完成條件：CRM 失效不影響結帳；只有 `manage_woocommerce` 可見。

## 5. Phase 3｜正式站預演與部署

### 5.1 部署前閘門

- mamasan QC／QA：`PASS`
- Tiffany 產品／流程確認：`PASS`
- 備份與復原入口：`PASS`
- 外掛 ZIP 結構（正斜線、單一根目錄）：`PASS`
- 同 slug 更新或替代部署路徑：`PASS`
- 正式寫入授權：`PASS`

任一項不是 PASS 就停止，不以「應該沒問題」代替。

### 5.2 建議順序

1. 建立 WooCommerce **草稿**商品與 SKU，不公開。
2. 部署 commerce 外掛但保持 feature flag 關閉。
3. 啟用外掛，檢查後台、首頁、既有商品與 PHP error log。
4. 對草稿商品開啟 feature flag，以管理員／測試帳號走購物車與結帳。
5. 以可取消／可辨識的測試訂單驗證合法與非法配置。
6. 部署 CRM 讀取欄位，驗證測試訂單摘要。
7. 重新檢查既有商品、付款 gateway、Email 與行動裝置結帳。

完成條件：網站端端到端通過，但商品與 LP 仍未公開。

## 6. Phase 4｜LINE 與 LP

1. mamasan 核准「蠟燭」關鍵字、歡迎訊息與兩個按鈕文案。
2. 在 LINE OA Manager 寫入設定；保存不含顧客資料的前後差異與回復文字。
3. 用測試帳號實際輸入「蠟燭」，確認兩個連結與 source code。
4. 將 LP CTA 改為「直接訂購」與「先做 10 分鐘諮詢」。
5. 先以 private／unlisted 方式驗證 iOS Safari、Android Chrome、LINE 內建瀏覽器。
6. 走兩條完整旅程：LP 直接買；LP → LINE → Woo 買。

完成條件：兩條旅程的商品內容、價格、配置、來源、訂單與 CRM 一致。

## 7. Phase 5｜小量上線

1. 設定首批 WooCommerce 組數庫存。
2. 公開 Woo 商品與 LP，更新固定 URL／分享卡。
3. 先以內部或小量流量觀察 24 小時。
4. 檢查錯誤、放棄結帳、非法配置、庫存、Email、LINE 回覆與 CRM。
5. mamasan 確認後才擴大投放；不得先把草稿描述成 Tiffany 已核准成品。

## 8. 回復計畫

| 問題 | 第一動作 | 回復 |
|---|---|---|
| 選款欄位或結帳異常 | 關閉 commerce feature flag | LP 主 CTA 暫時改回 LINE；保留既有 Woo 訂單 |
| CRM 顯示異常 | 停用新欄位或回復前版 CRM | Woo 訂單頁仍是正式工作入口 |
| LINE 回覆錯誤 | 還原先前核准訊息 | 不刪好友、不碰聊天內容 |
| LP 異常 | 回復上一版 HTML／公開版本 | Woo 商品可保持草稿或直接連結暫停 |
| 外掛啟用造成 fatal error | 復原模式／主機檔案管理入口停用資料夾 | 使用部署前備份；不得依賴 wp-admin 仍可登入 |
| 外掛無法刪除 | 先停用，不以刪除作為主要 rollback | 經主機檔案管理員／主機商處理殘留 |

## 9. 部署收據

每次正式寫入後，在 repo 保存日期、操作者、版本／commit、影響範圍、驗證結果與回復狀態。
不得保存顧客姓名、Email、電話、地址、訂單明細、Cookie、Token 或 LINE 對話。真實訂單
只記遮蔽測試代號；完整資料留在 WooCommerce。

## 10. 後續而非 MVP

- LINE Messaging API／LIFF 與 LINE user ID 綁定。
- 自動 10 分鐘預約與 Google Calendar。
- 付款完成後 LINE／Email／Calendar 三路通知。
- BACS 匯款回報、核帳期限、verification marker 與例外佇列。

以上應在 MVP 有真實營運資料後另開決策與部署計畫，不自動沿用大 Blueprint 的全部範圍。

