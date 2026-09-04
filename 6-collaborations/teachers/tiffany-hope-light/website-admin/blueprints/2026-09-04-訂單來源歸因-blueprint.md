# Blueprint：訂單來源歸因（Order Attribution）

日期：`2026-09-04`
狀態：**藍圖，未實作**
關聯：`DECISIONS.md` D-003（CRM 外掛）、
`Three-Quarters-International/PUBLISHING/SOCIAL_MEDIA/ANALYTICS/2026-09-04-baseline.md`

## 問題

2026-09-04 第一次把兩端的數字擺在一起：

| 端 | 數字 |
|---|---|
| `@hopelight.ig` 累計瀏覽 | 248,905 |
| `@hopelight.ig` 累計留言 | 822 |
| WooCommerce 顧客 | 5 |
| WooCommerce 訂單 | 18 |

24 萬次瀏覽對到 5 位顧客。這個比例是好是壞**無法判斷**，因為中間沒有任何欄位在記錄
「這個訂單從哪裡來」。

已確認的缺口：`scripts/export-customers.cjs` 只抓 `wc-analytics/reports/customers`
與 `wc-analytics/orders` 兩個端點，回傳欄位裡沒有 attribution／source／referrer／utm；
`scripts/build-crm-dashboard.cjs` 也沒有用到任何來源欄位。

## 為什麼現在就要提，即使現在還不做

**歸因只能在訂單發生的當下記錄，事後無法回填。**

現在 18 筆訂單，人工問得完。等到有 50 筆、100 筆才想回頭問「這些人從哪來」，
前面那些已經永遠答不出來了。這件事的成本會隨時間單向增加。

## 待驗證（唯讀，尚未執行）

1. `hopebox.com.tw` 的 WooCommerce 版本是否 ≥ 8.5 ——
   Order attribution 是該版本起內建的功能，不需外掛。
2. 若已內建，是否已啟用、歷史訂單有沒有被回填。
3. 若已在收集，`wc-analytics/orders` 的回傳是否帶得出來，
   或需要改走 `wc/v3/orders` 加 `_wc_order_attribution_*` 的 meta 欄位。

驗證方式：後台 → WooCommerce → 訂單列表，看有沒有「來源」欄。
**唯讀確認即可，先不要改網站設定。**

## 三種可能的做法（尚未選擇）

| 做法 | 成本 | 準確度 | 備註 |
|---|---|---|---|
| WooCommerce 內建 Order Attribution | 低（可能只是打開） | 中 | 靠 referrer 與 UTM，IG App 內開啟的連結常常抓不到 |
| 結帳頁加一題「從哪裡認識我們」 | 中（要改結帳流程） | 中高 | 靠顧客自述，但這個規模的生意反而準 |
| 每個平台用不同的短連結／導流頁 | 中 | 高 | 與 `landing-pages/` 現有做法相容，且不依賴 referrer |

第三種與現況最接近 —— IG 主要靠首頁連結導流，換成可辨識的連結成本最低。

## 界線

- 這件事**不需要**把 IG 成效報表和 CRM 合併。歸因欄位長在訂單上，不長在報表上。
- 顧客個資仍不離開網站（D-003）。IG 那端的報表仍只有聚合數字。
  兩邊各自完整，靠一個欄位對得起來就夠了。

## 下一步

在 CRM 有下一次改動時，順手做第 1、2 項的唯讀確認。不需要為此單獨排一次工。
