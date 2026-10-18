const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const tempiSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'tempi.js'), 'utf8');
const metronomeSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'metronome.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(tempiSource, context);
vm.runInContext(metronomeSource.slice(
  metronomeSource.indexOf('function getItalianTempoLabel('),
  metronomeSource.indexOf('function getSignatureLabel(')
), context);
const expectedTempi = [
  ['Larghissimo', 20, 24],
  ['Grave', 25, 45],
  ['Largo', 46, 60],
  ['Larghetto', 61, 66],
  ['Adagio', 67, 76],
  ['Andante', 77, 108],
  ['Moderato', 109, 120],
  ['Allegro', 121, 156],
  ['Vivace', 157, 176],
  ['Presto', 177, 200],
  ['Prestissimo', 201, 320]
];

test('shared Italian tempi preserve every existing name and BPM boundary', () => {
  const tempi = vm.runInContext('italianTempi', context);
  assert.deepEqual(Array.from(tempi, tempo => [tempo.name, tempo.min, tempo.max]), expectedTempi);
  expectedTempi.forEach(([name, min, max]) => {
    for (let bpm = min; bpm <= max; bpm++) {
      assert.equal(context.getItalianTempoLabel(bpm), name);
    }
  });
});

test('Metronome tempo listing and unmatched values retain their existing behavior', () => {
  assert.equal(context.buildTempiListText(), expectedTempi.map(([name, min, max]) => `${name}: ${min}-${max} BPM`).join('\n'));
  for (const bpm of [0, 19, 24.5, 320.1, 321, NaN, Infinity]) {
    assert.equal(context.getItalianTempoLabel(bpm), 'Unknown');
  }
  assert.equal(context.getItalianTempoLabel('120'), 'Moderato');
});

test('both tools load the shared tempi before their entry script', () => {
  for (const tool of ['metronome', 'reference']) {
    const template = fs.readFileSync(path.join(__dirname, '..', 'tools', `${tool}.php`), 'utf8');
    const sharedScript = template.indexOf('<script src="/js/tempi.js?v=');
    const entryScript = template.indexOf('<script src="/js/<?php echo $release; ?>.js?v=');
    assert.ok(sharedScript !== -1 && sharedScript < entryScript, `${tool} must load tempi.js first`);
  }
});
