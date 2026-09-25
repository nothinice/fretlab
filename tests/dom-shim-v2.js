const registry = [];
function makeClassList(el){
  return {
    add:(...c)=>{ c.forEach(x=>el._classes.add(x)); },
    remove:(...c)=>{ c.forEach(x=>el._classes.delete(x)); },
    toggle:(c,force)=>{ if(force===undefined){ el._classes.has(c)?el._classes.delete(c):el._classes.add(c); } else { force?el._classes.add(c):el._classes.delete(c); } },
    contains:(c)=>el._classes.has(c)
  };
}
function elementMatches(el, sel){
  sel = sel.trim();
  if(sel.startsWith('#')) return el.id === sel.slice(1);
  if(sel.startsWith('.')) return el._classes.has(sel.slice(1));
  if(sel.startsWith('[') && sel.endsWith(']')){
    const attr = sel.slice(1,-1);
    return Object.prototype.hasOwnProperty.call(el.attrs, attr) || Object.prototype.hasOwnProperty.call(el.dataset, attr.replace('data-',''));
  }
  return el.tagName === sel;
}
function descendantsOf(el){
  const out = [];
  (el.children||[]).forEach(c=>{ out.push(c); out.push(...descendantsOf(c)); });
  return out;
}
function queryAllFrom(root, sel){
  const parts = sel.trim().split(/\s+/);
  let candidates = descendantsOf(root);
  for(const part of parts){
    candidates = candidates.filter(el => elementMatches(el, part))
      .flatMap(el => parts.indexOf(part)===parts.length-1 ? [el] : descendantsOf(el));
  }
  // simpler correct approach for our limited 2-part selectors: '#id tag'
  if(parts.length === 2){
    const container = registry.find(e => elementMatches(e, parts[0]));
    if(!container) return [];
    return descendantsOf(container).filter(e => elementMatches(e, parts[1]));
  }
  if(parts.length === 1){
    return descendantsOf(root).filter(e => elementMatches(e, parts[0]));
  }
  return [];
}
function makeElement(tag){
  const el = {
    tagName: tag, id:'', _classes:new Set(), children:[], attrs:{}, dataset:{}, style:{},
    _handlers:{}, disabled:false, value:'', textContent:'', title:'', checked:false, tabIndex:0,
    get className(){ return [...this._classes].join(' '); },
    set className(v){ this._classes = new Set(v.split(' ').filter(Boolean)); },
    get innerHTML(){ return this._innerHTML||''; },
    set innerHTML(v){ this._innerHTML=v; this.children=[]; },
    appendChild(child){ this.children.push(child); return child; },
    focus(){ this._focused=true; },
    addEventListener(evt, fn){ this._handlers[evt]=this._handlers[evt]||[]; this._handlers[evt].push(fn); },
    dispatch(evt, payload){ (this._handlers[evt]||[]).forEach(fn=>fn(payload)); },
    setAttribute(k,v){ this.attrs[k]=v; if(k==='data-switch') this.dataset.switch=v; },
    getAttribute(k){ return this.attrs[k]; },
    querySelectorAll(sel){ return queryAllFrom(this, sel); }
  };
  el.classList = makeClassList(el);
  registry.push(el);
  return el;
}
const stubIds = ['learnRoot','learnMode','learnFormLabel','learnFormBtns','contentToggle','learnPlayBtn','learnDisplayToggle',
  'learnExplain','learnHintBanner','learnLegend','learnBoard','learnDetails','learnDetailGrid',
  'tab-learn','tab-explore','panel-learn','panel-explore','v2SwitchTriad','v2SwitchSeventh',
  'exploreDegreeTableTitle','exploreDegreeTableBody'];
const byId = {};
global.byId = byId;
stubIds.forEach(id=>{ const el = makeElement('div'); el.id = id; byId[id]=el; });
// give the toggle-pair containers their two child buttons for real (so querySelectorAll works)
['learnDisplayToggle'].forEach(id=>{
  ['notes','degrees'].forEach(mode=>{
    const b = makeElement('button'); b.dataset.mode = mode; b.attrs['data-mode']=mode;
    byId[id].appendChild(b);
  });
});

global.document = {
  documentElement: makeElement('html'),
  getElementById: (id)=>{ if(!byId[id]) throw new Error('Missing stub element #'+id); return byId[id]; },
  createElement: (tag)=>makeElement(tag),
  querySelectorAll: (sel)=>{
    const html = global.document.documentElement;
    return queryAllFrom({children:[html, ...Object.values(byId)]}, sel);
  }
};
