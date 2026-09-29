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
  const scan = scanProject(root);
  const written = [];
  const skipped = [];

  for (const [source, destination] of TEMPLATE_FILES) {
    const status = copyTemplate(source, path.join(root, destination), options.force);
    (status === 'written' ? written : skipped).push(destination);
  }

  const stateDirectory = path.join(root, '.design-workflow');
  fs.mkdirSync(path.join(stateDirectory, 'specs'), { recursive: true });
  const adapterPath = path.join(stateDirectory, 'project-adapter.json');
  if (!pathExists(adapterPath) || options.force) {
    writeJson(adapterPath, {
      schemaVersion: 1,
      harnessVersion: VERSION,
      projectName: scan.projectName,
      mode: scan.mode,
      adapter: scan.adapter,
      packageManager: scan.packageManager,
      technologies: scan.technologySignals,
      scripts: scan.scripts,
      paths: scan.conventions,
      verifiedAt: scan.scannedAt,
      source: 'Generated from a structural scan. Source code and configuration remain authoritative.',
    });
    written.push('.design-workflow/project-adapter.json');
  } else {
    skipped.push('.design-workflow/project-adapter.json');
  }

  const configPath = path.join(stateDirectory, 'config.json');
  if (!pathExists(configPath) || options.force) {
    writeJson(configPath, {
      schemaVersion: 1,
      adapter: scan.adapter,
      strictChecks: false,
      designSystemDirectory: 'design-system',
    });
    written.push('.design-workflow/config.json');
  } else {
    skipped.push('.design-workflow/config.json');
  }

  return { root, mode: scan.mode, adapter: scan.adapter, written, skipped };
}
