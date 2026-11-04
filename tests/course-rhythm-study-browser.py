"""Guided rhythm flow and diagram clock, with controllable audio time for boundary tests."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
MOCK="""window.testClock=0;window.scheduled=[];getAudioCtx=()=>({get currentTime(){return testClock},state:'running'});playMidi=(...args)=>{scheduled.push(args);return {stop(){},addEventListener(){}}};playMetronome=()=>({stop(){}});"""
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox'])
 for width,height in [(390,844),(1280,800)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(APP.as_uri());page.evaluate(MOCK)
  def open_rhythm():page.locator('#blockActivities article').nth(7).get_by_role('button').click()
  def button(name):return page.locator('#blockTaskBody').get_by_role('button',name=name,exact=True)
  open_rhythm()
  for step,answer in enumerate(['Четыре','Одну','Ровно считать «1, 2, 3, 4», но на «3» не играть','Одну','На второй']):
   expect(page.locator('.rhythm-player h3')).to_contain_text(f'шаг {step+1} из 5')
   expect(page.locator('.rhythm-question')).to_be_hidden()
   play=button('▶ Четыре доли' if step==0 else '▶ Послушать запись')
   rect=play.bounding_box();assert rect['y']+rect['height']<=height,(step,rect)
   # Shared coordinate system: heads are at block onsets, within 2 rendered pixels.
   offsets=page.locator('.rhythm-unified').evaluate("""svg=>Array.from(svg.querySelectorAll('ellipse')).map(n=>{const rect=n.closest('g').dataset.event;const block=svg.querySelector('.rhythm-tile[data-event="'+rect+'"] rect');const matrix=svg.getScreenCTM();return Math.abs(n.cx.baseVal.value-block.x.baseVal.value)*matrix.a})""")
   assert all(n<=2 for n in offsets),offsets
   if step in [0,2,4]:page.screenshot(path=f'/tmp/fretlab-rhythm-redesign-{step}-{width}.png',full_page=True)
   page.evaluate('window.startClock=testClock');play.click()
   if step>0:
    lengths=[[1,1,1,1],[1,1,1],[.5]*8,[1,.5,.5,1]][step-1]
    scheduled=page.evaluate('(n)=>window.scheduled.slice(-n)',len(lengths))
    assert [e[2] for e in scheduled]==lengths,scheduled
    assert all(e[5]=='held' for e in scheduled)
   if step==2:
    page.evaluate('testClock=startClock+1.2');expect(page.locator('.rhythm-count-in .is-playing')).to_have_text('2')
    page.evaluate('testClock=startClock+4.3');expect(page.locator('.rhythm-symbol.is-playing')).to_have_count(1);expect(page.locator('.rhythm-tile.is-playing')).to_have_count(1)
    page.screenshot(path=f'/tmp/fretlab-rhythm-playing-{width}.png',full_page=True)
    # This lesson has a rest on beat three.
    page.evaluate('testClock=startClock+6.3');expect(page.locator('.rhythm-symbol.is-playing')).to_have_count(0);expect(page.locator('.rhythm-tile.is-playing')).to_have_count(0);expect(page.locator('.rhythm-count.is-playing')).to_contain_text('3')
    button('■ Стоп').click();expect(page.locator('.is-playing')).to_have_count(0);expect(page.locator('.rhythm-question')).to_be_hidden()
    play.click();page.emulate_media(reduced_motion='reduce');page.evaluate('testClock+=4.4');expect(page.locator('.rhythm-count.is-playing')).to_have_count(1);expect(page.locator('.rhythm-cursor')).to_be_hidden();page.emulate_media(reduced_motion='no-preference')
   page.evaluate('testClock+=10');expect(page.locator('.rhythm-question')).to_be_visible()
   if step==0:button('Две').click();expect(page.locator('.wrong-choice')).to_have_text('Две');expect(button('К практике →')).to_be_hidden()
   button(answer).click();expect(page.locator('.correct-choice')).to_have_text(answer)
   button('К практике →').click();button('Я простучал — к гитаре').click()
   next=button('Начать сравнение ритмов →' if step==4 else 'Дальше по ритму →');expect(next).to_be_disabled();page.locator('.rhythm-intro input[type=checkbox]').check();expect(next).to_be_enabled()
   # Compare scroll after click (including browser auto-scroll) with the next step.
   next.scroll_into_view_if_needed();before=page.evaluate('scrollY');next.click();assert abs(page.evaluate('scrollY')-before)<=3,(width,step,before,page.evaluate('scrollY'))
   saved=json.loads(page.evaluate("localStorage.getItem('fretlab-rhythm-study-v1')"));assert saved['step']==step+1
   if step==1:
    page.reload();page.evaluate(MOCK);open_rhythm();expect(page.locator('.rhythm-player h3')).to_contain_text('шаг 3 из 5')
  assert page.locator('.rhythm-option .rhythm-score').count()==3
  expect(page.locator('.rhythm-cursor:not([hidden])')).to_have_count(0)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.screenshot(path=f'/tmp/fretlab-rhythm-comparison-{width}.png',full_page=True)
  button('▶ Отсчёт и ритм').click();page.evaluate('testClock+=5');expect(page.locator('.rhythm-symbol.is-playing')).to_have_count(0)
  times=page.evaluate('scheduled.slice(-4).map(n=>n[1])')
  page.reload();page.evaluate(MOCK);open_rhythm();assert page.locator('.rhythm-intro').count()==0
  button('Разобрать ритм ещё раз').click();expect(page.locator('.rhythm-player h3')).to_contain_text('шаг 1 из 5')
  assert not errors,errors;page.close()
 b.close();print('OK: five steps, retained checkpoints, aligned onsets, audio-clock highlight/rest/stop, reduced motion, stable scroll and visible mobile play')
