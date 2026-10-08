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
- For imported Pekosoft icons, scale the actual path to fill the usable 512 canvas. Avoid leaving source-icon padding that makes icons look small.

## Workflow Rules

- Follow literal geometric instructions. Do not reinterpret simple shape requests such as circle, half circle, square, or line.
- Verify icon changes in the real Icons tool or another real Pekosoft page after refresh.
- Prefer minimal single-parameter tweaks when iterating: size, position, or thickness one at a time.
