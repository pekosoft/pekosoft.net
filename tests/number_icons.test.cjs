const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sprite = fs.readFileSync(path.join(__dirname, '..', 'icons.svg'), 'utf8');
const numbers = [...sprite.matchAll(/<symbol id="(number_[0-9])" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)];
const circle = 'M256 0a256 256 0 1 0 0 512 256 256 0 1 0 0-512Z';

test('number badges provide all ten digits exactly once in numerical order', () => {
  const expected = Array.from('0123456789', digit => `number_${digit}`);
  assert.deepEqual(numbers.map(([, id]) => id), expected);
});

test('number badges use standalone monochrome paths on the shared canvas', () => {
  for (const [, id, viewBox, content] of numbers) {
    assert.equal(viewBox, '0 0 512 512', id);
    assert.equal([...content.matchAll(/<path\b/g)].length, 1, id);
    assert.doesNotMatch(content, /<(?:text|use|image)\b|\b(?:fill|stroke|style)\s*=|\bfont-/i, id);
  }
});

test('number badges share the letter badge circle and glyph cutout treatment', () => {
  for (const [, id, , content] of numbers) {
    assert.match(content, /fill-rule="evenodd"/, id);
    const data = content.match(/\bd="([^"]+)"/)[1];
    assert.ok(data.startsWith(circle), id);
    assert.match(data.slice(circle.length), /^M.+Z$/, id);
  }
});

test('number badge outlines preserve the enclosed counters of each digit', () => {
  const contours = [2, 1, 1, 1, 2, 1, 2, 1, 3, 2];
  for (const [, id, , content] of numbers) {
    const data = content.match(/\bd="([^"]+)"/)[1].slice(circle.length);
    assert.equal([...data.matchAll(/M/g)].length, contours[Number(id.slice(-1))], id);
    assert.equal([...data.matchAll(/Z/g)].length, contours[Number(id.slice(-1))], id);
  }
});
