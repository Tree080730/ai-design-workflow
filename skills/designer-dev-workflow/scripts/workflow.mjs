#!/usr/bin/env node
import {acknowledgeInput,workflowStatus} from './lib/workflow.mjs';
import {summarizeStatus} from './lib/status-output.mjs';
const [action='status',target='.',...args]=process.argv.slice(2);
try {
  const options = {};
  for(let index=0;index<args.length;index++) {
    if(args[index]==='--summary') {options.summary=true;continue;}
    if(!['--prompt-file','--stage'].includes(args[index])||!args[index+1]||args[index+1].startsWith('--'))throw new Error('Expected --prompt-file path, --stage name or --summary.');
    options[args[index].slice(2)]=args[++index];
  }
  let result;
  if(action==='read'&&options['prompt-file']&&!options.stage)result=acknowledgeInput(target,options['prompt-file']);
  else if(action==='status'&&!options['prompt-file'])result=workflowStatus(target,{stage:options.stage??'implementation'});
  else throw new Error('Usage: workflow.mjs read PROJECT --prompt-file RELATIVE_PATH | status PROJECT --stage analysis|implementation|page|delivery');
  console.log(JSON.stringify(options.summary ? summarizeStatus(result) : result,null,2));process.exitCode=result.canProceed===false?2:0;
}catch(error){console.log(JSON.stringify({canProceed:false,status:'blocked',blockers:[{code:'workflow-error',message:error.message}]}));process.exitCode=2;}
