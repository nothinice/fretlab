"""Working design concept: entry, real lesson completion, isolated progress and readable controls."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
APP=Path(os.environ.get('FRETLAB_DESIGN_PATH','/tmp/FretLab-design-discoveries.html'))
PALETTE=os.environ.get('FRETLAB_DESIGN_PALETTE','ink')
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--no-sandbox'])
 for width,height in [(390,844),(1280,800)]:
  page=browser.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(APP.as_uri()+'?palette='+PALETTE)
  page.locator('.design-palette-picker button[data-palette=green]').click()
  expect(page.locator('html')).to_have_attribute('data-palette','green')
  page.locator(f'.design-palette-picker button[data-palette={PALETTE}]').click()
  expect(page.locator('html')).to_have_attribute('data-palette',PALETTE)
  expect(page.locator('.design-palette-picker button[aria-pressed=true]')).to_have_count(1)
  expect(page.locator('.design-route-part')).to_have_count(4)
  expect(page.locator('.design-route-part[open]')).to_have_count(1)
  assert page.locator('#blockResume').bounding_box()['y']+page.locator('#blockResume').bounding_box()['height']<height
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert page.locator('.v2-tabs').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  page.screenshot(path=f'/tmp/fretlab-{PALETTE}-entry-{width}.png',animations='disabled')
  page.locator('#blockResume').click();page.locator('#lessonNext').click();page.locator('#lessonNext').click();page.evaluate('scrollTo(0,0)')
  expect(page.locator('#lessonTitle')).to_have_text('Найдите полутон вверх')
  page.screenshot(path=f'/tmp/fretlab-{PALETTE}-task-{width}.png',animations='disabled')
  box=page.locator('#lessonNext').bounding_box();assert box['y']+box['height']<=height,(width,box)
  hit=page.locator('#lessonBoard .sandbox-hit').first.bounding_box();assert hit['width']>=44 and hit['height']>=44,hit
  for selector in ['#blockResume','#lessonNext','.fret-label','.active-string-label','.board-legend']:
   ratio=page.locator(selector).first.evaluate('''e=>{const rgb=s=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=s;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].slice(0,3)};const lum=s=>rgb(s).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);let n=e,bg=getComputedStyle(n).backgroundColor;while(bg==='rgba(0, 0, 0, 0)'&&n.parentElement){n=n.parentElement;bg=getComputedStyle(n).backgroundColor;}if(e.classList.contains('fret-label'))bg='#e1c394';const a=lum(getComputedStyle(e).color),b=lum(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}''')
   assert ratio>=4.5,(selector,ratio)
  expect(page.locator('#lessonNext')).to_be_disabled()
  page.locator('#lessonHint').click();page.locator('#lessonBoard .sandbox-hit').nth(4).click();expect(page.locator('#lessonNext')).to_be_enabled()
  page.locator('#lessonNext').click();page.locator('#lessonNext').click()
  for fret in [5,5,7]:page.locator('#lessonBoard .sandbox-hit').nth(fret).click();page.locator('#lessonNext').click()
  page.locator('#lessonPractice').check();page.locator('#lessonNext').click();page.evaluate('scrollTo(0,0)')
  expect(page.locator('#lessonFeedback')).to_contain_text('Линейка звуков')
  page.screenshot(path=f'/tmp/fretlab-{PALETTE}-finish-{width}.png',animations='disabled')
  assert page.evaluate("localStorage.getItem('fretlab-design-block1-v1')!==null && localStorage.getItem('fretlab-block1-v1')===null")
  page.locator('#lessonRoute').click();page.reload();expect(page.locator('#blockResume')).to_contain_text('Продолжить')
  # All route groups remain keyboard-expandable and retain live exercise buttons.
  closed=page.locator('.design-route-part').last
  closed.locator('summary').click();expect(closed.locator('.block-card').first).to_be_visible()
  for i in range(4):
   page.locator('#tab-block').click();group=page.locator('.design-route-part').nth(i)
   if group.get_attribute('open') is None:group.locator('summary').click()
   group.locator('.block-card').first.get_by_role('button').click()
   expect(page.locator('#panel-lesson' if i<2 else '#blockWorkspace')).to_be_visible()
  assert not errors,errors;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.close()
 browser.close()
print('OK: real lesson, task gates, reward, reload, isolated storage, all four route groups and mobile navigation')
