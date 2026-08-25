<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "drum_machine";
  $releaseName = "Drum Machine";
  $releasePage = "";
  $hasPlaylist = true;
  $availableModules = ["tool", "controls", "timeline", "playlist", "history", "panel", "meters"];
  ?>
  <meta name="keywords" content="drum machine, step sequencer, beat maker, rhythm machine, online drum machine">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div id="tool-container" class="container">
    <div class="module-body drum-machine-view border no-swipe">
      <div id="sequencer-grid" class="sequencer-grid" role="group" aria-label="16-step drum sequencer"></div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="random-button" class="square" title="Randomize pattern" aria-label="Randomize pattern">
        <svg class="icons" role="img"><use href="/icons.svg#random" /></svg>
        <span class="button-text">Random</span>
      </button>
      <button id="clear-button" class="square" title="Clear pattern" aria-label="Clear pattern">
        <svg class="icons" role="img"><use href="/icons.svg#close" /></svg>
        <span class="button-text">Clear</span>
      </button>
    </div>
  </div>

  <div id="controls-container" class="container">
    <div class="module-body controls border">
      <div class="controls-buttons wrapper">
        <button id="play-button" class="square" title="Toggle playback">
          <svg class="icons"><use href="/icons.svg#play" /></svg>
          <span class="button-text">Play</span>
        </button>
        <button id="record-button" class="square" title="Toggle recording">
          <svg class="icons"><use href="/icons.svg#record" /></svg>
          <span class="button-text">Record</span>
        </button>
        <button id="playback-button" class="square" title="Toggle recording playback">
          <svg class="icons"><use href="/icons.svg#play" /></svg>
          <span class="button-text">Playback</span>
        </button>
        <button id="stop-button" class="square" title="Stop playback">
          <svg class="icons"><use href="/icons.svg#stop" /></svg>
          <span class="button-text">Stop</span>
        </button>
        <button id="save-wav-button" class="square" title="Save WAV" aria-label="Save WAV">
          <svg class="icons"><use href="/icons.svg#download" /></svg>
          <span class="button-text">Save</span>
        </button>
        <button id="tap-button" class="square" title="Tap tempo">
          <svg class="icons"><use href="/icons.svg#tap_pad" /></svg>
          <span class="button-text">Tap</span>
        </button>
        <button id="toggle-sound-button" class="square" title="Toggle sound">
          <svg class="icons"><use href="/icons.svg#sound" /></svg>
          <span class="button-text">Sound</span>
        </button>
        <button id="haptic-button" class="square" title="Toggle haptic feedback">
          <svg class="icons"><use href="/icons.svg#haptic" /></svg>
          <span class="button-text">Haptic</span>
        </button>
        <button id="reset-button" class="square" title="Reset to default">
          <svg class="icons"><use href="/icons.svg#reset" /></svg>
          <span class="button-text">Reset</span>
        </button>
      </div>

      <div class="controls-values wrapper">
        <div class="pair">
          <label for="bpm-input" title="Beats per minute">BPM:</label>
          <input type="number" id="bpm-input" min="30" max="320" step="1" value="120">
        </div>
        <div class="pair">
          <label for="swing-input" title="Swing amount">Swing:</label>
          <input type="number" id="swing-input" min="0" max="50" step="1" value="0">
        </div>
        <div class="pair">
          <label for="pattern-select" title="Pattern preset">Pattern:</label>
          <select id="pattern-select">
            <option value="basic">Basic</option>
            <option value="four_floor">Four On Floor</option>
            <option value="breakbeat">Breakbeat</option>
            <option value="electro">Electro</option>
            <option value="empty">Empty</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div class="pair">
          <label for="kit-select" title="Drum kit">Kit:</label>
          <select id="kit-select">
            <option value="classic">Classic</option>
            <option value="deep">Deep</option>
            <option value="tight">Tight</option>
            <option value="bright">Bright</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div class="pair">
          <label for="length-select" title="Pattern length">Length:</label>
          <select id="length-select">
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="12">12</option>
            <option value="16" selected>16</option>
          </select>
        </div>
        <div class="pair">
          <label for="voice-select" title="Selected voice">Voice:</label>
          <select id="voice-select">
            <option value="kick">Kick</option>
            <option value="snare">Snare</option>
            <option value="hat">Hi-hat</option>
            <option value="perc">Perc</option>
          </select>
        </div>
        <div class="pair">
          <label for="pitch-input" title="Voice pitch">Pitch:</label>
          <input type="number" id="pitch-input" step="1">
        </div>
        <div class="pair">
          <label for="decay-input" title="Voice decay in milliseconds">Decay:</label>
          <input type="number" id="decay-input" step="1">
        </div>
        <div class="pair">
          <label for="tone-input" title="Voice tone">Tone:</label>
          <input type="number" id="tone-input" min="0" max="100" step="1">
        </div>
        <div class="pair">
          <label for="level-input" title="Voice level">Level:</label>
          <input type="number" id="level-input" min="0" max="100" step="1">
        </div>
        <div class="pair">
          <label for="pan-input" title="Voice pan">Pan:</label>
          <input type="number" id="pan-input" min="-100" max="100" step="1">
        </div>
      </div>

      <div class="controls-sliders">
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="tempo-decrease-button" class="square icon-only colored" title="Decrease BPM" aria-label="Decrease BPM">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_left" /></svg>
            </button>
            <input type="range" id="tempo-slider" min="30" max="320" step="1" value="120" aria-label="Tempo">
            <button id="tempo-increase-button" class="square icon-only colored" title="Increase BPM" aria-label="Increase BPM">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_right" /></svg>
            </button>
          </div>
        </div>
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="swing-decrease-button" class="square icon-only colored" title="Decrease swing" aria-label="Decrease swing">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_left" /></svg>
            </button>
            <input type="range" id="swing-slider" class="labeled-range" data-label="S W I N G" min="0" max="50" step="1" value="0" aria-label="Swing">
            <button id="swing-increase-button" class="square icon-only colored" title="Increase swing" aria-label="Increase swing">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_right" /></svg>
            </button>
          </div>
        </div>
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="volume-decrease-button" class="square icon-only colored" title="Decrease volume" aria-label="Decrease volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_left" /></svg>
            </button>
            <input type="range" id="volume-slider" min="0" max="100" step="1" value="80" aria-label="Volume">
            <button id="volume-increase-button" class="square icon-only colored" title="Increase volume" aria-label="Increase volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_right" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="timeline-container" class="container">
    <div class="module-body canvas-container border">
      <canvas id="drum-roll" role="img" aria-label="Drum Machine playback timeline"></canvas>
    </div>
    <div class="module-footer wrapper colored">
      <button id="timeline-guides-button" title="Toggle playback guides">
        <svg class="icons" role="img"><use href="/icons.svg#guides" /></svg>
        <span class="button-text">Guides</span>
      </button>
      <button id="timeline-bright-button" title="Toggle bright guides">
        <svg class="icons" role="img"><use href="/icons.svg#sun" /></svg>
        <span class="button-text">Bright</span>
      </button>
    </div>
  </div>

  <div id="playlist-container" class="container">
    <div class="module-body standard border">
      <div class="playlist-table scrollable">
        <table class="recording-playlist-data">
          <thead>
            <tr>
              <th class="recording-col-index">#</th>
              <th class="recording-col-name">Recording</th>
              <th class="recording-col-preview">Preview</th>
              <th class="recording-col-duration">Duration</th>
              <th class="recording-col-hits">Hits</th>
              <th class="recording-col-bpm">BPM</th>
              <th class="recording-col-added">Added</th>
              <th class="recording-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody id="recording-playlist-items"></tbody>
          <tfoot>
            <tr>
              <td colspan="8">
                <span class="recording-playlist-summary">Recordings: <span id="recording-playlist-count">0</span></span>
                <span class="recording-playlist-summary">Total duration: <span id="recording-playlist-duration">00:00:000</span></span>
                <span class="recording-playlist-summary">Total hits: <span id="recording-playlist-hits">0</span></span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="playlist-previous-button" class="square" title="Previous recording" aria-label="Previous recording">
        <svg class="icons" role="img"><use href="/icons.svg#skip_left" /></svg>
        <span class="button-text">Previous</span>
      </button>
      <button id="playlist-next-button" class="square" title="Next recording" aria-label="Next recording">
        <svg class="icons" role="img"><use href="/icons.svg#skip_right" /></svg>
        <span class="button-text">Next</span>
      </button>
      <button id="playlist-clear-button" class="square" title="Clear recordings" aria-label="Clear recordings">
        <svg class="icons" role="img"><use href="/icons.svg#delete" /></svg>
        <span class="button-text">Clear</span>
      </button>
      <button id="playlist-load-button" class="square" title="Import recordings" aria-label="Import recordings">
        <svg class="icons" role="img"><use href="/icons.svg#open" /></svg>
        <span class="button-text">Open</span>
      </button>
      <button id="playlist-save-button" class="square" title="Export recordings" aria-label="Export recordings">
        <svg class="icons" role="img"><use href="/icons.svg#download" /></svg>
        <span class="button-text">Save</span>
      </button>
    </div>
    <input type="file" id="playlist-file-input" accept="application/json,.json">
  </div>

  <div id="history-container" class="container">
    <div class="module-body module-history-body border">
      <div id="pattern-history-table" class="playlist-table scrollable" role="region" aria-label="Pattern edit history">
        <table class="recording-playlist-data history-playlist-data">
          <thead>
            <tr>
              <th class="recording-col-index">#</th>
              <th class="history-col-icon">Type</th>
              <th class="history-col-label">Change</th>
              <th class="history-col-time">Time</th>
            </tr>
          </thead>
          <tbody id="pattern-history-list" role="listbox" aria-label="Pattern edit history"></tbody>
        </table>
      </div>
      <textarea id="pattern-history-code" class="module-history-code" aria-label="Pattern history code" readonly hidden></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="history-sort-button" class="square" title="SORT: Descending" aria-label="Sort history" aria-pressed="true">
        <svg class="icons" role="img"><use href="/icons.svg#arrow_up_down" /></svg>
        <span class="button-text">Sort</span>
      </button>
      <button id="history-view-button" class="square" title="VIEW: List" aria-label="Change History view" aria-pressed="false">
        <svg class="icons" role="img"><use href="/icons.svg#view_list" /></svg>
        <span class="button-text">View</span>
      </button>
      <button id="history-undo-button" class="square" title="Undo pattern change" aria-label="Undo pattern change">
        <svg class="icons" role="img"><use href="/icons.svg#undo" /></svg>
        <span class="button-text">Undo</span>
      </button>
      <button id="history-redo-button" class="square" title="Redo pattern change" aria-label="Redo pattern change">
        <svg class="icons" role="img"><use href="/icons.svg#redo" /></svg>
        <span class="button-text">Redo</span>
      </button>
    </div>
  </div>

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="pattern-text" spellcheck="false" aria-label="Drum Machine pattern data" placeholder="Drum Machine pattern data will appear here."></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="open-button" class="square" title="Open pattern">
        <svg class="icons"><use href="/icons.svg#open" /></svg>
        <span class="button-text">Open</span>
      </button>
      <button id="save-button" class="square" title="Save pattern">
        <svg class="icons"><use href="/icons.svg#download" /></svg>
        <span class="button-text">Save</span>
      </button>
      <button id="apply-button" class="square" title="Apply pattern data">
        <svg class="icons"><use href="/icons.svg#check" /></svg>
        <span class="button-text">Apply</span>
      </button>
      <button id="copy-button" class="square" title="Copy pattern">
        <svg class="icons"><use href="/icons.svg#copy" /></svg>
        <span class="button-text">Copy</span>
      </button>
    </div>
    <input type="file" id="file-input" accept="application/json,.json,.txt">
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/meters.php"); ?>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/audio.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/audio.js'); ?>"></script>
  <script src="/js/history.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/history.js'); ?>"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>