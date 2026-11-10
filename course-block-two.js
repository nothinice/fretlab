/* Block 2: explicit pitch transfers, original practice and teacher-set chord roots. */
const CourseBlockTwo=(()=>{
  const C=typeof module!=='undefined'&&module.exports?require('./course-block-two-content.js'):CourseBlockTwoContent;
  const KEY='fretlab-block2-v1',DAY=86400000;
  const pc=n=>((n%12)+12)%12;
  const pitch=n=>['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'][pc(n)];
  const equals=(a,b)=>a.length===b.length&&new Set(a).size===a.length&&a.every(x=>b.includes(x));
  function chordResult(points,root,quality='maj',namer=null){
    const expected=[0,quality==='min'?3:4,7].map(x=>pc(x+root));
    const notes=[...new Set(points.map(p=>pc(p.midi)))].sort((a,b)=>a-b);
    const missing=expected.filter(n=>!notes.includes(n)),extra=notes.filter(n=>!expected.includes(n));
    const playable=new Set(points.map(p=>p.str)).size===points.length;
    const valid=playable&&!missing.length&&!extra.length;
    let name='';
    if(valid&&namer){const rootNote={noteName:pitch(root),semitone:root};name=namer(rootNote,notes.filter(n=>n!==root).map(n=>({semitone:n,noteName:pitch(n)})));}
    return {valid,missing,extra,name,notes,text:valid?`Это ${pitch(root)} ${quality==='min'?'minor':'major'}. Состав: ${expected.map(pitch).join('–')}.`:!playable?'На каждой струне оставьте один звук.':extra.length?`Есть лишний звук: ${extra.map(pitch).join(', ')}.`:`Не хватает ${missing.map(pitch).join(', ')}.`};
  }
  function phraseCheck(events){
    if(!Array.isArray(events)||events.length>32||events.some(e=>!e||![.5,1,2].includes(e.beats)||!(e.midi===null||C.POSITION.some(p=>p.midi===e.midi))))return 'Используйте ноты C major и длительности ½, 1 или 2 доли.';
    const total=events.reduce((n,e)=>n+e.beats,0),notes=events.filter(e=>e.midi!==null);
    if(total!==8)return `Заполните два такта: сейчас ${total} из 8 долей.`;
    if(notes.length<2)return 'Добавьте хотя бы два звучащих события.';
    if(![0,4,7].includes(pc(notes.at(-1).midi)))return 'Завершите звучащую часть на C, E или G. Пауза после неё допустима.';
    return '';
  }
  function clean(raw){
    const state={version:1,part:'a',index:{a:0,b:0},sessions:{},done:{},completedAt:{},reviewedAt:{},reviewResults:{}};
    if(raw?.version!==1)return state;
    if(raw.part==='b')state.part='b';
    for(const part of ['a','b']){
      const n=raw.index?.[part];if(Number.isInteger(n))state.index[part]=Math.max(0,Math.min(C.parts[part].length-1,n));
      for(const kind of ['completedAt','reviewedAt'])if(Number.isFinite(raw[kind]?.[part])&&raw[kind][part]>0)state[kind][part]=raw[kind][part];
      const review=raw.reviewResults?.[part];
      if(review&&Number.isFinite(review.at)&&review.at>0)state.reviewResults[part]={at:review.at,attempts:Number.isInteger(review.attempts)&&review.attempts>=0?review.attempts:0,practiceConfirmed:review.practiceConfirmed===true};
      for(const step of C.parts[part]){
        if(raw.done?.[step.id]===true)state.done[step.id]=true;
        const s=raw.sessions?.[step.id];if(!s||typeof s!=='object')continue;
        const safe={};
        for(const name of ['round','phase','attempts','firstCorrect','lastAnswer'])if(Number.isInteger(s[name])&&s[name]>=0&&s[name]<=128)safe[name]=s[name];
        for(const name of ['ok','heard','located','assisted','earTried','earCorrect'])safe[name]=s[name]===true;
        if(Array.isArray(s.selected))safe.selected=[...new Set(s.selected.filter(k=>typeof k==='string'&&/^[1-6]\/(?:[0-9]|1[0-6])$/.test(k)))].slice(0,40);
        if(Array.isArray(s.checks))safe.checks=s.checks.slice(0,4).map(x=>x===true);
        if(Array.isArray(s.events)&&!s.events.some(e=>!e||![.5,1,2].includes(e.beats)||!(e.midi===null||C.POSITION.some(p=>p.midi===e.midi)))&&s.events.length<=32&&s.events.reduce((n,e)=>n+e.beats,0)<=8)safe.events=s.events.map(e=>({midi:e.midi,beats:e.beats}));
        if([.5,1,2].includes(s.duration))safe.duration=s.duration;
        state.sessions[step.id]=safe;
      }
    }
    return state;
  }
  function reviewDue(state,part,now=Date.now()){
    return !!state.completedAt[part]&&!state.reviewedAt[part]&&now-state.completedAt[part]>=3*DAY;
  }
  function boot(){
    const el=id=>document.getElementById(id),node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
    let state=clean(null),storageOK=true,review=null,labels='notes',tempo=80,backing='repeat',focusKey=null;
    try{state=clean(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{storageOK=false;}
    const transport=CourseRhythmPlayer.createTransport();let clicks=[];
    const step=()=>C.parts[state.part][state.index[state.part]];
    function session(){const d=step();return state.sessions[d.id]||(state.sessions[d.id]={selected:(d.base||[]).map(p=>p.key),checks:[],events:[],round:0,phase:0,attempts:0,firstCorrect:0});}
    const selected=s=>(s.selected||[]).map(k=>{const [str,fret]=k.split('/').map(Number);return C.point(str,fret);});
    function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}el('b2Storage').textContent=storageOK?'Шаг, ответы и фраза сохраняются в этом браузере. Игру на гитаре вы оцениваете отдельно.':'Сохранение в браузере недоступно. Можно заниматься; после закрытия страницы результаты потеряются.';}
    function feedback(text,good=false){const e=el('b2Feedback');e.textContent=text;e.hidden=!text;e.classList.toggle('answer-success',good);}
    function button(parent,text,fn,{primary=false,disabled=false}={}){const b=node('button',text);b.type='button';b.className='play-btn'+(primary?' primary-btn':'');b.disabled=disabled;b.onclick=fn;parent.appendChild(b);return b;}
    const body=()=>el('b2TaskBody');
    function controls(){const row=node('div');row.className='sandbox-controls';body().appendChild(row);return row;}
    function stop(){transport.stop();clicks.forEach(v=>{try{v?.stop();}catch{}});clicks=[];if(el('b2AudioStatus'))el('b2AudioStatus').textContent='';el('b2Stop').hidden=true;body().querySelectorAll('.is-playing').forEach(e=>e.classList.remove('is-playing'));}
    function at(p){return {boardId:'b2Board',index:(p.str-1)*(FRET_COUNT+1)+p.fret};}
    function note(p){stop();clicks.push(playMidi(p.midi,undefined,.85,.18,at(p)));}
    function play(events,{chord=null,countIn=false,positions=[],onend=null}={}){
      stop();window.courseBlockOne?.stop();stopSequence();el('b2Stop').hidden=false;
      transport.play(events,{tempo,countIn,metronome:countIn,positions,
        accompaniment:chord?{notes:chord,mode:backing}:null,
        onframe:f=>{
          el('b2AudioStatus').textContent=f.countIn!==undefined?`Отсчёт: ${f.countIn+1}`:f.position!==undefined?`Такт ${Math.floor(f.position/4)+1} · доля ${f.beat+1}`:'';
          body().querySelectorAll('[data-phrase-event]').forEach(e=>e.classList.toggle('is-playing',Number(e.dataset.phraseEvent)===f.index));
        },onend:finished=>{el('b2Stop').hidden=true;el('b2AudioStatus').textContent='';body().querySelectorAll('.is-playing').forEach(e=>e.classList.remove('is-playing'));if(finished)onend?.();}
      });
    }
    function listen(points,{together=false,onend=null,countIn=false}={}){
      if(together)play([{midi:null,beats:2}],{chord:points.map(p=>p.midi),onend});
      else play(points.map(p=>({midi:p.midi,beats:1})),{positions:points.map(at),onend,countIn});
    }
    function heard(s){s.heard=true;save();updateNext();}
    function board(points,{range=[0,16],strings=null,onClick=null,show='notes',target=null,fingers=false,interactive=true}={}){
      const wrapper=node('div');wrapper.className='board-outer b2-board-outer';const b=node('div');b.id='b2Board';b.className='board';b.setAttribute('aria-label','Учебный гриф: первая струна сверху');wrapper.appendChild(b);body().appendChild(wrapper);v2RenderBoard(new Map(),b.id);
      const [low,high]=range;b.style.gridTemplateColumns=`38px repeat(${high-low+1},minmax(36px,1fr))`;b.style.minWidth=`${38+(high-low+1)*38}px`;
      b.querySelectorAll('.fret-label').forEach((e,i)=>e.hidden=i<low||i>high);
      b.querySelectorAll('.cell').forEach((cell,i)=>{
        const p=C.point(Math.floor(i/(FRET_COUNT+1))+1,i%(FRET_COUNT+1));cell.hidden=p.fret<low||p.fret>high;if(cell.hidden)return;
        const active=!strings||strings.includes(p.str);if(!active)cell.classList.add('lesson-muted');
        const marked=points.find(n=>n.key===p.key),hit=node('button');hit.type='button';hit.className='sandbox-hit';hit.setAttribute('aria-label',`Струна ${p.str}, лад ${p.fret}`);hit.setAttribute('aria-pressed',String(!!marked));
        const start=focusKey||`${strings?.[0]||6}/${low}`;hit.tabIndex=p.key===start?0:-1;
        hit.onfocus=()=>{focusKey=p.key;b.querySelectorAll('.sandbox-hit').forEach(x=>x.tabIndex=x===hit?0:-1);};
        hit.onkeydown=e=>{const moves={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};if(!moves[e.key])return;e.preventDefault();const [ds,df]=moves[e.key],str=Math.max(1,Math.min(6,p.str+ds)),fret=Math.max(low,Math.min(high,p.fret+df));b.querySelector(`button[aria-label="Струна ${str}, лад ${fret}"]`)?.focus({preventScroll:true});};
        if(marked){const dot=node('span');dot.className='note'+(pc(p.midi)===(step().root||0)?' root':' chord-tone');dot.textContent=show==='degrees'?String(marked.degree||C.POSITION.find(x=>pc(x.midi)===pc(p.midi))?.degree||'·'):show==='intervals'?({0:'1',3:'♭3',4:'3',7:'5'}[pc(p.midi-(step().root||0))]||'·'):show==='hidden'?'?':pitch(p.midi);hit.appendChild(dot);
          if(fingers){const finger=node('small',String(p.fret-6));finger.className='b2-finger';hit.appendChild(finger);}
        }
        if(target===p.key)hit.classList.add('b2-target');
        hit.disabled=!interactive||!active;
        hit.onclick=()=>{focusKey=p.key;if(onClick)onClick(p);else note(p);};cell.appendChild(hit);
      });
      if(!b.querySelector('[tabindex="0"]')){const first=b.querySelector('.sandbox-hit:not(:disabled)');if(first)first.tabIndex=0;}
      const legend=node('p',`Первая струна — тонкая E сверху; шестая — толстая E снизу. 0 — открытая струна. Золотая точка — ${pitch(step().root||0)}.`);legend.className='board-legend';body().appendChild(legend);
      return b;
    }
    function redraw(){const x=scrollX,y=scrollY,focused=focusKey;render();if(focused)el('b2Board')?.querySelector(`button[aria-label="Струна ${focused.split('/')[0]}, лад ${focused.split('/')[1]}"]`)?.focus({preventScroll:true});scrollTo(x,y);}
    function checks(s,texts){s.checks||=[];texts.forEach((text,i)=>{const label=node('label');label.className='lesson-practice';const input=node('input');input.type='checkbox';input.checked=!!s.checks[i];input.onchange=()=>{s.checks[i]=input.checked;save();updateNext();};label.append(input,node('span',text));body().appendChild(label);});}
    function question(s,answers,correct,{onCorrect=null,disabled=false}={}){
      const row=controls();answers.forEach((text,i)=>{const b=button(row,text,()=>{
        stop();s.attempts=(s.attempts||0)+1;s.lastAnswer=i;
        if(i===correct){s.ok=true;feedback('Верно.',true);if(onCorrect){onCorrect();save();return;}}
        else {s.ok=false;feedback('Пока неверно. Обдумайте условие и попробуйте снова.');}
        save();updateNext();
      },{disabled});if(s.lastAnswer===i)b.classList.add(s.ok?'correct-choice':'wrong-choice');});
    }
    function selectTask(d,s,{points=d.points,onPass=null}={}){
      s.selected||=(d.base||[]).map(p=>p.key);
      board(selected(s),{range:d.range,strings:d.strings,onClick:p=>{if((d.base||[]).some(n=>n.key===p.key)){note(p);return;}s.selected=s.selected.includes(p.key)?s.selected.filter(k=>k!==p.key):[...s.selected,p.key];s.ok=false;redraw();note(p);}});
      button(controls(),'Проверить',()=>{
        s.attempts=(s.attempts||0)+1;s.ok=equals(s.selected,points.map(p=>p.key));save();
        feedback(s.ok?'Верно: все точки на своих местах.':'Проверьте число и расположение звуков. Лишнюю точку можно убрать.',s.ok);if(s.ok)onPass?.();updateNext();
      },{primary:true});
      if(s.ok)feedback('Позиция восстановлена.',true);
    }
    function transferTask(d,s,{onPass=null}={}){
      const source=node('p',`Откуда: ${pitch(d.from.midi)}${Math.floor(d.from.midi/12)-1} · ${d.from.key} → струна ${d.target.str}.`);source.className='b2-transfer';body().appendChild(source);
      const marks=s.ok?[d.from,d.target]:[d.from];
      board(marks,{range:[Math.max(0,Math.min(d.from.fret,d.target.fret)-1),Math.min(16,Math.max(d.from.fret,d.target.fret)+1)],onClick:p=>{
        if(p.key===d.from.key){note(p);return;}
        s.attempts=(s.attempts||0)+1;s.ok=p.key===d.target.key;save();redraw();note(p);
        feedback(s.ok?`Одинаковая высота: ${d.from.key} = ${d.target.key}.`:`Найдите тот же звук именно на ${d.target.str}-й струне.`,s.ok);if(s.ok)onPass?.();updateNext();
      }});
      button(controls(),'▶ Сравнить высоты',()=>listen(s.ok?[d.from,d.target]:[d.from]));
    }
    function degreeTask(d,s,{points=d.points,order=d.order,onPass=null}={}){
      s.round=Math.min(s.round||0,order.length);if(s.round===order.length){s.ok=true;feedback('Все ступени названы.',true);onPass?.();return;}
      const p=points[order[s.round]];body().appendChild(node('p',`Вопрос ${s.round+1} из ${order.length}: ${pitch(p.midi)} на ${p.key}. Какая это ступень C major?`));
      board(points,{range:d.range,target:p.key,show:'notes'});
      question(s,['1','2','3','4','5','6','7'],p.degree-1,{onCorrect:()=>{s.round++;s.ok=s.round===order.length;s.lastAnswer=undefined;save();redraw();if(s.ok)onPass?.();}});
    }
    function chordTask(d,s,{onPass=null,exam=false}={}){
      s.selected||=[];const points=selected(s),root=d.root||0;
      if(!['notes','intervals'].includes(labels))labels='notes';
      function edit(next){s.history=(s.history||[]).slice(-15);s.history.push([...s.selected]);s.selected=next;s.ok=false;redraw();}
      const row=controls();for(const [value,text] of [['notes','Ноты'],['intervals','Интервалы аккорда']]){const b=button(row,text,()=>{labels=value;redraw();});b.setAttribute('aria-pressed',String(labels===value));}
      let stringOptions=null;
      if(!exam){const states=node('div');states.className='b2-string-states';body().appendChild(states);
        for(let str=6;str>=1;str--){const slot=node('div');slot.appendChild(node('strong',`Струна ${str}`));const chosen=points.find(p=>p.str===str);slot.appendChild(node('span',chosen?`${chosen.fret===0?'Открытая':'Лад '+chosen.fret} · ${pitch(chosen.midi)}`:'× заглушена'));
          button(slot,'○ Открытая',()=>edit(s.selected.filter(k=>!k.startsWith(str+'/')).concat(`${str}/0`)));button(slot,'× Заглушить',()=>edit(s.selected.filter(k=>!k.startsWith(str+'/'))));states.appendChild(slot);
        }
        stringOptions=node('details');stringOptions.className='audio-options';stringOptions.appendChild(node('summary','Открытые / заглушённые струны'));stringOptions.appendChild(states);
      }
      board(points,{range:d.range||[0,7],show:labels,onClick:p=>{const exists=s.selected.includes(p.key),next=s.selected.filter(k=>!k.startsWith(p.str+'/'));if(!exists)next.push(p.key);edit(next);note(p);}});
      if(stringOptions)body().appendChild(stringOptions);
      const detail=node('p',points.length?'Звучит: '+points.slice().sort((a,b)=>b.str-a.str).map(p=>pitch(p.midi)).join('–'):'Все струны заглушены. Выберите звуки.');body().appendChild(detail);
      const actions=controls();
      button(actions,'▶ Вместе',()=>listen(points,{together:true}),{disabled:!points.length});button(actions,'▶ Арпеджио',()=>listen(points.slice().sort((a,b)=>a.midi-b.midi)),{disabled:!points.length});
      button(actions,'Отменить',()=>{s.selected=s.history.pop();s.ok=false;redraw();},{disabled:!s.history?.length});
      button(actions,'Сброс',()=>edit([]));
      button(actions,'Проверить аккорд',()=>{const r=chordResult(selected(s),root,d.quality||'maj',nameChord);s.ok=r.valid;s.attempts=(s.attempts||0)+1;save();feedback(exam&&!r.valid?'Проверьте состав аккорда и попробуйте ещё раз.':r.text,r.valid);if(r.valid)onPass?.();updateNext();},{primary:true});
    }
    function earTask(d,s,{onPass=null,exam=false}={}){
      const landing=d.kind==='earLanding',total=exam?1:4;s.round=Math.min(s.round||0,total);
      if(s.round===total){s.ok=true;feedback(`Слуховая практика завершена. С первой попытки: ${s.firstCorrect||0} из ${total}.`,true);onPass?.();return;}
      const qualities=[false,true,true,false],ends=[52,50,55,57],minor=exam||qualities[s.round],end=ends[s.round];
      body().appendChild(node('p',`Пример ${s.round+1} из ${total}. Гриф скрыт.`));
      const row=controls();
      button(row,'▶ Послушать пример',()=>{
        s.heard=false;save();body().querySelectorAll('[data-ear-answer]').forEach(b=>b.disabled=true);
        const events=landing?[{midi:48,beats:1},{midi:50,beats:1},{midi:55,beats:1},{midi:end,beats:1}]:[{midi:null,beats:2}];
        play(events,{chord:landing?[48,52,55]:[48,minor?51:52,55],onend:()=>{heard(s);body().querySelectorAll('[data-ear-answer]').forEach(b=>b.disabled=false);}});
      });
      const answers=landing?['На звуке аккорда','На другом звуке гаммы']:['Мажор','Минор'],correct=landing?([0,4,7].includes(pc(end))?0:1):(minor?1:0);
      answers.forEach((text,i)=>{const b=button(row,text,()=>{
        if(!s.heard)return;stop();const ok=i===correct;s.attempts=(s.attempts||0)+1;
        if(ok){if(!s.earTried)s.firstCorrect=(s.firstCorrect||0)+1;s.earCorrect=true;feedback('Верно.',true);next.hidden=false;}
        else {s.earTried=true;feedback('Пока неверно. Послушайте ещё раз и сравните.');}save();
      },{disabled:!s.heard});b.dataset.earAnswer=String(i);});
      const next=button(controls(),s.round===total-1?'Завершить слуховую практику':'Следующий пример',()=>{if(!s.earCorrect)return;s.round++;s.heard=false;s.earTried=false;s.earCorrect=false;save();redraw();},{primary:true});next.hidden=!s.earCorrect;
    }
    function composer(d,s){
      s.events||=[];s.duration||=1;s.checks||=[];const total=s.events.reduce((n,e)=>n+e.beats,0);
      body().appendChild(node('p',`Заполнено ${total} из 8 долей · 2 такта 4/4`));
      const row=controls();for(const [value,text] of [[.5,'Восьмая · ½ доли'],[1,'Четверть · 1 доля'],[2,'Половинная · 2 доли']]){const b=button(row,text,()=>{s.duration=value;redraw();});b.setAttribute('aria-pressed',String(value===s.duration));}
      function append(midi){if(total+s.duration>8){feedback('Два такта заполнены. Уберите последнее событие или выберите меньшую длительность.');return;}s.events.push({midi,beats:s.duration});s.ok=false;s.checks=[];redraw();}
      button(row,'Добавить паузу',()=>append(null));
      board(C.POSITION,{range:[7,10],strings:[6,5,4],onClick:p=>{if(!C.POSITION.some(n=>n.key===p.key)){feedback('Выберите одну из нот позиции C major.');return;}append(p.midi);note(p);}});
      const timeline=node('ol');timeline.className='b2-phrase';timeline.setAttribute('aria-label','События фразы');
      s.events.forEach((e,i)=>{const item=node('li',`${e.midi===null?'Пауза':pitch(e.midi)} · ${e.beats===.5?'½':e.beats} доли`);item.style.gridColumn=`span ${e.beats*2}`;item.dataset.phraseEvent=String(i);timeline.appendChild(item);});body().appendChild(timeline);
      const actions=controls();button(actions,'Убрать последнее',()=>{s.events.pop();s.checks=[];redraw();},{disabled:!s.events.length});button(actions,'Очистить фразу',()=>{s.events=[];s.checks=[];redraw();},{disabled:!s.events.length});
      const accompaniment=node('label','Сопровождение '),select=node('select');[['repeat','Повторять C каждый такт'],['sustain','Тянуть C под всей фразой']].forEach(([v,t])=>{const o=node('option',t);o.value=v;select.appendChild(o);});select.value=backing;select.onchange=()=>{backing=select.value;stop();};accompaniment.appendChild(select);actions.appendChild(accompaniment);
      button(actions,'▶ Фраза + C major',()=>play(s.events,{chord:[48,52,55],countIn:true,positions:s.events.map(e=>{const p=C.POSITION.find(p=>p.midi===e.midi);return p?at(p):null;})}),{disabled:!s.events.length});
      checks(s,['Я пропел и сыграл фразу поверх C major.','Я сохранил пульс и осознанно завершил фразу на C, E или G.']);
      button(controls(),'Проверить фразу',()=>{const issue=phraseCheck(s.events);s.ok=!issue&&s.checks.every(Boolean)&&s.checks.length===2;feedback(issue||(!s.ok?'Сыграйте фразу на гитаре и отметьте самопроверку.':'Фраза готова: два такта и окончание на звуке аккорда.'),s.ok);save();updateNext();},{primary:true});
    }
    function exam(d,s){
      const a=d.kind==='examA',phase=s.phase||0;
      const progress=node('p',`Часть проверки ${phase+1} из ${a?4:5}`);body().appendChild(progress);
      function pass(){s.phase=phase+1;s.ok=false;s.selected=[];s.round=0;s.checks=[];s.lastAnswer=undefined;s.heard=false;save();redraw();}
      const advance=()=>{const b=button(controls(),'К следующей части проверки',pass,{primary:true});return b;};
      if(phase===0){
        el('b2Instruction').textContent=a?'Восстановите восемь точек позиции C major.':'Соберите C major на трёх или более струнах без посторонних звуков.';
        if(a)selectTask({...d,points:C.POSITION,strings:[6,5,4]},s,{onPass:()=>advance()});
        else chordTask({root:0,range:[0,4]},s,{exam:true,onPass:()=>advance()});
      }else if(a&&phase===1){
        degreeTask({...d,points:C.POSITION,order:[5,1,6,3]},s,{onPass:()=>{if(!body().querySelector('.b2-exam-advance')){const b=advance();b.classList.add('b2-exam-advance');}}});
      }else if(a&&phase===2){
        el('b2Instruction').textContent='Найдите звук с третьей струны, седьмого лада на второй струне.';
        transferTask({from:C.point(3,7),target:C.point(2,3)},s,{onPass:()=>advance()});
      }else if(!a&&phase===1){
        el('b2Instruction').textContent='В C–E–G понизили E на полутон. Что получилось?';question(s,['C minor: C–E♭–G','C major: состав не изменился','Другая октава C major'],0,{onCorrect:pass});
      }else if(!a&&phase===2){
        el('b2Instruction').textContent='Что такое арпеджио C major?';question(s,['Любые ноты гаммы C major','Последовательное исполнение звуков C–E–G','Только одновременное C–E–G'],1,{onCorrect:pass});
      }else if(!a&&phase===3){earTask({kind:'earQuality'},s,{exam:true,onPass:()=>{const b=advance();b.classList.add('b2-exam-advance');}});
      }else{
        el('b2Instruction').textContent='Уберите подсказки и проверьте себя на настоящем инструменте.';
        checks(s,a?['Я сыграл позицию C major вверх и вниз по памяти.','Я назвал ступени и перенёс одинаковую высоту на соседнюю струну.']:['Я сыграл C major и C minor, объяснив роль терции.','Я сыграл C–E–G вместе и как арпеджио.','Я сыграл свою фразу под C major, сохранив пульс.']);
      }
    }
    function ready(d=step(),s=session()){
      if(d.kind==='examA'||d.kind==='examB')return (s.phase||0)>=(d.kind==='examA'?3:4)&&s.checks?.length===(d.kind==='examA'?2:3)&&s.checks.every(Boolean);
      if(d.kind==='practice')return s.checks?.length===d.checks.length&&s.checks.every(Boolean);
      if(d.kind==='learn')return !!s.heard;
      if(d.kind==='compose')return !!s.ok&&!phraseCheck(s.events)&&s.checks?.length===2&&s.checks.every(Boolean);
      return s.ok===true;
    }
    function updateNext(){el('b2Next').disabled=!ready();el('b2NextHelp').textContent=ready()?'':step().kind==='learn'?'Послушайте пример перед продолжением.':'Выполните задание, затем переходите дальше.';}
    function render(){
      stop();const d=step(),s=session();save();const index=state.index[state.part],list=C.parts[state.part];
      el('b2Crumb').textContent=`Блок 2${state.part.toUpperCase()} · ${review?'Повторная проверка':`Шаг ${index+1} из ${list.length}`}`;
      el('b2Title').textContent=d.title;el('b2Text').textContent=d.text;el('b2Instruction').textContent=d.instruction;el('b2Why').hidden=!d.why;el('b2WhyText').textContent=d.why||'';el('b2Why').open=false;
      el('b2StepProgress').max=list.length;el('b2StepProgress').value=index+1;el('b2Back').disabled=index===0||!!review;el('b2Next').textContent=index===list.length-1?review?'Завершить повторение':`Завершить блок 2${state.part.toUpperCase()}`:'Дальше →';
      el('b2Hint').hidden=['examA','examB','earQuality','earLanding','practice','learn'].includes(d.kind);
      body().replaceChildren();feedback('');
      if(d.kind==='select')selectTask(d,s);
      else if(d.kind==='transfer')transferTask(d,s);
      else if(d.kind==='degrees')degreeTask(d,s);
      else if(d.kind==='choice'){
        if(d.points)board(d.points,{range:d.range});
        if(d.listenRequired)button(controls(),'▶ Послушать две C',()=>listen(d.points,{onend:()=>{heard(s);redraw();}}));
        question(s,d.answers,d.correct,{disabled:d.listenRequired&&!s.heard});
      }else if(d.kind==='learn'||d.kind==='practice'){
        if(!['notes','degrees'].includes(labels))labels='notes';
        if(d.degreeToggle){const row=controls();for(const [v,t] of [['notes','Ноты'],['degrees','Ступени']]){const b=button(row,t,()=>{labels=v;redraw();});b.setAttribute('aria-pressed',String(labels===v));}}
        board(d.points,{range:d.range,show:d.degreeToggle?labels:'notes',fingers:d.fingers});
        if(d.fingers)body().appendChild(node('p','Пальцы: 2–4 / 1–2–4 / 1–3–4. Указательный — на 7-м ладу.'));
        const row=controls();button(row,d.chord?'▶ Вместе':'▶ Вверх и вниз',()=>listen(d.chord?d.points:[...d.points,...d.points.slice(0,-1).reverse()],{together:!!d.chord,onend:()=>heard(s)}));
        if(d.chord)button(row,'▶ Арпеджио',()=>listen(d.points,{onend:()=>heard(s)}));
        if(d.kind==='practice')checks(s,d.checks);
        if(d.id==='a-practice'){
          const extra=node('details');extra.className='lesson-purpose';extra.appendChild(node('summary','Дополнительно: сдвиг на два лада'));extra.appendChild(node('p','Если сдвинуть все точки позиции на два лада вверх, какая гамма получится? Сначала ответьте, затем послушайте.'));
          const result=node('p');result.setAttribute('role','status');
          for(const text of ['C major','D major','C minor'])button(extra,text,()=>{const ok=text==='D major';result.textContent=ok?'Верно: D major. То есть ре мажор: тоника поднялась с C до D, а расстояния между звуками сохранились.':'Проверьте: что случилось с тоникой C, когда её подняли на два лада?';compare.disabled=!ok;});
          const compare=button(extra,'▶ Сравнить до и после',()=>listen([...C.POSITION,...C.POSITION.map(p=>({...p,fret:p.fret+2,midi:p.midi+2,key:`${p.str}/${p.fret+2}`}))]),{disabled:true});extra.appendChild(result);body().appendChild(extra);
        }
      }else if(d.kind==='pack'){
        s.round=Math.min(s.round||0,C.POSITION.length);const target=C.POSITION[s.round];
        if(!target){s.ok=true;board(C.POSITION,{range:d.range,show:'degrees'});feedback('Те же восемь высот собраны в позиции.',true);}
        else {const source=C.LINE[s.round];body().appendChild(node('p',`${s.round+1}/8 · ${source.name}${Math.floor(source.midi/12)-1}: ${source.key} → струна ${target.str}, лады 7–10.`));board(C.POSITION.slice(0,s.round),{range:d.range,strings:[6,5,4],show:'degrees',onClick:p=>{s.attempts=(s.attempts||0)+1;if(p.key===target.key){s.round++;s.ok=s.round===8;save();redraw();note(p);}else{note(p);feedback('Высота должна остаться той же. Проверьте струну и перенос на пять ладов.');save();}}});}
      }else if(d.kind==='repair'){
        const marks=s.ok?d.points:d.points.map(p=>p.key===d.target.key?d.bad:p);
        el('b2Instruction').textContent=s.located?'Теперь выберите правильное место для G на той же струне.':d.instruction;
        board(marks,{range:d.range,strings:[6,5,4],onClick:p=>{s.attempts=(s.attempts||0)+1;if(!s.located){s.located=p.key===d.bad.key;redraw();feedback(s.located?'Ошибка найдена. Теперь исправьте её.':'Проверьте порядок нот и расстояния.');}else{s.ok=p.key===d.target.key;redraw();feedback(s.ok?'Верно: на пятой струне, десятом ладу — G.':'Пока неверно. Найдите G на пятой струне.',s.ok);}note(p);save();updateNext();}});
      }else if(d.kind==='lowerThird'){
        const minor=[C.LOW[0],C.point(4,1),C.LOW[2]];board(s.ok?minor:C.LOW,{range:d.range,onClick:p=>{s.ok=p.key==='4/1';redraw();if(s.ok)listen(minor,{together:true});else note(p);feedback(s.ok?'Получилось C minor: C–E♭–G.':'Понизьте E с 4/2 ровно на один лад.',s.ok);save();updateNext();}});
        const row=controls();button(row,'▶ C major',()=>listen(C.LOW,{together:true}));button(row,'▶ C minor',()=>listen(minor,{together:true}),{disabled:!s.ok});
      }else if(d.kind==='chord')chordTask(d,s);
      else if(d.kind==='earQuality'||d.kind==='earLanding')earTask(d,s);
      else if(d.kind==='compose')composer(d,s);
      else if(d.kind==='examA'||d.kind==='examB')exam(d,s);
      updateNext();save();
    }
    function reminders(){
      for(const container of document.querySelectorAll('[data-b2-reviews]')){
        container.replaceChildren();container.hidden=true;
        for(const part of ['a','b'])if(reviewDue(state,part)){
          container.hidden=false;container.appendChild(node('p',`Блок 2${part.toUpperCase()}: проверьте, что осталось. Пройдите короткую проверку без подсказок.`));
          button(container,'Проверить 2'+part.toUpperCase(),()=>{review=part;const list=C.parts[part];delete state.sessions[list.at(-1).id];open(part,list.length-1,true);},{primary:true});
        }
      }
    }
    function overview(){
      for(const part of ['a','b']){
        const list=C.parts[part],done=list.filter(d=>state.done[d.id]).length;el('b2Status'+part).textContent=`Выполнено ${done} из ${list.length} шагов${state.completedAt[part]?' · Блок пройден':''}`;
        const resume=el('b2Resume'+part);resume.textContent=state.completedAt[part]?'Повторить блок':done||state.index[part]?'Продолжить со своего шага':'Начать блок 2'+part.toUpperCase();resume.onclick=()=>open(part);
        const links=el('b2Steps'+part);links.replaceChildren();list.forEach((d,i)=>{const b=button(links,`${state.done[d.id]?'✓ ':''}${i+1}. ${d.title}`,()=>open(part,i));b.className='play-btn b2-step-link';});
      }
      reminders();
    }
    function open(part='a',index=null,keepReview=false){
      if(!C.parts[part])return;stop();if(!keepReview)review=null;state.part=part;if(Number.isInteger(index))state.index[part]=Math.max(0,Math.min(index,C.parts[part].length-1));
      el('tab-block2').click();el('b2Overview').hidden=true;el('b2Work').hidden=false;focusKey=null;render();el('b2Title').focus({preventScroll:true});el('b2Work').scrollIntoView({block:'start'});
    }
    el('b2Next').onclick=()=>{
      if(!ready())return;stop();const part=state.part,list=C.parts[part],d=step();
      if(review){const at=Date.now();state.reviewedAt[part]=at;state.reviewResults[part]={at,attempts:session().attempts||0,practiceConfirmed:true};review=null;save();el('b2Work').hidden=true;el('b2Overview').hidden=false;overview();return;}
      state.done[d.id]=true;
      if(state.index[part]<list.length-1){state.index[part]++;focusKey=null;render();el('b2Title').focus({preventScroll:true});el('b2Work').scrollIntoView({block:'start'});}
      else {if(list.every(d=>state.done[d.id])&&!state.completedAt[part])state.completedAt[part]=Date.now();save();el('b2Work').hidden=true;el('b2Overview').hidden=false;overview();el('b2Status'+part).focus({preventScroll:true});}
      save();overview();
    };
    el('b2Back').onclick=()=>{if(state.index[state.part]===0)return;state.index[state.part]--;focusKey=null;render();};
    el('b2Route').onclick=()=>{stop();review=null;el('b2Work').hidden=true;el('b2Overview').hidden=false;overview();};
    el('b2Retry').onclick=()=>{delete state.sessions[step().id];render();};
    el('b2Hint').onclick=()=>{const d=step(),s=session();s.assisted=true;save();const p=d.kind==='pack'?C.POSITION[s.round||0]:d.target;feedback(p?`Проверьте перенос: нужна струна ${p.str}, лад ${p.fret}.`:(d.kind==='chord'?`Нужны ${[0,d.quality==='min'?3:4,7].map(n=>pitch((d.root||0)+n)).join('–')}.`:d.kind==='select'?`Нужны ${d.points.length} точек: ${d.points.map(p=>p.key).join(', ')}.`:d.why||'Сравните последовательность со знакомой гаммой.'));};
    el('b2Stop').onclick=stop;
    el('b2Tempo').onchange=e=>{tempo=Math.max(40,Math.min(120,Number(e.target.value)||80));e.target.value=tempo;stop();};
    document.querySelectorAll('[role="tab"]').forEach(tab=>tab.addEventListener('click',()=>{stop();if(tab.id==='tab-block2'){el('b2Overview').hidden=false;el('b2Work').hidden=true;overview();}}));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else reminders();});window.addEventListener('pagehide',stop);window.addEventListener('focus',reminders);
    save();overview();
    if(new URLSearchParams(location.search).get('block')==='2')el('tab-block2').click();
    return {open,stop,getState:()=>structuredClone(state)};
  }
  return {KEY,DAY,equals,chordResult,phraseCheck,clean,reviewDue,boot};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CourseBlockTwo;
else window.courseBlockTwo=CourseBlockTwo.boot();
