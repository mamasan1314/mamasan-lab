# 2026-08-30 Meta × Instagram 權限與發布交接

這份文件記錄 2026-08-30 對「希望之光-Hope light」Facebook 粉絲專頁、`@hopelight.ig`、Meta Business Suite 與 Instagram 發布方式的調查結果。它只保存可安全重用的狀態與下一步，不保存密碼、Cookie、驗證碼、Access Token、私訊或顧客資料。

## 今日目標與實際結果

今日原始目標有兩項：

1. 讓 Darren 不必登入 Tiffany 的私人帳號，也能管理 `@hopelight.ig` 內容。
2. 將 Facebook 粉絲專頁「希望之光-Hope light」與 `@hopelight.ig` 連結。

今日沒有完成 Page ↔ Instagram 連結。Meta 明示：新取得 Facebook 粉絲專頁完整控制權後，至少持有一週才可將粉絲專頁連結至 Instagram。使用者同日表示已完成重新加入與同意流程，因此只能在滿 `7 × 24` 小時後重試；日期上不早於 2026-09-06，為避免實際起算時間差，建議 2026-09-07 再測。

## 已確認的資產與權限層次

| 層次 | 資產 | 2026-08-30 結論 |
|---|---|---|
| Meta 商家資產管理組合 | 「珈語老師」；ID `889448907217740` | 可看見 `@hopelight.ig`，但商家組合層、人員層與單一資產層權限不能混為同一種「完整權限」。 |
| Instagram | `@hopelight.ig`；資產 ID `17841480182265940` | 已確認為 Instagram 專業帳號，Tiffany 的直接 IG 工作階段可正常開啟本人個人檔案與 Create 入口。 |
| Facebook 粉絲專頁 | 「希望之光-Hope light」；ID `113146178292118` | 使用者表示已重新指派／接受完整控制；Meta 仍套用至少一週的連結等待期。 |

今日的重要判斷是：Facebook 粉絲專頁完整控制、商家資產管理組合管理權限、Instagram 資產權限是三個不同層次。某一頁顯示「完整控制」不保證 Business Suite 的「內容」工具已立即可用。

## 今日操作與安全停點

- Darren 的 Meta Business Suite 工作階段先前仍無法開啟 `@hopelight.ig` 的內容／收件匣介面；因此沒有把「資產可見」誤記為「內容可管理」。
- Tiffany 的直接 Instagram 工作階段可到達 `@hopelight.ig` 本人個人檔案，也曾開啟 Create／選檔流程。
- 瀏覽器 UI 自動化速度慢且脆弱，使用者要求停止；協作者沒有按下最終 Share。
- 使用者之後自行發布 inbox 短片。來源檔已保存於 [`../content/reels/hopelight-ig-reel-2026-08-30-001`](../content/reels/hopelight-ig-reel-2026-08-30-001)，狀態是 `published-manually / user-confirmed`；本次未獨立核對 Caption、permalink 或確切時間。
- 今日沒有讀取或保存私訊內容，也沒有把 Cookie、驗證碼或 Token 寫入 repository。

## 下次應改走的發布方案

不再把「操控既有 Chrome 視窗」當作日常發布方案。Meta 沒有第一方專用發布 CLI，但有正式 Instagram Content Publishing API；建議建立內部 CLI 或 MCP 工具包裝官方 API。

對 `@hopelight.ig` 應優先採用 **Instagram API with Instagram Login**：

- 不要求先連結 Facebook Page，因此不受上述一週等待期阻擋。
- 最小權限只取 `instagram_business_basic` 與 `instagram_business_content_publish`。
- App 由 Darren／mamasan 管理；Tiffany 保留 Instagram 所有權，並只需在首次 OAuth 授權時登入、按 Allow。
- 自有／已管理且加入 App Dashboard 的帳號先用 Standard Access 測試；服務其他未擁有或未管理的客戶帳號時才評估 Advanced Access 與 App Review。
- App Secret 與 Token 只存後端 secret store，不進 Git、前端、文件、終端輸出或聊天；長效 Token 必須在到期前安全刷新。
- 素材由短效 signed HTTPS URL 提供給 Meta；完成後刪除暫存。發布工具預設停在預檢，只有明確 `--publish` 才送出。

官方入口：

- [Meta App Dashboard](https://developers.facebook.com/apps/)
- [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/)
- [Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/)
- [Content Publishing](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/)

## 下次重入順序

1. 先讀本文件與 [`../website-admin/README.md`](../website-admin/README.md)，不要重新探索今天已確認的權限層次。
2. 若要完成 Page ↔ Instagram 連結，等滿七天後用具粉絲專頁完整控制的工作階段重試，並在成功後驗證 Business Suite 能選到正確的 Page 與 `@hopelight.ig`。
3. 若目標是快速發布，優先建立 Meta Business App，選 `API setup with Instagram login`，只要求上述兩項最小權限。
4. 由 Tiffany 對 `@hopelight.ig` 完成一次 tester／OAuth Allow；不要索取或保存她的 Instagram 密碼。
5. 先做唯讀 `/me` 帳號核對，再做 prepare-only 的單支 Reel 測試；使用者確認目標帳號、Caption 與發布設定後才執行 publish。
6. 成功後記錄 media ID、公開 permalink、實際 Caption、發布時間與來源檔；失敗則保留安全錯誤類型，不記 Token 或回應中的敏感資料。

## 尚未完成

- Facebook Page ↔ `@hopelight.ig` 尚未連結。
- Darren 的 Business Suite 內容讀取／發布能力尚未在新權限生效後驗證。
- Meta App 尚未建立，Tiffany 尚未對 App 完成 OAuth 授權。
- 內部 Instagram API 發布工具、短效素材 hosting、Token refresh 與發布收據尚未實作。
