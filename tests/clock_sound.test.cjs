const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'index.js'), 'utf8');
const registrySource = source.slice(source.indexOf('function getCurrentToolControlKey('), source.indexOf('window.PekoLocalToggleRegistry ='));
const soundSource = source.slice(source.indexOf('const SOUND_REGISTRY_KEY ='), source.indexOf('window.PekoSound ='));
const initializeSource = source.slice(source.indexOf('function initializeGlobalSoundSetting('), source.indexOf('function getGlobalHaptics('));
const storageSource = source.slice(source.indexOf("window.addEventListener('storage'"), source.indexOf('function initializeGlobalSoundSetting('));
const hapticsSource = source.slice(source.indexOf('function getGlobalHaptics('), source.indexOf("document.addEventListener('click', (event) => {"));
const clockSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'clock.js'), 'utf8');
const resetSource = clockSource.slice(clockSource.indexOf('function resetClockTool()'), clockSource.indexOf('function renderClock()'));
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
  context.feedbackModes = ['clock', 'timer', 'countdown'];
  context.feedbackSettings = {
    clock: { sound: true, haptic: false },
    timer: { sound: true, haptic: false },
    countdown: { sound: true, haptic: false }
  };
  context.window.clockFeedback = {
    anyEnabled: kind => context.feedbackModes.some(mode => context.feedbackSettings[mode][kind]),
    restore: (kind, enabled) => context.feedbackModes.forEach(mode => { context.feedbackSettings[mode][kind] = enabled; })
  };
  context.activeMode = 'timer';
  context.timerElapsedMs = 500;
  context.timerStartedAt = 100;
  context.timerRunning = true;
  context.countdownRunning = true;
  context.countdownRemainingMs = 5000;
  context.countdownHours = { value: '1' };
  context.countdownMinutes = { value: '2' };
  context.countdownSeconds = { value: '3' };
  context.countdownFields = [context.countdownHours, context.countdownMinutes, context.countdownSeconds];
  context.syncFeedbackButtonState = () => { button.enabled = context.feedbackSettings.clock.sound; };
  context.stopCountdownAlarm = () => {};
  context.syncCountdownOptions = () => {};
  context.syncMode = () => {};
  context.updateTimeDisplays = () => {};
  context.renderClock = () => {};
  context.window.PekoSound = { syncFromTools: context.syncGlobalSoundFromTools };
  vm.runInContext(resetSource, context);
  context.resetClockTool();
  assert.equal(button.enabled, false);
  assert.equal(storage.has('clock.sound_on'), false);
  assert.equal(storage.has('clock.mode'), false);
  assert.equal(JSON.parse(storage.get('global.sound.modules'))[clockKey], false);
  assert.equal(JSON.parse(storage.get('global.sound.modules'))['bpm_circle:sound-master-button'], true);
  assert.equal(storage.get('global.sound'), 'true');
  context.restoreToolSoundButtons();
  assert.equal(button.enabled, false);
});

test('global Sound changes on another tool persist for all Clock tabs', () => {
  const { context, storage } = createSoundSettings({}, 'bpm_circle');
  for (const enabled of [true, false]) {
    context.setGlobalSound(enabled);
    for (const mode of ['clock', 'timer', 'countdown']) {
      assert.equal(storage.get(`clock.${mode}_sound`), String(enabled));
    }
  }
});

test('the Clock registry represents all tabs, not only the visible button', () => {
  const { context, storage, button } = createSoundSettings();
  button.enabled = false;
  context.window.clockFeedback = { anyEnabled: () => true };
  context.syncGlobalSoundFromTools();
  assert.equal(JSON.parse(storage.get('global.sound.modules'))[clockKey], true);
});

test('a Sound indicator change from another page does not overwrite per-tab choices', () => {
  const { context, storage } = createSoundSettings({
    'clock.clock_sound': 'true', 'clock.timer_sound': 'false', 'clock.countdown_sound': 'false',
    'global.sound.modules': JSON.stringify({ [clockKey]: true })
  });
  let onStorage;
  context.window.addEventListener = (name, callback) => { if (name === 'storage') onStorage = callback; };
  context.window.clockFeedback = {
    restore() {},
    setAll() { assert.fail('an indicator change must not change tab preferences'); }
  };
  vm.runInContext(storageSource, context);
  storage.set('global.sound', 'true');
  onStorage({ key: 'global.sound', newValue: 'true' });
  assert.equal(storage.get('clock.clock_sound'), 'true');
  assert.equal(storage.get('clock.timer_sound'), 'false');
  assert.equal(storage.get('clock.countdown_sound'), 'false');
});

test('global feedback updates Clock while Calendar disables its buttons', () => {
  const { context } = createSoundSettings();
  vm.runInContext(hapticsSource, context);
  const changes = [];
  context.window.clockFeedback = { setAll: (kind, enabled) => changes.push([kind, enabled]) };
  context.setGlobalSound(true);
  context.setGlobalHaptics(true);
  assert.deepEqual(changes, [['sound', true], ['haptic', true]]);
});

test('global Haptic changes on another tool persist for all Clock tabs', () => {
  const { context, storage } = createSoundSettings({}, 'bpm_circle');
  vm.runInContext(hapticsSource, context);
  for (const enabled of [true, false]) {
    context.setGlobalHaptics(enabled);
    for (const mode of ['clock', 'timer', 'countdown']) {
      assert.equal(storage.get(`clock.${mode}_haptic`), String(enabled));
    }
  }
});

test('shared toggle registries retain boolean defaults for other settings', () => {
  const { context } = createSoundSettings();
  for (const enabled of [false, true]) {
    const registry = context.getLocalToggleRegistry('other.settings', ['first', 'second'], enabled);
    assert.equal(registry.first, enabled);
    assert.equal(registry.second, enabled);
  }
});
