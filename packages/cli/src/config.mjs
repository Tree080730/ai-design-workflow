import path from 'node:path';
import { pathExists, readJson, toPosix } from './fs-utils.mjs';

export function projectRelativePath(value, label) {
  if (typeof value !== 'string' || !value.trim() || path.isAbsolute(value)) throw new Error(`${label} must be a project-relative path.`);
  const normalized = toPosix(path.normalize(value));
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) throw new Error(`${label} must stay inside the project.`);
  return normalized;
}

function pathList(value, label) {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label} must be a nonempty array.`);
  return [...new Set(value.map(item => projectRelativePath(item,label)))];
}

export function readProjectConfig(root) {
  const file = path.join(root, '.design-workflow/config.json');
  const config = pathExists(file) ? readJson(file) : {};
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error(`Invalid config: ${file}`);
  if (config.schemaVersion !== undefined && config.schemaVersion !== 1) throw new Error('Unsupported config schemaVersion.');
  if (config.strictChecks !== undefined && typeof config.strictChecks !== 'boolean') throw new Error('strictChecks must be a boolean.');
  const directory = config.designSystemDirectory === undefined ? undefined : projectRelativePath(config.designSystemDirectory,'designSystemDirectory');
  let tokens;
  if (config.tokens !== undefined) {
    const value = config.tokens;
    if (!value || typeof value !== 'object' || !['managed','external'].includes(value.mode)) throw new Error('tokens.mode must be managed or external.');
    tokens = {...value, entryFiles:pathList(value.entryFiles,'tokens.entryFiles')};
    if (value.mode === 'managed') {
      tokens.sourceDirectory = projectRelativePath(value.sourceDirectory,'tokens.sourceDirectory');
      tokens.outputFile = projectRelativePath(value.outputFile,'tokens.outputFile');
      if (!tokens.outputFile.endsWith('.css')) throw new Error('tokens.outputFile must be a CSS file.');
    } else {
      tokens.definitionFiles = pathList(value.definitionFiles,'tokens.definitionFiles');
      if (tokens.definitionFiles.some(file=>!file.endsWith('.css'))) throw new Error('tokens.definitionFiles must contain CSS files.');
    }
    if (value.externalTokens !== undefined && (!Array.isArray(value.externalTokens) || value.externalTokens.some(name=>typeof name !== 'string' || !/^--[a-zA-Z0-9_-]+$/.test(name)))) throw new Error('tokens.externalTokens must contain CSS custom property names.');
  }
  const assetManifest = config.assetManifest === undefined ? undefined : projectRelativePath(config.assetManifest,'assetManifest');
  return { ...config, strictChecks: config.strictChecks ?? false, designSystemDirectory: directory, ...(tokens ? {tokens} : {}), ...(assetManifest ? {assetManifest} : {}) };
}
