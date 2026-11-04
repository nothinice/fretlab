"""Measure sustained rhythmic notes in rendered PCM, rather than only scheduling arguments."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);page=b.new_page();page.goto(APP.as_uri())
 result=page.evaluate('''async()=>{
 const original=getAudioCtx;const results=[];
 for(const bpm of [40,60,100])for(const beats of [.5,1,2]){
  const d=beats*60/bpm,ctx=new OfflineAudioContext(1,Math.ceil((d+.2)*48000),48000);getAudioCtx=()=>ctx;
  playMidi(48,0,d,.2,null,'held');const data=(await ctx.startRendering()).getChannelData(0);
  const rms=(a,b)=>{let sum=0;for(let i=Math.floor(a*48000);i<Math.floor(b*48000);i++)sum+=data[i]*data[i];return Math.sqrt(sum/((b-a)*48000));};
  results.push({bpm,beats,d,body:rms(.1*d,.3*d),end:rms(.85*d,.95*d),tail:rms(d+.02,d+.1)});
 }
 getAudioCtx=original;return results;
}''')
 for row in result:
  assert row['end']>row['body']*.6,row
  assert row['tail']<1e-6,row
 b.close()
print('OK: quarter/eighth/half notes hold through final 95%, silent after exact beat boundary at 40/60/100 BPM')
