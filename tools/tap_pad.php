<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "tap_pad";
  $releaseName = "Tap Pad";
  $releasePage = "";
  $availableModules = ["tool", "controls", "timeline", "panel", "meters"];
  ?>
  <meta name="keywords" content="tap pad, count bpm, bpm counter, bpm pad, bpm tapping, bpm tap pad, tempo tap pad, tap, tapping, tappad">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body pad-container border no-swipe">
      <button id="tap-button" class="pad">0</button>
    </div>
    <div class="module-footer wrapper colored">
      <button id="tap-play-button" class="square" title="Toggle play">
        <svg class="icons">
          <use href="/icons.svg#play" />
        </svg>
        <span class="button-text">PLAY</span>
      </button>
      <button id="tap-blink-button" class="square" title="Toggle blink">
        <svg class="icons">
          <use href="/icons.svg#blink" />
        </svg>
        <span class="button-text">BLINK</span>
      </button>
      <button id="tap-copy-button" class="square" title="Copy BPM">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">COPY</span>
      </button>
    </div>
  </div>

  <!-- CONTROLS -->

  <div id="controls-container" class="container">
    <div class="module-body controls border">

      <div class="controls-buttons wrapper">

        <button id="target-knob" class="knob-control" type="button" title="Adjust target BPM" aria-label="Adjust target BPM"></button>

        <button id="toggle-sound-button" class="square" title="Toggle sound">
          <svg class="icons">
            <use href="/icons.svg#sound" />
          </svg>
          <span class="button-text">SOUND</span>
        </button>

        <button id="timer-button" class="square" title="Toggle timer">
          <svg class="icons">
            <use href="/icons.svg#clock" />
          </svg>
          <span class="button-text">TIMER</span>
        </button>

        <button id="haptic-button" class="square" title="Toggle haptic feedback">
          <svg class="icons">
            <use href="/icons.svg#haptic" />
          </svg>
          <span class="button-text">HAPTIC</span>
        </button>

        <button id="reset-button" class="square" title="Reset to default">
          <svg class="icons">
            <use href="/icons.svg#reset" />
          </svg>
          <span class="button-text">RESET</span>
        </button>

      </div>

      <div class="controls-values wrapper">

        <div class="pair">
          <label for="current-bpm" title="Current BPM">Current:</label>
          <input type="number" id="current-bpm" value="0" step="any" readonly>
        </div>

        <div class="pair">
          <label for="average-bpm" title="Average BPM">Average:</label>
          <input type="number" id="average-bpm" value="0" step="any" readonly>
        </div>

        <div class="pair">
          <label for="taps" title="Number of taps">Taps:</label>
          <input type="number" id="taps" value="0" readonly>
        </div>

        <div class="pair">
          <label for="target" title="Target BPM">Target:</label>
          <input type="number" id="target" value="120" min="30" max="320" step="1">
        </div>

        <div class="pair">
          <label for="beat-sound-type" title="Beat sound">Beat:</label>
          <select id="beat-sound-type">
            <?php include $_SERVER['DOCUMENT_ROOT'] . '/elements/beat.php'; ?>
          </select>
        </div>

      </div>

      <div class="controls-sliders">
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="volume-decrease-button" class="square icon-only colored" title="Decrease volume" aria-label="Decrease volume">
              <svg class="icons" role="img">
                <use href="/icons.svg#chevron_left" />
              </svg>
            </button>
            <input type="range" id="volume-slider" min="0" max="100" value="100">
            <button id="volume-increase-button" class="square icon-only colored" title="Increase volume" aria-label="Increase volume">
              <svg class="icons" role="img">
                <use href="/icons.svg#chevron_right" />
              </svg>
            </button>
          </div>
        </div>

      </div>

    </div>
  </div>

  <!-- TIMELINE -->

  <div id="timeline-container" class="container">
    <div class="module-body canvas-container border">
      <div class="timeline-scroll scrollable">
        <svg id="tap-timeline-svg" class="timeline-svg" viewBox="0 0 4096 256" preserveAspectRatio="none" role="img" aria-label="Tap Pad timeline"></svg>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="guides-button" class="square" title="Toggle guides">
        <svg class="icons">
          <use href="/icons.svg#guides" />
        </svg>
        <span class="button-text">GUIDES</span>
      </button>

      <button id="timeline-bright-button" data-shared-timeline-bright class="square" title="Toggle bright guides">
        <svg class="icons">
          <use href="/icons.svg#sun" />
        </svg>
        <span class="button-text">BRIGHT</span>
      </button>

      <button id="current-line-button" class="square" title="Toggle Current BPM">
        <svg class="icons">
          <use href="/icons.svg#letter_c" />
        </svg>
        <span class="button-text">CURRENT</span>
      </button>

      <button id="average-line-button" class="square" title="Toggle Average BPM">
        <svg class="icons">
          <use href="/icons.svg#letter_a" />
        </svg>
        <span class="button-text">AVERAGE</span>
      </button>

      <button id="target-line-button" class="square" title="Toggle Target BPM">
        <svg class="icons">
          <use href="/icons.svg#letter_t" />
        </svg>
        <span class="button-text">TARGET</span>
      </button>
    </div>
  </div>

  <!-- PANEL -->

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="tap-pad-text" rows="16" placeholder="Tap Pad data will appear here. Each line format: {timestamp} Tap: {tap} | Current BPM: {current BPM} | Current interval: {current interval} ms | Average BPM: {average BPM} | Average interval: {average interval} ms"></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="copy-button" class="square" title="Copy data">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">COPY</span>
      </button>
    </div>
  </div>

  <!-- METERS -->

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/meters.php"); ?>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/audio.js"></script>
  <script src="/js/svg_utils.js"></script>
  <script src="/js/svg_timeline.js"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>
</body>

</html>