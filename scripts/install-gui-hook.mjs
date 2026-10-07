#!/usr/bin/env node
import {installGuiHook} from '../packages/gui/src/hooks.mjs';
try {
  let project,openMode,dryRun=false;const args=process.argv.slice(2);
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--open'&&args[i+1])openMode=args[++i];
    else if(args[i]==='--dry-run')dryRun=true;
    else if(!args[i].startsWith('--')&&!project)project=args[i];
    else throw new Error('Usage: node scripts/install-gui-hook.mjs PROJECT --open host|system [--dry-run]');
  }
  if(!project)throw new Error('An explicit target project is required.');
  console.log(JSON.stringify(installGuiHook(project,{openMode,dryRun}),null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
