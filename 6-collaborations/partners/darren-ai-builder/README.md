# Darren × mamasan｜AI Builder 協作

Status: relationship recorded; first teacher draft delivered 2026-08-26 but not accepted; workflow under revision
Started: 2026-08-20

## 這段關係是什麼

mamasan 是最早在 Darren 協助下建立自己 repo 的創作者。這次協作不是由 Darren 接手經營 `mamasan-lab`，而是把已經發生的經驗整理成一次可檢查的 AI Builder 前導實驗：

> mamasan 帶自己的真實作品進場；Darren 教她如何與 AI 一起建造；最後留下什麼，仍由 mamasan 決定與簽名。

兩人的共同創作源流早於本次課程，但私人生命與文學角色的對應，不因寫入本 repo 就自動成為公開敘事。若未來要把 mamasan 與《天地》中的角色原型連結，應另取得 mamasan 的明確同意。

## 角色

| 角色 | 承擔 |
|---|---|
| mamasan | repo owner、學習者、作品決定者；接受、改寫、拒絕 AI 提案並替 commit 簽名 |
| Darren | AI Builder 帶場者；示範工作方法、守住邊界、協助看 diff，不代替學員長期維護 repo |
| AI | 提出候選、整理脈絡、檢查一致性；不取得正典權、不替任何人承擔現實後果 |
| `mamasan-lab` | mamasan 的作品與可重入記憶場域；所有權不因教學或協作改變 |

## 先看

| 文件 | 用途 |
|---|---|
| [`profile.md`](./profile.md) | Darren 目前已被作品證明的能力、可承接範圍與缺口 |
| [`service-map.md`](./service-map.md) | Darren 對 A 的分包服務、價格假設與責任邊界 |
| [`subcontract-service-menu.md`](./subcontract-service-menu.md) | Darren 給 A 的分包價格參考；不是老師端報價單 |
| [`translation-qc-workflow.md`](./translation-qc-workflow.md) | Darren → mamasan → 老師的翻譯、QC／QA、驗收與報價流向 |
| [`2026-08-ai-builder-pilot`](./2026-08-ai-builder-pilot) | mamasan 作為第一位候選學員的 n=1 前導實驗 |
| [Clarity／清晰度](https://github.com/darrenfiy/Three-Realms-Academy/tree/main/PROGRAMS/clarity) | 從 mamasan／Tiffany 合作壓力長出的通用定位工具與對話 agent；正典在 Academy |

AI Builder 的課程正典仍在 Three Realms Academy：
[`PROGRAMS/ai-builder`](https://github.com/darrenfiy/Three-Realms-Academy/tree/main/PROGRAMS/ai-builder)。本資料夾只保存 mamasan 這一位真人的協作入口與證據，不複製整套課程。

## 清晰度專案的出生地

2026-08-20，mamasan 想替 Tiffany 找到一個能上台使用的「定位」，這個真實問題先長出
上台定位表，之後再長出匠人姊妹表與對話式 clarity agent 架構。通用方法現由
Three Realms Academy 的 `PROGRAMS/clarity/` 孵化；本 repo 保留出生地、合作關係與
當事人明確同意後的案件證據，不建立平行副本。

## 案件合作關係

AI Builder 的學習關係與商業案件分開處理。當 A 對接她身邊的老師時：

- A 是主責、提案者與唯一對接窗口；老師的需求、報價、確認與變更都先回到 A。
- Darren 若陪同會議，角色是陪同與技術可行性支援，不與 A 並列為接案主角。
- A 接案後若需要 Darren 製作，由 A 與 Darren 另談分包範圍、時程與費用。
- A 對老師報價前，應先把可能發包給 Darren 的製作預算納入，不先承諾功能再要求 Darren 吸收。
- A 可以在製作成本上加入自己的訪談、策略、溝通、專案管理與合理利潤，再形成給老師的整合報價。
- Darren 先把草稿、變更帳本與新增內容清單交給 A；A 完成 QC／QA 並願意承擔後，才由 A 對老師交付。
- Darren 的報價對象是 A，不是老師；老師端價格由 A 依整體服務另行提出。

2026-08-20 與 Tiffany 的會談沿用以上邊界：A 是主角與窗口，Darren 陪同；若案件成立，再由 A 決定是否向 Darren 發包。

## 第一個實際案例：教材／體系整理

2026-08-26，這條合作關係長出第一份實際製作：一套課程教材的體系整理。mamasan 將問題單與 PPT 草稿交給 Tiffany 後，Tiffany 明確表示不滿意，認為成果大量改動了她原本的文案。因此本案目前是**已製作、已交付、未被老師接受**，不是成功案例。

這次失敗暴露的不是「能不能做出簡報」，而是合作鏈少了一道必要角色：mamasan 必須在 Darren 與 Tiffany 之間擔任翻譯者與交付前 QC／QA。完整更正見 [`translation-qc-workflow.md`](./translation-qc-workflow.md)；案件回顧見 [`../../teachers/tiffany-hope-light/2026-08-掌運卡/working/2026-08-26-post-delivery-review.md`](../../teachers/tiffany-hope-light/2026-08-掌運卡/working/2026-08-26-post-delivery-review.md)。

更正後的三條原則：

- **先約定改寫層級。** 原文校整、結構整理與依義重建是三種不同工作，不能等做完才讓老師發現。
- **重大改寫可回查。** 每個新增規則、命名與教學設計都要附來源與理由，不能只交成品。
- **A 核准後才交老師。** A 必須理解 Darren 做了什麼、判斷是否仍是老師聽得進去的聲音，並完成 QC／QA。

現有價目改列為 **Darren 對 A 的分包參考價**；不是 Tiffany 的報價，也不能寫成已向 Tiffany 收費。首案是否採 NT$5,000 分包價、後續是否採 NT$12,000／NT$18,000，仍由 A 與 Darren 另行確認。

### 案例對外使用

依本文件〈邊界〉，**在取得老師明確同意前，不具名、不引用其材料、不將其稱為成功案例。** 目前連「客戶滿意成果」也尚未成立；對外只能將它作為內部流程學習，不應拿未被接受的交付替服務背書。

具名見證、案例使用與轉介都不是 Darren 分包價可向 Tiffany 直接交換的條件。若 A 未來要和老師商議，須在老師實際接受成果後另行徵詢，不預設同意。

## 邊界

- 本文件不是合作契約、分潤約定或課程報名。
- 在 mamasan 明確接受前，不把她公開稱為正式學員或成功案例。
- 案例對外使用前，另確認可公開的文字、畫面、姓名與引言。
- 客戶秘密、帳密、健康資料、財務資料與未獲同意的對話不進 Git。
