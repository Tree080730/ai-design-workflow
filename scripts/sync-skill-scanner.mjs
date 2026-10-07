import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Standalone Skill installs cannot depend on the CLI checkout or npm package.
for (const name of ['scan.mjs', 'config.mjs', 'fs-utils.mjs', 'tasks.mjs', 'delivery.mjs', 'workflow.mjs', 'status-output.mjs']) {
  const source = new URL(`../packages/cli/src/${name}`, import.meta.url);
  const target = new URL(`../skills/designer-dev-workflow/scripts/lib/${name}`, import.meta.url);
  fs.mkdirSync(fileURLToPath(new URL('.', target)), { recursive: true });
  fs.copyFileSync(source, target);
}
