import path from 'node:path';
import { checkProject } from './check.mjs';
import { doctorProject } from './doctor.mjs';
import { initProject } from './init.mjs';
import { scanProject } from './scan.mjs';
import { VERSION } from './version.mjs';

const HELP = `AI Design Workflow v${VERSION}

Usage:
  design-workflow <command> [project] [options]

Commands:
  init     Create missing workflow and design-system artifacts
  scan     Print a read-only project snapshot
  check    Check token usage and design documentation coverage
  doctor   Diagnose the harness and project setup

Options:
  --json    Print machine-readable JSON
  --force   Allow init to overwrite managed files
  --strict  Make check exit non-zero when issues are found
  --help    Show help
  --version Show the CLI version
`;

function parseArguments(args) {
  const options = {
    json: args.includes('--json'),
    force: args.includes('--force'),
    strict: args.includes('--strict'),
  };
  const positional = args.filter((arg) => !arg.startsWith('--'));
  return { command: positional[0], target: positional[1] || '.', options };
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
  console.log(`Skipped: ${result.skipped.length ? result.skipped.join(', ') : 'none'}`);
}

function printCheck(result) {
  console.log(`Checked ${result.summary.filesScanned} source files.`);
  console.log(`Issues: ${result.summary.issues} (P0 ${result.summary.p0}, P1 ${result.summary.p1}, P2 ${result.summary.p2})`);
  for (const issue of result.issues) {
    const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
    console.log(`- [${issue.severity}] ${location} — ${issue.message}`);
  }
}

function printDoctor(result) {
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

  const { command, target, options } = parseArguments(args);
  const resolved = path.resolve(target);
  let result;

  if (command === 'init') result = initProject(resolved, options);
  else if (command === 'scan') result = scanProject(resolved);
  else if (command === 'check') result = checkProject(resolved);
  else if (command === 'doctor') result = doctorProject(resolved);
  else throw new Error(`Unknown command: ${command}. Run with --help.`);

  if (options.json) console.log(JSON.stringify(result, null, 2));
  else if (command === 'init') printInit(result);
  else if (command === 'scan') printScan(result);
  else if (command === 'check') printCheck(result);
  else printDoctor(result);

  if (command === 'check' && options.strict && result.summary.issues > 0) process.exitCode = 2;
  if (command === 'doctor' && !result.healthy) process.exitCode = 2;
}