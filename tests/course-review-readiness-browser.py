"""Independent course-navigation, harmony and playable-lesson regression."""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
APP = Path(os.environ.get('FRETLAB_PREVIEW_PATH', ROOT / 'course-lab.html'))

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox'])
    for width, height in [(390, 844), (1366, 900)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(APP.as_uri(), wait_until='domcontentloaded')
        page.evaluate('''() => {
          window.qaVoices=[];
          const previous=playMidi;
          playMidi=function(...args){const voice=previous(...args);window.qaVoices.push({midi:args[0],voice});return voice;};
        }''')

        def open_step(module, index):
            page.evaluate('([id,index])=>courseComplete.open(id,index)', [module, index])

        def reset_voices():
            page.evaluate('qaVoices=[]')

        def voices_stopped():
            assert page.evaluate('qaVoices.length>0 && qaVoices.every(v=>v.voice.stopped)'), page.evaluate('qaVoices.map(v=>({midi:v.midi,stopped:v.voice.stopped}))')

        # The visible top-level interface has one course entry and preserves internal lessons.
        expect(page.get_by_role('tab')).to_have_count(4)
        assert page.get_by_role('tab').all_text_contents() == ['Курс', 'Гриф', 'Формы', 'Теория']
        expect(page.locator('#tab-course')).to_have_attribute('aria-selected', 'true')
        expect(page.locator('#courseHome')).to_be_visible()
        for block, panel in [('1', '#panel-block'), ('2', '#panel-block2')]:
            card = page.locator('.course-module-card').filter(has_text=re.compile(r'Блок ' + block + r'\b'))
            card.get_by_role('button', name='Открыть блок', exact=True).click()
            expect(page.locator(panel)).to_be_visible()
            expect(page.locator('#tab-course')).to_have_attribute('aria-selected', 'true')
            expect(page.locator('#tab-course')).to_have_attribute('tabindex', '0')
            page.locator('#tab-course').click()
            expect(page.locator('#courseHome')).to_be_visible()
        page.locator('#tab-course').focus()
        page.locator('#tab-course').press('ArrowRight')
        expect(page.locator('#tab-sandbox')).to_be_focused()
        expect(page.locator('#panel-sandbox')).to_be_visible()
        page.locator('#tab-sandbox').press('ArrowLeft')
        expect(page.locator('#tab-course')).to_be_focused()

        # Preview moves through content without inventing completed work.
        open_step('3', 0)
        before = page.evaluate('courseComplete.getState()')
        expect(page.locator('#courseNext')).to_be_disabled()
        expect(page.locator('#coursePreview')).to_be_visible()
        page.locator('#coursePreview').click()
        after = page.evaluate('courseComplete.getState()')
        assert after['index']['3'] == 1
        assert after['done'] == before['done']
        assert after['records'] == before['records']

        # Each diatonic triad shows its correct pitches and root on actual string/fret buttons.
        page.locator('#tab-course').click()
        page.locator('#courseHarmonyDetails summary').click()
        expected = [
            ('C', ['C', 'E', 'G'], 0), ('Dm', ['D', 'F', 'A'], 2),
            ('Em', ['E', 'G', 'B'], 4), ('F', ['F', 'A', 'C'], 5),
            ('G', ['G', 'B', 'D'], 7), ('Am', ['A', 'C', 'E'], 9),
            ('Bdim', ['B', 'D', 'F'], 11)
        ]
        for name, names, root in expected:
            page.locator('#harmony-' + name).click()
            expect(page.locator('#harmonyDetails')).to_contain_text('–'.join(names))
            assert set(page.locator('#harmonyBoard .note').all_text_contents()) == set(names)
            roots = page.locator('#harmonyBoard .note.root').all_text_contents()
            assert roots and all(note == names[0] for note in roots)
            reset_voices()
            page.locator('#harmonyBoard .sandbox-hit').first.click()
            assert page.evaluate('qaVoices.length') == 1
            assert page.evaluate('qaVoices[0].midi%12') in page.evaluate('name=>CourseReviewSupport.chords.find(c=>c.name===name).pcs', name)
            page.locator('#harmony-' + name).click()
            voices_stopped()
        page.locator('#courseHarmony').get_by_role('button', name='Показать G7 на грифе', exact=True).click()
        expect(page.locator('#harmonyDetails')).to_contain_text('G–B–D–F')
        assert set(page.locator('#harmonyBoard .note').all_text_contents()) == {'G', 'B', 'D', 'F'}
        assert set(page.locator('#harmonyBoard .note.root').all_text_contents()) == {'G'}
        page.screenshot(path=f'/tmp/fretlab-readiness-harmony-{width}.png', full_page=True)

        # Backing uses an actual G7; leaving for its étude cancels sounding harmony voices.
        reset_voices()
        page.locator('#courseHarmony').get_by_role('button', name='▶ Выбранный аккорд', exact=True).click()
        page.wait_for_function('qaVoices.length>=6', timeout=8000)
        assert sorted(set(page.evaluate('qaVoices.map(v=>v.midi%12)'))) == [2, 5, 7, 11]
        page.locator('#courseHarmony').get_by_role('button', name='Сыграть этюд G7 → C', exact=True).click()
        voices_stopped()
        expect(page.locator('#coursePracticeWork')).to_be_visible()
        assert page.evaluate('coursePractice.getState().study') == 'cadence'

        # The harmony detour returns to the same lesson without marking it completed.
        open_step('3', 0)
        lesson_title = page.locator('#courseStepTitle').inner_text()
        lesson_done = page.evaluate('courseComplete.getState().done')
        page.locator('#courseStepBody').get_by_role('button', name='Посмотреть все аккорды C major: I–vii°', exact=True).click()
        expect(page.locator('#courseHarmony')).to_be_visible()
        page.locator('#harmony-Am').click()
        page.locator('#harmonyReturn').click()
        expect(page.locator('#courseStepTitle')).to_have_text(lesson_title)
        assert page.evaluate('courseComplete.getState().index["3"]') == 0
        assert page.evaluate('courseComplete.getState().done') == lesson_done

        # Every course practice leads to playable material, not only checkboxes.
        for module, study in [('3', 'cf'), ('4', 'am'), ('5', 'dorian'), ('6', 'blues'), ('8', 'cf')]:
            index = page.evaluate('id=>CourseCompleteContent.modules.find(m=>m.id===id).steps.findIndex(s=>s.type==="practice")', module)
            open_step(module, index)
            material = page.locator('.course-play-material')
            expect(material).to_be_visible()
            expect(material.get_by_role('button', name='Вопрос–ответ с приложением', exact=True)).to_be_visible()
            expect(material.get_by_role('button', name='Ритм аккордов и правая рука', exact=True)).to_be_visible()
            material.get_by_role('button').first.click()
            expect(page.locator('#coursePracticeWork')).to_be_visible()
            assert page.evaluate('coursePractice.getState().study') == study
            expect(page.locator('#practiceTab .practice-tab-bar').first).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')

        # Direct lesson links select their requested practice mode, not a stale previous mode.
        for module, label, study, stage in [
            ('3', 'Вопрос–ответ с приложением', 'cf', 'call'),
            ('6', 'Ритм аккордов и правая рука', 'blues', 'rhythm')
        ]:
            index = page.evaluate('id=>CourseCompleteContent.modules.find(m=>m.id===id).steps.findIndex(s=>s.type==="practice")', module)
            open_step(module, index)
            page.locator('.course-play-material').get_by_role('button', name=label, exact=True).click()
            assert page.evaluate('coursePractice.getState().study') == study
            assert page.evaluate('id=>coursePractice.getState().byStudy[id].stage', study) == stage
            expect(page.locator(f'[data-practice-stage="{stage}"]')).to_have_attribute('aria-pressed', 'true')

        # The final performance offers a whole twelve-bar blues in addition to eight-bar C–F.
        open_step('8', 6)
        expect(page.locator('#courseStepText')).to_contain_text('квадрат блюза')
        page.locator('.course-play-material').get_by_role('button', name='Финал: квадрат блюза', exact=True).click()
        assert page.evaluate('coursePractice.getState().study') == 'blues'
        reset_voices()
        page.locator('#practiceTempo').fill('120')
        page.locator('#practiceTempo').press('Tab')
        page.locator('#practicePlay').click()
        page.wait_for_function('qaVoices.length>0', timeout=7000)
        page.locator('#tab-sandbox').click()
        voices_stopped()
        expect(page.locator('#panel-sandbox')).to_be_visible()

        # The full blues form stays three rows of four bars at mobile and desktop sizes.
        index = page.evaluate('CourseCompleteContent.modules.find(m=>m.id==="6").steps.findIndex(s=>s.id==="6-twelve-bars")')
        open_step('6', index)
        form = page.locator('.course-progression.twelve-bar-form')
        expect(form.locator('span')).to_have_count(12)
        rectangles = form.locator('span').evaluate_all('els=>els.map(e=>({x:e.offsetLeft,y:e.offsetTop}))')
        assert len(set(item['y'] for item in rectangles)) == 3, rectangles
        assert all(len([item for item in rectangles if item['y']==y]) == 4 for y in set(item['y'] for item in rectangles))
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=f'/tmp/fretlab-readiness-blues-form-{width}.png', full_page=True)

        # Drop 2 performance has four bars of exact G–C–E–B TAB, not a blank checklist.
        index = page.evaluate('CourseCompleteContent.modules.find(m=>m.id==="7").steps.findIndex(s=>s.type==="practice")')
        open_step('7', index)
        expect(page.locator('#courseStepBody .practice-tab-bar')).to_have_count(4)
        assert set(page.locator('#courseStepBody .practice-tab-event').evaluate_all('els=>els.filter(e=>!e.classList.contains("is-rest")).map(e=>e.getAttribute("aria-label").match(/: ([A-G](?:♯|♭)?)/)?.[1])')) == {'G', 'C', 'E', 'B'}
        expect(page.locator('#courseStepBody').get_by_role('button', name='▶ Четыре такта с сопровождением', exact=True)).to_be_visible()
        assert not errors, errors
        print(f'OK {width}px: unified course navigation, honest preview, seven triads/G7, real voices and cancellation, playable block links, full final form, Drop 2 TAB', flush=True)
        page.close()
    browser.close()
