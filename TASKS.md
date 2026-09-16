# Project tasks

This file is the shared handoff between Danila, Claude, and Codex.

## Working agreement

- Keep the current visual language unless a task explicitly changes it.
- Preserve the formula-driven engine; presets are shortcuts, not the source of truth.
- Prefer musically honest labels over familiar but inaccurate terms.
- Every change must preserve manual formula entry, enharmonic spelling,
  Notes/Degrees display, audio, arpeggio filtering, and mobile scrolling.
- Return a complete working version and describe any unresolved compromises.

## Current review priorities

1. Visually verify the Inside/Outside overlay across enharmonic roots and custom formulas.
2. Keep Octave Shape and Playable Run conceptually separate in both UI and code.
3. Review chord labels and distinguish traditional tertian harmony from generalized
   scale-step stacks.
4. Convert the current algorithm checks into permanent regression tests before splitting
   the single-file prototype into modules.

## Implemented safeguards

- Playable Run follows every scale degree in ascending order.
- Playable Run never returns to a lower string or skips a string.
- A string is limited to three notes for scales of up to seven notes per octave,
  and four notes for denser scales; the local fret span is limited to five frets.
- Incomplete two-string Octave Shapes are rejected instead of displayed as valid.
- Fingering modes are disabled while Inside/Outside Overlay is active.

## Later roadmap

- Shareable state in the URL.
- Chord progression input and analysis.
- Alternate guitar tunings.
- Genuine CAGED and 3-notes-per-string systems as separate features.
- Production project structure after the prototype's musical behavior is validated.

## Out of scope for now

- Backend and accounts.
- Payments.
- Drop 2 / Drop 3 voicing library.
- Framework migration solely for code style.
