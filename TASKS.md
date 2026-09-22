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
   intended fingering before transcribing coordinates. The working hypothesis is that
   the two diagrams show major and natural-minor content inside one shared positional
   system; verify this from the complete source instead of assuming either a shared or
   separate system from the cropped diagrams alone.
2. Compare each scale form with the curated Popov seventh-chord form carrying the same
   E/D/C/A/G label. Check whether they share the same tonic anchor and position, and
   whether the chord tones form a literal subset of the scale diagram. Do not infer
   equivalence from the shared label alone.
3. If the sources confirm the relationship, build one coherent positional system for
   each E/D/C/A/G label: the scale is the complete form, while its triad and seventh
   chord are verified subsets with the same tonic anchor and position. Store the scale,
   triad, and seventh-chord geometries independently from their own source coordinates;
   the subset relationship is a cross-check and navigation model, not a generator.
4. Verify scale/chord relationships independently for every scale formula, E/D/C/A/G
   form, and chord quality; never use one all-or-nothing flag for the complete five-form
   system. Store relationship metadata separately from form geometry with an explicit
   `verified`, `pending`, or `mismatch` status. Partial confirmation enables only the
   confirmed navigation and subset tests, while pending or mismatching forms remain
   independently available and must never be silently repaired or treated as linked.
5. Start the cross-check with the relationships directly supported by the supplied
   diagrams: Major contains maj and maj7; Natural Minor contains min and m7. Later apply
   the same method to verified Mixolydian/7, Locrian/m7b5, and diminished-scale/dim7
   forms rather than assuming those geometries from interval formulas alone.
6. Decide the data model for a curated `SCALE_FORM_LIBRARY`: fixed relative coordinates,
   degree labels, tonic anchor, form id, source scale quality/formula, and explicit
   ascending playback order. Preserve the formula-driven scale engine as the source of
   pitch spelling and theory; curated forms are verified fretboard geometry.
7. Define how the five source forms extend beyond major and natural minor. Compare at
   least two approaches: a separate verified library per scale formula, or controlled
   degree mutations of an approved parent form followed by manual guitar validation.
   Never publish an automatically mutated form as verified before it is checked.
8. Design the scale-form UI that will replace `Octave Shape` and `Playable Run`.
   The likely model is a single Scale Forms mode with E/D/C/A/G selectors, whole-form
   playback, and honest unavailable states. Decide how it behaves for manual formulas,
   non-seven-note scales, and forms that do not fit between frets 0 and 15.
9. After the curated scale-form model is approved, remove the student-facing
   `Octave Shape` and `Playable Run` controls and retire their generated-route logic only
   when equivalent useful behavior is covered by the new forms.
10. Add fixed-coordinate fixtures plus all-root transposition, boundary, note-count, and
   strictly ascending-playback tests for every approved scale form. Degree-content tests
   must prove both sides: every expected degree is present in the intended repetitions,
   and no foreign degree or accidental variant is present (for example, Natural Minor
   must not contain a natural 3, 6, or 7).
11. Add explicit subset tests for every approved scale/chord relationship. With matching
    root and form id, every stored triad or seventh-chord point must exist in the parent
    scale form at the same string and fret offset; a failed subset check must be reviewed
    against both sources rather than repaired automatically.
12. User-test every scale form and its playback on a real guitar, then record corrections
    as fixed source coordinates.

### Triad arpeggio forms

13. Obtain a clear source page for Popov's triad arpeggio forms; do not derive them by
    merely deleting the seventh from the current shapes.
14. Transcribe every triad quality shown by Popov as fixed relative geometry and connect
    supported triad chips to the same curated E/D/C/A/G form-selection model used by the
    seventh chords where the source supports those labels.
15. Compare each triad form with both its corresponding seventh-chord form and scale form.
    Record which notes and anchors are shared, but keep independent source geometry when
    the diagrams differ.
16. Add fixed-coordinate tests plus all-root transposition, boundary, degree, note-count,
    and ascending-playback checks for the triad library.
17. User-test the curated Popov-based triad and seventh-chord forms on a real guitar.
18. Verify every transcribed point and the ascending playback order against the source
    diagrams. Record hands-on corrections before adding derived exotic qualities.

### Existing interface and theory review

19. User-test the explicit Scale / Compare / Arpeggio states and Back to Scale action.
20. User-test the side-by-side Main Mode and Outside Mode selectors.
21. User-test whether Main Mode, Shared Notes, and Outside Mode Notes are immediately
    understandable.
22. Review chord labels and distinguish traditional tertian harmony from generalized
    scale-step stacks.
23. Expand permanent regression tests before splitting the single-file prototype into
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

- After the standalone scale, triad, and seventh-chord libraries are complete and tested,
  design curated scale forms in Compare mode: independent versus linked E/D/C/A/G form
  selection for Main and Outside modes, and a clear Main / Shared / Outside presentation
  without duplicating an overloaded set of controls. Keep this UI decision from shaping
  the core form-library data model prematurely.
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
