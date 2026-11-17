const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'tap_pad.js'), 'utf8');

function section(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first);
  return source.slice(first, last);
}

function createBrightControl(saved = []) {
  const values = new Map(saved);
  const listeners = new Map();
  const buttonClasses = new Map();
  const padClasses = new Map();
  const attributes = new Map();
  const button = {
    classList: { toggle: (name, enabled) => buttonClasses.set(name, enabled) },
    setAttribute: (name, value) => attributes.set(name, value),
    addEventListener: (name, handler) => listeners.set(name, handler),
    click: () => listeners.get('click')()
  };
  const context = vm.createContext({
    tapBrightButton: button,
    tapButton: { classList: { toggle: (name, enabled) => padClasses.set(name, enabled) } },
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  });
  vm.runInContext([
    section('let brightMode =', '\n'),
    section('function readBoolFromStorage(', 'function resetSession('),
    section('function applyBrightButtonUI()', 'function applyTapPlaybackButtonUI()'),
    section('function makeKeyboardActivatable(', '\nmakeKeyboardActivatable(volumeIncreaseButton'),
    section('if (tapBrightButton) {', 'document.getElementById("reset-button")'),
    'applyBrightButtonUI();'
  ].join('\n'), context);
  return {
    values, button,
    check(enabled) {
      assert.equal(buttonClasses.get('button-on'), enabled);
      assert.equal(padClasses.get('pad-bright-active'), enabled);
      assert.equal(attributes.get('aria-pressed'), String(enabled));
    },
    press(key) {
      let prevented = false;
      listeners.get('keydown')({ key, preventDefault() { prevented = true; } });
      assert.ok(prevented);
    }
  };
}

test('Instrument Bright toggles the readout by pointer and keyboard without changing Blink', () => {
  const control = createBrightControl([['tap_pad.blink', '1']]);
  control.check(false);
  control.button.click();
  control.check(true);
  assert.equal(control.values.get('tap_pad.bright'), '1');
  control.press(' ');
  control.check(false);
  assert.equal(control.values.get('tap_pad.bright'), '0');
  control.press('Enter');
  control.check(true);
  assert.equal(control.values.get('tap_pad.blink'), '1');
});

test('Instrument Bright restores both saved on and off states', () => {
  const control = createBrightControl();
  control.button.click();
  createBrightControl(control.values).check(true);
  control.button.click();
  createBrightControl(control.values).check(false);
});
