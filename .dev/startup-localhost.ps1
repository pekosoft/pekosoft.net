param(
    [int]$Port = 8000,
    [switch]$OpenBrowser
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$baseUrl = "http://localhost:$Port"
$caddyfilePath = Join-Path $env:TEMP ("pekosoft-caddy-{0}.Caddyfile" -f $Port)
$fastCgiPort = 9000

$toolSlugs = Get-ChildItem -Path (Join-Path $projectRoot 'tools') -Filter '*.php' -File |
    ForEach-Object { [regex]::Escape($_.BaseName) }
$toolRoutePattern = $toolSlugs -join '|'

$caddyfileContent = @"
{
    auto_https off
}

http://localhost:$Port {
    root * "$($projectRoot.Replace('\', '/'))"

    redir /index.php / 301
    @legacyRoot path_regexp legacyRoot ^/(beta|bitcoin)\.php$
    redir @legacyRoot /{re.legacyRoot.1} 301
    @legacyTool path_regexp legacyTool ^/tools/([A-Za-z0-9_]+)\.php$
    redir @legacyTool /{re.legacyTool.1} 301

    @home path /
    rewrite @home /index.php
    @toolRoutes path_regexp toolRoutes ^/($toolRoutePattern)/?$
    rewrite @toolRoutes /tools/{re.toolRoutes.1}.php
    @rootRoutes path_regexp rootRoutes ^/([A-Za-z0-9_]+)/?$
    rewrite @rootRoutes /{re.rootRoutes.1}.php

    @phpFiles path *.php
    handle @phpFiles {
        php_fastcgi 127.0.0.1:$fastCgiPort {
            try_files {path}
        }
    }

    @staticFiles file
    handle @staticFiles {
        file_server
    }
}
"@
[System.IO.File]::WriteAllText($caddyfilePath, $caddyfileContent, [System.Text.UTF8Encoding]::new($false))

function Get-ListeningPids([int]$TargetPort) {
    try {
        $pids = Get-NetTCPConnection -State Listen -LocalPort $TargetPort -ErrorAction Stop |
            Select-Object -ExpandProperty OwningProcess -Unique
        return @($pids)
    } catch {
        $netstatMatches = netstat -ano | Select-String (":$TargetPort\\s+")
        $pids = @()
        foreach ($match in $netstatMatches) {
            $parts = ($match.Line -replace '\\s+', ' ').Trim().Split(' ')
            if ($parts.Length -ge 5) {
                $listeningProcessId = $parts[-1]
                if ($listeningProcessId -match '^\\d+$') {
                    $pids += [int]$listeningProcessId
                }
            }
        }
        return @($pids | Select-Object -Unique)
    }
}

$existing = Get-ListeningPids -TargetPort $Port
foreach ($listeningProcessId in $existing) {
    try {
        Stop-Process -Id $listeningProcessId -Force -ErrorAction Stop
    } catch {
        Write-Warning "Could not stop PID $listeningProcessId on port $Port."
    }
}

$existingFastCgi = Get-ListeningPids -TargetPort $fastCgiPort
foreach ($listeningProcessId in $existingFastCgi) {
    try {
        Stop-Process -Id $listeningProcessId -Force -ErrorAction Stop
    } catch {
        Write-Warning "Could not stop PHP CGI PID $listeningProcessId on port $fastCgiPort."
    }
}

$phpCgi = Get-Command php-cgi -ErrorAction SilentlyContinue
if (-not $phpCgi) {
    throw 'PHP CGI executable was not found in PATH.'
}

$caddy = Get-Command caddy -ErrorAction SilentlyContinue
$caddyPath = if ($caddy) { $caddy.Source } else { $null }
if (-not $caddyPath) {
    $winGetPackages = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
    if (Test-Path $winGetPackages) {
        $caddyPath = Get-ChildItem -Path $winGetPackages -Directory -Filter 'CaddyServer.Caddy_*' |
            ForEach-Object { Get-ChildItem -Path $_.FullName -Filter 'caddy.exe' -File -ErrorAction SilentlyContinue } |
            Select-Object -First 1 -ExpandProperty FullName
    }
}
if (-not $caddyPath) {
    throw 'Caddy was not found in PATH. Install it with: winget install --id CaddyServer.Caddy --exact'
}

$phpCgiServer = Start-Process -FilePath $phpCgi.Source -ArgumentList "-b 127.0.0.1:$fastCgiPort" -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
$caddyServer = Start-Process -FilePath $caddyPath -ArgumentList "run --config `"$caddyfilePath`" --adapter caddyfile" -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru

function Get-HeadResult([string]$Url) {
    $request = [System.Net.HttpWebRequest]::Create($Url)
    $request.Method = 'HEAD'
    $request.AllowAutoRedirect = $false
    $response = $null
    try {
        $response = $request.GetResponse()
    } catch [System.Net.WebException] {
        $response = $_.Exception.Response
    }

    if (-not $response) {
        return [pscustomobject]@{ Status = 0; Location = '' }
    }

    $status = [int]$response.StatusCode
    $location = $response.Headers['Location']
    $response.Close()

    return [pscustomobject]@{ Status = $status; Location = $location }
}

$ready = $false
for ($i = 0; $i -lt 25; $i++) {
    $probe = Get-HeadResult -Url "$baseUrl/"
    if ($probe.Status -eq 200) {
        $ready = $true
        break
    }
    [System.Threading.Thread]::Sleep(150)
}

if (-not $ready) {
    throw "Server failed to respond on $baseUrl."
}

$checks = @(
    [pscustomobject]@{ Url = "$baseUrl/"; ExpectedStatus = 200; ExpectedLocation = '' },
    [pscustomobject]@{ Url = "$baseUrl/index.php"; ExpectedStatus = 301; ExpectedLocation = '/' },
    [pscustomobject]@{ Url = "$baseUrl/tools/tap_pad.php"; ExpectedStatus = 301; ExpectedLocation = '/tap_pad' },
    [pscustomobject]@{ Url = "$baseUrl/tap_pad"; ExpectedStatus = 200; ExpectedLocation = '' }
)

$allPassed = $true
foreach ($check in $checks) {
    $result = Get-HeadResult -Url $check.Url
    $ok = ($result.Status -eq $check.ExpectedStatus)

    if ($check.ExpectedLocation -ne '') {
        $ok = $ok -and ($result.Location -eq $check.ExpectedLocation)
    }

    if ($ok) {
        Write-Host ("PASS {0} [{1}]" -f $check.Url, $result.Status)
    } else {
        Write-Host ("FAIL {0} expected {1} got {2} location '{3}'" -f $check.Url, $check.ExpectedStatus, $result.Status, $result.Location)
        $allPassed = $false
    }
}

if ($OpenBrowser) {
    Start-Process "$baseUrl/"
}

Write-Host ""
Write-Host ("Caddy PID: {0}" -f $caddyServer.Id)
Write-Host ("PHP CGI PID: {0}" -f $phpCgiServer.Id)
Write-Host "Zoom policy: press Ctrl+0 in browser to enforce 100% zoom."

if (-not $allPassed) {
    exit 1
}

exit 0
