"""Instrument-practice walkthrough: real controls/audio, no fabricated progress."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
APP = Path(os.environ.get('FRETLAB_PREVIEW_PATH', ROOT / 'course-lab.html'))

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox'])
    for width, height in [(390, 844), (1366, 900)]:
        page = browser.new_page(viewport={'width': width, 'height': height}, accept_downloads=True)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(APP.as_uri() + '?practice=cf', wait_until='domcontentloaded')

        def state():
            return page.evaluate('coursePractice.getState()')

        def current():
            value = state()
            return value['byStudy'][value['study']]

        def stage(name):
            page.locator(f'[data-practice-stage="{name}"]').click()

        def note(name):
            return page.locator('#coursePracticeWork .practice-note-buttons').get_by_role('button', name=name, exact=True)

        def settings():
            control = page.locator('.practice-player-settings')
            if not control.evaluate('e=>e.open'):
                control.locator('summary').click()

        def inspect_svg():
            invalid = page.locator('#coursePracticeWork .practice-tab-event path').evaluate_all('''els=>els.filter(el=>{
              const box=el.getBBox(), root=el.ownerSVGElement.viewBox.baseVal;
              return !(el.getTotalLength()>0) || box.x<0 || box.y<0 || box.x+box.width>root.width || box.y+box.height>root.height;
            }).map(el=>el.getAttribute('d'))''')
            assert not invalid, ('Missing or clipped rhythm glyphs', invalid)

        expect(page.locator('#coursePracticeWork')).to_be_visible()
        expect(page.locator('#courseHome')).to_be_hidden()
        expect(page.locator('#coursePracticeWork h1')).to_have_text('Мотив переходит из C в F')
        expect(page.locator('.practice-tab-bar')).to_have_count(8)
        inspect_svg()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=f'/tmp/fretlab-practice-overview-{width}.png', full_page=True)

        # Daily tasks stay open after choosing another day and total a real 30-minute plan.
        plan = page.locator('.practice-plan')
        plan.locator('summary').click()
        plan.get_by_role('button', name='2. Занятие 2 · секвенция, слух и вариация', exact=True).click()
        assert plan.evaluate('e=>e.open')
        expect(plan.locator('ol')).to_be_visible()
        expect(plan.locator('ol')).to_contain_text('измените только последнее C')
        assert current()['session'] == 1

        # A selected bar really plays its own chord, with no melody in backing-only mode.
        page.locator('#practiceTempo').fill('120')
        page.locator('#practiceTempo').press('Tab')
        settings()
        page.locator('#practiceFrom').select_option('2')
        settings()
        page.locator('#practiceTo').select_option('2')
        expect(page.locator('#practiceTab .practice-tab-bar:visible')).to_have_count(1)
        assert page.locator('#practiceTab .practice-tab-bar:visible [data-tab-event]').evaluate_all('els=>els.map(el=>Number(el.dataset.tabEvent))') == [4, 5, 6, 7]
        settings()
        page.locator('#practiceLoop').uncheck()
        page.locator('#practiceMelody').uncheck()
        page.evaluate('''()=>{window.practicePlayed=[];const previous=playMidi;playMidi=function(...args){
          window.practicePlayed.push({midi:args[0],volume:args[3]});return previous(...args);
        };}''')
        page.locator('#practicePlay').click()
        expect(page.locator('#practiceStop')).to_be_enabled()
        expect(page.locator('#practiceNow')).to_contain_text('F · такт 2', timeout=7000)
        expect(page.locator('#practiceStop')).to_be_disabled(timeout=7000)
        played = page.evaluate('practicePlayed')
        assert [event['midi'] for event in played] == [53, 57, 60], played
        assert all(event['volume'] == .04 for event in played)
        assert current()['heard'] is True

        # A phrase must change exactly as instructed; an unchanged or altered opening fails.
        stage('variation')
        page.locator('#practiceVariationCheck').click()
        expect(page.locator('#practiceFeedback')).to_contain_text('Окончание пока не изменилось')
        page.locator('#practiceEventSelect').select_option('0')
        note('D3').click()
        page.locator('#practiceVariationCheck').click()
        expect(page.locator('#practiceFeedback')).to_contain_text('Верните первые семь нот')
        assert current()['variationChecked'] is False
        page.locator('#practiceVariationReset').click()
        source = current()['variation']
        page.locator('#practiceEventSelect').select_option('7')
        note('F3').click()
        assert current()['variation'][:7] == source[:7]
        assert current()['variation'][7]['midi'] == 53
        page.locator('#practiceVariationCheck').click()
        expect(page.locator('#practiceFeedback')).to_contain_text('Изменение выполнено')
        assert current()['variationChecked'] is True
        assert not any(current()['checks']), 'A checked sequence must not count as guitar performance'
        page.screenshot(path=f'/tmp/fretlab-practice-variation-{width}.png', full_page=True)

        # All three heard patterns use a real end-of-audio gate. No score or fret answer leaks.
        stage('ear')
        expected_rounds = [['E3', 'F3', 'A3'], ['G3', 'A3', 'C4'], ['C4', 'A3', 'G3', 'F3']]
        for index, answer in enumerate(expected_rounds):
            page.locator('#practiceEarRound').select_option(str(index))
            expect(page.locator('#practiceEarSolution')).to_have_count(0)
            expect(page.locator('#practiceEarAnswer .practice-tab')).to_have_count(0)
            expect(page.locator('#practiceEarAnswer .sandbox-hit')).to_have_count(0)
            expect(page.locator('#practiceEarCheck')).to_have_count(0)
            page.locator('#practicePlay').click()
            expect(page.locator('#practiceEarCheck')).to_have_count(0)
            expect(page.locator('#practiceStop')).to_be_disabled(timeout=9000)
            expect(page.locator('#practiceEarReveal')).to_be_disabled()
            if index == 0:
                # A wrong answer does not pass; keyboard entry retains its button focus.
                note('E3').focus()
                for _ in range(3):
                    note('E3').press('Enter')
                    expect(note('E3')).to_be_focused()
                page.locator('#practiceEarCheck').click()
                expect(page.locator('#practiceFeedback')).to_contain_text('Пока не совпало')
                assert current()['earPassed'][0] is False
                expect(page.locator('#practiceEarReveal')).to_be_enabled()
                for _ in range(3):
                    page.locator('#practiceEarUndo').click()
            for pitch in answer:
                note(pitch).click()
            page.locator('#practiceEarCheck').click()
            expect(page.locator('#practiceFeedback')).to_contain_text('Последовательность совпала')
            expect(page.locator('#practiceEarSolution')).to_be_visible()
            assert current()['earPassed'][index] is True
            assert not any(current()['earAssisted'])
        assert current()['earPassed'] == [True, True, True]

        # The same scale degree stays ordinal on both minor TAB and fretboard.
        page.locator('#practiceStudy').select_option('am')
        stage('play')
        page.locator('.practice-score-options select').select_option('degrees')
        expect(page.locator('#practiceBoard [data-string="6"][data-fret="8"] .note')).to_have_text('3')
        expect(page.locator('#practiceTab [data-tab-event="2"] text').last).to_have_text('3')
        assert '♭3' not in page.locator('#practiceTab').inner_text()
        inspect_svg()

        # Screen-free practice is a backing track, not pre-entered notes pretending to be live playing.
        page.locator('#practiceStudy').select_option('cf')
        stage('free')
        expect(page.locator('#practiceMelody')).to_have_count(0)
        page.locator('#practiceHide').check()
        expect(page.locator('#practiceBoard')).to_have_count(0)
        expect(page.locator('#practiceTab .practice-tab')).to_have_count(0)
        page.locator('#practiceNote').fill('Переход G → F: два такта, медленно и без остановки')
        page.locator('#practiceRecording').fill('Дубль 1 на телефоне')
        page.locator('#practiceCheck0').check()
        page.locator('#practiceSaveAttempt').click()
        expect(page.locator('#practiceFeedback')).to_contain_text('Самопроверка сохранена')
        saved = current()
        assert len(saved['attempts']) == 1
        assert saved['checks'] == [True]

        # Export contains the actual work; a reload keeps notes, chosen tempo, variation and ear results.
        with page.expect_download() as download_info:
            page.locator('#practiceExport').click()
        exported = json.loads(Path(download_info.value.path()).read_text())
        assert exported['variation'][7]['midi'] == 53
        assert exported['earAnswers'] == [[52, 53, 57], [55, 57, 60], [60, 57, 55, 53]]
        assert exported['earPassed'] == [True, True, True]
        assert not any(exported['earAssisted'])
        assert exported['note'] == saved['note']
        page.reload(wait_until='domcontentloaded')
        assert current()['note'] == saved['note']
        assert current()['tempo'] == 120
        assert current()['session'] == 1
        assert current()['earPassed'] == [True, True, True]
        assert current()['variation'][7]['midi'] == 53
        expect(page.locator('#practiceNote')).to_have_value(saved['note'])
        expect(page.locator('#practiceCheck0')).to_be_checked()
        expect(page.locator('.practice-return-note')).to_contain_text('Переход G → F')

        # Every study/stage opens cleanly, with contained responsive layout and visible rhythm paths.
        for study_id in ['melody', 'cf', 'cadence', 'am']:
            page.locator('#practiceStudy').select_option(study_id)
            for stage_id in ['play', 'transitions', 'ear', 'variation', 'free']:
                stage(stage_id)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), (width, study_id, stage_id)
                inspect_svg()
        assert not errors, errors
        print(f'OK: {width}px — real audio gate and backing-only playback, variation, three ear answers, keyboard focus, plans, persistence, export, 20 study/stage views', flush=True)
        page.close()
    browser.close()
