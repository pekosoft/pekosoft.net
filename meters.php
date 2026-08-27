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
    <canvas id="volume-meter" class="meter-canvas" width="4096" height="32"></canvas>
    <canvas id="frequency-analyzer" class="meter-canvas" width="4096" height="512"></canvas>
    <canvas id="wavescope" class="meter-canvas" width="4096" height="256"></canvas>
    <canvas id="waveform" class="meter-canvas active" width="4096" height="256"></canvas>
  </div>

  <div class="module-footer wrapper colored">
    <button id="tool-guides-button" class="square" title="Toggle guides">
      <svg class="icons">
        <use href="/icons.svg#guides" />
      </svg>
      <span class="button-text">Guides</span>
    </button>
    <button id="tool-bright-button" class="square" title="Toggle bright guides">
      <svg class="icons">
        <use href="/icons.svg#sun" />
      </svg>
      <span class="button-text">Bright</span>
    </button>
    <button id="tool-color-button" class="square" title="Toggle multicolor meters">
      <svg class="icons">
        <use href="/icons.svg#alpha" />
      </svg>
      <span class="button-text">Color</span>
    </button>
  </div>
</div>
