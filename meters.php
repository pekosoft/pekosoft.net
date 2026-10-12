<div id="meters-container" class="container">
  <div class="module-body standard border">
    <div class="controls-buttons wrapper">
      <button id="tool-spectroscope-button" class="square" title="Spectroscope">
        <svg class="icons">
          <use href="/icons.svg#eq" />
        </svg>
        <span class="button-text">Spectroscope</span>
      </button>
      <button id="tool-level-button" class="square" title="Level meter">
        <svg class="icons">
          <use href="/icons.svg#meter" />
        </svg>
        <span class="button-text">Level</span>
      </button>
      <button id="tool-oscilloscope-button" class="square" title="Oscilloscope">
        <svg class="icons">
          <use href="/icons.svg#wavelength" />
        </svg>
        <span class="button-text">Oscilloscope</span>
      </button>
      <button id="tool-wavescope-button" class="square" title="Wavescope">
        <svg class="icons">
          <use href="/icons.svg#pulse" />
        </svg>
        <span class="button-text">Wavescope</span>
      </button>
    </div>
    <div class="timeline-ruler-layout meters-ruler-layout">
      <div class="meters-ruler-corner">
        <svg id="meters-ruler-corner" aria-hidden="true"></svg>
      </div>
      <div class="meters-horizontal-ruler">
        <svg id="meters-horizontal-ruler" aria-label="Meter horizontal ruler"></svg>
      </div>
      <div class="meters-vertical-ruler">
        <svg id="meters-vertical-ruler" aria-label="Meter decibel ruler"></svg>
      </div>
      <div class="timeline-scroll meter-plot">
        <canvas id="volume-meter" class="meter-canvas" width="4096" height="32"></canvas>
        <canvas id="frequency-analyzer" class="meter-canvas" width="4096" height="512"></canvas>
        <canvas id="wavescope" class="meter-canvas" width="4096" height="256"></canvas>
        <canvas id="waveform" class="meter-canvas active" width="4096" height="256"></canvas>
      </div>
    </div>
  </div>

  <div class="module-footer wrapper colored">
    <button id="meters-freeze-button" class="square" title="Toggle meter freeze" aria-label="Freeze" aria-pressed="false" data-help-release="index" data-help-entry="Meter freeze">
      <svg class="icons">
        <use href="/icons.svg#pause" />
      </svg>
      <span class="button-text">Freeze</span>
    </button>
    <button id="tool-guides-button" class="square" title="Toggle guides">
      <svg class="icons">
        <use href="/icons.svg#guides" />
      </svg>
      <span class="button-text">Guides</span>
    </button>
    <button id="tool-bright-button" class="square" title="Toggle bright guides and rulers">
      <svg class="icons">
        <use href="/icons.svg#sun" />
      </svg>
      <span class="button-text">Bright</span>
    </button>
    <button id="tool-rulers-button" class="square" title="Toggle meter rulers" data-help-release="index" data-help-entry="Meter rulers">
      <svg class="icons">
        <use href="/icons.svg#ruler" />
      </svg>
      <span class="button-text">Rulers</span>
    </button>
    <button id="tool-color-button" class="square" title="Toggle multicolor meters">
      <svg class="icons">
        <use href="/icons.svg#alpha" />
      </svg>
      <span class="button-text">Color</span>
    </button>
  </div>
  <script src="/js/svg_timeline.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/svg_timeline.js'); ?>"></script>
</div>
