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

    map {query} {querySuffix} {
        "" ""
        default "?{query}"
    }

    redir /index.php /{querySuffix} 301
    @legacyRoot path_regexp legacyRoot ^/(beta|bitcoin)\.php$
    redir @legacyRoot /{re.legacyRoot.1}{querySuffix} 301
    redir /contact.php /contact{querySuffix} 308
    @legacyTool path_regexp legacyTool ^/tools/([A-Za-z0-9_]+)\.php$
    redir @legacyTool /{re.legacyTool.1}{querySuffix} 301

    @home path /
    rewrite @home /index.php
    @toolRoutes path_regexp toolRoutes ^/($toolRoutePattern)/?$
    rewrite @toolRoutes /tools/{re.toolRoutes.1}.php
    @rootRoutes path_regexp rootRoutes ^/(beta|bitcoin|contact|updates)/?$
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

    handle {
        error 404
    }

    handle_errors {
        rewrite * /404.php
        php_fastcgi 127.0.0.1:$fastCgiPort {
            try_files {path}
        }
    }
}
"@

function Get-ListeningPids([int]$TargetPort) {
    return @(Get-NetTCPConnection -State Listen -ErrorAction Stop |
        Where-Object { $_.LocalPort -eq $TargetPort } |
        Select-Object -ExpandProperty OwningProcess -Unique)
}

$caddyProcesses = @(Get-CimInstance Win32_Process -Filter "Name = 'caddy.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($caddyfilePath) })
$existing = @(@(Get-ListeningPids -TargetPort $Port) + @($caddyProcesses.ProcessId) |
    Where-Object { $_ } | Select-Object -Unique)
foreach ($listeningProcessId in $existing) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $listeningProcessId"
    if ($process.Name -ne 'caddy.exe' -or -not $process.CommandLine.Contains($caddyfilePath)) {
        throw "Port $Port belongs to another listener (PID $listeningProcessId). It was left running."
    }
}

$phpProcesses = @(Get-CimInstance Win32_Process -Filter "Name = 'php-cgi.exe'" |
    Where-Object { $_.CommandLine -match "-b\s+127\.0\.0\.1:$fastCgiPort\b" })
$existingFastCgi = @(@(Get-ListeningPids -TargetPort $fastCgiPort) + @($phpProcesses.ProcessId) |
    Where-Object { $_ } | Select-Object -Unique)
foreach ($listeningProcessId in $existingFastCgi) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $listeningProcessId"
    if ($process.Name -ne 'php-cgi.exe' -or $process.CommandLine -notmatch "-b\s+127\.0\.0\.1:$fastCgiPort\b") {
        throw "FastCGI port $fastCgiPort belongs to another listener (PID $listeningProcessId). It was left running."
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

[System.IO.File]::WriteAllText($caddyfilePath, $caddyfileContent, [System.Text.UTF8Encoding]::new($false))
& $caddyPath validate --config $caddyfilePath --adapter caddyfile
if ($LASTEXITCODE -ne 0) { throw 'Caddy configuration validation failed.' }

if ($existingFastCgi.Count -eq 0) {
    $phpCgiServer = Start-Process -FilePath $phpCgi.Source -ArgumentList "-b 127.0.0.1:$fastCgiPort" -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
    $fastCgiProcessId = $phpCgiServer.Id
} else {
    $fastCgiProcessId = $existingFastCgi[0]
}

if ($existing.Count -eq 0) {
    if ((Get-ListeningPids -TargetPort 2019).Count -gt 0) {
        throw 'The default Caddy admin port is already in use. No additional server was started.'
    }
    $caddyServer = Start-Process -FilePath $caddyPath -ArgumentList "run --config `"$caddyfilePath`" --adapter caddyfile" -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
    $caddyProcessId = $caddyServer.Id
} else {
    $adminProcessIds = Get-ListeningPids -TargetPort 2019
    if ($existing.Count -ne 1 -or ($adminProcessIds.Count -gt 0 -and $adminProcessIds[0] -ne $existing[0])) {
        throw 'The Caddy admin endpoint does not belong to this preview. No listener was stopped.'
    }
    $activeConfiguration = Invoke-RestMethod -Uri 'http://localhost:2019/config/' -ErrorAction Stop
    $activeConfigurationJson = ConvertTo-Json $activeConfiguration -Depth 100 -Compress
    if (-not $activeConfigurationJson.Contains($projectRoot.Replace('\', '/')) -or
        -not $activeConfigurationJson.Contains('":' + $Port + '"')) {
        throw 'The Caddy admin configuration does not match this preview. No listener was changed.'
    }
    & $caddyPath reload --config $caddyfilePath --adapter caddyfile
    if ($LASTEXITCODE -ne 0) { throw 'Caddy reload failed.' }
    $caddyProcessId = $existing[0]
}

function Get-HeadResult([string]$Url) {
    $request = [System.Net.HttpWebRequest]::Create($Url)
    $request.Method = 'HEAD'
    $request.AllowAutoRedirect = $false
    $response = $null
    try {
        $response = $request.GetResponse()
    } catch [System.Net.WebException] {
        $response = $_.Exception.Response
        if (-not $response) {
            Write-Warning ("Request failed for {0}: {1}" -f $Url, $_.Exception.Message)
        }
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
    [pscustomobject]@{ Url = "$baseUrl/tap_pad"; ExpectedStatus = 200; ExpectedLocation = '' },
    [pscustomobject]@{ Url = "$baseUrl/contact"; ExpectedStatus = 200; ExpectedLocation = '' },
    [pscustomobject]@{ Url = "$baseUrl/contact.php"; ExpectedStatus = 308; ExpectedLocation = '/contact' },
    [pscustomobject]@{ Url = "$baseUrl/index.php?check=1"; ExpectedStatus = 301; ExpectedLocation = '/?check=1' },
    [pscustomobject]@{ Url = "$baseUrl/tools/reference.php?check=1"; ExpectedStatus = 301; ExpectedLocation = '/reference?check=1' },
    [pscustomobject]@{ Url = "$baseUrl/contact.php?check=1"; ExpectedStatus = 308; ExpectedLocation = '/contact?check=1' },
    [pscustomobject]@{ Url = "$baseUrl/reference"; ExpectedStatus = 200; ExpectedLocation = '' },
    [pscustomobject]@{ Url = "$baseUrl/beta"; ExpectedStatus = 200; ExpectedLocation = '' },
    [pscustomobject]@{ Url = "$baseUrl/bitcoin"; ExpectedStatus = 200; ExpectedLocation = '' },
    [pscustomobject]@{ Url = "$baseUrl/updates"; ExpectedStatus = 200; ExpectedLocation = '' },
    [pscustomobject]@{ Url = "$baseUrl/icons.svg"; ExpectedStatus = 200; ExpectedLocation = '' },
    [pscustomobject]@{ Url = "$baseUrl/css/reference.css"; ExpectedStatus = 200; ExpectedLocation = '' },
    [pscustomobject]@{ Url = "$baseUrl/missing-startup-page"; ExpectedStatus = 404; ExpectedLocation = '' }
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
Write-Host ("Caddy PID: {0}" -f $caddyProcessId)
Write-Host ("PHP CGI PID: {0}" -f $fastCgiProcessId)
Write-Host "Zoom policy: press Ctrl+0 in browser to enforce 100% zoom."

if (-not $allPassed) {
    exit 1
}

git -C $projectRoot config --local core.hooksPath .githooks
& (Join-Path $PSScriptRoot 'generate-updates-feed.ps1')

exit 0
