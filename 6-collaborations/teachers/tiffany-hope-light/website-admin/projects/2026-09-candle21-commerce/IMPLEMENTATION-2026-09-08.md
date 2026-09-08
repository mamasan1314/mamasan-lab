# 21 顆蠟燭｜第一輪施工交接

日期：2026-09-08（Asia/Taipei）

狀態：**已製作本機工程候選；未部署到 HopeBox、未通過 mamasan QC／QA。另已依授權公開假資料驗收頁，見 [發布紀錄](REVIEW-SITE.md)。**

最新收工狀態、後台整合討論與建議下一步見 [工作日誌](worklogs/WORKLOG-2026-09-08.md)。

整理層級：L1；交易介面、資料契約、驗證與故障處理為新增工程設計，不是 Tiffany 原稿。

**本次收工點（依 Darren 最新指示）**：先交 mamasan 看目前已製作的項目，不要求一次到位。暫停部署及新一輪整合工程，等待回饋後再續作。

**維護方向更新**：自製程式、頁面範本與非敏感工程設定以 repo 管理版本與回復，不再把 WordPress.com 權限當成施工前提。這不代表 repo 包含 Woo 訂單、顧客、付款紀錄或完整資料庫；這些資料不放 Git。下一輪另準備現有 wp-admin 可操作的回復流程，不再重問 WordPress.com 權限。

## 可以直接檢視

- [預覽入口](preview/index.html)：全部是假商品／假庫存；不會建立交易。
- [後台設定](preview/admin.html)、[十款選購](preview/product.html)、[動態 LP](preview/landing.html)、[訂單與 CRM](preview/order.html)。
- 預覽由實作中的 PHP 介面產生；後台儲存、付款、庫存扣還不在靜態預覽中執行。
- 測試用 2,980 元、12 組、4 個燭台、含運、30 天期限不代表實際庫存或老師接受的承諾。

## 本次變更

| 元件 | 已製作 | 仍待真實環境驗證 |
|---|---|---|
| commerce 0.1.0 | 指定商品、十款合計 21、前後端驗證、中文後台、LP 短碼、停用開關 | Woo 外掛載入、實際結帳與付款 |
| 快照 | order item 保存 JSON 與可讀 meta；來源／旅程／諮詢狀態分離 | Email、會員訂單、Woo 後台與 CRM 五處實際顯示 |
| 燭台 | 有庫存才附贈；加入零元 Woo 訂單明細，原生扣還庫存；運送 package 含贈品重量 | 併發搶最後一件、待付款保留、取消／退款補庫、實際運送外掛 |
| CRM 0.2.0 | 唯讀顯示快照、來源；commerce 停用仍可讀 | 與既有看板、1000 筆上限、CSV、權限的 WP 整合回歸 |
| LP 子主題範本 | 沿用 v0.3 視覺與主體文字；商業資料改由短碼輸出；雙入口 | 子主題切換前保留 Hello Elementor 自訂設定與選單，驗證全站 |
| 快取 | WP 常見快取清除呼叫、相關頁 no-cache、管理員告警 | WordPress.com／Jetpack／主機／CDN 的實際清除入口與無痕同步 |
| LINE | [關鍵字與歡迎訊息候選](LINE-COPY-DRAFT.md)，不重抄價格 | mamasan QC、老師聲音接受、OA Manager 寫入與真人收訊 |

## 正式站唯讀基線（本次直接讀取）

- 使用者協助在專用瀏覽器完成登入；既有 helper 可重用 session。沒有把密碼或 Cookie 存進 repository。
- WordPress **7.1**、WooCommerce **11.1.0**、PHP **8.4.25**。
- HPOS 啟用、舊訂單表同步未啟用；Woo Order Attribution 啟用。
- 現用 **Hello Elementor**，沒有子佈景主題。
- 購物車頁 ID **10**：`[woocommerce_cart]`；結帳頁 ID **11**：`[woocommerce_checkout]`。本次只讀，未改內容。
- REST 列出的已啟用 gateway：**sunpay、bacs（銀行轉帳）**。WooPayments gateway 未啟用；尚未試付款。
- 運送區域包含「台灣」與未涵蓋區域；區域名称不證明本島、離島、混合購物車免運。
- 外掛 ZIP 上傳表單存在；**不等於同 slug 覆蓋或復原能力已驗證**。
- 啟用 Jetpack、Page Optimize；VaultPress Backup 入口實際導向 `wordpress.com/log-in`，需要另一層 WordPress.com 登入，目前沒有已驗證的還原點／檔案復原入口。
- WPCode 本次對可見連結去重後掃描 26 個片段：`699` 使用 `woocommerce_gateway_title`；已啟用的 `592` 使用加入購物車、cart item data、cart 驗證、建單明細與重新導向等 Woo hooks。這是關鍵字盤點，**尚未證明不衝突**；下一輪須優先檢查 592 的作用範圍。原始碼未匯出到 Git，避免帶入既有秘密。
- 本次沒有安裝／啟停外掛，沒有建商品、改運費、改頁面或改 LINE。

## 本機驗證

- PHP CLI 8.3.33（官方可攜版，存暫存目錄）：語法檢查與 **35 項假資料測試**。
- 測試含 20／22、負數、小數、缺欄、未知 key、前端竄改、nonce、管理能力檢查、失效設定、商品切換、燭台歸零與保留庫存、跨列數量、運送承諾、舊快照不變、新訂單讀新值、來源分離與 CRM escaping。
- Chromium：即時計數與停用按鈕、欄位驗證、16px 輸入、390px 手機寬度、LP 連結、無 JavaScript 欄位與無頁面錯誤。
- 修正 LP 原視覺稿的 `hero::before` 向外延伸 40vw，避免手機橫向溢出。
- 以上為**假 WordPress／Woo adapter + 真 Chromium**，不是完整 WordPress 整合、正式付款、庫存併發、iOS Safari 或 LINE 內建瀏覽器測試；不得用來標記 Blueprint 10 全部 PASS。

## 本輪工程選擇與缺口

1. **授權與 Phase 0**：本次使用者明確委託施工，後又指定先交 mamasan 看本機階段成果。WordPress.com 權限不再是前提；下一輪以 repo 保留前版、wp-admin 可操作的回復程序、關閉功能安裝與草稿商品測試為方向，並確認更新、快取與 WPCode 相容性。
2. **傳統結帳**：正式站已確認使用傳統短碼。本版刻意不宣告支援 Cart／Checkout Blocks，Store API 遇到限定組會拒絕；其他商品不受此限制。
3. **含運安全值**：空設定不自動承諾含運或附贈。預覽才使用藍圖預設；正式站需存入明確設定、燭台實際庫存與核對運費。本版 `tw_bundle_only` 僅支援限定組獨立結帳，混購會拒絕；**尚未實作「混購時只免限定組、其他照收」的完整運費拆包**，C21-Q12 未結案。
4. **金流與庫存**：沿用 Woo 原生訂單／預留／扣還庫存，不自建庫存表。須保持全站庫存管理與待付款保留分鐘數大於 0。贈品放在零元原生商品列；是否影響現有運送、發票或物流計價仍待端到端測試。
5. **購物車與已成立訂單**：購物車重算時讀新優惠；建立訂單時比對顧客看到的優惠，若中途變更則拒絕並要求重整。只有成立的訂單永久固化；不追溯重寫。
6. **諮詢**：每筆訂單的權益，非每組額外一次；到期日以下單時間＋期限固化。點諮詢連結只標記旅程，MVP 不管理完成狀態。
7. **快取**：現在只能發出已支援 WP 快取清除與 no-cache，告警明示主機層未驗證。不能宣稱「全站自動同步已完成」。
8. **後台**：價格／數量仍回原生商品編輯；設定頁有三張直接入口卡。是否不需說明即可完成三件事，必須由 mamasan 親自驗收。
9. **緊急停用**：優先取消選購開關。若需停用整個 commerce 外掛，先把目標商品設為草稿／不可購買；插件停用後，PHP 保護鉤子也不再執行。不要只停外掛而留下可直接收款的限定組。

## 變更帳本與來源

| 來源 | 處理 | 信心／接受狀態 |
|---|---|---|
| Blueprint v0.3、D-006 | 數量 schema、快照、後台欄位與來源欄位落地 | 規格明確；整合仍待驗收 |
| `product-facts.md` | 十款名稱與一句話描述作標籤預設 | 來源沿用，不宣稱效果 |
| 靜態 LP v0.3 | 保留主要敘事／視覺；商業區改短碼，選購步驟改為先選滿再結帳 | 新流程與 CTA 待 mamasan QC |
| Woo 官方原始碼 | 使用原生訂單商品列與庫存預留流程 | 實際本機整合尚未驗證 |

新增內容清單：後台所有中文欄位提示、錯誤訊息、雙入口按鈕、LP 選購步驟、LINE 回覆候選、CRM 快照提示、子主題生成器、所有測試與假資料均為本輪工程新增。沒有新增老師故事或教學系統，也未發送給老師。

技術對照來源：[Woo checkout 建單鉤子](https://woocommerce.github.io/code-reference/files/woocommerce-includes-class-wc-checkout.html)、[Woo stock functions](https://woocommerce.github.io/code-reference/files/woocommerce-includes-wc-stock-functions.html)。程式採原生 hook；文件只能支持設計依據，不能代替本站實測。

## 接續部署所需

先依 mamasan 回饋修正候選版，接著完成真正 WordPress／Woo 整合測試、現有 wp-admin 可操作的回復程序、同 slug 更新預演、WPCode 592 相容性與快取方式確認。然後才部署關閉狀態外掛、草稿商品與子主題。不再等待 WordPress.com 權限。

暫存目錄已開始準備 WordPress、WooCommerce 11.1.0、SQLite 整合與 WP-CLI，但依使用者收工指示，未建立／啟動可用的本機 WordPress 站，也未執行真正 WordPress 整合測試；不得列入通過證據。

公開前仍需 mamasan QC／QA、自助 UI 實測與 Tiffany 看實際畫面確認承諾。C21-Q11／Q12／Q13 的實際運費範圍及庫存、發票與退換貨政策也尚未結案。
