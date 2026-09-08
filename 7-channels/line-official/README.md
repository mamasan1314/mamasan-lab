# 宇宙媽媽賞 LINE 官方帳號

這個資料夾只保存「哪一個帳號」與工具位置。登入流程與唯讀稽核的實作在
[`Manus/tools/line-oa`](../../../Manus/tools/line-oa/README.md)，通用能力只維護一份。

這裡沒有帳號、密碼、Channel Secret 或 Access Token。

## 帳號資料

- 管理後台：`https://manager.line.biz/account/@941hfdmj`
- 帳號識別碼：`@941hfdmj`（**LINE 系統配發的 Basic ID**）
- 對外公開的 ID：**尚未確認**

⚠️ **確認對外 ID 之前，不要把 `@941hfdmj` 放到官網或任何對外素材上。**
希望之光那邊踩過同一題：`@290ykfry` 是系統配發的 Basic ID，`@happy139` 才是
自訂的 Premium ID，兩者是同一個帳號。她這邊可能也有一組自訂 ID。

需要向她確認三件事：對外要公開的 LINE ID、加好友網址（`https://lin.ee/...`）、
以及帳號的顯示名稱。三項齊了才動官網。

## 已確認狀態

最後完整驗證：`2026-09-09`（Asia/Taipei）

- 後台帳號顯示名稱：**「宇宙媽媽賞1314」**
- 登入工作階段已建立，`npm run audit` 無頭模式以 `cached-session` 重入成功。
- 可見導覽：主頁、分析、聊天、商業簡介、LINE VOOM、擴充功能、開店幫手、OA Plus、設定、
  訊息一覽、建立新訊息、廣告活動、漸進式訊息、自動回應訊息、AI 聊天機器人（β）、
  圖文訊息、進階影片訊息、多頁訊息、優惠券、集點卡、問卷調查、LINE Touch、
  加入好友的歡迎訊息、圖文選單、受眾、追蹤（LINE Tag）、增加好友工具、加好友廣告。
- 稽核未開啟也未輸出聊天室內容；未變更任何設定。

**看得到功能入口不代表該功能已啟用或設定完成。** 以下狀態尚未檢查，也未變更：
Messaging API、自動回應訊息、AI 聊天機器人（β）、圖文選單、歡迎訊息、好友數。

⚠️ **顯示名稱與品牌名不一致**：後台是「宇宙媽媽賞**1314**」，官網與所有品牌文件是
「宇宙媽媽賞」。使用者在 LINE 裡看到的是前者。要她決定改哪一邊 ——
這件事在對外推廣之前處理比較便宜。

## 一次性安裝

需求：Node.js 20 以上，以及 Chrome、Edge 或 Chromium 其中一個。

依賴裝在共用工具那裡，不在這個資料夾，而且只需要做一次：

```powershell
cd ../../../Manus/tools/line-oa
npm ci
```

## 第一次登入

```powershell
cd 7-channels/line-official
npm run login
```

會開一個瀏覽器視窗。在裡面完成 LINE Business ID 登入與手機認證 ——
**這一步一定要人做**，因為要收簡訊。工具確認帳號可存取之後會自動關掉瀏覽器。

Cookie 存在 `%LOCALAPPDATA%\line-oa\mamasan-line-oa-browser-profile`，
**不在 repository、不在 OneDrive**。

## 平常唯讀確認

```powershell
npm run audit
```

無頭模式被 LINE 擋住時改用：

```powershell
npm run audit:visible
```

稽核只讀取畫面標題、頁面標題與導覽標籤，輸出固定帶 `chatContentRead: false`。
**看得到功能入口，不代表該功能已啟用或設定完成。**

工作階段會過期。回報 `needsLogin` 就是重跑一次 `npm run login`，不是壞掉。

## 現行能力界線

目前的 `audit` **不讀、不回、不摘要 1:1 聊天**。

後台的聊天室裡是第三方個資 —— 姓名、頭像、電話、對話內容。
共用工具有一道護欄會擋掉聊天室路徑的請求，但那是護欄不是證明；
真正的規則是稽核只讀標題與導覽標籤。

這是第一版工具的能力範圍，不是永久禁止自動化。讀取指定對話、產生回覆草稿、
人工核准發送與窄幅自動回覆是否逐級開放，留在
[`CR-PROP-2026-005`](../../../Control-Room/PM/PROPOSALS/line-conversation-automation/README.md)
討論；提案被接受以前，不把聊天室能力混進 `audit`。

| 能力 | 目前狀態 |
|---|---|
| 登入與畫面導覽稽核 | 已實作，可唯讀執行 |
| 群發訊息、圖文選單、歡迎訊息、商業簡介 | 尚未實作；屬內容發布，需逐項授權 |
| 1:1 對話讀取、草稿或回覆 | 尚未授權、尚未實作；由提案決定是否分級開放 |

## 目前只有唯讀

這套工具現在不寫入任何 LINE 設定。未來若擴充，另建清楚命名的讀取／草稿／發送模組，
不直接放寬 `audit`。

## 相關

- 公司端帳號登記：`Three-Quarters-International/PUBLISHING/SOCIAL_MEDIA/ASSET_PROFILES/mamasan/channels/line.json`
- 官網：`mamasan.three-quarters.net`（LINE 連結待對外 ID 確認後補上）
- 治理：`Control-Room/PM/DECISIONS/2026-09-08-mamasan-brand-site-home.md`
- 權限提案：`Control-Room/PM/PROPOSALS/line-conversation-automation/`
