<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "audio_calculator";
  $releaseName = "Audio Calculator";
  $releasePage = "";
  ?>
  <meta name="keywords" content="audio calculator, audio resolution, bit depth and sample rate">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body grid-container border">
      <div class="grid-visualization">
        <svg id="quality-grid" viewBox="0 0 800 500" aria-label="Audio quality grid"></svg>
      </div>
    </div>
    <div class="module-footer wrapper colored"></div>
  </div>

  <!-- CONTROLS -->

  <div id="controls-container" class="container">
    <div class="module-body controls border">
      <div class="controls-buttons wrapper">
        <button id="reset-button" class="square" title="Reset to default">
          <svg class="icons" role="img">
            <use href="/icons.svg#reset" />
          </svg>
          <span class="button-text">Reset</span>
        </button>
      </div>

      <div class="controls-values wrapper">
        <div class="pair">
          <label for="duration-field" title="Song duration in seconds">Duration:</label>
          <input type="number" id="duration-field" min="0" step="0.1" value="60">
        </div>

        <div class="pair">
          <label for="bit-depth-field" title="Bit depth">Bit depth:</label>
          <select id="bit-depth-field">
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="20">20</option>
            <option value="24" selected>24</option>
            <option value="32">32</option>
            <option value="64">64</option>
          </select>
        </div>

        <div class="pair">
          <label for="amplitude-levels-field" title="Number of amplitude levels">Levels:</label>
          <input type="number" step="1" readonly id="amplitude-levels-field" value="0">
        </div>

        <div class="pair">
          <label for="sample-rate-field" title="Sample rate in kHz">Sam. rate:</label>
          <select id="sample-rate-field">
            <option value="8000">8</option>
            <option value="11025">11.025</option>
            <option value="16000">16</option>
            <option value="22050">22.05</option>
            <option value="32000">32</option>
            <option value="44100">44.1</option>
            <option value="48000">48</option>
            <option value="88200">88.2</option>
            <option value="96000" selected>96</option>
            <option value="176400">176.4</option>
            <option value="192000">192</option>
            <option value="352800">352.8</option>
            <option value="384000">384</option>
            <option value="705600">705.6</option>
            <option value="768000">768</option>
          </select>
        </div>

        <div class="pair">
          <label for="channels-field" title="Number of audio channels">Channels:</label>
          <select id="channels-field">
            <option value="1">1</option>
            <option value="2" selected>2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
          </select>
        </div>

        <div class="pair">
          <label for="file-size-field" title="File size in MB">Size:</label>
          <input type="number" step="0.001" readonly id="file-size-field" value="0">
        </div>

        <div class="pair">
          <label for="bit-rate-field" title="Bit rate in kb/s">Bit rate:</label>
          <input type="number" step="1" readonly id="bit-rate-field" value="0">
        </div>

        <div class="pair">
          <label for="total-samples-field" title="Total number of samples">Samples:</label>
          <input type="number" step="1" readonly id="total-samples-field" value="0">
        </div>

        <div class="pair">
          <label for="dynamic-range-field" title="Dynamic range in dB">dB range:</label>
          <input type="number" step="0.001" readonly id="dynamic-range-field" value="0">
        </div>

        <div class="pair">
          <label for="frequency-range-field" title="Frequency range in Hz">Hz range:</label>
          <input type="number" step="0.001" readonly id="frequency-range-field" value="0">
        </div>

        <div class="pair">
          <label for="preset-field" title="Common audio presets">Preset:</label>
          <select id="preset-field">
            <option value="custom">Custom</option>
            <option value="8|22050|1">Retro Game</option>
            <option value="16|32000|2">Super Nintendo</option>
            <option value="16|44100|2">CD</option>
            <option value="16|48000|2">Video</option>
            <option value="24|96000|6">DVD</option>
            <option value="24|192000|8">Blu-ray</option>
            <option value="32|192000|2">Studio</option>
            <option value="64|768000|2">High-End</option>
          </select>
        </div>
      </div>
    </div>
    <div class="module-footer wrapper colored"></div>
  </div>

  <!-- TIMELINE -->

  <div id="timeline-container" class="container">
    <div class="module-body canvas-container border"></div>
    <div class="module-footer wrapper colored"></div>
  </div>

  <!-- PANEL -->

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="audio-calculator-panel" placeholder="Audio Calculator data will appear here."></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="copy-button" class="square" title="Copy data">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">Copy</span>
      </button>
      <button id="info-display-selected-button" class="square info-display-button button-on" title="Selected value" aria-label="Selected value" aria-pressed="true" data-panel-view="selected">
        <svg class="icons">
          <use href="/icons.svg#selected" />
        </svg>
      </button>
      <button id="info-display-all-button" class="square info-display-button" title="All values" aria-label="All values" aria-pressed="false" data-panel-view="all">
        <svg class="icons">
          <use href="/icons.svg#select_all" />
        </svg>
      </button>
    </div>
  </div>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/audio_calculator.js"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>