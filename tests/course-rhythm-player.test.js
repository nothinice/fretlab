const assert=require('node:assert/strict');
const p=require('../course-rhythm-player.js');
const events=[{midi:48,beats:1},{midi:null,beats:1},{midi:48,beats:.5},{midi:48,beats:.5},{midi:48,beats:1}];
assert.deepEqual(p.timeline(events).map(e=>e.offset),[0,1,2,2.5,3]);
for(const bpm of [40,60,100]){
 const beat=60/bpm;
 assert.equal(p.frame(events,-.1,beat,4).waiting,true);
 assert.equal(p.frame(events,3.5*beat,beat,4).countIn,3);
 assert.equal(p.frame(events,4.1*beat,beat,4).index,0);
 assert.equal(p.frame(events,5.5*beat,beat,4).index,-1);
 assert.equal(p.frame(events,6.7*beat,beat,4).index,3);
 assert.equal(p.frame(events,8.1*beat,beat,4).done,true);
}
console.log('OK: one audio clock, exact eighth boundaries, rests, count-in and ending at 40/60/100 BPM');
