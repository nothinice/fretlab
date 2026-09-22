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

### Scale forms: replace the generated fingering modes

1. Treat the supplied major and natural-minor diagrams as source candidates for five
   positional scale forms labelled E, D, C, A, and G. Obtain clear complete scans and
   identify the source, scale formula, tonic markers, fret/string orientation, and
   intended fingering before transcribing coordinates.
2. Compare each scale form with the curated Popov seventh-chord form carrying the same
   E/D/C/A/G label. Check whether they share the same tonic anchor and position, and
   whether the chord tones form a literal subset of the scale diagram. Do not infer
   equivalence from the shared label alone.
3. Decide the data model for a curated `SCALE_FORM_LIBRARY`: fixed relative coordinates,
   degree labels, tonic anchor, form id, source scale quality/formula, and explicit
   ascending playback order. Preserve the formula-driven scale engine as the source of
   pitch spelling and theory; curated forms are verified fretboard geometry.
4. Define how the five source forms extend beyond major and natural minor. Compare at
   least two approaches: a separate verified library per scale formula, or controlled
   degree mutations of an approved parent form followed by manual guitar validation.
   Never publish an automatically mutated form as verified before it is checked.
5. Design the scale-form UI that will replace `Octave Shape` and `Playable Run`.
   The likely model is a single Scale Forms mode with E/D/C/A/G selectors, whole-form
   playback, and honest unavailable states. Decide how it behaves for manual formulas,
   non-seven-note scales, and forms that do not fit between frets 0 and 15.
6. Decide how curated scale forms behave in Compare mode: whether Main and Outside modes
   can select forms independently, whether matching positions should be linked, and how
   Main / Shared / Outside notes remain visually understandable without duplicating an
   overloaded set of controls.
7. After the curated scale-form model is approved, remove the student-facing
   `Octave Shape` and `Playable Run` controls and retire their generated-route logic only
   when equivalent useful behavior is covered by the new forms.
8. Add fixed-coordinate fixtures plus all-root transposition, boundary, degree-content,
   note-count, and strictly ascending-playback tests for every approved scale form.
9. User-test every scale form and its playback on a real guitar, then record corrections
   as fixed source coordinates.

### Triad arpeggio forms

10. Obtain a clear source page for Popov's triad arpeggio forms; do not derive them by
    merely deleting the seventh from the current shapes.
11. Transcribe every triad quality shown by Popov as fixed relative geometry and connect
    supported triad chips to the same curated E/D/C/A/G form-selection model used by the
    seventh chords where the source supports those labels.
12. Compare each triad form with both its corresponding seventh-chord form and scale form.
    Record which notes and anchors are shared, but keep independent source geometry when
    the diagrams differ.
13. Add fixed-coordinate tests plus all-root transposition, boundary, degree, note-count,
    and ascending-playback checks for the triad library.
14. User-test the curated Popov-based triad and seventh-chord forms on a real guitar.
15. Verify every transcribed point and the ascending playback order against the source
    diagrams. Record hands-on corrections before adding derived exotic qualities.

### Existing interface and theory review

16. User-test the explicit Scale / Compare / Arpeggio states and Back to Scale action.
17. User-test the side-by-side Main Mode and Outside Mode selectors.
18. User-test whether Main Mode, Shared Notes, and Outside Mode Notes are immediately
    understandable.
19. Review chord labels and distinguish traditional tertian harmony from generalized
    scale-step stacks.
20. Expand permanent regression tests before splitting the single-file prototype into
    modules.

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

- Derived exotic qualities based on approved Popov forms, with each result checked on a real guitar before publication.
- String-set and technique-specific libraries only after the Popov system is validated.
- String-set arpeggios on 6–5–4, 5–4–3, 4–3–2, and 3–2–1.
- Alternative starting chord tones (third, fifth, or seventh) and descending routes.
- Arpeggio + Tensions: show Main/Shared/Tension notes around a selected chord.
- Scale-form comparison and guided transitions between approved Main and Tension forms.
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
