const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stringsSource = script.match(/const OPEN_STRINGS_TOP_TO_BOTTOM = \[[\s\S]*?\];/)[0];
const logicSource = script.slice(
  script.indexOf('function buildArpeggioRoutes'),
  script.indexOf('function chordIntervalLabel')
);
const load = new Function(`${stringsSource}\n${logicSource}\nreturn {buildArpeggioRoutes,analyzeArpeggioRoutes,selectArpeggioRoute,arpeggioRouteKey,arpeggioRouteFeatures};`);
const api = load();

const qualities = {
  major:[0,4,7], minor:[0,3,7],
  maj7:[0,4,7,11], dominant7:[0,4,7,10], min7:[0,3,7,10],
  halfDiminished:[0,3,6,10], diminished7:[0,3,6,9]
};

function validateRoute(route, expectedLength, octaves){
  assert.equal(route.length, expectedLength);
  const counts = new Map();
  route.forEach((position,index)=>{
    assert.ok(position.fret >= 0 && position.fret <= 15);
    counts.set(position.stringIdx,(counts.get(position.stringIdx)||0)+1);
    if(index){
      assert.ok(position.midi > route[index-1].midi, 'pitch must rise');
      assert.ok(position.stringIdx >= route[index-1].stringIdx, 'strings must not move backward');
      assert.ok(position.stringIdx-route[index-1].stringIdx <= 1, 'strings must not be skipped');
    }
  });
  assert.ok(Math.max(...counts.values()) <= 3, 'maximum three notes per string');
  assert.equal(route.at(-1).midi-route[0].midi, octaves*12);
}

let combinations=0, rawRoutes=0, namedRoutes=0;
const otherCounts=[];
for(const intervals of Object.values(qualities)){
  for(let root=0;root<12;root++){
    const pcs=intervals.map(interval=>(root+interval)%12);
    for(let startString=0;startString<4;startString++){
      for(const octaves of [1,2]){
        combinations++;
        const analysis=api.analyzeArpeggioRoutes(pcs,startString,15,octaves);
        if(!analysis.complete)continue;
        const expectedLength=intervals.length*octaves+1;
        rawRoutes+=analysis.routes.length;
        namedRoutes+=analysis.categories.length;
        otherCounts.push(analysis.others.length);
        const exactKeys=new Set(analysis.routes.map(api.arpeggioRouteKey));
        analysis.routes.forEach(route=>validateRoute(route,expectedLength,octaves));
        analysis.categories.forEach(entry=>{
          validateRoute(entry.path,expectedLength,octaves);
          assert.ok(exactKeys.has(entry.key));
          assert.ok(entry.categories.length >= 1);
        });
        analysis.others.forEach(entry=>{
          validateRoute(entry.path,expectedLength,octaves);
          assert.ok(exactKeys.has(entry.key));
        });
        const mergedKeys=analysis.categories.map(entry=>entry.key);
        assert.equal(new Set(mergedKeys).size,mergedKeys.length,'identical category winners must merge');
        const selected=api.selectArpeggioRoute(analysis,'position',0);
        assert.ok(selected.complete);
        validateRoute(selected.path,expectedLength,octaves);
      }
    }
  }
}

assert.equal(combinations,672);
console.log(JSON.stringify({combinations,rawRoutes,namedRoutes,otherVariants:{min:Math.min(...otherCounts),max:Math.max(...otherCounts),average:Number((otherCounts.reduce((a,b)=>a+b,0)/otherCounts.length).toFixed(1))}},null,2));
console.log('Arpeggio route tests: OK');
