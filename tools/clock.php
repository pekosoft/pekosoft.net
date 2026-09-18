<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "clock";
  $releaseName = "Clock";
  $releasePage = "";
  $availableModules = ["tool"];
  ?>
  <meta name="keywords" content="clock, local time, time zone, calendar, date">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div id="tool-container" class="container one-module-tool">
    <div id="clock-page" class="module-body clock-page standard border scrollable">
      <div class="clock-hero">
        <div class="clock-card" aria-label="Analog clock">
          <div class="clock-face">
            <div class="clock-mark clock-mark-12"></div>
            <div class="clock-mark clock-mark-3"></div>
            <div class="clock-mark clock-mark-6"></div>
            <div class="clock-mark clock-mark-9"></div>
            <div class="clock-dot clock-dot-1"></div>
            <div class="clock-dot clock-dot-2"></div>
            <div class="clock-dot clock-dot-4"></div>
            <div class="clock-dot clock-dot-5"></div>
            <div class="clock-dot clock-dot-7"></div>
            <div class="clock-dot clock-dot-8"></div>
            <div class="clock-dot clock-dot-10"></div>
            <div class="clock-dot clock-dot-11"></div>
            <div id="clock-hour" class="clock-hand clock-hour"></div>
            <div id="clock-minute" class="clock-hand clock-minute"></div>
            <div id="clock-second" class="clock-hand clock-second"></div>
            <div class="clock-center"></div>
          </div>
          <div class="clock-meta">
            <strong id="clock-local-time">Checking...</strong>
            <strong id="clock-time-zone">Checking...</strong>
          </div>
        </div>

        <div class="calendar-card">
          <div class="calendar-month" aria-label="Current month calendar">
            <div id="calendar-grid" class="calendar-grid"></div>
          </div>
          <strong id="clock-local-date">Checking...</strong>
        </div>
      </div>
    </div>

    <div class="module-footer wrapper colored">
      <button id="clock-sound-button" class="square" title="Toggle tick sound">
        <svg class="icons">
          <use href="/icons.svg#sound" />
        </svg>
        <span class="button-text">Sound</span>
      </button>
      <button id="clock-haptic-button" class="square" title="Toggle haptic feedback">
        <svg class="icons">
          <use href="/icons.svg#haptic" />
        </svg>
        <span class="button-text">Haptic</span>
      </button>
      <button id="reset-button" class="square" title="Reset to default">
        <svg class="icons">
          <use href="/icons.svg#reset" />
        </svg>
        <span class="button-text">Reset</span>
      </button>
    </div>
  </div>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/audio.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/audio.js'); ?>"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>