const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('const POPOV_MAJ7_FORMS');
const end=html.indexOf('// Build one exact ascending octave');
assert.ok(start>=0&&end>start,'Curated Popov form source must be present');

const OPEN_STRINGS_TOP_TO_BOTTOM=[
  {label:'e',pc:4,midi:64},{label:'B',pc:11,midi:59},{label:'G',pc:7,midi:55},
  {label:'D',pc:2,midi:50},{label:'A',pc:9,midi:45},{label:'E',pc:4,midi:40}
];
const FRET_COUNT=15;
const source=html.slice(start,end);
const api=new Function('OPEN_STRINGS_TOP_TO_BOTTOM','FRET_COUNT',
  `${source}\nreturn {POPOV_MAJ7_FORMS,realizePopovMaj7Form,CHORD_DEGREE_SEMITONES};`
)(OPEN_STRINGS_TOP_TO_BOTTOM,FRET_COUNT);

assert.deepEqual(api.POPOV_MAJ7_FORMS.map(form=>form.id),['E','D','C','A','G']);

const expectedC={
  E:['5:8:1','4:7:3','4:10:5','3:9:7','3:10:1','2:9:3','1:8:5','0:7:7','0:8:1'],
  D:['5:8:1','5:12:3','4:10:5','3:9:7','3:10:1','2:9:3','2:12:5','1:12:7','1:13:1'],
  C:['4:3:1','3:2:3','2:0:5','1:0:7','1:1:1','0:0:3','0:3:5'],
  A:['4:3:1','3:2:3','3:5:5','2:4:7','2:5:1','1:5:3','0:3:5','0:7:7'],
  G:['5:8:1','4:7:3','3:5:5','2:4:7','2:5:1','2:9:3','1:8:5','0:7:7','0:8:1']
};

for(const form of api.POPOV_MAJ7_FORMS){
  const c=api.realizePopovMaj7Form(0,form.id,FRET_COUNT);
  assert.equal(c.complete,true,`Cmaj7 ${form.id} form should fit`);
  assert.deepEqual(c.path.map(p=>`${p.stringIdx}:${p.fret}:${p.degree}`),expectedC[form.id]);
}

let completeCount=0;
for(let rootPc=0;rootPc<12;rootPc++){
  for(const form of api.POPOV_MAJ7_FORMS){
    const result=api.realizePopovMaj7Form(rootPc,form.id,FRET_COUNT);
    if(!result.complete){
      assert.equal(result.reason,'outside');
      continue;
    }
    completeCount++;
    assert.ok(result.path.every(p=>p.fret>=0&&p.fret<=FRET_COUNT));
    assert.ok(result.path.every((p,i,path)=>i===0||p.midi>path[i-1].midi),'Route must rise strictly in pitch');
    result.path.forEach(position=>{
      const expected=(rootPc+api.CHORD_DEGREE_SEMITONES[position.degree])%12;
      assert.equal(position.midi%12,expected,`${form.id} degree ${position.degree} must transpose correctly`);
    });
  }
}

assert.equal(completeCount,57,'Three form/root combinations should exceed the 0-15 fretboard range');
console.log(`OK: ${completeCount} curated maj7 form/root realizations validated`);
