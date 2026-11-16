/* Original FretLab studies, derived from verified methodological principles.
   No book scores, text passages or recordings are included. */
const CourseCompleteAdvanced=(()=>{
  const OPEN={1:64,2:59,3:55,4:50,5:45,6:40};
  const NAMES=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
  const point=(str,fret,label)=>({str,fret,midi:OPEN[str]+fret,key:`${str}/${fret}`,label:label||NAMES[(OPEN[str]+fret)%12]});
  const points=rows=>rows.map(([s,f,label])=>point(s,f,label));
  const events=(notes,beats=1)=>notes.map(midi=>({midi,beats}));
  const amPent=points([[6,5,'A'],[6,8,'C'],[5,5,'D'],[5,7,'E'],[4,5,'G'],[4,7,'A']]);
  const amScale=points([[6,5,'A'],[6,7,'B'],[6,8,'C'],[5,5,'D'],[5,7,'E'],[5,8,'F'],[4,5,'G'],[4,7,'A']]);
  const amBlues=points([[6,5,'A'],[6,8,'C'],[5,5,'D'],[5,6,'E♭'],[5,7,'E'],[4,5,'G'],[4,7,'A']]);
  const cPosition=points([[6,8,'C'],[6,10,'D'],[5,7,'E'],[5,8,'F'],[5,10,'G'],[4,7,'A'],[4,9,'B'],[4,10,'C']]);
  const cMaj7=points([[5,3,'C'],[4,2,'E'],[3,0,'G'],[2,0,'B']]);
  const dropC=points([[4,5,'G'],[3,5,'C'],[2,5,'E'],[1,7,'B']]);
  const motif=[{midi:57,beats:.5},{midi:60,beats:.5},{midi:62,beats:1},{midi:64,beats:2},
               {midi:62,beats:1},{midi:60,beats:1},{midi:57,beats:1},{midi:null,beats:1}];
  const bluesSymbols=['A7','A7','A7','A7','D7','D7','A7','A7','E7','D7','A7','E7'];
  const bluesNotes={A7:[45,49,52,55],D7:[50,54,57,60],E7:[52,56,59,62]};
  const bluesForm=bluesSymbols.map((label,i)=>({atBeat:i*4,beats:4,notes:bluesNotes[label],label}));
  const bluesStudy=[{atBeat:0,beats:8,notes:bluesNotes.A7,label:'A7'},
                    {atBeat:8,beats:4,notes:bluesNotes.D7,label:'D7'},
                    {atBeat:12,beats:4,notes:bluesNotes.A7,label:'A7'}];
  const cF=[{atBeat:0,beats:8,notes:[48,52,55],label:'C'},
            {atBeat:8,beats:8,notes:[53,57,60],label:'F'}];
  const iiVI=[{atBeat:0,beats:4,notes:[50,53,57,60],label:'Dm7'},
              {atBeat:4,beats:4,notes:[43,47,50,53],label:'G7'},
              {atBeat:8,beats:8,notes:[48,52,55,59],label:'Cmaj7'}];
  const module6={
    id:'6',title:'Ритм, мотив и блюз',subtitle:'От нескольких звуков — к фразе и форме',
    outcome:'Выделить мотив, услышать паузу, построить A minor pentatonic и A blues; сыграть свою фразу и удержать простую двенадцатитактовую форму.',
    prerequisites:['4'],sessions:'3–5 занятий',optional:false,
    sources:[
      {title:'Bob Stoloff — Blues Scatitudes',location:'PDF / printed 5, 16, 34',evidence:'visually_verified'},
      {title:'Mark Levine — Теория джаза',location:'PDF / printed 88–89, 151–153',evidence:'text_verified'},
      {title:'Guitar Alliance Collective — Blues Turnarounds',location:'PDF 3 / printed iii; PDF 4–7, начало главы The 12 Bar Blues',evidence:'text_verified'}
    ],
    steps:[
      {id:'6-motif',type:'learn',title:'Мотив: вопрос и ответ',rootPc:9,range:[0,7],
        text:'Мотив — короткая узнаваемая мысль. Его можно повторить, поменять ритм или окончание. Пауза отделяет вопрос от ответа.',
        instruction:'Послушайте два такта. Пропойте их на любых удобных слогах, затем повторите короткий вопрос и свой ответ на гитаре.',
        why:'Сначала немного материала, затем осмысленное изменение. Пройти гамму подряд — полезная практика, но это ещё не единственный способ строить музыку.',
        points:points([[3,2,'A'],[3,5,'C'],[3,7,'D'],[2,5,'E']]),
        audio:{events:motif,progression:[{atBeat:0,beats:8,notes:[45,52,60],label:'Am'}],countIn:true}},
      {id:'6-sequence-three',type:'sequence',title:'Секвенция: три ноты, затем на ступень выше',rootPc:9,range:[5,8],
        text:'В A natural minor возьмём A–B–C. Повторим тот же трёхнотный рисунок с B: B–C–D. Затем с C: C–D–E. Так короткий мотив развивается в диатоническую секвенцию.',
        instruction:'Исходная группа A–B–C уже дана. Соберите две следующие группы: B–C–D и C–D–E. Сначала назовите ноты, затем проиграйте и повторите на гитаре.',
        why:'Сдвигаем начало группы на одну ступень выбранной гаммы. Это не перенос всей группы на фиксированное число полутонов: A–B — тон, а B–C — полутон. Группа из трёх ровных восьмых не является триолью: каждая нота здесь по-прежнему занимает половину доли.',
        points:amScale,allowedMidi:[45,47,48,50,52,53,55,57],sourceMidi:[45,47,48],targetMidi:[47,48,50,48,50,52],
        fullSequence:[45,47,48,47,48,50,48,50,52,50,52,53,52,53,55,53,55,57],groupSize:3,beats:.5},
      {id:'6-sequence-thirds',type:'sequence',title:'Секвенция через терции в C major',rootPc:0,range:[7,10],
        text:'Начнём с C–E. Перенесём оба звука на следующую ступень C major: D–F. Следующие пары — E–G, F–A, G–B и A–C.',
        instruction:'Исходная пара C–E уже дана. Продолжите тремя парами: D–F, E–G и F–A. Держите ровные восьмые и слушайте изменение терций.',
        why:'Пары сохраняют расстояние в три буквенные ступени, но не всегда в одинаковое число полутонов: C–E — большая терция, D–F — малая. Мы следуем нотам C major, а не механически передвигаем всю форму на два лада.',
        points:cPosition,allowedMidi:[48,50,52,53,55,57,59,60],sourceMidi:[48,52],targetMidi:[50,53,52,55,53,57],
        fullSequence:[48,52,50,53,52,55,53,57,55,59,57,60],groupSize:2,beats:.5},
      {id:'6-hear-rest',type:'ear',title:'Пауза не останавливает пульс',rootPc:9,
        text:'В каждом примере четыре доли. Найдите долю, на которой мелодия молчит. Продолжайте считать даже в паузе.',
        instruction:'Послушайте пример до конца и определите положение паузы. Затем повторите рисунок одним звуком A.',
        answers:['Пауза на второй доле','Пауза на третьей доле'],
        samples:[
          {events:events([57,null,60,57]),correct:0},
          {events:events([57,60,null,57]),correct:1},
          {events:events([60,null,57,57]),correct:0}
        ]},
      {id:'6-swing',type:'choice',title:'Ровные восьмые и свинг',rootPc:9,
        text:'Ровные восьмые делят долю пополам. В свинге деление и артикуляция другие; соотношение длительностей меняется со стилем, темпом и исполнителем.',
        instruction:'Как правильно понимать схему «длинная — короткая» для свинга?',
        answers:['Это всегда строгое соотношение 2:1','Это учебное приближение; живой свинг нужно слушать и повторять','Это означает играть весь мотив в два раза быстрее'],correct:1,
        why:'Триольная схема помогает начать сравнение, но не заменяет звучащие образцы и артикуляцию. В этом плеере собственные задания записаны ровными длительностями; они не выдаются за полноценную модель свинга.'},
      {id:'6-pentatonic',type:'select',title:'Пять звуков из A minor',rootPc:9,range:[5,8],
        text:'Оставим в A natural minor звуки A–C–D–E–G: ступени 1, 3, 4, 5, 7 этой гаммы. Получится минорная пентатоника.',
        instruction:'Соберите одну октаву: на шестой струне A и C, на пятой D и E, на четвёртой G и верхнюю A. Лады 5–8.',
        why:'Название «пентатоника» говорит о пяти различных звуках; верхняя A повторяет тонику, а не добавляет шестой класс высоты.',
        points:[],target:amPent.map(p=>`${p.str}/${p.fret}`),
        audio:{events:events(amPent.map(p=>p.midi))}},
      {id:'6-blue-tone',type:'learn',title:'Добавим блюзовый проходящий звук',rootPc:9,range:[5,8],
        text:'Между D и E добавим E♭: A–C–D–E♭–E–G. Это один из распространённых шестизвучных блюзовых звукорядов.',
        instruction:'Послушайте D–E♭–E и короткую фразу. На гитаре сыграйте пятый, шестой и седьмой лады пятой струны.',
        why:'В интервальной формуле от A звук E♭ — пониженная квинта. В равномерной темперации он совпадает по высоте с D♯. Блюзовый язык шире этой одной гаммы и не сводится к режиму диатоники.',
        points:amBlues,
        audio:{events:[{midi:50,beats:.5},{midi:51,beats:.5},{midi:52,beats:1},{midi:null,beats:1},{midi:48,beats:1},{midi:45,beats:2}]}},
      {id:'6-build-blues',type:'select',title:'Восстановите A blues',rootPc:9,range:[5,8],
        text:'Используйте знакомую пентатонику и один добавленный звук. Следите за короткой цепочкой D–E♭–E.',
        instruction:'Выберите A–C–D–E♭–E–G–A на струнах 6, 5 и 4 в пределах ладов 5–8.',
        points:[],target:amBlues.map(p=>`${p.str}/${p.fret}`)},
      {id:'6-twelve-bars',type:'learn',title:'Одна простая форма: 12 тактов',rootPc:9,range:[0,7],
        text:'Наш вариант: A7 A7 A7 A7 / D7 D7 A7 A7 / E7 D7 A7 E7. Это I7, IV7 и V7 от A. После двенадцатого такта можно вернуться к A7.',
        instruction:'Включите аккорды, считайте такты по четыре доли и следите за сменой корней A–D–E. Пока играйте только корни.',
        why:'В этих аккордах большая терция и малая септима: A7 = A–C♯–E–G. Знак ♯ повышает ноту на полутон. Минорный блюзовый звукоряд поверх мажорной терции создаёт характерное напряжение. Это один учебный вариант: блюз бывает и другой длины, и с другой гармонией.',
        points:points([[6,5,'A'],[5,5,'D'],[5,7,'E']]),
        audio:{events:Array.from({length:12},()=>({midi:null,beats:4})),progression:bluesForm,countIn:true}},
      {id:'6-form-check',type:'choice',title:'Не потеряйте пятый такт',rootPc:9,
        text:'В нашем варианте первые четыре такта звучит A7, а затем начинается участок IV7.',
        instruction:'Какой аккорд должен звучать в пятом такте именно этого варианта?',
        answers:['A7','D7','E7'],correct:1,
        audio:{events:Array.from({length:12},()=>({midi:null,beats:4})),progression:bluesForm}},
      {id:'6-own-answer',type:'compose',title:'Четыре такта собственного ответа',rootPc:9,range:[5,8],
        text:'Используйте A–C–D–E♭–E–G. Повторите короткий мотив, а затем измените его окончание. В паузах продолжайте считать.',
        instruction:'Создайте 16 долей: два такта A7, такт D7, такт A7. К концу второго такта придите к A или E, к концу третьего — к D или A, завершите на A или E.',
        why:'На этом этапе выбираем корень или квинту как ясные ориентиры. Другие звуки не запрещены художественно: здесь проверяется выполнение конкретного учебного ограничения.',
        points:amBlues,allowedMidi:[45,48,50,51,52,55,57],bars:4,progression:bluesStudy,endPcs:[9,4],
        landings:[{atBeat:8,pcs:[9,4]},{atBeat:12,pcs:[2,9]}]},
      {id:'6-guitar',type:'practice',title:'Мотив, пульс и форма на гитаре',rootPc:9,
        text:'Теперь перенесите экранную работу на инструмент. Темп подбирайте так, чтобы успевать слышать фразу и считать форму.',
        instruction:'Отметьте собственную проверку после игры. Точность пульса, артикуляцию и технику приложение автоматически не оценивает.',
        checks:['Я сыграл A minor pentatonic и добавил E♭, понимая, где он находится.','Я пропел и сыграл собственный вопрос-ответ с паузой.','Я проследил все 12 тактов учебной формы и вернулся к первому A7.']}
    ]
  };
  const module7={
    id:'7',title:'Расположения и Drop 2',subtitle:'Дополнительная гармоническая мастерская',
    outcome:'Различать основные септаккорды, понимать бас и обращение; получить Drop 2 переносом второго сверху голоса на октаву и сыграть одно своё расположение.',
    prerequisites:['3'],sessions:'5–8 занятий по желанию',optional:true,
    sources:[
      {title:'Попов — Музыкальное и аппликатурное мышление гитариста',location:'PDF / printed 23, 32, 34',evidence:'visually_verified'},
      {title:'Mark Levine — Теория джаза',location:'PDF / printed 19–21',evidence:'text_verified'},
      {title:'Randy Vincent — Jazz Guitar Voicings Vol. 1: The Drop 2 Book',location:'PDF 5 / printed ii; PDF 6 / printed 1; PDF 44–46 / printed 39–41',evidence:'text_verified'},
      {title:'William Leavitt — A Modern Method for Guitar Vol. 3',location:'PDF 2–3, введение без номера страницы',evidence:'text_verified'}
    ],
    steps:[
      {id:'7-seventh',type:'learn',title:'Подготовка: трезвучие плюс септима',rootPc:0,range:[0,4],
        text:'C–E–G плюс B даёт Cmaj7: основной тон, большая терция, квинта и большая септима. В C7 вместо B звучит B♭; в Cm7 также меняется E на E♭.',
        instruction:'Послушайте Cmaj7 и найдите B на открытой второй струне. Затем сыграйте струны 5–2.',
        why:'Точные составы различаются: Cmaj7 = C–E–G–B, C7 = C–E–G–B♭, Cm7 = C–E♭–G–B♭. C6 имеет A вместо B и не является тем же набором нот, что Cmaj7.',
        points:cMaj7,
        audio:{events:[{midi:null,beats:4}],progression:[{atBeat:0,beats:4,notes:[48,52,55,59],label:'Cmaj7'}]}},
      {id:'7-build-maj7',type:'select',title:'Соберите Cmaj7 без готовых точек',rootPc:0,range:[0,7],
        text:'У Cmaj7 четыре разных звука. Повторы допустимы, но на каждой струне может звучать только одна нота.',
        instruction:'Соберите C–E–G–B. Другие звуки уберите; незадействованные струны заглушите.',
        points:[],targetPcs:[0,4,7,11],onePerString:true},
      {id:'7-ear-quality',type:'ear',title:'Узнайте септаккорд по звуку',rootPc:0,
        text:'Во всех примерах основной тон C. Сравнивайте терцию и септиму. Это слуховая тренировка, а не тест качества игры.',
        instruction:'Послушайте пример и выберите Cmaj7, C7 или Cm7.',answers:['Cmaj7','C7','Cm7'],
        samples:[
          {events:[{midi:null,beats:4}],progression:[{atBeat:0,beats:4,notes:[48,52,55,59],label:'Аккорд'}],correct:0},
          {events:[{midi:null,beats:4}],progression:[{atBeat:0,beats:4,notes:[48,52,55,58],label:'Аккорд'}],correct:1},
          {events:[{midi:null,beats:4}],progression:[{atBeat:0,beats:4,notes:[48,51,55,58],label:'Аккорд'}],correct:2}
        ]},
      {id:'7-ii-v-i',type:'learn',title:'Подготовка: II–V–I в C major',rootPc:0,range:[0,7],
        text:'Dm7–G7–Cmaj7 строятся на второй, пятой и первой ступенях C major. Составы: D–F–A–C; G–B–D–F; C–E–G–B.',
        instruction:'Послушайте: четыре доли Dm7, четыре G7 и восемь Cmaj7. Сыграйте корни D–G–C, затем отдельные звуки каждого аккорда.',
        why:'II–V–I — важная джазовая модель. Она вводится здесь как подготовка к расположениям, а не как единственная возможная гармония.',
        points:points([[5,5,'D'],[6,3,'G'],[5,3,'C']]),
        audio:{events:Array.from({length:4},()=>({midi:null,beats:4})),progression:iiVI,countIn:true}},
      {id:'7-ii-check',type:'choice',title:'Состав второго аккорда тональности',rootPc:0,
        text:'Берём через один звук в гамме C major, начиная с D. Считайте D первым звуком построения аккорда, сохраняя ноты тональности.',
        instruction:'Какой набор образует Dm7 — ii7 в C major?',
        answers:['D–F–A–C','D–F♯–A–C','D–F–A–C♯'],correct:0},
      {id:'7-bass-root',type:'choice',title:'Бас и основной тон — не одно и то же',rootPc:0,range:[0,5],
        text:'Звуки E–G–C образуют обращение C major: E ниже остальных, но состав остаётся C–E–G. Такое расположение можно обозначить C/E.',
        instruction:'Если нижний звук E, какой основной тон у этого C/E?',
        answers:['E','C','G'],correct:1,
        points:points([[4,2,'E'],[3,0,'G'],[2,1,'C']]),
        audio:{events:[{midi:null,beats:4}],progression:[{atBeat:0,beats:4,notes:[52,55,60],label:'C/E'}]}},
      {id:'7-drop-transform',type:'voicing',title:'Сделайте Drop 2 собственными руками',rootPc:0,
        text:'Начнём с тесного четырёхголосия C4–E4–G4–B4. Drop 2 означает: второй по высоте голос опустить ровно на октаву.',
        instruction:'Выберите G4 — второй звук сверху — и опустите его на октаву. Сравните результат с исходным звучанием.',
        why:'Цифра 2 относится к позиции голоса сверху, а не ко второй ступени гаммы. В нашем примере получится G3–C4–E4–B4. Состав аккорда сохранён, но точные высоты и бас изменились.',
        voices:[60,64,67,71],targetVoices:[55,60,64,71]},
      {id:'7-drop-fretboard',type:'select',title:'Найдите новое расположение на струнах 4–1',rootPc:0,range:[5,7],
        text:'Наш Drop 2 звучит как G3–C4–E4–B4. Перенесём эти высоты на четыре соседние струны.',
        instruction:'Найдите G на четвёртой струне, C на третьей, E на второй и B на первой. Диапазон — лады 5–7.',
        why:'Проверяются конкретные высоты и по одному звуку на струну. Совпадения только названий нот недостаточно: другая октава может дать иное расположение.',
        points:[],target:['4/5','3/5','2/5','1/7'],onePerString:true,
        audio:{events:[{midi:null,beats:4}],progression:[{atBeat:0,beats:4,notes:[55,60,64,71],label:'Cmaj7 / Drop 2'}]}},
      {id:'7-drop-check',type:'choice',title:'Что именно изменилось?',rootPc:0,
        text:'Исходные MIDI: 60, 64, 67, 71. После преобразования: 55, 60, 64, 71.',
        instruction:'Какое действие определяет именно этот Drop 2?',
        answers:['G4 понижен на 12 полутонов; остальные высоты сохранены','Весь аккорд понижен на 12 полутонов','Вторая ступень D заменена на C'],correct:0},
      {id:'7-guitar',type:'practice',title:'Расположение на гитаре',rootPc:0,range:[5,7],
        text:'Проверьте собственный пример на струнах 4–1. Работайте медленно; удобство постановки и чистоту звука нужно оценить на настоящем инструменте.',
        instruction:'Сыграйте лады 5–5–5–7 на струнах 4–3–2–1, затем звуки по отдельности. Не включайте незадействованные струны.',
        points:dropC,
        checks:['Я назвал G–C–E–B и различил бас G и основной тон C.','Я сыграл четыре струны вместе и отдельно, проверив чистоту каждого звука.','Я могу объяснить Drop 2 как перенос второго сверху голоса, а не как название фиксированной формы.']}
    ]
  };
  const module8={
    id:'8',title:'Собственная музыкальная миниатюра',subtitle:'Итоговый проект основного маршрута',
    outcome:'Самостоятельно собрать четырёхтактовую фразу под C → F, использовать мотив и осознанные окончания; сыграть её по памяти и сохранить результат.',
    prerequisites:['3','4','6'],sessions:'2–4 занятия и повторная проверка',optional:false,
    sources:[
      {title:'William Leavitt — A Modern Method for Guitar Vol. 1',location:'PDF 3, введение без номера страницы',evidence:'text_verified'},
      {title:'Mark Levine — Теория джаза',location:'PDF / printed 33–34, 88–89',evidence:'text_verified'},
      {title:'Bob Stoloff — Blues Scatitudes',location:'PDF / printed 5, 16',evidence:'visually_verified'}
    ],
    steps:[
      {id:'8-brief',type:'learn',title:'Из упражнений — в небольшую музыку',rootPc:0,range:[7,10],
        text:'Итог — ваша четырёхтактовая фраза под C и F. Повторите короткий мотив, измените ответ и выберите окончания, связанные с текущим аккордом.',
        instruction:'Послушайте самостоятельный пример из двух тактов. Затем придумайте свою мысль. Минорную фразу из блока 4 можно доработать отдельно.',
        why:'Оценка структуры не равна художественной оценке. Приложение проверит длительности, выбранные звуки и учебные окончания; выразительность и исполнение оцениваете вы или преподаватель.',
        points:cPosition,
        audio:{events:events([48,52,55,52,53,57,60,57]),progression:[{atBeat:0,beats:4,notes:[48,52,55],label:'C'},{atBeat:4,beats:4,notes:[53,57,60],label:'F'}],countIn:true}},
      {id:'8-build-f',type:'select',title:'Вспомните второй аккорд',rootPc:5,range:[0,5],
        text:'В проекте чередуются C major и F major. У F основные звуки — F, A и C; это IV трезвучие в тональности C major.',
        instruction:'Соберите F–A–C на разных струнах. Повторения допустимы; посторонних звуков быть не должно.',
        points:[],targetPcs:[5,9,0],onePerString:true,
        why:'От F звуки F–A–C образуют основной тон, большую терцию и квинту. В C major эти же ноты соответствуют ступеням 4, 6 и 1.'},
      {id:'8-relative-check',type:'choice',title:'Проверьте связь мажора и минора',rootPc:0,
        text:'Параллельные мажор и натуральный минор используют один набор нот, но имеют разные тоники. Одноимённые мажор и минор, напротив, имеют одинаковую тонику.',
        instruction:'Какая натуральная минорная гамма параллельна C major?',
        answers:['A minor','C minor','D minor'],correct:0},
      {id:'8-hear-landing',type:'ear',title:'Окончание в контексте F',rootPc:5,
        text:'На фоне F major окончания F, A и C принадлежат аккорду. Другие звуки гаммы тоже можно использовать, но сейчас определяем именно состав.',
        instruction:'Слушайте последний звук. Входит ли он в F–A–C?',answers:['Окончание на звуке F major','Окончание на другом звуке C major'],
        samples:[
          {events:events([53,55,60,57]),progression:[{atBeat:0,beats:4,notes:[53,57,60],label:'F'}],correct:0},
          {events:events([53,55,60,55]),progression:[{atBeat:0,beats:4,notes:[53,57,60],label:'F'}],correct:1},
          {events:events([57,55,53,60]),progression:[{atBeat:0,beats:4,notes:[53,57,60],label:'F'}],correct:0}
        ]},
      {id:'8-project',type:'compose',title:'Ваш проект: четыре такта C → F',rootPc:0,range:[7,10],
        text:'Первые два такта звучит C, следующие два — F. Используйте C major. Пусть узнаваемый мотив получит изменённый ответ.',
        instruction:'Заполните 16 долей. К концу второго такта придите к C, E или G. Завершите четвёртый такт на F, A или C. Слушайте, пойте и редактируйте фразу.',
        why:'Требования к окончаниям — рамка этого задания. Во всей музыке нет правила, что каждая нота обязательно должна входить в текущий аккорд. Паузы и повторения также создают фразировку.',
        points:cPosition,allowedMidi:[48,50,52,53,55,57,59,60],bars:4,progression:cF,endPcs:[5,9,0],landings:[{atBeat:8,pcs:[0,4,7]}]},
      {id:'8-principle',type:'choice',title:'Что вы теперь выбираете осознанно?',rootPc:0,
        text:'Аккордовые звуки дают опору, а другие звуки гаммы могут создавать движение и напряжение. Мотив, ритм и паузы превращают набор нот во фразу.',
        instruction:'Как применять изученные правила в собственной музыке?',
        answers:['Играть только звуки аккорда и считать все остальные ошибками','Использовать опоры осознанно, слушая контекст и выразительность фразы','Каждый новый такт обязательно начинать с новой гаммы'],correct:1},
      {id:'8-performance',type:'practice',title:'Сыграйте проект по памяти',rootPc:0,
        text:'Сыграйте свою музыку на гитаре под сопровождение, затем повторите без подсказок. Сохраните или экспортируйте проект, чтобы вернуться к нему позже.',
        instruction:'Отметьте отдельно результат игры. Если что-то не получилось, вернитесь к нужному блоку и повторите позже; календарного запрета на продолжение нет.',
        checks:['Я сыграл свою фразу под C → F и различил смену аккорда.','Я повторил мотив с изменением и могу объяснить выбранные окончания.','Я сыграл фразу без готового рисунка, проверил пульс, паузы и чистоту звука.']}
    ]
  };
  return [module6,module7,module8];
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CourseCompleteAdvanced;
