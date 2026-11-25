$ErrorActionPreference = 'Stop'
$source = Split-Path $PSScriptRoot -Parent
$workspace = Split-Path $source -Parent
$sites = @(
  'peko.net', 'focusstudios.no', 'kissbandstree.com', 'fuzzpop.no',
  'howlinofthewolf.com', 'pekowear.com', 'silentlab.net', 'arcticaantarctica.com'
)
foreach ($site in $sites) {
  $destination = Join-Path $workspace $site
  if (-not (Test-Path (Join-Path $destination '.git'))) {
    throw "Registered site repository not found: $destination"
  }
}
foreach ($site in $sites) {
  foreach ($file in @('site_ui.php', 'site_ui.css', 'site_ui.js')) {
    Copy-Item -LiteralPath (Join-Path $source $file) -Destination (Join-Path (Join-Path $workspace $site) $file)
  }
}
