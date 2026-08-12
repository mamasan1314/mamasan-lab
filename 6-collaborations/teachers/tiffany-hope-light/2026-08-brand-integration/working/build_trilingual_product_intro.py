from __future__ import annotations

import sys
from datetime import date
from pathlib import Path


HERE = Path(__file__).resolve().parent
VENDOR = HERE / "vendor"
if VENDOR.exists():
    sys.path.insert(0, str(VENDOR))

import xlsxwriter


PROJECT = HERE.parent
OUTPUTS = PROJECT / "outputs"
OUTPUTS.mkdir(parents=True, exist_ok=True)
OUTPUT = OUTPUTS / "希望之光_中英日產品介紹表_202608.xlsx"

NAVY = "17324D"
TEAL = "2F7D73"
SKY = "EAF2F8"
WHITE = "FFFFFF"
GRAY = "66717D"
PALE_GOLD = "F8EDD2"
PALE_RED = "F7DEDE"
RED = "B54B4B"


SHEETS = {
    "中文": {
        "title": "希望之光｜產品介紹表（中文）",
        "note": (
            "安全版草稿：使用生活陪伴、儀式與個人感受語言；不作治療、診斷、改運或保證效果。"
            "正式上架前，請由老師確認產品事實；健康相關內容須再核對合法標示與核准範圍。"
        ),
        "headers": ["產品名稱", "簡單介紹", "功能（生活情境）", "為什麼要使用", "使用後可能的好處", "注意事項／資料狀態"],
        "rows": [
            [
                "大貴人",
                "一款用於日常靜心與狀態整理的陪伴工具，適合放在固定空間中使用。",
                "在工作轉換、會談前或需要安靜思考時，建立一個停下來、選擇當下重點的提示。",
                "當思緒很多、行動節奏混亂，或想為一段重要時間做準備時使用。",
                "有助於建立固定的整理儀式，把注意力帶回當下，較容易說清楚下一步要做什麼。",
                "頻道內容、使用方式、規格與版本差異待老師核准；不宣稱改變腦波、血氧、運勢或治療效果。",
            ],
            [
                "小貴人",
                "較適合隨身或短時間使用的日常節奏提醒工具。",
                "在會議、專注、休息或外出前，提醒自己留幾分鐘觀察呼吸、情緒與當下需要。",
                "適合需要快速從忙亂切換到較有意識狀態的生活時刻。",
                "幫助形成簡單可重複的停頓習慣，整理注意力與行動順序。",
                "頻道內容、使用方式、規格與版本差異待老師核准；不宣稱改變腦波、血氧、運勢或治療效果。",
            ],
            [
                "頻率蠟燭",
                "十種生活情境的儀式蠟燭，讓點燭成為五分鐘整理空間、心情與意圖的開始。",
                "用光、香氣（成分待確認）與固定動作，建立工作前、關係整理、學習或睡前的轉換儀式。",
                "當需要從忙碌中停下來、為一件事設定意圖，或替一天做開始與收尾時使用。",
                "有助於建立規律、留下安靜時間，並把注意力放回可採取的下一步。",
                "不保證招財、桃花、學業或好眠等結果；成分、香味、燃燒時間與消防說明待確認。使用時遠離易燃物、兒童與寵物。",
            ],
            [
                "諧和共振機\n（來源名稱：諧和腦波訓練機）",
                "一款提供多種聲音頻道的日常陪伴設備，可依工作、休息、冥想或睡前情境選擇。",
                "透過聲音與節奏，為不同生活時段建立開始、暫停或收尾的提示。",
                "適合想在忙碌中安排短暫安靜時間，或建立工作與休息切換習慣的人。",
                "可幫助使用者更有意識地安排專注、休息與放鬆時間，形成個人化的聲音儀式。",
                "來源手冊列有15個頻道；來源用字為「諧和」，不是「協和」。正式名稱、型號、音量安全、適用／不適用對象與保固待確認；不作改善睡眠、情緒、神經或疾病等醫療宣稱。",
            ],
            [
                "血管清道夫\n（內部規劃名稱）",
                "希望之光內部規劃中的日常循環與血管保養產品，預計作為健康管理系列的延伸；實際產品類別、成分與形式仍待確認。",
                "品牌預計定位為支持日常循環、血管保養與代謝管理，並搭配飲食、飲水、活動與作息調整。實際功能仍須依產品資料與合法標示確認。",
                "提供給開始在意久坐、外食或作息不規律，並希望更主動管理日常循環與健康習慣的人。",
                "內部預計溝通的好處，是把循環與血管保養納入每天的健康管理，提醒使用者持續注意補水、飲食、活動量與定期健康檢查；產品本身可帶來的直接效果仍待驗證。",
                "限內部企劃使用，並非已確認功效。請補包裝正反面、成分／材質、劑型或設備形式、產品類別、製造商、使用方法、警語及核准／登錄資料，再確認可使用的功能文字。",
            ],
        ],
    },
    "English": {
        "title": "Hope Light | Product Introduction (English)",
        "note": (
            "Safe-copy draft: uses lifestyle, ritual, and subjective-experience language. It does not claim treatment, diagnosis, "
            "fortune-changing, or guaranteed outcomes. Verify product facts and permitted claims before publication."
        ),
        "headers": ["Product", "Simple introduction", "Function (daily context)", "Why use it", "Potential benefits", "Notes / data status"],
        "rows": [
            [
                "Da Gui Ren\n(Large Noble Companion)",
                "A companion tool for quiet daily reflection and organizing one's present state, designed for use in a consistent personal space.",
                "Creates a pause before work transitions, conversations, or focused thinking so the user can identify what matters now.",
                "Useful when thoughts feel crowded, routines feel scattered, or preparation is needed for an important moment.",
                "May help build a consistent reflection ritual, return attention to the present, and clarify the next practical step.",
                "Channel content, instructions, specifications, and version differences require approval. Do not claim changes to brainwaves, blood oxygen, fortune, or medical outcomes.",
            ],
            [
                "Xiao Gui Ren\n(Portable Noble Companion)",
                "A portable companion tool that offers a simple reminder to pause during a busy day.",
                "Prompts the user to spend a few minutes noticing breathing, emotions, and immediate needs before meetings, focused work, breaks, or travel.",
                "Suitable for moments when a quick transition from busyness to a more intentional state is needed.",
                "May support a simple, repeatable pause routine and make it easier to organize attention and action priorities.",
                "Channel content, instructions, specifications, and version differences require approval. Do not claim changes to brainwaves, blood oxygen, fortune, or medical outcomes.",
            ],
            [
                "Frequency Ritual Candles",
                "A ten-theme candle series that turns lighting a candle into the start of a five-minute ritual for organizing space, mood, and intention.",
                "Uses light, fragrance (ingredients to be confirmed), and a repeated action to create transition rituals before work, reflection, study, or bedtime.",
                "Use it when you want to pause, set an intention, or create a clear beginning or ending to the day.",
                "May help create a regular routine, protect a few quiet minutes, and bring attention back to the next actionable step.",
                "Do not guarantee wealth, romance, academic success, or better sleep. Ingredients, fragrance, burn time, and fire-safety details require confirmation. Keep away from flammable materials, children, and pets.",
            ],
            [
                "Harmony Resonance Sound Device\n(source name: Harmony Brainwave Training Device)",
                "A daily companion device with multiple sound channels for work, breaks, meditation, or winding down before bed.",
                "Uses sound and rhythm as cues to begin, pause, or close different parts of the day.",
                "Suitable for people who want to schedule brief quiet periods or build a clearer transition between work and rest.",
                "May help users plan focus, rest, and relaxation time more intentionally and develop a personal sound ritual.",
                "The source manual lists 15 channels. Confirm the official name, model, volume safety, suitable and unsuitable users, and warranty. Do not claim improvements to sleep, mood, the nervous system, or any medical condition.",
            ],
            [
                "Vascular Cleanser\n(internal planning name)",
                "An internally planned Hope Light concept for daily circulation and vascular wellness, intended as an extension of the health-management range. Its category, ingredients or materials, and format still require confirmation.",
                "Proposed brand positioning: support a daily routine focused on circulation, vascular wellness, and metabolic health alongside diet, hydration, movement, and rest. Any actual function must be verified against product data and permitted labeling.",
                "Intended for people becoming more aware of prolonged sitting, eating out, or irregular routines who want to manage daily circulation and health habits more actively.",
                "The proposed internal benefit direction is to make circulation and vascular care a visible part of daily health management, encouraging attention to hydration, diet, movement, and regular health checks. Direct product benefits remain unverified.",
                "Internal planning only; these are not confirmed efficacy claims. Obtain front and back packaging, ingredients or materials, dosage form or device format, category, manufacturer, directions, warnings, and approval or registration data before finalizing functional wording.",
            ],
        ],
    },
    "日本語": {
        "title": "Hope Light｜製品紹介表（日本語）",
        "note": (
            "安全性に配慮した草案です。日常のサポート、儀式、個人の感じ方を表す言葉を使用し、治療・診断・開運・効果保証はうたいません。"
            "公開前に製品情報と表示可能な範囲を確認してください。"
        ),
        "headers": ["製品名", "簡単な紹介", "機能（日常場面）", "なぜ使うのか", "使用後に期待できること", "注意事項／情報状況"],
        "rows": [
            [
                "大貴人\n（据え置き型コンパニオンツール）",
                "日常の静かな振り返りや状態整理のためのサポートツール。決まった場所での使用を想定しています。",
                "仕事の切り替え、対話の前、落ち着いて考えたい時に、いったん立ち止まり、今大切なことを選ぶきっかけをつくります。",
                "考えが多い時、行動のリズムが乱れている時、大切な時間の準備をしたい時に使用します。",
                "一定の振り返り習慣をつくり、意識を今に戻し、次の行動を整理しやすくするのに役立つ可能性があります。",
                "チャンネル内容、使用方法、仕様、バージョン差は先生の確認が必要です。脳波、血中酸素、運勢、治療効果の変化はうたいません。",
            ],
            [
                "小貴人\n（携帯型コンパニオンツール）",
                "持ち運びや短時間の使用に向いた、日常のリズムを見直すためのサポートツールです。",
                "会議、集中、休憩、外出の前に数分間立ち止まり、呼吸、感情、今の自分に必要なことへ意識を向けるきっかけをつくります。",
                "忙しさから、より意識的な状態へ短時間で切り替えたい場面に向いています。",
                "簡単で繰り返しやすい小休止の習慣をつくり、注意と行動の順番を整理するのに役立つ可能性があります。",
                "チャンネル内容、使用方法、仕様、バージョン差は先生の確認が必要です。脳波、血中酸素、運勢、治療効果の変化はうたいません。",
            ],
            [
                "周波数リチュアルキャンドル",
                "10種類の生活場面に合わせた儀式用キャンドル。火を灯す時間を、空間・気持ち・意図を整える5分間の始まりにします。",
                "光、香り（成分未確認）、決まった動作を使い、仕事前、人間関係の振り返り、学習、就寝前の切り替え習慣をつくります。",
                "忙しさからいったん離れたい時、意図を定めたい時、一日の始まりや終わりをはっきりさせたい時に使用します。",
                "生活のリズムをつくり、静かな時間を確保し、次にできる行動へ意識を戻すのに役立つ可能性があります。",
                "金運、恋愛、学業、快眠などの結果は保証しません。成分、香り、燃焼時間、防火上の説明は確認が必要です。可燃物、子ども、ペットから離して使用してください。",
            ],
            [
                "諧和共振サウンド機器\n（資料上の名称：諧和脳波トレーニング機）",
                "仕事、休憩、瞑想、就寝前などの場面に合わせて選べる、複数のサウンドチャンネルを備えた日常用サポート機器です。",
                "音とリズムを使い、一日の各場面に始まり、休止、終わりの合図をつくります。",
                "忙しい中に短い静かな時間を設けたい方や、仕事と休息の切り替え習慣をつくりたい方に向いています。",
                "集中、休息、リラックスの時間をより意識的に組み立て、自分なりの音の習慣をつくるのに役立つ可能性があります。",
                "資料の取扱説明書には15チャンネルが記載されています。正式名称、型番、音量の安全性、適する方・適さない方、保証を確認してください。睡眠、気分、神経、疾病の改善など医療効果はうたいません。",
            ],
            [
                "血管クリーナー\n（社内企画名）",
                "Hope Lightが社内で企画している、日常のめぐりと血管ケアを意識した製品コンセプトです。健康管理シリーズの展開を想定していますが、製品区分、成分・材質、形状は未確認です。",
                "ブランド上の想定ポジションは、食事、水分、活動、休息と組み合わせ、日常のめぐり、血管ケア、代謝管理を意識する習慣を支えることです。実際の機能は製品資料と表示可能な範囲に基づく確認が必要です。",
                "長時間座ること、外食、生活リズムの乱れが気になり、日々のめぐりや健康習慣をより主体的に管理したい方を想定しています。",
                "社内で想定する利点は、めぐりと血管ケアを毎日の健康管理に組み込み、水分、食事、活動量、定期的な健康診断への意識を高めることです。製品自体の直接的な効果は未検証です。",
                "社内企画用であり、確認済みの効能ではありません。包装の表裏、成分・材質、剤形または機器形態、製品区分、製造元、使用方法、注意表示、許認可・登録情報をそろえてから機能表現を確定してください。",
            ],
        ],
    },
}


def build_workbook() -> None:
    workbook = xlsxwriter.Workbook(OUTPUT)
    workbook.set_properties(
        {
            "title": "希望之光中英日產品介紹表",
            "subject": "一人工作室安全版產品文案",
            "author": "[Codex]",
            "company": "希望之光 Hope Light",
            "created": date(2026, 8, 9),
            "comments": "依使用者提供之產品文件整理；未驗證健康宣稱已排除或標示待補。",
        }
    )

    base = {"font_name": "Microsoft JhengHei", "font_size": 10, "valign": "vcenter"}
    title_fmt = workbook.add_format(
        {**base, "bold": True, "font_size": 18, "font_color": WHITE, "bg_color": NAVY, "align": "left"}
    )
    note_fmt = workbook.add_format(
        {**base, "font_color": GRAY, "bg_color": SKY, "text_wrap": True, "align": "left"}
    )
    header_fmt = workbook.add_format(
        {**base, "bold": True, "font_color": WHITE, "bg_color": TEAL, "border": 1, "align": "center", "text_wrap": True}
    )
    text_fmt = workbook.add_format({**base, "border": 1, "text_wrap": True, "align": "left"})
    product_fmt = workbook.add_format(
        {**base, "bold": True, "border": 1, "bg_color": PALE_GOLD, "text_wrap": True, "align": "center"}
    )
    warning_fmt = workbook.add_format({"bg_color": PALE_RED, "font_color": RED})

    for index, (sheet_name, content) in enumerate(SHEETS.items()):
        worksheet = workbook.add_worksheet(sheet_name)
        worksheet.hide_gridlines(2)
        worksheet.set_tab_color([TEAL, NAVY, "D8A84E"][index])
        worksheet.set_landscape()
        worksheet.fit_to_pages(1, 0)
        worksheet.set_paper(9)
        worksheet.set_margins(0.25, 0.25, 0.45, 0.45)
        worksheet.set_header(f'&L&"Microsoft JhengHei,Bold"{content["title"]}&RHope Light')
        worksheet.set_footer("&C&P / &N")

        headers = content["headers"]
        worksheet.merge_range(0, 0, 0, len(headers) - 1, content["title"], title_fmt)
        worksheet.merge_range(1, 0, 1, len(headers) - 1, content["note"], note_fmt)
        worksheet.set_row(0, 30)
        worksheet.set_row(1, 42)
        worksheet.set_row(3, 34)
        widths = [29, 46, 49, 43, 49, 61]
        for col, (header, width) in enumerate(zip(headers, widths)):
            worksheet.write(3, col, header, header_fmt)
            worksheet.set_column(col, col, width)

        for row_offset, row in enumerate(content["rows"]):
            sheet_row = 4 + row_offset
            for col, value in enumerate(row):
                worksheet.write(sheet_row, col, value, product_fmt if col == 0 else text_fmt)
            worksheet.set_row(sheet_row, 126 if row_offset == 4 else 108)

        last_row = 3 + len(content["rows"])
        worksheet.add_table(
            3,
            0,
            last_row,
            len(headers) - 1,
            {
                "name": f"ProductIntro{index + 1}",
                "style": "Table Style Medium 4",
                "columns": [{"header": header} for header in headers],
            },
        )
        worksheet.conditional_format(
            4,
            5,
            last_row,
            5,
            {"type": "text", "criteria": "containing", "value": "限內部企劃使用", "format": warning_fmt},
        )
        worksheet.conditional_format(
            4,
            5,
            last_row,
            5,
            {"type": "text", "criteria": "containing", "value": "Internal planning only", "format": warning_fmt},
        )
        worksheet.conditional_format(
            4,
            5,
            last_row,
            5,
            {"type": "text", "criteria": "containing", "value": "社内企画用", "format": warning_fmt},
        )
        worksheet.freeze_panes(4, 1)
        worksheet.repeat_rows(0, 3)
        worksheet.print_area(0, 0, last_row, len(headers) - 1)

    workbook.close()
    print(OUTPUT)


if __name__ == "__main__":
    build_workbook()
