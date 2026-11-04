"""Offline check of metronome transients, timing and future cancellation."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
APP=Path(os.environ.get('FRETLAB_PREVIEW_PATH',Path(__file__).resolve().parents[1]/'course-lab.html'))
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);page=b.new_page();page.goto(APP.as_uri())
 result=page.evaluate('''async()=>{
 const old=getAudioCtx,ctx=new OfflineAudioContext(1,48000,48000);getAudioCtx=()=>ctx;
 playMetronome(.1,false);playMetronome(.4,true);const cancelled=playMetronome(.7);cancelled.stop();
 const d=(await ctx.startRendering()).getChannelData(0);getAudioCtx=old;
 const energy=(a,b)=>{let sum=0;for(let i=Math.floor(a*48000);i<b*48000;i++)sum+=d[i]*d[i];return sum;};
 return {first:energy(.1,.15),second:energy(.4,.45),tail:energy(.16,.39),cancelled:energy(.69,.8),peak:Math.max(...d.map(Math.abs))};
}''')
 assert result['first']>0 and result['second']>0,result
 assert result['tail']==0 and result['cancelled']==0 and result['peak']<1,result
 b.close();print('OK: short metronome taps, silent tails, no clipping, cancelled future tap silent')
