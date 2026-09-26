# Hope Light Landing Pages

這個資料夾的 HTML **同時存在兩個地方**：repo 裡的檔案，以及一個已發布的 Artifact 連結。
老師與 mamasan 是在**連結**上讀稿的，不是在 repo 裡。所以連結本身是交付物的一部分，
記在這裡。

## 目前的頁面

| 檔案 | 主題 | Artifact | 最後發布 | 狀態 |
|---|---|---|---|---|
| [`hopelight-course-lp-mvp.html`](./hopelight-course-lp-mvp.html) | 兩日／三日課程 | <https://claude.ai/code/artifact/0c5f6de3-919a-41cb-8bad-fbf93c4de1f6> | 2026-09-04 | 草稿 v0.1，六處 `待確認` 卡在等老師 |
| [`hopelight-candle21-lp.html`](./hopelight-candle21-lp.html) | 21 顆頻率蠟燭限定組 | <https://claude.ai/code/artifact/441f1c0a-8dd9-4e7c-9cba-2ded8110f9ba> | Artifact：2026-09-24（v0.6）<br>官網：2026-09-26（v0.7） | **定稿**，已拿掉草稿橫幅。上線位置為官網 `/candles`（外掛 `hopelight-candles-lp`，見下方〈上官網〉）；Artifact 只作審稿，**停在 v0.6 未跟上**，要看現況以官網為準 |

兩張都帶著頂端的「內部草稿」橫幅，未經老師確認前不對外發布。

## 改稿之後怎麼重新發布

**一定要指定既有的 Artifact URL。** 從一個沒發布過這張頁面的對話重新發布時，
若不指定 URL，會**另開一張新的 Artifact**，而老師手上那個舊連結會靜靜地停在舊版
—— 她不會收到任何訊號，只會繼續讀一份已經被取代的稿。

所以流程是：改檔案 → 用上表的 URL 重新發布 → 連結不變。

不要因為「發不出去」就開一張新的然後把新連結傳出去。同一份稿在外面有兩個連結，
比舊連結更難收拾。

## 分享中的 Artifact 會被釘在某一個版本

2026-09-06 讀取蠟燭那張 Artifact，分享還開著時，系統回的狀態是
「shared with anyone with the link（viewers currently see this version, but will not
see future publishes until the share pin is moved）」。

意思是：**分享一旦開啟，這條連結就對外釘在當下那個版本**。之後重新發布只會產生
新版本，老師打開同一條連結看到的仍是舊版，而且她不會收到任何提示。

同日把分享關掉後再讀，狀態變成 `private`，那句話消失——**關閉分享會一併解除釘選**。

所以改稿的安全順序是：

1. 改檔案
2. （若分享是開的）先關閉分享
3. 用上表的 URL 重新發布，**不要另開新的**
4. 重新開啟分享，此時才會釘在新版本上

先發布再開分享，比發布後才想辦法移動釘選乾淨。順序反了，老師看到的就是舊版。

## 上官網：`https://hopebox.com.tw/candles`

**2026-09-24 已上線**（v0.6，外掛 `hopelight-candles-lp` 0.1.0，Darren 放行後安裝）。安裝腳本驗收：未登入開 `/candles`
回 200 且有頁面內容、分享預覽圖 200、首頁 200 無致命錯誤；另從外部確認 `/candles`（無斜線）也回 200、
頁面上 12 張圖全部 200、沒有殘留草稿字樣。

**2026-09-26 改版為 v0.7**（外掛 0.1.1，同日再換分享預覽圖為 0.1.2，皆覆蓋安裝；驗收見版本紀錄 v0.7）。

頁面以外掛 [`../wp-plugins/hopelight-candles-lp/`](../wp-plugins/hopelight-candles-lp/) 上線：外掛只接手 `/candles`
這一個網址，輸出本資料夾的 HTML 與 `assets/candle21/`，不經過 Elementor 版型、不動其他頁面。
正本仍是本資料夾；外掛裡的 `page.html` 與 `assets/` 是建置產物，已被 Git 忽略。

```powershell
# 在 website-admin/
npm run candles-lp:pack     # 從本資料夾複製頁面與圖片進外掛，打包成 zip
npm run candles-lp:check    # 預演：確認能上傳外掛、目前狀態；不改網站
npm run candles-lp:install  # 上傳並啟用，最後以未登入方式驗收 /candles 與分享預覽圖
```

改版：改本資料夾的 HTML 或圖片 → `candles-lp:pack` → `candles-lp:install`（覆蓋安裝）。
撤下：wp-admin → 外掛，停用「希望之光 21 顆頻率蠟燭頁」，`/candles` 回到 404。

已知缺口：頁面不經過 WordPress 的 `wp_head`／`wp_footer`，所以 **Jetpack 統計看不到這一頁**的瀏覽數。

## 版本紀錄

- **v0.7**（2026-09-26，官網已更新；Artifact 未重新發布）：「這一批」的圖由實拍換成情境示意圖。
  - Darren 要換這一格的圖，交來一張候選圖。比對後它是**現有實拍的 AI 重繪版**：蠟燭位置與包裝袋皺褶
    和 `batch-real.jpg` 對得上，背景換成古書、鼠尾草、水晶、四葉草吊飾，標籤字也變形了（例如
    「學/事業進步 魔法蠟燭」成了「學業進步 魔泛蠟燭」一類，斜線與「事」字消失）。放在圖說
    「這一批的實品」底下會名實不符，水晶與吊飾也可能被讀成組合內容。
  - 提給 Darren 四條路：保留實拍、新圖另加一格（Claude 建議）；直接換並把圖說改成情境示意；
    照原圖說直接換；先不換、等真的新拍。**Darren 選：這一格改成情境示意圖**，並說那張重繪版
    mamasan 也不夠滿意，請 Claude 挑一張好看的或修那張。
  - 沒修重繪版：變形的是十張標籤上的字，手上沒有能重生成標籤的工具，只能遮或補字，會更像假的。
    改用 IG Launch 002 的 `product-aligned` 底圖（無烘字，約 21 顆排成一批，`content/index.md`
    指定蠟燭優先用這一版）：`content/ig-posts/assets/hope-light-moment-launch-002-two-accounts-product-aligned-base.png`
    （SHA-256 `7b6a6567…865979c`）縮成 960×960 → `assets/candle21/batch-mood.jpg`（`8b8d2bc4…60fa6ff4`），
    圖說「情境示意」。
  - **v0.5 的「實拍當證據，AI 圖只當氣氛」已不是這一頁的原則**：Darren 轉述 mamasan 偏好美化過的畫面
    （「mamasan 就是喜歡美肌」）。整批實拍與實拍裁切的分享預覽圖都已撤下，實拍只剩款名旁的
    `swatch-*.jpg`（從實拍逐顆裁切）。之後有新拍照片，換不換回由 mamasan 看畫面決定，不預設實拍優先；
    要擋的只剩會誤導的內容（錯字、組合裡沒有的東西被讀成內容物），並用「情境示意」標明。
  - `batch-real.jpg` 已從 `assets/` 移除（頁面不再引用；原圖仍在 `../../references/`）。
    重繪版候選圖歸檔在 [`candidates/`](./candidates/)（`candle21-batch-ai-restyle-2026-09-26.jpg`，
    `4ce62eec…a348c327`），不在 `assets/`，不會被打包上線。
  - 外掛版本 0.1.0 → 0.1.1，`candles-lp:check` 預演通過後 `candles-lp:install` 覆蓋安裝（沿用登入快取，未送帳密）。
    驗收：未登入 `/candles` 與 `/candles/` 都回新版、頁面引用的 13 張圖（含分享預覽圖）全部 200、線上 `batch-mood.jpg`
    與本機逐位元組相同；舊 `batch-real.jpg` 繞過快取後為 404（未繞過時仍有快取副本回 200，頁面已不引用）。
  - **同日再換分享預覽圖**（外掛 0.1.2）：Darren 在 Telegram 貼連結時預覽仍是實拍，那是另一個檔案、本次原未更動。
    改用同一張 Launch 002 底圖裁成 1200×630 → `assets/candle21/og-candles-mood.jpg`（`3fe53d43…6e63d207d`），
    舊 `og-candles.jpg` 移除。**刻意換檔名不沿用舊名**：平台與官網前面的快取層都以圖片網址為鍵（上面舊
    `batch-real.jpg` 就被快取層多回了一陣子 200），同名換內容可能繼續拿到舊圖。驗收：`og:image` 指向新檔、回 200、
    與本機逐位元組相同。已貼出的連結要各平台重抓：Telegram 把網址傳給 `@WebpageBot`；Facebook 用 Sharing Debugger
    的「Scrape Again」；LINE 的快取多久自動更新未查證。
- **v0.6**（2026-09-24，定稿）：mamasan 定案（Darren 轉述）——下單方式只寫「加 LINE，私訊『蠟燭』」，拿掉三步驟與 `待確認`；運費列改為「每筆訂單；訂單含 21 顆限定組即免運」NT$60。拿掉置頂草稿橫幅與頁尾草稿字樣，頁尾加「回到官網」。新增分享預覽圖 `og-candles.jpg`（1200×630，從實拍裁切，只給官網版的 `og:image` 用；v0.7 換成情境圖 `og-candles-mood.jpg`）。
- **v0.5**（2026-09-24，mamasan 想加圖片，Darren 請 Claude 提設計）：加入圖片，並修手機版價格表。
  圖片檔在 [`assets/candle21/`](./assets/candle21/)，重新發布時要用 Artifact 的 `files` 一起帶上。
  - **原則：實拍當證據，AI 圖只當氣氛。**（v0.7 起不再適用：mamasan 偏好美化畫面，見 v0.7）依 `references/README.md` 與 `content/index.md`，
    銷售頁優先用實拍；`content/reels/candle-intro-139/source/01–10` 是 AI 氣氛圖，且 02／08 烘著舊款名。
  - `swatch-*.jpg`（10 張）：從實拍 `references/hope-light-candles-real-products-2026-09-07.jpg`
    依包裝上的款名逐顆裁切，用在開場的「21 顆配法示意」與 10 款清單的款名旁。
  - `batch-real.jpg`：同一張實拍縮圖，放在「這一批」。（v0.7 撤下，換成情境示意圖 `batch-mood.jpg`）
  - `mood-lit.jpg`：唯一一張 AI 圖（`candle-intro-139/source/05.jpg` 裁掉烘字），放在「點燃之後」，標「情境示意」。
  - **mamasan 視覺 QC：滿意**（2026-09-24，Darren 轉述）。這是 QC，不是老師對商業條件的確認。
  - 手機版（寬度 < 560px）價格表改成每列「方案＋價格」一行、內容一行，價格不再被推出畫面；
    另修開場光暈造成的橫向捲動，以及置頂橫幅的安全區域。
- **v0.4**（2026-09-24，依 Darren 指示）：限定組內容移除玻璃燭台；價格表拿掉拆解寫法
  （「單顆買滿 21 顆 NT$2,919」一列與「只多 61 元」一段），只留單顆 NT$139、運費 NT$60
  （寫成「單顆購買另計」）、21 顆限定組 NT$2,980；標題「但這一組划算」改為「也可以選整組」。
  v0.3 的款名更新隨本版首次發布。已重新發布到同一 URL，但分享仍釘在先前版本，
  要由 Darren 在分享選單移動。
- **v0.3**（2026-09-07，依最新實品標籤與 Darren 指示）：產品款名「清晰專注」更新為
  「學/事業進步」，同步調整描述與選款範例。尚未重新發布。
- **v0.2**（2026-09-06，依 Tiffany 意見）：字色加深（`--ink` `#201C2E`→`#15111F`、
  `--muted` `#6B6480`→`#4B4560`、`--gold` `#9E6A1C`→`#8A5A12`），內文字重
  300→400，標題改用 Noto Serif TC 700；行高 1.9→1.72，區塊間距與各處 gap 全面收緊，
  標題級距略縮。文案未改。深色模式同步往「更亮」的方向加大對比。
- **v0.1**（2026-09-05）：首版。

## 蠟燭 LP 即將移入 WordPress（2026-09-08）

> **2026-09-24 作廢：**蠟燭採人工回應、不做 WooCommerce 與後台自助欄位（`../DECISIONS.md` D-007），
> 所以靜態 HTML 就是完成品。上線方向改為把這一頁放到官網 `https://hopebox.com.tw/candles`；
> 寫入權限 2026-09-24 已確認（管理員級選單含外掛；經過見 `../README.md`「已確認狀態」）。以下原文保留作歷史。

依 D-006，21 顆組的售價、庫存、含運與贈品要做成 Tiffany 可自助修改的後台欄位，
前台讀取而非抄寫。靜態 HTML 做不到這件事，所以
[`hopelight-candle21-lp.html`](./hopelight-candle21-lp.html) 會在部署計畫 Phase 4
改成子佈景主題頁面範本，頁面上寫死的八處商業數字（2,980 兩處、139 兩處、2,919、
「61 元」差額、玻璃燭台、全台含運）全部換成短碼。

**2026-09-24 更正：**LP v0.4 已拿掉 2,919、「61 元」差額與玻璃燭台，並新增運費 NT$60。
WordPress 候選（`wp-themes/hopebox-candle21-child/`、`wp-plugins/hopelight-candle21-commerce/`）
與階段驗收頁**尚未同步**，仍是舊的燭台與拆價寫法；恢復施工時要先對齊 v0.4。

移入之後，**Artifact 連結降為視覺定稿審閱用，不會跟著後台變動**。價格一律以網站為準；
不要從 Artifact 讀價格，那份會停在移入當下的數字。

## 事實從哪裡來

頁面上的款名、價格、聯絡資訊一律以 [`../../product-facts.md`](../../product-facts.md) 為準，
不要直接照舊素材或截圖抄。該文件底部的「待老師確認」列出目前未定案的項目。

蠟燭文案的可說／不可說界線也在同一份文件的「文案界線」一節。
