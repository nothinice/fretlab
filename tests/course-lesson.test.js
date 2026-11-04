// Reuse the real engine and the course DOM harness initialized by this check.
require('./course-sandbox.test.js');
const assert=require('node:assert/strict');
const lesson=require('../course-lesson.js');
for(const id of ['lessonReturn','lessonStorage','blockRoute','lessonBreadcrumb','lessonAlternative','lessonAlternativeText','lessonNextHelp','lessonRoute','lessonSelect','lessonContinue','lessonFormula','lessonTitle','lessonExplanation','lessonPurpose','lessonInstruction','lessonProgress','lessonPosition','lessonBack','lessonNext','lessonListen','lessonHint','lessonPracticeLabel','lessonPractice','lessonFeedback','lessonBoard','lessonRestart']){
  const node=document.createElement('div');node.id=id;byId[id]=node;
}
lesson.boot();
const click=id=>byId[id].dispatch('click');
const hit=fret=>byId.lessonBoard.querySelectorAll('.sandbox-hit')[fret].dispatch('click');
assert.equal(lesson.steps.length,9);
for(const step of lesson.steps){assert(step.purpose.length>20);assert(step.explanation.length>20);}
assert.equal(byId.lessonPosition.textContent,'Шаг 1 из 9');
click('lessonListen');assert.equal(played.at(-1),48);
click('lessonNext');click('lessonListen');assert.deepEqual(played.slice(-2),[48,49]);
click('lessonNext');assert.equal(byId.lessonNext.disabled,true);
click('lessonNext');assert.equal(byId.lessonPosition.textContent,'Шаг 3 из 9');
hit(5);assert.equal(byId.lessonNext.disabled,true);assert.match(byId.lessonFeedback.textContent,/два лада|один лад/);
click('lessonHint');assert.match(byId.lessonFeedback.textContent,/один переход/);
hit(4);assert.equal(byId.lessonNext.disabled,false);
click('lessonNext');click('lessonListen');assert.deepEqual(played.slice(-5),[48,49,50,48,50]);
click('lessonNext');hit(5);assert.equal(byId.lessonNext.disabled,false);
click('lessonNext');hit(9);assert.equal(byId.lessonNext.disabled,true);hit(5);
click('lessonNext');hit(7);assert.equal(byId.lessonNext.disabled,false);
assert.equal(lesson.answer(lesson.steps[6],4,7),false); // correct fret on wrong string is not an answer
click('lessonNext');assert.equal(byId.lessonNext.disabled,true);
assert.equal(byId.lessonPracticeLabel.hidden,false);
byId.lessonPractice.dispatch('change',{target:{checked:true}});
click('lessonNext');assert.match(byId.lessonFeedback.textContent,/4 из 4/);
assert.match(byId.lessonFeedback.textContent,/Подсказки: 1/);
assert.match(byId.lessonInstruction.textContent,/самооценка/);
assert.equal(byId.lessonNext.disabled,true);
click('lessonRestart');assert.equal(byId.lessonPosition.textContent,'Шаг 1 из 9');
click('lessonNext');click('lessonNext');assert.equal(byId.lessonNext.disabled,true);
assert.equal(byId['tab-block'].getAttribute('aria-controls'),'panel-block');
console.log('OK: lesson progression, explanations, audio pitches, wrong answers, hints, direction, transfer, practice gate and restart');

const content=require('../course-lessons-content.js');
assert.deepEqual(content.offsets,[0,2,4,5,7,9,11,12]);
const major=content.majorLesson();
const position=content.degreeLesson(realizeScaleForm(0,'major','E',FRET_COUNT).positions);
assert.deepEqual(position[2].path.map(n=>n.midi),content.line.map(n=>n.midi));
assert(position[2].path.every(n=>n.fret>=7&&n.fret<=10));
assert.deepEqual(position[2].path.map(n=>n.degree),['1','2','3','4','5','6','7','1']);
assert.throws(()=>content.degreeLesson([]),/MIDI/);
for(const list of [major,position])for(const step of list){
  assert(step.purpose.length>20);assert(step.explanation.length>20);
  for(const n of step.path||[])assert.equal(OPEN_STRINGS_TOP_TO_BOTTOM[n.stringIdx].midi+n.fret,n.midi);
}
byId.lessonSelect.dispatch('change',{target:{value:'1'}});
assert.equal(byId.lessonPosition.textContent,`Шаг 1 из ${major.length}`);
click('lessonNext');click('lessonListen');
assert.deepEqual(played.slice(-8),[48,50,52,53,55,57,59,60]);
click('lessonNext');
for(const fret of [5,7,8,10,12,14,15]){
  assert.equal(byId.lessonNext.disabled,true);
  hit(fret);assert.equal(byId.lessonNext.disabled,false);click('lessonNext');
}
click('lessonListen');assert.deepEqual(played.slice(-15),[48,50,52,53,55,57,59,60,59,57,55,53,52,50,48]);
click('lessonNext');assert.equal(byId.lessonNext.disabled,true);
byId.lessonPractice.dispatch('change',{target:{checked:true}});click('lessonNext');
assert.match(byId.lessonFeedback.textContent,/7 из 7/);
assert.equal(byId.lessonContinue.hidden,false);
byId.lessonSelect.dispatch('change',{target:{value:'2'}});
assert.match(byId.lessonTitle.textContent,/Ступень/);
click('lessonNext');click('lessonListen');assert.deepEqual(played.slice(-2),[48,48]);
click('lessonNext');click('lessonListen');assert.deepEqual(played.slice(-8),[48,50,52,53,55,57,59,60]);
click('lessonNext');
assert.equal(byId.lessonNext.disabled,true);
hit(8);assert.equal(byId.lessonNext.disabled,true);
hit(7);assert.equal(byId.lessonNext.disabled,false);assert.deepEqual(played.slice(-2),[48,52]);
click('lessonNext');hit(10);assert.equal(byId.lessonNext.disabled,false);
click('lessonNext');byId.lessonPractice.dispatch('change',{target:{checked:true}});click('lessonNext');
assert.match(byId.lessonFeedback.textContent,/2 из 2/);assert.equal(byId.lessonContinue.hidden,false);
byId.lessonSelect.dispatch('change',{target:{value:'1'}});
assert.match(byId.lessonFeedback.textContent,/7 из 7/); // switching preserves progress
byId.lessonSelect.dispatch('change',{target:{value:'0'}});
assert.equal(byId.lessonPosition.textContent,'Шаг 3 из 9');
byId.lessonSelect.dispatch('change',{target:{value:'99'}});assert.equal(byId.lessonSelect.value,'0');
console.log('OK: major formula construction, seven answers, octave, identical position pitches, degrees, lesson switching and progress');

// Stored choices are validated; claimed progress cannot bypass an unanswered task.
let saved=lesson.cleanSession({current:8,choices:[[2,4],[4,5],[5,5],[6,7]],hints:[2,99,-1],practiced:true},lesson.steps);
assert.equal(saved.current,8);assert.equal(saved.solved.size,4);assert.deepEqual([...saved.hints],[2]);
saved=lesson.cleanSession({current:8,choices:[[2,5],[4,99],["5",5],null],practiced:"true"},lesson.steps);
assert.equal(saved.current,2);assert.equal(saved.solved.size,0);assert.equal(saved.practiced,false);
assert.equal(lesson.cleanSession({current:-1},lesson.steps).current,0);
console.log('OK: persisted lesson validation and prerequisite gates');
