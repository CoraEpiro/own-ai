const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.resolve(root, '..', 'frontend', 'dist');
const target = path.resolve(root, 'renderer');

function copyDir(src, dst) {
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

if (!fs.existsSync(source)) {
  console.error(`[desktop] Frontend build not found: ${source}`);
  process.exit(1);
}

if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
copyDir(source, target);
console.log('[desktop] Synced renderer assets');
