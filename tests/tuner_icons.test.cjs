const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sprite = fs.readFileSync(path.join(__dirname, '..', 'icons.svg'), 'utf8');
const variants = [...sprite.matchAll(/<symbol id="(tuner(?:_off)?)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)];

test('tuner variants remain unique standalone monochrome icons', () => {
  assert.deepEqual(variants.map(([, id]) => id), ['tuner', 'tuner_off']);
  for (const [, id, viewBox, content] of variants) {
    assert.equal(viewBox, '0 0 512 512', id);
    assert.doesNotMatch(content, /<(?:text|use|image)\b|\b(?:fill|stroke|style)\s*=|\bfont-/i, id);
  }
});

test('tuner variants use the same thicker fork and larger terminal circle', () => {
  const forks = variants.map(([, , , content]) => content.match(/<path d="([^"]+)"/)[1]);
  assert.equal(forks.length, 2);
  for (const [, id, , content] of variants) {
    const fork = content.match(/<path d="([^"]+)"/)[1];
    assert.match(fork, /^M176 (?:0|32)h32v(?:272|240)a48 48 0 0 0 96 0/);
    assert.match(fork, /M240 336h32v(?:144|112)h-32Z$/);
    assert.match(content, /<circle cx="256" cy="(?:480|448)" r="32"\s*\/>/, id);
    assert.equal([...content.matchAll(/<circle\b/g)].length, 1, id);
  }
});

test('normal tuner fills the full canvas height while the crossed-out fork stays inside its ring', () => {
  const [, , , normal] = variants.find(([, id]) => id === 'tuner');
  const [, , , crossedOut] = variants.find(([, id]) => id === 'tuner_off');
  assert.match(normal, /<path d="M176 0h32v272/);
  assert.match(normal, /M240 336h32v144h-32Z/);
  assert.match(normal, /<circle cx="256" cy="480" r="32"\s*\/>/);
  assert.match(crossedOut, /<path d="M176 32h32v240/);
  assert.match(crossedOut, /<circle cx="256" cy="448" r="32"\s*\/>/);
});

test('only the crossed-out tuner adds its enclosing ring and diagonal mark', () => {
  const [, , , normal] = variants.find(([, id]) => id === 'tuner');
  const [, , , crossedOut] = variants.find(([, id]) => id === 'tuner_off');
  assert.equal([...normal.matchAll(/<path\b/g)].length, 1);
  assert.equal([...crossedOut.matchAll(/<path\b/g)].length, 3);
  assert.match(crossedOut, /fill-rule="evenodd"/);
});
