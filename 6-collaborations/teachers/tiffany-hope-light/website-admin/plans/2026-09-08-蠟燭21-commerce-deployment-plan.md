# 21 顆頻率蠟燭 commerce｜部署計畫

文件狀態：`v0.2｜草稿／dry-run only`  
日期：`2026-09-08（Asia/Taipei）`  
重要：**這份計畫不是正式站或 LINE 的寫入授權。**

> v0.2 變更：售價、含運、庫存與贈品不再是 Phase 0 的閘門，改為後台自助欄位；
> 新增 Phase 1 的後台設定頁與短碼、Phase 3 的「模擬 Tiffany」自助 UI 實測，
> 以及 Phase 4 的 LP 移入 WordPress。

## 1. 部署原則

- WooCommerce 繼續負責商品、購物車、結帳、付款與訂單。
- **會變的營運參數一律做成後台欄位，不寫死在頁面上**（C21-P08）。任何需要工程協助
  才能改價、改庫存、改贈品的做法，視為未完成，不是可接受的暫時方案。
- 先本機／測試資料驗證，再做正式站預演，最後才取得逐項寫入授權。
- 每一步都要有退出條件與回復方式；LINE 與網站分開部署、分開驗證。
- 正式發布前由 mamasan 完成 QC／QA，Tiffany 確認 UI 好不好用。

## 2. Phase 0｜技術唯讀基線

### 2.1 需要的答案

- 確認本次授權是否包含：商品建立、外掛安裝／更新、CRM 更新、LP 上線、LINE 設定。
- 確認 LP、Woo 商品、LINE 回覆與諮詢流程的負責人。
- `C21-Q05`（可用付款方式）在本階段以技術查核回答。
- `C21-Q03`／`C21-Q06`～`Q08` 不擋本階段，最遲在 Phase 4 前關閉。
- **售價、含運、燭台、庫存與諮詢期限不在本階段詢問**，依 `C21-A01`～`A06` 以出廠值
  進行，並在 Phase 1 做成後台欄位。

### 2.2 唯讀查核

1. 執行網站 access audit，確認登入與權限，結果不得包含個資。
2. 確認 WordPress、WooCommerce、PHP 版本與 HPOS 狀態。
3. 確認可用付款 gateway；至少完成一種測試付款／銀行轉帳流程。
4. 確認 WooCommerce Order Attribution 是否存在與可讀；若可用，依 Blueprint 第 6 節
   與 `_hopelight_c21_source` 分工，不互相覆蓋。
5. **確認子佈景主題是否存在、能否新增頁面範本與註冊短碼**（C21-P09 的前提）。
6. 匯出並版控 WPCode 的 20 個片段，先排除與 cart／checkout 衝突的全站程式碼。
7. 確認主機備份與還原點可用。
8. 重新預演外掛上傳、同 slug 更新與停用能力；**不得用正式功能外掛當探針**。

完成條件：有日期化、非敏感的基線報告；同 slug 更新能力、子佈景主題可用性與緊急復原
入口已確認。

## 3. Phase 1｜本機 scaffold、後台設定頁與測試

預定原始碼位置：`wp-plugins/hopelight-candle21-commerce/`。

1. 建立最小外掛 header、feature flag 與指定商品 allowlist。
2. 建立十款 schema：ASCII key 固定於程式碼，顯示名稱與描述存 option。
3. **建立 wp-admin 設定頁**（權限 `manage_woocommerce`）：
   - 「十款」：一頁十列，key 唯讀，顯示名稱與描述可編輯。
   - 「組合內容」：贈品項目可新增／編輯／整項關閉（玻璃燭台即為其中一項）。
   - 「諮詢」：10 分鐘諮詢說明與使用期限。
   - 所有欄位有中文說明、型別驗證與存檔前的錯誤提示；留白時退回出廠預設。
4. **建立短碼**供 LP 讀取：組售價、單顆售價、差額（自動計算，不寫死 61）、
   庫存／售罄狀態、含運標示、組合內容清單、十款款名。短碼失效時輸出保守備援文字。
5. 建立 Woo 商品欄位、即時合計、「還差幾顆」提示與無 JavaScript 降級。
6. 實作 cart／checkout server-side validation。
7. 寫入 cart item data 與 order item meta，並處理 hidden meta 的顯示
   （`woocommerce_order_item_display_meta_key`／`woocommerce_display_item_meta`），
   確認顯示於購物車、結帳、Email、後台訂單。
8. 以假 product／order／customer 資料測試，不使用正式顧客資料。
9. 自動測試：合法總數、20／22、負數、小數、缺欄、未知 key、payload 竄改、
   其他商品不受影響、**後台改值後短碼輸出同步**、**後台欄位填錯被擋下**。

完成條件：Blueprint 第 10.1 與 10.2 節的所有驗收案例在本機通過；尚未產生正式站變更。

## 4. Phase 2｜CRM 與來源欄位

1. 擴充 `hopelight-crm-board`，只讀取本案 order item／order meta。
2. 顯示十款摘要、source、consult path 與訂單連結。
3. 對沒有本案 meta 的歷史／其他商品訂單正常降級，不顯示 PHP warning。
4. 顯示名稱以**下單當下**保存的值呈現，不受後台改名影響。
5. 用假資料完成權限、escaping、CSV 邊界與 1000 筆上限回歸測試。

完成條件：CRM 失效不影響結帳；只有 `manage_woocommerce` 可見。

## 5. Phase 3｜正式站預演與自助 UI 實測

### 5.1 部署前閘門

- mamasan QC／QA：`PASS`
- 備份與復原入口：`PASS`
- 外掛 ZIP 結構（正斜線、單一根目錄）：`PASS`
- 同 slug 更新或替代部署路徑：`PASS`
- 正式寫入授權：`PASS`

任一項不是 PASS 就停止，不以「應該沒問題」代替。

### 5.2 建議順序

1. 建立 WooCommerce **草稿**商品與 SKU，不公開；填入 `C21-A01`～`A04` 出廠值。
2. 部署 commerce 外掛但保持 feature flag 關閉。
3. 啟用外掛，檢查後台、首頁、既有商品與 PHP error log。
4. 對草稿商品開啟 feature flag，以管理員／測試帳號走購物車與結帳。
5. 以可取消／可辨識的測試訂單驗證合法與非法配置。
6. 部署 CRM 讀取欄位，驗證測試訂單摘要。
7. 重新檢查既有商品、付款 gateway、Email 與行動裝置結帳。

### 5.3 自助 UI 實測（本階段的主要驗收）

由 mamasan 模擬 Tiffany，**不看文件、無人從旁指導**，在 wp-admin 完成三件事：

1. 把 21 顆組售價改成另一個數字。
2. 把庫存組數改成另一個數字，並試一次改成 0。
3. 把「玻璃燭台」這項贈品整項關掉。

每一件做完後檢查 Woo 商品頁、購物車、結帳、訂單 Email 是否同步（LP 於 Phase 4 併入
檢查）。**任何一件需要開口問，或有任何一處沒跟著變，本階段不通過**，回 Phase 1 修
UI，不以「教她一次就好」帶過。完成後把值改回出廠設定。

完成條件：網站端端到端通過、自助 UI 實測通過，但商品與 LP 仍未公開。

## 6. Phase 4｜LP 移入 WordPress、LINE 與雙入口

### 6.1 LP 移入 WordPress

1. 依 D-001 實作方式第 1 順位，把 `hopelight-candle21-lp.html` 做成子佈景主題頁面範本。
2. 把頁面上寫死的商業數字全部換成 Phase 1 的短碼：組售價（2 處）、單顆價（2 處）、
   差額（原本寫死的「61 元」改為自動計算）、玻璃燭台、全台含運、限量／售罄文案。
3. 移除頁首「內部草稿 v0.3」橫幅（LP 第 223 行）。
4. 更新 `landing-pages/README.md`：正式頁在 WordPress，Artifact 連結降為**視覺定稿
   審閱用**。同時註明 **Artifact 版不會跟著後台變動**，價格以網站為準，避免日後有人
   從舊連結讀到過期價格。

### 6.2 LINE 與雙入口

1. mamasan 核准「蠟燭」關鍵字、歡迎訊息與兩個按鈕文案（關閉 `C21-Q07`）。
2. 在 LINE OA Manager 寫入設定；保存不含顧客資料的前後差異與回復文字。
3. 用測試帳號實際輸入「蠟燭」，確認兩個連結與 source code。
4. 將 LP CTA 改為「直接訂購」與「先做 10 分鐘諮詢」，主次依 `C21-Q03`。
5. 先以 private／unlisted 方式驗證 iOS Safari、Android Chrome、LINE 內建瀏覽器。
6. 走兩條完整旅程：LP 直接買；LP → LINE → Woo 買。
7. **重跑 5.3 的自助實測，這次含 LP**：後台改一次價格，確認 LP 同步。

完成條件：兩條旅程的商品內容、價格、配置、來源、訂單與 CRM 一致，且價格一致是
**自動同步**的結果，不是人工比對過。

## 7. Phase 5｜小量上線

1. 確認 `C21-Q09`（電子發票）與 `C21-Q10`（退換貨政策）已有可對外的文字。
2. 設定首批 WooCommerce 組數庫存。
3. 公開 Woo 商品與 LP，更新固定 URL／分享卡。
4. 交付 Tiffany 一頁「你可以自己改的東西在哪裡」對照表（即 Blueprint 第 2.1 節），
   不需要她回覆，只是讓她知道欄位在哪。
5. 先以內部或小量流量觀察 24 小時。
6. 檢查錯誤、放棄結帳、非法配置、庫存、Email、LINE 回覆與 CRM。
7. mamasan 確認後才擴大投放；不得先把草稿描述成 Tiffany 已核准成品。

## 8. 回復計畫

| 問題 | 第一動作 | 回復 |
|---|---|---|
| 選款欄位或結帳異常 | 關閉 commerce feature flag | LP 主 CTA 暫時改回 LINE；保留既有 Woo 訂單 |
| 後台設定被改壞、前台顯示異常 | 設定頁「回復出廠預設」 | option 有前一版備份；不影響既有訂單 |
| 短碼輸出錯誤或空白 | 短碼降級為靜態備援文字 | 修好前 LP 仍可導向 Woo 商品頁 |
| CRM 顯示異常 | 停用新欄位或回復前版 CRM | Woo 訂單頁仍是正式工作入口 |
| LINE 回覆錯誤 | 還原先前核准訊息 | 不刪好友、不碰聊天內容 |
| LP 異常 | 回復上一版頁面範本 | Woo 商品可保持草稿或直接連結暫停 |
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
