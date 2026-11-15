/* Course assembly: content is original, references are documented separately. */
const CourseCompleteContent=(()=>{
  const foundation=typeof module!=='undefined'&&module.exports?require('./course-complete-content-foundation.js'):CourseCompleteFoundation;
  const advanced=typeof module!=='undefined'&&module.exports?require('./course-complete-content-advanced.js'):CourseCompleteAdvanced;
  const modules=[...foundation,...advanced];
  if(new Set(modules.map(m=>m.id)).size!==modules.length)throw Error('Duplicate course module');
  return {modules};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CourseCompleteContent;
