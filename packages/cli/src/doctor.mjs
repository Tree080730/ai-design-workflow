import path from 'node:path';
import { inspectReadiness } from './readiness.mjs';
import { pathExists, readJson } from './fs-utils.mjs';
import { scanProject } from './scan.mjs';

function normalized(value) {
  if (Array.isArray(value)) return [...value].sort();
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalized(entry)]),
    );
  }
  return value;
}

function adapterMismatches(adapter, scan) {
  const comparisons = [
    ['mode', adapter.mode, scan.mode],
    ['adapter', adapter.adapter, scan.adapter],
    ['packageManager', adapter.packageManager, scan.packageManager],
    ['technologies', adapter.technologies, scan.technologySignals],
    ['scripts', adapter.scripts, scan.scripts],
  ];

  const pathKeys = new Set([
    ...Object.keys(adapter.paths || {}),
    ...Object.keys(scan.conventions || {}),
  ]);
  for (const key of pathKeys) {
    comparisons.push([`paths.${key}`, adapter.paths?.[key] || [], scan.conventions?.[key] || []]);
  }

  return comparisons
    .filter(([, recorded, current]) => JSON.stringify(normalized(recorded)) !== JSON.stringify(normalized(current)))
    .map(([field]) => field);
}

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
      const mismatches = adapterMismatches(adapter, scan);
      checks.push({
        name: 'project-adapter',
        status: mismatches.length ? 'warn' : 'pass',
        message:
          mismatches.length === 0
            ? 'Project Adapter matches the current structural scan.'
            : `Project Adapter is stale. Changed fields: ${mismatches.join(', ')}. Run design-workflow init to refresh the generated Adapter without replacing existing project files.`,
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
    structureReady: checks.every((check) => check.status === 'pass'),
    readiness: inspectReadiness(scan),
    healthy: checks.every((check) => check.status !== 'error'),
    checks,
  };
}
