# HopeLight 預約付款、銀行匯款核帳、三路通知與行事曆整合 Blueprint

文件狀態：`v0.2｜給 mamasan 核對的工程草稿`

日期：`2026-09-01（Asia/Taipei）`

整理層級：`L1 結構整理；核心架構為新設計，不是 Tiffany 原稿改寫`

核對順序：`Darren 草稿 → mamasan QC／QA → Tiffany 決定是否採用及授權`

目前狀態：`LINE 後台登入已驗證；Messaging API 尚未啟用；Google 尚未授權；銀行轉帳（BACS）現況已唯讀查核；正式站未修改`

## 1. 結論先行

**[後台查核＋新設計]**

建議把銀行匯款一起做，但要把「顧客回報已匯款」與「Tiffany 確認實際入帳」分成兩個狀態。回報不能直接視為付款成功。推薦的正式架構是：

```text
線上金流付款確認 ───────────────────────┐
                                        ▼
銀行轉帳訂單建立                         只建立一次的「已付款」語意事件
  └─► 顧客回報已匯款                       │
       └─► LINE＋Email 通知 Tiffany 待核帳  ├──► Tiffany 專用 Google Calendar
            └─► 登入安全核帳頁確認入帳 ─────┤
                                             ├──► Tiffany LINE：已付款
                                             └──► Tiffany Email：已付款

LINE／Email 按鈕：
  待核帳通知 → 查看安全核帳頁
  已付款通知 → 查看預約後台＋查看 Google 行事曆
```

使用者的通道優先順序是 `LINE → Email → Google Calendar`。銀行轉帳分支中，LINE 與 Email 先通知 Tiffany「待核帳」；Tiffany 登入 WordPress 安全頁面查核銀行後，系統才呼叫 WooCommerce 的 `payment_complete()`，接入與線上金流相同的三路已付款流程。第一版建議只在核帳成功後建立正式 Calendar event，避免未入帳訂單污染 Tiffany 行事曆。

技術執行時會先嘗試建立 Calendar event，讓已付款 LINE 與 Email 可以帶回同一個「查看行程」連結。Calendar 暫時失敗時，不能阻擋 LINE／Email、顧客結帳或核帳，失敗工作要在背景重試並留下不含個資的紀錄。

這不是大型系統，但也不適合直接在正式站邊點邊做。LINE Provider、Tiffany 的 LINE 收件身分、Google OAuth、Email 收件人、取消／退款規則都屬長期資產或營運規則，先由 mamasan 核對 Blueprint 再施工較安全。

## 2. 資訊來源與判斷標記

- **[需求來源]**：2026-09-01 對話中提出的 LINE、Email、Tiffany Google Calendar 三路通知，以及銀行匯款後由 Tiffany 人工確認入帳的需求。
- **[後台查核]**：2026-09-01 對 HopeBox 與 LINE Official Account Manager 的唯讀檢查。
- **[現有系統]**：目前已上線的 HopeLight 預約外掛與 WooCommerce 行為。
- **[新設計]**：本 Blueprint 為滿足需求新增的工程架構。
- **[待決定]**：尚未取得 mamasan 或 Tiffany 明確答案，不能自行代替決定。

## 3. 2026-09-01 已確認現況

### 3.1 HopeBox／WooCommerce

**[後台查核]**

- HopeLight 完整預約系統會監聽 WooCommerce 的付款完成與訂單狀態，將對應預約改為「已確認」。
- 外掛本身沒有直接呼叫 `wp_mail()`，也沒有 LINE API、Webhook、MailPoet 或外部 HTTP 通知程式。
- WooCommerce 的「新訂單」Email 已啟用，收件人是 WordPress 管理員信箱；它屬於另一個網站管理員帳號，不是後台中可辨識的 Tiffany／HopeLight 管理員帳號。
- 可見的一筆已付款預約已連到完成的 WooCommerce 訂單；訂單備註留有「新訂單 Email 已寄出」的系統紀錄。這只能證明網站曾送信，不能證明收件匣或手機實際顯示通知。
- 顧客端的處理中／完成訂單 Email 已啟用。現有外掛會在顧客訂單頁與顧客 Email 加入 Google Calendar 預填連結，而且明確略過管理員 Email；這不是 Tiffany Calendar 同步。
- WooCommerce Webhook 數量為 0。
- HopeLight「服務與付款」頁沒有通知收件人、Webhook、LINE 或 Calendar 設定欄位。
- MailPoet 仍停在初始導覽，沒有 Email 或 Automation。
- 19 個啟用中的 WPCode 片段已做結構化掃描；沒有付款完成通知、LINE API、MailPoet、Google Calendar 或額外寄信邏輯。
- WooCommerce 原生離線付款方式「銀行轉帳」已啟用，gateway ID 為 `bacs`。WooCommerce 的標準語意是：非零金額 BACS 訂單先進入 `on-hold`，店家實際查到款項後才人工確認付款。
- HopeLight 後台目前設定「付款保留分鐘」為 10 分鐘；但現行預約外掛收到 WooCommerce `on-hold` 狀態時，會立即把預約寫成 `confirmed`／`booked`、把付款狀態寫成 `on-hold`，並清除 `hold_token` 與 `hold_expires`。
- 因此，目前尚未核帳的銀行轉帳預約可能無期限占用時段；既有 10 分鐘保留設定無法替這類 `on-hold` 預約自動釋放。
- 現有網站沒有「顧客回報已匯款」、Tiffany「待核帳」通知、核帳期限、核帳稽核標記或安全確認頁。

### 3.2 LINE Official Account

**[後台查核]**

- 目標官方帳號：`💙希望之光🧡腦意識評量`。
- 對外 LINE ID：`@happy139`；管理帳號識別：`@290ykfry`。
- 2026-09-01 已由使用者在可見 Chrome 完成 LINE Business ID 驗證，本機 cached session 可正常重入。
- 目前可開啟「設定 → Messaging API」。頁面顯示「啟用 Messaging API」按鈕，表示 **Messaging API 尚未啟用**。
- 本次沒有按下啟用、沒有選 LINE Provider、沒有建立 Channel、沒有產生或讀取 Channel Secret／Access Token，也沒有開啟聊天室。

### 3.3 Google Calendar

**[後台查核]**

- Repository 與網站目前沒有 Tiffany Google Calendar 的 OAuth、Calendar ID、refresh token 或自動建立事件程式。
- 現有顧客端 Google Calendar URL 只會打開預填畫面；使用者仍需登入、選日曆並按儲存，重複點擊可能建立重複事件。

## 4. 推薦採用的正式體驗

### 4.1 付款完成

**[新設計]**

只有含合法 HopeLight booking metadata、且付款第一次真正完成的訂單才觸發：

1. 在 Tiffany 的專用「Hope Light 預約」Google Calendar 建立私人事件。
2. LINE 1 對 1 推送一張 Flex Message 給 Tiffany。
3. 寄一封專用的「預約已付款」Email 給 Tiffany。
4. LINE 與 Email 都提供相同的兩個按鈕：
   - `查看預約後台`
   - `查看 Google 行事曆`

如果 Calendar API 當下失敗，LINE 與 Email 仍要送出，但只能顯示「行事曆建立待重試」與預約後台連結；背景工作繼續補建 Calendar，不能拖慢顧客結帳。

### 4.2 改期、取消與退款

**[新設計／待決定]**

| 事件 | Calendar | LINE | Email |
|---|---|---|---|
| 第一次已付款 | 建立同一筆私人事件 | 發一次付款通知 | 發一次付款通知 |
| 改期 | 更新同一 event，不另建 | 發一次改期通知 | 發一次改期通知 |
| 明確取消預約 | 標示已取消並釋放時間；是否刪除待決定 | 發一次取消通知 | 發一次取消通知 |
| 全額退款 | **待決定是否等同取消** | 未決定前只進人工覆核 | 未決定前只進人工覆核 |
| 部分退款 | 不自動改動 | 人工覆核 | 人工覆核 |
| 線上付款 pending／failed | 不建立正式事件 | 不發「已付款」 | 不發「已付款」 |
| BACS 訂單建立／尚未回報 | 有限期保留，不建立正式事件 | 可選擇不通知或只做摘要；不發「已付款」 | 可選擇不通知或只做摘要；不發「已付款」 |
| BACS 顧客回報已匯款 | 不建立正式事件 | 發一次「待核帳」 | 發一次「待核帳」 |
| BACS Tiffany 確認入帳 | 進入第一次已付款流程 | 發一次已付款通知 | 發一次已付款通知 |
| processing → completed | 不再建立第二筆 | 不重複通知 | 不重複通知 |

退款是財務事件，不應在沒有營運規則時自動解讀成取消預約。

### 4.3 銀行匯款人工核帳分支

**[後台查核＋新設計／待決定]**

WooCommerce 的 BACS 本來就是離線付款：網站提供匯款資訊，訂單先等待店家核對，不能只憑顧客按下「我已匯款」就宣稱收款成功。建議狀態如下：

```text
awaiting_transfer（等待顧客匯款／有限期保留）
  ├─ 期限內未回報 ─► expired_unreported（釋放時段）
  └─ 顧客提交回報 ─► transfer_reported（待 Tiffany 核帳）
                         ├─ 資料不符 ─► needs_correction
                         ├─ 核帳逾時 ─► review_expired／人工例外佇列
                         └─ 確認入帳 ─► payment_complete()
                                            └─► verified／既有 paid 三路流程

到期後才匯款或回報 ─► late_report（不得自動重新占用已釋放時段）
金額或核帳有爭議   ─► verification_disputed（人工處理）
```

#### 顧客端「回報已匯款」

- 在訂單完成頁、顧客 Email 與「我的帳號 → 訂單」提供需驗證訂單身分的回報入口。
- 第一版最小欄位：匯款日期／時間、實際匯款金額、帳號末五碼或交易參考碼（擇一）、短備註。
- 第一版不收存摺或收據圖片，避免上傳檔案、OCR、個資保存與人工判讀工程膨脹。
- 重複提交只更新同一筆回報並留下版本，不延長原本的硬性期限，也不重複轟炸 Tiffany。
- 畫面必須明確顯示：「回報已匯款不等於確認入帳；預約以店家核帳結果為準。」

#### Tiffany 的待核帳通知

- 顧客首次有效回報後，LINE 與 Email 各發一次「銀行轉帳待核帳」。
- 通知只顯示預約編號、日期、時間、應收金額與回報時間；不放完整帳號、末五碼、交易備註或可直接改狀態的網址。
- 唯一操作按鈕是 `開啟安全核帳頁`，導向需登入 WordPress 且具 `manage_woocommerce` 權限的管理頁。
- 若 Tiffany 未在營運期限內處理，依第 13 節核准的節奏提醒一次，之後轉給備援核帳人；不無限重送。

#### 安全確認入帳

核帳頁必須同時做到：

1. 重新確認登入身分與 `manage_woocommerce` capability。
2. 使用 POST 動作與 nonce／CSRF 防護；LINE 或 Email 的 GET／預覽請求永遠不能改變訂單狀態。
3. 顯示 WooCommerce 應收金額、顧客回報資料與目前狀態，要求 Tiffany 勾選「已在銀行端確認實際入帳」。
4. 送出瞬間再鎖定並重查狀態，確保兩個視窗同時確認時只有一個成功。
5. 寫入核帳者、時間、金額、回報版本與不可重複的 verification marker；稽核紀錄不保存完整銀行資料。
6. 由網站呼叫 `$order->payment_complete()`，再觸發共用的 `hopelight_booking_paid`，不能另寫一條看似已付款但語意不同的捷徑。
7. 若有人只在 Woo 訂單頁直接把狀態改成 processing／completed，卻沒有 BACS verification marker，系統應阻止自動發「已付款」或送進例外佇列供人工確認。

WordPress nonce 只能防 CSRF，不能取代登入、權限、狀態重查與伺服器端鎖定。

#### 時段期限與例外

下列是工程候選值，必須由 mamasan／Tiffany 決定後才能套用：

- 預約開始前少於 48 小時，不提供 BACS，改用即時付款方式。
- 建單後 24 小時內、且最晚在預約前 24 小時完成匯款回報。
- Tiffany 最晚在回報後 12 小時內、且預約前 12 小時完成核帳；4 小時提醒，8 小時轉備援。
- `transfer_reported` 不應被一般未付款清理工作誤刪；但也不能永久占位。到硬性核帳期限仍未處理時，進人工例外佇列，由核准的人決定延長、釋放或聯絡顧客。
- `expired_unreported` 釋放時段後若發生晚匯款，不得自動恢復預約或搶回已售時段，需人工協調改期或退款。

第一版 Calendar 只在 `verified` 後建立正式事件。若日後 Tiffany 明確需要看見待核帳時段，可另加灰色 `[待核帳]` tentative event；這不是 MVP，且必須處理到期刪除、晚匯款與正式事件轉換。

銀行退款仍由人員在真實銀行端執行。WooCommerce 手動退款紀錄本身不會替 BACS 自動把錢匯回顧客，介面與通知不得宣稱「已退款」除非另有銀行端證據。

## 5. 觸發與去重設計

### 5.1 單一語意事件

**[新設計]**

現有預約外掛同時監聽：

- `woocommerce_payment_complete`
- `woocommerce_order_status_processing`
- `woocommerce_order_status_completed`

同一訂單可能依序通過多個 hook，因此通知模組不能直接在三個 hook 各送一次。也不能把「預約第一次變成 `confirmed`」當成付款條件，因為現行 BACS `on-hold` 已會把預約標成 `confirmed`。建議先驗證 WooCommerce 訂單真的具有 paid 語意；若付款方式是 `bacs`，還必須具有有效的人工核帳 marker，才建立網站內部事件：

```php
do_action(
    'hopelight_booking_paid',
    $booking_id,
    $order_id,
    'v1'
);
```

通知模組只監聽這個事件，並先寫入唯一 ledger，再排背景工作。唯一鍵建議為：

```text
booking:{booking_id}:paid:v1
```

一張訂單可能包含多個 booking，因此去重主體必須是 booking／order item，不可只用 order ID。

銀行轉帳另有四個流程事件，與「已付款」事件清楚分離：

```text
hopelight_bank_transfer_reported   顧客首次／更新匯款回報
hopelight_bank_transfer_verified   Tiffany 完成安全核帳
hopelight_bank_transfer_expired    未回報到期或核帳期限到期
hopelight_bank_transfer_exception  晚匯款、金額不符、繞過核帳等例外
```

`verified` 先寫入不可重複的核帳 marker，再呼叫 `$order->payment_complete()`；真正的三路付款通知仍只由 `hopelight_booking_paid` 啟動。建議唯一鍵例如：

```text
booking:{booking_id}:bank-transfer-reported:{report_version}:v1
booking:{booking_id}:bank-transfer-verified:v1
booking:{booking_id}:paid:v1
```

### 5.2 背景工作

使用 WooCommerce 既有的 Action Scheduler：

```text
銀行轉帳回報
  └─ 只排一次 hopelight_booking_notify_bank_review
       ├─ line.push_review_required
       └─ email.send_review_required

付款成功（線上付款，或 BACS 已核帳）
  └─ 只排一次 hopelight_booking_notify_paid
       ├─ calendar.create_or_get
       ├─ line.push_paid
       └─ email.send_paid
```

每個通道分開保存狀態，LINE 失敗不能阻斷 Email／Calendar，反之亦然。重試採指數退避並設上限；超過上限進入人工重試清單。

LINE 第一次送出就使用穩定的 `X-Line-Retry-Key`。網路 timeout 後使用同一 key 重試，降低重複推播風險。

LINE 回傳 `200` 只表示 API 接受請求，不保證手機實際跳出通知；Email mailer 回報成功也只代表交給郵件傳輸層，不代表收件匣一定收到。因此 ledger 使用 `accepted_by_provider`，不宣稱 `delivered_to_device` 或 `delivered_to_inbox`。

## 6. LINE 實作

### 6.1 必要設定

**[新設計／待決定]**

1. 在 LINE OA Manager 啟用 Messaging API。
2. 選定一個由 Hope Light／mamasan 可長期持有的 LINE Provider。
3. 確認目前登入者在 LINE Developers Channel 也具有必要角色；OA Manager Admin 不等於 Developers Channel Admin。
4. 建立公開 HTTPS webhook endpoint。
5. 以 Channel Secret 驗證每一筆 webhook 的 `x-line-signature`。
6. 使用可撤銷、可輪替的 Channel Access Token；正式秘密不得放在 Git、Markdown、OneDrive、瀏覽器輸出或 WordPress debug log。

LINE Provider 與 Channel 是長期資產歸屬，不應未經 mamasan 確認就綁在 Darren 個人 Provider；也不能只因目前按鈕可點，就直接視為 Tiffany 已授權建立。

### 6.2 Tiffany 收件身分綁定

LINE push 需要 Messaging API 的 `userId`，它不是公開 LINE ID，也不能從 `@happy139` 推算。

推薦流程：

1. Tiffany 將 Hope Light 官方帳號加為好友。
2. 系統產生一次性、短效配對碼。
3. Tiffany 私訊官方帳號：`綁定預約通知 <配對碼>`。
4. 經驗簽的 webhook 取得 `source.userId`。
5. 只把該 userId 綁定為 `Tiffany booking recipient` allowlist。
6. 發送一則 `[測試] 預約通知綁定成功`，由 Tiffany 人工確認。

第一版只做 Tiffany 個人 1 對 1 push，不做群組、broadcast 或 multicast。群組會讓所有成員看到訊息，而且計費依群組人數計算，個資風險也更高。

付款後的主動 push 會計入 LINE OA 訊息用量；1 對 1 直送 Tiffany 時，每次通知通常計 1 則。正式啟用前仍需查看該官方帳號當下方案與剩餘用量。

### 6.3 LINE 訊息內容

推薦 Flex Message：

```text
新預約已付款
預約編號：HB-XXXX
日期：2026-09-10
時間：14:00–16:00（Asia/Taipei）
形式：線上／現場（若營運需要）

[查看預約後台] [查看 Google 行事曆]
```

預設不放：完整姓名、電話、Email、地址、付款方式、交易編號、客戶備註、健康／心理／腦意識內容。手機鎖定畫面可能直接顯示 LINE 通知摘要；如需加入稱呼或姓氏首字，必須由 mamasan／Tiffany 明確核准最低必要欄位。

## 7. Email 實作

### 7.1 專用 WooCommerce Email 類型

**[新設計]**

不要直接把 Tiffany 加進目前的「新訂單」收件人並假裝那等於付款通知。建議新增獨立 WooCommerce email class：

```text
HopeLight｜預約付款成功（內部）
```

特性：

- 只由 `hopelight_booking_paid` 觸發。
- 收件人是獨立設定的 Tiffany Email。
- HTML 有「查看預約後台」與「查看 Google 行事曆」按鈕。
- 純文字版本保留完整可點網址。
- 寄件結果寫入通道 ledger，不保存完整信件內容。
- 若 Tiffany Email 與既有 Woo 新訂單收件人相同，後台顯示「可能收到兩封」警示，讓 mamasan 決定是否停用舊收件路徑。

第一版不取代顧客現有的處理中／完成訂單 Email，也不修改行銷同意。

### 7.2 Email 的 Calendar 按鈕

正式版按鈕文字使用 `查看 Google 行事曆`，因為 Calendar API 已先建立事件。不要寫成「一鍵加入」卻仍要求 Tiffany 登入並手動儲存。

若先做無 OAuth 的過渡版，可以提供：

- `加入 Google Calendar` 預填連結。
- `.ics` 下載備援。

但 UI 與文件必須清楚標示：「仍需確認並儲存，重複點擊可能重複建立。」

## 8. Google Calendar 實作

### 8.1 推薦正式版：Calendar API

**[新設計]**

1. 建立由 Hope Light／mamasan 持有的 Google Cloud project。
2. 啟用 Google Calendar API。
3. Tiffany 一次性走 server-side Google OAuth。
4. 取得 offline access，安全保存可撤銷的 refresh token。
5. 由 Tiffany 建立或指定專用的私人日曆：`Hope Light 預約`。
6. 每筆付款用 `events.insert` 建立事件；改期用 `events.update`，取消用同一 event ID 更新。
7. API 回傳的 `htmlLink` 供 LINE 與 Email 的「查看行事曆」按鈕使用。

優先使用只允許寫入 Tiffany 自有日曆事件的最小 scope；不讀取其他日曆、不搜尋私人行程、不建立 Google Meet、不把顧客加為 attendee。

### 8.2 Calendar event 資料

| 欄位 | 建議 |
|---|---|
| Calendar | Tiffany 專用 `Hope Light 預約` |
| Visibility | `private` |
| Timezone | `Asia/Taipei` |
| Event ID | 由 booking ID 衍生的固定合法 ID，避免重試重複建立 |
| Title | `Hope Light｜預約 HB-XXXX` |
| Description | 不含客戶個資；只放需登入的預約後台連結與狀態 |
| Attendees | 空白 |
| Reminder | 由 Tiffany 決定，例如前 24 小時＋前 2 小時 |
| extendedProperties | 保存 booking ID／通知版本，供更新與查錯 |

Google refresh token 如需存資料庫，必須加密；加密 key 放在 hosting environment，與資料庫及備份分離。提供 disconnect／revoke 功能，不能只能新增不能解除。

## 9. 共用資料與管理畫面

### 9.1 通知 ledger

**[新設計]**

建議建立不含 payload 的 delivery ledger：

| 欄位 | 用途 |
|---|---|
| booking_id／order_id | 追查來源，不複製客戶資料 |
| semantic_event | bank_transfer_reported／bank_transfer_verified／bank_transfer_expired／bank_transfer_exception／paid／rescheduled／cancelled |
| event_version | 模板或規則版本 |
| idempotency_key | 唯一鍵，防重複 |
| channel | line／email／calendar |
| status | queued／accepted_by_provider／retrying／failed／disabled |
| attempts | 重試次數 |
| last_http_code／error_code | 只存代碼，不存外部 response body |
| external_ref | Calendar event ID 等非秘密識別；LINE 不保存訊息全文 |
| queued_at／delivered_at／next_retry_at | 稽核與重試 |

建議保存約 90 天的非個資送達紀錄；實際保存期間由 mamasan 依營運／法務需求決定。

### 9.2 管理設定

只有 `manage_woocommerce` 權限可見：

- Master kill switch。
- LINE／Email／Calendar 各自開關。
- LINE：已啟用／未啟用、Tiffany 已綁定／未綁定；不顯示完整 userId 或 token。
- Email：遮罩後的 Tiffany 收件信箱與測試按鈕。
- Calendar：已連線 Google 帳號的遮罩識別、Calendar 名稱、disconnect／revoke。
- 最近 delivery 狀態、錯誤代碼與手動 retry。
- 測試模式 recipient allowlist；測試訊息一律標 `[測試]`。
- BACS 待核帳清單：回報時間、應收／回報金額、核帳期限、目前負責人與例外狀態。
- BACS 規則：可選日期範圍、回報期限、核帳期限、提醒節奏與備援核帳人。
- BACS 安全核帳頁：只允許授權者查看回報資料並以明確確認動作完成核帳。

所有變更按鈕需 nonce／CSRF 防護；秘密與完整 API response 不進畫面、Git 或 log。

## 10. 安全與個資界線

1. LINE 正式通知走 Messaging API，不以 cached browser session 自動操作後台。
2. LINE Notify 已停止服務，不列為方案。
3. Channel Secret、Access Token、Google client secret／refresh token 不放 WordPress options 明文、Repository、OneDrive、Markdown、終端輸出或 debug log。
4. Webhook 先驗證原始 body 的 LINE signature，再解析內容。
5. 收件人使用固定 allowlist，不可從訂單中的顧客 LINE ID 決定內部通知對象。
6. LINE、Email 與 Calendar 都採資料最小化；查看客戶詳細資料必須回到需登入的 HopeBox 後台。
7. 不在 Calendar URL query 或 LINE 按鈕 URL 放姓名、電話、Email、order key 或可直接讀取顧客訂單的 bearer link。
8. 外部 API 失敗不得讓顧客付款頁 timeout 或回滾已完成付款。
9. 功能旗標可立即停止新通知；既有 queued job 需能安全停止或人工處理。
10. Token 過期／撤銷必須明確告警，不能安靜漏件。
11. 顧客提交匯款回報只代表 `transfer_reported`，絕不能直接改為已付款、建立正式 Calendar event 或發送「已付款」通知。
12. LINE／Email 只能連到安全核帳頁；GET、郵件安全掃描、LINE link preview 或重複點擊都不能確認入帳。實際變更必須是登入後的授權 POST。
13. Nonce 不是授權機制；核帳還必須驗證 capability、訂單／預約狀態、核帳 marker 與併發鎖。
14. 完整銀行帳號、末五碼、交易參考碼、顧客備註不得出現在 LINE、Email、URL query、delivery ledger 或一般 log；只在授權核帳頁按需要顯示。
15. BACS 到期清理與核帳必須共用鎖與狀態重查，避免一邊釋放時段、一邊確認入帳的 race condition。

## 11. 建議上線階段

### Phase 0：資產歸屬與營運決策

- mamasan 核對本 Blueprint。
- 決定 LINE Provider 的名稱、擁有者與 Developers 管理員。
- 確認 Tiffany 專用 Email。
- 確認 Tiffany 要授權的 Google 帳號與專用 Calendar。
- 決定 LINE／Email／Calendar 可顯示的最小資料。
- 決定取消、全額退款、部分退款與改期規則。
- 決定 BACS 最晚可選的預約距離、顧客回報期限、Tiffany 核帳期限與提醒節奏。
- 決定 Tiffany 未處理時的備援核帳人、最低回報欄位，以及待核帳預約是否需要 tentative Calendar event。

完成條件：第 13 節沒有會阻擋啟用的空白決策。

### Phase 1：網站內部事件、ledger 與 Email

- 先在測試環境加入 `hopelight_booking_paid` 語意事件。
- 建立 Action Scheduler 工作、delivery ledger、kill switch。
- 建立 Tiffany 專用 WooCommerce Email。
- 使用假資料測試 payment hook 重複觸發仍只寄一次。
- 修正 BACS `on-hold` 無期限占位問題，建立有限期的 `awaiting_transfer`／`transfer_reported` 狀態與安全清理規則。
- 建立顧客匯款回報表單、Tiffany 待核帳清單、登入後安全確認頁、核帳 marker、併發鎖與例外佇列。
- 確認 BACS 只有在人工核帳後呼叫 `$order->payment_complete()`，才可進入共用 paid 流程。

完成條件：不接 LINE／Google 也能驗證線上付款與 BACS 核帳都只建立一次 paid 事件；未回報訂單可依規則釋放，已回報訂單不被誤清理，且不影響結帳。

### Phase 2：LINE Messaging API

- 經 mamasan 確認後，在 OA Manager 啟用 Messaging API 並選 Provider。
- 建立 webhook、簽章驗證與 token 保存／輪替。
- Tiffany 加好友並用一次性配對碼綁定 userId。
- 先只向核准的測試 recipient 發送 `[測試]` Flex Message。
- 加入 BACS `transfer_reported` 的「待核帳」LINE／Email 通知；按鈕只能開啟安全核帳頁，不能直接確認付款。

完成條件：付款測試只推送一次，重試不重複，聊天室內容沒有被讀取或保存。

### Phase 3：Google Calendar API

- 建立 Google Cloud project、OAuth redirect 與最小 scope。
- Tiffany 授權專用 Calendar。
- 實作 create／update／cancel，同一 booking 固定使用同一 event ID。
- LINE／Email 改用 Calendar `htmlLink` 的「查看行事曆」。
- BACS 第一版只在 Tiffany 核帳完成後建立正式 event；未核帳不建立 tentative event。

完成條件：付款建立一筆、改期更新同一筆、取消依核准規則處理，不重複。

### Phase 4：端對端小量試跑

- 先用假顧客與測試付款。
- 覆蓋 BACS 建單、未回報到期、回報、重複回報、核帳、併發核帳、晚匯款與金額不符的端對端測試。
- 再由 mamasan 核准一筆低風險正式測試。
- 驗證 LINE、Email、Calendar、後台 ledger 與公開結帳頁。
- 觀察重試、延遲與錯誤後才全面啟用。

完成條件：三路結果與唯一 booking 對得上，沒有個資／secret 進 log，且關閉任一通道不影響其他通道。

## 12. 驗收標準

- 同一筆付款即使依序觸發 payment complete、processing、completed，也只產生一次 paid 語意事件。
- 一張訂單含多個 booking 時，每個 booking 各自正確處理，不因 order ID 去重而漏件。
- LINE 只送給核准的 Tiffany userId，不 broadcast、不送到顧客。
- LINE timeout 後以相同 retry key 重試，不產生重複通知。
- Tiffany Email 收到專用付款通知；既有 Woo 新訂單 Email 的重複風險已由 mamasan 決定。
- Calendar event 是 private、Asia/Taipei、無 attendee、無客戶敏感資料。
- LINE 與 Email 的行事曆按鈕指向同一筆 event。
- 改期更新同一 event；取消／退款符合已核准規則。
- LINE、Email、Calendar 任一失敗都不阻塞付款，也不讓其他通道安靜漏件。
- Token 撤銷、Webhook 失敗、Google OAuth 失效會在管理頁顯示可處理狀態。
- Master／per-channel kill switch 與手動 retry 可用。
- Repository、Git diff、終端、log、測試資料中沒有 credential、token、Cookie、客戶資料或完整 API response。
- BACS 訂單建立後只進入有限期保留，不因 `on-hold` 被當成已付款；期限內未回報可安全釋放時段。
- 顧客回報只建立／更新 `transfer_reported`；不建立 Calendar、不發已付款通知、不呼叫 `payment_complete()`。
- 同一回報重送只產生一次有效待核帳通知，且不能延長原本硬性期限。
- LINE／Email 的核帳連結被 link preview、GET 或未登入者開啟時，訂單與預約完全不變。
- 未登入、無 `manage_woocommerce`、nonce 無效、狀態已變更或金額不符的核帳請求一律拒絕並留下非敏感 audit。
- 兩個管理員或兩個瀏覽器同時確認時，只有一個請求成功；`payment_complete()`、paid 事件、Calendar 與兩路已付款通知都各一次。
- BACS 沒有 verification marker 卻被直接改為 processing／completed 時，不自動宣稱已付款，並進入例外佇列。
- 已回報待核帳的訂單不會被一般未付款清理誤刪；逾核帳期限依核准規則進人工例外，不永久靜默占位。
- 已釋放後的晚匯款／晚回報不會自動重新占用時段；必須人工協調改期或退款。
- BACS 的 WooCommerce 退款紀錄不被誤寫成銀行已自動退款；通知須反映真實人工處理狀態。
- LINE、Email、URL、ledger 與一般 log 不含完整銀行資料、末五碼、交易參考碼或顧客匯款備註。

## 13. 施工前待決定

| 決策 | 推薦值 | 為什麼要先決定 |
|---|---|---|
| LINE Provider 擁有者 | Hope Light／mamasan 可長期控制的 Provider | Channel 綁定屬長期資產，不能隨意更換或綁外包個人 |
| LINE 收件方式 | Tiffany 個人 1 對 1 | 隱私與訊息費優於群組 |
| Tiffany Email | 由 mamasan 私下確認，不寫入 Blueprint | 目前 Woo 新訂單寄往另一管理員 |
| Google 帳號 | Tiffany 持有的正式帳號 | OAuth、撤銷與 Calendar 所有權需清楚 |
| Calendar | 新建私人 `Hope Light 預約` | 避免寫入 Tiffany 其他私人日曆 |
| 首版 Calendar | 推薦直接做 API 正式版 | template／ICS 不是真正同步，且可能重複 |
| 通知內容 | 編號＋日期＋時間＋必要形式 | 降低鎖定畫面與轉寄外洩 |
| 顧客稱呼 | 預設不顯示 | 若營運必要，由 mamasan／Tiffany核准最小值 |
| BACS 可用的預約距離 | **[待決定]** 候選：距開始至少 48 小時 | 太近的預約來不及匯款與人工核帳 |
| 顧客匯款回報期限 | **[待決定]** 候選：建單後 24 小時內，且最晚預約前 24 小時 | 不能沿用目前會被 `on-hold` 清掉的 10 分鐘規則，也不能無限占位 |
| Tiffany 核帳期限 | **[待決定]** 候選：回報後 12 小時內，且最晚預約前 12 小時 | 已回報款項不能被誤清理，也不能永久等待 |
| 核帳提醒／備援 | **[待決定]** 候選：4 小時提醒、8 小時轉備援 | 防止 LINE／Email 漏看造成時段與款項爭議 |
| 備援核帳人 | 由 mamasan 指定具 `manage_woocommerce` 的第二人 | Tiffany 忙碌、休假或通知失敗時仍有人處理 |
| 顧客回報欄位 | 日期時間＋金額＋末五碼或交易參考碼＋短備註 | 足供人工比對；首版不做圖片／OCR |
| 待核帳 Calendar | MVP 不建立；核帳後才建立正式 event | 避免未入帳預約污染 Calendar；tentative 版可後續另做 |
| 全額退款 | 待 mamasan／Tiffany 定義 | 退款不一定等於取消預約 |
| 取消後 Calendar | 推薦標記取消並釋放時間 | 保留稽核軌跡；若要求刪除需另定規則 |
| Calendar 提醒 | 建議前 24 小時＋前 2 小時 | 需符合 Tiffany 工作習慣 |

## 14. 本 Blueprint 不包含

- 不自動回覆 LINE 客戶、不讀取或保存聊天室全文。
- 不做 LINE 群發、行銷廣播、群組通知或多員工路由。
- 不把顧客加入 Tiffany Calendar attendee，也不寄 Google 邀請給顧客。
- 不建立 Google Meet、不讀取 Tiffany 其他 Calendar 事件。
- 不改寫顧客現有 WooCommerce Email。
- 不把所有一般商品訂單當成 HopeLight 預約。
- 不回填歷史訂單／歷史預約。
- 不建立 CRM、雙向聊天或完整客服系統。
- 不串銀行 API／Open Banking、不自動查帳或自動判定入帳。
- 不自動從銀行端退款；WooCommerce 狀態不能當成銀行已匯款或已退款的證明。
- 第一版不收匯款收據圖片、不做 OCR／影像辨識。
- 不處理部分匯款、拆單付款、多筆合併匯款、多幣別或溢付款自動對帳。
- 第一版不讓顧客透過 LINE 回報匯款；回報入口以 HopeBox 訂單驗證頁為準。
- 不代表 Tiffany 已核准通知文案、Provider、Google 帳號或個資欄位。

## 15. 給 mamasan 的 QC／QA 核對

1. 是否同意第一版只把通知送給 Tiffany 個人 LINE，不送群組？
2. LINE Provider 應由 Hope Light 還是 mamasan 的哪個長期帳號持有？
3. Tiffany 的通知 Email 由誰私下提供並確認？
4. 是否同意建立一個專用的私人 `Hope Light 預約` Google Calendar？
5. 是否直接做 Calendar API 正式同步，不先做可能重複的 template／ICS 過渡版？
6. 通知是否只顯示預約編號、日期與時間；若要顧客稱呼，最低必要程度是什麼？
7. 全額退款是否自動取消預約？部分退款是否一律人工處理？
8. 取消事件要標記取消保留紀錄，還是刪除？
9. Calendar 預設提醒時間是否採前 24 小時＋前 2 小時？
10. 是否保留目前寄給另一管理員的 Woo「新訂單」Email，還是避免重複後另行調整？
11. BACS 是否只開放給距預約至少 48 小時的訂單？
12. 顧客回報期限是否採建單後 24 小時內，且最晚預約前 24 小時？
13. Tiffany 核帳期限是否採回報後 12 小時內，且最晚預約前 12 小時？
14. 4 小時未核帳提醒、8 小時轉交備援是否合適？備援核帳人是誰？
15. 顧客回報欄位是否同意採日期時間、金額、末五碼或交易參考碼、短備註，首版不收圖片？
16. 是否同意 MVP 只在核帳成功後建立 Calendar，待核帳先不放 tentative event？
17. 到期後才匯款時，是優先人工改期、退款，還是由 Tiffany 依個案判斷？

## 16. 新增內容與風險帳本

### 16.1 本次新增設計

- `hopelight_booking_paid` 單一語意事件。
- Action Scheduler 背景 fan-out。
- per-booking／per-channel delivery ledger。
- LINE Tiffany 一次性 userId 綁定與 Flex Message。
- Tiffany 專用 WooCommerce paid booking Email。
- Google Calendar API 私人事件 create／update／cancel。
- LINE／Email 共用「查看預約／查看行事曆」按鈕。
- 去重、重試、kill switch、人工 retry 與非個資 audit。
- BACS `awaiting_transfer → transfer_reported → verified → paid` 狀態機與到期／例外分支。
- 顧客匯款回報頁、Tiffany 待核帳 LINE／Email、安全核帳頁與 verification marker。
- BACS 有限期保留、併發核帳鎖、直接改狀態的例外偵測與備援核帳流程。

以上均為 **[新設計]**，不是現有網站功能，也不是 Tiffany 已核准的系統。

### 16.2 主要風險

| 風險 | 控制方式 |
|---|---|
| LINE Provider 綁錯長期擁有者 | Phase 0 書面確認後才啟用 |
| 同一付款重複通知 | 語意事件＋唯一 idempotency key＋retry key |
| LINE／Email 鎖定畫面外洩個資 | 最小內容＋需登入的後台連結 |
| Calendar 重複事件 | 固定 event ID＋保存 external ref |
| Token／refresh token 外洩 | secret store／加密＋log redaction＋撤銷流程 |
| 外部 API 拖慢付款 | Action Scheduler 非同步處理 |
| Google／LINE 失效後安靜漏件 | 管理頁警示、retry、dead-letter、kill switch |
| 退款錯誤取消預約 | 未定義前人工覆核 |
| 未核帳 BACS 無期限占用預約時段 | 有限期狀態機＋回報／核帳期限＋例外佇列，不沿用現行清除 expiry 的行為 |
| 顧客回報被誤當成已付款 | `transfer_reported` 與 `paid` 分離；只有安全核帳後呼叫 `payment_complete()` |
| LINE／Email 連結被預覽就確認付款 | 連結只開安全頁；登入＋capability＋POST＋nonce＋明確勾選才可變更 |
| 清理工作與核帳同時執行 | 狀態重查＋鎖＋唯一 verification marker |
| 直接改 Woo 狀態繞過核帳 | BACS 無 marker 不發 paid，轉人工例外 |
| 到期釋放後才收到款項 | 不自動搶回時段；人工改期／退款／爭議處理 |
| Woo 退款紀錄被誤認為銀行已退 | UI 與通知區分網站紀錄和實際銀行退款證據 |

## 17. 來源與參考

內部資料：

- [HopeBox 網站管理說明](../README.md)
- [Hope Light LINE 後台管理說明](../../line-admin/README.md)
- [Tiffany／Hope Light 專案說明](../../README.md)
- [Darren × mamasan 翻譯、QC／QA 與分包工作流](../../../../partners/darren-ai-builder/translation-qc-workflow.md)

官方資料：

- [WooCommerce：Direct Bank Transfer（BACS）設定與人工核帳流程](https://woocommerce.com/document/bacs/)
- [WooCommerce：訂單狀態與 on-hold 語意](https://woocommerce.com/document/managing-orders/order-statuses/)
- [WooCommerce Developer：Payment Gateway API](https://developer.woocommerce.com/docs/features/payments/payment-gateway-api/)
- [WooCommerce：`payment_complete` 程式碼參考](https://woocommerce.github.io/code-reference/files/woocommerce-includes-class-wc-order.html)
- [WooCommerce：退款與手動退款限制](https://woocommerce.com/document/woocommerce-refunds/)
- [WordPress Developer：Nonces](https://developer.wordpress.org/apis/security/nonces/)
- [LINE：Messaging API Getting started](https://developers.line.biz/en/docs/messaging-api/getting-started/)
- [LINE：Push message API](https://developers.line.biz/en/reference/messaging-api/)
- [LINE：取得 user ID](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/)
- [LINE：驗證 webhook signature](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/)
- [LINE：安全重試 API request](https://developers.line.biz/en/docs/messaging-api/retrying-api-request/)
- [LINE：Flex Message URI actions](https://developers.line.biz/en/docs/messaging-api/actions/)
- [LINE：LINE Notify 服務終止](https://developers.line.biz/en/news/2025/04/01/line-notify/)
- [Google Calendar：Create events](https://developers.google.com/workspace/calendar/api/guides/create-events)
- [Google Calendar：Events insert](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert)
- [Google Calendar：OAuth scopes](https://developers.google.com/workspace/calendar/api/auth)
- [Google Identity：Server-side OAuth offline access](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Calendar：Publish event 的人工儲存與手機限制](https://support.google.com/calendar/answer/41207)

## 18. 變更帳本

| 版本 | 日期 | 類型 | 說明 |
|---|---|---|---|
| v0.1 | 2026-09-01 | [需求來源] | 收錄 LINE 優先、Email 第二、Tiffany Google Calendar 第三，以及 LINE／Email 共用行事曆按鈕需求 |
| v0.1 | 2026-09-01 | [後台查核] | 驗證 HopeBox 付款／Email 現況、LINE 登入與 Messaging API 尚未啟用、Google Calendar 尚未連線 |
| v0.1 | 2026-09-01 | [新設計] | 新增單一付款語意事件、三路背景通知、LINE 綁定、Google OAuth、去重、重試與管理介面 |
| v0.1 | 2026-09-01 | [風險控制] | 新增資料最小化、Provider 歸屬、token 保管、取消／退款規則、kill switch 與驗收標準 |
| v0.2 | 2026-09-01 | [需求來源] | 納入銀行匯款後由 Tiffany 人工確認入帳的需求 |
| v0.2 | 2026-09-01 | [後台查核] | 確認原生 BACS 已啟用；現行 `on-hold` 會把預約標為 booked 並清除 expiry，可能讓未核帳訂單無期限占位 |
| v0.2 | 2026-09-01 | [新設計] | 新增匯款回報、待核帳通知、安全核帳頁、verification marker、`payment_complete()` 共用 paid 流程與核帳後 Calendar |
| v0.2 | 2026-09-01 | [風險控制] | 新增有限期保留、晚匯款／爭議分支、權限 POST、併發鎖、直接改狀態偵測、銀行資料最小化與 BACS 驗收案例 |
