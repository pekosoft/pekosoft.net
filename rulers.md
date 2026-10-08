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
- Every horizontal gridline must have an aligned ruler tick. Numbers may be omitted at endpoints or at intermediate ticks when space is tight. Retain the gridlines and ticks.
- Audio Calculator uses FS in the corner, omits the -0.031 and 0.031 endpoint numbers, and reduces intermediate label density on short timelines. Its signed amplitude scale stays in FS, not dBFS.
- Preserve the existing shared guide and ruler colors and contrast, including Bright behavior. Do not introduce separate label contrast without explicit approval.
- Ruler text and SVGs are non-selectable.

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
| 100%, high-DPI, and browser zoom | Lines retain a single-pixel visual weight |
| Playhead on/off | Full-height playhead appears only when enabled |
| Follow on, manual scroll | Manual horizontal navigation disables Follow |
| Global Rulers setting | Updates every open tool and clears local ruler overrides |
| Tool reset | Restores the documented local defaults without changing global defaults |

## Validation Notes

Coordinate equality alone is insufficient across clipped SVG roots. Validate both the DOM line ownership and a rendered browser capture at the target device scale.

Check the complete visible composition at the user's current viewport and zoom: title baselines, endpoint labels, clipping, tick alignment and spacing. Geometry checks support this review but do not replace looking at the rendered result.
