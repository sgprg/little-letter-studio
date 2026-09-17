import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const browser=await chromium.launch();const svg=await readFile('public/icon.svg','utf8');
const targets=[...([192,512].map(size=>({size,path:`public/icon-${size}.png`})) ),{size:1024,path:'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'}];
for(const [density,size] of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]])for(const name of ['ic_launcher','ic_launcher_round','ic_launcher_foreground'])targets.push({size,path:`android/app/src/main/res/mipmap-${density}/${name}.png`});
for(const {size,path} of targets){const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});await page.setContent(`<style>body{margin:0}svg{display:block;width:100%;height:100%}</style>${svg}`);await page.screenshot({path});await page.close();}
await browser.close();
