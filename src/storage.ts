import { emptyDrawing, validDrawing, type Drawing } from './drawing';
let database:Promise<IDBDatabase>|undefined;
function open(){
  if(!database)database=new Promise<IDBDatabase>((resolve,reject)=>{
    const r=indexedDB.open('little-letter-studio',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('pictures');
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>{database=undefined;reject(r.error);};
  });
  return database;
}
export async function loadPicture(id:string):Promise<Drawing>{
  const db=await open();return new Promise((resolve,reject)=>{
    const r=db.transaction('pictures').objectStore('pictures').get(id);
    r.onsuccess=()=>{if(r.result===undefined)resolve(emptyDrawing());else if(validDrawing(r.result))resolve(r.result);else reject(new Error('Unsupported saved picture'));};r.onerror=()=>reject(r.error);
  });
}
export async function savePicture(id:string,drawing:Drawing){
  const snapshot=structuredClone(drawing),db=await open();
  return new Promise<void>((resolve,reject)=>{const t=db.transaction('pictures','readwrite');t.objectStore('pictures').put(snapshot,id);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});
}
export async function deletePictures(){const db=await open();return new Promise<void>((resolve,reject)=>{const t=db.transaction('pictures','readwrite');t.objectStore('pictures').clear();t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
