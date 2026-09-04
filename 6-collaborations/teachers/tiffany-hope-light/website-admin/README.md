# HopeBox 網站管理交接

這個資料夾讓新的 Codex 工作階段或另一台主機，不必重新探索 HopeBox 的登入與後台結構即可開始協作。工具本身不含帳號或密碼，也不會修改網站。

## 開工前先讀：[DECISIONS.md](./DECISIONS.md)

已定案、不需要重新討論的技術決策都寫在那裡。摘要：

- **D-001**：網站內容以**手寫 HTML＋Git**維護，由 AI 助手直接改原始碼。老師不會自己進後台，所以不為了 Elementor 自助編輯而遷就版型。**但交易功能（購物車、結帳、金流、訂單）一律維持 WooCommerce，不要自己刻。**
- **D-002**：CRM 先做**本機唯讀看板**，暫不導入 Airtable。顧客個資只留本機，不進 Git、不上雲。

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

## CRM 顧客看板

唯讀匯出 WooCommerce 的顧客與訂單，產生一份本機 HTML 看板：

```powershell
npm run crm:refresh
```

然後打開 `crm/hopelight-crm.local.html`。

- `npm run crm:export`：只重新抓資料（唯讀，不修改網站）。
- `npm run crm:build`：只用現有資料重畫看板。
- 顧客會依 Email／電話自動去重，並補上只存在於訂單裡的訪客結帳。
- 產出的 `crm/data/` 與 `crm/*.local.html` 含個資，已被 `.gitignore` 排除，不要 `git add -f`。
- 看板是唯讀快照。改訂單狀態、地址與付款請回 WooCommerce 後台。

## CRM 後台外掛

同一份看板的 WordPress 版本，掛在 wp-admin 選單，即時讀 WooCommerce，個資不離開網站。

```powershell
npm run crm:plugin:pack      # 改完 PHP 後重新打包
npm run crm:plugin:check     # 預演：檢查登入、目前狀態、是否允許上傳外掛（不修改網站）
npm run crm:plugin:install   # 實際上傳並啟用（會修改網站）
```

裝好之後在後台左側選單找「希望之光 CRM」，或直接開 `https://hopebox.com.tw/wp-admin/admin.php?page=hopelight-crm`。

- 可見範圍：`manage_woocommerce` 權限，即 administrator 與 shop_manager。
- 外掛唯讀，不會修改訂單；要改狀態請點訂單編號進 WooCommerce 訂單頁。

需要下架時：

```powershell
npm run crm:plugin:remove:check   # 預演，列出會被刪除的項目
npm run crm:plugin:remove         # 實際停用並刪除
```

### 打包必須用 pack.ps1，不要用 Compress-Archive

`Compress-Archive` 在 Windows 上會把 zip 內的路徑分隔符寫成**反斜線**，但 ZIP 規格要求正斜線。PHP 解壓時會把 `hopelight-crm\hopelight-crm.php` 當成單一檔名，外掛就會變成 `hopelight-crm/hopelight-crm/hopelight-crm.php`，多包一層而無法啟用；重試還會留下 `hopelight-crm-1` 之類的重複副本。

[wp-plugins/pack.ps1](./wp-plugins/pack.ps1) 用 `System.IO.Compression` 手動指定正斜線的 entry 名稱，避開這個問題。改完之後可以先驗證：

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::OpenRead("$PWD\wp-plugins\hopelight-crm-board.zip").Entries.FullName
# 應該顯示 hopelight-crm-board/hopelight-crm-board.php（正斜線、只有一層）
```

如果 zip 結構錯誤而仍上傳，PHP 會建立一個**檔名裡真的含反斜線**的檔案。WordPress 的外掛列表看得到那一列，但點啟用會回「外掛檔案不存在。」，而且這台主機也刪不掉——會變成清不乾淨的幽靈項目。

`pack.ps1` 內容刻意全部使用 ASCII：Windows PowerShell 5.1 在沒有 BOM 時會以 ANSI 讀取 .ps1，中文字元會被解碼錯誤。

### 其他已知陷阱

- 外掛列表的 `tr` id 由外掛名稱產生，中文名稱會產生不可預期的 id，**不要用 `tr[data-slug]` 判斷狀態**；請改看 `a[href*="action=activate"]` 與 `action=deactivate` 連結。
- **這台主機不允許刪除外掛。** 2026-09-04 實測：批次操作選單只有「啟用／停用／更新／自動更新」，沒有刪除；單列的「刪除」連結（含接受 JS 確認對話框）點下去也只是跳回外掛列表，檔案仍在。上傳與覆蓋安裝則正常。
  - 因此 `crm:plugin:remove` 目前在這台主機上無效，留著是為了換主機或設定放寬時可用。
  - 推論：主機（路徑為 `/srv/htdocs/`，屬託管型環境）過濾掉了刪除功能。要清掉殘留資料夾，得透過主機的檔案管理員或請主機商協助。
  - **實務影響：安裝失敗會留下無法自行清除的殘留**，所以務必先用 `crm:plugin:check` 預演，並確認 zip 結構正確再上傳。

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

> **2026-09-05 憑證遷移已收口。** `instagram:whoami`、`instagram:stats`、
> `instagram:capabilities` 的 canonical implementation 都在 Manus；這裡只保留 Hope Light
> 的 npm 相容入口。相容層把 `hopelight`／`moment` 翻成公司 channel 後交給 Manus，
> 自己不知道 Vault 在哪，也不讀密文。為避免猜錯帳號，三支現在都必須明示 `--profile`。

> **2026-09-04 邊界更新：** 通用 Instagram Graph API 與 adapter 的 canonical copy
> 已移至 `Manus/tools/social-publishing/platforms/instagram/adapter/`。本資料夾的
> `lib/instagram-api.cjs` 與 `instagram-*.cjs` 是相容入口，只保留既有 npm 指令；
> 不要在此複製新功能或重新接回 credential handoff。

建立日期：2026-08-31（Asia/Taipei）｜狀態：**權杖已驗證可用**

走 `Instagram API with Instagram Login`，授權來源是 Instagram 帳號本身，不經過 Facebook 粉絲專頁，也不經過商家資產管理組合；因此不受 Page ↔ Instagram 的七天等待期阻擋。

| 項目 | 值 |
|---|---|
| App 名稱 | `hopelight-publisher-IG` |
| Instagram App ID | `1965739860772119` |
| App 擁有者 | 四分之三國際；不掛在「珈語老師」商家組合底下 |
| 目標帳號 | `@hopelight.ig`（IG user id `17841480182265940`）、`@hopelight.moment`（IG user id `17841439133515848`），所有權皆屬 Tiffany |
| 存取層級 | Standard Access，只服務已加入 App 的 tester 帳號 |
| 預定權限 | `instagram_business_basic`、`instagram_business_content_publish`，不多要 |

App ID 等同 OAuth 的 `client_id`，會出現在授權網址中，不是機密，可以留在文件裡。
**App Secret 是機密**，已封存在公司 Vault；本客戶工作區不再保管它。不得輸出到終端、
寫進文件或貼進聊天。[`.env.example`](./.env.example) 只保留退役告示，避免有人重建舊 handoff。

### 唯讀驗證結果

以 `npm run instagram:whoami` 對 `/me` 做唯讀核對。遷移前最後一次全帳號核對：
**2026-09-03**，三個設定檔全數通過；現在本客戶工作區只轉接下列兩支 Hope Light 帳號。

| 設定檔 | username | 帳號類型 | IG user id | 權杖長度 |
|---|---|---|---|---|
| `hopelight` | `@hopelight.ig` | `MEDIA_CREATOR` | `17841480182265940` | 182 |
| `moment` | `@hopelight.moment` | `BUSINESS` | `17841439133515848` | 183 |

兩支客戶權杖前綴皆為 `IGA…`，確認走的是 Instagram Login 路線；若看到 `EAA` 代表被導到 Facebook Graph，是錯的路線。
`@hopelight.ig` 回報的 IG user id 與 2026-08-30 商家組合稽核看到的資產 ID 一致，交叉確認打到的是同一個帳號。

注意：`@hopelight.moment` 的 IG user id `17841439133515848` 一度被誤填進 `.env` 的 `INSTAGRAM_APP_ID`。
**App 只有一個**，三個帳號共用 `1965739860772119`；IG user id 與 App ID 不是同一種東西。

### 權杖到期

**Instagram 沒有永久權杖，Dashboard 不顯示到期日不代表沒有期限。** 長效權杖 60 天，
必須在滿 24 小時後、到期前呼叫 refresh 才能續命；刷新會換發新權杖，Manus 會把新值
重新封存到同一個 Vault 位址。

**兩支客戶權杖各自計時，不能一次刷新解決。** Darren 自有帳號的期限由公司 repo 管理，
不再放在 Hope Light 工作區。

| 設定檔 | 產生日 | 推定到期 | 建議刷新 |
|---|---|---|---|
| `hopelight` | 2026-08-31 | **2026-10-30** | 2026-10 中旬 |
| `moment` | 2026-09-03 | **2026-11-02** | 2026-10 下旬 |

`moment` 的產生日以 2026-09-03 記錄。若實際在 Dashboard 產生的日期不同，請同步修正本表——
到期日是從產生日起算的 60 天，記錯就會在毫無預警的情況下失效。

實際到期秒數只能透過 refresh 端點取得，而該端點會換發新權杖，因此不做「只為了查到期日」的呼叫。

### 權限現況與取捨

**已授予**

| 權限 | 用途 | 實測確認 |
|---|---|---|
| `instagram_business_basic` | 讀取帳號身分與貼文清單 | 2026-08-31 |
| `instagram_business_content_publish` | 建立媒體容器與發布 | 2026-08-31（權限）／2026-09-04（實際發布 9 篇） |
| `instagram_business_manage_comments` | 留言**寫入**可用；**讀取被靜默拒絕** | 2026-09-04，見下方「留言 API 驗證」 |
| `instagram_business_manage_messages` | 私訊 | **未經證實**。回傳空會話，無法分辨真的沒有還是被靜默拒絕 |
| `instagram_business_manage_insights` | 貼文瀏覽、觸及、收藏、分享 | 2026-09-04，見下方更正 |

三個帳號皆同。`moment` 的四項權限於 2026-09-04 補跑 `instagram:capabilities`，
結果與另兩支一致，不再是推論。

**`manage_comments` 那一列先前寫「留言讀取與回覆」是錯的**，且錯了很久沒被發現 ——
原因見下方「留言 API 驗證」與「權限盤點曾經給出假陽性」兩節。

#### 更正：insights 實際上是可用的（2026-09-04）

本文件先前把 `instagram_business_manage_insights` 列在「未採用」，理由是
「目前沒有數據分析需求」。**該說法已過期，不是因為需求改變，而是因為權限本來就在。**

2026-09-04 實測：`GET /{media-id}/insights?metric=views,reach,total_interactions,saved,shares`
在 `@hopelight.ig` 與 `@hopelight.moment` 上皆正常回傳。

**沒有做過任何新的授權動作，也沒有要求 Tiffany 重新授權。**

**為什麼可用，尚未定論。**本節初稿把原因歸給下一節那條結論（Dashboard 權杖不帶同意快照，
反映 App 當下權限）。同日稍晚取得的 App 權限快照顯示
`instagram_business_manage_insights` 的**呼叫數是 0**，而我們當天至少打了 460 次洞察 ——
若該計數為真，洞察根本不歸這項權限管，很可能算在 `instagram_business_basic` 底下，
那麼上面那個解釋就是錯的。兩種可能都還站得住（Dashboard 計數也可能有延遲）。

實務上不影響使用，但**不要因為「它是 0」就把 `manage_insights` 關掉** ——
關錯了 `instagram:stats` 會跟著壞。完整清單與分類見 [`APP_PERMISSIONS.md`](./APP_PERMISSIONS.md)。

已知邊界（同日實測）：

- `impressions` 對 FEED 已停用，Meta 回「does not support the impressions metric
  for this media product type」。改用 `views`。
- 帳號層級的 `follower_count` 時間序列讀不到；但 `GET /me?fields=followers_count`
  可以，追蹤者數走這條。

讀取工具見下方「成效盤點」。

**未採用**

| 未採用 | 理由 |
|---|---|
| 應用程式檢閱（App Review） | 只在存取「不在 App 角色內」的帳號時才需要。三個帳號都以 Instagram tester 身分授權，不需審查。將來要服務多位老師且不逐一加 tester 時才評估，屆時另需商業驗證 |

### 重要更正：Dashboard 產生的權杖不帶同意快照

本文件先前記載「在 App 加權限不會讓已發出的權杖獲得新權限」。**該說法錯誤，已撤回。**

2026-08-31 實測：在 App 加入 `manage_comments` 與 `manage_messages` 之後，
先前已發出、未重新授權的 `@hopelight.ig` 權杖同樣取得了這兩項能力。

原因是這些權杖由 **App Dashboard 直接產生**，不經過真正的 OAuth 同意畫面，
因此不帶「使用者當初同意了哪些範圍」的快照，而是反映 **App 當下擁有的權限**。

實務含意：

- **Dashboard 產生的權杖無法逐支限制權限範圍**，它拿到 App 的全部權限。
- 若需要發出「只能發布、不能讀私訊」的權杖，必須改走 Business Login 的 OAuth 流程，
  在授權網址中明確指定 `scope`。這也是先前判斷「商家登入之後再說」需要修正的地方。
- 每次調整 App 權限，都應重跑 `capabilities` 確認三個帳號的實際能力，不要依賴
  「當初授權了什麼」的記憶。本工作區只轉接兩支；`darrenfiy` 要從 Manus 跑
  `node social.mjs capabilities --talent darrenfiy --channel instagram`。

### 帳號設定檔與誤發防護

**2026-09-05 起本工作區不再持有任何權杖。**下表是 Manus 側具名設定檔的對照；
本工作區的相容入口只轉接前兩支。

| 設定檔 | 帳號 | MODE | 本工作區可轉接 |
|---|---|---|---|
| `hopelight` | `@hopelight.ig`（Tiffany 品牌主帳號） | `production` | 是 |
| `moment` | `@hopelight.moment`（Tiffany 第二帳號） | `production` | 是 |
| `darrenfiy` | `@darrenfiy`（Darren 自有帳號） | `production` | 否 —— 直接用 Manus `social.mjs` |

- **沒有預設設定檔**：三個設定檔全部指向真實帳號，沒有一個適合當「猜錯時掉進去的
  地方」。未指定 `--profile` 時相容層直接中止，不替使用者猜測目標帳號。
  （舊機制是 `.env` 的 `INSTAGRAM_DEFAULT_PROFILE` 刻意留空；那個檔案已退役。）
- 這個設定檔在 2026-09-03 之前叫 `sandbox`、MODE 是 `sandbox`，兩者都是錯的。
  舊名讓 `--confirm-production` 防線對這個真帳號永不觸發，也讓兩段錯的引擎程式碼
  看起來是對的，當天造成三次故障。詳見 `Control-Room/worklogs/social-publishing/`。
- `production` 設定檔在輸出頭尾各顯示一次警告橫幅。
- 登記 `_USERNAME` 後，工具會比對權杖實際打到的帳號，不符即中止。
- 設定檔名稱只允許 `[A-Z0-9]`，**不可含底線**。`INSTAGRAM_PROFILE_HOPELIGHT_MOMENT_TOKEN`
  這類寫法會被安靜忽略、不報錯，因此第二帳號的設定檔名是 `moment` 而不是 `hopelight_moment`。
- 舊格式 `INSTAGRAM_LONG_LIVED_TOKEN` 天生只能表達一個帳號，且在程式中被寫死為
  `hopelight`／`production`。2026-09-03 已全面改用具名格式並移除舊鍵。
  **遷移時務必補上 `_MODE=production`**，否則會落回預設的 `sandbox`，
  警告橫幅與 `--confirm-production` 保護會一起無聲消失。

注意：`@darrenfiy` 是有 384 篇貼文的真實帳號，不是空白測試帳號。
在其上做發布測試會對真實追蹤者可見。它現在登記為 `production`，會顯示警告橫幅、
要求 `--confirm-production`——這正是它應得的待遇。
若哪天需要完全無痕的測試環境，要另開乾淨帳號，不要把這一個改回 `sandbox`。

### 待觀察

~~`@hopelight.ig` 與 `@darrenfiy` 的類型是 `MEDIA_CREATOR`，發布 API 對創作者帳號的支援可能有差異~~
**已解除（2026-09-04）**：`@hopelight.ig` 以 `MEDIA_CREATOR` 身分成功發布 Reels 含自訂封面，
帳號類型不構成發布障礙。

~~`moment` 尚未跑過 `npm run instagram:capabilities`~~
**已補測（2026-09-04）**：四項權限逐項確認，與另兩支一致。不再是推論。

~~仍未驗證：留言與私訊的「回覆」~~
**已於 2026-09-04 驗證，結果與預期相反**：留言的**寫入**可用（建立與回覆都成功），
但**讀取被靜默拒絕**。詳見「留言 API 驗證」一節。

由此產生的新未知，優先度高於原本那條：

- **留言讀取何時能解封？**推測與 App Review／發布狀態有關，需人到 Dashboard 確認。
- ~~刪除留言未測~~ **已驗證可用**（2026-09-04）。逐則生效，計數如實反映。
- **私訊仍完全未證實。**空會話無法解讀，不要當成「沒有訊息」。

另外，官方文件指出：若 Instagram 帳號連到需要「粉絲專頁發布授權（PPA）」的粉專，
完成 PPA 前無法以 API 發布。目前尚未連結 Page，暫時不受影響；
2026-09-07 之後若完成 Page 連結，需重新驗證發布是否仍正常。

### 唯讀核對與權限盤點指令

```powershell
npm run instagram:whoami -- --profile hopelight     # 正式帳號 @hopelight.ig
npm run instagram:whoami -- --profile moment        # 正式帳號 @hopelight.moment
npm run instagram:capabilities -- --profile hopelight
npm run instagram:capabilities -- --profile moment
npm run instagram:stats -- --profile hopelight     # 成效盤點（瀏覽／觸及／互動）
npm run instagram:stats -- --profile moment
npm run instagram:stats -- --profile hopelight --tsv   # 機器可讀，供彙整報表
```

`whoami` 與 `stats` 全程唯讀；`capabilities` 預設也只送 GET。三支都不輸出權杖、
留言內容或訊息內容。

權限盤點的判定方式：每一項都設計成能分辨「被權限擋下」與「權限已通、被其他原因擋下」。
發布權限沒有真正的純讀探測：舊工具會送出無效素材網址，但那仍是 POST，極端情況可能
建立一個未發布的暫存容器。新工具預設把這項標成 `[—]` 未主動探測；確實需要重測時，
才另加 `--probe-publish-permission --confirm-live-account @handle`。無法分辨時一律回報
「無法判定」，不猜測。

### 留言 API 驗證（2026-09-04）

在 `@darrenfiy` 自有帳號上實測，貼文
[/p/Dcx9D2XmLXt/](https://www.instagram.com/p/Dcx9D2XmLXt/)（測試前留言數 0）。
**不在客戶帳號上做**，因為會產生真實的公開回覆。

| 動作 | 端點 | 結果 |
|---|---|---|
| 建立留言 | `POST /{media-id}/comments` | **可用**，回傳 comment id |
| 回覆留言 | `POST /{comment-id}/replies` | **可用**，回傳 reply id |
| 刪除回覆 | `DELETE /{reply-id}` | **可用**，`{"success":true}` |
| 刪除留言 | `DELETE /{comment-id}` | **可用**，`{"success":true}` |
| 讀回留言／回覆 | `GET /{comment-id}`、`/{comment-id}/replies` | **讀不到**，回傳 `{}` 或空陣列 |
| 貼文留言計數 | `GET /{media-id}?fields=comments_count` | 0 → 2 → 1 → 0，全程如實反映 |

刪除逐則生效，回覆與留言是各自獨立的物件：先刪回覆 `2 → 1`，再刪留言 `1 → 0`。
刪除父留言不需要先清掉底下的回覆，但本次沒有測「直接刪父留言時回覆會不會連帶消失」。
測試後貼文已回到測試前的狀態（0 則留言）。

**`comments_count` 是目前唯一的觀測窗。**讀不回內容的情況下，
「刪對了沒有」只能靠計數變化推斷 —— 計數對得上，但看不到刪掉的是哪一則。

#### 讀取是被靜默拒絕的，不是「沒有資料」

這一項在客戶帳號上另外對照過（唯讀，未取留言內容）：

```text
@hopelight.ig 的 /reel/DYE4ziTShP2/
  comments_count      = 447
  GET /{id}/comments  → data: []，但 paging 同時帶 cursors 與 next
  跟著 next 再要一頁  → 仍然 data: []
```

**HTTP 200、沒有錯誤碼、沒有權限訊息，資料就是取不到，而且平台一直宣稱還有下一頁。**
`@darrenfiy` 上我們自己剛送出的那兩則也一樣讀不到，所以這不是第三方隱私過濾，
而是讀取能力整體不可用。

**原因已確認（2026-09-04 稍晚）**：App 權限清單顯示
`instagram_business_manage_comments` 停在**「可供測試」＝ 標準存取（Standard Access）**，
清單裡 29 項**全部**都是這個狀態，沒有任何一項取得進階存取。

標準存取只能碰「在 App 裡有角色的人」的資料。那 447 則留言是素不相識的人寫的，
他們沒有這個 App 的角色，於是逐筆被濾掉 —— 留下空頁加一個「還有下一頁」的游標。
這也解釋了為什麼**發布、洞察、寫留言都能用**：那些都是「關於本帳號自己」的動作或資料。

解封需要商業驗證 + App Review + App 上線，是一段流程不是一個開關。
清單快照與逐項分類見 [`APP_PERMISSIONS.md`](./APP_PERMISSIONS.md)。

#### 實務含意

**寫入能力是完整的，讀取能力是零。**建立、回覆、刪除全部可用；讀取全部被擋。
這是所有組合裡最危險的一種 —— 可以送出、可以刪除，卻無法確認送出了什麼、
無法知道某則留言是不是已經回過、無法在動作之後驗證結果。

任何自動回覆在解除讀取封鎖之前都不該啟動 ——
**不是因為做不到，是因為做了也看不見。**

`private/未讀取內容` 的界線不變：本次驗證全程未取任何 `text` 欄位。

### 權限盤點曾經給出假陽性

`instagram:capabilities` 舊版本把「呼叫成功、回傳空陣列」判成
**「可讀取，最新一則貼文有 0 則留言」**。那正是上面這個靜默拒絕的樣子。

諷刺的是本工具的設計原則就寫著「每一項都要能分辨『權限沒有』與『權限有但因其他原因失敗』」——
但它少了第三種：**呼叫成功、也沒有錯誤、資料卻是空的**。空值沒有被當成需要解釋的東西。

已修正（2026-09-04）：改用「已知有留言的貼文」當試紙，
`comments_count > 0` 但邊回 0 筆時判為 `[空]` 靜默拒絕。私訊沒有等價試紙，
因此一律回報 `[?]` 無法判定，不再宣稱可讀取。

```text
[空] 讀取留言   instagram_business_manage_comments
     該貼文 comments_count=8，但 comments 邊讀到 0 筆。呼叫沒有報錯，資料卻取不到
     —— 這是靜默拒絕，不是「沒有留言」。
```

### 成效盤點（`instagram:stats`）

```powershell
npm run instagram:stats -- --profile hopelight
npm run instagram:stats -- --profile moment
npm run instagram:stats -- --profile hopelight --tsv > stats.tsv
```

輸出三段：逐篇成效（瀏覽／觸及／讚／留言／收藏／分享）、月彙總、合計。

**刻意不讀留言內容與留言者身分**，只取 `comments_count` 這個數字。理由寫在 Manus
canonical script 開頭：
產出會進公司 repo 當基準紀錄，一旦帶進留言原文就是把顧客個資 commit 進 Git，
而 Git 歷史很難事後清乾淨。要看留言內容請開 Instagram App。

兩個實作細節值得記住：

- **分頁要走完。**`/me/media` 一頁 25 筆（本工具指定 50）。只讀第一頁在貼文數變多之後
  會安靜地少算，而少算的數字看起來完全正常。發布引擎的對帳目前就有這個缺口。
- **metric 用不到的就標 `?`，不填 0。**不同 `media_product_type` 支援的 metric 不同；
  猜 0 會讓「沒有這個指標」和「這個指標是零」變得無法分辨。

數字是查詢當下的快照，瀏覽與觸及會持續累加。跨日比較請以執行時間為準，
基準紀錄見 `Three-Quarters-International/PUBLISHING/SOCIAL_MEDIA/ANALYTICS/`。

### 發布工具

`npm run instagram:publish` 已退役，執行時只會說明正確入口，不再接受 `--env-file`。
原因不是 adapter 不能發，而是直接從客戶工作區呼叫它會繞過 Manus 的 job、payload binding、
逐字核准與 durable receipt。

發布一律從 `Manus/tools/social-publishing/social.mjs` 走
`new → prepare → approve → claim → publish → archive → clean`。圖片、Reels、自訂封面、
正式帳號確認與短效素材交付都由那條流程處理。

### 素材必須是公開 HTTPS 網址

Meta 不接受本機檔案上傳，它會自行前往指定網址抓取素材。圖片與影片都一樣。

目前由 Manus 啟動本機 frozen-byte server 與 Cloudflare quick tunnel，Meta 回抓驗證通過後
才送出，流程結束立即關閉。Tiffany 的素材不再永久掛在協作者的個人網站上。

#### 已確認不可行：直接上傳檔案

2026-08-31 實測，以 `media_type=REELS` 加 `upload_type=resumable` 建立容器：

```text
HTTP 400  The parameter video_url is required  (IGApiException, code 100)
```

Meta 忽略 `upload_type=resumable`，仍要求公開網址。官方文件說明直接上傳
（resumable upload 至 `rupload.facebook.com`）**僅供已實作 Facebook Login for Business
的 App 使用**，本專案走 Instagram Login，因此沒有這條路。不需要再測一次。

若日後改用 Facebook Login for Business（需先完成 Page ↔ Instagram 連結），
即可直接上傳檔案，hosting 問題消失；代價是重新授權、更換權杖體系，
並重新引入本專案刻意避開的粉絲專頁依賴。

#### 建議的素材供應方式

**已採本機暫時服務加臨時隧道。**發布時於本機起 HTTP 服務並開通道，
把網址交給 Meta 抓取，完成後立即關閉。R2／S3 短效簽名網址保留為未來替代方案，
目前不需要多養一個服務。

### 圖片與 Reels 的差異

| | 圖片 | Reels |
|---|---|---|
| 參數 | `image_url` | `video_url` + `media_type=REELS` |
| 處理 | 幾乎即時 | **非同步轉檔，需數十秒至數分鐘** |
| 發布時機 | 容器建立後即可 | **必須等 `status_code` 變成 `FINISHED`** |

2026-08-30 由 Tiffany 手動上傳的 Reel，技術上可由本工具以 `--video` 發布。

### 2026-08-31 端對端發布驗證

以 `@darrenfiy` 完成從無到有的完整流程，確認整條鏈路可用
（當時該設定檔名為 `sandbox`，但帳號一直是公開真帳號）：

| 項目 | 結果 |
|---|---|
| media ID | `18006306593987726` |
| 公開網址 | https://www.instagram.com/p/DcrMOoMj3JQ/ |
| 發布時間 | 2026-08-31 02:47:59（Asia/Taipei） |
| 素材 | HTML 經 Chrome 轉 1080×1080 JPEG，託管於 three-quarters.net |
| 帳號提及 | `@hopelight.ig`、`@alishasatojp`，已確認可正常標註 |
| Hashtag | 五個，已確認可用 |

流程照設計走：先預檢建容器，確認無誤後才以 `--publish` 送出。

### 尚未完成

1. ~~權限設定、tester 指派、授權、唯讀 `/me` 核對~~ 已於 2026-08-31 完成。
2. ~~建立誤發防護~~ 已完成（`_USERNAME` 比對、`--confirm-production`、無預設設定檔）。
   **沒有真正的沙盒帳號**：`@darrenfiy` 一度被當成沙盒，它不是。
3. ~~建立發布工具，含預檢閘門與正式帳號確認~~ 已完成，圖片與 Reels 皆支援。
4. ~~素材以短效 HTTPS URL 提供給 Meta，完成後刪除暫存~~ **已完成。** Manus 使用
   quick tunnel 提供凍結位元組，發布前回抓驗證，完成後關閉；不再把素材長期放在公開網站。
5. ~~尚未對 `@hopelight.ig` 或 `@hopelight.moment` 發布過任何內容~~
   **已過期。**兩個客戶帳號都已發布。截至 2026-09-04，經 `Manus` 發布引擎
   移交的 durable package 共 **9 份**（`@hopelight.moment` 6、`@hopelight.ig` 1、
   `@darrenfiy` 2），逐篇由 Darren 核准，收據在
   `Three-Quarters-International/PUBLISHING/SOCIAL_MEDIA/PUBLICATIONS/`。
   另有 2 篇更早的發布沒有正式收據（引擎抽出之前）。
   帳號上的貼文總數不等於這個數字 —— 兩個帳號本來就有非經本工具發布的內容。
6. 排定兩支客戶權杖的刷新（`hopelight` 2026-10 中旬、`moment` 2026-10 下旬）。
   使用 Manus `social.mjs refresh` 重新封存，並更新公司 channel 與 Vault registry；
   `darrenfiy` 的期限由公司 repo 管理，不在此列。

### 自動回覆的實際規模

已取得 `manage_messages` 與 `manage_comments`，但權限只是入場券。仍待處理：

| 項目 | 狀態 |
|---|---|
| Webhook 訂閱設定 | 未做。自動回覆必須靠 Webhook 接收事件，無法用輪詢取代 |
| 公開 HTTPS 端點 | 未做。測試階段可用隧道工具，正式需 24 小時在線的伺服器 |
| 開發模式能否收到 Webhook 事件 | **未知，需實測**。Dashboard 表示接收 Webhooks 需 App 為已發布狀態，但對測試人員帳號是否適用尚未驗證 |
| 24 小時回覆窗 | Instagram 私訊限制，超過時限不能主動回覆，會影響自動回覆的設計 |
| 回覆內容的責任歸屬 | **方向已定，細節未定**（2026-09-04）。採「已核准句庫 + 分類」而非自由生成：AI 只能從人定稿的句子裡挑，不得自行造句。見 `Control-Room/PM/DECISIONS/2026-09-04-instagram-comment-replies.md` |
| 回覆 API 是否可用 | **可用**（2026-09-04 於 `@darrenfiy` 實測，`POST /{comment-id}/replies` 成功） |
| **讀取留言是否可用** | **不可用，靜默拒絕**（2026-09-04）。這是目前的真正擋路：讀不到留言就無法分類、無法去重、無法驗證送出結果 |

**上表的順序其實反了。**原本以為缺的是 Webhook 與伺服器那些基礎建設；
實際上第一道關卡是**連留言都讀不到**。在那之前，Webhook 有沒有都不重要。

規模判斷：發布工具是單機 CLI；自動回覆是需要上線維運的服務。兩者不是同一個量級。

## 官方 LINE 導流

最後確認：2026-08-24（Asia/Taipei）

- 官方 LINE ID：`@happy139`
- 加好友網址：`https://lin.ee/vG7eI1Dv`
- 網站位置：「老師介紹頁」的「預約與老師對話」按鈕
- WordPress 後台可以修改網站上的按鈕文字與目標網址；LINE 官方帳號本身的名稱、個人檔案、圖文選單、訊息與好友管理，需在 LINE Official Account Manager 處理，不能從 WordPress 修改。
