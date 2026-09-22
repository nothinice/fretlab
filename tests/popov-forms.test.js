const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('function preparePopovForms');
const end=html.indexOf('function detectChordQuality');
assert.ok(start>=0&&end>start,'Curated Popov form source must be present');

const OPEN_STRINGS_TOP_TO_BOTTOM=[
  {label:'e',pc:4,midi:64},{label:'B',pc:11,midi:59},{label:'G',pc:7,midi:55},
  {label:'D',pc:2,midi:50},{label:'A',pc:9,midi:45},{label:'E',pc:4,midi:40}
];
const FRET_COUNT=15;
const source=html.slice(start,end);
const api=new Function('OPEN_STRINGS_TOP_TO_BOTTOM','FRET_COUNT',
  `${source}\nreturn {POPOV_FORM_LIBRARY,realizePopovForm,CHORD_DEGREE_SEMITONES};`
)(OPEN_STRINGS_TOP_TO_BOTTOM,FRET_COUNT);

assert.deepEqual(Object.keys(api.POPOV_FORM_LIBRARY).sort(),['7','dim7','m7','m7b5','maj7']);
assert.deepEqual(api.POPOV_FORM_LIBRARY.maj7.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.POPOV_FORM_LIBRARY['7'].map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.POPOV_FORM_LIBRARY.m7.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.POPOV_FORM_LIBRARY.m7b5.map(form=>form.id),['E','D','C','A','G']);
assert.deepEqual(api.POPOV_FORM_LIBRARY.dim7.map(form=>form.id),['E/G','D','C','A']);

// Fixed C-root transcriptions protect every stored point and degree without
// recomputing the expected geometry through the realization algorithm.
const expectedC={
  maj7:{
    E:['5:8:1','4:7:3','4:10:5','3:9:7','3:10:1','2:9:3','1:8:5','0:7:7','0:8:1'],
    D:['5:8:1','5:12:3','4:10:5','3:9:7','3:10:1','2:9:3','2:12:5','1:12:7','1:13:1'],
    C:['4:3:1','3:2:3','2:0:5','1:0:7','1:1:1','0:0:3','0:3:5'],
    A:['4:3:1','3:2:3','3:5:5','2:4:7','2:5:1','1:5:3','0:3:5','0:7:7'],
    G:['5:8:1','4:7:3','3:5:5','2:4:7','2:5:1','2:9:3','1:8:5','0:7:7','0:8:1']
  },
  '7':{
    E:['5:8:1','4:7:3','4:10:5','3:8:b7','3:10:1','2:9:3','1:8:5','1:11:b7','0:8:1','0:12:3'],
    D:['5:8:1','5:12:3','4:10:5','3:8:b7','3:10:1','2:9:3','2:12:5','1:11:b7','1:13:1','0:12:3'],
    C:['4:3:1','3:2:3','2:0:5','2:3:b7','1:1:1','0:0:3','0:3:5'],
    A:['4:3:1','3:2:3','3:5:5','2:3:b7','2:5:1','1:5:3','0:3:5','0:6:b7'],
    G:['5:8:1','4:7:3','3:5:5','3:8:b7','2:5:1','2:9:3','1:8:5','0:6:b7','0:8:1']
  },
  m7:{
    E:['5:8:1','5:11:b3','4:10:5','3:8:b7','3:10:1','2:8:b3','1:8:5','1:11:b7','0:8:1','0:11:b3'],
    D:['3:10:1','3:13:b3','2:12:5','1:11:b7','1:13:1','0:11:b3','0:15:5'],
    C:['4:15:1','3:13:b3','2:12:5','2:15:b7','1:13:1','0:11:b3','0:15:5'],
    A:['4:3:1','4:6:b3','3:5:5','2:3:b7','2:5:1','1:4:b3','0:3:5','0:6:b7'],
    G:['5:8:1','4:6:b3','3:5:5','3:8:b7','2:5:1','2:8:b3','1:8:5','0:6:b7','0:8:1']
  },
  m7b5:{
    E:['5:8:1','5:11:b3','4:9:b5','3:8:b7','3:10:1','2:8:b3','2:11:b5','1:11:b7','0:8:1','0:11:b3'],
    D:['3:10:1','3:13:b3','2:11:b5','1:11:b7','1:13:1','0:11:b3','0:14:b5'],
    C:['4:3:1','3:1:b3','3:4:b5','2:3:b7','1:1:1','1:4:b3','0:2:b5','0:6:b7'],
    A:['4:3:1','4:6:b3','3:4:b5','2:3:b7','2:5:1','1:4:b3','1:7:b5','0:6:b7'],
    G:['5:8:1','4:6:b3','3:4:b5','3:8:b7','2:5:1','2:8:b3','1:7:b5','0:6:b7','0:8:1']
  },
  dim7:{
    'E/G':['5:8:1','4:6:b3','4:9:b5','3:7:bb7','3:10:1','2:8:b3','1:10:bb7','0:8:1','0:11:b3'],
    D:['3:10:1','3:13:b3','2:11:b5','1:10:bb7','1:13:1','0:11:b3','0:14:b5'],
    C:['4:3:1','3:1:b3','3:4:b5','2:2:bb7','1:1:1','1:4:b3','0:2:b5','0:5:bb7'],
    A:['4:3:1','4:6:b3','3:4:b5','3:7:bb7','2:5:1','1:4:b3','1:7:b5','0:5:bb7','0:8:1']
  }
};

for(const [quality,forms] of Object.entries(api.POPOV_FORM_LIBRARY)){
  for(const form of forms){
    const c=api.realizePopovForm(0,quality,form.id,FRET_COUNT);
    assert.equal(c.complete,true,`C${quality} ${form.id} form should fit`);
    assert.deepEqual(c.path.map(p=>`${p.stringIdx}:${p.fret}:${p.degree}`),expectedC[quality][form.id]);
  }
}

const expectedComplete={maj7:57,'7':58,m7:59,m7b5:59,dim7:46};
let totalComplete=0;
for(const [quality,forms] of Object.entries(api.POPOV_FORM_LIBRARY)){
  let qualityComplete=0;
  for(let rootPc=0;rootPc<12;rootPc++){
    for(const form of forms){
      const result=api.realizePopovForm(rootPc,quality,form.id,FRET_COUNT);
      if(!result.complete){
        assert.equal(result.reason,'outside');
        continue;
      }
      qualityComplete++;
      totalComplete++;
      assert.ok(result.path.every(p=>p.fret>=0&&p.fret<=FRET_COUNT));
      assert.ok(result.path.every((p,i,route)=>i===0||p.midi>route[i-1].midi),'Route must rise strictly in pitch');
      result.path.forEach(position=>{
        const expected=(rootPc+api.CHORD_DEGREE_SEMITONES[position.degree])%12;
        assert.equal(position.midi%12,expected,`${quality} ${form.id} degree ${position.degree} must transpose correctly`);
      });
    }
  }
  assert.equal(qualityComplete,expectedComplete[quality],`${quality} boundary count changed`);
}

assert.equal(totalComplete,279);
console.log(`OK: ${totalComplete} curated Popov form/root realizations validated across five chord qualities`);
