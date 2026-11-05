param(
    [ValidateSet(8000)][int]$Port = 8000,
    [switch]$OpenBrowser
)

$ErrorActionPreference = 'Stop'
$startup = Join-Path $PSScriptRoot '..\..\local-tools\startup.ps1'
if (-not (Test-Path -LiteralPath $startup)) {
    throw 'Shared startup tooling is missing. Open the websites workspace and follow SITES.md.'
}
# The shared routine always prepares Chrome; OpenBrowser remains accepted for existing callers.
& $startup

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
git -C $projectRoot config --local core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) { throw 'Could not configure Pekosoft Git hooks.' }
& (Join-Path $PSScriptRoot 'generate-updates-feed.ps1')
