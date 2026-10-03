#!/usr/bin/env node
import {installHost} from '../packages/cli/src/host-install.mjs';

const usage='Usage: node scripts/install-host.mjs <existing-project> --host codex|claude|both [--dry-run] [--json]';
try {
  const args=process.argv.slice(2);
  if(args.includes('--help')) {console.log(usage);} else {
    let target,host,dryRun=false,json=false;
    for(let index=0;index<args.length;index++) {
      const argument=args[index];
      if(argument==='--host') host=args[++index];
      else if(argument==='--dry-run') dryRun=true;
      else if(argument==='--json') json=true;
      else if(argument.startsWith('--') || target) throw new Error(usage);
      else target=argument;
    }
    if(!target || !host) throw new Error(usage);
    const result=installHost(target,{host,dryRun});
    if(json) console.log(JSON.stringify(result,null,2));
    else {
      console.log(`${dryRun?'Preview':'Installed'}: ${result.root}`);
      for(const host of result.hosts) console.log(`${host.host}: ${host.skillRoot}; entry: ${host.instructionFile}`);
      console.log(`${result.written.length} files ${dryRun?'would change':'changed'}.`);
      console.log(result.verification);
    }
  }
} catch(error) {console.error(error.message);process.exitCode=2;}
