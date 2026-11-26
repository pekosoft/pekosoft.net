const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'settings.js'), 'utf8');

function createResetEnvironment() {
  class Storage {
    constructor(entries) { this.values = new Map(Object.entries(entries)); }
    getItem(key) { return this.values.get(key) ?? null; }
    setItem(key, value) { this.values.set(key, String(value)); }
    removeItem(key) { this.values.delete(key); }
    clear() { this.values.clear(); }
  }
  const localStorage = new Storage({
    'global.module_order': '["meters","tool"]',
    'global.theme': 'light',
    'module_tool_state': 'maximized',
    'module_controls': 'hidden',
    'player.volume': '20',
    'notepad.text': 'Saved text'
  });
  const sessionStorage = new Storage({ 'player.recording': 'saved', 'meters.player.mode': 'level' });
  const events = [];
  const context = vm.createContext({
    Storage, localStorage, sessionStorage,
    document: {
      addEventListener() {},
      getElementById: id => id === 'stop-button' ? { click: () => events.push('stop') } : null
    },
    stopSitePlay: () => events.push('stop-site'),
    location: { reload: () => events.push('reload') },
    clearBackgroundImageSetting: () => new Promise(resolve => {
      context.finishBackgroundRemoval = () => { events.push('background-cleared'); resolve(); };
    })
  });
  const head = fs.readFileSync(path.join(__dirname, '..', 'elements', 'head.php'), 'utf8');
  const guardStart = head.indexOf("const resetStorageLockKey =");
  vm.runInContext(head.slice(guardStart, head.indexOf('} catch', guardStart)), context);
  vm.runInContext(source.slice(source.indexOf('  // Reset settings to defaults'), source.indexOf('  function normalizeGridSize(')), context);
  return { context, localStorage, sessionStorage, events };
}

test('Global Reset clears every stored scope and waits for background removal before reloading', async () => {
  const { context, localStorage, sessionStorage, events } = createResetEnvironment();
  const pending = context.resetSettings();
  assert.deepEqual([...localStorage.values], []);
  assert.deepEqual([...sessionStorage.values], [['pekosoft.reset-storage-lock', '1']]);
  assert.deepEqual(events, ['stop-site', 'stop']);
  localStorage.setItem('global.module_order', '["meters","tool"]');
  localStorage.setItem('notepad.text', 'Stale unload save');
  assert.deepEqual([...localStorage.values], []);
  context.finishBackgroundRemoval();
  await pending;
  assert.deepEqual(events, ['stop-site', 'stop', 'background-cleared', 'reload']);
  assert.deepEqual([...localStorage.values], []);
});

test('Global Reset does not reload before a failed background removal can be reported', async () => {
  const { context, events } = createResetEnvironment();
  context.clearBackgroundImageSetting = () => Promise.reject(new Error('Storage unavailable'));
  await assert.rejects(context.resetSettings(), /Storage unavailable/);
  assert.ok(!events.includes('reload'));
});

test('selected background photos gain an overlay and removal restores the gradient', () => {
  const classes = new Set();
  const properties = new Map();
  const revoked = [];
  const context = vm.createContext({
    Blob,
    URL: {
      createObjectURL: () => 'blob:photo',
      revokeObjectURL: url => revoked.push(url)
    },
    document: { documentElement: { style: {
      setProperty: (key, value) => properties.set(key, value),
      removeProperty: key => properties.delete(key)
    } } },
    backgroundBitmap: { classList: { toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name) } },
    settings: { backgroundImagePicker: { textContent: '' } }
  });
  vm.runInContext('let backgroundImageUrl = "";', context);
  vm.runInContext(source.slice(source.indexOf('  function applyBackgroundImageSetting('), source.indexOf('  function expandHex(')), context);
  context.applyBackgroundImageSetting(new Blob(['photo']));
  assert.equal(classes.has('background-photo'), true);
  assert.equal(properties.get('--selected-background-image'), 'url("blob:photo")');
  context.applyBackgroundImageSetting();
  assert.equal(classes.has('background-photo'), false);
  assert.equal(properties.has('--selected-background-image'), false);
  assert.deepEqual(revoked, ['blob:photo']);
});

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
