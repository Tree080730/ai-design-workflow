import fs from 'node:fs';
import { readProjectConfig } from './config.mjs';
import path from 'node:path';
import { listFiles, pathExists, readJson, toPosix } from './fs-utils.mjs';

const SOURCE_ROOTS = ['src', 'app', 'pages', 'packages'];
const TEST_ROOTS = ['test', 'tests', '__tests__', 'src/__tests__', 'e2e', 'playwright', 'cypress/e2e'];

function existingDirectories(root, candidates) {
  return candidates.filter((relative) => {
    try {
      return fs.statSync(path.join(root, relative)).isDirectory();
    } catch {
      return false;
    }
  });
}

function existingFiles(root, candidates) {
  return candidates.filter((relative) => pathExists(path.join(root, relative)));
}

function detectPackageManager(root, packageJson) {
  const declared = packageJson?.packageManager?.split('@')[0];
  if (declared) return declared;
  if (pathExists(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (pathExists(path.join(root, 'yarn.lock'))) return 'yarn';
  if (pathExists(path.join(root, 'bun.lock')) || pathExists(path.join(root, 'bun.lockb'))) return 'bun';
  if (pathExists(path.join(root, 'package-lock.json'))) return 'npm';
  return 'unknown';
}

function detectTechnologies(dependencies) {
  const signals = [
    ['react', 'React'],
    ['vue', 'Vue'],
    ['svelte', 'Svelte'],
    ['next', 'Next.js'],
    ['vite', 'Vite'],
    ['@angular/core', 'Angular'],
    ['tailwindcss', 'Tailwind CSS'],
  ];
  return signals.filter(([name]) => dependencies[name]).map(([, label]) => label);
}

export function scanProject(target = process.cwd()) {
  const root = path.resolve(target);
  if (!pathExists(root)) throw new Error(`Project path does not exist: ${root}`);

  const config = readProjectConfig(root);
  const packagePath = path.join(root, 'package.json');
  let packageJson = null;
  if (pathExists(packagePath)) {
    try {
      packageJson = readJson(packagePath);
    } catch (error) {
      throw new Error(`Cannot parse ${packagePath}: ${error.message}`);
    }
  }

  const dependencies = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };
  const technologySignals = detectTechnologies(dependencies);
  const sourceRoots = existingDirectories(root, SOURCE_ROOTS);
  const sourceFiles = sourceRoots.flatMap((relative) =>
    listFiles(path.join(root, relative), {
      excluded: ['node_modules', 'dist', 'build', '.next', 'coverage'],
    }),
  );
  const hasBusinessCode = sourceFiles.some((file) =>
    /\.(?:[cm]?[jt]sx?|vue|svelte|css|scss|less)$/.test(file),
  );

  let adapter = 'generic';
  if (technologySignals.includes('React') && technologySignals.includes('Vite')) {
    adapter = 'react-vite';
  }

  const designSystems = existingDirectories(root, config.designSystemDirectory
    ? [config.designSystemDirectory]
    : ['design-system', 'docs/design-system', 'style-guide']);
  const designSystemDirectory = config.designSystemDirectory || designSystems[0] || 'design-system';

  return {
    config: { ...config, designSystemDirectory },
    schemaVersion: 1,
    root,
    projectName: packageJson?.name || path.basename(root),
    mode: packageJson && hasBusinessCode ? 'existing-project' : 'zero-to-one',
    adapter,
    packageManager: detectPackageManager(root, packageJson),
    technologySignals,
    scripts: packageJson?.scripts || {},
    sourceRoots,
    conventions: {
      rules: existingFiles(root, ['RULES.md', 'docs/RULES.md']),
      developmentWorkflow: existingFiles(root, ['DEV-WORKFLOW.md', 'docs/DEV-WORKFLOW.md']),
      projectAdapter: existingFiles(root, [
        '.design-workflow/project-adapter.json',
        '.agent/project-adapter.md',
        '.codex/project-adapter.md',
      ]),
      designSystem: designSystems,
      components: existingDirectories(root, ['src/components', 'app/components', 'components']),
      pages: existingDirectories(root, ['src/pages', 'app', 'pages']),
      tests: existingDirectories(root, TEST_ROOTS),
    },
    fileCount: sourceFiles.length,
    sourceFiles: sourceFiles.slice(0, 100).map((file) => toPosix(path.relative(root, file))),
    scannedAt: new Date().toISOString(),
  };
}
