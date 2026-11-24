const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'turntable.js'), 'utf8');
const helper = fs.readFileSync(path.join(__dirname, '..', 'js', 'tempo_bend.js'), 'utf8');

function target() {
  const listeners = new Map();
  return {
    classList: { toggle() {}, contains: () => false },
    setAttribute() {},
    addEventListener(name, handler) {
      listeners.set(name, [...(listeners.get(name) || []), handler]);
    },
    dispatch(name, event = {}) {
      for (const handler of listeners.get(name) || []) handler(event);
    }
  };
}

function createTurntable() {
  const storage = new Map();
  const preset = { id: '33-button' };
  const context = vm.createContext({
    window: target(),
    rpmSlider: target(),
    bendButton: target(),
    localStorage: { setItem: (key, value) => storage.set(key, String(value)) },
    document: { querySelector: () => ({ classList: { contains: () => false } }) },
    targetSpeed: 33.333,
    currentSpeedButton: preset,
    state: { rpm: 33.333 },
    currentSpeed: 33.333,
    torqueMode: false,
    direction: 1,
    hapticMode: false,
    soundVolume: 20,
    toneType: 'sine',
    holeMode: 'standard',
    showGuides: true,
    showTimelineRPM: true,
    showTimelineSpeed: true,
    showTimelinePlayhead: true,
    followTimeline: true,
    minRPM: 1,
    maxRPM: 100,
    bendOn: false,
    updateStateFromRPM(value) { context.state.rpm = value; },
    updateButtonHighlight() {},
    clearButtonHighlight() { context.currentSpeedButton = null; },
    getMotorTargetSpeed() { return context.targetSpeed; },
    updateActualSpeed(value) { context.actualSpeed = value; }
  });
  vm.runInContext(helper, context);
  vm.runInContext(source.slice(source.indexOf('function setSpeed('), source.indexOf("btn8.addEventListener('click'")), context);
  vm.runInContext(source.slice(source.indexOf('function saveSettings()'), source.indexOf('function loadSettings()')), context);
  vm.runInContext(source.slice(source.indexOf("rpmSlider.addEventListener('input'"), source.indexOf('// Scratch')), context);
  context.storage = storage;
  context.preset = preset;
  return context;
}

test('Turntable Bend changes motor target temporarily and restores the original preset', () => {
  const turntable = createTurntable();
  turntable.bendButton.dispatch('click');
  turntable.rpmSlider.dispatch('pointerdown', { button: 0, pointerId: 1 });
  turntable.rpmSlider.value = '48';
  turntable.rpmSlider.dispatch('input');
  assert.equal(turntable.targetSpeed, 48);
  assert.equal(turntable.actualSpeed, 48);
  assert.equal(turntable.storage.get('turntable.rpm'), '33.333');
  assert.equal(turntable.storage.get('turntable.speed_btn'), '33-button');
  turntable.window.dispatch('pointerup', { pointerId: 1 });
  assert.equal(turntable.targetSpeed, 33.333);
  assert.equal(turntable.actualSpeed, 33.333);
  assert.equal(turntable.currentSpeedButton, turntable.preset);
  assert.equal(turntable.storage.get('turntable.rpm'), '33.333');
});

test('Turntable slider changes remain permanent when Bend is off', () => {
  const turntable = createTurntable();
  turntable.rpmSlider.dispatch('pointerdown', { button: 0, pointerId: 1 });
  turntable.rpmSlider.value = '45';
  turntable.rpmSlider.dispatch('input');
  turntable.window.dispatch('pointerup', { pointerId: 1 });
  assert.equal(turntable.targetSpeed, 45);
  assert.equal(turntable.storage.get('turntable.rpm'), '45');
  assert.equal(turntable.currentSpeedButton, null);
});

test('Turntable Bend preserves torque behavior when changing the motor target', () => {
  const turntable = createTurntable();
  turntable.torqueMode = true;
  turntable.bendButton.dispatch('click');
  turntable.rpmSlider.dispatch('keydown', { key: 'ArrowUp' });
  turntable.rpmSlider.value = '50';
  turntable.rpmSlider.dispatch('input');
  assert.equal(turntable.targetSpeed, 50);
  assert.equal(turntable.currentSpeed, 33.333);
  turntable.rpmSlider.dispatch('keyup', { key: 'ArrowUp' });
  assert.equal(turntable.targetSpeed, 33.333);
  assert.equal(turntable.currentSpeed, 33.333);
});
