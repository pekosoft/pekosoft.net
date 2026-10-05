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

- Axis titles must occupy a guide gap, never a guide coordinate.
- BPM titles in Tap Pad and Metronome are placed between the highest two 30-BPM guides. This remains valid for every timeline height.
- Tick labels default above their guide; a tick may request `labelPosition: 'below'` when it describes the lower region, such as BPM Calculator's `NOTE` label.
- Ruler text and SVGs are non-selectable.

## State Model

- Settings `Rulers` is the global default (`global.rulers`). Changing it clears per-tool ruler overrides and broadcasts `pekosoft:rulers-global-change`.
- A local Rulers toggle creates a per-tool override.
- Timeline Bright is independent of Rulers. With rulers visible, the Bright frame spans the composed ruler-plus-plot layout; with rulers hidden, it spans the plot.
- Playhead and Follow remain independent persistent controls.

## Regression Matrix

Verify each ruler-enabled timeline (Audio Calculator, BPM Calculator, Metronome, Tap Pad, Turntable, Player) in these combinations:

| Scenario | Expected result |
| --- | --- |
| Guides on, Bright off | One-pixel guide and ruler lines; no doubled seams |
| Guides on, Bright on | Complete outer frame and exactly one internal seam per ruler/plot join |
| Rulers off, Bright on | Plot owns the complete Bright frame |
| Rulers on, horizontal scroll | Vertical ruler remains fixed; horizontal ruler and labels track plot scroll |
| Timeline resized or maximized | Titles remain between guides; no label strike-through |
| 100%, high-DPI, and browser zoom | Lines retain a single-pixel visual weight |
| Playhead on/off | Full-height playhead appears only when enabled |
| Follow on, manual scroll | Manual horizontal navigation disables Follow |
| Global Rulers setting | Updates every open tool and clears local ruler overrides |
| Tool reset | Restores the documented local defaults without changing global defaults |

## Validation Notes

Coordinate equality alone is insufficient across clipped SVG roots. Validate both the DOM line ownership and a rendered browser capture at the target device scale.
