<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "circle_of_fifths";
  $releaseName = "Circle Of Fifths";
  $releasePage = "";
  $availableModules = ["tool", "controls", "timeline", "panel", "meters"];
  ?>
  <meta name="keywords" content="circle of fifths, music theory, key signatures, chord progressions, relative minor, diminished chords, piano, harmony tool">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div id="tool-container" class="container">
    <div class="module-body circle-fifths-view border">
      <div class="circle-wheel-wrap no-swipe">
        <svg id="circle-wheel" class="circle-wheel" viewBox="0 0 640 640" preserveAspectRatio="xMidYMid meet" aria-label="Circle of fifths">
          <g id="major-ring"></g>
          <g id="minor-ring"></g>
          <g id="dim-ring"></g>
          <g id="spokes"></g>
          <circle id="center-disc" cx="320" cy="320" r="102"></circle>
          <g class="center-arrow-controls" aria-label="Center arrows">
            <polygon id="arrow-up" class="center-triangle" points="320,248 304,266 336,266" role="button" tabindex="0" aria-label="Focus major mode"></polygon>
            <polygon id="arrow-left" class="center-triangle" points="248,320 266,304 266,336" role="button" tabindex="0" aria-label="Previous key"></polygon>
            <polygon id="arrow-right" class="center-triangle" points="392,320 374,304 374,336" role="button" tabindex="0" aria-label="Next key"></polygon>
            <polygon id="arrow-down" class="center-triangle" points="320,392 304,374 336,374" role="button" tabindex="0" aria-label="Focus minor mode"></polygon>
          </g>
        </svg>
      </div>
    </div>

    <div class="module-footer wrapper colored">
      <button id="rotate-button" class="square" title="Toggle selected key at top">
        <svg class="icons" role="img"><use href="/icons.svg#rotate" /></svg>
        <span class="button-text">Rotate</span>
      </button>
      <button id="toggle-dim-button" class="square button-on" title="Toggle diminished ring">
        <svg class="icons" role="img"><use href="/icons.svg#radio_button" /></svg>
        <span class="button-text">Dim</span>
      </button>
      <button id="toggle-signature-button" class="square" title="Toggle key signature hints">
        <svg class="icons" role="img"><use href="/icons.svg#field" /></svg>
        <span class="button-text">Sign</span>
      </button>
    </div>
  </div>

  <div id="controls-container" class="container">
    <div class="module-body controls border">
      <div class="controls-buttons wrapper">
        <button id="play-scale-button" title="Play selected scale">
          <svg class="icons" role="img"><use href="/icons.svg#play" /></svg>
          <span class="button-text">Scale</span>
        </button>
        <button id="play-triad-button" title="Play selected triad">
          <svg class="icons" role="img"><use href="/icons.svg#piano" /></svg>
          <span class="button-text">Triad</span>
        </button>
        <button id="play-progression-button" title="Play I V vi IV progression">
          <svg class="icons" role="img"><use href="/icons.svg#timeline" /></svg>
          <span class="button-text">I V vi IV</span>
        </button>
        <button id="sound-master-button" class="button-on" title="Toggle sound">
          <svg class="icons" role="img"><use href="/icons.svg#sound" /></svg>
          <span class="button-text">Sound</span>
        </button>
        <button id="stop-button" title="Stop all playback">
          <svg class="icons" role="img"><use href="/icons.svg#stop" /></svg>
          <span class="button-text">Stop</span>
        </button>
        <button id="reset-button" title="Reset to default">
          <svg class="icons" role="img"><use href="/icons.svg#reset" /></svg>
          <span class="button-text">Reset</span>
        </button>
      </div>

      <div class="controls-values wrapper">
        <div class="pair">
          <label for="key-display" title="Selected major key">Key:</label>
          <input id="key-display" type="text" value="C" readonly>
        </div>
        <div class="pair">
          <label for="relative-display" title="Relative minor key">Relative:</label>
          <input id="relative-display" type="text" value="Am" readonly>
        </div>
        <div class="pair">
          <label for="signature-display" title="Key signature">Signature:</label>
          <input id="signature-display" type="text" value="No sharps or flats" readonly>
        </div>
        <div class="pair">
          <label for="tone-type" title="Playback tone">Tone:</label>
          <select id="tone-type">
            <?php $selectedToneType = 'piano'; include $_SERVER['DOCUMENT_ROOT'] . '/elements/tone.php'; ?>
          </select>
        </div>
        <div class="pair">
          <label for="speed-display" title="Playback speed">Speed:</label>
          <input id="speed-display" type="text" value="100%" readonly>
        </div>
      </div>

      <div class="controls-sliders">
        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="speed-decrease-button" class="square icon-only colored" title="Decrease playback speed" aria-label="Decrease playback speed">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_left" /></svg>
            </button>
            <input type="range" id="speed-slider" min="50" max="150" value="100">
            <button id="speed-increase-button" class="square icon-only colored" title="Increase playback speed" aria-label="Increase playback speed">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_right" /></svg>
            </button>
          </div>
        </div>

        <div class="controls-slider-block">
          <div class="range-input-wrapper">
            <button id="volume-decrease-button" class="square icon-only colored" title="Decrease volume" aria-label="Decrease volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_left" /></svg>
            </button>
            <input type="range" id="volume-slider" min="0" max="100" value="70">
            <button id="volume-increase-button" class="square icon-only colored" title="Increase volume" aria-label="Increase volume">
              <svg class="icons" role="img"><use href="/icons.svg#chevron_right" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="piano-wrap no-swipe" aria-label="Two octave piano">
        <div id="piano" class="piano" role="group" aria-label="Two octave piano keys"></div>
      </div>
    </div>

    <div class="module-footer wrapper colored">
      <button id="play-diatonic-button" class="square" title="Play I ii iii IV V vi vii diminished">
        <svg class="icons" role="img"><use href="/icons.svg#piano" /></svg>
        <span class="button-text">Diatonic</span>
      </button>
      <button id="play-dim-button" class="square" title="Play diminished triad">
        <svg class="icons" role="img"><use href="/icons.svg#record" /></svg>
        <span class="button-text">Dim</span>
      </button>
    </div>
  </div>

  <div id="timeline-container" class="container">
    <div class="module-body canvas-container border">
      <canvas id="timeline-canvas" width="2048" height="384" aria-label="Circle Of Fifths two octave timeline"></canvas>
    </div>
    <div class="module-footer wrapper colored">
      <button id="timeline-guides-button" class="square button-on" title="Toggle guides">
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
      <textarea id="panel-text" class="info-text"></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="copy-button" class="square" title="Copy data">
        <svg class="icons" role="img"><use href="/icons.svg#copy" /></svg>
        <span class="button-text">Copy</span>
      </button>
    </div>
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/meters.php"); ?>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/audio.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/audio.js'); ?>"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>
