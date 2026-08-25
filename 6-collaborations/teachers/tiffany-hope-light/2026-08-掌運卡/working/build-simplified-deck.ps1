param(
    [string]$ProjectDir = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $ProjectDir 'working\slide-script-v0.1.md'
$outputDir = Join-Path $ProjectDir 'outputs'
$previewDir = Join-Path $ProjectDir 'working\previews-v0.1'
$outputPath = Join-Path $outputDir '掌運卡_簡潔教學版_講師草稿_v0.1_20260825.pptx'

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
New-Item -ItemType Directory -Path $previewDir -Force | Out-Null

function Convert-HexColor {
    param([Parameter(Mandatory = $true)][string]$Hex)

    $value = $Hex.TrimStart('#')
    $red = [Convert]::ToInt32($value.Substring(0, 2), 16)
    $green = [Convert]::ToInt32($value.Substring(2, 2), 16)
    $blue = [Convert]::ToInt32($value.Substring(4, 2), 16)
    return $red + (256 * $green) + (65536 * $blue)
}

$colors = @{
    background = Convert-HexColor '#F8F4EE'
    paper = Convert-HexColor '#FFFDFC'
    ink = Convert-HexColor '#273246'
    muted = Convert-HexColor '#6F746F'
    gold = Convert-HexColor '#C39852'
    rose = Convert-HexColor '#C97F7A'
    sage = Convert-HexColor '#849C8D'
    paleGold = Convert-HexColor '#EFE1C8'
    paleRose = Convert-HexColor '#F1D9D5'
    paleSage = Convert-HexColor '#DCE6DF'
    white = Convert-HexColor '#FFFFFF'
}

$fontName = 'Microsoft JhengHei UI'

function Add-TextBox {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [Parameter(Mandatory = $true)][string]$Text,
        [double]$Left,
        [double]$Top,
        [double]$Width,
        [double]$Height,
        [double]$FontSize = 24,
        [int]$Color = $colors.ink,
        [bool]$Bold = $false,
        [int]$Alignment = 1,
        [int]$VerticalAnchor = 1
    )

    $shape = $Slide.Shapes.AddTextbox(1, $Left, $Top, $Width, $Height)
    $shape.TextFrame.MarginLeft = 4
    $shape.TextFrame.MarginRight = 4
    $shape.TextFrame.MarginTop = 3
    $shape.TextFrame.MarginBottom = 3
    $shape.TextFrame.WordWrap = -1
    $shape.TextFrame.VerticalAnchor = $VerticalAnchor
    $range = $shape.TextFrame.TextRange
    $range.Text = $Text
    $range.Font.Name = $fontName
    try { $range.Font.NameFarEast = $fontName } catch {}
    $range.Font.Size = $FontSize
    $range.Font.Bold = if ($Bold) { -1 } else { 0 }
    $range.Font.Color.RGB = $Color
    $range.ParagraphFormat.Alignment = $Alignment
    $range.ParagraphFormat.SpaceAfter = 7
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
    $shape.Fill.Solid()
    $shape.Fill.ForeColor.RGB = $FillColor
    $shape.Line.ForeColor.RGB = $LineColor
    $shape.Line.Weight = $LineWeight
    return $shape
}

function Add-DeckChrome {
    param(
        [Parameter(Mandatory = $true)][object]$Slide,
        [int]$SlideNumber,
        [bool]$IsCover = $false
    )

    if (-not $IsCover) {
        [void](Add-TextBox -Slide $Slide -Text 'HOPE LIGHT｜掌運卡映照課程' -Left 54 -Top 22 -Width 420 -Height 24 -FontSize 10 -Color $colors.muted -Bold $true)
        $line = $Slide.Shapes.AddShape(1, 54, 50, 852, 2)
        $line.Fill.Solid()
        $line.Fill.ForeColor.RGB = $colors.paleGold
        $line.Line.Visible = 0
        [void](Add-TextBox -Slide $Slide -Text ('{0:D2}  ·  v0.1 講師草稿' -f $SlideNumber) -Left 720 -Top 505 -Width 186 -Height 20 -FontSize 9 -Color $colors.muted -Alignment 3)
    }
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

function Convert-ScreenText {
    param([Parameter(Mandatory = $true)][string]$Markdown)

    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($rawLine in ($Markdown -split "`r?`n")) {
        $line = $rawLine.Trim()
        if (-not $line) { continue }
        $line = $line -replace '^>\s*', ''
        if ($line -match '^-\s+') { $line = '• ' + ($line -replace '^-\s+', '') }
        $line = $line -replace '\*\*', ''
        $line = $line -replace '  $', ''
        $lines.Add($line)
    }
    return ($lines -join "`r")
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

function Add-CoverSlide {
    param([object]$Slide, [object]$Data)

    Set-SlideBackground -Slide $Slide -Color $colors.ink
    $orb1 = $Slide.Shapes.AddShape(9, 660, -80, 360, 360)
    $orb1.Fill.Solid(); $orb1.Fill.ForeColor.RGB = $colors.gold; $orb1.Fill.Transparency = 0.18; $orb1.Line.Visible = 0
    $orb2 = $Slide.Shapes.AddShape(9, 745, 255, 260, 260)
    $orb2.Fill.Solid(); $orb2.Fill.ForeColor.RGB = $colors.rose; $orb2.Fill.Transparency = 0.25; $orb2.Line.Visible = 0
    [void](Add-TextBox -Slide $Slide -Text 'HOPE LIGHT' -Left 70 -Top 60 -Width 300 -Height 30 -FontSize 14 -Color $colors.paleGold -Bold $true)
    [void](Add-TextBox -Slide $Slide -Text '掌運卡' -Left 70 -Top 145 -Width 560 -Height 100 -FontSize 54 -Color $colors.white -Bold $true)
    [void](Add-TextBox -Slide $Slide -Text '映照課程' -Left 72 -Top 238 -Width 400 -Height 55 -FontSize 28 -Color $colors.paleGold -Bold $true)
    [void](Add-TextBox -Slide $Slide -Text '從牌面，看見當下；從覺察，走向選擇' -Left 72 -Top 330 -Width 560 -Height 54 -FontSize 20 -Color $colors.white)
    [void](Add-TextBox -Slide $Slide -Text '♠   ♥   ♦   ♣' -Left 70 -Top 425 -Width 390 -Height 44 -FontSize 28 -Color $colors.paleRose)
    [void](Add-TextBox -Slide $Slide -Text 'v0.1｜講師草稿' -Left 72 -Top 487 -Width 220 -Height 20 -FontSize 10 -Color $colors.paleGold)
}

function Add-StatementSlide {
    param([object]$Slide, [object]$Data)

    Set-SlideBackground -Slide $Slide
    Add-DeckChrome -Slide $Slide -SlideNumber $Data.number
    [void](Add-TextBox -Slide $Slide -Text $Data.title -Left 68 -Top 82 -Width 824 -Height 54 -FontSize 22 -Color $colors.gold -Bold $true)
    $box = Add-RoundedBox -Slide $Slide -Left 84 -Top 158 -Width 792 -Height 250 -FillColor $colors.paper -LineColor $colors.paleGold -LineWeight 1.5
    $body = Convert-ScreenText $Data.screen
    [void](Add-TextBox -Slide $Slide -Text $body -Left 122 -Top 191 -Width 716 -Height 184 -FontSize 29 -Color $colors.ink -Bold $true -Alignment 2 -VerticalAnchor 3)
    $dot = $Slide.Shapes.AddShape(9, 436, 436, 88, 88)
    $dot.Fill.Solid(); $dot.Fill.ForeColor.RGB = $colors.paleRose; $dot.Fill.Transparency = 0.25; $dot.Line.Visible = 0
}

function Add-SuitOverviewSlide {
    param([object]$Slide, [object]$Data)

    Set-SlideBackground -Slide $Slide
    Add-DeckChrome -Slide $Slide -SlideNumber $Data.number
    [void](Add-TextBox -Slide $Slide -Text $Data.title -Left 62 -Top 78 -Width 820 -Height 55 -FontSize 30 -Color $colors.ink -Bold $true)
    $items = @(
        @{ symbol = '♠'; name = '黑桃'; meaning = '意志與界線'; color = $colors.ink; fill = $colors.paper },
        @{ symbol = '♥'; name = '紅心'; meaning = '情感與連結'; color = $colors.rose; fill = $colors.paleRose },
        @{ symbol = '♦'; name = '方塊'; meaning = '資源與現實'; color = $colors.gold; fill = $colors.paleGold },
        @{ symbol = '♣'; name = '梅花'; meaning = '干擾與消耗'; color = $colors.sage; fill = $colors.paleSage }
    )
    for ($i = 0; $i -lt $items.Count; $i++) {
        $x = 62 + ($i * 219)
        [void](Add-RoundedBox -Slide $Slide -Left $x -Top 160 -Width 192 -Height 260 -FillColor $items[$i].fill -LineColor $items[$i].color -LineWeight 1.4)
        [void](Add-TextBox -Slide $Slide -Text $items[$i].symbol -Left ($x + 24) -Top 182 -Width 144 -Height 80 -FontSize 46 -Color $items[$i].color -Bold $true -Alignment 2)
        [void](Add-TextBox -Slide $Slide -Text $items[$i].name -Left ($x + 20) -Top 280 -Width 152 -Height 42 -FontSize 24 -Color $colors.ink -Bold $true -Alignment 2)
        [void](Add-TextBox -Slide $Slide -Text $items[$i].meaning -Left ($x + 14) -Top 337 -Width 164 -Height 48 -FontSize 16 -Color $colors.muted -Alignment 2)
    }
}

function Add-NumberSlide {
    param([object]$Slide, [object]$Data)

    Set-SlideBackground -Slide $Slide
    Add-DeckChrome -Slide $Slide -SlideNumber $Data.number
    $parts = $Data.title -split '｜', 2
    $value = $parts[0].Trim()
    $name = if ($parts.Count -gt 1) { $parts[1].Trim() } else { '' }
    [void](Add-RoundedBox -Slide $Slide -Left 72 -Top 108 -Width 248 -Height 344 -FillColor $colors.paper -LineColor $colors.gold -LineWeight 2.2)
    [void](Add-TextBox -Slide $Slide -Text $value -Left 96 -Top 132 -Width 200 -Height 110 -FontSize 60 -Color $colors.ink -Bold $true -Alignment 2)
    [void](Add-TextBox -Slide $Slide -Text $name -Left 92 -Top 269 -Width 208 -Height 52 -FontSize 23 -Color $colors.gold -Bold $true -Alignment 2)
    [void](Add-TextBox -Slide $Slide -Text '♠  ♥  ♦  ♣' -Left 99 -Top 371 -Width 194 -Height 36 -FontSize 19 -Color $colors.rose -Alignment 2)
    $body = Convert-ScreenText $Data.screen
    [void](Add-TextBox -Slide $Slide -Text $body -Left 370 -Top 139 -Width 500 -Height 270 -FontSize 25 -Color $colors.ink -Bold $false -VerticalAnchor 3)
}

function Add-StandardSlide {
    param([object]$Slide, [object]$Data)

    Set-SlideBackground -Slide $Slide
    Add-DeckChrome -Slide $Slide -SlideNumber $Data.number
    [void](Add-TextBox -Slide $Slide -Text $Data.title -Left 62 -Top 76 -Width 820 -Height 58 -FontSize 30 -Color $colors.ink -Bold $true)
    $accent = $Slide.Shapes.AddShape(1, 62, 146, 88, 5)
    $accent.Fill.Solid(); $accent.Fill.ForeColor.RGB = $colors.gold; $accent.Line.Visible = 0
    $body = Convert-ScreenText $Data.screen
    $fontSize = 25
    if ($body.Length -gt 160) { $fontSize = 21 }
    elseif ($body.Length -gt 100) { $fontSize = 23 }
    $box = Add-RoundedBox -Slide $Slide -Left 62 -Top 177 -Width 836 -Height 278 -FillColor $colors.paper -LineColor $colors.paleGold -LineWeight 1.0
    [void](Add-TextBox -Slide $Slide -Text $body -Left 94 -Top 203 -Width 772 -Height 226 -FontSize $fontSize -Color $colors.ink -VerticalAnchor 3)
}

$markdown = Get-Content -Raw -Encoding UTF8 -LiteralPath $scriptPath
$pattern = '(?ms)^## S(?<number>\d{2})｜(?<title>[^\r\n]+)\r?\n(?<section>.*?)(?=^## S\d{2}｜|\z)'
$slideData = New-Object System.Collections.Generic.List[object]

foreach ($match in [regex]::Matches($markdown, $pattern)) {
    $section = $match.Groups['section'].Value
    $screenMatch = [regex]::Match($section, '(?ms)^畫面：\s*(?<value>.*?)(?=^講者備註：)')
    $notesMatch = [regex]::Match($section, '(?ms)^講者備註：\s*(?<value>.*)$')
    $slideData.Add([pscustomobject]@{
        number = [int]$match.Groups['number'].Value
        title = $match.Groups['title'].Value.Trim()
        screen = $screenMatch.Groups['value'].Value.Trim()
        notes = $notesMatch.Groups['value'].Value.Trim()
    })
}

if ($slideData.Count -ne 38) {
    throw ('Expected 38 slide sections, found {0}.' -f $slideData.Count)
}

$powerPoint = $null
$presentation = $null

try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $powerPoint.Visible = -1
    $presentation = $powerPoint.Presentations.Add()
    $presentation.PageSetup.SlideWidth = 960
    $presentation.PageSetup.SlideHeight = 540

    foreach ($data in $slideData) {
        $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
        if ($data.number -eq 1) {
            Add-CoverSlide -Slide $slide -Data $data
        }
        elseif ($data.number -eq 7) {
            Add-SuitOverviewSlide -Slide $slide -Data $data
        }
        elseif ($data.number -ge 13 -and $data.number -le 25) {
            Add-NumberSlide -Slide $slide -Data $data
        }
        elseif ($data.number -in @(3, 6, 12, 27, 38)) {
            Add-StatementSlide -Slide $slide -Data $data
        }
        else {
            Add-StandardSlide -Slide $slide -Data $data
        }
        Add-Notes -Slide $slide -Notes $data.notes
    }

    $presentation.SaveAs($outputPath, 24)

    $previewSlides = @(1, 7, 13, 28, 34, 38)
    foreach ($index in $previewSlides) {
        $previewPath = Join-Path $previewDir ('slide-{0:D2}.png' -f $index)
        $presentation.Slides.Item($index).Export($previewPath, 'PNG', 1600, 900)
    }
}
finally {
    if ($null -ne $presentation) {
        $presentation.Close()
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation)
    }
    if ($null -ne $powerPoint) {
        $powerPoint.Quit()
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Output ('Built {0} slides: {1}' -f $slideData.Count, $outputPath)
