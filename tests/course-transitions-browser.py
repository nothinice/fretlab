"""Targeted real-UI checks for C/F voice leading and sequence construction."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
NAMES=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B']
def label(n):return NAMES[n%12]+str(n//12-1)

with sync_playwright() as p:
    browser=p.chromium.launch(args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1366,'height':900})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(APP.as_uri(),wait_until='domcontentloaded')
    modules=page.evaluate('CourseCompleteContent.modules')
    additions=[(m,i,s) for m in modules for i,s in enumerate(m['steps']) if s['type'] in ['transition','sequence']]
    assert len(additions)==4,[(m['id'],s['id']) for m,_,s in additions]
    def button(text):return page.locator('#courseStepBody').get_by_role('button',name=text,exact=True)
    def fret(key):
        string,fret=key.split('/')
        return page.locator(f'#courseBoard button[aria-label="Струна {string}, лад {fret}"]')
    def setup(m,index):
        page.evaluate('([id,index])=>courseComplete.open(id,index)',[m['id'],index])
        page.locator('#courseTempo').evaluate("e=>{const d=e.closest('details');if(d)d.open=true}")
        page.locator('#courseTempo').fill('120');page.locator('#courseTempo').press('Tab')
    def play_and_finish(name):
        button(name).click();expect(page.locator('#courseStop')).to_be_visible()
        expect(page.locator('#courseStop')).to_be_hidden(timeout=30000)

    for module,index,step in additions:
        setup(module,index)
        expect(page.locator('#courseStepTitle')).to_have_text(step['title'])
        expect(page.locator('#courseNext')).to_be_disabled()
        if step['type']=='transition':
            expect(page.locator('#courseVoiceLeading .course-voice-line')).to_have_count(3)
            expect(page.locator('#courseVoiceLeading .is-common')).to_have_count(1)
            for pnt in step['fromPoints']:expect(fret(pnt['key'])).to_have_attribute('aria-pressed','true')
            button('Проверить переход').click();expect(page.locator('#courseNext')).to_be_disabled()
            targets=step.get('targetKeys',step.get('target'))
            for key in targets:
                if fret(key).get_attribute('aria-pressed')!='true':fret(key).click()
                # Replacing a voice must not remove or change the shared C4.
                expect(fret('2/1')).to_have_attribute('aria-pressed','true')
                assert page.locator('#courseBoard button[aria-pressed=true]').count()==3
                expect(page.locator('#courseVoiceLeading .is-common')).to_have_count(1)
            expect(page.locator('#courseBoard .course-ghost-note').first).to_be_visible()
            button('Проверить переход').click();expect(page.locator('#courseNext')).to_be_enabled()
            play_and_finish('▶ Переход туда и обратно')
            button('Сброс перехода').click();expect(page.locator('#courseNext')).to_be_disabled()
            for pnt in step['fromPoints']:expect(fret(pnt['key'])).to_have_attribute('aria-pressed','true')
            # Both source and current-chord buttons must schedule playable chord tones.
            play_and_finish('▶ Исходный аккорд');play_and_finish('▶ Ваш аккорд')
            for key in targets:
                if fret(key).get_attribute('aria-pressed')!='true':fret(key).click()
            button('Проверить переход').click()
        else:
            target=step['targetMidi'];wrong=next(n for n in step['allowedMidi'] if n!=target[0])
            button(label(wrong)).click();button('Проверить секвенцию').click()
            expect(page.locator('#courseNext')).to_be_disabled()
            button('Убрать последнее').click()
            for note in target[:3]:button(label(note)).click()
            # Incomplete, correct prefixes survive reload, and remain incomplete.
            old=page.evaluate('courseComplete.getState()')['sessions'][step['id']]['sequence']
            page.reload(wait_until='domcontentloaded');setup(module,index)
            assert page.evaluate('courseComplete.getState()')['sessions'][step['id']]['sequence']==old
            expect(page.locator('#courseNext')).to_be_disabled()
            button('Очистить секвенцию').click()
            for note in target:button(label(note)).click()
            expect(page.locator('#courseSequenceCells [data-sequence-cell]')).to_have_count(len(target))
            button('Проверить секвенцию').click();expect(page.locator('#courseNext')).to_be_enabled()
            # Listen to actual synthesized playback, not a simulated state change.
            play_and_finish('▶ Ваш вариант')
            page.evaluate('''()=>{window._sequenceAudio=[];const old=playMidi;playMidi=(...args)=>{if(args[3]===.18)_sequenceAudio.push(args.slice(0,3));return old(...args);};}''')
            play_and_finish('▶ Полная секвенция')
            played=page.evaluate('_sequenceAudio')
            assert [v[0] for v in played]==step['fullSequence'],(step['id'],played)
            assert all(abs(v[2]-step['beats']*.5)<1e-9 for v in played)
            assert all(abs(played[i+1][1]-played[i][1]-step['beats']*.5)<1e-9 for i in range(len(played)-1))
        expect(page.locator('#courseNext')).to_be_enabled()
        page.locator('#courseNext').click()
        state=page.evaluate('courseComplete.getState()')
        assert state['done'][step['id']]
        assert not errors,errors
        print('OK:',step['id'],flush=True)

    for width in [390,1366]:
        page.set_viewport_size({'width':width,'height':844})
        for module,index,step in additions:
            setup(module,index)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,step['id'])
            page.screenshot(path=f'/tmp/fretlab-{step["id"]}-{width}.png',full_page=True)
    assert not errors,errors
    browser.close()
print('OK: all C/F transitions and sequence tasks, incomplete-state reload, playback, voice retention, desktop and 390px')
