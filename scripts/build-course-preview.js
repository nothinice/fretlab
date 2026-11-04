// Emit a portable HTML preview on stdout; source files stay unchanged.
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'course-lab.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="course-sandbox.css">',()=>'<style>'+fs.readFileSync(path.join(root,'course-sandbox.css'),'utf8')+'</style>');
for(const file of ['course-sandbox.js','course-lessons-content.js','course-lesson.js','course-block-one.js','course-help.js']){
  const tag=`<script src="${file}"></script>`;
  if(!html.includes(tag))throw Error('Missing script '+file);
  html=html.replace(tag,()=>'<script>'+fs.readFileSync(path.join(root,file),'utf8')+'</script>');
}
if(/(?:src|href)="course-/.test(html))throw Error('Preview still depends on external course files');
process.stdout.write(html);
