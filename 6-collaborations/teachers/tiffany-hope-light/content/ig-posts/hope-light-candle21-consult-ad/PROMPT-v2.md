# v2 final prompts

使用 Codex 內建 image generation。主要輸入為 v1 廣告稿與
`../../../references/hope-light-candles-real-products-2026-09-07.jpg`。

## 內容重排 prompt

```text
Use case: ads-marketing
Asset type: 4:5 portrait Instagram / Meta feed advertisement, information-rich campaign poster
Primary request: Recompose Image 1 into a taller 4:5 portrait advertisement so all required Traditional Chinese product information is spacious and mobile-readable. Preserve Image 1's premium warm ivory, dusty rose, restrained gold art direction and photorealistic handmade tealight product styling. Use Image 2 as the factual product-appearance reference.
Input images: Image 1 is the visual style and quality reference; Image 2 is the real-product reference for round silver aluminum cups, colorful wax, short wooden wicks, and botanical/crystal toppings.
Scene/backdrop: warm ivory editorial studio tabletop with soft blush textile, pale wood slice, a few restrained rose-quartz-like stones and dried botanicals.
Subject: exactly ten visually distinct small aluminum-cup tealight candles, matching the real handmade products. Cream, sunny yellow, lavender, mint green and pink wax; one gently lit focal candle.
Style/medium: high-end photorealistic Taiwanese boutique wellness product campaign.
Composition/framing: portrait 4:5. Clear three-level hierarchy: (1) title and price at top, (2) photorealistic candle group in the middle, (3) a clean warm-ivory information panel at the bottom containing the ten names in two aligned columns and the included-value line. Keep generous margins and make every line readable on a phone.
Lighting/mood: soft diffused golden daylight and gentle candlelight; serene, warm and trustworthy.
Color palette: warm ivory, rose beige, muted blush, soft lavender, sage/mint, restrained antique gold, dark plum-brown typography.
Text (verbatim), Traditional Chinese only:
"希望之光∞頻率蠟燭"
"21 顆限定組"
"10 款任選 21 顆"
"NT$2,980｜全台含運"
"安然入夜"
"好運爆棚"
"小人退散"
"財富豐盛"
"吸引顧客"
"吸引桃花"
"學/事業進步"
"貴人常臨"
"感情升溫"
"淨化除穢"
"贈玻璃燭台＋10 分鐘靈魂藍圖諮詢"
Typography/layout: elegant Traditional Chinese serif for brand/title; clean Traditional Chinese sans-serif for product names and details. Place the ten names in two balanced columns, five per column, each name appearing exactly once. Make "NT$2,980" visually prominent. Place "全台含運" adjacent to the price. Put the final gift/consultation sentence in a tasteful gold-outlined rounded label at the bottom.
Constraints: every listed text string must be spelled exactly as provided; preserve the slash in "學/事業進步"; show exactly ten candles; all candles must remain recognizable small aluminum-cup tealights with short wooden wicks and restrained botanical/crystal decoration; no medical or guaranteed-outcome claims; no extra product benefits; no invented logo; no English beyond "NT$"; no watermark.
Avoid: omitted or duplicated product names, misspelled Chinese, tiny unreadable type, overlapping text, visual clutter, fantasy magic effects, tarot or zodiac symbols, tall jar candles, taper candles, plastic packaging, handwritten stickers, excessive crystals.
```

## 4:5 比例校正 prompt

```text
Use case: precise-object-edit
Asset type: Instagram / Meta 4:5 feed advertisement
Primary request: Change only the canvas and layout proportions of the most recent generated advertising poster from its current overly tall portrait ratio to an exact 4:5 portrait aspect ratio (width:height = 4:5). Reflow and slightly compact the existing composition so every existing element fits safely within a 4:5 feed canvas. Preserve the overall design, photography, exactly ten candles, colors, visual hierarchy, and all copy.
Composition/framing: exact 4:5 portrait canvas, not 2:3 and not 9:16. Keep generous safe margins on every edge. The title and price remain at the top, ten candles remain in the middle, and the two-column list plus gift label remain at the bottom. Make the lower information panel a little shorter and wider.
Text invariants: preserve each line exactly and keep all legible: 希望之光∞頻率蠟燭；21 顆限定組；10 款任選 21 顆；NT$2,980｜全台含運；安然入夜；好運爆棚；小人退散；財富豐盛；吸引顧客；吸引桃花；學/事業進步；貴人常臨；感情升溫；淨化除穢；贈玻璃燭台＋10 分鐘靈魂藍圖諮詢。
Constraints: change only aspect ratio and spatial reflow; keep exactly ten candles; do not add, remove, rename, misspell, or duplicate any product or text; preserve the slash in "學/事業進步"; no cropping of text, price, candles, or gift message; no watermark.
Avoid: 2:3 canvas, 9:16 canvas, missing text, tiny text, changed Chinese characters, new decorative objects, altered product count.
```
