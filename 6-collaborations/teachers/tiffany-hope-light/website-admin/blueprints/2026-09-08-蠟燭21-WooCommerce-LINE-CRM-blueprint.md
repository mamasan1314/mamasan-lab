# 21 顆頻率蠟燭｜WooCommerce × LINE × CRM Blueprint

文件狀態：`v0.1｜給 mamasan QC／QA 的工程草稿`  
日期：`2026-09-08（Asia/Taipei）`  
整理層級：`L1 結構整理；核心 commerce 架構為新設計，不是 Tiffany 原稿`  
外部狀態：`未施工、未部署、未修改正式站或 LINE`

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

## 2. 已確認基線

| 元件 | 現況 | 本案做法 |
|---|---|---|
| Landing Page | v0.3，只有 LINE CTA，流程仍標待確認 | 增加直接訂購與先諮詢雙入口 |
| WooCommerce | 已有商品、購物車、結帳、訂單；實際 gateway 可用性待查 | 沿用交易核心，不自行重寫 |
| CRM | `hopelight-crm-board` 已上線、唯讀讀取 Woo 訂單 | 增加本案欄位顯示，不新增主檔 |
| LINE OA | 加好友連結可用；「蠟燭」關鍵字與諮詢入口尚未建 | MVP 使用 OA Manager 自動回應與連結 |
| 預約 | 已有長時段服務預約；不適合直接假設可放 10 分鐘 | 首版 LINE 人工排程，另案評估自動化 |
| Airtable | 早期藍圖曾建議；D-002 已暫緩 | 不使用 |

## 3. 系統責任與正式主檔

| 資料／行為 | 正式主檔 | 備註 |
|---|---|---|
| 商品名稱、售價、庫存與可售狀態 | WooCommerce 商品 | LP 只顯示，不成為第二本庫存帳 |
| 十款數量配置 | WooCommerce cart item／order item meta | 伺服器端再次驗證，不能只信前端 JavaScript |
| 付款、退款、地址、出貨與訂單狀態 | WooCommerce 訂單 | CRM 不回寫 |
| 是否先諮詢、入口來源 | WooCommerce order meta | 只存必要狀態與 source code |
| LINE 對話與人工排程 | LINE／營運流程 | MVP 不複製對話全文進 Woo 或 Git |
| 顧客與訂單工作視圖 | Hope Light CRM | 即時唯讀衍生視圖 |

## 4. 顧客旅程

### 4.1 直接訂購

1. 顧客由 LP 點「直接訂購」。
2. WooCommerce 商品頁顯示十款非負整數數量欄位與即時合計。
3. 合計不是 21 時不可加入購物車；伺服器端再次驗證，避免繞過前端。
4. 購物車與結帳摘要顯示十款配置、售價、含運與贈品內容。
5. 完成訂單後，配置固化到 order item meta，CRM 可唯讀顯示。

### 4.2 先諮詢

1. 顧客由 LP 點「先做 10 分鐘諮詢」，前往 LINE 並看到明確提示「請傳蠟燭」。
2. LINE「蠟燭」自動回覆提供兩個選項：直接訂購／先排諮詢。
3. 首版由小幫手人工安排 10 分鐘，不啟用 Messaging API 或 LIFF。
4. 諮詢完成後，小幫手傳回帶 `source=line_consult` 的 WooCommerce 商品連結。
5. 顧客自行填滿 21 顆後結帳；不建立選款未完成的半成品訂單。

## 5. 十款配置資料契約

建議使用穩定 ASCII key，顯示名稱可以日後修改而不破壞既有訂單：

| key | 顯示名稱 |
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

每個值必須是 `0..21` 的整數，十欄合計必須等於 `21`。Order item 保存 key、下單當下
顯示名稱、數量與 schema version，避免未來改名後看不懂舊訂單。

建議 order meta：

| meta key | 值 |
|---|---|
| `_hopelight_c21_schema_version` | `1` |
| `_hopelight_c21_mix` | 十款 key／quantity 的 JSON；只在伺服器端產生 |
| `_hopelight_c21_source` | allowlist source code，例如 `lp_direct`、`line_consult` |
| `_hopelight_c21_consult_path` | `direct` 或 `consult_first` |

不要保存 LINE 對話、自由文字診斷、靈魂藍圖內容或 LINE user ID。

## 6. 元件邊界

### 6.1 LP

- 顯示產品內容與兩個 CTA。
- 透過固定 allowlist 參數傳遞來源，不直接寫訂單或顧客資料。
- JavaScript 失效時仍能到達 WooCommerce 商品頁與 LINE。

### 6.2 `hopelight-candle21-commerce` 外掛

- 只對指定 WooCommerce product ID／SKU 啟用十款選擇 UI。
- 驗證 cart、checkout 與 order item meta。
- 顯示於購物車、結帳、顧客 Email 與後台訂單。
- 提供 feature flag／kill switch；關閉後不影響其他商品結帳。
- 不處理信用卡、不自行建立訂單表、不保存秘密。

### 6.3 CRM 看板

- 延續 `manage_woocommerce` 權限與唯讀原則。
- 顯示配置摘要、source、consult path；必要時連回 Woo 訂單。
- 不在 CRM 內修改付款、配置、地址或訂單狀態。

### 6.4 LINE

- 使用 OA Manager 設定關鍵字與核准文案。
- 首版不使用 Messaging API、Webhook、LIFF 或外部 LINE user profile。
- 所有連結只帶非個資 source code。

## 7. 失敗與降級

| 情境 | 行為 |
|---|---|
| JavaScript 未載入 | Woo 商品頁仍顯示欄位；伺服器端拒絕非 21 的配置 |
| 顧客繞過前端送出 | `add_to_cart_validation`／checkout validation 拒絕並顯示原因 |
| 商品售罄 | WooCommerce 庫存阻擋下單；LP CTA 導向售罄狀態或 LINE 詢問 |
| LINE 自動回應失效 | LP 的直接購買仍可用；公開頁不得承諾即時自動回覆 |
| CRM 擴充失效 | 不阻擋 WooCommerce 結帳；回 Woo 訂單頁工作 |
| 外掛需緊急停用 | feature flag 優先；必要時後台停用，LP 暫時只留 LINE |

## 8. 安全與個資

- WooCommerce 既有結帳頁負責姓名、電話、Email 與地址；LP、LINE URL 與 Git 不帶個資。
- 前端傳來的價格、總數、source 與顯示名稱一律不可信；伺服器以 allowlist 重算。
- 所有管理功能使用 WordPress capability 與 nonce。
- Log、部署收據與測試 fixture 只保存訂單假 ID／遮蔽摘要，不保存真實顧客資料。
- Secret、Cookie、Token、匯出 CSV 與聊天內容維持 Git ignore／本機或網站內保存。

## 9. 驗收條件

1. 十款任意合法組合合計 21 可加入購物車；20、22、負數、小數與竄改 payload 均被拒絕。
2. 購物車、結帳、訂單信件、後台訂單與 CRM 顯示同一份配置。
3. 來源只接受 allowlist；未知值歸為 `unknown`，不原樣輸出。
4. 一筆直接購買與一筆 LINE 諮詢後購買都能完成端對端測試。
5. 其他既有商品的加入購物車、付款與訂單流程不受影響。
6. 關閉 feature flag 後，蠟燭自訂欄位停止作用，網站與其他 Woo 商品仍正常。
7. LINE「蠟燭」、歡迎訊息、LP、Woo 商品與 CRM 的名稱、價格及連結一致。

## 10. 尚待決定與不包含

施工閘門見專案 [`DECISION-REGISTER.md`](../projects/2026-09-candle21-commerce/DECISION-REGISTER.md)。
付款三路通知、Google Calendar API、銀行匯款核帳狀態機與 LINE 身分綁定屬後續專案；
既有 2026-09-01 Blueprint 可作參考，但不能視為本 MVP 已核准範圍。

## 11. 來源與新增內容

來源：現有 LP、`product-facts.md`、D-001～D-004、CRM 外掛、LINE 與網站交接、
2026-09-01 預約付款 Blueprint。  
新增內容：雙入口、十款 key、order meta、server-side validation、feature flag、source allowlist
與上述驗收案例均為本藍圖的新工程設計，待 mamasan QC／QA。

