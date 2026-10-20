const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

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

const script = fs.readFileSync(path.join(__dirname, '..', 'js', 'tuner.js'), 'utf8');
const renderTargetButtons = script.match(/function renderTargetButtons\(\) \{[\s\S]*?\n\}/)[0];

function renderTargetNotes(profile, noteNames, showButtonText = false) {
  const buttons = [];
  let selectionUpdates = 0;
  vm.runInNewContext(`${renderTargetButtons}\nrenderTargetButtons();`, {
    state: { profile },
    getProfileTargets: () => noteNames.map(noteName => ({ noteName })),
    targetGrid: { innerHTML: '', appendChild: button => buttons.push(button) },
    document: {
      body: { classList: { contains: () => showButtonText } },
      createElement: () => ({ addEventListener() {} })
    },
    updateTargetSelection() { selectionUpdates++; }
  });
  assert.equal(selectionUpdates, 1);
  return buttons;
}

for (const [profile, notes] of Object.entries({
  guitar: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  bass: ['E1', 'A1', 'D2', 'G2'],
  chromatic: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4']
})) {
  test(`${profile} Target keys use matching letter icons and retain full note labels`, () => {
    const buttons = renderTargetNotes(profile, notes);
    assert.equal(buttons.length, notes.length);
    buttons.forEach((button, index) => {
      const noteName = notes[index];
      const iconId = `letter_${noteName[0].toLowerCase()}`;
      assert.equal(button.className, 'square tuner-target-button');
      assert.equal(button.title, `Set target to ${noteName}`);
      assert.ok(button.innerHTML.includes(`href="/icons.svg#${iconId}"`));
      assert.ok(button.innerHTML.includes(`<span class="button-text">${noteName}</span>`));
      assert.doesNotMatch(button.innerHTML, /#asterisk/);
      assert.equal([...sprite.matchAll(new RegExp(`<symbol id="${iconId}" `, 'g'))].length, 1);
    });
  });
}

test('Target keys retain letter icons when button text is enabled', () => {
  const [button] = renderTargetNotes('chromatic', ['C#4'], true);
  assert.equal(button.className, 'tuner-target-button');
  assert.match(button.innerHTML, /href="\/icons\.svg#letter_c"/);
  assert.match(button.innerHTML, /<span class="button-text">C#4<\/span>/);
});
