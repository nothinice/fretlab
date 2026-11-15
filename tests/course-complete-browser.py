"""Finish every new module through real controls; verify sound, persistence and review."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
OPEN={1:64,2:59,3:55,4:50,5:45,6:40}
NAMES=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B']
def label(midi):return NAMES[midi%12]+str(midi//12-1)

with sync_playwright() as p:
    browser=p.chromium.launch(args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1366,'height':900},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(APP.as_uri(),wait_until='domcontentloaded')
    modules=page.evaluate('CourseCompleteContent.modules')
    assert len(modules)==6
    tested={'ear_wrong':False,'export':False,'reload':False,'stop':False}

    def button(name):return page.locator('#courseStepBody').get_by_role('button',name=name,exact=True)
    def fret(key):
        string,fret=key.split('/')
        return page.locator(f'#courseBoard button[aria-label="Струна {string}, лад {fret}"]')
    def tempo():
        page.locator('#courseTempo').evaluate("e=>{const d=e.closest('details');if(d)d.open=true}")
        page.locator('#courseTempo').fill('120');page.locator('#courseTempo').press('Tab')
    def listen():
        button('▶ Послушать пример').click()
        expect(page.locator('#courseStop')).to_be_visible()
        expect(page.locator('#courseStop')).to_be_hidden(timeout=45000)
    def self_checks():
        for check in page.locator('#courseStepBody input[type=checkbox]').all():check.check()
    def choose_points(step):
        target=step.get('targetKeys',step.get('target'))
        if target is not None:return target
        pcs=set(step['targetPcs']);low,high=step.get('range',[0,12])
        candidates={string:[(string,f) for f in range(low,high+1) if (OPEN[string]+f)%12 in pcs] for string in OPEN}
        if not step.get('onePerString'):
            return [next(f'{s}/{f}' for s in range(6,0,-1) for _,f in candidates[s] if (OPEN[s]+f)%12==note) for note in sorted(pcs)]
        strings=list(range(6,0,-1))
        def search(index,covered,path):
            if covered==pcs:return path
            if index==len(strings):return None
            string=strings[index]
            for s,f in candidates[string]:
                note=(OPEN[s]+f)%12
                if note in covered:continue
                found=search(index+1,covered|{note},path+[f'{s}/{f}'])
                if found:return found
            return search(index+1,covered,path)
        found=search(0,set(),[])
        assert found,step['id']
        return found

    def finish_step(module,step,index):
        expect(page.locator('#courseStepTitle')).to_have_text(step['title'])
        typ=step['type']
        if typ=='learn':
            if step.get('audio'):
                expect(page.locator('#courseNext')).to_be_disabled();listen()
        elif typ=='choice':
            if len(step['answers'])>1:
                wrong=(step['correct']+1)%len(step['answers']);button(step['answers'][wrong]).click()
                expect(page.locator('#courseNext')).to_be_disabled()
            button(step['answers'][step['correct']]).click()
        elif typ=='select':
            button('Проверить').click();expect(page.locator('#courseNext')).to_be_disabled()
            target=choose_points(step)
            for key in target:
                if fret(key).get_attribute('aria-pressed')!='true':fret(key).click()
            button('Проверить').click()
            expect(page.locator('#courseNext')).to_be_enabled()
        elif typ=='ear':
            samples=step.get('samples',[dict(step.get('audio',{}),correct=step.get('correct'))])
            missed=False
            for sample in samples:
                answer=step['answers'][sample['correct']]
                expect(button(answer)).to_be_disabled();listen()
                if not tested['ear_wrong'] and len(step['answers'])>1:
                    button(step['answers'][(sample['correct']+1)%len(step['answers'])]).click()
                    expect(page.locator('#courseNext')).to_be_disabled()
                    listen();missed=True;tested['ear_wrong']=True
                button(answer).click();button('Следующий пример').click()
            if missed:
                state=page.evaluate('courseComplete.getState()')
                assert state['sessions'][step['id']]['firstCorrect']==len(samples)-1,state['sessions'][step['id']]
        elif typ=='voicing':
            lowest=min(step['voices']);button(f'Опустить {label(lowest)} на октаву').click();button('Проверить преобразование').click()
            expect(page.locator('#courseNext')).to_be_disabled();button('Сброс').click()
            target=sorted(step['voices'])[-2];button(f'Опустить {label(target)} на октаву').click();button('Проверить преобразование').click()
        elif typ=='transition':
            button('Проверить переход').click();expect(page.locator('#courseNext')).to_be_disabled()
            for key in step.get('targetKeys',step.get('target')):
                if fret(key).get_attribute('aria-pressed')!='true':fret(key).click()
            button('Проверить переход').click()
        elif typ=='sequence':
            for note in step['targetMidi']:button(label(note)).click()
            button('Проверить секвенцию').click()
        elif typ=='compose':
            # A partial phrase must remain incomplete.
            button(label(step['allowedMidi'][0])).click();button('Проверить фразу').click()
            expect(page.locator('#courseNext')).to_be_disabled();button('Очистить фразу').click()
            total=step['bars']*4
            for beat in range(total):
                allowed=step['allowedMidi'];pcs=None
                for landing in step.get('landings',[]):
                    if landing['atBeat']==beat+1:pcs=set(landing['pcs'])
                if beat==total-1 and step.get('endPcs'):
                    pcs=set(step['endPcs']) if pcs is None else pcs&set(step['endPcs'])
                note=next((n for n in allowed if pcs is None or n%12 in pcs),None)
                assert note is not None,step['id']
                button(label(note)).click()
            self_checks();button('Проверить фразу').click();expect(page.locator('#courseNext')).to_be_enabled()
            page.locator('#courseStepBody input[type=checkbox]').first.uncheck();expect(page.locator('#courseNext')).to_be_disabled()
            self_checks()
            if not tested['stop']:
                page.evaluate('''()=>{window._completeVoices=[];const original=playMidi;playMidi=(...args)=>{const v=original(...args);const entry={midi:args[0],at:args[1],duration:args[2],peak:args[3],stopped:false};_completeVoices.push(entry);const stop=v.stop;v.stop=()=>{entry.stopped=true;stop();};return v;};}''')
                button('▶ Фраза с сопровождением').click();expect(page.locator('#courseStop')).to_be_visible()
                voices=page.evaluate('_completeVoices')
                assert any(v['peak']==.045 for v in voices)
                assert any(v['peak']==.18 for v in voices)
                page.locator('#courseStop').click();assert page.evaluate('_completeVoices.every(v=>v.stopped)')
                tested['stop']=True
            if not tested['export']:
                with page.expect_download() as download_info:button('Скачать свою фразу (JSON)').click()
                project=json.loads(Path(download_info.value.path()).read_text())
                assert project['format']=='fretlab-own-phrase-v1'
                assert sum(e['beats'] for e in project['events'])==total
                assert project['progression']==step.get('progression',[])
                tested['export']=True
            if not tested['reload']:
                old=page.evaluate('courseComplete.getState()')
                page.reload(wait_until='domcontentloaded');page.evaluate('(id)=>courseComplete.open(id)',module['id']);tempo()
                new=page.evaluate('courseComplete.getState()')
                assert new['sessions'][step['id']]['events']==old['sessions'][step['id']]['events']
                expect(page.locator('#courseStepTitle')).to_have_text(step['title'])
                expect(page.locator('#courseNext')).to_be_enabled()
                tested['reload']=True
        elif typ=='practice':
            expect(page.locator('#courseNext')).to_be_disabled();self_checks()
        else:raise AssertionError(f'Unsupported task type: {typ}')
        expect(page.locator('#courseNext')).to_be_enabled()
        page.locator('#courseNext').click()

    for module in modules:
        page.evaluate('(id)=>courseComplete.open(id,0)',module['id']);tempo()
        for index,step in enumerate(module['steps']):finish_step(module,step,index)
        expect(page.locator('#courseHome')).to_be_visible()
        state=page.evaluate('courseComplete.getState()')
        assert state['records'][module['id']]['completedAt']>0
        assert all(state['done'].get(s['id']) for s in module['steps'])
        assert not errors,errors
        print(f'OK: module {module["id"]}, {len(module["steps"])} interactive steps',flush=True)
    assert all(tested.values()),tested

    # The delayed check is offered on return, even after seven days.
    first=modules[0];state=page.evaluate('courseComplete.getState()');completed=state['records'][first['id']]['completedAt']
    page.add_init_script(f'Date.now=()=>{completed+10*86400000}')
    page.reload(wait_until='domcontentloaded');page.locator('#tab-course').click()
    card=page.locator('#courseModuleCards article').filter(has=page.get_by_role('heading',name=first['title'],exact=True))
    card.get_by_role('button',name='Повторная проверка',exact=True).click();tempo()
    while page.locator('#courseWork').is_visible():
        title=page.locator('#courseStepTitle').inner_text()
        step=next(s for s in first['steps'] if s['title']==title)
        finish_step(first,step,first['steps'].index(step))
    reviewed=page.evaluate('courseComplete.getState()')['records'][first['id']]
    assert reviewed['completedAt']==completed
    assert reviewed['reviewedAt']==completed+10*86400000
    print('OK: delayed review keeps first completion and records separate review date',flush=True)

    for width,height in [(390,844),(1366,900)]:
        mobile=browser.new_page(viewport={'width':width,'height':height})
        mobile.on('pageerror',lambda e:errors.append(str(e)))
        mobile.goto(APP.as_uri()+'?course=all',wait_until='domcontentloaded')
        expect(mobile.locator('#tab-course')).to_have_attribute('aria-selected','true')
        assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        mobile.screenshot(path=f'/tmp/fretlab-complete-home-{width}.png',full_page=True)
        seen=set()
        for module in modules:
            for index,step in enumerate(module['steps']):
                if step['type'] in seen:continue
                seen.add(step['type']);mobile.evaluate('([id,index])=>courseComplete.open(id,index)',[module['id'],index])
                assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,step['id'])
                mobile.screenshot(path=f'/tmp/fretlab-complete-{step["type"]}-{width}.png',full_page=True)
        mobile.emulate_media(color_scheme='dark',reduced_motion='reduce')
        mobile.evaluate('(id)=>courseComplete.open(id)',modules[0]['id'])
        assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        mobile.close()
    denied=browser.new_page()
    denied.add_init_script("Storage.prototype.getItem=()=>{throw new Error('unavailable')};Storage.prototype.setItem=()=>{throw new Error('unavailable')}")
    denied.goto(APP.as_uri(),wait_until='domcontentloaded');denied.evaluate('(id)=>courseComplete.open(id)',modules[0]['id'])
    expect(denied.locator('#courseStorage')).to_contain_text('недоступно')
    denied.close();assert not errors,errors;browser.close()
print('OK: full course route, invalid answers, real audio gating, phrase export/reload, mobile/dark/reduced motion and unavailable storage')
