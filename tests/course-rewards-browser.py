"""Rewards, UX review acceptance and screenshots, with honest guitar self-reports."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--no-sandbox'])
 errors=[]
 for width,height in [(1280,800),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(APP.as_uri());page.wait_for_selector('#blockActivities article')
  def activity(i):
   page.locator('#tab-block').click();page.locator('#blockActivities article').nth(i).get_by_role('button').click()
  def shot(name):
   page.evaluate('scrollTo(0,0)');page.screenshot(path=f'/tmp/fretlab-{name}-{width}.png',full_page=True)
  expect(page.locator('#blockResume')).to_have_text('Начать курс')
  box=page.locator('#blockResume').bounding_box();assert box['y']+box['height']<height
  assert page.locator('.block-plan').first.bounding_box()['y']>box['y']
  assert page.locator('.v2-tabs').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  expect(page.locator('#blockNextLesson')).to_be_disabled();shot('entry')
  page.locator('#blockResume').click()
  assert page.locator('#lessonInstruction').get_attribute('data-label')=='Послушайте'
  assert page.locator('#lessonBoard .open-label').all_text_contents()==['1 e','2 B','3 G','4 D','5 A','6 E']
  page.locator('#lessonNext').click();page.locator('#lessonNext').click();shot('lesson')
  assert page.locator('#lessonInstruction').get_attribute('data-label')=='Задание'
  page.locator('#lessonHint').click();page.locator('#lessonBoard .sandbox-hit').nth(4).click()
  expect(page.locator('#lessonFeedback')).to_have_class('sandbox-readout answer-success')
  assert 'полутон вверх' in page.locator('#lessonFeedback').inner_text()
  page.locator('#lessonNext').click();page.locator('#lessonNext').click()
  for fret in [5,5,7]:
   page.locator('#lessonBoard .sandbox-hit').nth(fret).click();page.locator('#lessonNext').click()
  assert page.locator('#lessonInstruction').get_attribute('data-label')=='Сыграйте на гитаре'
  page.locator('#lessonPractice').check();page.locator('#lessonNext').click()
  assert page.locator('#lessonInstruction').get_attribute('data-label')=='Итог'
  expect(page.locator('#lessonFeedback')).to_have_class('sandbox-readout answer-success task-reward')
  assert 'Подсказки: 1' in page.locator('#lessonFeedback').inner_text()
  page.locator('#lessonRoute').click()
  assert 'Линейка звуков' in page.locator('#blockActivities article').first.inner_text()
  page.reload();assert 'Линейка звуков' in page.locator('#blockActivities article').first.inner_text()
  expect(page.locator('#blockCelebration')).to_be_hidden()
  activity(3);page.locator('#blockTaskActions').get_by_role('button',name='Подсказка',exact=True).click()
  for step in [2,2,1,2,2,2,1]:page.locator('#blockTaskBody').get_by_role('button',name='Тон · 2' if step==2 else 'Полутон · 1',exact=True).click()
  page.locator('#blockTaskBody').get_by_role('button',name='Проверить',exact=True).click()
  assert 'Формула восстановлена' in page.locator('#blockTaskFeedback').inner_text()
  assert page.evaluate("window.courseBlockOne.getRecords().formula.assisted") is True
  activity(5)
  frets=[3,5,7,8,10,12,14,15];shown=page.locator('#blockPracticeBoard .note').all_text_contents()
  wrong=next(int(v) for v in shown if int(v) not in frets);correct=next(v for v in frets if str(v) not in shown)
  for fret in [wrong,correct]:page.locator(f'#blockPracticeBoard button[aria-label="Струна 5, лад {fret}"]').click()
  assert page.locator('#blockPracticeBoard .note').all_text_contents()==[str(f) for f in frets]
  assert 'Ошибка исправлена' in page.locator('#blockTaskFeedback').inner_text()
  activity(6);shot('ear')
  stop=page.locator('#blockTaskActions').get_by_role('button',name='■ Остановить звук',exact=True)
  expect(stop).to_be_hidden();page.get_by_role('button',name='▶ Слушать пару',exact=True).click();expect(stop).to_be_visible()
  stop.click();expect(stop).to_be_hidden()
  page.locator('.audio-options summary').click();page.locator('.audio-options input').fill('100');page.locator('.audio-options input').press('Tab')
  page.get_by_role('button',name='▶ Слушать пару',exact=True).click();expect(stop).to_be_visible();expect(stop).to_be_hidden(timeout=3500)
  activity(8);shot('phrase')
  expect(page.locator('.phrase-meter')).to_be_visible();assert page.locator('.phrase-meter span').count()==8
  page.get_by_role('button',name='Восьмая · ½ доли',exact=True).click()
  page.locator('#blockPracticeBoard button[aria-label="Струна 5, лад 3"]').click()
  assert page.locator('.phrase-meter').get_attribute('aria-label')=='Заполнено 0.5 из 8 долей'
  expect(page.get_by_role('button',name='Восьмая · ½ доли',exact=True)).to_have_attribute('aria-pressed','true')
  page.emulate_media(reduced_motion='reduce')
  assert page.locator('.phrase-toolbar').bounding_box()['width']<=width
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.close()
 assert not errors,errors
 browser.close()
 print('OK: rewards including hints and reload, entry/mobile tabs, task labels, repair result, sound lifecycle, phrase controls; 8 screenshots')
