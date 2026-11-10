const assert=require('node:assert/strict');
const c=require('../course-block-two-content.js');
const b=require('../course-block-two.js');
const audio=require('../course-rhythm-player.js');
require('./course-sandbox.test.js'); // Real shared fretboard and nameChord implementation.

assert.deepEqual(c.POSITION.map(p=>p.midi),[48,50,52,53,55,57,59,60]);
assert.deepEqual(c.POSITION.map(p=>p.finger),[2,4,1,2,4,1,3,4]);
assert.deepEqual(c.POSITION.map(p=>p.midi),c.LINE.map(p=>p.midi));
const form=realizeScaleForm(0,'major','E',16);
for(const p of c.POSITION)assert(form.positions.some(n=>n.stringIdx===p.str-1&&n.fret===p.fret));
for(const part of Object.values(c.parts))for(const d of part){
  if(d.kind==='transfer'){
    assert.equal(d.from.midi,d.target.midi,d.id);
    assert.equal(Math.abs(d.from.str-d.target.str),1,d.id);
    assert.equal(Math.abs(d.from.fret-d.target.fret),[d.from.str,d.target.str].sort().join(',')==='2,3'?4:5,d.id);
  }
  for(const p of d.points||[])assert.equal(c.OPEN[p.str]+p.fret,p.midi);
}
assert.deepEqual(c.B.filter(d=>d.id.startsWith('b-move-g')).map(d=>[d.from.key,d.target.key]),[['5/10','4/5'],['4/5','3/0']]);

assert(b.chordResult(c.LOW,0,'maj',nameChord).valid);
assert.equal(b.chordResult(c.OPEN_C,0,'maj',nameChord).name,'Cmaj');
assert.equal(nameChord({semitone:0,noteName:'C'},[4,7,12,16,19].map(n=>({semitone:n,noteName:'x'}))),'Cmaj');
assert.equal(b.chordResult([c.point(5,3),c.point(4,1),c.point(3,0)],0,'min',nameChord).name,'Cm');
assert(!b.chordResult(c.LOW,0,'min').valid);
assert(!b.chordResult([c.point(6,8),c.point(5,7),c.point(5,10)],0).valid); // Same-string notes cannot form a playable voicing.
assert.equal(b.chordResult([c.point(6,3),c.point(5,2),c.point(4,0),c.point(1,3)],7,'maj',nameChord).name,'Gmaj');
assert.deepEqual(b.chordResult([c.point(5,3),c.point(3,0)],0).missing,[4]);
assert.deepEqual(b.chordResult([...c.LOW,c.point(2,3)],0).extra,[2]);

const phrase=[{midi:48,beats:2},{midi:50,beats:1},{midi:52,beats:1},{midi:55,beats:2},{midi:null,beats:2}];
assert.equal(b.phraseCheck(phrase),'');
assert.match(b.phraseCheck([{midi:50,beats:4}]),/длительности/);
assert.match(b.phraseCheck(phrase.map(e=>({...e,midi:e.midi===55?50:e.midi}))),/Завершите/);
assert.match(b.phraseCheck(phrase.slice(1)),/8 долей/);
let state=b.clean({version:1,part:'b',index:{a:999,b:-1},sessions:{'b-compose':{events:phrase,selected:['5/3','5/3','6/99','token'],heard:true,earTried:true},'a-pack':{round:-3}},done:{'a-pack':true,bogus:true},completedAt:{a:1000},reviewedAt:{}});
assert.equal(state.index.a,c.A.length-1);assert.equal(state.index.b,0);
assert.deepEqual(state.sessions['b-compose'].events,phrase);
assert.deepEqual(state.sessions['b-compose'].selected,['5/3']);
assert.equal(state.sessions['b-compose'].earTried,true);
assert.equal(state.sessions['a-pack'].round,undefined);
assert.equal(state.done.bogus,undefined);
assert(!b.reviewDue(state,'a',1000+3*b.DAY-1));
assert(b.reviewDue(state,'a',1000+3*b.DAY));
assert(b.reviewDue(state,'a',1000+15*b.DAY));
state.reviewedAt.a=1000+15*b.DAY;assert(!b.reviewDue(state,'a',1000+20*b.DAY));

for(const tempo of [40,80,120])for(const mode of ['repeat','sustain']){
  const plan=audio.schedule(phrase,{tempo,countIn:true,metronome:true,accompaniment:{notes:[48,52,55],mode}});
  const backing=plan.items.filter(e=>e.kind==='backing');
  assert.equal(plan.duration,12*60/tempo);
  assert.equal(backing.length,mode==='repeat'?6:3);
  assert.equal(Math.min(...backing.map(e=>e.at)),4*60/tempo);
  assert.equal(Math.max(...backing.map(e=>e.at+e.duration)),plan.duration);
  assert.equal(plan.items.filter(e=>e.kind==='melody').length,4);
  assert.equal(plan.items.filter(e=>e.kind==='click').length,12);
}
assert.throws(()=>audio.schedule([{midi:NaN,beats:1}]),/Некорректная/);
assert.throws(()=>audio.schedule(phrase,{accompaniment:{notes:[999]}}),/аккорд/);
const ctx={currentTime:10},calls=[],frames=[],canceled=[],finished=[];
const transport=audio.createTransport({context:()=>ctx,request:fn=>(frames.push(fn),frames.length),cancel:n=>canceled.push(n),note:(...args)=>{const voice={args,stopped:false,stop(){this.stopped=true;}};calls.push(voice);return voice;},tap:()=>({stop(){}})});
transport.play(phrase,{countIn:true,accompaniment:{notes:[48,52,55]},onend:done=>finished.push(done)});
assert(transport.playing);assert.equal(calls.length,10);assert(calls.every(v=>v.args[1]>=14.08));
ctx.currentTime=14.1;frames.shift()();
transport.stop();assert(calls.every(v=>v.stopped));assert.deepEqual(finished,[false]);assert(!transport.playing);assert(canceled.length);
transport.play([{midi:48,beats:1}],{onend:done=>finished.push(done)});
ctx.currentTime=20;frames.at(-1)();assert(!transport.playing);assert.deepEqual(finished,[false,true]);
console.log('OK: block 2 musical coordinates, fingerings, same-pitch transfers, teacher-set chord roots, shared chord naming, saved phrases, review dates, synchronized backing and cancellation');
