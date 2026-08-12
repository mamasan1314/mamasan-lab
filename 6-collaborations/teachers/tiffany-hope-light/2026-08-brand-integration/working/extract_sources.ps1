param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDir,
    [Parameter(Mandatory = $true)]
    [string]$OutputDir
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$OutputDir = [System.IO.Path]::GetFullPath($OutputDir)
[System.IO.Directory]::CreateDirectory($OutputDir) | Out-Null

function Get-SafeName([string]$Name) {
    $invalid = [System.IO.Path]::GetInvalidFileNameChars()
    foreach ($ch in $invalid) { $Name = $Name.Replace([string]$ch, '_') }
    return $Name
}

function Get-CellText($Value) {
    if ($null -eq $Value) { return '' }
    $text = [string]$Value
    $text = $text.Replace("`r`n", ' / ').Replace("`n", ' / ').Replace("`r", ' / ').Replace("`t", ' ')
    return $text
}

$manifest = [System.Collections.Generic.List[object]]::new()
$files = Get-ChildItem -LiteralPath $SourceDir -File | Where-Object {
    -not $_.Name.StartsWith('._') -and $_.Name -ne '.DS_Store'
}

$excel = $null
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.AskToUpdateLinks = $false

    foreach ($file in ($files | Where-Object Extension -in '.xls', '.xlsx')) {
        $book = $null
        try {
            $book = $excel.Workbooks.Open($file.FullName, 0, $true)
            $bookDir = Join-Path $OutputDir (Get-SafeName $file.BaseName)
            [System.IO.Directory]::CreateDirectory($bookDir) | Out-Null
            $sheetMeta = [System.Collections.Generic.List[object]]::new()

            foreach ($sheet in $book.Worksheets) {
                $used = $sheet.UsedRange
                $rows = [int]$used.Rows.Count
                $cols = [int]$used.Columns.Count
                $startRow = [int]$used.Row
                $startCol = [int]$used.Column
                $tsvPath = Join-Path $bookDir ((Get-SafeName $sheet.Name) + '.tsv')
                $lines = [System.Collections.Generic.List[string]]::new()

                for ($r = 1; $r -le $rows; $r++) {
                    $cells = [System.Collections.Generic.List[string]]::new()
                    for ($c = 1; $c -le $cols; $c++) {
                        $cell = $used.Cells.Item($r, $c)
                        $cells.Add((Get-CellText $cell.Text))
                        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($cell)
                    }
                    $lines.Add(($cells -join "`t"))
                }
                [System.IO.File]::WriteAllLines($tsvPath, $lines, $utf8NoBom)
                $sheetMeta.Add([pscustomobject]@{
                    sheet = $sheet.Name
                    visible = $sheet.Visible
                    used_start_row = $startRow
                    used_start_col = $startCol
                    rows = $rows
                    columns = $cols
                    export = [System.IO.Path]::GetFileName($tsvPath)
                })
                [void][Runtime.InteropServices.Marshal]::ReleaseComObject($used)
                [void][Runtime.InteropServices.Marshal]::ReleaseComObject($sheet)
            }

            $metaPath = Join-Path $bookDir '_workbook.json'
            [System.IO.File]::WriteAllText($metaPath, ($sheetMeta | ConvertTo-Json -Depth 5), $utf8NoBom)
            $manifest.Add([pscustomobject]@{
                file = $file.Name
                kind = 'spreadsheet'
                status = 'extracted'
                output = [System.IO.Path]::GetRelativePath($OutputDir, $bookDir)
                detail = "$($sheetMeta.Count) worksheets"
            })
        }
        catch {
            $manifest.Add([pscustomobject]@{
                file = $file.Name
                kind = 'spreadsheet'
                status = 'error'
                output = ''
                detail = $_.Exception.Message
            })
        }
        finally {
            if ($book) {
                $book.Close($false)
                [void][Runtime.InteropServices.Marshal]::ReleaseComObject($book)
            }
        }
    }
}
finally {
    if ($excel) {
        $excel.Quit()
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

foreach ($file in ($files | Where-Object Extension -eq '.docx')) {
    $outPath = Join-Path $OutputDir ((Get-SafeName $file.BaseName) + '.md')
    try {
        & pandoc $file.FullName '-t' 'gfm' '--wrap=none' '-o' $outPath
        if ($LASTEXITCODE -ne 0) { throw "pandoc exit code $LASTEXITCODE" }
        $manifest.Add([pscustomobject]@{
            file = $file.Name
            kind = 'document'
            status = 'extracted'
            output = [System.IO.Path]::GetRelativePath($OutputDir, $outPath)
            detail = 'Pandoc GFM export'
        })
    }
    catch {
        $manifest.Add([pscustomobject]@{
            file = $file.Name
            kind = 'document'
            status = 'error'
            output = ''
            detail = $_.Exception.Message
        })
    }
}

$word = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    foreach ($file in ($files | Where-Object Extension -eq '.pdf')) {
        $doc = $null
        try {
            $doc = $word.Documents.Open($file.FullName, $false, $true, $false)
            $outPath = Join-Path $OutputDir ((Get-SafeName $file.BaseName) + '.txt')
            [System.IO.File]::WriteAllText($outPath, $doc.Content.Text, $utf8NoBom)
            $manifest.Add([pscustomobject]@{
                file = $file.Name
                kind = 'pdf'
                status = 'extracted'
                output = [System.IO.Path]::GetRelativePath($OutputDir, $outPath)
                detail = "$($doc.ComputeStatistics(2)) pages via Word PDF reflow"
            })
        }
        catch {
            $manifest.Add([pscustomobject]@{
                file = $file.Name
                kind = 'pdf'
                status = 'error'
                output = ''
                detail = $_.Exception.Message
            })
        }
        finally {
            if ($doc) {
                $doc.Close($false)
                [void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc)
            }
        }
    }
}
finally {
    if ($word) {
        $word.Quit()
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

$imageDir = Join-Path $OutputDir 'images'
[System.IO.Directory]::CreateDirectory($imageDir) | Out-Null
foreach ($file in ($files | Where-Object Extension -eq '.png')) {
    $dest = Join-Path $imageDir $file.Name
    [System.IO.File]::Copy($file.FullName, $dest, $true)
    $manifest.Add([pscustomobject]@{
        file = $file.Name
        kind = 'image'
        status = 'copied'
        output = [System.IO.Path]::GetRelativePath($OutputDir, $dest)
        detail = 'Reference image copy'
    })
}

$manifestPath = Join-Path $OutputDir '_manifest.json'
[System.IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 5), $utf8NoBom)
$manifest | Format-Table -AutoSize
