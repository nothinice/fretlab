"""Review regressions: completion destination, feedback, contrast and touch targets."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
contrast_js="""e=>{
 const rgb=s=>{const ctx=document.createElement('canvas').getContext('2d');ctx.fillStyle=s;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);};
 const lum=c=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 let n=e,bg=getComputedStyle(n).backgroundColor;
 while(bg==='rgba(0, 0, 0, 0)'&&n.parentElement){n=n.parentElement;bg=getComputedStyle(n).backgroundColor;}
 const a=lum(getComputedStyle(e).color),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}"""
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--no-sandbox'])
 for width,height in [(390,844),(1280,800)]:
  page=browser.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(APP.as_uri())
  for theme in ['light','dark']:
   page.emulate_media(color_scheme=theme)
   for selector in ['#blockResume','#tab-sandbox','.board-legend']:
    ratio=page.locator(selector).first.evaluate(contrast_js)
    assert ratio>=4.5,(theme,selector,ratio)
   for selector in ['.block-plan summary','.lesson-purpose summary','.audio-options summary']:
    for el in page.locator(selector).all():
     if el.is_visible():assert el.bounding_box()['height']>=44
  page.locator('#blockResume').click()
  page.locator('#lessonNext').click();page.locator('#lessonNext').click()
  expect(page.locator('#lessonFeedback')).to_be_hidden()
  expect(page.locator('#lessonNext')).to_be_disabled()
  assert page.locator('#lessonNext').evaluate("e=>getComputedStyle(e).borderTopStyle")=='dashed'
  for theme in ['light','dark']:
   page.emulate_media(color_scheme=theme)
   for selector in ['#lessonNext','.course-breadcrumb','.board-legend','#lessonStorage']:
    assert page.locator(selector).first.evaluate(contrast_js)>=4.5,(theme,selector)
   page.screenshot(path=f'/tmp/fretlab-opus-{width}-{theme}.png',full_page=True)
  page.locator('#lessonBoard .sandbox-hit').nth(5).click();expect(page.locator('#lessonFeedback')).to_be_visible();expect(page.locator('#lessonNext')).to_be_disabled()
  page.locator('#lessonBoard .sandbox-hit').nth(4).click();expect(page.locator('#lessonNext')).to_be_enabled()
  assert page.locator('.legend-start').first.evaluate('e=>getComputedStyle(e).color')==page.locator('#lessonBoard .note.root').first.evaluate('e=>getComputedStyle(e).backgroundColor')
  page.locator('#lessonNext').click();page.locator('#lessonNext').click();expect(page.locator('#lessonFeedback')).to_be_hidden()
  # Completed course takes priority over a replayed, unfinished lesson.
  page.evaluate("localStorage.setItem('fretlab-block1-v1',JSON.stringify({version:1,records:Object.fromEntries(CourseBlockOne.ACTIVITIES.map(a=>[a.id,{done:true}]))}))")
  page.reload();expect(page.locator('.sound-welcome')).to_be_hidden();expect(page.locator('#blockResume')).to_contain_text('Дальше: Блок 2')
  page.locator('#blockResume').click();expect(page.locator('#lessonBreadcrumb')).to_contain_text('Блок 2')
  for i in range(6):
   if i==3:page.locator('#lessonBoard .sandbox-hit').nth(7).click()
   if i==4:page.locator('#lessonBoard .sandbox-hit').nth(10).click()
   if i==5:page.locator('#lessonPractice').check()
   page.locator('#lessonNext').click()
  expect(page.locator('#lessonExplanation')).to_contain_text('Блок 2 в работе')
  expect(page.locator('#lessonContinue')).to_have_text('К пройденному Блоку 1 →')
  page.locator('#lessonContinue').click();expect(page.locator('#blockResume')).to_contain_text('Дальше: Блок 2')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close()
 browser.close()
print('OK: review feedback, completion priority and Block 2 return, light/dark contrast >=4.5, touch targets, 390/1280')
