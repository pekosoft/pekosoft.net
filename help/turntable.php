<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#release"></use>
  </svg>
  <div class="justify">
    <h1>General</h1>
    Pekosoft Turntable is for simulating vinyl rotation. Control playback, visualize record sizes, label sizes and RPMs. Provides details like current speed, SPR and rotation.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#tool"></use>
  </svg>
  <div class="justify">
    <h1>Instrument <span class="object">module</span></h1>
    You can scratch the platter by clicking and dragging (mouse) or touching and dragging (finger). This simulates manually rotating a vinyl record. Scratching works in all states. Touch input supports natural gestures, including full circular motion, backward motion, and quick releases.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#controls"></use>
  </svg>
  <div class="justify">
    <h1>Controls <span class="object">module</span></h1>
    Buttons, fields, menus, knobs and sliders are collected in the Controls module. The status bar displays control help and feedback.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>RPM <span class="object">field</span></h1>
    Sets and displays rounds per minute. Updates related values accordingly. <span class="default">Default: 33.333.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Speed <span class="object">field</span></h1>
    Displays actual, current turntable speed in real time.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>SPR <span class="object">field</span></h1>
    Sets and displays seconds per round. This is the time it takes the platter to complete a single revolution. Range: 0.600 to 60.000 seconds per round. This bidirectional relationship between RPM and SPR makes the tool useful for both musical and mechanical applications where time-based rotation is more intuitive than RPM. Updates related values accordingly. <span class="default">Default: 1.800.</span> <span class="example">Example: current RPM defines current SPR and DPS.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>DPS <span class="object">field</span></h1>
    Sets and displays degrees per second. Updates related values accordingly. DPS = (RPM times 360 degrees) divided by 60 seconds. <span class="default">Default: 200.</span> <span class="example">Example: current DPS defines current RPM and SPR.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Tone <span class="object">menu</span></h1>
    Sets tone type to Sine, Square, Sawtooth, Triangle or Piano. <span class="default">Default: Sine.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>HZ <span class="object">field</span></h1>
    Displays reference tone frequency of 440 HZ, for the default speed of 33.333 RPM, at the current RPM. This demonstrates the shift in pitch between speeds and wind-down and wind-up times.
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#play"></use>
  </svg>
  <div class="justify">
    <h1>PLAY <span class="object">button</span></h1>
    Toggles playback of the turntable. When pressed, it starts spinning the platter at the current RPM. Pressing it again pauses the platter by bringing it to a stop (either instantly or gradually, depending on torque mode). This does not reset the platter's angle or settings, so playback can be resumed. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#stop"></use>
  </svg>
  <div class="justify">
    <h1>STOP <span class="object">button</span></h1>
    Completely stops and resets the turntable. Unlike the pause function, the Stop button resets the rotation angle to zero, clears any current motion, and sets the actual speed to 0. It also updates the UI to reflect a fully stopped state.
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#sound"></use>
  </svg>
  <div class="justify">
    <h1>SOUND <span class="object">button</span></h1>
    Toggles audio playback of the reference tone.
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#rpm_45"></use>
  </svg>
  <div class="justify">
    <h1>TEMPO <span class="object">buttons</span></h1>
    Sets the RPM to standard record speeds: 8, 16 2/3, 22.5, 33 1/3, 45 and 78 RPM. These correspond to historical and modern vinyl standards. 8, 16 2/3 and 22.5 RPM are rare and primarily historical. 33 1/3 is the common LP speed. 45 is common for singles. 78 was used for shellac records. <span class="default">Default: 33 1/3.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#reverse"></use>
  </svg>
  <div class="justify">
    <h1>REVERSE <span class="object">button</span></h1>
    Backwards rotation. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#torque"></use>
  </svg>
  <div class="justify">
    <h1>TORQUE <span class="object">button</span></h1>
    Turns acceleration and deceleration on or off. When torque is on, speed changes simulate inertia. The turntable ramps up or down instead of instantly snapping to the new speed. When torque is off, all speed changes are immediate. This affects both the play toggle and RPM changes. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#haptic"></use>
  </svg>
  <div class="justify">
    <h1>HAPTIC <span class="object">button</span></h1>
    Toggles short vibrations when beginning a scratch gesture. This feature works on supported mobile devices with haptic hardware (e.g., most smartphones). <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#reset"></use>
  </svg>
  <div class="justify">
    <h1>RESET <span class="object">button</span></h1>
    Resets session and all settings.
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#vinyl_7"></use>
  </svg>
  <div class="justify">
    <h1>7&quot; <span class="object">button</span></h1>
    Toggles diameter outline for 7&quot; records. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#vinyl_10"></use>
  </svg>
  <div class="justify">
    <h1>10&quot; <span class="object">button</span></h1>
    Toggles diameter outline for 10&quot; records. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#vinyl_12"></use>
  </svg>
  <div class="justify">
    <h1>12&quot; <span class="object">button</span></h1>
    Toggles diameter outline for 12&quot; records. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#label_s"></use>
  </svg>
  <div class="justify">
    <h1>LABEL S <span class="object">button</span></h1>
    Toggles small label. These are used on 7" records. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#label_l"></use>
  </svg>
  <div class="justify">
    <h1>LABEL L <span class="object">button</span></h1>
    Toggles large label. These are used on 10" and 12" records. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#jukebox"></use>
  </svg>
  <div class="justify">
    <h1>JUKEBOX <span class="object">button</span></h1>
    Toggles large spindle hole. These are used mainly for jukebox releases on 7" records. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#slider"></use>
  </svg>
  <div class="justify">
    <h1>Tempo <span class="object">slider</span></h1>
    Sets RPM in integers. Rounds to nearest integer when RPM has decimals. Decrease and Increase buttons support hold. Supports keyboard input of arrow up, arrow down, page up, page down, home and end.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#slider"></use>
  </svg>
  <div class="justify">
    <h1>Volume <span class="object">slider</span></h1>
    Sets reference tone volume from 0 to 100. Decrease and Increase buttons support hold. <span class="default">Default: 20.</span>
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#timeline"></use>
  </svg>
  <div class="justify">
    <h1>Timeline <span class="object">module</span></h1>
    Displays tempo. Updates once per second. Pauses when scratching.
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#guides"></use>
  </svg>
  <div class="justify">
    <h1>GUIDES <span class="object">button</span></h1>
    Toggles guides in Timeline. Horizontal RPM reference lines show labeled values (8, 33, 45 and 78). This local button overrides the Settings Guides option for Timeline only. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#sun"></use>
  </svg>
  <div class="justify">
    <h1>BRIGHT <span class="object">button</span></h1>
    Toggles bright guides in Timeline. This local button overrides the Settings Bright option for Timeline only. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#photo"></use>
  </svg>
  <div class="justify">
    <h1>SAVE <span class="object">button</span></h1>
    Saves the Timeline canvas as a PNG image.
  </div>
</div>

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#copy"></use>
  </svg>
  <div class="justify">
    <h1>COPY <span class="object">button</span></h1>
    Copies the Timeline canvas as a PNG image to clipboard.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#panel"></use>
  </svg>
  <div class="justify">
    <h1>Panel <span class="object">module</span></h1>
    Text-based output showing timestamp, RPM, SPR and DPS. Updates once per second. Pauses when scratching.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#speech"></use></svg>
  <div class="justify"><h1>SPEECH <span class="object">button</span></h1>Speaks current Panel text. Press again to stop.</div>
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

<div class="feature-row border"><svg class="standard-image-help">
    <use href="/icons.svg#copy"></use>
  </svg>
  <div class="justify">
    <h1>COPY <span class="object">button</span></h1>
    Copies the output from the panel to clipboard.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#meter"></use>
  </svg>
  <div class="justify">
    <h1>Meters <span class="object">module</span></h1>
    Shows shared meter views: spectroscope, level meter, oscilloscope and wavescope.
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
    <use href="/icons.svg#sun"></use>
  </svg>
  <div class="justify">
    <h1>BRIGHT <span class="object">button</span></h1>
    Toggles bright guides in Meters. This local button overrides the Settings Bright option for Meters only. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#eq"></use>
  </svg>
  <div class="justify">
    <h1>SPECTROSCOPE <span class="object">button</span></h1>
    Shows the spectroscope meter view.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#meter"></use>
  </svg>
  <div class="justify">
    <h1>LEVEL <span class="object">button</span></h1>
    Shows the level meter view.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#wavelength"></use>
  </svg>
  <div class="justify">
    <h1>OSCILLOSCOPE <span class="object">button</span></h1>
    Shows the oscilloscope view.
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