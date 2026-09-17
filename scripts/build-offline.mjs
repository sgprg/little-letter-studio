import { readdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function files(dir){const out=[];for(const f of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${f.name}`;if(f.isDirectory())out.push(...await files(p));else if(f.name!=='sw.js')out.push(p);}return out;}
const paths=await files('dist'),hash=createHash('sha256');
hash.update(await readFile('scripts/build-offline.mjs'));
for(const p of paths)hash.update(await readFile(p));
const version=hash.digest('hex').slice(0,16),assets=paths.map(p=>'./'+p.slice(5));
await writeFile('dist/sw.js',`const PREFIX='little-letter-studio-'+new URL(self.registration.scope).pathname+'-';
const CACHE=PREFIX+'${version}';
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    if(event.request.mode==='navigate')return (await cache.match('./index.html',{ignoreVary:true}))||fetch(event.request);
    return (await cache.match(event.request,{ignoreSearch:true,ignoreVary:true}))||fetch(event.request);
  }));
});
`);
console.log(`Offline bundle ${version}: ${assets.length} local files.`);
