import './style.css';
import { pictures, text, palette, localeNames, availableLetters, type Locale } from './content';
import { svgArt } from './art';
import { DrawingEngine, emptyDrawing, type Drawing, type Tool } from './drawing';
import { loadPicture, savePicture, deletePictures } from './storage';
import { icon } from './icons';
import { Capacitor } from '@capacitor/core';

const app=document.querySelector<HTMLDivElement>('#app')!;
let locale:Locale='en', pictureId='cat', group='all', letter='', expanded=false;
let engine!:DrawingEngine, offlineReady=false, saveState:'saved'|'saving'|'saveError'='saved';
let settings={easy:true,penOnly:false}, tool:Tool='fill', color=palette[0], size=22;
let switchToken=0, saveToken=0, pending=Promise.resolve();
const memory=new Map<string,Drawing>(), failedLoads=new Set<string>();
try {const p=JSON.parse(localStorage.getItem('lls-preferences')||'{}');if(['en','ru','cs'].includes(p.locale))locale=p.locale;if(pictures.some(x=>x.id===p.pictureId))pictureId=p.pictureId;settings={easy:p.easy!==false,penOnly:p.penOnly===true};}catch{}
const t=()=>text[locale], current=()=>pictures.find(p=>p.id===pictureId)!;
function preferences(){try{localStorage.setItem('lls-preferences',JSON.stringify({locale,pictureId,...settings}));}catch{}}
function button(action:string,label:string,body:string,extra=''){return `<button type="button" data-action="${action}" aria-label="${label}" title="${label}" ${extra}>${body}</button>`;}
function language(){return `<label class="language"><span class="sr-only">${t().language}</span><select id="language" aria-label="${t().language}">${Object.entries(localeNames).map(([key,label])=>`<option value="${key}" ${key===locale?'selected':''}>${label}</option>`).join('')}</select></label>`;}
function render(){
  if(engine){memory.set(pictureId,engine.drawing);engine.destroy();}
  document.documentElement.lang=locale;document.title=t().brand;
  app.innerHTML=`
  <header class="masthead"><div class="brand"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${t().brand}</span></div><div class="header-actions">${language()}${button('parent',t().parent,icon('lock'), 'class="round parent-button"')}</div></header>
  <main>
    <div class="book-heading"><div><span class="eyebrow">${t().book}</span><p>${t().tagline}</p></div><span class="edition">${t().alpha}</span></div>
    <section class="studio" aria-label="${t().book}">
      <aside class="tools" aria-label="${t().pencil}">${(['fill','pencil','brush','crayon','eraser'] as Tool[]).map(name=>button(`tool:${name}`,t()[name],`${icon(name)}<span>${t()[name]}</span>`,`class="tool ${name===tool?'selected':''}" aria-pressed="${name===tool}"`)).join('')}<div class="tool-separator"></div>${button('undo',t().undo,icon('undo'),'class="round" id="undo"')}${button('redo',t().redo,icon('redo'),'class="round" id="redo"')}</aside>
      <div class="paper-wrap">
        <div class="paper">
          <div class="word-heading"><div class="word-pair"><span id="letter" class="letter"></span><div><h1 id="word"></h1><p id="sentence"></p></div></div>${button('listen',t().listen,icon('sound'),'class="listen round"')}</div>
          <canvas id="drawing" aria-label="${t().hint}"></canvas>
          <div class="paper-footer"><span>${t().hint}</span><span id="save-state" role="status"></span></div>
        </div>
        <div class="drawing-options"><button type="button" id="easy" data-action="easy" class="mode" aria-pressed="${settings.easy}">${icon('check')}<span>${settings.easy?t().easy:t().free}</span></button><div class="sizes" aria-label="${t().size}">${[10,22,42].map((n,i)=>button(`size:${n}`,[t().small,t().medium,t().large][i],`<i style="width:${8+i*6}px;height:${8+i*6}px"></i>`,`class="size ${size===n?'selected':''}" aria-pressed="${size===n}"`)).join('')}</div></div>
      </div>
      <aside class="palette-panel"><span class="eyebrow">${t().colors}</span><div id="palette" class="palette"></div>${button('palette',expanded?t().less:t().more,expanded?'−':'+','class="more-colors"')}<span class="palette-note" aria-hidden="true">Aa<br>Бб<br>Čč</span></aside>
    </section>
    <section class="library" aria-label="${t().gallery}"><div class="library-heading"><div class="categories" role="group" aria-label="${t().gallery}">${['all','animals','world'].map(g=>button(`group:${g}`,g==='all'?t().all:t()[g as 'animals'|'world'],g==='all'?icon('book'):t()[g as 'animals'|'world'],`class="category ${group===g?'selected':''}" aria-pressed="${group===g}"`)).join('')}</div><div class="page-controls">${button('previous',t().previous,icon('left'),'class="round"')}${button('next',t().next,icon('right'),'class="round"')}</div></div><div id="letters" class="letter-list" aria-label="${t().letters}"></div><div id="gallery" class="gallery"></div></section>
    <footer class="app-footer"><span id="offline-status">${offlineReady?t().offline:t().onlineFirst}</span><button type="button" data-action="parent">${t().parent}</button></footer>
  </main><div id="toast" role="status" class="toast" hidden></div><dialog id="dialog"></dialog>`;
  engine=new DrawingEngine(document.querySelector<HTMLCanvasElement>('#drawing')!);
  engine.tool=tool;engine.color=color;engine.size=size;engine.easy=settings.easy;engine.penOnly=settings.penOnly;
  engine.setPicture(pictureId,memory.get(pictureId)||emptyDrawing());
  engine.onChange=()=>{
    memory.set(pictureId,engine.drawing);const id=pictureId,snapshot=structuredClone(engine.drawing),ticket=++saveToken;
    saveState=failedLoads.has(id)?'saveError':'saving';updateState();
    if(failedLoads.has(id))return;
    pending=pending.catch(()=>{}).then(()=>savePicture(id,snapshot)).then(()=>{if(id===pictureId&&ticket===saveToken){saveState='saved';updateState();}}).catch(()=>{if(id===pictureId){saveState='saveError';updateState();}});
  };
  engine.onLimit=()=>toast(t().limit);
  document.querySelector<HTMLSelectElement>('#language')!.addEventListener('change',e=>{
    if('speechSynthesis' in window)speechSynthesis.cancel();locale=(e.target as HTMLSelectElement).value as Locale;letter='';preferences();render();
  });
  const dialog=document.querySelector<HTMLDialogElement>('#dialog')!;
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  updatePicture();renderPalette();renderGallery();updateState();
}
function updatePicture(){
  const word=current().words[locale];document.querySelector('#letter')!.textContent=word.letter+(word.letter.length>1?' ':'')+word.letter.toLocaleLowerCase(locale);
  document.querySelector('#word')!.textContent=word.word;document.querySelector('#sentence')!.textContent=word.sentence;
  engine.canvas.setAttribute('aria-label',`${word.word}. ${t().hint}`);
}
function updateState(){
  document.querySelector<HTMLButtonElement>('#undo')!.disabled=engine.drawing.cursor===0;
  document.querySelector<HTMLButtonElement>('#redo')!.disabled=engine.drawing.cursor===engine.drawing.actions.length;
  document.querySelector('#save-state')!.textContent=t()[saveState];
}
function renderPalette(){document.querySelector('#palette')!.innerHTML=palette.slice(0,expanded?24:12).map((c,i)=>button(`color:${i}`,t().colorNames[i],color===c?icon('check'):'',`class="swatch ${color===c?'selected':''}" style="--swatch:${c};--ink:${[2,8,10,14,15,16,18,20].includes(i)?'#38425c':'#fff'}" aria-pressed="${color===c}"`)).join('');}
function visible(){return pictures.filter(p=>(group==='all'||p.group===group)&&(!letter||p.words[locale].letter===letter));}
function renderGallery(){
  const letters=availableLetters(locale,group);
  document.querySelector('#letters')!.innerHTML=letters.map(l=>button(`letter:${l}`,l,l,`class="letter-chip ${letter===l?'selected':''}" aria-pressed="${letter===l}"`)).join('');
  document.querySelector('#gallery')!.innerHTML=visible().map(p=>`<button type="button" class="picture-card ${p.id===pictureId?'selected':''}" data-action="picture:${p.id}" aria-label="${p.words[locale].word}" aria-pressed="${p.id===pictureId}"><span class="mini-letter">${p.words[locale].letter}</span>${svgArt(p.id,true)}<span>${p.words[locale].word}</span></button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-action^="group:"]').forEach(b=>{const active=b.dataset.action===`group:${group}`;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
}
async function choose(id:string){
  if(id===pictureId&&memory.has(id))return;
  const ticket=++switchToken;memory.set(pictureId,engine.drawing);pictureId=id;preferences();
  engine.setPicture(id,memory.get(id)||emptyDrawing());updatePicture();renderGallery();
  engine.canvas.style.pointerEvents='none';
  try{if(!memory.has(id))memory.set(id,await loadPicture(id));if(ticket!==switchToken)return;engine.setPicture(id,memory.get(id)!);saveState=failedLoads.has(id)?'saveError':'saved';}
  catch{if(ticket!==switchToken)return;failedLoads.add(id);saveState='saveError';toast(t().saveError);}
  finally{if(ticket===switchToken){engine.canvas.style.pointerEvents='';updateState();}}
}
let toastTimer:ReturnType<typeof setTimeout>;
function toast(message:string){const el=document.querySelector<HTMLDivElement>('#toast')!;el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,6500);}
function modal(body:string){const d=document.querySelector<HTMLDialogElement>('#dialog')!;d.innerHTML=`${button('close',t().close,icon('close'),'class="round dialog-close"')}${body}`;if(!d.open)d.showModal();}
function gate(){
  modal(`<span class="dialog-symbol">${icon('lock')}</span><h2>${t().gateTitle}</h2><p>${t().gateHint}</p><form id="gate"><label for="answer">${t().gateLabel}</label><input id="answer" inputmode="numeric" pattern="[0-9]*" autocomplete="off" required /><button class="primary" type="submit">${t().enter}</button><p id="gate-error" role="status"></p></form>`);
  document.querySelector('#gate')!.addEventListener('submit',e=>{e.preventDefault();if(document.querySelector<HTMLInputElement>('#answer')!.value.trim()==='15')grownups();else document.querySelector('#gate-error')!.textContent=t().wrong;});
}
function grownups(){
  modal(`<span class="eyebrow">${t().alpha}</span><h2>${t().parent}</h2><p>${t().about}</p><p>${t().privacy}</p><p>${t().install}</p><p>${t().voice}</p><div class="settings-row"><label for="pen-only">${t().penOnly}</label><input type="checkbox" id="pen-only" ${settings.penOnly?'checked':''}></div><p class="small-note">${t().modeHelp}</p><div class="parent-actions">${button('export',t().export,icon('download')+t().export,'class="primary"')}${button('clear',t().clear,t().clear,'class="secondary"')}${button('clear-all',t().clearAll,t().clearAll,'class="danger"')}</div>`);
  document.querySelector<HTMLInputElement>('#pen-only')!.addEventListener('change',e=>{settings.penOnly=(e.target as HTMLInputElement).checked;engine.penOnly=settings.penOnly;preferences();});
}
function confirmErase(all:boolean){modal(`<h2>${all?t().confirmAll:t().confirmClear}</h2><div class="parent-actions">${button(all?'confirm-all':'confirm-clear',t().erase,t().erase,'class="danger"')}${button('settings',t().cancel,t().cancel,'class="secondary"')}</div>`);}
function listen(){
  if(!('speechSynthesis' in window)){toast(t().noVoice);return;}
  const voice=speechSynthesis.getVoices().find(v=>v.localService&&v.lang.toLowerCase().startsWith(locale));
  if(!voice){toast(t().noVoice);return;}
  speechSynthesis.cancel();const entry=current().words[locale],u=new SpeechSynthesisUtterance(`${entry.word}. ${entry.sentence}`);
  u.voice=voice;u.lang=voice.lang;u.rate=.85;u.onerror=()=>toast(t().noVoice);speechSynthesis.speak(u);
}
async function exportPicture(){try{const w=current().words[locale],blob=await engine.export(w.word,w.letter);const file=new File([blob],`little-letters-${pictureId}-${locale}.png`,{type:'image/png'});
  if(Capacitor.isNativePlatform()){
    const {Filesystem,Directory}=await import('@capacitor/filesystem');const {Share}=await import('@capacitor/share');
    const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve((r.result as string).split(',')[1]);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});
    const saved=await Filesystem.writeFile({path:file.name,data,directory:Directory.Cache});
    try{await Share.share({title:w.word,url:saved.uri});}finally{await Filesystem.deleteFile({path:file.name,directory:Directory.Cache}).catch(()=>{});}
  }
  else if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file]});}
  else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
}catch(e){if((e as Error).name!=='AbortError')toast(t().exportError);}}
app.addEventListener('click',async e=>{
  const b=(e.target as Element).closest<HTMLButtonElement>('button[data-action]');if(!b)return;
  const [action,value]=b.dataset.action!.split(':');
  if(action==='tool'){tool=value as Tool;engine.tool=tool;document.querySelectorAll<HTMLButtonElement>('.tool').forEach(x=>{const yes=x===b;x.classList.toggle('selected',yes);x.setAttribute('aria-pressed',String(yes));});}
  if(action==='color'){color=palette[+value];engine.color=color;renderPalette();}
  if(action==='size'){size=+value;engine.size=size;document.querySelectorAll('.size').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});}
  if(action==='palette'){expanded=!expanded;renderPalette();b.textContent=expanded?'−':'+';b.setAttribute('aria-label',expanded?t().less:t().more);}
  if(action==='easy'){settings.easy=!settings.easy;engine.easy=settings.easy;preferences();b.innerHTML=icon('check')+`<span>${settings.easy?t().easy:t().free}</span>`;b.setAttribute('aria-pressed',String(settings.easy));}
  if(action==='undo')engine.undo();if(action==='redo')engine.redo();
  if(action==='picture')await choose(value);
  if(action==='group'){group=value;letter='';renderGallery();}
  if(action==='letter'){letter=letter===value?'':value;renderGallery();}
  if(action==='next'||action==='previous'){const list=visible();const i=list.findIndex(p=>p.id===pictureId);await choose(list[(i+(action==='next'?1:-1)+list.length)%list.length].id);}
  if(action==='listen')listen();if(action==='parent')gate();if(action==='close')document.querySelector<HTMLDialogElement>('#dialog')!.close();
  if(action==='settings')grownups();if(action==='export')await exportPicture();
  if(action==='clear'||action==='clear-all')confirmErase(action==='clear-all');
  if(action==='confirm-clear'){failedLoads.delete(pictureId);engine.clear();document.querySelector<HTMLDialogElement>('#dialog')!.close();}
  if(action==='confirm-all'){try{await pending;await deletePictures();memory.clear();failedLoads.clear();engine.setPicture(pictureId,emptyDrawing());saveState='saved';updateState();document.querySelector<HTMLDialogElement>('#dialog')!.close();}catch{toast(t().saveError);}}
});
render();
// Restore before accepting any new marks; never overwrite an unread saved drawing.
engine.canvas.style.pointerEvents='none';
const initialId=pictureId;
loadPicture(initialId).then(d=>{memory.set(initialId,d);if(pictureId===initialId){engine.setPicture(initialId,d);updateState();}}).catch(()=>{failedLoads.add(initialId);if(pictureId===initialId){saveState='saveError';updateState();}}).finally(()=>{if(pictureId===initialId)engine.canvas.style.pointerEvents='';});
if(Capacitor.isNativePlatform()){offlineReady=true;document.querySelector('#offline-status')!.textContent=t().offline;}
else if('serviceWorker' in navigator&&import.meta.env.PROD){
  navigator.serviceWorker.register(new URL('./sw.js',document.baseURI)).then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;document.querySelector('#offline-status')!.textContent=t().offline;}).catch(()=>{document.querySelector('#offline-status')!.textContent='';});
}
