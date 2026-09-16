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
- Chord harmonization (triads/7th chords) with a separate arpeggio mode
- Playable Shape builds two ergonomic one-octave routes (Compact and Alternative) from a root on string 6, 5, 4, or 3
- Fretboard area selection (whole neck / fret ranges), Octave Shape and
  Playable Run diagonal patterns across the whole neck
- Two-scale comparison with Main Scale, Shared Notes, and Tension Notes
- Focused two-scale comparison without unrelated chord or fingering controls
- Side-by-side Main Scale and Tension Scale selectors with named presets and custom formulas

## Roadmap

See `TASKS.md` for current priorities. Likely later additions include
chord-progression analysis, shareable state via URL, alternate tunings,
and further mobile/touch polish.
