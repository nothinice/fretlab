/* Course sandbox adapter. The existing renderer and audio engine remain shared. */
const CourseSandbox = (() => {
  const names = {
    sharp: ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'],
    flat: ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B']
  };
  function pitch(midi, spelling = 'sharp') {
    const octave = Math.floor(midi / 12) - 1;
    const name = names[spelling][((midi % 12) + 12) % 12];
    return {name, octave, label: name + octave, letter: 'CDEFGAB'.indexOf(name[0]) + octave * 7};
  }
  function interval(from, to, spelling = 'sharp') {
    const a = pitch(from, spelling), b = pitch(to, spelling);
    const semitones = Math.abs(to - from);
    const steps = Math.abs(b.letter - a.letter);
    const degree = steps + 1;
    const baseline = Math.floor(steps / 7) * 12 + [0,2,4,5,7,9,11][steps % 7];
    const offset = semitones - baseline;
    const perfect = [0,3,4].includes(steps % 7);
    let quality;
    if (perfect && offset === 0) quality = 'чистая';
    else if (!perfect && offset === 0) quality = 'большая';
    else if (!perfect && offset === -1) quality = 'малая';
    else {
      const count = offset > 0 ? offset : -offset - (perfect ? 0 : 1);
      quality = (count > 1 ? `${count}× ` : '') + (offset > 0 ? 'увеличенная' : 'уменьшённая');
    }
    const titles = ['прима','секунда','терция','кварта','квинта','секста','септима','октава','нона','децима','ундецима','дуодецима','терцдецима','квартдецима','квинтдецима'];
    return {degree, semitones, title: `${quality} ${titles[steps] || `${degree}-я`}`, direction: to === from ? 'одинаковая высота' : to > from ? 'вверх' : 'вниз'};
  }
  // Observe the shared audio clock; do not infer playing or singing from it.
  const voices=new Set();
  let frame=null, painted=new Set();
  function paintVoices(){
    const targets=new Set();
    voices.forEach(v=>{
      if(v.osc.stopped||v.ctx.currentTime>v.end+.1){voices.delete(v);return;}
      if(v.position&&!v.osc.stopped&&v.ctx.currentTime>=v.start&&v.ctx.currentTime<v.end){
        const board=document.getElementById(v.position.boardId);
        const cell=board?.querySelectorAll('.cell')[v.position.index];
        if(cell)targets.add(cell);
      }
    });
    painted.forEach(cell=>{if(!targets.has(cell))cell.classList.remove('sounding');});
    targets.forEach(cell=>{if(!painted.has(cell))cell.classList.add('sounding');});
    painted=targets;
    frame=voices.size?requestAnimationFrame(paintVoices):null;
  }
  function trackVoice(osc,midi,start,duration,ctx,position){
    const voice={osc,midi,start,end:start+duration,ctx,position};voices.add(voice);
    osc.addEventListener('ended',()=>{voices.delete(voice);});
    if(frame===null)frame=requestAnimationFrame(paintVoices);
  }
  // A curved bracket sits over the two endpoints on a single string.
  function drawDistances(board,points){
    const cells=board.querySelectorAll('.cell');
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],distance=Math.abs(a.fret-b.fret);
      if(a.stringIdx!==b.stringIdx||![1,2].includes(distance))continue;
      const arc=document.createElement('span');arc.className='interval-arc '+(distance===1?'step-half':'step-whole');
      arc.textContent=distance===1?'½':'1';arc.setAttribute('aria-label',distance===1?'Полутон':'Тон');
      arc.style.width=`calc(${distance*100}% + ${distance*2}px)`;
      cells[a.stringIdx*(FRET_COUNT+1)+Math.min(a.fret,b.fret)].appendChild(arc);
    }
  }
  function boot() {
    const el = id => document.getElementById(id);
    const maybe=id=>{try{return document.getElementById(id);}catch{return null;}};
    const marks = new Map();
    const chord=new Map(),history=[];const CHORD_KEY='fretlab-chord-v1';
    let pair = [], action = el('sandboxAction').value||'mark', spelling = 'sharp', focusIndex=0;
    let root='auto',display='notes',candidateKey=null,canStore=true,analysis=null,currentCandidate=null,ownVoices=[],playTicket=0;
    const signature=c=>`${c.rootPc}:${c.quality}:${(c.missing||[]).join(',')}`;
    function chordSnapshot(){return Array.from({length:6},(_,i)=>chord.get(i)?.fret??null);}
    function loadFrets(frets){chord.clear();frets.forEach((fret,stringIdx)=>{if(fret!==null){const midi=OPEN_STRINGS_TOP_TO_BOTTOM[stringIdx].midi+fret;chord.set(stringIdx,{key:`${stringIdx}:${fret}`,stringIdx,fret,midi});}});}
    try{const saved=JSON.parse(localStorage.getItem(CHORD_KEY)||'null');if(saved?.version===1&&Array.isArray(saved.frets)&&saved.frets.length===6&&saved.frets.every(f=>f===null||Number.isInteger(f)&&f>=0&&f<=FRET_COUNT)){
      loadFrets(saved.frets);if(typeof saved.root==='string'&&/^(auto|[0-9]|1[01])$/.test(saved.root))root=saved.root;
      if(saved.display==='intervals')display='intervals';if(saved.spelling==='flat')spelling='flat';if(typeof saved.candidate==='string'&&saved.candidate.length<80)candidateKey=saved.candidate;
    }}catch{canStore=false;}
    function saveChord(){try{localStorage.setItem(CHORD_KEY,JSON.stringify({version:1,frets:chordSnapshot(),root,display,spelling,candidate:candidateKey}));canStore=true;}catch{canStore=false;}}
    function stop(){playTicket++;for(const voice of ownVoices){try{voice?.stop();}catch{}}ownVoices=[];stopSequence();const button=maybe('sandboxStop');if(button)button.hidden=true;const b=maybe('sandboxBoard');if(b)b.querySelectorAll('.sounding').forEach(c=>c.classList.remove('sounding'));}
    function changeChord(stringIdx,fret,{toggle=false,focus=null}={}){
      stop();const old=chord.get(stringIdx)?.fret??null,next=toggle&&old===fret?null:fret;
      if(old===next)return;history.push(chordSnapshot());if(history.length>32)history.shift();
      if(next===null)chord.delete(stringIdx);else chord.set(stringIdx,{key:`${stringIdx}:${next}`,stringIdx,fret:next,midi:OPEN_STRINGS_TOP_TO_BOTTOM[stringIdx].midi+next});
      render();if(focus)maybe('chordStrings')?.querySelector(`button[aria-label="${focus}"]`)?.focus({preventScroll:true});
    }
    const readout = el('sandboxReadout');
    function selected() { return action==='chord'?[...chord.values()].sort((a,b)=>a.midi-b.midi||b.stringIdx-a.stringIdx):action === 'measure' ? pair : [...marks.values()]; }
    function contextualPitch(midi){
      const interval=currentCandidate?.intervals.find(i=>i.pc===((midi%12)+12)%12),name=interval?.note||pitch(midi,spelling).name;
      const parsed=/^([A-G])([#b♯♭]*)$/.exec(name);let octave=Math.floor(midi/12)-1;
      if(parsed){const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[parsed[1]],offset=[...parsed[2]].reduce((n,a)=>n+(['#','♯'].includes(a)?1:-1),0);octave=(midi-natural-offset)/12-1;}
      return {name,label:name+octave,interval:interval?.label||['1','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'][((midi-(currentCandidate?.rootPc??(root==='auto'?(analysis?.bassPc||0):Number(root))))%12+12)%12]};
    }
    function renderAnalysis(){
      const panel=maybe('chordPanel');if(!panel)return;
      const active=action==='chord';panel.hidden=!active;maybe('chordControls').hidden=!active;maybe('chordStrings').hidden=!active;
      maybe('sandboxUndo').hidden=!active;maybe('sandboxUndo').disabled=!history.length;
      if(!active)return;
      const results=el('chordResults');results.replaceChildren();
      const warnings={'ambiguous':'Возможны разные гармонические трактовки. Выберите имя, чтобы увидеть интервалы от его основного тона.','root-not-played':'Выбранный основной тон не звучит. Это предположение о неполном аккорде.','missing-tones':'Часть звуков отсутствует; пропуски явно указаны в названии.','unknown-chord':'Для этого сочетания нет надёжного имени в поддерживаемых формулах. Проверьте состав или задайте основной тон.','invalid-midi':'Некорректная высота звука.','invalid-root':'Некорректный основной тон.'};
      el('chordStatus').textContent=currentCandidate?.symbol||(analysis?.status==='single'?'Пока один звук':chord.size?'Имя не определено':'Выберите ноты аккорда');
      for(const c of analysis?.candidates||[]){const b=document.createElement('button');b.type='button';b.className='play-btn chord-candidate';b.textContent=c.symbol;b.dataset.candidate=signature(c);b.setAttribute('aria-pressed',String(signature(c)===candidateKey));b.onclick=()=>{stop();candidateKey=signature(c);render();results.querySelector(`[data-candidate="${candidateKey}"]`)?.focus({preventScroll:true});};results.appendChild(b);}
      el('chordFormula').textContent=currentCandidate?`От ${currentCandidate.rootName}: ${currentCandidate.formula.replace(/b/g,'♭').replace(/#/g,'♯').split(/\s+/).join(' · ')}`:root!=='auto'?`Интервалы от ${pitch(Number(root),spelling).name}: ${selected().map(n=>contextualPitch(n.midi).interval).join(' · ')}`:'';
      const bass=selected()[0];el('chordBass').textContent=bass?`Бас: ${contextualPitch(bass.midi).label}${currentCandidate?' · Основной тон: '+currentCandidate.rootName:''}`:'Бас появится после выбора первой ноты.';
      el('chordDetails').textContent=currentCandidate?`Состав: ${currentCandidate.intervals.map(i=>i.note).join(' · ')}${currentCandidate.missing?.length?' · Не звучат: '+currentCandidate.missing.join(', '):''}`:selected().length?`Выбранные ноты: ${[...new Set(selected().map(n=>pitch(n.midi,spelling).name))].join(' · ')}`:'Лад 0 — открытая струна. Невыбранные струны заглушены.';
      el('chordWarnings').textContent=[...new Set([...(analysis?.warnings||[]).filter(w=>w!=='missing-tones'||currentCandidate?.missing?.length),...(currentCandidate?.warnings||[])])].map(w=>warnings[w]||'').filter(Boolean).join(' ');
      el('chordStorage').textContent=canStore?'Аппликатура сохраняется в этом браузере.':'Сохранение недоступно: аппликатура останется только до закрытия страницы.';
      const strings=el('chordStrings');strings.replaceChildren();
      for(let i=5;i>=0;i--){const n=chord.get(i),group=document.createElement('div');group.className='chord-string-control';group.dataset.state=!n?'muted':n.fret===0?'open':'fretted';
        const title=document.createElement('strong');title.className='chord-string-label';title.textContent=`${i+1} · ${OPEN_STRINGS_TOP_TO_BOTTOM[i].label}`;group.appendChild(title);
        const state=document.createElement('span');state.className='chord-string-state';state.textContent=!n?'× заглушена':n.fret===0?'○ открытая':`Лад ${n.fret} · ${contextualPitch(n.midi).label}`;group.appendChild(state);
        for(const [text,label,fret] of [['○',`Открыть струну ${i+1}`,0],['×',`Заглушить струну ${i+1}`,null]]){const b=document.createElement('button');b.type='button';b.className='play-btn '+(fret===0?'chord-open':'chord-mute');b.textContent=text;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(fret===0?n?.fret===0:!n));b.onclick=()=>changeChord(i,fret,{focus:label});group.appendChild(b);}strings.appendChild(group);
      }
    }
    function render() {
      if(action==='chord'&&typeof ChordIdentifier!=='undefined'){
        const identify=nameChord.identify||ChordIdentifier.analyze;analysis=identify(selected().map(n=>n.midi),{rootPc:root==='auto'?null:Number(root),spelling,triads:TRIAD_QUALITY,tetrads:TETRAD_QUALITY,buildScale});
        currentCandidate=analysis.candidates.find(c=>signature(c)===candidateKey)||analysis.candidates[0]||null;candidateKey=currentCandidate?signature(currentCandidate):null;
      }else{analysis=null;currentCandidate=null;}
      v2RenderBoard(new Map(), 'sandboxBoard');
      const board = el('sandboxBoard');
      const cells = board.querySelectorAll('.cell');
      cells.forEach((cell, index) => {
        const stringIdx = Math.floor(index / (FRET_COUNT + 1));
        const fret = index % (FRET_COUNT + 1);
        const midi = OPEN_STRINGS_TOP_TO_BOTTOM[stringIdx].midi + fret;
        const key = `${stringIdx}:${fret}`;
        const info = {key, stringIdx, fret, midi};
        const position = selected().findIndex(n => n.key === key);
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'sandbox-hit';
        button.tabIndex=index===focusIndex?0:-1;
        button.addEventListener('focus',()=>{focusIndex=index;board.querySelectorAll('.sandbox-hit').forEach((b,i)=>b.tabIndex=i===index?0:-1);});
        button.addEventListener('keydown',e=>{
          const moves={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};
          if(!moves[e.key])return;
          e.preventDefault();const [ds,df]=moves[e.key];
          const row=Math.max(0,Math.min(5,stringIdx+ds)),col=Math.max(0,Math.min(FRET_COUNT,fret+df));
          focusIndex=row*(FRET_COUNT+1)+col;
          board.querySelectorAll('.sandbox-hit').forEach((b,i)=>b.tabIndex=i===focusIndex?0:-1);
          board.querySelectorAll('.sandbox-hit')[focusIndex].focus();
        });
        button.setAttribute('aria-label', `${action==='chord'?contextualPitch(midi).label:pitch(midi, spelling).label}, струна ${stringIdx + 1}, лад ${fret}`);
        button.dataset.string=String(stringIdx+1);button.dataset.fret=String(fret);
        if (action !== 'listen') button.setAttribute('aria-pressed', position >= 0 ? 'true' : 'false');
        if (position >= 0) {
          const dot = document.createElement('span');
          dot.className = 'note' + (action === 'measure' ? (position === 0 ? ' root' : ' chord-tone') : action==='chord'?(midi%12===currentCandidate?.rootPc?' root':' chord-tone'):'');
          dot.textContent = action==='chord'?(display==='intervals'?contextualPitch(midi).interval.replace(/b/g,'♭').replace(/#/g,'♯'):contextualPitch(midi).name):pitch(midi, spelling).name;
          button.appendChild(dot);
        }
        button.addEventListener('click', () => {
          focusIndex=index;
          stop();
          if(action==='chord'){
            changeChord(stringIdx,fret,{toggle:true});
            if(chord.get(stringIdx)?.fret===fret)ownVoices.push(playMidi(midi,undefined,.8,.18,{boardId:'sandboxBoard',index}));
            el('sandboxBoard').querySelectorAll('.sandbox-hit')[index].focus({preventScroll:true});return;
          }
          if (action === 'listen') {
            playMidi(midi,undefined,undefined,.22,{boardId:'sandboxBoard',index});
            readout.textContent = `${pitch(midi, spelling).label} · струна ${stringIdx + 1}, лад ${fret}`;
            return;
          }
          if (action === 'measure') {
            if (position >= 0) pair.splice(position, 1);
            else { if (pair.length === 2) pair = []; pair.push(info); playMidi(midi,undefined,undefined,.22,{boardId:'sandboxBoard',index}); }
          } else if (marks.has(key)) marks.delete(key);
          else { marks.set(key, info); playMidi(midi,undefined,undefined,.22,{boardId:'sandboxBoard',index}); }
          render();
          // Preserve keyboard focus after rebuilding the fretboard.
          el('sandboxBoard').querySelectorAll('.sandbox-hit')[index].focus({preventScroll:true});
        });
        cell.appendChild(button);
      });
      const notes = selected();
      el('sandboxSequence').disabled = notes.length === 0;
      el('sandboxTogether').disabled = notes.length === 0;
      el('sandboxSequence').textContent=action==='chord'?'▶ Арпеджио':'▶ По очереди';
      if(action==='chord'){
        readout.textContent='Аппликатура от 6-й струны к 1-й: '+chordSnapshot().reverse().map(f=>f===null?'×':String(f)).join(' · ')+'.';
        saveChord();
      }else
      if (action === 'measure' && pair.length === 2) {
        const result = interval(pair[0].midi, pair[1].midi, spelling);
        readout.textContent = `${pitch(pair[0].midi, spelling).label} → ${pitch(pair[1].midi, spelling).label}: ${result.title}, ${result.semitones} полутонов, ${result.direction}.`;
      } else if (action === 'measure') readout.textContent = pair.length ? 'Начало выбрано. Нажмите на вторую ноту.' : 'Выберите начало и конец интервала. После двух нот следующий клик начинает новую пару.';
      else readout.textContent = notes.length ? `Отмечено: ${notes.map(n => pitch(n.midi, spelling).label).join(' · ')}. Воспроизведение — в порядке выбора.` : 'Гриф пуст. Выберите первую ноту.';
      renderAnalysis();
    }
    el('sandboxAction').addEventListener('change', e => {
      stop();
      action = e.target.value;
      el('sandboxHelp').textContent = action==='chord'?'По одному звуку на струну. Лад 0 открывает струну, повторный клик заглушает. Стрелки выбирают лад и струну, Enter ставит ноту.':action === 'measure' ? 'Выберите две ноты в любом месте грифа. Отмеченные в свободном режиме ноты сохранятся при возврате.' : action === 'listen' ? 'Каждый клик проигрывает ноту; отмеченные ноты сохраняются.' : 'Отмечайте любые ноты на всех шести струнах.';
      render();
    });
    function roots(){const control=maybe('chordRoot');if(!control)return;control.replaceChildren();const auto=document.createElement('option');auto.value='auto';auto.textContent='Авто';control.appendChild(auto);for(let i=0;i<12;i++){const option=document.createElement('option');option.value=String(i);option.textContent=pitch(i,spelling).name;control.appendChild(option);}control.value=root;}
    el('sandboxSpelling').value=spelling;
    el('sandboxSpelling').addEventListener('change', e => {stop();spelling = e.target.value;roots();render();});
    el('sandboxClear').addEventListener('click', () => {stop();if(action==='chord'){if(chord.size){history.push(chordSnapshot());chord.clear();}}else{marks.clear();pair=[];}render();});
    function playback(together){stop();const notes=selected();if(!notes.length)return;const version=playTicket,when=getAudioCtx().currentTime+.05;
      notes.forEach((n,i)=>ownVoices.push(playMidi(n.midi,when+(together?0:i*.38),together?1.3:.75,together?.22/notes.length:.2,{boardId:'sandboxBoard',index:n.stringIdx*(FRET_COUNT+1)+n.fret})));
      const b=maybe('sandboxStop');if(b)b.hidden=false;
      ownVoices.at(-1)?.addEventListener?.('ended',()=>{if(version!==playTicket)return;ownVoices=[];if(b)b.hidden=true;});
    }
    el('sandboxSequence').addEventListener('click',()=>playback(false));
    el('sandboxTogether').addEventListener('click',()=>playback(true));
    maybe('sandboxUndo')?.addEventListener('click',()=>{if(!history.length)return;stop();loadFrets(history.pop());render();});
    maybe('sandboxStop')?.addEventListener('click',stop);
    maybe('chordRoot')?.addEventListener('change',e=>{stop();root=e.target.value;candidateKey=null;render();});
    maybe('chordDisplay')?.addEventListener('change',e=>{display=e.target.value;render();});
    if(maybe('chordDisplay'))el('chordDisplay').value=display;
    roots();
    if(typeof document.addEventListener==='function')document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    if(typeof window!=='undefined'&&window.addEventListener){window.addEventListener('pagehide',stop);document.querySelectorAll('[role="tab"]').forEach(tab=>tab.addEventListener('click',()=>{if(tab.id!=='tab-sandbox')stop();}));}
    render();
    if(action==='chord')el('sandboxHelp').textContent='По одному звуку на струну. Лад 0 — открытая струна; повторный клик убирает ноту. Нажмите название аккорда, чтобы сменить трактовку.';
    if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('tool')==='chords')el('tab-sandbox').click();
    return {stop,getChordState:()=>({frets:chordSnapshot(),root,display,candidate:candidateKey,analysis}),render};
  }
  return {pitch, interval, boot, trackVoice, drawDistances};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CourseSandbox;
else window.courseSandbox=CourseSandbox.boot();
