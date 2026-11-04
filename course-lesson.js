/* Original lesson tasks. Source rationale lives in course/lesson-01-method.txt. */
const CourseLesson = (() => {
  const steps = [
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
    if (step.delta === undefined) return false;
    return stringIdx === step.str && fret === step.start + step.delta;
  }
  function boot() {
    const el = id => document.getElementById(id);
    let current = 0;
    const solved = new Set();
    const choices = new Map();
    const hints = new Set();
    let practiced = false;
    function ready() {const s=steps[current]; return s.delta !== undefined ? solved.has(current) : s.practice ? practiced : true;}
    function render() {
      const s = steps[current];
      el('lessonTitle').textContent=s.title;
      el('lessonExplanation').textContent=s.explanation;
      el('lessonPurpose').textContent=s.purpose;
      el('lessonInstruction').textContent=s.instruction;
      el('lessonProgress').value=current+1;
      el('lessonPosition').textContent=`Шаг ${current+1} из ${steps.length}`;
      el('lessonBack').disabled=current===0;
      el('lessonNext').disabled=!ready() || !!s.finish;
      el('lessonListen').hidden=s.delta !== undefined || !!s.practice || !!s.finish;
      el('lessonHint').hidden=s.delta === undefined;
      el('lessonPracticeLabel').hidden=!s.practice;
      el('lessonPractice').checked=practiced;
      el('lessonFeedback').textContent=s.delta !== undefined ? solved.has(current) ? 'Верно. Можно переходить дальше.' : 'Выберите ответ на указанной струне. Можно пробовать снова: ошибка не закрывает задание.' : s.finish ? `Экранных заданий выполнено: ${solved.size} из 4. Заданий с подсказкой: ${hints.size}. Практика на гитаре отмечена вами: ${practiced ? 'да' : 'нет'}.` : 'Нажмите «Послушать пример» или на золотую точку.';
      if(s.practice) el('lessonFeedback').textContent='Отметьте практику после игры и самопроверки. Нажатия на грифе не заменяют это задание.';
      v2RenderBoard(new Map(), 'lessonBoard');
      const cells=el('lessonBoard').querySelectorAll('.cell');
      cells.forEach((cell,index) => {
        const stringIdx=Math.floor(index/(FRET_COUNT+1)), fret=index%(FRET_COUNT+1);
        if(stringIdx!==s.str){cell.classList.add('lesson-muted');return;}
        const button=document.createElement('button');
        button.type='button';button.className='sandbox-hit';
        button.setAttribute('aria-label',`Струна ${stringIdx+1}, лад ${fret}${fret===s.start?', исходный звук':''}`);
        const marked=fret===s.start || fret===s.demo || fret===s.bridge || choices.get(current)===fret;
        if(marked){
          const dot=document.createElement('span');dot.className='note'+(fret===s.start?' root':fret===s.bridge?'':' chord-tone');
          dot.textContent=String(fret);button.appendChild(dot);
        }
        button.addEventListener('click',()=>{
          playMidi(OPEN_STRINGS_TOP_TO_BOTTOM[stringIdx].midi+fret);
          if(s.delta===undefined)return;
          choices.set(current,fret);
          if(answer(s,stringIdx,fret))solved.add(current); else solved.delete(current);
          render();
          if(!solved.has(current)){
            const difference=fret-s.start;
            el('lessonFeedback').textContent=difference===0 ? 'Это исходный звук: пока ни одного перехода. Выберите другой лад.' : `Число выбранных переходов: ${Math.abs(difference)}, направление — ${difference>0?'вверх':'вниз'}. Нужно ${Math.abs(s.delta)===1?'один переход':'два перехода'} ${s.delta>0?'вверх':'вниз'}. Считайте промежутки между ладами на той же струне.`;
          }else playSequence([OPEN_STRINGS_TOP_TO_BOTTOM[s.str].midi+s.start,OPEN_STRINGS_TOP_TO_BOTTOM[s.str].midi+fret]);
          el('lessonBoard').querySelectorAll('.sandbox-hit')[fret].focus({preventScroll:true});
        });
        cell.appendChild(button);
      });
    }
    el('lessonListen').addEventListener('click',()=>{
      const s=steps[current],open=OPEN_STRINGS_TOP_TO_BOTTOM[s.str].midi;
      playSequence((s.bridge!==undefined?[s.start,s.bridge,s.demo,s.start,s.demo]:s.demo!==undefined?[s.start,s.demo]:[s.start]).map(f=>open+f));
    });
    el('lessonHint').addEventListener('click',()=>{
      hints.add(current);
      const s=steps[current];
      el('lessonFeedback').textContent=`Начните с ${s.start}-го лада. ${Math.abs(s.delta)===1?'Сделайте один переход':'Сделайте два перехода'} к ${s.delta>0?'большим':'меньшим'} номерам. Исходный лад не считается переходом.`;
    });
    el('lessonPractice').addEventListener('change',e=>{practiced=e.target.checked;render();});
    el('lessonBack').addEventListener('click',()=>{if(current>0){current--;render();}});
    el('lessonNext').addEventListener('click',()=>{if(ready()&&current<steps.length-1){current++;render();el('lessonTitle').setAttribute('tabindex','-1');el('lessonTitle').focus();}});
    el('lessonRestart').addEventListener('click',()=>{current=0;solved.clear();choices.clear();hints.clear();practiced=false;render();});
    render();
  }
  return {steps,answer,boot};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CourseLesson;
else CourseLesson.boot();
