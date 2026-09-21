# Pekosoft

**Free audio tools.**

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
- **Open source** — GitHub presence is in place, with the first public version being prepared
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

Pekosoft is a collection of free audio tools.

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

Pekosoft favors:

- immediate access
- low friction
- visible controls
- predictable layouts
- large touch-friendly targets
- keyboard accessibility
- minimal distraction
- real utility over feature bloat

## Audio control convention

Pekosoft uses one consistent SOUND button rule across tools:

- SOUND is the master output control (mute/unmute).
- SOUND should not cancel timing state or playback state.
- In BPM Calculator, table row PLAY buttons keep running when SOUND is toggled; only audible output is muted/unmuted.
- For very short transients (for example tick/kick), mid-note gain ramping is not required.
- Voice-level mute buttons in sequencer tools should behave like SOUND buttons: they toggle sound on/off for that voice and use the same blue active state as other Pekosoft toggle buttons.

## Audio routing convention

Pekosoft audio tools should follow one simple signal path unless a tool has a clear reason to differ:

- Route audible voices through an analyser first, then through a master output gain, then to destination.
- Use the master output gain as SOUND control (`1` on, `0` off), not by rewiring/disconnecting graph nodes.
- Keep `window.__pekosoftMetersSource` pointed at the analyser so meters keep one shared contract.
- On any user gesture that starts sound or unmutes SOUND, perform a best-effort `AudioContext.resume()`.

Reference path:

- `voice/source -> analyser -> master output gain -> audioContext.destination`

The site is meant to be usable quickly, even by someone opening a tool for the first time.

## Tooltip grammar rule

Tooltip copy must use singular verbs:

- Use `Toggle`, not `Toggles`
- Use `Show`, not `Shows`

This rule applies to button tooltips and any other hover text that describes a single action.

Tooltip placement rule:

- Tooltips are allowed on labels.
- Do not put `title` attributes on `input`, `select`, or `textarea` fields.
- Do not duplicate the same tooltip on both label and field/menu.

## Reset scope policy

RESET buttons inside tools must clear that tool completely:

- clear tool-specific settings
- clear tool-specific session data
- clear tool-specific stored state (for example history, playlist, panel data)

RESET buttons inside tools must not clear sitewide settings.

Sitewide reset is only allowed from the Settings page.

## Panel editability rule

Panels are always input fields.

Rules:

- Panel textareas must be editable by default.
- Do not set panel textareas to `readonly` unless there is a tool-specific, explicitly approved exception.

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

- `bitcoin.php` is a standalone donation page linked from the main TOC as **BUY US COFFEE**.
- On `bitcoin.php`, the tool menu (Tool, Help, History, About) is intentionally hidden.

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
