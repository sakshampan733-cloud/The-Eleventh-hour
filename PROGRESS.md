# Design loop — monopo.vn

**Round 1 in progress.** Bar: `bar.md` (v3, rewritten from the reference
itself). Previous bar kept as `bar.v2.md`.

## Pieces

| # | Piece | Built | Brief | System | Craft |
|---|-------|-------|-------|--------|-------|
| 1 | The field — shader, sphere-as-boundary, grain | v9 | — | — | — |
| 2 | The pointer — trailing dot, grows on clickables | v3 | — | — | — |
| 3 | Type and interface — monumental scale, no hue | partial | — | — | — |
| 4 | Sheets, cold open, scroll feel | v1 | — | — | — |

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

## Round 3 — the two-material sphere

A full-resolution screenshot of the hero showed two things had been
structurally wrong the whole time, and both were measurable rather than
matters of taste.

**The sphere was half the size it should be.** Fitting a circle to three
points on the limb gives centre (1.12, -0.75), radius 1.41 in units of the
smaller viewport side. I had been drawing 0.78 at (0.54, -0.26) — a ball
in a corner, where theirs is a long shallow arc sweeping the whole frame.

**The bright green half is OUTSIDE the sphere; inside is darker and warm.**
Every previous attempt ran a single palette across the whole field and
then tried to fix the result by moving stops around, which cannot work:
their field is two materials meeting at an edge. Green sage outside, high
contrast, holding the brightest thing in frame. Brown into amber inside,
smooth and slow and darker than the ground it sits on. Their own doc says
"greens dissolving into amber" and I had read it as a gradient.

## Gap history

| Round | Gap named | By |
|-------|-----------|-----|
| 1 | Field far too dark — "a hint of texture on black" | self, vs reference frames |
| 1 | Bright colour of the reference missing entirely | user |
| 1 | Cursor effect present but too quiet to notice | user |
| 1 | Too yellow — wanted the earlier shade | user |
| 1 | Too bright overall once full-bleed | user |
| 1 | `#floor` scrim double-dimmed a canvas measuring 0.42 at the top | self, measured |
| 2 | Warm ramp had green at 0.76 of red; reference measures 0.60 | self, sampled from their image |
| 3 | Sphere half the size it should be — 0.78 against a measured 1.41 | self, circle fit to the limb |
| 3 | One palette across both sides of the limb; reference has two | self, from the hero screenshot |

## Round 2

- Cold open rebuilt as the reference's: near-black, one soft crescent of
  warm light, a centred wordmark, then the plate lifts and lets go.
- Sheets stopped being opaque slabs bolted on from another app. On a wide
  screen a sheet is the next screen: it covers the window, the field
  carries on behind it at 0.88, the title is 48px and there is no scrim
  left to draw.
- Orb moved right to the reference's framing; the material now carries
  most of the way down the first screen instead of hitting black a third
  of the way up.
- The dot opens to 34px over anything clickable.
- Wheel scrolling is eased on a mouse or trackpad; touch keeps its own
  momentum and is never intercepted.

## Open

- Piece 3 not started: display type is 78px, the reference system specifies
  225px, and small grey labels still sit in the bright band.
- Critics not yet fanned out.
- ~60 test suites still assert the pre-rebuild UI (separate from this loop).

Measured: 60.2 fps at 1919x1229 backing, DPR capped to 1.25 on phones.
