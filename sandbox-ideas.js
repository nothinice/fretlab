/* Small musical experiments on the shared sandbox board. Original examples. */
const SandboxIdeas=(()=>{
  'use strict';
  const OPEN={1:64,2:59,3:55,4:50,5:45,6:40};
  const point=(str,fret)=>({str,fret,midi:OPEN[str]+fret});
  const LOW_C=[point(5,3),point(4,2),point(3,0)],LOW_CM=[point(5,3),point(4,1),point(3,0)];
  const TOP_C=[point(3,0),point(2,1),point(1,0)],TOP_F=[point(3,2),point(2,1),point(1,1)];
  const POSITION=[point(6,8),point(6,10),point(5,7),point(5,8),point(5,10),point(4,7),point(4,9),point(4,10)];
  const atMidi=midi=>POSITION.find(p=>p.midi===midi);
  const event=(midi,beats=1)=>midi===null?{midi:null,beats}:{...atMidi(midi),midi,beats};
  const IDEAS=[
    {id:'third',title:'Один лад меняет аккорд',question:'Какая единственная нота превращает C major в C minor?',try:'Нажмите на 1-й лад 4-й струны вместо 2-го: E станет E♭. Остальные две ноты оставьте. Можно воспользоваться кнопкой ниже.',notice:'Состав C–E–G сменяется на C–E♭–G. Понизилась терция, поэтому мажор стал минором. ♭ означает звук на полутон ниже.',range:[0,3]},
    {id:'bridge',title:'Перейти из C в F',question:'Можно сменить аккорд, сохранив одну ноту и почти не двигая остальные?',try:'Оставьте C на 2-й струне, 1-м ладу. E поднимите до F на один лад, G — до A на два. Контуры показывают следующий аккорд.',notice:'Общий C остаётся: в C это основной тон, в F — квинта. E → F идёт на полутон, G → A — на тон. Здесь нижние звуки G и A: названия C/G и F/A уточняют бас, но составы остаются C–E–G и F–A–C.',range:[0,3]},
    {id:'center',title:'Те же ноты, другая опора',question:'Как изменится ощущение одной мелодии над C и над Am?',try:'Сначала пропойте C–E–G–A. Прослушайте одну и ту же фразу над двумя аккордами, затем сыграйте её сами. Сравните устойчивость последней A.',notice:'Ноты и ритм мелодии одинаковые. Над Am нота A становится основным тоном аккорда; над C она шестая ступень. Общий набор нот ещё не означает одинаковый тональный центр.',range:[7,10]},
    {id:'sequence',title:'Секвенция приходит в новый аккорд',question:'Как продолжить рисунок C–D–E, D–E–F, E–F–G и услышать смену на F?',try:'Группы идут ровными восьмыми. Последний G третьей группы уже звучит над F. Выберите после него F или A и сравните два окончания.',notice:'Рисунок поднимается по ступеням C major. Это секвенция. F и A входят в новый аккорд; F — его основной тон, A — терция. Цель — услышать окончание, сохраняя общий пульс.',range:[7,10]}
  ];
  function configuration(id,variant='a',ending=null){
    if(!IDEAS.some(d=>d.id===id))throw Error('Неизвестный эксперимент.');
    if(id==='third')return {action:'chord',notes:variant==='b'?LOW_CM:LOW_C,root:0,spelling:'flat'};
    if(id==='bridge')return {action:'chord',notes:variant==='b'?TOP_F:TOP_C,root:'auto',spelling:'auto'};
    const notes=id==='center'?[48,52,55,57]:[48,50,52,53,55,...([53,57].includes(ending)?[ending]:[])];
    return {action:'mark',notes:[...new Set(notes)].map(atMidi),spelling:'auto'};
  }
  function audioPlan(id,{variant='a',ending=null,compare=false}={}){
    if(id==='third')return {events:[{midi:null,beats:4},{midi:null,beats:4}],progression:[{atBeat:0,beats:4,notes:LOW_C.map(p=>p.midi),label:'C major'},{atBeat:4,beats:4,notes:LOW_CM.map(p=>p.midi),label:'C minor'}]};
    if(id==='bridge')return {events:[{midi:null,beats:4},{midi:null,beats:4}],progression:[{atBeat:0,beats:4,notes:TOP_C.map(p=>p.midi),label:'C'},{atBeat:4,beats:4,notes:TOP_F.map(p=>p.midi),label:'F'}]};
    if(id==='center'){
      const melody=[48,52,55,57].map(m=>event(m,2)),labels=compare?['C','Am']:[variant==='b'?'Am':'C'];
      return {events:compare?[...melody,...melody.map(e=>({...e}))]:melody,progression:labels.map((label,i)=>({atBeat:i*8,beats:8,notes:label==='C'?[48,52,55]:[45,48,52],label}))};
    }
    if(id==='sequence')return {events:[...[48,50,52,50,52,53,52,53,55].map(m=>event(m,.5)),event([53,57].includes(ending)?ending:null,2),event(null,.5),event(null,1)],progression:[{atBeat:0,beats:4,notes:[48,52,55],label:'C'},{atBeat:4,beats:4,notes:[53,57,60],label:'F'}]};
    throw Error('Неизвестный эксперимент.');
  }
  const same=(points,frets)=>points.length===frets.filter(f=>f!==null).length&&points.every(p=>frets[p.str-1]===p.fret);
  function describe(id,state,ending){
    if(id==='third')return same(LOW_CM,state.frets)?'Теперь C minor: E понижена до E♭. Послушайте результат.':same(LOW_C,state.frets)?'Сейчас C major. Попробуйте понизить только E.':'Вы изменили состав. Сравните его с C–E–G и C–E♭–G или продолжайте свободно.';
    if(id==='bridge')return same(TOP_F,state.frets)?'Сейчас F. C сохранилась на том же месте.':same(TOP_C,state.frets)?'Сейчас C. Дальше F: C останется, E → F, G → A.':'Промежуточный состав: можно двигать голоса по одному или восстановить C / F кнопкой.';
    if(id==='sequence')return ending===53?'Окончание F — основной тон нового аккорда.':ending===57?'Окончание A — терция нового аккорда.':'Пока окончание оставлено паузой. Выберите F или A, затем сыграйте свой вариант.';
    return 'Мелодия C–E–G–A остаётся прежней; меняется только сопровождение.';
  }
  function boot(){
    const host=document.getElementById('sandboxIdeas'),sandbox=window.courseSandbox;if(!host||!sandbox)return null;
    const el=id=>document.getElementById(id),node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
    const boardWrap=el('sandboxBoard').parentElement,boardAnchor=document.createComment('Shared sandbox board position');boardWrap.before(boardAnchor);
    let selected='third',active=false,variant='a',ending=null,tempo=80,loop=false,tab=null,boardStyle=null,frameVariant=null;
    const idea=()=>IDEAS.find(d=>d.id===selected);
    const button=(parent,text,fn,id)=>{const b=node('button',text,'play-btn');b.type='button';if(id)b.id=id;b.onclick=fn;parent.appendChild(b);return b;};
    const controls=parent=>{const row=node('div',undefined,'sandbox-idea-controls');parent.appendChild(row);return row;};
    function stop(){player.stop();tab?.highlight(-1);if(el('ideaStop'))el('ideaStop').disabled=true;if(el('ideaNow'))el('ideaNow').textContent='Можно сравнивать и играть';}
    const player=CoursePracticePlayer.createPlayer({onFrame(frame){
      if(!active)return;tab?.highlight(frame.index);if(el('ideaNow'))el('ideaNow').textContent=frame.waiting?'Готовимся…':frame.countIn?`Отсчёт: ${frame.countIn}`:`${frame.chord||''} · такт ${frame.bar} · доля ${frame.beat}`;
      if(['third','bridge'].includes(selected)&&!frame.waiting&&!frame.countIn){const next=frame.bar===1?'a':'b';if(frameVariant!==next){frameVariant=next;variant=next;sandbox.applyExperiment(configuration(selected,variant,ending));updateBoard();}}
    },onStop(result){tab?.highlight(-1);if(el('ideaStop'))el('ideaStop').disabled=true;if(el('ideaNow'))el('ideaNow').textContent=result.error?'Не удалось запустить звук: '+result.error:'Можно сравнивать и играть';}});
    function otherAudio(){sandbox.stop();window.courseBlockOne?.stop?.();window.courseBlockTwo?.stop?.();window.courseComplete?.stop?.();window.coursePractice?.stop?.();window.courseReview?.stop?.();if(typeof stopSequence==='function')stopSequence();}
    async function play(options={}){
      if(!active)return;stop();otherAudio();frameVariant=null;const plan=audioPlan(selected,{variant,ending,...options});
      if(el('ideaStop'))el('ideaStop').disabled=false;
      try{await player.play(plan.events,{progression:plan.progression,tempo,loop,countIn:true,melody:true,backing:true,positions:plan.events.map(e=>e.str?{boardId:'sandboxBoard',index:(e.str-1)*17+e.fret}:null)});}catch(error){if(el('ideaNow'))el('ideaNow').textContent='Звук не запущен. Попробуйте ещё раз.';}
    }
    function updateBoard(){
      if(!active)return;const board=el('sandboxBoard'),range=idea().range,cells=board.querySelectorAll('.cell');
      board.classList.add('sandbox-idea-board');board.style.gridTemplateColumns=`38px repeat(${range[1]-range[0]+1},minmax(38px,1fr))`;board.style.minWidth='0';
      board.querySelectorAll('.fret-label').forEach((e,f)=>e.hidden=f<range[0]||f>range[1]);
      cells.forEach((cell,i)=>{const fret=i%17;cell.hidden=fret<range[0]||fret>range[1];cell.classList.remove('idea-common','idea-arrival');cell.querySelectorAll('.idea-next-dot').forEach(n=>n.remove());});
      if(!board.querySelector('.cell:not([hidden]) button[tabindex="0"]')){board.querySelectorAll('button').forEach(b=>b.tabIndex=-1);board.querySelector('.cell:not([hidden]) button')?.setAttribute('tabindex','0');}
      if(selected==='bridge'){
        const current=sandbox.getState();if(same(TOP_F,current.frets))variant='b';else if(same(TOP_C,current.frets))variant='a';
        cells[(2-1)*17+1].classList.add('idea-common');const targets=variant==='a'?TOP_F:TOP_C;
        targets.forEach(p=>{const cell=cells[(p.str-1)*17+p.fret],dot=node('span',p.str===2?'':({55:'G',57:'A',64:'E',65:'F'}[p.midi]||''),'idea-next-dot');dot.setAttribute('aria-hidden','true');cell.appendChild(dot);});
      }
      if(selected==='sequence'&&ending){const p=atMidi(ending);cells[(p.str-1)*17+p.fret].classList.add('idea-arrival');}
      const feedback=el('ideaObservation');if(feedback)feedback.textContent=describe(selected,sandbox.getState(),ending);
    }
    function load(nextVariant='a'){stop();variant=nextVariant;sandbox.applyExperiment(configuration(selected,variant,ending));render();}
    function open(id=selected){
      if(!IDEAS.some(d=>d.id===id))id='third';stop();otherAudio();if(!active){boardStyle=el('sandboxBoard').getAttribute('style');sandbox.beginExperiment();}active=true;selected=id;variant='a';ending=null;sandbox.applyExperiment(configuration(id));render();
    }
    function close(){
      if(!active){stop();return;}
      stop();active=false;tab?.destroy();tab=null;el('sandboxBoard').classList.remove('sandbox-idea-board');sandbox.endExperiment();if(boardStyle===null)el('sandboxBoard').removeAttribute('style');else el('sandboxBoard').setAttribute('style',boardStyle);boardStyle=null;render();
    }
    function render(){
      const focused=document.activeElement?.id,expanded=host.querySelector('.idea-notice')?.open;tab?.destroy();tab=null;if(host.contains(boardWrap))boardAnchor.after(boardWrap);host.replaceChildren();
      host.appendChild(node('p','Откройте музыкальную идею на грифе','course-eyebrow'));
      const choose=node('select');choose.id='ideaSelect';choose.setAttribute('aria-label','Музыкальный эксперимент');IDEAS.forEach(d=>{const option=node('option',d.title);option.value=d.id;choose.appendChild(option);});choose.value=selected;choose.onchange=()=>{if(active)open(choose.value);else{selected=choose.value;render();}};host.appendChild(choose);
      const d=idea();host.appendChild(node('h2',d.question));
      if(!active){host.appendChild(node('p','Поставьте опыт, сравните на слух и продолжите играть. Ваши текущие ноты вернутся после выхода.'));button(host,'Начать на этом грифе',()=>open(selected),'ideaStart').classList.add('primary-btn');return;}
      host.appendChild(node('p',d.try,'idea-instruction'));const row=controls(host);
      if(selected==='third'){button(row,'Вернуть C major',()=>load('a'),'ideaA');button(row,'Понизить E → E♭',()=>load('b'),'ideaB');button(row,'▶ Сравнить мажор и минор',()=>play(),'ideaPlay');}
      if(selected==='bridge'){button(row,'Показать C',()=>load('a'),'ideaA');button(row,'Показать F',()=>load('b'),'ideaB');button(row,'▶ Смена C → F',()=>play(),'ideaPlay');}
      if(selected==='center'){button(row,'▶ Та же фраза над C',()=>{variant='a';play();},'ideaA');button(row,'▶ Та же фраза над Am',()=>{variant='b';play();},'ideaB');button(row,'▶ Сравнить C / Am',()=>play({compare:true}),'ideaPlay');}
      if(selected==='sequence'){for(const [midi,name] of [[53,'F'],[57,'A']]){const b=button(row,`Окончание ${name}`,()=>{ending=midi;load();},`ideaEnd${name}`);b.setAttribute('aria-pressed',String(ending===midi));}button(row,'▶ Послушать секвенцию',()=>play(),'ideaPlay');}
      button(row,'■ Стоп',stop,'ideaStop').disabled=!player.isPlaying();
      const label=node('label','Темп '),input=node('input');input.id='ideaTempo';input.type='number';input.min=40;input.max=120;input.value=tempo;input.onchange=()=>{stop();tempo=Math.max(40,Math.min(120,Number(input.value)||80));input.value=tempo;};label.appendChild(input);row.appendChild(label);
      const repeat=node('label',undefined,'idea-repeat'),check=node('input');check.type='checkbox';check.id='ideaLoop';check.checked=loop;check.onchange=()=>{stop();loop=check.checked;};repeat.append(check,node('span','Повторять'));row.appendChild(repeat);
      const status=node('p','Можно сравнивать и играть','idea-now');status.id='ideaNow';status.setAttribute('aria-live','off');host.appendChild(status);
      host.appendChild(boardWrap);
      const observation=node('p',undefined,'sandbox-readout');observation.id='ideaObservation';observation.setAttribute('role','status');host.appendChild(observation);
      if(selected==='bridge')host.appendChild(node('p','Сейчас — заполненные точки. Дальше — пунктирный контур. Общая C — с двойным ободком.','hint'));
      if(['center','sequence'].includes(selected)){const score=node('details');score.className='idea-score';score.appendChild(node('summary','Табы и ритм примера'));const holder=node('div');score.appendChild(holder);host.appendChild(score);const plan=audioPlan(selected,{variant,ending});tab=CoursePracticePlayer.renderTab(holder,plan.events,{progression:plan.progression});}
      const notice=node('details');notice.className='idea-notice';notice.open=!!expanded;notice.append(node('summary','Что можно заметить'),node('p',d.notice));host.appendChild(notice);
      const end=controls(host);button(end,'Начать опыт заново',()=>open(selected),'ideaReset');button(end,'Вернуть мой гриф',close,'ideaClose');host.appendChild(node('p','Можно свободно нажимать, добавлять и убирать ноты на грифе. Здесь нет оценки или отметки о прохождении.','hint'));
      updateBoard();if(focused)el(focused)?.focus({preventScroll:true});
    }
    sandbox.subscribe(()=>updateBoard());
    el('sandboxBoard').addEventListener('keydown',event=>{
      if(!active||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;const hit=event.target.closest('button[data-string]');if(!hit)return;event.preventDefault();event.stopPropagation();const moves={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]},[ds,df]=moves[event.key],range=idea().range,str=Math.max(1,Math.min(6,Number(hit.dataset.string)+ds)),fret=Math.max(range[0],Math.min(range[1],Number(hit.dataset.fret)+df));el('sandboxBoard').querySelector(`button[data-string="${str}"][data-fret="${fret}"]`)?.focus();
    },true);
    document.addEventListener('click',event=>{if(!active)return;const target=event.target.closest?.('button');if(!target)return;if(target.closest('#sandboxBoard')){stop();return;}if(host.contains(target))return;if(target.closest('#chordStrings,#chordResults,#chordOtherResults')||['sandboxSequence','sandboxTogether','sandboxStop','sandboxClear','sandboxUndo'].includes(target.id)||/^▶/.test(target.textContent.trim()))stop();},true);
    document.addEventListener('change',event=>{if(active&&['sandboxAction','sandboxSpelling','chordRoot','chordDisplay'].includes(event.target.id))stop();},true);
    document.querySelectorAll('[role="tab"]').forEach(t=>t.addEventListener('click',()=>{if(active&&t.id!=='tab-sandbox')close();}));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);render();
    return {open,close,stop,getState:()=>({selected,active,variant,ending,tempo,loop})};
  }
  return {IDEAS,LOW_C,LOW_CM,TOP_C,TOP_F,POSITION,configuration,audioPlan,describe,boot};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=SandboxIdeas;
else window.sandboxIdeas=SandboxIdeas.boot();
