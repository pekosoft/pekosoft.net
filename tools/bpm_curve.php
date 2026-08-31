<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "bpm_curve";
  $releaseName = "BPM Curve";
  $releasePage = "";
  $availableModules = ["tool", "controls", "timeline", "panel", "meters"];
  ?>
  <meta name="keywords" content="bpm curve, tempo curve, tempo editor, bpm tool, curve editor, bpm envelope, tempo envelope">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div id="tool-container" class="container">
    <div class="module-body curve-view border">
      <svg id="curve-svg" viewBox="0 0 960 520" preserveAspectRatio="none" role="img" aria-label="BPM curve editor">
        <g id="curve-grid"></g>
        <path id="curve-line" class="curve-line"></path>
        <line id="curve-playhead" class="curve-playhead" x1="0" y1="20" x2="0" y2="450"></line>
        <g id="curve-points"></g>
        <g id="curve-labels"></g>
      </svg>
    </div>
    <div class="module-footer wrapper colored">
      <button id="guides-button" class="square" title="Toggle guides">
        <svg class="icons" role="img"><use href="/icons.svg#guides" /></svg>
        <span class="button-text">Guides</span>
      </button>
      <button id="beats-button" class="square" title="Toggle beats">
        <svg class="icons" role="img"><use href="/icons.svg#beat" /></svg>
        <span class="button-text">Beats</span>
      </button>
      <button id="toggle-values-button" class="square" title="Toggle values">
        <svg class="icons" role="img"><use href="/icons.svg#value" /></svg>
        <span class="button-text">Values</span>
      </button>
      <button id="save-svg-button" class="square" title="Save curve as PNG">
        <svg class="icons" role="img"><use href="/icons.svg#photo" /></svg>
        <span class="button-text">Save</span>
      </button>
      <button id="copy-svg-button" class="square" title="Copy curve as PNG">
        <svg class="icons" role="img"><use href="/icons.svg#copy" /></svg>
        <span class="button-text">Copy</span>
      </button>
    </div>
  </div>

  <div id="controls-container" class="container">
    <div class="module-body controls border">
      <div class="controls-buttons wrapper">
        <button id="play-button" class="square" title="Play preview">
          <svg class="icons" role="img"><use href="/icons.svg#play" /></svg>
          <span class="button-text">Play</span>
        </button>
        <button id="stop-button" class="square" title="Stop preview">
          <svg class="icons" role="img"><use href="/icons.svg#stop" /></svg>
          <span class="button-text">Stop</span>
        </button>
        <button id="loop-button" class="square" title="Toggle loop">
          <svg class="icons" role="img"><use href="/icons.svg#loop" /></svg>
          <span class="button-text">Loop</span>
        </button>
        <button id="sound-button" class="square" title="Toggle sound">
          <svg class="icons" role="img"><use href="/icons.svg#sound" /></svg>
          <span class="button-text">Sound</span>
        </button>
        <button id="beat-sound-button" class="square" title="Toggle beat sound">
          <svg class="icons" role="img"><use href="/icons.svg#beat" /></svg>
          <span class="button-text">Beat</span>
        </button>
        <button id="tone-button" class="square" title="Toggle continuous tone">
          <svg class="icons" role="img"><use href="/icons.svg#wavelength" /></svg>
          <span class="button-text">Tone</span>
        </button>
        <button id="prev-point-button" class="square" title="Previous point">
          <svg class="icons" role="img"><use href="/icons.svg#skip_prev" /></svg>
          <span class="button-text">Prev</span>
        </button>
        <button id="next-point-button" class="square" title="Next point">
          <svg class="icons" role="img"><use href="/icons.svg#skip_next" /></svg>
          <span class="button-text">Next</span>
        </button>
        <button id="undo-button" class="square" title="Undo">
          <svg class="icons" role="img"><use href="/icons.svg#undo" /></svg>
          <span class="button-text">Undo</span>
        </button>
        <button id="redo-button" class="square" title="Redo">
          <svg class="icons" role="img"><use href="/icons.svg#redo" /></svg>
          <span class="button-text">Redo</span>
        </button>
        <button id="select-all-points-button" class="square" title="Select all points">
          <svg class="icons" role="img"><use href="/icons.svg#select_all" /></svg>
          <span class="button-text">All</span>
        </button>
        <button id="select-no-points-button" class="square" title="Select no points">
          <svg class="icons" role="img"><use href="/icons.svg#select_none" /></svg>
          <span class="button-text">None</span>
        </button>
        <button id="move-up-button" class="square" title="Move point up">
          <svg class="icons" role="img"><use href="/icons.svg#arrow_up" /></svg>
          <span class="button-text">Up</span>
        </button>
        <button id="move-down-button" class="square" title="Move point down">
          <svg class="icons" role="img"><use href="/icons.svg#arrow_down" /></svg>
          <span class="button-text">Down</span>
        </button>
        <button id="move-left-button" class="square" title="Move point left">
          <svg class="icons" role="img"><use href="/icons.svg#arrow_left" /></svg>
          <span class="button-text">Left</span>
        </button>
        <button id="move-right-button" class="square" title="Move point right">
          <svg class="icons" role="img"><use href="/icons.svg#arrow_right" /></svg>
          <span class="button-text">Right</span>
        </button>
        <button id="add-point-button" class="square" title="Add point">
          <svg class="icons" role="img"><use href="/icons.svg#plus" /></svg>
          <span class="button-text">Add</span>
        </button>
        <button id="remove-point-button" class="square" title="Remove point">
          <svg class="icons" role="img"><use href="/icons.svg#minus" /></svg>
          <span class="button-text">Remove</span>
        </button>
        <button id="reset-button" class="square" title="Reset to default">
          <svg class="icons" role="img"><use href="/icons.svg#reset" /></svg>
          <span class="button-text">Reset</span>
        </button>
      </div>

      <div class="controls-values wrapper">
        <div class="pair">
          <label for="bpm-output" title="BPM at current position">BPM:</label>
          <input type="number" id="bpm-output" value="120" min="0" max="280" step="1">
        </div>

        <div class="pair">
          <label for="beats-output" title="Total beats under the curve">Beats:</label>
          <input type="number" id="beats-output" value="30.00" readonly>
        </div>

        <div class="pair">
          <label for="points-output" title="Curve points">Points:</label>
          <input type="number" id="points-output" value="3" readonly>
        </div>

        <div class="pair">
          <label for="position-input" title="Playhead position">Position:</label>
          <input type="number" id="position-input" value="0" min="0" max="10" step="0.01">
        </div>

        <div class="pair">
          <label for="hz-input" title="Preview frequency">Hz:</label>
          <input type="number" id="hz-input" value="440" min="20" max="20000" step="1">
        </div>

        <div class="pair">
          <label for="duration-input" title="Curve duration">Duration:</label>
          <input type="number" id="duration-input" value="10" min="1" step="0.1">
        </div>

        <div class="pair">
          <label for="beat-sound-type" title="Beat sound">Beat:</label>
          <select id="beat-sound-type">
            <?php include $_SERVER['DOCUMENT_ROOT'] . '/elements/beat.php'; ?>
          </select>
        </div>

        <div class="pair">
          <label for="tone-type" title="Tone sound">Tone:</label>
          <select id="tone-type">
            <?php include $_SERVER['DOCUMENT_ROOT'] . '/elements/tone.php'; ?>
          </select>
        </div>

        <div class="pair">
          <label for="curve-select" title="Curve interpolation">Curve:</label>
          <select id="curve-select">
            <option value="linear">Linear</option>
            <option value="exponential">Exponential</option>
            <option value="logarithmic">Logarithmic</option>
            <option value="sinusoid" selected>Sinusoid</option>
          </select>
        </div>

      </div>

      <div class="controls-sliders">
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="beat-volume-decrease-button" class="square icon-only colored" title="Decrease beat volume" aria-label="Decrease beat volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_left" /></svg>
            </button>
            <input type="range" id="beat-volume-slider" min="0" max="100" value="100">
            <button id="beat-volume-increase-button" class="square icon-only colored" title="Increase beat volume" aria-label="Increase beat volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_right" /></svg>
            </button>
          </div>
        </div>

        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="tone-volume-decrease-button" class="square icon-only colored" title="Decrease tone volume" aria-label="Decrease tone volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_left" /></svg>
            </button>
            <input type="range" id="tone-volume-slider" min="0" max="100" value="100">
            <button id="tone-volume-increase-button" class="square icon-only colored" title="Increase tone volume" aria-label="Increase tone volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_right" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="timeline-container" class="container">
    <div class="module-body canvas-container border">
      <div class="timeline-scroll scrollable">
        <svg id="curve-timeline-svg" class="timeline-svg" viewBox="0 0 4096 256" preserveAspectRatio="none" role="img" aria-label="BPM Curve timeline"></svg>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="timeline-guides-button" class="square" title="Toggle timeline guides">
        <svg class="icons" role="img"><use href="/icons.svg#guides" /></svg>
        <span class="button-text">Guides</span>
      </button>
      <button id="timeline-bright-button" class="square" title="Toggle bright guides">
        <svg class="icons" role="img"><use href="/icons.svg#sun" /></svg>
        <span class="button-text">Bright</span>
      </button>
    </div>
  </div>

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea class="info-text"></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="panel-curve-button" class="square" title="Show curve view">
        <svg class="icons" role="img"><use href="/icons.svg#wavelength" /></svg>
        <span class="button-text">Curve</span>
      </button>
      <button id="panel-values-button" class="square" title="Show values view">
        <svg class="icons" role="img"><use href="/icons.svg#value" /></svg>
        <span class="button-text">Values</span>
      </button>
      <button id="copy-button" class="square" title="Copy curve data">
        <svg class="icons" role="img"><use href="/icons.svg#copy" /></svg>
        <span class="button-text">Copy</span>
      </button>
    </div>
  </div>

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
