"""Real UI route, audio lifecycle, reload, delayed review and mobile layout."""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
POSITION=[(6,8),(6,10),(5,7),(5,8),(5,10),(4,7),(4,9),(4,10)]

with sync_playwright() as p:
    browser=p.chromium.launch(args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1366,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(APP.as_uri(),wait_until='domcontentloaded')

    def button(text):
        return page.locator('#b2TaskBody').get_by_role('button',name=text,exact=True)

    def hit(string,fret):
        page.locator(f'#b2Board button[aria-label="Струна {string}, лад {fret}"]').click()

    def next_step(title=None):
        expect(page.locator('#b2Next')).to_be_enabled()
        page.locator('#b2Next').click()
        if title:
            expect(page.locator('#b2Title')).to_have_text(title)

    def listen(text):
        button(text).click()
        expect(page.locator('#b2Stop')).to_be_visible()
        expect(page.locator('#b2Stop')).to_be_hidden(timeout=17000)

    def checks():
        for checkbox in page.locator('#b2TaskBody input[type=checkbox]').all():
            checkbox.check()

    def exam_next():
        button('К следующей части проверки').last.click()

    page.locator('#tab-block2').click()
    expect(page.locator('#b2Statusa')).to_contain_text('0 из 13')
    expect(page.locator('#b2Statusb')).to_contain_text('0 из 16')
    page.locator('#b2Resumea').click()
    page.get_by_text('Темп и повторение',exact=True).click()
    page.locator('#b2Tempo').fill('120');page.locator('#b2Tempo').press('Tab')
    assert page.locator('#b2Next').is_disabled()
    for fret in [5,7,8,10,12,14]:hit(5,fret)
    button('Проверить').click();expect(page.locator('#b2Next')).to_be_disabled()
    hit(5,15);button('Проверить').click();next_step('У каждой ноты есть номер')
    button('Ступени').click()
    assert page.locator('#b2Board .note').all_text_contents()==['1','2','3','4','5','6','7','1']
    listen('▶ Вверх и вниз');next_step('Узнайте ступень')
    button('1').click();expect(page.locator('#b2Next')).to_be_disabled()
    for answer in ['3','5','7','2']:button(answer).click()
    next_step('Две C — разные октавы')
    expect(button('Первая ступень C major')).to_be_disabled()
    listen('▶ Послушать две C');button('Первая ступень C major').click();next_step('Тот же C на соседней струне')
    hit(5,2);expect(page.locator('#b2Next')).to_be_disabled()
    hit(5,3);next_step('Перенос в обратную сторону')
    hit(6,10);next_step('Особенность второй струны')
    hit(2,2);expect(page.locator('#b2Next')).to_be_disabled()
    hit(2,3);next_step('Сложите гамму в позицию')
    for string,fret in POSITION:hit(string,fret)
    next_step('Те же восемь звуков в компактной позиции')
    assert page.locator('#b2Board .b2-finger').all_text_contents()==['1','3','4','1','2','4','2','4']
    listen('▶ Вверх и вниз');next_step('Позиция без готового рисунка')
    for string,fret in POSITION[:-1]:hit(string,fret)
    hit(6,9);button('Проверить').click();expect(page.locator('#b2Next')).to_be_disabled()
    # Invalid and incomplete work survives reload without becoming a passed task.
    page.reload(wait_until='domcontentloaded');page.locator('#tab-block2').click();page.locator('#b2Resumea').click()
    expect(page.locator('#b2Title')).to_have_text('Позиция без готового рисунка')
    expect(page.locator('#b2Next')).to_be_disabled()
    hit(6,9);hit(4,10);button('Проверить').click();next_step('Найдите и исправьте ошибку')
    hit(5,9);hit(5,10);next_step('Позиция на настоящей гитаре')
    checks();next_step('Проверка 2A без подсказок')
    expect(page.locator('#b2Hint')).to_be_hidden()
    for string,fret in POSITION:hit(string,fret)
    button('Проверить').click();exam_next()
    for answer in ['6','2','7','4']:button(answer).click()
    exam_next();hit(2,3);exam_next();checks();next_step()
    saved=page.evaluate('courseBlockTwo.getState()')
    assert len([k for k in saved['done'] if k.startswith('a-')])==13
    assert saved['completedAt']['a']>0
    assert 'b' not in saved['completedAt']
    print('OK: complete 2A route, wrong answers, fingerings, hidden-position recall, repair and reload',flush=True)

    page.locator('#b2Resumeb').click()
    for string,fret in [(6,8),(5,7),(5,10)]:hit(string,fret)
    button('Проверить').click();next_step('Перенесите C к порожку')
    for string,fret,title in [(5,3,'Перенесите E'),(4,2,'Перенесите G: первый шаг'),(4,5,'Перенесите G: второй шаг'),(3,0,'Три звука — C major')]:
        hit(string,fret);next_step(title)
    listen('▶ Вместе');next_step('Что изменит один полутон?')
    button('Станет меньше на полутон').click();next_step('Услышьте C major → C minor')
    hit(4,1);assert 'E♭' in page.locator('#b2Board .note').all_text_contents()
    next_step('Аккорд и арпеджио');listen('▶ Арпеджио');next_step('В открытом C те же звуки')
    assert sorted(page.locator('#b2Board .note').all_text_contents())==sorted(['C','E','G','C','E'])
    listen('▶ Вместе');next_step('Соберите C major сами')
    for string,fret in [(5,3),(4,2),(3,0)]:hit(string,fret)
    hit(4,1);button('Проверить аккорд').click();expect(page.locator('#b2Next')).to_be_disabled()
    button('Отменить').click();button('Проверить аккорд').click();expect(page.locator('#b2Next')).to_be_enabled()
    button('Сброс').click();expect(page.locator('#b2Board .note')).to_have_count(0)
    button('Отменить').click();expect(page.locator('#b2Board .note')).to_have_count(3)
    page.get_by_text('Открытые / заглушённые струны',exact=True).click()
    page.locator('.b2-string-states>div').filter(has=page.get_by_text('Струна 3',exact=True)).get_by_role('button',name='× Заглушить',exact=True).click()
    expect(page.locator('#b2Board .note')).to_have_count(2)
    button('Отменить').click()
    hit(2,1);button('Проверить аккорд').click();expect(page.locator('#b2Feedback')).to_contain_text('C major')
    next_step('Major или minor на слух')
    for index,answer in enumerate(['Мажор','Минор','Минор','Мажор']):
        expect(button(answer)).to_be_disabled()
        listen('▶ Послушать пример')
        if index==0:button('Минор').click();expect(page.locator('#b2Next')).to_be_disabled()
        button(answer).click();button('Завершить слуховую практику' if index==3 else 'Следующий пример').click()
    expect(page.locator('#b2Feedback')).to_contain_text('3 из 4')
    next_step('На чём закончилась фраза?')
    for index,answer in enumerate(['На звуке аккорда','На другом звуке гаммы','На звуке аккорда','На другом звуке гаммы']):
        listen('▶ Послушать пример');button(answer).click();button('Завершить слуховую практику' if index==3 else 'Следующий пример').click()
    next_step('Своя фраза поверх C major')
    for string,fret in [(6,8),(6,10),(5,7)]:hit(string,fret)
    button('Добавить паузу').click()
    for string,fret in [(5,10),(4,7),(4,9),(4,10)]:hit(string,fret)
    expect(page.locator('.b2-phrase li')).to_have_count(8)
    page.evaluate('''()=>{window._b2Voices=[];const original=playMidi;playMidi=(...args)=>{const v=original(...args);const row={midi:args[0],at:args[1],dur:args[2],peak:args[3],stopped:false};_b2Voices.push(row);const stop=v.stop;v.stop=()=>{row.stopped=true;stop();};return v;};}''')
    button('▶ Фраза + C major').click()
    expect(page.locator('#b2Stop')).to_be_visible()
    voices=page.evaluate('_b2Voices')
    assert len([v for v in voices if v['peak']==.045])==6
    backing=[v for v in voices if v['peak']==.045]
    melody=[v for v in voices if v['peak']==.18]
    assert abs(min(v['at'] for v in backing)-min(v['at'] for v in melody))<1e-9
    page.locator('#b2Stop').click();assert page.evaluate('_b2Voices.every(v=>v.stopped)')
    page.locator('#b2TaskBody select').select_option('sustain')
    page.evaluate('_b2Voices=[]');button('▶ Фраза + C major').click()
    assert page.evaluate('_b2Voices.filter(v=>v.peak===.045).length')==3
    page.wait_for_function("document.querySelectorAll('.b2-phrase .is-playing').length>0",timeout=12000)
    page.locator('#tab-sandbox').click();assert page.evaluate('_b2Voices.every(v=>v.stopped)')
    page.locator('#tab-block2').click();page.locator('#b2Resumeb').click()
    checks();button('Проверить фразу').click();expect(page.locator('#b2Next')).to_be_enabled()
    page.locator('#b2TaskBody input[type=checkbox]').first.uncheck();expect(page.locator('#b2Next')).to_be_disabled()
    checks();button('Проверить фразу').click()
    page.reload(wait_until='domcontentloaded');page.locator('#tab-block2').click();page.locator('#b2Resumeb').click()
    expect(page.locator('.b2-phrase li')).to_have_count(8)
    expect(page.locator('#b2Next')).to_be_enabled()
    next_step('Постройте G major по правилу')
    for string,fret in [(6,3),(5,2),(4,0)]:hit(string,fret)
    button('Интервалы аккорда').click()
    assert sorted(page.locator('#b2Board .note').all_text_contents())==['1','3','5']
    button('Проверить аккорд').click();expect(page.locator('#b2Feedback')).to_contain_text('G major')
    next_step('Проверка 2B без подсказок')
    for string,fret in [(5,3),(4,2),(3,0)]:hit(string,fret)
    button('Проверить аккорд').click();exam_next()
    button('C minor: C–E♭–G').click()
    button('Последовательное исполнение звуков C–E–G').click()
    listen('▶ Послушать пример');button('Минор').click();button('Завершить слуховую практику').click();exam_next()
    checks();next_step()
    saved=page.evaluate('courseBlockTwo.getState()')
    assert len([k for k in saved['done'] if k.startswith('b-')])==16
    assert saved['completedAt']['b']>0
    assert not errors,errors
    print('OK: complete 2B route, chord editing/undo, listening gates, phrase/backing sync, stop and saved composition',flush=True)

    # A first return after the recommended window still offers the review.
    completed=saved['completedAt']['a']
    page.add_init_script(f'Date.now=()=>{completed+10*86400000};')
    page.reload(wait_until='domcontentloaded')
    expect(page.locator('#blockOverview [data-b2-reviews]')).to_be_visible()
    page.locator('#blockOverview').get_by_role('button',name='Проверить 2A',exact=True).click()
    expect(page.locator('#b2Crumb')).to_contain_text('Повторная проверка')
    for string,fret in POSITION:hit(string,fret)
    button('Проверить').click();exam_next()
    for answer in ['6','2','7','4']:button(answer).click()
    exam_next();hit(2,3);exam_next();checks();next_step()
    after=page.evaluate('courseBlockTwo.getState()')
    assert after['completedAt']['a']==completed
    assert after['reviewedAt']['a']==completed+10*86400000
    assert after['reviewResults']['a']['practiceConfirmed'] is True
    assert after['reviewResults']['a']['at']==after['reviewedAt']['a']
    expect(page.locator('#b2Overview').get_by_role('button',name='Проверить 2A',exact=True)).to_have_count(0)
    print('OK: delayed review survives late return, runs without hints and retains original completion date',flush=True)

    for width in [390,768,1366]:
        mobile=browser.new_page(viewport={'width':width,'height':844})
        mobile.on('pageerror',lambda e:errors.append(str(e)))
        mobile.goto(APP.as_uri(),wait_until='domcontentloaded')
        mobile.locator('#tab-block2').click()
        mobile.screenshot(path=f'/tmp/fretlab-block2-overview-{width}.png',full_page=True)
        for part,index,name in [('a',8,'position'),('b',10,'chord'),('b',13,'composer')]:
            mobile.evaluate('([part,index])=>courseBlockTwo.open(part,index)',[part,index])
            assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,name)
            mobile.screenshot(path=f'/tmp/fretlab-block2-{name}-{width}.png',full_page=True)
        mobile.emulate_media(reduced_motion='reduce',color_scheme='dark')
        mobile.evaluate("courseBlockTwo.open('a',8)")
        assert mobile.locator('#b2Board .b2-finger').count()==8
        mobile.screenshot(path=f'/tmp/fretlab-block2-dark-{width}.png',full_page=True)
        mobile.close()
    # Storage denial must not prevent practising.
    denied=browser.new_page()
    denied.add_init_script("Storage.prototype.getItem=()=>{throw new Error('unavailable')};Storage.prototype.setItem=()=>{throw new Error('unavailable')}")
    denied.goto(APP.as_uri(),wait_until='domcontentloaded');denied.locator('#tab-block2').click();denied.locator('#b2Resumea').click()
    expect(denied.locator('#b2Storage')).to_contain_text('недоступно')
    assert not errors,errors
    denied.close();browser.close()
print('OK: desktop/tablet/390px layouts, dark mode, reduced motion and denied storage')
