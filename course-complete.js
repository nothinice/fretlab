/* Shared course route. Screen answers and guitar self-reports remain distinct. */
const CourseComplete=(()=>{
  const Content=typeof module!=='undefined'&&module.exports?require('./course-complete-content.js'):CourseCompleteContent;
  const KEY='fretlab-complete-v1',DAY=86400000,OPEN={1:64,2:59,3:55,4:50,5:45,6:40};
  const pc=n=>(n%12+12)%12;
  const point=(str,fret)=>({str,fret,midi:OPEN[str]+fret,key:`${str}/${fret}`});
  const pitch=n=>['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][pc(n)];
  const coord=p=>`${p.str}/${p.fret}`;
  function validFingering(e){return e.midi!==null&&Number.isInteger(e.str)&&!!OPEN[e.str]&&Number.isInteger(e.fret)&&e.fret>=0&&e.fret<=16&&OPEN[e.str]+e.fret===e.midi;}
  function withFingering(d,e){
    if(e.midi===null)return {midi:null,beats:e.beats};
    const p=validFingering(e)?e:(d.points||[]).find(p=>p.midi===e.midi&&validFingering(p));
    return {midi:e.midi,beats:e.beats,...(p?{str:p.str,fret:p.fret,...(Number.isInteger(p.finger)?{finger:p.finger}:{})}:{})};
  }
  function validateSelection(d,points){
    if(!Array.isArray(points)||points.some(p=>!Number.isInteger(p.str)||!OPEN[p.str]||!Number.isInteger(p.fret)||p.fret<0||p.fret>16||p.midi!==OPEN[p.str]+p.fret))return 'Проверьте положение звуков на грифе.';
    if(d.onePerString&&new Set(points.map(p=>p.str)).size!==points.length)return 'На каждой струне оставьте один звук.';
    const target=d.targetKeys||d.target;
    if(target){const keys=points.map(coord);if(keys.length!==target.length||new Set(keys).size!==keys.length||!target.every(k=>keys.includes(k)))return 'Проверьте состав и расположение. Лишнюю точку можно убрать.';}
    if(d.targetPcs){const pcs=[...new Set(points.map(p=>pc(p.midi)))];if(pcs.length!==d.targetPcs.length||!d.targetPcs.every(n=>pcs.includes(pc(n))))return 'Проверьте, все ли нужные звуки выбраны и нет ли посторонних.';}
    return '';
  }
  function validatePhrase(d,events){
    if(!Array.isArray(events)||events.length>128||events.some(e=>!e||![.5,1,2,4].includes(e.beats)||!(e.midi===null||d.allowedMidi.includes(e.midi))))return 'Используйте предложенные ноты и длительности.';
    const total=events.reduce((n,e)=>n+e.beats,0),length=d.bars*4,notes=events.filter(e=>e.midi!==null);
    if(total!==length)return `Заполните ${length} долей: сейчас ${total}.`;
    if(notes.length<2)return 'Добавьте хотя бы два звучащих события.';
    if(d.endPcs&&!d.endPcs.includes(pc(notes.at(-1).midi)))return 'Проверьте последний звучащий звук: он должен подходить к окончанию задания.';
    let offset=0;const timed=events.map(e=>{const n={...e,at:offset};offset+=e.beats;return n;});let lower=0;
    for(const landing of d.landings||[]){
      const last=timed.filter(e=>e.midi!==null&&e.at+e.beats>lower&&e.at<landing.atBeat).at(-1);
      if(!last||!landing.pcs.includes(pc(last.midi)))return `В конце участка до ${landing.atBeat}-й доли выберите звук текущего аккорда.`;
      lower=landing.atBeat;
    }
    return '';
  }
  function validateSequence(d,sequence){
    if(!Array.isArray(sequence)||sequence.length!==d.targetMidi.length||sequence.some((n,i)=>n!==d.targetMidi[i]))return 'Проверьте порядок звуков: переносите рисунок на следующую ступень гаммы.';
    return '';
  }
  function drop2(voices){if(!Array.isArray(voices)||voices.length!==4||voices.some(n=>!Number.isInteger(n)||n<12||n>127)||new Set(voices).size!==4)throw Error('Нужны четыре разных высоты');const sorted=[...voices].sort((a,b)=>a-b);sorted[2]-=12;return sorted.sort((a,b)=>a-b);}
  function cleanState(raw,modules=Content.modules){
    const state={version:1,module:modules[0]?.id||'3',index:{},sessions:{},done:{},records:{}};
    if(raw?.version!==1)return state;
    if(modules.some(m=>m.id===raw.module))state.module=raw.module;
    for(const m of modules){
      state.index[m.id]=Number.isInteger(raw.index?.[m.id])?Math.max(0,Math.min(m.steps.length-1,raw.index[m.id])):0;
      const r=raw.records?.[m.id];if(r&&Number.isFinite(r.completedAt)&&r.completedAt>0){state.records[m.id]={completedAt:r.completedAt};if(Number.isFinite(r.reviewedAt)&&r.reviewedAt>=r.completedAt)state.records[m.id].reviewedAt=r.reviewedAt;}
      for(const d of m.steps){
        if(raw.done?.[d.id]===true)state.done[d.id]=true;
        const s=raw.sessions?.[d.id];if(!s||typeof s!=='object')continue;
        const safe={};
        for(const name of ['heard','checked','assisted','earTried'])safe[name]=s[name]===true;
        for(const name of ['round','answer','attempts','firstCorrect'])if(Number.isInteger(s[name])&&s[name]>=0&&s[name]<=1000)safe[name]=s[name];
        if(Array.isArray(s.selected))safe.selected=[...new Set(s.selected.filter(k=>typeof k==='string'&&/^[1-6]\/(?:[0-9]|1[0-6])$/.test(k)))].slice(0,64);
        if(Array.isArray(s.events)&&d.type==='compose'&&s.events.length<=128&&s.events.every(e=>e&&[.5,1,2,4].includes(e.beats)&&(e.midi===null||d.allowedMidi.includes(e.midi)))&&s.events.reduce((n,e)=>n+e.beats,0)<=d.bars*4)safe.events=s.events.map(e=>validFingering(e)?withFingering(d,e):({midi:e.midi,beats:e.beats}));
        if(s.recommendedFingering===true)safe.recommendedFingering=true;
        if(Number.isFinite(s.tempo)&&s.tempo>=40&&s.tempo<=120)safe.tempo=s.tempo;
        if(d.type==='sequence'&&Array.isArray(s.sequence)&&s.sequence.length<=d.targetMidi.length&&s.sequence.every(n=>d.allowedMidi.includes(n)))safe.sequence=[...s.sequence];
        if(Array.isArray(s.voices)&&s.voices.length===4&&s.voices.every(n=>Number.isInteger(n)&&n>=0&&n<=127))safe.voices=[...s.voices];
        if(Array.isArray(s.checks))safe.checks=s.checks.slice(0,8).map(v=>v===true);
        if([.5,1,2,4].includes(s.duration))safe.duration=s.duration;
        state.sessions[d.id]=safe;
      }
    }
    return state;
  }
  const reviewDue=(r,now=Date.now())=>!!r?.completedAt&&!r.reviewedAt&&now-r.completedAt>=3*DAY;
  function boot(){
    const el=id=>document.getElementById(id),node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
    let state=cleanState(null),canStore=true,tempo=80,review=null,reviewIndex=0,focusKey=null;
    try{state=cleanState(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{canStore=false;}
    const transport=CourseRhythmPlayer.createTransport();let clicks=[],homeMessage='',tabView=null;
    const module=()=>Content.modules.find(m=>m.id===state.module)||Content.modules[0];
    const step=()=>review?module().steps[review[reviewIndex]]:module().steps[state.index[module().id]||0];
    function session(){const d=step();return state.sessions[d.id]||(state.sessions[d.id]={selected:[...(d.base||d.fromPoints?.map(coord)||[])],events:[],voices:d.voices?[...d.voices]:undefined,checks:[],round:0,attempts:0,firstCorrect:0});}
    const selected=s=>(s.selected||[]).map(k=>point(...k.split('/').map(Number)));
    function save(){try{localStorage.setItem(KEY,JSON.stringify(state));canStore=true;}catch{canStore=false;}el('courseStorage').textContent=canStore?'Ваш шаг и собственные работы сохраняются в этом браузере.':'Хранилище браузера недоступно: занятие работает, но после закрытия страницы результаты не сохранятся.';}
    function button(parent,text,fn,disabled=false){const b=node('button',text);b.type='button';b.className='play-btn'+(text.startsWith('Проверить')?' course-check-action':'');b.disabled=disabled;b.onclick=fn;parent.appendChild(b);return b;}
    const body=()=>el('courseStepBody');
    function row(parent=body()){const n=node('div');n.className='sandbox-controls';parent.appendChild(n);return n;}
    function feedback(text,ok=false){el('courseStepFeedback').textContent=text;el('courseStepFeedback').hidden=!text;el('courseStepFeedback').classList.toggle('answer-success',ok);}
    function stop(){transport.stop();clicks.forEach(v=>{try{v?.stop();}catch{}});clicks=[];el('courseStop').hidden=true;el('courseAudioStatus').textContent='';body().querySelectorAll('.is-playing').forEach(n=>n.classList.remove('is-playing'));}
    const at=p=>({boardId:'courseBoard',index:(p.str-1)*(FRET_COUNT+1)+p.fret});
    function play(audio,onend=null){
      stop();window.courseBlockOne?.stop();window.courseBlockTwo?.stop();window.coursePractice?.stop();stopSequence();el('courseStop').hidden=false;
      const points=step().points||[];
      transport.play(audio.events,{tempo,countIn:audio.countIn===true,metronome:audio.countIn===true,progression:audio.progression||[],positions:audio.events.map(e=>{const p=validFingering(e)?e:points.find(p=>p.midi===e.midi);return p?at(p):null;}),onframe:f=>{
        tabView?.highlight(f.index??-1);
        const active=(audio.progression||[]).find(c=>f.position>=c.atBeat&&f.position<c.atBeat+c.beats);
        el('courseAudioStatus').textContent=f.countIn!==undefined?`Отсчёт ${f.countIn+1}`:f.position!==undefined?`Такт ${Math.floor(f.position/4)+1} · доля ${f.beat+1}${active?.label?' · '+active.label:''}`:'';
        body().querySelectorAll('[data-event]').forEach(n=>n.classList.toggle('is-playing',Number(n.dataset.event)===f.index));
        body().querySelectorAll('[data-chord]').forEach(n=>n.classList.toggle('is-playing',Number(n.dataset.chord)===(audio.progression||[]).indexOf(active)));
      },onend:finished=>{el('courseStop').hidden=true;el('courseAudioStatus').textContent='';tabView?.highlight(-1);body().querySelectorAll('.is-playing').forEach(n=>n.classList.remove('is-playing'));if(finished)onend?.();}});
    }
    function note(p){stop();clicks.push(playMidi(p.midi,undefined,.7,.16,at(p)));}
    function board(points,{range=step().range||[0,12],onClick=null,ghosts=[]}={}){
      const outer=node('div');outer.className='board-outer';const board=node('div');board.id='courseBoard';board.className='board';outer.appendChild(board);body().appendChild(outer);v2RenderBoard(new Map(),board.id);
      const [low,high]=range;board.style.gridTemplateColumns=`38px repeat(${high-low+1},minmax(36px,1fr))`;board.style.minWidth=`${38+(high-low+1)*38}px`;
      board.querySelectorAll('.fret-label').forEach((n,f)=>n.hidden=f<low||f>high);
      board.querySelectorAll('.cell').forEach((cell,i)=>{
        const p=point(Math.floor(i/17)+1,i%17);cell.hidden=p.fret<low||p.fret>high;if(cell.hidden)return;
        const marked=points.find(n=>coord(n)===p.key),hit=node('button');hit.type='button';hit.className='sandbox-hit';hit.setAttribute('aria-label',`Струна ${p.str}, лад ${p.fret}`);hit.setAttribute('aria-pressed',String(!!marked));hit.tabIndex=p.key===(focusKey||`6/${low}`)?0:-1;
        hit.onfocus=()=>{focusKey=p.key;board.querySelectorAll('.sandbox-hit').forEach(n=>n.tabIndex=n===hit?0:-1);};
        hit.onkeydown=e=>{const moves={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};if(!moves[e.key])return;e.preventDefault();const [ds,df]=moves[e.key],str=Math.max(1,Math.min(6,p.str+ds)),fret=Math.max(low,Math.min(high,p.fret+df));board.querySelector(`[aria-label="Струна ${str}, лад ${fret}"]`)?.focus({preventScroll:true});};
        if(marked){const dot=node('span',marked.label||pitch(p.midi));dot.className='note'+(pc(p.midi)===(step().rootPc||0)?' root':' chord-tone');hit.appendChild(dot);}
        const ghost=ghosts.find(n=>coord(n)===p.key);if(ghost&&!marked){const outline=node('span',ghost.label||pitch(ghost.midi));outline.className='course-ghost-note';outline.setAttribute('aria-hidden','true');hit.appendChild(outline);}
        hit.onclick=()=>{focusKey=p.key;if(onClick)onClick(p);else note(p);};cell.appendChild(hit);
      });
      if(!board.querySelector('[tabindex="0"]')){const first=board.querySelector('.sandbox-hit');if(first)first.tabIndex=0;}
      const legend=node('p','Первая струна — тонкая E сверху. 0 — открытая струна. Золотой цвет — тоника текущего примера.'+(ghosts.length?' Контурные точки показывают прежнее положение звуков.':''));legend.className='board-legend';body().appendChild(legend);
    }
    function redraw(){const x=scrollX,y=scrollY,active=document.activeElement,label=active?.tagName==='BUTTON'&&body().contains(active)&&!active.classList.contains('sandbox-hit')?active.textContent:null;render();if(label){[...body().querySelectorAll('button')].find(b=>b.textContent===label&&!b.disabled)?.focus({preventScroll:true});}else if(focusKey){const [str,fret]=focusKey.split('/');el('courseBoard')?.querySelector(`[aria-label="Струна ${str}, лад ${fret}"]`)?.focus({preventScroll:true});}scrollTo(x,y);}
    function ready(){const d=step(),s=session();
      if(d.type==='learn')return !d.audio||s.heard===true;
      if(d.type==='choice')return s.answer===d.correct;
      if(d.type==='select')return s.checked&&!validateSelection(d,selected(s));
      if(d.type==='transition')return s.checked&&!validateSelection(d,selected(s));
      if(d.type==='sequence')return s.checked&&!validateSequence(d,s.sequence);
      if(d.type==='ear')return s.round>=(d.samples?.length||1);
      if(d.type==='voicing')return s.checked&&JSON.stringify(s.voices)===JSON.stringify(d.targetVoices);
      if(d.type==='practice')return s.checks?.length===d.checks.length&&s.checks.every(Boolean);
      if(d.type==='compose')return s.checked&&!validatePhrase(d,s.events)&&s.checks?.length===2&&s.checks.every(Boolean);
      return false;
    }
    function update(){const d=step(),s=session(),ok=ready();el('courseNext').disabled=!ok;let reason='';if(!ok){
      if(d.type==='compose')reason=validatePhrase(d,s.events||[])||(!s.checked?'Нажмите «Проверить фразу».':'Фраза проверена. Сыграйте её на гитаре и отметьте два пункта самопроверки.');
      else if(d.type==='practice')reason='После игры на гитаре отметьте выполненные пункты самопроверки.';
      else if(d.type==='learn')reason='Послушайте пример перед продолжением.';
      else if(d.type==='ear')reason='Прослушайте примеры и ответьте на вопросы.';
      else reason='Выполните задание перед переходом дальше.';
    }el('courseNextHelp').textContent=reason;save();}
    function checks(labels){const s=session();s.checks||=[];labels.forEach((text,i)=>{const label=node('label');label.className='lesson-practice';const check=node('input');check.type='checkbox';check.checked=!!s.checks[i];check.onchange=()=>{s.checks[i]=check.checked;update();};label.append(check,node('span',text));body().appendChild(label);});}
    function exportProject(){
      const d=step(),s=session(),data={format:'fretlab-own-phrase-v1',module:module().id,step:d.id,tempo,events:s.events,progression:d.progression||[],savedAt:new Date().toISOString()};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download=`fretlab-my-phrase-${module().id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    function progressionView(segments){const diagram=node('div');diagram.className='course-progression';segments.forEach((c,i)=>{const chip=node('span',`${c.label||'Аккорд'} · ${c.beats/4} такт`);chip.dataset.chord=String(i);diagram.appendChild(chip);});body().appendChild(diagram);}
    function render(){
      stop();tabView?.destroy();tabView=null;const m=module(),d=step(),s=session(),index=review?reviewIndex:state.index[m.id]||0,total=review?review.length:m.steps.length;
      tempo=s.tempo||80;el('courseTempo').value=tempo;
      el('courseStepTitle').textContent=d.title;el('courseBreadcrumb').textContent=`Блок ${m.id} · ${review?'Повторение · ':''}${index+1} / ${total}`;el('courseStepText').textContent=d.text;el('courseStepInstruction').textContent=d.instruction;
      const missing=m.steps.filter(x=>x.id!==d.id&&!state.done[x.id]).length;
      el('courseWhy').hidden=!d.why;el('courseWhy').open=false;el('courseWhyText').textContent=d.why||'';el('courseStepProgress').max=total;el('courseStepProgress').value=index+1;el('courseBack').disabled=!!review||index===0;el('courseNext').textContent=index===total-1?(!review&&missing?'Сохранить практику':'Завершить блок'):'Дальше →';body().replaceChildren();feedback('');
      if(d.type==='learn'){
        if(d.points?.length)board(d.points);
        if(d.audio?.progression?.length)progressionView(d.audio.progression);
        if(d.audio){button(row(),'▶ Послушать пример',()=>play(d.audio,()=>{s.heard=true;update();}));const beats=d.audio.events.reduce((n,e)=>n+e.beats,0)+(d.audio.countIn?4:0);body().appendChild(node('p',`Длительность примера — около ${Math.ceil(beats*60/tempo)} с при текущем темпе.`));}
        if(!review&&index<m.steps.length-1){const preview=node('details');preview.className='audio-options';preview.appendChild(node('summary','Для повторения и быстрого просмотра'));preview.appendChild(node('p','Можно посмотреть следующий шаг без отметки прохождения этого урока.'));button(preview,'Просмотреть следующий шаг',()=>{state.index[m.id]=index+1;render();});body().appendChild(preview);}
      }else if(d.type==='choice'){
        if(d.points?.length)board(d.points);
        d.answers.forEach((text,i)=>button(row(),text,()=>{s.answer=i;s.attempts=(s.attempts||0)+1;feedback(i===d.correct?'Верно.':'Пока неверно. Сравните с условием и попробуйте снова.',i===d.correct);update();}));
      }else if(d.type==='select'){
        s.selected||=[...(d.base||[])];board(selected(s),{onClick:p=>{let next=s.selected.filter(k=>k!==p.key);if(!s.selected.includes(p.key)){if(d.onePerString)next=next.filter(k=>!k.startsWith(p.str+'/'));next.push(p.key);}s.selected=next;s.checked=false;redraw();note(p);}});
        const actions=row();button(actions,'Проверить',()=>{s.checked=true;s.attempts=(s.attempts||0)+1;const issue=validateSelection(d,selected(s));feedback(issue||'Верно: состав и расположение совпали с заданием.',!issue);update();});button(actions,'Очистить',()=>{s.selected=[...(d.base||[])];s.checked=false;redraw();});
        button(actions,'▶ Вместе',()=>{const notes=selected(s).map(p=>p.midi);if(notes.length)play({events:[{midi:null,beats:2}],progression:[{atBeat:0,beats:2,notes:[...new Set(notes)].slice(0,6),label:'Ваш выбор'}]});},!s.selected.length);
      }else if(d.type==='transition'){
        s.selected||=d.fromPoints.map(coord);const chosen=selected(s),heading=node('p',`${d.fromLabel} → ${d.toLabel}`);heading.className='course-transition-heading';body().appendChild(heading);
        board(chosen,{ghosts:d.fromPoints,onClick:p=>{if(!d.fromPoints.some(n=>n.str===p.str)){feedback('Для этого перехода используйте те же три струны.');return;}s.selected=s.selected.filter(k=>!k.startsWith(p.str+'/')).concat(p.key);s.checked=false;redraw();note(p);}});
        const lines=node('div');lines.id='courseVoiceLeading';
        for(const before of d.fromPoints){const after=chosen.find(n=>n.str===before.str),delta=after?after.midi-before.midi:null,common=delta===0&&((d.target||d.targetKeys||[]).includes(coord(before))||(d.targetPcs||[]).includes(pc(before.midi)));const line=node('div');line.className='course-voice-line'+(common?' is-common':'');
          line.append(node('span',`${pitch(before.midi)}${Math.floor(before.midi/12)-1} · ${coord(before)}`),node('span','→'),node('span',after?`${pitch(after.midi)}${Math.floor(after.midi/12)-1} · ${after.key}`:'Выберите звук'),node('small',common?'Общий звук':delta===0?'Пока без изменения':delta===null?'':`${delta>0?'↑':'↓'} ${Math.abs(delta)} полутон(а)`));lines.appendChild(line);
        }body().appendChild(lines);
        const actions=row(),from=d.fromPoints.map(p=>p.midi),to=chosen.map(p=>p.midi),targetLabel=validateSelection(d,chosen)?'Ваш вариант':d.toLabel;const chord=(notes,label,atBeat=0)=>({atBeat,beats:2,notes,label});
        button(actions,'▶ Исходный аккорд',()=>play({events:[{midi:null,beats:2}],progression:[chord(from,d.fromLabel)]}));
        button(actions,'▶ Ваш аккорд',()=>play({events:[{midi:null,beats:2}],progression:[chord(to,targetLabel)]}));
        button(actions,'▶ Переход туда и обратно',()=>play({events:Array.from({length:3},()=>({midi:null,beats:2})),progression:[chord(from,d.fromLabel),chord(to,targetLabel,2),chord(from,d.fromLabel,4)]}));
        button(actions,'Сброс перехода',()=>{s.selected=d.fromPoints.map(coord);s.checked=false;redraw();});
        button(actions,'Проверить переход',()=>{s.checked=true;s.attempts=(s.attempts||0)+1;const issue=validateSelection(d,selected(s));feedback(issue||'Верно: общий звук сохранён, остальные голоса перешли в новый аккорд.',!issue);update();});
      }else if(d.type==='sequence'){
        s.sequence||=[];body().appendChild(node('p','Исходная группа: '+d.sourceMidi.map(pitch).join('–')+'. Продолжите рисунок по ступеням.'));
        const cells=node('ol');cells.id='courseSequenceCells';cells.className='course-sequence-cells';
        d.targetMidi.forEach((_,i)=>{const cell=node('li',s.sequence[i]===undefined?'?':pitch(s.sequence[i]));cell.dataset.sequenceCell=String(i);if(i%d.groupSize===0)cell.classList.add('group-start');cells.appendChild(cell);});body().appendChild(cells);
        function append(midi){if(s.sequence.length===d.targetMidi.length){feedback('Все места заполнены. Уберите последний звук, если хотите исправить.');return;}s.sequence.push(midi);s.checked=false;redraw();}
        if(d.points?.length)board(d.points,{onClick:p=>{if(d.allowedMidi.includes(p.midi)){append(p.midi);note(p);}else feedback('Для секвенции используйте звуки выбранной гаммы.');}});
        const notes=row();d.allowedMidi.forEach(n=>button(notes,`${pitch(n)}${Math.floor(n/12)-1}`,()=>append(n)));
        const actions=row();button(actions,'Убрать последнее',()=>{s.sequence.pop();s.checked=false;redraw();},!s.sequence.length);button(actions,'Очистить секвенцию',()=>{s.sequence=[];s.checked=false;redraw();});
        button(actions,'▶ Исходная группа',()=>play({events:d.sourceMidi.map(midi=>({midi,beats:d.beats||.5})),countIn:true}));
        button(actions,'▶ Ваш вариант',()=>play({events:[...d.sourceMidi,...s.sequence].map(midi=>({midi,beats:d.beats||.5})),countIn:true}),!s.sequence.length);
        const reference=button(actions,'▶ Полная секвенция',()=>play({events:(d.fullSequence||[...d.sourceMidi,...d.targetMidi]).map(midi=>({midi,beats:d.beats||.5})),countIn:true}),!s.checked||!!validateSequence(d,s.sequence));
        button(actions,'Проверить секвенцию',()=>{s.checked=true;s.attempts=(s.attempts||0)+1;const issue=validateSequence(d,s.sequence);reference.disabled=!!issue;feedback(issue||'Верно: рисунок повторён с новых ступеней. Теперь сыграйте его в удобном темпе.',!issue);update();});
      }else if(d.type==='ear'){
        const samples=d.samples||[{...d.audio,correct:d.correct}];s.round=Math.min(s.round||0,samples.length);
        if(s.round===samples.length)feedback(`Слуховая практика завершена. С первой попытки: ${s.firstCorrect||0} из ${samples.length}.`,true);
        else {const sample=samples[s.round];body().appendChild(node('p',`Пример ${s.round+1} из ${samples.length}. Ответы доступны после прослушивания.`));
          button(row(),'▶ Послушать пример',()=>{s.heard=false;s.answer=undefined;next.hidden=true;body().querySelectorAll('[data-ear-choice]').forEach(n=>n.disabled=true);play(sample,()=>{s.heard=true;body().querySelectorAll('[data-ear-choice]').forEach(n=>n.disabled=false);save();});});
          const answers=row();d.answers.forEach((text,i)=>{const b=button(answers,text,()=>{if(!s.heard)return;s.attempts=(s.attempts||0)+1;s.answer=i;if(i===sample.correct){if(!s.earTried)s.firstCorrect=(s.firstCorrect||0)+1;feedback('Верно. Теперь переходите к следующему примеру.',true);next.hidden=false;}else feedback('Пока неверно. Можно послушать пример ещё раз.');s.earTried=true;save();},!s.heard);b.dataset.earChoice=String(i);});
          const next=button(row(),'Следующий пример',()=>{if(!s.heard||s.answer!==sample.correct)return;s.round++;s.heard=false;s.earTried=false;s.answer=undefined;redraw();});next.hidden=s.answer!==sample.correct;
        }
      }else if(d.type==='practice'){
        if(d.points?.length)board(d.points);if(d.audio)button(row(),'▶ Послушать пример',()=>play(d.audio));checks(d.checks);
      }else if(d.type==='voicing'){
        s.voices||=[...d.voices];body().appendChild(node('p','Голоса снизу вверх: '+s.voices.map(n=>`${pitch(n)}${Math.floor(n/12)-1}`).join(' · ')));
        const voices=row();s.voices.forEach((n,i)=>button(voices,`Опустить ${pitch(n)}${Math.floor(n/12)-1} на октаву`,()=>{s.voices[i]-=12;s.voices.sort((a,b)=>a-b);s.checked=false;redraw();},n<12));
        const actions=row();button(actions,'▶ До',()=>play({events:[{midi:null,beats:2}],progression:[{atBeat:0,beats:2,notes:d.voices,label:'Тесное расположение'}]}));button(actions,'▶ После',()=>play({events:[{midi:null,beats:2}],progression:[{atBeat:0,beats:2,notes:s.voices,label:'Ваше расположение'}]}));
        button(actions,'Сброс',()=>{s.voices=[...d.voices];s.checked=false;redraw();});button(actions,'Проверить преобразование',()=>{s.checked=true;s.attempts=(s.attempts||0)+1;const ok=JSON.stringify(s.voices)===JSON.stringify(d.targetVoices);feedback(ok?'Верно: второй сверху голос опущен на октаву.':'Проверьте второй сверху голос и величину переноса. При необходимости сбросьте пример.',ok);update();});
      }else if(d.type==='compose'){
        s.events||=[];s.duration||=1;
        if(s.events.some(e=>e.midi!==null&&!validFingering(e)))s.recommendedFingering=true;
        s.events=s.events.map(e=>withFingering(d,e));
        const total=s.events.reduce((n,e)=>n+e.beats,0);body().appendChild(node('p',`Заполнено ${total} из ${d.bars*4} долей. Размер 4/4.`));
        if(s.recommendedFingering)body().appendChild(node('p','Для ранее сохранённых нот предложена аппликатура изученной позиции. Высоты и ритм сохранены.'));
        const editing=Number.isInteger(s.editIndex)&&!!s.events[s.editIndex];
        const duration=row();for(const value of [.5,1,2]){const b=button(duration,value===.5?'½ доли':`${value} ${value===1?'доля':'доли'}`,()=>{if(editing){if(total-s.events[s.editIndex].beats+value>d.bars*4){feedback('Эта длительность выходит за границу фразы. Сначала освободите место или выберите меньшую.');return;}s.events[s.editIndex].beats=value;s.checked=false;s.checks=[];}s.duration=value;redraw();});b.setAttribute('aria-pressed',String(s.duration===value));}
        const editStatus=node('p',editing?`Редактируется событие ${s.editIndex+1}: нажмите новую ноту или паузу. Остальная фраза сохранится.`:'Нажмите на событие в записи, чтобы заменить его без удаления остальных нот.');editStatus.className='course-edit-status';body().appendChild(editStatus);
        function append(midi,position=null){if(editing){s.events[s.editIndex]=withFingering(d,{midi,beats:s.events[s.editIndex].beats,...(position||{})});s.editIndex=undefined;}else{if(total+s.duration>d.bars*4){feedback('Такты заполнены. Выберите событие в записи для замены или уберите последнее.');return;}s.events.push(withFingering(d,{midi,beats:s.duration,...(position||{})}));}s.checked=false;s.checks=[];redraw();}
        const notes=row();d.allowedMidi.forEach(n=>button(notes,`${pitch(n)}${Math.floor(n/12)-1}`,()=>append(n)));button(notes,'Пауза',()=>append(null));
        if(d.points?.length)board(d.points,{onClick:p=>{if(d.allowedMidi.includes(p.midi)){append(p.midi,p);note(p);}else feedback('Выберите ноту из предложенного материала.');}});
        progressionView(d.progression||[]);
        if(typeof CoursePracticePlayer!=='undefined'&&s.events.length){const tabs=node('div');tabs.className='course-compose-tabs';body().appendChild(tabs);tabView=CoursePracticePlayer.renderTab(tabs,s.events,{progression:d.progression||[],rootPc:d.rootPc||0,onSelect:i=>{s.editIndex=i;s.duration=s.events[i].beats;redraw();}});}
        const timeline=node('ol');timeline.className='course-phrase';let offset=0;s.events.forEach((e,i)=>{const segment=(d.progression||[]).find(c=>offset>=c.atBeat&&offset<c.atBeat+c.beats),item=node('li'),beat=offset%4+1;const edit=button(item,'',()=>{s.editIndex=i;s.duration=e.beats;redraw();});edit.className='course-edit-note';edit.setAttribute('aria-label',`Изменить событие ${i+1}, такт ${Math.floor(offset/4)+1}, доля ${beat}`);edit.append(node('small',`Такт ${Math.floor(offset/4)+1} · доля ${beat}${segment?' · '+segment.label:''}`),node('strong',`${e.midi===null?'Пауза':pitch(e.midi)}`),node('span',`${e.beats===.5?'½':e.beats} ${e.beats===1?'доля':'доли'}`));item.classList.toggle('is-editing',s.editIndex===i);if(offset%4===0)item.classList.add('bar-start');item.dataset.event=String(i);timeline.appendChild(item);offset+=e.beats;});body().appendChild(timeline);
        if(editing)button(row(),'Продолжить добавление',()=>{s.editIndex=undefined;redraw();});
        const actions=row();button(actions,'Убрать последнее',()=>{s.events.pop();s.editIndex=undefined;s.checked=false;s.checks=[];redraw();},!s.events.length);button(actions,'Очистить фразу',()=>{s.events=[];s.editIndex=undefined;s.checked=false;s.checks=[];redraw();},!s.events.length);
        button(actions,'▶ Фраза с сопровождением',()=>play({events:s.events,progression:(d.progression||[]).filter(c=>c.atBeat<total).map(c=>({...c,beats:Math.min(c.beats,total-c.atBeat)})),countIn:true}),!s.events.length);
        button(actions,'Скачать свою фразу (JSON)',exportProject,!s.events.length);
        checks(['Я пропел и сыграл свою фразу под сопровождение.','Я проверил пульс, паузы и окончание; при затруднении замедлил темп.']);
        button(row(),'Проверить фразу',()=>{s.checked=true;const issue=validatePhrase(d,s.events);feedback(issue||'Фраза собрана. Проверены ритмическая длина, состав и окончания. Развитие мотива и исполнение оцените при прослушивании.',!issue);update();});
        const practiceId=m.id==='4'?'am':m.id==='3'||m.id==='8'?'cf':'melody';button(row(),'К практике с табами и сопровождением',()=>window.coursePractice?.open(practiceId));
      }
      if(!review&&!['practice','ear','learn'].includes(d.type)){const hint=node('details');hint.className='lesson-purpose';hint.appendChild(node('summary','Подсказка'));hint.appendChild(node('p',d.why||d.instruction));hint.ontoggle=()=>{if(hint.open){s.assisted=true;save();}};body().appendChild(hint);}
      update();
    }
    function home(){
      const cards=el('courseModuleCards');cards.replaceChildren();
      const old1=(()=>{try{return JSON.parse(localStorage.getItem('fretlab-block1-v1')||'null');}catch{return null;}})();
      const old2=(()=>{try{return JSON.parse(localStorage.getItem('fretlab-block2-v1')||'null');}catch{return null;}})();
      const firstDone=CourseBlockOne.ACTIVITIES.every(a=>old1?.records?.[a.id]?.done),secondDone=!!old2?.completedAt?.a&&!!old2?.completedAt?.b;
      const entries=[{id:'1',title:'Расстояния и мажорная гамма',outcome:'От полутона на одной струне до своей первой фразы.',complete:firstDone,open:()=>el('tab-block').click()},{id:'2',title:'Ступени, позиция и звуки аккорда',outcome:'Две части: компактная гамма, C–E–G и своя фраза под аккорд.',complete:secondDone,open:()=>el('tab-block2').click()},...Content.modules.map(m=>({...m,complete:!!state.records[m.id]?.completedAt,open:()=>open(m.id)}))];
      const next=entries.find(m=>!m.optional&&!m.complete)||entries.at(-1),last=Content.modules.find(m=>m.id===state.module),inProgress=last&&!state.records[last.id]?.completedAt&&last.steps.some(d=>state.sessions[d.id]);
      el('courseResume').textContent=inProgress?`Вернуться к работе: блок ${last.id} · ${last.steps[state.index[last.id]||0].title}`:`Следующий основной блок: ${next.id} · ${next.title}`;el('courseResume').onclick=inProgress?()=>open(last.id):next.open;
      el('courseHomeNotice').hidden=!homeMessage;el('courseHomeNotice').textContent=homeMessage;
      el('courseSummary').textContent=`Пройдено ${entries.filter(m=>!m.optional&&m.complete).length} из ${entries.filter(m=>!m.optional).length} основных блоков. Семь ладов и Drop 2 — следующий уровень.`;
      for(const m of entries){const card=node('article');card.className='course-module-card'+(m===next?' route-current':'');const eyebrow=node('p',`Блок ${m.id}${m.optional?' · Дополнительно':''}${m.complete?' · Пройден':''}`);eyebrow.className='course-eyebrow';card.append(eyebrow,node('h2',m.title),node('p',m.outcome));if(m.sessions)card.appendChild(node('p',m.sessions));button(card,m.complete?'Повторить':'Открыть блок',m.open);
        if(m.steps){const details=node('details');details.appendChild(node('summary','Уроки и практика'));const links=node('div');links.className='course-step-list';m.steps.forEach((d,i)=>button(links,`${state.done[d.id]?'✓ ':''}${i+1}. ${d.title}`,()=>open(m.id,i)));details.appendChild(links);card.appendChild(details);}
        if(reviewDue(state.records[m.id])){const r=node('p','Проверьте, что осталось: пора повторить без подсказок.');card.appendChild(r);button(card,'Повторная проверка',()=>startReview(m));}cards.appendChild(card);
      }
    }
    function startReview(m){
      const tasks=m.steps.map((d,i)=>({d,i})).filter(({d})=>['select','choice','ear','sequence','transition'].includes(d.type)).slice(-2).map(n=>n.i),practice=m.steps.findLastIndex(d=>d.type==='practice');
      if(practice>=0)tasks.push(practice);review=tasks.length?tasks:[m.steps.length-1];reviewIndex=0;for(const i of review)delete state.sessions[m.steps[i].id];open(m.id,null,true);
    }
    function open(id,index=null,keepReview=false){
      const m=Content.modules.find(m=>m.id===String(id));if(!m)return;stop();window.coursePractice?.stop();if(el('coursePracticeWork'))el('coursePracticeWork').hidden=true;if(!keepReview)review=null;state.module=m.id;if(Number.isInteger(index))state.index[m.id]=Math.max(0,Math.min(m.steps.length-1,index));
      el('tab-course').click();el('courseHome').hidden=true;el('courseWork').hidden=false;focusKey=null;render();el('courseStepTitle').focus({preventScroll:true});el('courseWork').scrollIntoView({block:'start'});
    }
    el('courseNext').onclick=()=>{
      if(!ready())return;stop();const m=module(),d=step();
      if(review){if(reviewIndex<review.length-1){reviewIndex++;render();return;}state.records[m.id].reviewedAt=Date.now();review=null;}
      else{state.done[d.id]=true;const i=state.index[m.id]||0;if(i<m.steps.length-1){state.index[m.id]=i+1;render();el('courseStepTitle').focus({preventScroll:true});el('courseWork').scrollIntoView({block:'start'});return;}const remaining=m.steps.filter(d=>!state.done[d.id]).length;homeMessage=remaining?`Самопроверка сохранена. Для завершения блока ${m.id} осталось пройти ${remaining} шаг(а).`:`Блок ${m.id} завершён. Можно продолжить маршрут или вернуться к своей музыке.`;if(!remaining&&!state.records[m.id]?.completedAt)state.records[m.id]={completedAt:Date.now()};}
      save();el('courseHome').hidden=false;el('courseWork').hidden=true;home();el('courseSummary').focus({preventScroll:true});
    };
    el('courseBack').onclick=()=>{if(review||!(state.index[module().id]>0))return;state.index[module().id]--;render();};
    el('courseRoute').onclick=()=>{stop();review=null;el('courseHome').hidden=false;el('courseWork').hidden=true;home();};
    el('courseRetry').onclick=()=>{delete state.sessions[step().id];render();};el('courseStop').onclick=stop;el('courseTempo').onchange=e=>{tempo=Math.max(40,Math.min(120,Number(e.target.value)||80));e.target.value=tempo;session().tempo=tempo;stop();save();};
    document.querySelectorAll('[role="tab"]').forEach(tab=>tab.addEventListener('click',()=>{stop();window.coursePractice?.stop();if(el('coursePracticeWork'))el('coursePracticeWork').hidden=true;if(tab.id==='tab-course'){el('courseHome').hidden=false;el('courseWork').hidden=true;home();}}));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else home();});window.addEventListener('pagehide',stop);window.addEventListener('focus',()=>{if(!el('courseHome').hidden)home();});
    save();home();if(new URLSearchParams(location.search).get('course')==='all')el('tab-course').click();
    return {open,stop,getState:()=>structuredClone(state)};
  }
  return {KEY,DAY,point,validFingering,withFingering,validateSelection,validatePhrase,validateSequence,drop2,cleanState,reviewDue,boot};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CourseComplete;
else window.courseComplete=CourseComplete.boot();
