# Timeline Rulers

## Rendering Contract

Timeline rulers and plots are separate SVG roots. Each visible edge has one owner:

- Corner ruler: shared top-left outer frame and internal corner seams.
- Horizontal ruler: top outer frame, time ticks, and plot-top internal seam.
- Vertical ruler: left and bottom outer frame, value ticks, and plot-left internal seam.
- Plot: guide lines, data, playhead, plus the right and bottom Bright edges while rulers are visible.
- Plot with rulers hidden: owns the complete Bright frame.

Timeline ruler cells have no separate opaque background. They occupy dedicated layout cells, so plots do not scroll behind them. Let the containing surface control their background and Alpha transparency.

All ruler and guide lines must use the same explicit SVG contract:

- `stroke-width: 1`
- `shape-rendering: crispEdges`
- `vector-effect: non-scaling-stroke`
- `stroke-linecap: butt`

## Label Placement

- Axis titles must occupy a dedicated corner cell or a guide gap, never a guide coordinate.
- Corner titles use the same text baseline as the horizontal ruler labels. Use the shared `cornerTitle` option rather than positioning text independently.
- Use the shared 48 px Y-ruler width unless a specific requirement justifies an exception. Confirm that signed labels fit without clipping.
- BPM titles in Tap Pad and Metronome are placed between the highest two 30-BPM guides. This remains valid for every timeline height.
- Tick labels default above their guide. A tick may request `labelPosition: 'below'` when it describes the lower region, such as BPM Calculator's `NOTE` label.
- Every horizontal guide must have an aligned ruler tick. Numbers may be omitted at endpoints or at intermediate ticks when space is tight. Retain the guides and ticks.
- Audio Calculator uses FS in the corner, omits the -0.031 and 0.031 endpoint numbers, and reduces intermediate label density on short timelines. Its signed amplitude scale stays in FS, not dBFS.
- Preserve the existing shared guide and ruler colors and contrast, including Bright behavior. Do not introduce separate label contrast without explicit approval.
- Follow the shared [guides text selection convention](pekosoft.md#guides-text-selection-convention). It applies to Meters and Player's separate ruler layout as well as the standard Timeline layout.
- Keep Phasescope's `Correlation: ` label and value start anchored independently of the displayed value's width. Reserve a fixed signed-value width for the centered readout so undefined correlation (`-`) and live updates do not move the label.

## Meters Canvas Ownership

- Meter plots use a crosshair cursor, matching Player Timeline. Rulers and module controls retain their existing cursors.
- The local Crosshair toggle adds pointer-following, 1 px `--grey2` lines within the plot. Use a non-interactive overlay rather than drawing into or resizing the meter canvases, so the lines remain responsive during Freeze. Mouse lines hide when the pointer leaves. On phone, tapping or dragging positions the lines, which stay after touch release. Anchor touch positions to the plot rather than the viewport so scrolling and resizing keep them aligned. While Crosshair is enabled, one-finger plot gestures position the lines and pinch zoom remains available. Keep normal touch scrolling when disabled and keep the crosshair cursor regardless of the toggle. Save the setting per tool, default off, and clear it on Reset.
- Shared Meters owns its canvas backing dimensions and drawing transforms. Tool-specific Timeline resize routines must not resize meter canvases.
- Crosshair tooltips invert each mode's existing plot scales and distinguish cursor coordinates from cached displayed-signal values. Spectroscope uses logarithmic frequency and its -60 to 0 dB display scale. Level uses linear amplitude across width. Oscilloscope uses its sample window. Wavescope uses its 90 Hz history and channel lane geometry. Phasescope uses the same equal-scale Mid/Side geometry as its trace, with L = Mid - Side and R = Mid + Side. Read existing caches, never sample analysers or advance history for tooltips. Freeze retains signal values but allows pointer movement. Clamp the non-interactive tooltip inside the plot, retain it after touch release, and exclude it from bitmap exports.
- Meters bitmap exports capture the active canvas without its outer SVG rulers. With Guides and Bright on, complete all four outline edges in the exported copy at one backing pixel thick, regardless of Rulers. Do not alter the on-screen frame or cached signal.
- Meter backing dimensions scale with `devicePixelRatio`. Replacing them with CSS dimensions clears the signal and transform, causing flashing with live signals and shrunken guides with idle signals.
- SVG rulers use the plot's CSS dimensions and must remain aligned with its full-size canvas guides after clicks, mode changes and Timeline resizing.
- The corner ruler owns the seam above Meters' vertical ruler. A tick at the vertical ruler's top retains its label but uses `drawLine: false` to avoid a second adjacent seam line.
- Oscilloscope's horizontal time scale uses its sample count and source sample rate, in milliseconds. Wavescope's horizontal time scale uses its 90 Hz capture history, in seconds before the newest signal at 0 s. Silence and paused updates do not advance that history.
- Wavescope keeps fractional capture intervals between frames. Resizing preserves the newest history samples at their original time spacing instead of stretching them.
- Level's left ruler names the channels with L and R for stereo or M for mono. Place labels beside their bars independently of guide ticks, with M above the mono center guide to avoid a line through the label.
- Bit meter converts float analyser samples to signed 32-bit PCM using rounded, saturated sample × 2^31. Row 1 is the sign bit and row 32 is the least significant bit. Each channel measures the fraction of samples with that bit set. The separate Over row counts samples outside [-1, +1] before saturation. Use independent float L/R analysers for stereo and one M lane for mono. Never infer the original file's bit depth or floating-point format. Match Spectroscope's immediate attack and 350 ms exponential release for displayed activity, using the shared 60 Hz refresh loop. Clear each channel immediately on digital silence rather than decaying. Cache activity and advance smoothing only when sampling, never during Freeze or presentation redraws. Unless Freeze is on, continue sampling after stop or pause and during silence even when the source reports inactive. Show residual activity until the analyser becomes silent. Do not hold the last active frame or force values to zero on transport stop. Keep this behavior specific to Bit meter. Mirror the L percentage scale towards the center and the R scale away from the center. Thin row labels when the plot is short without hiding any bit bars.
- Phasescope plots (R - L) / 2 horizontally and (L + R) / 2 vertically, using equal physical scales so channel diagonals remain 45 degrees at every aspect ratio. Center the phase origin in the canvas with equal reserved top and bottom bands. Place L and R inside the upper corners of the guide bounds, away from the diagonals and canvas corners. Its M/S rulers show normalized amplitude, not time or decibels. Place the correlation readout above the trace and its scale below, with 0 centered on the scale. Clip the trace between the reserved bands so it cannot overlap these labels. Use a blue current-value cursor and magenta one-second rolling min/max cursors, each 1 CSS pixel wide, without a filled bar. Keep the correlation text blue regardless of Color. Rulers toggles only the outer M/S scales, while Guides toggles the phase axes and the grey bottom correlation scale, ticks and labels. The correlation readout and coloured cursors remain independent of both toggles. Cache float channel samples, correlation and extrema together for Freeze and paused redraws. Only live sampling advances the range. Undefined correlation and Reset clear it.
- Level's horizontal ruler separates its label band from its short tick band. Include each reference as a complete tick, value and guide group, or omit the entire group. Never leave an unlabeled tick or guide.
- Include -3 dB among Level's reference values. Omit crowded groups based on label widths and groups within 12 CSS pixels of the left edge on its linear amplitude scale. Rulers and canvas guides must use the same filtered references, including after resizing.

## State Model

- Settings `Rulers` is the global default (`global.rulers`). Changing it clears per-tool ruler overrides and broadcasts `pekosoft:rulers-global-change`.
- A local Rulers toggle creates a per-tool override.
- Timeline Bright is independent of Rulers. With rulers visible, the Bright frame spans the composed ruler-plus-plot layout. With rulers hidden, it spans the plot.
- Playhead and Follow remain independent persistent controls.

## Regression Matrix

Verify each ruler-enabled timeline (Audio Calculator, BPM Calculator, Metronome, Tap Pad, Turntable, Player) in these combinations:

| Scenario | Expected result |
| --- | --- |
| Guides on, Bright off | One-pixel guide and ruler lines with no doubled seams |
| Guides on, Bright on | Complete outer frame and exactly one internal seam per ruler/plot join |
| Rulers off, Bright on | Plot owns the complete Bright frame |
| Rulers on, horizontal scroll | Vertical ruler remains fixed. Horizontal ruler and labels track plot scroll |
| Timeline resized or maximized | Titles remain in their corner cell or guide gap with no label strike-through or crowded labels |
| Selecting or dragging across labels | Text associated with guides and rulers stays unselected in every Meters mode and Timeline layout. Seeking, dragging and scrolling still work |
| 100%, high-DPI, and browser zoom | Lines retain a single-pixel visual weight |
| Clicking meter plots or reselecting a meter mode | Live, paused and idle meters retain their full-size signals and guides without clearing the canvas |
| Crosshair on/off, all Meters modes and Freeze | Grey2 lines follow the pointer only inside the plot, stay 1 px thick, and do not affect signals, guides, rulers or the crosshair cursor |
| Player Timeline resized or Rulers toggled at high DPI | Meters retains its DPI-scaled backing dimensions and drawing transform |
| Playhead on/off | Full-height playhead appears only when enabled |
| Follow on, manual scroll | Manual horizontal navigation disables Follow |
| Global Rulers setting | Updates every open tool and clears local ruler overrides |
| Tool reset | Restores the documented local defaults without changing global defaults |
| Player reset with local Meters overrides | Clears `meters.player.*` in local and session storage. Meters follows global Guides, Bright, Rulers and Multicolor defaults |

## Validation Notes

Coordinate equality alone is insufficient across clipped SVG roots. Validate both the DOM line ownership and a rendered browser capture at the target device scale.

Check the complete visible composition at the user's current viewport and zoom: title baselines, endpoint labels, clipping, tick alignment and spacing. Geometry checks support this review but do not replace looking at the rendered result.
