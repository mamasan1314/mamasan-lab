# 階段驗收頁發布紀錄

日期：2026-09-08（Asia/Taipei）

網址：https://hope-light-candle21-review.marianalin.chatgpt.site

Sites 已確認發布成功。Darren 於 2026-09-08 明確授權公開網站後，分享權限已成功改為 `public`，任何知道連結的人皆可開啟，無須登入。已用不帶 Cookie 或授權標頭的請求確認首頁與四個展示頁皆回應 HTTP 200 且包含預覽內容。

先前自動核准審查曾因公開閱覽者超過指定驗收對象而拒絕公開設定；本次取得明確授權後執行成功。權限修訂為第 2 版，平台更新時間為 2026-09-08 12:51:17 UTC。

Darren 另提出希望驗收網址位於 `hopebox.com.tw` 底下。此為可行的後續部署方向，目前仍使用上述 Sites 網址，尚未在 HopeBox 建立驗收頁。未公開連結不等於存取限制；需要限制閱覽時須另加密碼或帳號驗證。

## 檢視內容與邊界

- 四個頁籤：營運設定、顧客選款、銷售頁、訂單與 CRM 快照。
- 本頁是靜態假資料展示；設定不會儲存，也不能下單、付款或變更 HopeBox。
- 示範價格、庫存、贈品與營運條件不代表已核准方案。
- 文件整理層級為 L1；工程互動、驗收入口與回饋格式為新增設計。來源與變更見 [施工交接](IMPLEMENTATION-2026-09-08.md)。
- 仍待 mamasan QC／QA，再由 Tiffany 決定營運內容與是否上線；本紀錄不代表通過驗收。

## 可回查的版本

| 項目 | 值 |
|---|---|
| Sites project | `appgprj_6a9f8ffe45a08191a5b6e9b0c49dcdc8` |
| Saved version | `appgprj_6a9f8ffe45a08191a5b6e9b0c49dcdc8~appgver_42a2ea9ce0848191850a8cb3f8d4e2c6`（第 1 版） |
| Deployment | `appgdep_6a9f9143a2c881918f0d749c8c0b3c0a` |
| 已推送的獨立展示原始碼 commit | `dba97329017567e119b825caad2bcd77d9de65bc` |
| 部署狀態 | `succeeded`；2026-09-08 04:40:52 UTC |

僅展示檔案推送到 Sites 的獨立來源庫；主 repo 未推送。發布目錄為 `dist`，包含 `preview/` 的 HTML、示範截圖與先讀我。`preview/.openai/hosting.json` 保留既有 project ID；後續發布應沿用，勿另建網站。隔離的發布工作目錄位於本機暫存區，將展示檔放入 `dist/`，提交並成功推送後，以該 commit 的 `git archive` 保存 Sites 版本。

沒有上傳帳密、瀏覽器 session、真實顧客或訂單資料；外掛與主題未安裝到 HopeBox，LINE 未修改。
