require('./dom-shim-v2.js');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'redesign-v2.html'), 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
if(!match) throw new Error('redesign-v2.html must contain one inline script');
if(!html.includes('@keyframes noteSwapIn')) throw new Error('Explore note transitions are missing');
if(!html.includes('keepBoardInPlace')) throw new Error('Explore board position compensation is missing');

// The legacy Explore UI has its own DOM-heavy initializer. The redesign test
// exercises the Learn layer against the real engine without booting that UI.
const appCode = match[1].replace('\ninit();\n', '\n');

function renderedNotes(board){
  const notes=[];
  for(let stringIdx=0; stringIdx<6; stringIdx++){
    for(let fret=0; fret<=16; fret++){
      const cellIndex = 19 + stringIdx*18 + fret;
      const cell = board.children[cellIndex];
      const note = (cell?.children || []).find(child=>child._classes?.has('note'));
      if(note) notes.push({stringIdx,fret,note});
    }
  }
  return notes;
}
function coordKey(p){ return `${p.stringIdx}:${p.fret}`; }
function assert(condition, message){ if(!condition) throw new Error(message); }
function assertSameCoords(actual, expected, label){
  const a=actual.map(coordKey).sort();
  const e=expected.map(coordKey).sort();
  assert(JSON.stringify(a)===JSON.stringify(e), `${label}: rendered coordinates differ\nactual=${a}\nexpected=${e}`);
}

const checks = `
const board=document.getElementById('learnBoard');
const formIds=['E','D','C','A','G'];
let directViews=0;
let togetherViews=0;

for(const mode of V2_MODE_LIST){
  const quality=V2_MODE_CHORD_QUALITY[mode.id];
  for(const formId of formIds){
    v2State={root:findRootIndex('C'),mode:mode.id,form:formId,content:'scale',display:'degrees'};
    renderLearn();
    const scale=realizeScaleForm(0,mode.id,formId,FRET_COUNT);
    assertSameCoords(renderedNotes(board),scale.positions,mode.id+' '+formId+' scale');
    assert(JSON.stringify(v2PlaybackMidi)===JSON.stringify(scale.playbackMidi),mode.id+' '+formId+' scale playback differs');

    for(const [contentId,qualityId] of [['triad',quality.triad],['seventh',quality.seventh]]){
      v2State={root:findRootIndex('C'),mode:mode.id,form:formId,content:contentId,display:'degrees'};
      renderLearn();
      const chord=realizePopovForm(0,qualityId,formId,FRET_COUNT);
      assertSameCoords(renderedNotes(board),chord.path,mode.id+' '+formId+' '+contentId);
      assert(JSON.stringify(v2PlaybackMidi)===JSON.stringify(chord.path.map(p=>p.midi)),mode.id+' '+formId+' '+contentId+' playback differs');
      directViews++;
    }

    v2State={root:findRootIndex('C'),mode:mode.id,form:formId,content:'together',display:'degrees'};
    renderLearn();
    assertSameCoords(renderedNotes(board),scale.positions,mode.id+' '+formId+' together scale');
    const seventhRel=v2FindRelationship(mode.id,formId,quality.seventh);
    const triadRel=v2FindRelationship(mode.id,formId,quality.triad);
    const chosen=seventhRel?.status==='verified'?quality.seventh:(triadRel?.status==='verified'?quality.triad:null);
    const highlighted=renderedNotes(board).filter(p=>p.note._classes.has('chord-tone'));
    if(chosen){
      const chord=realizePopovForm(0,chosen,formId,FRET_COUNT);
      const aligned=v2AlignChordPathToScale(chord.path,scale.positions);
      assert(aligned,mode.id+' '+formId+' verified relationship must align by octave');
      assertSameCoords(highlighted,aligned,mode.id+' '+formId+' together chord');
    }else{
      assert(highlighted.length===0,mode.id+' '+formId+' mismatch must not highlight invented chord coordinates');
    }
    togetherViews++;
  }
}

for(const id of ['learnExplain','learnHintBanner','learnLegend']){
  const el=document.getElementById(id);
  assert(!/verified|pending|mismatch/i.test((el.innerHTML||'')+(el.textContent||'')),id+' leaks internal status');
}
renderExploreDegreeTable([
  {degreeLabel:'1',noteName:'C',semitone:0},
  {degreeLabel:'2',noteName:'D',semitone:2},
  {degreeLabel:'b3',noteName:'Eb',semitone:3}
],false);
const degreeRows=document.getElementById('exploreDegreeTableBody').children;
assert(degreeRows.length===2,'Explore degree table must contain degree and note rows');
assert(degreeRows[0].children.map(cell=>cell.textContent).join('|')==='Ступень|1|2|b3','Explore degree row is wrong');
assert(degreeRows[1].children.map(cell=>cell.textContent).join('|')==='Нота|C|D|Eb','Explore note row is wrong');
console.log('OK: '+directViews+' direct chord views and '+togetherViews+' combined views validated');
`;

try { eval(appCode + checks); }
catch(error){
  console.error(error.stack || error.message);
  process.exitCode=1;
}
