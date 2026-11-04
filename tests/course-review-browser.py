"""Regression checks for the second review: actual browser, persisted state and audio positions."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
with sync_playwright() as p:
    browser=p.chromium.launch(args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1366,'height':768})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(APP.as_uri())
    page.locator('#blockResume').click()
    page.locator('#lessonNext').click();page.locator('#lessonNext').click()
    page.locator('#lessonHint').click()
    page.locator('#lessonBoard .sandbox-hit').nth(4).click()
    page.wait_for_function("document.querySelectorAll('#lessonBoard .sounding').length===1 && document.querySelectorAll('#lessonBoard .cell')[71].classList.contains('sounding')")
    page.locator('#lessonNext').click()
    expect(page.locator('#lessonPosition')).to_have_text('Шаг 4 из 9')
    page.reload();page.locator('#blockResume').click()
    expect(page.locator('#lessonPosition')).to_have_text('Шаг 4 из 9')
    page.locator('#lessonBack').click()
    expect(page.locator('#lessonNext')).to_be_enabled()
    state=page.evaluate("JSON.parse(localStorage.getItem('fretlab-lessons-v1')).sessions[0]")
    assert state['hints']==[2] and state['choices']==[[2,4]],state
    page.locator('#lessonRestart').click();page.reload();page.locator('#blockResume').click()
    expect(page.locator('#lessonPosition')).to_have_text('Шаг 1 из 9')
    page.locator('#lessonRoute').click()
    page.locator('#blockNextLesson').click();page.locator('#lessonNext').click()
    # Same MIDI, two positions: only the intended string lights up each time.
    page.locator('#lessonListen').click()
    expect(page.locator('#lessonListen')).to_have_text('■ Стоп')
    page.wait_for_function("document.querySelectorAll('#lessonBoard .sounding').length===1 && document.querySelectorAll('#lessonBoard .cell')[71].classList.contains('sounding')")
    page.wait_for_function("document.querySelectorAll('#lessonBoard .sounding').length===1 && document.querySelectorAll('#lessonBoard .cell')[93].classList.contains('sounding')")
    expect(page.locator('#lessonListen')).to_have_text('▶ Послушать пример')
    page.locator('#lessonListen').click();page.locator('#lessonListen').click()
    expect(page.locator('#lessonListen')).to_have_text('▶ Послушать пример')
    expect(page.locator('.sounding')).to_have_count(0)
    assert page.locator('#tab-block').get_attribute('aria-controls')=='panel-block'
    assert page.locator('#panel-block #panel-lesson').count()==1
    page.locator('#lessonRoute').click()
    page.locator('#blockActivities article').nth(3).get_by_role('button').click()
    page.locator('#blockTaskBody').get_by_role('button',name='Тон · 2',exact=True).click()
    before=page.locator('#blockTaskBody').inner_text()
    page.get_by_role('button',name='← К уроку',exact=True).click()
    expect(page.locator('#lessonReturn')).to_be_visible()
    page.locator('#lessonReturn').click()
    assert page.locator('#blockTaskBody').inner_text()==before
    # Complete the same attempt, without losing its first entry.
    for n in [2,1,2,2,2,1]:
        page.locator('#blockTaskBody').get_by_role('button',name='Тон · 2' if n==2 else 'Полутон · 1',exact=True).click()
    page.locator('#blockTaskBody').get_by_role('button',name='Проверить',exact=True).click()
    assert 'выполнено' in page.locator('#blockTaskFeedback').inner_text()
    page.set_viewport_size({'width':390,'height':844})
    expect(page.locator('#tabsMore')).to_be_visible()
    assert page.locator('.v2-topbar').bounding_box()['height']<=65
    for _ in range(3):
        if page.locator('#tabsMore').inner_text()=='←':break
        page.locator('#tabsMore').click();page.wait_for_timeout(100)
    expect(page.locator('#tabsMore')).to_have_text('←')
    page.locator('#tabsMore').click();page.wait_for_timeout(100)
    assert page.locator('.v2-tabs').evaluate('e=>e.scrollLeft')==0
    page.locator('#tab-block').click();page.locator('#blockResume').click()
    page.locator('#lessonNext').click();page.locator('#lessonNext').click()
    assert page.locator('#lessonNextHelp').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=15
    page.screenshot(path='/tmp/fretlab-review2-mobile.png',full_page=True)
    assert not errors,errors
    browser.close()
    print('OK: lesson reload/restart, exact unison positions, listen/stop, stable ARIA, exercise return and mobile tab scrolling')
