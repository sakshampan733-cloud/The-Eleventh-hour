# The bar — monopo.vn

Seven mechanisms, taken from the reference itself, not from adjectives about
it. Every one is checkable by looking at a rendered frame. Written after
capturing monopo.vn at three scroll positions and two viewport sizes.

Where v2 was wrong: it was built on "86–93% of frames below 0.10 luminance",
a figure taken from the dark stretches of the showreel and then applied to
the whole product. The site's hero is not dark. It is a mid-tone field.
Everything that followed from that number — a black page with a small dark
object on it — was a step away from the reference, not toward it.

---

## 1. The field is full-bleed and mid-tone. Black is a region of it, not the ground.

The texture reaches all four edges of the viewport. There is no page
underneath it showing through. Large parts of the frame sit well above 0.10
luminance — olive, bone, tan — and the near-black areas are *part of the
texture*, shaded regions of the same material.

**Check:** sample the four corners and the centre of a hero frame. All five
are texture. None is a flat background colour.

## 2. The sphere is a boundary inside the texture, never a shape on top of it.

Its edge is one continuous arc crossing the frame, and the texture continues
on **both** sides of that arc — different in character (smoother inside,
more contrast outside), same material. The arc never meets empty background.

**Check:** follow the sphere's edge to where it leaves the frame. If at any
point along it there is flat background on one side, it is a disc, not a
sphere, and it will read as cut off.

## 3. Colour moves. Geometry does not.

The sphere does not translate, drift, breathe or parallax. Its edge is in
the same place from frame to frame. What changes is the colour flowing
*inside* the material.

**Check:** two frames two seconds apart. The arc has not moved by a pixel.
The colour has changed everywhere.

## 4. Three type sizes on screen, and the display size is monumental.

Their system: 225px/400 fills the viewport, 78px/300 whispers, 11px/400
labels. Nothing in between. The display size is more than 3.5x the next size
down, and above 40px the weight never exceeds 400.

**Check:** count distinct sizes in one screenshot. Three, not five. Largest
÷ next ≥ 3.5. Nothing heavy and large at the same time.

## 5. The interface never picks up a hue.

Chrome, type, rules and controls are pure black, pure white, or the greys
(#181818 / #6d6d6d / #636363 / #9a9a9a). Colour exists only in the field
behind them. Their own doc: "the interface itself never picks up a hue."

**Check:** sample any pixel of any control or any glyph. It is greyscale.
The only exception this product keeps is a verdict — a number that is a
judgement, not decoration.

## 6. A dot follows the pointer and arrives late.

Not pinned to the cursor. It trails, eases, and catches up along a curve —
"almost trying to catch it." It settles when the pointer stops.

**Check:** move fast across the frame. The dot is visibly behind. Stop. It
arrives, and does not overshoot twice.

## 7. Everything moves on one curve, slowly, and grain sits over all of it.

cubic-bezier(0.19, 1, 0.22, 1), durations up to 1.25s. Nothing snaps,
nothing is under 400ms. A fine static noise lies over the whole frame — the
texture is never perfectly flat, even in the black.

**Check:** no transition under 400ms and no second easing curve anywhere in
the stylesheet. Zoom any flat-looking area: it has grain.

---

## Shape and radius, carried forward from v2

Still true, still enforced by tests/bar.js: radius is 0 or a full 75px+
pill, never in between. No box-shadow anywhere. Blur only on chrome that
floats over the live field.
