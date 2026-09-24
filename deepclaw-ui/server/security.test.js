const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { inside, safePath, trustedOrigin } = require('./security');

test('directory boundaries reject sibling prefixes and traversal', () => {
  const root = path.resolve('fixture', 'one');
  assert.equal(inside(root, path.resolve(root, '../one-private/file')), false);
  assert.equal(inside(root, path.resolve(root, '../file')), false);
  assert.equal(inside(root, path.resolve(root, 'report.md')), true);
  assert.equal(inside(root, root), true);
});
test('real paths reject junction escapes, including future writes', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'deepclaw-security-'));
  try {
    const root = path.join(base, 'root'), outside = path.join(base, 'outside');
    fs.mkdirSync(root); fs.mkdirSync(outside);
    fs.symlinkSync(outside, path.join(root, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal(safePath(root, path.join(root, 'escape')), false);
    assert.equal(safePath(root, path.join(root, 'escape', 'new.txt')), false);
    assert.equal(safePath(root, path.join(root, 'new.txt')), true);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});
test('browser origins are restricted to this local UI port', () => {
  assert.equal(trustedOrigin('http://127.0.0.1:1900', 1900), true);
  assert.equal(trustedOrigin('http://localhost:1900', 1900), true);
  for (const origin of [undefined, 'null', 'https://example.com', 'http://localhost:19000', 'http://localhost.evil:1900']) {
    assert.equal(trustedOrigin(origin, 1900), false);
  }
});
