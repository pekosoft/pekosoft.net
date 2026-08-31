<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#release"></use>
  </svg>
  <div class="justify">
    <h1>General</h1>
    Pekosoft Tuner is for instrument tuning with live microphone pitch detection and manual reference tone playback. Supports guitar, bass guitar and chromatic tuning profiles.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#tool"></use>
  </svg>
  <div class="justify">
    <h1>Instrument <span class="object">module</span></h1>
    Main tuning display. Shows detected note, frequency in HZ, cents offset from current target, a meter with center at 0 cents, and target note buttons that toggle their own reference tone.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#mic"></use>
  </svg>
  <div class="justify">
    <h1>LISTEN <span class="object">button</span></h1>
    Toggles microphone input for live pitch detection. Browser may request microphone permission on first use. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#stop"></use>
  </svg>
  <div class="justify">
    <h1>HOLD <span class="object">button</span></h1>
    Freezes readout updates. Useful for briefly locking the current measurement. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#meter"></use>
  </svg>
  <div class="justify">
    <h1>Meters <span class="object">module</span></h1>
    Shows shared meter views: spectroscope, level meter, oscilloscope and wavescope. The active view updates up to 60 times per second.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#guides"></use>
  </svg>
  <div class="justify">
    <h1>GUIDES <span class="object">button</span></h1>
    Toggles meter guides. This local button overrides the Settings Guides option for Meters only. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#eq"></use>
  </svg>
  <div class="justify">
    <h1>SPECTROSCOPE <span class="object">button</span></h1>
    Shows 32 logarithmic frequency bands from 20 Hz to the analyser's Nyquist frequency, including frequencies through 20 kHz. New peaks respond immediately and decay briefly between transient sounds.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#meter"></use>
  </svg>
  <div class="justify">
    <h1>LEVEL <span class="object">button</span></h1>
    Shows output level with immediate peak response and a short release between transient sounds.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#wavelength"></use>
  </svg>
  <div class="justify">
    <h1>OSCILLOSCOPE <span class="object">button</span></h1>
    Shows the waveform and holds the latest triggered frame between transient sounds.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#pulse"></use>
  </svg>
  <div class="justify">
    <h1>WAVESCOPE <span class="object">button</span></h1>
    Shows the wavescope view.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#controls"></use>
  </svg>
  <div class="justify">
    <h1>Controls <span class="object">module</span></h1>
    Contains profile menu, follow and sound toggles, fields for detected and target values, tone type menu, and volume slider.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Profile <span class="object">menu</span></h1>
    Selects tuning profile. Chromatic uses 12 semitones with octave selection. Guitar uses E2 A2 D3 G3 B3 E4. Bass uses E1 A1 D2 G2. <span class="default">Default: Guitar.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#asterisk"></use>
  </svg>
  <div class="justify">
    <h1>FOLLOW <span class="object">button</span></h1>
    Auto-selects nearest target note from active profile during live detection. Turning this off lets you lock a target manually by pressing one of the target note buttons. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#sound"></use>
  </svg>
  <div class="justify">
    <h1>SOUND <span class="object">button</span></h1>
    Toggles output from target note buttons. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Detected / HZ / Target / Target HZ / Cents <span class="object">fields</span></h1>
    Displays current tuner state. Detected fields are updated from microphone input. Target fields represent currently selected reference tone.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Octave <span class="object">field</span></h1>
    Sets octave for chromatic profile target buttons. Enabled only while CHROM profile is selected. Range: 0 to 8. <span class="default">Default: 4.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Tone <span class="object">menu</span></h1>
    Selects reference tone waveform. Uses same tone set as other Pekosoft tone-enabled tools. <span class="default">Default: Sine.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#slider"></use>
  </svg>
  <div class="justify">
    <h1>Volume <span class="object">slider</span></h1>
    Sets target and reference tone output volume from 0 to 100. Decrease and Increase buttons support hold. <span class="default">Default: 30.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#close"></use>
  </svg>
  <div class="justify">
    <h1>CLEAR <span class="object">button</span></h1>
    Clears panel output text.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#reset"></use>
  </svg>
  <div class="justify">
    <h1>RESET <span class="object">button</span></h1>
    Resets session and all settings.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#timeline"></use>
  </svg>
  <div class="justify">
    <h1>Timeline <span class="object">module</span></h1>
    Displays cents deviation history over time. Helps visualize drift around target pitch.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#guides"></use>
  </svg>
  <div class="justify">
    <h1>GUIDES <span class="object">button</span></h1>
    Toggles timeline reference lines at cents values (-50, -25, 0, +25, +50). This local button overrides the Settings Guides option for Timeline only. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#panel"></use>
  </svg>
  <div class="justify">
    <h1>Panel <span class="object">module</span></h1>
    Text output with timestamp, detected note, detected HZ, target note, and cents offset.
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
    <use href="/icons.svg#close"></use>
  </svg>
  <div class="justify">
    <h1>CLEAR <span class="object">button</span></h1>
    Clears panel output text.
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#wrap_text"></use>
  </svg>
  <div class="justify">
    <h1>WRAP <span class="object">button</span></h1>
    Toggles text wrap in the panel so long lines wrap instead of scrolling sideways. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#alpha"></use>
  </svg>
  <div class="justify">
    <h1>COLOR <span class="object">button</span></h1>
    Toggles syntax color in the panel text preview. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#copy"></use>
  </svg>
  <div class="justify">
    <h1>COPY <span class="object">button</span></h1>
    Copies the panel output to clipboard.
  </div>
</div>
