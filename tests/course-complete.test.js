/* Complete-course contracts: musical coordinates, real validation and common audio time. */
const assert=require('node:assert/strict');
const audio=require('../course-rhythm-player.js');

const twelveBars=Array.from({length:96},()=>({midi:57,beats:.5}));
const bluesRoots=[45,45,45,45,50,50,45,45,52,50,45,52];
const progression=bluesRoots.map((root,i)=>({atBeat:i*4,beats:4,notes:[root,root+4,root+7,root+10],label:['A7','D7','E7'][[45,50,52].indexOf(root)]}));
for(const tempo of [40,80,120]){
  const plan=audio.schedule(twelveBars,{tempo,countIn:true,metronome:true,progression});
  assert.equal(plan.length,48);assert.equal(plan.duration,52*60/tempo);
  const chords=plan.items.filter(e=>e.kind==='backing');
  assert.equal(chords.length,48);
  for(let bar=0;bar<12;bar++){
    const voices=chords.filter(e=>e.chordIndex===bar);
    assert.equal(voices.length,4);
    assert(voices.every(e=>e.at===(4+bar*4)*60/tempo));
    assert(voices.every(e=>e.duration===4*60/tempo));
    assert.deepEqual(voices.map(e=>e.midi),progression[bar].notes);
  }
  assert.equal(plan.items.filter(e=>e.kind==='click').length,52);
  assert.equal(plan.items.filter(e=>e.kind==='melody').length,96);
}
assert.equal(audio.schedule(Array.from({length:128},()=>({midi:null,beats:.5}))).length,64);
assert.throws(()=>audio.schedule(Array.from({length:129},()=>({midi:null,beats:.5}))),/фраза/i);
const fourBars=Array.from({length:4},()=>({midi:60,beats:4}));
for(const segments of [
  [{atBeat:-1,beats:4,notes:[60]}],
  [{atBeat:0,beats:0,notes:[60]}],
  [{atBeat:0,beats:17,notes:[60]}],
  [{atBeat:0,beats:4,notes:[128]}],
  [{atBeat:0,beats:4,notes:[]}],
  [{atBeat:0,beats:4,notes:[60]}, {atBeat:3,beats:4,notes:[62]}],
  [{atBeat:8,beats:4,notes:[62]}, {atBeat:0,beats:4,notes:[60]}],
  [{atBeat:NaN,beats:4,notes:[60]}]
])assert.throws(()=>audio.schedule(fourBars,{progression:segments}),/сегмент|последовательность/);
assert.throws(()=>audio.schedule(fourBars,{progression,accompaniment:{notes:[60]}}));

// One clock governs melody, harmony, count-in, labels and cancellation of future voices.
let current=10,scheduled=[],frames=[],paint=[],ended=[];
const transport=audio.createTransport({
  context:()=>({get currentTime(){return current;}}),
  note:(...args)=>{const v={args,stopped:false,stop(){this.stopped=true;}};scheduled.push(v);return v;},
  tap:()=>({stop(){}}),request:fn=>(frames.push(fn),frames.length),cancel:()=>{}
});
transport.play(fourBars,{tempo:120,countIn:true,progression:[{atBeat:0,beats:4,notes:[48,52,55],label:'C'},{atBeat:8,beats:8,notes:[53,57,60],label:'F'}],onframe:f=>paint.push(f),onend:ok=>ended.push(ok)});
assert(transport.playing);assert(scheduled.every(v=>v.args[1]>=12.08));
current=12.09;frames.at(-1)();assert.equal(paint.at(-1).chordIndex,0);assert.equal(paint.at(-1).chordLabel,'C');
current=14.6;frames.at(-1)();assert.equal(paint.at(-1).chordIndex,-1);
current=16.09;frames.at(-1)();assert.equal(paint.at(-1).chordIndex,1);assert.equal(paint.at(-1).chordLabel,'F');
transport.stop();assert(scheduled.every(v=>v.stopped));assert(!transport.playing);assert.deepEqual(ended,[false]);
console.log('OK: 12-bar harmony, 128-event limit, precise segment timing/labels, input rejection and cancellation');

const C=require('../course-complete-content.js');
const engine=require('../course-complete.js');
const OPEN={1:64,2:59,3:55,4:50,5:45,6:40};
const point=(str,fret)=>({str,fret,midi:OPEN[str]+fret,key:`${str}/${fret}`});
const triad=[point(5,3),point(4,2),point(3,0)];
assert.equal(engine.validateSelection({targetKeys:['5/3','4/2','3/0']},triad),'');
assert.notEqual(engine.validateSelection({targetKeys:['5/3','4/2','3/0']},triad.slice(1)),'');
assert.notEqual(engine.validateSelection({targetKeys:['5/3','4/2','3/0']},[...triad,point(2,1)]),'');
assert.equal(engine.validateSelection({targetPcs:[0,4,7],onePerString:true},[...triad,point(2,1)]),'');
assert.notEqual(engine.validateSelection({targetPcs:[0,4,7],onePerString:true},[point(5,3),point(5,7),point(5,10)]),'');
assert.notEqual(engine.validateSelection({targetPcs:[0,4,7]},[...triad,point(2,3)]),'');

const phraseStep={bars:2,allowedMidi:[48,50,52,53,55,57,59,60],endPcs:[0,4,7]};
const phrase=[{midi:48,beats:2},{midi:50,beats:1},{midi:52,beats:1},{midi:55,beats:2},{midi:null,beats:2}];
assert.equal(engine.validatePhrase(phraseStep,phrase),'');
assert.notEqual(engine.validatePhrase(phraseStep,phrase.slice(1)),'');
assert.notEqual(engine.validatePhrase(phraseStep,phrase.map(e=>({...e,midi:e.midi===55?57:e.midi}))),'');
assert.notEqual(engine.validatePhrase(phraseStep,phrase.map(e=>({...e,midi:e.midi===48?49:e.midi}))),'');
const landingStep={...phraseStep,landings:[{atBeat:4,pcs:[0,4,7]},{atBeat:8,pcs:[5,9,0]}],endPcs:[5,9,0]};
const changingPhrase=[{midi:48,beats:2},{midi:52,beats:2},{midi:55,beats:2},{midi:57,beats:2}];
assert.equal(engine.validatePhrase(landingStep,changingPhrase),'');
assert.notEqual(engine.validatePhrase(landingStep,changingPhrase.map((e,i)=>i===1?{...e,midi:50}:e)),'');
// A rest does not erase the preceding sounding arrival.
assert.equal(engine.validatePhrase(landingStep,[{midi:48,beats:2},{midi:52,beats:1},{midi:null,beats:1},{midi:53,beats:2},{midi:57,beats:1},{midi:null,beats:1}]),'');
// A common C begun in the first bar and held across the boundary sounds in both segments.
assert.equal(engine.validatePhrase(landingStep,[{midi:48,beats:2},{midi:52,beats:1},{midi:48,beats:2},{midi:null,beats:1},{midi:null,beats:2}]),'');
// A whole silent second segment is different from a sounding note tied across its start.
assert.notEqual(engine.validatePhrase(landingStep,[{midi:48,beats:2},{midi:52,beats:2},{midi:null,beats:4}]),'');

const close=[60,64,67,71];
assert.deepEqual(engine.drop2(close),[55,60,64,71]);
assert.deepEqual(close,[60,64,67,71]);
assert.deepEqual(engine.drop2([64,67,71,72]),[59,64,67,72]);
assert.equal(engine.reviewDue({completedAt:1000},1000+3*86400000-1),false);
assert.equal(engine.reviewDue({completedAt:1000},1000+3*86400000),true);
assert.equal(engine.reviewDue({completedAt:1000,reviewedAt:2000},1000+10*86400000),false);

assert.equal(C.modules.length,6);
const selection=C.modules[0].steps.find(s=>s.type==='select');
const composition=C.modules[0].steps.find(s=>s.type==='compose');
const restored=engine.cleanState({version:1,module:'unknown',index:{'3':-5,'4':999},
  records:{'3':{completedAt:1000,reviewedAt:500},unknown:{completedAt:1000}},
  done:{[selection.id]:true,unknown:true},
  sessions:{[selection.id]:{selected:['5/3','5/3','0/1','1/99','password'],attempts:-1},
            [composition.id]:{events:[{midi:composition.allowedMidi[0],beats:1}],checked:true}}
});
assert.equal(restored.module,C.modules[0].id);
assert.equal(restored.index['3'],0);assert.equal(restored.index['4'],C.modules[1].steps.length-1);
assert.deepEqual(restored.sessions[selection.id].selected,['5/3']);
assert.equal(restored.sessions[selection.id].attempts,undefined);
assert.equal(restored.records['3'].reviewedAt,undefined);
assert.equal(restored.records.unknown,undefined);assert.equal(restored.done.unknown,undefined);
assert.equal(restored.sessions[composition.id].events.length,1); // Retain incomplete work; validation still rejects it.
assert.notEqual(engine.validatePhrase(composition,restored.sessions[composition.id].events),'');
const ids=new Set();
for(const module of C.modules){
  assert(module.title&&module.steps.length>=5,module.id);
  for(const step of module.steps){
    assert(!ids.has(step.id),`Duplicate step ${step.id}`);ids.add(step.id);
    assert(step.title&&step.text&&step.instruction,step.id);
    if(step.type==='choice'){assert(Array.isArray(step.answers));assert(Number.isInteger(step.correct)&&step.correct>=0&&step.correct<step.answers.length);}
    for(const p of step.points||[]){assert.equal(OPEN[p.str]+p.fret,p.midi,step.id);assert.equal(p.key,`${p.str}/${p.fret}`,step.id);}
    if(step.audio?.events)audio.schedule(step.audio.events,{progression:step.audio.progression||[]});
    if(step.type==='voicing'&&step.voices&&step.targetVoices)assert.deepEqual(engine.drop2(step.voices),step.targetVoices);
    if(step.type==='transition'){
      assert.equal(step.onePerString,true);
      const target=(step.targetKeys||step.target).map(k=>point(...k.split('/').map(Number)));
      assert.equal(engine.validateSelection(step,target),'');
      assert.notEqual(engine.validateSelection(step,step.fromPoints),'');
      const common=step.fromPoints.filter(p=>target.some(q=>q.key===p.key));
      assert(common.some(p=>p.key==='2/1'&&p.midi===60),'Keep the common C4');
      const fromPcs=[...new Set(step.fromPoints.map(p=>p.midi%12))].sort((a,b)=>a-b);
      const targetPcs=[...new Set(target.map(p=>p.midi%12))].sort((a,b)=>a-b);
      assert(fromPcs.join(',')==='0,4,7'||fromPcs.join(',')==='0,5,9');
      assert(targetPcs.join(',')==='0,4,7'||targetPcs.join(',')==='0,5,9');
      assert.notDeepEqual(fromPcs,targetPcs);
      for(const p of step.fromPoints){assert.equal(OPEN[p.str]+p.fret,p.midi);const q=target.find(q=>q.str===p.str);assert(q);assert(Math.abs(q.midi-p.midi)<=2);}
    }
    if(step.type==='sequence'){
      assert(step.sourceMidi.length&&step.targetMidi.length);
      assert([2,3,4].includes(step.groupSize));
      assert.equal(engine.validateSequence(step,step.targetMidi),'');
      assert.notEqual(engine.validateSequence(step,step.targetMidi.slice(0,-1)),'');
      const wrong=[...step.targetMidi];wrong[0]=step.allowedMidi.find(n=>n!==wrong[0]);
      assert.notEqual(engine.validateSequence(step,wrong),'');
      assert.notEqual(engine.validateSequence(step,[...step.targetMidi,step.allowedMidi[0]]),'');
      assert.notEqual(engine.validateSequence(step,[NaN]),'');
      assert(step.fullSequence.length>=step.targetMidi.length);
      assert(step.fullSequence.every(n=>step.allowedMidi.includes(n)));
      audio.schedule(step.fullSequence.map(midi=>({midi,beats:step.beats})));
    }
  }
}
const sequenceTask=C.modules.flatMap(m=>m.steps).find(d=>d.type==='sequence');
assert(sequenceTask);
const partial=engine.cleanState({version:1,sessions:{[sequenceTask.id]:{sequence:sequenceTask.targetMidi.slice(0,3),checked:true}}});
assert.deepEqual(partial.sessions[sequenceTask.id].sequence,sequenceTask.targetMidi.slice(0,3));
assert.notEqual(engine.validateSequence(sequenceTask,partial.sessions[sequenceTask.id].sequence),'');
const corrupt=engine.cleanState({version:1,sessions:{[sequenceTask.id]:{sequence:[...sequenceTask.targetMidi,999],checked:true}}});
assert.equal(corrupt.sessions[sequenceTask.id].sequence,undefined);
console.log('OK: complete-course selection/phrase contracts, held arrivals, C/F voice leading, sequences, absolute-MIDI Drop 2, review timing and content coordinates');
