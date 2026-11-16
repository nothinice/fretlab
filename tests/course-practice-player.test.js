const assert=require('node:assert/strict');
const {test}=require('node:test');
const p=require('../course-practice-player.js');

function harness({state='running',resume}={}){
  let time=0,nextId=0;const timers=new Map(),notes=[],clicks=[],frames=[],stops=[];
  const ctx={state,get currentTime(){return time/1000;},resume:resume||(()=>{ctx.state='running';return Promise.resolve();})};
  const setTimer=(fn,delay)=>{const id=++nextId;timers.set(id,{fn,at:time+delay});return id;};
  function advance(ms){
    const until=time+ms;let count=0;
    while(true){const due=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;
      if(++count>100000)throw Error('Timer backlog');time=due[1].at;timers.delete(due[0]);due[1].fn();}
    time=until;
  }
  function voice(entry){entry.stopCalls=0;entry.stop=()=>{entry.stopCalls++;};return entry;}
  const player=p.createPlayer({context:()=>ctx,setTimer,clearTimer:id=>timers.delete(id),
    note:(midi,when,duration,peak,position,articulation)=>{const v=voice({midi,when,duration,peak,position,articulation});notes.push(v);return v;},
    tap:(when,accent)=>{const v=voice({when,accent});clicks.push(v);return v;},onFrame:f=>frames.push(f),onStop:s=>stops.push(s)});
  return {player,ctx,notes,clicks,frames,stops,timers,advance,jump:ms=>{time+=ms;},tick:()=>{const first=[...timers][0];if(first){timers.delete(first[0]);first[1].fn();}}};
}
const phrase=[{midi:48,beats:1,str:5,fret:3},{midi:50,beats:1,str:4,fret:0},{midi:52,beats:1,str:4,fret:2},{midi:55,beats:1,str:3,fret:0}];
const chord=[{atBeat:0,beats:4,notes:[36,40,43],label:'C'}];
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ≠ ${expected}`);

test('validate exact string/fret pitch instead of inferring a convenient TAB position',()=>{
  assert.equal(p.validateEvents(phrase),'');
  assert.equal(p.validateEvents([{midi:48,beats:1}]),''); // Missing fingering is allowed, not invented.
  assert.match(p.validateEvents([{midi:48,beats:1,str:5,fret:2}]),/Струна/);
  assert.match(p.validateEvents([{midi:48,beats:1,str:6,fret:3}]),/Струна/);
  assert.match(p.validateEvents([{midi:48,beats:1,str:5}]),/Струна/);
  assert.match(p.validateEvents([{midi:48,beats:3}]),/длительности/);
  assert.match(p.validateEvents([{midi:128,beats:1}]),/ноты/);
});

test('selected bars clip notes and backing, preserving original event indices',()=>{
  const events=[{midi:48,beats:2},{midi:50,beats:4},{midi:52,beats:2}];
  const original=JSON.stringify(events),plan=p.sliceRange(events,{fromBar:2,toBar:2,progression:[{atBeat:0,beats:8,notes:[48,52,55,48],label:'C'}]});
  assert.equal(plan.startBeat,4);assert.equal(plan.length,4);
  assert.deepEqual(plan.events.map(e=>[e.index,e.atBeat,e.beats,e.tied]),[[1,0,2,true],[2,2,2,false]]);
  assert.deepEqual(plan.progression.map(c=>[c.atBeat,c.beats,c.notes]),[[0,4,[48,52,55]]]);
  assert.equal(JSON.stringify(events),original);
  assert.throws(()=>p.sliceRange(events,{fromBar:3}),/такты/);
  assert.throws(()=>p.sliceRange(events,{progression:[{atBeat:7,beats:2,notes:[48]}]}),/границы/);
  assert.throws(()=>p.sliceRange(events,{progression:[{atBeat:0,beats:5,notes:[48]},{atBeat:4,beats:4,notes:[55]}]}),/границы/);
});

test('one clock gives four count-in beats, eighth note durations, rests and a natural ending',async()=>{
  const h=harness(),events=[{midi:48,beats:.5},{midi:null,beats:.5},{midi:52,beats:1},{midi:55,beats:2}];
  const plan=await h.player.play(events,{tempo:60,countIn:true,backing:false});
  near(plan.musicStart,4.08);h.advance(8200);
  assert.deepEqual(h.clicks.map(c=>c.when),[.08,1.08,2.08,3.08]);
  assert.deepEqual(h.notes.map(n=>n.midi),[48,52,55]);
  h.notes.forEach((n,i)=>{near(n.when,[4.08,5.08,6.08][i]);near(n.duration,[.5,1,2][i]);assert.equal(n.articulation,'held');});
  assert.deepEqual([...new Set(h.frames.filter(f=>f.countIn).map(f=>f.countIn))],[1,2,3,4]);
  assert.ok(h.frames.some(f=>f.index===-1&&f.bar===1&&f.position>=.5&&f.position<1));
  assert.deepEqual(h.stops,[{finished:true}]);assert.equal(h.player.isPlaying(),false);assert.equal(h.timers.size,0);
});

test('loop boundaries are queued in advance at exact absolute times, with no added count-in',async()=>{
  const h=harness();await h.player.play(phrase,{tempo:120,countIn:false,loop:true,backing:false});
  h.advance(1900); // Next cycle is already scheduled before the first one ends.
  assert.equal(h.notes.length,5);near(h.notes[4].when,2.08);
  h.advance(6200);
  const starts=h.notes.filter(n=>n.midi===48);assert.ok(starts.length>=5);
  starts.forEach((n,i)=>near(n.when,.08+i*2));
  assert.equal(h.clicks.length,0);assert.ok(h.frames.some(f=>f.cycle===3&&f.bar===1));
  assert.equal(h.stops.length,0);h.player.stop();
  assert.deepEqual(h.stops,[{finished:false}]);assert.equal(h.timers.size,0);
});

test('bar range playback and positions retain the complete phrase coordinate system',async()=>{
  const h=harness(),events=[{midi:48,beats:2},{midi:50,beats:4},{midi:52,beats:2}],positions=[{index:0},{index:1},{index:2}];
  await h.player.play(events,{fromBar:2,toBar:2,countIn:false,tempo:60,positions});h.advance(2200);
  assert.deepEqual(h.notes.map(n=>[n.midi,n.position.index]),[[50,1],[52,2]]);
  near(h.notes[0].duration,2);near(h.notes[1].when,2.08);
  assert.ok(h.frames.some(f=>f.index===1&&f.bar===2&&f.beat===1&&f.position>=4));
  assert.ok(h.frames.some(f=>f.index===2&&f.bar===2&&f.beat===3));h.player.stop();
});

test('backing-only loops keep chord timing and stop cancels sounding plus already queued voices',async()=>{
  const h=harness();await h.player.play(phrase,{tempo:120,countIn:false,loop:true,melody:false,progression:chord});h.advance(1900);
  assert.deepEqual(h.notes.map(n=>n.midi),[36,40,43,36,40,43]);
  near(h.notes[0].duration,2);near(h.notes[3].when,2.08);
  assert.ok(h.notes[3].when>h.ctx.currentTime);h.player.stop();
  assert.ok(h.notes.every(n=>n.stopCalls===1));const count=h.notes.length;h.advance(20000);assert.equal(h.notes.length,count);
});

test('sustained loops retain only a bounded voice window and skip stale cycles after a delayed timer',async()=>{
  const h=harness();await h.player.play(phrase,{tempo:120,countIn:false,loop:true,progression:chord});h.advance(600000);
  assert.ok(h.notes.length>2000);h.player.stop();
  const stopped=h.notes.filter(n=>n.stopCalls);assert.ok(stopped.length<=9,`${stopped.length} stale voices retained`);
  const j=harness();await j.player.play(phrase,{tempo:120,countIn:false,loop:true,backing:false});
  j.jump(600000);j.tick();assert.ok(j.notes.length<=3,'Did not allocate a ten-minute backlog');
  assert.equal(j.frames.at(-1).cycle,299);j.player.stop();
});

test('stop during a blocked resume settles the pending play and never starts audio later',async()=>{
  let unblock;const h=harness({state:'suspended',resume:()=>new Promise(resolve=>{unblock=resolve;})});
  const pending=h.player.play(phrase,{countIn:false});await Promise.resolve();h.player.stop();
  assert.equal(await pending,null);assert.equal(h.timers.size,0);assert.equal(h.notes.length,0);
  h.ctx.state='running';unblock();await Promise.resolve();assert.equal(h.notes.length,0);assert.deepEqual(h.stops,[{finished:false}]);
});

test('a cancelled resume cannot clear the next playback timer',async()=>{
  const h=harness({state:'suspended',resume:()=>new Promise(()=>{})});
  const first=h.player.play(phrase,{countIn:false});await Promise.resolve();h.ctx.state='running';
  const second=await h.player.play(phrase,{countIn:false});assert.ok(second);assert.equal(await first,null);
  assert.equal(h.player.isPlaying(),true);assert.equal(h.timers.size,1);h.advance(1200);assert.equal(h.notes.length,2);h.player.stop();
});

test('failed and blocked AudioContext resume report a useful error and clear the transport',async()=>{
  const rejected=harness({state:'suspended',resume:()=>Promise.reject(Error('Audio denied'))});
  await assert.rejects(rejected.player.play(phrase),/Audio denied/);assert.equal(rejected.player.isPlaying(),false);assert.equal(rejected.timers.size,0);
  assert.equal(rejected.stops[0].error,'Audio denied');
  const blocked=harness({state:'suspended',resume:()=>new Promise(()=>{})});const pending=blocked.player.play(phrase);await Promise.resolve();blocked.advance(3000);
  await assert.rejects(pending,/Браузер не запустил звук/);assert.equal(blocked.timers.size,0);assert.equal(blocked.player.isPlaying(),false);
});
