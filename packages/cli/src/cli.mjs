import path from 'node:path';
import { readJson } from './fs-utils.mjs';
import { createTask, runTaskCheck, recordTaskEvidence, taskStatus, finishTask, recoverTask, listTasks } from './tasks.mjs';
import { checkProject } from './check.mjs';
import { doctorProject } from './doctor.mjs';
import { initProject } from './init.mjs';
import { scanProject } from './scan.mjs';
import { buildTokens } from './tokens.mjs';
import { executeDelivery, deliveryExitCode } from './delivery.mjs';
import { VERSION } from './version.mjs';

const HELP = `AI Design Workflow v${VERSION}

Usage:
  design-workflow <command> [project] [options]

Commands:
  init     Create missing workflow and design-system artifacts
  scan     Print a read-only project snapshot
  check    Check token usage and design documentation coverage
  tokens   Export configured JSON tokens to runtime CSS
  delivery Verify required scope, source, Gallery and delivery evidence
  task     Track acceptance checks, evidence, completion and recovery
  doctor   Diagnose the harness and project setup

Delivery usage:
  design-workflow delivery prepare [project]
  design-workflow delivery run [project] --check criterion-id
  design-workflow delivery record [project] --file evidence.json
  design-workflow delivery status [project] --json
  design-workflow delivery recover [project]

Task usage:
  design-workflow task list [project]
  design-workflow task create [project] --file plan.json
  design-workflow task run [project] --task id --check criterion-id
  design-workflow task record [project] --task id --file evidence.json
  design-workflow task status [project] --task id
  design-workflow task finish [project] --task id
  design-workflow task recover [project] --task id

Options:
  --json    Print machine-readable JSON
  --force   Allow init or tokens to replace existing output files
  --strict  Make check exit non-zero when issues are found
  --help    Show help
  --version Show the CLI version
`;

function parseArguments(args) {
  const options = {};
  const positional = [];
  for (let index=0;index<args.length;index++) {
    const argument=args[index];
    if (['--json','--force','--strict'].includes(argument)) options[argument.slice(2)]=true;
    else if (['--file','--task','--check'].includes(argument)) {
      const value=args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`);
      options[argument.slice(2)]=value;
    } else if (argument.startsWith('--')) throw new Error(`Unknown option: ${argument}`);
    else positional.push(argument);
  }
  const command=positional[0];
  if (positional.length > (['task','delivery'].includes(command)?3:2)) throw new Error('Too many positional arguments.');
  return {command,action:['task','delivery'].includes(command)?positional[1]:undefined,target:positional[['task','delivery'].includes(command)?2:1] || '.',options};
}
function printTask(result) {
  if (result.tasks) {
    for (const task of result.tasks) console.log(`${task.id}: ${task.status} — ${task.title}; blockers: ${task.blockers.map(item=>item.id).join(', ') || 'none'}`);
    for (const error of result.errors) console.log(`ERROR ${error.id}: ${error.message}`);
    return;
  }
  console.log(`Task ${result.id}: ${result.status}; risk: ${result.risk}`);
  for (const item of result.criteria) {
    console.log(`- ${item.id}: ${item.status} (${item.required?'required':'optional'}) — ${item.title}`);
    for (const artifact of item.latest?.artifacts || []) console.log(`  Evidence: ${artifact.file}`);
  }
  for (const action of result.nextActions) console.log(`Next: ${action}`);
  console.log(`Resume from ${result.stateFile}`);
  console.log(result.scope);
}

function printScan(result) {
  console.log(`Project: ${result.projectName}`);
  console.log(`Mode: ${result.mode}`);
  console.log(`Adapter: ${result.adapter}`);
  console.log(`Package manager: ${result.packageManager}`);
  console.log(`Technologies: ${result.technologySignals.join(', ') || 'unknown'}`);
  console.log(`Source files: ${result.fileCount}`);
}

function printInit(result) {
  console.log(`Initialized ${result.root}`);
  console.log(`Mode: ${result.mode}; adapter: ${result.adapter}`);
  console.log(`Written: ${result.written.length ? result.written.join(', ') : 'none'}`);
  console.log(`Updated: ${result.updated.length ? result.updated.join(', ') : 'none'}`);
  console.log(`Skipped: ${result.skipped.length ? result.skipped.join(', ') : 'none'}`);
}

function printCheck(result) {
  console.log(`Tokens: ${result.tokenChecks.status}. ${result.tokenChecks.scope}`);
  console.log(`Checked ${result.summary.filesScanned} source files.`);
  console.log(`Issues: ${result.summary.issues} (P0 ${result.summary.p0}, P1 ${result.summary.p1}, P2 ${result.summary.p2})`);
  for (const issue of result.issues) {
    const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
    console.log(`- [${issue.severity}] ${location} — ${issue.message}`);
  }
}

function printDoctor(result) {
  console.log(`Structure: ${result.structureReady ? 'complete' : 'incomplete'}; constraints: ${result.readiness.status}`);
  console.log(result.readiness.scope);
  for (const finding of result.readiness.findings) console.log(`- ${finding.file}: ${finding.message}`);
  for (const check of result.checks) {
    console.log(`${check.status.toUpperCase().padEnd(5)} ${check.name}: ${check.message}`);
  }
}

export async function runCli(args) {
  if (!args.length || args.includes('--help')) {
    console.log(HELP);
    return;
  }
  if (args.includes('--version')) {
    console.log(VERSION);
    return;
  }

  const { command, action, target, options } = parseArguments(args);
  const resolved = path.resolve(target);
  let result;

  if (command === 'delivery') result = executeDelivery(resolved, action, options);
  else if (command === 'task') {
    if (['create','record'].includes(action) && !options.file) throw new Error('--file is required.');
    if (!['create','list'].includes(action) && !options.task) throw new Error('--task is required.');
    if (action === 'list') result = listTasks(resolved);
    else if (action === 'create') result = createTask(resolved, readJson(path.resolve(options.file)));
    else if (action === 'run') result = runTaskCheck(resolved, options.task, options.check);
    else if (action === 'record') result = recordTaskEvidence(resolved, options.task, readJson(path.resolve(options.file)));
    else if (action === 'status') result = taskStatus(resolved, options.task);
    else if (action === 'finish') result = finishTask(resolved, options.task);
    else if (action === 'recover') result = recoverTask(resolved, options.task);
    else throw new Error(`Unknown task action: ${action}`);
  }
  else if (command === 'tokens') result = buildTokens(resolved, options);
  else if (command === 'init') result = initProject(resolved, options);
  else if (command === 'scan') result = scanProject(resolved);
  else if (command === 'check') result = checkProject(resolved);
  else if (command === 'doctor') result = doctorProject(resolved);
  else throw new Error(`Unknown command: ${command}. Run with --help.`);

  if (options.json) console.log(JSON.stringify(result, null, 2));
  else if (command === 'delivery') {
    console.log(`Delivery: ${result.status}; can finish: ${result.canFinish}`);
    for (const item of result.blockers) console.log(`- ${item.file}: ${item.message}`);
    for (const item of result.warnings) console.log(`Warning: ${item.file}: ${item.message}`);
  }
  else if (command === 'task') printTask(result);
  else if (command === 'tokens') {
    console.log(`Exported ${result.tokenCount} tokens to ${result.outputFile}`);
    console.log(result.integration);
  }
  else if (command === 'init') printInit(result);
  else if (command === 'scan') printScan(result);
  else if (command === 'check') printCheck(result);
  else printDoctor(result);

  if (command === 'delivery') process.exitCode = deliveryExitCode(action, result);
  if (command === 'check' && (options.strict || result.strictChecks) && result.summary.issues > 0) process.exitCode = 2;
  if (command === 'task' && ((action === 'finish' && result.finishBlocked) || (action === 'run' && result.criteria.find(item=>item.id===options.check)?.status !== 'passed'))) process.exitCode = 2;
  if (command === 'doctor' && !result.healthy) process.exitCode = 2;
}
