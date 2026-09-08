# 21 顆頻率蠟燭｜WooCommerce × LINE × CRM

狀態：**工程規劃草稿；未修改 HopeBox、WooCommerce 或 LINE。**  
建立日期：2026-09-08（Asia/Taipei）  
交付鏈：Darren 製作 → mamasan QC／QA → Tiffany 決定營運內容與是否上線

## 目標

把現有蠟燭 Landing Page 從「只導到 LINE、後續靠人工」改為可追蹤的雙入口：

1. 已經知道怎麼選的人可直接在 WooCommerce 選滿 21 顆並結帳。
2. 不確定的人先到 LINE 預約 10 分鐘諮詢，諮詢後再回 WooCommerce 完成選款與結帳。
3. WooCommerce 保持交易與訂單正式主檔；既有 CRM 看板只讀取並呈現訂單摘要。

## 文件入口

| 文件／原始碼 | 用途 | 狀態 |
|---|---|---|
| [`../../blueprints/2026-09-08-蠟燭21-WooCommerce-LINE-CRM-blueprint.md`](../../blueprints/2026-09-08-蠟燭21-WooCommerce-LINE-CRM-blueprint.md) | 系統邊界、資料模型、顧客旅程與驗收條件 | 草稿 |
| [`../../plans/2026-09-08-蠟燭21-commerce-deployment-plan.md`](../../plans/2026-09-08-蠟燭21-commerce-deployment-plan.md) | 分階段施工、部署、驗證與回復 | 草稿；不可直接當上線授權 |
| [`DECISION-REGISTER.md`](./DECISION-REGISTER.md) | 本案已採預設與待 mamasan／Tiffany 決定事項 | 待 QC |
| [`../../wp-plugins/hopelight-candle21-commerce/README.md`](../../wp-plugins/hopelight-candle21-commerce/README.md) | 未來外掛原始碼邊界 | 只有 scaffold，尚無可安裝外掛 |
| [`../../landing-pages/hopelight-candle21-lp.html`](../../landing-pages/hopelight-candle21-lp.html) | 現有 LP | v0.3；尚未上正式站 |
| [`../../DECISIONS.md`](../../DECISIONS.md) | HopeBox 長期技術決策 | D-001～D-005 |

## 現況一句話

既有 WooCommerce 與唯讀 CRM 看板可以沿用；本案真正要新做的是「21 顆選款資料模型、
結帳驗證、LINE 雙入口、訂單欄位呈現與端對端驗收」。

## 不在這一階段

- 不把 LINE 對話全文或 LINE user ID 寫進 CRM。
- 不啟用 LINE Messaging API、LIFF 或自動把 LINE 身分綁到 WooCommerce 顧客。
- 不做 Google Calendar API 與付款完成三路通知。
- 不導入 Airtable；D-002／D-003 仍有效。
- 不自行重寫購物車、金流、訂單或退款系統。

