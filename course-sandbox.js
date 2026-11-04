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
  function boot() {
    const el = id => document.getElementById(id);
    const marks = new Map();
    let pair = [], action = 'mark', spelling = 'sharp';
    const readout = el('sandboxReadout');
    function selected() { return action === 'measure' ? pair : [...marks.values()]; }
    function render() {
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
        button.setAttribute('aria-label', `${pitch(midi, spelling).label}, струна ${stringIdx + 1}, лад ${fret}`);
        if (action !== 'listen') button.setAttribute('aria-pressed', position >= 0 ? 'true' : 'false');
        if (position >= 0) {
          const dot = document.createElement('span');
          dot.className = 'note' + (action === 'measure' ? (position === 0 ? ' root' : ' chord-tone') : '');
          dot.textContent = pitch(midi, spelling).name;
          button.appendChild(dot);
        }
        button.addEventListener('click', () => {
          if (action === 'listen') {
            playMidi(midi);
            readout.textContent = `${pitch(midi, spelling).label} · струна ${stringIdx + 1}, лад ${fret}`;
            return;
          }
          if (action === 'measure') {
            if (position >= 0) pair.splice(position, 1);
            else { if (pair.length === 2) pair = []; pair.push(info); playMidi(midi); }
          } else if (marks.has(key)) marks.delete(key);
          else { marks.set(key, info); playMidi(midi); }
          render();
          // Preserve keyboard focus after rebuilding the fretboard.
          el('sandboxBoard').querySelectorAll('.sandbox-hit')[index].focus({preventScroll:true});
        });
        cell.appendChild(button);
      });
      const notes = selected();
      el('sandboxSequence').disabled = notes.length === 0;
      el('sandboxTogether').disabled = notes.length === 0;
      if (action === 'measure' && pair.length === 2) {
        const result = interval(pair[0].midi, pair[1].midi, spelling);
        readout.textContent = `${pitch(pair[0].midi, spelling).label} → ${pitch(pair[1].midi, spelling).label}: ${result.title}, ${result.semitones} полутонов, ${result.direction}.`;
      } else if (action === 'measure') readout.textContent = pair.length ? 'Начало выбрано. Нажмите на вторую ноту.' : 'Выберите начало и конец интервала. После двух нот следующий клик начинает новую пару.';
      else readout.textContent = notes.length ? `Отмечено: ${notes.map(n => pitch(n.midi, spelling).label).join(' · ')}. Воспроизведение — в порядке выбора.` : 'Гриф пуст. Выберите первую ноту.';
    }
    el('sandboxAction').addEventListener('change', e => {
      action = e.target.value;
      el('sandboxHelp').textContent = action === 'measure' ? 'Выберите две ноты в любом месте грифа. Отмеченные в свободном режиме ноты сохранятся при возврате.' : action === 'listen' ? 'Каждый клик проигрывает ноту; отмеченные ноты сохраняются.' : 'Отмечайте любые ноты на всех шести струнах.';
      render();
    });
    el('sandboxSpelling').addEventListener('change', e => {spelling = e.target.value; render();});
    el('sandboxClear').addEventListener('click', () => {marks.clear(); pair = []; render();});
    el('sandboxSequence').addEventListener('click', () => playSequence(selected().map(n => n.midi)));
    el('sandboxTogether').addEventListener('click', () => {
      const when = getAudioCtx().currentTime + 0.03;
      const unique = [...new Set(selected().map(n => n.midi))];
      unique.forEach(midi => playMidi(midi, when, 0.9, 0.22 / Math.max(1, unique.length)));
    });
    render();
  }
  return {pitch, interval, boot};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CourseSandbox;
else CourseSandbox.boot();
