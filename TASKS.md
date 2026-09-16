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

1. User-test Playable Shape from roots on strings 6, 5, 4, and 3.
2. Verify that numbered routes feel natural on the guitar for triads and seventh chords.
3. User-test the explicit Scale / Compare / Arpeggio states and Back to Scale action.
4. User-test the side-by-side Main Scale and Tension Scale selectors.
5. User-test whether Main Scale, Shared Notes, and Tension Notes are immediately understandable.
6. Review chord labels and distinguish traditional tertian harmony from generalized
   scale-step stacks.
7. Convert the current algorithm checks into permanent regression tests before splitting
   the single-file prototype into modules.

## Implemented safeguards

- Playable Run follows every scale degree in ascending order.
- Playable Run never returns to a lower string or skips a string.
- A string is limited to three notes for scales of up to seven notes per octave,
  and four notes for denser scales; the local fret span is limited to five frets.
- Incomplete two-string Octave Shapes are rejected instead of displayed as valid.
- Scale fingering modes are hidden while scale comparison is active.
- Scale fingering modes are removed when an arpeggio is selected.
- Playable Shape follows one exact ascending octave, begins on the chosen root string,
  stays within five frets, and carries an explicit note order used by playback.
- Compact and Across Strings are guaranteed to use different fretboard routes when
  a second comfortable route exists; unavailable alternatives are disabled rather than duplicated.

## Later roadmap

- Exact Popov/CAGED E, D, C, A, and G chord-shape templates with verified routes.
- A CAGED/Chord Shapes view alongside the simpler root-string Playable Shape.
- String-set arpeggios on 6–5–4, 5–4–3, 4–3–2, and 3–2–1.
- Technique-specific sweep/economy-picking routes.
- Descending routes, two-octave routes, and alternative starting positions for the same string.
- Arpeggio + Tensions: show Main/Shared/Tension notes around a selected chord.
- Scale-path comparison for Main/Tension Octave Shape and Playable Run.
- Guided Transition Run between Main and Tension scales.
- Shareable state in the URL.
- Chord progression input and analysis.
- Alternate guitar tunings.
- Genuine 3-notes-per-string scale systems.
- Production project structure after the prototype's musical behavior is validated.

## Out of scope for now

- Backend and accounts.
- Payments.
- Drop 2 / Drop 3 voicing library.
- Framework migration solely for code style.
