<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "visualizer";
  $releaseName = "Visualizer";
  $releasePage = "";
  $availableModules = ["tool", "controls"];
  ?>
  <meta name="keywords" content="visualizer, visualizers, bpm visualizer, bpm visualizers, tempo visualizer, tempo visualizers, beats per minute visualizer, beats per minute visualizers, bpm meter, bpm meters">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- CONTROLS -->

  <div id="controls-container" class="container">

    <div class="module-body controls border">

      <div class="controls-buttons wrapper visualizer-controls-buttons">
        <div class="visualizer-controls-top-row">
          <div class="visualizer-bpm-inline">
            <label for="bpm" title="Beats Per Minute">BPM:</label>
            <input type="number" id="bpm" value="5">
          </div>

          <button id="toggle-play-button" class="square" title="Toggle play">
            <svg class="icons">
              <use href="/icons.svg#play" />
            </svg>
            <span class="button-text">Play</span>
          </button>

          <button id="toggle-cross-button" class="square" title="Toggle crosshair">
            <svg class="icons">
              <use href="/icons.svg#crosshair" />
            </svg>
            <span class="button-text">Cross</span>
          </button>

          <button id="toggle-mask-button" class="square" title="Toggle mask">
            <svg class="icons">
              <use href="/icons.svg#mask" />
            </svg>
            <span class="button-text">Mask</span>
          </button>

          <button id="toggle-title-button" class="square" title="Toggle meter titles">
            <svg class="icons">
              <use href="/icons.svg#text" />
            </svg>
            <span class="button-text">Title</span>
          </button>

          <button id="reset-button" class="square" title="Reset to default">
            <svg class="icons">
              <use href="/icons.svg#reset" />
            </svg>
            <span class="button-text">Reset</span>
          </button>
        </div>

        <div class="visualizer-meter-buttons">
          <button id="toggle-clock-button" class="square" title="Toggle clock">
            <svg class="icons">
              <use href="/icons.svg#clock" />
            </svg>
            <span class="button-text">Clock</span>
          </button>

          <button id="toggle-cake-button" class="square" title="Toggle cake">
            <svg class="icons">
              <use href="/icons.svg#cake_diagram" />
            </svg>
            <span class="button-text">Cake</span>
          </button>

          <button id="toggle-speedometer-button" class="square" title="Toggle speedometer">
            <svg class="icons">
              <use href="/icons.svg#meter" />
            </svg>
            <span class="button-text">Speedometer</span>
          </button>

          <button id="toggle-metronome-button" class="square" title="Toggle metronome">
            <svg class="icons">
              <use href="/icons.svg#metronome" />
            </svg>
            <span class="button-text">Metronome</span>
          </button>

          <button id="toggle-ticker-button" class="square" title="Toggle ticker">
            <svg class="icons">
              <use href="/icons.svg#ticker" />
            </svg>
            <span class="button-text">Ticker</span>
          </button>

          <button id="toggle-lines-button" class="square" title="Toggle lines">
            <svg class="icons">
              <use href="/icons.svg#timeline" />
            </svg>
            <span class="button-text">Lines</span>
          </button>

          <button id="toggle-stars-button" class="square" title="Toggle stars">
            <svg class="icons">
              <use href="/icons.svg#star" />
            </svg>
            <span class="button-text">Stars</span>
          </button>

          <button id="toggle-pulse-button" class="square" title="Toggle pulse">
            <svg class="icons">
              <use href="/icons.svg#pulse" />
            </svg>
            <span class="button-text">Pulse</span>
          </button>

          <button id="toggle-blink-button" class="square" title="Toggle blink">
            <svg class="icons">
              <use href="/icons.svg#blink" />
            </svg>
            <span class="button-text">Blink</span>
          </button>
        </div>

      </div>

    </div>

  </div>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body standard wrapper border">
      <div class="meter">
        <div class="circle-outline"></div>
        <div class="clock-container">
          <div class="clock-dots-container" id="clock-dots-container"></div>
          <svg class="clock-hand" id="clock-hand" viewBox="0 0 1 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0.5" y1="100" x2="0.5" y2="0"></line>
          </svg>
        </div>
        <div class="label">CLOCK</div>
      </div>

      <div class="meter">
        <div class="circle-outline"></div>
        <div class="cake-container" id="cake-container">
          <!-- Lines will be dynamically added here -->
        </div>
        <div class="label">CAKE</div>
      </div>

      <div class="meter">
        <div class="circle-outline"></div>
        <div class="speedometer-container">
          <svg class="speedometer-needle" id="speedometer-needle" viewBox="0 0 1 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0.5" y1="100" x2="0.5" y2="0"></line>
          </svg>
          <div class="speedometer-labels" id="speedometer-labels"></div>
          <div class="total-beats" id="total-beats">Beats: 0</div>
        </div>
        <div class="label">SPEEDOMETER</div>
      </div>

      <div class="meter">
        <div class="circle-outline"></div>
        <div class="metronome-container">
          <svg class="pendulum" id="pendulum" viewBox="0 0 1 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0.5" y1="100" x2="0.5" y2="0"></line>
          </svg>
        </div>
        <div class="label">METRONOME</div>
      </div>

      <div class="meter">
        <div class="circle-outline"></div>
        <div class="ticker-container">
          <div class="ticker-text" id="ticker-text">BPM: 0</div>
        </div>
        <div class="label">TICKER</div>
      </div>

      <div class="meter">
        <div class="circle-outline"></div>
        <div class="lines-container"></div>
        <div class="label">LINES</div>
      </div>

      <div class="meter">
        <div class="circle-outline"></div>
        <div class="stars-container" id="stars-container"></div>
        <div class="label">STARS</div>
      </div>

      <div class="meter">
        <div class="circle-outline"></div>
        <div class="pulse-container"></div>
        <div class="label">PULSE</div>
      </div>

      <div class="meter">
        <div class="circle-outline"></div>
        <div class="blink-container"></div>
        <div class="label">BLINK</div>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="tool-mode-all-button" class="square button-on" title="Show all enabled meters">
        <svg class="icons">
          <use href="/icons.svg#select_all" />
        </svg>
        <span class="button-text">All</span>
      </button>

      <button id="tool-mode-single-button" class="square" title="Show one meter at a time">
        <svg class="icons">
          <use href="/icons.svg#radio_button" />
        </svg>
        <span class="button-text">One</span>
      </button>

      <button id="tool-single-prev-button" class="square" title="Previous meter in single mode">
        <svg class="icons">
          <use href="/icons.svg#skip_left" />
        </svg>
        <span class="button-text">Left</span>
      </button>

      <button id="tool-single-next-button" class="square" title="Next meter in single mode">
        <svg class="icons">
          <use href="/icons.svg#skip_right" />
        </svg>
        <span class="button-text">Right</span>
      </button>
    </div>
  </div>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>