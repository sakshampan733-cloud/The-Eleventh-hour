# design-loop — The Eleventh Hour → monopo saigon

Bar: https://monopo.vn · mechanisms in `bar.md` · reference tokens in
`~/Downloads/DESIGN.md`

Decisions locked before building: obsidian canvas · ratios kept, scale
re-anchored to 375px · monochrome interface, colour only as a verdict ·
Inter embedded as a data URI.

## Pieces

| # | piece | status | brief | system | craft |
|---|-------|--------|-------|--------|-------|
| ① | tokens, type, colour, motion | built, round 1 | … | … | … |
| ② | Today | not started | — | — | — |
| ③ | Attendance + the goal card | not started | — | — | — |
| ④ | sheets, tab bar, motion detail | not started | — | — | — |

## Round history

### ① round 1
Built: palette replaced with the reference's two absolutes and three greys;
every radius collapsed to 0 or a pill; every shadow and every backdrop-blur
removed; one easing curve and a 0.5s floor imposed across the file; the type
ramp re-anchored to 11 / 15 / 44 with the 20–40px dead zone emptied; the
glass tab pill replaced with a flat bar and a hairline; Inter embedded.

Self-check before the critics: `tests/bar.js` — the seven mechanisms as
measurable assertions — 14/14. Full suite 402 checks, 0 failures.

Known gaps going in, expected to be named:
- the attendance ring is a soft container with a coloured stroke
- Today shows three statement-size figures where the reference shows one
- whitespace is still under the 40% the bar asks for

## Machinery

- Local preview: `python3 -m http.server 8788` in the repo, viewed at
  375×812. Critics drive it themselves in their own browser tab.
- The reference is live and drivable, so motion can be compared directly.
- The two screen recordings could not be read (sandboxed temp folder, no
  ffmpeg) — motion is judged from the site instead.
