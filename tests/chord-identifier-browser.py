"""Real chord entry, interpretation, playback and two responsive UX walkthroughs."""
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
APP = Path(os.environ.get('FRETLAB_PREVIEW_PATH', ROOT / 'course-lab.html'))
URL = APP.as_uri() + '?tool=chords'


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(args=['--no-sandbox'])
    for width, height in [(1366, 900), (390, 844)]:
        context = browser.new_context(viewport={'width': width, 'height': height})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(URL, wait_until='domcontentloaded')

        def hit(string, fret):
            return page.locator(
                f'#sandboxBoard .sandbox-hit[data-string="{string}"][data-fret="{fret}"]'
            )

        def frets():
            return page.evaluate('courseSandbox.getChordState().frets')

        def symbols():
            return page.locator('#chordResults button').all_text_contents()

        def other_symbols():
            return page.locator('#chordOtherResults button').all_text_contents()

        def choose(symbol):
            if symbol in other_symbols():
                details = page.locator('#chordOtherInterpretations')
                if details.get_attribute('open') is None:
                    details.locator('summary').click()
            page.locator('#chordPanel').get_by_role('button', name=symbol, exact=True).click()
            expect(page.locator('#chordPanel button[aria-pressed="true"]')).to_have_text(symbol)
            expect(page.locator('#chordQuickName')).to_have_text(symbol)

        def shape(low_to_high, order=None):
            # Every fixture is a physical fingering, entered through the UI.
            page.locator('#sandboxClear').click()
            entries = [(6 - index, fret) for index, fret in enumerate(low_to_high) if fret is not None]
            if order == 'reverse':
                entries.reverse()
            for string, fret in entries:
                hit(string, fret).click()
            assert frets() == list(reversed(low_to_high)), (low_to_high, frets())
            for string in range(1, 7):
                assert page.locator(
                    f'#sandboxBoard .sandbox-hit[data-string="{string}"][aria-pressed="true"]'
                ).count() <= 1

        expect(page.locator('#panel-sandbox')).to_be_visible()
        expect(page.locator('#sandboxAction')).to_have_value('chord')
        expect(page.locator('#sandboxSpelling')).to_have_value('auto')
        expect(page.locator('#sandboxBoard .sandbox-hit')).to_have_count(102)
        expect(page.locator('#chordRoot option')).to_have_count(13)
        expect(page.locator('#chordStatus')).to_have_text('Выберите ноты аккорда')
        expect(page.locator('#chordQuickResult')).to_be_visible()
        expect(page.locator('#chordStrings .chord-mute[aria-pressed="true"]')).to_have_count(6)
        expect(page.locator('#sandboxSequence')).to_be_disabled()

        # Beginner: open/mute differs from a fret; octaves alone are one pitch class.
        page.get_by_role('button', name='Открыть струну 6', exact=True).click()
        assert frets()[5] == 0
        expect(page.get_by_role('button', name='Открыть струну 6', exact=True)).to_have_attribute('aria-pressed', 'true')
        expect(page.locator('#chordStatus')).to_have_text('Пока один звук')
        hit(6, 12).click()
        assert frets()[5] == 12
        expect(page.get_by_role('button', name='Открыть струну 6', exact=True)).to_have_attribute('aria-pressed', 'false')
        hit(5, 7).click()
        assert symbols() == []
        expect(page.locator('#chordStatus')).to_have_text('Пока один звук')
        page.get_by_role('button', name='Заглушить струну 6', exact=True).click()
        assert frets()[5] is None
        page.locator('#sandboxClear').click()

        # A keyboard user can replace and toggle a fret without losing focus.
        hit(5, 3).focus()
        hit(5, 3).press('ArrowRight')
        expect(hit(5, 4)).to_be_focused()
        hit(5, 4).press('Enter')
        expect(hit(5, 4)).to_be_focused()
        hit(5, 5).press('Enter')
        assert frets()[4] == 5
        expect(page.locator('#sandboxBoard .sandbox-hit[aria-pressed="true"]')).to_have_count(1)
        hit(5, 5).press('Enter')
        assert frets()[4] is None
        page.locator('#sandboxUndo').click()
        assert frets()[4] == 5
        page.locator('#sandboxClear').click()

        # Older free-note and interval work remain separate from chord fingerings.
        page.locator('#sandboxSpelling').select_option('sharp')
        page.locator('#sandboxAction').select_option('mark')
        expect(page.locator('#chordQuickResult')).to_be_hidden()
        hit(1, 3).click()
        hit(1, 5).click()
        expect(page.locator('#sandboxBoard .note')).to_have_count(2)
        page.locator('#sandboxAction').select_option('measure')
        hit(5, 3).click()
        hit(5, 4).click()
        expect(page.locator('#sandboxReadout')).to_contain_text('увеличенная прима')
        page.locator('#sandboxAction').select_option('chord')
        assert frets() == [None] * 6
        page.locator('#sandboxSpelling').select_option('auto')

        shape([None, 3, 2, 0, 1, 0], order='reverse')  # x32010, high strings entered first
        choose('C')
        expect(page.locator('#chordFormula')).to_have_text('От C: 1 · 3 · 5')
        expect(page.locator('#chordBass')).to_have_text('Бас: C3 · Основной тон: C')
        expect(page.locator('#chordDetails')).to_contain_text('C · E · G')
        expect(page.locator('#chordStrings .chord-string-control[data-state="open"]')).to_have_count(2)
        expect(page.locator('#chordStrings .chord-string-control[data-state="muted"]')).to_have_count(1)
        page.evaluate('scrollTo(0, 0)')
        page.screenshot(path=f'/tmp/fretlab-chord-beginner-{width}.png', full_page=True, animations='disabled')

        # One replacement changes the chord, Undo restores the complete fingering.
        hit(5, 2).click()
        assert frets()[4] == 2
        expect(hit(5, 3)).to_have_attribute('aria-pressed', 'false')
        page.locator('#sandboxUndo').click()
        assert frets() == [0, 1, 0, 2, 3, None]
        assert 'C' in symbols()
        page.locator('#sandboxClear').click()
        expect(page.locator('#sandboxTogether')).to_be_disabled()
        page.locator('#sandboxUndo').click()
        assert frets() == [0, 1, 0, 2, 3, None]

        for fingering, symbol, formula in [
            ([None, 0, 2, 2, 1, 0], 'Am', 'От A: 1 · ♭3 · 5'),
            ([None, 3, 2, 0, 0, 0], 'Cmaj7', 'От C: 1 · 3 · 5 · 7'),
            ([None, 3, 2, 3, 1, 3], 'C7', 'От C: 1 · 3 · 5 · ♭7'),
            ([None, 3, 2, 3, 1, 0], 'C7(no5)', 'От C: 1 · 3 · ♭7'),
            ([None, 3, 0, 0, 1, 3], 'Csus2', 'От C: 1 · 2 · 5'),
            ([None, 3, 2, 0, 3, 0], 'C(add9)', 'От C: 1 · 3 · 5 · 9'),
            ([None, 2, 3, 2, 3, None], 'Bm7b5', 'От B: 1 · ♭3 · ♭5 · ♭7'),
            ([None, 3, 4, 2, 4, None], 'Cdim7', 'От C: 1 · ♭3 · ♭5 · ♭♭7'),
        ]:
            shape(fingering)
            assert symbol in symbols(), (symbol, symbols())
            choose(symbol)
            expect(page.locator('#chordFormula')).to_have_text(formula)
            if symbol == 'C(add9)':
                assert 'C9' not in symbols(), symbols()

        # Complete plain triads are clean answers; omitted-tone guesses remain opt-in.
        for fingering, symbol in [
            ([None, 0, 2, 2, 1, 0], 'Am'),
            ([0, 2, 2, 0, 0, 0], 'Em'),
            ([None, None, 0, 2, 3, 1], 'Dm'),
            ([1, 3, 3, 1, 1, 1], 'Fm'),
        ]:
            shape(fingering)
            assert symbols() == [symbol], (symbol, symbols())
            assert other_symbols(), (symbol, 'incomplete alternatives were lost')
            expect(page.locator('#chordOtherInterpretations')).to_be_visible()
            assert page.locator('#chordOtherInterpretations').get_attribute('open') is None
            expect(page.locator('#chordWarnings')).to_be_empty()
            assert all('(no' in item for item in other_symbols()), other_symbols()

        # A selected opt-in interpretation remains interpretable after reload.
        choose('Ab6(no5)/F')
        expect(page.locator('#chordWarnings')).to_contain_text('пропуски')
        assert 'разные гармонические трактовки' not in page.locator('#chordWarnings').inner_text()
        page.reload(wait_until='domcontentloaded')
        expect(page.locator('#chordStatus')).to_have_text('Ab6(no5)/F')
        choose('Fm')

        # Genuine complete alternatives still receive the ambiguity explanation.
        for fingering, expected in [
            ([None, None, 0, 2, 3, 3], {'Dsus4', 'Gsus2/D'}),
            ([3, 2, 0, 0, 0, 0], {'G6', 'Em7/G'}),
            ([None, 2, 3, 2, 3, None], {'Bm7b5', 'Dm6/B'}),
        ]:
            shape(fingering)
            assert expected.issubset(set(symbols())), (expected, symbols())
            expect(page.locator('#chordWarnings')).to_contain_text('разные гармонические трактовки')
        for fingering, minimum in [
            ([None, 3, 4, 2, 4, None], 4),
            ([None, 3, 2, 1, 1, None], 3),
        ]:
            shape(fingering)
            assert len(symbols()) >= minimum, symbols()
            expect(page.locator('#chordWarnings')).to_contain_text('разные гармонические трактовки')

        # Auto notation follows conventional roots without modifying physical notes.
        for fingering, symbol in [
            ([None, 6, 8, 8, 8, 6], 'Eb'),
            ([4, 6, 6, 5, 4, 4], 'Ab'),
            ([None, 1, 3, 3, 3, 1], 'Bb'),
            ([None, 4, 6, 6, 6, 4], 'Db'),
            ([None, 4, 6, 6, 5, 4], 'C#m'),
            ([2, 4, 4, 2, 2, 2], 'F#m'),
        ]:
            shape(fingering)
            choose(symbol)
        shape([2, 4, 4, 3, 2, 2])
        assert {'F#', 'Gb'} & set(symbols()), symbols()

        # Slash bass is a practical pitch label; theoretical chord tones stay intact.
        page.locator('#sandboxSpelling').select_option('sharp')
        for fingering, expected, bass in [
            ([1, 3, 3, 1, 1, 1], 'G#6(no5)/F', 'F2'),
            ([None, 2, 3, 1, 3, None], 'Ddim7/B', 'B2'),
            ([None, 3, 2, 1, 1, 0], 'Eaug/C', 'C3'),
            ([None, 3, 4, 5, 4, None], 'D#m6(no5)/C', 'C3'),
        ]:
            shape(fingering)
            assert expected in symbols() + other_symbols(), (expected, symbols(), other_symbols())
            choose(expected)
            expect(page.locator('#chordBass')).to_contain_text('Бас: ' + bass)
            if expected == 'Ddim7/B':
                expect(page.locator('#chordDetails')).to_contain_text('Cb')
                expect(page.locator('#chordFormula')).to_contain_text('♭♭7')
        page.locator('#sandboxSpelling').select_option('auto')

        # Extensions follow core tones and use familiar compact chord symbols.
        page.locator('#chordRoot').select_option('0')
        shape([None, 3, 2, None, 3, None])
        expect(page.locator('#chordFormula')).to_have_text('От C: 1 · 3 · 9')
        page.locator('#chordRoot').select_option('auto')
        shape([3, None, 3, 4, 5, None])
        choose('G13(no5)')
        expect(page.locator('#chordFormula')).to_have_text('От G: 1 · 3 · ♭7 · 13')
        shape([0, 2, 2, 0, 0, 2])
        choose('Em(add9)')
        expect(page.locator('#chordFormula')).to_have_text('От E: 1 · ♭3 · 5 · 9')

        # Two distinct tones explain their interval without inventing a triad.
        shape([None, 3, 2, None, None, None])
        assert symbols() == [], symbols()
        expect(page.locator('#chordPanel')).to_contain_text('большая терция')
        assert 'нет надёжного имени' not in page.locator('#chordWarnings').inner_text()
        shape([None, 3, None, 5, 5, None])  # C3 C4 E4: choose distinct tones for the explanation
        text = page.locator('#chordPanel').inner_text()
        assert 'терция' in text or 'децима' in text, text
        shape([None, 3, None, 0, None, None])
        choose('C5')

        # The concise answer remains in view while frets are being edited on mobile.
        shape([None, 3, 2, 0, 1, 0])
        if width < 700:
            page.evaluate("scrollTo(0, scrollY + document.getElementById('sandboxBoard').getBoundingClientRect().top - 90)")
            assert page.locator('#chordQuickResult').evaluate('e => getComputedStyle(e).position') == 'sticky'
            for string, fret in [(1, 1), (1, 0), (6, 0), (6, 0)]:
                hit(string, fret).click()
                box = page.locator('#chordQuickName').bounding_box()
                assert box and box['y'] >= 0 and box['y'] + box['height'] <= height, box
                assert page.locator('#chordQuickName').inner_text() == page.locator('#chordStatus').inner_text()
            page.screenshot(path='/tmp/fretlab-chord-review-mobile-sticky.png', animations='disabled')

        # Expert: identical tones can be heard as C6 or Am7 over C.
        shape([None, 3, 2, 2, 1, 3])
        assert {'C6', 'Am7/C'}.issubset(set(symbols())), symbols()
        expect(page.locator('#chordWarnings')).to_contain_text('разные гармонические трактовки')
        choose('C6')
        expect(page.locator('#chordFormula')).to_have_text('От C: 1 · 3 · 5 · 6')
        choose('Am7/C')
        expect(page.locator('#chordBass')).to_have_text('Бас: C3 · Основной тон: A')
        expect(page.locator('#chordFormula')).to_have_text('От A: 1 · ♭3 · 5 · ♭7')
        page.locator('#chordDisplay').select_option('intervals')
        expect(hit(5, 3).locator('.note')).to_have_text('♭3')
        expect(hit(3, 2).locator('.note')).to_have_text('1')
        page.evaluate('scrollTo(0, 0)')
        page.screenshot(path=f'/tmp/fretlab-chord-expert-{width}.png', full_page=True, animations='disabled')

        # A deliberate root filters candidates and survives together with the shape.
        page.locator('#chordRoot').select_option('9')
        assert symbols() == ['Am7/C'], symbols()
        saved = page.evaluate("localStorage.getItem('fretlab-chord-v1')")
        assert saved is not None
        page.reload(wait_until='domcontentloaded')
        expect(page.locator('#chordRoot')).to_have_value('9')
        expect(page.locator('#chordDisplay')).to_have_value('intervals')
        assert frets() == [3, 1, 2, 2, 3, None]
        choose('Am7/C')

        page.locator('#chordRoot').select_option('auto')
        shape([0, 3, 2, 0, 1, 0])
        choose('C/E')
        expect(page.locator('#chordBass')).to_have_text('Бас: E2 · Основной тон: C')
        # String 6 can sound above string 5: actual MIDI determines the bass.
        shape([16, 0, None, None, None, None])
        expect(page.locator('#chordBass')).to_contain_text('Бас: A2')

        # Spelling affects names and intervals, while the physical voicing stays put.
        page.locator('#sandboxSpelling').select_option('sharp')
        page.locator('#chordRoot').select_option('1')
        shape([None, 4, 6, 6, 6, 4])
        choose('C#')
        expect(page.locator('#chordDetails')).to_contain_text('C# · E# · G#')
        before = frets()
        page.locator('#sandboxSpelling').select_option('flat')
        choose('Db')
        expect(page.locator('#chordDetails')).to_contain_text('Db · F · Ab')
        assert frets() == before

        # The expert is told when a root is only a hypothesis or no name is supported.
        page.locator('#sandboxSpelling').select_option('sharp')
        page.locator('#chordRoot').select_option('0')
        shape([None, None, 2, 0, 3, None])  # E G D: a rootless C reading, explicitly incomplete
        expect(page.locator('#chordWarnings')).to_contain_text('основной тон не звучит')
        assert all('(no1)' in symbol for symbol in symbols())
        page.locator('#chordRoot').select_option('auto')
        shape([8, 4, 0, 8, None, None])  # C C# D D#: an unsupported chromatic cluster
        assert symbols() == [], symbols()
        expect(page.locator('#chordWarnings')).to_contain_text('нет надёжного имени')

        # Observe the real voices; Stop must cancel sounding and future notes.
        shape([None, 3, 2, 0, 1, 0], order='reverse')
        page.evaluate('''() => {
            const original = playMidi;
            window.chordTestVoices = [];
            playMidi = (...args) => {
                const voice = original(...args);
                chordTestVoices.push({midi: args[0], when: args[1], voice});
                return voice;
            };
        }''')
        page.locator('#sandboxSequence').click()
        expect(page.locator('#sandboxStop')).to_be_visible()
        assert page.evaluate('chordTestVoices.map(v => v.midi)') == [48, 52, 55, 60, 64]
        assert page.evaluate('chordTestVoices.some(v => v.when > getAudioCtx().currentTime + .5)')
        page.locator('#sandboxStop').click()
        assert page.evaluate('chordTestVoices.every(v => v.voice.stopped)')
        expect(page.locator('#sandboxStop')).to_be_hidden()
        expect(page.locator('#sandboxBoard .sounding')).to_have_count(0)
        page.evaluate('chordTestVoices = []')
        page.locator('#sandboxTogether').click()
        assert page.evaluate('chordTestVoices.map(v => v.midi)') == [48, 52, 55, 60, 64]
        assert page.evaluate('new Set(chordTestVoices.map(v => v.when)).size') == 1
        page.locator('#sandboxStop').click()
        assert page.evaluate('chordTestVoices.every(v => v.voice.stopped)')

        # Leaving the instrument or opening shared help also cancels pending audio.
        page.evaluate('chordTestVoices = []')
        page.locator('#sandboxSequence').click()
        page.locator('#tab-course').click()
        assert page.evaluate('chordTestVoices.every(v => v.voice.stopped)')
        expect(page.locator('#sandboxStop')).to_be_hidden()
        expect(page.locator('#sandboxBoard .sounding')).to_have_count(0)
        page.locator('#tab-sandbox').click()
        assert frets() == [0, 1, 0, 2, 3, None]
        page.evaluate('chordTestVoices = []')
        page.locator('#sandboxTogether').click()
        page.evaluate("courseHelp.open('sound')")
        expect(page.locator('dialog')).to_be_visible()
        assert page.evaluate('chordTestVoices.every(v => v.voice.stopped)')
        expect(page.locator('#sandboxStop')).to_be_hidden()
        expect(page.locator('#sandboxBoard .sounding')).to_have_count(0)
        page.locator('dialog').get_by_role('button', name='Вернуться к занятию', exact=True).click()
        assert frets() == [0, 1, 0, 2, 3, None]

        page.locator('#sandboxAction').select_option('mark')
        expect(page.locator('#sandboxBoard .note')).to_have_count(0)  # reload clears this transient buffer
        hit(1, 3).click()
        page.locator('#sandboxAction').select_option('measure')
        hit(5, 3).click()
        hit(5, 4).click()
        page.locator('#sandboxAction').select_option('chord')
        page.locator('#sandboxClear').click()
        page.locator('#sandboxAction').select_option('mark')
        expect(hit(1, 3)).to_have_attribute('aria-pressed', 'true')
        page.locator('#sandboxAction').select_option('measure')
        expect(page.locator('#sandboxReadout')).to_contain_text('увеличенная прима')
        page.locator('#sandboxAction').select_option('chord')
        assert frets() == [None] * 6

        # Each visible control can be reached without horizontal document overflow.
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        assert page.locator('#chordPanel').evaluate('e => e.scrollWidth <= e.clientWidth + 1')
        for selector in ['#sandboxAction', '#chordRoot', '#chordDisplay', '#sandboxTogether']:
            box = page.locator(selector).bounding_box()
            assert box['height'] >= 44, (width, selector, box)
        assert not errors, errors
        print(f'OK: {width}px — beginner/expert chord entry, candidates, roots, spelling, undo, storage, real audio/Stop, keyboard and isolated modes', flush=True)
        context.close()

    # Malformed stored input must not create notes outside the physical fretboard.
    context = browser.new_context()
    page = context.new_page()
    page.add_init_script("localStorage.setItem('fretlab-chord-v1', JSON.stringify({version:1, frets:[999,0,0,0,0,0], root:'auto'}))")
    page.goto(URL, wait_until='domcontentloaded')
    assert page.evaluate('courseSandbox.getChordState().frets') == [None] * 6
    expect(page.locator('#chordStatus')).to_have_text('Выберите ноты аккорда')
    context.close()
    browser.close()
