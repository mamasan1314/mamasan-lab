# 希望之光｜個案紀錄系統

> **內部專案入口。** Darren 為 mamasan 的分包製作端；是否交給 Tiffany、老師端售價、收款與驗收，仍由 mamasan 決定。

- 建立：2026-09-21
- 狀態：**示範稿 v0.6 已製作；NT$20,000 本機版正式報價 PDF 已備妥，尚未記錄 mamasan 轉交或 Tiffany 接受；正式版尚未開工**
- 改寫層級：**L2**（依 Tiffany 的草圖與口述需求重建可操作流程）
- 示範稿：[`../../../../teachers/tiffany-hope-light/2026-09-customer-record-search/`](../../../../teachers/tiffany-hope-light/2026-09-customer-record-search/)

## 文件分工

| 文件 | 給誰看 | 用途 |
|---|---|---|
| [`spec.md`](./spec.md) | 製作、審查與技術人員 | 功能、原價細項、此次整包調整、驗收與範圍邊界 |
| [`quotation.md`](./quotation.md) | mamasan、Darren | 完整文字工作稿；正式對外版本以 PDF 為準 |
| [`quotation-tiffany.html`](./quotation-tiffany.html) | mamasan、Darren | 正式報價 PDF 的可編輯版面來源 |
| [`希望之光-個案紀錄系統-報價單-2026-09-22.pdf`](./希望之光-個案紀錄系統-報價單-2026-09-22.pdf) | mamasan 轉交 Tiffany | 兩頁正式報價，編號 `HL-CRS-20260922-01` |
| [`quotation-v3-2026-09-21.md`](./quotation-v3-2026-09-21.md) | 內部留存 | 調價前的原始報價快照，不作為本次現行報價 |
| [`2026-09-22-price-revision-qc.md`](./2026-09-22-price-revision-qc.md) | mamasan 與 Darren | 價格來源、變更帳本、新增條款、風險與待決定事項 |

詳細技術內容只放在 `spec.md`，不再塞進報價單。

## 程式碼正本

本資料夾仍是 Darren → mamasan 分包關係、規格與報價正本；老師端需求與 HTML 示範稿仍在
[`../../../../teachers/tiffany-hope-light/2026-09-customer-record-search/`](../../../../teachers/tiffany-hope-light/2026-09-customer-record-search/)。

若正式方案獲確認，production code 由 Darren 的 private `darrenfiy-studio` 之
`PRODUCTS/hopelight-case-record-system/` 建立，或在需要獨立部署／權限／原始碼交付時拆成專屬
private repo。本資料夾不再複製一份活程式碼，只記交接 commit／release 與驗收狀態。

## 目前建議

本案以原 NT$45,000 本機版完整範圍、一次性合作價 NT$20,000 報價；雲端使用另案估價。Darren 已備妥編號 `HL-CRS-20260922-01` 的正式 PDF。mamasan 主動轉交此 PDF，表示她核准這個**對外報價版本與窗口分工**；Tiffany 收到 PDF 不表示接受，仍須回覆確認報價及指定電腦，並依付款條件安排開工。

HopeBox 既有的 WordPress CRM 是 WooCommerce 顧客與訂單看板，與本案的個案紀錄用途不同。第一版不把兩者合併；若未來需要，可再用顧客編號或匯入方式銜接。

## 下一步

1. Darren 將正式 PDF 與內部 [`2026-09-22-price-revision-qc.md`](./2026-09-22-price-revision-qc.md) 交給 mamasan。正式對外只用 PDF，不直接轉傳內部細項或 QC 單。
2. mamasan 若認同本版內容及窗口分工，可直接把 PDF 轉交 Tiffany；該轉交即記為她對**報價交付**的核准，不另等待勾完內部 QC 單。
3. Tiffany 確認報價、示範稿畫面、欄位、指定電腦及第一期款後，再安排正式版開工。軟體完成時仍由 mamasan 先做交付 QC／QA，再由 Tiffany 驗收。

依 [`../translation-qc-workflow.md`](../translation-qc-workflow.md)，本案目前為**已製作示範稿**，尚未「已交付」或「已接受」。
