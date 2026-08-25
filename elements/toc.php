  <?php
  $releaseName = isset($releaseName) ? $releaseName : '';
  $releasePage = isset($releasePage) ? $releasePage : '';
  ?>

    <div class="top-heading colored">

  <div>
    <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/burger.php"); ?>
  </div>

  <div class="top-heading-title">
    <a class="top-heading-logo" href="/" aria-label="Pekosoft">
      <svg class="assets" viewBox="0 0 512 101.87" role="img" aria-label="Pekosoft">
        <use href="/assets.svg#logo" />
      </svg>
    </a>
    <h1 class="release-title">
      <?php echo $releaseName; ?><?php if ($releasePage !== ''): ?> <span><?php echo $releasePage; ?></span><?php endif; ?>
    </h1>
  </div>

  <div id="settings-menu-container">
    <button id="toggle-settings-panel-button" class="square" title="Settings" aria-label="Settings" aria-expanded="false">
      <svg class="icons" role="img">
        <use href="/icons.svg#settings" />
      </svg>
    </button>

    <div id="settings-panel" class="settings-panel">
      <div class="settings-panel-scroll">
      <button id="toggle-mode-button" class="toc-button" title="Toggle dark mode" aria-label="Toggle dark mode">
        <svg class="icons" role="img">
          <use href="/icons.svg#moon" />
        </svg>
        Dark mode
      </button>

      <button id="toggle-fullscreen-button" class="toc-button" title="Toggle full screen" aria-label="Toggle full screen">
        <svg class="icons" role="img">
          <use href="/icons.svg#full_screen" />
        </svg>
        Fullscreen
      </button>

      <button id="play-site-button" class="toc-button" title="Play all pages" aria-label="Play all pages">
        <svg class="icons" role="img">
          <use href="/icons.svg#play" />
        </svg>
        Play
      </button>

      <button id="toggle-footer-button" class="toc-button" title="Toggle status bar" aria-label="Toggle status bar" aria-pressed="true">
        <svg class="icons" role="img">
          <use href="/icons.svg#about" />
        </svg>
        Status bar
      </button>

      <div class="settings-panel-content">
        <div class="settings-toggle-row"><input type="checkbox" name="grid" id="grid" hidden><button type="button" data-setting-toggle="grid" title="Background grid" class="toc-button"><svg class="icons"><use href="/icons.svg#grid" /></svg>Grid</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="guides" id="guides" hidden><button type="button" data-setting-toggle="guides" title="Timeline guides" class="toc-button"><svg class="icons"><use href="/icons.svg#guides" /></svg>Guides</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="bright-guides" id="bright-guides" hidden><button type="button" data-setting-toggle="bright-guides" title="Bright guides" class="toc-button"><svg class="icons"><use href="/icons.svg#sun" /></svg>Bright</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="headers" id="headers" hidden><button type="button" data-setting-toggle="headers" title="Module headers" class="toc-button"><svg class="icons"><use href="/icons.svg#tool" /></svg>Headers</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="layout" id="layout" hidden><button type="button" data-setting-toggle="layout" title="Two modules per row" class="toc-button"><svg class="icons"><use href="/icons.svg#view_grid" /></svg>Layout</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="sound" id="sound" hidden><button type="button" data-setting-toggle="sound" title="Sound output" class="toc-button"><svg class="icons"><use href="/icons.svg#sound" /></svg>Sound</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="haptics" id="haptics" hidden><button type="button" data-setting-toggle="haptics" title="Haptic feedback" class="toc-button"><svg class="icons"><use href="/icons.svg#haptic" /></svg>Haptic</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="toggle-button-text" id="toggle-button-text" hidden><button type="button" data-setting-toggle="toggle-button-text" title="Button text" class="toc-button"><svg class="icons"><use href="/icons.svg#text" /></svg>Text</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="toggle-alpha" id="toggle-alpha" hidden><button type="button" data-setting-toggle="toggle-alpha" title="Alpha transparency" class="toc-button"><svg class="icons"><use href="/icons.svg#alpha" /></svg>Alpha</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="toggle-bars" id="toggle-bars" hidden><button type="button" data-setting-toggle="toggle-bars" title="Number field bars" class="toc-button"><svg class="icons"><use href="/icons.svg#bars" /></svg>Bars</button></div>
        <div class="settings-toggle-row"><input type="checkbox" name="toggle-wrap" id="toggle-wrap" hidden><button type="button" data-setting-toggle="toggle-wrap" title="Panel text wrap" class="toc-button"><svg class="icons"><use href="/icons.svg#wrap_text" /></svg>Wrap</button></div>
        <div class="settings-toggle-row settings-reset-row"><button id="reset-settings-button" class="toc-button" type="button" title="Reset to default"><svg class="icons"><use href="/icons.svg#reset" /></svg>Reset</button></div>

        <div class="setting-row">
          <label for="grid-size-value" title="Grid size" class="settings-control-label">Size</label>
          <div class="knob-wrap"><input type="number" id="grid-size-value" class="knob-value" value="16" readonly><button id="grid-size-knob" class="knob-control" type="button"></button></div>
        </div>
        <div class="setting-row">
          <label for="font_size_selector" title="Default font size" class="settings-control-label">Font</label>
          <div class="knob-wrap"><select id="font_size_selector"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select><button id="font-size-knob" class="knob-control" type="button"></button></div>
        </div>
        <div class="setting-row">
          <label for="default_bpm" title="Default Beats Per Minute" class="settings-control-label">BPM</label>
          <div class="knob-wrap"><input type="number" id="default_bpm" name="default_bpm" value="120" min="30" max="320" step="1"><button id="default-bpm-knob" class="knob-control" type="button"></button></div>
        </div>
        <div class="setting-row">
          <label for="default_rpm" title="Default Rounds Per Minute" class="settings-control-label">RPM</label>
          <div class="knob-wrap"><input type="number" id="default_rpm" name="default_rpm" value="33.333" min="8" max="78" step="0.001" readonly><button id="default-rpm-knob" class="knob-control" type="button"></button></div>
        </div>
        <div class="setting-row">
          <label for="a4_hz" title="Default frequency for A4" class="settings-control-label">A4 Hz</label>
          <div class="knob-wrap"><input type="number" id="a4_hz" name="a4_hz" value="440" min="400" max="480" step="1"><button id="a4-hz-knob" class="knob-control" type="button"></button></div>
        </div>
        <div class="setting-row">
          <label for="speed_of_sound" title="Speed Of Sound in meters per second" class="settings-control-label">SOS</label>
          <div class="knob-wrap"><input type="number" id="speed_of_sound" name="speed_of_sound" value="343" min="300" max="380" step="1"><button id="speed-of-sound-knob" class="knob-control" type="button"></button></div>
        </div>

      </div>

        <div class="settings-panel-close">
          <button id="toggle-settings-panel-close-button" class="square transparent" title="Close" aria-label="Close">
            <svg class="icons" role="img">
              <use href="/icons.svg#close" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

</div>

