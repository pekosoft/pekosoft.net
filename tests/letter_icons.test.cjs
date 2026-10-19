const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sprite = fs.readFileSync(path.join(__dirname, '..', 'icons.svg'), 'utf8');
const letters = [...sprite.matchAll(/<symbol id="(letter_[a-z])" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)];
const existingLetters = new Set(['letter_a', 'letter_b', 'letter_c', 'letter_d', 'letter_t']);
const circle = 'M256 0a256 256 0 1 0 0 512 256 256 0 1 0 0-512Z';

test('letter badges provide the complete alphabet exactly once in alphabetical order', () => {
  const expected = Array.from('abcdefghijklmnopqrstuvwxyz', letter => `letter_${letter}`);
  assert.deepEqual(letters.map(([, id]) => id), expected);
});

test('letter badges use standalone monochrome paths on the shared canvas', () => {
  for (const [, id, viewBox, content] of letters) {
    assert.equal(viewBox, '0 0 512 512', id);
    assert.equal([...content.matchAll(/<path\b/g)].length, 1, id);
    assert.doesNotMatch(content, /<(?:text|use|image)\b|\b(?:fill|stroke|style)\s*=|\bfont-/i, id);
  }
});

test('new letter badges cut the glyph and its counters out of the existing circle treatment', () => {
  const added = letters.filter(([, id]) => !existingLetters.has(id));
  assert.equal(added.length, 21);
  for (const [, id, , content] of added) {
    assert.match(content, /fill-rule="evenodd"/, id);
    const data = content.match(/\bd="([^"]+)"/)[1];
    assert.ok(data.startsWith(circle), id);
    assert.match(data.slice(circle.length), /^M.+Z$/, id);
  }
});
