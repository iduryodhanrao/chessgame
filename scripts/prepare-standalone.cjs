const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const standaloneRoot = path.join(root, '.next', 'standalone');
const standaloneNext = path.join(standaloneRoot, '.next');
const standalonePublic = path.join(standaloneRoot, 'public');
const staticSource = path.join(root, '.next', 'static');
const staticTarget = path.join(standaloneNext, 'static');
const publicSource = path.join(root, 'public');

if (!fs.existsSync(standaloneRoot)) {
  throw new Error('Standalone output not found. Run `next build` first.');
}

fs.mkdirSync(standaloneNext, { recursive: true });

if (fs.existsSync(staticSource)) {
  fs.cpSync(staticSource, staticTarget, { recursive: true, force: true });
}

if (fs.existsSync(publicSource)) {
  fs.cpSync(publicSource, standalonePublic, { recursive: true, force: true });
}
