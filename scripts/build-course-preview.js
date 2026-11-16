// Emit a portable HTML preview on stdout; source files stay unchanged.
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'course-lab.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="course-sandbox.css">',()=>'<style>'+fs.readFileSync(path.join(root,'course-sandbox.css'),'utf8')+'</style>');
html=html.replace('<link rel="stylesheet" href="course-complete-design.css">',()=>'<style>'+fs.readFileSync(path.join(root,'course-complete-design.css'),'utf8')+'</style>');
html=html.replace('<link rel="stylesheet" href="chord-identifier.css">',()=>'<style>'+fs.readFileSync(path.join(root,'chord-identifier.css'),'utf8')+'</style>');
html=html.replace('<link rel="stylesheet" href="course-practice.css">',()=>'<style>'+fs.readFileSync(path.join(root,'course-practice.css'),'utf8')+'</style>');
for(const file of ['chord-identifier.js','course-sandbox.js','course-lessons-content.js','course-lesson.js','course-rhythm-player.js','course-practice-player.js','course-practice-content.js','course-block-one.js','course-block-two-content.js','course-block-two.js','course-complete-content-foundation.js','course-complete-content-advanced.js','course-complete-content.js','course-complete.js','course-help.js','course-practice.js']){
  const tag=`<script src="${file}"></script>`;
  if(!html.includes(tag))throw Error('Missing script '+file);
  html=html.replace(tag,()=>'<script>'+fs.readFileSync(path.join(root,file),'utf8')+'</script>');
}
if(/(?:src|href)="(?:course-|chord-identifier)/.test(html))throw Error('Preview still depends on external course files');
process.stdout.write(html);
