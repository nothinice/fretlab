const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const sandbox = require('../course-sandbox.js');
assert.equal(sandbox.pitch(47).label, 'B2'); // fifth string, second fret
assert.equal(sandbox.pitch(48).label, 'C3'); // fifth string, third fret
assert.equal(sandbox.interval(60,61,'sharp').title, 'увеличенная прима');
assert.equal(sandbox.interval(60,61,'flat').title, 'малая секунда');
assert.equal(sandbox.interval(60,66,'sharp').title, 'увеличенная кварта');
assert.equal(sandbox.interval(60,66,'flat').title, 'уменьшённая квинта');
assert.equal(sandbox.interval(60,64).title, 'большая терция');
assert.equal(sandbox.interval(64,60).direction, 'вниз');
assert.equal(sandbox.interval(64,64).title, 'чистая прима');
assert.equal(sandbox.interval(60,72).title, 'чистая октава');
assert.equal(sandbox.interval(60,84).degree, 15);

// Exercise real fretboard rendering and click handlers with the project's DOM harness.
require('./dom-shim-v2.js');
for (const id of ['tab-sandbox','panel-sandbox','sandboxBoard','sandboxReadout','sandboxAction','sandboxSpelling','sandboxHelp','sandboxClear','sandboxSequence','sandboxTogether']) {
  const node = document.createElement('div'); node.id = id; byId[id] = node;
}
for (const section of ['sandbox','learn','explore']) byId['tab-'+section].setAttribute('aria-controls','panel-'+section);
const html = fs.readFileSync(path.join(__dirname,'../course-lab.html'),'utf8');
const core = html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('\ninit();\n','\n');
vm.runInThisContext(core + '\nplayMidi = midi => global.played.push(midi); playSequence = list => global.played.push(...list);', {filename:'course-core.js'});
global.played = [];
global.v2RenderBoard = vm.runInThisContext('v2RenderBoard');
global.FRET_COUNT = vm.runInThisContext('FRET_COUNT');
global.OPEN_STRINGS_TOP_TO_BOTTOM = vm.runInThisContext('OPEN_STRINGS_TOP_TO_BOTTOM');
global.playMidi = midi => played.push(midi);
global.playSequence = list => played.push(...list);
global.getAudioCtx = () => ({currentTime:0});
sandbox.boot();
const hits = () => byId.sandboxBoard.querySelectorAll('.sandbox-hit');
const dots = () => byId.sandboxBoard.querySelectorAll('.note');
const hit = (stringIdx,fret) => hits()[stringIdx * (FRET_COUNT+1) + fret].dispatch('click');
assert.equal(hits().length, 6*(FRET_COUNT+1));
assert.equal(dots().length, 0);
hit(4,2); assert.equal(played.at(-1),47); assert.equal(dots()[0].textContent,'B');
hit(4,2); assert.equal(dots().length,0);
hit(4,3); assert.equal(dots()[0].textContent,'C');
byId.sandboxAction.dispatch('change',{target:{value:'measure'}});
hit(4,3); hit(4,4);
assert.match(byId.sandboxReadout.textContent,/увеличенная прима, 1 полутонов/);
byId.sandboxSpelling.dispatch('change',{target:{value:'flat'}});
assert.match(byId.sandboxReadout.textContent,/малая секунда/);
byId.sandboxTogether.dispatch('click');
assert.deepEqual(played.slice(-2),[48,49]);
hit(0,0); assert.equal(dots().length,1); // third click begins a fresh pair
byId.sandboxAction.dispatch('change',{target:{value:'listen'}});
const before=dots().length; hit(1,5); assert.equal(played.at(-1),64); assert.equal(dots().length,before);
byId.sandboxAction.dispatch('change',{target:{value:'mark'}});
assert.equal(dots().length,1); // original C mark survives mode switches
byId.sandboxClear.dispatch('click'); assert.equal(dots().length,0);
assert.equal(byId.sandboxSequence.disabled,true);
byId['tab-explore'].dispatch('click');
assert.equal(byId['panel-explore'].classList.contains('v2-active'),true);
byId['tab-sandbox'].dispatch('click');
assert.equal(byId['panel-sandbox'].classList.contains('v2-active'),true);
console.log('OK: interval spelling, pitch accuracy, all fret targets, editing, listening, pairs, playback and tabs');
