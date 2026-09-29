import fs from 'node:fs';
import path from 'node:path';
import { kebabCase, listFiles, pathExists, toPosix } from './fs-utils.mjs';
import { scanProject } from './scan.mjs';

const SOURCE_EXTENSIONS = new Set(['.css', '.scss', '.less', '.jsx', '.tsx', '.vue', '.svelte']);
const COMPONENT_EXTENSIONS = new Set(['.jsx', '.tsx', '.vue', '.svelte']);
const EXCLUDED_DIRECTORIES = ['node_modules', 'dist', 'build', '.next', 'coverage', '.git', '.design-workflow'];
const COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/g;

function isTokenDefinition(file) {
  const normalized = toPosix(file).toLowerCase();
  return /(?:^|\/)(?:tokens?|theme|variables)(?:[./_-]|$)/.test(normalized);
}

function scanHardcodedColors(root, sourceRoots) {
  const issues = [];
  for (const relativeRoot of sourceRoots) {
    const absoluteRoot = path.join(root, relativeRoot);
    for (const file of listFiles(absoluteRoot, { excluded: EXCLUDED_DIRECTORIES })) {
      if (!SOURCE_EXTENSIONS.has(path.extname(file)) || isTokenDefinition(file)) continue;
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((line, index) => {
        const matches = [...line.matchAll(COLOR_PATTERN)];
        for (const match of matches) {
          issues.push({
            severity: 'P1',
            type: 'hardcoded-color',
            file: toPosix(path.relative(root, file)),
            line: index + 1,
            value: match[0],
            message: 'Confirm whether this value should use an existing semantic color token.',
          });
        }
      });
    }
  }
  return issues;
}

function documentationCoverage(root, sourceDirectory, documentationDirectory, type) {
  const absoluteSource = path.join(root, sourceDirectory);
  if (!pathExists(absoluteSource)) return [];
  const issues = [];
  for (const file of listFiles(absoluteSource, { excluded: EXCLUDED_DIRECTORIES })) {
    const extension = path.extname(file);
    if (!COMPONENT_EXTENSIONS.has(extension)) continue;
    const base = path.basename(file, extension);
    if (/^(?:index|types?|.*(?:test|spec|stories|preview))$/i.test(base)) continue;
    const slug = kebabCase(base);
    const expected = path.join(root, documentationDirectory, `${slug}.md`);
    if (!pathExists(expected)) {
      issues.push({
        severity: 'P2',
        type: 'missing-design-documentation',
        file: toPosix(path.relative(root, file)),
        expected: toPosix(path.relative(root, expected)),
        message: `No ${type} design-system document was found.`,
      });
    }
  }
  return issues;
}

export function checkProject(target = process.cwd()) {
  const scan = scanProject(target);
  const root = scan.root;
  const issues = [
    ...scanHardcodedColors(root, scan.sourceRoots),
    ...documentationCoverage(root, 'src/components', 'design-system/components', 'component'),
    ...documentationCoverage(root, 'src/pages', 'design-system/pages', 'page'),
  ];
  return {
    root,
    adapter: scan.adapter,
    summary: {
      filesScanned: scan.fileCount,
      issues: issues.length,
      p0: issues.filter((issue) => issue.severity === 'P0').length,
      p1: issues.filter((issue) => issue.severity === 'P1').length,
      p2: issues.filter((issue) => issue.severity === 'P2').length,
    },
    issues,
  };
}