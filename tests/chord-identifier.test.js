const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const identifier = require('../chord-identifier.js');

// Read the real theory tables: fixtures must not become another chord database.
const html = fs.readFileSync(path.join(__dirname, '..', 'course-lab.html'), 'utf8');
const theory = html.slice(html.indexOf('const LETTERS ='), html.indexOf('// Generalized harmonization')) +
  html.slice(html.indexOf('function parseToken(tok)'), html.indexOf('// Detects degrees that collapse'));
const shared = vm.runInNewContext(theory + '\n({triads:TRIAD_QUALITY,tetrads:TETRAD_QUALITY,nameChord,buildScale})');
const analyze = (notes, options = {}) => identifier.analyze(notes, {...shared, ...options});
const chord = (notes, rootPc, quality) => analyze(notes, {rootPc}).candidates.find(candidate => candidate.quality === quality && !candidate.missing.length);

for (let root = 0; root < 12; root++) {
  for (const [table, type] of [[shared.triads, 'triad'], [shared.tetrads, 'tetrad']]) {
    for (const [key, quality] of Object.entries(table)) {
      const intervals = [0, ...key.split(',').map(Number)];
      const notes = intervals.map(interval => 48 + root + interval);
      const candidate = chord(notes, root, quality);
      assert(candidate, `${identifier.noteName(root)} ${quality} (${type})`);
      assert.equal(candidate.rootPc, root);
      assert.equal(candidate.symbol, identifier.noteName(root) + (quality === 'maj' ? '' : quality));
      assert.deepEqual(candidate.intervals.map(interval => interval.semitones), intervals);

      const inversion = notes.map((note, index) => index ? note : note + 12);
      const inverted = chord(inversion, root, quality);
      assert(inverted, `${root} ${quality}: inversion must retain its quality`);
      assert.equal(inverted.bassPc, (root + intervals[1]) % 12);
      assert(inverted.symbol.endsWith('/' + inverted.intervals.find(interval => interval.pc === inverted.bassPc).note));
      const repeated = chord([...notes, notes[0], notes[1] + 12, notes[2] + 24], root, quality);
      assert.equal(repeated.symbol, candidate.symbol);
      assert.equal(repeated.formula, candidate.formula);
    }
  }
}

assert.equal(chord([64, 67, 72], 0, 'maj').symbol, 'C/E');
assert.equal(analyze([72, 67, 64, 48, 60]).bassMidi, 48, 'bass is minimum MIDI, independent of input/string order');
assert.equal(analyze([72, 67, 64, 48, 60]).bassPc, 0);
assert.equal(analyze([48, 52, 55]).candidates[0].symbol, 'C');
assert.equal(analyze([60, 63, 67], {rootPc: 0}).candidates[0].symbol, 'Cm');
assert.equal(chord([60, 64, 67, 71], 0, 'maj7').symbol, 'Cmaj7');

const sixth = analyze([48, 52, 55, 57]);
assert(sixth.candidates.some(candidate => candidate.symbol === 'C6'));
assert(sixth.candidates.some(candidate => candidate.symbol === 'Am7/C'));
assert(sixth.warnings.includes('ambiguous'));
const minorSixth = analyze([48, 51, 55, 57]);
assert(minorSixth.candidates.some(candidate => candidate.symbol === 'Cm6'));
assert(minorSixth.candidates.some(candidate => candidate.symbol === 'Am7b5/C'));
assert(minorSixth.warnings.includes('ambiguous'));
const diminished = analyze([48, 51, 54, 57]);
assert.equal(diminished.candidates.filter(candidate => candidate.quality === 'dim7').length, 4);
assert.equal(chord([48, 51, 54, 57], 0, 'dim7').formula, '1 b3 b5 bb7');

assert.equal(analyze([48, 55, 60, 67]).candidates[0].symbol, 'C5');
assert.equal(analyze([48, 52]).status, 'unknown', 'a third alone has no automatic full-chord reading');
const incomplete = analyze([48, 52], {rootPc: 0});
assert.equal(incomplete.candidates[0].symbol, 'C(no5)');
assert.deepEqual(incomplete.candidates[0].missing, ['5']);
assert(incomplete.warnings.includes('missing-tones'));
assert.equal(analyze([48, 55], {rootPc: 0}).candidates.length, 1, 'C-G must not invent a third');
assert.equal(chord([48, 50, 55], 0, 'sus2').symbol, 'Csus2');
assert.equal(chord([48, 53, 55], 0, 'sus4').symbol, 'Csus4');
assert.equal(chord([48, 50, 55, 58], 0, '7sus2').symbol, 'C7sus2');
assert.equal(chord([48, 53, 55, 58], 0, '7sus4').symbol, 'C7sus4');

for (let root = 0; root < 12; root++) {
  const examples = [
    [[0, 2, 4, 7], 'add9', '1 9 3 5'],
    [[0, 2, 3, 7], 'madd9', '1 9 b3 5'],
    [[0, 2, 4, 7, 9], '6/9', '1 9 3 5 6'],
    [[0, 2, 4, 7, 10], '9', '1 9 3 5 b7'],
    [[0, 2, 4, 7, 11], 'maj9', '1 9 3 5 7'],
    [[0, 2, 3, 7, 10], 'm9', '1 9 b3 5 b7'],
    [[0, 2, 3, 5, 7, 10], 'm11', '1 9 b3 11 5 b7'],
    [[0, 2, 4, 7, 9, 10], '13', '1 9 3 5 13 b7'],
    [[0, 2, 4, 5, 7, 9, 10], '13', '1 9 3 11 5 13 b7'],
    [[0, 1, 4, 7, 10], '7b9', '1 b9 3 5 b7'],
    [[0, 3, 4, 7, 10], '7#9', '1 #9 3 5 b7'],
    [[0, 4, 6, 7, 10], '7#11', '1 3 #11 5 b7'],
    [[0, 4, 7, 8, 10], '7b13', '1 3 5 b13 b7']
  ];
  for (const [intervals, quality, formula] of examples) {
    const candidate = chord(intervals.map(interval => 36 + root + interval), root, quality);
    assert(candidate, `${root} ${quality}`);
    assert.equal(candidate.formula, formula);
  }
}
assert.equal(analyze([48, 50, 52, 58], {rootPc: 0}).candidates[0].symbol, 'C9(no5)');
const thirteenthShell = analyze([48, 52, 58, 62, 69]);
assert.equal(thirteenthShell.candidates[0].symbol, 'C13(no5)', 'a common shell outranks an altered alternate root');
assert(thirteenthShell.candidates.some(candidate => candidate.symbol === 'A#maj9b5/B#'));
const rootless = analyze([52, 55, 58], {rootPc: 0});
assert.equal(rootless.candidates[0].symbol, 'C7(no1)/E');
assert(rootless.warnings.includes('root-not-played'));
assert(rootless.warnings.includes('missing-tones'));
assert.equal(analyze([52, 55], {rootPc: 0}).status, 'unknown', 'an absent root plus two tones is too little evidence');
assert.equal(analyze([48, 49, 50, 51]).status, 'unknown');
assert.equal(analyze([48, 49, 50, 51], {rootPc: 0}).candidates.length, 0);
assert.equal(analyze(Array.from({length: 12}, (_, index) => 48 + index)).status, 'unknown');

assert.deepEqual(chord([49, 53, 56], 1, 'maj').intervals.map(interval => interval.note), ['C#', 'E#', 'G#']);
assert.equal(chord([53, 56, 61], 1, 'maj').symbol, 'C#/E#');
assert.equal(chord([60, 63, 68], 8, 'maj').symbol, 'G#/B#');
assert.equal(analyze([53, 56, 61], {rootPc: 1, spelling: 'flat'}).candidates[0].symbol, 'Db/F');
assert.deepEqual(analyze([49, 53, 56], {rootPc: 1, spelling: 'flat'}).candidates[0].intervals.map(interval => interval.note), ['Db', 'F', 'Ab']);
assert.deepEqual(analyze([51, 54, 58], {rootPc: 3, spelling: 'flat'}).candidates[0].intervals.map(interval => interval.note), ['Eb', 'Gb', 'Bb']);
assert.deepEqual(analyze([58, 62, 65, 68], {rootPc: 10, spelling: 'flat'}).candidates[0].intervals.map(interval => interval.note), ['Bb', 'D', 'F', 'Ab']);
assert.deepEqual(chord([48, 51, 54, 57], 0, 'dim7').intervals.map(interval => interval.note), ['C', 'Eb', 'Gb', 'Bbb']);
assert.equal(identifier.intervalLabel(8, 'aug'), '#5');
assert.equal(identifier.intervalLabel(6, '7#11'), '#11');
assert.equal(identifier.intervalLabel(9, 'dim7'), 'bb7');
assert.equal(identifier.intervalLabel(2, '7sus2'), '2');
assert.equal(identifier.intervalLabel(2, '6/9'), '9');
assert.equal(identifier.intervalLabel(9, '6/9'), '6');
assert.equal(identifier.intervalLabel(2, 'm6/9'), '9');
assert.equal(identifier.intervalLabel(9, 'm6/9'), '6');

assert.equal(analyze([]).status, 'empty');
assert.equal(analyze([60, 72]).status, 'single');
assert(analyze([60], {rootPc: 5}).warnings.includes('root-not-played'));
assert.deepEqual(analyze([60, 72]).candidates, []);
for (const invalid of [null, undefined, 60, '60', {}, [NaN, Infinity, -1, 128, 60.5, '60', null]]) {
  const result = analyze(invalid);
  assert.equal(result.status, 'empty');
  assert(result.warnings.includes('invalid-midi'));
}
for (const rootPc of [-1, 12, 1.5, '0', NaN]) {
  const result = analyze([48, 52, 55], {rootPc});
  assert.equal(result.status, 'unknown');
  assert.deepEqual(result.candidates, []);
  assert(result.warnings.includes('invalid-root'));
}
assert.equal(analyze([48, 52, 55, NaN, '60']).candidates[0].symbol, 'C');
assert.deepEqual(analyze([0, 4, 7, 127]).notes, [0, 4, 7]);
const input = Object.freeze([48, 52, 55]);
assert.equal(analyze(input).candidates[0].symbol, 'C');
assert.equal(identifier.analyze([48, 52, 55], null).status, 'unknown');

// Substituting a shared quality changes the result; no hidden duplicate table
// may silently preserve an old name or create extensions from the old quality.
const custom = analyze([48, 52, 55], {triads: {...shared.triads, '4,7': 'custom'}});
assert(custom.candidates.some(candidate => candidate.symbol === 'Ccustom'));
assert(!custom.candidates.some(candidate => candidate.symbol === 'C'));
assert(!analyze([48, 50, 52, 55], {triads: {'3,7': 'm'}}).candidates.some(candidate => candidate.quality === 'add9'));
const browser = vm.createContext({});
vm.runInContext(theory, browser);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'chord-identifier.js'), 'utf8'), browser);
assert.equal(vm.runInContext('ChordIdentifier.analyze([48,52,55]).candidates[0].symbol', browser), 'C');
assert.equal(vm.runInContext('nameChord.identify([48,52,55]).candidates[0].symbol', browser), 'C');
assert.equal(vm.runInContext('nameChord.identify([49,53,56],{rootPc:1,spelling:"flat"}).candidates[0].symbol', browser), 'Db');
assert.equal(vm.runInContext('nameChord.identify([48,50,52,55,57],{rootPc:0}).candidates[0].formula', browser), '1 9 3 5 6');
assert.equal(vm.runInContext('nameChord({noteName:"C",semitone:0},[{noteName:"E",semitone:4},{noteName:"G",semitone:7}])', browser), 'Cmaj');
assert.equal(shared.nameChord.identify, undefined, 'CommonJS analysis must not mutate the supplied naming function');

console.log('OK: shared chord tables, 12 roots, inversions, duplicates, bass, ambiguity, extensions, omissions, spelling and invalid input');
