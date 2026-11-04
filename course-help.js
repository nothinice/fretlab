/* Original course orientation. No microphone use or automatic audibility claims. */
(() => {
  const dialog=document.createElement('dialog');dialog.className='course-help-dialog';dialog.setAttribute('aria-labelledby','courseHelpTitle');document.body.appendChild(dialog);
  let testVoice=null,version=0;
  const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  const stop=()=>{version++;testVoice?.stop();testVoice=null;};
  dialog.addEventListener('close',stop);dialog.addEventListener('cancel',stop);
  const action=(parent,text,fn)=>{const b=node('button',text);b.type='button';b.className='play-btn';b.onclick=fn;parent.appendChild(b);return b;};
  function open(kind){
    stop();window.courseBlockOne?.stop();if(typeof stopSequence==='function')stopSequence();
    dialog.replaceChildren();const title=node('h2',kind==='sound'?'Слышите звук?':kind==='terms'?'Термины и ориентиры':'Перед игрой');title.id='courseHelpTitle';dialog.appendChild(title);
    if(kind==='sound'){
      dialog.appendChild(node('p','Нажмите «Проиграть звук», затем сообщите, слышите ли вы ноту. Приложение не может проверить громкость динамика или беззвучный режим.'));
      const status=node('p');status.setAttribute('role','status');dialog.appendChild(status);
      const tips=node('div');tips.hidden=true;tips.className='sound-help';tips.appendChild(node('p','Проверьте громкость мультимедиа и беззвучный режим, выход на наушники или Bluetooth. Вернитесь во вкладку курса и повторите. Если тишина остаётся, попробуйте другой браузер.'));
      const row=node('div');row.className='sandbox-controls';dialog.appendChild(row);
      const play=action(row,'▶ Проиграть звук',async()=>{
        stop();const ticket=version;status.textContent='Запускаем звук…';yes.disabled=no.disabled=true;
        try{
          const ctx=getAudioCtx();
          if(ctx.state!=='running')await Promise.race([ctx.resume(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),3000))]);
          if(ticket!==version||!dialog.open)return;
          if(ctx.state!=='running')throw new Error('unavailable');
          testVoice=playMidi(60,undefined,1,.16);yes.disabled=no.disabled=false;status.textContent='Нота запущена. Слышите её?';
        }catch{if(ticket!==version)return;status.textContent='Браузер не смог запустить звук. Проверьте настройки ниже и повторите.';tips.hidden=false;no.disabled=false;}
      });play.classList.add('primary-btn');
      const yes=action(row,'Слышу',()=>{stop();document.getElementById('courseSoundStatus').textContent='✓ Вы подтвердили звук';status.textContent='Вы подтвердили, что звук слышен. Можно вернуться к занятию.';tips.hidden=true;});
      const no=action(row,'Не слышу',()=>{stop();document.getElementById('courseSoundStatus').textContent='Звук пока не подтверждён';status.textContent='До проверки звука слуховые задания лучше отложить. Задания на грифе можно продолжить.';tips.hidden=false;});yes.disabled=no.disabled=true;dialog.appendChild(tips);
    }else if(kind==='terms'){
      const list=node('dl');
      const terms=[
        ['Струны и золотая точка','На схеме первая струна e — сверху, она самая тонкая; шестая E — снизу, самая толстая. Пятая струна — A. Золотая точка обозначает исходный звук задания.'],
        ['Лад на грифе','Место между соседними металлическими порожками, где прижимают струну. 0 — открытая струна; номера растут от головки к корпусу. Слово «лад» также обозначает музыкальную систему звуков — это другое значение.'],
        ['Тон и полутон','На одной струне переход на соседний лад — полутон (½ тона), через два лада — тон (1).'],
        ['Тоника','Устойчивый опорный звук тональности. В до мажоре это C. В наших построениях начинаем с него.'],
        ['Ступень','Звук лада по отношению к тонике. Номер показывает его место в гамме: в до мажоре C — первая ступень, D — вторая, E — третья.'],
        ['Пульс и доля','Пульс — равномерное чередование долей; доля — один шаг этого счёта. В наших упражнениях счёт идёт «1, 2, 3, 4».'],
        ['Такт и размер 4/4','Такт — отрезок музыки между тактовыми чертами. В 4/4 в нём четыре четвертные доли: верхняя цифра задаёт количество, нижняя — четвертную длительность доли.'],
        ['Четверть, восьмая, пауза','В наших упражнениях четверть занимает одну долю, восьмая — половину. Пауза означает молчание указанной длительности; счёт продолжается.'],
        ['Кнопки задания','«Подсказка» объясняет текущий вопрос. «Новая попытка» начинает упражнение заново. «К уроку» открывает связанное объяснение; оттуда можно вернуться к попытке.']
      ];
      terms.forEach(([term,text])=>{list.appendChild(node('dt',term));list.appendChild(node('dd',text));});dialog.appendChild(list);
    }else{
      dialog.appendChild(node('p','Перед игрой настройте гитару по тюнеру. Стандартный строй от самой толстой струны к самой тонкой: E–A–D–G–B–E. На нашей схеме порядок сверху вниз обратный: e–B–G–D–A–E.'));
      dialog.appendChild(node('p','Сядьте устойчиво, поддержите инструмент так, чтобы не удерживать его вес левой кистью. Плечи расслаблены. Прижимайте струну близко к нужному металлическому порожку со стороны головки, а не поверх него.'));
      dialog.appendChild(node('p','Не пытайтесь преодолеть боль или сильное напряжение. Остановитесь и уточните посадку и положение рук с преподавателем. Нажатия на экран не проверяют технику.'));
    }
    action(dialog,'Вернуться к занятию',()=>dialog.close());dialog.showModal();
  }
  window.courseHelp={open};
  document.querySelectorAll('[data-course-help]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.courseHelp)));
})();
