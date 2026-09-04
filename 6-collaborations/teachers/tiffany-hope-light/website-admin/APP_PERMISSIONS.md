# Meta App 權限清單快照 — `hopelight-publisher-IG`

擷取日期：`2026-09-04`（Asia/Taipei）
來源：App Dashboard →「應用程式審查 → 權限和功能」，由 Darren 貼出
用途：決定哪些留著、哪些關掉，以及釐清留言讀取為什麼被擋

> 這是**快照**，不是正本。Dashboard 隨時可能改變；要動任何一格之前先回去看現況。

---

## 先看這一行：**所有項目都是「可供測試」**

清單裡 **29 項全部**都停在「可供測試」，**沒有任何一項處於已核准的進階存取狀態**。

「可供測試」是 Meta 的**標準存取（Standard Access）**：只能碰「在這個 App 裡有角色的人」
的資料。要碰一般大眾的資料，需要**進階存取（Advanced Access）**，
而那要過 App Review，通常還要商業驗證。

**這就是留言讀不到的原因。**貼文底下那 447 則留言是素不相識的人寫的，
他們沒有這個 App 的角色，於是每一筆都被濾掉 —— 留下一個空頁，
外加一個「還有下一頁」的游標。

---

## API 呼叫次數（同一份快照）

只有五項有非零呼叫，全部屬於 Instagram Login 路線：

| 權限 | 呼叫數 |
|---|---|
| `instagram_business_basic` | **134** |
| `instagram_business_content_publish` | **67** |
| `instagram_business_manage_comments` | 1 |
| `instagram_business_manage_messages` | 1 |
| `instagram_business_manage_insights` | **0** |

### `manage_insights` 是 0，但我們今天讀了幾百次洞察

2026-09-04 至少跑了 460 次以上的 `/{media-id}/insights`，全部成功。
若計數為真，代表**自己帳號的洞察不歸在 `manage_insights` 底下**（很可能算在 `basic`）。

兩種解讀，尚未定論：

1. Dashboard 的呼叫計數有延遲或統計口徑不同（`basic` 的 134 也對不上今天的量）。
2. 自己帳號的媒體洞察本來就只需要 `basic`，`manage_insights` 針對的是別的東西。

**在確認之前，不要因為「它是 0」就把 `manage_insights` 關掉。**
關掉之後如果洞察壞了，`instagram:stats` 會一起壞。

---

## 分類：哪些在用、哪些是另一條路線、哪些完全不相干

### A. 正在用 —— 不能關

這條線走的是 **Instagram API with Instagram Login**（權杖前綴 `IGA`）。

| 權限 | 現況 |
|---|---|
| `instagram_business_basic` | 讀帳號、貼文清單、洞察。**核心，關了全線停擺** |
| `instagram_business_content_publish` | 發布。**核心** |
| `instagram_business_manage_comments` | **寫入可用**（建立留言、回覆都成功）；**讀取被擋**（標準存取） |
| `instagram_business_manage_insights` | 呼叫數 0，但先留著，見上方 |
| `instagram_business_manage_messages` | 未證實。空會話無法解讀 |

### B. 另一條路線（Instagram API with **Facebook Login**）—— 目前用不到

這些要求 Instagram 帳號**連到 Facebook 粉絲專頁**。README 記載 Page 連結因
七天等待期未完成，所以整組都用不上。

`instagram_basic`、`instagram_content_publish`、`instagram_manage_comments`、
`instagram_manage_contents`、`instagram_manage_engagement`、`instagram_manage_insights`、
`instagram_manage_messages`、`instagram_manage_upcoming_events`、
`instagram_shopping_tag_products`、`instagram_creator_marketplace_discovery`、
`instagram_branded_content_ads_brand`、`instagram_branded_content_brand`、
`instagram_branded_content_creator`、`pages_read_engagement`、`pages_show_list`

**注意 `instagram_manage_comments`**（沒有 `business_`）：它的說明寫著
「建立、**刪除和隱藏**留言……也可以讀取及回覆」。那是**另一條路線的留言能力**，
不是我們現在用的這個。要走它得先連粉專。

### C. 廣告與企業管理 —— 完全不相干

`ads_management`、`ads_read`、`business_management`、`catalog_management`

### D. 其他

| 項目 | 說明 |
|---|---|
| `public_profile` | 自動授予所有 App，關不掉 |
| `email` | 沒用到 |
| `Instagram Public Content Access` | 主題標籤搜尋。沒用到 |
| `Human Agent` | 真人客服 7 天回覆窗。**做私訊回覆時會用到**，先留著 |
| `Business Asset User Profile Access` | 讀取與商家資產互動之用戶的個人檔案欄位（編號、姓名、相片）。**留言讀取可能連帶需要它** —— 讀一則留言就會揭露留言者身分。先留著 |

---

## 關掉之前必讀

**Dashboard 產生的權杖不帶同意快照，反映 App 當下的權限。**
2026-08-31 實測：在 App 加入權限後，先前已發出、未重新授權的權杖同樣取得了新能力。

**反過來也成立：關掉一項權限，既有的三支權杖會立刻失去該能力，不需要重新產生。**

所以關閉不是「之後再說」的動作，是**即時生效**的動作。順序建議：

1. 先關 C 類（廣告與企業管理），完全不相干，零風險。
2. 再關 B 類（Facebook Login 路線）—— 但**如果將來要連粉專走那條路，會需要重開**。
3. A 類與 D 類**先不要動**。

每次關完都跑一次盤點，不要依賴記憶：

```powershell
npm run instagram:capabilities -- --profile hopelight
npm run instagram:capabilities -- --profile moment
npm run instagram:stats -- --profile hopelight   # 確認洞察沒有一起壞掉
```

---

## 留言讀取要解封，實際要做什麼

`instagram_business_manage_comments` 需要從「可供測試」推到**進階存取**：

1. 商業驗證（Business Verification）
2. App Review 送審該權限，含用途說明與操作錄影
3. App 切換到上線模式

這不是一個開關，是一段流程。在它完成之前：

- 留言**寫得進去、讀不出來**，
- 依 `Control-Room/PM/DECISIONS/2026-09-04-instagram-comment-replies.md`，
  **不得對任何帳號送出自動回覆** —— 不是做不到，是做了看不見。

---

## 原始清單（29 項，逐字保留）

| # | 項目 | 呼叫數 | 狀態 |
|---|---|---|---|
| 1 | Business Asset User Profile Access | 0 | 可供測試 |
| 2 | Human Agent | 0 | 可供測試 |
| 3 | Instagram Public Content Access | 0 | 可供測試 |
| 4 | ads_management | 0 | 可供測試 |
| 5 | ads_read | 0 | 可供測試 |
| 6 | business_management | 0 | 可供測試 |
| 7 | catalog_management | （未顯示） | 可供測試 |
| 8 | email | 0 | 可供測試 |
| 9 | instagram_basic | 0 | 可供測試 |
| 10 | instagram_branded_content_ads_brand | 0 | 可供測試 |
| 11 | instagram_branded_content_brand | 0 | 可供測試 |
| 12 | instagram_branded_content_creator | 0 | 可供測試 |
| 13 | **instagram_business_basic** | **134** | 可供測試 |
| 14 | **instagram_business_content_publish** | **67** | 可供測試 |
| 15 | **instagram_business_manage_comments** | 1 | 可供測試 |
| 16 | **instagram_business_manage_insights** | 0 | 可供測試 |
| 17 | **instagram_business_manage_messages** | 1 | 可供測試 |
| 18 | instagram_content_publish | 0 | 可供測試 |
| 19 | instagram_creator_marketplace_discovery | 0 | 可供測試 |
| 20 | instagram_manage_comments | 0 | 可供測試 |
| 21 | instagram_manage_contents | 0 | 可供測試 |
| 22 | instagram_manage_engagement | 0 | 可供測試 |
| 23 | instagram_manage_insights | 0 | 可供測試 |
| 24 | instagram_manage_messages | 0 | 可供測試 |
| 25 | instagram_manage_upcoming_events | 0 | 可供測試 |
| 26 | instagram_shopping_tag_products | 0 | 可供測試 |
| 27 | pages_read_engagement | 0 | 可供測試 |
| 28 | pages_show_list | 0 | 可供測試 |
| 29 | public_profile | 0 | 可供測試（自動授予） |
