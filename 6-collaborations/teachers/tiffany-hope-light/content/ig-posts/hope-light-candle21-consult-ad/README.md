# 21 顆頻率蠟燭｜10 分鐘諮詢廣告圖

狀態：**Darren 製作草稿，待 mamasan QC／QA；未代表 Tiffany 核准發布。**

## 目的

以實際蠟燭照片為產品依據，製作一張 IG／Meta 方形廣告圖，傳達：

- 21 顆頻率蠟燭限定組
- 10 款任選 21 顆
- 可搭配 10 分鐘靈魂藍圖諮詢

## 來源與界線

- inbox 收件原檔：`../../../../inbox/photo_6118331069963637764_y.jpg`
- 專案內實品參考：`../../../references/hope-light-candles-real-products-2026-09-07.jpg`
- 既有視覺參考：`../../../references/hope-light-candles-style-reference.jpg`
- 產品事實：`../../../product-facts.md`
- 銷售頁：`../../../website-admin/landing-pages/hopelight-candle21-lp.html`
- Rewrite level：**L0**。只整理廣告短文案與視覺，不重建 Tiffany 的教學或產品系統。
- 圖像為 AI 依實品照生成的廣告情境稿，不是商品攝影原片。
- 未放入玻璃燭台、全台含運等尚待老師確認的承諾。

## 款名待 QC

2026-09-07 新收到的實品照及 Darren 提供清單出現「學事業進步」，但目前
`product-facts.md` 與 LP 使用「清晰專注」。本廣告先不逐一列出十款名稱，以免在
mamasan／Tiffany 確認前對外固化衝突版本。

## 輸出

| 檔案 | 規格 | 狀態 |
|---|---|---|
| `hope-light-candle21-consult-ad-v1.png` | 1:1 PNG，IG／Meta 方形廣告 | 草稿，待 mamasan QC／QA |

圖中文字：

1. `希望之光∞頻率蠟燭`
2. `21 顆限定組`
3. `10 款任選 21 顆`
4. `可搭配 10 分鐘靈魂藍圖諮詢`

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
