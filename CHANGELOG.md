# Changelog

## 0.5.0-preview — 2026-09-16

- Replaced the provisional E/D/C/A/G windows with a real ordered Playable Shape.
- Added root-start selection on strings 6, 5, 4, and 3.
- Added Compact and Alternative variants, both ranked by ergonomic movement rather than maximum string changes.
- Added numbered route positions and route-ordered playback.
- Added chord-relative degree labels such as R, b3, 5, and b7.
- Added an explicit Arpeggio banner and Back to Scale action.
- Simplified Compare Scales to the scale comparison itself; advanced combined modes moved to the backlog.
- Recorded Popov/CAGED, string sets, sweep routes, descending/two-octave paths, and Arpeggio + Tensions for later evaluation.

## 0.4.0-preview — 2026-09-16

- Rebuilt scale selection as adjacent Main Scale and Tension Scale cards.
- Added named preset selectors to both scales while preserving editable formulas.
- Collapsed the older quick-preset buttons into a secondary Scale Library.
- Split scale and arpeggio navigation: selected chords no longer use scale Octave Shape or Playable Run.
- Added a prototype Chord Forms mode with distinct E, D, C, A, and G compact windows.
- Chord forms work from the selected chord's actual notes, including altered, minor-major, suspended, and unnamed structures.
- Clearly marked the current chord forms as provisional pending exact validation against Popov's diagrams.

## 0.3.0 — 2026-09-16

- Reframed scale comparison as Main Scale, Shared Notes, and Tension Notes.
- Simplified comparison colors: neutral main notes, green shared notes, and orange tension notes.
- Added independent Main, Tension, and Compare paths to Octave Shape.
- Added independent Main, Tension, and Compare paths to Playable Run.
- Added path-specific playback and warnings for incomplete or dense two-string shapes.
- Removed the earlier restriction that forced comparison back to Whole Neck.

## 0.2.1 — 2026-09-16

- Rebuilt Playable Run around an ordered ascending degree sequence instead of pitch-class coverage.
- Prevented backward string moves, skipped strings, excessive notes per string, and oversized local stretches.
- Added explicit rejection and warning for incomplete two-string Octave Shapes.
- Fixed Notes/Degrees behavior and dual labels in Inside/Outside Overlay.
- Disabled incompatible fingering modes while the overlay is active.
- Fixed invalid Outside formulas, playback state, Inside labels, and custom-range input synchronization.

## 0.2.0 — 2026-09-16

- Replaced the earlier automatic five-zone position concept with fret-range selection.
- Split diagonal presentation into Octave Shape and Playable Run.
- Added Inside/Outside scale comparison and shared-note visualization.
- Improved error handling, duplicate pitch-class warnings, controls, and accessibility.
- Refined chord and scale-stack presentation.

## 0.1.0 — 2026-09-16

- Added the formula-driven scale engine and enharmonic spelling.
- Added the interactive fretboard, presets, audio, harmonization, and arpeggio view.
