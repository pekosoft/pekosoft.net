<div id="meters-container" class="container">
  <div class="module-body standard border">
    <div class="controls-buttons wrapper module-tabs">
      <button id="tool-spectroscope-button" class="square" title="Spectroscope" data-module-tab="Spectroscope">
        <svg class="icons">
          <use href="/icons.svg#eq" />
        </svg>
        <span class="button-text">Spectroscope</span>
      </button>
      <button id="tool-level-button" class="square" title="Level meter" data-module-tab="Level meter">
        <svg class="icons">
          <use href="/icons.svg#meter" />
        </svg>
        <span class="button-text">Level</span>
      </button>
      <button id="tool-oscilloscope-button" class="square" title="Oscilloscope" data-module-tab="Oscilloscope">
        <svg class="icons">
          <use href="/icons.svg#wavelength" />
        </svg>
        <span class="button-text">Oscilloscope</span>
      </button>
      <button id="tool-wavescope-button" class="square" title="Wavescope" data-module-tab="Wavescope">
        <svg class="icons">
          <use href="/icons.svg#pulse" />
        </svg>
        <span class="button-text">Wavescope</span>
      </button>
      <button id="tool-phasescope-button" class="square" title="Phasescope" data-module-tab="Phasescope" data-help-release="index" data-help-entry="Phasescope">
        <svg class="icons">
          <use href="/icons.svg?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/icons.svg'); ?>#phasescope" />
        </svg>
        <span class="button-text">Phasescope</span>
      </button>
      <button id="tool-bit-meter-button" class="square" title="Bit meter" data-module-tab="Bit meter" data-help-release="index" data-help-entry="Bit">
        <svg class="icons">
          <use href="/icons.svg?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/icons.svg'); ?>#bitmeter" />
        </svg>
        <span class="button-text">Bit</span>
      </button>
      <button id="meters-play-button" class="square" title="Start cycling meters" aria-label="Play" aria-pressed="false" data-help-release="index" data-help-entry="Meter play">
        <svg class="icons">
          <use href="/icons.svg#play" />
        </svg>
        <span class="button-text">Play</span>
      </button>
      <button id="meters-next-button" class="square module-tab-skip-button" title="Next meter" data-help-release="index" data-help-entry="Next meter">
        <svg class="icons">
          <use href="/icons.svg#skip_right" />
        </svg>
        <span class="button-text">Next</span>
      </button>
    </div>
    <div id="meters-all-layout" class="meters-all-layout">
      <div id="meters-frame-spectroscope" class="meter-frame">
        <div class="meter-mode-label">Spectroscope</div>
        <div class="timeline-ruler-layout meters-ruler-layout">
          <div class="meters-ruler-corner"><svg id="meters-ruler-corner-spectroscope" aria-hidden="true"></svg></div>
          <div class="meters-horizontal-ruler"><svg id="meters-horizontal-ruler-spectroscope" aria-label="Meter horizontal ruler"></svg></div>
          <div class="meters-vertical-ruler"><svg id="meters-vertical-ruler-spectroscope" aria-label="Meter decibel ruler"></svg></div>
          <div class="timeline-scroll meter-plot">
            <canvas id="frequency-analyzer" class="meter-canvas" width="4096" height="512" role="img" aria-label="Spectroscope"></canvas>
            <div class="meters-crosshair" hidden><div id="meters-crosshair-tooltip-spectroscope" class="meters-crosshair-tooltip" role="tooltip"></div></div>
          </div>
        </div>
      </div>
      <div id="meters-frame-level" class="meter-frame">
        <div class="meter-mode-label">Level</div>
        <div class="timeline-ruler-layout meters-ruler-layout">
          <div class="meters-ruler-corner"><svg id="meters-ruler-corner-level" aria-hidden="true"></svg></div>
          <div class="meters-horizontal-ruler"><svg id="meters-horizontal-ruler-level" aria-label="Meter horizontal ruler"></svg></div>
          <div class="meters-vertical-ruler"><svg id="meters-vertical-ruler-level" aria-label="Meter decibel ruler"></svg></div>
          <div class="timeline-scroll meter-plot">
            <canvas id="volume-meter" class="meter-canvas" width="4096" height="32" role="img" aria-label="Level meter"></canvas>
            <div class="meters-crosshair" hidden><div id="meters-crosshair-tooltip-level" class="meters-crosshair-tooltip" role="tooltip"></div></div>
          </div>
        </div>
      </div>
      <div id="meters-frame-oscilloscope" class="meter-frame">
        <div class="meter-mode-label">Oscilloscope</div>
        <div class="timeline-ruler-layout meters-ruler-layout">
          <div class="meters-ruler-corner"><svg id="meters-ruler-corner-oscilloscope" aria-hidden="true"></svg></div>
          <div class="meters-horizontal-ruler"><svg id="meters-horizontal-ruler-oscilloscope" aria-label="Meter horizontal ruler"></svg></div>
          <div class="meters-vertical-ruler"><svg id="meters-vertical-ruler-oscilloscope" aria-label="Meter decibel ruler"></svg></div>
          <div class="timeline-scroll meter-plot">
            <canvas id="waveform" class="meter-canvas" width="4096" height="256" role="img" aria-label="Oscilloscope"></canvas>
            <div class="meters-crosshair" hidden><div id="meters-crosshair-tooltip-oscilloscope" class="meters-crosshair-tooltip" role="tooltip"></div></div>
          </div>
        </div>
      </div>
      <div id="meters-frame-wavescope" class="meter-frame">
        <div class="meter-mode-label">Wavescope</div>
        <div class="timeline-ruler-layout meters-ruler-layout">
          <div class="meters-ruler-corner"><svg id="meters-ruler-corner-wavescope" aria-hidden="true"></svg></div>
          <div class="meters-horizontal-ruler"><svg id="meters-horizontal-ruler-wavescope" aria-label="Meter horizontal ruler"></svg></div>
          <div class="meters-vertical-ruler"><svg id="meters-vertical-ruler-wavescope" aria-label="Meter decibel ruler"></svg></div>
          <div class="timeline-scroll meter-plot">
            <canvas id="wavescope" class="meter-canvas" width="4096" height="256" role="img" aria-label="Wavescope"></canvas>
            <div class="meters-crosshair" hidden><div id="meters-crosshair-tooltip-wavescope" class="meters-crosshair-tooltip" role="tooltip"></div></div>
          </div>
        </div>
      </div>
      <div id="meters-frame-phasescope" class="meter-frame">
        <div class="meter-mode-label">Phasescope</div>
        <div class="timeline-ruler-layout meters-ruler-layout">
          <div class="meters-ruler-corner"><svg id="meters-ruler-corner-phasescope" aria-hidden="true"></svg></div>
          <div class="meters-horizontal-ruler"><svg id="meters-horizontal-ruler-phasescope" aria-label="Meter horizontal ruler"></svg></div>
          <div class="meters-vertical-ruler"><svg id="meters-vertical-ruler-phasescope" aria-label="Meter decibel ruler"></svg></div>
          <div class="timeline-scroll meter-plot">
            <canvas id="phasescope" class="meter-canvas" width="4096" height="256" role="img" aria-label="Stereo phasescope with phase correlation"></canvas>
            <div class="meters-crosshair" hidden><div id="meters-crosshair-tooltip-phasescope" class="meters-crosshair-tooltip" role="tooltip"></div></div>
          </div>
        </div>
      </div>
      <div id="meters-frame-bit_meter" class="meter-frame">
        <div class="meter-mode-label">Bit</div>
        <div class="timeline-ruler-layout meters-ruler-layout">
          <div class="meters-ruler-corner"><svg id="meters-ruler-corner-bit_meter" aria-hidden="true"></svg></div>
          <div class="meters-horizontal-ruler"><svg id="meters-horizontal-ruler-bit_meter" aria-label="Meter horizontal ruler"></svg></div>
          <div class="meters-vertical-ruler"><svg id="meters-vertical-ruler-bit_meter" aria-label="Meter bit position ruler"></svg></div>
          <div class="timeline-scroll meter-plot">
            <canvas id="bit-meter" class="meter-canvas" width="4096" height="512" role="img" aria-label="Bit activity in a 32-bit PCM representation of the audio signal"></canvas>
            <div class="meters-crosshair" hidden><div id="meters-crosshair-tooltip-bit_meter" class="meters-crosshair-tooltip" role="tooltip"></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="module-footer wrapper colored">
    <button id="meters-all-button" class="square" title="Show all meters" aria-pressed="false" data-help-release="index" data-help-entry="All">
      <svg class="icons">
        <use href="/icons.svg#select_all" />
      </svg>
      <span class="button-text">All</span>
    </button>
    <button id="meters-freeze-button" class="square" title="Toggle freeze" aria-label="Freeze" aria-pressed="false" data-help-release="index" data-help-entry="Meter freeze">
      <svg class="icons">
        <use href="/icons.svg#pause" />
      </svg>
      <span class="button-text">Freeze</span>
    </button>
    <button id="meters-crosshair-button" class="square" title="Toggle crosshair" aria-label="Crosshair" aria-pressed="false" data-help-release="index" data-help-entry="Meter crosshair">
      <svg class="icons">
        <use href="/icons.svg#crosshair" />
      </svg>
      <span class="button-text">Crosshair</span>
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
    <button id="tool-rulers-button" class="square" title="Toggle rulers" data-help-release="index" data-help-entry="Meter rulers">
      <svg class="icons">
        <use href="/icons.svg#ruler" />
      </svg>
      <span class="button-text">Rulers</span>
    </button>
    <button id="tool-color-button" class="square" title="Toggle multicolor">
      <svg class="icons">
        <use href="/icons.svg#alpha" />
      </svg>
      <span class="button-text">Color</span>
    </button>
    <button id="meters-save-button" class="square" title="Save bitmap" data-help-release="index" data-help-entry="Meter bitmap">
      <svg class="icons">
        <use href="/icons.svg#photo" />
      </svg>
      <span class="button-text">Save</span>
    </button>
    <button id="meters-copy-button" class="square" title="Copy bitmap" data-help-release="index" data-help-entry="Meter bitmap">
      <svg class="icons">
        <use href="/icons.svg#copy" />
      </svg>
      <span class="button-text">Copy</span>
    </button>
  </div>
  <script src="/js/svg_timeline.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/svg_timeline.js'); ?>"></script>
</div>
