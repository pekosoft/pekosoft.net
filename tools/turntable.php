<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "turntable";
  $releaseName = "Turntable";
  $releasePage = "";
  $availableModules = ["tool", "controls", "timeline", "panel", "meters"];
  ?>
  <meta name="keywords" content="turntable, record player, emulated turntable, turntable simulator, record player simulator, emulated turntable">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body standard record-player border no-swipe">
      <div class="turntable-wrapper">
        <div class="turntable">
          <div class="rotation-line"></div>
        </div>
        <div class="diameter-overlay">
          <div class="center-hole"></div>
          <div class="label-overlay label-small hidden"></div>
          <div class="label-overlay label-large hidden"></div>
          <div class="diameter-ring ring-7 hidden"></div>
          <div class="diameter-ring ring-10 hidden"></div>
          <div class="diameter-ring ring-12 hidden"></div>
        </div>
      </div>

      <div id="turntable-tool-menu-controls" class="module-panel-menu" hidden>
        <fieldset class="module-panel-menu-row">
          <legend class="module-panel-menu-label" title="Diameters">Diameters:</legend>
          <div class="module-panel-menu-buttons">
            <button id="7in-button" class="square" title="Toggle 7 inch outline">
              <svg class="icons">
                <use href="/icons.svg#vinyl_7" />
              </svg>
              <span class="button-text">7"</span>
            </button>

            <button id="10in-button" class="square" title="Toggle 10 inch outline">
              <svg class="icons">
                <use href="/icons.svg#vinyl_10" />
              </svg>
              <span class="button-text">10"</span>
            </button>

            <button id="12in-button" class="square button-on" title="Toggle 12 inch outline">
              <svg class="icons">
                <use href="/icons.svg#vinyl_12" />
              </svg>
              <span class="button-text">12"</span>
            </button>
          </div>
        </fieldset>

        <fieldset class="module-panel-menu-row">
          <legend class="module-panel-menu-label" title="Labels">Labels:</legend>
          <div class="module-panel-menu-buttons">
            <button id="label-s-button" class="square" title="Toggle small center label">
              <svg class="icons">
                <use href="/icons.svg#label_s" />
              </svg>
              <span class="button-text">Label S</span>
            </button>

            <button id="label-l-button" class="square" title="Toggle large center label">
              <svg class="icons">
                <use href="/icons.svg#label_l" />
              </svg>
              <span class="button-text">Label L</span>
            </button>
          </div>
        </fieldset>

        <fieldset class="module-panel-menu-row">
          <legend class="module-panel-menu-label" title="Holes">Holes:</legend>
          <div class="module-panel-menu-buttons">
            <button id="standard-hole-button" class="square button-on" title="Use standard spindle hole">
              <svg class="icons">
                <use href="/icons.svg#radio_button" />
              </svg>
              <span class="button-text">Standard</span>
            </button>

            <button id="jukebox-button" class="square" title="Toggle large jukebox spindle hole">
              <svg class="icons">
                <use href="/icons.svg#jukebox" />
              </svg>
              <span class="button-text">Jukebox</span>
            </button>
          </div>
        </fieldset>
      </div>
    </div>
    <div class="module-footer wrapper colored">
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
          <span class="button-text">Play</span>
        </button>

        <button id="stop-button" class="square" title="Stop and reset rotation">
          <svg class="icons">
            <use href="/icons.svg#stop" />
          </svg>
          <span class="button-text">Stop</span>
        </button>

        <button id="toggle-sound-button" class="square" title="Toggle reference tone">
          <svg class="icons">
            <use href="/icons.svg#sound" />
          </svg>
          <span class="button-text">Sound</span>
        </button>

        <!-- RPM Buttons -->
        <button id="8-button" class="square" data-rpm="8" title="Set RPM to 8">
          <svg class="icons">
            <use href="/icons.svg#rpm_8" />
          </svg>
          <span class="button-text">8</span>
        </button>

        <button id="16-button" class="square" data-rpm="16.667" title="Set RPM to 16 ⅔">
          <svg class="icons">
            <use href="/icons.svg#rpm_16" />
          </svg>
          <span class="button-text">16 ⅔</span>
        </button>

        <button id="22-button" class="square" data-rpm="22.5" title="Set RPM to 22.5">
          <svg class="icons">
            <use href="/icons.svg#rpm_22" />
          </svg>
          <span class="button-text">22.5</span>
        </button>

        <button id="33-button" class="square" data-rpm="33.333" title="Set RPM to 33 ⅓">
          <svg class="icons">
            <use href="/icons.svg#rpm_33" />
          </svg>
          <span class="button-text">33 ⅓</span>
        </button>

        <button id="45-button" class="square" data-rpm="45" title="Set RPM to 45">
          <svg class="icons">
            <use href="/icons.svg#rpm_45" />
          </svg>
          <span class="button-text">45</span>
        </button>

        <button id="78-button" class="square" data-rpm="78" title="Set RPM to 78">
          <svg class="icons">
            <use href="/icons.svg#rpm_78" />
          </svg>
          <span class="button-text">78</span>
        </button>

        <!-- Toggle Features -->
        <button id="reverse-button" class="square" title="Toggle rotation direction">
          <svg class="icons">
            <use href="/icons.svg#reverse" />
          </svg>
          <span class="button-text">Reverse</span>
        </button>

        <button id="torque-button" class="square button-on" title="Toggle torque emulation">
          <svg class="icons">
            <use href="/icons.svg#torque" />
          </svg>
          <span class="button-text">Torque</span>
        </button>

        <button id="haptic-button" class="square" title="Toggle haptic feedback">
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

      <div class="controls-values wrapper">

        <div class="pair">
          <label for="rpm-input" title="Rounds Per Minute">RPM:</label>
          <input type="number" id="rpm-input" value="33.333" step="0.001">
        </div>

        <div class="pair">
          <label for="actual-speed" title="Current platter speed">Speed:</label>
          <input type="number" id="actual-speed" readonly>
        </div>

        <div class="pair">
          <label for="spr-field" title="Seconds Per Round">SPR:</label>
          <input type="number" id="spr-field" step="0.001">
        </div>

        <div class="pair">
          <label for="dps-field" title="Degrees Per Second">DPS:</label>
          <input type="number" id="dps-field" step="0.001">
        </div>

        <div class="pair">
          <label for="tone-type" title="Tone type">Tone: </label>
          <select id="tone-type">
            <?php include $_SERVER['DOCUMENT_ROOT'] . '/elements/tone.php'; ?>
          </select>
        </div>

        <div class="pair">
          <label for="hz-field" title="Reference tone frequency">HZ:</label>
          <input type="number" id="hz-field" readonly>
        </div>

      </div>

      <div class="controls-sliders">
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="decrease-button" class="square icon-only colored" title="Decrease RPM" aria-label="Decrease RPM">
              <svg class="icons" role="img">
                <use href="/icons.svg#chevron_left" />
              </svg>
            </button>
            <input type="range" id="tempo-slider" min="1" max="100" value="33.333">
            <button id="increase-button" class="square icon-only colored" title="Increase RPM" aria-label="Increase RPM">
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
            <input type="range" id="volume-slider" min="0" max="100" value="20">
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
      <svg id="turntable-timeline-svg" class="timeline-svg" viewBox="0 0 4096 256" preserveAspectRatio="none" role="img" aria-label="Turntable timeline"></svg>
    </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="guides-button" class="square" title="Toggle guides">
        <svg class="icons">
          <use href="/icons.svg#guides" />
        </svg>
        <span class="button-text">Guides</span>
      </button>
      <button id="timeline-bright-button" data-shared-timeline-bright class="square" title="Toggle bright guides">
        <svg class="icons">
          <use href="/icons.svg#sun" />
        </svg>
        <span class="button-text">Bright</span>
      </button>
    </div>
  </div>

  <!-- PANEL -->

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="turntable-text" placeholder="Turntable data will appear here. Each line format: {timestamp} RPM: {rpm} | SPR: {spr} | DPS: {dps}"></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="copy-button" class="square" title="Copy data">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">Copy</span>
      </button>
    </div>
  </div>

  <!-- METERS -->

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/meters.php"); ?>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/svg_utils.js"></script>
  <script src="/js/svg_timeline.js"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>
</body>

</html>