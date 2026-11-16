/* Guided instrument practice. Screen answers and performed music are separate records. */
const CoursePractice = (() => {
  const KEY = 'fretlab-practice-v1';
  const STAGES = [['play','Сыграть'],['call','Вопрос — ответ'],['rhythm','Ритм аккордов'],['transitions','Переходы'],['ear','Подобрать'],['variation','Изменить'],['free','Самостоятельно']];
  const OPEN = {1:64,2:59,3:55,4:50,5:45,6:40};
  const pitch = midi => ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][(midi%12+12)%12];
  const copy = value => JSON.parse(JSON.stringify(value));
  const bars = events => Math.max(1,Math.ceil(events.reduce((sum,e)=>sum+e.beats,0)/4));
  function defaults(study) {
    return {stage:'play',tempo:60,fromBar:1,toBar:bars(study.events),loop:true,melody:true,backing:true,metronome:false,tempoLadder:false,hide:false,labels:'notes',drill:0,rhythm:0,session:0,
      heard:false,earRound:0,earAnswers:[],earPassed:[],earAssisted:[],earAttempts:[],variation:copy(study.variation.sourceEvents),variationChecked:false,checks:[],note:'',recording:'',attempts:[]};
  }
  function cleanState(raw,studies) {
    const state={version:1,study:'cf',byStudy:{}};
    if(!studies.some(s=>s.id===state.study))state.study=studies[0].id;
    if(raw?.version===1&&studies.some(s=>s.id===raw.study))state.study=raw.study;
    for(const study of studies){
      const value=defaults(study),old=raw?.version===1?raw.byStudy?.[study.id]:null;
      if(old&&typeof old==='object'){
        if(STAGES.some(([id])=>id===old.stage)&&!(old.stage==='call'&&!study.callResponse)&&!(old.stage==='rhythm'&&!study.rhythmPatterns?.length))value.stage=old.stage;
        if(Number.isFinite(old.tempo))value.tempo=Math.max(40,Math.min(120,Math.round(old.tempo)));
        for(const key of ['loop','melody','backing','metronome','tempoLadder','hide','heard'])if(typeof old[key]==='boolean')value[key]=old[key];
        if(['notes','degrees','none'].includes(old.labels))value.labels=old.labels;
        for(const [key,max] of [['drill',study.drills.length-1],['session',study.sessions.length-1],['earRound',study.ear.rounds.length-1]])if(Number.isInteger(old[key]))value[key]=Math.max(0,Math.min(max,old[key]));
        if(Number.isInteger(old.rhythm))value.rhythm=Math.max(0,Math.min((study.rhythmPatterns?.length||1)-1,old.rhythm));
        for(const key of ['fromBar','toBar'])if(Number.isInteger(old[key]))value[key]=Math.max(1,Math.min(bars(study.events),old[key]));
        if(value.toBar<value.fromBar)value.toBar=value.fromBar;
        const allowed=study.points.map(p=>p.midi);
        if(Array.isArray(old.earAnswers))value.earAnswers=old.earAnswers.map(a=>Array.isArray(a)?a.filter(n=>Number.isInteger(n)&&allowed.includes(n)).slice(0,16):[]).slice(0,study.ear.rounds.length);
        for(const key of ['earPassed','earAssisted'])if(Array.isArray(old[key]))value[key]=old[key].slice(0,study.ear.rounds.length).map(v=>v===true);
        if(Array.isArray(old.earAttempts))value.earAttempts=old.earAttempts.slice(0,study.ear.rounds.length).map(v=>Number.isInteger(v)?Math.max(0,Math.min(1000,v)):0);
        if(Array.isArray(old.variation)&&old.variation.length===study.variation.sourceEvents.length&&old.variation.every(e=>e&&Number.isInteger(e.midi)&&allowed.includes(e.midi)&&[.5,1,2,4].includes(e.beats)&&Number.isInteger(e.str)&&Number.isInteger(e.fret)&&e.fret>=0&&e.fret<=16&&OPEN[e.str]+e.fret===e.midi&&study.points.some(p=>p.str===e.str&&p.fret===e.fret)))value.variation=old.variation.map(e=>({midi:e.midi,beats:e.beats,str:e.str,fret:e.fret,finger:study.points.find(p=>p.str===e.str&&p.fret===e.fret).finger}));
        if(Array.isArray(old.checks))value.checks=old.checks.slice(0,study.checks.length).map(v=>v===true);
        if(typeof old.note==='string')value.note=old.note.slice(0,1000);
        if(typeof old.recording==='string')value.recording=old.recording.slice(0,1000);
        if(Array.isArray(old.attempts))value.attempts=old.attempts.filter(a=>a&&Number.isFinite(a.date)&&a.date>0&&Number.isInteger(a.tempo)&&a.tempo>=40&&a.tempo<=120&&typeof a.note==='string').slice(-12).map(a=>({date:a.date,tempo:a.tempo,note:a.note.slice(0,1000),checks:Array.isArray(a.checks)?a.checks.slice(0,study.checks.length).map(v=>v===true):[]}));
      }
      state.byStudy[study.id]=value;
    }
    return state;
  }
  function createLocalRecorder({mediaDevices=globalThis.navigator?.mediaDevices,Recorder=globalThis.MediaRecorder,urlApi=globalThis.URL,onChange=()=>{}}={}){
    let generation=0,stream=null,recorder=null,chunks=[],blob=null,url='',status='idle',downloaded=false,title='',error='';
    const supported=!!mediaDevices?.getUserMedia&&!!Recorder;
    const snapshot=()=>({supported,status,url,blob,downloaded,title,error});
    const notify=()=>onChange(snapshot());
    const release=()=>{stream?.getTracks().forEach(track=>track.stop());stream=null;};
    function stop(){
      if(status==='requesting'){generation++;status='idle';notify();return;}
      if(recorder&&recorder.state!=='inactive'){
        status='stopping';try{recorder.stop();}catch{status='error';error='Не удалось завершить запись.';}release();notify();
      }else release();
    }
    function clear(){generation++;if(recorder&&recorder.state!=='inactive')try{recorder.stop();}catch{}release();recorder=null;chunks=[];blob=null;if(url)urlApi.revokeObjectURL(url);url='';status='idle';error='';downloaded=false;notify();}
    async function start(label='Моя игра'){
      if(!supported){error='Этот браузер не поддерживает запись. Запишите дубль камерой или диктофоном телефона.';status='error';notify();return false;}
      if(['requesting','recording','stopping'].includes(status))return false;
      if(blob&&!downloaded){error='Сначала скачайте или удалите предыдущий дубль.';notify();return false;}
      clear();const ticket=++generation;title=label;status='requesting';notify();
      try{
        const capture=await mediaDevices.getUserMedia({audio:true});
        if(ticket!==generation){capture.getTracks().forEach(track=>track.stop());return false;}
        stream=capture;const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type=>Recorder.isTypeSupported?.(type));
        const current=new Recorder(capture,mime?{mimeType:mime}:undefined);recorder=current;
        current.ondataavailable=event=>{if(ticket===generation&&event.data?.size)chunks.push(event.data);};
        current.onstop=()=>{if(ticket!==generation)return;release();recorder=null;blob=chunks.length?new Blob(chunks,{type:current.mimeType||chunks[0].type||'audio/webm'}):null;chunks=[];if(blob){url=urlApi.createObjectURL(blob);status='ready';}else{status='error';error='Запись получилась пустой. Попробуйте короткий дубль ещё раз.';}notify();};
        current.onerror=()=>{if(ticket!==generation)return;generation++;release();if(current.state!=='inactive')try{current.stop();}catch{}recorder=null;status='error';error='Запись прервалась. Проверьте микрофон и повторите дубль.';notify();};
        current.start();status='recording';notify();return true;
      }catch{if(ticket!==generation)return false;release();recorder=null;status='error';error='Доступ к микрофону не получен. Разрешите его в браузере или используйте диктофон телефона.';notify();return false;}
    }
    function markDownloaded(){if(blob){downloaded=true;error='';notify();}}
    return {start,stop,clear,markDownloaded,getState:snapshot,destroy:clear};
  }
  function boot(){
    const host=document.getElementById('coursePracticeWork');
    if(!host)return null;
    const content=CoursePracticeContent,studies=content.studies;
    let state=cleanState(null,studies),canStore=true,tab=null,player=null,recorder=null,activeKind=null,earHeard=false,selectedEvent=null,opening=false,previewVoices=[];
    try{state=cleanState(JSON.parse(localStorage.getItem(KEY)||'null'),studies);}catch{canStore=false;}
    const el=id=>document.getElementById(id);
    const study=()=>studies.find(s=>s.id===state.study)||studies[0];
    const session=()=>state.byStudy[study().id];
    const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
    const button=(parent,text,fn,id)=>{const b=node('button',text,'play-btn');b.type='button';if(id)b.id=id;b.onclick=fn;parent.appendChild(b);return b;};
    const row=parent=>{const n=node('div',undefined,'practice-row');parent.appendChild(n);return n;};
    function rememberFocus(container){
      const active=document.activeElement;if(!container.contains(active))return ()=>{};
      const id=active.id,stage=active.dataset?.practiceStage,event=active.dataset?.tabEvent,str=active.dataset?.string,fret=active.dataset?.fret,text=active.tagName==='BUTTON'?active.textContent:null;
      return ()=>{const target=id?el(id):stage?container.querySelector(`[data-practice-stage="${stage}"]`):event!==undefined?container.querySelector(`[data-tab-event="${event}"]`):str?container.querySelector(`[data-string="${str}"][data-fret="${fret}"]`):text?[...container.querySelectorAll('button')].find(b=>b.textContent===text):null;target?.focus({preventScroll:true});};
    }
    function save(){
      try{localStorage.setItem(KEY,JSON.stringify(state));canStore=true;}catch{canStore=false;}
      if(el('practiceStorage'))el('practiceStorage').textContent=canStore?'Темп, ответы и заметки сохранены в этом браузере.':'Хранилище недоступно. До закрытия страницы можно продолжать заниматься; сохраните работу в файл.';
    }
    function message(text,ok=false){const target=el('practiceFeedback');if(target){target.textContent=text;target.hidden=!text;target.classList.toggle('answer-success',ok);}}
    function stopPlayback(pauseTake=true){activeKind=null;player?.stop();if(pauseTake)el('practiceTakeAudio')?.pause();previewVoices.forEach(v=>{try{v?.stop();}catch{}});previewVoices=[];tab?.highlight(-1);host.querySelectorAll('.practice-form-bar.is-current,.practice-stroke.is-current').forEach(n=>n.classList.remove('is-current'));el('practiceBoard')?.querySelectorAll('.sounding').forEach(c=>c.classList.remove('sounding'));if(el('practiceStop'))el('practiceStop').disabled=true;if(el('practicePlay'))el('practicePlay').disabled=false;if(el('practiceNow'))el('practiceNow').textContent='Готово к игре';if(el('practiceCallPhase'))el('practiceCallPhase').textContent='Два такта образца → два такта вашего ответа';}
    function stop(){stopPlayback();recorder?.stop();}
    function stopOthers(){window.courseBlockOne?.stop();window.courseBlockTwo?.stop();window.courseComplete?.stop();window.courseSandbox?.stop();window.sandboxIdeas?.stop?.();window.courseReview?.stop?.();if(typeof stopSequence==='function')stopSequence();}
    recorder=createLocalRecorder({onChange:()=>renderRecorder()});
    player=CoursePracticePlayer.createPlayer({onFrame(frame){
      if(host.hidden)return;
      if(activeKind!=='ear')tab?.highlight(frame.index);
      const status=el('practiceNow');if(status)status.textContent=frame.waiting?'Приготовьтесь':frame.countIn!==undefined?`Вступаем после четырёх: ${frame.countIn}`:`${frame.chord||'Мелодия'} · такт ${frame.bar} · доля ${frame.beat}${session().loop&&activeKind!=='ear'?' · круг '+(frame.cycle+1):''}${frame.tempo?' · '+frame.tempo+' уд/мин':''}`;
      if(frame.tempo&&session().tempoLadder&&session().tempo!==frame.tempo){session().tempo=frame.tempo;el('practiceTempo').value=frame.tempo;save();}
      host.querySelectorAll('[data-practice-form-bar]').forEach(n=>n.classList.toggle('is-current',Number(n.dataset.practiceFormBar)===frame.bar));
      host.querySelectorAll('[data-stroke-at]').forEach(n=>n.classList.toggle('is-current',Number(n.dataset.strokeAt)===Math.floor((frame.position??-1)*2)/2));
      const phase=el('practiceCallPhase');if(phase){const teacher=frame.position<8;phase.dataset.phase=frame.countIn||frame.waiting?'ready':teacher?'teacher':'learner';const text=frame.countIn||frame.waiting?'Слушайте отсчёт':teacher?`Слушайте и пойте · образец, такт ${frame.bar} из 2`:`Теперь играйте вы · ответ, такт ${frame.bar-2} из 2`;if(phase.textContent!==text)phase.textContent=text;}
    },onStop(result){
      const kind=activeKind;activeKind=null;
      tab?.highlight(-1);if(el('practiceStop'))el('practiceStop').disabled=true;if(el('practicePlay'))el('practicePlay').disabled=false;
      if(el('practiceNow'))el('practiceNow').textContent=result.error?'Звук не запущен':'Готово к игре';
      if(result.error)message(result.error);
      if(result.finished&&kind==='ear'){earHeard=true;renderEarAnswer();message('Теперь пропойте и найдите услышанные ноты.');}
      if(result.finished&&kind==='study'){session().heard=true;save();}
    }});
    function audio(){const s=study(),v=session();if(v.stage==='call'&&s.callResponse)return s.callResponse;if(v.stage==='rhythm'&&s.rhythmPatterns?.length)return s.rhythmPatterns[v.rhythm]||s.rhythmPatterns[0];if(v.stage==='transitions')return s.drills[v.drill]||s.drills[0];if(v.stage==='ear')return {...s.ear.rounds[v.earRound],progression:[]};if(v.stage==='variation')return {events:v.variation,progression:s.variation.progression};return s;}
    function range(){const total=bars(audio().events),v=session();if(v.stage==='call')return {fromBar:1,toBar:total};return {fromBar:Math.min(v.fromBar,total),toBar:Math.max(Math.min(v.fromBar,total),Math.min(v.toBar,total))};}
    async function play(){
      stopPlayback();stopOthers();const a=audio(),v=session(),ear=v.stage==='ear',melody=ear||v.stage==='call'||(!['free','rhythm'].includes(v.stage)&&v.melody);
      if(!melody&&!v.backing&&!v.metronome){message(['free','rhythm'].includes(v.stage)?'Включите сопровождение или метроном.':'Включите мелодию, сопровождение или метроном.');return;}
      if(ear){earHeard=false;renderEarAnswer();}
      activeKind=ear?'ear':'study';el('practicePlay').disabled=true;el('practiceStop').disabled=false;message('');
      const positions=ear?[]:a.events.map(e=>Number.isInteger(e.str)?{boardId:'practiceBoard',index:(e.str-1)*17+e.fret}:null);
      try{await player.play(a.events,{tempo:v.tempo,tempoLadder:!ear&&v.tempoLadder,progression:a.progression||[],...(!ear?range():{fromBar:1,toBar:bars(a.events)}),loop:ear?false:v.loop,melody,backing:ear?false:v.backing,metronome:ear?false:v.metronome,countIn:true,positions});}
      catch(error){stop();message(error?.message||'Не удалось запустить звук. Проверьте громкость и нажмите «Играть» ещё раз.');}
    }
    function labelControl(parent,text,control){const label=node('label',text);label.appendChild(control);parent.appendChild(label);return control;}
    function checkbox(parent,label,value,onchange,id){const box=node('input');box.type='checkbox';box.checked=value;if(id)box.id=id;const wrap=node('label',undefined,'practice-check');wrap.append(box,node('span',label));parent.appendChild(wrap);box.onchange=()=>onchange(box.checked);return box;}
    function updateSetting(key,value){stop();session()[key]=value;save();}
    function transport(parent){
      const v=session(),a=audio(),ear=v.stage==='ear',transport=node('section',undefined,'practice-transport');transport.id='practiceTransport';transport.setAttribute('aria-label','Управление практикой');parent.appendChild(transport);
      const top=row(transport),start=button(top,ear?'▶ Послушать задание':'▶ Играть',play,'practicePlay');start.classList.add('primary-btn');button(top,'■ Стоп',stop,'practiceStop').disabled=true;
      const tempo=node('input');tempo.type='number';tempo.min=40;tempo.max=120;tempo.value=v.tempo;tempo.id='practiceTempo';tempo.onchange=()=>{updateSetting('tempo',Math.max(40,Math.min(120,Math.round(Number(tempo.value)||60))));tempo.value=v.tempo;};labelControl(top,'Темп',tempo);
      const now=node('p','Готово к игре','practice-now');now.id='practiceNow';now.setAttribute('aria-live','off');transport.appendChild(now);
      if(ear){transport.appendChild(node('p','Сначала слушайте без записи. Начальная нота дана в задании.','hint'));return;}
      const settings=node('details'),limits=range();settings.className='practice-player-settings';settings.appendChild(node('summary',`Такты ${limits.fromBar}–${limits.toBar} · фрагмент и сопровождение`));transport.appendChild(settings);const selects=row(settings);
      if(v.stage!=='call')for(const [key,label] of [['fromBar','С такта'],['toBar','По такт']]){const select=node('select');select.id=key==='fromBar'?'practiceFrom':'practiceTo';for(let i=1;i<=bars(a.events);i++){const option=node('option',String(i));option.value=String(i);select.appendChild(option);}select.value=limits[key];select.onchange=()=>{updateSetting(key,Number(select.value));if(key==='fromBar'&&v.toBar<v.fromBar)v.toBar=v.fromBar;if(key==='toBar'&&v.fromBar>v.toBar)v.fromBar=v.toBar;save();render();};labelControl(selects,label,select);}
      const toggles=row(settings);
      checkbox(toggles,'Повторять',v.loop,value=>{updateSetting('loop',value);render();},'practiceLoop');
      if(!['free','call','rhythm'].includes(v.stage))checkbox(toggles,'Мелодия',v.melody,value=>updateSetting('melody',value),'practiceMelody');
      checkbox(toggles,'Сопровождение',v.backing,value=>updateSetting('backing',value),'practiceBacking');
      checkbox(toggles,'Метроном',v.metronome,value=>updateSetting('metronome',value),'practiceMetronome');
      checkbox(toggles,'+5 уд/мин каждые два круга, до 120',v.tempoLadder,value=>updateSetting('tempoLadder',value),'practiceTempoLadder').disabled=!v.loop;
      const help=v.stage==='call'?'Два такта звучит образец, два такта играете вы.':v.stage==='rhythm'?'Сопровождение показывает моменты ударов; стрелки под схемами — направление руки.':v.stage==='free'?'Мелодия образца выключена: играйте свой ответ.':'Табы показывают выбранные такты; для самостоятельной игры выключите мелодию.';
      settings.appendChild(node('p','Перед началом — четыре доли отсчёта. Повтор идёт без нового отсчёта. '+help,'hint'));
    }
    function board(parent,{onPick=null,reveal=true}={}){
      const s=study(),outer=node('div',undefined,'board-outer');outer.id='practiceBoardOuter';const grid=node('div',undefined,'board');grid.id='practiceBoard';outer.appendChild(grid);parent.appendChild(outer);v2RenderBoard(new Map(),grid.id);
      const [low,high]=s.range;grid.style.gridTemplateColumns=`38px repeat(${high-low+1},minmax(36px,1fr))`;grid.style.minWidth=`${38+(high-low+1)*38}px`;
      grid.querySelectorAll('.fret-label').forEach((n,f)=>n.hidden=f<low||f>high);
      const activeMidi=audio().events.map(e=>e.midi);
      const useful=s.points;
      let focusSet=false;
      grid.querySelectorAll('.cell').forEach((cell,index)=>{
        const str=Math.floor(index/17)+1,fret=index%17;cell.hidden=fret<low||fret>high;if(cell.hidden)return;
        const point=useful.find(p=>p.str===str&&p.fret===fret);if(!point)return;
        const hit=node('button',undefined,'sandbox-hit');hit.type='button';hit.dataset.string=String(str);hit.dataset.fret=String(fret);hit.setAttribute('aria-label',`${pitch(point.midi)}, струна ${str}, лад ${fret}`);hit.tabIndex=focusSet?-1:0;focusSet=true;
        if(reveal&&activeMidi.includes(point.midi)){const dot=node('span',session().labels==='degrees'?String(point.degree??''):session().labels==='none'?'•':pitch(point.midi),'note'+(point.midi%12===s.rootPc?' root':' chord-tone'));hit.appendChild(dot);}
        hit.onfocus=()=>grid.querySelectorAll('.sandbox-hit').forEach(b=>b.tabIndex=b===hit?0:-1);
        hit.onkeydown=e=>{const list=[...grid.querySelectorAll('.sandbox-hit')],i=list.indexOf(hit);if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();list[Math.max(0,Math.min(list.length-1,i+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)))].focus();}};
        hit.onclick=()=>{stop();if(onPick)onPick(point);previewVoices.push(playMidi(point.midi,undefined,.65,.17,{boardId:'practiceBoard',index}));};cell.appendChild(hit);
      });
      parent.appendChild(node('p',`Первая струна сверху. Позиция: лады ${low}–${high}. Цифры в табах — лады; номера пальцев уточнены в подсказке.`, 'practice-board-hint'));
    }
    function score(parent,events,progression,{editable=false}={}){
      const v=session(),controls=row(parent);controls.classList.add('practice-score-options');
      checkbox(controls,'Скрыть табы и гриф',v.hide,value=>{updateSetting('hide',value);render();},'practiceHide');
      const select=node('select');for(const [value,text] of [['notes','Ноты'],['degrees',study().degreeLabel||'Ступени гаммы'],['none','Без подписей']]){const option=node('option',text);option.value=value;select.appendChild(option);}select.value=v.labels;select.onchange=()=>{updateSetting('labels',select.value);render();};labelControl(controls,'Подписи',select);
      const target=node('div',undefined,'practice-score');target.id='practiceTab';parent.appendChild(target);
      if(v.hide){target.appendChild(node('p','Запись скрыта. Слушайте сопровождение и играйте по памяти.','practice-hidden-note'));return;}
      tab=CoursePracticePlayer.renderTab(target,events,{progression,labels:v.labels,rootPc:study().rootPc,degreeByMidi:Object.fromEntries(study().points.map(p=>[p.midi,p.degree])),onSelect:editable?index=>{stop();selectedEvent=index;render();}:null});
      const limits=range();target.querySelectorAll('.practice-tab-bar').forEach((bar,index)=>{if(index+1<limits.fromBar||index+1>limits.toBar){bar.hidden=true;bar.style.display='none';}});
      if(limits.fromBar!==1||limits.toBar!==bars(events)){const fragment=row(target);fragment.appendChild(node('span',`Показаны такты ${limits.fromBar}–${limits.toBar} из ${bars(events)}.`));button(fragment,'Вся мелодия',()=>{stop();v.fromBar=1;v.toBar=bars(events);save();render();},'practiceFullScore');}
      if(editable&&selectedEvent!==null)target.appendChild(node('p',`Выбрана нота ${selectedEvent+1}. Теперь нажмите новую ноту на грифе или ниже.`,'practice-selection'));
      board(parent,{onPick:editable?replaceVariation:null});
    }
    function noteButtons(parent,onPick){const notes=row(parent);notes.classList.add('practice-note-buttons');const seen=new Set();for(const p of study().points){if(seen.has(p.midi))continue;seen.add(p.midi);button(notes,pitch(p.midi)+String(Math.floor(p.midi/12)-1),()=>{stop();onPick(p);previewVoices.push(playMidi(p.midi,undefined,.6,.16));});}}
    function replaceVariation(point){
      if(selectedEvent===null){message('Выберите ноту в табах, которую хотите изменить.');return;}
      const s=session(),previous=s.variation[selectedEvent];s.variation[selectedEvent]={midi:point.midi,beats:previous.beats,str:point.str,fret:point.fret,finger:point.finger};s.variationChecked=false;save();render();message('Нота заменена. Прослушайте ответ и проверьте условие.');
    }
    function renderEarAnswer(){
      const target=el('practiceEarAnswer');if(!target)return;const restoreFocus=rememberFocus(target);target.replaceChildren();const s=study(),v=session(),round=s.ear.rounds[v.earRound],answers=v.earAnswers[v.earRound]||[];
      const entered=node('p','Ваш ответ: '+(answers.length?answers.map(pitch).join(' · '):'пока нет нот'));entered.id='practiceEarEntered';target.appendChild(entered);
      if(!earHeard){target.appendChild(node('p','Дослушайте задание до конца, затем вводите свой ответ.','hint'));return;}
      const pick=point=>{const list=v.earAnswers[v.earRound]||(v.earAnswers[v.earRound]=[]);if(list.length>=round.events.filter(e=>e.midi!==null).length){message('Все места заполнены. Уберите последнюю ноту, если хотите исправить ответ.');return;}list.push(point.midi);v.earPassed[v.earRound]=false;save();renderEarAnswer();};
      noteButtons(target,pick);board(target,{onPick:pick,reveal:false});
      const actions=row(target);button(actions,'Убрать последнюю',()=>{stop();answers.pop();v.earAnswers[v.earRound]=answers;v.earPassed[v.earRound]=false;save();renderEarAnswer();},'practiceEarUndo');
      button(actions,'Проверить на слух',()=>{v.earAttempts[v.earRound]=(v.earAttempts[v.earRound]||0)+1;const error=content.validateEar(s,answers,v.earRound);v.earPassed[v.earRound]=!error;save();message(error||'Последовательность совпала. Теперь повторите её на настоящей гитаре.',!error);renderEarAnswer();},'practiceEarCheck');
      const reveal=button(actions,'Показать ответ',()=>{v.earAssisted[v.earRound]=true;save();renderEarAnswer();message('Ответ открыт с подсказкой. Вернитесь к нему позже без записи.');},'practiceEarReveal');reveal.disabled=!(v.earAttempts[v.earRound]>0);
      if(v.earPassed[v.earRound]||v.earAssisted[v.earRound]){const answer=node('div');answer.id='practiceEarSolution';target.appendChild(answer);tab?.destroy();tab=CoursePracticePlayer.renderTab(answer,round.events,{rootPc:s.rootPc,labels:'notes'});target.appendChild(node('p',v.earAssisted[v.earRound]?'Разобрано с подсказкой.':'Экранный подбор проверен. Исполнение на гитаре оценивается отдельно.','hint'));}
      restoreFocus();
    }
    function formChart(parent){
      const s=study();if(bars(s.events)!==12)return;
      const box=node('section',undefined,'practice-form');box.id='practiceForm';box.setAttribute('aria-label','Форма блюза: три строки по четыре такта');box.appendChild(node('h3','12 тактов · 3 строки по 4'));
      const grid=node('div',undefined,'practice-form-grid');box.appendChild(grid);
      for(let bar=1;bar<=12;bar++){
        const chord=s.progression.find(c=>(bar-1)*4>=c.atBeat&&(bar-1)*4<c.atBeat+c.beats);
        const cell=button(grid,'',()=>{stop();session().fromBar=bar;session().toBar=bar;save();render();});cell.classList.add('practice-form-bar');cell.dataset.practiceFormBar=bar;cell.setAttribute('aria-label',`Повторять такт ${bar}, ${chord?.label||''}`);cell.append(node('small',String(bar)),node('strong',chord?.label||'—'));
      }
      box.appendChild(node('p','Нажмите такт, чтобы разобрать его отдельно. Считайте четыре доли в каждой клетке.','hint'));parent.appendChild(box);
    }
    function chordDiagram(parent,voicing){
      const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 150 190');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${voicing.label}: от шестой струны к первой ${[...voicing.frets].reverse().map(f=>f===null?'не играть':f).join(', ')}`);svg.classList.add('practice-chord-diagram');parent.appendChild(svg);
      const add=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;svg.appendChild(n);};
      add('text',{x:75,y:20,'text-anchor':'middle','font-size':17,'font-weight':700,fill:'currentColor'},voicing.label);
      const positives=voicing.frets.filter(f=>f>0),start=Math.max(...positives,0)>4?Math.min(...positives):1;
      for(let string=6;string>=1;string--){const x=25+(6-string)*20,fret=voicing.frets[string-1];add('line',{x1:x,x2:x,y1:52,y2:152,stroke:'currentColor','stroke-width':.7});add('text',{x,y:177,'text-anchor':'middle','font-size':10,fill:'currentColor'},string);
        if(fret===null||fret===0)add('text',{x,y:43,'text-anchor':'middle','font-size':13,fill:'currentColor'},fret===null?'×':'○');
        else{const y=52+(fret-start+.5)*25;add('circle',{cx:x,cy:y,r:8,fill:'currentColor'});const finger=voicing.fingers?.[string-1];if(finger)add('text',{x,y:y+3,'text-anchor':'middle','font-size':10,fill:'var(--panel)'},finger);}
      }
      for(let fret=0;fret<=4;fret++)add('line',{x1:25,x2:125,y1:52+fret*25,y2:52+fret*25,stroke:'currentColor','stroke-width':fret===0&&start===1?3:1});
      if(start>1)add('text',{x:12,y:69,'font-size':10,fill:'currentColor'},start);
    }
    function rhythmView(parent){
      const s=study(),v=session(),a=audio();parent.appendChild(node('h2','Правая рука держит пульс'));parent.appendChild(node('p',a.instruction,'practice-purpose'));
      const select=node('select');select.id='practiceRhythm';s.rhythmPatterns.forEach((pattern,i)=>{const o=node('option',pattern.title);o.value=i;select.appendChild(o);});select.value=v.rhythm;select.onchange=()=>{stop();v.rhythm=Number(select.value);v.fromBar=1;v.toBar=2;save();render();};labelControl(parent,'Рисунок',select);transport(parent);
      const diagrams=node('div',undefined,'practice-chord-diagrams');(a.voicings||[]).forEach(voicing=>chordDiagram(diagrams,voicing));parent.appendChild(diagrams);
      parent.appendChild(node('p','На схемах: 6-я струна слева, 1-я справа; ○ — открытая, × — не играть; цифры в точках — пальцы.','hint'));
      const pattern=node('section',undefined,'practice-strum');pattern.id='practiceStrum';const limits=range();
      for(let bar=limits.fromBar;bar<=limits.toBar;bar++){
        const row=node('div',undefined,'practice-strum-bar');row.appendChild(node('p',`Такт ${bar} · ${a.progression.find(c=>c.atBeat>=(bar-1)*4&&c.atBeat<bar*4)?.label||''}`));const counts=node('div',undefined,'practice-strum-counts');
        for(let part=0;part<8;part++){const at=(bar-1)*4+part/2,stroke=(a.strokes||[]).find(s=>s.atBeat===at),cell=node('span',undefined,'practice-stroke');cell.dataset.strokeAt=at;cell.append(node('small',part%2?'и':String(part/2+1)),node('strong',stroke?stroke.direction==='up'?'↑':'↓':'·'));cell.setAttribute('aria-label',`${part%2?'и':part/2+1}: ${stroke?stroke.direction==='up'?'удар вверх':'удар вниз':'движение без удара'}`);counts.appendChild(cell);}row.appendChild(counts);pattern.appendChild(row);
      }
      parent.appendChild(pattern);parent.appendChild(node('p','↓ — удар к тонким струнам, ↑ — к толстым. Сохраняйте ровное движение вниз–вверх на «1-и-2-и-3-и-4-и»; на точке пройдите над струнами. Можно играть медиатором. Не ускоряйтесь, пока пульс и смена аккорда не стали удобными.','practice-rhythm-help'));
    }
    function renderRecorder(){
      const target=el('practiceRecorder');if(!target||!recorder)return;const restore=rememberFocus(target),state=recorder.getState();target.replaceChildren();
      target.appendChild(node('p','Запишите короткий дубль и сравните пульс, чистоту и окончания. Запись остаётся в этой вкладке; автоматической оценки нет. Для сопровождения лучше использовать наушники.'));
      const controls=row(target),busy=['requesting','recording','stopping'].includes(state.status);
      const start=button(controls,state.downloaded?'Записать новый дубль':'Начать запись',async()=>{el('practiceTakeAudio')?.pause();await recorder.start(study().title+' · '+session().tempo+' уд/мин');},'practiceRecordStart');start.disabled=!state.supported||busy||!!state.blob&&!state.downloaded;
      const finish=button(controls,'Остановить запись',()=>recorder.stop(),'practiceRecordStop');finish.disabled=!['requesting','recording'].includes(state.status);
      const status=node('p',state.error||({idle:'Микрофон включится только после «Начать запись».',requesting:'Ожидаем доступ к микрофону…',recording:'● Идёт запись. Можно запустить сопровождение и играть.',stopping:'Завершаем дубль…',ready:state.downloaded?'Скачивание начато. Проверьте файл в загрузках.':'Дубль ещё не сохранён в файл. Скачайте его до закрытия или обновления страницы.'}[state.status]||''),'practice-record-status');status.id='practiceRecordStatus';status.setAttribute('role','status');target.appendChild(status);
      if(!state.supported)target.appendChild(node('p','Запись в этом браузере недоступна. Подойдёт диктофон телефона.','hint'));
      if(state.blob){target.appendChild(node('p',state.title,'hint'));const audio=node('audio');audio.id='practiceTakeAudio';audio.controls=true;audio.src=state.url;audio.onplay=()=>{stopPlayback(false);stopOthers();};target.appendChild(audio);
        button(controls,'Скачать дубль',()=>{const extension=state.blob.type.includes('mp4')?'m4a':state.blob.type.includes('ogg')?'ogg':'webm',link=node('a');link.href=state.url;link.download=`fretlab-take-${new Date().toISOString().slice(0,10)}.${extension}`;link.click();recorder.markDownloaded();},'practiceRecordDownload');
        button(controls,'Удалить дубль',()=>{audio.pause();recorder.clear();},'practiceRecordDelete');
      }
      restore();
    }
    function recorderSection(parent){const details=node('details',undefined,'practice-recorder');details.appendChild(node('summary','Записать и послушать свою игру'));const target=node('div');target.id='practiceRecorder';details.appendChild(target);parent.appendChild(details);renderRecorder();}
    function lessonStage(parent){
      const s=study(),v=session();
      if(v.stage==='play'){
        parent.appendChild(node('h2','Сначала сыграйте целую мелодию'));parent.appendChild(node('p','Послушайте образец, пропойте его и сыграйте по два такта. Начните в спокойном темпе, затем соедините фрагменты.'));
        transport(parent);formChart(parent);score(parent,s.events,s.progression);
      }else if(v.stage==='call'&&s.callResponse){
        parent.appendChild(node('h2','Услышали вопрос — сыграйте ответ'));parent.appendChild(node('p',s.callResponse.instruction,'practice-purpose'));transport(parent);
        const phase=node('p','Два такта образца → два такта вашего ответа','practice-call-phase');phase.id='practiceCallPhase';phase.dataset.phase='ready';phase.setAttribute('aria-live','polite');parent.appendChild(phase);score(parent,s.callResponse.events,s.callResponse.progression);
        parent.appendChild(node('p','В тактах 3–4 мелодия образца замолкает, сопровождение продолжает звучать. Сначала повторите услышанное; затем измените ритм или окончание.','hint'));
      }else if(v.stage==='rhythm'&&s.rhythmPatterns?.length){
        rhythmView(parent);
      }else if(v.stage==='transitions'){
        parent.appendChild(node('h2','Как мелодия проходит через смену аккорда'));const select=node('select');select.id='practiceDrill';s.drills.forEach((d,i)=>{const o=node('option',`${i+1}. ${d.title}`);o.value=String(i);select.appendChild(o);});select.value=v.drill;select.onchange=()=>{stop();v.drill=Number(select.value);v.fromBar=1;v.toBar=bars(s.drills[v.drill].events);save();render();};labelControl(parent,'Упражнение',select);
        const drill=s.drills[v.drill];parent.appendChild(node('p',drill.explanation,'practice-purpose'));transport(parent);score(parent,drill.events,drill.progression);
      }else if(v.stage==='ear'){
        parent.appendChild(node('h2','Услышьте → пропойте → найдите'));const select=node('select');select.id='practiceEarRound';s.ear.rounds.forEach((_,i)=>{const o=node('option',`Пример ${i+1}${v.earPassed[i]?' · подобран':''}${v.earAssisted[i]?' · с подсказкой':''}`);o.value=String(i);select.appendChild(o);});select.value=v.earRound;select.onchange=()=>{stop();v.earRound=Number(select.value);earHeard=false;save();render();};labelControl(parent,'Короткий мотив',select);
        const task=s.ear.rounds[v.earRound];parent.appendChild(node('p',task.instruction));parent.appendChild(node('p',`Начните от ${pitch(task.startingMidi)}${Math.floor(task.startingMidi/12)-1}. Сначала найдите звуки на гитаре, затем введите ответ.`,'practice-purpose'));transport(parent);const answer=node('div');answer.id='practiceEarAnswer';parent.appendChild(answer);renderEarAnswer();
      }else if(v.stage==='variation'){
        parent.appendChild(node('h2','Измените окончание, сохраните мотив'));parent.appendChild(node('p',s.variation.instruction,'practice-purpose'));transport(parent);score(parent,v.variation,s.variation.progression,{editable:true});
        if(!v.hide){noteButtons(parent,replaceVariation);const select=node('select');select.id='practiceEventSelect';const empty=node('option','Выберите ноту для замены');empty.value='';select.appendChild(empty);v.variation.forEach((e,i)=>{const option=node('option',`${i+1}: ${pitch(e.midi)}`);option.value=String(i);select.appendChild(option);});select.value=selectedEvent===null?'':String(selectedEvent);select.onchange=()=>{stop();selectedEvent=select.value===''?null:Number(select.value);render();};labelControl(parent,'Редактирование',select);}
        const actions=row(parent);button(actions,'Проверить изменение',()=>{const error=content.validateVariation(s,v.variation);v.variationChecked=!error;save();message(error||'Изменение выполнено: мотив сохранён, окончание изменено по условию. Теперь сыграйте оба варианта.',!error);},'practiceVariationCheck');button(actions,'Вернуть образец',()=>{stop();v.variation=copy(s.variation.sourceEvents);v.variationChecked=false;selectedEvent=null;save();render();},'practiceVariationReset');
        if(v.variationChecked)parent.appendChild(node('p','Структура вариации проверена. Качество исполнения оцените после игры.','practice-verified'));
      }else{
        parent.appendChild(node('h2','Ваш ответ под сопровождение'));parent.appendChild(node('p','Сыграйте изученную мелодию, затем свой ответ. Сохраняйте узнаваемый рисунок и меняйте ритм или окончание при смене аккорда. Мелодия образца в этом режиме не звучит.','practice-purpose'));transport(parent);formChart(parent);score(parent,s.events,s.progression);parent.appendChild(node('p','Сначала играйте только окончания на звуках аккорда. Затем соедините их коротким мотивом. Подсказки можно скрыть.','hint'));
      }
    }
    function plan(parent){
      const s=study(),v=session(),details=node('details');details.className='practice-plan';details.appendChild(node('summary',`План на сегодня · ${s.sessions[v.session].title}`));parent.appendChild(details);const choices=row(details);s.sessions.forEach((item,i)=>{const b=button(choices,`${i+1}. ${item.title}`,()=>{stop();v.session=i;save();render();});b.setAttribute('aria-pressed',String(i===v.session));});const list=node('ol');s.sessions[v.session].tasks.forEach(text=>list.appendChild(node('li',text)));details.appendChild(list);details.appendChild(node('p','Ориентир — 30 минут. Можно разделить занятие; увеличивайте время игры, если нужно повторение.','hint'));
      if(v.note)parent.appendChild(node('p','Ваше трудное место: '+v.note,'practice-return-note'));
    }
    function journal(parent){
      const s=study(),v=session(),details=node('details');details.className='practice-journal';details.open=v.stage==='free';details.appendChild(node('summary','После игры: результат и следующая попытка'));parent.appendChild(details);details.appendChild(node('p','Эти пункты — ваша самопроверка реальной игры. Приложение не измеряет чистоту звука и пульс инструмента.'));
      s.checks.forEach((text,i)=>checkbox(details,text,!!v.checks[i],value=>{v.checks[i]=value;save();},`practiceCheck${i}`));
      const note=node('textarea');note.id='practiceNote';note.rows=2;note.maxLength=1000;note.value=v.note;note.placeholder='Например: переход в третий такт, повторить медленнее';note.oninput=()=>{v.note=note.value;save();};labelControl(details,'Что повторить в следующий раз',note);
      const recording=node('textarea');recording.id='practiceRecording';recording.rows=2;recording.maxLength=1000;recording.value=v.recording;recording.placeholder='Название записи или ссылка для преподавателя';recording.oninput=()=>{v.recording=recording.value;save();};labelControl(details,'Моя запись исполнения — по желанию',recording);details.appendChild(node('p','Запишите короткий дубль на телефон. Здесь можно сохранить заметку или ссылку; файл никуда автоматически не отправляется.','hint'));
      button(details,'Сохранить результат игры',()=>{v.attempts.push({date:Date.now(),tempo:v.tempo,note:v.note,checks:[...v.checks]});v.attempts=v.attempts.slice(-12);save();message('Самопроверка сохранена. В следующий раз начните с отмеченного трудного места.',true);},'practiceSaveAttempt');
      if(v.attempts.length){const last=v.attempts.at(-1);details.appendChild(node('p',`Последняя сохранённая попытка: ${new Date(last.date).toLocaleDateString('ru-RU')}, ${last.tempo} уд/мин. Отмечено ${last.checks.filter(Boolean).length} из ${s.checks.length} пунктов.`,'hint'));}
    }
    function exportWork(){const s=study(),v=session(),data={format:'fretlab-practice-v1',study:s.id,title:s.title,stage:v.stage,drill:v.drill,rhythm:v.rhythm,session:v.session,tempo:v.tempo,tempoLadder:v.tempoLadder,fromBar:v.fromBar,toBar:v.toBar,variation:v.variation,earAnswers:v.earAnswers,earPassed:v.earPassed,earAssisted:v.earAssisted,earAttempts:v.earAttempts,checks:v.checks,note:v.note,recording:v.recording,attempts:v.attempts,savedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download=`fretlab-practice-${s.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    function stageAvailable(id){return STAGES.some(([key])=>id===key)&&!(id==='call'&&!study().callResponse)&&!(id==='rhythm'&&!study().rhythmPatterns?.length);}
    function setStage(id){if(!stageAvailable(id))return;const v=session();v.stage=id;earHeard=false;selectedEvent=null;if(id==='free'){v.loop=true;v.backing=true;}v.fromBar=1;v.toBar=bars(audio().events);}
    function render(){
      const scroll=window.scrollY,restoreFocus=rememberFocus(host),expanded=[...host.querySelectorAll('details[open]')].map(d=>d.className);stop();tab?.destroy();tab=null;host.replaceChildren();const s=study(),v=session();v.variationChecked=!content.validateVariation(s,v.variation);
      const heading=node('header',undefined,'practice-heading');host.appendChild(heading);button(heading,'← К курсу',close,'practiceBack');const eyebrow=node('p','Практика на гитаре · '+s.prerequisite,'course-eyebrow');heading.append(eyebrow,node('h1',s.title),node('p',s.purpose,'practice-purpose'));
      const chooser=node('select');chooser.id='practiceStudy';studies.forEach(item=>{const option=node('option',item.title);option.value=item.id;chooser.appendChild(option);});chooser.value=s.id;chooser.onchange=()=>open(chooser.value);labelControl(heading,'Учебная миниатюра',chooser);plan(host);
      const stages=node('nav',undefined,'practice-stages');stages.setAttribute('aria-label','Способы работы с миниатюрой');host.appendChild(stages);STAGES.filter(([id])=>stageAvailable(id)).forEach(([id,label])=>{const b=button(stages,label,()=>{stop();setStage(id);save();render();});b.dataset.practiceStage=id;b.setAttribute('aria-pressed',String(v.stage===id));});
      const workspace=node('section',undefined,'practice-workspace');host.appendChild(workspace);lessonStage(workspace);const feedback=node('p',undefined,'sandbox-readout');feedback.id='practiceFeedback';feedback.hidden=true;feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');workspace.appendChild(feedback);
      const tips=node('details');tips.className='practice-tips';tips.appendChild(node('summary','Аппликатура и подсказки для игры'));const list=node('ul');s.tips.forEach(text=>list.appendChild(node('li',text)));tips.appendChild(list);workspace.appendChild(tips);journal(host);recorderSection(host);
      const output=row(host);output.classList.add('practice-export');button(output,'Скачать свою работу',exportWork,'practiceExport');const print=button(output,'Распечатать табы / PDF',()=>{if(v.stage==='ear'){message('Для печати откройте «Сыграть» или «Изменить».');return;}if(v.hide){v.hide=false;save();render();}window.print();},'practicePrint');print.disabled=v.stage==='ear';
      const storage=node('p',undefined,'hint');storage.id='practiceStorage';host.appendChild(storage);host.querySelectorAll('details').forEach(d=>{if(expanded.includes(d.className))d.open=true;});save();restoreFocus();window.scrollTo(window.scrollX,scroll);
    }
    function open(id='cf',options={}){
      if(!studies.some(s=>s.id===id))id=studies.some(s=>s.id==='cf')?'cf':studies[0].id;stop();stopOthers();state.study=id;if(options?.stage)setStage(options.stage);earHeard=false;selectedEvent=null;opening=true;el('tab-course').click();opening=false;el('courseHome').hidden=true;el('courseWork').hidden=true;host.hidden=false;render();host.querySelector('h1').tabIndex=-1;host.querySelector('h1').focus({preventScroll:true});host.scrollIntoView({block:'start'});
    }
    function close(){stop();host.hidden=true;el('tab-course').click();el('courseHome').hidden=false;el('courseWork').hidden=true;}
    document.addEventListener('click',event=>{const entry=event.target.closest?.('[data-practice-open]');if(entry){event.preventDefault();open(entry.dataset.practiceOpen);}});
    document.querySelectorAll('[role="tab"]').forEach(t=>t.addEventListener('click',()=>{if(!opening){stop();host.hidden=true;}}));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',()=>{stop();recorder.destroy();});
    window.addEventListener('beforeprint',()=>{if(!host.hidden){stop();document.body.classList.add('practice-print');}});
    window.addEventListener('afterprint',()=>document.body.classList.remove('practice-print'));
    const params=new URLSearchParams(location.search),entry=params.get('practice');if(entry&&studies.some(s=>s.id===entry))open(entry,{stage:params.get('stage')||params.get('practiceStage')});
    return {open,close,stop,getState:()=>copy(state)};
  }
  return {KEY,cleanState,createLocalRecorder,boot};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CoursePractice;
else window.coursePractice=CoursePractice.boot();
