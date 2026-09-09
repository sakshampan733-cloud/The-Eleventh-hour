# bar.md — monopo saigon, re-anchored to a phone

Reference: https://monopo.vn · tokens from DESIGN.md / tokens.json
Verified live: computed styles read from the running page, not inferred.

Decisions taken before writing this:
obsidian canvas (their hero, not their paper sections) · ratios kept but the
scale re-anchored to 375px · monochrome interface with colour reserved for
attendance verdicts · Inter embedded as a data URI, standing in for Roobert.

Every line below is checkable by looking at a rendered screen.

---

## 1. Radius is 0 or a full pill. Nothing in between.
Cards, lists, sheets, inputs, rows, the timetable, the tiles: `0px`.
Buttons, tags, pills, the tab bar: `999px`.
**Fails if** any corner measures between 1px and 74px.
*Verified: the live page uses only 0, 10px, 50% and a pill that scales with
element height. There is no 12px or 16px anywhere.*

## 2. No shadow. Anywhere.
Depth comes from inversion — a black band against a white one — and from
1px hairlines. Not from elevation.
**Fails if** any element has a `box-shadow`, an inset highlight, or a
backdrop blur used to fake lift.
*Verified: querying every element on the reference returned zero shadows.*

## 3. One curve, and nothing faster than 0.5s.
`cubic-bezier(0.19, 1, 0.22, 1)` on every transition and every animation.
Durations 0.5s–1.25s. Elements glide; nothing snaps.
**Fails if** a second easing function appears, or any duration is under 0.5s.
*Verified: all ten distinct transitions on the reference use that one curve.*

## 4. Three type sizes per screen. The jump between them is at least 3x.
Their ramp goes 11px → 16px → 78px with nothing in between. Re-anchored to
375px: **11px label · 15px body · 44–64px statement.**
**Fails if** a screen shows four or more distinct sizes, or if a size lands
in the dead zone between 20px and 40px.

## 5. Above 40px, weight is 300 or 400 — never more — and line-height drops below 0.85.
The reference sets 78px at weight 300 and 94px at line-height 0.76. Large
type whispers; it never shouts. Tight leading locks the lines into a block
that reads as an object rather than a sentence.
**Fails if** any figure above 40px is bolder than 400, or its lines sit apart.

## 6. The interface is monochrome. Colour is a verdict, not decoration.
Canvas `#000000`, type `#ffffff`, greys `#9a9a9a` `#6d6d6d` `#636363`.
No coloured buttons, tabs, icons, chrome or accents.
**Fails if** a screen contains more than one chromatic element, or if any
coloured pixel means something other than the state of your attendance.

## 7. At least 40% of every screen is empty.
Spacious rhythm on a 4px unit: 28px between sections, 40px+ above a
statement figure, 14px between related elements.
**Fails if** content occupies more than 60% of the frame.

---

## What this deliberately kills

Named here so it is a decision and not a surprise:

- **the liquid-glass tab pill** carried over from the wallet app — it
  violates 1, 2 and 6 at once (blur, lift, and a coloured active state)
- **every lit edge and card shadow** added in the last round — mechanism 2
- **the spring press** (0.34s, `cubic-bezier(.34,1.56,.64,1)`, 0.09s down)
  — it is the opposite personality to mechanism 3
- **the indigo accent** on buttons, tabs and links — mechanism 6
- **mono-for-data, sans-for-prose**, taken from the macro tracker — this
  system runs one face for everything

Roughly a dozen existing tests assert the styling this removes. They get
rewritten against the mechanisms above, not deleted.
