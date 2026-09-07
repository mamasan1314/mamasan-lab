# 21 顆頻率蠟燭｜10 分鐘諮詢廣告圖

狀態：**Darren 製作草稿，待 mamasan QC／QA；未代表 Tiffany 核准發布。**

## 目的

以實際蠟燭照片為產品依據，製作一張 IG／Meta 方形廣告圖，傳達：

- 21 顆頻率蠟燭限定組
- 10 款任選 21 顆
- NT$2,980、全台含運
- 贈玻璃燭台與 10 分鐘靈魂藍圖諮詢
- 十款蠟燭名稱

## 來源與界線

- inbox 收件原檔：`../../../../inbox/photo_6118331069963637764_y.jpg`
- 專案內實品參考：`../../../references/hope-light-candles-real-products-2026-09-07.jpg`
- 既有視覺參考：`../../../references/hope-light-candles-style-reference.jpg`
- 產品事實：`../../../product-facts.md`
- 銷售頁：`../../../website-admin/landing-pages/hopelight-candle21-lp.html`
- Rewrite level：**L0**。只整理廣告短文案與視覺，不重建 Tiffany 的教學或產品系統。
- 圖像為 AI 依實品照生成的廣告情境稿，不是商品攝影原片。
- v2 依 mamasan 指示放入 NT$2,980、全台含運、玻璃燭台與 10 分鐘諮詢；目前仍是
  mamasan QC／QA 階段的製作稿，不據此標記為 Tiffany 已核准發布。

## 款名更新

2026-09-07 依新收到的實品照、Darren 提供清單與後續指示，第二款已由「清晰專注」
統一更新為「學/事業進步」。

## 輸出

| 檔案 | 規格 | 狀態 |
|---|---|---|
| `hope-light-candle21-consult-ad-v2-4x5.png` | 1122 × 1402 PNG，約 4:5 | **目前建議稿，待 mamasan QC／QA** |
| `hope-light-candle21-consult-ad-v1.png` | 1254 × 1254 PNG，1:1 | 初稿；資訊不足，已被 v2 取代 |

v2 圖中文字：

1. `希望之光∞頻率蠟燭`
2. `21 顆限定組`
3. `10 款任選 21 顆`
4. `NT$2,980｜全台含運`
5. 十款名稱：`安然入夜`、`好運爆棚`、`小人退散`、`財富豐盛`、`吸引顧客`、
   `吸引桃花`、`學/事業進步`、`貴人常臨`、`感情升溫`、`淨化除穢`
6. `贈玻璃燭台＋10 分鐘靈魂藍圖諮詢`

v2 的完整生成與比例校正 prompt 見 [`PROMPT-v2.md`](./PROMPT-v2.md)。

## 生成方式與 final prompt

使用 Codex 內建 image generation，以 inbox 實品照為主要產品外觀參考、既有單品視覺為
氣氛參考。Final prompt：

```text
Use case: ads-marketing
Asset type: 1:1 Instagram / Meta square advertising creative
Primary request: Create a premium, calm, spiritual Taiwanese product advertisement for Hope Light's 21-piece frequency tealight candle set, based closely on the real products in Image 1. Use Image 2 only as mood and styling guidance, not as a source of product claims.
Input images: Image 1 is the primary product-appearance reference and must guide the candle size, round silver aluminum cups, colorful wax, short wooden wicks, and dried botanical/crystal toppings. Image 2 is a supporting mood/style reference.
Scene/backdrop: refined warm ivory and muted dusty-rose studio setting with subtle golden light, pale wood slice, a few restrained rose-quartz-like stones and botanicals; elegant, uncluttered, believable tabletop product photography.
Subject: a curated group of ten visually distinct tealight candles representing the ten available themes; colors should echo the actual product photo (cream, sunny yellow, lavender, mint green, pink), with natural handmade variation. One candle may be gently lit as the focal point, while all products remain recognizable.
Style/medium: high-end photorealistic product photography, editorial wellness campaign, Taiwanese boutique spiritual brand, polished but honest.
Composition/framing: square 1:1. Product arrangement concentrated across the lower-right and center, with clean negative space on the upper-left for copy. Strong mobile readability. No plastic packaging or handwritten sticker labels in the styled scene.
Lighting/mood: warm golden candlelight plus soft diffused studio light; serene, supportive, quietly abundant, not occult or theatrical.
Color palette: warm ivory, rose beige, muted blush, soft lavender, sage/mint, restrained antique gold, dark plum-brown typography.
Text (verbatim), Traditional Chinese only:
"希望之光∞頻率蠟燭"
"21 顆限定組"
"10 款任選 21 顆"
"可搭配 10 分鐘靈魂藍圖諮詢"
Typography: elegant high-contrast Traditional Chinese serif for the title, clean Traditional Chinese sans-serif for supporting lines. Ensure every character is exactly correct and legible. Place the consultation message in a tasteful small rounded gold-accent label.
Constraints: preserve the real handmade tealight product identity; candles must remain small aluminum-cup tealights with short wooden wicks and botanical/crystal decoration; no medical or guaranteed-outcome claims; no price; no shipping promise; no glass candleholder claim; no logos invented; no English copy; no watermark.
Avoid: misspelled Chinese, duplicated words, fantasy magic effects, tarot symbols, zodiac circles, excessive crystals, luxury perfume packaging, tall jar candles, taper candles, melted/deformed products, clutter, tiny unreadable text.
```
