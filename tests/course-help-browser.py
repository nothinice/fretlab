"""Beginner help, sound failures, retained rhythm answers and composer action order."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox'])
 for width,height in [(390,844),(1280,800)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(APP.as_uri())
  page.get_by_role('button',name='▶ Проверить звук',exact=True).click();dialog=page.get_by_role('dialog');expect(dialog).to_be_visible();expect(dialog.get_by_role('button',name='Слышу',exact=True)).to_be_disabled()
  page.evaluate("window.oldGet=getAudioCtx;getAudioCtx=()=>({state:'suspended',resume:()=>Promise.reject(new Error('blocked'))})")
  dialog.get_by_role('button',name='▶ Проиграть звук',exact=True).click();expect(dialog).to_contain_text('Браузер не смог запустить звук')
  page.evaluate('getAudioCtx=oldGet');dialog.get_by_role('button',name='▶ Проиграть звук',exact=True).click();expect(dialog.get_by_role('button',name='Не слышу',exact=True)).to_be_enabled()
  dialog.get_by_role('button',name='Не слышу',exact=True).click();expect(dialog.locator('.sound-help')).to_be_visible();expect(dialog).to_contain_text('слуховые задания лучше отложить')
  dialog.get_by_role('button',name='▶ Проиграть звук',exact=True).click();dialog.get_by_role('button',name='Слышу',exact=True).click();expect(page.locator('#courseSoundStatus')).to_contain_text('Вы подтвердили звук')
  dialog.get_by_role('button',name='Вернуться к занятию').click()
  page.get_by_role('button',name='Термины и гриф',exact=True).click();expect(dialog).to_contain_text('Тоника');expect(dialog).to_contain_text('самая тонкая');page.keyboard.press('Escape')
  page.locator('#blockActivities article').nth(7).get_by_role('button').click();body=page.locator('#blockTaskBody');body.get_by_role('button',name='Четыре',exact=True).click();expect(body.locator('#rhythmNextHelp')).to_contain_text('Ответ верный и сохранён')
  next=body.get_by_role('button',name='Дальше по ритму →',exact=True);expect(next).to_be_disabled();body.get_by_role('button',name='▶ Четыре доли',exact=True).click();body.locator('input[type=checkbox]').check();expect(next).to_be_enabled()
  page.locator('#blockClose').click();page.locator('#blockActivities article').nth(8).get_by_role('button').click()
  finish=body.get_by_role('button',name='Проверить фразу и завершить',exact=True)
  assert finish.bounding_box()['y']>body.locator('input[type=checkbox]').last.bounding_box()['y']
  assert body.locator('.phrase-toolbar').evaluate('e=>getComputedStyle(e).position')=='static'
  assert body.locator('.lesson-practice').first.evaluate("e=>getComputedStyle(e).textTransform")=='none'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close()
 b.close();print('OK: sound success/failure, glossary, retained early answer, composer order, desktop/mobile')
