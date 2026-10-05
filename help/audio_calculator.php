<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#release"></use>
  </svg>
  <div class="justify">
    <h1>General</h1>
    Pekosoft Audio Calculator estimates core PCM audio values from duration, bit depth, sample rate and channel count, remembers your last settings in the browser and starts with 24-bit, 96 kHz, 2 channels.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#tool"></use>
  </svg>
  <div class="justify">
    <h1>Instrument <span class="object">module</span></h1>
    The grid maps Sample rate on horizontal axis, and Bit depth on vertical axis. Clicking a cell sets those two values. The blue selected cell displays the channel count from 1 to 10. The Values button toggles axis labels without hiding the channel count.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#ruler"></use>
  </svg>
  <div class="justify">
    <h1>Values <span class="object">button</span></h1>
    Shows or hides the grid labels.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#controls"></use>
  </svg>
  <div class="justify">
    <h1>Controls <span class="object">module</span></h1>
    Buttons, fields, menus, knobs and sliders are collected in the Controls module. Knobs sit in their own section below the fields and menus and stay synchronized with the grid. Reset in the footer restores the default calculator values.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#knob"></use>
  </svg>
  <div class="justify">
    <h1>Bit depth <span class="object">knob</span></h1>
    Steps through the supported bit depths. Click, scroll or drag vertically to adjust; arrow keys step, Home and End select the limits. Double-click restores 24-bit.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#knob"></use>
  </svg>
  <div class="justify">
    <h1>Sam. rate <span class="object">knob</span></h1>
    Steps through the supported sample rates. Double-click restores 96 kHz.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#knob"></use>
  </svg>
  <div class="justify">
    <h1>Channels <span class="object">knob</span></h1>
    Steps through channel counts from 1 to 10. Double-click restores 2 channels.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Duration <span class="object">field</span></h1>
    Sets audio length in seconds. <span class="default">Default: 60.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Bit depth <span class="object">menu</span></h1>
    Sets quantization depth used for calculations. <span class="default">Default: 24.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Sam. rate <span class="object">menu</span></h1>
    Sets sample rate in Hz. <span class="default">Default: 96 kHz (96000 Hz).</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Channels <span class="object">menu</span></h1>
    Sets channel count used by all output values. <span class="default">Default: 2.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Preset <span class="object">menu</span></h1>
    Applies a common bit depth, sample rate and channel count combination. Presets are saved with the rest of the calculator state.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#reset"></use>
  </svg>
  <div class="justify">
    <h1>Reset <span class="object">button</span></h1>
    Restores the calculator to its default values: 24-bit, 96 kHz, 2 channels.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Size <span class="object">field</span></h1>
    Shows estimated uncompressed file size in MB.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Bit rate <span class="object">field</span></h1>
    Shows calculated bitrate in kb/s.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Samples <span class="object">field</span></h1>
    Shows total sample count over duration and channels.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>dB range <span class="object">field</span></h1>
    Shows theoretical dynamic range for current bit depth.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Hz range <span class="object">field</span></h1>
    Shows Nyquist limit (half the sample rate).
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#timeline"></use>
  </svg>
  <div class="justify">
    <h1>Timeline <span class="object">module</span></h1>
    Illustrates sampling and quantization using the selected Sample rate and Bit depth. White is the original sine wave, blue shows each quantized value held until the next sample, and magenta marks the quantized sample points. This is a conceptual sample-and-hold view, not a reconstructed audio output.
    <br><br>
    The axes stay fixed: a 1.000 ms window of a 2.000 kHz mono sine wave, with peak amplitude 0.025 full scale (-32.041 dBFS). The amplitude ruler shows a magnified range of approximately -0.031 to +0.031 full scale, making 8-bit quantization visible. Guides mark quantization levels; at higher depths only representative levels are drawn and individual steps become too fine to distinguish. The summary shows the actual full-scale level count.
    <br><br>
    Duration and Channels still affect the calculator results, but do not change this fixed mono illustration. No audio is played.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#guides"></use></svg>
  <div class="justify"><h1>Guides <span class="object">button</span></h1>Shows or hides Timeline guides. Initially follows Settings Guides.</div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#sun"></use></svg>
  <div class="justify"><h1>Bright <span class="object">button</span></h1>Switches Timeline guides and rulers between grey and white. Initially follows Settings Bright.</div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#ruler"></use></svg>
  <div class="justify"><h1>Rulers <span class="object">button</span></h1>Shows or hides the time (ms) and amplitude (FS, full scale) rulers. Initially follows Settings Rulers.</div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#panel"></use>
  </svg>
  <div class="justify">
    <h1>Panel <span class="object">module</span></h1>
    Panel prints either current selection details or a full table across all Bit depth and Sample rate combinations.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#speech"></use></svg>
  <div class="justify"><h1>SPEECH <span class="object">button</span></h1>Speaks current Panel text. Press again to stop.</div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#download"></use></svg>
  <div class="justify"><h1>DOWNLOAD <span class="object">button</span></h1>Downloads current Panel text as a text file.</div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#selected"></use>
  </svg>
  <div class="justify">
    <h1>Selected value <span class="object">button</span></h1>
    Shows a concise summary for the current inputs.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#select_all"></use>
  </svg>
  <div class="justify">
    <h1>All values <span class="object">button</span></h1>
    Shows expanded output for all supported Bit Depth and Sample Rate combinations.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#copy"></use>
  </svg>
  <div class="justify">
    <h1>COPY <span class="object">button</span></h1>
    Copies current panel output to clipboard.
  </div>
</div>
