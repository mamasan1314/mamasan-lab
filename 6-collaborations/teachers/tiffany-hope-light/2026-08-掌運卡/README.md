# 掌運卡專案

Tiffany 於 2026-08-25 提供兩份不同階段的課程 PowerPoint，作為掌運卡專案的原始資料。兩份簡報已合併視為同一個知識素材池，第一輪文字擷取、內容盤點與課程母架構已完成，並曾生成 43 頁 v0.2 講師草稿；兩份原始檔未被改動。

2026-08-26，mamasan 已將第一輪問題與 v0.2 PPT 交付 Tiffany。Tiffany 認為成果大量改動她原本的文案，對交付不滿意。**v0.2 已交付但未被接受，不是正式版。**完整回顧與新流程見 [`working/2026-08-26-post-delivery-review.md`](./working/2026-08-26-post-delivery-review.md)。

同日，mamasan 確認下一輪先採 L0：九月版為主本、0305 只作差異對照，完整牌義與特殊組合不再由摘要取代；Tiffany 最新回饋覆蓋封面、歷史、六字與 52 張／Joker 頁。已生成 **85 頁 v0.3 L0 內部校整候選**，目前只交給 mamasan 做 QC，尚未交付 Tiffany。

## 原始資料

原檔統一放在 [`source`](./source)，保留 Tiffany 提供時的檔名與內容：

- `9月份改掌運卡.pptx`
- `掌運撲克牌卡課程0305.pptx`

## 目前狀態

- 階段：**v0.3 L0 校整候選已製作，待 mamasan 逐頁 QC 與交付決定；尚未送 Tiffany**
- 原始檔：只作來源保存，不直接覆寫

### 目前的內部候選（未交付 Tiffany）

- v0.3 L0 PPTX（85 頁）：[`outputs/掌運卡_L0校整候選_v0.3_20260826.pptx`](./outputs/掌運卡_L0校整候選_v0.3_20260826.pptx)
- 逐頁來源稿：[`outputs/掌運卡_L0校整候選_v0.3_逐頁來源稿.md`](./outputs/掌運卡_L0校整候選_v0.3_逐頁來源稿.md)
- 給 mamasan 的 QC 單：[`outputs/掌運卡_v0.3_給mamasan的QC單.md`](./outputs/掌運卡_v0.3_給mamasan的QC單.md)
- 來源、變更、風險與新增標記帳本：[`working/v0.3-L0-變更帳本.md`](./working/v0.3-L0-變更帳本.md)
- 自動驗證：[`working/v0.3-L0-驗證報告.md`](./working/v0.3-L0-驗證報告.md)
- 建置腳本：[`working/build-deck-v0.3-l0.ps1`](./working/build-deck-v0.3-l0.ps1)
- 預覽圖不納入保存；需要目視 QC 時可用建置腳本的 `-ExportPreviews` 重新產生。

### 已交付的歷史版本（未核准）

- v0.2 PPTX（43 頁，已送出、未接受）：[`outputs/掌運卡_教學版_講師草稿_v0.2_20260826.pptx`](./outputs/掌運卡_教學版_講師草稿_v0.2_20260826.pptx)
- 已送出的第一輪五題：[`outputs/掌運卡_老師決策單_第一輪.md`](./outputs/掌運卡_老師決策單_第一輪.md)
- 未送出的完整八題：[`outputs/掌運卡_老師決策單_v0.2.md`](./outputs/掌運卡_老師決策單_v0.2.md)
- 逐頁腳本：[`outputs/掌運卡_教學版_講師草稿_v0.2_逐頁腳本.md`](./outputs/掌運卡_教學版_講師草稿_v0.2_逐頁腳本.md)
- 說明：[`outputs/README.md`](./outputs/README.md)

### 工作層（整理過程）

- 受託範圍與空白：[`working/entrustment-v0.2.md`](./working/entrustment-v0.2.md)
- v0.1 → v0.2 逐項理由：[`working/v0.2-變更理由.md`](./working/v0.2-變更理由.md)
- 交付回饋、三方角色與 v0.3 前置條件：[`working/2026-08-26-post-delivery-review.md`](./working/2026-08-26-post-delivery-review.md)
- 逐頁擷取：[`working/extracted`](./working/extracted)
- 內容盤點：[`working/content-audit.md`](./working/content-audit.md)
- 知識母架構：[`working/knowledge-architecture.md`](./working/knowledge-architecture.md)
- 建置腳本：[`working/build-deck-v0.2.ps1`](./working/build-deck-v0.2.ps1)
- 預覽圖未保存；需要時可由歷史建置腳本以 `-ExportPreviews` 重新產生。

### 已取代

- v0.1（38 頁）：[`outputs/掌運卡_簡潔教學版_講師草稿_v0.1_20260825.pptx`](./outputs/掌運卡_簡潔教學版_講師草稿_v0.1_20260825.pptx)、[`working/slide-script-v0.1.md`](./working/slide-script-v0.1.md)、[`working/rewrite-outline.md`](./working/rewrite-outline.md)

### 後續閘門

1. mamasan 依 v0.3 QC 單檢查封面、最新回饋、完整牌義、特殊組合與橘色待確認標記。
2. mamasan 決定這次只帶哪些核心問題給 Tiffany，不直接轉送內部稽核帳本。
3. mamasan 完成 QC／QA 並願意承擔後，才由她對 Tiffany 交付 v0.3。
4. Tiffany 先確認內容完整性與作者聲音；任何縮頁、合併或 L1／L2 工作另開下一輪。
5. Tiffany 接受前，不稱正式版、成功案例或已完成服務。
