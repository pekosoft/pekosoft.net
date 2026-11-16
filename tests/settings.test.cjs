const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'settings.js'), 'utf8');

test('pages without the developer Size control retain the saved grid size', () => {
  const context = vm.createContext({
    settings: { gridSizeValue: null },
    defaults: { gridSize: 16 },
    gridSizes: [8, 16, 32, 64],
    localStorage: { getItem: () => '64' },
    document: { documentElement: { style: { setProperty: (key, value) => { context.gridSize = value; } } } }
  });
  for (const [start, end] of [
    ['function normalizeGridSize(', 'function normalizeFontSize('],
    ['function getCurrentGridSize(', 'function setGridSize('],
    ['function applyGridSizeSetting(', 'function applyButtonTextSetting(']
  ]) {
    vm.runInContext(source.slice(source.indexOf(start), source.indexOf(end)), context);
  }
  context.applyGridSizeSetting();
  assert.equal(context.gridSize, '64px');
  context.settings.gridSizeValue = { value: '32' };
  context.applyGridSizeSetting();
  assert.equal(context.gridSize, '32px');
});
