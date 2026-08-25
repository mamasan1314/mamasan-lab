# Hope Light LINE 官方帳號管理交接

這個資料夾提供可重用的 LINE Official Account Manager 本機工作階段與唯讀權限稽核工具。工具不含帳號、密碼、Channel Secret 或 Access Token，也不會啟用 Messaging API。

## 帳號資料

- 管理後台：`https://manager.line.biz/account/@290ykfry`
- 對外 LINE ID：`@happy139`
- 加好友網址：`https://lin.ee/vG7eI1Dv`

管理後台網址中的帳號識別碼可記錄在 repo；登入 Cookie 與其他驗證資料只能留在本機工作階段。

## 已確認狀態

最後完整驗證：2026-08-24（Asia/Taipei）

- 後台帳號名稱：「💙希望之光🧡腦意識調頻」
- Chrome 專用工作階段可成功保存並以 `cached-session` 重用。
- 可見主頁、分析、聊天、商業簡介、LINE VOOM、群發訊息、自動回應訊息、AI 聊天機器人（β）、圖文訊息、優惠券、加入好友歡迎訊息、圖文選單、受眾、增加好友工具與設定等導覽。
- `npm run audit` 無頭模式與 `npm run audit:visible` 可見模式皆已實測成功。
- 稽核不開啟或輸出聊天室內容；看到功能入口不代表該功能已啟用或完成設定。Messaging API 與 AI 聊天機器人（β）的狀態尚未檢查，也未變更。

## 第一次建立工作階段

需求：Node.js 20 以上，以及 Chrome、Edge 或 Chromium 其中一個。

1. 安裝固定版本依賴：

   ```powershell
   npm ci
   ```

2. 開啟專用瀏覽器並建立登入工作階段：

   ```powershell
   npm run login
   ```

3. 在開啟的瀏覽器完成 LINE Business ID 登入與手機認證。工具確認目標帳號可存取後會自動關閉瀏覽器，Cookie 會保存在本機使用者資料目錄。

4. 執行唯讀登入稽核：

   ```powershell
   npm run audit
   ```

若無頭模式被 LINE 阻擋，可改用：

```powershell
npm run audit:visible
```

稽核只讀取帳號管理畫面的標題、頁面標題與導覽標籤，不開啟或輸出聊天室內容。

## 本機工作階段

- Windows：`%LOCALAPPDATA%\mamasan-lab\hope-light-line-oa-browser-profile`
- macOS：`~/Library/Application Support/mamasan-lab/hope-light-line-oa-browser-profile`
- Linux：`~/.local/share/mamasan-lab/hope-light-line-oa-browser-profile`
- 可用 `LINE_OA_PROFILE_DIR` 指定其他本機路徑。
- 可用 `LINE_OA_BROWSER_PATH` 指定 Chrome、Edge 或 Chromium 執行檔。

登入工作階段不放在 repository 或 OneDrive。新主機需要重新登入；LINE 要求再次驗證或 Cookie 過期時，重新執行 `npm run login`。

## 管理界線

後續工具應呼叫 `lib/line-oa-session.cjs` 的 `openLineOfficialAccountManager()`，不要複製登入流程或把帳密寫進腳本。

執行任何變更時：

1. 先明確列出變更範圍與預期結果。
2. 盤點與草稿可唯讀進行；群發、回覆客戶、刪除內容、權限、帳務與 Messaging API 設定需要依使用者明確授權執行。
3. 不把 Cookie、登入憑證、客戶資料、聊天室內容、Channel Secret 或 Access Token 輸出到終端、文件或 Git。
4. 變更後重新開啟受影響畫面，回報實際結果與例外。
