$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$updatesDirectory = Join-Path $projectRoot 'data'
$updatesPath = Join-Path $updatesDirectory 'updates.json'

New-Item -ItemType Directory -Path $updatesDirectory -Force | Out-Null
$separator = [char]0x1f
$updates = @()
foreach ($record in @(git -C $projectRoot log --format="%H%x1f%aI%x1f%s")) {
    $parts = $record -split $separator, 3
    if ($parts.Count -eq 3) {
        $updates += [ordered]@{
            head_sha = $parts[0]
            created_at = $parts[1]
            display_title = $parts[2]
        }
    }
}
$updatesFeed = @{ workflow_runs = $updates; total_count = $updates.Count } | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText($updatesPath, $updatesFeed + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))