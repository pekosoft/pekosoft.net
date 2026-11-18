const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'meters.js'), 'utf8');
const markup = fs.readFileSync(path.join(__dirname, '..', 'meters.php'), 'utf8');
const hiddenElements = new Set(Array.from(
  markup.matchAll(/<(?:button|div)\b[^>]*\bid="([^"]+)"[^>]*\shidden(?:\s|>)[^>]*>/g),
  match => match[1]
));

function createMeter(initialStorage = {}) {
  const elements = new Map();
  const storage = new Map(Object.entries(initialStorage));
  const draws = [];
  const strokes = [];
  const contextReads = [];
  const errors = [];
  const rulers = {};
  const frames = [];
  const intervals = new Map();
  let nextTimerId = 0;
  let nowMs = 100;
  let currentPath = [];
  const context2d = new Proxy({
    measureText: text => ({ width: text.length * 6 }),
    fillRect: (...args) => draws.push({ args, color: context2d.fillStyle }),
    fillText: text => draws.push({ text }),
    beginPath() { currentPath = []; },
    moveTo(x, y) { currentPath.push(['moveTo', x, y]); },
    lineTo(x, y) { currentPath.push(['lineTo', x, y]); },
    stroke() { strokes.push(currentPath.slice()); }
  }, {
    get(target, key) { return key in target ? target[key] : () => {}; }
  });
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const classes = new Set();
    const listeners = new Map();
    const attributes = new Map();
    const value = {
      width: 600, height: 512, clientWidth: 600, clientHeight: 512,
      hidden: hiddenElements.has(id), textContent: '', offsetWidth: 160, offsetHeight: 80,
      style: { setProperty() {} },
      classList: {
        toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
        contains: name => classes.has(name)
      },
      getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; },
      getContext: () => { contextReads.push(value); return context2d; },
      setAttribute(name, text) { attributes.set(name, text); },
      getAttribute: name => attributes.get(name),
      addEventListener(name, callback) { listeners.set(name, callback); },
      click() { if (!this.disabled) listeners.get('click')?.(); },
      querySelector: selector => element(selector),
      querySelectorAll: () => []
    };
    elements.set(id, value);
    return value;
  }
  const window = {
    location: { pathname: '/player' }, devicePixelRatio: 1,
    PekoBrightGuides: { getGlobal: () => false }, PekoRulers: { getGlobal: () => true },
    PekoSvgTimeline: {
      syncViewBox() {},
      drawVerticalRuler: (element, options) => { rulers.vertical = options; },
      drawHorizontalRuler: (element, options) => { rulers.horizontal = options; },
      drawRulerCorner: (element, options) => { rulers.corner = options; }
    },
    addEventListener() {}
  };
  const context = vm.createContext({
    window,
    document: { getElementById: element, documentElement: {}, createElement: () => element(Symbol()) },
    getComputedStyle: () => ({ getPropertyValue: name => name === '--color2' ? '#ff00ff' : '#0080ff' }),
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    requestAnimationFrame: callback => { frames.push(callback); },
    setInterval(callback, delay) {
      const id = ++nextTimerId;
      intervals.set(id, { callback, delay });
      return id;
    },
    clearInterval: id => intervals.delete(id),
    ResizeObserver: class { observe() {} },
    MutationObserver: class { observe() {} },
    performance: { now: () => nowMs },
    console: { error: text => errors.push(text), warn: text => errors.push(text) },
    Float32Array, Uint8Array
  });
  vm.runInContext(source.replace(/\}\)\(\);(?=\s*\/\/ END OF FILE)/, `
    globalThis.meter = {
      getBitActivity, getBitMeterGeometry, getMeterTicks, getCrosshairReadout,
      applyMode, applyAllMetersMode, applyFreeze, applyGuides, applyBright, applyRulers, applyMulticolor,
      renderBitMeter, redrawMeterFrame, tick, bitMeterState, spectrumDisplayState, levelDisplayState,
      getSourceConfig, buildMeterBitmap, drawGuidesBehind, getDisplayedModes,
      canvasByMode, frameByMode, visibleModes
    };
  })();`), context);
  return {
    ...context.meter, window, element, draws, strokes, contextReads, errors, rulers, storage, frames, intervals, context2d,
    tick(timestamp) { nowMs = timestamp; context.meter.tick(timestamp); }
  };
}

function analyser(samples) {
  return {
    fftSize: samples.length, frequencyBinCount: samples.length, reads: 0, frequencyReads: 0,
    getFloatTimeDomainData(target) { this.reads++; target.set(samples); },
    getByteFrequencyData(target) { this.frequencyReads++; target.set(samples); }
  };
}

function setSource(meter, left, right) {
  const leftAnalyser = analyser(left);
  const rightAnalyser = right ? analyser(right) : null;
  meter.window.__pekosoftMetersSource = {
    analyser: leftAnalyser, analyserLeft: leftAnalyser, analyserRight: rightAnalyser,
    channelCount: right ? 2 : 1, sampleRate: 48000, isActive: () => true
  };
  return { leftAnalyser, rightAnalyser };
}

function activity(meter, samples) {
  const result = new Float32Array(33);
  meter.getBitActivity(Float32Array.from(samples), result);
  return Array.from(result);
}

test('silence and empty buffers have no set bits and clear previous activity', () => {
  const meter = createMeter();
  assert.deepEqual(activity(meter, [0, 0, 0]), Array(33).fill(0));
  const result = new Float32Array(33).fill(1);
  meter.getBitActivity(new Float32Array(0), result);
  assert.deepEqual(Array.from(result), Array(33).fill(0));
});

test('all positive PCM bit weights map from bit 2 through bit 32', () => {
  const meter = createMeter();
  for (let bit = 2; bit <= 32; bit++) {
    const expected = Array(33).fill(0);
    expected[bit] = 1;
    assert.deepEqual(activity(meter, [2 ** (1 - bit)]), expected, `bit ${bit}`);
  }
});

test('signed PCM includes the sign and least significant bits', () => {
  const meter = createMeter();
  const negativeFullScale = Array(33).fill(0);
  negativeFullScale[1] = 1;
  assert.deepEqual(activity(meter, [-1]), negativeFullScale);
  assert.deepEqual(activity(meter, [-(2 ** -31)]), [0, ...Array(32).fill(1)]);
  const half = activity(meter, [-0.5, 0.5, 0, 0]);
  assert.equal(half[1], 0.25);
  assert.equal(half[2], 0.5);
  assert.ok(half.slice(3).every(value => value === 0));
});

test('16-bit quantized samples leave the bottom 16 PCM bits unused', () => {
  const meter = createMeter();
  const samples = [-32768, -12345, -1, 0, 1, 12345, 32767].map(sample => sample / 32768);
  const result = activity(meter, samples);
  assert.ok(result.slice(1, 17).some(value => value > 0));
  assert.deepEqual(result.slice(17), Array(16).fill(0));
});

test('overload counts out-of-range samples before saturation without wrapping', () => {
  const meter = createMeter();
  const result = activity(meter, [2, -2, 1, -1]);
  assert.equal(result[0], 0.5);
  assert.ok(result.slice(1).every(value => value === 0.5));
});

test('PCM conversion rounds sub-bit samples and preserves exact full-scale endpoints', () => {
  const meter = createMeter();
  assert.deepEqual(activity(meter, [2 ** -33, -(2 ** -33)]), Array(33).fill(0));
  assert.equal(activity(meter, [2 ** -32])[32], 1);
  assert.deepEqual(activity(meter, [1]), [0, 0, ...Array(31).fill(1)]);
});

test('stereo channels are sampled independently with their actual FFT sizes', () => {
  const meter = createMeter();
  const { leftAnalyser, rightAnalyser } = setSource(meter, [0.5, 0.5], [0, 0, 0, 0]);
  meter.applyMode('bit_meter');
  meter.tick(100);
  assert.equal(leftAnalyser.reads, 1);
  assert.equal(rightAnalyser.reads, 1);
  assert.equal(meter.bitMeterState.leftSamples.length, 2);
  assert.equal(meter.bitMeterState.rightSamples.length, 4);
  assert.equal(meter.bitMeterState.left[2], 1);
  assert.ok(meter.bitMeterState.right.every(value => value === 0));
  assert.equal(meter.bitMeterState.channels, 2);
  assert.equal(meter.rulers.corner.title, 'Bit');
  assert.equal(meter.rulers.horizontal.ticks.length, 4);
  assert.equal(meter.element('meters-vertical-ruler-bit_meter').getAttribute('aria-label'), 'Meter bit position ruler');
});

test('mono uses a single M lane and never invents a second channel', () => {
  const meter = createMeter();
  const { leftAnalyser } = setSource(meter, [0.25]);
  meter.applyMode('bit_meter');
  meter.tick(100);
  assert.equal(leftAnalyser.reads, 1);
  assert.equal(meter.getBitMeterGeometry(600, 512, meter.getSourceConfig()).channels, 1);
  assert.ok(meter.draws.some(draw => draw.text === 'M'));
  assert.ok(!meter.draws.some(draw => draw.text === 'R'));
  assert.equal(meter.bitMeterState.left[3], 1);
});

test('Bit meter and Spectroscope use the same 60 Hz update cadence', () => {
  const bitMeter = createMeter();
  const { leftAnalyser } = setSource(bitMeter, [0.5]);
  bitMeter.applyMode('bit_meter');
  const spectroscope = createMeter();
  const { leftAnalyser: spectrumAnalyser } = setSource(spectroscope, [255]);
  spectroscope.applyMode('spectroscope');
  for (let timestamp = 101; timestamp <= 151; timestamp += 5) {
    bitMeter.tick(timestamp);
    spectroscope.tick(timestamp);
  }
  assert.equal(leftAnalyser.reads, 4);
  assert.equal(spectrumAnalyser.frequencyReads, leftAnalyser.reads);
});

test('Bit meter matches Spectroscope release and immediate attack', () => {
  const bitMeter = createMeter();
  const samples = [0.5];
  setSource(bitMeter, samples);
  bitMeter.applyMode('bit_meter');
  const spectroscope = createMeter();
  const frequencies = [255];
  setSource(spectroscope, frequencies);
  spectroscope.applyMode('spectroscope');
  bitMeter.tick(100);
  spectroscope.tick(100);
  samples[0] = 0.25;
  frequencies[0] = 0;
  bitMeter.tick(450);
  spectroscope.tick(450);
  assert.equal(bitMeter.bitMeterState.left[2], spectroscope.spectrumDisplayState.levels[0]);
  assert.ok(Math.abs(bitMeter.bitMeterState.left[2] - Math.exp(-1)) < 1e-6);
  assert.equal(bitMeter.bitMeterState.left[3], 1);
  const source = bitMeter.getSourceConfig();
  const { rowTop, rowHeight } = bitMeter.getBitMeterGeometry(600, 512, source);
  assert.match(bitMeter.getCrosshairReadout(0, rowTop + rowHeight * 2.5, 600, 512, source),
    /Displayed activity: 36.8%/);
  samples[0] = 0.5;
  frequencies[0] = 255;
  bitMeter.tick(470);
  spectroscope.tick(470);
  assert.equal(bitMeter.bitMeterState.left[2], 1);
  assert.equal(spectroscope.spectrumDisplayState.levels[0], 1);
});

test('stereo decay keeps channels independent and never falls below current activity', () => {
  const meter = createMeter();
  const left = [0.5, 0.5];
  const right = [0.25, 0.25];
  setSource(meter, left, right);
  meter.applyMode('bit_meter');
  meter.tick(100);
  left[1] = 0;
  right.fill(0.125);
  meter.tick(450);
  assert.equal(meter.bitMeterState.left[2], 0.5);
  assert.equal(meter.bitMeterState.left[4], 0);
  assert.ok(Math.abs(meter.bitMeterState.right[3] - Math.exp(-1)) < 1e-6);
  assert.equal(meter.bitMeterState.right[4], 1);
});

test('Bit meter decay depends on elapsed time rather than frame count', () => {
  function releasedActivity(frameIntervalMs) {
    const meter = createMeter();
    const samples = [0.5];
    setSource(meter, samples);
    meter.applyMode('bit_meter');
    meter.tick(100);
    samples[0] = 0.25;
    for (let timestamp = 100 + frameIntervalMs; timestamp <= 800; timestamp += frameIntervalMs) {
      meter.tick(timestamp);
    }
    return meter.bitMeterState.left[2];
  }
  const frequent = releasedActivity(20);
  const sparse = releasedActivity(100);
  assert.ok(Math.abs(frequent - sparse) < 1e-6);
  assert.ok(Math.abs(frequent - Math.exp(-2)) < 1e-6);
});

test('rare set bits remain measurable below the release cutoff', () => {
  const meter = createMeter();
  const samples = new Float32Array(2048).fill(0.25);
  samples[0] = 2 ** -31;
  setSource(meter, samples);
  meter.applyMode('bit_meter');
  meter.tick(100);
  assert.equal(meter.bitMeterState.left[32], 1 / samples.length);
  samples[0] = 0.25;
  meter.tick(120);
  assert.equal(meter.bitMeterState.left[32], 0);
});

test('missing stereo analysers produce an explicit error and no fabricated activity', () => {
  const meter = createMeter();
  const { leftAnalyser } = setSource(meter, [0.5]);
  meter.window.__pekosoftMetersSource.channelCount = 2;
  meter.window.__pekosoftMetersSource.analyserLeft = null;
  meter.applyMode('bit_meter');
  meter.tick(100);
  meter.tick(120);
  assert.equal(leftAnalyser.reads, 0);
  assert.equal(meter.bitMeterState.ready, false);
  assert.equal(meter.errors.length, 1);
  assert.match(meter.errors[0], /separate left and right analysers/);
  assert.ok(meter.draws.some(draw => draw.text === 'Stereo unavailable'));
});

test('Freeze, presentation changes, mode changes, resizing and crosshair never resample held audio', () => {
  const meter = createMeter();
  const { leftAnalyser, rightAnalyser } = setSource(meter, [0.5], [0.25]);
  meter.applyMode('bit_meter');
  meter.tick(100);
  meter.applyFreeze(true);
  const held = Array.from(meter.bitMeterState.left);
  meter.applyGuides(false);
  meter.applyBright(true);
  meter.applyRulers(false);
  meter.applyMulticolor(false);
  meter.applyMode('phasescope');
  meter.tick(120);
  meter.applyMode('bit_meter');
  const canvas = meter.element('bit-meter');
  canvas.clientWidth = 320;
  canvas.clientHeight = 256;
  meter.window.devicePixelRatio = 2;
  meter.redrawMeterFrame();
  const readout = meter.getCrosshairReadout(20, 40, 320, 256, meter.getSourceConfig());
  assert.match(readout, /Channel: L/);
  assert.equal(canvas.width, 640);
  assert.equal(canvas.height, 512);
  assert.deepEqual(Array.from(meter.bitMeterState.left), held);
  assert.equal(leftAnalyser.reads, 1);
  assert.equal(rightAnalyser.reads, 1);
  meter.applyFreeze(false);
  meter.tick(140);
  assert.equal(leftAnalyser.reads, 2);
  assert.equal(rightAnalyser.reads, 2);
});

test('Bit meter keeps measuring residual signal and silence after the source stops', () => {
  const meter = createMeter();
  const left = [2];
  const right = [-0.5];
  const { leftAnalyser, rightAnalyser } = setSource(meter, left, right);
  meter.applyMode('bit_meter');
  meter.tick(100);
  assert.equal(meter.bitMeterState.left[0], 1);
  meter.window.__pekosoftMetersSource.isActive = () => false;
  meter.window.__pekosoftMetersSource.isStopped = () => true;
  left[0] = 0.25;
  right[0] = -0.25;
  meter.tick(120);
  assert.equal(leftAnalyser.reads, 2);
  assert.equal(rightAnalyser.reads, 2);
  assert.ok(Math.abs(meter.bitMeterState.left[0] - Math.exp(-20 / 350)) < 1e-6);
  assert.equal(meter.bitMeterState.left[3], 1);
  assert.equal(meter.bitMeterState.right[3], 1);
  left.fill(0);
  right.fill(0);
  meter.draws.length = 0;
  meter.tick(140);
  meter.tick(160);
  assert.equal(leftAnalyser.reads, 4);
  assert.equal(rightAnalyser.reads, 4);
  assert.ok(meter.bitMeterState.left.every(value => value === 0));
  assert.ok(meter.bitMeterState.right.every(value => value === 0));
  assert.ok(!meter.draws.some(draw => draw.args?.[2] > 0));
  const { rowTop, rowHeight } = meter.getBitMeterGeometry(600, 512, meter.getSourceConfig());
  assert.match(meter.getCrosshairReadout(0, rowTop + rowHeight * 3.5, 600, 512, meter.getSourceConfig()),
    /Displayed activity: 0.0%/);
});

test('silence clears channel activity even while the source remains active', () => {
  const meter = createMeter();
  const left = [0.5];
  const right = [0.25];
  setSource(meter, left, right);
  meter.applyMode('bit_meter');
  meter.tick(100);
  left.fill(0);
  meter.tick(120);
  assert.ok(meter.bitMeterState.left.every(value => value === 0));
  assert.equal(meter.bitMeterState.right[3], 1);
  right.fill(0);
  meter.tick(140);
  assert.ok(meter.bitMeterState.right.every(value => value === 0));
});

test('Freeze holds activity across stop and releasing it displays current silence', () => {
  const meter = createMeter();
  const left = [0.5];
  const right = [0.25];
  const { leftAnalyser, rightAnalyser } = setSource(meter, left, right);
  meter.applyMode('bit_meter');
  meter.tick(100);
  meter.applyFreeze(true);
  meter.window.__pekosoftMetersSource.isActive = () => false;
  left.fill(0);
  right.fill(0);
  meter.tick(120);
  meter.redrawMeterFrame();
  assert.equal(leftAnalyser.reads, 1);
  assert.equal(rightAnalyser.reads, 1);
  assert.equal(meter.bitMeterState.left[2], 1);
  assert.equal(meter.bitMeterState.right[3], 1);
  meter.applyFreeze(false);
  meter.tick(140);
  assert.equal(leftAnalyser.reads, 2);
  assert.equal(rightAnalyser.reads, 2);
  assert.ok(meter.bitMeterState.left.every(value => value === 0));
  assert.ok(meter.bitMeterState.right.every(value => value === 0));
});

test('reselecting Bit meter after stop samples the current signal instead of its old frame', () => {
  const meter = createMeter();
  const samples = [0.5];
  const { leftAnalyser } = setSource(meter, samples);
  meter.applyMode('bit_meter');
  meter.tick(100);
  meter.applyMode('phasescope');
  meter.window.__pekosoftMetersSource.isActive = () => false;
  samples.fill(0);
  meter.tick(120);
  assert.equal(leftAnalyser.reads, 1);
  meter.applyMode('bit_meter');
  meter.tick(140);
  assert.equal(leftAnalyser.reads, 2);
  assert.ok(meter.bitMeterState.left.every(value => value === 0));
});

test('Phasescope retains its existing inactive-source behavior', () => {
  const meter = createMeter();
  const { leftAnalyser, rightAnalyser } = setSource(meter, [0.5], [0.25]);
  meter.applyMulticolor(false);
  meter.applyMode('phasescope');
  meter.tick(100);
  meter.window.__pekosoftMetersSource.isActive = () => false;
  meter.tick(120);
  meter.redrawMeterFrame();
  assert.equal(leftAnalyser.reads, 1);
  assert.equal(rightAnalyser.reads, 1);
});

test('Level retains its existing immediate attack and 350 ms release', () => {
  const meter = createMeter();
  const { leftAnalyser } = setSource(meter, [0.5]);
  let value = 192;
  leftAnalyser.getByteTimeDomainData = target => target.fill(value);
  meter.applyMulticolor(false);
  meter.applyMode('level');
  meter.tick(100);
  assert.equal(meter.levelDisplayState.left, 0.5);
  value = 128;
  meter.tick(450);
  assert.ok(Math.abs(meter.levelDisplayState.left - 0.5 * Math.exp(-1)) < 1e-6);
});

test('missing sources show no activity and an inactive replacement is measured immediately', () => {
  const meter = createMeter();
  setSource(meter, [0.5]);
  meter.applyMode('bit_meter');
  meter.tick(100);
  meter.window.__pekosoftMetersSource = null;
  meter.draws.length = 0;
  meter.tick(120);
  assert.ok(!meter.draws.some(draw => draw.args?.[2] > 0));
  const { leftAnalyser } = setSource(meter, [0]);
  meter.window.__pekosoftMetersSource.isActive = () => false;
  meter.tick(140);
  assert.equal(leftAnalyser.reads, 1);
  assert.ok(meter.bitMeterState.left.every(value => value === 0));
});

test('Reset clears all Bit meter activity and Freeze', () => {
  const meter = createMeter();
  setSource(meter, [0.5]);
  meter.applyMode('bit_meter');
  meter.tick(100);
  meter.applyAllMetersMode(true);
  meter.applyFreeze(true);
  meter.element('reset-button').click();
  assert.equal(meter.element('meters-freeze-button').getAttribute('aria-pressed'), 'false');
  assert.equal(meter.storage.has('meters.player.view_mode'), false);
  assert.equal(meter.element('meters-all-button').getAttribute('aria-pressed'), 'false');
  assert.equal(meter.bitMeterState.ready, false);
  assert.equal(meter.bitMeterState.lastUpdateMs, 0);
  assert.ok(meter.bitMeterState.currentActivity.every(value => value === 0));
  assert.ok(meter.bitMeterState.left.every(value => value === 0));
  assert.ok(meter.bitMeterState.right.every(value => value === 0));
});

test('hidden meter implementations remain in markup but are excluded from launch modes', () => {
  const meter = createMeter({ 'meters.player.mode': 'bit_meter' });
  assert.ok(meter.canvasByMode.phasescope);
  assert.ok(meter.canvasByMode.bit_meter);
  assert.equal(meter.element('tool-phasescope-button').hidden, true);
  assert.equal(meter.element('tool-bit-meter-button').hidden, true);
  assert.equal(meter.element('meters-frame-phasescope').hidden, true);
  assert.equal(meter.element('meters-frame-bit_meter').hidden, true);
  assert.deepEqual(Array.from(meter.visibleModes), ['spectroscope', 'level', 'oscilloscope', 'wavescope']);
  assert.equal(meter.storage.get('meters.player.mode'), 'oscilloscope');

  meter.applyAllMetersMode(true);
  assert.deepEqual(Array.from(meter.getDisplayedModes()), ['spectroscope', 'level', 'oscilloscope', 'wavescope']);
  meter.element('tool-phasescope-button').click();
  meter.element('tool-bit-meter-button').click();
  assert.equal(meter.storage.get('meters.player.mode'), 'oscilloscope');
  assert.equal(meter.storage.get('meters.player.visible.phasescope'), undefined);
  assert.equal(meter.storage.get('meters.player.visible.bit_meter'), undefined);
});

test('Next cycles through only the four visible meter modes', () => {
  const meter = createMeter({ 'meters.player.mode': 'phasescope' });
  assert.equal(meter.storage.get('meters.player.mode'), 'oscilloscope');
  for (const mode of ['wavescope', 'spectroscope', 'level', 'oscilloscope']) {
    meter.element('meters-next-button').click();
    assert.equal(meter.storage.get('meters.player.mode'), mode);
  }
});

test('All mode toggles individual views and preserves the single-meter selection', () => {
  const meter = createMeter();
  meter.applyMode('oscilloscope');
  meter.element('meters-all-button').click();
  assert.equal(meter.storage.get('meters.player.view_mode'), 'all');
  assert.equal(meter.element('meters-all-button').getAttribute('aria-pressed'), 'true');
  assert.ok(meter.element('meters-container').classList.contains('meters-all-mode'));
  assert.equal(Object.keys(meter.frameByMode).length, 6);
  assert.deepEqual(Array.from(meter.getDisplayedModes()), ['spectroscope', 'level', 'oscilloscope', 'wavescope']);
  assert.equal(meter.element('meters-next-button').disabled, true);
  assert.equal(meter.element('meters-play-button').disabled, true);
  assert.ok(meter.element('meters-next-button').classList.contains('grey'));
  assert.ok(meter.element('meters-play-button').classList.contains('grey'));
  assert.ok(meter.visibleModes.every(mode => !meter.frameByMode[mode].classList.contains('meter-disabled')));
  meter.tick(100);
  assert.ok(meter.visibleModes.every(mode => meter.contextReads.includes(meter.canvasByMode[mode])));
  assert.ok(!meter.contextReads.includes(meter.canvasByMode.phasescope));
  assert.ok(!meter.contextReads.includes(meter.canvasByMode.bit_meter));

  meter.element('tool-level-button').click();
  assert.equal(meter.storage.get('meters.player.visible.level'), 'off');
  assert.equal(meter.element('tool-level-button').getAttribute('aria-pressed'), 'false');
  assert.ok(meter.frameByMode.level.classList.contains('meter-disabled'));
  assert.ok(meter.frameByMode.oscilloscope.classList.contains('active'));
  meter.contextReads.length = 0;
  meter.tick(120);
  assert.ok(!meter.contextReads.includes(meter.canvasByMode.level));
  assert.equal(meter.storage.get('meters.player.mode'), 'oscilloscope');
  assert.equal(meter.element('meters-all-button').getAttribute('aria-pressed'), 'true');
  meter.element('meters-all-button').click();
  assert.equal(meter.storage.get('meters.player.view_mode'), 'one');
  assert.equal(meter.element('meters-all-button').getAttribute('aria-pressed'), 'false');
  assert.ok(!meter.element('meters-container').classList.contains('meters-all-mode'));
  assert.ok(meter.frameByMode.oscilloscope.classList.contains('active'));
  assert.equal(meter.element('meters-next-button').disabled, false);
  assert.equal(meter.element('meters-play-button').disabled, false);
  meter.element('meters-all-button').click();
  meter.element('tool-phasescope-button').click();
  assert.equal(meter.storage.get('meters.player.mode'), 'oscilloscope');
  assert.equal(meter.element('tool-phasescope-button').hidden, true);
  meter.element('tool-phasescope-button').click();
  assert.equal(meter.element('tool-phasescope-button').getAttribute('aria-pressed'), undefined);
});

test('saved All mode is restored without changing the saved meter selection', () => {
  const meter = createMeter({
    'meters.player.view_mode': 'all',
    'meters.player.mode': 'bit_meter',
    'meters.piano.view_mode': 'one'
  });
  assert.equal(meter.element('meters-all-button').getAttribute('aria-pressed'), 'true');
  assert.ok(meter.element('meters-container').classList.contains('meters-all-mode'));
  assert.equal(meter.storage.get('meters.player.mode'), 'oscilloscope');
  assert.ok(meter.frameByMode.oscilloscope.classList.contains('active'));
  assert.equal(meter.frameByMode.bit_meter.classList.contains('active'), false);
  assert.equal(meter.storage.get('meters.piano.view_mode'), 'one');
});

test('saved hidden meter selection falls back without changing other tools', () => {
  const meter = createMeter({ 'meters.player.mode': 'bit_meter', 'meters.piano.mode': 'level' });
  assert.equal(meter.storage.get('meters.player.mode'), 'oscilloscope');
  assert.ok(meter.element('waveform').classList.contains('active'));
  assert.equal(meter.element('tool-bit-meter-button').classList.contains('button-on'), false);
  assert.equal(meter.storage.get('meters.piano.mode'), 'level');
});

test('Play advances immediately, cycles at 10-second intervals, wraps, and stops when toggled off', () => {
  const meter = createMeter();
  const play = meter.element('meters-play-button');
  assert.equal(meter.intervals.size, 0);
  play.click();
  assert.equal(play.getAttribute('aria-pressed'), 'true');
  assert.equal(meter.storage.get('meters.player.mode'), 'wavescope');
  assert.equal(meter.intervals.size, 1);
  const timer = [...meter.intervals.values()][0];
  assert.equal(timer.delay, 10000);
  timer.callback();
  assert.equal(meter.storage.get('meters.player.mode'), 'spectroscope');
  timer.callback();
  assert.equal(meter.storage.get('meters.player.mode'), 'level');
  play.click();
  assert.equal(play.getAttribute('aria-pressed'), 'false');
  assert.equal(meter.storage.get('meters.player.mode'), 'level');
  assert.equal(meter.intervals.size, 0);
  play.click();
  assert.equal(meter.storage.get('meters.player.mode'), 'oscilloscope');
  assert.equal(meter.intervals.size, 1);
});

test('selecting any meter tab stops Play even when already selected in single view', () => {
    const meter = createMeter();
    meter.applyFreeze(true);
    const play = meter.element('meters-play-button');
    for (const [mode, button] of [
      ['wavescope', 'tool-wavescope-button'],
      ['oscilloscope', 'tool-oscilloscope-button'],
      ['spectroscope', 'tool-spectroscope-button'],
      ['level', 'tool-level-button']
    ]) {
      play.click();
      assert.equal(meter.intervals.size, 1);
      meter.element(button).click();
      assert.equal(meter.storage.get('meters.player.mode'), mode);
      assert.equal(meter.intervals.size, 0);
      assert.equal(play.getAttribute('aria-pressed'), 'false');
      assert.equal(play.classList.contains('button-on'), false);
      assert.equal(play.title, 'Start cycling meters');
      assert.equal(meter.element('meters-all-button').getAttribute('aria-pressed'), 'false');
      assert.equal(meter.element('meters-freeze-button').getAttribute('aria-pressed'), 'true');
    }
    play.click();
    assert.equal(meter.intervals.size, 1);
    const activeMode = meter.storage.get('meters.player.mode');
    meter.element('tool-phasescope-button').click();
    assert.equal(meter.storage.get('meters.player.mode'), activeMode);
    assert.equal(meter.intervals.size, 1);
    play.click();
});

test('Next advances the meter without stopping Play', () => {
  const meter = createMeter();
  meter.element('meters-play-button').click();
  meter.element('meters-next-button').click();
  assert.equal(meter.storage.get('meters.player.mode'), 'spectroscope');
  assert.equal(meter.intervals.size, 1);
  assert.equal(meter.element('meters-play-button').getAttribute('aria-pressed'), 'true');
  [...meter.intervals.values()][0].callback();
  assert.equal(meter.storage.get('meters.player.mode'), 'level');
});

test('entering All stops Play and disables cycling until returning to one meter', () => {
  const meter = createMeter();
  meter.applyFreeze(true);
  meter.element('meters-play-button').click();
  assert.equal(meter.intervals.size, 1);
  meter.applyAllMetersMode(true);
  assert.equal(meter.intervals.size, 0);
  assert.equal(meter.element('meters-play-button').getAttribute('aria-pressed'), 'false');
  meter.element('meters-play-button').click();
  meter.element('meters-next-button').click();
  assert.equal(meter.intervals.size, 0);
  assert.equal(meter.element('meters-all-button').getAttribute('aria-pressed'), 'true');
  assert.equal(meter.element('meters-freeze-button').getAttribute('aria-pressed'), 'true');
  assert.equal(meter.storage.get('meters.player.mode'), 'wavescope');
  meter.applyAllMetersMode(false);
  meter.element('meters-play-button').click();
  assert.equal(meter.intervals.size, 1);
  meter.element('reset-button').click();
  assert.equal(meter.intervals.size, 0);
  assert.equal(meter.element('meters-play-button').getAttribute('aria-pressed'), 'false');
});

test('All visibility is restored per tool and Reset enables every meter', () => {
  const meter = createMeter({ 'meters.player.view_mode': 'all', 'meters.player.visible.level': 'off', 'meters.piano.visible.level': 'off' });
  assert.equal(meter.element('tool-level-button').getAttribute('aria-pressed'), 'false');
  assert.ok(meter.frameByMode.level.classList.contains('meter-disabled'));
  meter.element('reset-button').click();
  assert.equal(meter.storage.has('meters.player.visible.level'), false);
  assert.equal(meter.storage.get('meters.piano.visible.level'), 'off');
  meter.element('meters-all-button').click();
  assert.equal(meter.element('tool-level-button').getAttribute('aria-pressed'), 'true');
});

test('hiding every meter disables bitmap actions until a view is enabled', () => {
  const meter = createMeter();
  meter.applyAllMetersMode(true);
  for (const id of ['tool-spectroscope-button', 'tool-level-button', 'tool-oscilloscope-button', 'tool-wavescope-button']) {
    meter.element(id).click();
  }
  assert.equal(meter.element('meters-save-button').disabled, true);
  assert.equal(meter.element('meters-copy-button').disabled, true);
  assert.ok(meter.element('meters-save-button').classList.contains('grey'));
  meter.element('tool-level-button').click();
  assert.equal(meter.element('meters-save-button').disabled, false);
  assert.ok(meter.frameByMode.level.classList.contains('active'));
});

test('crosshair reports cached bit percentages and overload instead of time or decibels', () => {
  const meter = createMeter();
  setSource(meter, [0.5], [0]);
  meter.applyMode('bit_meter');
  meter.tick(100);
  const source = meter.getSourceConfig();
  const { rowTop, rowHeight, rightStart } = meter.getBitMeterGeometry(600, 512, source);
  const left = meter.getCrosshairReadout(0, rowTop + rowHeight * 2.5, 600, 512, source);
  assert.match(left, /Channel: L\nBit 2\nCursor: 100.0%\nDisplayed activity: 100.0%/);
  const right = meter.getCrosshairReadout(rightStart, rowTop + rowHeight * 2.5, 600, 512, source);
  assert.match(right, /Channel: R/);
  assert.match(right, /Displayed activity: 0.0%/);
  const over = meter.getCrosshairReadout(0, rowTop + rowHeight / 2, 600, 512, source);
  assert.match(over, /Displayed overload: 0.0%/);
  assert.match(meter.getCrosshairReadout(0, 0, 600, 512, source), /32-bit PCM activity/);
  meter.bitMeterState.ready = false;
  assert.match(meter.getCrosshairReadout(0, rowTop + rowHeight * 2.5, 600, 512, source), /Displayed activity: -/);
});

test('rulers retain all bit bars while thinning labels for short plots', () => {
  const meter = createMeter();
  const tall = meter.getMeterTicks('bit_meter', 600, 800, { channelCount: 2 });
  const short = meter.getMeterTicks('bit_meter', 320, 200, { channelCount: 2 });
  assert.equal(tall.vertical.length, 34);
  assert.equal(short.vertical.length, tall.vertical.length);
  assert.ok(short.labels.length < tall.labels.length);
  assert.equal(short.labels.at(-1).label, '32');
  assert.equal(short.horizontal.length, 4);
});

test('Rulers extend standard meter tick lines across the plot without Guides', () => {
  const meter = createMeter();
  const width = 320;
  const height = 200;
  const source = { sampleRate: 48000, channelCount: 2 };
  meter.applyGuides(false);
  meter.applyRulers(true);
  const ticks = meter.getMeterTicks('oscilloscope', width, height, source);
  meter.drawGuidesBehind('oscilloscope', meter.context2d, width, height, source);
  const lines = meter.strokes.map(commands => {
    const start = commands.find(([type]) => type === 'moveTo');
    const end = commands.find(([type]) => type === 'lineTo');
    return [start, end];
  });
  const expectedLines = ticks.horizontal.filter(({ position }) => position !== 0).length
    + ticks.vertical.filter(({ position }) => position !== 0).length;
  assert.equal(lines.length, expectedLines);
  assert.ok(lines.length > 0);
  assert.ok(lines.every(([start, end]) =>
    (start[1] === end[1] && start[2] === 0 && end[2] === height)
    || (start[2] === end[2] && start[1] === 0 && end[1] === width)
  ));

  meter.strokes.length = 0;
  meter.applyRulers(false);
  meter.drawGuidesBehind('oscilloscope', meter.context2d, width, height, source);
  assert.equal(meter.strokes.length, 0);

  meter.applyGuides(true);
  meter.drawGuidesBehind('oscilloscope', meter.context2d, width, height, source);
  assert.ok(meter.strokes.length > 0);
});
