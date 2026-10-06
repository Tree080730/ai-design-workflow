#!/usr/bin/env node
import {acknowledgeInput,workflowStatus} from './lib/workflow.mjs';
const [action='status',target='.',flag,value]=process.argv.slice(2);
try {
  let result;
  if(action==='read'&&flag==='--prompt-file'&&value)result=acknowledgeInput(target,value);
  else if(action==='status'&&(!flag||(flag==='--stage'&&value)))result=workflowStatus(target,{stage:value??'implementation'});
  else throw new Error('Usage: workflow.mjs read PROJECT --prompt-file RELATIVE_PATH | status PROJECT --stage analysis|implementation|page|delivery');
  console.log(JSON.stringify(result,null,2));process.exitCode=result.canProceed===false?2:0;
}catch(error){console.log(JSON.stringify({canProceed:false,status:'blocked',blockers:[{code:'workflow-error',message:error.message}]}));process.exitCode=2;}
