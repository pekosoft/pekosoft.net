const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'index.js'), 'utf8');
const registrySource = source.slice(source.indexOf('function getCurrentToolControlKey('), source.indexOf('window.PekoLocalToggleRegistry ='));
const soundSource = source.slice(source.indexOf('const SOUND_REGISTRY_KEY ='), source.indexOf('window.PekoSound ='));
const initializeSource = source.slice(source.indexOf('function initializeGlobalSoundSetting('), source.indexOf('function getGlobalHaptics('));
const clockSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'clock.js'), 'utf8');
const resetSource = clockSource.slice(clockSource.indexOf('resetButton?.addEventListener('), clockSource.indexOf('clockSoundButton?.addEventListener('));
const clockKey = 'clock:clock-sound-button';

function createSoundSettings(saved = {}, tool = 'clock') {
  const storage = new Map(Object.entries(saved));
  const button = {
    id: tool === 'clock' ? 'clock-sound-button' : 'sound-master-button',
    enabled: tool === 'clock' ? storage.get('clock.sound_on') === 'true' : true,
    classList: { contains: () => button.enabled },
    click() {
      button.enabled = !button.enabled;
      if (button.id === 'clock-sound-button') storage.set('clock.sound_on', String(button.enabled));
    }
  };
  const context = {
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    document: {
      querySelectorAll: () => [button],
      getElementById: () => null,
      querySelector: () => null
    },
    window: { location: { pathname: `/${tool}` }, dispatchEvent() {} },
    HTMLInputElement: class {},
    CustomEvent: class {}
  };
  vm.createContext(context);
  vm.runInContext(registrySource + soundSource + initializeSource, context);
  return { context, storage, button };
}

test('a fresh Clock stays silent when global Sound defaults to on', () => {
  const { context, storage, button } = createSoundSettings();
  context.initializeGlobalSoundSetting();
  assert.equal(button.enabled, false);
  assert.equal(storage.has('clock.sound_on'), false);
});

test('visiting another sound tool first does not opt Clock into ticking', () => {
  const { context, storage, button } = createSoundSettings({}, 'bpm_circle');
  context.syncGlobalSoundFromTools();
  assert.equal(JSON.parse(storage.get('global.sound.modules'))[clockKey], false);
  assert.equal(storage.get('global.sound'), 'true');
  context.window.location.pathname = '/clock';
  button.id = 'clock-sound-button';
  button.enabled = false;
  context.restoreToolSoundButtons();
  assert.equal(button.enabled, false);
});

test('saved Clock sound choices survive initialization without a shared entry', () => {
  for (const enabled of [false, true]) {
    const { context, button } = createSoundSettings({ 'clock.sound_on': String(enabled) });
    context.initializeGlobalSoundSetting();
    assert.equal(button.enabled, enabled);
  }
});

test('stored shared Sound choices still override older Clock settings', () => {
  for (const enabled of [false, true]) {
    const { context, button } = createSoundSettings({
      'clock.sound_on': String(!enabled),
      'global.sound.modules': JSON.stringify({ [clockKey]: enabled })
    });
    context.initializeGlobalSoundSetting();
    assert.equal(button.enabled, enabled);
  }
});

test('global mute is respected when a shared Clock choice has not been stored', () => {
  const { context, button } = createSoundSettings({
    'clock.sound_on': 'true',
    'global.sound': 'false'
  });
  context.initializeGlobalSoundSetting();
  assert.equal(button.enabled, false);
});

test('explicit global Sound changes include Clock and persist across restoration', () => {
  const { context, storage, button } = createSoundSettings();
  for (const enabled of [true, false, true]) {
    context.setGlobalSound(enabled);
    assert.equal(button.enabled, enabled);
    assert.equal(storage.get('clock.sound_on'), String(enabled));
    assert.equal(JSON.parse(storage.get('global.sound.modules'))[clockKey], enabled);
    context.restoreToolSoundButtons();
    assert.equal(button.enabled, enabled);
  }
});

test('Clock Reset keeps ticking off after shared settings are restored', () => {
  const { context, storage, button } = createSoundSettings({
    'clock.sound_on': 'true',
    'global.sound': 'true',
    'global.sound.modules': JSON.stringify({
      [clockKey]: true,
      'bpm_circle:sound-master-button': true
    })
  });
  let reset;
  context.resetButton = { addEventListener: (event, handler) => { reset = handler; } };
  context.isSoundOn = true;
  context.isHapticOn = false;
  context.syncFeedbackButtonState = () => { button.enabled = context.isSoundOn; };
  context.renderClock = () => {};
  context.window.PekoSound = { syncFromTools: context.syncGlobalSoundFromTools };
  vm.runInContext(resetSource, context);
  reset();
  assert.equal(button.enabled, false);
  assert.equal(storage.has('clock.sound_on'), false);
  assert.equal(JSON.parse(storage.get('global.sound.modules'))[clockKey], false);
  assert.equal(JSON.parse(storage.get('global.sound.modules'))['bpm_circle:sound-master-button'], true);
  assert.equal(storage.get('global.sound'), 'true');
  context.restoreToolSoundButtons();
  assert.equal(button.enabled, false);
});

test('shared toggle registries retain boolean defaults for other settings', () => {
  const { context } = createSoundSettings();
  for (const enabled of [false, true]) {
    const registry = context.getLocalToggleRegistry('other.settings', ['first', 'second'], enabled);
    assert.equal(registry.first, enabled);
    assert.equal(registry.second, enabled);
  }
});
