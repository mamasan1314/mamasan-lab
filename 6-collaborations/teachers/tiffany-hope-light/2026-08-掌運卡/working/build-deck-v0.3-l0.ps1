param(
    [string]$ProjectDir = (Split-Path -Parent $PSScriptRoot),
    [switch]$ExportPreviews
)

$ErrorActionPreference = 'Stop'

$sourcePath = Join-Path $ProjectDir 'working\extracted\9月份改掌運卡.json'
$outputDir = Join-Path $ProjectDir 'outputs'
$previewDir = Join-Path $ProjectDir 'working\previews-v0.3-l0'
$outputPath = Join-Path $outputDir '掌運卡_L0校整候選_v0.3_20260826.pptx'
$scriptPath = Join-Path $outputDir '掌運卡_L0校整候選_v0.3_逐頁來源稿.md'
$validationPath = Join-Path $ProjectDir 'working\v0.3-L0-驗證報告.md'

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
if ($ExportPreviews) { New-Item -ItemType Directory -Path $previewDir -Force | Out-Null }

function Convert-HexColor {
    param([Parameter(Mandatory = $true)][string]$Hex)

    $value = $Hex.TrimStart('#')
    $red = [Convert]::ToInt32($value.Substring(0, 2), 16)
    $green = [Convert]::ToInt32($value.Substring(2, 2), 16)
    $blue = [Convert]::ToInt32($value.Substring(4, 2), 16)
    return $red + (256 * $green) + (65536 * $blue)
}

$colors = @{
    background = Convert-HexColor '#F7F2EA'
    paper = Convert-HexColor '#FFFDFC'
    ink = Convert-HexColor '#263047'
    muted = Convert-HexColor '#70756F'
    gold = Convert-HexColor '#B98B43'
    rose = Convert-HexColor '#C87876'
    sage = Convert-HexColor '#799181'
    paleGold = Convert-HexColor '#EEDFC5'
    paleRose = Convert-HexColor '#F1DAD6'
    paleSage = Convert-HexColor '#DCE7DF'
    warning = Convert-HexColor '#9B5E42'
    warningFill = Convert-HexColor '#F4E1D5'
    white = Convert-HexColor '#FFFFFF'
}

$fontName = 'Microsoft JhengHei UI'
$sourceSlides = @(Get-Content -Raw -Encoding UTF8 -LiteralPath $sourcePath | ConvertFrom-Json)

if ($sourceSlides.Count -ne 55) {
    throw ('Expected 55 source slides, found {0}.' -f $sourceSlides.Count)
}

$displayTitles = @{
    1 = '掌運卡｜映照課程'
    2 = '紙牌文化的發展'
    3 = '何謂掌運卡'
    4 = '六字真言淺談'
    5 = '掌運卡的核心概念'
    6 = '52 張牌的象徵與使用'
    7 = '問牌需知'
    8 = '問牌的方法'
    9 = '1～6 張牌卡意義'
    10 = '十三個數字與四種花色'
    11 = '黑桃 Spade'
    12 = '紅心 Heart'
    13 = '紅磚 Diamond'
    14 = '黑梅 Clud'
    15 = 'A 到 K｜探索自我之路'
    16 = 'A 到 K｜探索自省之路'
    17 = 'A｜全心全意'
    18 = '2｜鬼惑'
    19 = '雙 2｜雙鬼合'
    20 = '3｜自覺'
    21 = '雙 3／雙 J'
    22 = '4｜風之塵'
    23 = '雙 4｜雙風疊'
    24 = '5｜磐石'
    25 = '6｜難解之結'
    26 = '雙 6｜大吉大利／無解死結'
    27 = '7｜美麗的彩虹'
    28 = '雙 7｜身體問題'
    29 = '8｜滿月'
    30 = '9｜利斧'
    31 = '10｜財富之神'
    32 = 'J｜精銳戰士'
    33 = 'Q｜皇后'
    34 = 'K｜國王'
    35 = '案例學習時間'
    36 = '特殊牌組合說明'
    37 = '特殊牌組合總表'
    38 = '雙 2｜雙鬼合'
    39 = '雙 3／雙 J｜來源原文'
    40 = '雙 4｜雙風疊'
    41 = '4＋6／6＋4'
    42 = '雙牌｜喜憂參半'
    43 = '雙 6｜大吉大利／無解死結'
    44 = '雙 7｜身體問題'
    45 = '9J／J9／9Q／Q9'
    46 = 'JQ／QJ／JK／KJ'
    47 = 'QK／KQ'
    48 = '雙 10／J／Q／K｜合作'
    49 = '時間計算規則'
    50 = '團體討論時間'
    51 = '問卡規則'
    52 = '掌運卡備註（一）'
    53 = '掌運卡備註（二）'
    54 = '學習跨越轉化｜來源原文待確認'
    55 = '案例學習紀錄 Q&A'
}

$teacherOverrides = @{
    1 = @{
        text = @'
掌運卡｜映照課程
牌不是替你決定答案，而是映照當下的狀態，讓你看見選擇。
人人可用
自由提問
內在連結
自由探索內在
感知能量狀態
'@
        source = 'Tiffany 2026-08-26 回饋＋九月版 S01'
        reason = '封面依 Tiffany 最新回饋補入課程定位；原封面關鍵詞保留。'
    }
    2 = @{
        text = @'
中國唐代已有「葉子戲」的記載，也有人認為它與早期紙牌文化有關。
之後，不同地區陸續發展出各自的紙牌形式。
中東有馬穆魯克紙牌，歐洲則逐漸形成花色與宮廷牌，最後演變成今天我們熟悉的撲克牌。
'@
        source = 'Tiffany 2026-08-26 回饋'
        reason = '以老師最新校正文案完整取代確定式的單一路線敘述。'
    }
    6 = @{
        text = @'
撲克牌很有趣，52 張牌常被賦予一年的象徵。
紅色可象徵白天，黑色可象徵夜晚。
掌運卡實際使用 52 張牌，不使用 Joker。
'@
        source = 'Tiffany 2026-08-26 回饋'
        reason = '區分文化象徵與實際用牌規則；移除 91×4 與 Joker 曆法算式。'
    }
}

$reviewFlags = @{
    9 = '來源差異｜三張牌位置有兩套說法'
    10 = '文字待確認｜Clud／Cloud／Clubs 拼法未裁定'
    14 = '文字待確認｜Clud／Cloud／Clubs 拼法未裁定'
    20 = '高風險原文｜涉及性傾向與隱私推論'
    27 = '高風險原文｜涉及身體狀況推論'
    28 = '高風險原文｜涉及健康與生死措辭'
    30 = '高風險原文｜涉及抽血與健康處置'
    31 = '高風險原文｜涉及健康推論'
    32 = '高風險原文｜涉及抽血、血光與健康處置'
    33 = '高風險原文｜涉及健康推論'
    34 = '高風險原文｜涉及健康推論'
    37 = '高風險原文｜涉及健康與第三人感情推論'
    39 = '高風險原文｜涉及性傾向與隱私推論'
    41 = '高風險原文｜涉及健康與感情宣判'
    42 = '高風險原文｜涉及健康與第三人感情推論'
    44 = '高風險原文｜涉及健康與生死措辭'
    51 = '來源差異｜不確定牌與補牌規則待裁定'
    52 = '高風險原文｜涉及健康、因果與第三人問題'
    53 = '來源差異｜補牌規則有兩套說法'
    54 = '來源差異｜花色名稱與規則和前文不一致'
}

function Get-SectionName {
    param([int]$SourceNumber)

    if ($SourceNumber -le 6) { return '進入掌運卡' }
    if ($SourceNumber -le 10) { return '提問與讀牌基礎' }
    if ($SourceNumber -le 14) { return '四種花色' }
    if ($SourceNumber -le 34) { return 'A～K 完整牌義' }
    if ($SourceNumber -le 48) { return '特殊牌組合' }
    return '操作規則與練習'
}

function Normalize-CompareText {
    param([AllowEmptyString()][string]$Text)

    if ($null -eq $Text) { return '' }
    return [regex]::Replace($Text, '\s+', '')
}

function Get-CleanSourceText {
    param([Parameter(Mandatory = $true)][object]$SourceSlide)

    $sourceNumber = [int]$SourceSlide.slide_number
    if ($teacherOverrides.ContainsKey($sourceNumber)) {
        return $teacherOverrides[$sourceNumber].text.Trim()
    }

    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($line in ($SourceSlide.body_text -split "`r?`n")) {
        $lines.Add($line.Trim())
    }

    while ($lines.Count -gt 0 -and [string]::IsNullOrWhiteSpace($lines[0])) {
        $lines.RemoveAt(0)
    }

    $titleLines = @($SourceSlide.title -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $titleMatches = $titleLines.Count -gt 0 -and $lines.Count -ge $titleLines.Count
    if ($titleMatches) {
        for ($i = 0; $i -lt $titleLines.Count; $i++) {
            if ($lines[$i] -ne $titleLines[$i]) {
                $titleMatches = $false
                break
            }
        }
    }
    if ($titleMatches) {
        for ($i = 0; $i -lt $titleLines.Count; $i++) {
            $lines.RemoveAt(0)
        }
    }

    $pageMarker = ([int]$SourceSlide.slide_number - 1).ToString()
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
        if ($lines[$i] -eq $pageMarker) {
            $lines.RemoveAt($i)
        }
    }

    while ($lines.Count -gt 0 -and [string]::IsNullOrWhiteSpace($lines[$lines.Count - 1])) {
        $lines.RemoveAt($lines.Count - 1)
    }

    $text = ($lines -join "`n").Trim()
    if ($sourceNumber -eq 3) {
        $text = $text -replace '器、勢、志', '器、識、志'
    }
    return $text
}

function Split-L0Text {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [int]$MaxCharacters = 280,
        [int]$MaxLines = 11
    )

    $chunks = New-Object System.Collections.Generic.List[string]
    $current = New-Object System.Collections.Generic.List[string]
    $currentCharacters = 0

    foreach ($line in ($Text -split "`r?`n")) {
        $candidateCharacters = $currentCharacters + $line.Length
        $wouldOverflow = $current.Count -gt 0 -and (($candidateCharacters -gt $MaxCharacters) -or ($current.Count -ge $MaxLines))
        if ($wouldOverflow) {
            $chunks.Add(($current -join "`n").Trim())
            $current.Clear()
            $currentCharacters = 0
        }
        $current.Add($line)
        $currentCharacters += $line.Length
    }

    if ($current.Count -gt 0) {
        $chunks.Add(($current -join "`n").Trim())
    }

    return @($chunks)
}

$records = New-Object System.Collections.Generic.List[object]
$canonicalBySource = @{}

foreach ($sourceSlide in $sourceSlides) {
    $sourceNumber = [int]$sourceSlide.slide_number
    $canonical = Get-CleanSourceText -SourceSlide $sourceSlide
    $canonicalBySource[$sourceNumber] = $canonical
    if ($sourceNumber -eq 1) {
        [string[]]$chunks = @($canonical)
    }
    else {
        [string[]]$chunks = @(Split-L0Text -Text $canonical)
    }

    for ($partIndex = 0; $partIndex -lt $chunks.Count; $partIndex++) {
        $sourceLabel = if ($teacherOverrides.ContainsKey($sourceNumber)) {
            $teacherOverrides[$sourceNumber].source
        }
        else {
            ('九月版 S{0:D2}' -f $sourceNumber)
        }

        $records.Add([pscustomobject]@{
            physical = $records.Count + 1
            sourceNumber = $sourceNumber
            part = $partIndex + 1
            partCount = $chunks.Count
            title = $displayTitles[$sourceNumber]
            body = $chunks[$partIndex]
            source = $sourceLabel
            section = Get-SectionName -SourceNumber $sourceNumber
            flag = if ($reviewFlags.ContainsKey($sourceNumber)) { $reviewFlags[$sourceNumber] } else { '' }
            reason = if ($teacherOverrides.ContainsKey($sourceNumber)) { $teacherOverrides[$sourceNumber].reason } else { '九月版來源原文；只做分頁、標題、標點空白與版面校整。' }
            sourceNotes = if ($partIndex -eq 0) { ([string]$sourceSlide.speaker_notes).Trim() } else { '' }
            layout = if ($sourceNumber -eq 1) { 'cover' } elseif ($sourceNumber -in @(35, 36, 50)) { 'statement' } else { 'content' }
        })
    }
}

foreach ($sourceNumber in 1..55) {
    $rebuilt = (@($records | Where-Object { $_.sourceNumber -eq $sourceNumber } | Sort-Object part | ForEach-Object { $_.body }) -join "`n")
    $expected = [string]$canonicalBySource[$sourceNumber]
    $rebuiltNormalized = Normalize-CompareText -Text $rebuilt
    $expectedNormalized = Normalize-CompareText -Text $expected
    if ($rebuiltNormalized -ne $expectedNormalized) {
        throw ('Prepared-text coverage mismatch at source slide {0}.' -f $sourceNumber)
    }
}

function Add-TextBox {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text,
        [double]$Left,
        [double]$Top,
        [double]$Width,
        [double]$Height,
        [double]$FontSize = 24,
        [int]$Color = $colors.ink,
        [bool]$Bold = $false,
        [int]$Alignment = 1,
        [int]$VerticalAnchor = 1,
        [string]$Name = ''
    )

    $shape = $Slide.Shapes.AddTextbox(1, $Left, $Top, $Width, $Height)
    if ($Name) { $shape.Name = $Name }
    $shape.TextFrame.MarginLeft = 5
    $shape.TextFrame.MarginRight = 5
    $shape.TextFrame.MarginTop = 4
    $shape.TextFrame.MarginBottom = 4
    $shape.TextFrame.WordWrap = -1
    $range = $shape.TextFrame.TextRange
    $range.Text = $Text
    $range.Font.Name = $fontName
    try { $range.Font.NameFarEast = $fontName } catch {}
    $range.Font.Size = $FontSize
    $range.Font.Bold = if ($Bold) { -1 } else { 0 }
    $range.Font.Color.RGB = $Color
    $range.ParagraphFormat.Alignment = $Alignment
    $range.ParagraphFormat.SpaceAfter = 4
    $shape.TextFrame.AutoSize = 0
    $shape.Width = $Width
    $shape.Height = $Height
    $shape.Top = $Top
    $shape.Left = $Left
    $shape.TextFrame.VerticalAnchor = $VerticalAnchor
    return $shape
}

function Add-RoundedBox {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [double]$Left,
        [double]$Top,
        [double]$Width,
        [double]$Height,
        [int]$FillColor,
        [int]$LineColor = $colors.gold,
        [double]$LineWeight = 1.2
    )

    $shape = $Slide.Shapes.AddShape(5, $Left, $Top, $Width, $Height)
    $lastError = $null
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            $shape.Fill.Solid()
            $shape.Fill.ForeColor.RGB = $FillColor
            $shape.Line.ForeColor.RGB = $LineColor
            $shape.Line.Weight = $LineWeight
            $lastError = $null
            break
        }
        catch {
            $lastError = $_
            Start-Sleep -Milliseconds (150 * $attempt)
        }
    }
    if ($null -ne $lastError) { throw $lastError }
    return $shape
}

function Set-SlideBackground {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [int]$Color = $colors.background
    )

    $Slide.FollowMasterBackground = 0
    $Slide.Background.Fill.Solid()
    $Slide.Background.Fill.ForeColor.RGB = $Color
}

function Add-Notes {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [Parameter(Mandatory = $true)][string]$Notes
    )

    try {
        foreach ($shape in $Slide.NotesPage.Shapes) {
            $isBody = $false
            try {
                if ([int]$shape.Type -eq 14 -and [int]$shape.PlaceholderFormat.Type -eq 2) { $isBody = $true }
            } catch {}
            if ($isBody) {
                $shape.TextFrame.TextRange.Text = $Notes
                $shape.TextFrame.TextRange.Font.Name = $fontName
                try { $shape.TextFrame.TextRange.Font.NameFarEast = $fontName } catch {}
                return
            }
        }
    } catch {}
}

function Get-FittedFontSize {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [double]$MaxSize = 22,
        [double]$MinSize = 15
    )

    $length = (Normalize-CompareText $Text).Length
    $lineCount = @($Text -split "`r?`n").Count
    if ($length -le 120 -and $lineCount -le 7) { return $MaxSize }
    if ($length -le 190 -and $lineCount -le 9) { return 19 }
    if ($length -le 250 -and $lineCount -le 10) { return 17 }
    return $MinSize
}

function Add-DeckChrome {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [Parameter(Mandatory = $true)][object]$Record
    )

    [void](Add-TextBox -Slide $Slide -Text ('HOPE LIGHT｜{0}' -f $Record.section) -Left 56 -Top 22 -Width 470 -Height 22 -FontSize 10 -Color $colors.muted -Bold $true)
    [void](Add-TextBox -Slide $Slide -Text $Record.source -Left 610 -Top 22 -Width 292 -Height 22 -FontSize 9 -Color $colors.muted -Alignment 3)
    $line = $Slide.Shapes.AddShape(1, 56, 49, 846, 2)
    $line.Fill.Solid()
    $line.Fill.ForeColor.RGB = $colors.paleGold
    $line.Line.Visible = 0
    [void](Add-TextBox -Slide $Slide -Text ('{0:D2}  ·  v0.3｜L0 校整候選｜待確認' -f $Record.physical) -Left 650 -Top 506 -Width 252 -Height 18 -FontSize 8.5 -Color $colors.muted -Alignment 3)
}

function Add-CoverSlide {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [Parameter(Mandatory = $true)][object]$Record
    )

    Set-SlideBackground -Slide $Slide -Color $colors.ink
    $orb1 = $Slide.Shapes.AddShape(9, 660, -75, 355, 355)
    $orb1.Fill.Solid(); $orb1.Fill.ForeColor.RGB = $colors.gold; $orb1.Fill.Transparency = 0.18; $orb1.Line.Visible = 0
    $orb2 = $Slide.Shapes.AddShape(9, 760, 275, 230, 230)
    $orb2.Fill.Solid(); $orb2.Fill.ForeColor.RGB = $colors.rose; $orb2.Fill.Transparency = 0.25; $orb2.Line.Visible = 0
    [void](Add-TextBox -Slide $Slide -Text 'HOPE LIGHT' -Left 70 -Top 46 -Width 290 -Height 28 -FontSize 13 -Color $colors.paleGold -Bold $true)
    [void](Add-TextBox -Slide $Slide -Text '掌運卡' -Left 70 -Top 108 -Width 550 -Height 90 -FontSize 50 -Color $colors.white -Bold $true)
    [void](Add-TextBox -Slide $Slide -Text '映照課程' -Left 72 -Top 196 -Width 400 -Height 48 -FontSize 27 -Color $colors.paleGold -Bold $true)
    [void](Add-TextBox -Slide $Slide -Text "牌不是替你決定答案，`n而是映照當下的狀態，讓你看見選擇。" -Left 72 -Top 272 -Width 580 -Height 86 -FontSize 22 -Color $colors.white -Bold $true -Name 'L0_BODY')
    [void](Add-TextBox -Slide $Slide -Text "人人可用　自由提問　內在連結`n自由探索內在　感知能量狀態" -Left 72 -Top 380 -Width 580 -Height 62 -FontSize 15 -Color $colors.paleRose)
    [void](Add-TextBox -Slide $Slide -Text '♠   ♥   ♦   ♣' -Left 70 -Top 454 -Width 330 -Height 36 -FontSize 23 -Color $colors.paleGold)
    [void](Add-TextBox -Slide $Slide -Text 'v0.3｜L0 校整候選｜待 mamasan／Tiffany 確認' -Left 555 -Top 496 -Width 350 -Height 18 -FontSize 8.5 -Color $colors.paleGold -Alignment 3)
}

function Add-StatementSlide {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [Parameter(Mandatory = $true)][object]$Record
    )

    Set-SlideBackground -Slide $Slide
    Add-DeckChrome -Slide $Slide -Record $Record
    [void](Add-TextBox -Slide $Slide -Text $Record.title -Left 70 -Top 94 -Width 820 -Height 62 -FontSize 29 -Color $colors.gold -Bold $true -Alignment 2)
    [void](Add-RoundedBox -Slide $Slide -Left 120 -Top 184 -Width 720 -Height 230 -FillColor $colors.paper -LineColor $colors.paleGold -LineWeight 1.5)
    $fontSize = Get-FittedFontSize -Text $Record.body -MaxSize 25 -MinSize 17
    [void](Add-TextBox -Slide $Slide -Text $Record.body -Left 155 -Top 211 -Width 650 -Height 175 -FontSize $fontSize -Color $colors.ink -Bold $true -Alignment 2 -VerticalAnchor 3 -Name 'L0_BODY')
}

function Add-ContentSlide {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [Parameter(Mandatory = $true)][object]$Record
    )

    Set-SlideBackground -Slide $Slide
    Add-DeckChrome -Slide $Slide -Record $Record

    $title = $Record.title
    if ($Record.partCount -gt 1) {
        $title = '{0}（{1}/{2}）' -f $title, $Record.part, $Record.partCount
    }
    [void](Add-TextBox -Slide $Slide -Text $title -Left 62 -Top 72 -Width 836 -Height 55 -FontSize 28 -Color $colors.ink -Bold $true)
    $accent = $Slide.Shapes.AddShape(1, 62, 137, 84, 5)
    $accent.Fill.Solid(); $accent.Fill.ForeColor.RGB = $colors.gold; $accent.Line.Visible = 0

    if ($Record.flag) {
        [void](Add-RoundedBox -Slide $Slide -Left 520 -Top 123 -Width 378 -Height 30 -FillColor $colors.warningFill -LineColor $colors.warning -LineWeight 0.8)
        [void](Add-TextBox -Slide $Slide -Text $Record.flag -Left 534 -Top 129 -Width 350 -Height 18 -FontSize 9.2 -Color $colors.warning -Bold $true -Alignment 2)
    }

    [void](Add-RoundedBox -Slide $Slide -Left 62 -Top 164 -Width 836 -Height 322 -FillColor $colors.paper -LineColor $colors.paleGold -LineWeight 1.0)
    $fontSize = Get-FittedFontSize -Text $Record.body
    $bodyShape = Add-TextBox -Slide $Slide -Text $Record.body -Left 92 -Top 187 -Width 776 -Height 276 -FontSize $fontSize -Color $colors.ink -Name 'L0_BODY'
    try { $bodyShape.TextFrame2.AutoSize = 2 } catch {}
}

$markdown = New-Object System.Text.StringBuilder
[void]$markdown.AppendLine('# 掌運卡｜L0 校整候選 v0.3｜逐頁來源稿')
[void]$markdown.AppendLine()
[void]$markdown.AppendLine('Status: mamasan 內部 QC 候選；未經 Tiffany 核准，不是正式版。')
[void]$markdown.AppendLine()
[void]$markdown.AppendLine('原則：九月版為主本；Tiffany 2026-08-26 最新回饋覆蓋 S01／S02／S03 指定字與 S06；其餘只做分頁、標題與版面校整，不以摘要取代原文。')
[void]$markdown.AppendLine()

foreach ($record in $records) {
    $title = $record.title
    if ($record.partCount -gt 1) { $title = '{0}（{1}/{2}）' -f $title, $record.part, $record.partCount }
    [void]$markdown.AppendLine(('## P{0:D2}｜{1}' -f $record.physical, $title))
    [void]$markdown.AppendLine()
    [void]$markdown.AppendLine(('- 來源：{0}' -f $record.source))
    [void]$markdown.AppendLine(('- 處理：{0}' -f $record.reason))
    if ($record.flag) { [void]$markdown.AppendLine(('- 待確認：{0}' -f $record.flag)) }
    if ($record.sourceNotes) { [void]$markdown.AppendLine(('- 九月版原始講者備註：{0}' -f ($record.sourceNotes -replace "`r?`n", '／'))) }
    [void]$markdown.AppendLine()
    [void]$markdown.AppendLine('畫面：')
    [void]$markdown.AppendLine()
    foreach ($line in ($record.body -split "`r?`n")) {
        [void]$markdown.AppendLine(('> {0}' -f $line))
    }
    [void]$markdown.AppendLine()
    [void]$markdown.AppendLine('講者備註：本頁為 L0 校整候選；來源與風險標記如上，未經 Tiffany 核准。')
    [void]$markdown.AppendLine()
}

[System.IO.File]::WriteAllText($scriptPath, $markdown.ToString(), [System.Text.UTF8Encoding]::new($false))

$powerPoint = $null
$presentation = $null
$overflowItems = New-Object System.Collections.Generic.List[string]
$pptCoverageErrors = New-Object System.Collections.Generic.List[string]

try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $powerPoint.Visible = -1
    $presentation = $powerPoint.Presentations.Add()
    $presentation.PageSetup.SlideWidth = 960
    $presentation.PageSetup.SlideHeight = 540

    foreach ($record in $records) {
        $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
        $slide.Name = ('L0_P{0:D2}_S{1:D2}_{2:D2}' -f $record.physical, $record.sourceNumber, $record.part)

        switch ($record.layout) {
            'cover' { Add-CoverSlide -Slide $slide -Record $record }
            'statement' { Add-StatementSlide -Slide $slide -Record $record }
            default { Add-ContentSlide -Slide $slide -Record $record }
        }

        $notes = @(
            '狀態：v0.3 L0 校整候選；未經 Tiffany 核准。'
            ('來源：{0}' -f $record.source)
            ('處理：{0}' -f $record.reason)
        )
        if ($record.flag) { $notes += ('待確認：{0}' -f $record.flag) }
        if ($record.sourceNotes) { $notes += ("九月版原始講者備註：`n{0}" -f $record.sourceNotes) }
        Add-Notes -Slide $slide -Notes ($notes -join "`n")

        if ($record.layout -ne 'cover') {
            try {
                $bodyShape = $slide.Shapes.Item('L0_BODY')
                $actual = $bodyShape.TextFrame.TextRange.Text
                if ((Normalize-CompareText $actual) -ne (Normalize-CompareText $record.body)) {
                    $pptCoverageErrors.Add(('P{0:D2} / source S{1:D2}' -f $record.physical, $record.sourceNumber))
                }
                $boundHeight = [double]$bodyShape.TextFrame2.TextRange.BoundHeight
                $availableHeight = [double]$bodyShape.Height - 12
                if ($boundHeight -gt ($availableHeight + 2)) {
                    $overflowItems.Add(('P{0:D2} / source S{1:D2}: bound {2:N1} > available {3:N1}' -f $record.physical, $record.sourceNumber, $boundHeight, $availableHeight))
                }
            }
            catch {
                $pptCoverageErrors.Add(('P{0:D2} / source S{1:D2}: body shape unavailable' -f $record.physical, $record.sourceNumber))
            }
        }
    }

    if ($pptCoverageErrors.Count -gt 0) {
        throw ('PowerPoint body coverage failed: {0}' -f ($pptCoverageErrors -join '; '))
    }
    if ($overflowItems.Count -gt 0) {
        throw ('Text overflow detected: {0}' -f ($overflowItems -join '; '))
    }

    $presentation.SaveAs($outputPath, 24)

    if ($ExportPreviews) {
        foreach ($record in $records) {
            $previewPath = Join-Path $previewDir ('slide-{0:D2}-source-{1:D2}.png' -f $record.physical, $record.sourceNumber)
            $presentation.Slides.Item($record.physical).Export($previewPath, 'PNG', 1600, 900)
        }
    }
}
finally {
    if ($null -ne $presentation) {
        try { $presentation.Close() } catch {
            Start-Sleep -Milliseconds 750
            try { $presentation.Close() } catch {}
        }
        try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) } catch {}
    }
    if ($null -ne $powerPoint) {
        try { $powerPoint.Quit() } catch {
            Start-Sleep -Milliseconds 750
            try { $powerPoint.Quit() } catch {}
        }
        try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) } catch {}
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

$validation = New-Object System.Text.StringBuilder
[void]$validation.AppendLine('# 掌運卡 v0.3 L0｜自動驗證報告')
[void]$validation.AppendLine()
[void]$validation.AppendLine('- 狀態：自動檢查通過；仍待 mamasan 人工 QC 與 Tiffany 確認。')
[void]$validation.AppendLine(('- 主本來源頁：{0}' -f $sourceSlides.Count))
[void]$validation.AppendLine(('- 生成投影片：{0}' -f $records.Count))
[void]$validation.AppendLine('- 來源覆蓋：55／55；逐來源頁去除空白後全文一致。')
[void]$validation.AppendLine('- PPT 文字覆蓋：所有非封面投影片的 L0_BODY 與逐頁稿一致。')
[void]$validation.AppendLine('- 原始講者備註：九月版所有非空備註已保留在對應來源頁的第一個拆頁。')
[void]$validation.AppendLine('- 文字溢位：0。')
[void]$validation.AppendLine('- 最新回饋覆蓋：S01 封面、S02 歷史、S03「識」、S06 52 張／日夜／Joker。')
[void]$validation.AppendLine('- 高風險與來源衝突：保留原文並加上待確認標記；未替 Tiffany 裁定。')
[void]$validation.AppendLine()
[void]$validation.AppendLine('注意：本報告驗證的是字面覆蓋與版面溢位，不等於 Tiffany 已接受牌義、風險內容或教學順序。')
[System.IO.File]::WriteAllText($validationPath, $validation.ToString(), [System.Text.UTF8Encoding]::new($false))

Write-Output ('Built {0} slides: {1}' -f $records.Count, $outputPath)
Write-Output ('Source script: {0}' -f $scriptPath)
Write-Output ('Validation: {0}' -f $validationPath)
