/* Seven diatonic triads, their practical voicings and listening contexts. */
const CourseReviewSupport=(()=>{
  const OPEN={1:64,2:59,3:55,4:50,5:45,6:40};
  const SCALE=[0,2,4,5,7,9,11],NAMES=['C','D','E','F','G','A','B'];
  const definitions=[
    ['C','I','мажорное',[[5,3],[4,2],[3,0]]],
    ['Dm','ii','минорное',[[4,0],[3,2],[2,3],[1,1]]],
    ['Em','iii','минорное',[[4,2],[3,0],[2,0]]],
    ['F','IV','мажорное',[[4,3],[3,2],[2,1]]],
    ['G','V','мажорное',[[6,3],[5,2],[4,0]]],
    ['Am','vi','минорное',[[3,2],[2,1],[1,0]]],
    ['Bdim','vii°','уменьшённое',[[3,4],[2,3],[1,1]]]
  ];
  const chords=definitions.map(([name,roman,quality,coords],i)=>({name,roman,quality,rootPc:SCALE[i],notes:[0,2,4].map(n=>NAMES[(i+n)%7]),pcs:[0,2,4].map(n=>SCALE[(i+n)%7]),points:coords.map(([str,fret])=>({str,fret,midi:OPEN[str]+fret}))}));
  const seventh={name:'G7',roman:'V7',quality:'мажорное трезвучие с малой септимой',rootPc:7,notes:['G','B','D','F'],pcs:[7,11,2,5],points:[[6,3],[5,2],[4,0],[3,0],[2,0],[1,1]].map(([str,fret])=>({str,fret,midi:OPEN[str]+fret}))};
  const progressions=[{name:'I → IV → V → I',names:['C','F','G','C'],why:'У C, F и G разные опоры. Последний C возвращает к тонике.'},{name:'I → vi → IV → V',names:['C','Am','F','G'],why:'Am — минорное трезвучие VI ступени C major. В нём две общие ноты с C: C и E.'},{name:'ii → V7 → I',names:['Dm','G7','C'],why:'Сначала Dm, затем G7 и возвращение к C. Терция B аккорда G7 может перейти в C, его септима F — в E.'}];
  function plan(names){return {events:names.map(()=>({midi:null,beats:4})),progression:names.map((name,i)=>{const c=[...chords,seventh].find(c=>c.name===name);if(!c)throw Error('Неизвестный аккорд');return {atBeat:i*4,beats:4,label:c.name,notes:c.points.map(p=>p.midi)};})};}
  function boot(){
    const host=document.getElementById('courseHarmony');if(!host)return null;
    const el=id=>document.getElementById(id),node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
    let returnTo=null,selected=chords[0],voices=[];
    const player=CoursePracticePlayer.createPlayer({onFrame:f=>{if(f.chord){const c=[...chords,seventh].find(c=>c.name===f.chord);if(c)show(c);}el('harmonyNow').textContent=f.countIn?`Отсчёт ${f.countIn}`:f.chord?`${f.chord} · такт ${f.bar}`:'Готовимся';},onStop:()=>{el('harmonyStop').disabled=true;el('harmonyNow').textContent='Готово к сравнению';}});
    function stop(){player.stop();voices.forEach(v=>{try{v?.stop();}catch{}});voices=[];}
    function stopOthers(){window.coursePractice?.stop();window.courseComplete?.stop();window.courseBlockTwo?.stop();window.courseBlockOne?.stop();window.courseSandbox?.stop();window.sandboxIdeas?.stop?.();stopSequence();}
    const button=(parent,text,fn,id)=>{const b=node('button',text);b.type='button';b.className='play-btn';if(id)b.id=id;b.onclick=fn;parent.appendChild(b);return b;};
    const heading=node('h2','Семь трезвучий из семи нот');heading.tabIndex=-1;host.appendChild(heading);
    host.appendChild(node('p','В C major: C–D–E–F–G–A–B. От каждой ноты берём ещё две через одну ступень гаммы. Получаются три мажорных, три минорных и одно уменьшённое трезвучие.'));
    const cards=node('div');cards.className='harmony-cards';host.appendChild(cards);
    chords.forEach(c=>{const b=button(cards,`${c.roman} · ${c.name}`,()=>{stop();show(c);},`harmony-${c.name}`);b.title=c.notes.join('–');b.setAttribute('aria-pressed','false');});
    const details=node('p');details.id='harmonyDetails';details.className='sandbox-readout';host.appendChild(details);
    const outer=node('div');outer.className='board-outer';const board=node('div');board.id='harmonyBoard';board.className='board';outer.appendChild(board);host.appendChild(outer);
    function show(c){selected=c;host.querySelectorAll('.harmony-cards button').forEach(b=>b.setAttribute('aria-pressed',String(b.id==='harmony-'+c.name)));details.textContent=`${c.roman}: ${c.name} — ${c.quality}. Состав ${c.notes.join('–')}. Нажмите точку, чтобы услышать отдельный звук.`;v2RenderBoard(new Map(),board.id);board.style.gridTemplateColumns='38px repeat(6,minmax(38px,1fr))';board.style.minWidth='278px';board.querySelectorAll('.fret-label').forEach((n,f)=>n.hidden=f>5);board.querySelectorAll('.cell').forEach((cell,index)=>{const str=Math.floor(index/(FRET_COUNT+1))+1,fret=index%(FRET_COUNT+1);cell.hidden=fret>5;if(cell.hidden)return;const p=c.points.find(p=>p.str===str&&p.fret===fret);if(!p)return;const b=node('button');b.type='button';b.className='sandbox-hit';const name=c.notes[c.pcs.indexOf(p.midi%12)];b.setAttribute('aria-label',`${name}, струна ${str}, лад ${fret}`);const dot=node('span',name);dot.className='note '+(p.midi%12===c.rootPc?'root':'chord-tone');b.appendChild(dot);b.onclick=()=>{stop();stopOthers();voices.push(playMidi(p.midi,undefined,.8,.16,{boardId:board.id,index}));};cell.appendChild(b);});}
    host.appendChild(node('p','Первая струна сверху. Показана одна аппликатура, не все возможные положения. Ноты гаммы считаем от C; основной тон каждого аккорда выделен золотым.'));
    const controls=node('div');controls.className='sandbox-controls';host.appendChild(controls);
    async function play(names){stop();stopOthers();const data=plan(names);el('harmonyStop').disabled=false;try{await player.play(data.events,{progression:data.progression,tempo:72,countIn:true,melody:false,loop:false});}catch{el('harmonyNow').textContent='Звук не запущен. Нажмите ещё раз.';}}
    button(controls,'▶ Выбранный аккорд',()=>play([selected.name]));button(controls,'▶ Все семь по очереди',()=>play(chords.map(c=>c.name)));
    button(controls,'■ Стоп',stop,'harmonyStop').disabled=true;
    const status=node('p','Готово к сравнению');status.id='harmonyNow';status.setAttribute('role','status');host.appendChild(status);
    const sequence=node('div');sequence.className='harmony-progressions';host.appendChild(sequence);
    progressions.forEach(p=>{const card=node('article');card.appendChild(node('h3',p.name));card.appendChild(node('p',p.why));button(card,'▶ '+p.names.join(' → '),()=>play(p.names));sequence.appendChild(card);});
    host.appendChild(node('p','Для G7 к G–B–D добавляем F. Это V7 в C major: малая септима от G. Сравните звучание G и G7, затем возвращение к C.'));
    button(host,'Показать G7 на грифе',()=>{stop();show(seventh);});
    button(host,'Сыграть этюд G7 → C',()=>{stop();window.coursePractice?.open('cadence');});
    button(host,'Вернуться к уроку',()=>{stop();if(returnTo)window.courseComplete.open(returnTo.module,returnTo.index);else{el('courseHarmonyDetails').open=false;el('courseResume').focus();}},'harmonyReturn');
    function openHarmony(from=null){stop();returnTo=from;el('tab-course').click();el('courseHarmonyDetails').open=true;heading.focus({preventScroll:true});host.scrollIntoView({block:'start'});}
    document.querySelectorAll('[role="tab"]').forEach(t=>t.addEventListener('click',stop));document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
    el('courseHarmonyDetails').addEventListener('toggle',()=>{if(!el('courseHarmonyDetails').open)stop();});
    // Keep the task controls beside the task, rather than at the end of a long page.
    const nav=document.querySelector('#courseWork .course-navigation');if(nav)el('courseStepBody').before(nav);
    show(selected);return {stop,openHarmony};
  }
  return {chords,seventh,progressions,plan,boot};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CourseReviewSupport;
else window.courseReview=CourseReviewSupport.boot();
