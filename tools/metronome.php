<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "metronome";
  $releaseName = "Metronome";
  $releasePage = "";
  $availableModules = ["tool", "controls", "timeline", "panel", "meters"];
  ?>
  <meta name="keywords" content="metronome, emulated metronome, online metronome">
  <script>
    (function() {
      const release = (window.location.pathname.split('/').pop() || 'index.php').replace(/\.php$/i, '') || 'index';
      const toolState = localStorage.getItem('module_tool_state') || localStorage.getItem(`${release}.module_tool_state`);
      const isMaximized = toolState === 'maximized';
      const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const showHeaders = localStorage.getItem('global.headers') !== 'false';
      const headerHeight = showHeaders ? 40 : 0;
      const footerHeight = 40;
      const standardContentHeight = 480 - headerHeight - footerHeight - 40;
      const maximizedContentHeight = viewportHeight - headerHeight - footerHeight - 56;
      const availableWidth = viewportWidth - (isMaximized ? 56 : 40);
      const availableHeight = isMaximized ? maximizedContentHeight : standardContentHeight;
      const maxScale = isMaximized ? 2 : 1;
      const scale = Math.max(0.25, Math.min(maxScale, availableWidth / 330, availableHeight / 402));
      document.documentElement.style.setProperty('--metronome-scale', String(scale));
    })();
  </script>
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body metronome-spacer border">
      <div class="metronome-wrapper">
        <div class="pendulum">
          <div id="metronome-weight" class="metronome-weight"></div>
        </div>
        <div class="metronome-body"></div>
        <div class="metronome-base"></div>
        <div id="base-bpm-text" class="metronome-base-text" hidden>B P M</div>
        <div id="base-tempi-text" class="metronome-base-text" hidden>T E M P I</div>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="base-bpm-button" class="square" title="Toggle BPM">
        <svg class="icons">
          <use href="/icons.svg#1_4" />
        </svg>
        <span class="button-text">BPM</span>
      </button>

      <button id="base-signature-button" class="square" title="Toggle signature">
        <svg class="icons">
          <use href="/icons.svg#beat_signature" />
        </svg>
        <span class="button-text">SIGNATURE</span>
      </button>

      <button id="base-tempi-button" class="square" title="Toggle Italian tempi">
        <svg class="icons">
          <use href="/icons.svg#italy" />
        </svg>
        <span class="button-text">TEMPI</span>
      </button>

      <button id="base-weight-button" class="square" title="Toggle pendulum weight">
        <svg class="icons">
          <use href="/icons.svg#pendulum_weight" />
        </svg>
        <span class="button-text">WEIGHT</span>
      </button>
    </div>
  </div>

  <!-- CONTROLS -->

  <div id="controls-container" class="container">
    <div class="module-body controls border">

      <div class="controls-buttons wrapper">

        <button id="toggle-play-button" class="square" title="Toggle play">
          <svg class="icons">
            <use href="/icons.svg#play" />
          </svg>
          <span class="button-text">PLAY</span>
        </button>

        <button id="stop-button" class="square" title="Stop and clear session">
          <svg class="icons">
            <use href="/icons.svg#stop" />
          </svg>
          <span class="button-text">STOP</span>
        </button>

        <button id="toggle-sound-button" class="square" title="Toggle tick sound">
          <svg class="icons">
            <use href="/icons.svg#sound" />
          </svg>
          <span class="button-text">SOUND</span>
        </button>

        <button id="toggle-accent-button" class="square" title="Toggle accent">
          <svg class="icons">
            <use href="/icons.svg#beat_accent" />
          </svg>
          <span class="button-text">ACCENT</span>
        </button>

        <button id="toggle-blink-button" class="square" title="Toggle blinking background">
          <svg class="icons">
            <use href="/icons.svg#blink" />
          </svg>
          <span class="button-text">BLINK</span>
        </button>

        <button id="half-button" class="square" title="Halve the BPM">
          <svg class="icons">
            <use href="/icons.svg#triangle_down" />
          </svg>
          <span class="button-text">HALF</span>
        </button>

        <button id="double-button" class="square" title="Double the BPM">
          <svg class="icons">
            <use href="/icons.svg#triangle_up" />
          </svg>
          <span class="button-text">DOUBLE</span>
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
          <label for="bpm-input" title="Beats Per Minute">BPM:</label>
          <input type="number" id="bpm-input" value="120">
        </div>

        <div class="pair">
          <label for="beat-sound-type" title="Beat sound">Beat: </label>
          <select id="beat-sound-type">
            <?php include $_SERVER['DOCUMENT_ROOT'] . '/elements/beat.php'; ?>
          </select>
        </div>

        <div class="pair">
          <label for="signature-type" title="Time signature">Signature: </label>
          <select id="signature-type">
            <option value="2/4">2/4</option>
            <option value="3/4">3/4</option>
            <option value="4/4" selected>4/4</option>
            <option value="5/4">5/4</option>
            <option value="6/8">6/8</option>
            <option value="7/8">7/8</option>
            <option value="9/8">9/8</option>
          </select>
        </div>

      </div>

      <div class="controls-sliders">
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="decrease-button" class="square icon-only colored" title="Decrease BPM" aria-label="Decrease BPM">
              <svg class="icons" role="img">
                <use href="/icons.svg#chevron_left" />
              </svg>
            </button>
            <input type="range" id="tempo-slider" min="30" max="320" value="120">
            <button id="increase-button" class="square icon-only colored" title="Increase BPM" aria-label="Increase BPM">
              <svg class="icons" role="img">
                <use href="/icons.svg#chevron_right" />
              </svg>
            </button>
          </div>
        </div>

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
        <svg id="metronome-timeline-svg" class="timeline-svg" viewBox="0 0 4096 256" preserveAspectRatio="none" role="img" aria-label="Metronome timeline"></svg>
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
    </div>
  </div>

  <!-- PANEL -->

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="metronome-text" placeholder="Metronome data will appear here. Each line format: {timestamp} BPM: {bpm} | Beat: {beat} | Note duration: {interval}"></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="panel-beats-button" class="square" title="Show beats history">
        <svg class="icons">
          <use href="/icons.svg#timeline" />
        </svg>
        <span class="button-text">BEATS</span>
      </button>

      <button id="panel-tempi-button" class="square" title="Show Italian tempi">
        <svg class="icons">
          <use href="/icons.svg#italy" />
        </svg>
        <span class="button-text">TEMPI</span>
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
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>
</body>

</html>