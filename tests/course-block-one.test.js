const assert=require('node:assert/strict');
const b=require('../course-block-one.js');
assert.equal(b.ACTIVITIES.length,10);
assert(b.matchFormula([2,2,1,2,2,2,1]));
assert(!b.matchFormula([2,1,2,2,2,2,1])); // same total is insufficient
assert(b.matchScale([15,14,12,10,8,7,5,3]));
assert(!b.matchScale([3,5,7,9,10,12,14,15]));
for(const kind of ['interval','ear']){
  const s=b.makeSession(kind,()=>.37);
  while(!s.done){
    const q=s.questions[s.round];assert(q.start+q.delta>=0&&q.start+q.delta<=16);
    const wrong=kind==='ear'?99:{str:q.str,fret:q.start};
    assert(!b.submit(s,wrong));
    assert(b.submit(s,kind==='ear'?Math.abs(q.delta):{str:q.str,fret:q.start+q.delta}));
  }
  assert.equal(s.firstCorrect,0);assert.equal(s.attempts,s.questions.length*2);
}
for(let i=0;i<100;i++){
  const s=b.makeSession('repair');
  assert.equal(new Set(s.values).size,8);
  assert(!b.matchScale(s.values));
  assert(!b.submit(s,3));
  assert(b.submit(s,s.values[s.badIndex]));assert(s.located&&!s.done);
  assert(b.submit(s,b.FRETS[s.badIndex]));assert(s.done);
}
for(const r of b.RHYTHMS){
  const events=b.rhythmEvents(r);
  assert.equal(events.reduce((n,e)=>n+e.beats,0),4);
  assert.equal(b.rhythmCells(r).length,8);
  assert(events.some(e=>e.midi===null));
}
const phrase=[{midi:48,beats:1},{midi:50,beats:1},{midi:52,beats:1},{midi:null,beats:1},{midi:52,beats:1},{midi:50,beats:1},{midi:48,beats:2}];
assert.equal(b.phraseCheck(phrase),'');
assert.match(b.phraseCheck(phrase.slice(0,-1)),/8 долей/);
assert.match(b.phraseCheck(phrase.map(e=>({...e,midi:48}))),/паузу/);
assert.match(b.phraseCheck(phrase.map((e,i)=>i===6?{...e,midi:52}:e)),/на C/);
assert.match(b.phraseCheck([{midi:99,beats:8}]),/неподдерживаемое/);
const final=b.makeSession('final',()=>.3);assert.equal(final.parts.length,4);assert.equal(final.parts[0].questions.length,4);
assert(!b.submit(final.parts[3],7));assert(b.submit(final.parts[3],12));
assert.deepEqual(b.cleanRecords({version:99,records:{formula:{done:true}}}),{});
assert.deepEqual(b.cleanRecords({version:1,records:{unknown:{done:true},formula:{done:false}}}),{});
const records=b.cleanRecords({version:1,records:{formula:{done:true,assisted:true},final:{done:true,practice:false}}});
assert(records.formula.assisted);assert(!records.final.practice);
assert.deepEqual(b.cleanRecords({version:1,records:{compose:{done:true,phrase}}}).compose.phrase,phrase);
assert(!b.cleanRecords({version:1,records:{compose:{done:true,phrase:[null]}}}).compose.phrase);
console.log('OK: block generation, interval and ear retries, formula, scale, error repair, rhythm durations, composition and record validation');
assert.deepEqual(require('../course-block-one.js').LESSON_FOR_ACTIVITY,{interval:0,formula:1,scale:1,repair:1});
console.log('OK: only activities with relevant explanations have lesson links');
