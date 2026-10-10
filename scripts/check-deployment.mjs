import { chromium,webkit,devices } from '@playwright/test';
const url=process.argv[2];if(!url?.startsWith('https://'))throw new Error('Pass the HTTPS deployment URL.');
for(const [name,type,options] of [['desktop',chromium,{viewport:{width:1365,height:1000}}],['iphone',webkit,devices['iPhone 13']]]){
  const browser=await type.launch(),context=await browser.newContext(options),page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const response=await page.goto(url);if(response.status()!==200)throw new Error('Deployment did not return HTTP 200.');
  await page.waitForFunction(()=>document.querySelector('#offline-status')?.textContent==='Ready for offline play');
  await page.locator('#language').selectOption('cs');await page.locator('[data-action="picture:chameleon"]').click();
  if(await page.locator('#letter').textContent()!=='Ch ch')throw new Error('Incorrect Czech digraph.');
  await page.locator('#language').selectOption('en');await page.locator('[data-action="picture:cat"]').click();
  await page.locator('.fullscreen-button').click();
  await page.waitForFunction(()=>{
    const r=document.querySelector('#drawing').getBoundingClientRect();
    return document.documentElement.classList.contains('play-mode')&&r.width>100&&r.bottom<=innerHeight;
  });
  const b=await page.locator('#drawing').boundingBox(),x=b.x+395/800*b.width,y=b.y+415/650*b.height;
  if(name==='iphone')await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
  await page.waitForFunction(()=>document.querySelector('#drawing').dataset.actions==='1'&&document.querySelector('#save-state').textContent==='Saved on this device');
  const colored=await page.locator('#drawing').evaluate(el=>Array.from(el.getContext('2d').getImageData(790,830,1,1).data).join(','));
  if(colored!=='237,79,89,255')throw new Error('Drawing in play mode did not color the body.');
  if(name==='desktop'){await context.setOffline(true);await page.reload();await page.waitForFunction(()=>document.querySelector('#drawing')?.dataset.actions==='1');}
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`${name}: deployed assets, service worker, languages, fullscreen play, drawing pixels and save${name==='desktop'?', offline restore':''} passed.`);
  await browser.close();
}
