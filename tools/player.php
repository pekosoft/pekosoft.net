<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "player";
  $releaseName = "Player";
  $releasePage = "";
  $hasPlaylist = true;
  $availableModules = ["tool", "controls", "timeline", "playlist", "panel", "meters"];
  ?>
  <meta name="keywords" content="player, audio player, music player, audio file player, online audio player, online music player, web audio player, web music player">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body standard border">
      <div id="tool-timer-display" class="player-tool-timer" aria-live="polite">00:00:000</div>
    </div>
    <div class="module-footer wrapper colored"></div>
  </div>

  <!-- CONTROLS -->

  <div id="controls-container" class="container">
    <div class="module-body controls border">

      <input type="file" id="audio-file" accept="audio/*" multiple>

      <div class="controls-buttons wrapper">

        <button id="bass-knob" class="knob-control" type="button" title="Bass" aria-label="Bass"></button>
        <button id="treble-knob" class="knob-control" type="button" title="Treble" aria-label="Treble"></button>
        <button id="balance-knob" class="knob-control" type="button" title="Balance" aria-label="Balance"></button>
        <button id="speed-knob" class="knob-control" type="button" title="Speed" aria-label="Speed"></button>

        <button id="eject-button" class="square" title="Open files">
          <svg class="icons">
            <use href="/icons.svg#eject" />
          </svg>
          <span class="button-text">OPEN</span>
        </button>

        <button id="record-button" class="square" title="Record audio">
          <svg class="icons">
            <use href="/icons.svg#record" />
          </svg>
          <span class="button-text">RECORD</span>
        </button>

        <button id="play-button" class="square" title="Toggle play">
          <svg class="icons">
            <use href="/icons.svg#play" />
          </svg>
          <span class="button-text">PLAY</span>
        </button>

        <button id="prev-button" class="square" title="Previous track">
          <svg class="icons">
            <use href="/icons.svg#skip_left" />
          </svg>
          <span class="button-text">PREV</span>
        </button>

        <button id="next-button" class="square" title="Next track">
          <svg class="icons">
            <use href="/icons.svg#skip_right" />
          </svg>
          <span class="button-text">NEXT</span>
        </button>

        <button id="stop-button" class="square" title="Stop playback or recording">
          <svg class="icons">
            <use href="/icons.svg#stop" />
          </svg>
          <span class="button-text">STOP</span>
        </button>

        <button id="download-button" class="square" title="Download audio">
          <svg class="icons">
            <use href="/icons.svg#download" />
          </svg>
          <span class="button-text">DOWNLOAD</span>
        </button>

        <button id="toggle-loop-button" class="square" title="Toggle loop">
          <svg class="icons">
            <use href="/icons.svg#loop" />
          </svg>
          <span class="button-text">LOOP</span>
        </button>

        <button id="toggle-input-button" class="square" title="Toggle input">
          <svg class="icons">
            <use href="/icons.svg#mic" />
          </svg>
          <span class="button-text">INPUT</span>
        </button>

        <button id="toggle-sound-button" class="square" title="Toggle sound">
          <svg class="icons">
            <use href="/icons.svg#sound" />
          </svg>
          <span class="button-text">SOUND</span>
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
          <label for="audio-input" title="Audio input source">Input:</label>
          <select id="audio-input"></select>
        </div>

        <div class="pair controls-curve-pair">
          <label for="fade-curve-select" title="Fade curve">Curve:</label>
          <select id="fade-curve-select">
            <option value="sinusoid">Sinusoid</option>
            <option value="linear">Linear</option>
            <option value="exponential">Exponential</option>
            <option value="logarithmic">Logarithmic</option>
          </select>
        </div>

        <div class="pair">
          <label for="response-select" title="Play/stop response mode">Response:</label>
          <select id="response-select">
            <option value="instant">Instant</option>
            <option value="fade">Fade</option>
          </select>
        </div>

        <div class="pair">
          <label for="bpm-input" title="Tempo for BPM ruler">BPM:</label>
          <input type="number" id="bpm-input" min="1" max="400" step="1" value="120">
        </div>

        <div class="pair">
          <label for="snap-note-select" title="Snap note value">Note:</label>
          <select id="snap-note-select">
            <option value="8/1">8/1</option>
            <option value="4/1">4/1</option>
            <option value="2/1">2/1</option>
            <option value="1/1">1/1</option>
            <option value="1/2">1/2</option>
            <option value="1/4" selected>1/4</option>
            <option value="1/8">1/8</option>
            <option value="1/16">1/16</option>
            <option value="1/32">1/32</option>
            <option value="1/64">1/64</option>
            <option value="1/128">1/128</option>
          </select>
        </div>

        <div class="pair timer-pair">
          <label title="Playback position">Position:</label>
          <input type="text" id="timer" class="time-display" value="00:00:000" readonly>
        </div>

        <div class="pair timer-pair">
          <label title="Track duration">Duration:</label>
          <input type="text" id="duration-display" class="time-display" value="00:00:000" readonly>
        </div>

        <div class="pair timer-pair">
          <label title="Selection duration">Selection:</label>
          <input type="text" id="selection-display" class="time-display" value="00:00:000" readonly>
        </div>

        <div class="pair timer-pair">
          <label title="Remaining time">Remain:</label>
          <input type="text" id="remaining-display" class="time-display" value="00:00:000" readonly>
        </div>

        <audio id="audio-player"></audio>
      </div>

      <div class="controls-sliders">
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="seek-backward-button" class="square icon-only colored" title="Rewind" aria-label="Rewind">
              <svg class="icons" role="img">
                <use href="/icons.svg#chevron_left" />
              </svg>
            </button>
            <input type="range" id="progress-slider" min="0" value="0" step="0.1">
            <button id="seek-forward-button" class="square icon-only colored" title="Fast-forward" aria-label="Fast-forward">
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
            <input type="range" id="volume-slider" min="0" max="100" step="1" value="100">
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
      <div class="player-timeline">
        <canvas id="timeline-ruler" width="4096" height="24"></canvas>
        <div class="waveform-overlay">
          <canvas id="static-waveform" width="4096" height="256"></canvas>
          <canvas id="playhead" width="4096" height="256"></canvas>
        </div>
        <canvas id="bpm-ruler" width="4096" height="24"></canvas>
      </div>
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

      <button id="timeline-zoom-button" class="square" title="Toggle zoom">
        <svg class="icons">
          <use href="/icons.svg#zoom_in" />
        </svg>
        <span class="button-text">ZOOM</span>
      </button>

      <button id="timeline-ruler-button" class="square" title="Toggle ruler">
        <svg class="icons">
          <use href="/icons.svg#ruler" />
        </svg>
        <span class="button-text">RULER</span>
      </button>

      <button id="bpm-ruler-button" class="square" title="Toggle beats ruler">
        <svg class="icons">
          <use href="/icons.svg#ruler" />
        </svg>
        <span class="button-text">BEATS</span>
      </button>

      <button id="snap-button" class="square" title="Toggle beat snapping">
        <svg class="icons">
          <use href="/icons.svg#snap" />
        </svg>
        <span class="button-text">SNAP</span>
      </button>

      <button id="timeline-pan-button" class="square" title="Toggle pan line">
        <svg class="icons">
          <use href="/icons.svg#slider" />
        </svg>
        <span class="button-text">PAN</span>
      </button>

      <button id="waveform-color-button" class="square" title="Toggle multi-color waveform">
        <svg class="icons">
          <use href="/icons.svg#alpha" />
        </svg>
        <span class="button-text">COLOR</span>
      </button>

      <button id="select-all-button" class="square" title="Select full waveform">
        <svg class="icons">
          <use href="/icons.svg#select_all" />
        </svg>
        <span class="button-text">ALL</span>
      </button>

      <button id="select-none-button" class="square" title="Clear waveform selection">
        <svg class="icons">
          <use href="/icons.svg#select_none" />
        </svg>
        <span class="button-text">NONE</span>
      </button>

      <button id="fade-in-button" class="square" title="Fade in using selected curve">
        <svg class="icons">
          <use href="/icons.svg#arrow_up" />
        </svg>
        <span class="button-text">FADE IN</span>
      </button>

      <button id="fade-out-button" class="square" title="Fade out using selected curve">
        <svg class="icons">
          <use href="/icons.svg#arrow_down" />
        </svg>
        <span class="button-text">FADE OUT</span>
      </button>

      <button id="normalize-button" class="square" title="Normalize to 0 dB">
        <svg class="icons">
          <use href="/icons.svg#eq" />
        </svg>
        <span class="button-text">NORMALIZE</span>
      </button>

      <button id="reverse-button" class="square" title="Reverse">
        <svg class="icons">
          <use href="/icons.svg#reverse" />
        </svg>
        <span class="button-text">REVERSE</span>
      </button>

      <button id="cut-button" class="square" title="Cut to clipboard">
        <svg class="icons">
          <use href="/icons.svg#tool" />
        </svg>
        <span class="button-text">CUT</span>
      </button>

      <button id="paste-button" class="square" title="Paste from clipboard">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">PASTE</span>
      </button>

      <button id="delete-button" class="square" title="Delete">
        <svg class="icons">
          <use href="/icons.svg#delete" />
        </svg>
        <span class="button-text">DELETE</span>
      </button>

      <button id="undo-button" class="square" title="Undo waveform edit">
        <svg class="icons">
          <use href="/icons.svg#undo" />
        </svg>
        <span class="button-text">UNDO</span>
      </button>

      <button id="redo-button" class="square" title="Redo waveform edit">
        <svg class="icons">
          <use href="/icons.svg#redo" />
        </svg>
        <span class="button-text">REDO</span>
      </button>
    </div>
  </div>

  <!-- PLAYLIST -->

  <div id="playlist-container" class="container">
    <div class="module-body standard border">
      <div class="playlist-table scrollable">
        <table class="playlist-data">
          <thead>
            <tr>
              <th class="col-index">#</th>
              <th class="col-name">Filename</th>
              <th class="col-waveform">Waveform</th>
              <th class="col-duration">Duration</th>
              <th class="col-channels">Ch</th>
              <th class="col-size">Size</th>
              <th class="col-type">Type</th>
              <th class="col-modified">Modified</th>
              <th class="col-added">Added</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody id="playlist-items">
          </tbody>
          <tfoot>
            <tr class="playlist-summary-row">
              <td colspan="10">
                <span class="playlist-summary-item">Tracks: <span id="playlist-total-tracks">0</span></span>
                <span class="playlist-summary-item">Total duration: <span id="playlist-total-duration">00:00:000</span></span>
                <span class="playlist-summary-item">Total bytes: <span id="playlist-total-bytes">0</span></span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="playlist-randomize-button" class="square" title="Randomize playlist order">
        <svg class="icons">
          <use href="/icons.svg#random" />
        </svg>
        <span class="button-text">RANDOMIZE</span>
      </button>

      <button id="playlist-clear-button" class="square" title="Clear all playlist items">
        <svg class="icons">
          <use href="/icons.svg#delete" />
        </svg>
        <span class="button-text">CLEAR</span>
      </button>

      <button id="playlist-clean-button" class="square" title="Clean dead files">
        <svg class="icons">
          <use href="/icons.svg#delete" />
        </svg>
        <span class="button-text">CLEAN</span>
      </button>

      <button id="playlist-auto-clean-button" class="square" title="Auto clean dead files">
        <svg class="icons">
          <use href="/icons.svg#asterisk" />
        </svg>
        <span class="button-text">AUTO</span>
      </button>

      <button id="playlist-load-button" class="square" title="Import playlist">
        <svg class="icons">
          <use href="/icons.svg#open" />
        </svg>
        <span class="button-text">LOAD</span>
      </button>

      <button id="playlist-save-button" class="square" title="Export playlist">
        <svg class="icons">
          <use href="/icons.svg#download" />
        </svg>
        <span class="button-text">SAVE</span>
      </button>
    </div>
  </div>

  <!-- PANEL -->

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="player-text" placeholder="Player data will appear here."></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="panel-meta-button" class="square" title="Show file metadata">
        <svg class="icons">
          <use href="/icons.svg#tag" />
        </svg>
        <span class="button-text">META</span>
      </button>

      <button id="panel-input-button" class="square" title="Show audio input details">
        <svg class="icons">
          <use href="/icons.svg#mic" />
        </svg>
        <span class="button-text">INPUT</span>
      </button>

      <button id="panel-playlist-button" class="square" title="Show playlist data">
        <svg class="icons">
          <use href="/icons.svg#view_list" />
        </svg>
        <span class="button-text">PLAYLIST</span>
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
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>