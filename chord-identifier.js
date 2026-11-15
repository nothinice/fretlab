/*
 * Pitch-set candidates for the free fretboard. The lesson's quality tables are
 * the authority for triads and seventh/sixth chords; this module only adds
 * voicing, extension, spelling and ranking rules around those shared tables.
 */
const ChordIdentifier = (() => {
  'use strict';

  const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const SIMPLE_INTERVALS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
  const mod12 = value => ((value % 12) + 12) % 12;
  const same = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);

  function noteName(pc, spelling = 'sharp') {
    if (!Number.isInteger(pc)) return '';
    return (spelling === 'flat' ? FLAT_NAMES : SHARP_NAMES)[mod12(pc)];
  }

  function intervalLabel(semitones, quality = '') {
    if (!Number.isInteger(semitones)) return '';
    const interval = mod12(semitones);
    const name = typeof quality === 'object' && quality ? quality.quality || '' : String(quality);
    if (interval === 9 && name === 'dim7') return 'bb7';
    if (interval === 8 && (name === 'aug' || name.includes('#5'))) return '#5';
    if (interval === 6 && name.includes('#11')) return '#11';
    if (interval === 1 && name.includes('b9')) return 'b9';
    if (interval === 3 && name.includes('#9')) return '#9';
    if (interval === 8 && name.includes('b13')) return 'b13';
    if (interval === 2 && /(?:add9|\/9|9|11|13)/.test(name) && name !== '7sus2') return '9';
    if (interval === 5 && /(?:add11|11|13)/.test(name) && !name.includes('sus4')) return '11';
    if (interval === 9 && /13/.test(name)) return '13';
    return SIMPLE_INTERVALS[interval];
  }

  function sharedTables(options) {
    return {
      triads: options.triads || (typeof TRIAD_QUALITY !== 'undefined' ? TRIAD_QUALITY : null),
      tetrads: options.tetrads || (typeof TETRAD_QUALITY !== 'undefined' ? TETRAD_QUALITY : null)
    };
  }

  function buildTemplates(tables) {
    const templates = [];
    const seen = new Set();
    function add(intervals, quality, source, labels = {}) {
      const sorted = [...new Set(intervals)].sort((a, b) => a - b);
      const key = sorted.join(',') + ':' + quality;
      if (seen.has(key)) return;
      seen.add(key);
      templates.push({intervals: sorted, quality, source, labels});
    }
    for (const [table, size] of [[tables.triads, 2], [tables.tetrads, 3]]) {
      if (!table || typeof table !== 'object') continue;
      for (const [key, quality] of Object.entries(table)) {
        const intervals = key.split(',').map(Number);
        if (intervals.length !== size || typeof quality !== 'string' || !quality.trim() ||
            intervals.some(value => !Number.isInteger(value) || value < 1 || value > 11) ||
            new Set(intervals).size !== size) continue;
        add([0, ...intervals], quality, 'shared');
      }
    }

    const bases = templates.slice();
    const extend = (base, extra, quality, labels = {}) => add([...base.intervals, ...extra], quality, 'extension', labels);
    for (const base of bases) {
      const quality = base.quality;
      if (quality === 'maj' || quality === 'm') {
        const prefix = quality === 'm' ? 'm' : '';
        extend(base, [2], prefix + 'add9', {2: '9'});
        extend(base, [5], prefix + 'add11', {5: '11'});
      }
      if (quality === 'maj') extend(base, [6], 'add#11', {6: '#11'});
      if (quality === '6' || quality === 'm6') extend(base, [2], quality + '/9', {2: '9'});

      const ninthNames = {7: '9', maj7: 'maj9', m7: 'm9', mMaj7: 'mMaj9'};
      if (ninthNames[quality]) {
        const prefix = quality.slice(0, -1);
        extend(base, [2], ninthNames[quality], {2: '9'});
        extend(base, [5], quality + 'add11', {5: '11'});
        extend(base, [9], quality + 'add13', {9: '13'});
        extend(base, [2, 5], prefix + '11', {2: '9', 5: '11'});
        // A 13th commonly omits the 11th. Both complete pitch sets are exact
        // templates, rather than treating that conventional voicing as an error.
        extend(base, [2, 9], prefix + '13', {2: '9', 9: '13'});
        extend(base, [2, 5, 9], prefix + '13', {2: '9', 5: '11', 9: '13'});
      }
      if (quality === '7' || quality === 'maj7') {
        extend(base, [6], quality + '#11', {6: '#11'});
        extend(base, [2, 6], quality === '7' ? '9#11' : 'maj9#11', {2: '9', 6: '#11'});
      }
      if (quality === '7') {
        extend(base, [1], '7b9', {1: 'b9'});
        extend(base, [3], '7#9', {3: '#9'});
        extend(base, [8], '7b13', {8: 'b13'});
      }
      const alteredNinths = {'7b5': '9b5', '7#5': '9#5', maj7b5: 'maj9b5', 'maj7#5': 'maj9#5', m7b5: 'm9b5'};
      if (alteredNinths[quality]) extend(base, [2], alteredNinths[quality], {2: '9'});
      if (quality === '7sus4') {
        extend(base, [2], '9sus4', {2: '9'});
        extend(base, [2, 9], '13sus4', {2: '9', 9: '13'});
      }
    }
    add([0, 7], '5', 'power');
    return templates;
  }

  function analyze(input, rawOptions = {}) {
    const options = rawOptions && typeof rawOptions === 'object' ? rawOptions : {};
    const warnings = [];
    const warn = code => { if (!warnings.includes(code)) warnings.push(code); };
    const values = Array.isArray(input) ? input : [];
    if (!Array.isArray(input)) warn('invalid-midi');
    const midis = values.filter(value => Number.isInteger(value) && value >= 0 && value <= 127);
    if (midis.length !== values.length) warn('invalid-midi');
    const notes = [...new Set(midis.map(mod12))].sort((a, b) => a - b);
    const spelling = options.spelling === 'flat' ? 'flat' : 'sharp';
    const bassMidi = midis.length ? midis.reduce((lowest, midi) => Math.min(lowest, midi), 127) : null;
    const bassPc = bassMidi === null ? null : mod12(bassMidi);
    const result = {notes, noteNames: notes.map(pc => noteName(pc, spelling)), bassMidi, bassPc,
      candidates: [], warnings, status: notes.length ? 'single' : 'empty'};
    const manualRoot = options.rootPc !== null && options.rootPc !== undefined;
    if (manualRoot && (!Number.isInteger(options.rootPc) || options.rootPc < 0 || options.rootPc > 11)) {
      warn('invalid-root');
      result.status = notes.length < 2 ? result.status : 'unknown';
      return result;
    }
    if (manualRoot && notes.length && !notes.includes(options.rootPc)) warn('root-not-played');
    if (notes.length < 2) return result;
    const tables = sharedTables(options);
    const spell = typeof options.buildScale === 'function' ? options.buildScale :
      (typeof buildScale === 'function' ? buildScale : null);
    if (!tables.triads || !tables.tetrads) warn('missing-chord-tables');
    const roots = manualRoot ? [options.rootPc] : notes;
    const templates = buildTemplates(tables);
    for (const rootPc of roots) {
      const observed = notes.map(pc => mod12(pc - rootPc)).sort((a, b) => a - b);
      for (const template of templates) {
        const hasRoot = observed.includes(0);
        const missing = [];
        let expected = template.intervals;
        if (!hasRoot) {
          // Rootless readings require a chosen root and at least three actual
          // tones. They always remain explicit incomplete candidates.
          if (!manualRoot || notes.length < 3 || expected.length < 4) continue;
          expected = expected.filter(value => value !== 0);
          missing.push('1');
        }
        if (!same(observed, expected)) {
          // A third determines major/minor; a fifth does not. Never infer a
          // third from C-G, and never turn an arbitrary cluster into a chord.
          const hasThird = expected.includes(3) || expected.includes(4);
          const enoughNotes = notes.length >= 3 || (manualRoot && notes.length === 2);
          if (!hasRoot || !hasThird || !enoughNotes || !expected.includes(7) ||
              !same(observed, expected.filter(value => value !== 7))) continue;
          missing.push('5');
        }
        const rootName = noteName(rootPc, spelling);
        const quality = template.quality;
        const suffix = quality === 'maj' ? '' : quality;
        const incomplete = missing.length ? '(' + missing.map(degree => 'no' + degree).join(',') + ')' : '';
        const intervals = observed.map(semitones => {
          const pc = mod12(rootPc + semitones);
          const label = template.labels[semitones] || intervalLabel(semitones, quality);
          return {pc, semitones, label, note: noteName(pc, spelling)};
        });
        const formula = intervals.map(interval => interval.label).join(' ');
        if (spell) {
          // Reuse the lesson's degree-aware spelling (E# in C# major, Bbb in
          // Cdim7). Standalone callers without it retain their pitch names.
          try {
            const spelled = spell(rootPc, rootName[0], formula);
            if (Array.isArray(spelled)) intervals.forEach(interval => {
              const tone = spelled.find(note => note.pc === interval.pc && note.degreeLabel === interval.label);
              if (tone && typeof tone.noteName === 'string') interval.note = tone.noteName;
            });
          } catch (_) { /* A caller-supplied spelling helper must not break analysis. */ }
        }
        const bassName = intervals.find(interval => interval.pc === bassPc)?.note || noteName(bassPc, spelling);
        const slash = bassPc === rootPc ? '' : '/' + bassName;
        // Prefer familiar readings with their root in the bass. A conventional
        // omitted fifth is less consequential than an absent root, while an
        // altered exact match must not automatically outrank a simple shell.
        const altered = /(?:b5|#5|#11|b9|#9|b13)/.test(quality) && !['m7b5', 'm9b5'].includes(quality);
        const missingPenalty = missing.reduce((penalty, degree) => penalty + (degree === '1' ? 18 : 8), 0);
        const score = 100 - Math.max(0, template.intervals.length - 3) * 3 - missingPenalty +
          (bassPc === rootPc ? 8 : 0) - (template.source === 'power' ? 8 : 0) - (altered ? 6 : 0);
        result.candidates.push({rootPc, rootName, symbol: rootName + suffix + incomplete + slash,
          quality, intervals, formula,
          score, bassPc, missing, warnings: missing.length ? ['missing-tones'] : []});
      }
    }
    result.candidates.sort((left, right) => right.score - left.score ||
      left.missing.length - right.missing.length || left.rootPc - right.rootPc || left.symbol.localeCompare(right.symbol));
    // Distinct full/omitted-11 templates can produce the same incomplete name.
    result.candidates = result.candidates.filter((candidate, index, list) =>
      list.findIndex(other => other.rootPc === candidate.rootPc && other.symbol === candidate.symbol) === index);
    if (result.candidates.length) {
      result.status = 'identified';
      if (result.candidates.some(candidate => candidate.missing.length)) warn('missing-tones');
      if (result.candidates.length > 1) warn('ambiguous');
    } else {
      result.status = 'unknown';
      warn('unknown-chord');
    }
    return result;
  }

  return {analyze, intervalLabel, noteName};
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChordIdentifier;
} else if (typeof nameChord === 'function') {
  // Extend the lesson's public naming entry point while retaining its existing
  // two-argument harmonization behavior and the same underlying theory data.
  nameChord.identify = (midis, options = {}) => ChordIdentifier.analyze(midis, {
    ...options, triads: TRIAD_QUALITY, tetrads: TETRAD_QUALITY, buildScale
  });
}
