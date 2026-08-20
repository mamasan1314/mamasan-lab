# 希望之光品牌整合與營運表格

*Created: 2026-08-09 by [Codex]*

> mamasan-lab 收錄說明：本資料夾由 `Manus/projects/2026-08-09-hope-light-brand-integration/` 複製收錄，作為 Tiffany／Hope Light 的 2026-08 品牌整合專案版本。原 Manus 專案保留不動。
>
> 長期品牌母資料請見 [`../context/Hope_Light_品牌整合_對話壓縮資料.md`](../context/Hope_Light_品牌整合_對話壓縮資料.md)。

## 專案目標

整合使用者提供的品牌策略、對談、產品、庫存、客戶與操作手冊資料，建立：

1. 可執行的品牌規劃路徑圖。
2. 可持續維護、彼此串接的 Excel 營運工作簿。
3. 清楚列出原始資料矛盾、缺漏與待決策事項的交接紀錄。

## 資料原則

- 原始檔位於 `D:\HOPE LIGHT`，處理時保持唯讀，不覆寫。
- 擷取資料存於 `working/extracted/`，最終交付物存於 `outputs/`。
- 無法從來源確認的內容標記為「待確認」，不自行補值。
- 重要文件與決策標示貢獻來源。

## 預定交付物

- `outputs/希望之光_品牌營運管理系統_202608.xlsx`
- `outputs/希望之光_品牌規劃路徑圖_202608.docx`
- `outputs/希望之光_品牌規劃路徑圖_202608.pdf`
- `outputs/希望之光_品牌策略藍圖_20260820.pdf`
- `outputs/資料盤點與待確認清單.md`
- `outputs/希望之光_簡易產品報價庫存介紹表_202608.xlsx`
- `outputs/希望之光_中英日產品介紹表_202608.xlsx`
- `outputs/希望之光_一人工作室簡易執行表_202608.docx`
- `outputs/希望之光_一人工作室簡易執行表_202608.pdf`
- `outputs/希望之光_老師下次會議簡單討論稿_202608.docx`
- `outputs/希望之光_老師下次會議簡單討論稿_202608.pdf`
- `outputs/Hope_Light_Logo_初稿_01.png`

## 版本控制範圍

本專案 commit 保留正式交付物、專案紀錄、生成／驗證腳本與 `requirements.txt`。`working/build_simple_tools.py` 用於重建簡易產品三表與 Moment 執行規劃。下列內容不長期保留，可由原始檔或腳本重新產生，也不納入 Git：

- `working/vendor/`：本機安裝的 Python 套件。
- `working/extracted/`：來源文件的文字、表格與頁面擷取副本。
- `working/validation/`：Excel／Word／PDF 的驗證報告與預覽圖。
- `working/__pycache__/`、`working/diagnostic_workbooks/`：執行快取與診斷暫存。

2026-08-10 依 [User] 指示完成空間精簡：上述本機套件、擷取副本、驗證預覽與快取已移除；正式交付物、生成／驗證腳本與 `requirements.txt` 保留。四份原本即排除 Git 的舊 Word／PDF 稿也先保留，未納入這次永久刪除範圍。

重建前可執行 `python -m pip install -r requirements.txt`，主要生成入口為 `python working/build_deliverables.py`。PDF 最終匯出與 Excel 完整重算仍需本機 Microsoft Word／Excel。

## 完成狀態

2026-08-09 初版已完成。Excel 內含 20 個工作表，涵蓋品牌儀表板、90天路徑、產品、庫存、訂單、CRM、服務、回訪、內容、故事、LINE、分潤、品牌決策與資料核對。

依 [User] 後續需求，品牌路徑圖已移除5.1節，並改寫為3頁一人工作室版本；另建立3分頁簡易產品工作簿、4頁的一人工作室執行與 Hope Light Moment 內容表、中／英／日3分頁的產品介紹表，以及含Logo、下次會議決策、IG Bio與首批15篇文案的10頁簡單會議稿。

2026-08-20 收錄並更新 11 頁《Hope Light 品牌策略藍圖》：降低醫療檢測、儀器與療效語氣，改以狀態數據解析、人生脈絡與日常陪伴表述；正式交付檔為 `outputs/希望之光_品牌策略藍圖_20260820.pdf`。

本版將來源中的矛盾保留為「待確認」，沒有把舊模板、`#REF!`、未來日期庫存或關聯不明的 MEGAWING 舊客資料匯入正式營運資料。

實際啟用前，應先完成：

1. 老師核准母品牌、品牌承諾、產品正式名稱與對外宣稱界線。
2. 確認大小貴人與首購組的正式價格／成本；60分鐘諮詢正式售價已由 [User] 確認為 NT$1,980。
3. 依實際盤點日建立每個實體 SKU 的期初庫存。
4. 補入近三個月銷售、IG／LINE後台與第一批30-50份CRM試轉資料。
