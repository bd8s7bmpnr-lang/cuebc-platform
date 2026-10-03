import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const files=[];
async function walk(directory) {
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const file=`${directory}/${entry.name}`;
    if(entry.isDirectory()) await walk(file);
    else if(/\.(js|mjs)$/.test(file)) files.push(file);
  }
}
for(const directory of ['docs/app','scripts','tests']) await walk(directory);
for(const file of files) {
  const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
  if(result.status!==0) process.exit(result.status||1);
}
console.log(`Syntax checked ${files.length} application, tooling, and test files.`);
