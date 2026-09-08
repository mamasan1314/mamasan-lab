# 21 顆頻率蠟燭｜WooCommerce × LINE × CRM

狀態：**已製作本機工程候選與假資料預覽；未部署或修改 HopeBox／LINE，待 mamasan QC／QA。**
建立日期：2026-09-08（Asia/Taipei）  
交付鏈：Darren 製作 → mamasan QC／QA → Tiffany 決定營運內容與是否上線

## 目標

把現有蠟燭 Landing Page 從「只導到 LINE、後續靠人工」改為可追蹤的雙入口：

1. 已經知道怎麼選的人可直接在 WooCommerce 選滿 21 顆並結帳。
2. 不確定的人先到 LINE 預約 10 分鐘諮詢，諮詢後再回 WooCommerce 完成選款與結帳。
3. WooCommerce 保持交易與訂單正式主檔；既有 CRM 看板只讀取並呈現訂單摘要。
4. **售價、庫存、含運、贈品與十款款名全部做成 Tiffany 可自助修改的後台欄位**，
   改一次就全站同步，往後不需要為了調價或調庫存再走一次確認流程。

第 4 點是本案的最高驗收重點。Tiffany 在意的是 UI 好不好用，不是我們後面怎麼做；
把營運參數變成她按得動的欄位，等於一次解決之後所有的來回。詳見
Blueprint 第 2 節與驗收條件 10.1。

## 文件入口

接手先讀：[工作日誌索引](worklogs/WORKLOG.md) · [2026-09-08 收工紀錄與建議下一步](worklogs/WORKLOG-2026-09-08.md)。目前依 Darren 指示暫停施工。

本次施工入口：[第一輪施工交接與驗證邊界](IMPLEMENTATION-2026-09-08.md) · [可操作預覽](preview/index.html)。

線上入口：[階段驗收頁](https://hope-light-candle21-review.marianalin.chatgpt.site)（已依 Darren 明確授權公開，無須登入）。[發布與分享紀錄](REVIEW-SITE.md)。

**本次已依 Darren 指示暫時收工，先供 mamasan 檢視目前項目。** 工程尚未部署到 HopeBox；另已發布假資料驗收頁，不必一次驗收所有最終規格。後續自製程式以 repo 維護與回復，WordPress.com 權限不再是施工前提；顧客與訂單不放 Git。

| 文件／原始碼 | 用途 | 狀態 |
|---|---|---|
| [`../../blueprints/2026-09-08-蠟燭21-WooCommerce-LINE-CRM-blueprint.md`](../../blueprints/2026-09-08-蠟燭21-WooCommerce-LINE-CRM-blueprint.md) | 系統邊界、資料模型、顧客旅程與驗收條件 | 草稿 |
| [`../../plans/2026-09-08-蠟燭21-commerce-deployment-plan.md`](../../plans/2026-09-08-蠟燭21-commerce-deployment-plan.md) | 分階段施工、部署、驗證與回復 | 草稿；不可直接當上線授權 |
| [`DECISION-REGISTER.md`](./DECISION-REGISTER.md) | 本案已採預設、後台可自助欄位與仍需決定事項 | 待 QC |
| [`../../wp-plugins/hopelight-candle21-commerce/README.md`](../../wp-plugins/hopelight-candle21-commerce/README.md) | commerce 外掛、設定介面與測試指令 | 0.1.0 本機候選，未部署 |
| [`../../landing-pages/hopelight-candle21-lp.html`](../../landing-pages/hopelight-candle21-lp.html) | 現有 LP | v0.3；尚未上正式站 |
| [`../../DECISIONS.md`](../../DECISIONS.md) | HopeBox 長期技術決策 | D-001～D-006 |

## 現況一句話

已製作選款、結帳驗證、後台設定、短碼化 LP、快照與 CRM 讀取。35 項假資料測試與 Chromium
介面檢查通過；WordPress 整合、付款／庫存端到端、快取、LINE 與真人自助 UI 驗收仍待完成。

## 不在這一階段

- 不把 LINE 對話全文或 LINE user ID 寫進 CRM。
- 不啟用 LINE Messaging API、LIFF 或自動把 LINE 身分綁到 WooCommerce 顧客。
- 不做 Google Calendar API 與付款完成三路通知。
- 不導入 Airtable；D-002／D-003 仍有效。
- 不自行重寫購物車、金流、訂單或退款系統。
