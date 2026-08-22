# The Eleventh Hour

A college attendance and day planner that runs from a single HTML file.

Open `index.html` and that's the whole app — no build, no server, no account,
no network requests of any kind. Everything you record lives in your browser's
local storage on your own device.

## What it does

- **Mark attendance** as you go — theory, tutorial or practical, in person or
  online — and see what each class does to your percentage before you skip it.
- **Answer "can I skip today?"** against the minimum you have to hold, with the
  advice getting stricter as the term runs out and there's less room to recover.
- **"Worth going?"** — for a day with cancellations, weigh the options: go for
  everything, only part of the day, stay home for the online ones, or skip it.
  Or pick the exact classes by hand.
- **Get you there and back** — wake and leave times from banded travel times,
  a pickup time to send your driver, and when you'll be home afterwards.
- **Plan leave** — pick the dates, see what it costs your overall percentage,
  and generate the application to send.
- **Appeal absences** at the end of term, and back-fill classes you forgot to
  mark.

## Files

| file | what it is |
|---|---|
| `index.html` | the entire app |
| `sw.js` | optional service worker — only does anything when hosted at a URL |
| `tests/` | headless test suites |

## Offline

Opened as a file on your device it is already fully offline — there is nothing
to download. Hosted at a URL (GitHub Pages), add `sw.js` next to `index.html`
so the page itself is stored on the phone and opens with no signal. Settings →
Offline reports which of those you're in.

## Tests

No dependencies — `jsc` ships with macOS.

    sh tests/run.sh

292 checks across 17 suites, plus an interaction hunt and a render benchmark.
`tests/walk.js` drives a whole day minute by minute and asserts the screen
never contradicts itself.
