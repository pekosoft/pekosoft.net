<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "bpm_circle";
  $releaseName = "BPM Circle";
  $releasePage = "";
  $availableModules = ["tool", "controls", "timeline", "panel", "meters"];
  ?>
  <meta name="keywords" content="bpm circle, rhythm visualizer, polyrhythm visualizer, circular metronome, timeline metronome, beat divisions, tempo visualizer, bpm tool">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div id="tool-container" class="container">
    <div class="module-body circle-view border">
      <svg viewBox="-150 -150 300 300" preserveAspectRatio="xMidYMid meet">
        <line class="beat-line" x1="0" y1="0" x2="0" y2="-147"></line>

        <g class="note-128">
          <g class="segments"></g>
        </g>
        <g class="note-64">
          <g class="segments"></g>
        </g>
        <g class="note-32">
          <g class="segments"></g>
        </g>
        <g class="note-16">
          <g class="segments"></g>
        </g>
        <g class="note-8">
          <g class="segments"></g>
        </g>
        <g class="note-4">
          <g class="segments"></g>
        </g>
        <g class="note-2">
          <g class="segments"></g>
        </g>
        <g class="note-1">
          <g class="segments"></g>
        </g>
      </svg>
    </div>
    <div class="module-footer wrapper colored" id="note-value-footer"></div>
  </div>

  <div id="controls-container" class="container">
    <div class="module-body controls border">
      <div class="controls-buttons wrapper">
        <button id="toggle-play-button" title="Start playback">
          <svg class="icons" role="img">
            <use href="/icons.svg#play" />
          </svg>
          <span class="button-text">Play</span>
        </button>
        <button id="stop-button" title="Stop playback and reset position">
          <svg class="icons" role="img">
            <use href="/icons.svg#stop" />
          </svg>
          <span class="button-text">Stop</span>
        </button>

        <button id="toggle-playhead-button" title="Toggle playhead"><svg class="icons" role="img">
            <use href="/icons.svg#playhead" />
          </svg><span class="button-text">Playhead</span></button>
        <button id="hold-button" title="Hold active segment"><svg class="icons" role="img">
            <use href="/icons.svg#pause" />
          </svg><span class="button-text">Hold</span></button>
        <button id="loop-button" title="Loop playback"><svg class="icons" role="img">
            <use href="/icons.svg#loop" />
          </svg><span class="button-text">Loop</span></button>
        <button id="sound-master-button" title="Toggle all sounds"><svg class="icons" role="img">
            <use href="/icons.svg#sound" />
          </svg><span class="button-text">Sound</span></button>

        <button id="all-button" title="Select all notes"><svg class="icons" role="img">
            <use href="/icons.svg#select_all" />
          </svg><span class="button-text">All</span></button>
        <button id="none-button" title="Deselect all notes"><svg class="icons" role="img">
            <use href="/icons.svg#select_none" />
          </svg><span class="button-text">None</span></button>
        <button id="prev-button" title="Previous note division"><svg class="icons" role="img">
            <use href="/icons.svg#decrease" />
          </svg><span class="button-text">Prev</span></button>
        <button id="next-button" title="Next note division"><svg class="icons" role="img">
            <use href="/icons.svg#increase" />
          </svg><span class="button-text">Next</span></button>

        <button id="reset-button" title="Reset to default">
          <svg class="icons" role="img">
            <use href="/icons.svg#reset" />
          </svg>
          <span class="button-text">Reset</span>
        </button>
      </div>

      <div class="controls-values wrapper">
        <div class="pair">
          <label for="bpmInput" title="BPM">BPM:</label>
          <input type="number" id="bpmInput" value="30" min="1" max="300">
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
            <button id="decrease-button" class="tempo-button square icon-only colored" title="Decrease BPM" aria-label="Decrease BPM">
              <svg class="icons" role="img">
                <use href="/icons.svg#chevron_left" />
              </svg>
            </button>
            <input type="range" id="tempo-slider" min="1" max="300" value="30">
            <button id="increase-button" class="tempo-button square icon-only colored" title="Increase BPM" aria-label="Increase BPM">
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

  <div id="timeline-container" class="container">
    <div class="module-body canvas-container border">
      <div class="timeline-scroll scrollable">
        <svg class="timeline-svg" viewBox="0 0 800 200" preserveAspectRatio="none">
          <g class="linear-note-128"></g>
          <g class="linear-note-64"></g>
          <g class="linear-note-32"></g>
          <g class="linear-note-16"></g>
          <g class="linear-note-8"></g>
          <g class="linear-note-4"></g>
          <g class="linear-note-2"></g>
          <g class="linear-note-1"></g>
          <line class="linear-playhead" x1="0" y1="0" x2="0" y2="200"></line>
        </svg>
      </div>
    </div>
    <div class="module-footer wrapper colored"></div>
  </div>

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea class="info-text"></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="copy-button" class="square" title="Copy data">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">Copy</span>
      </button>
      <button id="info-display-selected-button" class="info-display-button button-on" title="Selected segment" aria-label="Selected segment">
        <svg class="icons">
          <use href="/icons.svg#field" />
        </svg>
        <span class="button-text">Selected</span>
      </button>
      <button id="info-display-active-button" class="info-display-button" title="Active notes" aria-label="Active notes">
        <svg class="icons">
          <use href="/icons.svg#sound" />
        </svg>
        <span class="button-text">Active</span>
      </button>
      <button id="info-display-all-button" class="info-display-button" title="All notes" aria-label="All notes">
        <svg class="icons">
          <use href="/icons.svg#timeline" />
        </svg>
        <span class="button-text">All</span>
      </button>
    </div>
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/meters.php"); ?>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/audio.js"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>