"""Listening entry cues, rhythm introduction and review replay regressions."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox'])
 for width,height in [(390,844),(1280,800)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(APP.as_uri())
  page.evaluate('''() => {window.notes=[];window.taps=[];const tap=playMetronome;playMetronome=(...args)=>{taps.push(args);return tap(...args)};const original=playMidi;playMidi=(...args)=>{notes.push([args[0],args[1]]);return original(...args)}}''')
  def button(name):return page.locator('#blockTaskBody').get_by_role('button',name=name,exact=True)
  page.locator('#blockActivities article').nth(6).get_by_role('button').click()
  expect(page.locator('#blockTaskInstruction')).to_contain_text('Новая пара ещё не звучала')
  expect(button('Тон')).to_be_disabled();button('▶ Слушать пару').click()
  delta=page.evaluate('notes.at(-1)[0]-notes.at(-2)[0]');button('Полутон' if delta==1 else 'Тон').click()
  expect(page.locator('#blockTaskInstruction')).to_contain_text('Пара 1/6');button('Следующая пара →').click()
  expect(page.locator('#blockTaskInstruction')).to_contain_text('Пара 2/6');expect(page.locator('#blockTaskInstruction')).to_contain_text('Новая пара ещё не звучала');expect(button('Тон')).to_be_disabled()
  page.locator('#blockClose').click();page.locator('#blockActivities article').nth(7).get_by_role('button').click()
  expect(page.locator('.rhythm-intro')).to_be_visible();assert page.locator('.rhythm-option').count()==0
  button('▶ Четыре доли').click();assert page.evaluate('taps.length===4')
  button('Начать сравнение ритмов →').click();assert page.locator('.rhythm-option .rhythm-beat').count()==12
  expect(page.locator('.rhythm-option button').first).to_be_disabled()
  page.evaluate('notes=[]');button('▶ Отсчёт и ритм').click()
  times=page.evaluate('notes.filter(n=>n[0]===48).map(n=>n[1])');offsets=[round(t-times[0],2) for t in times];which=[[0,1,3],[0,.5,1,2],[0,2,2.5,3]].index(offsets)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.screenshot(path=f'/tmp/fretlab-rhythm-choices-{width}.png',full_page=True)
  page.locator('.rhythm-option').nth(which).get_by_role('button').click();page.evaluate('notes=[]');button('▶ Отсчёт и ритм').click()
  replay=page.evaluate('notes.filter(n=>n[0]===48).map(n=>n[1])');assert [round(t-replay[0],2) for t in replay]==offsets
  button('Повторил голосом и на гитаре — дальше').click();expect(page.locator('#blockTaskInstruction')).to_contain_text('Пример 2/3');expect(page.locator('.rhythm-option button').first).to_be_disabled()
  assert not errors,errors;page.close()
 b.close();print('OK: explicit new pair, rhythm intro/grid, replay stays on reviewed rhythm, mobile/desktop')
