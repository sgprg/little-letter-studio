import { test,expect,type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve,sep } from 'node:path';
async function ready(page:Page){await page.goto('/');await expect(page.locator('#word')).toHaveText('cat');await expect(page.locator('#save-state')).toHaveText('Saved on this device');}
async function at(page:Page,x:number,y:number){const b=(await page.locator('#drawing').boundingBox())!;const px=b.x+x/800*b.width,py=b.y+y/650*b.height;if(await page.evaluate(()=>navigator.maxTouchPoints>0))await page.touchscreen.tap(px,py);else await page.mouse.click(px,py);}
async function pixel(page:Page,x:number,y:number){return page.locator('#drawing').evaluate((el,{x,y})=>Array.from((el as HTMLCanvasElement).getContext('2d')!.getImageData(x*2,y*2,1,1).data).slice(0,3),{x,y});}
async function parent(page:Page){await page.locator('.parent-button').click();await page.locator('#answer').fill('15');await page.locator('#gate button').click();}

test('tap fill, undo, redo and durable restore',async({page})=>{
  await ready(page);expect(await pixel(page,395,415)).toEqual([255,255,255]);await at(page,395,415);
  await expect(page.locator('#drawing')).toHaveAttribute('data-actions','1');expect(await pixel(page,395,415)).toEqual([237,79,89]);
  // The face in front of the body must remain untouched.
  expect(await pixel(page,394,220)).toEqual([255,255,255]);
  await page.locator('#undo').click();expect(await pixel(page,395,415)).toEqual([255,255,255]);
  await page.locator('#redo').click();expect(await pixel(page,395,415)).toEqual([237,79,89]);
  await expect(page.locator('#save-state')).toHaveText('Saved on this device');await page.reload();
  await expect(page.locator('#drawing')).toHaveAttribute('data-actions','1');expect(await pixel(page,395,415)).toEqual([237,79,89]);
});
test('correct Russian and Czech concept mapping, picture persistence',async({page})=>{
  await ready(page);await at(page,395,415);await page.locator('#language').selectOption('ru');
  await expect(page.locator('#word')).toHaveText('кот');await expect(page.locator('#letter')).toHaveText('Кк');
  await page.locator('[data-action="picture:hedgehog"]').click();await expect(page.locator('#letter')).toHaveText('Ёё');
  await page.locator('#language').selectOption('cs');await page.locator('[data-action="picture:chameleon"]').click();
  await expect(page.locator('#letter')).toHaveText('Ch ch');await page.locator('[data-action="picture:cat"]').click();
  expect(await pixel(page,395,415)).toEqual([237,79,89]);await expect(page.locator('#word')).toHaveText('kočka');
  await page.locator('[data-action="group:world"]').click();await page.locator('[data-action="letter:Ř"]').click();
  await expect(page.locator('.picture-card')).toHaveCount(1);await page.locator('[data-action="picture:river"]').click();await expect(page.locator('#letter')).toHaveText('Řř');
});
test('freehand stroke, clipping, cancel, and a new branch after undo',async({page})=>{
  await ready(page);await page.locator('[data-action="tool:brush"]').click();
  const b=(await page.locator('#drawing').boundingBox())!;
  await page.mouse.move(b.x+390/800*b.width,b.y+400/650*b.height);await page.mouse.down();await page.mouse.move(b.x+650/800*b.width,b.y+400/650*b.height,{steps:30});await page.mouse.up();
  expect(await pixel(page,400,400)).toEqual([237,79,89]);expect(await pixel(page,620,400)).toEqual([255,255,255]);
  await page.locator('#undo').click();await page.locator('[data-action="tool:fill"]').click();await at(page,393,215);await expect(page.locator('#redo')).toBeDisabled();
  await page.locator('[data-action="tool:pencil"]').click();
  await page.locator('#drawing').dispatchEvent('pointerdown',{pointerId:22,pointerType:'pen',button:0,clientX:b.x+100,clientY:b.y+100,pressure:.6});
  await page.locator('#drawing').dispatchEvent('pointercancel',{pointerId:22,pointerType:'pen'});
  await expect(page.locator('#drawing')).toHaveAttribute('data-actions','1');
});
test('caregiver gate, export PNG and confirmed clear',async({page})=>{
  await ready(page);await at(page,395,415);await page.locator('.parent-button').click();await page.locator('#answer').fill('9');await page.locator('#gate button').click();await expect(page.locator('#gate-error')).toHaveText('Try again.');
  await page.locator('#answer').fill('15');await page.locator('#gate button').click();
  // Desktop download path, deterministic even when mobile emulation exposes Web Share.
  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true}));
  const download=page.waitForEvent('download');await page.locator('[data-action="export"]').click();expect((await download).suggestedFilename()).toBe('little-letters-cat-en.png');
  await page.locator('[data-action="clear"]').click();await page.locator('[data-action="settings"]').click();await page.locator('[data-action="close"]').click();
  expect(await pixel(page,395,415)).toEqual([237,79,89]);
  await parent(page);await page.locator('[data-action="clear"]').click();await page.locator('[data-action="confirm-clear"]').click();await expect(page.locator('#drawing')).toHaveAttribute('data-actions','0');
});
test('offline app works after the origin server stops, without external requests',async({page})=>{
  const root=resolve('dist');
  const server=createServer(async(req,res)=>{try{
    const url=new URL(req.url!,'http://localhost'),path=resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const mime=path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.html')?'text/html':path.endsWith('.svg')?'image/svg+xml':path.endsWith('.png')?'image/png':'application/json';
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(await readFile(path));
  }catch{res.writeHead(404).end();}});
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
  const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith(url)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))external.push(r.url());});
  try{
    await page.goto(url);await expect(page.locator('#offline-status')).toHaveText('Ready for offline play');await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));
    await page.reload();await expect(page.locator('#word')).toHaveText('cat');await at(page,395,415);await expect(page.locator('#drawing')).toHaveAttribute('data-actions','1');
    await page.locator('#language').selectOption('cs');await page.locator('[data-action="picture:stork"]').click();await expect(page.locator('#word')).toHaveText('čáp');expect(external).toEqual([]);
  }finally{if(server.listening){server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}}
});
test('responsive layout, missing voice, all pages and screenshot',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.evaluate(()=>{if('speechSynthesis' in window)Object.defineProperty(speechSynthesis,'getVoices',{value:()=>[],configurable:true});});
  await page.locator('[data-action="listen"]').click();await expect(page.locator('#toast')).toHaveText('No offline voice for this language is installed on this device.');
  const ids=await page.locator('.picture-card').evaluateAll(els=>els.map(e=>(e as HTMLElement).dataset.action!));
  for(const id of ids){await page.locator(`[data-action="${id}"]`).click();await expect(page.locator('#word')).not.toBeEmpty();}
  await page.locator('[data-action="picture:cat"]').click();await page.locator('[data-action="color:3"]').click();await at(page,395,415);
  await page.screenshot({path:`test-results/${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});

test('pen pressure and pen-only touch rejection',async({page})=>{
  await ready(page);await parent(page);await page.locator('#pen-only').check();await page.locator('[data-action="close"]').click();
  await page.locator('[data-action="tool:brush"]').click();await page.locator('[data-action="size:42"]').click();await page.locator('[data-action="easy"]').click();
  const canvas=page.locator('#drawing'),b=(await canvas.boundingBox())!;
  const event=(x:number,y:number,pressure:number,pointerType='pen')=>({pointerId:71,pointerType,button:0,clientX:b.x+x/800*b.width,clientY:b.y+y/650*b.height,pressure});
  await canvas.dispatchEvent('pointerdown',event(180,80,.5,'touch'));await canvas.dispatchEvent('pointerup',event(180,80,.5,'touch'));await expect(canvas).toHaveAttribute('data-actions','0');
  for(const [y,p] of [[80,.1],[130,1]]){await canvas.dispatchEvent('pointerdown',event(150,y,p));await canvas.dispatchEvent('pointermove',event(230,y,p));await canvas.dispatchEvent('pointerup',event(230,y,p));}
  expect(await pixel(page,190,92)).toEqual([255,255,255]);expect(await pixel(page,190,142)).toEqual([237,79,89]);await expect(canvas).toHaveAttribute('data-actions','2');
});
test('unavailable storage is surfaced while drawing remains usable',async({page})=>{
  await page.addInitScript(()=>{indexedDB.open=()=>{throw new DOMException('Storage unavailable','SecurityError');};});
  await page.goto('/');await expect(page.locator('#save-state')).toContainText('Could not save');await at(page,395,415);await expect(page.locator('#drawing')).toHaveAttribute('data-actions','1');expect(await pixel(page,395,415)).toEqual([237,79,89]);await expect(page.locator('#save-state')).toContainText('Could not save');
});
