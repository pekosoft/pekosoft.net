# Pekosoft Icons

Pekosoft uses a single SVG sprite file (`icons.svg`) for all interface icons. Each icon is a geometric, monochrome symbol designed for clarity and consistency with the site's minimal visual language. Icons are referenced via `<use>` elements and styled with CSS for size and color. All icon symbols are kept in alphabetical order and use a consistent `viewBox` for predictable scaling across the UI.

## Icon Authoring Rules

- Use `viewBox="0 0 512 512"` for all symbols.
- No color attributes in `icons.svg` symbols.
- Do not use `fill="#..."`, `stroke="#..."`, `fill="currentColor"`, `stroke="currentColor"`, or any inline color value.
- Icons must be single-color. Do not mix fill and stroke in a way that produces two rendered colors.
- Build icon shapes as plain geometry so color is controlled only by CSS on `.icons` or the host SVG.
- Prefer fill-based geometry over stroke-based drawing for consistent rendering with site icon styles.
- Snap icon geometry to the 512 grid using PO2-friendly steps, preferably 16/32 multiples, when practical.
- For connected icon parts, overlap geometry slightly to avoid hairline gaps between parts.
- For desktop computer icons, the vertical monitor stand must overlap the monitor and base so sub-pixel gaps cannot appear.
- Use the available 512 canvas fully in at least one dimension. Avoid unnecessary padding that makes icons look small.

## Workflow Rules

- Follow literal geometric instructions. Do not reinterpret simple shape requests such as circle, half circle, square, or line.
- Verify icon changes in the real Icons tool or another real Pekosoft page after refresh.
- Update an SVG `<use>` target only when its `href` changes. Reassigning the same external target can reload the symbol and briefly hide the icon.
- Prefer minimal single-parameter tweaks when iterating: size, position, or thickness one at a time.

## Outlined and Rounded Icons

- Clock, Release and Help use a common 32-unit circular rim with positive interior symbols. Clock has no hour markers and uses a longer vertical hand.
- Help uses a reduced question mark with a lighter body and a round dot. Release keeps its slash inset from the rim at both ends.
- Bars retains its filled section with a 32-unit outline around the remaining track.
- Loop rounds only its two right-angle bends, with concentric inner and outer arcs. Arrowheads and shaft ends stay sharp and flat.
- Beat keeps its lower cutout horizontally centered in the body, preserving the cutout's size and vertical position.
- Knob's pointer cutout ends in an arc concentric with the knob, keeping a consistent inset from its circumference.
- The `arrow_up_down` arrows reach the left and right canvas edges without changing their shapes or vertical positions.
- `arrows` uses four outward-pointing triangles matching Circle Of Fifths' wheel navigation controls.
- Asterisk is scaled to 90% around the canvas center. IP retains the location pin and circular cutout without an interior rectangle.
- External uses square frame corners, a sharp arrowhead and flat line ends.
- Pulse's horizontal sections share exact top and bottom coordinates, avoiding accumulated rounding differences from relative path commands.
- `bitmeter` uses two equal columns of four rectangular cells in a portrait layout. The top pair uses transparent cutouts to form outlines, and the lower six cells are filled.
- `cassette` replaces `recorder` with a simple body, two reel cutouts, a central window and a lower tape opening, all in one standalone path.
- Crosshair uses 32-unit lines and rim. Label L, Label S, Pivot and Jukebox share the 32-unit circular rim; Pivot's dot has radius 12.
- Archive, Battery Full and RAM use single union silhouettes without overlapping interior shapes, preserving their filled appearance.
- Circle Of Fifths follows BPM Circle's bold segmented bands, using twelve equal key sectors in each of two bands and no center triangles. Band radii are 256/198 and 186/134, with 12-unit gaps between bands and sectors.
- BPM Curve trims its curve to 64-unit circular boundaries around the three 48-unit points, leaving transparent 16-unit gaps without masks or background-colored shapes.
- `hash` is a standalone hash sign used by Circle Of Fifths' Signature button, scaled to 80% around the canvas center.
- `delete` retains its trashcan silhouette with two equal transparent vertical slots in the body.
- `icons` places a downward-pointing triangle above the circle, preserving the square and star on the left.
- `uk` uses a centered 64-unit cross and straight counterchanged diagonal bands, with matching upper and lower geometry rotated around the canvas center.

## Letter and Number Icons

- The `letter_a` through `letter_z` badges use uppercase Arial Bold outlines at an em size of 388.44 on the 512 canvas, matching the original A, B, C, D and T badges.
- The `number_0` through `number_9` badges use the same font, em size and circular cutout treatment.
- Center each glyph's bounds on `(256, 256)` without stretching or scaling individual glyphs to the same width.
- Keep the circular badge and glyph cutout, including counters. Store the outlines as monochrome paths, not text or embedded fonts.

## Tuner Icons

- Keep the `tuner` and `tuner_off` fork and shaft thickness and terminal circle size aligned. The normal tuner spans the full canvas height; the crossed-out variant keeps its fork inside the enclosing ring.
- Target note buttons use the note's base-letter badge (`letter_a` through `letter_g`) across all instrument profiles and Chromatic. Keep the full note, including accidentals and octave, in each label and tooltip.

## Icons Tool Panel

- Current and All use the existing tab-like `.controls-buttons.wrapper` row with `.square` icon buttons above the editable SVG Panel, matching Player's Panel view selectors.
- Reuse the shared button styling and `button-on` selected state. Do not introduce a separate tab design or force text labels to stay visible.
- Preserve the saved `icons.panel_mode` and existing switching behavior. Copy and the shared Panel actions remain in the footer.
- Center in Controls uses the dedicated `center` symbol: four inward-pointing arrows around a central point.
