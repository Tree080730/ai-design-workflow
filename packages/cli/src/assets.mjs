import path from 'node:path';
import fs from 'node:fs';
import { pathExists, readJson } from './fs-utils.mjs';
import { projectRelativePath } from './config.mjs';

export function checkAssets(scan) {
  const file = scan.config.assetManifest;
  if (!file) return {status:'unconfigured',assets:[],issues:[]};
  const assets = [];
  const issues = [];
  const issue = (type, location, message) => issues.push({type,file:location,message,severity:'P2'});
  try {
    const manifest = readJson(path.join(scan.root,file));
    if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets)) throw new Error('Asset manifest requires schemaVersion=1 and an assets array.');
    const seen = new Set();
    for (const entry of manifest.assets) {
      if (!entry || !['component','page'].includes(entry.type) || typeof entry.name !== 'string' || !entry.name.trim()) throw new Error('Each asset needs type=component|page and a name.');
      const source = projectRelativePath(entry.source,'asset.source');
      const document = projectRelativePath(entry.document,'asset.document');
      const key = `${entry.type}:${source}`;
      if (seen.has(key)) throw new Error(`Duplicate asset mapping: ${key}`);
      seen.add(key);
      const asset = {...entry,source,document};
      assets.push(asset);
      for (const [field, location] of [['source',source],['document',document]]) {
        if (!pathExists(path.join(scan.root,location)) || !fs.statSync(path.join(scan.root,location)).isFile()) issue(`missing-asset-${field}`,location,`Mapped ${entry.type} ${entry.name} has no ${field} file.`);
      }
    }
  } catch (error) {
    assets.length = 0;
    issue('invalid-asset-manifest',file,error.message);
  }
  return {status:issues.length?'issues-found':'mapping-checked',assets,issues};
}
