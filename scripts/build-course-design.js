// Independent design preview, same course engine, separate local progress namespace.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');
let html=execFileSync(process.execPath,[path.join(__dirname,'build-course-preview.js')],{encoding:'utf8',maxBuffer:8*1024*1024});
html=html.replace('<html lang="ru">','<html lang="ru" data-theme="light" data-design="discoveries">');
html=html.replace('</body>',()=>'<style>'+fs.readFileSync(path.join(root,'design/course-concept.css'),'utf8')+'</style></body>');
html=html.replace('</body>',()=>'<script>'+fs.readFileSync(path.join(root,'design/course-concept.js'),'utf8')+'</script></body>');
for(const key of ['fretlab-block1-v1','fretlab-lessons-v1','fretlab-rhythm-study-v1'])html=html.replaceAll(key,key.replace('fretlab-','fretlab-design-'));
html=html.replace('<title>Fretlab — рабочая песочница курса</title>','<title>FretLab · Музыкальные открытия — дизайн-проба</title>');
process.stdout.write(html);
