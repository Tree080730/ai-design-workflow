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

test('scan and Adapter detect common end-to-end test directories', () => {
  const root = temporaryProject();
  try {
    write(
      root,
      'package.json',
      JSON.stringify({
        name: 'e2e-fixture',
        dependencies: { react: '^18.0.0' },
        devDependencies: { vite: '^5.0.0', '@playwright/test': '^1.50.0' },
        scripts: { dev: 'vite', 'test:e2e': 'playwright test' },
      }),
    );
    write(root, 'src/App.tsx', 'export function App() { return <main />; }\n');
    write(root, 'e2e/app.spec.ts', "test('flow', () => {});\n");
    write(root, 'cypress/e2e/smoke.cy.ts', "describe('flow', () => {});\n");

    const scan = scanProject(root);
    assert.deepEqual(scan.conventions.tests, ['e2e', 'cypress/e2e']);

    initProject(root);
    const adapter = JSON.parse(fs.readFileSync(path.join(root, '.design-workflow/project-adapter.json'), 'utf8'));
    assert.deepEqual(adapter.paths.tests, ['e2e', 'cypress/e2e']);
    assert.equal(adapter.scripts['test:e2e'], 'playwright test');
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
    assert.match(
      fs.readFileSync(path.join(root, 'design-system/layout.md'), 'utf8'),
      /Geometry and alignment contract/,
    );
    assert.match(
      fs.readFileSync(path.join(root, 'DEV-WORKFLOW.md'), 'utf8'),
      /verify the complete state loop/,
    );
    const adapter = JSON.parse(
      fs.readFileSync(path.join(root, '.design-workflow/project-adapter.json'), 'utf8'),
    );
    assert.deepEqual(adapter.paths.rules, ['RULES.md']);
    assert.deepEqual(adapter.paths.developmentWorkflow, ['DEV-WORKFLOW.md']);
    assert.deepEqual(adapter.paths.projectAdapter, ['.design-workflow/project-adapter.json']);
    assert.deepEqual(adapter.paths.designSystem, ['design-system']);

    const second = initProject(root);
    assert.ok(second.updated.includes('.design-workflow/project-adapter.json'));
    assert.equal(fs.readFileSync(path.join(root, 'RULES.md'), 'utf8'), '# Existing rules\n');
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
    assert.ok(result.checks.every((entry) => entry.status === 'pass'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor reports an Adapter that drifted from the project', () => {
  const root = temporaryProject();
  try {
    initProject(root);
    fs.mkdirSync(path.join(root, 'src/components'), { recursive: true });
    const result = doctorProject(root);
    const adapterCheck = result.checks.find((entry) => entry.name === 'project-adapter');
    assert.equal(adapterCheck.status, 'warn');
    assert.match(adapterCheck.message, /paths\.components/);

    const refreshed = initProject(root);
    assert.ok(refreshed.updated.includes('.design-workflow/project-adapter.json'));
    const afterRefresh = doctorProject(root);
    const refreshedCheck = afterRefresh.checks.find((entry) => entry.name === 'project-adapter');
    assert.equal(refreshedCheck.status, 'pass');
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
    assert.match(
      fs.readFileSync(path.join(root, 'RULES.md'), 'utf8'),
      /presence of a control alone is not evidence/,
    );

    const diagnosed = spawnSync(process.execPath, [cli, 'doctor', root, '--json'], { encoding: 'utf8' });
    assert.equal(diagnosed.status, 0);
    assert.equal(JSON.parse(diagnosed.stdout).healthy, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('custom design system and discovered source directories work across init, scan and check', () => {
  const root = temporaryProject();
  try {
    write(root, '.design-workflow/config.json', JSON.stringify({schemaVersion: 1, designSystemDirectory: 'docs/ui', strictChecks: true}));
    write(root, 'package.json', JSON.stringify({packageManager: 'pnpm@9.0.0'}));
    write(root, 'components/Card.tsx', 'export const Card = () => <div />;');
    write(root, 'pages/Home.tsx', 'export const Home = () => <main />;');
    write(root, 'docs/ui/components/card.md', '# Existing Card');
    const result = initProject(root);
    assert.ok(result.written.includes('docs/ui/layout.md'));
    assert.equal(fs.existsSync(path.join(root, 'design-system')), false);
    assert.equal(fs.readFileSync(path.join(root, 'docs/ui/components/card.md'), 'utf8'), '# Existing Card');
    assert.match(fs.readFileSync(path.join(root, 'RULES.md'), 'utf8'), /docs\/ui\//);
    assert.deepEqual(scanProject(root).conventions.designSystem, ['docs/ui']);
    assert.equal(scanProject(root).packageManager, 'pnpm');
    const issues = checkProject(root).issues;
    assert.equal(issues.length, 1);
    assert.equal(issues[0].expected, 'docs/ui/pages/home.md');
    assert.equal(doctorProject(root).structureReady, true);
    const cli = path.resolve('packages/cli/bin/design-workflow.mjs');
    assert.equal(spawnSync(process.execPath, [cli, 'check', root]).status, 2);
    write(root, 'docs/ui/pages/home.md', '# Home');
    assert.equal(spawnSync(process.execPath, [cli, 'check', root]).status, 0);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});

test('init adopts an existing design system without creating a competing default', () => {
  const root = temporaryProject();
  try {
    write(root, 'docs/design-system/README.md', '# Existing');
    initProject(root);
    assert.equal(scanProject(root).config.designSystemDirectory, 'docs/design-system');
    assert.equal(fs.existsSync(path.join(root, 'design-system')), false);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});

test('invalid config is rejected before init writes managed files', () => {
  for (const config of [{strictChecks:'yes'}, {schemaVersion:2}, {designSystemDirectory:'../outside'}, {designSystemDirectory:'/tmp/ui'}, {designSystemDirectory:'.'}, []]) {
    const root = temporaryProject();
    try {
      write(root, '.design-workflow/config.json', JSON.stringify(config));
      assert.throws(() => initProject(root));
      assert.equal(fs.existsSync(path.join(root, 'RULES.md')), false);
    } finally { fs.rmSync(root, {recursive:true, force:true}); }
  }
});

test('structural health never certifies starter constraints or page quality', () => {
  const root = temporaryProject();
  try {
    initProject(root);
    const result = doctorProject(root);
    assert.equal(result.healthy, true);
    assert.equal(result.structureReady, true);
    assert.equal(result.readiness.status, 'needs-review');
    assert.ok(result.readiness.findings.some(x => x.type === 'starter-token'));
    assert.ok(result.readiness.findings.some(x => x.type === 'unresolved-constraint'));
    fs.rmSync(path.join(root, 'design-system/tokens'), {recursive:true});
    for (const name of ['README.md','layout.md','interaction.md']) write(root, `design-system/${name}`, '# Project-specific constraint');
    assert.equal(doctorProject(root).readiness.status, 'unverified');
    fs.rmSync(path.join(root, 'design-system/layout.md'));
    assert.ok(doctorProject(root).readiness.findings.some(x=>x.type==='missing-constraint'));
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('standalone Skill scanner stays synchronized and reports the same facts', () => {
  for (const name of ['scan.mjs','config.mjs','fs-utils.mjs','tasks.mjs','delivery.mjs']) {
    assert.equal(fs.readFileSync(`skills/designer-dev-workflow/scripts/lib/${name}`, 'utf8'), fs.readFileSync(`packages/cli/src/${name}`, 'utf8'), `Run npm run sync:skill-scanner after changing ${name}`);
  }
  const root = temporaryProject();
  try {
    write(root, 'package.json', JSON.stringify({packageManager:'pnpm@9',dependencies:{react:'*',vite:'*'}}));
    fs.mkdirSync(path.join(root, 'src'), {recursive:true});
    write(root, '.design-workflow/config.json', JSON.stringify({designSystemDirectory:'docs/ui'}));
    const fallback = spawnSync(process.execPath, [path.resolve('skills/designer-dev-workflow/scripts/scan-project.mjs'), root], {encoding:'utf8'});
    assert.equal(fallback.status, 0);
    const actual = JSON.parse(fallback.stdout);
    const expected = scanProject(root);
    delete actual.scannedAt;
    delete expected.scannedAt;
    assert.deepEqual(actual, expected);
    assert.equal(actual.mode, 'zero-to-one');
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('app components are not also checked as pages', () => {
  const root = temporaryProject();
  try {
    write(root, 'app/components/Button.tsx', 'export const Button = () => <button />;');
    write(root, 'app/Home.tsx', 'export const Home = () => <main />;');
    const issues = checkProject(root).issues;
    assert.deepEqual(issues.map(x=>x.expected).sort(), ['design-system/components/button.md','design-system/pages/home.md']);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('ambiguous design systems require explicit selection before initialization', () => {
  const root = temporaryProject();
  try {
    write(root, 'design-system/README.md', '# One');
    write(root, 'docs/design-system/README.md', '# Two');
    assert.ok(doctorProject(root).readiness.findings.some(x=>x.type==='ambiguous-design-system'));
    assert.throws(()=>initProject(root), /Multiple design systems/);
    assert.equal(fs.existsSync(path.join(root, 'RULES.md')), false);
    write(root, '.design-workflow/config.json', JSON.stringify({designSystemDirectory:'docs/design-system'}));
    initProject(root);
    assert.deepEqual(scanProject(root).conventions.designSystem, ['docs/design-system']);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('forced init preserves configuration and adopts the configured directory', () => {
  const root = temporaryProject();
  try {
    write(root, '.design-workflow/config.json', JSON.stringify({schemaVersion:1,strictChecks:true,designSystemDirectory:'docs/ui',extension:{enabled:true}}));
    write(root, 'docs/ui/layout.md', '# Existing layout');
    initProject(root, {force:true});
    const config = JSON.parse(fs.readFileSync(path.join(root,'.design-workflow/config.json'),'utf8'));
    assert.equal(config.strictChecks, true);
    assert.equal(config.designSystemDirectory, 'docs/ui');
    assert.deepEqual(config.extension, {enabled:true});
    assert.match(fs.readFileSync(path.join(root,'docs/ui/layout.md'),'utf8'), /Geometry and alignment contract/);
    assert.equal(fs.existsSync(path.join(root,'design-system')), false);
    assert.equal(doctorProject(root).structureReady, true);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
