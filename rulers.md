# Timeline Rulers

## Rendering Contract

Timeline rulers and plots are separate SVG roots. Each visible edge has one owner:

- Corner ruler: shared top-left outer frame and internal corner seams.
- Horizontal ruler: top outer frame, time ticks, and plot-top internal seam.
- Vertical ruler: left and bottom outer frame, value ticks, and plot-left internal seam.
- Plot: guide lines, data, playhead, plus the right and bottom Bright edges while rulers are visible.
- Plot with rulers hidden: owns the complete Bright frame.

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

## Meters Canvas Ownership

- Shared Meters owns its canvas backing dimensions and drawing transforms. Tool-specific Timeline resize routines must not resize meter canvases.
- Meter backing dimensions scale with `devicePixelRatio`. Replacing them with CSS dimensions clears the signal and transform, causing flashing with live signals and shrunken guides with idle signals.
- SVG rulers use the plot's CSS dimensions and must remain aligned with its full-size canvas guides after clicks, mode changes and Timeline resizing.
- Oscilloscope's horizontal time scale uses its sample count and source sample rate, in milliseconds. Wavescope's horizontal time scale uses its 90 Hz capture history, in seconds before the newest signal at 0 s. Silence and paused updates do not advance that history.
- Wavescope keeps fractional capture intervals between frames. Resizing preserves the newest history samples at their original time spacing instead of stretching them.
- Level's left ruler names the channels with L and R for stereo or M for mono. Place labels beside their bars independently of guide ticks, with M above the mono center guide to avoid a line through the label.
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
| Player Timeline resized or Rulers toggled at high DPI | Meters retains its DPI-scaled backing dimensions and drawing transform |
| Playhead on/off | Full-height playhead appears only when enabled |
| Follow on, manual scroll | Manual horizontal navigation disables Follow |
| Global Rulers setting | Updates every open tool and clears local ruler overrides |
| Tool reset | Restores the documented local defaults without changing global defaults |
| Player reset with local Meters overrides | Clears `meters.player.*` in local and session storage. Meters follows global Guides, Bright, Rulers and Multicolor defaults |

## Validation Notes

Coordinate equality alone is insufficient across clipped SVG roots. Validate both the DOM line ownership and a rendered browser capture at the target device scale.

Check the complete visible composition at the user's current viewport and zoom: title baselines, endpoint labels, clipping, tick alignment and spacing. Geometry checks support this review but do not replace looking at the rendered result.
