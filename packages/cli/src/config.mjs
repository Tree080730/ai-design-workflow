import path from 'node:path';
import { pathExists, readJson, toPosix } from './fs-utils.mjs';

export function projectRelativePath(value, label) {
  if (typeof value !== 'string' || !value.trim() || path.isAbsolute(value)) throw new Error(`${label} must be a project-relative path.`);
  const normalized = toPosix(path.normalize(value));
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) throw new Error(`${label} must stay inside the project.`);
  return normalized;
}

export function readProjectConfig(root) {
  const file = path.join(root, '.design-workflow/config.json');
  const config = pathExists(file) ? readJson(file) : {};
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error(`Invalid config: ${file}`);
  if (config.schemaVersion !== undefined && config.schemaVersion !== 1) throw new Error('Unsupported config schemaVersion.');
  if (config.strictChecks !== undefined && typeof config.strictChecks !== 'boolean') throw new Error('strictChecks must be a boolean.');
  const directory = config.designSystemDirectory === undefined ? undefined : projectRelativePath(config.designSystemDirectory,'designSystemDirectory');
  return { ...config, strictChecks: config.strictChecks ?? false, designSystemDirectory: directory };
}
