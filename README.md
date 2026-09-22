# Guitar Fretboard / Theory App — prototype

A formula-driven guitar theory tool: type a root and an interval formula
(e.g. `1 2 b3 4 5 6 7`) and see the fretboard, spelled correctly by scale
degree, live. No hardcoded scale database — every scale, chord, and
Allan Holdsworth "usable scale" is calculated from its formula.

**Live demo:** after GitHub Pages is enabled for the `main` branch, the
app is available at
`https://nothinice.github.io/fretlab/`.

## What's in here

- `index.html` — the whole app. Single self-contained file, no build
  step or JavaScript dependencies. Open it directly in a browser or
  serve it via GitHub Pages.
- `TASKS.md` — agreed priorities and review criteria for the next iteration.
- `CHANGELOG.md` — concise history of delivered versions.

## Status

This is an early prototype built to validate the music-theory engine
and UX decisions cheaply, not a production build. Built iteratively
with an AI coding assistant by a guitar teacher with no programming
background — issues and pull requests aren't expected yet, but feel
free to open one.

## Current features

- Formula-driven scale/chord engine with correct enharmonic spelling by
  scale degree (not just "nearest sharp/flat")
- Interactive fretboard, Notes/Degrees toggle, click-to-play audio
- Presets: diatonic modes, common scales, all 15 of Allan Holdsworth's
  "usable scales"
- Three clear study modes: Whole Scale, Scale Forms, and Arpeggios
- Five curated E/D/C/A/G forms for major and natural-minor scales
- Chord harmonization with selectable triads and seventh chords
- Curated E/D/C/A/G arpeggio forms for major, minor, and diminished triads
- Curated Popov arpeggio forms for maj7, 7, m7, m7b5, and dim7 chords
- Fretboard area selection kept as a secondary control inside Whole Scale mode
- Two-scale comparison with Main Mode, Shared Notes, and Outside Mode Notes
- Focused two-scale comparison without unrelated chord or fingering controls
- Side-by-side Main Mode and Outside Mode selectors with named presets and custom formulas

## Checks

Run `node tests/scale-forms.test.js`, `node tests/popov-forms.test.js`, and
`node tests/triad-forms.test.js` to verify curated scale/chord coordinates,
transposition, source subsets, and the no-internal-string-gap publication rule.

## Roadmap

See `TASKS.md` for current priorities. Likely later additions include
chord-progression analysis, shareable state via URL, alternate tunings,
and further mobile/touch polish.
