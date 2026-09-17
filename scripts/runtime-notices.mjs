import { mkdir,readFile,writeFile } from 'node:fs/promises';
const packages=['core','android','ios','filesystem','share'];
await mkdir('public/third-party',{recursive:true});
for(const name of packages){await writeFile(`public/third-party/capacitor-${name}-LICENSE.txt`,await readFile(`node_modules/@capacitor/${name}/LICENSE`));}
await writeFile('public/third-party/Apache-2.0.txt',await readFile('LICENSE'));
await writeFile('public/third-party/NOTICE.txt',await readFile('NOTICE'));
