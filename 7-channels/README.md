# 7-channels｜宇宙媽媽賞自己的對外頻道

這一層保存**她自己擁有的對外帳號**的後台工具與設定。

## 為什麼不放在 6-collaborations 底下

`6-collaborations/teachers/` 是她對外承接的客戶，`partners/` 是共同建造的夥伴。
她自己的帳號兩者都不是 —— 放進 `teachers/` 等於讓她變成自己的客戶，
而且日後要分家時，她自己的資產會跟客戶資產混在同一棵樹裡。

## 跟 1-podcast、2-video 的差別

| 層 | 放什麼 |
|---|---|
| `1-podcast`、`2-video` | **內容企劃** —— 主題、腳本、節目架構 |
| `7-channels` | **帳號後台** —— 登入工具、帳號事實、設定狀態 |

同一個 Podcast 可以同時在兩層出現：企劃在 `1-podcast`，帳號後台在這裡。

## 目前收錄

| 頻道 | 位置 | 狀態 |
|---|---|---|
| LINE 官方帳號 | [`line-official`](./line-official) | 已建立；首次登入與 cached-session 稽核已通過 |
| Instagram | —— | 尚未納入；目前只在公司 `ASSET_PROFILES/mamasan/` 有登記 |
| 官網 | —— | 在 `mamasan.three-quarters.net` repo，不在這裡 |

## 這一層不放什麼

- **客戶名單、好友名單、1:1 對話、聯絡資料。** 那是第三方個資，Git 歷史刪不掉，
  clone 過的人各有一份。她的 CRM／後台走 Notion，不進任何 repo ——
  理由見 `Control-Room/PM/DECISIONS/2026-09-08-mamasan-brand-site-home.md` 第 4 節。
- **權杖、密碼、Channel Secret、Access Token、Cookie。** 登入狀態只留在本機。
- **通用程式碼。** 登入流程與稽核的實作在 `Manus/tools/line-oa`，這裡只呼叫。
