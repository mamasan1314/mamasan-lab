# Darren → mamasan｜數位製作分包

> **內部文件區，含分包價格，不直接轉傳老師。**

mamasan 承接老師端案件後，可以向 Darren 採購製作模組。這一區保存那條商業關係的
規則、價格與各案文件。教學關係在 [`../ai-builder/`](../ai-builder)，是另一回事。

## 誰對誰

- **mamasan（A）是老師端唯一窗口與主承接者。** 需求、報價、確認、變更、收款與驗收都回到她。
- **Darren 的報價對象是 A，不是老師。** 老師端價格由 A 依整體服務另行提出。
- Darren 的草稿先交 A；A 完成 QC／QA 並願意承擔後，才由 A 對老師交付。

## 規則文件

| 文件 | 用途 |
|---|---|
| [`service-map.md`](./service-map.md) | 分包服務地圖、價格帶與責任邊界 |
| [`subcontract-service-menu.md`](./subcontract-service-menu.md) | 分包價格參考表（標準／試辦）；不是老師端報價單 |
| [`translation-qc-workflow.md`](./translation-qc-workflow.md) | Darren → mamasan → 老師的翻譯、QC／QA、驗收與報價流向 |

動任何老師端交付物之前，先讀 `translation-qc-workflow.md`。

## 案件

| 案件 | 老師／品牌 | 狀態 |
|---|---|---|
| [`2026-09-hopelight-candle21-lp`](./2026-09-hopelight-candle21-lp) | Tiffany／希望之光 | 報價中；LP v0.2 已完成，等兩項產品確認與 LINE 寫入授權 |
| [`2026-09-hopelight-case-record-system`](./2026-09-hopelight-case-record-system) | Tiffany／希望之光 | 示範稿 v0.6 已製作；技術規格與白話報價均為草案 |

已發生但尚未整理成案件資料夾的：

- **2026-08 掌運卡教材整理**——已製作、已交付、**未被老師接受**。
  交付物在 [`../../../teachers/tiffany-hope-light/2026-08-掌運卡/`](../../../teachers/tiffany-hope-light/2026-08-掌運卡)，
  分包價格假設與失敗檢討目前寫在 [`service-map.md`](./service-map.md) 與
  [`../ai-builder/README.md`](../ai-builder/README.md)。若要補一個案件資料夾，就從那兩處搬出來。

## 案件資料夾放什麼

`YYYY-MM-案件名/`，內含：

- `README.md`——這個案子現在卡在哪、範圍、金額、下一步
- 工作清單與報價
- 交付紀錄與變更帳本

老師端的實際交付物（網頁、文案、簡報、腳本）仍放在
[`../../../teachers/`](../../../teachers) 對應的老師資料夾，不複製到這裡。
這一區只放**商業關係**的文件。
