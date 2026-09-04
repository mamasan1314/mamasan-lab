# Pack a plugin folder into a WordPress-installable zip.
#
# Do NOT use Compress-Archive: on Windows it writes backslash path separators,
# but the ZIP spec requires forward slashes. PHP then treats the whole string as
# one filename, so the plugin ends up nested one level too deep
# (hopelight-crm/hopelight-crm/hopelight-crm.php) and cannot be activated.
#
# ASCII only on purpose: Windows PowerShell 5.1 reads .ps1 as ANSI unless the
# file has a BOM, so non-ASCII characters here would be mis-decoded.

param(
    [string]$PluginName = 'hopelight-crm-board'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSCommandPath
$source = (Resolve-Path (Join-Path $root $PluginName)).Path.TrimEnd('\')
$zipPath = Join-Path $root "$PluginName.zip"

if (-not (Test-Path $source)) { throw "Plugin folder not found: $source" }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$files = @(Get-ChildItem -LiteralPath $source -Recurse -File)
if ($files.Count -eq 0) { throw "No files found under $source" }

$archive = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($source.Length).TrimStart('\', '/')
        if ([string]::IsNullOrWhiteSpace($relative)) { continue }
        $entryName = "$PluginName/" + ($relative -replace '\\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, $file.FullName, $entryName, 'Optimal') | Out-Null
        Write-Output "  + $entryName"
    }
}
finally {
    $archive.Dispose()
}

Write-Output "Wrote $zipPath"
