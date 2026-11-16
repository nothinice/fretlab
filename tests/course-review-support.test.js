'use strict';
const assert=require('node:assert/strict');
const support=require('../course-review-support.js');
const content=require('../course-practice-content.js');
const player=require('../course-practice-player.js');
const OPEN={1:64,2:59,3:55,4:50,5:45,6:40};
const classes=notes=>[...new Set(notes.map(n=>n%12))].sort((a,b)=>a-b);
const expectations=[
  ['C',0,['C','E','G'],[0,4,7],'мажорное'],
  ['Dm',2,['D','F','A'],[0,3,7],'минорное'],
  ['Em',4,['E','G','B'],[0,3,7],'минорное'],
  ['F',5,['F','A','C'],[0,4,7],'мажорное'],
  ['G',7,['G','B','D'],[0,4,7],'мажорное'],
  ['Am',9,['A','C','E'],[0,3,7],'минорное'],
  ['Bdim',11,['B','D','F'],[0,3,6],'уменьшённое']
];
assert.equal(support.chords.length,7);
assert.deepEqual(support.chords.map(c=>c.roman),['I','ii','iii','IV','V','vi','vii°']);
expectations.forEach(([name,root,names,intervals,quality],index)=>{
  const chord=support.chords[index];
  assert.equal(chord.name,name);
  assert.equal(chord.rootPc,root);
  assert.equal(chord.quality,quality);
  assert.deepEqual(chord.notes,names);
  assert.deepEqual(chord.pcs.map(pc=>(pc-root+12)%12),intervals);
  assert.deepEqual(classes(chord.points.map(p=>p.midi)),classes(chord.pcs));
  assert.equal(new Set(chord.points.map(p=>p.str)).size,chord.points.length,'Each voicing must be playable with one note on each used string');
  for(const point of chord.points){
    assert.equal(OPEN[point.str]+point.fret,point.midi);
    assert(point.fret>=0&&point.fret<=5,'Harmony overview must match its visible fret range');
  }
});
assert.deepEqual(support.seventh.pcs,[7,11,2,5]);
assert.deepEqual(support.seventh.notes,['G','B','D','F']);
assert.deepEqual(classes(support.seventh.points.map(p=>p.midi)),[2,5,7,11]);
assert.equal(support.seventh.rootPc,7);
assert.equal(support.seventh.points.length,new Set(support.seventh.points.map(p=>p.str)).size);
support.seventh.points.forEach(p=>assert.equal(p.midi,OPEN[p.str]+p.fret));
assert.equal(support.chords.filter(c=>c.quality==='мажорное').length,3);
assert.equal(support.chords.filter(c=>c.quality==='минорное').length,3);
assert.equal(support.chords.filter(c=>c.quality==='уменьшённое').length,1);

for(const task of support.progressions){
  const plan=support.plan(task.names),snapshot=JSON.stringify(support.chords);
  assert.equal(player.validateEvents(plan.events),'');
  assert.equal(plan.events.reduce((n,e)=>n+e.beats,0),task.names.length*4);
  assert(plan.events.every(e=>e.midi===null));
  assert.deepEqual(plan.progression.map(c=>c.label),task.names);
  assert.doesNotThrow(()=>player.sliceRange(plan.events,{progression:plan.progression}));
  plan.progression[0].notes[0]=127;
  assert.equal(JSON.stringify(support.chords),snapshot,'Playback plans must not alter the source voicing');
}
assert.throws(()=>support.plan(['C','not-a-chord']));
assert(support.progressions.some(p=>p.names.join(',')==='C,Am,F,G'));
assert(support.progressions.some(p=>p.names.join(',')==='Dm,G7,C'));

// New teaching examples use the same transport contract as the live harmony panel.
for(const study of content.studies){
  for(const sequence of [study,study.callResponse,...study.rhythmPatterns]){
    assert.equal(player.validateEvents(sequence.events),'');
    assert.doesNotThrow(()=>player.sliceRange(sequence.events,{progression:sequence.progression}));
  }
}
console.log('OK: seven diatonic triads, G7 spelling and playable voices, progression harmony, immutable playback plans and shared transport compatibility');
