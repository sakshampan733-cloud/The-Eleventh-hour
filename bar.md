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

## 2. The sphere is huge, and the two sides of its edge are different materials.

Measured off the hero by fitting a circle to three points on the limb: the
centre sits at (1.12, -0.75) with a radius of 1.41, in units of the smaller
viewport side. That is nearly twice the radius I had been drawing and far
further out of frame, which is why theirs reads as a long shallow arc
sweeping the whole picture and mine read as a ball sitting in a corner.

And the two sides are not the same stuff:

- **Outside** is the bright half — green. Sage and olive, high contrast,
  tight ribbons, and the brightest thing in frame is out here.
- **Inside** is the dark half — warm. Brown into amber, smooth, large slow
  shapes, and darker overall than the ground outside it.

Their own doc says it: "greens dissolving into amber". It is not one
palette across the whole field, it is two, meeting at the limb.

**Check:** sample a patch either side of the arc. If both are the same hue
family, it is wrong. Green outside, amber inside.

## 2b. The sphere is a boundary inside the texture, never a shape on top of it.

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

## 7. Everything moves on one curve, and grain sits over all of it.

cubic-bezier(0.19, 1, 0.22, 1), and only that curve.

**Revised in round 2.** This said "nothing under 400ms", read straight off
the reference. That is right for a site you look at and wrong for an app
you use: at half a second a press does not read as considered, it reads as
late, and the whole product felt slow because of it. Feedback lands in
under a fifth of a second, arrivals glide, nothing waits longer than it
takes to read. Durations sit in a band — 0.15s to 1.4s — rather than above
a floor.

The reference's own patience is preserved where it belongs: the cold open,
and type coming up from behind a mask.

A fine static noise lies over the whole frame — the texture is never
perfectly flat, even in the black.

**Check:** no transition under 400ms and no second easing curve anywhere in
the stylesheet. Zoom any flat-looking area: it has grain.

---

## Shape and radius, carried forward from v2

Still true, still enforced by tests/bar.js: radius is 0 or a full 75px+
pill, never in between. No box-shadow anywhere. Blur only on chrome that
floats over the live field.
