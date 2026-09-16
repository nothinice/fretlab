# Changelog

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
