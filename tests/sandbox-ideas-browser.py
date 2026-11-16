"""Musical experiments use the real board and preserve the musician's work."""
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
APP = Path(os.environ.get('FRETLAB_PREVIEW_PATH', ROOT / 'course-lab.html'))
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(args=['--no-sandbox'])
    for width, height in [(1366, 900), (390, 844)]:
        context = browser.new_context(viewport={'width': width, 'height': height})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(APP.as_uri() + '?tool=chords', wait_until='domcontentloaded')

        def hit(string, fret):
            return page.locator(f'#sandboxBoard button[data-string="{string}"][data-fret="{fret}"]')

        def state():
            return page.evaluate('courseSandbox.getState()')

        def saved():
            return page.evaluate("localStorage.getItem('fretlab-chord-v1')")

        def select(idea):
            page.locator('#ideaSelect').select_option(idea)

        expect(page.locator('#ideaStart')).to_be_visible()
        assert not page.evaluate('sandboxIdeas.getState().active')
        assert state()['frets'] == [None] * 6
        # Establish all three buffers and a deliberate interpretation/undo history.
        page.locator('#sandboxAction').select_option('mark')
        hit(1, 5).click()
        hit(1, 7).click()
        page.locator('#sandboxAction').select_option('measure')
        hit(6, 8).click()
        hit(6, 10).click()
        page.locator('#sandboxAction').select_option('chord')
        for string, fret in [(6, 0), (5, 2), (4, 2), (3, 0), (2, 0), (1, 0)]:
            hit(string, fret).click()
        page.locator('#chordRoot').select_option('4')
        page.locator('#chordDisplay').select_option('intervals')
        baseline, baseline_saved = state(), saved()
        select('center')
        assert state() == baseline and saved() == baseline_saved
        select('third')
        page.locator('#ideaStart').click()
        assert state()['frets'] == [None, None, 0, 2, 3, None]
        expect(page.locator('#chordQuickName')).to_have_text('C')
        expect(page.locator('#sandboxBoard .cell:visible')).to_have_count(24)
        assert saved() == baseline_saved
        hit(4, 1).click()
        expect(page.locator('#chordQuickName')).to_have_text('Cm')
        expect(page.locator('#ideaObservation')).to_contain_text('C minor')
        assert state()['frets'] == [None, None, 0, 1, 3, None]
        page.locator('#ideaReset').click()
        assert state()['frets'] == [None, None, 0, 2, 3, None]
        page.locator('#ideaClose').click()
        assert state() == baseline, (state(), baseline)
        assert saved() == baseline_saved
        expect(page.locator('#sandboxBoard .cell:visible')).to_have_count(102)
        page.locator('#sandboxUndo').click()
        assert state()['frets'] == baseline['history'][-1]

        # The same baseline survives changing experiments, free editing and nav.
        baseline = state()
        select('bridge')
        page.locator('#ideaStart').click()
        expect(page.locator('#chordQuickName')).to_have_text('C/G')
        expect(page.locator('#sandboxBoard .idea-next-dot')).to_have_count(3)
        expect(page.locator('#sandboxBoard .idea-common .note')).to_have_text('C')
        hit(1, 0).focus()
        hit(1, 0).press('ArrowLeft')
        expect(hit(1, 0)).to_be_focused()
        hit(1, 3).focus()
        hit(1, 3).press('ArrowRight')
        expect(hit(1, 3)).to_be_focused()
        hit(1, 1).click()
        hit(3, 2).click()
        expect(page.locator('#chordQuickName')).to_have_text('F/A')
        expect(page.locator('#ideaObservation')).to_contain_text('C сохранилась')
        page.locator('#ideaA').click()
        page.locator('#ideaTempo').fill('120')
        page.locator('#ideaTempo').dispatch_event('change')
        page.evaluate('''() => {
            const original=playMidi;window.ideaVoices=[];
            playMidi=(...args)=>{const voice=original(...args);ideaVoices.push({midi:args[0],when:args[1],duration:args[2],voice});return voice;};
        }''')
        page.locator('#ideaPlay').click()
        expect(page.locator('#ideaNow')).to_contain_text('Отсчёт', timeout=2000)
        expect(page.locator('#ideaNow')).to_contain_text('C · такт 1', timeout=4000)
        expect(page.locator('#chordQuickName')).to_have_text('C/G')
        expect(page.locator('#ideaNow')).to_contain_text('F · такт 2', timeout=4000)
        expect(page.locator('#chordQuickName')).to_have_text('F/A')
        assert page.evaluate('ideaVoices.map(v=>v.midi)') == [55, 60, 64, 57, 60, 65]
        page.locator('#ideaStop').click()
        assert page.evaluate('ideaVoices.every(v=>v.voice.stopped || v.when + v.duration <= getAudioCtx().currentTime)')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
        page.locator('#sandboxIdeas').scroll_into_view_if_needed()
        page.screenshot(path=f'/tmp/fretlab-sandbox-ideas-{width}.png', full_page=True, animations='disabled')

        select('sequence')
        expect(page.locator('#ideaObservation')).to_contain_text('паузой')
        expect(page.locator('#sandboxBoard .cell:visible')).to_have_count(24)
        page.locator('#ideaEndA').click()
        expect(hit(4, 7)).to_have_attribute('aria-pressed', 'true')
        expect(page.locator('#sandboxBoard .idea-arrival .note')).to_have_text('A')
        expect(page.locator('#ideaEndA')).to_have_attribute('aria-pressed', 'true')
        page.locator('.idea-score summary').click()
        expect(page.locator('.idea-score svg').first).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
        page.locator('#ideaPlay').click()
        expect(page.locator('#ideaNow')).to_contain_text('C · такт 1', timeout=4000)
        page.evaluate('window.previousIdeaVoices = [...ideaVoices]')
        hit(5, 8).click()
        expect(page.locator('#ideaStop')).to_be_disabled()
        assert page.evaluate('previousIdeaVoices.every(v=>v.voice.stopped || v.when + v.duration <= getAudioCtx().currentTime)')
        page.locator('#ideaPlay').click()
        expect(page.locator('#ideaNow')).to_contain_text('C · такт 1', timeout=4000)
        # Starting ordinary sandbox playback cancels experiment playback.
        page.evaluate('window.previousIdeaVoices = [...ideaVoices]')
        page.locator('#sandboxTogether').click()
        expect(page.locator('#ideaStop')).to_be_disabled()
        assert page.evaluate('previousIdeaVoices.every(v=>v.voice.stopped || v.when + v.duration <= getAudioCtx().currentTime)')
        page.locator('#sandboxStop').click()
        page.locator('#ideaPlay').click()
        page.locator('#tab-course').click()
        assert not page.evaluate('sandboxIdeas.getState().active')
        assert state() == baseline
        assert page.evaluate('ideaVoices.every(v=>v.voice.stopped || v.when + v.duration <= getAudioCtx().currentTime)')
        page.locator('#tab-sandbox').click()
        expect(page.locator('#ideaStart')).to_be_visible()
        # Baseline can also be a free-note or interval state, not only a chord.
        for mode in ['mark', 'measure']:
            page.locator('#sandboxAction').select_option(mode)
            original = state()
            page.locator('#ideaStart').click()
            page.locator('#ideaClose').click()
            assert state() == original
        assert errors == [], errors
        context.close()
    browser.close()
print('OK: exact board pitches, C/minor and C/F, saved state and Undo, audio, keyboard and 390/1366 layouts')
