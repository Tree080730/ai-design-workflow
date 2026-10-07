#!/usr/bin/env node
// Portable delivery gate. Does not depend on the CLI checkout or npm install.
import {executeDelivery, deliveryExitCode} from './lib/delivery.mjs';
import {summarizeStatus} from './lib/status-output.mjs';
const [action = 'status', target = '.', ...args] = process.argv.slice(2);
try {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--summary') { options.summary = true; continue; }
    if (!['--check','--file'].includes(args[index]) || !args[index+1] || args[index+1].startsWith('--')) throw new Error('Expected --check id, --file evidence.json or --summary.');
    options[args[index].slice(2)] = args[++index];
  }
  const result = executeDelivery(target,action,options);
  console.log(JSON.stringify(options.summary ? summarizeStatus(result) : result,null,2));
  process.exitCode = deliveryExitCode(action,result);
} catch (error) {
  console.log(JSON.stringify({schemaVersion:1,canFinish:false,status:'blocked',blockers:[{code:'execution-error',message:error.message}]}));
  process.exitCode = 2;
}
