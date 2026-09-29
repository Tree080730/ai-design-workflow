import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathExists, writeJson } from './fs-utils.mjs';
import { scanProject } from './scan.mjs';
import { VERSION } from './version.mjs';

const templateRoot = fileURLToPath(new URL('../templates/', import.meta.url));

const TEMPLATE_FILES = [
  ['RULES.md', 'RULES.md'],
  ['DEV-WORKFLOW.md', 'DEV-WORKFLOW.md'],
  ['design-system/README.md', 'design-system/README.md'],
  ['design-system/layout.md', 'design-system/layout.md'],
  ['design-system/interaction.md', 'design-system/interaction.md'],
  ['design-system/tokens/colors.json', 'design-system/tokens/colors.json'],
  ['design-system/tokens/typography.json', 'design-system/tokens/typography.json'],
  ['design-system/tokens/spacing.json', 'design-system/tokens/spacing.json'],
  ['design-system/tokens/radius.json', 'design-system/tokens/radius.json'],
  ['design-system/tokens/tokens.css', 'design-system/tokens/tokens.css'],
  ['design-system/components/README.md', 'design-system/components/README.md'],
  ['design-system/pages/README.md', 'design-system/pages/README.md'],
];

function copyTemplate(sourceRelative, targetPath, force) {
  if (pathExists(targetPath) && !force) return 'skipped';
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(path.join(templateRoot, sourceRelative), targetPath);
  return pathExists(targetPath) ? 'written' : 'failed';
}

export function initProject(target = process.cwd(), options = {}) {
  const root = path.resolve(target);
  fs.mkdirSync(root, { recursive: true });
  const initialScan = scanProject(root);
  const written = [];
  const updated = [];
  const skipped = [];

  for (const [source, destination] of TEMPLATE_FILES) {
    const status = copyTemplate(source, path.join(root, destination), options.force);
    (status === 'written' ? written : skipped).push(destination);
  }

  const stateDirectory = path.join(root, '.design-workflow');
  fs.mkdirSync(path.join(stateDirectory, 'specs'), { recursive: true });
  const configPath = path.join(stateDirectory, 'config.json');
  if (!pathExists(configPath) || options.force) {
    writeJson(configPath, {
      schemaVersion: 1,
      adapter: initialScan.adapter,
      strictChecks: false,
      designSystemDirectory: 'design-system',
    });
    written.push('.design-workflow/config.json');
  } else {
    skipped.push('.design-workflow/config.json');
  }

  const refreshedScan = scanProject(root);
  const adapterPath = path.join(stateDirectory, 'project-adapter.json');
  const adapterExisted = pathExists(adapterPath);
  writeJson(adapterPath, {
    schemaVersion: 1,
    harnessVersion: VERSION,
    projectName: refreshedScan.projectName,
    mode: refreshedScan.mode,
    adapter: refreshedScan.adapter,
    packageManager: refreshedScan.packageManager,
    technologies: refreshedScan.technologySignals,
    scripts: refreshedScan.scripts,
    paths: {
      ...refreshedScan.conventions,
      projectAdapter: ['.design-workflow/project-adapter.json'],
    },
    verifiedAt: refreshedScan.scannedAt,
    source: 'Generated from a structural scan. Source code and configuration remain authoritative.',
  });
  (adapterExisted ? updated : written).push('.design-workflow/project-adapter.json');

  return {
    root,
    mode: refreshedScan.mode,
    adapter: refreshedScan.adapter,
    written,
    updated,
    skipped,
  };
}
