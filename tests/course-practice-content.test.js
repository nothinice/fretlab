'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {studies,validateEar,validateVariation} = require('../course-practice-content.js');

const OPEN = {1:64,2:59,3:55,4:50,5:45,6:40};
const DURATIONS = [.5,1,2,4];
const CHORDS = {C:[0,4,7],F:[0,5,9],G7:[2,5,7,11],Am:[0,4,9]};
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

assert.deepEqual(studies.map(study => study.id),['melody','cf','cadence','am']);
assert.deepEqual(studies.map(study => beats(study.events)),[16,32,16,16]);
const cCoordinates=[[6,8,2],[6,10,4],[5,7,1],[5,8,2],[5,10,4],[4,7,1],[4,9,3],[4,10,4]];
const aCoordinates=[[6,5,1],[6,7,3],[6,8,4],[5,5,1],[5,7,3],[5,8,4],[4,5,1],[4,7,3]];
for (const study of studies) {
  assert(study.title && study.subtitle && study.purpose && study.prerequisite);
  assert.equal(study.rootPc,study.id==='am'?9:0);
  assert.deepEqual(study.points.map(p => [p.str,p.fret,p.finger]),study.id==='am'?aCoordinates:cCoordinates);
  assert.deepEqual(study.points.map(p => p.midi),study.id==='am'?[45,47,48,50,52,53,55,57]:[48,50,52,53,55,57,59,60]);
  assert.deepEqual(study.points.map(p => p.degree),[1,2,3,4,5,6,7,1]);
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
assert.equal(vm.runInContext('CoursePracticeContent.studies.length',browserContext),4);
assert.equal(vm.runInContext('CoursePracticeContent.validateEar("melody", [48,50,52])',browserContext),'');
console.log('OK: four original studies, guitar coordinates, rhythm and backing, sequences, three ear rounds per study, constrained variations and browser API');
