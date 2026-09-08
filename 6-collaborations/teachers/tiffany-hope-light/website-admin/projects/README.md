# HopeBox engineering projects

這個資料夾是跨 `landing-pages/`、`blueprints/`、`plans/`、`wp-plugins/` 的工程專案入口。
它不複製各處文件，而是提供每個專案的狀態、邊界、文件索引與待決策清單。

## 目錄規則

| 位置 | 放什麼 |
|---|---|
| `projects/<project>/README.md` | 專案入口、狀態與 canonical links |
| `projects/<project>/DECISION-REGISTER.md` | 尚待決定／已決定的專案問題；已成為長期規則者再提升至根目錄 `DECISIONS.md` |
| `blueprints/` | 尚未施工或尚未核准的系統設計 |
| `plans/` | 可執行順序、部署閘門、驗證與回復計畫 |
| `wp-plugins/` | WordPress 外掛原始碼；每個外掛一個固定 slug |
| `landing-pages/` | 可版控的頁面 HTML／CSS |
| `context/` | 跨工作階段的現況與重入交接 |

## 安全界線

Git 可以保存架構、程式碼、假資料 schema、非敏感測試結果與遮蔽後的部署收據；不得保存
密碼、Cookie、Token、Channel Secret、真實訂單匯出、LINE 對話或任何可識別顧客個資。

## 目前專案

| 專案 | 狀態 | 入口 |
|---|---|---|
| 21 顆頻率蠟燭 WooCommerce × LINE × CRM | 規劃中，未施工 | [`2026-09-candle21-commerce/`](./2026-09-candle21-commerce/) |

