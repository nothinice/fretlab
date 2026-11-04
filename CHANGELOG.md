# Changelog

## Listening and rhythm introduction — 2026-11-04

- Keep correct ear answers visible until explicit continuation; clearly prompt listening to each new pair.
- Introduce pulse, straight eighths and rests with original audio demonstrations before rhythm choices.
- Display rhythm answers in four beat groups with counts, syllables and plain-language descriptions.
- Replay the reviewed rhythm until guitar/voice practice is acknowledged, rather than playing the next question.
- Add desktop/mobile listening regression coverage.

## Interval answer review — 2026-11-04

- Keep both interval endpoints, a labeled arc and success feedback visible after correct answers.
- Advance only through an explicit next/finish button, including the final interval assessment; repeated clicks remain available for listening.
- Extend the complete browser flow to verify the intermediate review state.

## Lesson click audio — 2026-11-04

- Play only the selected note on correct and repeated lesson answers; leave examples behind the Listen button.
- Replace the ambiguous self-assessment status with an explicit user practice mark.
- Cover single-note correct/repeated answers in the lesson regression test.

## Task rewards and course UX — 2026-11-04

- Added persistent named task badges, specific animated success feedback and a block-completion celebration; hints do not reduce rewards.
- Simplified the entry screen, highlighted the current route card, numbered strings and clarified task labels and scale steps.
- Added large phrase-duration controls and an eight-beat meter; showed Stop only during example playback and moved tempo into sound settings.
- Corrected the final repair diagram and guaranteed both directions and interval sizes in the final assessment.
- Added reward/persistence/browser regressions and checked desktop/mobile layouts.

## Review follow-up — 2026-11-04

- Limited lesson-return links to interval, formula, scale and repair activities.
- Updated only changed sounding cells, including replacement DOM nodes; retired stopped and expired voices even without ended events.
- Validated fallback fret positions and resumed the most recently visited unfinished lesson, including migration of existing saved sessions.
- Enlarged tab scrolling to a 44px target. Added Node and Chromium regression coverage.

## Second Claude review — 2026-11-04

- Kept slow lesson playback explicit; restored the tools’ 0.32-second sequence spacing and 0.9-second single notes.
- Added a short release on stop, including cancellation of scheduled notes; examples toggle Listen/Stop.
- Highlighted explicit fretboard positions, including sequential unisons; unreached scale answers stay hidden.
- Stored validated lesson steps, answers, hints and guitar self-reports locally, with a storage-unavailable fallback.
- Made Course a stable tab containing the lesson region; removed the hidden lesson tab and inconsistent breadcrumb numbers.
- Added return-to-lesson/return-to-exercise navigation preserving the attempt, a mobile tab-scroll button, and clearer Next prerequisites.
- Added a guitar reminder and labeled block 2 as the next stage; no untested completion-time promise.
- Verified Node suites, complete desktop/mobile block flow, reload/navigation regressions, and offline audio release/timing.

## Claude review copy — 2026-11-04

- Removed the repeated “Why do this?” disclosure from lesson and practice screens.
  Kept block goals, task instructions and internal methodological/source notes.
- Built a single portable HTML review copy with the course styles and scripts embedded.

## Course audio refinement — 2026-11-04

- Replaced the plain triangle oscillator with a rounded synthetic tone containing
  gentle overtones and a decaying low-pass filter. This is not a guitar sample.
- Sustained the body of each note before release: single clicks last 1.35 seconds;
  guided sequences use 0.5-second notes at 0.55-second intervals. Explicit durations
  and tempo in rhythm/composition exercises remain unchanged.
- Verified the rendered envelope, release, C3 fundamental and sequence scheduling
  with OfflineAudioContext, plus the complete course UI and musical regression suites.

## Course presentation review — 2026-11-04

- Follow-up: replaced rectangular fret hover/focus/playback fills with circular halos
  and gentle note scaling; reduced-motion preferences disable the scaling.
- Lesson Next/Back preserve viewport and horizontal fretboard scroll. A per-lesson
  minimum height prevents shorter content from pulling the page upward; it resets
  on restart, lesson change or viewport resize. Verified mobile scroll regression,
  hover appearance, reduced motion and the full browser flow.

- Applied the owner-provided Claude source review to the course entry only: grouped
  Block 1 route, resume action, shared Course navigation and lesson return/continuation.
- Separated primary, secondary and text actions; moved purpose/alternate E-major
  explanation into disclosures and placed instructions directly above the board.
- Added tone/semitone brackets and matching formula colours, audio-clock-driven note
  highlighting, and arrow-key navigation with one tab stop on the free fretboard.
- Fixed theme-aware borders, the undefined tonic-border variable and beat inflection.
- Verified all Node test suites and the complete browser flow against both the source
  page and portable HTML, including 1366×768 and emulated 390px layouts, dark theme,
  keyboard focus, audio highlighting, storage failure and saved-result reload.
- Screenshots were inspected in Chromium; no physical-phone or new guitar-performance
  validation is claimed. Source-derived musical material and self-assessment remain distinct.
- Publication uses the separate course-preview repository; original FretLab `main`
  and `redesign-v2.html` remain unchanged.

## 0.9.1-preview — 2026-09-23

- Recorded completed hands-on guitar review of all current Major, Natural Minor, triad,
  and seventh-chord forms with no remaining corrections.
- Added five independently stored Dorian E/D/C/A/G candidates derived from the reviewed
  Natural Minor parents by the sole declared mutation `b6 → 6` one fret higher.
- Kept every Dorian form explicitly `pending`, exposed that status in the interface, and
  added all-root, lineage, collision, playback, boundary, and chord-subset regression tests.
- Promoted all five Dorian forms to `verified` after hands-on guitar review and pinned
  their approved C-root coordinates as fixed regression fixtures.
- Added five independently stored Mixolydian E/D/C/A/G candidates from the reviewed
  Major parents using only the declared `7 → b7` one-fret downward mutation.
- Kept Mixolydian explicitly `pending` while testing all roots, exact lineage, collisions,
  playback, boundaries, and maj/dominant-7 subset relationships.
- Promoted all five Mixolydian forms to `verified` after hands-on guitar review and pinned
  their approved C-root coordinates as fixed regression fixtures.
- Added five independently stored Lydian E/D/C/A/G candidates from Major using only the
  declared `4 → #4` one-fret upward mutation; all remain `pending` for guitar review.
- Added `#4` to curated scale realization and made the chromatic degree controls preserve
  the active formula's enharmonic label instead of displaying Lydian's `#4` as `b5`.
- Kept the two honest 16-fret boundary exclusions: D-form at D#/Eb and G-form at G#/Ab;
  the interface disables those combinations rather than expanding or truncating them.
- Promoted all five Lydian forms to `verified` after hands-on guitar review and pinned
  their approved C-root coordinates as fixed regression fixtures.
- Added five independently stored Phrygian E/D/C/A/G candidates from Natural Minor using
  only the declared `2 → b2` one-fret downward mutation; all 60 roots/forms fit.
- Applied explicit hands-on corrections to Phrygian E and A: moved each b2 to an exact
  unison so D-E-F and G-A-Bb stay continuous; tests prove pitch and degree preservation.
- Completed the seven-mode diatonic form library with five independently stored Locrian
  candidates derived from Natural Minor by only `2 → b2` and `5 → b5`; all 60 roots/forms
  fit the 16-fret board and remain `pending` for hands-on review.
- Added per-form Locrian cross-checks against diminished and m7b5 Popov arpeggios. The
  hands-on E-form relocation makes E and G literal subsets for both qualities; the other
  six relationships remain mismatches.
- Applied five hands-on exact-unison refinements: A in Dorian G, D in Dorian E, F# in
  Lydian E, and F/C in Locrian E now sit on the adjacent string for clearer continuity.
  The generalized correction test independently proves pitch and degree preservation,
  including relocations of degrees that were not changed by the modal mutation itself.
- Recorded a later UI pass for duplicated unisons in broad G-forms: retain the source
  points but separate optional alternatives from the primary numbered playback route.
- Pinned the source-transcribed major G scale form to 17 positions / 15 pitches and
  required its playback to begin on the low-E-string tonic rather than below the root.
- Restored the diminished E and C triads as literal subsets of their Popov m7b5 forms.
- Retained their exact source-derived string skips instead of relocating notes to unisons.
- Added named regression assertions for the E-form B-string gap and C-form G-string gap;
  every other current triad form must remain contiguous.
- Used an independent published CAGED diminished-triad source to validate string skipping
  as legitimate methodology without mixing its extra coordinates into the Popov library.

## 0.9.0-preview — 2026-09-22

- Added five independently stored E/D/C/A/G forms for major, minor, and diminished triad arpeggios.
- Verified each triad form as the exact 1/3/5 subset of its maj7, m7, or m7b5 Popov source form.
- Made supported triads directly selectable from scale harmonization.
- Replaced the mixed view-control row with three primary study modes: Whole Scale, Scale Forms, and Arpeggios.
- Moved fret-range controls into a secondary row and brought the chord chooser above the fretboard in Arpeggio mode.
- Added a visible two-step arpeggio workflow: choose a chord, then choose its E/D/C/A/G form.
- Blocked the derived diminished E and C triad forms from the selector because deleting
  the seventh leaves an internal empty string; their coordinates remain recorded for review.
- Extended the fretboard and range controls through fret 16, allowing all 120 current
  scale-form/root combinations and all 468 chord-form/root combinations to fit completely.
- Added pre-selection availability checks so any future form that exceeds the displayed
  fretboard is disabled instead of opening an empty board.

## 0.8.0-preview — 2026-09-21

- Replaced generated Position/Sweep/Smooth/Diagonal choices in the student-facing arpeggio view with five curated maj7 chord forms: E, D, C, A, and G.
- Transcribed the first Popov chord-form row as relative, transposable geometry rather than copying fixed fret numbers or source artwork.
- Separated the curated form source from the existing fretboard renderer and playback path; the earlier route generator remains internal during validation.
- Removed starting-string, octave-count, generated-category, and Other-variants controls from the curated form UI.
- Added honest unavailable-state messages for unsupported chord qualities and forms that exceed the displayed 15-fret range.
- Added regression coverage for the exact Cmaj7 coordinates and all 60 form/root combinations; 57 fit the current board and three are correctly rejected at its boundaries.
- Restored the low third on the D string in the A-form route after hands-on comparison with Popov's diagram.
- Added the remaining Popov seventh-chord rows for dominant 7, minor 7, minor 7 flat 5, and diminished 7 qualities.
- Preserved each quality as its own curated geometry instead of deriving it by mechanically moving chord tones.
- Added the four-form diminished row with the shared E/G form exactly as represented by the source system.
- Generalized the form selector and transposition engine across all five supported chord qualities.
- Expanded fixed-coordinate and all-root regression coverage to 24 forms and 279 valid realizations inside the 0-15 fret range.
- Removed the duplicate bottom scale-library button collection; every preset remains available from the main Mode selector.
- Made triads and unsupported four-note qualities informational chips instead of misleading arpeggio buttons.
- Removed the permanently hidden legacy route-comparison control container.

## 0.7.0-preview — 2026-09-21

- Replaced the fixed Wide/Alternative pair with route families selected from one complete arpeggio-route search.
- Added Position, Sweep, Smooth, Diagonal, and Two notes per string categories for one- and two-octave arpeggios.
- Sweep routing permits useful two-note string groups and strongly penalizes three-note groups instead of imposing an impossible one-note-per-string rule.
- Merged categories that resolve to the same fingering and labelled their additional uses instead of showing duplicate buttons.
- Added a grouped Other variants navigator with route count, notes-per-string distribution, fret span, and used strings.
- Added permanent regression coverage across 672 root, chord-quality, starting-string, and octave combinations.
- Made Diagonal prefer more unique strings after its backtrack, direction-change, and three-note-group safeguards tie; added semantic category assertions to the regression suite.
- Filtered unexplained three-note-per-string routes out of Other variants so the browser presents plausible general fingerings rather than every mechanically valid path.
- Kept the one-octave fingering visible when two octaves exceed the 15-fret board and added a concise reminder to continue the route along the neck.
- Extracted and regression-tested the two-to-one-octave fallback decision as pure logic.
- Rebalanced Sweep routes to avoid abrupt position transfers before rewarding long string-crossing runs, and to prefer repeated/legato notes on upper strings.
- Refined Russian terminology for modes, outside playing, Holdsworth collections, and octave fingerings.

## 0.6.0-preview — 2026-09-21

- Added one- and two-octave arpeggio shapes from roots on strings 6, 5, 4, and 3 when the physical fretboard range allows them.
- Reworked arpeggio routing around Wide and Alternative fingering variants for both octave ranges.
- Added switchable simple-degree and compound-interval labels for two-octave routes.
- Added clear Russian availability messages instead of displaying incomplete two-octave shapes.
- Translated the main application interface, controls, hints, and validation messages into Russian.

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
