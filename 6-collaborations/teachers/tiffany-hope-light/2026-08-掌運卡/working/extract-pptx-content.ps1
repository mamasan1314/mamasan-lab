param(
    [string]$ProjectDir = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$sourceDir = Join-Path $ProjectDir 'source'
$workingDir = Join-Path $ProjectDir 'working'
$outputDir = Join-Path $workingDir 'extracted'
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

$ns = @{
    a = 'http://schemas.openxmlformats.org/drawingml/2006/main'
    p = 'http://schemas.openxmlformats.org/presentationml/2006/main'
    r = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    rel = 'http://schemas.openxmlformats.org/package/2006/relationships'
}

function Read-ZipXml {
    param(
        [Parameter(Mandatory = $true)][System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)][string]$PartPath
    )

    $entry = $Archive.GetEntry($PartPath)
    if ($null -eq $entry) { return $null }
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8, $true)
    try {
        $xml = New-Object System.Xml.XmlDocument
        $xml.PreserveWhitespace = $false
        $xml.LoadXml($reader.ReadToEnd())
        return ,$xml
    }
    finally {
        $reader.Dispose()
        $stream.Dispose()
    }
}

function New-NamespaceManager {
    param([Parameter(Mandatory = $true)][System.Xml.XmlDocument]$Xml)

    $manager = New-Object System.Xml.XmlNamespaceManager($Xml.NameTable)
    foreach ($key in $ns.Keys) { $manager.AddNamespace($key, $ns[$key]) }
    return ,$manager
}

function Normalize-Text {
    param([AllowNull()][object]$Value)

    if ($null -eq $Value) { return '' }
    $text = [string]$Value
    $text = $text -replace "`v", "`n"
    $text = $text -replace "`r`n?", "`n"
    $lines = foreach ($line in ($text -split "`n")) {
        ($line -replace '[\u00A0\t]+', ' ' -replace ' {2,}', ' ').Trim()
    }
    return (($lines | Where-Object { $_ -ne '' }) -join "`n").Trim()
}

function Get-ParagraphText {
    param(
        [Parameter(Mandatory = $true)][System.Xml.XmlNode]$Paragraph,
        [Parameter(Mandatory = $true)][System.Xml.XmlNamespaceManager]$Manager
    )

    $pieces = New-Object System.Collections.Generic.List[string]
    foreach ($child in $Paragraph.ChildNodes) {
        if ($child.LocalName -eq 'br') {
            $pieces.Add("`n")
            continue
        }
        $textNodes = $child.SelectNodes('.//a:t', $Manager)
        foreach ($textNode in $textNodes) { $pieces.Add([string]$textNode.InnerText) }
    }
    return Normalize-Text ($pieces -join '')
}

function Get-TextBlocks {
    param(
        [Parameter(Mandatory = $true)][System.Xml.XmlNode]$Root,
        [Parameter(Mandatory = $true)][System.Xml.XmlNamespaceManager]$Manager
    )

    $blocks = New-Object System.Collections.Generic.List[string]
    foreach ($paragraph in $Root.SelectNodes('.//a:p', $Manager)) {
        $value = Get-ParagraphText -Paragraph $paragraph -Manager $Manager
        if ($value) { $blocks.Add($value) }
    }
    return $blocks
}

function Resolve-PartPath {
    param(
        [Parameter(Mandatory = $true)][string]$BasePart,
        [Parameter(Mandatory = $true)][string]$Target
    )

    $baseUri = New-Object System.Uri(('http://package/' + $BasePart))
    $targetUri = New-Object System.Uri($baseUri, $Target)
    return $targetUri.AbsolutePath.TrimStart('/')
}

function Get-RelationshipMap {
    param(
        [Parameter(Mandatory = $true)][System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)][string]$RelationshipPart
    )

    $map = @{}
    $xml = Read-ZipXml -Archive $Archive -PartPath $RelationshipPart
    if ($null -eq $xml) { return $map }
    $manager = New-NamespaceManager -Xml $xml
    foreach ($relationship in $xml.SelectNodes('//rel:Relationship', $manager)) {
        $map[[string]$relationship.Id] = [pscustomobject]@{
            target = [string]$relationship.Target
            type = [string]$relationship.Type
        }
    }
    return $map
}

function Get-NotesText {
    param(
        [Parameter(Mandatory = $true)][System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)][string]$SlidePart,
        [Parameter(Mandatory = $true)][string]$SlideRelationshipPart
    )

    $relationships = Get-RelationshipMap -Archive $Archive -RelationshipPart $SlideRelationshipPart
    $notesRelationship = $relationships.Values | Where-Object { $_.type -like '*/notesSlide' } | Select-Object -First 1
    if ($null -eq $notesRelationship) { return '' }

    $notesPart = Resolve-PartPath -BasePart $SlidePart -Target $notesRelationship.target
    $notesXml = Read-ZipXml -Archive $Archive -PartPath $notesPart
    if ($null -eq $notesXml) { return '' }
    $manager = New-NamespaceManager -Xml $notesXml
    $blocks = New-Object System.Collections.Generic.List[string]

    $bodyShapes = $notesXml.SelectNodes('//p:sp[p:nvSpPr/p:nvPr/p:ph[@type="body"]]', $manager)
    foreach ($shape in $bodyShapes) {
        foreach ($value in (Get-TextBlocks -Root $shape -Manager $manager)) {
            if ($value) { $blocks.Add($value) }
        }
    }
    return ($blocks -join "`n").Trim()
}

function Get-SlideTitle {
    param(
        [Parameter(Mandatory = $true)][System.Xml.XmlDocument]$SlideXml,
        [Parameter(Mandatory = $true)][System.Xml.XmlNamespaceManager]$Manager,
        [Parameter(Mandatory = $true)][System.Collections.IEnumerable]$FallbackBlocks
    )

    $titleShape = $SlideXml.SelectSingleNode('//p:sp[p:nvSpPr/p:nvPr/p:ph[@type="title" or @type="ctrTitle"]]', $Manager)
    if ($null -ne $titleShape) {
        $titleBlocks = Get-TextBlocks -Root $titleShape -Manager $Manager
        if ($titleBlocks.Count -gt 0) { return ($titleBlocks -join ' / ') }
    }
    $first = $FallbackBlocks | Select-Object -First 1
    if ($first) { return (($first -split "`n")[0]).Trim() }
    return ''
}

$allSlides = New-Object System.Collections.Generic.List[object]
$files = Get-ChildItem -LiteralPath $sourceDir -File -Filter '*.pptx' | Sort-Object Name

foreach ($file in $files) {
    $archive = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)
    try {
        $presentationXml = Read-ZipXml -Archive $archive -PartPath 'ppt/presentation.xml'
        $presentationManager = New-NamespaceManager -Xml $presentationXml
        $presentationRelationships = Get-RelationshipMap -Archive $archive -RelationshipPart 'ppt/_rels/presentation.xml.rels'
        $deckSlides = New-Object System.Collections.Generic.List[object]
        $slideNumber = 0

        foreach ($slideId in $presentationXml.SelectNodes('//p:sldIdLst/p:sldId', $presentationManager)) {
            $slideNumber++
            $relationshipId = [string]$slideId.GetAttribute('id', $ns.r)
            $slideRelationship = $presentationRelationships[$relationshipId]
            if ($null -eq $slideRelationship) { continue }

            $slidePart = Resolve-PartPath -BasePart 'ppt/presentation.xml' -Target $slideRelationship.target
            $slideXml = Read-ZipXml -Archive $archive -PartPath $slidePart
            if ($null -eq $slideXml) { continue }
            $slideManager = New-NamespaceManager -Xml $slideXml

            $textBlocks = Get-TextBlocks -Root $slideXml -Manager $slideManager
            $title = Get-SlideTitle -SlideXml $slideXml -Manager $slideManager -FallbackBlocks $textBlocks
            $bodyText = ($textBlocks -join "`n").Trim()

            $slideDirectory = Split-Path $slidePart -Parent
            $slideFileName = Split-Path $slidePart -Leaf
            $slideRelationshipPart = ($slideDirectory + '/_rels/' + $slideFileName + '.rels') -replace '\\', '/'
            $notes = Get-NotesText -Archive $archive -SlidePart $slidePart -SlideRelationshipPart $slideRelationshipPart

            $pictureCount = @($slideXml.SelectNodes('//p:pic', $slideManager)).Count
            $tableCount = @($slideXml.SelectNodes('//a:tbl', $slideManager)).Count
            $chartCount = @($slideXml.SelectNodes('//*[local-name()="chart"]', $slideManager)).Count
            $smartArtCount = @($slideXml.SelectNodes('//a:graphicData[contains(@uri,"diagram")]', $slideManager)).Count
            $mediaCount = @($slideXml.SelectNodes('//*[local-name()="video" or local-name()="audio"]', $slideManager)).Count
            $shapeCount = @($slideXml.SelectNodes('//p:sp | //p:pic | //p:graphicFrame | //p:grpSp', $slideManager)).Count

            $record = [pscustomobject]@{
                source_file = $file.Name
                slide_number = $slideNumber
                title = $title
                body_text = $bodyText
                speaker_notes = $notes
                shape_count = $shapeCount
                picture_count = $pictureCount
                table_count = $tableCount
                chart_count = $chartCount
                smartart_count = $smartArtCount
                media_count = $mediaCount
                text_characters = $bodyText.Length
                text_blocks = @($textBlocks)
            }
            $deckSlides.Add($record)
            $allSlides.Add($record)
        }

        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $jsonPath = Join-Path $outputDir ($baseName + '.json')
        $markdownPath = Join-Path $outputDir ($baseName + '.md')
        $deckSlides | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

        $markdown = New-Object System.Text.StringBuilder
        [void]$markdown.AppendLine('# ' + $baseName + ' - slide text extraction')
        [void]$markdown.AppendLine()
        [void]$markdown.AppendLine('- Source: `' + $file.Name + '`')
        [void]$markdown.AppendLine('- Slides: ' + $deckSlides.Count)
        [void]$markdown.AppendLine('- Method: read-only extraction from the PPTX package; source slide numbers retained.')
        [void]$markdown.AppendLine()

        foreach ($item in $deckSlides) {
            $displayTitle = if ($item.title) { $item.title -replace "`n", ' / ' } else { '(untitled)' }
            [void]$markdown.AppendLine(('## Slide {0:D2} - {1}' -f $item.slide_number, $displayTitle))
            [void]$markdown.AppendLine()
            [void]$markdown.AppendLine(('- Visuals: pictures {0}, tables {1}, charts {2}, SmartArt {3}, media {4}' -f $item.picture_count, $item.table_count, $item.chart_count, $item.smartart_count, $item.media_count))
            [void]$markdown.AppendLine()
            if ($item.body_text) {
                [void]$markdown.AppendLine('```text')
                [void]$markdown.AppendLine($item.body_text)
                [void]$markdown.AppendLine('```')
            } else {
                [void]$markdown.AppendLine('(no extractable text)')
            }
            if ($item.speaker_notes) {
                [void]$markdown.AppendLine()
                [void]$markdown.AppendLine('### Speaker notes')
                [void]$markdown.AppendLine()
                [void]$markdown.AppendLine('```text')
                [void]$markdown.AppendLine($item.speaker_notes)
                [void]$markdown.AppendLine('```')
            }
            [void]$markdown.AppendLine()
        }
        $markdown.ToString() | Set-Content -LiteralPath $markdownPath -Encoding UTF8
    }
    finally {
        $archive.Dispose()
    }
}

$inventoryPath = Join-Path $workingDir 'slide-inventory.csv'
$allSlides |
    Select-Object source_file, slide_number, title, body_text, speaker_notes, shape_count, picture_count, table_count, chart_count, smartart_count, media_count, text_characters |
    Export-Csv -LiteralPath $inventoryPath -NoTypeInformation -Encoding UTF8

Write-Output ('Extracted {0} slides into {1}' -f $allSlides.Count, $outputDir)
