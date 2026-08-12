$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptRoot = if ([string]::IsNullOrWhiteSpace($PSScriptRoot)) {
    Join-Path (Get-Location).Path "scripts"
} else {
    $PSScriptRoot
}
$projectRoot = Split-Path -Parent $scriptRoot
$sourceDir = Join-Path $projectRoot "source"
$framesDir = Join-Path $projectRoot "frames"
$outputDir = Join-Path $projectRoot "output"
$pptxPath = Join-Path $outputDir "hope-light-candle-intro-139.pptx"
$mp4Path = Join-Path $outputDir "hope-light-candle-intro-139.mp4"
$logPath = Join-Path $outputDir "build-log.txt"

New-Item -ItemType Directory -Force -Path $framesDir, $outputDir | Out-Null
Get-ChildItem -LiteralPath $framesDir -Filter "*.png" | Remove-Item -Force
Set-Content -Encoding UTF8 -LiteralPath $logPath -Value "Build started: $(Get-Date -Format o)"

$frameW = 1080
$frameH = 1920

function New-Font {
    param(
        [string[]] $Names,
        [int] $Size,
        [System.Drawing.FontStyle] $Style
    )

    foreach ($name in $Names) {
        try {
            $font = New-Object System.Drawing.Font($name, $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
            if ($font.Name -eq $name -or $font.Name -like "Microsoft YaHei*") {
                return $font
            }
        } catch {
        }
    }

    return New-Object System.Drawing.Font("Arial", $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Get-FitRect {
    param(
        [int] $ImageW,
        [int] $ImageH,
        [int] $BoxX,
        [int] $BoxY,
        [int] $BoxW,
        [int] $BoxH
    )

    $scale = [Math]::Min($BoxW / $ImageW, $BoxH / $ImageH)
    $w = [int][Math]::Round($ImageW * $scale)
    $h = [int][Math]::Round($ImageH * $scale)
    $x = $BoxX + [int][Math]::Round(($BoxW - $w) / 2)
    $y = $BoxY + [int][Math]::Round(($BoxH - $h) / 2)

    return [System.Drawing.Rectangle]::new($x, $y, $w, $h)
}

function Get-CoverCrop {
    param(
        [int] $ImageW,
        [int] $ImageH,
        [int] $CanvasW,
        [int] $CanvasH
    )

    $imageRatio = $ImageW / $ImageH
    $canvasRatio = $CanvasW / $CanvasH

    if ($imageRatio -gt $canvasRatio) {
        $cropH = $ImageH
        $cropW = [int][Math]::Round($ImageH * $canvasRatio)
        $cropX = [int][Math]::Round(($ImageW - $cropW) / 2)
        $cropY = 0
    } else {
        $cropW = $ImageW
        $cropH = [int][Math]::Round($ImageW / $canvasRatio)
        $cropX = 0
        $cropY = [int][Math]::Round(($ImageH - $cropH) / 2)
    }

    return [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH)
}

function Draw-TextLines {
    param(
        [System.Drawing.Graphics] $Graphics,
        [string[]] $Lines,
        [System.Drawing.Font] $Font,
        [System.Drawing.Brush] $Brush,
        [System.Drawing.Brush] $ShadowBrush,
        [int] $X,
        [int] $Y,
        [int] $LineHeight
    )

    $currentY = $Y
    foreach ($line in $Lines) {
        $Graphics.DrawString($line, $Font, $ShadowBrush, $X + 3, $currentY + 3)
        $Graphics.DrawString($line, $Font, $Brush, $X, $currentY)
        $currentY += $LineHeight
    }
}

function Draw-Frame {
    param(
        [hashtable] $Slide,
        [string] $OutputPath
    )

    $inputPath = Join-Path $sourceDir $Slide["File"]
    $src = [System.Drawing.Image]::FromFile($inputPath)
    $bmp = New-Object System.Drawing.Bitmap($frameW, $frameH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    if ($Slide["File"] -eq "11.jpg") {
        $g.Clear([System.Drawing.Color]::FromArgb(118, 79, 98))
    } else {
        $crop = Get-CoverCrop $src.Width $src.Height $frameW $frameH
        $destFull = [System.Drawing.Rectangle]::new(0, 0, $frameW, $frameH)
        $g.DrawImage($src, $destFull, $crop, [System.Drawing.GraphicsUnit]::Pixel)
        $g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(136, 20, 16, 20))), 0, 0, $frameW, $frameH)
    }

    if ($src.Width -eq $src.Height) {
        $mainRect = Get-FitRect $src.Width $src.Height 70 300 940 940
    } elseif ($src.Width -lt $src.Height) {
        $mainRect = Get-FitRect $src.Width $src.Height 145 190 790 1405
    } else {
        $mainRect = Get-FitRect $src.Width $src.Height 50 300 980 760
    }

    $shadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(92, 0, 0, 0))
    $g.FillRectangle($shadow, $mainRect.X + 16, $mainRect.Y + 18, $mainRect.Width, $mainRect.Height)
    $g.DrawImage($src, $mainRect)

    if ($Slide["File"] -eq "11.jpg") {
        $cover = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(238, 173, 199))
        $priceBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(205, 55, 85))
        $priceFont = New-Font $fontNames 54 ([System.Drawing.FontStyle]::Bold)
        $smallPriceFont = New-Font $fontNames 26 ([System.Drawing.FontStyle]::Regular)
        $scaleX = $mainRect.Width / $src.Width
        $scaleY = $mainRect.Height / $src.Height
        $px = $mainRect.X + [int](335 * $scaleX)
        $py = $mainRect.Y + [int](628 * $scaleY)
        $pw = [int](300 * $scaleX)
        $ph = [int](155 * $scaleY)
        $g.FillRectangle($cover, $px, $py, $pw, $ph)
        $g.DrawString('$139', $priceFont, $priceBrush, $px + 22, $py + 12)
        $g.DrawString('不含運，可任選', $smallPriceFont, $priceBrush, $px + 20, $py + 78)

        $nameFont = New-Font $fontNames 30 ([System.Drawing.FontStyle]::Bold)
        $nameX = $mainRect.X + [int](747 * $scaleX)
        $nameY = $mainRect.Y + [int](578 * $scaleY)
        $nameW = [int](354 * $scaleX)
        $nameH = [int](62 * $scaleY)
        $g.FillRectangle($cover, $nameX, $nameY, $nameW, $nameH)
        $g.DrawString('希望之光∞頻率蠟燭', $nameFont, $priceBrush, $nameX + 8, $nameY + 6)
        $nameFont.Dispose()

        $priceFont.Dispose()
        $smallPriceFont.Dispose()
        $cover.Dispose()
        $priceBrush.Dispose()
    }

    $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(168, 36, 28, 34))
    $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(252, 247, 237))
    $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, 199, 127))
    $darkShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 0, 0, 0))

    $g.FillRectangle($panelBrush, 70, 70, 940, 190)
    Draw-TextLines $g @($Slide["Title"]) $titleFont $titleBrush $darkShadow 110 104 76
    $g.DrawString($Slide["Subtitle"], $subtitleFont, $goldBrush, 113, 186)

    $g.FillRectangle($panelBrush, 70, 1588, 940, 262)
    $g.DrawString('希望之光', $brandFont, $darkShadow, 112, 1620)
    $g.DrawString('希望之光', $brandFont, $titleBrush, 110, 1618)
    $g.DrawString('NT$139／顆｜不含運，可任選', $contactFont, $darkShadow, 112, 1690)
    $g.DrawString('NT$139／顆｜不含運，可任選', $contactFont, $goldBrush, 110, 1688)
    $g.DrawString('LINE: @happy139', $contactFont, $darkShadow, 112, 1745)
    $g.DrawString('LINE: @happy139', $contactFont, $titleBrush, 110, 1743)
    $g.DrawString('IG: .hopelight.ig / hopelight.moment', $contactFont, $darkShadow, 112, 1800)
    $g.DrawString('IG: .hopelight.ig / hopelight.moment', $contactFont, $titleBrush, 110, 1798)

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $shadow.Dispose()
    $panelBrush.Dispose()
    $titleBrush.Dispose()
    $goldBrush.Dispose()
    $darkShadow.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()
}

$fontNames = @("Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans TC", "Noto Sans CJK TC", "Microsoft JhengHei UI", "Microsoft JhengHei", "SimSun", "Arial")
$titleFont = New-Font $fontNames 58 ([System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Font $fontNames 34 ([System.Drawing.FontStyle]::Regular)
$brandFont = New-Font $fontNames 44 ([System.Drawing.FontStyle]::Bold)
$contactFont = New-Font $fontNames 31 ([System.Drawing.FontStyle]::Regular)

$slides = @(
    @{ File = "11.jpg"; Title = "希望之光∞頻率蠟燭"; Subtitle = '10款主題能量｜NT$139／顆' },
    @{ File = "01.jpg"; Title = "貴人常臨蠟燭"; Subtitle = "吸引貴人相助，廣結良緣" },
    @{ File = "02.jpg"; Title = "清晰專注蠟燭"; Subtitle = "穩定思緒流動，開啟專注狀態" },
    @{ File = "03.jpg"; Title = "感情升溫蠟燭"; Subtitle = "守護關係，提升溫度" },
    @{ File = "04.jpg"; Title = "吸引桃花蠟燭"; Subtitle = "吸引良緣，拓展人際" },
    @{ File = "05.jpg"; Title = "吸引顧客蠟燭"; Subtitle = "業績發展，營運順暢" },
    @{ File = "06.jpg"; Title = "小人退散"; Subtitle = "驅離干擾，穩定頻率" },
    @{ File = "07.jpg"; Title = "好運爆棚"; Subtitle = "開啟美好，迎接好事發生" },
    @{ File = "08.jpg"; Title = "靜謐放鬆蠟燭"; Subtitle = "回歸溫柔與安靜的頻率" },
    @{ File = "09.jpg"; Title = "財富豐盛蠟燭"; Subtitle = "提升顯化能力，增長豐盛之光" },
    @{ File = "10.jpg"; Title = "淨化除穢"; Subtitle = "驅除負能，淨化氣場與空間" }
)

$framePaths = @()
for ($i = 0; $i -lt $slides.Count; $i++) {
    $framePath = Join-Path $framesDir ("frame-{0:D2}.png" -f ($i + 1))
    Draw-Frame $slides[$i] $framePath
    $framePaths += $framePath
}

$titleFont.Dispose()
$subtitleFont.Dispose()
$brandFont.Dispose()
$contactFont.Dispose()

$ffmpeg = $null
$ffmpegCommand = Get-Command ffmpeg.exe -ErrorAction SilentlyContinue
if ($ffmpegCommand -ne $null) {
    $ffmpeg = $ffmpegCommand.Source
}
if ([string]::IsNullOrWhiteSpace($ffmpeg)) {
    $candidate = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe"
    if (Test-Path -LiteralPath $candidate) {
        $ffmpeg = $candidate
    }
}

if (-not [string]::IsNullOrWhiteSpace($ffmpeg)) {
    if (Test-Path -LiteralPath $mp4Path) {
        Remove-Item -LiteralPath $mp4Path -Force
    }

    Add-Content -Encoding UTF8 -LiteralPath $logPath -Value "Using ffmpeg: $ffmpeg"
    & $ffmpeg -y -framerate 5/17 -i (Join-Path $framesDir "frame-%02d.png") -vf "fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 20 -movflags +faststart $mp4Path
    if ($LASTEXITCODE -ne 0) {
        throw "ffmpeg export failed with exit code $LASTEXITCODE"
    }

    Write-Host "Created frames: $($framePaths.Count)"
    Write-Host "MP4: $mp4Path"
    return
}

$powerPoint = $null
$presentation = $null
try {
    Add-Content -Encoding UTF8 -LiteralPath $logPath -Value "Opening PowerPoint..."
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $powerPoint.Visible = 1
    try {
        $powerPoint.WindowState = 2
    } catch {
    }

    Add-Content -Encoding UTF8 -LiteralPath $logPath -Value "Creating presentation..."
    $presentation = $powerPoint.Presentations.Add()
    $presentation.PageSetup.SlideWidth = 405
    $presentation.PageSetup.SlideHeight = 720

    for ($i = 0; $i -lt $framePaths.Count; $i++) {
        $slide = $presentation.Slides.Add($i + 1, 12)
        $slide.FollowMasterBackground = $false
        $slide.Background.Fill.ForeColor.RGB = 0
        $slide.Shapes.AddPicture($framePaths[$i], $false, $true, 0, 0, 405, 720) | Out-Null
        $slide.SlideShowTransition.AdvanceOnTime = $true
        $slide.SlideShowTransition.AdvanceTime = 3.4
    }

    if (Test-Path -LiteralPath $pptxPath) {
        Remove-Item -LiteralPath $pptxPath -Force
    }
    if (Test-Path -LiteralPath $mp4Path) {
        Remove-Item -LiteralPath $mp4Path -Force
    }

    Add-Content -Encoding UTF8 -LiteralPath $logPath -Value "Saving PPTX..."
    $presentation.SaveAs($pptxPath, 24)

    Add-Content -Encoding UTF8 -LiteralPath $logPath -Value "Starting MP4 export..."
    try {
        $presentation.CreateVideo($mp4Path, $true, 3, 1920, 30, 85)
    } catch {
        $presentation.CreateVideo($mp4Path, $true, 3, 1080, 30, 85)
    }

    $deadline = (Get-Date).AddMinutes(12)
    while ((Get-Date) -lt $deadline) {
        try {
            $status = $presentation.CreateVideoStatus
        } catch {
            Add-Content -Encoding UTF8 -LiteralPath $logPath -Value "CreateVideoStatus temporarily unavailable: $($_.Exception.Message)"
            Start-Sleep -Seconds 2
            continue
        }
        Add-Content -Encoding UTF8 -LiteralPath $logPath -Value "Video status: $status"
        if ($status -eq 3) {
            break
        }
        if ($status -eq 4) {
            throw "PowerPoint video export failed."
        }
        Start-Sleep -Seconds 2
    }

    if (-not (Test-Path -LiteralPath $mp4Path)) {
        throw "MP4 was not created before timeout."
    }

    Add-Content -Encoding UTF8 -LiteralPath $logPath -Value "MP4 created: $mp4Path"
} finally {
    if ($presentation -ne $null) {
        try {
            $presentation.Close()
        } catch {
            Add-Content -Encoding UTF8 -LiteralPath $logPath -Value "Presentation close skipped: $($_.Exception.Message)"
        }
        try {
            [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation)
        } catch {
        }
    }
    if ($powerPoint -ne $null) {
        try {
            [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint)
        } catch {
        }
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Host "Created frames: $($framePaths.Count)"
Write-Host "PPTX: $pptxPath"
Write-Host "MP4: $mp4Path"
