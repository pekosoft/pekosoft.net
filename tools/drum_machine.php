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
      <div id="sequencer-grid" class="sequencer-grid pad-mode" role="group" aria-label="Four drum pads"></div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="mode-button" class="square button-on" title="Switch to grid" aria-label="Mode" aria-pressed="true" aria-controls="sequencer-grid">
        <svg class="icons" role="img"><use href="/icons.svg#drum_machine" /></svg>
        <span class="button-text">Mode</span>
      </button>
      <button id="blink-button" class="square" title="Toggle blink" aria-pressed="false">
        <svg class="icons" role="img"><use href="/icons.svg#blink" /></svg>
        <span class="button-text">Blink</span>
      </button>
      <button id="snap-button" class="square" title="Toggle snap" aria-pressed="true">
        <svg class="icons" role="img"><use href="/icons.svg#snap" /></svg>
        <span class="button-text">Snap</span>
      </button>
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
    <div id="voice-menu-controls" class="module-panel-menu" hidden>
      <div id="voice-menu-values" class="controls-values wrapper"></div>
    </div>
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
        <button id="loop-button" class="square" title="Toggle loop" aria-pressed="false">
          <svg class="icons"><use href="/icons.svg#loop" /></svg>
          <span class="button-text">Loop</span>
        </button>
        <button id="stop-button" class="square" title="Stop playback">
          <svg class="icons"><use href="/icons.svg#stop" /></svg>
          <span class="button-text">Stop</span>
        </button>
        <button id="add-to-playlist-button" class="square" title="Add current pattern to Playlist" aria-label="Add to Playlist">
          <svg class="icons"><use href="/icons.svg#plus" /></svg>
          <span class="button-text">Add to Playlist</span>
        </button>
        <button id="save-wav-button" class="square" title="Save WAV" aria-label="Save WAV">
          <svg class="icons"><use href="/icons.svg#download" /></svg>
          <span class="button-text">Save</span>
        </button>
        <button id="tap-button" class="square" title="Tap tempo">
          <svg class="icons"><use href="/icons.svg#tap_pad" /></svg>
          <span class="button-text">Tap</span>
        </button>
        <button id="half-button" class="square" title="Halve the BPM">
          <svg class="icons"><use href="/icons.svg#triangle_down" /></svg>
          <span class="button-text">Half</span>
        </button>
        <button id="double-button" class="square" title="Double the BPM">
          <svg class="icons"><use href="/icons.svg#triangle_up" /></svg>
          <span class="button-text">Double</span>
        </button>
        <button id="metronome-button" class="square" title="Toggle metronome" aria-pressed="false">
          <svg class="icons"><use href="/icons.svg#metronome" /></svg>
          <span class="button-text">Metronome</span>
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
          <label for="count-in-select" title="Count beats before recording">Count-in:</label>
          <select id="count-in-select">
            <option value="0">Off</option>
            <option value="1" selected>One bar</option>
            <option value="2">Two bars</option>
            <option value="4">Four bars</option>
          </select>
        </div>
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
          <label for="length-select" title="Set pattern and recording length in steps">Length:</label>
          <select id="length-select">
            <option value="custom" hidden disabled>Recorded length</option>
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
      <div class="controls-knobs wrapper">
        <div class="controls-knob"><button id="pitch-knob" class="knob-control" type="button" title="Adjust pitch" aria-label="Pitch"></button><span>Pitch</span></div>
        <div class="controls-knob"><button id="decay-knob" class="knob-control" type="button" title="Adjust decay" aria-label="Decay"></button><span>Decay</span></div>
        <div class="controls-knob"><button id="tone-knob" class="knob-control" type="button" title="Adjust tone" aria-label="Tone"></button><span>Tone</span></div>
        <div class="controls-knob"><button id="level-knob" class="knob-control" type="button" title="Adjust level" aria-label="Level"></button><span>Level</span></div>
        <div class="controls-knob"><button id="pan-knob" class="knob-control" type="button" title="Adjust pan" aria-label="Pan"></button><span>Pan</span></div>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <output id="recording-status" role="status" aria-live="polite">Ready</output>
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
        <table class="recording-playlist-data" data-cards-key="drum_machine.playlist_table_view" data-cards-button="playlist-view-button" data-cards-heading="Recording">
          <thead>
            <tr>
              <th class="recording-col-index" title="Recording number">#</th>
              <th class="recording-col-name" title="Recording name">Recording</th>
              <th class="recording-col-preview" title="Recording preview">Preview</th>
              <th class="recording-col-duration" title="Recording duration">Duration</th>
              <th class="recording-col-hits" title="Number of hits">Hits</th>
              <th class="recording-col-bpm" title="Recording BPM">BPM</th>
              <th class="recording-col-added" title="Added to playlist">Added</th>
              <th class="recording-col-play" title="Play recording">Play</th>
              <th class="recording-col-remove" title="Remove recording">Remove</th>
            </tr>
          </thead>
          <tbody id="recording-playlist-items"></tbody>
          <tfoot>
            <tr>
              <td colspan="9">
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
      <button id="playlist-view-button" class="square" type="button" title="Switch to cards" aria-pressed="false" data-help-release="index" data-help-entry="Table view">
        <svg class="icons"><use href="/icons.svg#view_list" /></svg>
        <span class="button-text">View</span>
      </button>
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
        <table class="recording-playlist-data history-playlist-data" data-cards-heading="Change">
          <thead>
            <tr>
              <th class="recording-col-index" title="Change number">#</th>
              <th class="history-col-icon" title="Change type">Type</th>
              <th class="history-col-label" title="Applied change">Change</th>
              <th class="history-col-time" title="Change time">Time</th>
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
