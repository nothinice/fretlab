"""Real practice flow plus simulated microphone boundary; no actual mic access."""
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
        page.goto(APP.as_uri()+'?practice=cf&stage=call', wait_until='domcontentloaded')
        expect(page.locator('[data-practice-stage="call"]')).to_have_attribute('aria-pressed', 'true')
        expect(page.locator('#practiceFrom')).to_have_count(0)
        page.locator('#practiceTempo').fill('120'); page.locator('#practiceTempo').press('Tab')
        page.evaluate('''()=>{window.practiceVoices=[];const previous=playMidi;playMidi=function(...args){
          window.practiceVoices.push({midi:args[0],when:args[1],peak:args[3]});return previous(...args);
        };}''')
        page.locator('#practicePlay').click()
        expect(page.locator('#practiceCallPhase')).to_have_attribute('data-phase', 'teacher', timeout=6000)
        expect(page.locator('#practiceCallPhase')).to_have_attribute('data-phase', 'learner', timeout=6000)
        melody_count = page.evaluate('practiceVoices.filter(v=>v.peak===.17).length')
        assert melody_count == 8
        page.wait_for_timeout(1800)
        assert page.evaluate('practiceVoices.filter(v=>v.peak===.17).length') == melody_count
        assert page.evaluate('practiceVoices.filter(v=>v.peak===.04).length') >= 9
        page.locator('#practiceStop').click()

        page.locator('[data-practice-stage="rhythm"]').click()
        page.locator('#practiceRhythm').select_option('1')
        expect(page.locator('.practice-chord-diagram')).to_have_count(2)
        expect(page.locator('.practice-stroke')).to_have_count(16)
        assert page.locator('.practice-stroke strong').all_text_contents() == ['↓','·','↓','↑','↓','·','↓','↑']*2
        assert 'не играть' in page.locator('.practice-chord-diagram').first.get_attribute('aria-label')
        settings=page.locator('.practice-player-settings')
        if not settings.evaluate('e=>e.open'): settings.locator('summary').click()
        page.locator('#practiceTempoLadder').check()
        page.screenshot(path=f'/tmp/fretlab-practice-rhythm-{width}.png', full_page=True)
        assert page.evaluate('coursePractice.getState().byStudy.cf.tempoLadder') is True

        # A twelve-bar form remains three rows of four on a phone.
        page.evaluate("coursePractice.open('blues',{stage:'play'})")
        cells=page.locator('.practice-form-bar')
        expect(cells).to_have_count(12)
        boxes=[cell.bounding_box() for cell in cells.all()]
        assert len({round(box['y']) for box in boxes[:4]}) == 1
        assert len({round(box['y']) for box in boxes[4:8]}) == 1
        assert len({round(box['y']) for box in boxes[8:]}) == 1
        assert boxes[4]['y'] > boxes[0]['y'] and boxes[8]['y'] > boxes[4]['y']
        page.screenshot(path=f'/tmp/fretlab-practice-blues-{width}.png', full_page=True)
        cells.nth(4).click()
        expect(page.locator('.practice-tab-bar:visible')).to_have_count(1)
        expect(page.locator('.practice-tab-bar:visible')).to_have_attribute('aria-label','Такт 5, размер 4/4')
        page.reload(wait_until='domcontentloaded')
        state=page.evaluate('coursePractice.getState()')
        assert state['byStudy']['blues']['fromBar'] == state['byStudy']['blues']['toBar'] == 5
        assert state['byStudy']['cf']['rhythm'] == 1 and state['byStudy']['cf']['tempoLadder'] is True

        # Every new study renders every applicable stage without overflow or stale IDs.
        for study in ['starter','melody','cf','cadence','am','blues','dorian']:
            for stage in ['play','call','rhythm','transitions','ear','variation','free']:
                page.evaluate('([study,stage])=>coursePractice.open(study,{stage})',[study,stage])
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), (study,stage,width)
        assert not errors, errors
        print(f'OK: {width}px — real teacher/learner audio phases, rhythm strokes, twelve-bar form, persistence and 49 study/stage views', flush=True)
        page.close()

    # Denied microphone access is a recoverable UI state, with no uncaught error.
    denied=browser.new_page()
    denied.add_init_script("Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{throw new Error('denied')}},configurable:true})")
    denied.goto(APP.as_uri()+'?practice=cf',wait_until='domcontentloaded')
    denied.locator('.practice-recorder summary').click();denied.locator('#practiceRecordStart').click()
    expect(denied.locator('#practiceRecordStatus')).to_contain_text('Доступ к микрофону не получен')
    expect(denied.locator('#practiceRecordStart')).to_be_enabled()
    denied.close()

    # Simulated MediaRecorder tests lifecycle/download; it does not assert actual audio quality.
    recorded=browser.new_page(accept_downloads=True)
    recorded.add_init_script('''window.fakeTrackStops=0;
      Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>window.fakeTrackStops++}]})},configurable:true});
      window.MediaRecorder=class {constructor(){this.state='inactive';this.mimeType='audio/webm'}
       start(){this.state='recording'} stop(){this.state='inactive';setTimeout(()=>{this.ondataavailable({data:new Blob(['test take'],{type:'audio/webm'})});this.onstop()},0)}};''')
    recorded.goto(APP.as_uri()+'?practice=cf',wait_until='domcontentloaded')
    recorded.locator('.practice-recorder summary').click();recorded.locator('#practiceRecordStart').click()
    expect(recorded.locator('#practiceRecordStatus')).to_contain_text('Идёт запись')
    recorded.locator('#practicePlay').click()
    expect(recorded.locator('#practiceRecordStatus')).to_contain_text('Идёт запись')
    recorded.locator('#practiceRecordStop').click()
    expect(recorded.locator('#practiceRecordStatus')).to_contain_text('ещё не сохранён')
    assert recorded.evaluate('fakeTrackStops') == 1
    expect(recorded.locator('#practiceRecordStart')).to_be_disabled()
    with recorded.expect_download() as info: recorded.locator('#practiceRecordDownload').click()
    assert Path(info.value.path()).read_bytes() == b'test take'
    expect(recorded.locator('#practiceRecordStart')).to_be_enabled()
    recorded.locator('#practiceRecordStart').click()
    expect(recorded.locator('#practiceRecordStatus')).to_contain_text('Идёт запись')
    recorded.locator('#practiceBack').click()
    assert recorded.evaluate('fakeTrackStops') == 2
    recorded.close()
    print('OK: denied mic, explicit recording, unsaved/download state, backing+recording and navigation track cleanup', flush=True)
    browser.close()
