const assert=require('node:assert/strict');
const {test}=require('node:test');
const ideas=require('../sandbox-ideas.js');
const sandbox=require('../course-sandbox.js');
const player=require('../course-practice-player.js');

test('every curated point is the intended pitch on a real standard-tuned string',()=>{
  const open=[64,59,55,50,45,40];
  for(const id of ideas.IDEAS.map(d=>d.id))for(const variant of ['a','b'])for(const ending of [null,53,57]){
    const config=ideas.configuration(id,variant,ending),before=JSON.stringify(config);
    sandbox.normalizeExperiment(config);
    for(const point of config.notes)assert.equal(open[point.str-1]+point.fret,point.midi);
    assert.equal(JSON.stringify(config),before);
    const plan=ideas.audioPlan(id,{variant,ending,compare:true});
    assert.equal(player.validateEvents(plan.events),'');
    const range=player.sliceRange(plan.events,{progression:plan.progression});
    assert.equal(range.length,id==='center'?16:8);
  }
});

test('minor changes only the third by one semitone; C to F keeps C and moves two voices nearby',()=>{
  assert.deepEqual(ideas.LOW_C.map(p=>p.midi),[48,52,55]);
  assert.deepEqual(ideas.LOW_CM.map(p=>p.midi),[48,51,55]);
  assert.deepEqual(ideas.LOW_CM.map((p,i)=>p.fret-ideas.LOW_C[i].fret),[0,-1,0]);
  assert.deepEqual(ideas.TOP_C.map(p=>p.midi),[55,60,64]);
  assert.deepEqual(ideas.TOP_F.map(p=>p.midi),[57,60,65]);
  assert.deepEqual(ideas.TOP_F.map((p,i)=>p.fret-ideas.TOP_C[i].fret),[2,0,1]);
  assert.deepEqual(ideas.TOP_C[1],ideas.TOP_F[1]);
});

test('the exact same melody and rhythm play over C and Am, without a covert note change',()=>{
  const first=ideas.audioPlan('center',{variant:'a'}),second=ideas.audioPlan('center',{variant:'b'}),comparison=ideas.audioPlan('center',{compare:true});
  assert.deepEqual(first.events,second.events);
  assert.deepEqual(first.events.map(e=>e.midi),[48,52,55,57]);
  assert.deepEqual(first.progression[0].notes,[48,52,55]);
  assert.deepEqual(second.progression[0].notes,[45,48,52]);
  assert.deepEqual(comparison.events.slice(0,4),comparison.events.slice(4));
  assert.deepEqual(comparison.progression.map(c=>[c.atBeat,c.beats,c.label]),[[0,8,'C'],[8,8,'Am']]);
});

test('the ascending diatonic sequence arrives over F; the learner chooses a real F-chord tone',()=>{
  for(const ending of [null,53,57]){
    const plan=ideas.audioPlan('sequence',{ending});
    assert.deepEqual(plan.events.slice(0,9).map(e=>e.midi),[48,50,52,50,52,53,52,53,55]);
    assert.equal(plan.events[9].midi,ending);
    assert.equal(plan.events[9].beats,2);
    assert.equal(plan.events.reduce((sum,e)=>sum+e.beats,0),8);
    assert.equal(plan.progression[1].atBeat,4);
    assert.equal(plan.progression[1].label,'F');
    if(ending!==null)assert.ok(plan.progression[1].notes.includes(ending));
  }
});

test('the board API rejects malformed coordinates before changing any state',()=>{
  assert.throws(()=>sandbox.normalizeExperiment({action:'chord',notes:[{str:5,fret:3},{str:5,fret:5}]}),/один звук/);
  for(const point of [{str:0,fret:1},{str:7,fret:0},{str:1,fret:-1},{str:1,fret:17},{str:2,fret:1.5}])assert.throws(()=>sandbox.normalizeExperiment({action:'mark',notes:[point]}),/струну и лад/);
  assert.throws(()=>sandbox.normalizeExperiment({action:'measure',notes:[]}),/состояние/);
  const original={action:'chord',notes:[{str:5,fret:3,midi:999}],root:0,spelling:'flat'},normalized=sandbox.normalizeExperiment(original);
  assert.deepEqual(normalized,{action:'chord',notes:[{str:5,fret:3}],root:'0',spelling:'flat'});
  normalized.notes[0].fret=9;assert.equal(original.notes[0].fret,3);
  assert.throws(()=>ideas.configuration('missing'),/Неизвестный/);
  assert.throws(()=>ideas.audioPlan('missing'),/Неизвестный/);
});
