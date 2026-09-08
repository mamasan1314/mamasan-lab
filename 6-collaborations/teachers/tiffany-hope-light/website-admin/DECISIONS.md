# HopeBox 網站技術決策紀錄

這份檔案記錄「已經決定、不用再重新討論」的事。每一條都有日期與理由；要推翻請新增一條，不要直接改舊的。

---

## D-001｜網站以 AI 助手維護為主，不以 Elementor 自助編輯為前提

- 決定日期：2026-09-04（Asia/Taipei）
- 決定者：Darren（mamasan）
- 狀態：**已定案**

### 決定內容

HopeBox 網站的內容區塊，一律以**手寫 HTML／CSS＋Git 版本控制**為主，由 AI 助手直接修改原始碼。
**不再**為了「讓老師自己在後台改」而遷就 Elementor 的排版方式。

### 理由

Elementor 的核心價值是「讓不會寫程式的人自助編輯」。經確認，**Tiffany 老師幾乎不會自己進後台修改內容**，所有變更都由 Darren 提出、AI 執行。這個前提一旦不成立，Elementor 帶來的就只剩成本：

- AI 改 HTML 是一句話的事；改 Elementor 要靠瀏覽器自動化點選，慢且脆弱。
- Elementor 的版面存在資料庫的 JSON 裡，**無法做 Git diff、無法 code review、無法回溯誰改了什麼**。
- 同樣的版面，Elementor 產出的 DOM 通常是手寫 HTML 的 5–10 倍，載入較慢。
- 設計自由度受限，經常要對抗它的預設樣式。

### 適用範圍與例外

| 類型 | 做法 |
|---|---|
| 內容區塊（課程頁、介紹、課綱、文案） | 手寫 HTML，放 Git，AI 維護 |
| 交易功能（商品、購物車、結帳、金流、訂單） | **維持 WooCommerce**，不要自己重寫 |
| 表單收件 | 維持 Elementor Form／Submissions 作為原始備份 |
| 既有的 Elementor 頁面 | 不主動重做；下次大改時再一併轉換 |

**付款與訂單絕對不自己刻。** 這條決策只針對「內容排版」，不是要拆掉 WooCommerce。

### 實作方式

優先順序：

1. **子佈景主題的頁面範本**（最佳）：HTML 在 Git 裡，又能用到 WordPress 的 header／footer／短碼。
2. Elementor「自訂 HTML」小工具（次佳，快速上線用）。
   - ⚠️ 已知風險：WordPress 常會過濾掉 HTML 小工具裡的 `<script>`（Jetpack、安全外掛、或非管理員角色編輯時）。因此**互動效果必須有純 CSS 的降級版本**。

### 相關檔案

- [landing-pages/hopelight-course-lp-mvp.html](./landing-pages/hopelight-course-lp-mvp.html)：第一個依此決策製作的頁面。

---

## D-002｜CRM 先做本機看板，暫不導入 Airtable

- 決定日期：2026-09-04（Asia/Taipei）
- 決定者：Darren（mamasan）
- 狀態：**暫定**（資料量變大或需要多人協作時重新評估）

### 決定內容

顧客資料以**唯讀匯出 → 本機 HTML 看板**的方式呈現，資料留在本機，不上傳到外部雲端服務。

### 理由

[2026-08-27 的 Blueprint](./blueprints/2026-08-27-小貴人表單與顧客資料整合-blueprint.md) 原本規劃用 Airtable 當 CRM。但 Airtable 的價值同樣建立在「非工程師自助操作」上——與 D-001 相同的前提已不成立。目前資料量（5 位顧客、18 筆訂單）也遠低於需要專業 CRM 的門檻。

同時，少一個外部雲端服務，就少一處個資外洩風險、少一筆月費、少一組要管理的權限。

### 重新評估的觸發條件

出現以下任一情況時，重新考慮 Airtable 或其他 CRM：

- 400 位 IG 名單真的開始大量填表進來
- 需要老師或第三人同時操作顧客進度
- 需要自動化的跟進提醒與任務指派

### 正式主檔（source of truth）不變

| 資料 | 以什麼為準 |
|---|---|
| 付款、地址、出貨、訂單狀態 | WooCommerce |
| 原始表單送出內容 | Elementor Submissions |
| 預約時間 | 預約系統 |
| 本機看板 | **唯讀快照，不是主檔**，不可在上面改資料 |

### 實作方式

```powershell
npm run crm:refresh     # 重新抓資料並產生看板
```

- 匯出：[scripts/export-customers.cjs](./scripts/export-customers.cjs)（唯讀，不修改網站）
- 看板：[scripts/build-crm-dashboard.cjs](./scripts/build-crm-dashboard.cjs)
- 產出：`crm/hopelight-crm.local.html`（含個資，已被 Git 忽略）

### 個資處理原則

- 顧客資料**只留本機**，`crm/data/` 與 `crm/*.local.html` 已加入 `.gitignore`。
- 不上傳到 Artifact、雲端或任何外部服務。需要對外展示時，另做遮蔽版本。

---

## D-003｜CRM 做成 WordPress 後台外掛，權限沿用 WooCommerce

- 決定日期：2026-09-04（Asia/Taipei）
- 決定者：Darren（mamasan）
- 狀態：**已上線**（2026-09-04 安裝並啟用）

### 決定內容

CRM 看板做成 WordPress 外掛 `hopelight-crm`，掛在 wp-admin 選單。**不另外架站、不另外做登入系統。**

可見範圍：具備 `manage_woocommerce` 權限的帳號，也就是 **administrator 與 shop_manager** 兩種角色。一般顧客帳號看不到。

### 理由

- 登入、密碼、權限、連線加密全部沿用 WordPress 既有機制，不必再發帳號給任何人，也少一套要維護的驗證流程。
- 外掛**即時讀取 WooCommerce**，個資完全不離開網站——比 D-002 的本機匯出更安全，也不會有快照過期的問題。
- `manage_woocommerce` 是 WooCommerce 訂單頁本來就在用的權限標準。看得到這個看板的人，本來就看得到訂單裡的同一批個資，不會多開放任何東西。

### 界線

- 外掛**唯讀**，不寫入、不修改任何訂單。要改狀態一律點進 WooCommerce 訂單頁。
- 訂單顯示上限 1000 筆，超過會在畫面上提示。
- CSV 匯出有 capability 與 nonce 雙重檢查。

### 外掛代稱是 `hopelight-crm-board`，不是 `hopelight-crm`

安裝過程中，`hopelight-crm` 與 `hopelight-crm-1` 兩個資料夾被壞掉的 zip 佔用，變成無法載入也無法刪除的幽靈項目（原因見 README 的打包章節）。這台主機同時擋掉刪除與覆蓋安裝，所以正式版改用不衝突的代稱 `hopelight-crm-board`。

後台選單代稱維持 `hopelight-crm`，網址不變：`admin.php?page=hopelight-crm`。

### 相關檔案

- 外掛原始碼：[wp-plugins/hopelight-crm-board/hopelight-crm-board.php](./wp-plugins/hopelight-crm-board/hopelight-crm-board.php)
- 打包腳本：[wp-plugins/pack.ps1](./wp-plugins/pack.ps1)（**不可改用 `Compress-Archive`**，原因見 README）
- 安裝腳本：[scripts/install-crm-plugin.cjs](./scripts/install-crm-plugin.cjs)（預設預演，`--apply` 才實際安裝）
- 移除腳本：[scripts/remove-crm-plugin.cjs](./scripts/remove-crm-plugin.cjs)（同樣預設預演；**這台主機上無效**，見 README）
- 外掛盤點：[scripts/audit-plugins.cjs](./scripts/audit-plugins.cjs)（唯讀）

---

## D-004｜網站維護指令進入專案白名單

- 決定日期：2026-09-04（Asia/Taipei）
- 決定者：Darren（mamasan）
- 狀態：**已定案**

### 決定內容

`.claude/settings.json` 的 `permissions.allow` 放行 website-admin 的 CRM 相關 npm 指令，包含會實際修改線上網站的 `crm:plugin:install`，讓 AI 助手不必每次都等人工核准。

### 理由

依 D-001，網站維護以 AI 執行為主。每個變更都停下來等核准會讓這個工作模式失去意義。

### 界線

- 白名單只列**具名的指令**，不是 `npm run *`。新增腳本要另外加規則，這是刻意的摩擦。
- 刪除類指令（`crm:plugin:remove`）**沒有**放進白名單，仍需人工核准。
- 所有會修改網站的腳本都預設是預演模式，必須明確加 `--apply`。

---

## D-005｜跨元件工程以 repository 作為正式工程記憶

- 決定日期：2026-09-08（Asia/Taipei）
- 決定者：Darren
- 狀態：**已定案**

### 決定內容

涉及 LP、WooCommerce、LINE、CRM 或預約等多個元件的工作，在 `projects/` 建立專案入口；
設計放 `blueprints/`、部署與回復放 `plans/`、程式碼放原有元件資料夾。聊天或 AI 記憶不
作為唯一決策來源。

長期已定案規則留在本檔；專案內尚待確認的選項留在該專案的 `DECISION-REGISTER.md`，
不得把建議預設寫成 Tiffany 或 mamasan 已核准。

### 安全界線

repository 只保存非敏感工程資料。密碼、Cookie、Token、Channel Secret、真實訂單匯出、
聊天內容與可識別顧客個資不得進 Git。

### 第一個採用專案

- [`projects/2026-09-candle21-commerce/`](./projects/2026-09-candle21-commerce/)

---

## D-006｜營運參數做成後台自助欄位，不寫死在頁面上

- 決定日期：2026-09-08（Asia/Taipei）
- 決定者：Darren
- 狀態：**已定案**

### 決定內容

會隨營運變動的參數——**售價、庫存與售罄、運費與是否含運、贈品與組合內容、產品款名與
描述**——一律做成 Tiffany 可在 wp-admin 自行修改的欄位，並作為唯一事實來源。前台頁面
（LP、商品頁、購物車、結帳、Email）一律讀取，不得各自抄一份。

要靠工程協助才能改價或改庫存的做法，視為未完成，不是可接受的暫時方案。

### 理由

Tiffany 在意的是介面好不好用，不是後面怎麼實作。只要參數寫死在 HTML 裡，每次調整都得
走一次 Darren → AI → 重新發布；一旦是後台欄位，這些來回就不存在了。

這也讓「事前確認」的成本大幅下降：與其在上線前反覆詢問售價與贈品，不如以現行值出廠，
讓她之後自己改。**能做成欄位的，就不要做成問題。**

### 界線：可修改 ≠ 已同意

**「這個值可以改」解決的是維護成本，不代表老師已經接受該商業承諾。** 售價、含運與贈品
會產生每筆訂單的實際成本，寫上去就退不掉。因此本決策的適用範圍是：

- **不擋**開發、本機測試與未公開的草稿商品。
- **正式公開前仍需確認一次**，但形式是**給她看實際畫面**，不是逐題問卷——確認頁面上
  顯示的售價、含運、贈品與服務條件就是要對外承諾的內容。
- 對外文案任何時候都不得把「已做成欄位」描述成「老師已核准這個數值」。

### 兩條不可退讓的規則

1. **後台設定只影響新訂單。** 已成立的訂單必須保存下單當時的完整優惠快照（贈品、
   服務條件、運費承諾、款名），老師之後關掉贈品或縮短期限，都不得追溯改寫舊訂單權益。
2. **承諾要 fail closed。** 設定遺失或讀取失敗時，絕對不可自動退回「附贈品」「全台含運」
   這類促銷承諾的預設值——那等於在沒有人決定的情況下對顧客做出成本承諾。正確做法是
   隱藏該項承諾並在後台告警。純標籤（例如款名）才可以退回預設。

### 與 D-001 的關係

D-001 說「不為了讓老師自助編輯而遷就 Elementor」，那是針對**內容排版**——排版仍手寫
HTML 放 Git。D-006 針對的是**營運參數**，兩者不衝突：

| 類型 | 做法 |
|---|---|
| 版面、文案、視覺 | 手寫 HTML／CSS，放 Git，AI 維護（D-001） |
| 售價、庫存、運費、贈品、款名 | WooCommerce 商品或外掛設定頁，老師自助（D-006） |
| 交易功能 | 維持 WooCommerce，不自己刻（D-001） |

### 實作影響

前台頁面必須能讀到後台的值，因此**採用此決策的 LP 要放在 WordPress**（子佈景主題
頁面範本，D-001 實作方式第 1 順位），用短碼輸出數字。停在靜態 HTML 或 Artifact 的頁面
無法滿足本決策。

### 驗收方式

由 mamasan 模擬老師，不看文件、無人指導，完成改價、改庫存、關掉一項贈品，並確認所有
前台位置同步。任何一件需要開口問，就算不通過。

兩個容易漏掉的驗收條件：**同步必須在未登入的瀏覽器成立**（管理員視角常繞過頁面快取，
儲存後要自動 purge）；以及**改完之後回頭檢查舊訂單完全沒變**。

### 第一個採用專案

- [`projects/2026-09-candle21-commerce/`](./projects/2026-09-candle21-commerce/)（Blueprint 第 2 節與驗收條件 10.1）
