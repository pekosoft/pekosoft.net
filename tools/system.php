<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "system";
  $releaseName = "System";
  $releasePage = "";
  $clientIp = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'Unavailable';
  ?>
  <meta name="keywords" content="system info, computer info, browser info, client info, os, cpu, ram, ip">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <main id="system-page" class="system-page" data-client-ip="<?php echo htmlspecialchars($clientIp, ENT_QUOTES, 'UTF-8'); ?>">
    <div class="system-hero standard border">
      <div class="system-clock-card" aria-label="Analog clock">
        <div class="system-clock-face">
          <div class="system-clock-mark system-clock-mark-12"></div>
          <div class="system-clock-mark system-clock-mark-3"></div>
          <div class="system-clock-mark system-clock-mark-6"></div>
          <div class="system-clock-mark system-clock-mark-9"></div>
          <div class="system-clock-dot system-clock-dot-1"></div>
          <div class="system-clock-dot system-clock-dot-2"></div>
          <div class="system-clock-dot system-clock-dot-4"></div>
          <div class="system-clock-dot system-clock-dot-5"></div>
          <div class="system-clock-dot system-clock-dot-7"></div>
          <div class="system-clock-dot system-clock-dot-8"></div>
          <div class="system-clock-dot system-clock-dot-10"></div>
          <div class="system-clock-dot system-clock-dot-11"></div>
          <div id="system-clock-hour" class="system-clock-hand system-clock-hour"></div>
          <div id="system-clock-minute" class="system-clock-hand system-clock-minute"></div>
          <div id="system-clock-second" class="system-clock-hand system-clock-second"></div>
          <div class="system-clock-center"></div>
        </div>
        <div class="system-clock-meta">
          <strong id="system-hero-local-time">Checking...</strong>
          <strong id="system-hero-time-zone">Checking...</strong>
        </div>
      </div>
      <div class="system-calendar-card">
        <div class="system-calendar-month" aria-label="Current month calendar">
          <div id="system-calendar-grid" class="system-calendar-grid"></div>
          <strong id="system-hero-local-date">Checking...</strong>
        </div>
      </div>
    </div>

    <div class="system-categories standard border">
    <section class="system-category">
      <h1 class="system-category-title">
        Hardware
      </h1>
      <div class="system-grid">
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#cpu" /></svg>
          <span>CPU:</span>
          <strong id="system-cpu">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#hardware" /></svg>
          <span>Cores:</span>
          <strong id="system-cores">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#ram" /></svg>
          <span>RAM:</span>
          <strong id="system-ram">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#touch" /></svg>
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
          <svg class="system-row-icon"><use href="/icons.svg#display" /></svg>
          <span>Screen:</span>
          <strong id="system-screen">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#viewport" /></svg>
          <span>Viewport:</span>
          <strong id="system-viewport">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#view_grid" /></svg>
          <span>Pixel ratio:</span>
          <strong id="system-pixel-ratio">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#color_depth" /></svg>
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
          <svg class="system-row-icon"><use href="/icons.svg#software" /></svg>
          <span>OS:</span>
          <strong id="system-os">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#browser" /></svg>
          <span>Browser:</span>
          <strong id="system-browser">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#language" /></svg>
          <span>Language:</span>
          <strong id="system-language">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#cookies" /></svg>
          <span>Cookies:</span>
          <strong id="system-cookies">Checking...</strong>
        </div>
        <div class="system-row system-row-wide">
          <svg class="system-row-icon"><use href="/icons.svg#person" /></svg>
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
          <svg class="system-row-icon"><use href="/icons.svg#ip" /></svg>
          <span>IP:</span>
          <strong id="system-ip">Checking...</strong>
        </div>
        <div class="system-row">
          <svg class="system-row-icon"><use href="/icons.svg#online" /></svg>
          <span>Online:</span>
          <strong id="system-online">Checking...</strong>
        </div>
      </div>
    </section>
    </div>

    <div class="system-actions wrapper colored">
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
  </main>

  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>
</body>

</html>
