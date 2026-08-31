<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "bpm_calculator";
  $releaseName = "BPM Calculator";
  $releasePage = "";
  $availableModules = ["tool", "controls", "timeline", "panel", "meters"];
  ?>
  <meta name="keywords" content="bpm calculator, tempo calculator, bpm calculators, calculate tempo, calculate bpm, bpm, bpm to ms, bpm to hz, hz to bpm, bpm to wavelength, frequency to wavelength, beats per minute calculator, bpm table, beats per minute table, bpm to bps, bps to bpm, beats per minute, beats per second, triplet notes, dotted notes, music calculator, bpm formulas, open source bpm">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body scrollable table-container border">
      <table class="over scrollable-table">
        <thead>
          <tr>
            <th id="select-header" title="Select row">SELECT</th>
            <th id="note-header" title="Note symbol">NOTE</th>
            <th id="value-header" title="Note value">VALUE</th>
            <th id="ms-header" title="Delay time in milliseconds">MS</th>
            <th id="hz-header" title="Frequency in Hertz">HZ</th>
            <th id="cm-header" title="Wavelength in centimeters">CM</th>
            <th id="inches-header" title="Wavelength in inches">IN</th>
            <th id="usa-header" title="American name">USA</th>
            <th id="uk-header" title="British name">UK</th>
            <th id="bpm-header" title="Corresponding BPM">BPM</th>
            <th id="diff-header" title="Difference in BPM">DIFF</th>
            <th id="percent-header" title="Percentage relative to the Crotchet">PERCENT</th>
            <th id="rest-header" title="Rest symbol">REST</th>
            <th id="play-header" title="Play note duration">PLAY</th>
            <th id="close-header" title="Close row">CLOSE</th>
          </tr>
        </thead>
        <tbody id="result-table">
          <!-- Rows will be displayed here -->
        </tbody>
      </table>
      <div id="bpm-tool-menu-controls" class="module-panel-menu" hidden>
        <div class="module-panel-menu-row">
          <label class="module-panel-menu-label" for="column-preset-select" title="Presets">Presets:</label>
          <div class="module-panel-menu-buttons">
            <select id="column-preset-select">
              <option value="default">Default</option>
              <option value="full">Full</option>
              <option value="no-numbers">No numbers</option>
              <option value="no-text">No text</option>
            </select>
          </div>
        </div>

        <fieldset class="module-panel-menu-row">
          <legend class="module-panel-menu-label" title="Columns">Columns:</legend>
          <div class="module-panel-menu-buttons">
            <button id="toggle-select-button" class="square" title="Toggle select column">
              <svg class="icons">
                <use href="/icons.svg#radio_button" />
              </svg>
              <span class="button-text">Select</span>
            </button>
            <button id="toggle-note-button" class="square" title="Toggle note column">
              <svg class="icons">
                <use href="/icons.svg#tuner" />
              </svg>
              <span class="button-text">Note</span>
            </button>
            <button id="toggle-value-button" class="square" title="Toggle value column">
              <svg class="icons">
                <use href="/icons.svg#value" />
              </svg>
              <span class="button-text">Value</span>
            </button>
            <button id="toggle-ms-button" class="square" title="Toggle milliseconds column">
              <svg class="icons">
                <use href="/icons.svg#clock" />
              </svg>
              <span class="button-text">ms</span>
            </button>
            <button id="toggle-hz-button" class="square" title="Toggle Hertz column">
              <svg class="icons">
                <use href="/icons.svg#wavelength" />
              </svg>
              <span class="button-text">Hz</span>
            </button>
            <button id="toggle-cm-button" class="square" title="Toggle wavelength in centimeters column">
              <svg class="icons">
                <use href="/icons.svg#cm" />
              </svg>
              <span class="button-text">cm</span>
            </button>
            <button id="toggle-inches-button" class="square" title="Toggle wavelength in inches column">
              <svg class="icons">
                <use href="/icons.svg#cm" />
              </svg>
              <span class="button-text">in</span>
            </button>
            <button id="toggle-usa-button" class="square" title="Toggle American names column">
              <svg class="icons">
                <use href="/icons.svg#usa" />
              </svg>
              <span class="button-text">USA</span>
            </button>
            <button id="toggle-uk-button" class="square" title="Toggle British names column">
              <svg class="icons">
                <use href="/icons.svg#uk" />
              </svg>
              <span class="button-text">UK</span>
            </button>
            <button id="toggle-bpm-button" class="square" title="Toggle corresponding BPM">
              <svg class="icons">
                <use href="/icons.svg#metronome" />
              </svg>
              <span class="button-text">BPM</span>
            </button>
            <button id="toggle-diff-button" class="square" title="Toggle difference column">
              <svg class="icons">
                <use href="/icons.svg#plus_minus" />
              </svg>
              <span class="button-text">Diff</span>
            </button>
            <button id="toggle-percent-button" class="square" title="Toggle percentage column relative to the Crotchet">
              <svg class="icons">
                <use href="/icons.svg#value" />
              </svg>
              <span class="button-text">Percent</span>
            </button>
            <button id="toggle-rest-button" class="square" title="Toggle rest column">
              <svg class="icons">
                <use href="/icons.svg#tuner_off" />
              </svg>
              <span class="button-text">Rest</span>
            </button>
            <button id="toggle-play-button-column" class="square" title="Toggle play column">
              <svg class="icons">
                <use href="/icons.svg#play" />
              </svg>
              <span class="button-text">Play</span>
            </button>
            <button id="toggle-close-button" class="square" title="Toggle close column">
              <svg class="icons">
                <use href="/icons.svg#close" />
              </svg>
              <span class="button-text">Close</span>
            </button>
          </div>
        </fieldset>

        <fieldset class="module-panel-menu-row">
          <legend class="module-panel-menu-label" title="Rows">Rows:</legend>
          <div class="module-panel-menu-buttons">
            <button id="base-mode-button" class="square" title="Toggle base notes rows">
              <svg class="icons">
                <use href="/icons.svg#1_4" />
              </svg>
              <span class="button-text">Base</span>
            </button>
            <button id="dotted-mode-button" class="square" title="Toggle dotted notes rows">
              <svg class="icons">
                <use href="/icons.svg#1_4_dotted" />
              </svg>
              <span class="button-text">Dotted</span>
            </button>
            <button id="triplet-mode-button" class="square" title="Toggle triplet notes rows">
              <svg class="icons">
                <use href="/icons.svg#triplet" />
              </svg>
              <span class="button-text">Triplet</span>
            </button>
          </div>
        </fieldset>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="sort-button" class="square" title="Sort rows">
        <svg class="icons">
          <use href="/icons.svg#arrow_up_down" />
        </svg>
        <span id="sort-button-text" class="button-text">Sort</span>
      </button>

      <button id="tool-copy-button" class="square" title="Copy visible values">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">Copy</span>
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
          <span class="button-text">Play</span>
        </button> <button id="stop-button" class="square" title="Stop playback">
          <svg class="icons">
            <use href="/icons.svg#stop" />
          </svg>
          <span class="button-text">Stop</span>
        </button> <button id="toggle-sound-button" class="square" title="Toggle sound">
          <svg class="icons">
            <use href="/icons.svg#sound" />
          </svg>
          <span class="button-text">Sound</span>
        </button>
        <button id="toggle-loop-button" class="square" title="Toggle loop">
          <svg class="icons">
            <use href="/icons.svg#loop" />
          </svg>
          <span class="button-text">Loop</span>
        </button>

        <button id="half-button" class="square" title="Halve the BPM">
          <svg class="icons">
            <use href="/icons.svg#triangle_down" />
          </svg>
          <span class="button-text">Half</span>
        </button>
        <button id="double-button" class="square" title="Double the BPM">
          <svg class="icons">
            <use href="/icons.svg#triangle_up" />
          </svg>
          <span class="button-text">Double</span>
        </button>
        <button id="select-none-button" class="square" title="Select none">
          <svg class="icons">
            <use href="/icons.svg#select_none" />
          </svg>
          <span class="button-text">Select None</span>
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
          <label for="bpm-input" title="Beats Per Minute">BPM:</label>
          <input type="number" id="bpm-input" value="120">
        </div>

        <div class="pair">
          <label for="spb-field" title="Seconds Per Beat">SPB:</label>
          <input type="number" id="spb-field" step="0.001">
        </div>

        <div class="pair">
          <label for="bps-field" title="Beats Per Second">BPS:</label>
          <input type="number" id="bps-field" step="0.001">
        </div>

        <div class="pair">
          <label for="position-field" title="Current playback position in milliseconds">Position:</label>
          <input type="number" id="position-field" step="0.001" value="0.000" readonly>
        </div>

        <div class="pair">
          <label for="beat-field" title="Current beat number">Current:</label>
          <input type="number" id="beat-field" step="1" value="0" readonly>
        </div>

        <div class="pair">
          <label for="view-mode" title="Visualization mode">Mode:</label>
          <select id="view-mode">
            <option value="single">Single beat</option>
            <option value="all">All beats</option>
          </select>
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
      <div class="scrollable">
        <svg id="bpm-timeline-svg" class="timeline-svg" viewBox="0 0 4096 256" preserveAspectRatio="none" role="img" aria-label="BPM Calculator timeline"></svg>
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

      <button id="toggle-playhead-button" class="square" title="Toggle playhead">
        <svg class="icons">
          <use href="/icons.svg#playhead" />
        </svg>
        <span class="button-text">Playhead</span>
      </button>

      <button id="follow-button" class="square" title="Follow playback position">
        <svg class="icons">
          <use href="/icons.svg#asterisk" />
        </svg>
        <span class="button-text">Follow</span>
      </button>
    </div>
  </div>

  <!-- PANEL -->

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="bpm-text" placeholder=""></textarea>
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
  <script src="/js/audio.js"></script>
  <script src="/js/svg_utils.js"></script>
  <script src="/js/svg_timeline.js"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>
</body>

</html>