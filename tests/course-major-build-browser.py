"""A complete independent scale must precede the major lesson finish."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox'])
 for width,height in [(390,844),(1280,800)]:
  page=b.new_page(viewport={'width':width,'height':height});page.goto(APP.as_uri())
  saved={'version':1,'active':1,'visited':[1],'sessions':[None,{'current':9,'choices':list(enumerate([5,7,8,10,12,14,15],2)),'practiced':False,'hints':[]}]}
  page.evaluate('(data)=>localStorage.setItem("fretlab-lessons-v1",JSON.stringify(data))',saved);page.reload();page.locator('#blockResume').click()
  expect(page.locator('#lessonTitle')).to_have_text('Соберите всю гамму по формуле');expect(page.locator('#lessonNext')).to_be_disabled()
  assert page.locator('#lessonBoard .note').count()==1
  def hit(f):page.locator('#lessonBoard .sandbox-hit').nth(f).click()
  hit(4)
  for f in [5,7,8,10,12,14,15]:hit(f)
  expect(page.locator('#lessonNext')).to_be_disabled();page.reload();page.locator('#blockResume').click();assert page.locator('#lessonBoard .note').count()==9
  hit(4);expect(page.locator('#lessonNext')).to_be_enabled();expect(page.locator('#lessonListen')).to_be_visible()
  hit(5);expect(page.locator('#lessonNext')).to_be_disabled();hit(5);page.locator('#lessonNext').click()
  expect(page.locator('#lessonTitle')).to_have_text('Сыграйте построенную гамму');page.locator('#lessonPractice').check();page.locator('#lessonNext').click()
  expect(page.locator('#lessonTitle')).to_have_text('Теперь формула стала гаммой');page.close()
 b.close();print('OK: full scale required, extra note rejected, edit revokes completion, reload retains selection, finish follows practice')
