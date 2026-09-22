const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const scaleStart=html.indexOf('function prepareScaleForms');
const scaleEnd=html.indexOf('// ---------- Playable Shape (arpeggio mode) ----------');
const popovStart=html.indexOf('function preparePopovForms');
const popovEnd=html.indexOf('function detectChordQuality');
assert.ok(scaleStart>=0&&scaleEnd>scaleStart,'Curated scale-form source must be present');
assert.ok(popovStart>=0&&popovEnd>popovStart,'Curated Popov source must be present');

const OPEN_STRINGS_TOP_TO_BOTTOM=[
  {label:'e',pc:4,midi:64},{label:'B',pc:11,midi:59},{label:'G',pc:7,midi:55},
  {label:'D',pc:2,midi:50},{label:'A',pc:9,midi:45},{label:'E',pc:4,midi:40}
];
const FRET_COUNT=15;
const source=html.slice(scaleStart,scaleEnd)+'\n'+html.slice(popovStart,popovEnd);
const api=new Function('OPEN_STRINGS_TOP_TO_BOTTOM','FRET_COUNT',
  `${source}\nreturn {SCALE_FORM_LIBRARY,SCALE_FORMULA_LIBRARY,SCALE_CHORD_FORM_RELATIONSHIPS,`+
  `SCALE_DEGREE_SEMITONES,realizeScaleForm,POPOV_FORM_LIBRARY};`
)(OPEN_STRINGS_TOP_TO_BOTTOM,FRET_COUNT);

assert.deepEqual(Object.keys(api.SCALE_FORM_LIBRARY).sort(),['major','naturalMinor']);
assert.deepEqual(api.SCALE_FORM_LIBRARY.major.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.SCALE_FORM_LIBRARY.naturalMinor.map(form=>form.id),['E','D','C','A','G']);
assert.equal(api.SCALE_FORMULA_LIBRARY['0,2,4,5,7,9,11'],'major');
assert.equal(api.SCALE_FORMULA_LIBRARY['0,2,3,5,7,8,10'],'naturalMinor');

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
  }
};

const expectedDegrees={
  major:new Set(['1','2','3','4','5','6','7']),
  naturalMinor:new Set(['1','2','b3','4','5','b6','b7'])
};

for(const [scaleId,forms] of Object.entries(api.SCALE_FORM_LIBRARY)){
  for(const form of forms){
    const c=api.realizeScaleForm(0,scaleId,form.id,FRET_COUNT);
    assert.equal(c.complete,true,`C ${scaleId} ${form.id} should fit`);
    assert.deepEqual(c.positions.map(p=>`${p.stringIdx}:${p.fret}:${p.degree}`),expectedC[scaleId][form.id]);
    const actualDegrees=new Set(form.positions.map(position=>position.degree));
    assert.deepEqual(actualDegrees,expectedDegrees[scaleId],`${scaleId} ${form.id} must contain exactly the expected degrees`);
  }
}

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
  assert.equal(subset,relationship.status==='verified',`${relationship.scaleId} ${relationship.formId} ${relationship.chordQuality} status must match geometry`);
}

assert.deepEqual(completeByScale,{major:57,naturalMinor:60});
assert.equal(totalComplete,117);
const majorG=api.realizeScaleForm(0,'major','G',FRET_COUNT);
assert.ok(majorG.positions.length>majorG.playbackMidi.length,'Major G must preserve both source positions that share one pitch');
assert.ok(/key:'scaleShape',\s*label:'Формы гаммы'/.test(html),'Curated scale-form mode must be visible in the UI');
assert.ok(/key:'arpeggioShape',\s*label:'Арпеджио'/.test(html),'Arpeggio mode must be directly visible in the primary navigation');
assert.ok(html.includes('1. Выберите трезвучие'),'Arpeggio mode must explain its first step');
assert.ok(html.includes('2. Выберите форму:'),'Arpeggio mode must explain its second step');
assert.ok(html.includes('Открыть натуральный минор'),'Unsupported scales must offer a direct path to a curated scale');
assert.ok(!html.includes("{key:'octaveShape', label:'Октавная аппликатура'}"),'Legacy octave-shape option must be removed from the UI');
assert.ok(!html.includes("{key:'playableRun', label:'Игровой маршрут'}"),'Legacy playable-run option must be removed from the UI');
assert.equal(api.SCALE_CHORD_FORM_RELATIONSHIPS.length,20);
console.log(`OK: ${totalComplete} curated scale form/root realizations and 20 scale/chord relationships validated`);
