// Reuse the real engine and the course DOM harness initialized by this check.
require('./course-sandbox.test.js');
const assert=require('node:assert/strict');
const lesson=require('../course-lesson.js');
for(const id of ['lessonTitle','lessonExplanation','lessonPurpose','lessonInstruction','lessonProgress','lessonPosition','lessonBack','lessonNext','lessonListen','lessonHint','lessonPracticeLabel','lessonPractice','lessonFeedback','lessonBoard','lessonRestart']){
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
hit(5);assert.equal(byId.lessonNext.disabled,true);assert.match(byId.lessonFeedback.textContent,/два? переход|один переход/);
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
assert.match(byId.lessonFeedback.textContent,/Заданий с подсказкой: 1/);
assert.match(byId.lessonInstruction.textContent,/самооценка/);
assert.equal(byId.lessonNext.disabled,true);
click('lessonRestart');assert.equal(byId.lessonPosition.textContent,'Шаг 1 из 9');
click('lessonNext');click('lessonNext');assert.equal(byId.lessonNext.disabled,true);
byId['tab-lesson'].dispatch('click');assert.equal(byId['panel-lesson'].classList.contains('v2-active'),true);
console.log('OK: lesson progression, explanations, audio pitches, wrong answers, hints, direction, transfer, practice gate and restart');
