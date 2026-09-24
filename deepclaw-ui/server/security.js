const fs = require('node:fs');
const path = require('node:path');

function inside(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`));
}

// Check existing ancestors too, so writes through junctions cannot escape.
function safePath(root, target) {
  if (!inside(root, target)) return false;
  try {
    const realRoot = fs.realpathSync(root);
    let ancestor = target;
    while (!fs.existsSync(ancestor)) {
      const parent = path.dirname(ancestor);
      if (parent === ancestor) return false;
      ancestor = parent;
    }
    return inside(realRoot, fs.realpathSync(ancestor));
  } catch { return false; }
}

function trustedOrigin(origin, port) {
  return [`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(origin);
}

module.exports = { inside, safePath, trustedOrigin };
