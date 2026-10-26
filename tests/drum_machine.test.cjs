const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'drum_machine.js'), 'utf8');

function createMachine(saved = {}) {
  const storage = new Map(Object.entries(saved));
  const context = {
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    document: { addEventListener() {}, getElementById() {}, querySelectorAll: () => [] },
    window: { addEventListener() {}, bindPekosoftRangeButtons() {} }
  };
  vm.createContext(context);
  vm.runInContext(source.replace('  document.addEventListener("DOMContentLoaded",', `
    globalThis.api = { DrumMachine, createDefaultState, normalizeState, loadState };
    document.addEventListener("DOMContentLoaded",
  `), context);
  const machine = Object.create(context.api.DrumMachine.prototype);
  machine.state = context.api.loadState();
  return { machine, storage, api: context.api, context };
}

test('Blink defaults off and survives save, reload, export and import', () => {
  const { machine, storage, api } = createMachine();
  assert.equal(machine.state.blink, false);
  assert.equal(api.normalizeState({}, false).blink, false);
  machine.state.blink = true;
  machine.saveState();
  assert.equal(JSON.parse(storage.get('drum_machine.state')).blink, true);
  assert.equal(api.loadState().blink, true);
  assert.equal(machine.getExportData().blink, true);
  assert.equal(api.normalizeState(machine.getExportData(), false).blink, true);
  assert.equal(api.createDefaultState().blink, false);
});

test('Blink toggles and clears active feedback without changing transport or pattern', () => {
  const { machine, storage, context } = createMachine();
  const handlers = {};
  const pressed = {};
  const active = new Set(['voice-hit']);
  context.document.querySelectorAll = () => [{
    classList: { remove: name => active.delete(name) }
  }];
  machine.elements = new Proxy({}, {
    get: (_, name) => ({
      addEventListener: (event, callback) => { handlers[`${String(name)}:${event}`] = callback; },
      classList: { toggle() {} },
      setAttribute: (key, value) => { pressed[`${String(name)}:${key}`] = value; }
    })
  });
  machine.updatePanel = () => {};
  machine.updateRecordingControls = () => {};
  machine.isPlaying = true;
  machine.isRecording = true;
  const pattern = JSON.stringify(machine.state.pattern);
  machine.bindEvents();
  for (const enabled of [true, false]) {
    handlers['blink:click']();
    assert.equal(machine.state.blink, enabled);
    assert.equal(JSON.parse(storage.get('drum_machine.state')).blink, enabled);
    assert.equal(pressed['blink:aria-pressed'], String(enabled));
    assert.equal(machine.isPlaying, true);
    assert.equal(machine.isRecording, true);
    assert.equal(JSON.stringify(machine.state.pattern), pattern);
  }
  assert.equal(active.has('voice-hit'), false);
});

test('Voice feedback respects Blink at scheduling and execution time', () => {
  const { machine, context } = createMachine();
  const scheduled = [];
  const active = new Set();
  context.document.querySelectorAll = () => [{
    classList: {
      add: name => active.add(name),
      remove: name => active.delete(name)
    }
  }];
  machine.scheduleVisual = (callback, delay) => scheduled.push({ callback, delay });
  machine.flashVoice('kick', 30);
  assert.equal(scheduled.length, 0);
  machine.state.blink = true;
  machine.flashVoice('kick', 30);
  assert.equal(scheduled[0].delay, 30);
  scheduled.shift().callback();
  assert.equal(active.has('voice-hit'), true);
  assert.equal(scheduled[0].delay, 80);
  scheduled.shift().callback();
  assert.equal(active.has('voice-hit'), false);
  machine.flashVoice('kick', 30);
  machine.state.blink = false;
  scheduled.shift().callback();
  assert.equal(active.has('voice-hit'), false);
  assert.equal(scheduled.length, 0);
});

test('Grid is the default for fresh, legacy and invalid saved modes', () => {
  for (const state of [null, {}, { mode: 'invalid' }, { mode: null }]) {
    const { machine } = createMachine({ 'drum_machine.state': JSON.stringify(state) });
    assert.equal(machine.state.mode, 'grid');
  }
});

test('Pad mode survives save, reload, export and import; defaults restore Grid', () => {
  const { machine, storage, api } = createMachine();
  machine.state.mode = 'pad';
  machine.saveState();
  assert.equal(JSON.parse(storage.get('drum_machine.state')).mode, 'pad');
  assert.equal(api.loadState().mode, 'pad');
  const exported = machine.getExportData();
  assert.equal(exported.mode, 'pad');
  assert.equal(api.normalizeState(exported, false).mode, 'pad');
  assert.equal(api.createDefaultState().mode, 'grid');
});

test('Mode toggles without changing patterns, voices or transport', () => {
  const { machine, storage } = createMachine();
  const handlers = {};
  machine.elements = new Proxy({}, {
    get: (_, name) => ({ addEventListener: (event, callback) => { handlers[`${String(name)}:${event}`] = callback; } })
  });
  machine.updateAll = () => {};
  machine.isPlaying = true;
  machine.isRecording = true;
  const pattern = JSON.stringify(machine.state.pattern);
  const voices = JSON.stringify(machine.state.voices);
  machine.bindEvents();
  for (const mode of ['pad', 'grid']) {
    handlers['mode:click']();
    assert.equal(machine.state.mode, mode);
    assert.equal(JSON.parse(storage.get('drum_machine.state')).mode, mode);
    assert.equal(JSON.stringify(machine.state.pattern), pattern);
    assert.equal(JSON.stringify(machine.state.voices), voices);
    assert.equal(machine.isPlaying, true);
    assert.equal(machine.isRecording, true);
  }
});

test('Pad pointer presses play once, support multiple voices and retain keyboard activation', () => {
  const { machine } = createMachine();
  machine.state.mode = 'pad';
  const hits = [];
  machine.selectVoice = voice => { machine.state.selectedVoice = voice; };
  machine.auditionVoice = voice => hits.push(voice);
  let prevented = 0;
  const eventFor = (voice, detail = 1) => ({
    target: { closest: selector => selector === '.voice-trigger' ? { dataset: { voice } } : null },
    button: 0,
    detail,
    preventDefault: () => { prevented++; }
  });
  for (const voice of ['kick', 'snare', 'hat', 'perc']) {
    machine.handleGridPointerDown(eventFor(voice));
    machine.handleGridClick(eventFor(voice));
  }
  assert.deepEqual(hits, ['kick', 'snare', 'hat', 'perc']);
  assert.equal(prevented, 4);
  machine.handleGridClick(eventFor('kick', 0));
  assert.equal(hits.at(-1), 'kick');
  assert.equal(hits.length, 5);
});

test('Grid voice clicks and keyboard step editing keep their existing behavior', () => {
  const { machine } = createMachine();
  const hits = [];
  machine.selectVoice = () => {};
  machine.auditionVoice = voice => hits.push(voice);
  machine.handleGridClick({
    target: { closest: selector => selector === '.voice-trigger' ? { dataset: { voice: 'snare' } } : null },
    detail: 1
  });
  assert.deepEqual(hits, ['snare']);
  let committed = false;
  machine.commitPatternChange = () => { committed = true; };
  const before = machine.state.pattern.kick[0];
  machine.handleGridKeyDown({
    target: { closest: () => ({ dataset: { voice: 'kick', step: '0' }, disabled: false }) },
    key: ' ',
    preventDefault() {}
  });
  assert.equal(machine.state.pattern.kick[0], (before + 1) % 3);
  assert.equal(committed, true);
});

test('Letter and number shortcuts select and play each drum in both modes', () => {
  const { machine } = createMachine();
  const hits = [];
  machine.selectVoice = voice => { machine.state.selectedVoice = voice; };
  machine.auditionVoice = voice => hits.push(voice);
  for (const mode of ['grid', 'pad']) {
    machine.state.mode = mode;
    for (const [key, voice] of [
      ['d', 'kick'], ['f', 'snare'], ['j', 'hat'], ['k', 'perc'],
      ['D', 'kick'], ['F', 'snare'], ['J', 'hat'], ['K', 'perc'],
      ['1', 'kick'], ['2', 'snare'], ['3', 'hat'], ['4', 'perc']
    ]) {
      let prevented = false;
      machine.handleGlobalKeyDown({
        key,
        target: { tagName: 'BUTTON' },
        preventDefault() { prevented = true; }
      });
      assert.equal(hits.at(-1), voice);
      assert.equal(machine.state.selectedVoice, voice);
      assert.equal(prevented, true);
    }
  }
  assert.equal(hits.length, 24);
});

test('Drum shortcuts ignore editing, modifiers, repeats and handled events', () => {
  const { machine } = createMachine();
  machine.selectVoice = () => assert.fail('Unexpected drum selection');
  machine.auditionVoice = () => assert.fail('Unexpected drum hit');
  const ignored = [
    ...['INPUT', 'SELECT', 'TEXTAREA'].map(tagName => ({ target: { tagName } })),
    { target: { tagName: 'DIV', isContentEditable: true } },
    ...['ctrlKey', 'metaKey', 'altKey', 'repeat', 'isComposing', 'defaultPrevented']
      .map(property => ({ [property]: true })),
    ...['0', '5', '1.5', 'Enter', 'ArrowLeft', 'a', 's', 'x'].map(key => ({ key }))
  ];
  for (const overrides of ignored) {
    machine.handleGlobalKeyDown({
      key: 'd',
      target: { tagName: 'BODY' },
      preventDefault() { assert.fail('Unexpected prevention'); },
      ...overrides
    });
  }
});

test('Space preserves native button activation and toggles transport elsewhere', () => {
  const { machine } = createMachine();
  let toggles = 0;
  let prevented = 0;
  machine.togglePlayback = () => { toggles++; };
  const event = {
    key: ' ',
    code: 'Space',
    target: { tagName: 'BUTTON', closest: () => ({}) },
    preventDefault() { prevented++; }
  };
  machine.handleGlobalKeyDown(event);
  assert.equal(toggles, 0);
  assert.equal(prevented, 0);
  machine.handleGlobalKeyDown({ ...event, target: { tagName: 'BODY', closest: () => null } });
  assert.equal(toggles, 1);
  assert.equal(prevented, 1);
});

test('Selecting drums leaves the Mode button unchanged; switching mode updates it', () => {
  const { machine } = createMachine();
  const mutations = [];
  let iconHref = '/icons.svg#view_grid';
  const icon = {
    getAttribute: () => iconHref,
    setAttribute(name, value) {
      iconHref = value;
      mutations.push([name, value]);
    }
  };
  machine.elements = {
    grid: { classList: { toggle() {} }, setAttribute() {} },
    mode: {
      querySelector: () => icon,
      classList: { toggle: (...args) => mutations.push(args) },
      setAttribute: (...args) => mutations.push(args)
    },
    voiceSelect: {}
  };
  machine.updateVoiceFields = () => {};
  machine.updatePanel = () => {};
  for (const mode of ['pad', 'grid']) {
    machine.state.mode = mode;
    machine.updateGrid();
    assert.equal(iconHref, mode === 'pad' ? '/icons.svg#drum_machine' : '/icons.svg#view_grid');
    assert.equal(machine.elements.mode.title, mode === 'pad' ? 'Switch to grid' : 'Switch to pad');
    const count = mutations.length;
    for (const voice of ['kick', 'snare', 'hat', 'perc']) machine.selectVoice(voice);
    assert.equal(mutations.length, count);
  }
});
