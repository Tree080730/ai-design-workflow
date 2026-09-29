#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const exists = (relative) => fs.existsSync(path.join(root, relative));
const isDirectory = (relative) => {
  try {
    return fs.statSync(path.join(root, relative)).isDirectory();
  } catch {
    return false;
  }
};

let packageJson = null;
if (exists('package.json')) {
  try {
    packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  } catch (error) {
    console.error(`Cannot parse package.json: ${error.message}`);
    process.exit(2);
  }
}

const dependencies = {
  ...(packageJson?.dependencies || {}),
  ...(packageJson?.devDependencies || {}),
};

const detected = [];
const frameworkSignals = [
  ['react', 'React'],
  ['vue', 'Vue'],
  ['svelte', 'Svelte'],
  ['next', 'Next.js'],
  ['vite', 'Vite'],
  ['@angular/core', 'Angular'],
  ['tailwindcss', 'Tailwind CSS'],
];
for (const [dependency, label] of frameworkSignals) {
  if (dependencies[dependency]) detected.push(label);
}

let packageManager = 'unknown';
if (exists('pnpm-lock.yaml')) packageManager = 'pnpm';
else if (exists('yarn.lock')) packageManager = 'yarn';
else if (exists('bun.lock') || exists('bun.lockb')) packageManager = 'bun';
else if (exists('package-lock.json')) packageManager = 'npm';

const sourceRoots = ['src', 'app', 'pages', 'packages'].filter(isDirectory);
const hasBusinessSkeleton = Boolean(packageJson && sourceRoots.length > 0);

const result = {
  root,
  mode: hasBusinessSkeleton ? 'existing-project-candidate' : 'zero-to-one-candidate',
  packageManager,
  technologySignals: detected,
  scripts: packageJson?.scripts || {},
  sourceRoots,
  conventions: {
    rules: ['RULES.md', 'docs/RULES.md'].filter(exists),
    developmentWorkflow: ['DEV-WORKFLOW.md', 'docs/DEV-WORKFLOW.md'].filter(exists),
    projectAdapter: [
      '.design-workflow/project-adapter.json',
      '.agent/project-adapter.md',
      '.codex/project-adapter.md',
    ].filter(exists),
    designSystem: ['design-system', 'docs/design-system', 'style-guide'].filter(isDirectory),
    components: ['src/components', 'app/components', 'components'].filter(isDirectory),
    pages: ['src/pages', 'app', 'pages'].filter(isDirectory),
    tests: ['test', 'tests', '__tests__', 'src/__tests__', 'e2e', 'playwright', 'cypress/e2e'].filter(isDirectory),
  },
  note: 'This is a structural snapshot. Confirm real business code and executable commands before updating the Project Adapter.',
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
