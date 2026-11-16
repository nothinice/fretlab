/* Rhythmic TAB and bounded look-ahead practice transport. No pitch-to-fret guessing. */
const CoursePracticePlayer=(()=>{
  'use strict';
  const OPEN={1:64,2:59,3:55,4:50,5:45,6:40};
  const NAMES=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const DEGREES=['1','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'];
  const mod=n=>(n%12+12)%12;
  function validateEvents(events){
    if(!Array.isArray(events)||!events.length||events.length>256)return 'Нужна фраза от 1 до 256 событий.';
    if(events.some(e=>!e||![.5,1,2,4].includes(e.beats)||!(e.midi===null||Number.isInteger(e.midi)&&e.midi>=0&&e.midi<=127)))return 'Проверьте ноты и длительности фразы.';
    if(events.reduce((sum,e)=>sum+e.beats,0)>128)return 'Фраза должна быть не длиннее 32 тактов.';
    if(events.some(e=>e.midi!==null&&(e.str!==undefined||e.fret!==undefined)&&(!Number.isInteger(e.str)||!OPEN[e.str]||!Number.isInteger(e.fret)||e.fret<0||e.fret>16||OPEN[e.str]+e.fret!==e.midi)))return 'Струна и лад должны соответствовать высоте ноты.';
    return '';
  }
  function sliceRange(events,{progression=[],fromBar=1,toBar}={}){
    const issue=validateEvents(events);if(issue)throw Error(issue);
    const total=events.reduce((sum,e)=>sum+e.beats,0),bars=Math.ceil(total/4);
    if(toBar===undefined)toBar=bars;
    if(!Number.isInteger(fromBar)||!Number.isInteger(toBar)||fromBar<1||toBar<fromBar||toBar>bars)throw Error('Выберите существующие такты от начала до конца фрагмента.');
    if(!Array.isArray(progression)||progression.length>128)throw Error('Проверьте сопровождение.');
    let previousEnd=0;
    for(const c of progression){
      if(!c||!Number.isFinite(c.atBeat)||c.atBeat<previousEnd||!Number.isFinite(c.beats)||c.beats<=0||c.atBeat+c.beats>total||!Array.isArray(c.notes)||!c.notes.length||c.notes.length>6||c.notes.some(n=>!Number.isInteger(n)||n<0||n>127))throw Error('Проверьте границы и звуки аккордов сопровождения.');
      previousEnd=c.atBeat+c.beats;
    }
    const startBeat=(fromBar-1)*4,endBeat=Math.min(toBar*4,total);let offset=0;
    const selected=[];
    events.forEach((e,index)=>{const at=offset;offset+=e.beats;const start=Math.max(at,startBeat),end=Math.min(offset,endBeat);if(end>start)selected.push({...e,index,atBeat:start-startBeat,originalAtBeat:at,beats:end-start,tied:start>at});});
    const chords=progression.flatMap((c,index)=>{const start=Math.max(c.atBeat,startBeat),end=Math.min(c.atBeat+c.beats,endBeat);return end>start?[{...c,index,label:String(c.label||''),notes:[...new Set(c.notes)],atBeat:start-startBeat,beats:end-start}]:[];});
    return {events:selected,progression:chords,startBeat,endBeat,length:endBeat-startBeat,total,fromBar,toBar};
  }
  function renderTab(container,events,{progression=[],onSelect=null,labels='notes',rootPc=0,degreeByMidi=null,hidden=false}={}){
    const doc=container.ownerDocument||document,ns='http://www.w3.org/2000/svg';
    const root=doc.createElement('div');root.className='practice-tab';root.hidden=hidden;root.style.minWidth='0';container.appendChild(root);
    const symbols=[];let last=-1;
    const add=(parent,tag,attrs={},value)=>{const el=doc.createElementNS(ns,tag);for(const [key,val] of Object.entries(attrs))el.setAttribute(key,String(val));if(value!==undefined)el.textContent=String(value);parent.appendChild(el);return el;};
    function message(text){const p=doc.createElement('p');p.className='practice-tab-warning';p.textContent=text;root.appendChild(p);}
    const issue=events?.length?validateEvents(events):'';
    if(issue)message(issue);
    else if(!events?.length)message('Добавьте ноты — здесь появятся ритмические табы.');
    else{
      const missing=events.some(e=>e.midi!==null&&(e.str===undefined||e.fret===undefined));
      if(missing)message('Выберите аппликатуру для нот со знаком «?»: одна высота может находиться на разных струнах.');
      const total=events.reduce((sum,e)=>sum+e.beats,0),bars=Math.ceil(total/4);let at=0;
      const timeline=events.map((e,index)=>{const t={...e,index,at};at+=e.beats;return t;});
      const grid=doc.createElement('div');grid.className='practice-tab-grid';grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:12px;min-width:0';root.appendChild(grid);
      for(let bar=0;bar<bars;bar++){
        const svg=add(grid,'svg',{viewBox:'0 0 332 258',class:'practice-tab-bar',role:'group',fill:'currentColor','aria-label':`Такт ${bar+1}, размер 4/4`,style:'width:100%;min-width:0;display:block;color:var(--ink);background:var(--panel);border:1px solid var(--border);border-radius:8px'});
        add(svg,'text',{x:12,y:19,'font-size':12,fill:'var(--muted)'},`Такт ${bar+1} · 4/4`);
        const chords=progression.filter(c=>c.atBeat<bar*4+4&&c.atBeat+c.beats>bar*4);
        for(const c of chords){const x=40+Math.max(0,c.atBeat-bar*4)*68;add(svg,'text',{x,y:41,'font-size':14,'font-weight':600},c.label||'Аккорд');}
        for(let str=1;str<=6;str++){
          const y=76+(str-1)*16;
          add(svg,'text',{x:9,y:y+4,'font-size':11,fill:'var(--muted)'},['e','B','G','D','A','E'][str-1]);
          add(svg,'line',{x1:30,x2:319,y1:y,y2:y,stroke:'currentColor','stroke-width':.7,opacity:.45});
        }
        for(const x of [30,319])add(svg,'line',{x1:x,x2:x,y1:72,y2:160,stroke:'currentColor','stroke-width':1.2});
        for(let beat=0;beat<4;beat++){
          add(svg,'text',{x:40+beat*68,y:232,'font-size':12,fill:'var(--muted)'},String(beat+1));
          add(svg,'text',{x:74+beat*68,y:232,'font-size':10,fill:'var(--muted)'},'и');
        }
        const displayed=timeline.flatMap(e=>{
          let start=Math.max(e.at,bar*4);const end=Math.min(e.at+e.beats,bar*4+4),segments=[];
          // A note crossing a bar line can leave 2.5 or 3.5 beats: use tied
          // conventional durations, never a misleading dotted half note.
          while(start<end){const beats=[4,3,2,1.5,1,.5].find(n=>n<=end-start);segments.push({e,start,end:start+beats});start+=beats;}
          return segments;
        });
        for(const {e,start,end} of displayed){
          const x=40+(start-bar*4)*68,beats=end-start,rest=e.midi===null,continued=start>e.at;
          const description=rest?`Пауза, ${beats} доли`:`${NAMES[mod(e.midi)]}${Math.floor(e.midi/12)-1}, ${e.str?`струна ${e.str}, лад ${e.fret}`:'аппликатура не выбрана'}, ${beats} доли`;
          const g=add(svg,'g',{'data-tab-event':e.index,class:'practice-tab-event'+(rest?' is-rest':''),role:onSelect?'button':'img','aria-label':`Такт ${bar+1}, доля ${start-bar*4+1}: ${continued?'продолжение, ':''}${description}`,tabindex:onSelect?0:-1});symbols.push({g,index:e.index});
          const hit=add(g,'rect',{x:x-10,y:48,width:Math.max(28,Math.min(beats*68-4,319-x+8)),height:169,rx:4,fill:'transparent',class:'practice-tab-hit'});
          if(onSelect){g.style.cursor='pointer';g.addEventListener('click',()=>onSelect(e.index));g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(e.index);}});}
          if(rest){
            if(beats===2||beats===3||beats===4){add(g,'line',{x1:x-9,x2:x+9,y1:190,y2:190,stroke:'currentColor','stroke-width':1});add(g,'rect',{x:x-6,y:beats===4?190:185,width:12,height:5,fill:'currentColor'});}
            else if(beats===.5){add(g,'circle',{cx:x-2,cy:185,r:3,fill:'currentColor'});add(g,'path',{d:`M ${x-2} 185 Q ${x+7} 191 ${x+8} 179 L ${x+1} 205`,stroke:'currentColor','stroke-width':2,fill:'none'});}
            else add(g,'path',{d:`M ${x-4} 177 l 9 9 -6 8 7 8 q -14 -3 -7 7 q -11 -6 -2 -12 l -4 -8 7 -5 Z`,fill:'currentColor'});
            if(beats===3||beats===1.5)add(g,'circle',{cx:x+12,cy:190,r:1.6,fill:'currentColor'});
          }else{
            const hasPosition=Number.isInteger(e.str)&&Number.isInteger(e.fret),y=hasPosition?76+(e.str-1)*16:112;
            add(g,'rect',{x:x-9,y:y-9,width:22,height:18,rx:3,fill:'var(--panel)'});
            add(g,'text',{x:x+2,y:y+5,'text-anchor':'middle','font-size':16,'font-weight':600,fill:hasPosition?'currentColor':'var(--muted)'},hasPosition?e.fret:'?');
            if(continued||end<e.at+e.beats)add(g,'path',{d:`M${x-7} ${y+12} Q${x+3} ${y+20} ${x+13} ${y+12}`,stroke:'currentColor',fill:'none','stroke-width':1.2});
            if(e.finger!==undefined)add(g,'text',{x:x+14,y:y-6,'font-size':9,fill:'var(--muted)'},e.finger);
            const base=beats>=4?4:beats>=2?2:beats>=1?1:.5;
            add(g,'ellipse',{cx:x,cy:201,rx:5,ry:3.5,transform:`rotate(-20 ${x} 201)`,fill:base>=2?'var(--panel)':'currentColor',stroke:'currentColor','stroke-width':1.2});
            if(base<4)add(g,'line',{x1:x+4,x2:x+4,y1:200,y2:176,stroke:'currentColor','stroke-width':1.4});
            if(base===.5)add(g,'path',{d:`M ${x+4} 176 Q ${x+19} 186 ${x+8} 194 Q ${x+17} 184 ${x+4} 183`,fill:'currentColor'});
            if(beats!==base){add(g,'circle',{cx:x+11,cy:201,r:1.6,fill:'currentColor'});if(beats!==base*1.5)add(g,'text',{x:x+5,y:216,'font-size':9,fill:'var(--muted)'},`${beats} д.`);}
            if(labels!=='none')add(g,'text',{x,y:250,'text-anchor':'middle','font-size':10,fill:'var(--muted)'},labels==='degrees'?(degreeByMidi?.[e.midi]??DEGREES[mod(e.midi-rootPc)]):NAMES[mod(e.midi)]);
          }
          // Explicit hit region remains behind ink; keyboard focus uses the group.
          hit.setAttribute('pointer-events','all');
        }
      }
      const legend=doc.createElement('p');legend.className='practice-tab-legend';legend.style.cssText='font-size:12px;color:var(--muted);margin:8px 0';legend.textContent='Сверху тонкая струна e. Цифры на линиях — лады; ритм и счёт — под струнами. 0 — открытая струна.'+(events.some(e=>e.finger!==undefined)?' Маленькие цифры рядом — пальцы: 1 указательный, 2 средний, 3 безымянный, 4 мизинец.':'');root.appendChild(legend);
    }
    function highlight(index){if(last===index)return;last=index;for(const s of symbols){const active=s.index===index;s.g.classList.toggle('is-playing',active);s.g.querySelector('.practice-tab-hit')?.setAttribute('fill',active?'var(--warn-bg, #f4ddb2)':'transparent');}}
    function destroy(){symbols.length=0;root.remove();}
    return {highlight,destroy,element:root};
  }
  function createPlayer({onFrame=()=>{},onStop=()=>{},context=()=>getAudioCtx(),note=(...args)=>playMidi(...args),tap=(...args)=>playMetronome(...args),setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}){
    let generation=0,playing=false,timer=null,pendingResume=null,voices=new Set(),lastFrame='';
    function finish(finished,error){
      const active=playing;generation++;playing=false;if(timer!==null)clearTimer(timer);timer=null;
      if(pendingResume){clearTimer(pendingResume.timer);pendingResume.cancel();pendingResume=null;}
      for(const record of voices){try{record.voice?.stop();}catch(_){}}voices.clear();lastFrame='';
      if(active)onStop({finished,...(error?{error:String(error.message||error)}:{})});
    }
    function stop(){finish(false);}
    function remember(voice,end){if(!voice)return;const record={voice,end};voices.add(record);voice.addEventListener?.('ended',()=>voices.delete(record));}
    async function play(events,options={}){
      stop();
      const plan=sliceRange(events,options),tempo=Math.max(40,Math.min(120,Number(options.tempo)||60)),beatSeconds=60/tempo;
      const lead=options.countIn===false?0:4,loop=options.loop===true,items=[];
      if(options.melody!==false)for(const e of plan.events)if(e.midi!==null)items.push({kind:'melody',at:e.atBeat,duration:e.beats,midi:e.midi,index:e.index});
      if(options.backing!==false)for(const c of plan.progression)for(const midi of c.notes)items.push({kind:'backing',at:c.atBeat,duration:c.beats,midi});
      if(options.metronome)for(let at=0;at<plan.length;at++)items.push({kind:'click',at,duration:.1,accent:(plan.startBeat+at)%4===0});
      items.sort((a,b)=>a.at-b.at);
      const ticket=generation;playing=true;let ctx;
      try{
        ctx=context();
        if(ctx.state&&ctx.state!=='running'){
          const operation={timer:null,cancel:null};
          const cancelled=new Promise(resolve=>{operation.cancel=resolve;});pendingResume=operation;
          try{
            await Promise.race([Promise.resolve().then(()=>ticket===generation?ctx.resume():undefined),cancelled,new Promise((_,reject)=>{operation.timer=setTimer(()=>reject(Error('Браузер не запустил звук. Нажмите «Играть» ещё раз.')),3000);})]);
          }finally{clearTimer(operation.timer);if(pendingResume===operation)pendingResume=null;}
          if(ticket!==generation)return null;
          if(ctx.state!=='running')throw Error('Звук недоступен. Проверьте настройки браузера.');
        }
        if(ticket!==generation)return null;
        const start=ctx.currentTime+.08,musicStart=start+lead*beatSeconds,cycleSeconds=plan.length*beatSeconds;
        let countIndex=0,cycle=0,itemIndex=0;
        function emit(item,at,duration){
          if(item.kind==='click'){if(at>=ctx.currentTime-.015)remember(tap(Math.max(at,ctx.currentTime),item.accent,.085),Math.max(at,ctx.currentTime)+.1);return;}
          const end=at+duration;if(end<=ctx.currentTime)return;
          const when=Math.max(at,ctx.currentTime),voice=note(item.midi,when,end-when,item.kind==='backing'?.04:.17,item.kind==='melody'?options.positions?.[item.index]||null:null,'held');remember(voice,end);
        }
        function tick(){
          if(ticket!==generation)return;
          try{
            const now=ctx.currentTime,horizon=now+.2;
            for(const v of voices)if(v.end<now-.05||v.voice.stopped)voices.delete(v);
            while(countIndex<lead&&start+countIndex*beatSeconds<horizon){emit({kind:'click',accent:countIndex===0},start+countIndex*beatSeconds,.1);countIndex++;}
            const elapsed=(now-musicStart)/beatSeconds;
            if(!loop&&elapsed>=plan.length){finish(true);return;}
            // A delayed timer skips stale cycles instead of allocating an unbounded backlog.
            if(loop&&elapsed>=0&&cycle<Math.floor(elapsed/plan.length)){cycle=Math.floor(elapsed/plan.length);itemIndex=0;}
            if(items.length){
              let scheduled=0;
              while((loop||cycle===0)&&musicStart+cycle*cycleSeconds+items[itemIndex].at*beatSeconds<horizon){
                const item=items[itemIndex];emit(item,musicStart+cycle*cycleSeconds+item.at*beatSeconds,item.duration*beatSeconds);
                itemIndex++;if(itemIndex===items.length){itemIndex=0;cycle++;}
                if(++scheduled>1024)throw Error('Не удалось запланировать воспроизведение.');
              }
            }
            let frame;
            if(now<start)frame={index:-1,waiting:true,cycle:0};
            else if(elapsed<0)frame={index:-1,countIn:Math.min(4,Math.floor((now-start)/beatSeconds)+1),cycle:0};
            else{
              const currentCycle=Math.floor(elapsed/plan.length),position=elapsed-currentCycle*plan.length;
              const current=plan.events.find(e=>position>=e.atBeat&&position<e.atBeat+e.beats),chord=plan.progression.find(c=>position>=c.atBeat&&position<c.atBeat+c.beats);
              const full=plan.startBeat+position;
              frame={index:current?.midi!==null?current?.index??-1:-1,bar:Math.floor(full/4)+1,beat:Math.floor(full%4)+1,position:full,cycle:currentCycle,chord:chord?.label||''};
            }
            const key=JSON.stringify([frame.index,frame.bar,frame.beat,frame.countIn,frame.cycle,frame.chord,frame.waiting]);
            if(key!==lastFrame){lastFrame=key;onFrame(frame);}
            if(ticket===generation)timer=setTimer(tick,25);
          }catch(error){finish(false,error);}
        }
        tick();return {...plan,tempo,beatSeconds,lead,start,musicStart};
      }catch(error){if(ticket!==generation)return null;finish(false,error);throw error;}
    }
    const visibility=()=>{if(document.hidden)stop();};
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',visibility);
    if(typeof window!=='undefined')window.addEventListener('pagehide',stop);
    function destroy(){stop();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',visibility);if(typeof window!=='undefined')window.removeEventListener('pagehide',stop);}
    return {play,stop,isPlaying:()=>playing,destroy};
  }
  return {validateEvents,sliceRange,renderTab,createPlayer};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CoursePracticePlayer;
