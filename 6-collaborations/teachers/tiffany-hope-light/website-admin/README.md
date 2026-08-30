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

### Hope Light Moment 的 Meta 委派登入

`@hopelight.moment`（Meta 資產 ID `17841439133515848`；商家資產管理組合 ID `1564680272358249`）已由 Meta Business 指派給 Darren。委派登入一律使用 Darren 自己的 Facebook／Meta 身分，不讀取 `IG 帳密.txt`，也不執行會依序登入兩個帳號的 `instagram:login`。

第一次在新主機建立專用工作階段：

```powershell
npm run meta:login
```

在開啟的瀏覽器內完成 Facebook／Meta 登入與安全驗證。工具只在 Meta Business 設定頁確認 `@hopelight.moment` 的資產是否可見；不開啟私訊、不查看其他 IG 帳號、不發文也不修改設定。完成後工作階段只保存在本機：

- Windows：`%LOCALAPPDATA%\mamasan-lab\meta-business-profiles\hopelight-moment`
- macOS：`~/Library/Application Support/mamasan-lab/meta-business-profiles/hopelight-moment`
- Linux：`~/.local/share/mamasan-lab/meta-business-profiles/hopelight-moment`

之後可執行唯讀稽核：

```powershell
npm run meta:audit
```

若無頭模式被 Meta 阻擋，可改用 `npm run meta:audit:visible`。可用 `META_BUSINESS_BROWSER_PATH` 與 `META_BUSINESS_PROFILE_DIR` 覆寫本機瀏覽器或 profile 路徑；目標帳號與資產 ID 固定在工具內，不接受參數覆寫。Cookie、Facebook 登入資訊、驗證碼與 Token 都不得放入 repository、OneDrive、終端輸出或文件。

最後唯讀驗證：2026-08-30（Asia/Taipei）。可見與無頭模式都以本機保存的 Meta session 成功開啟新版 Instagram 資產設定頁；頁面同時顯示 `@hopelight.moment` 與資產 ID `17841439133515848`，且沒有權限拒絕訊號。Meta 在 Darren 可見兩個商家組合後會先開啟商家選擇頁，因此工具已固定使用上述商家組合 ID。這確認的是 Darren 可透過 Meta Business 存取該資產，不代表已實際測試發文、私訊、留言、廣告、權限變更或其他寫入能力。

### 珈語老師商家組合與 hopelight.ig

最後唯讀驗證：2026-08-30（Asia/Taipei）。沿用 Darren 的本機 Meta session 可看見「珈語老師」商家資產管理組合（ID `889448907217740`），商家資訊顯示主要粉絲專頁為「無」。Darren 在人員頁的層級為「部分管理權限／基本」，不是完整控制。第一次檢查時 Instagram 帳號頁顯示「沒有已指派的 Instagram 帳號」；Tiffany 調整後重跑，`@hopelight.ig`（資產 ID `17841480182265940`）已出現在該頁，且 Darren 的資產權限訊號為「部分管理權限」。

目前可確認「商家可見＋Instagram 資產可見＋部分管理權限」，但沒有用發文、私訊、留言或設定變更測試各項寫入能力。`@hopelight.ig` 本身仍以另一個商家使用者身分出現在人員頁；Darren 不具商家組合完整控制權。檢查沒有開啟私訊、修改人員、指派資產或變更任何設定。

同日進一步做唯讀操作面檢查：選定 `@hopelight.ig` 後，Meta Business Suite 首頁顯示先前選定的 Instagram 個人檔案無法使用該工具；直接開啟該資產的收件匣則顯示「很抱歉，目前無法查看此內容」。因此目前只能確認資產與部分權限存在，無法讀取貼文內容、留言、私訊或 Requests，也無法由這個 session 核實歷史「約 400 位」名單。這是「目前權限／工具不可用」，不能解讀成舊資料已不存在。檢查沒有開啟任何對話、輸出顧客姓名或文字、回覆、按讚、刪除或修改資料。

同日後續：使用者表示已完成 Facebook 粉絲專頁完整控制的重新指派／接受，但 Meta 明示需持有完整控制至少一週才能連結 Instagram；Page ↔ `@hopelight.ig` 尚未連成，最早應在滿 `7 × 24` 小時後重試。Tiffany 的直接 Instagram 工作階段可正常開啟 `@hopelight.ig` 本人個人檔案與 Create 入口；日常發布不再建議依靠瀏覽器 UI 自動化。完整狀態、權限層次與下一步 API 方案見 [`../context/2026-08-30-meta-instagram-access-handoff.md`](../context/2026-08-30-meta-instagram-access-handoff.md)。

可重跑唯讀稽核：

```powershell
npm run meta:audit:portfolio
```

## Instagram 發布 App（hopelight-publisher-IG）

建立日期：2026-08-31（Asia/Taipei）｜狀態：**權杖已驗證可用**

走 `Instagram API with Instagram Login`，授權來源是 Instagram 帳號本身，不經過 Facebook 粉絲專頁，也不經過商家資產管理組合；因此不受 Page ↔ Instagram 的七天等待期阻擋。

| 項目 | 值 |
|---|---|
| App 名稱 | `hopelight-publisher-IG` |
| Instagram App ID | `1965739860772119` |
| App 擁有者 | Darren／mamasan，不掛在「珈語老師」商家組合底下 |
| 目標帳號 | `@hopelight.ig`（資產 ID `17841480182265940`），所有權仍屬 Tiffany |
| 存取層級 | Standard Access，只服務已加入 App 的 tester 帳號 |
| 預定權限 | `instagram_business_basic`、`instagram_business_content_publish`，不多要 |

App ID 等同 OAuth 的 `client_id`，會出現在授權網址中，不是機密，可以留在文件裡。**App Secret 是機密**，只存在本機 `.env`，已被 `.gitignore` 忽略；不得提交、輸出到終端、寫進文件或貼進聊天。變數名稱見 [`.env.example`](./.env.example)。

### 2026-08-31 唯讀驗證結果

以 `npm run instagram:whoami` 對 `/me` 做唯讀核對，通過：

| 欄位 | 值 |
|---|---|
| username | `@hopelight.ig` |
| 帳號類型 | `MEDIA_CREATOR`（創作者帳號） |
| IG user id | `17841480182265940` |
| 貼文數 | 38 |
| 權杖前綴 | `IGA…`，長度 182 |

`IGA` 前綴確認走的是 Instagram Login 路線；若看到 `EAA` 代表被導到 Facebook Graph，是錯的路線。
回報的 IG user id 與 2026-08-30 商家組合稽核看到的資產 ID 一致，交叉確認打到的是同一個帳號。

### 權杖到期

**Instagram 沒有永久權杖，Dashboard 不顯示到期日不代表沒有期限。** 長效權杖 60 天，
必須在滿 24 小時後、到期前呼叫 refresh 才能續命；刷新會換發新權杖，需同步更新 `.env`。

- 產生日：2026-08-31
- 推定到期：**2026-10-30**
- 建議動作：2026-10-中旬前刷新，不要等到最後一週

實際到期秒數只能透過 refresh 端點取得，而該端點會換發新權杖，因此不做「只為了查到期日」的呼叫。

### 權限決定與理由

只要兩項：`instagram_business_basic`、`instagram_business_content_publish`。
官方發布文件確認發布只需這兩項，且 Standard Access 即可。

| 未採用 | 理由 |
|---|---|
| `instagram_business_manage_messages` | 發布用不到。更重要的是授權畫面會出現「存取私訊」，牴觸本專案不讀取私訊的界線 |
| `instagram_business_manage_comments` | 目前沒有留言管理需求，需要時再加 |
| Webhooks | 用於**接收**留言與私訊事件，本專案只做**送出**，且它要求 App 進入已發布狀態 |
| 應用程式檢閱（App Review） | 只在存取「不在 App 角色內」的帳號時才需要。`@hopelight.ig` 以 Instagram tester 身分授權，不需要審查。將來要服務多位老師且不逐一加 tester 時才評估，屆時另需商業驗證 |

### 待觀察

帳號類型是 `MEDIA_CREATOR` 而非 `BUSINESS`。發布 API 對創作者帳號的支援在歷史上曾有差異，
第一次實際發布時若出現權限或帳號類型錯誤，先確認這一點，不要直接歸因於權杖。

另外，官方文件指出：若 Instagram 帳號連到需要「粉絲專頁發布授權（PPA）」的粉專，
完成 PPA 前無法以 API 發布。目前尚未連結 Page，暫時不受影響；
2026-09-07 之後若完成 Page 連結，需重新驗證發布是否仍正常。

### 唯讀核對指令

```powershell
npm run instagram:whoami
```

只讀取帳號識別欄位，不發布、不修改、不讀取貼文內容、留言或私訊，也不輸出權杖。

### 尚未完成

1. ~~權限設定、tester 指派、授權、唯讀 `/me` 核對~~ 已於 2026-08-31 完成。
2. 建立發布工具：預設停在預檢，只有明確 `--publish` 才送出。
3. 素材以短效 signed HTTPS URL 提供給 Meta，完成後刪除暫存。
4. 發布成功後記錄 media ID、公開 permalink、實際 Caption、發布時間與來源檔。
5. 排定 2026-10-中旬的權杖刷新，並在刷新後更新 `.env` 與本節的到期日。
6. 商家登入（Business Login）與 redirect URI 目前未設定；服務第二個帳號時才需要。

## 官方 LINE 導流

最後確認：2026-08-24（Asia/Taipei）

- 官方 LINE ID：`@happy139`
- 加好友網址：`https://lin.ee/vG7eI1Dv`
- 網站位置：「老師介紹頁」的「預約與老師對話」按鈕
- WordPress 後台可以修改網站上的按鈕文字與目標網址；LINE 官方帳號本身的名稱、個人檔案、圖文選單、訊息與好友管理，需在 LINE Official Account Manager 處理，不能從 WordPress 修改。
