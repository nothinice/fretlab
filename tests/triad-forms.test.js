const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('function preparePopovForms');
const end=html.indexOf('function detectChordQuality');
assert.ok(start>=0&&end>start,'Curated chord-form source must be present');

const OPEN_STRINGS_TOP_TO_BOTTOM=[
  {label:'e',pc:4,midi:64},{label:'B',pc:11,midi:59},{label:'G',pc:7,midi:55},
  {label:'D',pc:2,midi:50},{label:'A',pc:9,midi:45},{label:'E',pc:4,midi:40}
];
const api=new Function('OPEN_STRINGS_TOP_TO_BOTTOM','FRET_COUNT',
  `${html.slice(start,end)}\nreturn {POPOV_FORM_LIBRARY};`
)(OPEN_STRINGS_TOP_TO_BOTTOM,15);

const triadSources={maj:['maj7','7'],min:['m7','b7'],dim:['m7b5','b7']};
for(const [triadQuality,[sourceQuality,removedDegree]] of Object.entries(triadSources)){
  for(const triad of api.POPOV_FORM_LIBRARY[triadQuality]){
    const source=api.POPOV_FORM_LIBRARY[sourceQuality].find(form=>form.id===triad.id);
    assert.ok(source,`${triadQuality} ${triad.id} must have a seventh-chord source`);
    const expected=source.positions.filter(position=>position.degree!==removedDegree)
      .map(position=>`${position.stringIdx}:${position.fretOffset}:${position.degree}`);
    assert.deepEqual(triad.positions.map(position=>`${position.stringIdx}:${position.fretOffset}:${position.degree}`),expected);

    if(triad.availability==='blocked-gap')continue;
    const strings=[...new Set(triad.positions.map(position=>position.stringIdx))].sort((a,b)=>a-b);
    for(let stringIdx=strings[0];stringIdx<=strings.at(-1);stringIdx++){
      assert.ok(strings.includes(stringIdx),`${triadQuality} ${triad.id} must not skip a string inside its displayed range`);
    }
  }
}

const blocked=Object.entries(api.POPOV_FORM_LIBRARY)
  .flatMap(([quality,forms])=>forms.filter(form=>form.availability==='blocked-gap').map(form=>`${quality}:${form.id}`));
assert.deepEqual(blocked.sort(),['dim:C','dim:E']);
assert.ok(html.includes("filter(form=>form.availability!=='blocked-gap')"),'Blocked triad forms must be excluded from the selector');

console.log('OK: 15 derived triad forms checked; dim E/C string-gap forms are blocked from the UI');
