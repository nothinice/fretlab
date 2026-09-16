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

1. Validate the prototype E/D/C/A/G chord-form windows against Popov's exact diagrams.
2. Replace provisional compact windows with verified per-quality route data from the book.
3. User-test the side-by-side Main Scale and Tension Scale selectors.
4. User-test whether Main Scale, Shared Notes, and Tension Notes are immediately understandable.
5. Visually verify Main/Tension/Compare in Octave Shape and Playable Run across enharmonic roots.
6. Decide whether a guided Transition Run should be added after the two independent paths are validated.
7. Review chord labels and distinguish traditional tertian harmony from generalized
   scale-step stacks.
8. Convert the current algorithm checks into permanent regression tests before splitting
   the single-file prototype into modules.

## Implemented safeguards

- Playable Run follows every scale degree in ascending order.
- Playable Run never returns to a lower string or skips a string.
- A string is limited to three notes for scales of up to seven notes per octave,
  and four notes for denser scales; the local fret span is limited to five frets.
- Incomplete two-string Octave Shapes are rejected instead of displayed as valid.
- Fingering modes are disabled while Inside/Outside Overlay is active.
- Scale fingering modes are removed when an arpeggio is selected; arpeggios use Chord Forms instead.

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
