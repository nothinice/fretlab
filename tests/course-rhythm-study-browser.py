"""Guided notation study gates, saved checkpoints and mobile layout."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox'])
 for width,height in [(390,844),(1280,800)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(APP.as_uri())
  def open_rhythm():page.locator('#blockActivities article').nth(7).get_by_role('button').click()
  def button(name):return page.locator('#blockTaskBody').get_by_role('button',name=name,exact=True)
  open_rhythm()
  for step,answer in enumerate(['Четыре','Одну','Продолжить ровный счёт','Одну','На второй']):
   expect(page.locator('.rhythm-intro')).to_contain_text(f'шаг {step+1} из 5')
   next=button('Начать сравнение ритмов →' if step==4 else 'Дальше по ритму →')
   expect(next).to_be_disabled()
   if step==0:
    button('Две').click();page.locator('.rhythm-intro input').check();expect(next).to_be_disabled()
   button('▶ Четыре доли' if step==0 else '▶ Послушать запись').click();button(answer).click()
   if step>0:expect(next).to_be_disabled()
   page.locator('.rhythm-intro input').check();expect(next).to_be_enabled()
   if step in [2,3,4]:
    assert page.locator('.rhythm-score').count()==1
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    page.evaluate('scrollTo(0,0)');page.screenshot(path=f'/tmp/fretlab-study-{step}-{width}.png',full_page=True)
   next.click()
   saved=json.loads(page.evaluate("localStorage.getItem('fretlab-rhythm-study-v1')"));assert saved['step']==step+1
   if step==1:
    page.reload();open_rhythm();expect(page.locator('.rhythm-intro')).to_contain_text('шаг 3 из 5')
  assert page.locator('.rhythm-option .rhythm-score').count()==3
  page.locator('.rhythm-support summary').first.click();assert not page.locator('.rhythm-support').first.get_attribute('open')
  page.reload();open_rhythm();assert page.locator('.rhythm-intro').count()==0
  button('Разобрать ритм ещё раз').click();expect(page.locator('.rhythm-intro')).to_contain_text('шаг 1 из 5')
  assert not errors,errors;page.close()
 b.close();print('OK: five study steps, wrong-answer/practice gates, reload resume, scores and mobile layout')
