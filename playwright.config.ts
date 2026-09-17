import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests', fullyParallel:true, timeout:30000,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1365,height:1100}}},
    {name:'android-touch',use:{...devices['Pixel 7']}},
    {name:'ipad-webkit',use:{...devices['iPad (gen 7)']}},
    {name:'iphone-webkit',use:{...devices['iPhone 13']}},
  ],
  webServer:{command:'npm run preview -- --host 127.0.0.1',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
});
