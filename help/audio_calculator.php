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
    Buttons, fields, menus, knobs and sliders are collected in the Controls module. Knobs sit in their own section below the fields and menus. Bit depth, Sam. rate and Channels stay synchronized with the grid; Frequency and Amplitude control the Timeline illustration. Reset in the footer restores the default calculator and illustration values.
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
    <use href="/icons.svg#knob"></use>
  </svg>
  <div class="justify">
    <h1>Window <span class="object">knob</span></h1>
    Sets the mono illustration's time window from 0.100 to 4.000 ms in 0.100 ms steps. Uses the same interactions as Frequency. Double-click restores 1.000 ms. Shorter windows zoom in on individual samples; longer windows show more cycles and sampling patterns. The amplitude scale stays fixed. Window is remembered and Reset restores its default.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#knob"></use>
  </svg>
  <div class="justify">
    <h1>Frequency <span class="object">knob</span></h1>
    Sets the illustrated sine wave frequency from 0 to 20000 Hz in 100 Hz steps. Click, scroll, drag vertically or use arrow keys; Home and End select the limits. Double-click restores 2000 Hz. Frequencies at or above half the selected Sample rate demonstrate sampling ambiguity; a staircase is not a reconstructed audio waveform. At 0 Hz the signal is flat.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#knob"></use>
  </svg>
  <div class="justify">
    <h1>Amplitude <span class="object">knob</span></h1>
    Sets peak amplitude from 0.000% to 3.125% of full scale in 0.025 percentage-point steps, within the fixed magnified Timeline range. Uses the same interactions as Frequency. Double-click restores 2.500% FS (-32.041 dBFS). Zero amplitude is silence; quiet signals may round entirely to zero at low bit depths.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Duration <span class="object">field</span></h1>
    Sets audio file length in seconds, independently of the illustration's Window. <span class="default">Default: 60.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Window (ms) <span class="object">field</span></h1>
    Sets the Timeline Window knob value in milliseconds. Changes the time ruler, sample-point count and error statistics, but not file size, bit rate, total file samples or the amplitude scale. Accepts 0.100 to 4.000 ms in 0.100 ms steps; defaults to 1.000 ms.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Freq. (Hz) <span class="object">field</span></h1>
    Sets the Timeline Frequency knob value in Hz. Does not affect file size, bit rate or sample count.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Amp. (%) <span class="object">field</span></h1>
    Sets the Timeline Amplitude knob value in percent of full scale and updates dBFS. Both fields accept finer adjustments than the knob's 0.025 percentage-point steps. Does not affect the calculator's format metrics.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>dBFS <span class="object">field</span></h1>
    Sets the same peak amplitude in decibels relative to full scale and updates Amp. (%) and the Amplitude knob. The maximum is approximately -30.103 dBFS (3.125% FS), matching the fixed magnified Timeline range. Leave empty for zero amplitude; the placeholder shows silence because its level is negative infinity, not a finite dBFS number. Defaults to -32.041 dBFS (2.500% FS). Entered amplitude is remembered without rounding it to the knob's steps; displayed values are rounded.
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
    Restores the calculator to its default values: 24-bit, 96 kHz, 2 channels, and the illustration to 2000 Hz and 2.500% FS with Signal, Steps and Points visible.
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
    The Signal, Steps and Points footer buttons independently show or hide the corresponding parts of the illustration. Choices are remembered; all three are visible by default.
    <br><br>
    Window sets the time axis from 0.100 to 4.000 ms; the default is 1.000 ms. The magnified amplitude range stays fixed at approximately -0.031 to +0.031 full scale, making 8-bit quantization visible. The narrow vertical ruler shows signed amplitude in FS, with the unit aligned with the time labels in the top-left corner and a tick for every horizontal gridline. Endpoint numbers are omitted; intermediate numbers are also omitted when space is tight to keep labels apart. Frequency and Amplitude change the mono signal without rescaling the axes. Defaults are a 2.000 kHz sine wave with peak amplitude 0.025 full scale (-32.041 dBFS). Guides mark quantization levels; at higher depths only representative levels are drawn and individual steps become too fine to distinguish. Format and signal values are shown in Controls and Panel, not repeated over Timeline.
    <br><br>
    Duration and Channels still affect the calculator results, but do not change this mono illustration. No audio is played.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#wavelength"></use></svg>
  <div class="justify"><h1>Signal <span class="object">button</span></h1>Shows or hides the white original sine wave without changing the signal or Timeline axes.</div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#quantized_steps"></use></svg>
  <div class="justify"><h1>Steps <span class="object">button</span></h1>Shows or hides the blue quantized values held until the next sample. Independent of Signal and Points.</div>
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
    Panel prints current selection details, a full table across all Bit depth and Sample rate combinations, or the Timeline's sample points.
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
    Shows a concise summary for the current inputs. File calculations and Timeline illustration settings are separated by a blank line.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#select_all"></use>
  </svg>
  <div class="justify">
    <h1>All values <span class="object">button</span></h1>
    Shows expanded output for all supported Bit Depth and Sample Rate combinations. Timeline illustration settings follow the file calculations, separated by a blank line.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#circle"></use>
  </svg>
  <div class="justify">
    <h1>Points <span class="object">button</span></h1>
    In Panel, the third tab lists every sample in the mono Timeline illustration's selected Window, starting at sample zero. Shows time in milliseconds, the original signal and quantized amplitudes in full scale (FS), and quantization error (quantized minus signal). Values are rounded for display; small amplitudes and errors use scientific notation. Updates with Bit depth, Sample rate, Frequency, Amplitude and Window, regardless of which Timeline parts are visible. Copy, Download and Speech use the current Panel output.
    <br><br>
    The summary shows RMS error (the square root of the mean squared error), peak error (the largest absolute error), and SNR (20 times the base-10 logarithm of signal RMS divided by error RMS). RMS error is also shown in dBFS. These are measured from the illustrated sample points, not estimated for the entire hypothetical file. No error gives zero RMS and peak error, negative infinity error dBFS, and infinite SNR for a nonzero signal. SNR is undefined when the sampled signal is zero. Calculations use unrounded sample values, subject to JavaScript numeric precision; an RMS error below the smallest representable positive number is shown as an upper bound.
    <br><br>
    In Timeline, the Points footer button shows or hides the magenta quantized sample markers, independently of Signal and Steps.
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
