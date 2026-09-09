# bar.md — v2, for the rebuild

Reference: https://monopo.vn · tokens in `~/Downloads/DESIGN.md` · measured
live from the running site, including its 404 page, which shows the whole
component vocabulary with nothing else on screen: type on black, and one
ghost pill.

v1 got the tokens right and the composition wrong. All three critics failed
it on the same thing, so that is now mechanism 1.

---

## 1. There are no containers.
No card, no panel, no bordered box, no grey fill, no tinted chip. A group
is made by a tracked-out label, a hairline rule, and space. Content sits
directly on black.
**Fails if** any element has a background fill or a border on more than one
side. The only permitted border is a single hairline rule used as a divider,
and the only permitted outline is the ghost pill.

## 2. One interactive shape: the ghost pill.
Transparent fill, 1px hairline border, full radius, generous padding
(measured on the reference: 21px vertical, 44px horizontal), label at
weight 400. No filled buttons. No coloured buttons.
**Fails if** any tappable thing is a filled rectangle or a tinted chip.

## 3. Radius is 0 or a full pill. Nothing between.
**Fails if** any corner measures 1–74px. Verified: the reference uses only
0, 50% and a height-scaled pill.

## 4. No shadow, no blur, no elevation.
Depth is inversion and hairlines. **Fails** on any box-shadow or
backdrop-filter. Verified: querying every element on the reference returns
zero shadows.

## 5. Three type sizes per screen, and the jump is at least 3x.
Their ramp is 11 → 16 → 78 with nothing between. Re-anchored to 375px:
**11px label · 15px body · 48px statement.** One statement per screen —
the big figure IS the screen.
**Fails if** a screen shows four or more sizes, anything lands between 20px
and 40px, or two statement-size figures appear on one screen.

## 6. Nothing is bold. Above 40px, weight is 300.
The reference never sets bold once, anywhere. Body and labels are 400;
statements are 300 with line-height under 0.9.
**Fails** on any font-weight above 500, and on any weight above 400 past
40px.

## 7. One easing, nothing under 0.5s, one moving surface.
`cubic-bezier(0.19, 1, 0.22, 1)` for every transition. The only thing that
moves on its own is the iridescent field behind the hero — sage through
amber into oxblood — and there is exactly one per screen.
**Fails** on a second curve, a duration under 0.5s, or ambient motion
anywhere but the hero.

## 8. Colour is a verdict and nothing else.
Black, white, three greys. The three gradient colours may appear ONLY on a
figure reporting attendance state, and at most one such element per screen.
**Fails if** a subject, a deadline, an action or a delivery mode carries
colour. Those are categories, not verdicts.

---

## What the critics killed in v1, carried forward

- every bordered card and grey-filled block  → mechanism 1
- filled buttons, tinted pills, status chips → mechanisms 1 and 2
- bold on subheads, class names, tab labels  → mechanism 6
- subject colour rails and deadline urgency  → mechanism 8
- the untouched iOS action sheet             → mechanisms 1 and 2

## Non-negotiable, and not up for redesign

The engine stays: attendance maths, runway, goals, leave, plans, the
shortcut handler, the service worker. It is the content, it carries the
tests, and it is what is being put *into* this design. Everything that
draws a pixel is written again from zero.
