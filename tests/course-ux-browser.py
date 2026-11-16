"""Focused regression for the six UX walkthrough findings; no fabricated state."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',ROOT/'course-lab.html'))
CSS=ROOT/'course-complete-design.css'

with sync_playwright() as p:
    browser=p.chromium.launch(args=['--no-sandbox'])
    for width,height in [(390,844),(1366,900)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(APP.as_uri()+'?course=all',wait_until='domcontentloaded')
        if CSS.exists():page.add_style_tag(path=str(CSS))
        def open_step(module,index):
            page.evaluate('([id,index])=>courseComplete.open(id,index)',[module,index])
        def button(name):
            return page.locator('#courseStepBody').get_by_role('button',name=name,exact=True)
        def state():return page.evaluate('courseComplete.getState()')

        # P1-1: each Enter continues entering notes, with focus retained after redraw.
        open_step('6',1)
        button('B2').focus();button('B2').press('Enter')
        expect(button('B2')).to_be_focused()
        button('B2').press('Enter')
        expect(button('B2')).to_be_focused()
        assert state()['sessions']['6-sequence-three']['sequence']==[47,47]
        open_step('8',4)
        button('C3').focus();button('C3').press('Enter')
        expect(button('C3')).to_be_focused()
        button('C3').press('Enter')
        expect(button('C3')).to_be_focused()
        for _ in range(14):button('C3').click()
        assert len(state()['sessions']['8-project']['events'])==16

        # P1-4: the result can be read by bar, beat and current chord.
        timeline=page.locator('.course-phrase')
        expect(timeline.locator('li')).to_have_count(16)
        expect(timeline.locator('li').nth(0)).to_contain_text('Такт 1 · доля 1 · C')
        expect(timeline.locator('li').nth(7)).to_contain_text('Такт 2 · доля 4 · C')
        expect(timeline.locator('li').nth(8)).to_contain_text('Такт 3 · доля 1 · F')
        expect(timeline.locator('li').nth(15)).to_contain_text('Такт 4 · доля 4 · F')

        # P1-5: replace the first event without deleting any following event.
        original=state()['sessions']['8-project']['events']
        timeline.locator('button').first.click()
        expect(page.locator('.course-edit-status')).to_contain_text('Редактируется событие 1')
        button('D3').click()
        edited=state()['sessions']['8-project']['events']
        assert edited[0]=={'midi':50,'beats':1,'str':6,'fret':10}
        assert edited[1:]==original[1:]
        # Duration overrun leaves the phrase intact; a legal change remains editable.
        timeline.locator('button').first.click()
        button('2 доли').click()
        expect(page.locator('#courseStepFeedback')).to_contain_text('выходит за границу')
        assert state()['sessions']['8-project']['events']==edited
        button('½ доли').click();button('D3').click();button('C3').click()
        assert sum(e['beats'] for e in state()['sessions']['8-project']['events'])==16
        assert len(state()['sessions']['8-project']['events'])==17
        # A correct construction still requires honest, separate self-assessment.
        button('Проверить фразу').click()
        expect(page.locator('#courseNext')).to_be_disabled()
        expect(page.locator('#courseNextHelp')).to_contain_text('два пункта самопроверки')
        for check in page.locator('#courseStepBody input[type=checkbox]').all():check.check()
        expect(page.locator('#courseNext')).to_be_enabled()
        timeline.locator('button').first.click();button('E3').click()
        expect(page.locator('#courseNext')).to_be_disabled()
        assert all(not v for v in state()['sessions']['8-project'].get('checks',[]))
        phrase=state()['sessions']['8-project']['events']

        # P1-2: the primary return action takes the learner directly to their work.
        page.locator('#courseRoute').click()
        expect(page.locator('#courseResume')).to_contain_text('Вернуться к работе: блок 8')
        page.locator('#courseResume').click()
        expect(page.locator('#courseStepTitle')).to_have_text('Ваш проект: четыре такта C → F')
        assert state()['sessions']['8-project']['events']==phrase
        page.reload(wait_until='domcontentloaded')
        if CSS.exists():page.add_style_tag(path=str(CSS))
        expect(page.locator('#courseResume')).to_contain_text('Вернуться к работе: блок 8')
        page.locator('#courseResume').click()
        assert state()['sessions']['8-project']['events']==phrase
        page.screenshot(path=f'/tmp/fretlab-ux-fixed-project-{width}.png',full_page=True)

        # P1-3: a direct jump saves practice honestly, and explains the remaining work.
        open_step('3',11)
        expect(page.locator('#courseNext')).to_have_text('Сохранить практику')
        expect(page.locator('#courseNext')).to_be_disabled()
        for check in page.locator('#courseStepBody input[type=checkbox]').all():check.check()
        page.locator('#courseNext').click()
        expect(page.locator('#courseHomeNotice')).to_be_visible()
        expect(page.locator('#courseHomeNotice')).to_contain_text('осталось пройти 11')
        assert not state()['records'].get('3')
        assert state()['done']['3-practice']

        # P1-6: progression notation is unambiguous; true slash chords remain intact.
        content=page.evaluate('JSON.stringify(CourseCompleteContent.modules)')
        assert 'C/F' not in content and 'Cmaj7/Fmaj7' not in content
        open_step('7',5)
        expect(page.locator('#courseStepText')).to_contain_text('C/E')
        expect(page.locator('#courseStepInstruction')).to_contain_text('C/E')

        # Fast preview does not complete a long lesson or bypass ordinary audio gates.
        open_step('6',8)
        expect(page.locator('#courseNext')).to_be_disabled()
        expect(page.locator('#courseStepBody')).to_contain_text('около 39 с')
        button('▶ Послушать пример').click()
        expect(page.locator('#courseStop')).to_be_visible()
        page.wait_for_timeout(250)
        page.locator('#courseStop').click()
        expect(page.locator('#courseNext')).to_be_disabled()
        assert not state()['sessions']['6-twelve-bars'].get('heard')
        assert not state()['done'].get('6-twelve-bars')
        page.locator('#courseStepBody summary').filter(has_text='Для повторения').click()
        button('Просмотреть следующий шаг').click()
        expect(page.locator('#courseStepTitle')).to_have_text('Не потеряйте пятый такт')
        assert not state()['done'].get('6-twelve-bars')
        expect(page.locator('#courseNext')).to_be_disabled()
        # Nearby terms are reachable without losing the current step or phrase.
        page.locator('#courseWork [data-course-help=terms]').click()
        expect(page.locator('dialog')).to_be_visible()
        page.locator('dialog').get_by_role('button',name='Вернуться к занятию').click()
        expect(page.locator('#courseStepTitle')).to_have_text('Не потеряйте пятый такт')

        # One real short ear example: answers unlock only at the natural audio end.
        open_step('3',5)
        page.locator('#courseTempo').evaluate("e=>e.closest('details').open=true")
        page.locator('#courseTempo').fill('120');page.locator('#courseTempo').press('Tab')
        answer=button('Cmaj7 · большая септима')
        expect(answer).to_be_disabled()
        button('▶ Послушать пример').click()
        expect(answer).to_be_disabled()
        expect(page.locator('#courseStop')).to_be_hidden(timeout=10000)
        expect(answer).to_be_enabled()
        answer.click();button('Следующий пример').click()
        expect(button('Cmaj7 · большая септима')).to_be_disabled()
        expect(page.locator('#courseNext')).to_be_disabled()
        assert state()['sessions']['3-ear-seventh']['round']==1
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert not errors,errors
        print(f'OK: {width}px — all six UX fixes, persistence, self-check/ear gates, stop/preview, terms; no browser errors',flush=True)
        page.close()
    browser.close()
