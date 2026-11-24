const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'metronome.js'), 'utf8');
const animationSource = source.slice(source.indexOf('function schedulePendulumBeat('), source.indexOf('function tick('));
const stopSource = source.slice(source.indexOf('function stopMetronome()'), source.indexOf('function clearBeatSessionData()'));
const clearSource = source.slice(source.indexOf('function clearBeatSessionData()'), source.indexOf('async function startMetronome()'));

function createPendulum() {
  const context = vm.createContext({
    isPlaying: true,
    audioContext: { currentTime: 0 },
    pendulum: { style: {} },
    pendulumDirection: -30,
    emulatePendulum: true,
    pendulumBeatTime: null,
    pendulumBeatInterval: 0,
    pendulumPreviousInterval: 0,
    pendulumFrame: null,
    window: {
      requestAnimationFrame: () => 1,
      cancelAnimationFrame: id => { context.cancelledFrame = id; }
    }
  });
  vm.runInContext(animationSource, context);
  return context;
}

function angleAt(context, time) {
  context.audioContext.currentTime = time;
  context.animatePendulum();
  return Number(context.pendulum.style.transform.match(/rotate\((.+)deg\)/)[1]);
}

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} should be ${expected}`);
}

test('pendulum crosses the center at each scheduled click and swings between them', () => {
  for (const bpm of [30, 120, 320]) {
    const interval = 60 / bpm;
    const pendulum = createPendulum();
    pendulum.schedulePendulumBeat(1, interval);
    closeTo(angleAt(pendulum, 1), 0);
    closeTo(angleAt(pendulum, 1 + interval / 2), 30);
    const before = angleAt(pendulum, 1 + interval - 0.01 * interval);
    pendulum.schedulePendulumBeat(1 + interval, interval);
    closeTo(angleAt(pendulum, 1 + interval - 0.01 * interval), before);
    closeTo(angleAt(pendulum, 1 + interval), 0);
    closeTo(angleAt(pendulum, 1 + 1.5 * interval), -30);
  }
});

test('pendulum uses the preceding beat interval before a scheduled tempo change', () => {
  const pendulum = createPendulum();
  pendulum.schedulePendulumBeat(1, 0.5);
  const before = angleAt(pendulum, 1.45);
  pendulum.schedulePendulumBeat(1.5, 1);
  closeTo(angleAt(pendulum, 1.45), before);
  closeTo(angleAt(pendulum, 1.5), 0);
  closeTo(angleAt(pendulum, 2), -30);
});

test('snappy motion crosses on the beat and holds its position between beats', () => {
  for (const bpm of [30, 120, 320]) {
    const interval = 60 / bpm;
    const pendulum = createPendulum();
    pendulum.emulatePendulum = false;
    pendulum.schedulePendulumBeat(1, interval);
    closeTo(angleAt(pendulum, 1), 0);
    closeTo(angleAt(pendulum, 1.025), 15);
    closeTo(angleAt(pendulum, 1 + interval / 2), 30);
    pendulum.schedulePendulumBeat(1 + interval, interval);
    closeTo(angleAt(pendulum, 1 + interval - 0.05), 30);
    closeTo(angleAt(pendulum, 1 + interval), 0);
    closeTo(angleAt(pendulum, 1 + interval + 0.025), -15);
  }
});

test('switching motion and changing tempo preserve beat-centered crossings', () => {
  const pendulum = createPendulum();
  pendulum.schedulePendulumBeat(1, 0.5);
  closeTo(angleAt(pendulum, 1.25), 30);
  pendulum.emulatePendulum = false;
  closeTo(angleAt(pendulum, 1.25), 30);
  pendulum.schedulePendulumBeat(1.5, 0.1875);
  closeTo(angleAt(pendulum, 1.475), 15);
  closeTo(angleAt(pendulum, 1.5), 0);
  closeTo(angleAt(pendulum, 1.525), -15);
  pendulum.emulatePendulum = true;
  closeTo(angleAt(pendulum, 1.59375), -30);
  pendulum.schedulePendulumBeat(1.6875, 2);
  closeTo(angleAt(pendulum, 1.6875), 0);
});

test('reset restores natural motion and disables Bend', () => {
  const storage = new Map([['metronome.emulate_pendulum', 'false'], ['metronome.bend_on', 'true']]);
  const context = vm.createContext({
    emulatePendulum: false,
    bendOn: true,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      removeItem: key => storage.delete(key)
    },
    resetButton: { addEventListener: (event, handler) => { context.reset = handler; } },
    stopMetronome() {},
    finishTempoBend() {},
    tempoBend: { setEnabled() {} },
    window: { matchMedia: () => ({ matches: false }) },
    beatSoundSelect: {},
    signatureSelect: null,
    updateBPM() {},
    updateMasterSoundOutput() {},
    updateSoundButton() {},
    updateBlinkButton() {},
    metronomeTimelineFollow: null,
    updateTimelineControlButtons() {},
    volumeSlider: null,
    btnGuides: { classList: { remove() {} } },
    btnHaptic: { classList: { remove() {} } },
    updateToggleButtons() {},
    metronomeTimelineRulers: null,
    clearBeatSessionData() {},
    updateBaseText() {}
  });
  const resetSource = source.slice(source.indexOf("resetButton.addEventListener('click'"), source.indexOf("togglePlayButton.addEventListener('click'"));
  vm.runInContext(resetSource, context);
  context.reset();
  assert.equal(context.emulatePendulum, true);
  assert.equal(storage.has('metronome.emulate_pendulum'), false);
  assert.equal(context.bendOn, false);
  assert.equal(storage.has('metronome.bend_on'), false);
});

test('pausing freezes the pendulum and cancels its animation', () => {
  const pendulum = createPendulum();
  Object.assign(pendulum, {
    metronomeTimer: null, nextTickTime: 0, beatCount: 0, beatInBar: 0, lastTickTime: 0,
    clearTimeout() {}, clearBlink() {}, updateBaseSignatureCircles() {}, updateMetersSourceBridge() {},
    togglePlayButton: { classList: { remove() {} } }
  });
  vm.runInContext(stopSource, pendulum);
  pendulum.schedulePendulumBeat(1, 0.5);
  angleAt(pendulum, 1.125);
  const stoppedTransform = pendulum.pendulum.style.transform;
  pendulum.stopMetronome();
  assert.equal(pendulum.cancelledFrame, 1);
  assert.equal(pendulum.pendulum.style.transform, stoppedTransform);
  assert.equal(pendulum.pendulumBeatTime, null);
});

test('clearing the session returns the pendulum to center', () => {
  const pendulum = createPendulum();
  Object.assign(pendulum, {
    METRONOME_GRAPH_OFFSET: 0,
    localStorage: { removeItem() {} },
    metronomeTimelineFollow: null,
    redrawTimeline() {},
    renderPanelView() {},
    applyBaseInfoVisibility() {},
    updateBaseSignatureCircles() {}
  });
  vm.runInContext(clearSource, pendulum);
  pendulum.pendulum.style.transform = 'rotate(22deg)';
  pendulum.clearBeatSessionData();
  assert.equal(pendulum.pendulum.style.transform, 'rotate(0deg)');
  pendulum.schedulePendulumBeat(1, 0.5);
  closeTo(angleAt(pendulum, 1), 0);
  closeTo(angleAt(pendulum, 1.25), 30);
});

function createBend() {
  function target() {
    const listeners = new Map();
    return {
      addEventListener: (name, handler) => listeners.set(name, [...(listeners.get(name) || []), handler]),
      dispatch: (name, event = {}) => listeners.get(name)?.forEach(handler => handler(event))
    };
  }
  const storage = new Map();
  const context = vm.createContext({
    bendOn: false,
    bpmInput: { value: '120.375' },
    bpmSlider: target(),
    bendButton: target(),
    window: target(),
    localStorage: { setItem: (key, value) => storage.set(key, value) },
    updateToggleButtons() {},
    updateBPM(value, persist = true) {
      context.bpmInput.value = Number(value).toFixed(3);
      if (persist) storage.set('metronome.bpm', vm.runInContext('tempoBend.getOriginal()', context) ?? context.bpmInput.value);
    }
  });
  const helperSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'tempo_bend.js'), 'utf8');
  vm.runInContext(helperSource, context);
  const bendSource = source.slice(source.indexOf('function finishTempoBend()'), source.indexOf("volumeSlider.addEventListener('input'"));
  vm.runInContext(bendSource, context);
  context.storage = storage;
  return context;
}

test('Bend restores the exact original tempo on pointer release or cancellation', () => {
  for (const release of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    const bend = createBend();
    bend.bendButton.dispatch('click');
    bend.bpmSlider.dispatch('pointerdown', { button: 0, pointerId: 7 });
    bend.bpmSlider.value = '180';
    bend.bpmSlider.dispatch('input');
    assert.equal(bend.bpmInput.value, '180.000');
    assert.equal(bend.storage.has('metronome.bpm'), false);
    bend.window.dispatch('pointerup', { pointerId: 8 });
    assert.equal(bend.bpmInput.value, '180.000');
    (release === 'lostpointercapture' ? bend.bpmSlider : bend.window).dispatch(release, { pointerId: 7 });
    assert.equal(bend.bpmInput.value, '120.375');
    assert.equal(bend.storage.get('metronome.bpm'), '120.375');
  }
});

test('Bend restores tempo after keyboard release, blur or disabling', () => {
  for (const release of ['keyup', 'blur', 'disable']) {
    const bend = createBend();
    bend.bendButton.dispatch('click');
    bend.bpmSlider.dispatch('keydown', { key: 'ArrowUp' });
    bend.bpmSlider.value = '130';
    bend.bpmSlider.dispatch('input');
    assert.equal(bend.bpmInput.value, '130.000');
    if (release === 'keyup') bend.bpmSlider.dispatch('keyup', { key: 'ArrowUp' });
    if (release === 'blur') bend.bpmSlider.dispatch('blur');
    if (release === 'disable') bend.bendButton.dispatch('click');
    assert.equal(bend.bpmInput.value, '120.375');
  }
});

test('Bend waits until all held tempo keys are released', () => {
  const bend = createBend();
  bend.bendButton.dispatch('click');
  bend.bpmSlider.dispatch('keydown', { key: 'ArrowUp' });
  bend.bpmSlider.dispatch('keydown', { key: 'ArrowRight' });
  bend.bpmSlider.value = '130';
  bend.bpmSlider.dispatch('input');
  bend.bpmSlider.dispatch('keyup', { key: 'ArrowUp' });
  assert.equal(bend.bpmInput.value, '130.000');
  bend.bpmSlider.dispatch('keyup', { key: 'ArrowRight' });
  assert.equal(bend.bpmInput.value, '120.375');
});

test('tempo slider changes remain permanent with Bend off', () => {
  const bend = createBend();
  bend.bpmSlider.dispatch('pointerdown', { button: 0, pointerId: 1 });
  bend.bpmSlider.value = '150';
  bend.bpmSlider.dispatch('input');
  bend.window.dispatch('pointerup', { pointerId: 1 });
  assert.equal(bend.bpmInput.value, '150.000');
  assert.equal(bend.storage.get('metronome.bpm'), '150.000');
});

function createHoldBend() {
  const bend = createBend();
  const listeners = new Map();
  bend.button = {
    addEventListener: (name, handler) => listeners.set(name, handler),
    dispatch: (name, event = {}) => listeners.get(name)?.({ preventDefault() {}, ...event })
  };
  bend.start = () => { bend.adjust(); bend.holding = true; };
  bend.stop = () => { bend.holding = false; };
  bend.adjust = () => bend.updateBPM(parseInt(bend.bpmInput.value, 10) + bend.direction);
  vm.runInContext('tempoBend.bindHold(start, stop, adjust, button)', bend);
  return bend;
}

test('Bend restores tempo after holding either slider button', () => {
  for (const direction of [-1, 1]) {
    for (const release of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) {
      const bend = createHoldBend();
      bend.direction = direction;
      bend.bendButton.dispatch('click');
      bend.button.dispatch('pointerdown', { button: 0, pointerId: 7 });
      bend.adjust();
      assert.equal(Number(bend.bpmInput.value), 120 + 2 * direction);
      assert.equal(bend.storage.get('metronome.bpm'), '120.375');
      bend.button.dispatch(release, { pointerId: 7 });
      assert.equal(bend.bpmInput.value, '120.375');
      assert.equal(bend.holding, false);
    }
  }
});

test('Bend restores tempo after keyboard button release', () => {
  for (const key of ['Enter', ' ']) {
    const bend = createHoldBend();
    bend.direction = 1;
    bend.bendButton.dispatch('click');
    bend.button.dispatch('keydown', { key });
    bend.button.dispatch('keydown', { key });
    assert.equal(bend.bpmInput.value, '122.000');
    bend.button.dispatch('keyup', { key });
    assert.equal(bend.bpmInput.value, '120.375');
  }
});

test('disabling Bend during a button hold stops the hold and restores tempo', () => {
  const bend = createHoldBend();
  bend.direction = 1;
  bend.bendButton.dispatch('click');
  bend.button.dispatch('pointerdown', { button: 0, pointerId: 7 });
  assert.equal(bend.holding, true);
  bend.bendButton.dispatch('click');
  assert.equal(bend.holding, false);
  assert.equal(bend.bpmInput.value, '120.375');
  bend.button.dispatch('pointerup', { pointerId: 7 });
  assert.equal(bend.bpmInput.value, '120.375');
});

test('slider buttons keep their changes when Bend is off', () => {
  const bend = createHoldBend();
  bend.direction = -1;
  bend.button.dispatch('pointerdown', { button: 0, pointerId: 7 });
  bend.button.dispatch('pointerup', { pointerId: 7 });
  assert.equal(bend.bpmInput.value, '119.000');
  assert.equal(bend.storage.get('metronome.bpm'), '119.000');
});
