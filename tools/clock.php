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
  <meta name="keywords" content="clock, local time, time zone, calendar, date, timer, countdown">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div id="tool-container" class="container one-module-tool">
    <div id="clock-page" class="module-body clock-page standard border scrollable">
      <div class="controls-buttons wrapper module-tabs">
        <button id="clock-mode-button" class="square button-on" title="Clock" aria-pressed="true" aria-controls="clock-mode-view" data-module-tab="Clock" data-help-entry="Clock" data-help-kind="display">
          <svg class="icons"><use href="/icons.svg#clock" /></svg>
          <span class="button-text">Clock</span>
        </button>
        <button id="calendar-mode-button" class="square" title="Calendar" aria-pressed="false" aria-controls="calendar-mode-view" data-module-tab="Calendar" data-help-entry="Calendar" data-help-kind="display">
          <svg class="icons"><use href="/icons.svg#calendar" /></svg>
          <span class="button-text">Calendar</span>
        </button>
        <button id="timer-mode-button" class="square" title="Timer" aria-pressed="false" aria-controls="timer-mode-view" data-module-tab="Timer" data-help-entry="Timer" data-help-kind="display">
          <svg class="icons"><use href="/icons.svg?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/icons.svg'); ?>#timer" /></svg>
          <span class="button-text">Timer</span>
        </button>
        <button id="countdown-mode-button" class="square" title="Countdown" aria-pressed="false" aria-controls="countdown-mode-view" data-module-tab="Countdown" data-help-entry="Countdown" data-help-kind="display">
          <svg class="icons"><use href="/icons.svg?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/icons.svg'); ?>#countdown" /></svg>
          <span class="button-text">Countdown</span>
        </button>
      </div>
      <div class="clock-views">
      <section id="clock-mode-view" class="clock-view" aria-label="Clock">
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
      </section>

      <section id="calendar-mode-view" class="clock-view" aria-label="Calendar" hidden>
        <div class="calendar-card">
          <div class="calendar-month" aria-label="Current month calendar">
            <div id="calendar-grid" class="calendar-grid"></div>
          </div>
          <div class="calendar-date-row">
            <strong id="clock-local-date">Checking...</strong>
            <strong id="calendar-month-name">Checking...</strong>
          </div>
        </div>
      </section>

      <section id="timer-mode-view" class="time-mode-view" aria-label="Timer" hidden>
        <div id="timer-display" class="time-display" role="timer" aria-label="Elapsed time">00:00:00.000</div>
      </section>

      <section id="countdown-mode-view" class="time-mode-view" aria-label="Countdown" hidden>
        <div id="countdown-display" class="time-display" role="timer" aria-label="Remaining time">00:01:00.000</div>
        <div class="countdown-fields wrapper">
          <div class="pair">
            <label for="countdown-hours">Hours:</label>
            <input id="countdown-hours" type="number" min="0" max="99" step="1" value="0" inputmode="numeric" data-help-entry="Countdown" data-help-kind="display">
          </div>
          <div class="pair">
            <label for="countdown-minutes">Minutes:</label>
            <input id="countdown-minutes" type="number" min="0" max="59" step="1" value="1" inputmode="numeric" data-help-entry="Countdown" data-help-kind="display">
          </div>
          <div class="pair">
            <label for="countdown-seconds">Seconds:</label>
            <input id="countdown-seconds" type="number" min="0" max="59" step="1" value="0" inputmode="numeric" data-help-entry="Countdown" data-help-kind="display">
          </div>
        </div>
        <div class="controls-knobs wrapper">
          <div class="controls-knob"><button id="countdown-hours-knob" class="knob-control" type="button" title="Adjust hours" aria-label="Hours" data-help-entry="Countdown" data-help-kind="display"></button><span>Hours</span></div>
          <div class="controls-knob"><button id="countdown-minutes-knob" class="knob-control" type="button" title="Adjust minutes" aria-label="Minutes" data-help-entry="Countdown" data-help-kind="display"></button><span>Minutes</span></div>
          <div class="controls-knob"><button id="countdown-seconds-knob" class="knob-control" type="button" title="Adjust seconds" aria-label="Seconds" data-help-entry="Countdown" data-help-kind="display"></button><span>Seconds</span></div>
        </div>
      </section>
      </div>
    </div>

    <div class="module-footer wrapper colored">
      <button id="time-start-button" class="square" title="Start timer" aria-pressed="false" data-help-kind="display" disabled>
        <svg class="icons">
          <use id="time-start-icon" href="/icons.svg#play" />
        </svg>
        <span id="time-start-text" class="button-text">Start</span>
      </button>
      <button id="countdown-alarm-button" class="square" title="Toggle countdown alarm" aria-pressed="false" data-help-entry="Alarm" data-help-kind="button" hidden>
        <svg class="icons"><use href="/icons.svg#bell" /></svg>
        <span class="button-text">Alarm</span>
      </button>
      <button id="time-ms-button" class="square" title="Toggle milliseconds" aria-pressed="true" data-help-entry="ms" data-help-kind="button" hidden>
        <svg class="icons"><use href="/icons.svg#decimals" /></svg>
        <span class="button-text">ms</span>
      </button>
      <button id="clock-sound-button" class="square" title="Toggle sound" aria-pressed="false">
        <svg class="icons">
          <use href="/icons.svg#sound" />
        </svg>
        <span class="button-text">Sound</span>
      </button>
      <button id="clock-haptic-button" class="square" title="Toggle haptic feedback" aria-pressed="false">
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