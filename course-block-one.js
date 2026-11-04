/* Block 1: original practice tasks. No book scores or recordings are bundled. */
const CourseBlockOne = (() => {
  const KEY='fretlab-block1-v1';
  const MAJOR=[2,2,1,2,2,2,1], FRETS=[3,5,7,8,10,12,14,15];
  const ACTIVITIES=[
    {id:'lesson0',title:'1. Тон и полутон',kind:'guided',lesson:0,why:'Разобраться, как измерять расстояния на одной струне.'},
    {id:'interval',title:'2. Найдите расстояние',kind:'interval',why:'Применить правило на разных струнах и в обоих направлениях.'},
    {id:'lesson1',title:'3. Постройте C major с объяснением',kind:'guided',lesson:1,why:'Связать каждый шаг мажорной формулы с нотой на грифе.'},
    {id:'formula',title:'4. Вспомните формулу',kind:'formula',why:'Восстановить последовательность без готового ответа.'},
    {id:'scale',title:'5. Восстановите C major',kind:'scale',why:'Самостоятельно собрать гамму на пустом грифе.'},
    {id:'repair',title:'6. Найдите и исправьте ошибку',kind:'repair',why:'Проверить расстояния, а не узнавать знакомый рисунок.'},
    {id:'ear',title:'7. Сравните на слух',kind:'ear',why:'Начать связывать размер шага с его звучанием.'},
    {id:'rhythm',title:'8. Один звук — разные ритмы',kind:'rhythm',why:'Услышать паузы и повторить рисунок, не отвлекаясь на выбор нот.'},
    {id:'compose',title:'9. Своя фраза из C, D, E',kind:'compose',why:'Применить знакомые ноты в небольшой собственной музыке.'},
    {id:'final',title:'10. Проверка и игра на гитаре',kind:'final',why:'Отдельно проверить знания без подсказок и оценить исполнение.'}
  ];
  const RHYTHMS=[
    {label:'ТА · ТА · пауза · ТА',durations:[1,1,1,1],rests:[2]},
    {label:'ТА-та · ТА · ТА · пауза',durations:[.5,.5,1,1,1],rests:[4]},
    {label:'ТА · пауза · ТА-та · ТА',durations:[1,1,.5,.5,1],rests:[1]}
  ];
  function pick(list,rng){return list[Math.min(list.length-1,Math.floor(rng()*list.length))];}
  function shuffle(list,rng){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.min(i,Math.floor(rng()*(i+1)));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function makeSession(kind,rng=Math.random){
    const s={kind,done:false,assisted:false,attempts:0,firstCorrect:0,round:0};
    if(kind==='interval'||kind==='ear'){
      const count=kind==='ear'?6:8;
      s.questions=shuffle(Array.from({length:count},(_,i)=>{
        const delta=kind==='ear'?(i%2?2:1):[1,2,-1,-2][i%4];
        return {str:pick([0,1,2,3,4,5],rng),start:pick([4,5,6,7,8,9],rng),delta};
      }),rng);s.tries=0;
    }
    if(kind==='formula')s.values=[];
    if(kind==='scale')s.values=[3];
    if(kind==='repair'){
      s.badIndex=pick([1,2,3,4,5,6],rng);s.values=[...FRETS];
      s.values[s.badIndex]+=pick([-1,1],rng);
      // The changed note is always distinct from both neighbours.
      if(s.values[s.badIndex]===s.values[s.badIndex-1]||s.values[s.badIndex]===s.values[s.badIndex+1])s.values[s.badIndex]=FRETS[s.badIndex]+(s.values[s.badIndex]>FRETS[s.badIndex]?-1:1);
      s.located=false;
    }
    if(kind==='rhythm'){s.order=shuffle([0,1,2],rng);s.tries=0;}
    if(kind==='compose'){s.events=[];s.checks=[false,false];}
    if(kind==='final'){
      s.parts=[makeSession('interval',rng),makeSession('formula',rng),makeSession('scale',rng),{kind:'octave',done:false,attempts:0}];
      s.parts[0].questions=shuffle([1,2,-1,-2].map(delta=>s.parts[0].questions.find(q=>q.delta===delta)),rng);s.phase=0;s.checks=[false,false,false];
    }
    return s;
  }
  function matchFormula(values){return values.length===7&&values.every((v,i)=>v===MAJOR[i]);}
  function matchScale(values){const a=[...values].sort((x,y)=>x-y);return a.length===8&&a.every((v,i)=>v===FRETS[i]);}
  function phraseCheck(events){
    const beats=events.reduce((sum,e)=>sum+e.beats,0);
    if(events.some(e=>![.5,1,2].includes(e.beats)||!(e.midi===null||[48,50,52].includes(e.midi))))return 'В фразе есть неподдерживаемое событие.';
    if(beats!==8)return `Соберите два такта 4/4: сейчас ${beats} из 8 долей.`;
    if(events.filter(e=>e.midi!==null).length<2)return 'Добавьте хотя бы два звучащих события.';
    if(!events.some(e=>e.midi===null))return 'Оставьте хотя бы одну паузу, чтобы разделить фразу.';
    const notes=events.filter(e=>e.midi!==null);
    if(notes.at(-1).midi!==48)return 'Для этого задания завершите звучащую часть на C. Пауза после C допустима.';
    return '';
  }
  function submit(s,value){
    if(s.done)return true;
    s.attempts++;
    let correct=false;
    if(s.kind==='interval'||s.kind==='ear'){
      const q=s.questions[s.round];
      correct=s.kind==='ear'?value===Math.abs(q.delta):value.str===q.str&&value.fret===q.start+q.delta;
      if(correct){if(s.tries===0)s.firstCorrect++;s.round++;s.tries=0;s.done=s.round===s.questions.length;}else s.tries++;
    }else if(s.kind==='formula')correct=matchFormula(s.values);
    else if(s.kind==='scale')correct=matchScale(s.values);
    else if(s.kind==='octave')correct=value===12;
    else if(s.kind==='repair'){
      if(!s.located){correct=value===s.values[s.badIndex];if(correct)s.located=true;}
      else {correct=value===FRETS[s.badIndex];if(correct){s.values[s.badIndex]=FRETS[s.badIndex];s.done=true;}}
    }else if(s.kind==='rhythm'){
      correct=value===s.order[s.round];
      if(correct){if(s.tries===0)s.firstCorrect++;s.round++;s.tries=0;s.done=s.round===s.order.length;}else s.tries++;
    }
    if(correct&&['formula','scale','octave'].includes(s.kind))s.done=true;
    return correct;
  }
  function cleanRecords(raw){
    if(!raw||raw.version!==1||!raw.records||typeof raw.records!=='object')return {};
    const records={};
    for(const a of ACTIVITIES){
      const r=raw.records[a.id];if(!r||r.done!==true)continue;
      records[a.id]={done:true,assisted:r.assisted===true,practice:r.practice===true,at:typeof r.at==='string'?r.at:'',firstCorrect:Number.isFinite(r.firstCorrect)?r.firstCorrect:0,total:Number.isFinite(r.total)?r.total:0};
      if(a.kind==='compose'&&Array.isArray(r.phrase)&&r.phrase.length<=32&&r.phrase.every(e=>e&&typeof e==='object')&&!phraseCheck(r.phrase))records[a.id].phrase=r.phrase.map(e=>({midi:e.midi,beats:e.beats}));
    }
    return records;
  }
  const REWARDS=Object.freeze({
    lesson0:'Линейка звуков',interval:'Расстояния найдены',lesson1:'Мажор собран',
    formula:'Формула восстановлена',scale:'Гамма на грифе',repair:'Ошибка исправлена',
    ear:'Интервалы узнаны',rhythm:'Ритмы распознаны',compose:'Первая фраза',final:'Проверка завершена'
  });
  const RESULTS=Object.freeze({
    interval:'Вы нашли тон и полутон в обе стороны на экране.',
    formula:'Вы восстановили мажорную формулу.',scale:'Вы построили гамму до мажор на экране.',
    repair:'Вы нашли ошибку и восстановили верную гамму.',ear:'Вы различили тон и полутон в шести примерах.',
    rhythm:'Вы распознали три ритма и отметили повторение голосом и на гитаре.',
    compose:'Вы создали свою фразу и отметили её исполнение.',
    final:'Вы завершили экранную проверку и отметили самопроверку на гитаре.'
  });
  function resumeLabel(records,resume){
    if(resume)return `Продолжить урок: шаг ${resume.step} из ${resume.total}`;
    const next=ACTIVITIES.find(a=>!records[a.id]?.done);
    if(!ACTIVITIES.some(a=>records[a.id]?.done))return 'Начать курс';
    return next?`Продолжить: ${next.title}`:'Повторить: 1. Тон и полутон';
  }
  const LESSON_FOR_ACTIVITY=Object.freeze({interval:0,formula:1,scale:1,repair:1});
  function boot(){
    const el=id=>document.getElementById(id), node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
    const pitchNames=typeof module!=='undefined'&&module.exports?require('./course-sandbox.js'):CourseSandbox;
    let records={},canStore=true;
    try{records=cleanRecords(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{canStore=false;}
    let activity=null, session=null, heard=false, tempo=60, voices=[],timers=[],boardScroll=null,stopButton=null,audioVersion=0;
    const storage=()=>{el('blockStorage').textContent=canStore?'Завершённые упражнения сохраняются в этом браузере. Незавершённая попытка после перезагрузки начинается заново.':'Хранилище браузера недоступно: результаты сохраняются только до закрытия страницы.';if(!canStore)el('blockStorage').parentElement.open=true;};
    function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,records}));}catch{canStore=false;}storage();}
    function stop(){audioVersion++;if(stopButton)stopButton.hidden=true;voices.forEach(v=>{try{v?.stop();}catch{}});voices=[];timers.forEach(clearTimeout);timers=[];}
    function audio(events,{countIn=false,click=false}={}){
      stop();const version=audioVersion;const ctx=getAudioCtx(),beat=60/tempo,start=ctx.currentTime+.08,lead=countIn?4:0;
      const add=(midi,time,dur,peak)=>{voices.push(playMidi(midi,time,dur,peak,activity?.kind==='compose'&&[48,50,52].includes(midi)?{boardId:'blockPracticeBoard',index:4*(FRET_COUNT+1)+midi-45}:null));};
      if(countIn)for(let i=0;i<4;i++)add(i===0?88:81,start+i*beat,.06,.06);
      const length=events.reduce((n,e)=>n+e.beats,0);
      if(click)for(let i=0;i<length;i++)add(i%4===0?88:81,start+(lead+i)*beat,.05,.035);
      let offset=lead;
      events.forEach(e=>{if(e.midi!==null)add(e.midi,start+offset*beat,Math.max(.07,e.beats*beat*.8),e.accent ? 0.2 : 0.14);offset+=e.beats;});
      if(stopButton)stopButton.hidden=false;
      timers.push(setTimeout(()=>{if(version===audioVersion){voices=[];if(stopButton)stopButton.hidden=true;}},(start+(lead+length)*beat-ctx.currentTime)*1000+100));
      feedback(countIn?'Четыре щелчка отсчёта, затем пример. Слушайте, где звук и где пауза.':'Слушайте пример; затем повторите или ответьте.');
    }
    function button(parent,text,fn,disabled=false){const b=node('button',text);b.type='button';b.className='play-btn'+(/^(Проверить|Завершить|Повторил|Продолжить)/.test(text)?' primary-btn':/^(Подсказка|Новая|■|Убрать|Очистить|←)/.test(text)?' text-btn':'');b.disabled=disabled;b.addEventListener('click',fn);parent.appendChild(b);return b;}
    function feedback(text,success=false){const box=el('blockTaskFeedback');box.textContent=text;box.hidden=!text;box.classList.toggle('answer-success',success);}
    function reward(){
      const all=ACTIVITIES.every(a=>records[a.id]?.done);
      feedback(`✦ ${REWARDS[activity.id]}. Упражнение выполнено. ${RESULTS[activity.id]||''}${all?' Первый блок пройден!':''}`,true);
      el('blockTaskFeedback').classList.add('task-reward');
    }
    function complete(s=session){
      stop();s.done=true;
      records[activity.id]={done:true,assisted:s.assisted,practice:!!s.practice,at:new Date().toISOString(),firstCorrect:s.firstCorrect,total:s.questions?.length||s.order?.length||0};
      if(s.kind==='compose')records[activity.id].phrase=s.events.map(e=>({...e}));
      save();overview();
      reward();
      for(const tag of ['button','input','select'])el('blockTaskBody').querySelectorAll(tag).forEach(n=>n.disabled=true);
      drawActions(true);
    }
    function overview(){
      const count=ACTIVITIES.filter(a=>records[a.id]?.done).length;
      el('blockCelebration').hidden=count!==ACTIVITIES.length;
      el('blockNextLesson').disabled=count!==ACTIVITIES.length;
      el('blockNextLesson').textContent=count===ACTIVITIES.length?'Дальше: Блок 2 · Ступени и позиция →':'Блок 2 · После завершения первого блока';
      el('blockSummary').textContent=`Выполнено ${count} из ${ACTIVITIES.length} заданий${count===ACTIVITIES.length?' · Блок пройден':''}`;
      el('blockProgress').value=count;
      const next=ACTIVITIES.find(a=>!records[a.id]?.done);
      const resume=window.courseLessons?.getResume();
      el('blockResume').textContent=resumeLabel(records,resume);
      el('blockResume').onclick=()=>resume?window.courseLessons.open(resume.index):open(next||ACTIVITIES[0]);
      const list=el('blockActivities');list.innerHTML='';
      const groups=[['Расстояния',0,2],['Мажорная гамма',2,6],['Слух, ритм и своя фраза',6,9],['Проверка',9,10]];
      groups.forEach(([title,start,end])=>{
        const group=node('section');group.className='block-stage';group.appendChild(node('h2',title));
        const cards=node('div');cards.className='block-stage-cards';group.appendChild(cards);
        ACTIVITIES.slice(start,end).forEach(a=>{
          const card=node('article');card.className='block-card';card.appendChild(node('h3',a.title));card.appendChild(node('p',a.why));
          const current=resume?a.lesson===resume.index:a===next;card.classList.toggle('route-current',current);if(current)card.setAttribute('aria-current','step');
          const r=records[a.id],status=node('p');status.className='block-status';
          [r?.done?'✦ '+REWARDS[a.id]:current?'Вы здесь':'○ Впереди',r?.assisted?'С подсказкой':null,r?.practice?'♫ Вы отметили практику':null].filter(Boolean).forEach(t=>status.appendChild(node('span',t)));
          card.appendChild(status);const link=button(card,a.title,()=>open(a));link.className='route-open';link.setAttribute('aria-label',(r?.done?'Повторить: ':'Открыть: ')+a.title);cards.appendChild(card);
        });
        list.appendChild(group);
      });
    }

    function open(a){
      stop();activity=a;el('panel-lesson').hidden=true;el('blockRoute').hidden=false;
      if(a.kind==='guided'){
        el('blockWorkspace').hidden=true;el('blockOverview').hidden=false;
        window.courseLessons.open(a.lesson);return;
      }
      session=makeSession(a.kind);heard=false;boardScroll=null;
      if(a.kind==='compose'&&records[a.id]?.phrase)session.events=records[a.id].phrase.map(e=>({...e}));
      el('blockWorkspace').hidden=false;el('blockOverview').hidden=true;
      el('blockTaskTitle').textContent=a.title;
      draw();el('blockTaskTitle').focus();
    }
    function board(str,marks,onClick,{all=false}={}){
      const outer=node('div');outer.className='board-outer';const b=node('div');b.id='blockPracticeBoard';b.className='board';outer.appendChild(b);el('blockTaskBody').appendChild(outer);
      v2RenderBoard(new Map(),'blockPracticeBoard');
      b.querySelectorAll('.cell').forEach((cell,i)=>{
        const stringIdx=Math.floor(i/(FRET_COUNT+1)),fret=i%(FRET_COUNT+1),m=marks.find(p=>p.str===stringIdx&&p.fret===fret);
        if(stringIdx===str)cell.classList.add('active-string');
        if(stringIdx!==str&&!all){cell.classList.add('lesson-muted');return;}
        const hit=node('button');hit.type='button';hit.className='sandbox-hit';hit.setAttribute('aria-label',`Струна ${stringIdx+1}, лад ${fret}`);
        if(m){const dot=node('span',m.label??String(fret));dot.className='note'+(m.root?' root':' chord-tone');hit.appendChild(dot);}
        hit.addEventListener('click',()=>onClick(stringIdx,fret));cell.appendChild(hit);
      });
      const legend=node('p','● Исходный звук · остальные точки — показанные ноты / ваш выбор');legend.className='board-legend';el('blockTaskBody').appendChild(legend);
      b.querySelectorAll('.open-label').forEach((label,i)=>label.classList.toggle('active-string-label',i===str));
      if(boardScroll!==null)outer.scrollLeft=boardScroll;
      else{
        const anchor=marks.find(m=>m.root)||marks[0];
        const cell=anchor?b.querySelectorAll('.cell')[anchor.str*(FRET_COUNT+1)+anchor.fret]:null;
        if(cell)outer.scrollLeft=Math.max(0,cell.getBoundingClientRect().left-outer.getBoundingClientRect().left+cell.getBoundingClientRect().width/2-outer.clientWidth/2);
      }
      outer.addEventListener('scroll',()=>{boardScroll=outer.scrollLeft;});
      const tip=node('p','На телефоне гриф можно прокручивать вбок. Номер лада указан над каждой колонкой.');tip.className='hint mobile-board-tip';el('blockTaskBody').appendChild(tip);
    }
    function controls(){const row=node('div');row.className='sandbox-controls';el('blockTaskBody').appendChild(row);return row;}
    function drawActions(done=false){
      const row=el('blockTaskActions');row.innerHTML='';stopButton=button(row,'■ Остановить звук',stop);stopButton.hidden=!voices.length;
      if(LESSON_FOR_ACTIVITY[activity.kind]!==undefined&&!done)button(row,'← К уроку',()=>{
        stop();
        window.courseLessons.open(LESSON_FOR_ACTIVITY[activity.kind],{onReturn:()=>{
          el('panel-lesson').hidden=true;el('blockRoute').hidden=false;
          el('blockOverview').hidden=true;el('blockWorkspace').hidden=false;
          draw();
          el('blockTaskTitle').focus();
        }});
      });
      if(activity.kind!=='final'&&!done)button(row,'Подсказка',()=>{
        session.assisted=true;
        const hints={interval:'Один полутон — один переход. Тон — два. Считайте от золотой точки в указанную сторону.',formula:'Формула мажора: 2–2–1–2–2–2–1.',scale:'Точка C на третьем ладу — начало. Последовательно прибавляйте 2–2–1–2–2–2–1.',repair:'Проверьте каждое соседнее расстояние по формуле 2–2–1–2–2–2–1. Изменена одна внутренняя нота.',ear:'Полутон — меньший шаг. Сейчас прозвучит эталон полутона, затем тона. После этого снова включите свой пример.',rhythm:'Считайте «1-и-2-и-3-и-4-и». ● — начало звука, ─ — его продолжение, · — пауза. Каждая клетка — половина доли.',compose:'Начните с короткого мотива из C, D, E, добавьте паузу и ответ. В задании два такта по четыре доли.'};
        if(activity.kind==='ear')audio([{midi:48,beats:1},{midi:49,beats:1},{midi:null,beats:1},{midi:48,beats:1},{midi:50,beats:1}]);
        feedback(hints[activity.kind]);
      });
      if(done){const next=ACTIVITIES[ACTIVITIES.indexOf(activity)+1];if(next)button(row,'Продолжить: '+next.title,()=>open(next));else button(row,'К маршруту',()=>el('blockClose').click());}
      button(row,'Новая попытка',()=>open(activity));
    }
    function draw(){
      stop();const body=el('blockTaskBody');body.innerHTML='';feedback('');el('blockTaskFeedback').classList.remove('task-reward');el('blockTaskInstruction').dataset.label=['ear','rhythm'].includes(activity.kind)?'Послушайте':activity.kind==='compose'?'Создайте фразу':'Задание';
      const final=activity.kind==='final';
      if(final&&session.phase===4){drawSelfCheck();return;}
      const s=final?session.parts[session.phase]:session;
      if(final){el('blockTaskExplanation').textContent=`Итоговая проверка без подсказок · часть ${session.phase+1} из 5. Находить ответы в соседних уроках не нужно: так вы увидите, что осталось в памяти.`;}
      function accepted(correct,message='Верно — ответ найден.'){
        if(correct&&s.done){
          if(final){session.phase++;heard=false;draw();}
          else complete();
        }else {heard=false;if(correct)boardScroll=null;draw();feedback(correct?message:'Пока неверно. Попробуйте ещё раз — можно вернуться к правилу или воспользоваться подсказкой.',correct);}
      }
      if(s.kind==='interval'){
        const q=s.intervalReview||s.questions[s.round];
        if(!final)el('blockTaskExplanation').textContent='Здесь меняются струна, исходный лад и направление. Это проверяет правило, а не запоминание одной точки.';
        el('blockTaskInstruction').textContent=`Задание ${s.intervalReview?s.round:s.round+1}/${s.questions.length}: на струне ${q.str+1} от лада ${q.start} найдите ${Math.abs(q.delta)===1?'полутон':'тон'} ${q.delta>0?'выше':'ниже'}.`;
        const marks=[{str:q.str,fret:q.start,root:true}];
        if(s.intervalReview)marks.push({str:q.str,fret:q.start+q.delta});
        board(q.str,marks,(str,fret)=>{
          if(!s.intervalReview){
            if(submit(s,{str,fret})){s.intervalReview=q;draw();}
            else feedback('Пока неверно. Отсчитайте расстояние от золотой точки в указанную сторону.');
          }
          playMidi(OPEN_STRINGS_TOP_TO_BOTTOM[str].midi+fret,undefined,1.35,.22,{boardId:'blockPracticeBoard',index:str*(FRET_COUNT+1)+fret});
        });
        if(s.intervalReview){
          CourseSandbox.drawDistances(el('blockPracticeBoard'),marks.map(m=>({stringIdx:m.str,fret:m.fret})));
          feedback(`✓ Верно: ${Math.abs(q.delta)===1?'½ · Полутон':'1 · Тон'} ${q.delta>0?'вверх':'вниз'}. Лады ${q.start} → ${q.start+q.delta}. Можно ещё раз послушать обе точки.`,true);
          const next=button(controls(),s.done?(final?'Продолжить проверку →':'Завершить упражнение →'):'Следующий пример →',()=>{
            delete s.intervalReview;accepted(true);
          });
          next.classList.add('primary-btn');next.focus({preventScroll:true});
        }
      }else if(s.kind==='formula'){
        if(!final)el('blockTaskExplanation').textContent='Восстановите семь расстояний между соседними звуками мажорной гаммы. Готовая последовательность скрыта.';
        el('blockTaskInstruction').textContent='Добавляйте тон (2) или полутон (1). Должно получиться семь шагов до следующей тоники.';
        body.appendChild(node('p',s.values.length?s.values.join(' → '):'Последовательность пока пуста.'));
        const row=controls();[2,1].forEach(v=>button(row,v===2?'Тон · 2':'Полутон · 1',()=>{s.values.push(v);draw();},s.values.length>=7));
        button(row,'Убрать последний',()=>{s.values.pop();draw();},!s.values.length);
        button(row,'Проверить',()=>{const correct=submit(s);if(correct)accepted(true);else feedback('Последовательность пока не соответствует мажору. Проверьте порядок шагов, а не только их сумму.');},s.values.length!==7);
      }else if(s.kind==='scale'){
        if(!final)el('blockTaskExplanation').textContent='Соберите C major от C3 до C4 на одной струне. Здесь нет подсвеченного следующего шага: примените всю формулу самостоятельно.';
        el('blockTaskInstruction').textContent='Начальная C — пятая струна, третий лад. Отметьте ещё семь звуков до C следующей октавы. Повторный клик убирает точку.';
        board(4,s.values.map(fret=>({str:4,fret,root:fret===3})),(str,fret)=>{
          if(fret===3)return;playMidi(45+fret,undefined,1.35,.22,{boardId:'blockPracticeBoard',index:4*(FRET_COUNT+1)+fret});s.values=s.values.includes(fret)?s.values.filter(f=>f!==fret):[...s.values,fret];draw();
        });
        body.appendChild(node('p',`Отмечено ${s.values.length} из 8 звуков.`));
        body.appendChild(node('p','На узком экране прокручивайте гриф вбок, чтобы добраться до верхних ладов.'));
        const row=controls();button(row,'Послушать выбранное',()=>audio([...s.values].sort((a,b)=>a-b).map(f=>({midi:45+f,beats:1}))));
        button(row,'Проверить',()=>{
          if(submit(s))accepted(true);else feedback(s.values.length!==8?'Нужно восемь звуков вместе с начальной C и её повторением через октаву.':'Количество верное. Теперь проверьте соседние расстояния и возвращение к C через 12 полутонов.');
        });
      }else if(s.kind==='repair'){
        el('blockTaskExplanation').textContent='В мажорной гамме изменена одна внутренняя нота. Найдите её по расстояниям и поставьте на правильный лад.';
        el('blockTaskInstruction').textContent=s.located?'Ошибка найдена. Теперь нажмите на лад, где должна стоять эта нота.':'Нажмите на неверную точку. Начало и конец гаммы оставлены правильными.';
        board(4,s.values.map((fret,i)=>({str:4,fret,root:i===0,label:s.located&&!s.done&&i===s.badIndex?'×':String(fret)})),(str,fret)=>{
          const wasLocated=s.located,correct=submit(s,fret);playMidi(45+fret,undefined,1.35,.22,{boardId:'blockPracticeBoard',index:4*(FRET_COUNT+1)+fret});
          if(correct&&s.done){draw();complete();}else{draw();feedback(correct&&!wasLocated?'Верно, эта нота нарушает формулу. Теперь исправьте её положение.':'Проверьте соседние интервалы вокруг выбранной ноты.');}
        });
      }else if(s.kind==='ear'){
        const q=s.earReview||s.questions[s.round],midi=OPEN_STRINGS_TOP_TO_BOTTOM[q.str].midi+q.start;
        el('blockTaskExplanation').textContent='В каждой паре второй звук выше первого. Определите расстояние между ними: полутон или тон.';
        const instruction=()=>{el('blockTaskInstruction').textContent=`Пара ${s.earReview?s.round:s.round+1}/${s.questions.length}. ${s.earReview?'Ответ найден. Можно повторить звучание или перейти дальше.':heard?'Теперь выберите: полутон или тон. Пару можно прослушать повторно.':'Новая пара ещё не звучала. Нажмите «Слушать пару», затем выберите ответ.'}`;};instruction();
        const row=controls();const listen=button(row,'▶ Слушать пару',()=>{audio([{midi,beats:1},{midi:midi+q.delta,beats:1}]);heard=true;instruction();drawAnswerButtons();});
        listen.classList.add('primary-btn');
        const answers=node('div');answers.className='sandbox-controls';body.appendChild(answers);
        function drawAnswerButtons(){
          answers.innerHTML='';
          if(s.earReview){
            feedback(`✓ Верно — это ${Math.abs(q.delta)===1?'½ · полутон':'1 · тон'}. Следующая пара начнётся по вашему нажатию.`,true);
            listen.classList.remove('primary-btn');
            const next=button(answers,s.done?'Завершить упражнение →':'Следующая пара →',()=>{delete s.earReview;heard=false;if(s.done)complete();else draw();});next.classList.add('primary-btn');return;
          }
          [1,2].forEach(v=>button(answers,v===1?'Полутон':'Тон',()=>{
            if(submit(s,v)){stop();s.earReview=q;instruction();drawAnswerButtons();}
            else feedback('Пока неверно. Нажмите «Слушать пару», чтобы сравнить звуки ещё раз.');
          },!heard));
        }drawAnswerButtons();
      }else if(s.kind==='octave'){
        el('blockTaskInstruction').textContent='Сколько полутонов от начальной C до следующей C на октаву выше?';
        const row=controls();[7,8,12].forEach(n=>button(row,String(n),()=>accepted(submit(s,n))));
      }else if(s.kind==='rhythm'){
        el('blockTaskExplanation').textContent='Ритм — это расположение звуков и пауз во времени. Здесь высота звука не меняется: всё играем на ноте C.';
        if(!s.introDone){
          el('blockTaskInstruction').textContent='Сначала познакомьтесь с пульсом и обозначениями. Здесь размер 4/4: в такте четыре равные доли, считаем «1, 2, 3, 4».';
          const intro=node('section');intro.className='rhythm-intro';body.appendChild(intro);
          intro.appendChild(node('h3','1. Почувствуйте ровный пульс'));
          intro.appendChild(node('p','Послушайте четыре щелчка. На каждый произнесите очередное число: 1, 2, 3, 4.'));
          button(intro,'▶ Четыре доли',()=>audio(Array.from({length:4},()=>({midi:81,beats:1}))));
          intro.appendChild(node('h3','2. Разделите каждую долю пополам'));
          intro.appendChild(node('p','Считайте ровно: «1-и, 2-и, 3-и, 4-и». Числа остаются на щелчках. Два звука за одну долю — две восьмые; один звук на целую долю — четверть.'));
          button(intro,'▶ Послушать ровные восьмые',()=>audio(Array.from({length:8},()=>({midi:48,beats:.5})),{countIn:true,click:true}));
          intro.appendChild(node('h3','3. Прочитайте один рисунок'));
          intro.appendChild(node('p','Каждая рамка ниже — одна доля, внутри две половины. «ТА» — новый звук, «—» — его продолжение, «пауза» — молчание. Во время паузы продолжайте считать. Это наша подсказка к ритму, а не нотная запись.'));
          rhythmDiagram(intro,RHYTHMS[0]);
          intro.appendChild(node('p','В этом примере сыграйте на 1 и 2, промолчите на 3, сыграйте на 4. Сначала прозвучат четыре щелчка отсчёта, затем сам рисунок с тихим пульсом.'));
          button(intro,'▶ Послушать разобранный пример',()=>audio(rhythmEvents(RHYTHMS[0]),{countIn:true,click:true}));
          button(controls(),'Начать сравнение ритмов →',()=>{s.introDone=true;heard=false;draw();}).classList.add('primary-btn');
          tempoControl();drawActions();return;
        }
        const r=RHYTHMS[s.order[s.round]];
        el('blockTaskInstruction').textContent=`Пример ${s.round+1}/3. Нажмите «Отсчёт и ритм»: четыре щелчка для подготовки, затем один такт. Выберите, в каком рисунке звуки и пауза стоят на тех же долях.`;
        const row=controls();let reviewed=false;
        const listen=button(row,'▶ Отсчёт и ритм',()=>{audio(rhythmEvents(r),{countIn:true,click:true});heard=true;if(!reviewed)choices();});listen.classList.add('primary-btn');
        const help=node('details');help.appendChild(node('summary','Как читать рисунки'));help.appendChild(node('p','Четыре рамки — четыре доли. В каждой две половины: число и «и». ТА — новый звук, — — продолжение, пауза — молчание. Счёт не прерывается.'));body.appendChild(help);
        const explain=button(row,'Разобрать ритм ещё раз',()=>{s.introDone=false;draw();});
        const answers=node('div');body.appendChild(answers);
        function choices(){answers.innerHTML='';RHYTHMS.forEach((pattern,i)=>{const option=node('div');option.className='rhythm-option';option.appendChild(node('h3',`Вариант ${i+1}`));rhythmDiagram(option,pattern);
          option.appendChild(node('p',[
            'Звуки на 1, 2 и 4. На третьей доле — пауза.',
            'Два звука на первой доле, затем по одному на 2 и 3. На четвёртой — пауза.',
            'Звук на 1, пауза на 2, два звука на третьей доле и один на 4.'
          ][i]));
          button(option,'Этот рисунок',()=>{
            const correct=submit(s,i);
            if(correct){stop();reviewed=true;explain.disabled=true;listen.classList.remove('primary-btn');feedback('✓ Ритм распознан. Повторите показанный рисунок голосом, затем на одной ноте на гитаре. Пример можно послушать снова.',true);answers.innerHTML='';rhythmDiagram(answers,pattern);button(answers,'Повторил голосом и на гитаре — дальше',()=>{if(s.done){s.practice=true;complete();}else{heard=false;draw();}}).classList.add('primary-btn');}
            else feedback('Пока неверно. Послушайте ещё раз: на какой доле пауза, а где два звука вместо одного?');
          },!heard);answers.appendChild(option);});}choices();
      }else if(s.kind==='compose')drawComposer();
      if(['ear','rhythm'].includes(s.kind))tempoControl();
      drawActions();
    }
    function rhythmDiagram(parent,rhythm){
      const cells=rhythmCells(rhythm),grid=node('div');grid.className='rhythm-grid';
      for(let beat=0;beat<4;beat++){
        const group=node('div');group.className='rhythm-beat';
        const rest=cells[beat*2]==='·'&&cells[beat*2+1]==='·';
        for(let half=0;half<2;half++){
          const symbol=cells[beat*2+half],cell=node('div');cell.className='rhythm-half';
          cell.appendChild(node('span',half?'и':String(beat+1)));
          if(!rest)cell.appendChild(node('strong',symbol==='●'?'ТА':symbol==='─'?'—':'пауза'));group.appendChild(cell);
        }
        if(rest){const label=node('strong','пауза');label.className='rhythm-rest-label';group.appendChild(label);}
        grid.appendChild(group);
      }parent.appendChild(grid);
    }
    function tempoControl(){const details=node('details');details.className='audio-options';details.appendChild(node('summary','Настройки звука'));el('blockTaskBody').appendChild(details);const row=node('div');row.className='sandbox-controls';details.appendChild(row);const label=node('label','Темп (уд/мин) '),input=node('input');input.type='number';input.min='40';input.max='100';input.value=String(tempo);input.addEventListener('change',()=>{const n=Number(input.value);tempo=Number.isFinite(n)?Math.min(100,Math.max(40,n)):60;input.value=String(tempo);stop();});label.appendChild(input);row.appendChild(label);}
    function drawComposer(){
      const s=session,body=el('blockTaskBody');
      el('blockTaskExplanation').textContent='Создайте два такта из C, D и E: короткий мотив, паузу и ответ. Это ваша собственная фраза.';
      el('blockTaskInstruction').textContent='Заполните 8 долей, добавьте хотя бы одну паузу и закончите звучащую часть на C. В этом задании размер 4/4. Повторять ноты можно.';
      const total=()=>s.events.reduce((n,e)=>n+e.beats,0);
      const toolbar=node('div');toolbar.className='phrase-toolbar';body.appendChild(toolbar);
      const meter=node('div');meter.className='phrase-meter';meter.setAttribute('aria-label',`Заполнено ${total()} из 8 долей`);
      for(let i=0;i<8;i++){const beat=node('span',String(i%4+1));beat.style.setProperty('--filled',Math.max(0,Math.min(1,total()-i))*100+'%');meter.appendChild(beat);}
      toolbar.appendChild(node('p',`Заполнено ${total()}/8 долей`));toolbar.appendChild(meter);
      button(toolbar,'Проверить фразу и завершить',()=>{
        const issue=phraseCheck(s.events);if(issue){feedback(issue);return;}
        if(!s.checks.every(Boolean)){feedback('Сначала проиграйте фразу на гитаре и отметьте самопроверку ниже.');return;}
        s.practice=true;complete();
      });
      const row=controls();row.setAttribute('aria-label','Длительность следующего события');
      if(!s.duration)s.duration=1;
      const durations=[];
      [[1,'Четверть · 1 доля'],[.5,'Восьмая · ½ доли'],[2,'Половинная · 2 доли']].forEach(([value,label])=>{
        const choice=button(row,label,()=>{s.duration=value;durations.forEach(([n,v])=>n.setAttribute('aria-pressed',String(v===value)));});
        choice.classList.add('duration-choice');choice.setAttribute('aria-pressed',String(value===s.duration));durations.push([choice,value]);
      });
      function append(midi){const beats=s.duration;if(total()+beats>8){feedback('Два такта уже заполнены. Уберите последнее событие или выберите меньшую длительность.');return;}s.events.push({midi,beats});draw();}
      button(row,'Добавить паузу',()=>append(null));
      board(4,[{str:4,fret:3,label:'C',root:true},{str:4,fret:5,label:'D'},{str:4,fret:7,label:'E'}],(str,fret)=>{if(![3,5,7].includes(fret)){feedback('Для этой фразы используйте только отмеченные C, D и E.');return;}playMidi(45+fret,undefined,1.35,.22,{boardId:'blockPracticeBoard',index:4*(FRET_COUNT+1)+fret});append(45+fret);});
      const timeline=node('ol');timeline.className='phrase-timeline';
      s.events.forEach((e,i)=>timeline.appendChild(node('li',`${i+1}. ${e.midi===null?'Пауза':pitchNames.pitch(e.midi).name} · ${e.beats===.5?'½ доли':e.beats===1?'1 доля':e.beats+' доли'}`)));body.appendChild(timeline);
      const playback=controls();button(playback,'Убрать последнее',()=>{s.events.pop();draw();},!s.events.length);button(playback,'Очистить фразу',()=>{s.events=[];s.checks=[false,false];draw();},!s.events.length);button(playback,'▶ Сыграть с отсчётом',()=>audio(s.events,{countIn:true,click:true}),!s.events.length);tempoControl();
      checklist(body,['Я пропел свою фразу, затем сыграл её на гитаре.','Я сохранил пульс и паузу; если сбивался, замедлил темп и повторил.'],s.checks);
    }
    function checklist(parent,labels,values){labels.forEach((text,i)=>{const label=node('label');label.className='lesson-practice';const input=node('input');input.type='checkbox';input.checked=values[i];input.addEventListener('change',e=>values[i]=e.target.checked);label.appendChild(input);label.appendChild(node('span',text));parent.appendChild(label);});}
    function drawSelfCheck(){
      el('blockTaskExplanation').textContent='Экранные задания пройдены. Теперь проверьте перенос на настоящий инструмент. Вы сами отмечаете результат игры; приложение не слушает исполнение.';
      el('blockTaskInstruction').dataset.label='Сыграйте на гитаре';
      el('blockTaskInstruction').textContent='Играйте без подсказки на экране. При затруднении вернитесь к нужному упражнению, затем повторите итоговую проверку позже.';
      const body=el('blockTaskBody');
      checklist(body,['На одной струне нахожу тон и полутон вверх и вниз от разных ладов.','Строю и играю C major на одной струне, объясняю шаги и октаву. Если верхние лады недоступны, показываю формулу от открытой шестой струны как E major.','Играю короткую фразу из C, D, E с паузой и ровным пульсом.'],session.checks);
      const row=controls();button(row,'Завершить проверку',()=>{if(!session.checks.every(Boolean)){feedback('Отметьте только то, что получилось на гитаре. Остальные пункты — задачи для повторения, завершать сейчас необязательно.');return;}session.practice=true;complete();});drawActions();
    }
    el('blockClose').addEventListener('click',()=>{stop();el('blockWorkspace').hidden=true;el('blockOverview').hidden=false;overview();el('blockResume').focus();});
    el('tab-block').addEventListener('click',()=>{stop();el('panel-lesson').hidden=true;el('blockRoute').hidden=false;el('blockWorkspace').hidden=true;el('blockOverview').hidden=false;overview();});
    el('blockNextLesson').addEventListener('click',()=>{window.courseLessons.open(2);});
    document.addEventListener('course-lesson-progress',e=>{
      const d=e.detail;if(![0,1].includes(d.lessonId)||!d.complete)return;
      records['lesson'+d.lessonId]={done:true,practice:d.practice,assisted:d.assisted,at:new Date().toISOString()};save();overview();
    });
    document.querySelectorAll('[role="tab"]').forEach(tab=>tab.addEventListener('click',()=>{if(tab.id!=='tab-block')stop();}));
    window.addEventListener('pagehide',stop);
    storage();overview();
    return {open,stop,activities:ACTIVITIES,getRecords:()=>records};
  }
  function rhythmEvents(rhythm){
    let offset=0;return rhythm.durations.map((beats,i)=>{const e={midi:rhythm.rests.includes(i)?null:48,beats,accent:Number.isInteger(offset)};offset+=beats;return e;});
  }
  function rhythmCells(rhythm){return rhythmEvents(rhythm).flatMap(e=>Array.from({length:e.beats*2},(_,i)=>e.midi===null?'·':i===0?'●':'─'));}
  return {REWARDS,RESULTS,resumeLabel,LESSON_FOR_ACTIVITY,ACTIVITIES,RHYTHMS,MAJOR,FRETS,makeSession,matchFormula,matchScale,phraseCheck,submit,cleanRecords,rhythmEvents,rhythmCells,boot};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CourseBlockOne;
else window.courseBlockOne=CourseBlockOne.boot();
