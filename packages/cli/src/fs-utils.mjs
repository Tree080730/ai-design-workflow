import fs from 'node:fs';
import path from 'node:path';

export function pathExists(filePath) {
  return fs.existsSync(filePath);
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function listFiles(root, options = {}) {
  const excluded = new Set(options.excluded || []);
  const output = [];

  function visit(current) {
    if (!fs.existsSync(current)) return;
    const stat = fs.statSync(current);
    if (stat.isFile()) {
      output.push(current);
      return;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory() && excluded.has(entry.name)) continue;
      visit(path.join(current, entry.name));
    }
  }

  visit(root);
  return output;
}

export function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

export function kebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}