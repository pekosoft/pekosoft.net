<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "system";
  $releaseName = "System";
  $releasePage = "";
  $availableModules = ["tool"];
  $clientIp = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'Unavailable';
  ?>
  <meta name="keywords" content="system info, computer info, browser info, client info, os, cpu, ram, ip">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div id="tool-container" class="container one-module-tool">
    <div id="system-page" class="module-body system-page standard border scrollable" data-client-ip="<?php echo htmlspecialchars($clientIp, ENT_QUOTES, 'UTF-8'); ?>">
      <div class="system-categories">
      <section class="system-category">
      <h1 class="system-category-title">
        Hardware
      </h1>
      <div class="system-grid">
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="CPU information" aria-label="CPU information"><svg class="icons"><use href="/icons.svg#cpu" /></svg></button>
          <span>CPU:</span>
          <strong id="system-cpu">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Logical processor cores" aria-label="Logical processor cores"><svg class="icons"><use href="/icons.svg#hardware" /></svg></button>
          <span>Cores:</span>
          <strong id="system-cores">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Device memory" aria-label="Device memory"><svg class="icons"><use href="/icons.svg#ram" /></svg></button>
          <span>RAM:</span>
          <strong id="system-ram">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Touch support" aria-label="Touch support"><svg class="icons"><use href="/icons.svg#touch" /></svg></button>
          <span>Touch:</span>
          <strong id="system-touch">Checking...</strong>
        </div>
      </div>
      </section>

      <section class="system-category">
      <h1 class="system-category-title">
        Display
      </h1>
      <div class="system-grid">
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Screen resolution" aria-label="Screen resolution"><svg class="icons"><use href="/icons.svg#display" /></svg></button>
          <span>Screen:</span>
          <strong id="system-screen">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Browser viewport" aria-label="Browser viewport"><svg class="icons"><use href="/icons.svg#viewport" /></svg></button>
          <span>Viewport:</span>
          <strong id="system-viewport">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Device pixel ratio" aria-label="Device pixel ratio"><svg class="icons"><use href="/icons.svg#view_grid" /></svg></button>
          <span>Pixel ratio:</span>
          <strong id="system-pixel-ratio">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Color depth" aria-label="Color depth"><svg class="icons"><use href="/icons.svg#color_depth" /></svg></button>
          <span>Color:</span>
          <strong id="system-color">Checking...</strong>
        </div>
      </div>
      </section>

      <section class="system-category">
      <h1 class="system-category-title">
        Software
      </h1>
      <div class="system-grid">
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Operating system" aria-label="Operating system"><svg class="icons"><use href="/icons.svg#software" /></svg></button>
          <span>OS:</span>
          <strong id="system-os">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Browser name and version" aria-label="Browser name and version"><svg class="icons"><use href="/icons.svg#browser" /></svg></button>
          <span>Browser:</span>
          <strong id="system-browser">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Browser languages" aria-label="Browser languages"><svg class="icons"><use href="/icons.svg#language" /></svg></button>
          <span>Language:</span>
          <strong id="system-language">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Cookie support" aria-label="Cookie support"><svg class="icons"><use href="/icons.svg#cookies" /></svg></button>
          <span>Cookies:</span>
          <strong id="system-cookies">Checking...</strong>
        </div>
        <div class="system-row system-row-wide">
          <button class="system-row-icon square icon-only" type="button" title="Browser user agent" aria-label="Browser user agent"><svg class="icons"><use href="/icons.svg#person" /></svg></button>
          <span>User agent:</span>
          <strong id="system-user-agent">Checking...</strong>
        </div>
      </div>
      </section>

      <section class="system-category">
      <h1 class="system-category-title">
        Network
      </h1>
      <div class="system-grid">
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Client IP address" aria-label="Client IP address"><svg class="icons"><use href="/icons.svg#ip" /></svg></button>
          <span>IP:</span>
          <strong id="system-ip">Checking...</strong>
        </div>
        <div class="system-row">
          <button class="system-row-icon square icon-only" type="button" title="Network connection" aria-label="Network connection"><svg class="icons"><use href="/icons.svg#online" /></svg></button>
          <span>Online:</span>
          <strong id="system-online">Checking...</strong>
        </div>
      </div>
      </section>
      </div>

    </div>

    <div class="module-footer wrapper colored">
      <button id="system-update-button" class="square" title="Update system info">
        <svg class="icons">
          <use href="/icons.svg#reset" />
        </svg>
        <span class="button-text">Update</span>
      </button>
      <button id="system-copy-button" class="square" title="Copy system info">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">Copy</span>
      </button>
    </div>
  </div>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>
