# The bar — monopo saigon, as a system

Taken from the published style reference plus the live site. Every line is
checkable by looking at a rendered frame.

## 1. Colour is media. The interface never has a hue.
Obsidian #000000, Paper #ffffff, Inkstone #181818, Felt Gray #6d6d6d,
Slate Pill #636363, Ash Mist #9a9a9a, Pewter #808080. The Iridescent Fade
— rgb(160,224,171) → rgb(255,172,46) 50% → rgb(165,45,37) — appears in
exactly one hero backdrop per page and nowhere else. Oxblood is described
as the *anchor* of that atmosphere, which places it at the dark end, not
the middle.
**Check:** sample any glyph, rule, border or control. Greyscale or fail.

## 2. Radius is 0 or 75. Nothing between.
75px pill for buttons and tags only. Cards, images, inputs, links: 0px.
**Check:** every border-radius in the stylesheet is 0 or ≥75px.

## 3. The display size owns the viewport.
225px at weight 400, line-height 0.70–0.76. Never crowded by a subhead or
a CTA. Never weight 600+ above 45px; large type whispers at 300 or speaks
at 400.
**Check:** the largest thing on the first screen is type, not an image,
and nothing shares its band.

## 4. Three faces, strict roles.
Roobert (Inter substitute) for everything. Raleway 54px/1.39 as a rare
heading accent — never body, never navigation. system-ui at 9–16px for
micro labels and fine print.
**Check:** count families in the rendered page. Three, used in those roles.

## 5. Flat. No shadow, no elevation, ever.
Hairline 1px borders are the only separation.
**Check:** no box-shadow in the stylesheet at any strength.

## 6. Motion is patient and single-curved.
cubic-bezier(0.19, 1, 0.22, 1), durations 0.8–1.25s on transform and
colour. Nothing snaps.
**Check:** one easing function in the file; no transition under 0.8s.

## 7. 4px rhythm, 1078px column, text-dominant.
Section gap 46px, card padding 34px, element gap 14px. One hero-sized
visual gesture per page and no more — never fill the canvas with imagery.
**Check:** every spacing value divides by 4; content never exceeds 1078px.
