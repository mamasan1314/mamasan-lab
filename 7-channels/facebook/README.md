# 宇宙媽媽燒 Facebook 粉專

這個資料夾放粉專的對外素材（封面、分享預覽圖）與它們的原始檔。
帳號授權、Vault 位址與發文引擎的設定在公司端，見下方〈相關〉。這裡沒有任何權杖。

## 帳號資料

- 名稱：宇宙媽媽燒
- Page ID：`104239582493936`（**唯一穩定的識別**）
- 網址名稱：`@mamasanburn`（`2026-09-30` 讀到）。`2026-09-27` 登記時是 `@BuyOoh`，
  公司端的決策、REGISTRY 與頻道檔仍寫舊名；Vault alias `buyooh` 不必改，引擎發文前把頻道檔的 handle 更新即可。
- 分類：購物與零售

## 購買入口：統一用 LINE 傳「蠟燭」

Darren `2026-09-30`：「統一用蠟燭」。

- 部分貼文寫的是「私訊小編【頻率】」。Darren 判斷是沿用了 Tiffany（腦波老師）舊影片的說法。
- 之後的貼文結尾一律寫：LINE `@941hfdmj` 傳「蠟燭」。
- 官網 `/shao/`、`/shao/candles/`、LINE 歡迎訊息都已經是「蠟燭」。
- 系統沒有這個粉專的留言與私訊授權，FB 那一側的詢問只有 mamasan 自己看得到。所以入口收在 LINE。

## 封面（`cover.jpg`，1640×624）

**上傳：由 Darren 或 mamasan 在粉專上換。** 系統使用者沒有 `MANAGE` 權限，這是刻意的（見決策第 4 條）。

- 文字取自粉專簡介（她自己的話）：「燒蠟燭、燒好物，燒掉你不需要的舊能量。有種，就來被我燒到。」
- 蠟燭照片沿用官網蠟燭頁的 `mood-lit-protect.jpg`（希望之光的實品情境照）。
- 版面配合 FB 的裁切：
  - 手機只顯示中間約 1110px，重要內容都在中間；
  - 左下角會被大頭貼蓋住，那裡不放東西。
  - `2026-09-30` 用裁切模擬檢查過。

## 官網分享預覽圖（`og-shao.html`）

輸出到 `mamasan.three-quarters.net/assets/img/og-shao.jpg`，供官網 `/shao/` 的 og 標籤使用。

## 重新產生

```powershell
cd 7-channels/facebook
node render.mjs cover.html cover.jpg 1640 624
node render.mjs og-shao.html ../../../mamasan.three-quarters.net/assets/img/og-shao.jpg 1200 630
```

- 需要本機的 Chrome。
- 字型用本機的 Noto Serif TC；沒裝的機器截出來字會不一樣。
- 原始檔用相對路徑讀官網 repo 的圖，所以兩個 repo 要放在同一層。

## 相關

- 決策：`Control-Room/PM/DECISIONS/2026-09-27-mamasan-facebook-page-buyooh.md`
- 聲音：`Control-Room/PM/PROPOSALS/26016-mamashao-sales-persona/`
- 官網門面：`mamasan.three-quarters.net/shao/index.html`
