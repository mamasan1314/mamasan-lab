# Hope Light Moment｜蠟燭介紹 Reels

## 基本資料

| 欄位 | 內容 |
|---|---|
| 主題 | 希望之光∞頻率蠟燭介紹 |
| 格式 | IG Reels / 直式 9:16 |
| 價格 | NT$139／顆，不含運，可任選 |
| 聯絡資訊 | LINE: `@happy139`；IG: `.hopelight.ig / hopelight.moment` |
| 輸出 | [`output/hope-light-candle-intro-139.mp4`](./output/hope-light-candle-intro-139.mp4) |

## 影片順序

1. 希望之光∞頻率蠟燭｜10 款主題能量
2. 貴人常臨蠟燭
3. 清晰專注蠟燭
4. 感情升溫蠟燭
5. 吸引桃花蠟燭
6. 吸引顧客蠟燭
7. 小人退散
8. 好運爆棚
9. 靜謐放鬆蠟燭
10. 財富豐盛蠟燭
11. 淨化除穢

> **品名沿革（2026-09-05）**：第 9 項「靜謐放鬆」現行品名為「安然入夜」。
> 此清單與 `caption.md` 照實記錄影片畫面內容，畫面烘進的是舊名，**因此不改**。
> 現行品名以 `../../../product-facts.md` 為準。
> 若要重新發布這支影片，得先決定是重製畫面還是沿用舊名——兩者不要混著出。

## 價格修正

來源第 11 張圖上標示 `$188`，依使用者確認，正式價格應為：

> NT$139／顆，不含運，可任選

影片畫面已用 `$139／顆` 覆蓋錯價，避免露出 `$188`。

## 重建方式

執行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-candle-intro-video.ps1
```

此腳本會：

- 產生 1080x1920 的直式影片畫面到 `frames/`。
- 優先使用本機 `ffmpeg` 匯出 `output/hope-light-candle-intro-139.mp4`。
- 若沒有 `ffmpeg`，才嘗試使用本機 PowerPoint 匯出。

## 影片規格

- 解析度：1080x1920
- 比例：9:16
- 長度：約 37.4 秒
- 幀率：30 fps
- 音訊：無音樂／無旁白版

## 對外文案提醒

影片中以「主題」與「陪伴方向」介紹蠟燭，不保證招財、桃花、學業、睡眠、醫療或任何具體結果。
