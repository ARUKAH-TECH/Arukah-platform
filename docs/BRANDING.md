# Branding Assets

Logos supplied by the founder, stored under `public/branding/`:

| Division | File | Notes |
|---|---|---|
| ARUKAH (master brand) | `public/branding/arukah/arukah-logo.jpg` | Gold / royal blue / white |
| ARUKAH TECH | `public/branding/tech/arukah-tech-logo.jpg` | Gold / black / white |
| ARUKAH WEAR (footwear) | `public/branding/footwear/arukah-wear-logo.jpg` | Leather brown / cream |
| ZIVA Special Classes | `public/branding/ziva/ziva-logo.jpg` | Blue / gold / white |
| REPENT ONLINE MINISTRIES | `public/branding/ministry/repent-online-ministries-logo.jpg` | Own identity, kept separate from commercial ARUKAH palette |

These files were supplied as flattened JPEGs (opaque backgrounds, not
transparent). If transparent (PNG/SVG) versions become available, they
should replace these so logos can sit on non-matching backgrounds cleanly.

No dedicated ARUKAH MEDIA logo has been supplied — the master ARUKAH mark is
used for Media until one is provided.

## Colour tokens

Each division's colours were sampled directly from its supplied logo file
(dominant non-background pixels), not chosen freehand, so they stay
faithful to the actual artwork. They live as CSS custom properties in
`src/app/globals.css`, scoped under `[data-brand="..."]`, and are exposed as
Tailwind utilities (`bg-brand-primary`, `text-brand-primary-hover`,
`bg-brand-secondary`, `text-brand-on-primary`).

| Division | `data-brand` | Primary | Primary hover | Secondary |
|---|---|---|---|---|
| ARUKAH (master) | *(default, no attribute needed)* | `#e3a82a` | `#b87800` | `#002b70` |
| ARUKAH TECH | `tech` | `#ddaf3e` | `#a8790c` | `#ffffff` |
| ARUKAH WEAR | `footwear` | `#6b3016` | `#401000` | `#c08050` |
| ZIVA Special Classes | `ziva` | `#0b69a8` | `#002050` | `#e3a82a` |
| Repent Online Ministries | `ministry` | `#c08000` | `#7a5200` | `#e8d9b5` |

Wrap any section in `<div data-brand="tech">` (etc.) and the shared
`Button` / `SectionHeading` components automatically pick up that
division's colours. To preview every division's tokens and components
side by side, run `npm run dev` and open `/dev/style-guide` (an internal
route, not linked from site navigation).

### Using brand colours as text — `brand-primary-text`

**Never use `text-brand-primary` (or `border-brand-primary`) for actual
text or borders.** Both ARUKAH's and ARUKAH TECH's raw gold only reach
~2.1:1 contrast against white — WCAG AA requires 4.5:1 for normal text.
`--brand-primary`/`bg-brand-primary` exist for **fills** (buttons,
swatches) paired with `--brand-on-primary` as the text color on top of
them; that pairing is already accessible.

For literal text/border color (eyebrow labels, headings, link hovers, an
outline button's border+label), use `text-brand-primary-text` /
`border-brand-primary-text` instead. It's a proportionally darkened
variant of each brand's real gold in light mode, and swaps to a lighter
variant in dark mode (`prefers-color-scheme: dark`) — see the two
`--brand-primary-text` declarations per `[data-brand]` block in
`globals.css`. Footwear, ZIVA, and ministry's tokens already clear 4.5:1
as-is, so their `-text` value equals their `primary` value; only ARUKAH
and ARUKAH TECH needed a genuinely different color for text.

## Typography and layout

Typography and page-level layout (Header/Footer/Hero) were built in
Phases 3–5 alongside the pages that needed them, rather than
speculatively in Phase 2.
