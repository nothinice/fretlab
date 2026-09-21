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

1. Obtain a clear source page for Popov's triad arpeggio forms; do not derive them by merely deleting the seventh from the current shapes.
2. Transcribe every triad quality shown by Popov as fixed relative geometry and connect supported triad chips to the curated form selector.
3. Add fixed-coordinate tests plus all-root transposition, boundary, degree, and ascending-playback checks for the triad library.
4. User-test the curated Popov-based triad and seventh-chord forms on a real guitar.
5. Verify every transcribed point and the ascending playback order against the source diagrams.
6. Record any hands-on corrections as fixed coordinates before adding derived exotic qualities.
7. User-test the explicit Scale / Compare / Arpeggio states and Back to Scale action.
8. User-test the side-by-side Main Mode and Outside Mode selectors.
9. User-test whether Main Mode, Shared Notes, and Outside Mode Notes are immediately understandable.
10. Review chord labels and distinguish traditional tertian harmony from generalized
   scale-step stacks.
11. Expand permanent regression tests before splitting
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
- The student-facing arpeggio view uses curated Popov geometry for maj7, 7, m7,
  m7b5, and dim7 rather than
  presenting an algorithmic score winner as a traditional fingering.
- Curated forms are rigidly transposed from one root anchor and independently checked
  against their stored chord degrees.
- Forms that do not fit between frets 0 and 15 are rejected instead of clipped.
- Chords without a curated fingering remain visible in harmonization but are not presented as actionable arpeggio buttons.

## Later roadmap

- Re-evaluate Octave Shape and Playable Run separately after the Popov triad library is complete: clarify their teaching purpose, inspect generated routes on a real guitar, simplify their controls, and keep only musically useful behavior.
- Derived exotic qualities based on approved Popov forms, with each result checked on a real guitar before publication.
- String-set and technique-specific libraries only after the Popov system is validated.
- String-set arpeggios on 6–5–4, 5–4–3, 4–3–2, and 3–2–1.
- Alternative starting chord tones (third, fifth, or seventh) and descending routes.
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
