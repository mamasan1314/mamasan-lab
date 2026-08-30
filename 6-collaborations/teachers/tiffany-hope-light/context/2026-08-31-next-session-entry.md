# 2026-08-31 下次工作階段的重入指引

寫給下一個接手的工作階段（人或 AI）。讀完這份就能直接開工，不需要重新探索。

## 先讀這兩份

1. 本文件
2. [`../website-admin/README.md`](../website-admin/README.md) 的「Instagram 發布 App」整節

不要重新探索 Meta 權限層次、權杖類型或 resumable upload，那些都已經有結論。

## 睡醒後的第一件事：臨時素材隧道

**這是明確指定的第一項工作。**

### 問題

Instagram Content Publishing API 不接受本機檔案，Meta 只會前往一個公開 HTTPS
網址抓取素材。實測確認 `upload_type=resumable` 對 Instagram Login 不可用，
沒有直接上傳這條路。

目前的權宜作法是把素材推到 `three-quarters.net`（Darren 的個人網站）的
`assets/images/`，缺點是素材**永久公開**。這對 Darren 自己的測試素材可以接受，
但**不得用於 Tiffany 的素材**。

已評估並否決的替代方案：放到未來協會的 `.org` 網站。理由是公開網址的暴露程度
完全相同，卻額外引入資產歸屬與治理問題——這與本專案先前拒絕把 App 掛進
「珈語老師」商家資產組合是同一個判斷。

### 要做的事

讓 `npm run instagram:publish` 支援本機檔案：

```powershell
npm run instagram:publish -- --video ./local.mp4 --caption-file caption.txt
```

工具內部流程：

1. 在本機起一個臨時 HTTP 服務，只服務這一個檔案，用隨機路徑。
2. 以 cloudflared 之類的工具開一條臨時公開隧道，取得 HTTPS 網址。
3. 把該網址當成 `video_url`／`image_url` 交給 Meta 建立容器。
4. 輪詢容器狀態至 `FINISHED`（影片為非同步轉檔，未就緒即發布會失敗）。
5. 發布後立刻關閉隧道與本機服務。

設計要求：

- 素材全程不離開本機，隧道網址在發布完成後即失效。
- 隧道必須在成功、失敗與中斷三種情況下都確實關閉。
- 若隧道工具不存在，明確報錯並說明如何安裝，不要無聲回退到公開網站託管。
- 保留現有的 `--image`／`--video` 公開網址模式，不要移除。

完成後更新 `website-admin/README.md` 的「素材必須是公開 HTTPS 網址」一節。

## 目前狀態速查

| 項目 | 狀態 |
|---|---|
| Instagram App `hopelight-publisher-IG` | 已建立，App ID `1965739860772119` |
| 權杖 | 兩支皆可用，推定 2026-10-30 到期，需 10 月中旬前刷新 |
| 權限 | basic、content_publish、manage_comments、manage_messages 四項皆已授予 |
| 帳號設定檔 | `sandbox`=`@darrenfiy`（預設）、`hopelight`=`@hopelight.ig`（production） |
| 發布工具 | 圖片與 Reels 皆可用，預設停在預檢 |
| 對 `@hopelight.ig` 的發布 | **從未執行過**，正式發布前須經 mamasan 確認 |
| Page ↔ Instagram 連結 | 仍在 Meta 的七天等待期，2026-09-07 之後才重試 |
| 掌運卡 | v0.3 已交付、無回應、擱置 |

## 已確認不可行，不要再試

- 直接上傳檔案（`upload_type=resumable`）：Instagram Login 不支援，實測回 400。
- 瀏覽器 UI 自動化發文：2026-08-30 判定太慢且脆弱，已放棄。
- 為了查權杖到期日而呼叫 refresh 端點：該端點會換發新權杖，屬狀態變更。

## 非技術的待辦，比技術更要緊

1. **與 mamasan 議定報酬與範圍**：專案費、月費、分潤、工作範圍、KPI 至今未定，
   而已交付的工作已相當可觀。這是「做很多卻沒有完成感」的結構性原因。
2. **向 Tiffany 追問長期待確認事項**：大小貴人規格與價格、Logo、Bio、
   IG 第五篇老師故事可否公開。部分已等超過十天。
3. **自動回覆的界線**：權限已具備，但 AI 代 Tiffany 回覆客戶的責任歸屬、
   哪些問題不得自動回答、客戶是否知情，尚未與 mamasan 議定。
   技術可行不等於應該做。
