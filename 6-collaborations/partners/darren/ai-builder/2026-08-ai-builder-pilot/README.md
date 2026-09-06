# AI Builder n=1 前導｜mamasan 的第一次可重入協作

Status: proposed; commit-first, no required learning form
Proposed: 2026-08-20  
Canonical program: [Three Realms Academy / AI Builder](https://github.com/darrenfiy/Three-Realms-Academy/tree/main/PROGRAMS/ai-builder)

## 為什麼先從 mamasan 開始

mamasan 已經不是「還沒有 repo 的初學者」。她擁有 `mamasan-lab`，repo 也已長出 Co Me Time、內容企劃與 Tiffany／Hope Light 合作區。

因此這次前導不再重演「建立一個 repo」，而是驗證更重要的能力：

> 她能不能把一件真實工作帶進來，讓 AI 提案、由自己裁決，最後在不靠 Darren 代做的情況下留下下一手。

這也是 Darren 的第一個教學驗證。作品可以證明他會做；只有學員的獨立重入，才能開始證明他會教。

## 開始前的口頭對齊

這次前導不設報名表、學習單或必填回填。開始前只需口頭對齊：

- mamasan 願意把這次協作視為 AI Builder n=1 前導。
- 這是教學實驗，不是 Darren 接管 `mamasan-lab`。
- 她選擇一個可以進 Git 的真實作品種子。
- 客戶秘密、帳密、健康與財務資料不進 Git。
- 若要對外使用姓名、畫面、引言或成果，另取得明確同意；沒有同意就只保留 repo 內的事實證據。

## 建議作品種子

優先從已存在的真實工作選一件，不另造作業：

1. `6-collaborations/teachers/tiffany-hope-light/` 的下一個有界交付；或
2. `3-cometime/` 中一份 mamasan 真正想重新整理的服務內容。

作品必須能在一次 90–180 分鐘的協作中走完一個小循環，不追求做完整品牌、完整網站或整套課程。

## 課堂循環

1. **選種子**：mamasan 說明今天要讓什麼長一格，以及什麼不做。
2. **留下基線**：先看目前檔案與 Git 狀態，不急著叫 AI 重寫。
3. **請 AI 提三條路**：至少一條能反對原本假設，不只給同一答案的三種語氣。
4. **由 mamasan 裁決**：至少明說一項拒絕、一項改寫、一項接受；全部拒絕也可以。
5. **實作最小變更**：AI 可協助修改，但 mamasan 必須看 diff，知道改了哪裡。
6. **本人放行**：由 mamasan 決定 commit 訊息並用自己的身份簽名。
7. **說出下一格**：離場前留一件她之後能自己完成的小事。
8. **D+7 重入**：不靠 Darren 代做，自己回來留下第二次選擇，或有理由地封存／改寫第一手。

## Darren 可以做與不能做

Darren 可以：

- 示範如何把模糊想法縮成一個有界任務。
- 教 mamasan 看 Git 狀態、diff、commit 與回到上一版的概念。
- 協助設計 prompt、拆解 AI 回答與檢查前後一致性。
- 在她卡住時提出候選路徑與安全護欄。

Darren 不做：

- 為了讓課堂看起來成功而替她完成全部修改。
- 把自己的語氣、架構或品牌判斷當成 mamasan 的唯一答案。
- 在她尚未理解差異時代替她 commit。
- 課後自動成為她 repo 的長期維護者。

## 證據直接留在 Git

不要求 mamasan 另外證明自己學了什麼，也不要求 Darren 代她整理心得。實際做出的工作直接成為證據：

| Git 中可見的事實 | 能支持的判斷 |
|---|---|
| commit 作者、時間與訊息 | 誰在什麼時候放行哪一手 |
| diff | 作品實際增加、刪除或改寫了什麼 |
| 後續 commit | mamasan 是否自行重入並繼續發展 |
| revert、封存或改寫 | 她是否能修正先前決定，而不是盲從 AI |

當天若留下由 mamasan 本人放行、訊息清楚且內容有界的真實 commit，就有第一次協作證據。若之後再由她自行留下第二筆有意義的 commit、revert 或封存決定，才多了一層「能獨立重入」的教學證據。

口頭復盤、心得或推薦語都可以有，但完全自願，不是完成條件，也不取代 Git 事實。

## 什麼才可以成為 Darren 的教學實績

不是「我幫她做了一個 repo」，而是經 mamasan 同意後，可以誠實地說：

> 第一位前導學員帶著自己的真實合作案進來；她在課堂中看過 AI 提案與 diff，親自拒絕、改寫並放行一筆 commit，七天後又在沒有我代做的情況下回來走出下一手。

如果 D+7 沒有發生，仍然留下復盤，但不宣稱教學方法已被驗證。

## 對外敘事邊界

commit 可以證明作品與協作發生過，但不自動授權公開 mamasan 的姓名、私人對話或客戶內容。Darren 要把這段經驗用於招生、簡報或廣告時，仍須另外取得 mamasan 對具體素材的同意。
