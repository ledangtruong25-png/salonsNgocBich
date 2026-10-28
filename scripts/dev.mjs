// Accept common preview host/port flags and pass only supported flags to Next.js.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const input=process.argv.slice(2), args=[];
for(let i=0;i<input.length;i++) {
  const arg=input[i];
  if(arg==='--strictPort') continue;
  args.push(arg==='--host'?'--hostname':arg);
}
if(!args.includes('--hostname')&&!args.includes('-H')) args.push('--hostname','0.0.0.0');
const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/next/dist/bin/next',import.meta.url)),'dev',...args],{stdio:'inherit',env:process.env});
child.on('exit',(code,signal)=>{if(signal)process.kill(process.pid,signal);else process.exit(code??1);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
