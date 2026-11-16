'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {studies,validateEar,validateVariation} = require('../course-practice-content.js');

const OPEN = {1:64,2:59,3:55,4:50,5:45,6:40};
const DURATIONS = [.5,1,2,4];
const CHORDS = {C:[0,4,7],F:[0,5,9],G7:[2,5,7,11],Am:[0,4,9],A7:[1,4,7,9],D7:[0,2,6,9],E7:[2,4,8,11],Dm:[2,5,9]};
const beats = events => events.reduce((sum,event) => sum+event.beats,0);
const pitchClasses = notes => [...new Set(notes.map(n => n%12))].sort((a,b) => a-b);
const clone = value => JSON.parse(JSON.stringify(value));
const pitches = events => events.map(event => event.midi);
const studyById = Object.fromEntries(studies.map(study => [study.id,study]));

function verifyEvents(study,events) {
  assert(events.length>0);
  for (const event of events) {
    assert(DURATIONS.includes(event.beats),`${study.id}: unsupported duration ${event.beats}`);
    if (event.midi===null) {
      assert.equal(event.str,undefined,'A rest does not claim a guitar string');
      assert.equal(event.fret,undefined,'A rest does not claim a guitar fret');
      continue;
    }
    assert.equal(event.midi,OPEN[event.str]+event.fret,`${study.id}: wrong note at ${event.str}/${event.fret}`);
    assert(event.fret>=study.range[0] && event.fret<=study.range[1]);
    assert(Number.isInteger(event.finger) && event.finger>=1 && event.finger<=4);
    assert(study.points.some(p => p.midi===event.midi && p.str===event.str && p.fret===event.fret && p.finger===event.finger));
  }
}
function verifyProgression(events,progression) {
  let atBeat=0;
  for (const chord of progression) {
    assert.equal(chord.atBeat,atBeat,'Backing must cover the phrase without gaps or overlaps');
    assert.equal(chord.beats,4);
    assert.deepEqual(pitchClasses(chord.notes),CHORDS[chord.label],`Wrong backing chord ${chord.label}`);
    assert(chord.notes.every(n => Number.isInteger(n) && n>=0 && n<=127));
    atBeat+=chord.beats;
  }
  assert.equal(atBeat,beats(events),'Melody and backing durations must match');
}
function withEnding(study,midi) {
  const result=clone(study.variation.sourceEvents);
  const point=study.points.find(p => p.midi===midi);
  result[result.length-1]={midi,beats:1,str:point.str,fret:point.fret,finger:point.finger};
  return result;
}

assert.deepEqual(studies.map(study => study.id),['starter','melody','cf','cadence','am','blues','dorian']);
assert.deepEqual(studies.map(study => beats(study.events)),[16,16,32,16,16,48,16]);
const cCoordinates=[[6,8,2],[6,10,4],[5,7,1],[5,8,2],[5,10,4],[4,7,1],[4,9,3],[4,10,4]];
const aCoordinates=[[6,5,1],[6,7,3],[6,8,4],[5,5,1],[5,7,3],[5,8,4],[4,5,1],[4,7,3]];
const expectations={
  starter:{root:0,coordinates:[[5,3,1],[5,5,1],[5,7,1]],midis:[48,50,52],degrees:[1,2,3]},
  melody:{root:0,coordinates:cCoordinates,midis:[48,50,52,53,55,57,59,60],degrees:[1,2,3,4,5,6,7,1]},
  cf:{root:0,coordinates:cCoordinates,midis:[48,50,52,53,55,57,59,60],degrees:[1,2,3,4,5,6,7,1]},
  cadence:{root:0,coordinates:cCoordinates,midis:[48,50,52,53,55,57,59,60],degrees:[1,2,3,4,5,6,7,1]},
  am:{root:9,coordinates:aCoordinates,midis:[45,47,48,50,52,53,55,57],degrees:[1,2,3,4,5,6,7,1]},
  blues:{root:9,coordinates:[[6,5,1],[6,8,4],[5,5,1],[5,6,2],[5,7,3],[4,5,1],[4,7,3]],midis:[45,48,50,51,52,55,57],degrees:['1','♭3','4','♭5','5','♭7','1']},
  dorian:{root:2,coordinates:[[3,7,1],[3,9,3],[3,10,4],[2,8,2],[2,10,4],[1,7,1],[1,8,2],[1,10,4]],midis:[62,64,65,67,69,71,72,74],degrees:[1,2,3,4,5,6,7,1]}
};
for (const study of studies) {
  assert(study.title && study.subtitle && study.purpose && study.prerequisite);
  const expected=expectations[study.id];
  assert.equal(study.rootPc,expected.root);
  assert.deepEqual(study.points.map(p => [p.str,p.fret,p.finger]),expected.coordinates);
  assert.deepEqual(study.points.map(p => p.midi),expected.midis);
  assert.deepEqual(study.points.map(p => p.degree),expected.degrees);
  assert.equal(new Set(study.points.map(p => p.key)).size,study.points.length);
  for (const p of study.points) {
    assert.equal(p.key,`${p.str}/${p.fret}`);
    assert.equal(p.midi,OPEN[p.str]+p.fret);
    assert(p.label);
  }
  verifyEvents(study,study.events);
  verifyProgression(study.events,study.progression);
  const finalNote=study.events.filter(event => event.midi!==null).at(-1).midi;
  assert(CHORDS[study.progression.at(-1).label].includes(finalNote%12));

  assert.equal(study.sessions.length,3);
  assert.deepEqual(study.sessions.map(s => s.minutes),[30,30,30]);
  for (const session of study.sessions) {
    assert(session.title && session.tasks.length>=4);
    assert(session.tasks.every(task => typeof task==='string' && task.length>25));
    assert.equal(session.tasks.reduce((sum,task) => sum+Number(task.match(/^(\d+) минут:/)[1]),0),session.minutes);
  }
  assert.equal(study.checks.length,3);
  assert(study.tips.length>=2);
  assert.equal(new Set(study.drills.map(d => d.id)).size,study.drills.length);
  for (const drill of study.drills) {
    assert(drill.title && drill.explanation);
    assert.equal(beats(drill.events),8);
    verifyEvents(study,drill.events);
    verifyProgression(drill.events,drill.progression);
  }

  assert.equal(study.ear.rounds.length,3);
  assert.equal(study.ear.events,study.ear.rounds[0].events);
  assert.equal(study.ear.startingMidi,study.ear.rounds[0].startingMidi);
  for (let index=0;index<study.ear.rounds.length;index++) {
    const round=study.ear.rounds[index],answer=pitches(round.events);
    assert(round.instruction && answer.length>=2 && answer.length<=4);
    assert.equal(round.startingMidi,answer[0]);
    verifyEvents(study,round.events);
    assert.equal(validateEar(study,answer,index),'');
    assert.equal(validateEar(study.id,answer,index),'');
    assert(validateEar(study,answer.slice(1),index));
    assert(validateEar(study,[...answer,answer[0]],index));
    assert(validateEar(study,answer.map(n => n+12),index),'Pitch classes alone must not pass an octave-specific task');
    const wrong=[...answer];wrong[1]=answer[1]+1;
    assert(validateEar(study,wrong,index));
    const reordered=[...answer];[reordered[0],reordered[1]]=[reordered[1],reordered[0]];
    assert(validateEar(study,reordered,index));
    const immutable=Object.freeze([...answer]);
    assert.equal(validateEar(study,immutable,index),'');
    assert.deepEqual(answer,pitches(round.events),'Ear validation must not mutate the answer key');
  }

  const variation=study.variation;
  assert.equal(variation.sourceEvents.length,8);
  assert.equal(variation.preserveCount,7);
  assert.equal(beats(variation.sourceEvents),8);
  assert(variation.sourceEvents.every(event => event.beats===1));
  assert(variation.instruction && variation.rubric.length===3);
  verifyEvents(study,variation.sourceEvents);
  verifyProgression(variation.sourceEvents,variation.progression);
  assert(validateVariation(study,variation.sourceEvents),'Unchanged source must not pass a variation task');
  for (const lastMidi of variation.allowedLastMidi) {
    assert(CHORDS[variation.progression.at(-1).label].includes(lastMidi%12));
    const good=withEnding(study,lastMidi),before=clone(good);
    assert.equal(validateVariation(study,good),'');
    assert.equal(validateVariation(study.id,good),'');
    assert.deepEqual(good,before,'Validation must not rewrite a user phrase');
    assert.equal(validateVariation(study,Object.freeze(good.map(Object.freeze))),'');
    assert.equal(validateVariation(study,good.map(({midi,beats}) => ({midi,beats}))),'', 'Pitch-only event submissions are supported');
    const wrongFirst=clone(before);wrongFirst[0]={...before.at(-1)};
    if(wrongFirst[0].midi===variation.sourceEvents[0].midi)wrongFirst[0]={...before[1]};
    assert(validateVariation(study,wrongFirst));
    const wrongRhythm=clone(before);wrongRhythm[2].beats=.5;wrongRhythm[3].beats=1.5;
    assert.equal(beats(wrongRhythm),beats(before));
    assert(validateVariation(study,wrongRhythm),'Matching total duration must not conceal changed rhythm');
    const wrongCoord=clone(before);wrongCoord.at(-1).fret++;
    assert(validateVariation(study,wrongCoord));
    assert(validateVariation(study,before.slice(0,-1)));
    assert(validateVariation(study,[...before,before.at(-1)]));
  }
  const allTonic=variation.sourceEvents.map(() => ({midi:study.points[0].midi,beats:1}));
  assert(validateVariation(study,allTonic),'A repeated tonic must not pass by ending on a chord tone');
  const wrongLast=withEnding(study,study.points.find(p => !variation.allowedLastMidi.includes(p.midi) && p.midi!==variation.sourceEvents.at(-1).midi).midi);
  assert(validateVariation(study,wrongLast));

  // A teacher plays two complete bars; the learner then gets two genuinely silent melody bars.
  const response=study.callResponse;
  assert(response.instruction);
  assert.equal(beats(response.events),16);
  assert.deepEqual(response.events.slice(0,8),variation.sourceEvents);
  assert.notEqual(response.events[0],variation.sourceEvents[0],'The response example owns its copied events');
  assert.deepEqual(response.events.slice(8),[{midi:null,beats:4},{midi:null,beats:4}]);
  verifyEvents(study,response.events);
  verifyProgression(response.events,response.progression);
  assert.deepEqual(response.progression.slice(0,2).map(c=>c.label),response.progression.slice(2).map(c=>c.label),'Both parts use the same harmonic task');

  // Chord attacks match arrows and real guitar voicings rather than a sustained placeholder chord.
  assert(study.rhythmPatterns.length>=2);
  assert.equal(new Set(study.rhythmPatterns.map(p=>p.id)).size,study.rhythmPatterns.length);
  for(const pattern of study.rhythmPatterns){
    assert(pattern.title && pattern.instruction);
    assert.deepEqual(pattern.events,[{midi:null,beats:4},{midi:null,beats:4}]);
    assert(pattern.voicings.length>=1);
    let end=0;
    for(const voicing of pattern.voicings){
      assert.equal(voicing.frets.length,6);
      assert.equal(voicing.fingers.length,6);
      const sounding=[];
      voicing.frets.forEach((fret,index)=>{
        if(fret===null){assert.equal(voicing.fingers[index],null);return;}
        assert(Number.isInteger(fret)&&fret>=0&&fret<=3,'Open-position rhythm forms must remain within frets 0–3');
        assert(Number.isInteger(voicing.fingers[index])&&voicing.fingers[index]>=0&&voicing.fingers[index]<=4);
        assert.equal(voicing.fingers[index]===0,fret===0,'Only open strings have finger 0');
        sounding.push(OPEN[index+1]+fret);
      });
      assert.deepEqual(pitchClasses(sounding),CHORDS[voicing.label]);
    }
    assert.equal(pattern.progression.length,pattern.strokes.length);
    pattern.progression.forEach((chord,index)=>{
      const stroke=pattern.strokes[index],shape=pattern.voicings.find(v=>v.label===chord.label);
      assert(shape);
      assert.equal(stroke.atBeat,chord.atBeat);
      assert(['down','up'].includes(stroke.direction));
      assert.equal(chord.atBeat,end,'Successive attacks must not overlap or leave unintended gaps');
      assert(chord.beats>0&&chord.beats<=1);
      assert.equal(chord.beats,(pattern.strokes[index+1]?.atBeat??8)-stroke.atBeat);
      assert.deepEqual(chord.notes,shape.frets.flatMap((fret,strIndex)=>fret===null?[]:[OPEN[strIndex+1]+fret]));
      assert.deepEqual(pitchClasses(chord.notes),CHORDS[chord.label]);
      end+=chord.beats;
    });
    assert.equal(end,8);
    const firstBar=pattern.strokes.filter(s=>s.atBeat<4).map(s=>[s.atBeat,s.direction]);
    const secondBar=pattern.strokes.filter(s=>s.atBeat>=4).map(s=>[s.atBeat-4,s.direction]);
    assert.deepEqual(firstBar,secondBar);
    assert.deepEqual(firstBar,pattern.id==='eighths'?[[0,'down'],[1,'down'],[1.5,'up'],[2,'down'],[3,'down'],[3.5,'up']]:[[0,'down'],[1,'down'],[2,'down'],[3,'down']]);
  }
  assert.notEqual(study.rhythmPatterns[0].voicings[0].frets,study.rhythmPatterns[1].voicings[0].frets,'Editing one pattern must not rewrite another diagram');
}

// A deliberately narrow, audible transformation: only the last C over F changes.
assert.deepEqual(pitches(studyById.cf.variation.sourceEvents),[48,50,52,55,53,55,57,60]);
assert.deepEqual(studyById.cf.variation.allowedLastMidi,[53,57]);
assert.deepEqual(pitches(studyById.cf.events.slice(0,8)),[48,50,52,55,53,55,57,60]);
assert.deepEqual(studyById.cf.progression.map(c => c.label),['C','F','C','F','C','F','C','C']);
assert.deepEqual(pitches(studyById.cf.drills.find(d => d.id==='nearest').events),[52,53]);
assert.deepEqual(pitches(studyById.cf.drills.find(d => d.id==='common').events),[48,48]);
const sequence=studyById.cf.drills.find(d => d.id==='diatonic');
assert.deepEqual(pitches(sequence.events.slice(0,9)),[48,50,52,50,52,53,52,53,55]);
assert(sequence.events.slice(0,9).every(event => event.beats===.5));
assert.equal(beats(sequence.events.slice(0,8)),4,'Third three-note group must cross into F at the documented point');
assert.equal(sequence.events[9].midi,57,'Sequence resolves to A, the third of F');
assert.deepEqual(pitches(studyById.cadence.drills.find(d => d.id==='leading').events),[59,60]);
assert.deepEqual(pitches(studyById.cadence.drills.find(d => d.id==='seventh').events),[53,52]);

// The final blues task contains a complete fixed 12-bar form and deliberately non-diatonic colour.
assert.deepEqual(studyById.blues.progression.map(c=>c.label),['A7','A7','A7','A7','D7','D7','A7','A7','E7','D7','A7','E7']);
assert.equal(beats(studyById.blues.events),48);
assert(studyById.blues.events.some(e=>e.midi===51),'The blue note E♭ must actually be heard');
assert(studyById.blues.events.some(e=>e.midi===48),'C natural intentionally colours A7, whose chord contains C♯');
assert.equal(studyById.blues.degreeLabel,'Интервалы от A');
assert(studyById.blues.tips.some(t=>t.includes('C♯')));
assert(studyById.starter.points.every(p=>p.str===5&&p.finger===1));
assert(studyById.starter.tips.some(t=>t.includes('перемещая')),'One-string fingering must explicitly require hand movement');
assert(studyById.starter.rhythmPatterns.every(p=>p.instruction.includes('можно пропустить')),'Block 1 does not require an unexplained chord skill');
assert.equal(studyById.dorian.optional,true);
assert.equal(studyById.dorian.points.find(p=>p.label==='B').degree,6);
assert(studyById.dorian.events.some(e=>e.midi===71),'The distinctive natural sixth must be used musically');
assert(studyById.dorian.progression.every(c=>c.label==='Dm'));
assert.deepEqual(studyById.cf.rhythmPatterns[0].voicings.find(v=>v.label==='F').frets,[1,1,2,3,null,null]);

for (const malformed of [null,undefined,{},'48,50,52',[48,'50',52],[48,NaN,52],[48,128,52],[48,-1,52]]) {
  assert(validateEar(studyById.melody,malformed));
}
for (const index of [-1,3,.5,NaN,'0']) assert(validateEar(studyById.melody,[48,50,52],index));
assert(validateEar('missing',[48,50,52]));
assert(validateVariation('missing',[]));
for (const malformed of [null,undefined,{},'wrong',[],[null]]) assert(validateVariation(studyById.cf,malformed));
for (const corrupt of [{midi:null,beats:1},{midi:57,beats:NaN},{midi:69,beats:1},{midi:57,beats:1,str:4},{midi:57,beats:1,str:4,fret:-1}]) {
  const phrase=withEnding(studyById.cf,57);phrase[7]=corrupt;
  assert(validateVariation(studyById.cf,phrase));
}

const browserContext=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../course-practice-content.js'),'utf8'),browserContext);
assert.equal(vm.runInContext('CoursePracticeContent.studies.length',browserContext),7);
assert.equal(vm.runInContext('CoursePracticeContent.validateEar("melody", [48,50,52])',browserContext),'');
console.log('OK: seven original studies, 12-bar blues, one-string starter, compact Dorian, exact fingerings, call/response silence, strumming attacks/voicings, ear/variation contracts and browser API');
