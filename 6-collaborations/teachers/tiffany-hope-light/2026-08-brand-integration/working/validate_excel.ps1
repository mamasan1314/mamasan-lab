param(
    [Parameter(Mandatory = $true)]
    [string]$WorkbookPath,
    [Parameter(Mandatory = $true)]
    [string]$PreviewDir
)

$ErrorActionPreference = 'Stop'
$WorkbookPath = [System.IO.Path]::GetFullPath($WorkbookPath)
$PreviewDir = [System.IO.Path]::GetFullPath($PreviewDir)
[System.IO.Directory]::CreateDirectory($PreviewDir) | Out-Null

$previewAreas = [ordered]@{
    '00_使用說明' = '$A$1:$D$29'
    '01_品牌儀表板' = '$A$1:$L$25'
    '02_90天路徑' = '$A$1:$N$42'
    '03_產品主檔' = '$A$1:$Q$28'
    '04_產品介紹' = '$A$1:$K$28'
    '06_庫存總覽' = '$A$1:$P$22'
    '11_內容主題庫' = '$A$1:$T$44'
    '17_品牌決策' = '$A$1:$K$20'
    '18_資料核對' = '$A$1:$H$48'
    '產品報價' = '$A$1:$I$27'
    '產品庫存' = '$A$1:$N$24'
    '產品介紹' = '$A$1:$K$27'
    '簡易報價' = '$A$1:$F$11'
    '簡易庫存' = '$A$1:$F$17'
    '簡易介紹' = '$A$1:$E$10'
    '中文' = '$A$1:$F$9'
    'English' = '$A$1:$F$9'
    '日本語' = '$A$1:$F$9'
}

$excel = $null
$book = $null
$report = [ordered]@{
    workbook = $WorkbookPath
    excel_version = ''
    sheets = 0
    tables = 0
    formulas = 0
    formula_error_cells = @()
    external_links = @()
    previews = @()
}

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.AskToUpdateLinks = $false
    $report.excel_version = $excel.Version
    $book = $excel.Workbooks.Open($WorkbookPath, 0, $true)
    $excel.CalculateFullRebuild()
    $report.sheets = $book.Worksheets.Count

    $links = $book.LinkSources(1)
    if ($null -ne $links) {
        foreach ($link in $links) { $report.external_links += [string]$link }
    }

    foreach ($sheet in $book.Worksheets) {
        $report.tables += $sheet.ListObjects.Count
        $used = $sheet.UsedRange
        try {
            $formulaCells = $used.SpecialCells(-4123)
            $report.formulas += $formulaCells.Count
            [void][Runtime.InteropServices.Marshal]::ReleaseComObject($formulaCells)
        }
        catch {}
        try {
            $errorCells = $used.SpecialCells(-4123, 16)
            foreach ($area in $errorCells.Areas) {
                foreach ($cell in $area.Cells) {
                    $report.formula_error_cells += "$($sheet.Name)!$($cell.Address($false,$false))=$($cell.Text)"
                    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($cell)
                }
                [void][Runtime.InteropServices.Marshal]::ReleaseComObject($area)
            }
            [void][Runtime.InteropServices.Marshal]::ReleaseComObject($errorCells)
        }
        catch {}
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($used)
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($sheet)
    }

    foreach ($entry in $previewAreas.GetEnumerator()) {
        $sheet = $null
        try { $sheet = $book.Worksheets.Item($entry.Key) }
        catch { continue }
        $sheet.PageSetup.PrintArea = $entry.Value
        $sheet.PageSetup.Zoom = $false
        $sheet.PageSetup.FitToPagesWide = 1
        $sheet.PageSetup.FitToPagesTall = 1
        $pdfPath = Join-Path $PreviewDir ($entry.Key + '.pdf')
        $sheet.ExportAsFixedFormat(0, $pdfPath, 0, $true, $false)
        $report.previews += $pdfPath
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($sheet)
    }

    $json = $report | ConvertTo-Json -Depth 6
    $reportPath = Join-Path $PreviewDir 'excel_com_validation.json'
    [System.IO.File]::WriteAllText($reportPath, $json, (New-Object System.Text.UTF8Encoding($false)))
    $json
}
finally {
    if ($book) {
        $book.Close($false)
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($book)
    }
    if ($excel) {
        $excel.Quit()
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
