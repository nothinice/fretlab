/* Visual exploration only: reuse the course engine and its event handlers. */
(()=>{
 const el=id=>document.getElementById(id);
 const overview=el('blockOverview');
 const hero=document.createElement('section');hero.className='design-hero';
 const copy=document.createElement('div');copy.className='design-hero-copy';
 const eyebrow=overview.querySelector(':scope > .hint');eyebrow.textContent='БЛОК 01 / ПЕРВЫЕ МУЗЫКАЛЬНЫЕ ОТКРЫТИЯ';
 const title=overview.querySelector('h1');title.textContent='От первого звука — к своей музыке.';
 const description=overview.querySelector('.lesson-copy');description.textContent='Найдите расстояние. Соберите гамму. Поймайте ритм. И сыграйте свою фразу.';
 const progress=el('blockProgress'),equipment=progress.nextElementSibling,cta=el('blockResume').parentElement;
 overview.insertBefore(hero,overview.firstChild);hero.appendChild(copy);
 for(const n of [eyebrow,title,description,el('blockSummary'),progress,cta,equipment])copy.appendChild(n);
 equipment.className='design-equipment';equipment.textContent='Гитара рядом? Начнём с одного звука.';
 const art=document.createElement('div');art.className='design-hero-art';art.setAttribute('aria-hidden','true');
 art.innerHTML=`<svg viewBox="0 0 440 360" xmlns="http://www.w3.org/2000/svg">
 <rect x="36" y="28" width="365" height="290" rx="32" fill="#d9e7d7" transform="rotate(6 220 180)"/>
 <rect x="26" y="33" width="365" height="290" rx="28" fill="#e8ca99" stroke="#193b32" stroke-width="3" transform="rotate(-5 220 180)"/>
 <g transform="rotate(-5 220 180)" stroke="#193b32"><path d="M55 109H362M55 149H362M55 189H362M55 229H362" opacity=".42" stroke-width="2"/><path d="M110 62V284M190 62V284M270 62V284M350 62V284" opacity=".3" stroke-width="2"/>
 <path d="M75 141Q115 52 155 141" stroke="#996000" fill="none" stroke-width="4"/><path d="M155 141Q235 12 315 141" stroke="#235e51" fill="none" stroke-width="4"/>
 <circle cx="75" cy="149" r="21" fill="#f2c14e" stroke-width="3"/><circle cx="155" cy="149" r="21" fill="#fffdf7" stroke-width="3"/><circle cx="315" cy="149" r="21" fill="#b9f36b" stroke-width="3"/>
 <g fill="#193b32" stroke="none" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle"><text x="115" y="90">½</text><text x="235" y="58">1</text></g></g>
 <g transform="translate(235 248) rotate(6)"><rect width="154" height="75" rx="18" fill="#b9f36b" stroke="#193b32" stroke-width="3"/><path d="M25 45v-16m20 16v-16m20 16v-16m20 16v-16m20 16v-16m20 16v-16" stroke="#193b32" stroke-width="7"/></g>
 </svg><p>Расстояние → ритм → музыка</p>`;
 hero.appendChild(art);
 const label=document.createElement('div');label.className='design-preview-note';
 label.innerHTML='Дизайн-проба · «Музыкальные открытия» <a href="./">Текущая версия ↗</a>';
 document.body.appendChild(label);
 const finishArt=document.createElement('div');finishArt.className='design-finish-art';finishArt.setAttribute('aria-hidden','true');
 finishArt.innerHTML='<svg viewBox="0 0 430 110" xmlns="http://www.w3.org/2000/svg"><path d="M30 65H400" stroke="#193b32" stroke-width="2"/><path d="M75 65Q145 -20 215 65Q285 -20 355 65" fill="none" stroke="#235e51" stroke-width="4"/><circle cx="75" cy="65" r="24" fill="#f2c14e" stroke="#193b32" stroke-width="3"/><circle cx="215" cy="65" r="24" fill="#fffdf7" stroke="#193b32" stroke-width="3"/><circle cx="355" cy="65" r="30" fill="#b9f36b" stroke="#193b32" stroke-width="3"/><path d="m342 65 9 9 18-20" fill="none" stroke="#193b32" stroke-width="4"/></svg>';
 el('lessonFeedback').before(finishArt);
 const finishInfo=document.createElement('details');finishInfo.className='design-finish-info';finishInfo.hidden=true;
 const finishSummary=document.createElement('summary');finishSummary.textContent='Подробнее об итоге';finishInfo.appendChild(finishSummary);el('lessonContinue').parentElement.after(finishInfo);
 function finishState(){
  const done=el('lessonFeedback').classList.contains('task-reward');el('panel-lesson').classList.toggle('design-lesson-finish',done);finishInfo.hidden=!done;
  if(done){const text=el('lessonExplanation').textContent+' '+el('lessonInstruction').textContent;let p=finishInfo.querySelector('p');if(!p){p=document.createElement('p');finishInfo.appendChild(p);}p.textContent=text;}
 }
 new MutationObserver(finishState).observe(el('lessonFeedback'),{attributes:true,childList:true});finishState();
 const stages=[['Найдите расстояние','Тон и полутон на грифе'],['Соберите гамму','Семь шагов — один целый звукоряд'],['Поймайте ритм','От слуха к собственной фразе'],['Сыграйте сами','Проверка и практика на гитаре']];
 function decorate(){
  el('blockActivities').querySelectorAll('.block-stage').forEach((group,i)=>{
   if(group.dataset.design)return;group.dataset.design='true';
   const heading=group.querySelector('h2'),cards=group.querySelector('.block-stage-cards');
   const details=document.createElement('details');details.className='design-route-part';details.open=!!cards.querySelector('.route-current');
   const summary=document.createElement('summary'),number=document.createElement('span');number.className='design-stage-number';number.textContent=String(i+1).padStart(2,'0');
   const text=document.createElement('span');heading.textContent=stages[i][0];text.appendChild(heading);const sub=document.createElement('span');sub.className='design-stage-caption';sub.textContent=stages[i][1];text.appendChild(sub);
   summary.append(number,text);details.append(summary,cards);group.appendChild(details);
  });
 }
 decorate();new MutationObserver(decorate).observe(el('blockActivities'),{childList:true});
})();
