# 21 顆頻率蠟燭｜WooCommerce × LINE × CRM Blueprint

文件狀態：`v0.2｜給 mamasan QC／QA 的工程草稿`  
日期：`2026-09-08（Asia/Taipei）`  
整理層級：`L1 結構整理；核心 commerce 架構為新設計，不是 Tiffany 原稿`  
外部狀態：`未施工、未部署、未修改正式站或 LINE`

> v0.2 變更：把「Tiffany 能不能自己在後台改」升為本案第一驗收重點；售價、運費、
> 庫存與贈品不再當作上線前的閘門問題，改為以目前 LP 值出廠並全部做成可自助修改。

## 1. 結論

本案可以在現有 HopeBox 架構上完成，不需要另建 CRM 或自行開發金流。推薦的 MVP 是：

```text
廣告／IG／直接網址
          ↓ source code / UTM
        蠟燭 LP
          ├── 直接訂購 → 十款數量合計 21 → WooCommerce 結帳
          └── 先諮詢   → LINE「蠟燭」→ 人工排 10 分鐘 → 回 WooCommerce 結帳
                                                   ↓
                                          WooCommerce 訂單
                                                   ↓ 唯讀
                                            Hope Light CRM
```

這個設計讓 WooCommerce 保持唯一交易主檔，LINE 只負責關係與諮詢，CRM 只負責看見工作。

**本案的成敗指標不只是「能不能結帳」，而是「Tiffany 之後能不能不找我們就自己改」。**
售價、庫存組數、含運、贈品與十款款名都是會變的營運參數。只要它們留在寫死的 HTML 裡，
每次調整都得走一次 Darren → AI → 重新發布的來回；一旦做成後台欄位，這些來回就消失了。
所以「自助維護」在本案是架構需求，不是加分項，驗收條件第 10.1 節排在最前面。

## 2. Tiffany 的自助維護範圍

原則：**每一個會變的營運數字，只有一個地方可以改；其他所有頁面都去讀它，不得抄寫。**

### 2.1 她可以自己改（不需要工程協助）

| 值 | 她在哪裡改 | 哪些地方跟著變 |
|---|---|---|
| 21 顆組售價 | Woo 商品 → 一般 → 售價 | Woo 商品頁、購物車、結帳、Email、LP 價格區與方案比較表 |
| 單顆售價 | 單顆蠟燭商品 → 售價 | LP 方案比較表；限定組差額自動重算，不寫死「61 元」 |
| 首批組數／是否售罄 | Woo 商品 → 庫存 | 商品頁可否下單、LP 限量文案與 CTA 狀態 |
| 是否含運、運費金額 | Woo → 運送設定 | 結帳運費、LP 的含運標示 |
| 玻璃燭台等組合內容 | 外掛設定頁 →「組合內容」 | LP 內容物清單、Woo 商品頁說明 |
| 十款顯示名稱與一句話描述 | 外掛設定頁 →「十款」 | LP 選款區、Woo 選款 UI、購物車、結帳、Email |
| 10 分鐘諮詢說明與使用期限 | 外掛設定頁 →「諮詢」 | LP、Woo 商品頁、訂單 Email |
| LINE「蠟燭」自動回覆文案 | LINE OA Manager | LINE 對話 |

改動即時生效；十款顯示名稱只影響**新**訂單，既有訂單保留下單當下的名稱（見第 6 節）。

### 2.2 需要工程協助（刻意不開放）

十款的 ASCII key、合計必須為 21 的驗證規則、order item meta 結構、付款 gateway、
CRM 欄位與 feature flag 的程式行為。這些改錯會讓既有訂單讀不懂或結帳壞掉，
不適合放進後台自助欄位。

### 2.3 這對 LP 的直接影響

LP 目前是靜態 HTML（Artifact），價格與贈品寫死在頁面上共八處。要達成 2.1，
**LP 必須進 WordPress 成為子佈景主題頁面範本**（D-001 實作方式第 1 順位），
所有商業數字改用外掛提供的短碼輸出。若 LP 停在靜態 HTML，2.1 表格的前四列就不成立，
每次改價都要回到人工改 HTML 並重新發布。

## 3. 已確認基線

| 元件 | 現況 | 本案做法 |
|---|---|---|
| Landing Page | v0.3，只有 LINE CTA，商業數字寫死，頁面在 Artifact 上 | 移入 WordPress 範本；增加雙入口；數字改讀短碼 |
| WooCommerce | 已有商品、購物車、結帳、訂單；實際 gateway 可用性待查 | 沿用交易核心，並作為售價／庫存／運費的唯一入口 |
| CRM | `hopelight-crm-board` 已上線、唯讀讀取 Woo 訂單 | 增加本案欄位顯示，不新增主檔 |
| LINE OA | 加好友連結可用；「蠟燭」關鍵字與諮詢入口尚未建 | MVP 使用 OA Manager 自動回應與連結 |
| 預約 | 已有長時段服務預約；不適合直接假設可放 10 分鐘 | 首版 LINE 人工排程，另案評估自動化 |
| Airtable | 早期藍圖曾建議；D-002 已暫緩 | 不使用 |

## 4. 系統責任與正式主檔

| 資料／行為 | 正式主檔 | 備註 |
|---|---|---|
| 商品名稱、售價、庫存與可售狀態 | WooCommerce 商品 | LP 只顯示，不成為第二本庫存帳 |
| 運費與是否含運 | WooCommerce 運送設定 | LP 的「全台含運」由此推導，不寫死 |
| 組合內容、十款顯示名稱、諮詢說明 | 外掛設定（wp-admin） | LP 與商品頁只顯示 |
| 十款數量配置 | WooCommerce cart item／order item meta | 伺服器端再次驗證，不能只信前端 JavaScript |
| 付款、退款、地址、出貨與訂單狀態 | WooCommerce 訂單 | CRM 不回寫 |
| 是否先諮詢、入口來源 | WooCommerce order meta | 只存必要狀態與 source code |
| LINE 對話與人工排程 | LINE／營運流程 | MVP 不複製對話全文進 Woo 或 Git |
| 顧客與訂單工作視圖 | Hope Light CRM | 即時唯讀衍生視圖 |

## 5. 顧客旅程

### 5.1 直接訂購

1. 顧客由 LP 點「直接訂購」。
2. WooCommerce 商品頁顯示十款非負整數數量欄位與即時合計。
3. 合計不是 21 時不可加入購物車；伺服器端再次驗證，避免繞過前端。
4. 購物車與結帳摘要顯示十款配置、售價、含運與贈品內容。
5. 完成訂單後，配置固化到 order item meta，CRM 可唯讀顯示。

### 5.2 先諮詢

1. 顧客由 LP 點「先做 10 分鐘諮詢」，前往 LINE 並看到明確提示「請傳蠟燭」。
2. LINE「蠟燭」自動回覆提供兩個選項：直接訂購／先排諮詢。
3. 首版由小幫手人工安排 10 分鐘，不啟用 Messaging API 或 LIFF。
4. 諮詢完成後，小幫手傳回帶 `source=line_consult` 的 WooCommerce 商品連結。
5. 顧客自行填滿 21 顆後結帳；不建立選款未完成的半成品訂單。

## 6. 十款配置資料契約

使用穩定 ASCII key，**顯示名稱由後台設定，Tiffany 可隨時改而不破壞既有訂單**：

| key | 出廠預設顯示名稱 |
|---|---|
| `peaceful-night` | 安然入夜 |
| `good-luck` | 好運爆棚 |
| `boundaries` | 小人退散 |
| `abundance` | 財富豐盛 |
| `customers` | 吸引顧客 |
| `romance` | 吸引桃花 |
| `study-career-growth` | 學/事業進步 |
| `benefactors` | 貴人常臨 |
| `relationship-warmth` | 感情升溫 |
| `cleansing` | 淨化除穢 |

每個值必須是 `0..21` 的整數，十欄合計必須等於 `21`。Order item 保存 key、下單當下的
顯示名稱、數量與 schema version，所以後台改名之後回頭看舊訂單仍讀得懂。

建議 meta，**注意層級不同**：

| meta key | 層級 | 值 |
|---|---|---|
| `_hopelight_c21_schema_version` | order **item** meta | `1` |
| `_hopelight_c21_mix` | order **item** meta | 十款 key／quantity／下單當下顯示名稱的 JSON；只在伺服器端產生 |
| `_hopelight_c21_source` | order meta | allowlist source code，例如 `lp_direct`、`line_consult` |
| `_hopelight_c21_consult_path` | order meta | `direct` 或 `consult_first` |

配置屬於那一列商品，必須走 `woocommerce_checkout_create_order_line_item` 寫成 item meta，
才會出現在購物車、結帳、Email 與後台訂單的該列；來源與諮詢路徑描述的是整張訂單，
放 order meta。兩者不可互換。

**顯示注意**：底線開頭的 meta 在 WooCommerce 屬 hidden meta，預設不會顯示在前述五個
位置。顯示層需另外走 `woocommerce_order_item_display_meta_key`／`woocommerce_display_item_meta`
過濾器，或另存一份不帶底線的人類可讀欄位。這是驗收條件 10.3.1 的前提，不是實作細節。

**與既有歸因的分工**：已有 2026-09-04〈訂單來源歸因〉Blueprint 在追 WooCommerce 內建的
`_wc_order_attribution_*`。若內建可用，它負責通用行銷來源（referrer、utm、裝置）；
`_hopelight_c21_source` 只負責本案 allowlist 語意（`lp_direct`／`line_consult`）。
兩者並存、互不覆蓋、互不推導。

不要保存 LINE 對話、自由文字診斷、靈魂藍圖內容或 LINE user ID。

## 7. 元件邊界

### 7.1 LP

- 位置：WordPress 子佈景主題頁面範本，不是靜態 Artifact（見 2.3）。
- 售價、單顆價、差額、庫存／售罄、含運、贈品與十款款名一律以短碼輸出，頁面不寫死數字。
- 顯示產品內容與兩個 CTA。
- 透過固定 allowlist 參數傳遞來源，不直接寫訂單或顧客資料。
- JavaScript 失效時仍能到達 WooCommerce 商品頁與 LINE。

### 7.2 `hopelight-candle21-commerce` 外掛

- 只對指定 WooCommerce product ID／SKU 啟用十款選擇 UI。
- 提供 wp-admin 設定頁：組合內容、十款顯示名稱與描述、諮詢說明、feature flag；
  權限沿用 `manage_woocommerce`，欄位需有中文說明與即時驗證。
- 提供短碼給 LP 讀取售價、單顆價、差額、庫存狀態、含運、贈品與十款款名。
- 驗證 cart、checkout 與 order item meta。
- 顯示於購物車、結帳、顧客 Email 與後台訂單（含前述 hidden meta 的顯示處理）。
- 提供 feature flag／kill switch；關閉後不影響其他商品結帳。
- 不處理信用卡、不自行建立訂單表、不保存秘密、不複製一份售價或庫存。

### 7.3 CRM 看板

- 延續 `manage_woocommerce` 權限與唯讀原則。
- 顯示配置摘要、source、consult path；必要時連回 Woo 訂單。
- 不在 CRM 內修改付款、配置、地址或訂單狀態。

### 7.4 LINE

- 使用 OA Manager 設定關鍵字與核准文案。
- 首版不使用 Messaging API、Webhook、LIFF 或外部 LINE user profile。
- 所有連結只帶非個資 source code。

## 8. 失敗與降級

| 情境 | 行為 |
|---|---|
| JavaScript 未載入 | Woo 商品頁仍顯示欄位；伺服器端拒絕非 21 的配置 |
| 顧客繞過前端送出 | `add_to_cart_validation`／checkout validation 拒絕並顯示原因 |
| 商品售罄 | WooCommerce 庫存阻擋下單；LP 短碼自動顯示售罄，不需人工改文案 |
| 後台設定留白或填錯 | 設定頁擋下並提示；前台退回出廠預設，不顯示空白或 PHP warning |
| 短碼失效 | LP 顯示保守的靜態備援文字並連向 Woo 商品頁，不顯示錯誤碼 |
| LINE 自動回應失效 | LP 的直接購買仍可用；公開頁不得承諾即時自動回覆 |
| CRM 擴充失效 | 不阻擋 WooCommerce 結帳；回 Woo 訂單頁工作 |
| 外掛需緊急停用 | feature flag 優先；必要時後台停用，LP 暫時只留 LINE |

## 9. 安全與個資

- WooCommerce 既有結帳頁負責姓名、電話、Email 與地址；LP、LINE URL 與 Git 不帶個資。
- 前端傳來的價格、總數、source 與顯示名稱一律不可信；伺服器以 allowlist 重算。
- 後台設定頁的所有欄位需 escaping 與型別驗證；顯示名稱輸出一律 escape，不接受 HTML。
- 所有管理功能使用 WordPress capability 與 nonce。
- Log、部署收據與測試 fixture 只保存訂單假 ID／遮蔽摘要，不保存真實顧客資料。
- Secret、Cookie、Token、匯出 CSV 與聊天內容維持 Git ignore／本機或網站內保存。

## 10. 驗收條件

### 10.1 Tiffany 的後台自助 UI（本案最高優先）

1. Tiffany 只用 wp-admin、不需要任何工程協助，就能改：21 顆組售價、單顆售價、
   庫存組數、是否含運、組合內容（含玻璃燭台）、十款顯示名稱與描述、諮詢說明。
2. 上述任一項改完後，**LP、Woo 商品頁、購物車、結帳與訂單 Email 同時跟著變**，
   沒有任何一處需要另外改 HTML 或重新發布頁面。
3. 十款設定是一頁十列：key 唯讀且不需要她理解，顯示名稱與描述可直接編輯。
4. 庫存為 0 時，LP 與商品頁自動呈現售罄狀態，不需要她手動改任何文案。
5. 欄位留白或填錯（負數、非數字、超長字串）時，畫面即時給中文提示並拒絕存檔，
   不會讓前台出現空白、錯誤碼或壞掉的版面。
6. **實測方式**：由 mamasan 模擬 Tiffany，在無人指導、不看文件的情況下完成三件事
   ——改一次組售價、改一次庫存組數、關掉玻璃燭台這項贈品——並確認前台全數同步。
   任何一件需要開口問，就算這一節不通過。

### 10.2 顧客端選款 UI

1. 十款數量欄位、即時合計，以及「還差幾顆／已超過幾顆」的中文提示。
2. 合計不是 21 時，加入購物車按鈕停用並說明原因，不是按下去才報錯。
3. iOS Safari、Android Chrome 與 LINE 內建瀏覽器皆可操作；數字欄位不觸發縮放。
4. JavaScript 失效時欄位仍可送出，由伺服器擋下並顯示原因。
5. 20、22、負數、小數、缺欄、未知 key 與竄改 payload 一律被伺服器拒絕。

### 10.3 資料一致性與不回歸

1. 購物車、結帳、訂單信件、後台訂單與 CRM 顯示同一份配置。
2. 來源只接受 allowlist；未知值歸為 `unknown`，不原樣輸出。
3. 一筆直接購買與一筆 LINE 諮詢後購買都能完成端對端測試。
4. 其他既有商品的加入購物車、付款與訂單流程不受影響。
5. 關閉 feature flag 後，蠟燭自訂欄位停止作用，網站與其他 Woo 商品仍正常。
6. LINE「蠟燭」、歡迎訊息、LP、Woo 商品與 CRM 的名稱、價格及連結一致——
   在 10.1.2 成立的前提下，這一項應自動成立，不再靠人工比對。

## 11. 尚待決定與不包含

本案**不把售價、含運與贈品當成上線閘門**。以目前 LP 的值（NT$2,980、全台含運、
玻璃燭台 1 個）出廠，並依第 2 節全部做成 Tiffany 可自助修改的欄位；她要調整時自己改，
不需要回頭找我們。

僅需一次性告知、不需回覆即可施工：21 × 139 = 2,919，限定組 2,980，差額 61 元要涵蓋
運費、燭台與 10 分鐘諮詢，`product-facts.md` 的〈21 顆組：已確認與待確認〉一節有完整
成本推算。上線後她若要調整，改一個欄位即可，這正是本設計要換到的東西。

其餘施工閘門見專案 [`DECISION-REGISTER.md`](../projects/2026-09-candle21-commerce/DECISION-REGISTER.md)。
付款三路通知、Google Calendar API、銀行匯款核帳狀態機與 LINE 身分綁定屬後續專案；
既有 2026-09-01 Blueprint 可作參考，但不能視為本 MVP 已核准範圍。

## 12. 來源與新增內容

來源：現有 LP、`product-facts.md`、D-001～D-005、CRM 外掛、LINE 與網站交接、
2026-09-01 預約付款 Blueprint、2026-09-04 訂單來源歸因 Blueprint。  
新增內容：自助維護範圍與短碼化 LP、雙入口、十款 key、order／order item meta 分層、
server-side validation、feature flag、source allowlist 與上述驗收案例均為本藍圖的
新工程設計，待 mamasan QC／QA。
