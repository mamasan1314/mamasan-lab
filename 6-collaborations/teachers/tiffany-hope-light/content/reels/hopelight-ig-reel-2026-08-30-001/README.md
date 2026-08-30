# @hopelight.ig｜2026-08-30 手動發布 Reel 001

## 基本資料

| 欄位 | 內容 |
|---|---|
| 目標帳號 | `@hopelight.ig` |
| 狀態 | `published-manually / user-confirmed` |
| 發布時間 | 2026-08-30 22:31:11（Asia/Taipei）／`2026-08-30T14:31:11+0000` |
| 公開網址 | https://www.instagram.com/reel/Dcquxa8KVBX/ |
| Media ID | `18108277667141280` |
| 類型 | `VIDEO` ／ `REELS` |
| 原始檔名 | `IMG_7775.MP4` |
| 歸檔檔案 | [`source/hopelight-ig-reel-2026-08-30-001.mp4`](./source/hopelight-ig-reel-2026-08-30-001.mp4) |
| 發布方式 | 使用者自行透過 Instagram 發布 |

## 來源與完整性

- 檔案由 `inbox/IMG_7775.MP4` 移入本專案並重新命名；未轉檔、未剪輯、未覆寫內容。
- SHA-256：`9b907a47ad035e51da49e29b5d435e29b31f107a45894870f93ff1095cd8bccd`
- 檔案大小：9,575,451 bytes（約 9.13 MiB）。
- Windows 媒體屬性顯示約 46 秒、464×848、30 fps、直式、H.264 視訊並含 AAC 音軌。

## 實際發布的 Caption

2026-08-31 以 Instagram Graph API 唯讀讀回，逐字保存，未經編修：

```text
大家是不是想說：「老師怎麼兩個禮拜都沒更新IG？」😂

今天這支影片一次說清楚——
八月份，老師的行程真的被塞爆了。
滿滿的工作、滿滿的責任，沒有偷懶，也沒有消失。

但老師一直記得大家在等，
所以這支影片，就是我的交代，也是的我真心話。

八月很滿，但九月，我們繼續往前走。

影片連結在自介欄，看完記得跟我說一聲📌

影片看完，如果你也想知道自己的大腦狀態——
請直接私訊我或點擊留言處，加入官方Line預約腦意識評量喔～

留言告訴我：「我看完了，我要預約」
我會優先幫你保留時段。

#老師回來了 #八月行程滿檔 #名額有限 #九月第一波 

推薦你加入「希望之光｜腦意識調頻」官方+LINE+✨
一起探索生命藍圖、腦意識調頻與能量選品：
https://lin.ee/W7z3hTm
```

## 發布紀錄界線

- 2026-08-31 已用 `npm run instagram:whoami` 所建立的唯讀 API 通道，向 Instagram 取回
  media ID、公開網址、確切發布時間與實際 Caption，補齊原本缺漏的欄位。
- 「已發布」原為 2026-08-30 使用者口頭回報；現已由 API 獨立核實。
- Caption 由 Tiffany 自行撰寫並自行發布，非協作者產出，也不代表 Tiffany 已核准任何
  由協作者另行新增的文案。
- 本檔為已發布素材的來源歸檔，不要重複上傳。

## LINE 連結查證結果（已釐清，非不一致）

這則 Caption 使用的加好友網址是 `https://lin.ee/W7z3hTm`，與
[`../../../product-facts.md`](../../../product-facts.md) 記載的 `https://lin.ee/vG7eI1Dv` 不同字串。
2026-08-31 追查兩條短連結的轉址目標，確認**指向同一個 LINE 官方帳號**：

```text
lin.ee/W7z3hTm   -> line.me/R/ti/p/@290ykfry?ts=08171137
lin.ee/vG7eI1Dv  -> line.me/R/ti/p/@290ykfry?ts=06230108
```

差異只在 `ts` 參數，推測為短連結的產生時間（0623 與 0817）。同一個官方帳號可以產生多條
`lin.ee` 加好友短連結，舊連結不會失效，因此兩條並存屬正常狀態，不是錯誤。

`@290ykfry` 是 LINE 自動配發的 Basic ID，`@happy139` 是自訂的 Premium ID，兩者為同一帳號的
不同識別碼。product-facts 記載的 `@happy139` 與 `lin.ee/vG7eI1Dv` 均為有效值。

仍待決定的是**對外統一使用哪一條**，理由見 product-facts 的聯絡資訊段落。
