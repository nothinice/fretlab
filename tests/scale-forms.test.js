const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const scaleStart=html.indexOf('function prepareScaleForms');
const scaleEnd=html.indexOf('// ---------- Playable Shape (arpeggio mode) ----------');
const popovStart=html.indexOf('function preparePopovForms');
const popovEnd=html.indexOf('function detectChordQuality');
const theoryStart=html.indexOf('function parseToken');
const theoryEnd=html.indexOf('// Detects degrees that collapse');
assert.ok(scaleStart>=0&&scaleEnd>scaleStart,'Curated scale-form source must be present');
assert.ok(popovStart>=0&&popovEnd>popovStart,'Curated Popov source must be present');
assert.ok(theoryStart>=0&&theoryEnd>theoryStart,'Formula spelling source must be present');

const OPEN_STRINGS_TOP_TO_BOTTOM=[
  {label:'e',pc:4,midi:64},{label:'B',pc:11,midi:59},{label:'G',pc:7,midi:55},
  {label:'D',pc:2,midi:50},{label:'A',pc:9,midi:45},{label:'E',pc:4,midi:40}
];
const FRET_COUNT=16;
const source=html.slice(scaleStart,scaleEnd)+'\n'+html.slice(popovStart,popovEnd);
const api=new Function('OPEN_STRINGS_TOP_TO_BOTTOM','FRET_COUNT',
  `${source}\nreturn {SCALE_FORM_LIBRARY,SCALE_FORMULA_LIBRARY,SCALE_CHORD_FORM_RELATIONSHIPS,`+
  `SCALE_DEGREE_SEMITONES,realizeScaleForm,POPOV_FORM_LIBRARY};`
)(OPEN_STRINGS_TOP_TO_BOTTOM,FRET_COUNT);
const buildScale=new Function('LETTERS','NATURAL_PC','DEGREE_NATURAL','ACC_SYMBOL',
  `${html.slice(theoryStart,theoryEnd)}\nreturn buildScale;`
)(['C','D','E','F','G','A','B'],{C:0,D:2,E:4,F:5,G:7,A:9,B:11},{1:0,2:2,3:4,4:5,5:7,6:9,7:11},{'-2':'bb','-1':'b','0':'','1':'#','2':'##'});

assert.deepEqual(Object.keys(api.SCALE_FORM_LIBRARY).sort(),['dorian','locrian','lydian','major','mixolydian','naturalMinor','phrygian']);
assert.deepEqual(api.SCALE_FORM_LIBRARY.major.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.SCALE_FORM_LIBRARY.naturalMinor.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.SCALE_FORM_LIBRARY.dorian.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.SCALE_FORM_LIBRARY.mixolydian.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.SCALE_FORM_LIBRARY.lydian.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.SCALE_FORM_LIBRARY.phrygian.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.SCALE_FORM_LIBRARY.locrian.map(form=>form.id),['E','D','C','A','G']);
assert.equal(api.SCALE_FORMULA_LIBRARY['0,2,4,5,7,9,11'],'major');
assert.equal(api.SCALE_FORMULA_LIBRARY['0,2,3,5,7,8,10'],'naturalMinor');
assert.equal(api.SCALE_FORMULA_LIBRARY['0,2,3,5,7,9,10'],'dorian');
assert.equal(api.SCALE_FORMULA_LIBRARY['0,2,4,5,7,9,10'],'mixolydian');
assert.equal(api.SCALE_FORMULA_LIBRARY['0,2,4,6,7,9,11'],'lydian');
assert.equal(api.SCALE_FORMULA_LIBRARY['0,1,3,5,7,8,10'],'phrygian');
assert.equal(api.SCALE_FORMULA_LIBRARY['0,1,3,5,6,8,10'],'locrian');
assert.equal(api.SCALE_DEGREE_SEMITONES['#4'],6);

// Fixed C-root fixtures are independent of the realization algorithm and
// protect every transcribed source point, repetition, and degree label.
const expectedC={
  major:{
    E:['0:7:7','0:8:1','0:10:2','1:8:5','1:10:6','2:7:2','2:9:3','2:10:4','3:7:6','3:9:7','3:10:1','4:7:3','4:8:4','4:10:5','5:8:1','5:10:2'],
    D:['0:10:2','0:12:3','0:13:4','1:10:6','1:12:7','1:13:1','2:9:3','2:10:4','2:12:5','3:9:7','3:10:1','3:12:2','4:8:4','4:10:5','4:12:6','5:8:1','5:10:2','5:12:3'],
    C:['0:0:3','0:1:4','0:3:5','1:0:7','1:1:1','1:3:2','2:0:5','2:2:6','3:0:2','3:2:3','3:3:4','4:3:1'],
    A:['0:3:5','0:5:6','0:7:7','1:3:2','1:5:3','1:6:4','2:2:6','2:4:7','2:5:1','3:2:3','3:3:4','3:5:5','4:3:1','4:5:2'],
    G:['0:5:6','0:7:7','0:8:1','1:5:3','1:6:4','1:8:5','2:4:7','2:5:1','2:7:2','3:3:4','3:5:5','3:7:6','4:3:1','4:5:2','4:7:3','4:8:4','5:8:1']
  },
  naturalMinor:{
    E:['0:8:1','0:10:2','0:11:b3','1:8:5','1:9:b6','1:11:b7','2:7:2','2:8:b3','2:10:4','3:8:b7','3:10:1','4:8:4','4:10:5','4:11:b6','5:8:1','5:10:2','5:11:b3'],
    D:['0:10:2','0:11:b3','0:13:4','1:11:b7','1:13:1','2:10:4','2:12:5','2:13:b6','3:10:1','3:12:2','3:13:b3'],
    C:['0:1:4','0:3:5','0:4:b6','1:1:1','1:3:2','1:4:b3','2:0:5','2:1:b6','2:3:b7','3:0:2','3:1:b3','3:3:4','4:3:1'],
    A:['0:3:5','0:4:b6','0:6:b7','1:3:2','1:4:b3','1:6:4','2:3:b7','2:5:1','3:3:4','3:5:5','3:6:b6','4:3:1','4:5:2','4:6:b3'],
    G:['0:6:b7','0:8:1','1:6:4','1:8:5','1:9:b6','2:5:1','2:7:2','2:8:b3','3:5:5','3:6:b6','3:8:b7','4:5:2','4:6:b3','4:8:4','5:8:1']
  },
  dorian:{
    E:['0:8:1','0:10:2','0:11:b3','1:8:5','1:10:6','1:11:b7','2:7:2','2:8:b3','2:10:4','3:8:b7','3:10:1','4:8:4','4:10:5','4:12:6','5:8:1','5:10:2','5:11:b3'],
    D:['0:10:2','0:11:b3','0:13:4','1:11:b7','1:13:1','2:10:4','2:12:5','2:14:6','3:10:1','3:12:2','3:13:b3'],
    C:['0:1:4','0:3:5','0:5:6','1:1:1','1:3:2','1:4:b3','2:0:5','2:2:6','2:3:b7','3:0:2','3:1:b3','3:3:4','4:3:1'],
    A:['0:3:5','0:5:6','0:6:b7','1:3:2','1:4:b3','1:6:4','2:3:b7','2:5:1','3:3:4','3:5:5','3:7:6','4:3:1','4:5:2','4:6:b3'],
    G:['0:6:b7','0:8:1','1:6:4','1:8:5','1:10:6','2:5:1','2:7:2','2:8:b3','3:5:5','3:7:6','3:8:b7','4:5:2','4:6:b3','4:8:4','5:8:1']
  },
  mixolydian:{
    E:['0:6:b7','0:8:1','0:10:2','1:8:5','1:10:6','2:7:2','2:9:3','2:10:4','3:7:6','3:8:b7','3:10:1','4:7:3','4:8:4','4:10:5','5:8:1','5:10:2'],
    D:['0:10:2','0:12:3','0:13:4','1:10:6','1:11:b7','1:13:1','2:9:3','2:10:4','2:12:5','3:8:b7','3:10:1','3:12:2','4:8:4','4:10:5','4:12:6','5:8:1','5:10:2','5:12:3'],
    C:['0:12:3','0:13:4','0:15:5','1:11:b7','1:13:1','1:15:2','2:12:5','2:14:6','3:12:2','3:14:3','3:15:4','4:15:1'],
    A:['0:3:5','0:5:6','0:6:b7','1:3:2','1:5:3','1:6:4','2:2:6','2:3:b7','2:5:1','3:2:3','3:3:4','3:5:5','4:3:1','4:5:2'],
    G:['0:5:6','0:6:b7','0:8:1','1:5:3','1:6:4','1:8:5','2:3:b7','2:5:1','2:7:2','3:3:4','3:5:5','3:7:6','4:3:1','4:5:2','4:7:3','4:8:4','5:8:1']
  },
  lydian:{
    E:['0:7:7','0:8:1','0:10:2','1:8:5','1:10:6','2:7:2','2:9:3','2:11:#4','3:7:6','3:9:7','3:10:1','4:7:3','4:9:#4','4:10:5','5:8:1','5:10:2'],
    D:['0:10:2','0:12:3','0:14:#4','1:10:6','1:12:7','1:13:1','2:9:3','2:11:#4','2:12:5','3:9:7','3:10:1','3:12:2','4:9:#4','4:10:5','4:12:6','5:8:1','5:10:2','5:12:3'],
    C:['0:0:3','0:2:#4','0:3:5','1:0:7','1:1:1','1:3:2','2:0:5','2:2:6','3:0:2','3:2:3','3:4:#4','4:3:1'],
    A:['0:3:5','0:5:6','0:7:7','1:3:2','1:5:3','1:7:#4','2:2:6','2:4:7','2:5:1','3:2:3','3:4:#4','3:5:5','4:3:1','4:5:2'],
    G:['0:5:6','0:7:7','0:8:1','1:5:3','1:7:#4','1:8:5','2:4:7','2:5:1','2:7:2','3:4:#4','3:5:5','3:7:6','4:3:1','4:5:2','4:7:3','4:9:#4','5:8:1']
  }
};

const expectedDegrees={
  major:new Set(['1','2','3','4','5','6','7']),
  naturalMinor:new Set(['1','2','b3','4','5','b6','b7']),
  dorian:new Set(['1','2','b3','4','5','6','b7']),
  mixolydian:new Set(['1','2','3','4','5','6','b7']),
  lydian:new Set(['1','2','3','#4','5','6','7']),
  phrygian:new Set(['1','b2','b3','4','5','b6','b7']),
  locrian:new Set(['1','b2','b3','4','b5','b6','b7'])
};

// Source-transcribed and guitar-reviewed parent forms retain exact C-root fixtures.
for(const [scaleId,fixtures] of Object.entries(expectedC)){
  const forms=api.SCALE_FORM_LIBRARY[scaleId];
  for(const form of forms){
    const c=api.realizeScaleForm(0,scaleId,form.id,FRET_COUNT);
    assert.equal(c.complete,true,`C ${scaleId} ${form.id} should fit`);
    assert.deepEqual(c.positions.map(p=>`${p.stringIdx}:${p.fret}:${p.degree}`),fixtures[form.id]);
    assert.equal(form.reviewStatus,'verified');
    assert.equal(form.provenance,['dorian','mixolydian','lydian'].includes(scaleId)?'derived-candidate':'source-transcription');
  }
}

for(const [scaleId,forms] of Object.entries(api.SCALE_FORM_LIBRARY)){
  for(const form of forms){
    const actualDegrees=new Set(form.positions.map(position=>position.degree));
    assert.deepEqual(actualDegrees,expectedDegrees[scaleId],`${scaleId} ${form.id} must contain exactly the expected degrees`);
  }
}

function assertDegreeMutations({scaleId,parentScaleId,mutationMap,reviewStatus}){
 for(const candidateForm of api.SCALE_FORM_LIBRARY[scaleId]){
  const parent=api.SCALE_FORM_LIBRARY[parentScaleId].find(form=>form.id===candidateForm.id);
  assert.ok(parent,`${scaleId} ${candidateForm.id} parent must exist`);
  assert.equal(candidateForm.parentScaleId,parentScaleId);
  assert.equal(candidateForm.provenance,'derived-candidate');
  assert.equal(candidateForm.reviewStatus,reviewStatus);
  assert.deepEqual(candidateForm.mutationMap,mutationMap);
  assert.equal(candidateForm.anchorStringIdx,parent.anchorStringIdx,`${scaleId} ${candidateForm.id} must preserve its anchor`);
  assert.equal(candidateForm.positions.length,parent.positions.length,`${scaleId} ${candidateForm.id} must preserve point count`);
  parent.positions.forEach((sourcePoint,index)=>{
    const candidate=candidateForm.positions[index];
    const correction=(candidateForm.corrections||[]).find(entry=>entry.sourceIndex===index);
    const mutation=mutationMap.find(entry=>entry.fromDegree===sourcePoint.degree);
    if(mutation){
      assert.equal(candidate.degree,mutation.toDegree,`${scaleId} ${candidateForm.id} point ${index} must change ${mutation.fromDegree} to ${mutation.toDegree}`);
      if(correction){
        assert.equal(correction.kind,'unison-relocation');
        assert.equal(correction.degree,mutation.toDegree);
        assert.equal(correction.fromStringIdx,sourcePoint.stringIdx);
        assert.equal(correction.fromFretOffset,sourcePoint.fretOffset+mutation.fretDelta);
        assert.equal(candidate.stringIdx,correction.toStringIdx);
        assert.equal(candidate.fretOffset,correction.toFretOffset);
        const fromMidi=OPEN_STRINGS_TOP_TO_BOTTOM[correction.fromStringIdx].midi+correction.fromFretOffset;
        const toMidi=OPEN_STRINGS_TOP_TO_BOTTOM[correction.toStringIdx].midi+correction.toFretOffset;
        assert.equal(toMidi,fromMidi,`${scaleId} ${candidateForm.id} correction ${index} must preserve exact pitch`);
      }else{
        assert.equal(candidate.stringIdx,sourcePoint.stringIdx,`${scaleId} ${candidateForm.id} point ${index} must stay on its string`);
        assert.equal(candidate.fretOffset,sourcePoint.fretOffset+mutation.fretDelta,`${scaleId} ${candidateForm.id} point ${index} must move exactly ${mutation.fretDelta} fret`);
      }
    }else{
      assert.equal(correction,undefined,`${scaleId} ${candidateForm.id} point ${index} must not correct an unaffected degree`);
      assert.equal(candidate.stringIdx,sourcePoint.stringIdx,`${scaleId} ${candidateForm.id} point ${index} must stay on its string`);
      assert.equal(candidate.degree,sourcePoint.degree,`${scaleId} ${candidateForm.id} point ${index} degree must stay unchanged`);
      assert.equal(candidate.fretOffset,sourcePoint.fretOffset,`${scaleId} ${candidateForm.id} point ${index} fret must stay unchanged`);
    }
  });
  const coordinates=candidateForm.positions.map(point=>`${point.stringIdx}:${point.fretOffset}`);
  assert.equal(new Set(coordinates).size,coordinates.length,`${scaleId} ${candidateForm.id} must not contain collisions`);
 }
}

assertDegreeMutations({scaleId:'dorian',parentScaleId:'naturalMinor',mutationMap:[{fromDegree:'b6',toDegree:'6',fretDelta:1}],reviewStatus:'verified'});
assertDegreeMutations({scaleId:'mixolydian',parentScaleId:'major',mutationMap:[{fromDegree:'7',toDegree:'b7',fretDelta:-1}],reviewStatus:'verified'});
assertDegreeMutations({scaleId:'lydian',parentScaleId:'major',mutationMap:[{fromDegree:'4',toDegree:'#4',fretDelta:1}],reviewStatus:'verified'});
assertDegreeMutations({scaleId:'phrygian',parentScaleId:'naturalMinor',mutationMap:[{fromDegree:'2',toDegree:'b2',fretDelta:-1}],reviewStatus:'pending'});
assertDegreeMutations({scaleId:'locrian',parentScaleId:'naturalMinor',mutationMap:[{fromDegree:'2',toDegree:'b2',fretDelta:-1},{fromDegree:'5',toDegree:'b5',fretDelta:-1}],reviewStatus:'pending'});
const phrygianECorrections=api.SCALE_FORM_LIBRARY.phrygian.find(form=>form.id==='E').corrections;
assert.equal(phrygianECorrections.length,1,'Phrygian E must declare exactly one hands-on relocation');
assert.equal(phrygianECorrections[0].reason,'hands-on-continuity');
const phrygianACorrections=api.SCALE_FORM_LIBRARY.phrygian.find(form=>form.id==='A').corrections;
assert.equal(phrygianACorrections.length,1,'Phrygian A must declare exactly one hands-on relocation');
assert.equal(phrygianACorrections[0].reason,'hands-on-continuity');
assert.ok(api.SCALE_FORM_LIBRARY.phrygian.filter(form=>!['E','A'].includes(form.id)).every(form=>!form.corrections),'No other Phrygian form may inherit the E/A-form corrections');

const cLydian=buildScale(0,'C','1 2 3 #4 5 6 7');
assert.equal(cLydian.find(note=>note.degreeLabel==='#4').noteName,'F#','C Lydian must spell its characteristic tone as F#, not Gb');
for(const [pc,letter] of [[0,'C'],[1,'C'],[1,'D'],[2,'D'],[3,'D'],[3,'E'],[4,'E'],[5,'F'],[6,'F'],[6,'G'],[7,'G'],[8,'G'],[8,'A'],[9,'A'],[10,'A'],[10,'B'],[11,'B']]){
  const scale=buildScale(pc,letter,'1 2 3 #4 5 6 7');
  const raisedFourth=scale.find(note=>note.degreeLabel==='#4');
  assert.equal((raisedFourth.pc-pc+12)%12,6,`${letter} Lydian #4 must be six semitones above its tonic`);
  assert.equal(raisedFourth.noteName[0],['C','D','E','F','G','A','B'][(['C','D','E','F','G','A','B'].indexOf(letter)+3)%7],`${letter} Lydian #4 must retain fourth-degree letter spelling`);
}
const cPhrygian=buildScale(0,'C','1 b2 b3 4 5 b6 b7');
assert.equal(cPhrygian.find(note=>note.degreeLabel==='b2').noteName,'Db','C Phrygian must spell its characteristic tone as Db, not C#');
for(const [pc,letter] of [[0,'C'],[1,'C'],[1,'D'],[2,'D'],[3,'D'],[3,'E'],[4,'E'],[5,'F'],[6,'F'],[6,'G'],[7,'G'],[8,'G'],[8,'A'],[9,'A'],[10,'A'],[10,'B'],[11,'B']]){
  const scale=buildScale(pc,letter,'1 b2 b3 4 5 b6 b7');
  const flatSecond=scale.find(note=>note.degreeLabel==='b2');
  assert.equal((flatSecond.pc-pc+12)%12,1,`${letter} Phrygian b2 must be one semitone above its tonic`);
  assert.equal(flatSecond.noteName[0],['C','D','E','F','G','A','B'][(['C','D','E','F','G','A','B'].indexOf(letter)+1)%7],`${letter} Phrygian b2 must retain second-degree letter spelling`);
}
const cLocrian=buildScale(0,'C','1 b2 b3 4 b5 b6 b7');
assert.equal(cLocrian.find(note=>note.degreeLabel==='b2').noteName,'Db','C Locrian must spell b2 as Db, not C#');
assert.equal(cLocrian.find(note=>note.degreeLabel==='b5').noteName,'Gb','C Locrian must spell b5 as Gb, not F#');

let totalComplete=0;
const completeByScale={};
for(const [scaleId,forms] of Object.entries(api.SCALE_FORM_LIBRARY)){
  let complete=0;
  for(let rootPc=0;rootPc<12;rootPc++){
    for(const form of forms){
      const result=api.realizeScaleForm(rootPc,scaleId,form.id,FRET_COUNT);
      if(!result.complete){
        assert.equal(result.reason,'outside');
        continue;
      }
      complete++;
      totalComplete++;
      assert.ok(result.positions.every(p=>p.fret>=0&&p.fret<=FRET_COUNT));
      assert.ok(result.playbackMidi.length>0,`${scaleId} ${form.id} must provide a playback route`);
      assert.equal(result.playbackMidi[0]%12,rootPc,`${scaleId} ${form.id} playback must begin on the tonic`);
      assert.equal(new Set(result.playbackMidi).size,result.playbackMidi.length,`${scaleId} ${form.id} playback route must not repeat pitches`);
      for(let i=1;i<result.playbackMidi.length;i++){
        assert.ok(result.playbackMidi[i]>result.playbackMidi[i-1],`${scaleId} ${form.id} playback route must ascend`);
      }
      result.positions.forEach(position=>{
        const expected=(rootPc+api.SCALE_DEGREE_SEMITONES[position.degree])%12;
        assert.equal(position.midi%12,expected,`${scaleId} ${form.id} ${position.degree} must transpose correctly`);
        assert.equal(position.order,result.playbackMidi.indexOf(position.midi)+1,`${scaleId} ${form.id} display order must match playback`);
      });
    }
  }
  completeByScale[scaleId]=complete;
}

function isLiteralSubset(scaleForm,chordForm){
  if(scaleForm.anchorStringIdx!==chordForm.anchorStringIdx)return false;
  const scalePoints=new Set(scaleForm.positions.map(position=>`${position.stringIdx}:${position.fretOffset}`));
  return chordForm.positions.every(position=>scalePoints.has(`${position.stringIdx}:${position.fretOffset}`));
}

for(const relationship of api.SCALE_CHORD_FORM_RELATIONSHIPS){
  const scaleForm=api.SCALE_FORM_LIBRARY[relationship.scaleId].find(form=>form.id===relationship.formId);
  const chordForm=api.POPOV_FORM_LIBRARY[relationship.chordQuality].find(form=>form.id===relationship.formId);
  assert.ok(scaleForm&&chordForm,`Relationship targets must exist: ${JSON.stringify(relationship)}`);
  const subset=isLiteralSubset(scaleForm,chordForm);
  assert.ok(['verified','pending','mismatch'].includes(relationship.status),'Relationship status must be explicit');
  if(relationship.status==='mismatch'){
    assert.equal(subset,false,`${relationship.scaleId} ${relationship.formId} ${relationship.chordQuality} mismatch must match geometry`);
  }else{
    assert.equal(subset,true,`${relationship.scaleId} ${relationship.formId} ${relationship.chordQuality} ${relationship.status} status must match geometry`);
  }
}

assert.deepEqual(completeByScale,{major:60,naturalMinor:60,dorian:60,mixolydian:60,lydian:58,phrygian:60,locrian:60});
assert.equal(totalComplete,418);
const majorG=api.realizeScaleForm(0,'major','G',FRET_COUNT);
assert.equal(majorG.positions.length,17,'Major G must preserve all 17 source positions');
assert.equal(majorG.playbackMidi.length,15,'Major G must provide the 15 distinct ascending source pitches');
assert.equal(majorG.playbackMidi[0]%12,0,'Major G playback must begin on the tonic, not below it');
assert.equal(api.realizeScaleForm(9,'major','A',15).complete,false,'A-major A form must expose the old 15-fret boundary failure');
assert.equal(api.realizeScaleForm(9,'major','A',16).complete,true,'A-major A form must fit on the 16-fret board');
assert.ok(/key:'scaleShape',\s*label:'Формы гаммы'/.test(html),'Curated scale-form mode must be visible in the UI');
assert.ok(/key:'arpeggioShape',\s*label:'Арпеджио'/.test(html),'Arpeggio mode must be directly visible in the primary navigation');
assert.ok(html.includes('1. Выберите трезвучие'),'Arpeggio mode must explain its first step');
assert.ok(html.includes('2. Выберите форму:'),'Arpeggio mode must explain its second step');
assert.ok(html.includes('Открыть натуральный минор'),'Unsupported scales must offer a direct path to a curated scale');
assert.ok(html.includes('Открыть дорийский'),'Unsupported scales must offer a direct path to the Dorian pilot');
assert.ok(html.includes('Открыть миксолидийский'),'Unsupported scales must offer a direct path to the Mixolydian pilot');
assert.ok(html.includes('Открыть лидийский'),'Unsupported scales must offer a direct path to the Lydian pilot');
assert.ok(html.includes('Открыть фригийский'),'Unsupported scales must offer a direct path to the Phrygian pilot');
assert.ok(html.includes('Открыть локрийский'),'Unsupported scales must offer a direct path to the Locrian candidates');
assert.ok(html.includes('Производные формы фригийского лада; ожидают проверки на гитаре.'),'Phrygian candidates must not be presented as verified');
assert.ok(html.includes('Производные формы локрийского лада; ожидают проверки на гитаре.'),'Locrian candidates must not be presented as verified');
assert.equal(api.realizeScaleForm(3,'lydian','D',FRET_COUNT).reason,'outside','D Lydian D form must expose its reviewed 16-fret boundary');
assert.equal(api.realizeScaleForm(8,'lydian','G',FRET_COUNT).reason,'outside','G# Lydian G form must expose its reviewed 16-fret boundary');
assert.ok(html.includes('p.dataset.preferredToken=activeToken'),'Degree pills must preserve #4 spelling from the active formula');
assert.ok(html.includes('btn.disabled=!realization.complete'),'Unavailable form buttons must be disabled before selection');
assert.ok(!html.includes("{key:'octaveShape', label:'Октавная аппликатура'}"),'Legacy octave-shape option must be removed from the UI');
assert.ok(!html.includes("{key:'playableRun', label:'Игровой маршрут'}"),'Legacy playable-run option must be removed from the UI');
assert.equal(api.SCALE_CHORD_FORM_RELATIONSHIPS.length,70);
console.log(`OK: ${totalComplete} curated scale form/root realizations and 70 scale/chord relationships validated`);
