# 2026-08-24 HopeBox × LINE 後台工作交接

這份文件供未來 Codex 工作階段或協作者快速接回今天的網站與 LINE 官方帳號管理脈絡。它只記錄可安全留在 repository 的事實、工具與下一步，不包含帳號密碼、Cookie、客戶資料、聊天室內容、付款資料、Channel Secret 或 Access Token。

## 今日目標與結果

今日完成的工作：

1. 驗證 HopeBox WordPress 後台可登入、可重用本機工作階段，並完成唯讀權限稽核。
2. 確認官網目前導向的官方 LINE，將公開 LINE ID 與加好友網址寫入品牌事實文件。
3. 建立 LINE Official Account Manager 的專用本機登入工作階段與可重用唯讀稽核工具。
4. 唯讀檢視 LINE 到官網的購物與預約旅程，交叉比對四項商品、服務名稱、價格與導流入口。
5. 產出可直接提供 Tiffany 檢視的一致性報告。

外部系統變更狀態：今日沒有修改網站頁面、商品、價格、LINE 訊息、圖文選單、歡迎訊息、商業簡介、權限或 Messaging API 設定。所有實際寫入都只發生在 repository 的文件與本機管理工具。

## 已建立的長期入口

### HopeBox 網站

- 公開網站：`https://hopebox.com.tw/`
- 管理說明：[`../website-admin/README.md`](../website-admin/README.md)
- 共用登入入口：`website-admin/lib/hopebox-session.cjs`
- 唯讀稽核：

  ```powershell
  cd 6-collaborations/teachers/tiffany-hope-light/website-admin
  npm ci
  npm run audit
  ```

- Windows 本機工作階段：`%LOCALAPPDATA%\mamasan-lab\hopebox-browser-profile`
- 2026-08-24 實測：首次憑證登入成功，後續可用 `cached-session` 重入。
- 稽核當時可見 WordPress、Elementor、WooCommerce；頁面列表 11 筆、商品列表 9 筆。數量只代表當時畫面，不是永久總數。

### LINE 官方帳號

- 管理後台：`https://manager.line.biz/account/@290ykfry`
- 對外 LINE ID：`@happy139`
- repository 採用的標準加好友網址：`https://lin.ee/vG7eI1Dv`
- 管理說明：[`../line-admin/README.md`](../line-admin/README.md)
- 共用登入入口：`line-admin/lib/line-oa-session.cjs`
- 第一次或工作階段失效時：

  ```powershell
  cd 6-collaborations/teachers/tiffany-hope-light/line-admin
  npm ci
  npm run login
  npm run audit
  ```

- 平常唯讀確認：

  ```powershell
  cd 6-collaborations/teachers/tiffany-hope-light/line-admin
  npm run audit
  ```

- Windows 本機工作階段：`%LOCALAPPDATA%\mamasan-lab\hope-light-line-oa-browser-profile`
- 2026-08-24 實測：可用 `cached-session` 重入，無頭與可見模式稽核都成功。
- 可見功能入口包括主頁、分析、聊天、商業簡介、LINE VOOM、群發訊息、自動回應、圖文訊息、優惠券、歡迎訊息、圖文選單、受眾與設定。
- 自動化管理目前依靠本機瀏覽器工作階段，不需要為了讓 Codex 協作而啟用 Messaging API。若未來要做 CRM 串接、Webhook、機器人或外部系統自動回覆，需另外評估並取得明確授權。

### 執行環境注意事項

- 兩套工具需求為 Node.js 20 以上，以及 Chrome、Edge 或 Chromium。
- 本次 Windows 工作環境沒有可直接使用的全域 Node／npm，因此暫時使用系統暫存目錄中的 Node.js v24.19.0 與 npm 11.17.0 完成安裝和稽核。
- 系統暫存檔不是長期依賴。未來新工作階段若找不到 `node` 或 `npm`，應先提供 Node.js 20 以上環境，再依各 README 執行 `npm ci`。

## 今日確認的公開連結關係

- 官網「老師介紹頁」的「預約與老師對話」按鈕會前往 `https://lin.ee/vG7eI1Dv`。
- LINE 圖文選單的「推薦好友」使用另一個加好友短連結；兩個短連結經確認都導向相同官方帳號。
- LINE 圖文選單的「探索服務」會前往 `https://hopebox.com.tw/#hl-booking-form`。
- LINE 的「希望選品」會傳送「產品介紹」，再顯示四張商品卡；四張卡都能到達官網商品頁並加入購物車。

## 唯讀稽核摘要

### 顧客購物旅程

```text
加入 LINE
  → 圖文選單「希望選品」
  → 觸發「產品介紹」
  → 四張商品卡
  → 「了解更多」
  → HopeBox 商品頁
  → 加入購物車／結帳
```

此流程可用，但不是直接購物入口。LINE 商業簡介的官網名稱與網址欄位目前為空，加入好友歡迎訊息也沒有商品或官網選購連結。

### 四個 LINE 商品卡對應

| LINE | 官網 | 2026-08-24 官網價格 | 已知差異 |
|---|---|---:|---|
| 小貴人 | 靈核 Aura Core－小貴人 | NT$16,800 | `幸運` 與 `777 機遇` 用語不同 |
| 諧和共振機 | 協和共振機 | NT$29,800 | 正式名稱不同；LINE 的設備定位比官網更強 |
| 頻率蠟燭 | 頻率蠟燭 | NT$139–2,980 | 大致一致；LINE 未顯示價格 |
| 大貴人 | 靈域 Aura Dome－大貴人 | NT$24,900 | LINE 8 種模式、官網 9 種；模式名稱也有差異 |

官網四項商品都公開且可加入購物車。LINE 商品卡目前不顯示價格，只提供「了解更多」。

### 預約流程差異

- LINE 歡迎訊息：`腦意識調頻＋天賦人格解讀`、120 分鐘、優惠 NT$2,980／原價 NT$3,600、外部表單與人工付款流程。
- HopeBox 預約表單：`腦意識調頻`、120 分鐘、NT$3,600、WooCommerce 結帳。
- 官網另有多個服務／課程商品；部分公開名稱帶有「改過名／未改名」等內部式字樣，需轉為顧客語言。

付款細節不應抄入 repository；後續只需處理「流程是否一致」與「哪一邊是正式版本」。

## 等待 Tiffany 決定

1. `協和共振機` 或 `諧和共振機` 的正式名稱。
2. 120 分鐘方案的正式服務名稱、是否包含天賦人格解讀、現行價格與優惠條件。
3. 預約成交應以 HopeBox WooCommerce 或外部表單／人工付款為主要流程。
4. 小貴人與大貴人的正式模式名稱、數量與順序。
5. LINE 圖文選單是否改成直接的「官網選購／立即購買」，以及是否直接前往官網選品頁。
6. LINE 商品卡是否顯示價格，或統一寫「最新價格以官網為準」。

Tiffany-facing 完整報告：[`../reports/2026-08-24-line-website-consistency-report.md`](../reports/2026-08-24-line-website-consistency-report.md)

## 下次重入順序

1. 先讀 [`../README.md`](../README.md)、[`../product-facts.md`](../product-facts.md) 與本文件。
2. 涉及官網前，完整讀取 [`../website-admin/README.md`](../website-admin/README.md)；先執行唯讀 `npm run audit`。
3. 涉及 LINE 前，完整讀取 [`../line-admin/README.md`](../line-admin/README.md)；先執行唯讀 `npm run audit`。
4. 取得 Tiffany 對上述決策的回覆後，先整理一份「兩邊同步修改清單」，再依明確授權執行。
5. 修改後必須重新走一次公開顧客流程，確認連結、名稱、價格、按鈕與結帳結果。

## 安全與管理界線

- repository 只留公開帳號識別、公開網址、工具與非敏感稽核結論。
- 不輸出或提交密碼、Cookie、客戶名單、聊天內容、付款資訊、Channel Secret 或 Access Token。
- 唯讀盤點可直接進行；群發、客戶回覆、商品／價格修改、權限、帳務、Messaging API 與刪除操作需依使用者明確授權。
- 網站批次修改後要驗證公開頁面；LINE 修改後要重新檢查實際呈現與每一個按鈕動作。

