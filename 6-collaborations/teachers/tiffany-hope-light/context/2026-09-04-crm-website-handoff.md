# 2026-09-04 CRM 看板與網站維護路線的重入指引

寫給下一個工作階段（人或 AI），以及換到另一台主機的 Darren。讀完這份加上
[`../website-admin/DECISIONS.md`](../website-admin/DECISIONS.md) 就能直接開工。

## 先讀這三份

1. 本文件
2. [`../website-admin/DECISIONS.md`](../website-admin/DECISIONS.md)：已定案、不需要重新討論的技術決策（D-001～D-004）
3. [`../website-admin/README.md`](../website-admin/README.md)：登入方式、CRM 指令、外掛打包的已知陷阱

> **重要：AI 的記憶檔不會跟著 repo 走。**
> 記憶存在 `~/.claude/projects/<專案>/memory/`，那是本機路徑。
> 換一台主機時，決策的唯一可靠來源是 `DECISIONS.md`，不是 AI 的記憶。
> 因此新的決策一律要寫進 `DECISIONS.md`，不能只存在記憶或對話裡。

## 換主機的重入步驟

1. 確認 `../Hope_Light 帳號密碼.txt` 已隨 OneDrive 同步到新主機（Git 不會傳送它）。
2. 安裝相依套件：

   ```powershell
   cd 6-collaborations\teachers\tiffany-hope-light\website-admin
   npm ci
   ```

3. 驗證登入可用（唯讀）：

   ```powershell
   npm run audit
   ```

   新主機沒有瀏覽器工作階段，第一次會完整走一次登入流程，包含自動處理
   Jetpack 數學驗證。之後會使用本機快取的工作階段。

4. 需要本機 CRM 快照時（可選，正式看板已在網站上）：

   ```powershell
   npm run crm:refresh
   ```

不需要重新探索的事：WordPress 登入流程、WooCommerce 資料讀取方式、外掛安裝流程。
都已經有可執行的腳本。

## 目前狀態

### 已完成

**CRM 看板已上線。** WordPress 後台外掛，即時讀 WooCommerce，個資不離開網站。

- 網址：`https://hopebox.com.tw/wp-admin/admin.php?page=hopelight-crm`
- 可見範圍：`manage_woocommerce`（管理員與商店經理）
- 外掛代稱：`hopelight-crm-board`（**不是** `hopelight-crm`，原因見 D-003）
- 唯讀，不修改任何訂單
- 2026-09-04 驗證：顧客 5、訂單 18、待核款 4 筆 NT$8,170、無 PHP 警告

**課程頁草稿。** [`../website-admin/landing-pages/hopelight-course-lp-mvp.html`](../website-admin/landing-pages/hopelight-course-lp-mvp.html)

- 架構參考自元辰識海的一頁式課程頁
- 只使用 `profile.md` 與 `product-facts.md` 裡已確認的事實，其餘標示為「待確認」
- **注意：這是 Artifact 格式的片段**，沒有 `<!doctype>`／`<html>`／`<body>`。
  要放上 WordPress 需要自行包裝，或依 D-001 做成子佈景主題的頁面範本。

**決策記錄。** D-001 到 D-004 見 `DECISIONS.md`。

### 未完成

| 項目 | 狀態 |
|---|---|
| 課程頁的日期、課綱、贈禮內容 | 待老師提供，頁面上已標示 |
| 課程頁接 WooCommerce 金流 | 未開始 |
| WooCommerce 付款方式的啟用狀態 | **未確認**，見下方 |
| WPCode 的 20 個程式碼片段 | 已盤點，未處理 |
| Elementor + PRO Elements 更新 | 未執行，有連動風險 |

## 待處理事項的細節

### 1. WooCommerce 付款方式狀態未知

2026-09-04 嘗試讀取 `admin.php?page=wc-settings&tab=checkout` 失敗——新版
WooCommerce 的付款設定頁是 React 渲染，`tr[data-gateway_id]` 選擇器對不上。

已知裝了這些付款相關外掛：

| 外掛 | 狀態 |
|---|---|
| WooPayments（信用卡） | 啟用 |
| Sunpay Payment（銀行轉帳／BACS） | 啟用 |
| Amego 光貿電子發票 | 啟用 |
| RY Tools for WooCommerce（台灣金物流） | **未啟用**，有更新 |

但實際訂單全部都是「銀行轉帳」，所以 WooPayments 可能沒有真的在收款。
做金流串接前要先把這件事查清楚。

### 2. WPCode 有 20 個版控之外的程式碼片段

`admin.php?page=wpcode`。大多是 PHP，設定為 Run Everywhere，內容其實是特定頁面的
版面區塊（「掌選牌卡說明布局」「三卡片」「輪播卡片」等）。

三個問題：

- 只存在資料庫，不在 Git，無法 diff 或 review，與 D-001 的原則相衝突
- 版面用途卻設成每頁執行，包含後台，是效能負擔也可能有副作用
- 有兩個「Untitled Snippet」正在每頁執行，用途不明

作者有 `hopebox139` 與 `choi fung` 兩個帳號。

建議的第一步是**全部匯出成檔案進 Git**（唯讀、零風險），先讓網站上跑的東西變成可見的。

### 3. 外掛整理

26 個外掛、22 個啟用。詳細盤點：`npm run` 沒有對應指令，直接執行

```powershell
node scripts/audit-plugins.cjs
```

要點：

- **幽靈項目 2 個**：`hopelight-crm`、`hopelight-crm-1`，無法載入也刪不掉
- **停用候選**：Crowdsignal ×2（投票問卷，應該沒在用）
- **不要單獨更新 Elementor**：必須與 PRO Elements 一起更新，否則排版可能壞掉
- Gutenberg、Layout Grid、Page Optimize 標示為「已由 WordPress.com 安裝」，
  可能無法停用或會自動裝回來

## 這台主機（hopebox.com.tw）的硬性限制

**2026-09-04 實測確認，不要重新探索：**

1. **不允許刪除外掛。** 批次操作選單沒有刪除選項；單列的「刪除」連結（連 JS 確認
   對話框都接受了）點下去只會跳回列表，檔案仍在。從後台手動刪除同樣無效。
   → 因此 `crm:plugin:remove` 在這台主機上不會生效。
2. **覆蓋安裝會被擋。** 上傳同名資料夾時會停在「目的資料夾已存在」。
3. **上傳新外掛正常。**

**合起來的意思是：安裝失敗會留下無法自行清除的殘留。**
所以任何外掛操作都必須先 `npm run crm:plugin:check` 預演，並驗證 zip 結構。

要清掉幽靈資料夾，只能透過主機的檔案管理員或請主機商協助：

```
/srv/htdocs/wp-content/plugins/hopelight-crm/
/srv/htdocs/wp-content/plugins/hopelight-crm-1/
```

**運作中的是 `hopelight-crm-board/`，不要刪到它。**

## 已確認的技術陷阱

這些都已經寫進 `README.md`，這裡只列索引，不要重新踩：

- `Compress-Archive` 產生的 zip 用反斜線分隔路徑，PHP 解壓後會建立**檔名含反斜線**
  的檔案，造成無法啟用也無法刪除的幽靈外掛。一律用 `wp-plugins/pack.ps1`。
- Windows PowerShell 5.1 在無 BOM 時以 ANSI 讀取 `.ps1`，所以 `pack.ps1` 全用 ASCII。
- 外掛列表的 `tr` id 由外掛名稱產生，中文名稱會失效；判斷狀態要看
  `a[href*="action=activate"]` 與 `action=deactivate`。
- 選擇器用 `href*="hopelight-crm"` 會同時比對到 `hopelight-crm-1`，必須用完整代稱。

## 個資處理

- 顧客資料只留本機：`website-admin/crm/data/`、`crm/*.local.html` 已在 `.gitignore`。
- **不要 `git add -f`，不要發布成 Artifact，不要送進任何外部服務。**
- 網站上的 CRM 看板是即時讀取，沒有另存副本，這是比本機匯出更安全的做法。

## 下一步的建議順序

1. **匯出 WPCode 的 20 個片段進 Git**——唯讀、零風險，做完才知道網站上跑著什麼
2. **查清 WooCommerce 付款方式的啟用狀態**——金流串接的前置
3. **課程頁接金流**——等老師補完課綱與日期後才有意義
4. Elementor 更新——建議排獨立時段、先確認備份可用、有人在旁邊看著
