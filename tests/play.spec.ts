import { test,expect,type Page } from '@playwright/test';
import { artwork } from '../src/art';

async function ready(page:Page){await page.goto('/');await expect(page.locator('#drawing')).toHaveCSS('pointer-events','auto');}
async function parents(page:Page){await page.locator('.parent-button').click();await page.locator('#answer').fill('15');await page.locator('#gate button').click();}
async function tap(page:Page,x:number,y:number){
  const canvas=page.locator('#drawing');await canvas.scrollIntoViewIfNeeded();const b=(await canvas.boundingBox())!;
  const point={x:b.x+x*b.width/800,y:b.y+y*b.height/650};
  if(await page.evaluate(()=>navigator.maxTouchPoints>0))await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
}
async function pixel(page:Page,x:number,y:number){return page.locator('#drawing').evaluate((el,{x,y})=>Array.from((el as HTMLCanvasElement).getContext('2d')!.getImageData(x*2,y*2,1,1).data).slice(0,3),{x,y});}
async function fillPoints(page:Page,id:string){
  return page.evaluate(regions=>{
    const c=document.createElement('canvas').getContext('2d')!,paths=regions.map(r=>new Path2D(r.d));
    const visible=(i:number,x:number,y:number)=>c.isPointInPath(paths[i],x,y)&&!paths.slice(i+1).some(p=>c.isPointInPath(p,x,y));
    return paths.flatMap((_,i)=>{
      for(let y=5;y<645;y+=3)for(let x=5;x<795;x+=3)
        if([[0,0],[-3,0],[3,0],[0,-3],[0,3]].every(([dx,dy])=>visible(i,x+dx,y+dy)))return [{x,y}];
      return [];
    });
  },artwork[id].regions);
}

test('fullscreen fallback fits portrait and landscape, keeps drawing, and gates exit',async({page},info)=>{
  await page.addInitScript(()=>Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true}));
  await ready(page);await page.locator('.fullscreen-button').click();await expect(page.locator('html')).toHaveClass('play-mode');
  await expect(page.locator('#toast')).toContainText('Home Screen');
  const check=async()=>{
    await expect.poll(async()=>page.locator('#drawing').evaluate(el=>{
      const r=el.getBoundingClientRect();return r.width>100&&r.height>60&&r.top>=0&&r.bottom<=innerHeight&&Math.abs(r.width/r.height-800/650)<.01;
    })).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(!info.project.name.includes('webkit'))await page.mouse.wheel(0,500);
    await page.evaluate(()=>scrollTo(0,500));expect(await page.evaluate(()=>scrollY)).toBe(0);
  };
  await check();await tap(page,395,415);expect(await pixel(page,395,415)).toEqual([237,79,89]);
  // An overflowing palette must start at its first color, without inaccessible negative overflow.
  const first=(await page.locator('[data-action="color:0"]').boundingBox())!,palette=(await page.locator('#palette').boundingBox())!;
  expect(first.x).toBeGreaterThanOrEqual(palette.x);
  await page.screenshot({path:`test-results/play-${info.project.name}.png`});
  await page.setViewportSize({width:844,height:390});await check();
  await page.locator('[data-action="color:3"]').click();await tap(page,394,220);expect(await pixel(page,394,220)).toEqual([107,187,108]);
  await page.screenshot({path:`test-results/play-landscape-${info.project.name}.png`});
  await page.locator('[data-action="browse"]').click();await expect(page.locator('.library')).toBeVisible();
  await page.locator('[data-action="picture:apple"]').click();await expect(page.locator('#word')).toHaveText('apple');await expect(page.locator('.library')).toBeHidden();
  await page.locator('.fullscreen-button').click();await expect(page.locator('#gate')).toBeVisible();await expect(page.locator('html')).toHaveClass('play-mode');
  await page.locator('#answer').fill('15');await page.locator('#gate button').click();await page.locator('[data-action="leave-play"]').click();await expect(page.locator('html')).not.toHaveClass('play-mode');
});

test('supported fullscreen enters and follows browser exit',async({page},info)=>{
  test.skip(info.project.name!=='desktop-chromium','Real Fullscreen API exercised in desktop Chromium; mobile fallback is covered separately.');
  await ready(page);await page.locator('.fullscreen-button').click();
  await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
  await page.evaluate(()=>document.exitFullscreen());await expect(page.locator('html')).not.toHaveClass('play-mode');
});

test('Home Screen launch starts in play mode and coalesced Pencil samples retain their curve',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true,configurable:true}));
  await ready(page);await expect(page.locator('html')).toHaveClass('play-mode');
  await page.locator('[data-action="tool:brush"]').click();await page.locator('[data-action="easy"]').click();
  await page.locator('#drawing').evaluate(el=>{
    const b=el.getBoundingClientRect();
    const event=(type:string,x:number,y:number)=>new PointerEvent(type,{pointerId:81,pointerType:'pen',button:0,pressure:.6,clientX:b.left+x*b.width/800,clientY:b.top+y*b.height/650});
    el.dispatchEvent(event('pointerdown',120,70));
    const move=event('pointermove',240,70);
    Object.defineProperty(move,'getCoalescedEvents',{value:()=>[event('pointermove',180,110),event('pointermove',240,70)]});
    el.dispatchEvent(move);el.dispatchEvent(event('pointerup',240,70));
  });
  expect(await pixel(page,180,110)).toEqual([237,79,89]);expect(await pixel(page,180,70)).toEqual([255,255,255]);
  await expect(page.locator('#drawing')).toHaveAttribute('data-actions','1');
});

test('stylus takes over a finger, rejects palms, and preserves light pressure at lift-off',async({page})=>{
  await ready(page);await page.locator('[data-action="tool:brush"]').click();await page.locator('[data-action="size:42"]').click();await page.locator('[data-action="easy"]').click();
  const canvas=page.locator('#drawing');await canvas.scrollIntoViewIfNeeded();const b=(await canvas.boundingBox())!;
  const event=(id:number,type:string,x:number,y:number,pressure=.1)=>({pointerId:id,pointerType:type,button:0,clientX:b.x+x/800*b.width,clientY:b.y+y/650*b.height,pressure});
  await canvas.dispatchEvent('pointerdown',event(1,'touch',150,80));
  await canvas.dispatchEvent('pointerdown',event(2,'pen',150,130));await canvas.dispatchEvent('pointermove',event(2,'pen',230,130));
  await canvas.dispatchEvent('pointerup',event(1,'touch',150,80));await canvas.dispatchEvent('pointerup',event(2,'pen',245,130,0));
  await expect(canvas).toHaveAttribute('data-actions','1');expect(await pixel(page,150,80)).toEqual([255,255,255]);expect(await pixel(page,190,130)).toEqual([237,79,89]);expect(await pixel(page,240,142)).toEqual([255,255,255]);
  await canvas.dispatchEvent('pointerdown',event(3,'touch',150,80));await canvas.dispatchEvent('pointerup',event(3,'touch',150,80));await expect(canvas).toHaveAttribute('data-actions','1');
  // A broad palm is rejected independently of the short post-stylus suppression window.
  await page.waitForTimeout(850);
  await canvas.dispatchEvent('pointerdown',{...event(4,'touch',150,80),width:60,height:55});await canvas.dispatchEvent('pointerup',event(4,'touch',150,80));await expect(canvas).toHaveAttribute('data-actions','1');
  await canvas.dispatchEvent('pointerdown',event(5,'touch',150,80));await canvas.dispatchEvent('pointerup',event(5,'touch',150,80));await expect(canvas).toHaveAttribute('data-actions','2');
  // Cancellation must discard just the tentative stroke, including its preview pixels.
  await canvas.dispatchEvent('pointerdown',event(6,'pen',350,80));await canvas.dispatchEvent('pointermove',event(6,'pen',400,80));await canvas.dispatchEvent('pointercancel',event(6,'pen',400,80));
  await expect.poll(()=>pixel(page,370,80)).toEqual([255,255,255]);await expect(canvas).toHaveAttribute('data-actions','2');
});

test('complete picture celebrates once, restores quietly, respects mute and reduced motion',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
  await parents(page);await page.locator('#sound-effects').uncheck();await page.locator('[data-action="close"]').click();
  await tap(page,25,25);await expect(page.locator('#drawing')).toHaveAttribute('data-complete','false');await expect(page.locator('#celebration')).toBeHidden();
  const points=await fillPoints(page,'cat');
  for(const p of points.slice(0,-1))await tap(page,p.x,p.y);
  await expect(page.locator('#drawing')).toHaveAttribute('data-complete','false');
  await tap(page,points.at(-1)!.x,points.at(-1)!.y);await expect(page.locator('#drawing')).toHaveAttribute('data-complete','true');await expect(page.locator('#celebration')).toBeVisible();
  await expect(page.locator('.cheer-label')).toHaveCSS('animation-name','none');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lls-preferences')!).sound)).toBe(false);
  await page.screenshot({path:`test-results/complete-${info.project.name}.png`});
  await page.locator('#undo').click();await expect(page.locator('#drawing')).toHaveAttribute('data-complete','false');await expect(page.locator('#celebration')).toBeHidden();
  await page.locator('#redo').click();await expect(page.locator('#drawing')).toHaveAttribute('data-complete','true');await expect(page.locator('#celebration')).toBeHidden();
  await expect(page.locator('#save-state')).toHaveText('Saved on this device');await page.reload();await expect(page.locator('#drawing')).toHaveAttribute('data-complete','true');await expect(page.locator('#celebration')).toBeHidden();
  // Erasing removes coverage even when the final picture was already celebrated.
  await page.locator('[data-action="tool:eraser"]').click();await page.locator('[data-action="size:42"]').click();await tap(page,192,488);await expect(page.locator('#drawing')).toHaveAttribute('data-complete','false');
  await parents(page);await expect(page.locator('#sound-effects')).not.toBeChecked();await page.locator('[data-action="clear"]').click();await page.locator('[data-action="confirm-clear"]').click();
  await page.locator('[data-action="tool:fill"]').click();for(const p of points)await tap(page,p.x,p.y);await expect(page.locator('#celebration')).toBeVisible();
});

test('world picture supports white coloring, local chime or unavailable-audio fallback',async({page},info)=>{
  // Observe locally synthesized notes without relying on the test machine having speakers.
  await page.addInitScript(()=>{
    if(typeof OscillatorNode==='undefined')return;
    const start=OscillatorNode.prototype.start;
    OscillatorNode.prototype.start=function(...args){document.documentElement.dataset.notes=String(Number(document.documentElement.dataset.notes||0)+1);return start.apply(this,args);};
  });
  await ready(page);await page.locator('[data-action="picture:apple"]').click();
  await page.locator('[data-action="color:10"]').click();const points=await fillPoints(page,'apple');for(const p of points)await tap(page,p.x,p.y);
  await expect(page.locator('#drawing')).toHaveAttribute('data-complete','true');await expect(page.locator('#celebration')).toBeVisible();
  if(await page.evaluate(()=>typeof AudioContext!=='undefined'))await expect(page.locator('html')).toHaveAttribute('data-notes','3');
  else{info.annotations.push({type:'environment',description:'Web Audio unavailable in this runner; visual fallback verified.'});await expect(page.locator('html')).not.toHaveAttribute('data-notes');}
});

test('long drawing history does not get replayed during new pointer movements',async({page})=>{
  await ready(page);await page.locator('[data-action="tool:brush"]').click();await page.locator('[data-action="easy"]').click();
  const result=await page.locator('#drawing').evaluate(async el=>{
    const canvas=el as HTMLCanvasElement,b=canvas.getBoundingClientRect();
    const send=(name:string,x:number)=>canvas.dispatchEvent(new PointerEvent(name,{pointerId:8,pointerType:'pen',button:0,pressure:.5,clientX:b.left+x*b.width/800,clientY:b.top+80*b.height/650}));
    for(let i=0;i<180;i++){send('pointerdown',100);send('pointermove',150);send('pointerup',150);}
    let strokes=0;const original=CanvasRenderingContext2D.prototype.stroke;
    CanvasRenderingContext2D.prototype.stroke=function(...args:Parameters<typeof original>){strokes++;return original.apply(this,args);};
    send('pointerdown',200);send('pointermove',250);await new Promise<void>(r=>requestAnimationFrame(()=>r()));
    send('pointermove',300);await new Promise<void>(r=>requestAnimationFrame(()=>r()));
    CanvasRenderingContext2D.prototype.stroke=original;send('pointercancel',300);return strokes;
  });
  expect(result).toBeLessThan(10);await expect(page.locator('#drawing')).toHaveAttribute('data-actions','180');
});
