"""Render actual Web Audio offline: sustain, release, rhythm durations and pitches."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

APP = Path(os.environ.get('FRETLAB_PREVIEW_PATH', Path(__file__).resolve().parents[1] / 'course-lab.html'))
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox'])
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(APP.as_uri())
    result = page.evaluate('''async () => {
      const originalCtx=audioCtx, originalPlay=playMidi, originalGet=getAudioCtx;
      getAudioCtx=()=>audioCtx;
      async function render(duration) {
        audioCtx=new OfflineAudioContext(1, 48000*2, 48000);
        playMidi(48, 0, duration);
        return (await audioCtx.startRendering()).getChannelData(0);
      }
      const long=await render(undefined), short=await render(.1);
      const rms=(data,start,end)=>{
        let sum=0;const a=Math.floor(start*48000),b=Math.floor(end*48000);
        for(let i=a;i<b;i++)sum+=data[i]*data[i];
        return Math.sqrt(sum/(b-a));
      };
      // Fundamental remains C3 despite the additional overtones.
      const section=long.slice(4800,14400), strength=f=>{
        let re=0,im=0;
        section.forEach((x,i)=>{re+=x*Math.cos(2*Math.PI*f*i/48000);im+=x*Math.sin(2*Math.PI*f*i/48000);});
        return Math.hypot(re,im);
      };
      const scheduled=[];
      audioCtx=new OfflineAudioContext(1, 96000, 48000);
      playMidi=(midi,when,duration)=>{scheduled.push({midi,when,duration});return {stop(){}};};
      playSequence([48,50,52]);stopSequence();
      playMidi=originalPlay;audioCtx=originalCtx;getAudioCtx=originalGet;
      return {attack:rms(long,.03,.07),body:rms(long,.4,.6),tail:rms(long,1.5,1.8),
        shortTail:rms(short,.16,.3),fundamental:strength(130.8128),semitone:strength(138.5913),scheduled};
    }''')
    assert result['body'] > result['attack']*.25, result
    assert result['tail'] < 1e-6 and result['shortTail'] < 1e-6, result
    assert result['fundamental'] > result['semitone']*3, result
    events = result['scheduled']
    assert [e['midi'] for e in events] == [48,50,52]
    assert all(e['duration'] == .5 for e in events)
    assert all(abs(events[i+1]['when']-events[i]['when']-.55)<1e-6 for i in range(2))
    assert not errors, errors
    browser.close()
    print('OK: rendered sustain and release, explicit rhythm duration, C3 pitch and sequence timing')
