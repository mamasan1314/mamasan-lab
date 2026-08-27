# HopeBox 網站管理交接

這個資料夾讓新的 Codex 工作階段或另一台主機，不必重新探索 HopeBox 的登入與後台結構即可開始協作。工具本身不含帳號或密碼，也不會修改網站。

## 已確認狀態

最後完整驗證：2026-08-24（Asia/Taipei）

- 公開網站：`https://hopebox.com.tw/`
- 平台：WordPress、Elementor、WooCommerce
- 登入入口會先經過 JavaScript browser check，再導向 WordPress 登入頁。
- Jetpack Protect 可能要求數學驗證；共用登入模組會自動處理。
- 交接帳號具管理員級功能，可見頁面、商品、Elementor、外觀、外掛、使用者、工具與設定等選單。
- 驗證時頁面列表顯示 11 筆、商品列表顯示 9 筆；兩者都有批次操作，且頁面編輯器可正常載入。

以上數量只是驗證當時畫面所見，不應當成永久資料總數。

## 新主機快速開始

需求：Node.js 20 以上，以及 Chrome、Edge 或 Chromium 其中一個。

1. 將本機交接檔放到 `../Hope_Light 帳號密碼.txt`。如果專案由 OneDrive 同步，確認該檔案也已出現在新主機；Git 不會傳送它。
2. 在這個資料夾安裝固定版本依賴：

   ```powershell
   npm ci
   ```

3. 執行唯讀登入與權限檢查：

   ```powershell
   npm run audit
   ```

第一次會自動通過 browser check、Jetpack 數學題並登入；同一台主機之後會優先使用本機保存的瀏覽器工作階段。

需要保留不含帳密的機器可讀結果時，可加入：

```powershell
npm run audit -- --output audit-result-local.json
```

`audit-result*.json` 已被 Git 忽略。

若無頭瀏覽器無法通過網站檢查，可改用：

```powershell
npm run audit:visible
```

## 本機狀態與跨主機行為

- 瀏覽器工作階段預設保存在作業系統的使用者資料目錄，不放在 repository 或 OneDrive。
- Windows 預設位置：`%LOCALAPPDATA%\mamasan-lab\hopebox-browser-profile`
- macOS 預設位置：`~/Library/Application Support/mamasan-lab/hopebox-browser-profile`
- Linux 預設位置：`~/.local/share/mamasan-lab/hopebox-browser-profile`
- 新主機仍需建立自己的 Cookie，但工具會自動走已知流程，不需要重新診斷。
- 自動登入會勾選 WordPress 原生的「保持登入」；2026-08-24 實測第二次執行使用 `cached-session`、不需再解 Jetpack。
- 帳號密碼、網站角色或防護外掛變更時，才需要重新盤點流程與權限。

## 可選設定

以下設定都只是路徑，不要把實際密碼放進 Git：

- `HOPEBOX_CREDENTIAL_FILE`：改用其他本機交接檔。
- `HOPEBOX_BROWSER_PATH`：指定 Chrome、Edge 或 Chromium 執行檔。
- `HOPEBOX_PROFILE_DIR`：指定本機瀏覽器工作階段目錄。

也可直接傳入參數：

```powershell
npm run audit -- --credential "D:\private\hopebox.txt" --browser "C:\path\to\chrome.exe"
```

## 後續批次管理

`lib/hopebox-session.cjs` 是共用入口。新增批次工具時應呼叫 `openHopeBoxAdmin()` 取得已登入的 `context`、`page` 與 `siteRoot`，不要複製帳密或重寫驗證流程。

執行網站變更時：

1. 先明確列出變更範圍與預期結果。
2. 優先以批次方式處理頁面或商品；Elementor 與外掛專屬設定需要使用各自的後台介面。
3. 不把帳密、Cookie 或頁面中的私密資料輸出到終端或紀錄檔。
4. 變更完成後檢查公開頁面，回報實際修改數量與未能處理的例外。

WordPress Application Password 尚未建立。若未來主要工作可以透過 REST API 完成，可另外建立一組可撤銷的應用程式密碼，讓相容的批次工作略過互動式後台登入。

## 預約時段批次管理

使用 `scripts/manage-booking-slots.cjs` 讀取 `plans/` 內的 JSON 計畫。工具預設只做 dry-run，會檢查既有時段衝突；加入 `-Apply` 後才會送出，並同時驗證後台排程與公開預約端點。

Windows 可使用會自動尋找 Node.js 的入口：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\run-booking-tool.ps1' -Plan 'plans\plan-name.json'
```

預檢無衝突後再套用：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\run-booking-tool.ps1' -Plan 'plans\plan-name.json' -Apply -Output 'booking-apply-result-local.json'
```

計畫固定使用 `Asia/Taipei`、ISO 日期與 `HH:MM-HH:MM`。`slotMinutes` 會強制檢查每段長度；不明確的全天、跨時區或僅線上需求先列入 `pending`，不要自行推定。`booking-*-result-local.json` 已由 Git 忽略。

個人 Codex 技能名稱：`manage-hopelight-booking`。repository 來源保存在 `skill/manage-hopelight-booking/`。

## Instagram 唯讀登入稽核

兩個 Hope Light Instagram 帳號的本機交接檔放在 `../IG 帳密.txt`。該檔已由上層 `.gitignore` 忽略；不得把內容、Cookie、驗證碼或 Access Token 輸出到終端、文件或 Git。

執行不開啟私訊內容的唯讀登入檢查：

```powershell
npm run instagram:audit
```

如果 Instagram 無頭頁面沒有載入登入欄位，可改用可見瀏覽器：

```powershell
npm run instagram:audit:visible
```

帳號持有人已準備好驗證碼或安全確認時，可開啟最多等待五分鐘的互動登入：

```powershell
npm run instagram:login
```

工具會依序開啟兩個帳號；在瀏覽器完成當前帳號的驗證後，才會繼續下一個帳號。不要把驗證碼貼進終端、文件或 Git。

工具入口：

- `lib/instagram-session.cjs`：讀取兩組本機交接資料，為每個帳號使用獨立的本機瀏覽器 profile。
- `scripts/inspect-instagram-access.cjs`：只回報登入、額外驗證與專業帳號 UI 訊號；帳號一律以 `account-1`、`account-2` 表示。

本機工作階段預設位置：

- Windows：`%LOCALAPPDATA%\mamasan-lab\instagram-browser-profiles`
- macOS：`~/Library/Application Support/mamasan-lab/instagram-browser-profiles`
- Linux：`~/.local/share/mamasan-lab/instagram-browser-profiles`

最後檢查：2026-08-27（Asia/Taipei）。兩個帳號都到達 Instagram 額外驗證步驟，沒有出現密碼錯誤；帳號持有人尚未完成驗證，因此完整登入、Business／Creator／Personal 類型與 Meta Business 權限仍未確認。檢查沒有開啟私訊、發訊息、回覆留言或修改設定。

這個登入工具不等於 Instagram API 串接。正式把新留言／私訊接到 CRM 時，仍需由帳號持有人完成 Meta OAuth、授予最小必要權限並使用可撤銷的 Access Token；不可讓自動化長期使用主帳號密碼。

## 官方 LINE 導流

最後確認：2026-08-24（Asia/Taipei）

- 官方 LINE ID：`@happy139`
- 加好友網址：`https://lin.ee/vG7eI1Dv`
- 網站位置：「老師介紹頁」的「預約與老師對話」按鈕
- WordPress 後台可以修改網站上的按鈕文字與目標網址；LINE 官方帳號本身的名稱、個人檔案、圖文選單、訊息與好友管理，需在 LINE Official Account Manager 處理，不能從 WordPress 修改。
