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
   non-seven-note scales, and forms that do not fit between frets 0 and 16.
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
12. Major and Natural Minor E/D/C/A/G forms and their playback were tested on a real
    guitar on 2026-09-23 with no remaining corrections. Repeat this hands-on review for
    every future modal candidate and store any correction as fixed coordinates.

### Proposed rollout for the remaining diatonic modes

Review this plan with Claude before implementation. The goal is to add Dorian, Phrygian,
Lydian, Mixolydian, and Locrian as 25 explicit E/D/C/A/G candidates without presenting
mechanically derived geometry as source-verified material.

1. Freeze the current Major and Natural Minor coordinates as parent references. Their ten
   diagrams were re-audited point by point against the supplied scans and Danila completed
   the separate hands-on guitar review on 2026-09-23 without finding further problems.
   Any later correction must land in the parent library before generating more candidates.
2. Produce each new mode from the parent requiring the fewest altered degrees:

   Parent selection is a data-engineering decision, not a pedagogical claim. The closest
   parent minimizes coordinate changes and transcription risk; it does not prescribe how
   the mode must be explained to a student. Teaching material may use the parallel mode,
   relative major, characteristic degree, tonic chord, or another musically useful route
   independently from the stored form's derivation provenance.

   | New mode | Parent | Coordinate mutation | Formula |
   | --- | --- | --- | --- |
   | Dorian | Natural Minor | every `b6` moves `+1` fret and becomes `6` | `1 2 b3 4 5 6 b7` |
   | Phrygian | Natural Minor | every `2` moves `-1` fret and becomes `b2` | `1 b2 b3 4 5 b6 b7` |
   | Lydian | Major | every `4` moves `+1` fret and becomes `#4` | `1 2 3 #4 5 6 7` |
   | Mixolydian | Major | every `7` moves `-1` fret and becomes `b7` | `1 2 3 4 5 6 b7` |
   | Locrian | Natural Minor | every `2` and `5` moves `-1` fret and becomes `b2` and `b5` | `1 b2 b3 4 b5 b6 b7` |

   Open-source preflight confirms both the formulas and the existence of five CAGED
   positions for all five modes, but not one universal literal geometry. FretShuffle
   publishes interval-labelled five-position libraries for
   [Dorian](https://fretshuffle.com/scales/dorian),
   [Phrygian](https://fretshuffle.com/scales/phrygian),
   [Lydian](https://fretshuffle.com/scales/lydian),
   [Mixolydian](https://fretshuffle.com/scales/mixolydian), and
   [Locrian](https://fretshuffle.com/scales/locrian). Online Guitar Books independently
   shows both parallel and derivative construction plus five CAGED positions for
   [Dorian](https://onlineguitarbooks.com/c-dorian-mode/) and
   [Mixolydian](https://onlineguitarbooks.com/c-mixolydian-mode/). Applied Guitar Theory
   documents five CAGED positions and root anchors for
   [Natural Minor](https://appliedguitartheory.com/lessons/natural-minor-scale/).
3. Treat those sources as a geometry cross-check, not automatic coordinate donors.
   Their boxes use different edge-note policies from the supplied Major/Natural Minor
   scans. For example, the published C Dorian E-position above includes A on the D string
   but omits the edge E-flat on the A string, while a literal mutation of our Natural
   Minor E-form does the reverse. Before implementation, compare two explicit options:
   (a) preserve our parent boundaries and mutate only existing points, or (b) adopt a
   separate independently sourced modal CAGED library. Do not silently combine the two.
4. Use mutation only as an offline initial-candidate method, never as runtime generation.
   Expand every result into independently stored literal coordinates in
   `SCALE_FORM_LIBRARY`. Record `parentScaleId`, the exact mutation map, provenance such
   as `derived-candidate`, and a per-form `reviewStatus`. The five forms of one mode must
   never share one all-or-nothing approval flag. Any later source-backed edge-note change
   must be explicit and must replace the `derived-candidate` provenance for that point.
5. Keep the tonic anchor, form id, string assignment, and every unaffected parent point
   unchanged. A changed degree stays on its original string and may move only by the
   declared one-fret delta. Reject collisions, duplicate string/fret points with different
   degrees, missing degrees, foreign degrees, or any undeclared coordinate change.
6. Implement in small reviewable stages: Dorian first as the minor-parent pilot,
   Mixolydian second as the major-parent pilot, then Lydian, Phrygian, and Locrian.
   Danila completed the hands-on review of all five forms of every diatonic mode on
   2026-09-23; all 35 forms are playable and are now `verified`. Locrian changes two
   degrees and adds the diminished/m7b5 relationship, so its separate review remained
   mandatory even though the final result passed.
7. Before exposing a raw derived candidate, test all five forms in all twelve roots for
   exact degree content, preserved parent point count and root positions, correct pitch classes, collisions,
   fretboard boundaries, and strictly ascending unique playback. Playback must begin on
   the tonic. Do not enlarge the fretboard merely to make a candidate pass: retain the
   existing unavailable-button behavior and review every boundary failure first.
   After an explicit source-backed or hands-on edge-note correction, replace the parent
   point-count assertion with a fixed literal fixture for that reviewed form.
8. Add `#4` to the degree-semitone model before Lydian, while preserving enharmonic
   spelling and Notes/Degrees display. Extend formula detection only for the five exact
   modal formulas; arbitrary manual formulas must continue to show no curated form rather
   than borrowing the nearest mode.
9. Show derived forms in the existing Scale Forms UI with an explicit message that they
   are candidates awaiting guitar review. Never label them verified merely because their
   interval formulas and automated tests are correct.
10. Check tonic-chord relationships separately for every mode, form, and chord quality:
   Dorian and Phrygian against min/m7, Lydian against maj/maj7, Mixolydian against maj/7,
   and Locrian against dim/m7b5. Recompute literal subsets and record `verified`,
   `pending`, or `mismatch`; never force a chord form into a scale form or repair either
   library to manufacture a match.
11. Danila reviews each E/D/C/A/G candidate on guitar for fingering, continuity, range,
    tonic placement, and playback order. All five forms of all seven diatonic modes
    passed this review on 2026-09-23. Hands-on continuity review relocated exact unisons
    in Dorian E/G and Lydian E without changing pitch or degree.
    Promote only the approved individual form from `pending` to `verified`. Store any
    correction as explicit coordinates with a written reason instead of changing the
    mutation rule globally.
    The verified Phrygian E and A forms have explicit hands-on corrections. E's
    `b2` at G-string offset `-2` is relocated to the pitch-identical D-string offset
    `+3`, producing a continuous D-E-F group. A's `b2` at B-string offset `-1` is
    relocated to the pitch-identical G-string offset `+3`, producing a continuous
    G-A-Bb group. Neither relocation changes degree content or pitch.
    The verified Locrian E form relocates its `b5` from B-string offset `-1` to
    G-string offset `+3` and its `b2` from G-string offset `-2` to D-string offset `+3`.
    These exact unisons remove the isolated left-edge F and C while retaining every pitch.
12. After hands-on approval, replace derivation-only assertions with fixed-coordinate
    regression fixtures so later parent edits cannot silently alter an approved modal
    form. Maintain a per-form comparison record against the independent published modal
    positions, including matches, intentional boundary differences, and adopted points.
13. Keep curated modal forms out of Compare mode until all five standalone libraries and
    their review statuses are stable; the deferred Compare-mode design must not reshape
    the core data model during this rollout.
14. Claude completed the independent programmatic audit of the full seven-mode library
    on 2026-09-23. The three official suites pass with 418 scale realizations / 70
    scale-chord relationships, 468 Popov realizations, and 15 triad forms. All seven
    formulas and E/D/C/A/G libraries, exact mutations, literal corrections, fretboard
    boundaries, degree sets, pitch classes, collisions, playback order, relationship
    metadata, and parent-library regression checks passed. Five isolated mutation tests
    were also proven sensitive by introducing one deliberate error at a time and then
    restoring a clean working copy. This audit validates theory, transposition, and stored
    geometry only. Danila subsequently completed the hands-on guitar review of all 35
    modal forms with no remaining playability concerns. The broader first-time-user UI
    interaction checklist remains open for the design phase.

### Triad arpeggio forms

13. The user approved an interim derived model for core triads: maj is the exact 1/3/5
    subset of maj7, min is the exact 1/b3/5 subset of m7, and dim is the exact 1/b3/b5
    subset of m7b5. Store all coordinates independently so later seventh-chord edits
    cannot silently mutate the triad library. Do not extend this shortcut to aug, sus2,
    sus4, or exotic qualities without a verified source or hands-on approval.
14. Connect the supported maj, min, and dim triad chips to the same curated E/D/C/A/G
    form-selection model used by the seventh chords.
15. Compare each derived triad form with both its corresponding seventh-chord form and
    scale form. Record the scale relationship per form as `verified` or `mismatch` rather
    than assuming that a shared E/D/C/A/G label guarantees identical geometry.
16. Keep fixed-coordinate tests plus all-root transposition, boundary, degree, note-count,
    ascending-playback, and exact seventh-chord-subset checks for the triad library.
    Internal string skips remain forbidden unless the form declares one exact,
    source-confirmed gap: diminished E skips stringIdx 1 and diminished C skips stringIdx
    2. An independent CAGED triad source validates string skipping as a legitimate form
    behavior, but does not contribute coordinates to the Popov-derived library.
17. The current curated Popov-based triad and seventh-chord forms were tested on a real
    guitar on 2026-09-23 with no remaining corrections. Repeat the review for any future
    chord-form addition or coordinate change.
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

### Product design and commercial direction

24. Pause broad library expansion after the current diatonic-mode review and prototype a
    clearer FretLab v2 learning surface without removing the formula-driven engine. The
    primary screen should lead with the musical task and the fretboard, not the formula
    editor: tonic, mode, E/D/C/A/G form, and a prominent board should be visible before
    advanced construction controls.
25. Organize the product around four explicit jobs: `Learn` verified positional forms,
    `Explore` the complete fretboard and custom formulas, `Practice` with playback and
    later tempo/progress tools, and `My Materials` for saved or teacher-assigned work.
    Keep formula editing, outside-mode comparison, custom fret ranges, and other expert
    controls available in an Advanced/Explore surface rather than exposing every choice
    at once to a new student.
26. Make the scale-to-harmony relationship the central differentiator: within one
    physical position, let the learner switch among the complete scale, tonic triad,
    seventh chord, and a combined overlay. Explain the active form in plain language and
    distinguish the primary playback route from optional duplicated unisons.
27. Preserve the current warm paper / forest-green / amber visual identity, but reduce
    nested boxes, strengthen hierarchy, keep the fretboard above the fold, and make the
    main action unambiguous. Internal provenance and review statuses should remain
    inspectable without dominating student-facing copy.
28. Use competitor patterns selectively rather than cloning a single product:
    FretMap's immediate fretboard and simple position switching; Fretastic's advanced
    controls, shareable state, PWA, and later backing tracks; Oolimo's separation of
    finder, analyzer, theory, and quiz jobs; Fret Monster's concise instructional context;
    and fr3t.app's explanation of how CAGED chords, scales, and arpeggios connect. Avoid
    their recurring weaknesses: control overload before the board, fragmented tool
    navigation, oversized marketing pages around the tool, and feature breadth without a
    guided learning path.
29. Validate the redesign before adding accounts or payments. Give an isolated prototype
    to 5-10 students and teachers without instructions and observe whether they can open a
    requested key/mode, choose a form, reveal its triad or seventh chord, play it, and
    understand the next action. Record failures as product requirements rather than
    explaining the existing interface to the participant.
30. Treat the commercial proposition as guided fretboard learning, not paid scale lookup.
    A possible free tier keeps the whole-fretboard explorer, core scales, and basic audio;
    individual Pro can later add the full verified library, saved practice, loops,
    progress, and backing tracks; Teacher can add shareable assignments, student groups,
    comments, and lesson collections. Pricing and backend implementation remain discovery
    items until a small paid pilot demonstrates demand.

### Chord dictionary and identification

31. Investigate adding an Oolimo-like chord workflow to FretLab: place notes on the
    fretboard and identify possible chord names/inversions, or choose a chord symbol and
    display playable shapes. Keep `Chord Finder`, `Chord Analyzer`, and the existing
    curated arpeggio learner as separate user jobs even if they share one theory engine.
32. Do not copy Oolimo's proprietary database, diagrams, wording, or interface. First
    determine whether FretLab can generate its own chord dictionary from interval
    formulas, required/optional tones, omissions, extensions, alterations, bass note,
    enharmonic spelling, and inversion rules. If an external dataset is considered,
    document its license, provenance, update policy, and commercial-use permission before
    importing any records.
33. Design chord identification to return ranked interpretations rather than one absolute
    answer. Ranking should consider the selected bass note, compact/common spelling,
    characteristic tones, omitted fifths, enharmonic context, and the current key or mode.
    Show the pitch-class formula and explain ambiguous alternatives so the result remains
    musically honest.
34. Reuse the formula engine where practical, but keep chord-symbol parsing and naming in
    a tested module independent from fretboard geometry. Add fixtures for inversions,
    slash chords, enharmonic roots, incomplete voicings, duplicated notes, altered
    dominants, and genuinely ambiguous pitch-class sets before exposing identification in
    the main learning flow.

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
- The displayed board extends through fret 16 so every current scale and chord form can
  be realized in every root; future unavailable forms must be disabled before selection
  and rejected instead of clipped if they exceed that range.
- Chords without a curated fingering remain visible in harmonization but are not presented as actionable arpeggio buttons.

## Later roadmap

- After all five modal libraries stabilize, distinguish duplicated unison positions from
  the primary playback route. Preserve every source point, but mark optional alternatives
  so G-forms with 17 physical positions and 15 unique pitches do not show ambiguous
  duplicate order numbers.
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
