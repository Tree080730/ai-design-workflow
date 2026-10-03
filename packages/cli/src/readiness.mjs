import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listFiles, pathExists, toPosix } from './fs-utils.mjs';

const templates = fileURLToPath(new URL('../templates/design-system/', import.meta.url));

// This detects known incomplete inputs; it never certifies design or business quality.
export function inspectReadiness(scan) {
  const directory = scan.config.designSystemDirectory;
  const absolute = path.join(scan.root, directory);
  const findings = [];
  for (const name of ['README.md', 'layout.md', 'interaction.md']) {
    if (!pathExists(path.join(absolute, name))) findings.push({ type: 'missing-constraint', file: `${directory}/${name}`, message: 'Constraint document is missing.' });
  }
  if (scan.conventions.designSystem.length > 1) findings.push({ type: 'ambiguous-design-system', file: directory, message: 'Multiple design systems found; configure designSystemDirectory explicitly.' });
  const files = listFiles(absolute, { excluded: ['node_modules', '.git', 'dist'] });
  for (const file of files) {
    if (!/\.(md|json|css)$/.test(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const relative = toPosix(path.relative(absolute, file));
    const template = path.join(templates, relative);
    if (relative.startsWith('tokens/') && pathExists(template) && content === fs.readFileSync(template, 'utf8')) {
      findings.push({ type: 'starter-token', file: `${directory}/${relative}`, message: 'Unmodified starter token asset; product evidence and runtime integration need review.' });
    }
    if (/\[(?:confirm[^\]]*|to confirm)\]|待确认/i.test(content)) {
      findings.push({ type: 'unresolved-constraint', file: `${directory}/${relative}`, message: 'Unresolved constraint marker found.' });
    }
  }
  return {
    status: findings.length ? 'needs-review' : 'unverified',
    scope: 'Constraint input diagnostics only; runtime integration, rendered pages and business behavior are not verified.',
    findings,
  };
}
