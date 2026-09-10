# Design loop — monopo.vn

**Round 1 in progress.** Bar: `bar.md` (v3, rewritten from the reference
itself). Previous bar kept as `bar.v2.md`.

## Pieces

| # | Piece | Built | Brief | System | Craft |
|---|-------|-------|-------|--------|-------|
| 1 | The field — shader, sphere-as-boundary, grain | v4 | — | — | — |
| 2 | The pointer — trailing dot, field reacts | v2 | — | — | — |
| 3 | Type and interface — monumental scale, no hue | not started | — | — | — |

Critics have not run yet. Verdicts stay blank until they do.

## What round 1 changed

The teardown found the premise wrong, not the execution. v2 of the bar was
built on "86–93% of frames below 0.10 luminance" — a figure taken from the
dark stretches of the showreel and then applied to the whole product. The
reference's hero is a mid-tone field. Every step taken to satisfy that
number was a step away from the reference.

Replaced the CSS gradient field with a WebGL fragment shader, which is what
the reference uses (its hero is a WebGL2 canvas, confirmed in the DOM).

- **The sphere stopped being a disc.** A radial gradient on a black page has
  a cut edge by definition — which is what "the globe is half cut" was,
  every time it was raised. It is now a boundary inside one continuous
  material, refracted and shaded across the edge, with texture on both
  sides. Nothing for it to be cut against.
- **The geometry stopped moving.** No breathe, no parallax, no drift. Time
  enters the domain warp only, so the colour churns and the sphere does not
  move at all.
- **Grain is back**, as a per-pixel hash rather than an feTurbulence filter
  re-running every repaint. That was the original grain-and-stall bug.
- **The pointer deforms the material** rather than adding a light on top of
  it, and a damped dot trails the cursor and settles.

## Gap history

| Round | Gap named | By |
|-------|-----------|-----|
| 1 | Field far too dark — "a hint of texture on black" | self, vs reference frames |
| 1 | Bright colour of the reference missing entirely | user |
| 1 | Cursor effect present but too quiet to notice | user |
| 1 | Too yellow — wanted the earlier shade | user |
| 1 | Too bright overall once full-bleed | user |
| 1 | `#floor` scrim double-dimmed a canvas measuring 0.42 at the top | self, measured |

## Open

- Piece 3 not started: display type is 78px, the reference system specifies
  225px, and small grey labels still sit in the bright band.
- Critics not yet fanned out.
- ~60 test suites still assert the pre-rebuild UI (separate from this loop).

Measured: 60.2 fps at 1919x1229 backing, DPR capped to 1.25 on phones.
