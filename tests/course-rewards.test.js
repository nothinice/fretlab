const assert=require('node:assert/strict');
const b=require('../course-block-one.js');
assert.equal(b.resumeLabel({},null),'Начать курс');
assert.equal(b.resumeLabel({}, {step:3,total:9}),'Продолжить урок: шаг 3 из 9');
assert.match(b.resumeLabel({lesson0:{done:true}},null),/^Продолжить: 2\./);
assert(b.ACTIVITIES.every(a=>b.REWARDS[a.id]));
for(let seed=0;seed<100;seed++){
 let n=seed;const rng=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
 assert.deepEqual(b.makeSession('final',rng).parts[0].questions.map(q=>q.delta).sort((a,b)=>a-b),[-2,-1,1,2]);
 const s=b.makeSession('repair',rng);assert(b.submit(s,s.values[s.badIndex]));assert(b.submit(s,b.FRETS[s.badIndex]));assert(b.matchScale(s.values));
}
console.log('OK: start/resume labels, reward coverage, final assessment coverage and corrected repair model');

const completed=Object.fromEntries(b.ACTIVITIES.map(a=>[a.id,{done:true}]));
assert.match(b.resumeLabel(completed,null),/^Дальше: Блок 2/);
assert.match(b.resumeLabel(completed,{step:2,total:9}),/^Дальше: Блок 2/);
