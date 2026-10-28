<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#release"></use>
  </svg>
  <div class="justify">
    <h1>General</h1>
    Pekosoft Drum Machine is a four-voice, 16-step rhythm sequencer. Program kick, snare, hi-hat and percussion patterns, record performances into Playlist, shape each voice and play through the shared Timeline and Meters modules.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#tool"></use>
  </svg>
  <div class="justify">
    <h1>Instrument <span class="object">module</span></h1>
    Grid mode splits the sequencer into steps 1-8 and 9-16. Each row controls one drum voice. Click or tap a step to cycle between off, normal and accent velocity. Drag across steps to paint the selected velocity. Pad mode fills the Instrument with four drum pads for freeform playing.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#view_grid"></use>
  </svg>
  <div class="justify">
    <h1>Mode <span class="object">button</span></h1>
    Switches between Grid sequencing and Pad performance. Press a pad to play its voice, or use its assigned keyboard key. Record captures pad hits with their timing and voice settings. Switching modes preserves the pattern, voice settings and playback state. The selected mode is saved. <span class="default">Default: Grid.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#blink"></use>
  </svg>
  <div class="justify">
    <h1>Blink <span class="object">button</span></h1>
    Toggles brief feedback on drum voice buttons when played manually, by the sequencer or during recording playback. Works in Grid and Pad modes. The setting is saved. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#sound"></use>
  </svg>
  <div class="justify">
    <h1>Voice <span class="object">buttons</span></h1>
    KICK, SNARE, HI-HAT and PERC audition and select the corresponding voice. PERC produces a short maraca-like noise rattle rather than a pitched tone. Use D or 1 for kick, F or 2 for snare, J or 3 for hi-hat, and K or 4 for percussion. Shortcuts work in Grid and Pad modes, including while a button has focus, but not while editing a field. Each key press plays one hit; holding a key does not repeat. Record captures keyboard hits in the same way as pad presses.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#sound"></use>
  </svg>
  <div class="justify">
    <h1>Mute <span class="object">buttons</span></h1>
    Toggle playback mute for each voice. Muted steps stay visible and remain in saved pattern data. <span class="default">Default: all voices audible.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#random"></use>
  </svg>
  <div class="justify">
    <h1>Random <span class="object">button</span></h1>Creates a new weighted rhythm and preserves strong kick and snare anchors. Available in Grid mode only.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#close"></use>
  </svg>
  <div class="justify">
    <h1>Clear <span class="object">button</span></h1>Switches off all steps. The change can be undone. Available in Grid mode only.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#controls"></use>
  </svg>
  <div class="justify">
    <h1>Controls <span class="object">module</span></h1>
    Transport, tempo, pattern, kit and voice-shaping controls are collected in the Controls module.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#play"></use>
  </svg>
  <div class="justify">
    <h1>Play <span class="object">button</span></h1>Starts or pauses sequencer playback. With Loop off, plays one Length cycle and returns the playhead to the beginning. With Loop on, repeats the pattern. Pausing manually keeps the current position for resuming. Changing Length during playback restarts from the beginning with the selected length. Space provides the same shortcut when no field or button has focus. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#record"></use>
  </svg>
  <div class="justify">
    <h1>Record <span class="object">button</span></h1>Starts the selected Count-in, then records sequencer hits and manually auditioned voices with their timing, velocity and voice settings for one Length cycle at the selected BPM. Record does not start the sequencer. Count-in happens only before the first pass and is excluded from the take. With Loop off, recording completes at the cycle boundary. Press Record again or Stop to finish early. The take keeps its full cycle duration, including leading and trailing silence, and is added to Playlist even when silent. Sound tails are cut at the cycle boundary during Playback and WAV export. The recording status shows the selected step count and whether Loop is overwriting. Length, BPM, Tempo and Tap are unavailable during Count-in and recording. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#play"></use>
  </svg>
  <div class="justify">
    <h1>Playback <span class="object">button</span></h1>Starts or stops the selected Playlist recording. Playback first completes an active take and then plays it. Recording playback does not change the current pattern. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#loop"></use>
  </svg>
  <div class="justify">
    <h1>Loop <span class="object">button</span></h1>During Play, repeats the sequencer's selected Length cycle. Turning it off finishes the current cycle. During recording, repeats the same Length cycle and replaces previous hits as recording advances, including silence replacing old hits. This is overwrite recording, not overdubbing. Stopping partway through a pass keeps the previous pass in the region not yet overwritten. All passes form one Playlist take. Turning Loop off completes recording at the next cycle boundary. During Playback, Loop repeats the selected recording using its exact stored duration and hit timing, including leading and trailing silence. Turning it off finishes the current pass. Older freeform recordings retain their stored duration. Loop does not repeat WAV exports. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#stop"></use>
  </svg>
  <div class="justify">
    <h1>Stop <span class="object">button</span></h1>Stops sequencer and recording playback, cancels Count-in or completes an active recording, and returns the playhead to the beginning.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#download"></use>
  </svg>
  <div class="justify">
    <h1>Save <span class="object">button</span></h1>Exports the selected Length-based Playlist recording as a WAV file with its exact cycle duration, recorded timing and voice settings. Leading and trailing silence are retained and tails beyond the end are cut. If no Length-based recording is selected, exports the current pattern with its sound tails. Volume applies to either export. Metronome and Count-in clicks are excluded.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#metronome"></use>
  </svg>
  <div class="justify">
    <h1>Metronome <span class="object">button</span></h1>
    Toggles a timing click during sequencer playback and performance recording. Each bar has four beats at the current BPM, with an accent on the first beat. Swing and Length do not change the click. The click follows Sound and Volume but never adds hits to Timeline, recordings or WAV exports. It does not accompany Playlist playback. <span class="default">Default: off.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#metronome"></use>
  </svg>
  <div class="justify">
    <h1>Count-in <span class="object">menu</span></h1>
    Selects Off, One bar, Two bars or Four bars before recording. Each bar contains four beats at the selected BPM. Count-in clicks sound even when Metronome is off and follow Sound and Volume. The recording status shows count-in progress and when recording begins. The menu is unavailable until Count-in or recording ends. Stop, Reset or starting Playlist playback cancels Count-in without creating a take. Applying pattern data or importing Playlist recordings also stops the active take or Count-in. <span class="default">Default: One bar.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#tap_pad"></use>
  </svg>
  <div class="justify">
    <h1>Tap <span class="object">button</span></h1>Sets BPM from the average timing of recent taps.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#sound"></use>
  </svg>
  <div class="justify">
    <h1>Sound <span class="object">button</span></h1>Toggles master audio output. Sequencing and Meters continue while output is muted. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#haptic"></use>
  </svg>
  <div class="justify">
    <h1>Haptic <span class="object">button</span></h1>Toggles short vibration feedback for auditioned voices and sequenced kick hits on supported devices.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#reset"></use>
  </svg>
  <div class="justify">
    <h1>Reset <span class="object">button</span></h1>Stops playback and recording, clears Playlist recordings, pattern-edit history and Timeline events, and restores Drum Machine settings, voices, pattern and table column widths to defaults. Sitewide settings are unchanged.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>BPM <span class="object">field</span></h1>Sets tempo in beats per minute within the supported range. The global default BPM is used when available.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Swing <span class="object">field</span></h1>Delays alternating sixteenth-note steps while preserving each two-step duration. <span class="default">Default: straight.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Pattern <span class="object">menu</span></h1>Loads Basic, Four On Floor, Breakbeat, Electro or Empty patterns. Edited patterns are marked Custom.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Kit <span class="object">menu</span></h1>Loads Classic, Deep, Tight or Bright voice settings. Edited voice settings are marked Custom.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Length <span class="object">menu</span></h1>Sets the pattern and recording cycle length to 4, 8, 12 or 16 sixteenth-note steps, not bars. Sixteen steps equal one four-beat bar. At 120 BPM, 4 steps record 0.5 seconds and 16 steps record 2 seconds. Steps beyond the selected length remain visible but disabled. Length is unavailable during Count-in and recording.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#menu"></use>
  </svg>
  <div class="justify">
    <h1>Voice <span class="object">menu</span></h1>Selects the voice edited by Pitch, Decay, Tone, Level and Pan.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Pitch <span class="object">field</span></h1>Sets the selected voice frequency in hertz. For PERC, it shifts the noise filtering rather than setting a musical pitch. The supported range follows the selected voice.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Decay <span class="object">field</span></h1>Sets the selected voice decay in milliseconds. The supported range follows the selected voice.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Tone <span class="object">field</span></h1>Sets brightness and transient character for the selected voice.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Level <span class="object">field</span></h1>Sets the selected voice level before master volume.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Pan <span class="object">field</span></h1>Positions the selected voice from left through center to right.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#slider"></use>
  </svg>
  <div class="justify">
    <h1>Tempo <span class="object">slider</span></h1>Adjusts BPM. Decrease and Increase buttons support press and hold.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#slider"></use>
  </svg>
  <div class="justify">
    <h1>Swing <span class="object">slider</span></h1>Adjusts swing. Decrease and Increase buttons support press and hold.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#slider"></use>
  </svg>
  <div class="justify">
    <h1>Volume <span class="object">slider</span></h1>Adjusts master output volume. Decrease and Increase buttons support press and hold.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#timeline"></use>
  </svg>
  <div class="justify">
    <h1>Timeline <span class="object">module</span></h1>Shows an eight-second rolling view of played kick, snare, hi-hat and percussion hits. Block height shows normal or accent velocity, and block width follows voice decay.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#guides"></use>
  </svg>
  <div class="justify">
    <h1>Guides <span class="object">button</span></h1>Toggles horizontal drum-lane guides. This local button overrides the Settings Guides option for Timeline only. <span class="default">Default: follows Settings Guides.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#photo"></use>
  </svg>
  <div class="justify">
    <h1>Save <span class="object">button</span></h1>Saves the Timeline as a PNG image.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#copy"></use>
  </svg>
  <div class="justify">
    <h1>Copy <span class="object">button</span></h1>Copies the Timeline as a PNG image to clipboard.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#view_list"></use>
  </svg>
  <div class="justify">
    <h1>Playlist <span class="object">module</span></h1>Stores completed recordings in order. Each row shows the recording name, four-lane preview, duration, hit count, recorded BPM, added time, and separate Play and Remove columns. Drag a column header edge to resize that column. On touchscreens, drag the right side of the header. Double-click or double-tap the edge to restore its default width.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#view_list"></use>
  </svg>
  <div class="justify">
    <h1>Recording <span class="object">rows</span></h1>Click a row to select its recording. Double click a row to start playback. The selected row is highlighted.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#play"></use>
  </svg>
  <div class="justify">
    <h1>Play <span class="object">row button</span></h1>Starts or stops playback of that recording and selects its row.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#delete"></use>
  </svg>
  <div class="justify">
    <h1>Remove <span class="object">row button</span></h1>Removes that recording from Playlist.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#skip_left"></use>
  </svg>
  <div class="justify">
    <h1>Previous <span class="object">button</span></h1>Selects and plays the previous recording, wrapping from the first recording to the last.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#skip_right"></use>
  </svg>
  <div class="justify">
    <h1>Next <span class="object">button</span></h1>Selects and plays the next recording, wrapping from the last recording to the first.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#delete"></use>
  </svg>
  <div class="justify">
    <h1>Clear <span class="object">button</span></h1>Removes all Playlist recordings after confirmation.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#open"></use>
  </svg>
  <div class="justify">
    <h1>Open <span class="object">button</span></h1>Stops playback and recording, then replaces Playlist with valid recordings imported from a Drum Machine recordings JSON (JavaScript Object Notation) file.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#download"></use>
  </svg>
  <div class="justify">
    <h1>Save <span class="object">button</span></h1>Exports all Playlist recordings as a JSON file.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#undo"></use>
  </svg>
  <div class="justify">
    <h1>History <span class="object">module</span></h1>Shows the current session's labeled pattern-edit history. Drag a column header edge to resize that column. On touchscreens, drag the right side of the header. Double-click or double-tap the edge to restore its default width. The highlighted row is the current pattern state.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#undo"></use>
  </svg>
  <div class="justify">
    <h1>History <span class="object">entries</span></h1>Each entry shows its position, action icon, label and time. Click an entry to undo or redo directly to that pattern state. A new edit after Undo replaces the future branch.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#arrow_up_down"></use>
  </svg>
  <div class="justify">
    <h1>Sort <span class="object">button</span></h1>Changes History display order between descending and ascending. Undo chronology does not change. <span class="default">Default: descending.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#js"></use>
  </svg>
  <div class="justify">
    <h1>View <span class="object">button</span></h1>Changes History between List, Cards, JSON and JavaScript. Cards include the same entry information and support returning to a pattern state. <span class="default">Default: List.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#undo"></use>
  </svg>
  <div class="justify">
    <h1>Undo <span class="object">button</span></h1>Restores the previous pattern edit.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#redo"></use>
  </svg>
  <div class="justify">
    <h1>Redo <span class="object">button</span></h1>Restores the next pattern edit after Undo.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#panel"></use>
  </svg>
  <div class="justify">
    <h1>Panel <span class="object">module</span></h1>Shows editable JSON containing the current pattern, tempo, voice settings, mutes and other Drum Machine settings.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#speech"></use></svg>
  <div class="justify"><h1>Speech <span class="object">button</span></h1>Speaks current Panel text. Press again to stop.</div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#download"></use></svg>
  <div class="justify"><h1>Download <span class="object">button</span></h1>Downloads current Panel text as a text file.</div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#open"></use>
  </svg>
  <div class="justify">
    <h1>Open <span class="object">button</span></h1>Opens Drum Machine JSON or text pattern data and applies valid content.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#download"></use>
  </svg>
  <div class="justify">
    <h1>Save <span class="object">button</span></h1>Saves the current Panel JSON as a pattern file.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#check"></use>
  </svg>
  <div class="justify">
    <h1>Apply <span class="object">button</span></h1>Validates and applies JSON edited in Panel. Invalid JSON is marked without changing the current pattern.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#copy"></use>
  </svg>
  <div class="justify">
    <h1>Copy <span class="object">button</span></h1>Copies the current pattern JSON.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#meter"></use>
  </svg>
  <div class="justify">
    <h1>Meters <span class="object">module</span></h1>Shows shared meter views for the generated drum signal, including while Sound is muted. The active view updates up to 60 times per second.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#guides"></use>
  </svg>
  <div class="justify">
    <h1>Guides <span class="object">button</span></h1>Toggles meter guides. This local button overrides the Settings Guides option for Meters only. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#eq"></use>
  </svg>
  <div class="justify">
    <h1>Spectroscope <span class="object">button</span></h1>Shows 32 logarithmic frequency bands from 20 Hz to the analyser's Nyquist frequency, including frequencies through 20 kHz. New peaks respond immediately and decay briefly between transient sounds.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#meter"></use>
  </svg>
  <div class="justify">
    <h1>Level <span class="object">button</span></h1>Shows output level with immediate peak response and a short release between transient sounds.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#wavelength"></use>
  </svg>
  <div class="justify">
    <h1>Oscilloscope <span class="object">button</span></h1>Shows the waveform and holds the latest triggered frame between transient sounds.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#pulse"></use>
  </svg>
  <div class="justify">
    <h1>Wavescope <span class="object">button</span></h1>Shows the wavescope meter view.
  </div>
</div>
