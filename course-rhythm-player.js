/* Original rhythmic diagram. All positions share a four-beat coordinate system. */
const CourseRhythmPlayer=(()=>{
  const timeline=events=>{let offset=0;return events.map(e=>{const item={...e,offset};offset+=e.beats;return item;});};
  function frame(events,elapsed,beat,lead=0){
    const time=elapsed/beat,notes=timeline(events),length=events.reduce((n,e)=>n+e.beats,0);
    if(time<0)return {waiting:true};
    if(time<lead)return {countIn:Math.floor(time)};
    const position=time-lead;
    if(position>=length)return {done:true};
    const index=notes.findIndex(e=>position>=e.offset&&position<e.offset+e.beats);
    return {position,beat:Math.floor(position)%4,index:index>=0&&notes[index].midi!==null?index:-1};
  }
  function diagram(parent,pattern,{blocks=true,compact=false}={}){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 480 180');svg.classList.add('rhythm-score','rhythm-unified');svg.setAttribute('role','img');
    svg.setAttribute('aria-label','Размер 4/4. '+pattern.durations.map((d,i)=>(pattern.rests.includes(i)?'Пауза':d===1?'Четверть':'Восьмая')+': '+d+' доли').join('; '));
    parent.appendChild(svg);
    const add=(parent,tag,attrs,text)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text)e.textContent=text;parent.appendChild(e);return e;};
    add(svg,'line',{x1:48,y1:64,x2:464,y2:64,stroke:'currentColor','stroke-width':1,opacity:.3});
    for(const x of [38,464])add(svg,'line',{x1:x,y1:34,x2:x,y2:82,stroke:'currentColor','stroke-width':1.5});
    for(const y of [50,73])add(svg,'text',{x:14,y,'font-size':23},'4');
    let offset=0;const symbols=[],tiles=[];
    pattern.durations.forEach((beats,i)=>{
      const x=48+104*offset,rest=pattern.rests.includes(i),g=add(svg,'g',{'data-event':i,class:'rhythm-symbol'+(rest?' is-rest':'')});symbols.push(g);
      if(rest)add(g,'path',{d:`M ${x-4} 36 l 11 11 -7 10 7 10 Q ${x-10} 59 ${x-6} 77 Q ${x-17} 66 ${x-5} 61 l -7 -10 9 -7 Z`,fill:'currentColor'});
      else{
        add(g,'ellipse',{cx:x,cy:64,rx:8,ry:5.5,transform:`rotate(-20 ${x} 64)`,fill:'currentColor','data-onset':offset});
        add(g,'line',{x1:x+7,y1:63,x2:x+7,y2:28,stroke:'currentColor','stroke-width':2});
        if(beats===.5&&Number.isInteger(offset)&&pattern.durations[i+1]===.5&&!pattern.rests.includes(i+1))add(g,'line',{x1:x+7,y1:28,x2:x+59,y2:28,stroke:'currentColor','stroke-width':5});
      }
      const tile=add(svg,'g',{class:'rhythm-tile'+(rest?' is-rest':''),'data-event':i});tiles.push(tile);
      add(tile,'rect',{x,y:96,width:beats*104-4,height:34,rx:4,'data-onset':offset});
      add(tile,'text',{x:x+(beats*104-4)/2,y:118,'text-anchor':'middle','font-size':beats===.5?15:16},rest?'пауза':'ТА');offset+=beats;
    });
    const counts=[];
    for(let i=0;i<4;i++){
      const g=add(svg,'g',{class:'rhythm-count','data-beat':i});counts.push(g);
      add(g,'circle',{cx:48+i*104,cy:153,r:14});
      add(g,'text',{x:48+i*104,y:159,'text-anchor':'middle','font-size':17},String(i+1));
      add(svg,'text',{x:100+i*104,y:159,'text-anchor':'middle','font-size':15,class:'rhythm-and'},'и');
    }
    const cursor=add(svg,'line',{x1:48,x2:48,y1:20,y2:170,class:'rhythm-cursor',hidden:''});
    function showBlocks(value){tiles.forEach(e=>e.style.display=value?'':'none');svg.classList.toggle('blocks-hidden',!value);}
    showBlocks(blocks);
    let last='';
    function clear(){last='';symbols.concat(tiles,counts).forEach(e=>e.classList.remove('is-playing'));cursor.setAttribute('hidden','');}
    function paint(f){
      const key=`${f.index}/${f.beat}`;
      if(key!==last){symbols.forEach((e,i)=>e.classList.toggle('is-playing',i===f.index));tiles.forEach((e,i)=>e.classList.toggle('is-playing',i===f.index));counts.forEach((e,i)=>e.classList.toggle('is-playing',i===f.beat));last=key;}
      if(f.position!==undefined&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!compact){const x=48+f.position*104;cursor.removeAttribute('hidden');cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);}else cursor.setAttribute('hidden','');
    }
    return {svg,paint,clear,showBlocks};
  }
  // Shared phrase/backing clock. Times are seconds relative to the transport start.
  function schedule(events,{tempo=60,countIn=false,metronome=false,accompaniment=null}={}){
    if(!Array.isArray(events)||!events.length||events.length>64||events.some(e=>![.5,1,2,4].includes(e.beats)||!(e.midi===null||Number.isInteger(e.midi)&&e.midi>=0&&e.midi<=127)))throw Error('Некорректная фраза');
    const beat=60/Math.max(40,Math.min(120,Number(tempo)||60)),lead=countIn?4:0,length=events.reduce((n,e)=>n+e.beats,0),items=[];
    if(length>32)throw Error('Фраза слишком длинная');
    if(countIn)for(let i=0;i<4;i++)items.push({kind:'click',at:i*beat,accent:i===0});
    if(metronome)for(let i=0;i<length;i++)items.push({kind:'click',at:(lead+i)*beat,accent:i%4===0});
    timeline(events).forEach((e,i)=>{if(e.midi!==null)items.push({kind:'melody',midi:e.midi,at:(lead+e.offset)*beat,duration:e.beats*beat,index:i});});
    if(accompaniment){
      const notes=[...new Set(accompaniment.notes)];
      if(!notes.length||notes.length>6||notes.some(n=>!Number.isInteger(n)||n<0||n>127))throw Error('Некорректный аккорд сопровождения');
      const period=accompaniment.mode==='sustain'?length:4;
      for(let i=0;i<length;i+=period)notes.forEach(midi=>items.push({kind:'backing',midi,at:(lead+i)*beat,duration:Math.min(period,length-i)*beat}));
    }
    return {beat,lead,length,duration:(lead+length)*beat,items};
  }
  function createTransport({context=()=>getAudioCtx(),note=(...args)=>playMidi(...args),tap=(...args)=>playMetronome(...args),request=fn=>requestAnimationFrame(fn),cancel=id=>cancelAnimationFrame(id)}={}){
    let voices=[],animation=0,version=0,playing=false,finish=null;
    function stop(){version++;if(animation)cancel(animation);animation=0;voices.forEach(v=>{try{v?.stop();}catch{}});voices=[];playing=false;const callback=finish;finish=null;callback?.(false);}
    function play(events,options={}){
      stop();const plan=schedule(events,options),ctx=context(),start=ctx.currentTime+.08,ticket=version;
      playing=true;finish=options.onend||null;
      plan.items.forEach(e=>{
        const voice=e.kind==='click'?tap(start+e.at,e.accent,.09):note(e.midi,start+e.at,e.duration,e.kind==='backing'?.045:.18,e.kind==='melody'?options.positions?.[e.index]||null:null,'held');
        voices.push(voice);
      });
      function tick(){
        if(ticket!==version)return;
        const f=frame(events,ctx.currentTime-start,plan.beat,plan.lead);options.onframe?.(f);
        if(f.done){animation=0;playing=false;voices=[];const callback=finish;finish=null;callback?.(true);return;}
        animation=request(tick);
      }
      animation=request(tick);return plan;
    }
    return {play,stop,get playing(){return playing;}};
  }
  return {timeline,frame,diagram,schedule,createTransport};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CourseRhythmPlayer;
