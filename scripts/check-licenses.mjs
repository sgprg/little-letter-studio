import { readFile,writeFile,mkdir } from 'node:fs/promises';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const allowed=new Set(['MIT','Apache-2.0','BSD-2-Clause','BSD-3-Clause','ISC','0BSD','CC0-1.0','Unlicense','BlueOak-1.0.0','(MIT OR Apache-2.0)','(MIT AND Zlib)','MIT-0']);
const rows=[],bad=[];
for(const [path,pkg] of Object.entries(lock.packages)){
  if(!path)continue;
  const license=pkg.license||'UNKNOWN';
  const name=path.split('node_modules/').at(-1);
  rows.push({name,version:pkg.version,license,developmentOnly:!!pkg.dev,path});
  if(!allowed.has(license))bad.push({name,license});
}
await mkdir('docs',{recursive:true});
await writeFile('docs/DEPENDENCIES.json',JSON.stringify({scope:'Locked npm dependency metadata, including optional platform packages. Native transitive dependency review is separate.',packages:rows},null,2)+'\n');
console.log(`${rows.length} locked npm packages checked.`);
if(bad.length){console.error('Unreviewed licenses:',bad);process.exitCode=1;}else console.log('All npm license expressions are on the permissive allowlist.');
