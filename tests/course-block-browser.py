"""Optional browser checks. Run with Playwright installed; no app dependencies."""
import re
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

APP = Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1] / 'course-lab.html'))

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1366, 'height': 768})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(APP.as_uri())
    page.wait_for_selector('#blockActivities article')
    assert page.locator('#blockActivities article').count() == 10
    page.evaluate('window._notes=[]; const originalPlay=playMidi; playMidi=(...args)=>{window._notes.push(args);return originalPlay(...args)}')

    def activity(index):
        page.locator('#tab-block').click()
        if page.locator('#blockClose').is_visible():
            page.locator('#blockClose').click()
        page.locator('#blockActivities article').nth(index).get_by_role('button').click()

    def fret(value):
        page.locator(f'#blockPracticeBoard button[aria-label="Струна 5, лад {value}"]').click()

    def body_button(label):
        page.locator('#blockTaskBody').get_by_role('button', name=label, exact=True).click()

    def solve_intervals(count):
        for _ in range(count):
            text = page.locator('#blockTaskInstruction').inner_text()
            match = re.search(r'струне (\d) от лада (\d+).*?(полутон|тон) (выше|ниже)', text)
            assert match, text
            string, start, size, direction = match.groups()
            delta = (1 if size == 'полутон' else 2) * (1 if direction == 'выше' else -1)
            page.locator(f'#blockPracticeBoard button[aria-label="Струна {string}, лад {int(start)+delta}"]').click()

    def formula():
        for n in [2,2,1,2,2,2,1]:
            body_button('Тон · 2' if n == 2 else 'Полутон · 1')
        body_button('Проверить')

    def scale():
        for f in [5,7,8,10,12,14,15]:
            fret(f)
        body_button('Проверить')

    # Review regressions: single course entry, task visible, audio clock and keyboard access.
    assert page.locator('#tab-lesson').count() == 0
    assert page.locator('#panel-lesson').get_attribute('aria-labelledby') == 'lessonTitle'
    assert page.locator('.block-stage').count() == 4
    page.locator('#blockResume').click()
    page.evaluate('scrollTo(0,0)')
    board_box=page.locator('#lessonBoard').bounding_box()
    assert board_box['y']+board_box['height'] <= 768, board_box
    assert page.locator('#tab-block').get_attribute('aria-selected') == 'true'
    page.screenshot(path='/tmp/fretlab-review-lesson-desktop.png')
    tonic=page.locator('#lessonBoard .sandbox-hit').nth(3)
    tonic.hover()
    page.wait_for_timeout(220)
    hover_style=tonic.evaluate("e => ({background:getComputedStyle(e).backgroundColor, radius:getComputedStyle(e,'::before').borderRadius, opacity:getComputedStyle(e,'::before').opacity})")
    assert hover_style == {'background':'rgba(0, 0, 0, 0)','radius':'50%','opacity':'1'}, hover_style
    page.locator('#lessonBoard').screenshot(path='/tmp/fretlab-note-hover.png')
    page.emulate_media(reduced_motion='reduce')
    assert tonic.locator('.note').evaluate("e => getComputedStyle(e).transform") == 'none'
    page.emulate_media(reduced_motion='no-preference')

    page.locator('#lessonNext').click()
    assert page.locator('#lessonBoard .interval-arc').inner_text() == '½'
    page.locator('#lessonListen').click()
    page.wait_for_function("document.querySelectorAll('#lessonBoard .sounding').length > 0")
    page.locator('#lessonNext').click()
    expect(page.locator('#lessonBoard .sounding')).to_have_count(0)
    assert page.locator('#lessonNext').is_disabled()
    assert 'Сначала выберите' in page.locator('#lessonNextHelp').inner_text()
    page.locator('#lessonRestart').click()
    page.locator('#lessonRoute').click()
    assert page.locator('#blockOverview').is_visible()
    page.locator('#tab-sandbox').click()
    hits=page.locator('#sandboxBoard .sandbox-hit')
    assert page.locator('#sandboxBoard [tabindex="0"]').count() == 1
    hits.first.focus()
    page.keyboard.press('ArrowRight');page.keyboard.press('ArrowDown')
    expect(hits.nth(18)).to_be_focused()
    page.keyboard.press('Enter')
    expect(hits.nth(18)).to_be_focused()
    assert page.locator('#sandboxBoard [tabindex="0"]').count() == 1
    page.keyboard.press('Tab')
    expect(page.locator('#sandboxSequence')).to_be_focused()

    # Complete the guided lessons through the real UI, including guitar self-reports.
    for index, lesson in [(0,0),(2,1)]:
        activity(index)
        assert page.locator('#panel-lesson').is_visible()
        data = page.evaluate('CourseLesson.steps' if lesson == 0 else 'CourseLessonContent.majorLesson()')
        for step in data:
            if 'delta' in step:
                string, f = step['str']+1, step['start']+step['delta']
                page.locator('#lessonBoard .sandbox-hit').nth(f).click()
            if step.get('practice'):
                page.locator('#lessonPractice').check()
            if not step.get('finish'):
                page.locator('#lessonNext').click()
        assert '✓ Ответы:' in page.locator('#lessonFeedback').inner_text()
        page.locator('#lessonContinue').click()
        assert page.locator('#blockWorkspace').is_visible()
        assert ('2.' if lesson==0 else '4.') in page.locator('#blockTaskTitle').inner_text()

    activity(1); solve_intervals(8)
    assert 'Упражнение выполнено' in page.locator('#blockTaskFeedback').inner_text()
    activity(3); formula()
    activity(4); scale()
    activity(5)
    selected = [int(x) for x in page.locator('#blockPracticeBoard .note').all_text_contents()]
    expected = {3,5,7,8,10,12,14,15}
    bad = (set(selected)-expected).pop()
    missing = (expected-set(selected)).pop()
    fret(bad); fret(missing)
    assert 'Упражнение выполнено' in page.locator('#blockTaskFeedback').inner_text()

    activity(6)
    assert page.locator('#blockTaskBody').get_by_role('button',name='Тон',exact=True).is_disabled()
    for _ in range(6):
        page.evaluate('window._notes=[]')
        body_button('▶ Слушать пару')
        notes = page.evaluate('window._notes')
        delta = notes[-1][0]-notes[-2][0]
        body_button('Полутон' if delta == 1 else 'Тон')

    activity(7)
    for _ in range(3):
        page.evaluate('window._notes=[]')
        body_button('▶ Отсчёт и ритм')
        times = page.evaluate('window._notes.filter(n=>n[0]===48).map(n=>n[1])')
        offsets = [round(t-times[0],2) for t in times]
        patterns = [[0,1,3],[0,.5,1,2],[0,2,2.5,3]]
        which = patterns.index(offsets)
        page.locator('.rhythm-option').nth(which).get_by_role('button').click()
        body_button('Повторил голосом и на гитаре — дальше')

    activity(8)
    for f in [3,5,7]:
        fret(f)
    body_button('Добавить паузу')
    for f in [7,5]:
        fret(f)
    page.locator('select[aria-label="Длительность следующего события"]').select_option('2')
    fret(3)
    page.locator('#blockTaskBody input[type=checkbox]').nth(0).check()
    page.locator('#blockTaskBody input[type=checkbox]').nth(1).check()
    body_button('▶ Сыграть с отсчётом')
    body_button('Проверить фразу и завершить')

    activity(9); solve_intervals(4); formula(); scale(); body_button('12')
    for checkbox in page.locator('#blockTaskBody input[type=checkbox]').all():
        checkbox.check()
    body_button('Завершить проверку')
    assert 'Выполнено 10 из 10' in page.locator('#blockSummary').inner_text()
    page.locator('#blockClose').click()
    page.evaluate('scrollTo(0,0)')
    page.screenshot(path='/tmp/fretlab-block1-desktop.png', full_page=True)
    page.reload()
    assert 'Выполнено 10 из 10' in page.locator('#blockSummary').inner_text()
    activity(8)
    assert page.locator('.phrase-timeline li').count() == 7
    assert not errors, errors

    # A separate mobile context; no forced rotation and no page-level overflow.
    mobile = browser.new_page(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
    mobile.on('pageerror', lambda e: errors.append(str(e)))
    mobile.goto(APP.as_uri())
    mobile.wait_for_selector('#blockActivities article')
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    assert mobile.locator('.v2-topbar').bounding_box()['height'] <= 65
    mobile.locator('#blockResume').click()
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    mobile.screenshot(path='/tmp/fretlab-review-lesson-mobile.png',full_page=True)
    # Next must not jump to the title or to a shorter page's bottom on mobile.
    for _ in range(2):
        mobile.locator('#lessonNext').scroll_into_view_if_needed()
        before=mobile.evaluate('scrollY')
        mobile.locator('#lessonNext').click()
        mobile.wait_for_timeout(100)
        assert abs(mobile.evaluate('scrollY')-before) <= 1
    mobile.locator('#lessonBack').scroll_into_view_if_needed()
    before=mobile.evaluate('scrollY')
    mobile.locator('#lessonBack').click()
    mobile.wait_for_timeout(100)
    assert abs(mobile.evaluate('scrollY')-before) <= 1

    mobile.locator('#lessonRoute').click()
    mobile.emulate_media(color_scheme='dark')
    assert mobile.locator('.block-card').first.evaluate("e => getComputedStyle(e).borderTopColor") == 'rgb(58, 49, 40)'
    mobile.screenshot(path='/tmp/fretlab-review-dark-mobile.png',full_page=True)
    mobile.emulate_media(color_scheme='light')
    mobile.screenshot(path='/tmp/fretlab-block1-mobile.png',full_page=True)
    mobile.locator('#blockActivities article').nth(4).get_by_role('button').click()
    mobile.locator('#blockPracticeBoard button[aria-label="Струна 5, лад 5"]').click()
    mobile.locator('#blockPracticeBoard button[aria-label="Струна 5, лад 15"]').click()
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    mobile.evaluate('scrollTo(0,0)')
    mobile.screenshot(path='/tmp/fretlab-block1-mobile-exercise.png',full_page=True)
    fallback=browser.new_page()
    fallback.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})")
    fallback.goto(APP.as_uri())
    assert 'недоступно' in fallback.locator('#blockStorage').inner_text()
    fallback.locator('#blockActivities article').nth(3).get_by_role('button').click()
    assert fallback.locator('#blockWorkspace').is_visible()
    assert not errors, errors
    browser.close()
    print('OK: full block UI, audio scheduling, all activities, final assessment, reload persistence and 390px mobile layout')
