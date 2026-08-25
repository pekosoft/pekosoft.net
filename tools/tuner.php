<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "tuner";
  $releaseName = "Tuner";
  $releasePage = "";
  $availableModules = ["tool", "controls", "timeline", "panel", "meters"];
  ?>
  <meta name="keywords" content="tuner, guitar tuner, bass tuner, chromatic tuner, reference tone, pitch detection">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body standard border tuner-stage-wrapper">
      <div class="tuner-stage">
        <div class="tuner-readout-block">
          <div id="detected-note" class="tuner-detected-note">--</div>
          <div id="detected-hz" class="tuner-detected-hz">0.00 HZ</div>
          <div id="cents-readout" class="tuner-cents">0 cents</div>
          <div id="status-readout" class="tuner-status">Mic off</div>
        </div>

        <div class="tuner-meter" aria-label="Pitch deviation meter">
          <div class="tuner-meter-label tuner-meter-label-left">-50</div>
          <div class="tuner-meter-label tuner-meter-label-center">0</div>
          <div class="tuner-meter-label tuner-meter-label-right">+50</div>
          <div class="tuner-meter-track">
            <div class="tuner-meter-center-line"></div>
            <div id="tuner-needle" class="tuner-needle"></div>
          </div>
        </div>

        <div id="target-grid" class="tuner-target-grid"></div>
      </div>
    </div>

    <div class="module-footer wrapper colored">
      <button id="listen-button" class="square" title="Toggle microphone listening">
        <svg class="icons">
          <use href="/icons.svg#mic" />
        </svg>
        <span class="button-text">LISTEN</span>
      </button>

      <button id="tone-button" class="square" title="Toggle reference tone playback">
        <svg class="icons">
          <use href="/icons.svg#sound" />
        </svg>
        <span class="button-text">TONE</span>
      </button>

      <button id="hold-button" class="square" title="Freeze detected readout">
        <svg class="icons">
          <use href="/icons.svg#stop" />
        </svg>
        <span class="button-text">HOLD</span>
      </button>
    </div>
  </div>

  <!-- CONTROLS -->

  <div id="controls-container" class="container">
    <div class="module-body controls border">

      <div class="controls-buttons wrapper">
        <button id="follow-button" class="square button-on" title="Follow nearest target note automatically">
          <svg class="icons">
            <use href="/icons.svg#field" />
          </svg>
          <span class="button-text">FOLLOW</span>
        </button>

        <button id="clear-panel-button" class="square" title="Clear panel output">
          <svg class="icons">
            <use href="/icons.svg#close" />
          </svg>
          <span class="button-text">CLEAR</span>
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
          <label for="profile-select" title="Current tuning profile">Profile:</label>
          <select id="profile-select">
            <option value="guitar">Guitar</option>
            <option value="bass">Bass</option>
            <option value="chromatic">Chromatic</option>
          </select>
        </div>

        <div class="pair">
          <label for="detected-note-field" title="Detected note">Detected:</label>
          <input type="text" id="detected-note-field" readonly>
        </div>

        <div class="pair">
          <label for="detected-hz-field" title="Detected frequency">HZ:</label>
          <input type="text" id="detected-hz-field" readonly>
        </div>

        <div class="pair">
          <label for="target-note-field" title="Current target note">Target:</label>
          <input type="text" id="target-note-field" readonly>
        </div>

        <div class="pair">
          <label for="target-hz-field" title="Current target frequency">Target HZ:</label>
          <input type="text" id="target-hz-field" readonly>
        </div>

        <div class="pair">
          <label for="cents-field" title="Difference from target in cents">Cents:</label>
          <input type="text" id="cents-field" readonly>
        </div>

        <div class="pair">
          <label for="chromatic-octave-input" title="Chromatic octave">Octave:</label>
          <input type="number" id="chromatic-octave-input" min="0" max="8" step="1" value="4">
        </div>

        <div class="pair">
          <label for="tone-type" title="Reference tone type">Tone:</label>
          <select id="tone-type">
            <?php include $_SERVER['DOCUMENT_ROOT'] . '/elements/tone.php'; ?>
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
            <input type="range" id="volume-slider" min="0" max="100" value="30">
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
        <svg id="tuner-timeline-svg" class="timeline-svg" viewBox="0 0 4096 256" preserveAspectRatio="none" role="img" aria-label="Tuner timeline"></svg>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="guides-button" class="square" title="Toggle timeline guides">
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
    </div>
  </div>

  <!-- PANEL -->

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="tuner-text" placeholder="Tuner data will appear here. Each line format: {timestamp} Note: {detected} | HZ: {frequency} | Target: {target} | Cents: {cents}"></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="panel-clear-button" class="square" title="Clear panel data">
        <svg class="icons">
          <use href="/icons.svg#close" />
        </svg>
        <span class="button-text">CLEAR</span>
      </button>

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
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>
