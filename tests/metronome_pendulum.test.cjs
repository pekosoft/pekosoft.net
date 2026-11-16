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

test('reset restores natural motion and clears its saved preference', () => {
  const storage = new Map([['metronome.emulate_pendulum', 'false']]);
  const context = vm.createContext({
    emulatePendulum: false,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      removeItem: key => storage.delete(key)
    },
    resetButton: { addEventListener: (event, handler) => { context.reset = handler; } },
    stopMetronome() {},
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
