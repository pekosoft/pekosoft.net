<!DOCTYPE html>
<html lang="en">

<head>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "piano";
  $releaseName = "Piano";
  $releasePage = "";
  $availableModules = ["tool", "controls", "timeline", "panel", "meters"];
  ?>
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div id="tool-container" class="container">
    <div class="module-body piano-view border">
      <div id="piano"></div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="piano-range-one-button" class="square icon-only" title="Show one key row" aria-label="Show one key row"><svg class="icons" role="img"><use href="/icons.svg#one" /></svg></button>
      <button id="piano-range-two-button" class="square icon-only" title="Show two key rows" aria-label="Show two key rows"><svg class="icons" role="img"><use href="/icons.svg#two" /></svg></button>
      <button id="piano-scroll-left-button" class="square icon-only" title="Previous octave" aria-label="Previous octave">
        <svg class="icons" role="img"><use href="/icons.svg#decrease" /></svg>
      </button>
      <button id="piano-scroll-right-button" class="square icon-only" title="Next octave" aria-label="Next octave">
        <svg class="icons" role="img"><use href="/icons.svg#increase" /></svg>
      </button>
      <button id="glide-button" class="square icon-only" title="Toggle glide mode" aria-label="Toggle glide mode"><svg class="icons" role="img"><use href="/icons.svg#drag" /></svg></button>
      <button id="toggle-octaves-button" title="Toggle octave labels"><svg class="icons" role="img"><use href="/icons.svg#1_8" /></svg><span class="button-text">OCTAVES</span></button>
      <button id="toggle-notes-button" title="Toggle note display"><svg class="icons" role="img"><use href="/icons.svg#letter_c" /></svg><span class="button-text">NOTES</span></button>
    </div>
  </div>

  <div id="controls-container" class="container">
    <div class="module-body controls border">
      <div class="controls-buttons wrapper">
        <button id="play-button" title="Play recording"><svg class="icons" role="img"><use href="/icons.svg#play" /></svg><span class="button-text">PLAY</span></button>
        <button id="record-button" title="Record notes"><svg class="icons" role="img"><use href="/icons.svg#record" /></svg><span class="button-text">RECORD</span></button>
        <button id="loop-button" title="Loop playback"><svg class="icons" role="img"><use href="/icons.svg#loop" /></svg><span class="button-text">LOOP</span></button>
        <button id="haptic-button" title="Toggle haptic feedback"><svg class="icons" role="img"><use href="/icons.svg#haptic" /></svg><span class="button-text">HAPTIC</span></button>
        <button id="sound-master-button" title="Toggle all sounds"><svg class="icons" role="img"><use href="/icons.svg#sound" /></svg><span class="button-text">SOUND</span></button>
        <button id="save-controls-button" title="Save recording as WAV"><svg class="icons" role="img"><use href="/icons.svg#download" /></svg><span class="button-text">SAVE</span></button>
        <button id="reset-button" title="Reset to default"><svg class="icons" role="img"><use href="/icons.svg#reset" /></svg><span class="button-text">RESET</span></button>
      </div>

      <div class="controls-values wrapper">
        <div class="pair">
          <label for="tone-type" title="Tone waveform">Tone:</label>
          <select id="tone-type">
            <?php include $_SERVER['DOCUMENT_ROOT'] . '/elements/tone.php'; ?>
          </select>
        </div>

        <div class="pair">
          <label for="hzDisplay" title="Last played frequency in hertz">HZ:</label>
          <input id="hzDisplay" type="number" readonly>
        </div>

        <div class="pair">
          <label for="noteDisplay" title="Last played note name">Note:</label>
          <input id="noteDisplay" type="text" readonly>
        </div>

        <div class="pair">
          <label for="midiDisplay" title="Last played MIDI note number">MIDI:</label>
          <input id="midiDisplay" type="number" readonly>
        </div>
      </div>

      <div class="controls-sliders">
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="volume-decrease-button" class="square icon-only colored" title="Decrease volume" aria-label="Decrease volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_left" /></svg>
            </button>
            <input type="range" id="volume-slider" min="0" max="100" value="100">
            <button id="volume-increase-button" class="square icon-only colored" title="Increase volume" aria-label="Increase volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_right" /></svg>
            </button>
          </div>
        </div>
      </div>

      <input type="file" id="file-input" accept=".txt" style="display: none;">
    </div>
  </div>

  <div id="timeline-container" class="container">
    <div class="module-body canvas-container border">
      <canvas id="piano-roll"></canvas>
    </div>
    <div class="module-footer wrapper colored">
      <button id="timeline-guides-button" class="button-on" title="Toggle piano roll guides">
        <svg class="icons" role="img"><use href="/icons.svg#guides" /></svg>
        <span class="button-text">GUIDES</span>
      </button>
      <button id="timeline-bright-button" title="Toggle bright guides">
        <svg class="icons" role="img"><use href="/icons.svg#sun" /></svg>
        <span class="button-text">BRIGHT</span>
      </button>
    </div>
  </div>

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="recordingText" class="recording-text" placeholder="Recording data will appear here. Each line format: {timestamp}ms: {start|stop} {note}"></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="open-button" title="Open recording">
        <svg class="icons" role="img"><use href="/icons.svg#open" /></svg>
        <span class="button-text">OPEN</span>
      </button>
      <button id="save-button" title="Save recording">
        <svg class="icons" role="img"><use href="/icons.svg#download" /></svg>
        <span class="button-text">SAVE</span>
      </button>
      <button id="copy-button" title="Copy recording">
        <svg class="icons" role="img"><use href="/icons.svg#copy" /></svg>
        <span class="button-text">COPY</span>
      </button>
    </div>
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/meters.php"); ?>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script type="module" src="/js/piano.js"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>