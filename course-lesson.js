/* Original lesson tasks. Source rationale lives in course/lesson-01-method.txt. */
const CourseLesson = (() => {
  const firstSteps = [
    {title:'Как измерять расстояние между звуками',
      explanation:'Чтобы построить гамму, нужно знать, на сколько повышать или понижать каждый следующий звук. Начнём с двух единиц: полутона и тона.\nК концу урока вы сможете находить их вверх и вниз на одной струне от разных ладов. Названия нот заучивать сейчас не нужно.',
      purpose:'В следующем уроке из этих шагов мы соберём мажорную гамму. Здесь учимся пользоваться музыкальной линейкой.',
      instruction:'На грифе выбрана пятая струна, третий лад. Золотая точка — исходный звук. Нажмите на неё и послушайте.', str:4, start:3},
    {title:'Полутон — один шаг на соседний лад',
      explanation:'На одной струне переход на соседний лад повышает или понижает звук на полтона. От третьего лада к четвёртому — один полутон вверх.\nСчитаем переходы: 3 → 4. Исходный лад не считаем первым шагом.',
      purpose:'Эта связь позволяет построить нужное расстояние без готовой аппликатуры.',
      instruction:'Послушайте два звука по очереди. Затем нажмите на точки сами. Движение к ладам с большими номерами повышает звук.', str:4, start:3, demo:4},
    {title:'Найдите полутон вверх',
      explanation:'Начнём с того же звука. Теперь вторую точку нужно выбрать самостоятельно.',
      purpose:'Проверяем, можете ли вы применить правило, когда готовый ответ скрыт.',
      instruction:'На пятой струне выберите звук на полтона выше золотой точки на третьем ладу.', str:4, start:3, delta:1},
    {title:'Тон состоит из двух полутонов',
      explanation:'От третьего лада к пятому — целый тон: 3 → 4 → 5. Получаются два перехода, то есть два полутона.\nПромежуточный лад помогает посчитать расстояние. Играть промежуточный звук каждый раз не обязательно.',
      purpose:'В формулах гамм встречаются и тоны, и полутоны. Нужно различать оба размера шага.',
      instruction:'Послушайте пример: сначала три звука с шагом по полтону, затем только начало и конец — расстояние в тон.', str:4, start:3, demo:5, bridge:4},
    {title:'Найдите тон вверх',
      explanation:'Золотая точка остаётся на третьем ладу. Отложите от неё два полутона.',
      purpose:'Учимся сразу находить конец целого тона, не перебирая все ноты подряд.',
      instruction:'На пятой струне выберите звук на тон выше третьего лада.', str:4, start:3, delta:2},
    {title:'То же расстояние вниз',
      explanation:'Полутон и тон можно откладывать в обе стороны. К меньшим номерам ладов звук понижается. Правило двух переходов для тона сохраняется.',
      purpose:'Мелодии движутся и вверх, и вниз. Формулу нужно уметь применять в обоих направлениях.',
      instruction:'На пятой струне выберите звук на тон ниже золотой точки на седьмом ладу.', str:4, start:7, delta:-2},
    {title:'Проверьте правило на другой струне',
      explanation:'Если мы остаёмся на одной струне, один переход между соседними ладами всегда равен полутону. Правило работает на любой из шести струн.\nПри переходе между струнами нельзя считать только разницу номеров ладов: сами струны настроены по-разному.',
      purpose:'Проверяем понимание правила на новом месте, а не память о предыдущих точках.',
      instruction:'На второй струне найдите звук на полтона ниже золотой точки на восьмом ладу.', str:1, start:8, delta:-1},
    {title:'Теперь возьмите гитару',
      explanation:'На пятой струне сыграйте 3 → 4 и обратно: это полутон. Затем 3 → 5 и обратно: это тон. Повторите от другого удобного лада на другой струне.\nПеред каждым движением назовите размер шага. Играйте медленно, без бендов и подтяжек.',
      purpose:'Правильный клик проверяет понимание схемы. Чтобы применять её в музыке, нужно выполнить движение на настоящем инструменте.',
      instruction:'Проверьте себя: считаете переходы, находите один или два лада в нужную сторону, извлекаете чистые звуки без спешки. Если путаетесь — вернитесь к примерам. Темп пока не оцениваем.', str:4, start:3, practice:true},
    {title:'Вы готовы строить гамму из шагов',
      explanation:'На одной струне: соседний лад — полутон; два перехода между ладами — тон. К большим номерам звук повышается, к меньшим — понижается.\nДальше мы выберем исходную ноту и построим мажорную гамму по последовательности тонов и полутонов.',
      purpose:'Теперь формула гаммы будет понятной инструкцией движения, а не набором слов для заучивания.',
      instruction:'Экранные задания проверены отдельно от игры на гитаре. Отметка практики — ваша самооценка, приложение не слушало исполнение. Можно повторить урок или перейти во «Свободный гриф» и проверить другие исходные ноты.', str:4, start:3, finish:true}
  ];
  function answer(step, stringIdx, fret) {
    if(step.target)return stringIdx===step.target.stringIdx && fret===step.target.fret;
    if (step.delta === undefined) return false;
    return stringIdx === step.str && fret === step.start + step.delta;
  }
  const SESSION_KEY='fretlab-lessons-v1';
  function cleanSession(raw,steps){
    const choices=new Map(),hints=new Set();
    if(raw&&Array.isArray(raw.choices))for(const item of raw.choices.slice(0,steps.length)){
      if(!Array.isArray(item)||item.length!==2)continue;
      const [i,fret]=item;
      if(Number.isInteger(i)&&steps[i]&&Number.isInteger(fret)&&fret>=0&&fret<=16)choices.set(i,fret);
    }
    const solved=new Set([...choices].filter(([i,fret])=>answer(steps[i],steps[i].str,fret)).map(([i])=>i));
    if(raw&&Array.isArray(raw.hints))for(const i of raw.hints.slice(0,steps.length)){
      if(Number.isInteger(i)&&steps[i]&&(steps[i].delta!==undefined||steps[i].target))hints.add(i);
    }
    const practiced=raw?.practiced===true;
    let current=Number.isInteger(raw?.current)?Math.max(0,Math.min(steps.length-1,raw.current)):0;
    for(let i=0;i<current;i++)if((steps[i].delta!==undefined||steps[i].target)&&!solved.has(i)||steps[i].practice&&!practiced){current=i;break;}
    return {current,choices,solved,hints,practiced};
  }
  function boardPosition(stringIdx,fret){
    if(!Number.isInteger(stringIdx)||stringIdx<0||stringIdx>5||!Number.isInteger(fret)||fret<0||fret>FRET_COUNT)return null;
    return {boardId:'lessonBoard',index:stringIdx*(FRET_COUNT+1)+fret};
  }
  function positionFor(midi,step,occurrence=0){
      const points=(step.path||[]).filter(p=>p.midi===midi);
      if(points.length){const p=points[occurrence%points.length];return boardPosition(p.stringIdx,p.fret);}
      // Do not reveal unreached notes in a construction exercise.
      if(step.path)return null;
      return boardPosition(step.str,midi-OPEN_STRINGS_TOP_TO_BOTTOM[step.str]?.midi);
    }
  function boot() {
    const el = id => document.getElementById(id);
    const content = typeof module !== 'undefined' && module.exports ? require('./course-lessons-content.js') : CourseLessonContent;
    const originalSteps=firstSteps;
    const sandbox = typeof module !== 'undefined' && module.exports ? require('./course-sandbox.js') : CourseSandbox;
    const form=realizeScaleForm(0,'major','E',FRET_COUNT);
    if(!form.complete)throw Error('Учебная позиция недоступна');
    const lessons=[originalSteps,content.majorLesson(),content.degreeLesson(form.positions)];
    let activeLesson=0, steps=lessons[0];
    const sessions=new Map(), visited=new Set();
    let canStore=true, listening=false, returnToPractice=null, clickedVoice=null;
    try{
      const raw=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
      if(raw?.version===1&&Array.isArray(raw.sessions)){
        lessons.forEach((list,i)=>sessions.set(i,cleanSession(raw.sessions[i],list)));
        if(Number.isInteger(raw.active)&&lessons[raw.active])activeLesson=raw.active;
        steps=lessons[activeLesson];
        if(Array.isArray(raw.visited))raw.visited.forEach(i=>{if(Number.isInteger(i)&&lessons[i])visited.add(i);});
        else visited.add(activeLesson); // migrate sessions saved before resume tracking
      }
    }catch{canStore=false;}
    let current = 0;
    let solved = new Set();
    let choices = new Map();
    let hints = new Set();
    let practiced = false;
    ({current,solved,choices,hints,practiced}=sessions.get(activeLesson)||cleanSession(null,steps));
    function save(){
      sessions.set(activeLesson,{current,solved,choices,hints,practiced});
      try{localStorage.setItem(SESSION_KEY,JSON.stringify({version:1,active:activeLesson,visited:[...visited],sessions:lessons.map((_,i)=>{
        const state=sessions.get(i);return state?{current:state.current,choices:[...state.choices],hints:[...state.hints],practiced:state.practiced}:null;
      })}));canStore=true;}catch{canStore=false;}
      el('lessonStorage').textContent=canStore?'Шаг урока сохраняется в этом браузере. После перезагрузки откройте урок, чтобы продолжить.':'Хранилище браузера недоступно: шаг урока сохранится только до закрытия страницы.';
    }
    const at=(stringIdx,fret)=>({boardId:'lessonBoard',index:stringIdx*(FRET_COUNT+1)+fret});
    function finishListening(){listening=false;el('lessonListen').textContent='▶ Послушать пример';el('lessonListen').setAttribute('aria-pressed','false');}
    const isTask=s=>s.delta!==undefined || !!s.target;
    function ready() {const s=steps[current]; return isTask(s) ? solved.has(current) : s.practice ? practiced : true;}
    function render() {
      stopSequence();clickedVoice?.stop();clickedVoice=null;finishListening();save();
      const boardOuter=el('lessonBoard').parentElement, boardScroll=boardOuter?.scrollLeft||0;
      const s = steps[current];
      el('lessonTitle').textContent=s.title;
      el('lessonBreadcrumb').textContent=activeLesson===2?'Блок 2 · Ступени и позиция':`Блок 1 · ${activeLesson===0?'Тон и полутон':'Построение C major'}`;
      el('lessonAlternative').hidden=!s.alternative;
      el('lessonAlternativeText').textContent=s.alternative||'';
      el('lessonExplanation').textContent=s.explanation;
      el('lessonInstruction').textContent=s.instruction;
      el('lessonProgress').value=current+1;
      el('lessonProgress').max=steps.length;
      el('lessonSelect').value=String(activeLesson);
      el('lessonContinue').hidden=!s.finish;
      el('lessonContinue').textContent=activeLesson<2?'Продолжить по маршруту →':'К маршруту →';
      el('lessonFormula').innerHTML='';
      el('lessonFormula').hidden=!s.formula;
      if(s.formula){
        const parts=s.showDegrees?[s.formula]:content.majorSteps.map(n=>n===1?'½ · Полутон':'1 · Тон');
        parts.forEach((text,i)=>{const span=document.createElement('span');span.textContent=text;if(!s.showDegrees)span.className=content.majorSteps[i]===1?'step-half':'step-whole';if(i===s.formulaIndex){span.classList.add('current-step');span.setAttribute('aria-current','step');}el('lessonFormula').appendChild(span);});
      }
      el('lessonPosition').textContent=`Шаг ${current+1} из ${steps.length}`;
      el('lessonBack').disabled=current===0;
      el('lessonNext').disabled=!ready() || !!s.finish;
      el('lessonNext').hidden=!!s.finish;
      el('lessonNextHelp').textContent=!ready()?(s.practice?'Сначала сыграйте на гитаре и отметьте самопроверку.':'Сначала выберите нужную ноту на грифе.') : '';
      el('lessonBack').hidden=!!s.finish;
      el('lessonListen').hidden=isTask(s) || !!s.practice || !!s.finish;
      el('lessonHint').hidden=!isTask(s);
      el('lessonPracticeLabel').hidden=!s.practice;
      el('lessonFeedback').hidden=!isTask(s)&&!s.finish&&!s.practice;
      el('lessonBoard').parentElement && (el('lessonBoard').parentElement.hidden=!!s.finish);
      if(s.finish)el('lessonFormula').hidden=true;
      el('lessonPractice').checked=practiced;
      el('lessonFeedback').textContent=isTask(s) ? solved.has(current) ? 'Верно. Можно переходить дальше.' : 'Выберите ответ на указанной струне. Можно пробовать снова: ошибка не закрывает задание.' : s.finish ? `✓ Ответы: ${solved.size} из ${steps.filter(isTask).length} · ◇ Подсказки: ${hints.size} · ♫ Гитара: ${practiced ? 'сыграно (самооценка)' : 'ещё не отмечено'}` : 'Нажмите «Послушать пример» или на отмеченную точку.';
      if(s.practice) el('lessonFeedback').textContent='Отметьте практику после игры и самопроверки. Нажатия на грифе не заменяют это задание.';
      if(s.finish && document.dispatchEvent && typeof CustomEvent!=='undefined') document.dispatchEvent(new CustomEvent('course-lesson-progress',{detail:{lessonId:activeLesson,complete:solved.size===steps.filter(isTask).length&&practiced,assisted:hints.size>0,practice:practiced}}));
      v2RenderBoard(new Map(), 'lessonBoard');
      const cells=el('lessonBoard').querySelectorAll('.cell');
      cells.forEach((cell,index) => {
        const stringIdx=Math.floor(index/(FRET_COUNT+1)), fret=index%(FRET_COUNT+1);
        const point=(s.path||[]).find(p=>p.stringIdx===stringIdx&&p.fret===fret);
        const active=s.multi?!!point:stringIdx===s.str;
        if(!active)cell.classList.add('lesson-muted');
        const midi=OPEN_STRINGS_TOP_TO_BOTTOM[stringIdx].midi+fret;
        const selected=active && choices.get(current)===fret;
        const isStart=!s.target && stringIdx===s.str && fret===s.start;
        const marked=!!point || isStart || (stringIdx===s.str&&(fret===s.demo || fret===s.bridge)) || selected;
        let dot;
        if(marked){
          dot=document.createElement('span');dot.className='note'+(isStart || (s.showDegrees&&point?.degree==='1')?' root':fret===s.bridge?'':' chord-tone');
          dot.textContent=s.showDegrees?(point?.degree || ({0:'1',2:'2',4:'3',5:'4',7:'5',9:'6',11:'7'}[midi%12]||'·')):s.noteLabels||s.path?sandbox.pitch(midi).name:String(fret);
        }
        if(!active){if(dot)cell.appendChild(dot);return;}
        const button=document.createElement('button');
        button.type='button';button.className='sandbox-hit';
        button.setAttribute('aria-label',`Струна ${stringIdx+1}, лад ${fret}${fret===s.start?', исходный звук':''}`);
        if(dot)button.appendChild(dot);
        button.addEventListener('click',()=>{
          if(!isTask(s)){
            stopSequence();clickedVoice?.stop();
            clickedVoice=playMidi(midi,undefined,1.35,.22,at(stringIdx,fret));return;
          }
          choices.set(current,fret);
          if(answer(s,stringIdx,fret))solved.add(current); else solved.delete(current);
          render();
          if(!solved.has(current))clickedVoice=playMidi(midi,undefined,1.35,.22,at(stringIdx,fret));
          if(!solved.has(current)&&s.target){
            el('lessonFeedback').textContent='Пока не та ступень. Отсчитайте нужный номер от C. Можно воспользоваться подсказкой и попробовать снова.';
          }else if(!solved.has(current)){
            const difference=fret-s.start;
            el('lessonFeedback').textContent=difference===0 ? 'Это исходный звук: пока ни одного перехода. Выберите другой лад.' : `Вы отложили ${Math.abs(difference)} ${Math.abs(difference)===1?'лад':Math.abs(difference)<5?'лада':'ладов'} ${difference>0?'вверх':'вниз'}, а нужно ${Math.abs(s.delta)===1?'один лад':'два лада'} ${s.delta>0?'вверх':'вниз'}.`;
          }else playSequence([s.target?48:OPEN_STRINGS_TOP_TO_BOTTOM[s.str].midi+s.start,OPEN_STRINGS_TOP_TO_BOTTOM[s.str].midi+fret],{step:.55,positions:[s.target?positionFor(48,s):at(s.str,s.start),at(stringIdx,fret)]});
          el('lessonBoard').querySelectorAll('.sandbox-hit')[fret].focus({preventScroll:true});
        });
        cell.appendChild(button);
      });
      const points=s.path?[...s.path]:[{stringIdx:s.str,fret:s.start}];
      const endpoint=s.demo!==undefined?s.demo:solved.has(current)&&s.delta!==undefined?s.start+s.delta:null;
      if(endpoint!==null)points.push({stringIdx:s.str,fret:endpoint});
      sandbox.drawDistances(el('lessonBoard'),points);
      if(boardOuter)boardOuter.scrollLeft=boardScroll;
    }
    el('lessonListen').addEventListener('click',()=>{
      if(listening){stopSequence();finishListening();return;}
      const s=steps[current],open=OPEN_STRINGS_TOP_TO_BOTTOM[s.str].midi;
      const notes=s.playback || (s.bridge!==undefined?[s.start,s.bridge,s.demo,s.start,s.demo]:s.demo!==undefined?[s.start,s.demo]:[s.start]).map(f=>open+f);
      const seen=new Map();
      const positions=notes.map(midi=>{const n=seen.get(midi)||0;seen.set(midi,n+1);return positionFor(midi,s,n);});
      stopSequence();listening=true;el('lessonListen').textContent='■ Стоп';el('lessonListen').setAttribute('aria-pressed','true');
      playSequence(notes,{step:.55,duration:.5,positions,onend:finishListening});
    });
    el('lessonHint').addEventListener('click',()=>{
      hints.add(current);save();
      const s=steps[current];
      el('lessonFeedback').textContent=s.targetHint || `Начните с ${s.start}-го лада. ${Math.abs(s.delta)===1?'Сделайте один переход':'Сделайте два перехода'} к ${s.delta>0?'большим':'меньшим'} номерам. Исходный лад не считается переходом.`;
    });
    el('lessonPractice').addEventListener('change',e=>{practiced=e.target.checked;render();});
    function moveStep(direction){
      if(direction>0&&(!ready()||current===steps.length-1)||direction<0&&current===0)return;
      const view=document.defaultView, panel=el('panel-lesson');
      const top=view?.scrollY, left=view?.scrollX;
      // Keep a shorter next step from clamping the viewport to the new page bottom.
      // Reserve only this lesson's already displayed height; reset for another lesson.
      if(view)panel.style.minHeight=panel.getBoundingClientRect().height+'px';
      current+=direction;render();
      el('lessonTitle').focus({preventScroll:true});
      if(view)view.scrollTo({top,left,behavior:'instant'});
    }
    document.defaultView?.addEventListener('resize',()=>{el('panel-lesson').style.minHeight='';});
    el('lessonBack').addEventListener('click',()=>moveStep(-1));
    el('lessonNext').addEventListener('click',()=>moveStep(1));
    el('lessonRestart').addEventListener('click',()=>{el('panel-lesson').style.minHeight='';current=0;solved.clear();choices.clear();hints.clear();practiced=false;render();});
    function switchLesson(index){
      if(!Number.isInteger(index)||!lessons[index])return;
      el('panel-lesson').style.minHeight='';
      visited.delete(index);visited.add(index);
      sessions.set(activeLesson,{current,solved,choices,hints,practiced});
      activeLesson=index;steps=lessons[index];
      const saved=sessions.get(index);
      current=saved?.current||0;solved=saved?.solved||new Set();choices=saved?.choices||new Map();hints=saved?.hints||new Set();practiced=saved?.practiced||false;
      render();
    }
    el('lessonSelect').addEventListener('change',e=>switchLesson(Number(e.target.value)));
    el('lessonRoute').addEventListener('click',()=>el('tab-block').click());
    el('lessonContinue').addEventListener('click',()=>{
      if(!steps[current].finish)return;
      el('tab-block').click();
      if(activeLesson<2)window.courseBlockOne.open(window.courseBlockOne.activities[activeLesson===0?1:3]);
    });
    el('lessonReturn').addEventListener('click',()=>{
      stopSequence();clickedVoice?.stop();clickedVoice=null;
      const back=returnToPractice;returnToPractice=null;el('lessonReturn').hidden=true;back?.();
    });
    function open(index,{onReturn=null}={}){
      el('tab-block').click();
      switchLesson(index);
      returnToPractice=onReturn;el('lessonReturn').hidden=!onReturn;
      el('blockRoute').hidden=true;el('panel-lesson').hidden=false;
      el('lessonTitle').focus();
    }
    document.querySelectorAll('[role="tab"]').forEach(tab=>tab.addEventListener('click',()=>{clickedVoice?.stop();clickedVoice=null;}));
    render();
    function getResume(){
      for(const index of [...visited].reverse()){
        const state=sessions.get(index);
        if(state&&!lessons[index][state.current].finish)return {index,step:state.current+1,total:lessons[index].length};
      }
      return null;
    }
    return {open,getResume};
  }
  return {steps:firstSteps,answer,cleanSession,positionFor,boot};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CourseLesson;
else window.courseLessons=CourseLesson.boot();
