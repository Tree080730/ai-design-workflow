import path from 'node:path';
import { pathExists, readJson } from './fs-utils.mjs';
import { scanProject } from './scan.mjs';

export function doctorProject(target = process.cwd()) {
  const scan = scanProject(target);
  const checks = [];
  const major = Number(process.versions.node.split('.')[0]);
  checks.push({
    name: 'node-version',
    status: major >= 18 ? 'pass' : 'error',
    message: `Node.js ${process.versions.node}; version 18 or newer is required.`,
  });

  checks.push({
    name: 'project-detection',
    status: 'pass',
    message: `Detected ${scan.mode} with ${scan.adapter} adapter.`,
  });

  const adapterPath = path.join(scan.root, '.design-workflow/project-adapter.json');
  if (!pathExists(adapterPath)) {
    checks.push({
      name: 'project-adapter',
      status: 'warn',
      message: 'Project Adapter is missing. Run design-workflow init.',
    });
  } else {
    try {
      const adapter = readJson(adapterPath);
      checks.push({
        name: 'project-adapter',
        status: adapter.adapter === scan.adapter ? 'pass' : 'warn',
        message:
          adapter.adapter === scan.adapter
            ? 'Project Adapter matches the current structural scan.'
            : `Adapter records ${adapter.adapter}, but the current scan detects ${scan.adapter}.`,
      });
    } catch (error) {
      checks.push({ name: 'project-adapter', status: 'error', message: error.message });
    }
  }

  for (const [name, candidates] of [
    ['rules', scan.conventions.rules],
    ['development-workflow', scan.conventions.developmentWorkflow],
    ['design-system', scan.conventions.designSystem],
  ]) {
    checks.push({
      name,
      status: candidates.length ? 'pass' : 'warn',
      message: candidates.length ? `Found: ${candidates.join(', ')}` : `No ${name} artifact found.`,
    });
  }

  return {
    root: scan.root,
    healthy: checks.every((check) => check.status !== 'error'),
    checks,
  };
}
