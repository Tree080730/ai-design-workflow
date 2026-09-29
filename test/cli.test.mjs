import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { checkProject } from '../packages/cli/src/check.mjs';
import { doctorProject } from '../packages/cli/src/doctor.mjs';
import { initProject } from '../packages/cli/src/init.mjs';
import { scanProject } from '../packages/cli/src/scan.mjs';

function temporaryProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-design-workflow-'));
}

function write(root, relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

test('scan detects an empty project', () => {
  const root = temporaryProject();
  try {
    const result = scanProject(root);
    assert.equal(result.mode, 'zero-to-one');
    assert.equal(result.adapter, 'generic');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('scan detects React and Vite', () => {
  const root = temporaryProject();
  try {
    write(
      root,
      'package.json',
      JSON.stringify({
        name: 'fixture',
        dependencies: { react: '^18.0.0' },
        devDependencies: { vite: '^5.0.0' },
        scripts: { dev: 'vite', build: 'vite build' },
      }),
    );
    write(root, 'src/App.tsx', 'export function App() { return <main />; }\n');
    const result = scanProject(root);
    assert.equal(result.mode, 'existing-project');
    assert.equal(result.adapter, 'react-vite');
    assert.deepEqual(result.technologySignals, ['React', 'Vite']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('init writes missing artifacts and does not overwrite by default', () => {
  const root = temporaryProject();
  try {
    write(root, 'RULES.md', '# Existing rules\n');
    const first = initProject(root);
    assert.ok(first.skipped.includes('RULES.md'));
    assert.equal(fs.readFileSync(path.join(root, 'RULES.md'), 'utf8'), '# Existing rules\n');
    assert.ok(fs.existsSync(path.join(root, '.design-workflow/project-adapter.json')));
    assert.ok(fs.existsSync(path.join(root, 'design-system/tokens/colors.json')));

    const second = initProject(root);
    assert.ok(second.skipped.includes('.design-workflow/project-adapter.json'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('check reports hardcoded colors and missing component documentation', () => {
  const root = temporaryProject();
  try {
    write(
      root,
      'package.json',
      JSON.stringify({ dependencies: { react: '^18.0.0' }, devDependencies: { vite: '^5.0.0' } }),
    );
    write(root, 'src/components/ProfileCard.tsx', "export const color = '#123456';\n");
    const result = checkProject(root);
    assert.equal(result.summary.p1, 1);
    assert.equal(result.summary.p2, 1);
    assert.equal(result.issues[1].expected, 'design-system/components/profile-card.md');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor is healthy after init', () => {
  const root = temporaryProject();
  try {
    initProject(root);
    const result = doctorProject(root);
    assert.equal(result.healthy, true);
    assert.ok(result.checks.every((entry) => entry.status !== 'error'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CLI strict mode exits with code 2 when issues exist', () => {
  const root = temporaryProject();
  try {
    write(root, 'package.json', JSON.stringify({ dependencies: { react: '^18.0.0' } }));
    write(root, 'src/components/Notice.tsx', "export const color = '#abcdef';\n");
    const cli = path.resolve('packages/cli/bin/design-workflow.mjs');
    const result = spawnSync(process.execPath, [cli, 'check', root, '--strict'], { encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.match(result.stdout, /Issues: 2/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CLI init and doctor complete an end-to-end setup', () => {
  const root = temporaryProject();
  try {
    const cli = path.resolve('packages/cli/bin/design-workflow.mjs');
    const initialized = spawnSync(process.execPath, [cli, 'init', root, '--json'], { encoding: 'utf8' });
    assert.equal(initialized.status, 0);
    assert.ok(JSON.parse(initialized.stdout).written.includes('RULES.md'));

    const diagnosed = spawnSync(process.execPath, [cli, 'doctor', root, '--json'], { encoding: 'utf8' });
    assert.equal(diagnosed.status, 0);
    assert.equal(JSON.parse(diagnosed.stdout).healthy, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});