# 希望之光｜個案紀錄系統

> **內部專案入口。** Darren 為 mamasan 的分包製作端；是否交給 Tiffany、老師端售價、收款與驗收，仍由 mamasan 決定。

- 建立：2026-09-21
- 狀態：**2026-09-26 Darren 回報 Tiffany 已確認報價 `HL-CRS-20260922-01`；示範稿 v0.7 待 Tiffany 確認；正式版在開工前確認階段，3～4 週工期尚未起算**
- 前一狀態（2026-09-22）：示範稿 v0.6 已製作；Darren 回報已將報價資料轉交 mamasan；當時尚未記錄 mamasan 轉交 Tiffany 或 Tiffany 接受。
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

2026-09-22，Darren 回報已將報價資料傳給 mamasan；目前未核對實際傳送通道、時間或附件 hash。這是 **Darren → mamasan** 的內部交接，不是 **mamasan → Tiffany** 的對外報價交付。

2026-09-26，Darren 回報 **Tiffany 已確認本報價**。付款與收款明細不寫在這裡：本 repo 是 public，財務紀錄以 Darren 的 private `darrenfiy-studio` 案件帳為正本。mamasan 把 PDF 轉交 Tiffany 的時間與通道仍未核對。依報價，工期要等下方「開工前確認」完成才起算。

同日 Darren 依 Tiffany 的使用方式調整一項畫面：來訪紀錄與當次備註合成同一列，打開個案就看到每次備註。已做成示範稿 v0.7（同一個線上示範網址），待 Tiffany 確認；細節見老師端 README 的 v0.7 變更。

HopeBox 既有的 WordPress CRM 是 WooCommerce 顧客與訂單看板，與本案的個案紀錄用途不同。第一版不把兩者合併；若未來需要，可再用顧客編號或匯入方式銜接。

## 下一步（2026-09-26 起）

> 2026-09-22 的下一步已由付款推進，原文保留作歷史：
>
> 1. Darren 已回報將報價資料傳給 mamasan；正式對外只用 PDF，不直接轉傳內部細項或 QC 單。
> 2. mamasan 若認同本版內容及窗口分工，可直接把 PDF 轉交 Tiffany；該轉交即記為她對**報價交付**的核准，不另等待勾完內部 QC 單。
> 3. Tiffany 確認報價、示範稿畫面、欄位、指定電腦及第一期款後，再安排正式版開工。軟體完成時仍由 mamasan 先做交付 QC／QA，再由 Tiffany 驗收。

### 開工前確認

工期（3～4 週）從下表全部有答案後起算。老師端的項目一律經 mamasan 問，不由 Darren 直接找 Tiffany。

| 項目 | 誰回答 | 狀態 |
|---|---|---|
| v0.7 畫面：來訪與當次備註同列 | Tiffany | 示範稿已更新，待確認 |
| 客戶編號 `139-00001` 起跳、五位數 | Tiffany | 待確認 |
| 久未回訪級距 3／6／12 個月 | Tiffany | 待確認 |
| 金額欄保留與否 | Tiffany | 待確認 |
| 指定電腦：Windows 版本、有無鏡頭、是否固定同一台 | Tiffany | 待確認 |
| 備份位置：外接硬碟或她自己的 OneDrive | Tiffany | 待確認 |
| 選配：手機拍照 NT$5,500／舊資料匯入 NT$3,500／自動更新 NT$7,000 | Tiffany | 待確認；沒選就不做 |
| Windows「智慧型應用程式控制」是否開啟（Windows 安全性 → 應用程式與瀏覽器控制） | Tiffany | 待確認；開啟時未簽章程式會被擋，見下方「已知會碰到」 |
| 收據與報帳需求 | mamasan、Darren | 待確認 |
| 原始碼條款（報價寫明不含原始碼移轉） | Darren、mamasan | 待確認 |

### 正式版施作路線（建議，Darren 定案前可改）

- **程式放哪**：依 2026-09-22 決策的拆 repo 條件，本案一開工就會有資料庫 migration 與 Windows 版本發行，因此建議**直接開專屬 private repo** `hopelight-case-record-system`（名稱沿用 Studio 產品索引已預定的），不先在 Studio `PRODUCTS/` 孵化再拆。Studio 只留供應端索引，本資料夾只記交接 commit／release 與驗收。
- **技術**：Electron＋SQLite。v0.7 畫面是 HTML／JS，可以直接沿用；Electron 自帶 Chromium，不受 Tiffany 電腦的瀏覽器版本影響；鏡頭、列印與存成 PDF 是現成能力；建置只需要 Node，全部邏輯同一種語言。代價是安裝後約 200～300 MB，單機使用不構成問題。
- **考慮過、不選**：
  - Tauri：程式小、啟動快；但建置要加 Rust 與 MSVC Build Tools，資料層會變成兩種語言，一人維護的面變寬。
  - 本機網頁伺服器＋瀏覽器：最輕；但視窗與程式生命週期不像 App（關掉分頁不等於關程式），啟動密碼也難做得乾淨。
  - 沿用示範稿的 Artifact 雲端資料庫：不符本機版「資料只在指定電腦」的範圍，雲端另案報價。
- **資料位置**：資料庫與照片放在 `%APPDATA%\HopeLight\`，不隨程式檔移動；照片改存成檔案並產生縮圖，不再以 data URL 塞進紀錄。
- **分期**（開工前確認完成後起算）：
  1. 第 1 週：repo、App 外殼、資料庫 schema v1 與升級機制、v0.7 畫面接上資料庫、照片改存檔案。
  2. 第 2 週：備份／還原（資料與照片一起打包、保留多份）、CSV／Excel 匯出、單一個案列印或存成 PDF、啟動密碼與閒置上鎖。
  3. 第 3 週：Windows 免安裝版打包（圖示、版本資訊）、乾淨 Windows 環境實測、移除示範鷹架（`demoBirthdayToday`、虛構示範資料、Artifact 資料庫連線）；交 mamasan 做交付 QC／QA。
  4. 第 4 週：Tiffany 電腦實機設定、一次含照片的備份還原演練、操作說明；驗收通過收第二期。
- **已知會碰到：程式碼簽章**。報價不含簽章憑證，程式預設不簽章。
  - Tiffany 電腦的「智慧型應用程式控制」**關閉**時（不少電腦是關的，要實際看過）：以 USB 在現場複製安裝，不會出現 SmartScreen「Windows 已保護您的電腦」，因為那道警告只針對從網路下載的檔案；就算出現，按「其他資訊 → 仍要執行」一次即可。
  - **開啟**時：未簽章的程式會直接被擋，無法針對單一程式放行。只能二選一：買簽章憑證，或請 Tiffany 關閉這項功能。
  - 若要簽章：Darren 個人身分可買 Certum 個人雲端程式碼簽章，約 US$139／年（需線上身分驗證與地址證明，一張最長 459 天）。Microsoft 的 Artifact Signing 每月 US$9.99 較便宜，但個人只開放美國、加拿大，台灣不能申請。有簽章後 SmartScreen 仍要累積信譽才會不跳警告，但智慧型應用程式控制會放行有效簽章。

依 [`../translation-qc-workflow.md`](../translation-qc-workflow.md)：報價已由 Tiffany 確認（Darren 轉述）；軟體本身仍只到「已製作示範稿」，尚未「已通過內部 QC／QA」「已交付」或「已接受」。
