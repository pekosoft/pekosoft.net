# Pekosoft

**Free online audio tools.**

Pekosoft is a browser-based collection of audio tools built around clarity, speed, and restraint. The project focuses on practical timing, rhythm, and reference utilities that run directly on the web, with no installation, no subscriptions, no ads, and no unnecessary clutter.

Pekosoft is intentionally small, direct, and modern. It is designed to feel fast, readable, and focused on function.

## Official tools

These are the four official Pekosoft tools currently presented on the front page:

- **Metronome**
- **BPM Calculator**
- **Tap Pad**
- **Turntable**

## Beta tools

The following tools are listed on `beta.php` as tests, experiments, and works in progress:

- **Player**
- **Visualizer**
- **BPM Circle**
- **BPM Curve**
- **Clock**
- **Circle Of Fifths**
- **Drum Machine**
- **Reference**
- **System**
- **Tuner**
- **Notepad**
- **Audio Calculator**
- **Piano**
- **Icons**

## What Pekosoft stands for

Pekosoft is built around a clear set of values:

- **Free** — no paywall, no plans, no subscriptions
- **Source available** — source code can be viewed on GitHub under the repository licence
- **Ad-free** — no advertising, no third-party tracking, no noise
- **Modern** — current standards and modern web practices
- **Simple** — only essential features make the final cut
- **Online** — runs on the web and lives in the browser
- **Inline** — opens directly in the browser, with no separate app workflow
- **Documented** — features are described in Help files and updates are logged in History files
- **Secure** — served over HTTPS with modern handling and structure
- **Responsive** — designed for phone, tablet, laptop, and desktop
- **Automatically updated** — improvements are deployed centrally
- **Lightweight** — compact, efficient, simple
- **Accessible** — large text, high contrast, keyboard access, ARIA labels, and clean structure
- **Customizable** — tool settings can be adjusted per session, and global preferences are saved locally in `localStorage`

## Brand voice

Use `Pekosoft` as the front page's HTML title and `Pekosoft - Page` on other
pages, including `Pekosoft - Tap Pad`. Keep Open Graph titles in the same
brand-first order. This title convention applies to every registered site.

Use **Free online audio tools.** as Pekosoft's sole product description in site metadata, sharing previews and introductory copy. Keep functional descriptions of individual tools. General Help introduces the site with: "Pekosoft is free online audio tools. Have fun with Metronome, BPM Calculator, Tap Pad and Turntable."

Keep social posts and other promotional copy minimal. Use only the existing front-page one-liners for tool descriptions. Do not invent descriptions, slogans or calls to action such as "Try it at pekosoft.net".

- Tap Pad: "For tapping tempo."
- BPM Calculator: "For tempo calculations."
- Metronome: "For keeping time."
- Turntable: "For visualizing RPM."

Use these launch hashtags: #Pekosoft #AudioTools #OnlineAudioTools #MusicProduction #Beatmaking #MusicTools #TapPad #Metronome #MetronomeEmulator #BPMCalculator #Turntable #TurntableEmulator #BPM #RPM #FocusStudios

We are:

- practical
- experimental
- direct
- visual
- functional

## Visual identity

Pekosoft uses a minimal and recognizable visual system.

### Palette

Core colors:

- **Blue** — `#0080ff`
- **Magenta** — `#ff00ff`
- **Dark grey** — `#222`
- **Medium grey** — `#444`
- **White** — `#fff`
- **Black** — `#000`

### Typography

Pekosoft uses a very small font stack:

- **Arial** for interface and general text, as regular and bold
- **Consolas** for code and monospace presentation, as regular

Both are sans- serif. 

### Layout and styling principles

The visual language is based on:

- dark backgrounds
- high contrast
- large readable type
- square edges
- no gradients
- no rounded corners
- no decorative effects
- SVG-based visuals and icons
- clean spacing and straightforward alignment
- **No `!important` declarations under any circumstances.** Use selector specificity and CSS cascade instead.

That stripped-down look is part of the product identity.

Calculator icons use portrait housings with subtly rounded corners. The BPM Calculator's beamed notes use one continuous outline, with stems meeting the oval noteheads at vertical tangents.

Build the shared lock icon as one continuous filled outline, preserving its silhouette and shackle opening without antialiasing seams between the shackle and body.

Show the Demo directly at the top of the front page, without autoplay. Display a large Play button until the visitor starts it, with no audio or timeline progress beforehand. Reuse the standalone Demo in an embedded frame and retain its playback controls. Let its bordered section fill the available content width, including with sidebars open, and cap the frame's height at 450px rather than limiting its width. Keep the presentation at 16:9 on phones and larger screens. Fit it proportionally inside the frame without stretching or cropping, centering it in any unused space. Place the four official tool icons below it, each with its existing name and functional description directly beneath the icon. Keep two tools per row on phones and increase to four only when the available content width reaches 1040px. Keep tool names as large blue linked headings, with descriptions in separate regular-weight white paragraphs and no hyphen separators. Put the social links, copyright and Focus Studios credits together inside the shared 4px grey border. Use matching top and bottom padding for the credits, without extra space below the Focus Studios logo.

Use matching 16px gaps between the front-page Demo, tool grid and credits sections.

After the site's floppy icon (`icons.svg#index`), flash five separate one-second icon-and-text scenes: Simple (`star`), Documented (`reference`, the book icon), Secure (`lock`), Open source (`github`) and Customizable (`settings`). Then show the `pekosoft.net` URL. The Demo uses the explicitly requested "Open source" wording. This does not change the repository licence. Do not repeat the logo at the end or combine the ending scenes. Keep the URL white and inactive throughout typing, both caret blinks and the following 200 ms (about twelve frames at 60 fps). Turn it site blue and enable its link together, 200 ms after the caret disappears permanently. Keep the presentation artwork white.

Keep all Demo text non-selectable. Make the closing URL a keyboard-accessible link to `/` only when it turns blue, retaining its presentation color after visiting. Disable its pointer interaction until that same state activates the link, so the inactive text cannot trigger shared link-hover styling. Type the closing URL in place with a filled white square caret and a soft synthesized keyboard tap for each character. After typing, blink the caret twice and remove it, then activate the complete URL with its delayed color change. Typing, keyboard sound and caret timing follow playback, including pause and resume. Sound mutes the keyboard along with the rest of the presentation.

Center the final URL horizontally and vertically in the viewport. Position status messages outside the presentation's layout so their reserved space or contents cannot shift its center.

Click the Demo presentation to toggle pause and resume. Distinguish single clicks from double-clicks using the existing 320 ms interaction delay. Double-click to toggle fullscreen without changing playback state. Preserve normal button and link interactions, including the initial Play overlay and closing URL. Ignore presentation gestures during video export and cancel pending single-click actions when Play, Replay, fullscreen or export takes over.

Fade demo audio in and out over 20 ms when Play starts, resumes or pauses, without delaying visual playback or changing the timeline. Give each scheduled playback batch its own gain before the shared analyser and Sound mute control. On pause, ramp from the current attack level, stop sources on the audio clock after the fade, then disconnect their graph when they end. A rapid resume must use an independent gain so earlier fade cleanup cannot cut off the new sound. Preserve intentional sound-effect clicks, tool transitions, mute behavior and audio in video downloads.

Include an icon-only Download button in the playback row, using `icons.svg#download`. Export the complete current presentation from its beginning, without controls or status text, as 1920-by-1080 video targeting 60 fps, requesting 16 Mbps video and 256 kbps audio. Prefer supported MP4 (H.264/AAC), otherwise WebM (VP9/Opus or VP8/Opus). Use the existing animation renderer, inline the shared SVG artwork for canvas capture, and record the synthesized audio before the monitor mute gain so downloaded videos always include sound. Fit the current presentation layout without stretching. Double-buffer the canvas so capture never sees partially painted frames. Preserve symbol dimensions when padding the SVG viewBox for overflowing artwork. Show progress, require the tab to remain visible, disable playback controls while exporting, and restore the previous position, playback and sound settings afterward, including after failure. Report unsupported browsers and export failures explicitly. Keep the six controls within phone widths.

Include the shared moon icon as a Dark mode toggle in the Demo control row. Use the existing `global.theme` preference and root `invert-colors` class, restoring the saved mode without interrupting playback.

Keep the More menu's floppy link white in both unvisited and visited states.

Include an icon-only Replay button in the Demo's More menu, using `icons.svg#reset`. Restart playback immediately from the beginning, whether playing, paused or finished. Preserve Sound, Loop, theme and the open menu. Fade out the old audio batch and disable Replay during video export like the other playback controls.

Keep the playback control row collapsed behind the shared More icon. Include a Pekosoft link to `/` using the shared floppy icon, `icons.svg#index`. Expand the controls to the left of More, keeping More anchored in place, and distribute the icons across the full available width. Wrap controls within the available width on narrow screens. More toggles the row and reports its expanded state. Keep the open row and More visible during inactivity. Only hide More after three seconds without interaction when the row is collapsed. Pointer, touch or keyboard activity reveals More again without opening the row. Keep keyboard-focused controls visible. Escape closes the row and returns focus to More. Opening or hiding controls must not interrupt playback.

Briefly blink the opening logo twice without interrupting its fade or opening tone. Play exactly eight Metronome ticks at 120 BPM, without an extra hit or echo tail into Turntable. After Turntable, wait 300 ms, then fade the white floppy in over 150 ms. Include the fade within its one-second stationary hold, then zoom rapidly into its center over one second until the artwork passes out of view. Start larger than the tool icons and grow exponentially to 64 times that size, without stretching, color cycling or added sound. Start the following content immediately when the zoom finishes, without an extra pause. Clip the enlarged artwork at the viewport without introducing scrollbars. Preserve all other scene timing and match the fade and zoom in video exports. These effects follow playback, including pause, resume and restart.

Do not play floppy-drive noise or click effects during the floppy scene. Preserve Turntable's existing decay into the scene.

Match both opening-logo blinks with a quiet, generated mouse-click sound. Share the click timing with the visual effects. Sound mutes the clicks, pause cancels them and resume skips clicks already passed.

Rotate the first four selling-point icons into place over their first 200 ms and out over their final 200 ms, fading with the rotation. Play one short, clear, crystal-like pling as each of the five selling-point icons enters, including the non-rotating Customizable icon. Tie each pling to the icon's entrance, not its rotation, and do not play another on exit. Synthesize a struck-glass tone with a stable C6 fundamental and two quieter partials at 2.756 and 5.404 times that frequency. Use respective peak gains of 0.075, 0.022 and 0.008, a 2 ms attack and immediate exponential decays lasting 320, 160 and 80 ms, ending each partial smoothly at zero. Add a quiet shared reverb with a 350 ms impulse and 12% wet gain, retaining the dry sound. Route the plings and reverb through the regular Demo audio so Sound, Replay, pause, resume and video export apply consistently, without replaying past plings after resuming. Fade the final Customizable icon with the same timing but never rotate it. Hold the icons upright between transitions and keep the text upright throughout. Preserve the one-second scenes. Rotation and fading follow playback, including pause, resume and restart.

For each tool, start the icon, title and sound together. Place the title and one-line tool description in the same caption area below the icon, with their centers aligned. Render the description in white. Show the title for the first 2500 ms, then hide it before fading in the description over 500 ms. Never show the title and description together. Keep the description with the icon until the next scene, preserving the layout when the title disappears. Title and description timing follows playback, including pause and resume.

Synchronize Demo playback to the scheduled audio clock while audio is running. Use the browser's audio output timestamp when available to account for device latency, so Tap Pad's scene entrance and outward feedback pulses match the first audible kick and every following beat. Preserve the paused position until resumed audio reaches the output. Use the audio context clock when output timestamps are unavailable, and retain visual playback when audio is unavailable or blocked. Keep video export on its existing audio-clock timeline.

Use larger artwork for all four animated tool icons and the floppy on desktop and phones. Keep the floppy larger than the tools. Preserve the playback control and feature-point icon sizes.

During the opening "Free online audio tools." card and the floppy scene, scatter sparse grey grains and specks across the full viewport behind the presentation using `--grey1` and `--grey2`. Reuse the same grain background for the floppy's delay, fade, hold and zoom. Keep the texture subdued and irregular, mixing small specks of different sizes with a few very short horizontal and vertical lines. Leave generous empty areas and avoid evenly spaced dots. Match the texture in video exports. Shift the tile every 120 ms of playback and freeze it when paused. Keep the opening logo, all four tool scenes, selling-point cards and closing URL backgrounds plain.

Play the BPM Calculator's four-note melody exactly twice over a four-second scene, then move straight to Metronome while the existing triplet-delay tail decays.

Match the actual Turntable tool's rotating radial line from the platter rim to its center. Do not substitute a rotating dot. Preserve the shared turntable artwork and static tonearm.

Start the Demo's Turntable from rest, winding up linearly to 33 1/3 RPM over one second. Hold that speed for two seconds, then brake linearly to zero over the final two seconds of its five-second scene. Use a lower C2 tone (65.4064 Hz at full speed), with peak gain 0.04 applied consistently to its attack, hold and resumed fade. This deliberately slower Demo stop replaces the tool's normal 60 RPM per second braking rate without changing the tool itself. Derive pitch and rotation from the same RPM profile, integrating that profile for the line's angle. Pitch is proportional to RPM during both wind-up and wind-down, not an independent descent. Pause, resume and video export must preserve this synchronization.

Mix clearly audible vinyl-style crackle with the Demo's quieter Turntable test tone. Use sparse 2 ms noise bursts with a maximum sample amplitude of 0.1 at full speed, softened with a 3500 Hz lowpass filter and passed through a 600 Hz highpass filter to reduce bass. Route the crackle directly into the shared playback gain, independently of the tone's volume envelope, so lowering the tone does not also suppress the crackle. Scale the crackle's level and event rate with platter speed during wind-up and braking. Stop it when the platter reaches rest, without adding crackle to the floppy scene. Pause cancels it, resume starts at the correct buffer offset, and Sound, Replay and video export use the normal Demo audio routing.

In the Demo, outline the Metronome body so the moving pendulum remains visible, keeping its base filled. Keep the outline inside the original silhouette so its sloping sides align with the base. Omit the static vertical tempo center line. Retain four signature circles on the base, indicating the current beat. Use the shared `icons.svg#pendulum_weight` shape for its moving weight, never a plain rectangle.

Extend the pendulum arm to its pivot inside the base and draw the filled base and signature circles in front of it.

Mask the static circle out of the Demo's shared Tap Pad artwork while preserving the complete hand. On each kick, launch one fully opaque feedback ring from inside the pad face, expanding outwards beyond it over 180 ms. Hide it between kicks so resetting its radius cannot look like inward movement. Do not fade the ring. Preserve pulse timing and visibility during pause, resume, Replay and video export.

Keep the Demo's Tap Pad kick dry sound and decay unchanged, with a 1.1-second reverb at 0.5 wet gain. All eight kicks use the same pitch, level and attack, without alternating accents. Initialize the oscillator frequency to its attack pitch before scheduling the envelope so its timbre does not depend on audio render-block alignment.

Fade the opening Low C out from 5.4 to 6.6 seconds, overlapping the first 600 ms of Tap Pad. Keep the first kick and visual transition at 6 seconds. Pause and resume preserve the remaining fade rather than restarting the note.

Do not play background music. Keep the opening Low C, individual tool sounds and keyboard taps, including their existing transition tails.

Let tool audio decay into the following scene without moving scene transitions or adding beats. Keep Metronome clicks dry, without reverb. Use a short, quiet reverb for Tap Pad, allow Calculator's triplet echoes through 600 ms after its scene and extend Turntable's fade by 600 ms into the floppy scene. Keep Turntable's pitch descent aligned with its visible motion. Pause cancels voices and effect nodes, and resuming during Turntable's tail preserves its final pitch and remaining fade.

The Demo is a timed presentation of the logo, approved product description and four official tools with their exact front-page descriptions. Keep the opening visuals at 6 seconds, showing the logo for the first 3 seconds and "Free online audio tools." for the next 3 seconds, never together. Fade each visual in and out separately while Low C sustains across both. Its only controls are icon-only Dark mode, Sound, Play, Loop and Fullscreen buttons in the upper-right corner. Fullscreen follows the browser's current fullscreen state, including exits with Escape, without interrupting playback. Disable it when the browser does not support fullscreen. Start with a sustained C1 and a logo fade, playing with sound enabled and Loop disabled. Use eight synthesized kick taps for Tap Pad, a triplet-delay phrase for BPM Calculator, four-beat accented clicks for Metronome without a transition tail, and a deep wind-down for Turntable. Icon motion follows the audio timing. Move to BPM Calculator after Tap Pad's eighth beat. Calculator notes scroll continuously right to left inside its stationary display window for the entire scene, with a note visible immediately and no final hold. Scroll half, quarter, eighth and sixteenth notes, followed by the double-note motif cropped from the actual Calculator sprite. Repeat the five-symbol sequence seamlessly at the existing speed, without stopping on the double note. The turntable slows from 33 1/3 RPM with its falling pitch, keeping its original static tonearm. Pause freezes motion and stops all scheduled audio. Sound only mutes the master output. Do not add promotional slogans or unrelated decorative motion.

### Table rows

Never wrap or break text in tables. Keep table cells on one line with
`white-space: nowrap` so rows retain a uniform height. Use horizontal scrolling
and column resizing for long values. Cards may wrap text.

Always center table header text, independently of the table or column's body-cell
alignment. Scope column-specific alignment rules to `td` so they never override
headers.

## Root CSS variables

The main shared `:root` variables currently defined in `css/index.css` are:

```css
:root {
  --color1: #0080ff;
  --color2: #ff00ff;
  --grey1: #222;
  --grey2: #444;
  --white: #fff;
  --black: #000;
  --font-size: 22px;
  --maxwidth: 4096px;
  --size1: 28px;
  --size2: 32px;
  --size3: 40px;
}
```

These variables define the main Pekosoft palette, typography scale, and layout sizing.

## Product focus

Pekosoft is centered around BPM and rhythm-related experimentation.

Core themes include:

- tempo
- beat timing
- rhythmic reference
- visual timing feedback
- musical calculations
- audio-oriented utilities in the browser

The project sits in the space between music production, web tools, and mathematical structure.

## User experience principles

The front page focuses on the official tools without an updates feed. Updates remain available from the TOC. Share opens a sharing action rather than a page and is available in Settings after Fullscreen.

Grid, Size, Alpha and Background controls live on `/dev`, not in Settings. Their saved preferences still apply sitewide through the shared settings code.

Linked logos use the same hover opacity as linked icons. Unlinked artwork remains unchanged.

Pekosoft favors:

- immediate access
- low friction
- visible controls
- predictable layouts
- large touch-friendly targets
- keyboard accessibility
- minimal distraction
- real utility over feature bloat

More menus use the same control layout and spacing as the regular module view. The More control indicates when its menu is open. More stays open until the user activates that module's More control again. Outside interactions and changes to module layout or visibility must preserve this mode. Global Reset is the exception and closes every module menu.

## Production deployment

The Deploy site workflow uploads only runtime files. Repository-only tooling, tests, configuration and documentation must remain excluded from incremental uploads, full sync and `.ftpignore`.

Incremental deployment compares the checked-out revision with the most recently completed successful deployment of the same branch. This includes every commit in a push and changes left undeployed by failed or cancelled runs. Missing or non-ancestor deployment baselines require a full sync. GitHub API errors fail the run rather than selecting an assumed baseline, and SFTP upload errors must fail the deployment.

To recover from an incomplete deployment, run Deploy site manually on `main` with mode `full`, then verify the affected production assets and pages. Rerunning the old workflow in changed mode does not repair files skipped by its former single-commit comparison.

## User-facing writing convention

- **Describe function and behavior, not cosmetic styling. This rule is mandatory across the entire site**, including General and tool-specific Help, tooltips, accessibility descriptions, About and History text.
- Do not specify interface colors, pixel sizes, line thicknesses, font names or decorative styling in user-facing descriptions. Do not identify controls, traces, cursors or states by their colors. Describe their purpose, meaning or state instead.
- Write "Shows crosshair lines across the Meters plot.", not "Shows one-pixel grey crosshair lines across the Meters plot."
- Describe correlation cursors by the values they represent: current, minimum and maximum. Do not list their colors or the color of the readout.
- Keep information needed to use a feature: interactions, units, ranges, defaults, signal meanings and the behavior of named controls such as Color, Bright, Alpha and Font. Actual data measurements such as System's screen dimensions and pixel ratio, or an adjustable Icons grid size, retain their relevant units. These are functional values, not descriptions of cosmetic styling.
- Implementation documentation may specify CSS sizes, palette values and rendering details. Keep those details out of user-facing prose.
- Apply this convention before adding or changing any user-facing text. Check related entries for the same issue and centralize shared behavior in General Help rather than repeating it in every tool's Help.

## Code naming convention

- **Code names must be generic, descriptive and unbranded.** This applies to classes, functions, variables, modules, namespaces, worklet processor IDs and other internal identifiers.
- Do not introduce `Peko`, `Pekosoft`, `peko-` or `pekosoft-` prefixes in code names. Use `PcmRecorderProcessor` and `pcm-recorder`, not `PekoPcmRecorderProcessor` and `pekosoft-pcm-recorder`.
- Follow this rule for every new or renamed identifier. Preserve existing public names when compatibility requires them, and do not mass-rename unrelated legacy code.
- Product text, attribution and user-facing download filenames may retain the Pekosoft brand. They are not internal code identifiers.

## PHP request handling

- Public URLs omit `.php`, including `/about`, `/help`, `/history` and `/updates`.
  `.htaccess` redirects implementation URLs permanently, preserving queries.
  Keep local Caddy routes and context-page swipe navigation consistent.
- Direct HTTP access to `elements` and `data` returns 404. PHP includes and file reads remain available to the application. Updates uses the public `/updates_data.php` endpoint.

- About, Help and History release parameters (`t`) must be strings. Array-valued parameters receive HTTP 400. Shared page metadata ignores non-string release parameters on standalone pages.
- The updates feed accepts integer `page` and `per_page` parameters, defaulting to 1 and 25. Values below 1 are clamped to 1, and `per_page` is capped at 100. Invalid or out-of-range integers receive HTTP 400; pages beyond the available entries return an empty list with the unchanged total count.
- Failed reads of existing About metadata are logged and return the HTTP 500 page before normal page output.
- Run the PHP compatibility regression tests with `node --test tests/php_compatibility.test.cjs` using PHP on `PATH`.

## Circular instrument layout

- Use the shared `circular-instrument` module-body class for a single circular instrument. It fits a square into the module's available content width and height with standard margins, including when maximized.
- On phones, a non-maximized circular instrument fills the module width and the module grows to contain it. Do not add tool-specific diameter caps or viewport-based maximize calculations.
- Visualizer's All mode keeps smaller meters so several can be shown together. Its Single mode uses the shared circular sizing.
- Clock shares its Instrument with a calendar. The cards stack or sit side by side according to the Instrument's available width. Stacked cards fill their width. Side-by-side content also fits the available height, reserving room for the date and time. Preserve scrolling when both cannot fit vertically.
- The calendar uses equally sized squares for week numbers and dates, with a spacer between the week-number column and the dates.

## Cards heading convention

- In every Cards view, show the card's name or title without a field-label prefix such as "Name:". Keep labels for the other card details.

## Guides text selection convention

- Use "guides" when referring to plot reference lines collectively, not "grid" or "guide". Use Guides when referring to the named control.
- Text associated with guides, timelines and rulers must never be selectable. This includes axis titles, ticks, numbers, units and channel labels in Meters.
- Enforce `user-select: none` through shared styles for guides and rulers, including SVG roots and text. Cover both `.timeline-ruler-layout` and Player's `.player-ruler-layout`, not only elements inside Timeline.
- Preserve pointer interactions such as seeking, dragging and scrolling. Keep text selection and editing available in inputs and Panel textareas.

## Audio control convention

Pekosoft uses one consistent SOUND button rule across tools:

- SOUND is the master output control (mute/unmute).
- SOUND should not cancel timing state or playback state.
- In BPM Calculator, table row PLAY buttons keep running when SOUND is toggled. Only audible output is muted/unmuted.
- For very short transients (for example tick/kick), mid-note gain ramping is not required.
- Voice-level mute buttons in sequencer tools should behave like SOUND buttons: they toggle sound on/off for that voice and use the same blue active state as other Pekosoft toggle buttons.

## Audio routing convention

Test-tone definitions, names and sample generation live in [js/test_tones.js](js/test_tones.js), exposed through `window.PekoTestTones`. Generate buffers on demand using the caller's AudioContext. Player owns playlist metadata, playback, looping and Timeline integration. The helper must not create its own AudioContext, start playback or encode audio files.

Player records uncompressed WAV by default. [js/pcm_recorder.js](js/pcm_recorder.js) is an AudioWorklet processor that sends channel-separated PCM chunks to Player, which uses its existing 16-bit WAV encoder. Its output is silent and connected only to keep capture processing active. Capture uses the existing AudioContext and preserves its sample rate and the input channel count. The recording-format menu persists under `player.recording_format` and offers only browser-supported MediaRecorder alternatives. Recorded downloads retain their actual MIME type and extension. Timeline edits and generated tones remain WAV.

Pekosoft audio tools should follow one simple signal path unless a tool has a clear reason to differ:

- Route audible voices through an analyser first, then through a master output gain, then to destination.
- Use the master output gain as SOUND control (`1` on, `0` off), not by rewiring/disconnecting graph nodes.
- Keep `window.__pekosoftMetersSource` pointed at the analyser so meters keep one shared contract.
- Stereo Meters sources must also expose separate `analyserLeft` and `analyserRight` nodes. Level, Wavescope and Phasescope must read the corresponding channel, not the mixed analyser or a copy of the other channel. Upmix centered mono voices before splitting a stereo tool's output so both channels match the audible signal.

Phasescope uses float time-domain samples from separate L/R analysers, aligning the newest samples if their FFT sizes differ. Plot (R - L) / 2 horizontally and (L + R) / 2 vertically at equal physical scales. Compute correlation as the normalized L/R sample product, clamped to [-1, +1], and show a dash when either channel has no energy. Mono uses the same signal for both channels. Never fabricate a mono trace for a stereo source missing its channel analysers. Correlation uses a current-value cursor and numeric readout in fixed `--color1` blue, with one-second rolling minimum and maximum cursors in fixed `--color2` magenta. Color changes only the phase trace, never these indicators. Cache the trace, correlation and extrema together so Freeze and paused presentation changes never sample audio or age the held range. On live updates, discard range samples at least 1000 ms old. Undefined correlation and Reset clear the range.
- On any user gesture that starts sound or unmutes SOUND, perform a best-effort `AudioContext.resume()`.

Reference path:

- `voice/source -> analyser -> master output gain -> audioContext.destination`

The site is meant to be usable quickly, even by someone opening a tool for the first time.

## Tooltip grammar rule

Tooltip copy must use singular verbs:

- Use `Toggle`, not `Toggles`
- Use `Show`, not `Shows`

This rule applies to button tooltips and any other hover text that describes a single action.

- State the action directly. For a mode switch, use "Switch to pad" or "Switch to grid", not "Grid. Switch to Pad" or "Pad. Switch to Grid".
- Do not prepend the control name or a current-state fragment to the tooltip. Keep the control name separate. For example, the name is "Mode", the tooltip is "Switch to pad" and the shared statusbar combines them as "Mode: Switch to pad".

Tooltip placement rule:

- Tooltips are allowed on labels.
- Do not put `title` attributes on `input`, `select`, or `textarea` fields.
- Do not duplicate the same tooltip on both label and field/menu.

## Prose writing convention

- Do not use semicolons in Help, tooltips, documentation or other prose, including assistant responses. Use short sentences or simple conjunctions instead. Preserve semicolons required by code syntax or HTML entities.

## Commit title convention

**Mandatory: read this section before suggesting a title or creating a commit. Do not rely on memory or reuse a previous suggestion without checking it.**

- **Describe the result from the user's point of view, not a list of implementation tasks.** Identify the main feature or behavior the user gained.
- Consider the complete change being committed, including work already present when the current request began. Do not let the latest small adjustment replace the main feature in the title.
- Supporting controls, shortcuts and fixes to defects introduced while implementing a feature belong in the commit body when useful, not as extra clauses in the title. A standalone fix may be the main user-facing change of its own commit.
- Example: **Added drum pads to Drum Machine**. Do not use "Added Drum Machine Blink and keyboard shortcuts, and fixed Mode icon flicker" for that feature.
- Use short, past-tense titles focused on user-facing changes.
- **Never end a commit title with a period.** This is a strict rule for suggested titles and actual Git commit subjects.
- Do not mention development Markdown, internal guidance updates or routine documentation maintenance in titles.
- Cover all substantive user-facing changes without listing every implementation detail.

## Deployment

The standardized `.github/workflows/deploy.yml` workflow uses lftp over SFTP.
It reads `.ftpignore`, generates `data/updates.json` from Git history and
uploads changes since the last successful upload on the same branch.
Failed commits are recovered by the next successful upload.
Missing baselines fail explicitly instead of selecting full sync.
Manual **check** mode verifies login and destination without modifying files.
**dry-run** previews a deployment plan without connecting.
Neither mode replaces the upload baseline.
Full mode uploads tracked runtime files without deleting remote-only files.

Configure `SFTP_HOST`, `SFTP_USERNAME`, `SFTP_PASSWORD`
and optional `SFTP_PORT` (22 by default). Existing FTP-named settings are
compatibility aliases only, not a change of protocol. Verify SFTP access and
the exact website destination before uploading.
The workflow defines `SFTP_REMOTE_DIR` as `/home/flamenco/pekosoft.net`.
The old destination variable and `SERVER_DIR` secret are not used.
Run `node --test tests/deployment.test.cjs` for the deployment regression suite.
See the shared [deployment procedure](../SITES.md#deployment).

## Help writing conventions

- Describe deterministic calculations as "calculates" or "calculated", not "estimates". State actual limitations explicitly, such as excluding file headers and metadata.
- Expand technical abbreviations in parentheses on first introduction, for example `PCM (pulse-code modulation)`.
- Browser persistence is a sitewide convention. Explain it in General Help only, not in individual tool Help files or feature entries.
- Centralize shared behavior in the relevant General Help entry instead of repeating it in individual tool Help files. Document double-click reset only in the general Knob entry. Keep tool-specific behavior and default values in individual feature entries.
- Document defaults in the relevant feature entry using `<span class="default">Default: ...</span>`. Do not repeat a startup configuration in the tool introduction or duplicate default lists in module descriptions.
- Describe features by their names and behavior, not their current colors. Use "selected cell", "Signal", "Steps" and "Points", not "blue selected cell" or color-based identification.
- Do not identify controls by position, ordinal order or layout, such as "the third tab" or "the button on the right". Use the control's name and, when needed, its module. Help must remain correct when controls are moved or reordered.
- Keep actual calculations distinct from illustrative examples. Explain which settings are shared and which affect only the example.

### Capitalization in Help prose

- Use normal sentence case. Technical concepts are lowercase: sample rate, bit depth, frequency, amplitude, channels and duration.
- When explicitly referring to a named control, use its label's casing and wording: "the Sam. rate menu", "the Bit depth knob" or "the Values button". Do not capitalize a concept merely because a control exists for it.
- Keep named modules capitalized: Instrument, Controls, Timeline and Panel. Generic references such as "the module", "the grid" and "the ruler" stay lowercase.
- Preserve proper names, acronyms and standard unit casing: Pekosoft, PCM, BPM, FS, dBFS, Hz, kHz, ms, MB and kb/s.
- Use sentence case for descriptive feature headings, not title case: "Bit depth", not "Bit Depth". Named control headings follow the control label.
- Example: "Calculates values from sample rate and bit depth. The Sam. rate menu changes the sample rate used by Timeline."
- Apply this distinction contextually. Do not normalize the whole site with blind capitalization replacements.

### Canonical control names

- Use the authored associated label for fields and menus, or the authored `.button-text` for buttons, as the control name. Remove a trailing colon, but retain meaningful abbreviations and units.
- CSS uppercase rendering is presentation, not the spelling to use in Help prose. A button authored as `Reset` remains "the Reset button" even when displayed as `RESET`.
- For icon-only controls without a visible label, use the accessible name (`aria-label`). Use the tooltip name only when no visible or accessible name exists.
- A tooltip describes an action and may be longer than the name. For example, `Reset to default` is a tooltip instruction, not a replacement for the name `Reset`.
- Use uppercase words only for displayed text-button labels and in-grid labels such as `BEAT` and `NOTE`, apart from standard acronyms. References quoting those grid labels retain their spelling.
- Keep the surfaces distinct: button text `RESET`, tooltip `Reset to default`, Help heading `Reset button`, and statusbar message `Reset: Reset to default`.
- Help headings and references must identify the same control. Preserve contextual Help links: names and feature kinds must continue to match the existing Help lookup. Use supported heading aliases when needed rather than silently breaking navigation.
- When modules share a control name, set the same explicit `data-help-entry` on the control and its Help heading to distinguish the destination without changing the displayed name.
- The status-bar Help link retains the last control's destination while hovered, focused or activated. Never describe that link as a new control or rebuild its destination from its own accessible name.
- Shared Settings controls always target General Help, using their authored control names. Settings toggles target option entries, not similarly named tool or Meters buttons. Tool-local controls retain their own Help targets.
- If names conflict in the interface, record the discrepancy for a separately scoped UI pass. Do not invent a new Help-only name or change runtime behavior during an editorial pass.

## Maintaining project conventions

- Before changing UI or Help, read the relevant project guidance: this file and any applicable specialist document, such as [Timeline Rulers](rulers.md).
- When user feedback establishes or changes a reusable convention, update the existing guidance as part of the same change. Fixing one occurrence without recording the rule is incomplete.
- Preserve agreed conventions during later changes. Do not make the user repeatedly correct the same wording or layout decisions.
- Apply rules throughout the feature being edited. Keep broader sitewide migrations separately scoped rather than silently changing unrelated tools.

## Reset scope policy

Player System Audio uses `getDisplayMedia` through the existing Input menu. Request stereo with echo cancellation, noise suppression and automatic gain control disabled to preserve the captured signal. Use the audio track's reported channel count, not the `MediaStreamAudioSourceNode.channelCount` input configuration, for live Meters and input details. Rebuild the channel splitter and update the Meters bridge when restoring another source after monitoring or recording ends. Monitoring and recording share one audio-only stream and do not route it twice into Meters. The browser's video track is retained only for sharing-session lifetime and is never processed or recorded. Do not reopen display capture automatically on reload. Windows system audio requires a supported browser and an audio-enabled sharing source.

RESET buttons inside tools must clear that tool completely:

- clear tool-specific settings
- clear tool-specific session data
- clear tool-specific stored state (for example history, playlist, panel data)
- include shared-module state stored under the current tool's namespace, such as `meters.player.*` for Player

RESET buttons inside tools must not clear sitewide settings.

Sitewide reset is only allowed from the Reset button in Settings.

Global Reset must restore everything to factory defaults, including module order,
visibility, layout, open module menus, all tool data and settings, session storage
and the selected background image. Wait for persistent background removal before
reloading the page so no live tool or module state survives. Keep the reset storage
lock active through reload to prevent stale state from being saved again.

Clearing local Guides, Bright, Rulers and Multicolor overrides restores their global defaults. Bright returns to off when the global Bright setting is off.

Clock tick sound defaults to off even when global Sound initially defaults to on. Preserve stored control choices, and let explicit global Sound changes include Clock. Clock Reset must keep its sound off after reloading rather than restoring a stale shared Sound registry entry.

## Meters Freeze

The shared Meters Freeze button holds meter samples without stopping audio or recording. Guides, Bright, Rulers, Color, mode changes and resizing redraw from cached samples or Wavescope history without sampling or advancing the held signal. Freeze is transient, starts off and is released by tool Reset or page reload. Document its shared behavior in General Help rather than individual tool Help files.

Meters All mode uses the shared 4px `--grey1` dividers between meter frames and below their non-selectable titles, without extra outer padding or doubled borders. Use “Level meter” as the frame title. Meter titles stay neutral. Meter tabs independently toggle the visible views and indicate visibility with a blue highlight and `aria-pressed`. Play and Next are disabled. Bitmap export still uses the selected single meter if visible, otherwise the first visible meter.

Shared Meters behavior and control descriptions live in General Help. Tool Help
keeps a module summary and links to that section. Meters controls target General
Help explicitly so contextual Help stays consistent without per-tool copies.
Abbreviated Meters tab labels retain explicit `data-help-entry` values matching
their full Help headings, so shortening a label does not break entry navigation.

## Panel editability rule

Panels are always input fields.

Rules:

- Panel textareas must be editable by default.
- Do not set panel textareas to `readonly` unless there is a tool-specific, explicitly approved exception.

## Controls section order

Controls use separate sections in this order: buttons, fields and menus, sliders, then knobs. Omit sections that a tool does not need.

Knobs belong in their own `controls-knobs wrapper` section below the other controls, not above or mixed into the fields and menus. Use the shared section styles.

For tools with illustrative examples, keep example settings separate from the main calculation settings. Put the example's time span before its other parameters, consistently in fields, knobs and Panel output.

Panel summaries must separate main calculation data, illustration settings and illustration error statistics with blank lines. Example measurements must not appear to describe the entire hypothetical file.

## Controls sizing rule

Label, field, and menu sizing inside controls pairs is strict and must stay uniform.

Rules:

- Labels, input fields, and select menus in one pair must use the exact same width share.
- Do not introduce split-ratio sizing (for example 40/60, 42/58, 50/50 overrides) for one tool.
- Do not add per-page CSS overrides for controls sizing unless explicitly approved for a specific tool requirement.
- Controls sizing behavior should live in global styles and stay consistent across tools.

## Numeric formatting convention

Three decimals is the Pekosoft standard for numeric displays.

Rules:

- Default to three decimals across all tools.
- Use a different precision only when the context inherently demands it.
- Example exception: large average integer counters in Tap Pad use zero decimals.

## Icons ruler density rule

Icons Tool ruler numbers must stay readable at small grid sizes.

Rule:

- Grid sizes from `8px` through `64px` use `64px` ruler-number intervals.
- Grid sizes above `64px` use the current grid size as the ruler-number interval.
- Ruler numbers are positioned by their own interval, not by the current grid-cell size.

## Version policy

Pekosoft does not include fallback behavior for previous versions.

Rules:

- No backward-compatibility fallback logic.
- No legacy aliases for renamed IDs, classes, or settings keys.
- No migration branches for old behavior in runtime code.
- No legacy-browser vendor prefixes (for example `-ms-*`) in CSS.
- Keep production code focused on the current version only.

Modern policy statement:

- Pekosoft adheres to the latest standards and best practices, without targeting legacy browsers or operating systems.

## JavaScript file ending rule

All JavaScript files must end with this final line:

- `// END OF FILE`

Use this consistently for new files and when touching existing files.

## Site structure

Pekosoft is organized as root-level PHP pages rather than tool folders. The current structure is simple and transparent.

### Main page types

- Tool pages
- Help pages
- History pages
- About pages

### Main directories

- `css/` — shared and per-tool stylesheets
- `js/` — shared and per-tool scripts
- `help/` — feature documentation
- `history/` — update logs
- `about/` — short tool-specific metadata
- `img/` — small site assets
- `png/` — preview graphics / Open Graph images

### Main root files

Examples of root-level tool and site files include:

- `index.php`
- `metronome.php`
- `bpm_calculator.php`
- `tap_pad.php`
- `turntable.php`
- `beta.php`
- `icons.php`
- `help.php`
- `history.php`
- `about.php`

Special page note:

- Shared TOC links use this order: Buy Us Coffee, Contact, Updates. Omit Demo from the TOC, retaining its front-page embed and standalone `/demo` URL. Share is in Settings, not the TOC. Preserve this arrangement in both official and Beta navigation.
- `bitcoin.php` is a standalone donation page linked from the main TOC as **BUY US COFFEE**.
- On `bitcoin.php`, the tool menu (Tool, Help, History, About) is intentionally hidden.
- `contact.php` is a standalone Contact page at `/contact`, linked from both the official and Beta TOCs and included in their Play sequences. It uses General, Bug report and Feature request categories and sends to `ole@peko.net`. Its implementation URL redirects with HTTP 308 to preserve form POSTs.
- Contact uses PHP `mail()`. Production hosting must provide a working mail transport and authorize the sender `contact@pekosoft.net`. Visitor email addresses are used only in Reply-To, never as From.
- Contact submissions use server-side validation, session tokens, a honeypot and a one-minute session send limit. Mail failures are logged and shown explicitly, with the submitted text preserved.
- Contact hides the tool-specific Tool, Help, History and About navigation, has no separate Help or About page, and is excluded from page-swiping loops. It remains available through the TOCs and Play sequences. The form has no introductory text or visible Message label. Keep the Message field accessible through its `aria-label`.
- Contact Reset clears all form fields and submission feedback and restores General. It does not clear sitewide settings or bypass the session send limit.
- Contact reuses Buy Us Coffee's responsive speaker columns, which repeat beside the form when the available content width permits.

### Icons

See [`icons.md`](icons.md) for Pekosoft icon authoring rules, sprite conventions, and icon workflow notes.

## Module philosophy

Across the site, tools consist of a small number of reusable conceptual modules:

- **Instrument** — the core working area
- **Controls** — buttons, fields, menus, sliders
- **Timeline** — scrollable visual time-based feedback
- **Panel** — text-based session output or data display

This modular approach helps keep the tools consistent without making them bloated.

## Interface elements

Common Pekosoft UI elements include:

- buttons
- labels
- value fields
- menus
- sliders
- radio buttons
- toggles
- icons
- panels
- scrollable timelines

UI text conventions:

- Visible button labels use uppercase.
- Tooltip titles use concise sentence case.
- Tooltip titles should describe the action clearly and directly.
- Use DD-MM-YYYY as the standard date format for user-visible dates and exported filenames.
- Use HH:MM:SS.mmm (24-hour) as the standard time format for user-visible timestamps.


Sliders convention:

- no tooltip on slider inputs
- tooltips on slider decrease and increase buttons only

The UI language aims to stay consistent from tool to tool.

## Key casing conventions

`localStorage` keys follow a consistent namespace and casing format across Pekosoft:

- Use `tool_name.key_name` format.
- Use lowercase only.
- Use snake_case for multi-word tool names and key names.
- Do not use camelCase or PascalCase in key names.

Examples:

- `metronome.show_guides`
- `bpm_calculator.state`
- `turntable.show_guides`

## Player Tool

The Player tool includes feature-specific footer buttons for both the Instrument and Panel modules:

### Instrument Footer

The **Instrument footer** contains buttons to switch between visualization meters:

- **Spectroscope** (`eq` icon) — displays frequency analysis visualization
- **Level meter** (`meter` icon) — displays audio level meters
- **Oscilloscope** (`wavelength` icon) — displays waveform oscilloscope

Only one meter is visible at a time. The selected button is highlighted with the `button-on` class. The user's selection is saved to `localStorage.player.tool_meter`.

### Panel Footer

The **Panel footer** contains buttons to switch between data display modes:

- **Meta data** (`tag` icon) — displays file metadata (name, size, duration, sample rate, channels, format)
- **Audio input** (`mic` icon) — displays audio input details (sample rate, channels, latency, device)

Only one mode is displayed at a time. The selected button is highlighted with the `button-on` class. The user's selection is saved to `localStorage.player.panel_source`.

## Accessibility and responsiveness

Accessibility is treated as part of the product, not an afterthought.

That includes:

- keyboard tabbing
- visible focus handling where appropriate
- ARIA labels
- alt text
- large default text
- high contrast
- responsive layouts for mobile and desktop

## Technical profile

### Local previews

The cross-site register is [Websites](../SITES.md), beside the shared VS Code workspace.
Pekosoft uses HTTP port 8000 with Caddy and PHP FastCGI. Run the shared
`../local-tools/startup.ps1` command to start all eight previews, beginning with
MC Peko on port 8001. The `.dev/startup-localhost.ps1` entry point delegates to
that shared routine. It verifies managed processes, routing, redirects, query
preservation, production canonical metadata, static files and missing pages.
The shared routine also synchronizes the master icon sprite, maintains one icon
watcher and reuses Chrome site groups. See the register for missing browser links
and the user action needed to allow VS Code's automatic startup task.

### Visualizer

Visualizer uses one Instrument module. Its meter tabs select one meter in One
mode and toggle visibility in All mode. Single-meter selection is independent
of All visibility preferences. The header reads `Visualizer: {meter}` or
`Visualizer: All`. Display/playback controls belong in the Instrument
footer. Next cycles meter tabs in One mode. Visualizer uses global BPM only,
including on Reset, and ignores legacy `visualizer.bpm` preferences.
One with Clock selected is the default and Reset mode. Saved selections are retained. All uses an
adaptive grid filling the available meter area, recalculated on resize and
visibility changes.
Meter content stays clipped to its boundaries whether Mask is enabled or not.

### Reference data

Reference includes music, timing, metric prefixes and cable tables.
The `a` query parameter selects `bpm`, `tempi`, `notes`, `scales`, `chords`,
`prefixes` or `cables` ahead of the saved mode. Table selection and Reset update
the URL without navigation, preserving other query parameters and the fragment.
The shared Share control uses this URL. Links retain the recipient's view,
sort and column preferences. Unknown table values produce a console warning
and fall back to the saved mode or BPM.
Server-rendered titles, canonical links and Open Graph URLs retain valid
Reference table selections so social crawlers do not need JavaScript.
Reference links use the shared Reference preview image and a relevant description.

Bitmap previews in `png/` and `png/og/` centre the visible artwork bounds within
their existing canvas. Preserve artwork pixels and dimensions when adjusting
alignment. Contact uses the TOC speech icon and Updates uses the TOC GitHub icon
for their page-specific previews. Run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .dev\center-preview-images.ps1`
to centre both sets, or add `-Check` to validate
them without writing files. Opposite margins may differ by one pixel when the
canvas and artwork dimensions have different parity.
Cables data in `js/cables.js` separates interface revisions, cable certifications
and connector formats. Rates are nominal link or signaling rates. Video formats
are examples with qualifications, not universal maxima. Every row has a source.
All 19 columns support table and card views, visibility preferences,
sort reversal and Reset. Keep the column-control capacity in `tools/reference.php`
at least as large as the widest Reference table when extending the data.
The leading connector pictogram is decorative reference information. Cards keep
the cable name as their heading and copy enabled text without the pictogram.
Developer links identify originators or standards organizations. General wiring
conventions explicitly use No single developer. Developer is appended after Source
so existing column indices and visibility preferences remain aligned.

Pekosoft is intentionally built with a minimal stack:

- **PHP**
- **HTML**
- **CSS**
- **JavaScript**
- **SVG**

There is no heavy framework layer at the center of the project. That choice keeps the site understandable, portable, and easy to inspect.

## Licensing and openness

Pekosoft is being prepared for public GitHub release under the Apache License.

## Current status

Pekosoft is currently in alpha and still under active development.

## Donations

Pekosoft is free and ad-free. Donations are welcome through the bitcoin-only address and QR code on the site.

## One-sentence description

**Pekosoft is a modern, browser-based, open, ad-free collection of audio tools built around simplicity, clarity, and usefulness.**

## One-sentence descriptions for tools

### Official tools

- **Tap Pad** - For tapping tempo.
- **BPM Calculator** - For tempo calculation.
- **Metronome** - For keeping time.
- **Turntable** - For visualizing RPM.

### Beta tools

- **Player** - For playing, recording, and inspecting audio.
- **Visualizer** - For visualizing BPM.
- **BPM Circle** - For playing and visualizing note values.
- **BPM Curve** - For creating tempo curves.
- **Clock** - For viewing local time and date.
- **Circle Of Fifths** - For exploring harmony.
- **Drum Machine** - For making beats.
- **Reference** - For looking up music and timing references.
- **System** - For viewing client information.
- **Tuner** - For tuning instruments.
- **Notepad** - For writing and keeping session notes.
- **Audio Calculator** - For calculating resolution and size.
- **Piano** - For playing, recording and visualizing pitch.
- **Icons** - Free music icons.
