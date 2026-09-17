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
  if(name==='desktop'){await context.setOffline(true);await page.reload();await page.locator('#word').waitFor();}
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`${name}: deployed assets, service worker, language switching${name==='desktop'?', offline reload':''} passed.`);
  await browser.close();
}
