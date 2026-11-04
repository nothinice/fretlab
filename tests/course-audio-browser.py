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
      const long=await render(1.35), short=await render(.1);
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
      // Stop midway through a waveform and cancel a note scheduled after it.
      audioCtx=new OfflineAudioContext(1,96000,48000);
      const held=playMidi(48,0,1.35),future=playMidi(72,.7,.9);
      const paused=audioCtx.suspend(.2), rendered=audioCtx.startRendering();
      await paused;const stoppedAt=audioCtx.currentTime;held.stop();future.stop();
      await audioCtx.resume();const stopped=(await rendered).getChannelData(0);
      const at=Math.round(stoppedAt*48000);
      const jumps=data=>{let max=0;for(let i=at;i<at+1440;i++)max=Math.max(max,Math.abs(data[i]-data[i-1]));return max;};
      const release={initialDifference:Math.abs(stopped[at]-long[at]),jump:jumps(stopped),referenceJump:jumps(long),tail:rms(stopped,stoppedAt+.04,1.8)};
      const scheduled=[];
      audioCtx=new OfflineAudioContext(1, 96000, 48000);
      playMidi=(midi,when,duration)=>{scheduled.push({midi,when,duration});return {stop(){},addEventListener(){}};};
      playSequence([48,50,52]);stopSequence();
      playSequence([48,50,52],{step:.55});stopSequence();
      playMidi=originalPlay;audioCtx=originalCtx;getAudioCtx=originalGet;
      return {release,attack:rms(long,.03,.07),body:rms(long,.4,.6),tail:rms(long,1.5,1.8),
        shortTail:rms(short,.16,.3),fundamental:strength(130.8128),semitone:strength(138.5913),scheduled};
    }''')
    assert result['body'] > result['attack']*.25, result
    assert result['tail'] < 1e-6 and result['shortTail'] < 1e-6, result
    assert result['fundamental'] > result['semitone']*3, result
    release=result['release']
    assert release['initialDifference'] < 1e-5, release
    assert release['jump'] <= release['referenceJump']*1.2, release
    assert release['tail'] < 1e-6, release
    events = result['scheduled']
    assert [e['midi'] for e in events] == [48,50,52,48,50,52]
    assert all(e['duration'] == .5 for e in events)
    assert all(abs(events[i+1]['when']-events[i]['when']-.32)<1e-6 for i in range(2))
    assert all(abs(events[i+1]['when']-events[i]['when']-.55)<1e-6 for i in range(3,5))
    assert not errors, errors
    browser.close()
    print('OK: rendered sustain and release, explicit rhythm duration, C3 pitch and sequence timing')
