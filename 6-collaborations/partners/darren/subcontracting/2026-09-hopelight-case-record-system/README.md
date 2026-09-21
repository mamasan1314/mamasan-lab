# 希望之光｜個案紀錄系統

> **內部專案入口。** Darren 為 mamasan 的分包製作端；是否交給 Tiffany、老師端售價、收款與驗收，仍由 mamasan 決定。

- 建立：2026-09-21
- 狀態：**示範稿 v0.6 已製作；正式方案、範圍與報價待確認**
- 改寫層級：**L2**（依 Tiffany 的草圖與口述需求重建可操作流程）
- 示範稿：[`../../../teachers/tiffany-hope-light/2026-09-customer-record-search/`](../../../teachers/tiffany-hope-light/2026-09-customer-record-search/)

## 文件分工

| 文件 | 給誰看 | 用途 |
|---|---|---|
| [`spec.md`](./spec.md) | 製作、審查與技術人員 | 功能、技術方案、細項價格、驗收與範圍邊界 |
| [`quotation.md`](./quotation.md) | mamasan；文字難度可供 Tiffany 閱讀 | 用白話比較本機版與雲端版、價格及付款方式 |

詳細技術內容只放在 `spec.md`，不再塞進報價單。

## 目前建議

先讓 Tiffany 確認示範稿的版位與使用流程。若只有她一個人在固定的 Windows 電腦操作，優先採本機版；只有在她確定需要手機查詢、外出使用或多人共同操作時，才採雲端版。

HopeBox 既有的 WordPress CRM 是 WooCommerce 顧客與訂單看板，與本案的個案紀錄用途不同。第一版不把兩者合併；若未來需要，可再用顧客編號或匯入方式銜接。

## 下一步

1. 向 Tiffany 確認畫面、欄位與日常使用方式。
2. 確認採本機版或雲端版，以及需要哪些加購項目。
3. 由 mamasan 決定老師端正式報價與開工安排。

依 [`../translation-qc-workflow.md`](../translation-qc-workflow.md)，本案目前為**已製作示範稿**，尚未「已交付」或「已接受」。
