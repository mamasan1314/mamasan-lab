[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Plan,

    [switch]$Apply,

    [switch]$Merge,

    [switch]$Visible,

    [string]$Output
)

$ErrorActionPreference = 'Stop'
$adminDirectory = Split-Path -Parent $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { $null }

if (-not $nodePath) {
    $runtimeRoot = Join-Path $env:LOCALAPPDATA 'mamasan-lab\runtimes'
    $runtimeDirectory = Get-ChildItem -LiteralPath $runtimeRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object Name -Like 'node-v*-win-x64' |
        Sort-Object Name -Descending |
        Select-Object -First 1
    if ($runtimeDirectory) {
        $candidate = Join-Path $runtimeDirectory.FullName 'node.exe'
        if (Test-Path -LiteralPath $candidate) {
            $nodePath = $candidate
        }
    }
}

if (-not $nodePath) {
    throw 'Node.js 20 or newer was not found. Install it or add a portable runtime under %LOCALAPPDATA%\mamasan-lab\runtimes.'
}

$planCandidate = if ([IO.Path]::IsPathRooted($Plan)) {
    $Plan
} else {
    Join-Path $adminDirectory $Plan
}
$resolvedPlan = (Resolve-Path -LiteralPath $planCandidate).Path
$bookingArguments = @(
    (Join-Path $PSScriptRoot 'manage-booking-slots.cjs'),
    '--plan',
    $resolvedPlan
)

if ($Apply) { $bookingArguments += '--apply' }
if ($Merge) { $bookingArguments += '--merge' }
if ($Visible) { $bookingArguments += '--visible' }
if ($Output) {
    $outputCandidate = if ([IO.Path]::IsPathRooted($Output)) {
        $Output
    } else {
        Join-Path $adminDirectory $Output
    }
    $bookingArguments += @('--output', $outputCandidate)
}

& $nodePath @bookingArguments
exit $LASTEXITCODE
