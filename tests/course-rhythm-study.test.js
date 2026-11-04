const assert=require('node:assert/strict');
const c=require('../course-block-one.js');
assert.equal(c.RHYTHM_STUDY.length,5);
for(const step of c.RHYTHM_STUDY){
 assert(step.answers[step.correct]);assert(step.practice);
 if(step.pattern){assert.equal(step.pattern.durations.reduce((a,b)=>a+b,0),4);assert(step.pattern.durations.every(x=>x===1||x===.5));}
}
for(const raw of [null,{}, {version:1,step:-1},{version:1,step:6},{version:1,step:'3'},{version:2,step:3},{version:1,step:1.5}])assert.equal(c.cleanRhythmStudy(raw),0);
for(let step=0;step<=5;step++)assert.equal(c.cleanRhythmStudy({version:1,step}),step);
console.log('OK: rhythm study patterns, answer keys and persisted checkpoint validation');
