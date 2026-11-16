const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { setImmediate: settleAudio } = require('node:timers/promises');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'js', 'demo.js'), 'utf8');
const audioScript = fs.readFileSync(path.join(__dirname, '..', 'js', 'audio.js'), 'utf8');
const template = fs.readFileSync(path.join(__dirname, '..', 'demo.php'), 'utf8');

function createDemo({ blocked = false, embedded = false, fullscreenFailure = false, theme = 'dark', random = Math.random, audioRate = 1, outputLatency = 0 } = {}) {
  let now = 0;
  let nextFrame = 0;
  const frames = new Map();
  const timers = new Map();
  let nextTimer = 0;
  const contexts = [];
  const errors = [];
  const storage = new Map([['global.theme', theme]]);
  const rootClasses = new Set(theme === 'light' ? ['invert-colors'] : []);
  const element = () => ({
    attributes: {},
    handlers: {},
    style: {},
    textContent: '',
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    getAttribute(name) { return this.attributes[name]; },
    addEventListener(name, callback) { this.handlers[name] = callback; },
    click() { return this.handlers.click(); }
  });
  const parts = Array.from({ length: 4 }, element);
  const closingIcon = element();
  const closingUrl = element();
  const closingUrlLink = element();
  const closingUrlText = element();
  const closingUrlCaret = element();
  closingUrl.attributes['aria-label'] = 'pekosoft.net';
  closingUrlLink.attributes['data-demo-url-link'] = '/';
  closingUrl.querySelector = selector => ({
    '[data-demo-url-link]': closingUrlLink,
    '[data-demo-url-text]': closingUrlText,
    '[data-demo-url-caret]': closingUrlCaret
  })[selector];
  const signatureBeats = Array.from({ length: 4 }, element);
  const partsBySlide = [[], [parts[0]], [parts[1]], [parts[2]], [parts[3]], [closingIcon], [], [], [], [], [], [closingUrl]];
  const descriptions = partsBySlide.map((_, index) => index > 0 && index < 5 ? element() : null);
  const titles = descriptions.map(description => description ? element() : null);
  const pointIcons = partsBySlide.map((_, index) => index >= 6 && index <= 10 ? element() : null);
  pointIcons.forEach((icon, index) => {
    if (icon) icon.dataset = { demoPointIcon: index === 10 ? 'fade' : '' };
  });
  const slides = [...template.matchAll(/data-demo-slide data-duration="(\d+)"/g)]
    .map(([, duration], index) => ({
      dataset: { duration },
      style: {},
      hidden: true,
      contains: part => partsBySlide[index].includes(part),
      querySelector: selector => ({
        'h1': titles[index],
        '[data-demo-description]': descriptions[index],
        '[data-demo-point-icon]': pointIcons[index]
      })[selector]
    }));
  const play = element();
  const replay = element();
  const start = embedded ? element() : null;
  const darkMode = element();
  const sound = element();
  const loop = element();
  const download = element();
  const fullscreen = element();
  const more = element();
  const controls = element();
  const playbackControls = element();
  playbackControls.hidden = true;
  const controlButtons = [more, darkMode, sound, play, replay, loop, download, fullscreen];
  controls.contains = target => controlButtons.includes(target);
  const status = element();
  const openingLogo = element();
  const openingSlogan = element();
  const staticBackground = element();
  const staticNoise = element();
  const nodes = {
    '[data-demo-controls]': controls,
    '[data-demo-more]': more,
    '[data-demo-playback]': playbackControls,
    '[data-demo-static]': staticBackground,
    '[data-demo-noise]': staticNoise,
    '[data-demo-opening-logo]': openingLogo,
    '[data-demo-slogan]': openingSlogan,
    '[data-demo-floppy]': closingIcon,
    '[data-demo-url]': closingUrl,
    '[data-demo-play]': play,
    '[data-demo-replay]': replay,
    '[data-demo-start]': start,
    '[data-demo-dark-mode]': darkMode,
    '[data-demo-sound]': sound,
    '[data-demo-loop]': loop,
    '[data-demo-download]': download,
    '[data-demo-fullscreen]': fullscreen,
    '[data-demo-status]': status,
    '[data-demo-tap]': parts[0],
    '[data-demo-notes]': parts[1],
    '[data-demo-pendulum]': parts[2],
    '[data-demo-platter]': parts[3]
  };
  const parameter = () => ({
    value: 1,
    events: [],
    setValueAtTime(value, time) { this.value = value; this.events.push({ value, time }); },
    linearRampToValueAtTime(value, time) { this.events.push({ value, time }); },
    exponentialRampToValueAtTime(value, time) { this.events.push({ value, time, curve: 'exponential' }); },
    cancelScheduledValues(time) { this.events = this.events.filter(event => event.time < time); },
    setTargetAtTime(value, time) { this.value = value; this.events.push({ value, time }); }
  });
  const node = () => ({
    outputs: [],
    connect(destination) { this.outputs.push(destination); return destination; },
    disconnect() { this.disconnected = true; },
    gain: parameter()
  });
  class AudioContext {
    constructor() {
      this.state = blocked ? 'suspended' : 'running';
      this.destination = {};
      this.oscillators = [];
      this.gains = [];
      this.sources = [];
      this.delays = [];
      this.convolvers = [];
      this.filters = [];
      this.sampleRate = 48000;
      contexts.push(this);
    }
    get currentTime() { return now / 1000 * audioRate; }
    getOutputTimestamp() {
      return { contextTime: Math.max(0, this.currentTime - outputLatency), performanceTime: now };
    }
    createAnalyser() { this.analyser = node(); return this.analyser; }
    createGain() {
      const gain = node();
      this.gains.push(gain);
      return gain;
    }
    createOscillator() {
      const endedListeners = [];
      const oscillator = {
        ...node(),
        frequency: parameter(),
        stops: [],
        start(time = now / 1000, offset = 0) { this.started = true; this.startTime = time; this.offset = offset; },
        stop(time) { this.stopped = true; this.stopTime = time; this.stops.push(time); },
        setPeriodicWave() { this.type = 'custom'; },
        addEventListener(name, callback) {
          if (name === 'ended') endedListeners.push(callback);
        },
        finish() {
          if (this.finished) return;
          this.finished = true;
          if (this.onended) this.onended();
          endedListeners.forEach(callback => callback());
        }
      };
      this.oscillators.push(oscillator);
      this.sources.push(oscillator);
      return oscillator;
    }
    createPeriodicWave() { return {}; }
    createBuffer(channels, length) {
      const samples = new Float32Array(length);
      return { sampleRate: this.sampleRate, duration: length / this.sampleRate, getChannelData: () => samples };
    }
    createBufferSource() {
      const source = this.createOscillator();
      this.oscillators.pop();
      source.kind = 'buffer';
      return source;
    }
    createBiquadFilter() {
      const filter = { ...node(), frequency: parameter(), Q: parameter() };
      this.filters.push(filter);
      return filter;
    }
    createDelay() {
      const delay = { ...node(), delayTime: parameter() };
      this.delays.push(delay);
      return delay;
    }
    createConvolver() {
      const convolver = node();
      this.convolvers.push(convolver);
      return convolver;
    }
    addEventListener() {}
    resume() {
      if (blocked) return new Promise(() => {});
      this.state = 'running';
      return Promise.resolve();
    }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  const window = { AudioContext, addEventListener() {} };
  const document = {
    ...element(),
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {
      classList: {
        contains: name => rootClasses.has(name),
        toggle(name, active) {
          if (active) rootClasses.add(name);
          else rootClasses.delete(name);
        }
      },
      async requestFullscreen() {
        if (fullscreenFailure) throw new Error('Fullscreen denied');
        document.fullscreenElement = this;
        document.handlers.fullscreenchange();
      }
    },
    async exitFullscreen() {
      document.fullscreenElement = null;
      document.handlers.fullscreenchange();
    },
    querySelector: selector => nodes[selector],
    querySelectorAll: selector => selector === '[data-demo-signature-beat]' ? signatureBeats : slides
  };
  const math = Object.create(Math);
  controlButtons.forEach(button => {
    button.focus = () => { document.activeElement = button; };
    button.matches = selector => selector === ':focus-visible' && Boolean(button.keyboardFocused);
  });
  math.random = random;
  vm.runInNewContext(audioScript + '\n' + script, {
    window,
    document,
    Math: math,
    AbortController,
    performance: { now: () => now },
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value))
    },
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (callback, delay) => {
      timers.set(++nextTimer, { callback, time: now + delay });
      return nextTimer;
    },
    clearTimeout: id => timers.delete(id),
    console: { error: (...args) => errors.push(args) }
  });
  return {
    play, replay, start, sound, loop, download, fullscreen, darkMode, more, controls, playbackControls, storage, document, window, status, slides, contexts, errors, parts, signatureBeats, descriptions, titles, staticBackground, staticNoise, openingLogo, openingSlogan, closingIcon, closingUrlLink, closingUrlText, closingUrlCaret,
    advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of timers) {
        if (timer.time > now) continue;
        timers.delete(id);
        timer.callback();
      }
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback(now));
    },
    active() { return slides.findIndex(slide => !slide.hidden); }
  };
}

test('embedded Demo waits for Play without audio or progress, then supports pause and resume', async () => {
  const demo = createDemo({ embedded: true });
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  assert.equal(demo.controls.hidden, true);
  demo.advance(10000);
  demo.document.handlers.pointermove();
  assert.equal(demo.controls.hidden, true);
  assert.equal(demo.contexts.length, 0);
  assert.equal(demo.active(), 0);
  assert.equal(demo.slides[0].style.opacity, '0');
  demo.start.click();
  await settleAudio();
  assert.equal(demo.start.hidden, true);
  assert.equal(demo.controls.hidden, false);
  assert.equal(demo.document.activeElement, demo.more);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  assert.ok(demo.contexts[0].sources.length > 0);
  demo.advance(150);
  assert.ok(Math.abs(Number(demo.slides[0].style.opacity) - 0.5) < 1e-9);
  demo.play.click();
  demo.advance(10000);
  assert.ok(Math.abs(Number(demo.slides[0].style.opacity) - 0.5) < 1e-9);
  assert.equal(demo.start.hidden, true);
  demo.play.click();
  demo.advance(150);
  assert.equal(demo.slides[0].style.opacity, '1');
  assert.deepEqual(demo.errors, []);
});

test('More stays open during inactivity and only hides when collapsed', () => {
  const demo = createDemo();
  assert.equal(demo.playbackControls.hidden, true);
  demo.more.click();
  assert.equal(demo.playbackControls.hidden, false);
  assert.equal(demo.more.getAttribute('aria-expanded'), 'true');
  demo.advance(6000);
  assert.equal(demo.controls.hidden, false);
  assert.equal(demo.playbackControls.hidden, false);
  assert.equal(demo.more.getAttribute('aria-expanded'), 'true');
  demo.document.handlers.pointermove();
  demo.advance(6000);
  assert.equal(demo.controls.hidden, false);
  assert.equal(demo.playbackControls.hidden, false);
  demo.more.click();
  demo.advance(2999);
  assert.equal(demo.controls.hidden, false);
  demo.advance(1);
  assert.equal(demo.controls.hidden, true);
  assert.equal(demo.playbackControls.hidden, true);
  assert.equal(demo.more.getAttribute('aria-expanded'), 'false');
  assert.equal(demo.play.getAttribute('aria-pressed'), 'true');
  demo.document.handlers.pointerdown({ target: null });
  assert.equal(demo.controls.hidden, false);
  assert.equal(demo.playbackControls.hidden, true);
  demo.more.click();
  demo.more.click();
  assert.equal(demo.playbackControls.hidden, true);
});

test('keyboard activity reveals More and focused controls stay visible until focus leaves', () => {
  const demo = createDemo();
  demo.advance(3000);
  demo.document.handlers.keydown({ key: 'Tab' });
  assert.equal(demo.controls.hidden, false);
  demo.more.click();
  demo.play.keyboardFocused = true;
  demo.play.focus();
  demo.controls.handlers.focusin();
  demo.advance(4000);
  assert.equal(demo.controls.hidden, false);
  assert.equal(demo.playbackControls.hidden, false);
  demo.document.handlers.keydown({ key: 'Escape' });
  assert.equal(demo.playbackControls.hidden, true);
  assert.equal(demo.document.activeElement, demo.more);
  demo.document.activeElement = null;
  demo.controls.handlers.focusout();
  demo.advance(3000);
  assert.equal(demo.controls.hidden, true);
});

test('video download includes audio when muted and restores paused playback and position', async () => {
  const demo = createDemo();
  await settleAudio();
  demo.advance(7000);
  demo.play.click();
  demo.sound.click();
  demo.window.downloadDemoVideo = async ({ startAudio, render, onProgress }) => {
    assert.ok([demo.play, demo.replay, demo.sound, demo.darkMode, demo.loop, demo.download, demo.fullscreen]
      .every(button => button.disabled));
    const sources = demo.contexts[0].sources.length;
    startAudio();
    assert.ok(demo.contexts[0].sources.length > sources);
    render(21000);
    onProgress(50);
    assert.match(demo.status.textContent, /50%/);
    demo.advance(5000);
  };
  await demo.download.click();
  assert.equal(demo.active(), 1);
  assert.equal(demo.titles[1].style.visibility, 'visible');
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  assert.equal(demo.sound.attributes['aria-pressed'], 'false');
  assert.equal(demo.download.disabled, false);
  assert.equal(demo.errors.length, 0);
  demo.advance(2000);
  assert.equal(demo.titles[1].style.visibility, 'visible');
});

test('video export failures are reported and restore ongoing playback without skipping', async () => {
  const demo = createDemo();
  await settleAudio();
  demo.advance(7000);
  demo.window.downloadDemoVideo = async () => {
    demo.advance(5000);
    throw new Error('Video encoder failed.');
  };
  await demo.download.click();
  assert.match(demo.status.textContent, /video could not be downloaded/);
  assert.equal(demo.errors.length, 1);
  assert.equal(demo.errors[0][1].message, 'Video encoder failed.');
  assert.equal(demo.download.disabled, false);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  assert.equal(demo.active(), 1);
  demo.advance(1500);
  assert.equal(demo.titles[1].style.visibility, 'hidden');
});

test('video download explicitly rejects unsupported recording without starting capture', async () => {
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'demo-video.js'), 'utf8'), { window });
  await assert.rejects(window.downloadDemoVideo({}), /does not support video downloads/);
});

test('sparse background grains repeat during the floppy scene and freeze when paused', () => {
  const demo = createDemo();
  assert.equal(demo.staticBackground.style.display, 'none');
  demo.advance(2999);
  assert.equal(demo.staticBackground.style.display, 'none');
  demo.advance(1);
  assert.equal(demo.staticBackground.style.display, 'block');
  const firstFrame = demo.staticNoise.getAttribute('patternTransform');
  demo.advance(119);
  assert.equal(demo.staticNoise.getAttribute('patternTransform'), firstFrame);
  demo.advance(1);
  const nextFrame = demo.staticNoise.getAttribute('patternTransform');
  assert.notEqual(nextFrame, firstFrame);
  demo.play.click();
  demo.advance(500);
  assert.equal(demo.staticNoise.getAttribute('patternTransform'), nextFrame);
  demo.play.click();
  demo.advance(120);
  assert.notEqual(demo.staticNoise.getAttribute('patternTransform'), nextFrame);
  demo.advance(2760);
  for (const duration of [4000, 4000, 4000, 5000]) {
    assert.equal(demo.staticBackground.style.display, 'none');
    demo.advance(duration);
  }
  assert.equal(demo.staticBackground.style.display, 'block');
  const floppyFrame = demo.staticNoise.getAttribute('patternTransform');
  demo.advance(120);
  const nextFloppyFrame = demo.staticNoise.getAttribute('patternTransform');
  assert.notEqual(nextFloppyFrame, floppyFrame);
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.staticBackground.style.display, 'block');
  assert.equal(demo.staticNoise.getAttribute('patternTransform'), nextFloppyFrame);
  demo.play.click();
  demo.advance(2180);
  assert.equal(demo.active(), 6);
  assert.equal(demo.staticBackground.style.display, 'none');
  const closingFrame = demo.staticNoise.getAttribute('patternTransform');
  demo.advance(9000);
  assert.equal(demo.staticBackground.style.display, 'none');
  assert.equal(demo.staticNoise.getAttribute('patternTransform'), closingFrame);
  demo.play.click();
  assert.equal(demo.staticBackground.style.display, 'none');
  demo.advance(3000);
  assert.equal(demo.staticBackground.style.display, 'block');
  assert.equal(demo.staticNoise.getAttribute('patternTransform'), firstFrame);
});

test('tool descriptions follow titles without overlap and stay until the scene ends, with pause support', () => {
  const demo = createDemo();
  demo.advance(6000);
  for (const [index, duration] of [[1, 4000], [2, 4000], [3, 4000], [4, 5000]]) {
    const description = demo.descriptions[index];
    const title = demo.titles[index];
    assert.equal(demo.active(), index);
    assert.equal(title.style.visibility, 'visible');
    assert.equal(description.style.opacity, '0');
    demo.advance(2499);
    assert.equal(title.style.visibility, 'visible');
    assert.equal(description.style.opacity, '0');
    demo.advance(1);
    assert.equal(title.style.visibility, 'hidden');
    assert.equal(description.style.opacity, '0');
    demo.advance(250);
    assert.equal(title.style.visibility, 'hidden');
    assert.equal(description.style.opacity, '0.5');
    demo.play.click();
    demo.advance(2000);
    assert.equal(title.style.visibility, 'hidden');
    assert.equal(description.style.opacity, '0.5');
    demo.play.click();
    demo.advance(250);
    assert.equal(description.style.opacity, '1');
    demo.advance(duration - 3001);
    assert.equal(demo.active(), index);
    assert.equal(title.style.visibility, 'hidden');
    assert.equal(description.style.opacity, '1');
    demo.advance(1);
  }
  assert.equal(demo.active(), 5);
  demo.advance(12300);
  demo.play.click();
  demo.advance(6000);
  assert.equal(demo.titles[1].style.visibility, 'visible');
  assert.equal(demo.descriptions[1].style.opacity, '0');
});

test('Dark mode follows the restored theme and saves toggles without interrupting playback', async () => {
  for (const theme of ['dark', 'light']) {
    const demo = createDemo({ theme });
    await settleAudio();
    assert.equal(demo.darkMode.attributes['aria-pressed'], String(theme === 'dark'));
    demo.advance(6500);
    const sourceCount = demo.contexts[0].sources.length;
    demo.darkMode.click();
    assert.equal(demo.storage.get('global.theme'), theme === 'dark' ? 'light' : 'dark');
    assert.equal(demo.document.documentElement.classList.contains('invert-colors'), theme === 'dark');
    assert.equal(demo.darkMode.attributes['aria-pressed'], String(theme === 'light'));
    assert.equal(demo.play.attributes['aria-pressed'], 'true');
    assert.equal(demo.active(), 1);
    assert.equal(demo.contexts[0].sources.length, sourceCount);
    assert.ok(demo.contexts[0].sources.every(source => source.stops.length === 1));
    demo.advance(3500);
    assert.equal(demo.active(), 2);
    demo.darkMode.click();
    assert.equal(demo.storage.get('global.theme'), theme);
    assert.equal(demo.darkMode.attributes['aria-pressed'], String(theme === 'dark'));
  }
});

test('video surface clicks pause and resume without handling controls or links', async () => {
  const demo = createDemo();
  const surface = { closest: () => null };
  await settleAudio();
  demo.advance(6500);
  demo.document.handlers.click({ target: surface });
  demo.advance(319);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  demo.advance(1);
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  demo.advance(1000);
  assert.equal(demo.active(), 1);
  demo.document.handlers.click({ target: surface });
  demo.advance(320);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  demo.document.handlers.click({ target: demo.play });
  demo.document.handlers.click({ target: { closest: () => demo.closingUrlLink } });
  demo.advance(500);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  assert.deepEqual(demo.errors, []);
});

test('video double-click toggles fullscreen without changing playing or paused state', async () => {
  const surface = { closest: () => null };
  for (const playing of [true, false]) {
    const demo = createDemo();
    await settleAudio();
    if (!playing) demo.play.click();
    const count = demo.contexts[0].sources.length;
    for (const fullscreen of [true, false]) {
      demo.document.handlers.click({ target: surface });
      demo.advance(100);
      demo.document.handlers.click({ target: surface });
      demo.document.handlers.dblclick({ target: surface, preventDefault() {} });
      await settleAudio();
      demo.advance(500);
      assert.equal(Boolean(demo.document.fullscreenElement), fullscreen);
      assert.equal(demo.play.attributes['aria-pressed'], String(playing));
      assert.equal(demo.contexts[0].sources.length, count);
    }
    demo.document.fullscreenEnabled = false;
    demo.document.handlers.fullscreenchange();
    demo.document.handlers.click({ target: surface });
    demo.document.handlers.dblclick({ target: surface, preventDefault() {} });
    demo.advance(500);
    assert.equal(demo.document.fullscreenElement, null);
    assert.equal(demo.play.attributes['aria-pressed'], String(playing));
    assert.deepEqual(demo.errors, []);
  }
});

test('video surface gestures and pending clicks cannot interrupt an export', async () => {
  const demo = createDemo();
  const surface = { closest: () => null };
  await settleAudio();
  demo.document.handlers.click({ target: surface });
  demo.window.downloadDemoVideo = async ({ startAudio }) => {
    startAudio();
    demo.document.handlers.click({ target: surface });
    demo.document.handlers.dblclick({ target: surface, preventDefault() {} });
    demo.advance(1000);
    assert.equal(demo.play.attributes['aria-pressed'], 'false');
    assert.equal(demo.document.fullscreenElement, null);
  };
  await demo.download.click();
  demo.advance(1000);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  assert.deepEqual(demo.errors, []);
});

test('Fullscreen toggles without interrupting playback and follows browser exits', async () => {
  const demo = createDemo();
  await settleAudio();
  await demo.fullscreen.click();
  assert.equal(demo.fullscreen.attributes['aria-pressed'], 'true');
  assert.equal(demo.document.fullscreenElement, demo.document.documentElement);
  demo.advance(6000);
  assert.equal(demo.active(), 1);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  await demo.fullscreen.click();
  assert.equal(demo.fullscreen.attributes['aria-pressed'], 'false');
  assert.equal(demo.document.fullscreenElement, null);
  await demo.fullscreen.click();
  await demo.document.exitFullscreen();
  assert.equal(demo.fullscreen.attributes['aria-pressed'], 'false');
});

test('Fullscreen failures are reported without stopping playback', async () => {
  const demo = createDemo({ fullscreenFailure: true });
  await settleAudio();
  await demo.fullscreen.click();
  assert.equal(demo.fullscreen.attributes['aria-pressed'], 'false');
  assert.match(demo.status.textContent, /Fullscreen could not change/);
  assert.equal(demo.errors.length, 1);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
});

test('demo fades the opening logo and slogan with C1, ends with floppy, points and URL and stops without looping', async () => {
  const demo = createDemo();
  await settleAudio();
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  assert.equal(demo.sound.attributes['aria-pressed'], 'true');
  assert.equal(demo.loop.attributes['aria-pressed'], 'false');
  assert.equal(demo.active(), 0);
  assert.equal(demo.slides[0].style.opacity, '0');
  const note = demo.contexts[0].oscillators[0];
  assert.equal(note.started, true);
  assert.ok(Math.abs(note.frequency.value - 32.7032) < 0.001);
  assert.equal(note.type, 'triangle');
  assert.equal(note.stopTime, 6.6);
  assert.deepEqual(demo.contexts[0].oscillators[0].outputs[0].gain.events, [
    { value: 0, time: 0 },
    { value: 0.22, time: 0.3 },
    { value: 0.22, time: 5.4 },
    { value: 0, time: 6.6 }
  ]);
  demo.advance(150);
  assert.equal(demo.slides[0].style.opacity, '0.5');
  demo.advance(150);
  assert.equal(demo.slides[0].style.opacity, '1');
  demo.advance(1700);
  assert.equal(demo.active(), 0);
  assert.equal(demo.openingLogo.style.display, '');
  assert.equal(demo.openingSlogan.hidden, true);
  demo.advance(1000);
  assert.equal(demo.active(), 0);
  assert.equal(demo.openingLogo.style.display, 'none');
  assert.equal(demo.openingSlogan.hidden, false);
  assert.equal(demo.slides[0].style.opacity, '0');
  demo.advance(150);
  assert.equal(demo.slides[0].style.opacity, '0.5');
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.slides[0].style.opacity, '0.5');
  assert.equal(demo.openingSlogan.hidden, false);
  demo.play.click();
  demo.advance(150);
  assert.equal(demo.slides[0].style.opacity, '1');
  for (const [milliseconds, slide] of [[2700, 1], [4000, 2], [4000, 3], [4000, 4], [5000, 5], [2300, 6], [1000, 7], [1000, 8], [1000, 9], [1000, 10], [1000, 11]]) {
    demo.advance(milliseconds);
    assert.equal(demo.active(), slide);
  }
  demo.advance(4000);
  assert.equal(demo.active(), 11);
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  demo.advance(30000);
  assert.equal(demo.active(), 11);
  assert.equal(demo.contexts[0].oscillators.filter(source => source.type === 'triangle').length, 1);
});

test('opening C fades into the first Tap Pad beats and resumes only its remaining tail', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const note = context.oscillators.find(source => source.type === 'triangle');
  const kicks = context.oscillators.filter(source => source.type === 'sine' && source.startTime >= 6 && source.startTime < 10);
  assert.equal(kicks[0].startTime, 6);
  assert.ok(note.stopTime > kicks[1].startTime && note.stopTime < kicks[2].startTime);
  const fade = note.outputs[0].gain.events.slice(-2);
  assert.ok(Math.abs(fade[1].time - fade[0].time - 1.2) < 1e-9);
  assert.equal(fade[1].value, 0);
  demo.advance(6200);
  assert.equal(demo.active(), 1);
  demo.play.click();
  demo.advance(1000);
  demo.play.click();
  await settleAudio();
  const resumedNote = context.oscillators.filter(source => source.type === 'triangle').at(-1);
  assert.notEqual(resumedNote, note);
  assert.ok(Math.abs(resumedNote.stopTime - 7.6) < 1e-9);
  assert.ok(Math.abs(resumedNote.outputs[0].gain.events[0].value - 0.22 / 3) < 1e-9);
  demo.advance(400);
  demo.play.click();
  demo.play.click();
  await settleAudio();
  assert.equal(context.oscillators.filter(source => source.type === 'triangle').length, 2);
});

test('floppy scene schedules no sound effects, including after resuming', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  assert.equal(context.sources.some(source => source.startTime >= 23 && source.startTime < 25.3), false);
  demo.advance(24000);
  demo.play.click();
  const count = context.sources.length;
  demo.play.click();
  await settleAudio();
  assert.equal(context.sources.slice(count).some(source => source.startTime < 25.3), false);
  assert.deepEqual(demo.errors, []);
});

test('mouse clicks match opening blinks without replaying past clicks after pause', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const clicks = context.sources.filter(source => source.kind === 'buffer' && source.startTime < 1.3);
  const times = [0.9, 1.16];
  assert.equal(clicks.length, times.length);
  clicks.forEach((source, index) => {
    assert.ok(Math.abs(source.startTime - times[index]) < 1e-9);
    assert.ok(Math.abs(source.stopTime - source.startTime - 0.024) < 1e-9);
    const highPass = source.outputs[0];
    const envelope = highPass.outputs[0].outputs[0];
    assert.ok(envelope.gain.events[1].value <= 0.15);
    assert.equal(highPass.frequency.events[0].value, 1170);
    assert.equal(envelope.outputs[0].outputs[0], context.analyser);
  });
  demo.advance(900);
  assert.equal(demo.openingLogo.style.opacity, '0.25');
  demo.advance(55);
  demo.play.click();
  assert.ok(clicks.every(source => source.stops.at(-1) === context.currentTime + 0.02));
  const count = context.sources.length;
  demo.advance(1000);
  demo.play.click();
  await settleAudio();
  const resumed = context.sources.slice(count).filter(source => source.buffer === clicks[0].buffer
    && source.startTime < 2.3);
  assert.equal(resumed.length, 1);
  assert.ok(Math.abs(resumed[0].startTime - 2.16) < 1e-9);
  assert.deepEqual(demo.errors, []);
});

test('opening logo briefly blinks twice and freezes its blink when paused', () => {
  const demo = createDemo();
  for (const [milliseconds, opacity] of [[899, '1'], [1, '0.25'], [79, '0.25'], [1, '1'], [179, '1'], [1, '0.25']]) {
    demo.advance(milliseconds);
    assert.equal(demo.openingLogo.style.opacity, opacity);
  }
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.openingLogo.style.opacity, '0.25');
  demo.play.click();
  demo.advance(80);
  assert.equal(demo.openingLogo.style.opacity, '1');
  demo.advance(1760);
  assert.equal(demo.openingLogo.style.display, 'none');
  assert.equal(demo.openingSlogan.hidden, false);
});

test('floppy fades in after 300 ms, pauses mid-fade and yields when its zoom ends', () => {
  const demo = createDemo();
  demo.advance(22999);
  assert.equal(demo.active(), 4);
  demo.advance(1);
  assert.equal(demo.active(), 5);
  assert.equal(demo.closingIcon.style.opacity, '0');
  demo.advance(299);
  assert.equal(demo.closingIcon.style.opacity, '0');
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.closingIcon.style.opacity, '0');
  demo.play.click();
  demo.advance(1);
  assert.equal(demo.closingIcon.style.opacity, '0');
  demo.advance(75);
  assert.equal(demo.closingIcon.style.opacity, '0.5');
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.closingIcon.style.opacity, '0.5');
  demo.play.click();
  demo.advance(75);
  assert.equal(demo.closingIcon.style.opacity, '1');
  demo.advance(1849);
  assert.equal(demo.active(), 5);
  demo.advance(1);
  assert.equal(demo.active(), 6);
});

test('floppy holds for one second then zooms exponentially in one second with pause and restart support', () => {
  const demo = createDemo();
  demo.advance(23300);
  assert.equal(demo.closingIcon.style.transform, 'scale(1)');
  demo.advance(999);
  assert.equal(demo.closingIcon.style.transform, 'scale(1)');
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.closingIcon.style.transform, 'scale(1)');
  demo.play.click();
  demo.advance(1);
  assert.equal(demo.closingIcon.style.transform, 'scale(1)');
  demo.advance(500);
  assert.equal(demo.active(), 5);
  assert.equal(demo.closingIcon.style.opacity, '1');
  const transform = demo.closingIcon.style.transform;
  assert.ok(Math.abs(Number(transform.match(/scale\(([^)]+)\)/)[1]) - 8) < 1e-9);
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.closingIcon.style.transform, transform);
  demo.play.click();
  demo.advance(499);
  assert.equal(demo.active(), 5);
  assert.ok(Math.abs(Number(demo.closingIcon.style.transform.match(/scale\(([^)]+)\)/)[1]) - 64 ** 0.999) < 1e-9);
  demo.advance(1);
  assert.equal(demo.active(), 6);
  demo.advance(100);
  assert.equal(demo.slides[6].querySelector('[data-demo-point-icon]').style.opacity, '0.875');
  demo.advance(8900);
  demo.play.click();
  demo.advance(23300);
  assert.equal(demo.closingIcon.style.transform, 'scale(1)');
});

test('point icons fade in and out, rotating except the last icon and freezing when paused', () => {
  const demo = createDemo();
  demo.advance(25300);
  for (let index = 6; index <= 10; index += 1) {
    const icon = demo.slides[index].querySelector('[data-demo-point-icon]');
    const transform = angle => index === 10 ? 'none' : `rotate(${angle}deg)`;
    assert.equal(demo.active(), index);
    assert.equal(icon.style.transform, transform(-90));
    assert.equal(icon.style.opacity, '0');
    demo.advance(100);
    assert.equal(icon.style.transform, transform(-11.25));
    assert.equal(icon.style.opacity, '0.875');
    demo.advance(100);
    assert.equal(icon.style.transform, transform(0));
    assert.equal(icon.style.opacity, '1');
    demo.advance(600);
    assert.equal(icon.style.transform, transform(0));
    assert.equal(icon.style.opacity, '1');
    demo.advance(100);
    assert.equal(icon.style.transform, transform(11.25));
    assert.equal(icon.style.opacity, '0.875');
    assert.equal(demo.active(), index);
    if (index === 7) {
      demo.play.click();
      demo.advance(2000);
      assert.equal(demo.active(), index);
      assert.equal(icon.style.transform, 'rotate(11.25deg)');
      assert.equal(icon.style.opacity, '0.875');
      demo.play.click();
    }
    demo.advance(99);
    assert.equal(demo.active(), index);
    assert.ok(Number(icon.style.opacity) < 0.02);
    demo.advance(1);
  }
  assert.equal(demo.active(), 11);
  assert.equal(demo.closingUrlText.textContent, '');
  demo.advance(4000);
  demo.play.click();
  demo.advance(25300);
  assert.equal(demo.slides[6].querySelector('[data-demo-point-icon]').style.transform, 'rotate(-90deg)');
});

test('all five selling-point icons play one glass pling on entry and resume skips past entrances', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const plings = context.oscillators.filter(source => source.type === 'sine' && source.startTime >= 25.3);
  assert.deepEqual(plings.map(source => source.startTime), [25.3, 26.3, 27.3, 28.3, 29.3].flatMap(time => [time, time, time]));
  const input = plings[0].outputs[0].outputs[0];
  const [dry, reverb] = input.outputs;
  assert.equal(dry.outputs[0], context.analyser);
  assert.ok(context.convolvers.includes(reverb));
  assert.equal(reverb.buffer.duration, 0.35);
  const wet = reverb.outputs[0];
  assert.equal(wet.gain.value, 0.12);
  assert.equal(wet.outputs[0], dry);
  for (const [index, pling] of plings.entries()) {
    const [ratio, gain, duration] = [[1, 0.075, 0.32], [2.756, 0.022, 0.16], [5.404, 0.008, 0.08]][index % 3];
    assert.deepEqual(pling.frequency.events, [{ value: 1046.5023 * ratio, time: pling.startTime }]);
    assert.deepEqual(pling.outputs[0].gain.events, [
      { value: 0, time: pling.startTime },
      { value: gain, time: pling.startTime + 0.002 },
      { value: 0.0001, time: pling.startTime + duration - 0.006, curve: 'exponential' },
      { value: 0, time: pling.startTime + duration }
    ]);
    assert.ok(Math.abs(pling.stopTime - pling.startTime - duration) < 1e-9);
    assert.equal(pling.outputs[0].outputs[0], input);
  }
  demo.advance(25800);
  demo.play.click();
  assert.ok(plings.every(source => source.stops.length === 2));
  context.sources.forEach(source => source.finish());
  assert.ok(input.disconnected && reverb.disconnected && wet.disconnected);
  const count = context.sources.length;
  demo.advance(1000);
  demo.play.click();
  await settleAudio();
  const resumed = context.sources.slice(count).filter(source => source.type === 'sine');
  assert.deepEqual(resumed.map(source => source.startTime), [27.3, 28.3, 29.3, 30.3].flatMap(time => [time, time, time]));
  assert.notEqual(resumed[0].outputs[0].outputs[0], input);
  demo.advance(3700);
  demo.play.click();
  const afterLastEntrance = context.sources.length;
  demo.play.click();
  await settleAudio();
  assert.equal(context.sources.slice(afterLastEntrance).filter(source => source.type === 'sine').length, 0);
  assert.deepEqual(demo.errors, []);
});

test('Play fades each playback batch independently and rapid toggles preserve the current gain', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const firstOutput = context.gains[1];
  assert.deepEqual(firstOutput.gain.events, [
    { value: 0, time: 0 },
    { value: 1, time: 0.02 }
  ]);
  demo.advance(500);
  const firstSources = [...context.sources];
  demo.play.click();
  assert.deepEqual(firstOutput.gain.events.slice(-2), [
    { value: 1, time: 0.5 },
    { value: 0, time: 0.52 }
  ]);
  assert.ok(firstSources.every(source => source.stopTime === 0.52 && !source.disconnected));
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  demo.advance(10);
  const gainCount = context.gains.length;
  demo.play.click();
  await settleAudio();
  const nextOutput = context.gains[gainCount];
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  assert.deepEqual(nextOutput.gain.events, [
    { value: 0, time: 0.51 },
    { value: 1, time: 0.53 }
  ]);
  demo.advance(10);
  firstSources.forEach(source => source.finish());
  assert.equal(firstOutput.disconnected, true);
  assert.ok(!nextOutput.disconnected);
  assert.equal(nextOutput.outputs[0], context.analyser);
  demo.play.click();
  const fade = nextOutput.gain.events.slice(-2);
  assert.ok(Math.abs(fade[0].value - 0.5) < 1e-9);
  assert.equal(fade[0].time, 0.52);
  assert.equal(fade[1].value, 0);
  assert.equal(fade[1].time, 0.54);
  assert.equal(demo.errors.length, 0);
});

test('Play pauses in place, resumes without skipping and restarts after the end', async () => {
  const demo = createDemo();
  await settleAudio();
  demo.advance(8000);
  demo.play.click();
  demo.advance(20000);
  assert.equal(demo.active(), 1);
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  demo.play.click();
  demo.advance(2000);
  assert.equal(demo.active(), 2);
  demo.advance(25300);
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  demo.play.click();
  await settleAudio();
  assert.equal(demo.active(), 0);
  assert.equal(demo.contexts[0].oscillators.filter(source => source.type === 'triangle').length, 2);
});

test('Replay restarts playing, paused and finished demos without changing settings or closing More', async () => {
  for (const state of ['playing', 'paused', 'finished']) {
    const demo = createDemo();
    await settleAudio();
    demo.advance(state === 'finished' ? 34300 : 8000);
    if (state === 'paused') {
      demo.play.click();
      demo.sound.click();
    }
    demo.loop.click();
    demo.more.click();
    const context = demo.contexts[0];
    const sources = [...context.sources];
    const openingNotes = context.oscillators.filter(source => source.type === 'triangle').length;
    demo.replay.click();
    await settleAudio();
    assert.equal(demo.active(), 0);
    assert.equal(demo.slides[0].style.opacity, '0');
    assert.equal(demo.play.attributes['aria-pressed'], 'true');
    assert.equal(demo.sound.attributes['aria-pressed'], String(state !== 'paused'));
    assert.equal(demo.loop.attributes['aria-pressed'], 'true');
    assert.equal(demo.playbackControls.hidden, false);
    assert.equal(demo.more.attributes['aria-expanded'], 'true');
    assert.equal(context.oscillators.filter(source => source.type === 'triangle').length,
      openingNotes + (state === 'paused' ? 0 : 1));
    if (state === 'playing') {
      assert.ok(sources.every(source => source.stops.length === 2));
      assert.ok(sources.every(source => Math.abs(source.stops.at(-1) - 8.02) < 1e-9));
    }
    demo.advance(150);
    assert.ok(Math.abs(Number(demo.slides[0].style.opacity) - 0.5) < 1e-9);
    assert.deepEqual(demo.errors, []);
  }
});

test('closing URL becomes clickable only when it turns blue, including pause and restart', () => {
  const demo = createDemo();
  demo.advance(30300);
  assert.equal(demo.active(), 11);
  assert.equal(demo.closingUrlText.textContent, '');
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  assert.equal(demo.closingUrlCaret.style.visibility, 'visible');
  demo.advance(90);
  assert.equal(demo.closingUrlText.textContent, 'p');
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.closingUrlText.textContent, 'p');
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  demo.play.click();
  demo.advance(989);
  assert.equal(demo.closingUrlText.textContent, 'pekosoft.ne');
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  demo.advance(1);
  assert.equal(demo.closingUrlText.textContent, 'pekosoft.net');
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  assert.equal(demo.closingUrlCaret.style.visibility, 'hidden');
  for (const visibility of ['visible', 'hidden', 'visible']) {
    demo.advance(250);
    assert.equal(demo.closingUrlCaret.style.visibility, visibility);
    assert.equal(demo.closingUrlLink.attributes.href, undefined);
  }
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.closingUrlCaret.style.visibility, 'visible');
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  demo.play.click();
  demo.advance(249);
  assert.equal(demo.closingUrlCaret.style.visibility, 'visible');
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  demo.advance(1);
  assert.equal(demo.closingUrlCaret.style.visibility, 'hidden');
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  assert.equal(demo.closingUrlLink.attributes['data-demo-url-color'], undefined);
  demo.advance(199);
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  assert.equal(demo.closingUrlLink.attributes['data-demo-url-color'], undefined);
  demo.play.click();
  demo.advance(1000);
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  assert.equal(demo.closingUrlLink.attributes['data-demo-url-color'], undefined);
  demo.play.click();
  demo.advance(1);
  assert.equal(demo.closingUrlLink.attributes.href, '/');
  assert.equal(demo.closingUrlLink.attributes['data-demo-url-color'], '');
  demo.advance(1720);
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  demo.advance(5000);
  assert.equal(demo.closingUrlText.textContent, 'pekosoft.net');
  assert.equal(demo.closingUrlCaret.style.visibility, 'hidden');
  demo.play.click();
  demo.advance(30300);
  assert.equal(demo.closingUrlText.textContent, '');
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  assert.equal(demo.closingUrlLink.attributes['data-demo-url-color'], undefined);
  assert.equal(demo.closingUrlCaret.style.visibility, 'visible');
});

test('keyboard taps match each typed character and resume without replaying previous keys', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const keys = context.sources.filter(source => source.kind === 'buffer' && source.startTime >= 30.3);
  assert.equal(keys.length, 'pekosoft.net'.length);
  for (const [index, key] of keys.entries()) {
    assert.ok(Math.abs(key.startTime - (30.3 + (index + 1) * 0.09)) < 1e-9);
    assert.ok(key.stopTime - key.startTime < 0.03);
    const highPass = key.outputs[0];
    const lowPass = highPass.outputs[0];
    assert.ok(highPass.frequency.events[0].value < 1000);
    assert.ok(lowPass.frequency.events[0].value < 4000);
  }
  demo.advance(30615);
  assert.equal(demo.closingUrlText.textContent, 'pek');
  demo.play.click();
  assert.ok(keys.every(key => key.stops.length === 2));
  const previousCount = context.sources.length;
  demo.advance(1000);
  demo.play.click();
  await settleAudio();
  const remaining = context.sources.slice(previousCount).filter(source => source.kind === 'buffer');
  assert.equal(remaining.length, keys.length - 3);
  assert.ok(Math.abs(remaining[0].startTime - 31.66) < 1e-9);
  assert.deepEqual(demo.errors, []);
});

test('Sound mutes output without stopping the presentation and Loop restarts the opening', async () => {
  const demo = createDemo();
  await settleAudio();
  demo.sound.click();
  assert.equal(demo.contexts[0].gains[0].gain.value, 0);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  demo.advance(6000);
  assert.equal(demo.active(), 1);
  demo.sound.click();
  await settleAudio();
  assert.equal(demo.contexts[0].gains[0].gain.value, 1);
  demo.loop.click();
  demo.advance(28300);
  await settleAudio();
  assert.equal(demo.active(), 0);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  assert.equal(demo.contexts[0].oscillators.filter(source => source.type === 'triangle').length, 2);
  demo.loop.click();
  demo.advance(34300);
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
});

test('blocked audio does not stall autoplay and pausing before resume prevents a delayed note', async () => {
  const blockedDemo = createDemo({ blocked: true });
  assert.match(blockedDemo.status.textContent, /browser blocked sound/);
  blockedDemo.advance(11000);
  assert.equal(blockedDemo.active(), 2);
  assert.equal(blockedDemo.play.attributes['aria-pressed'], 'true');
  assert.equal(blockedDemo.contexts[0].oscillators.length, 0);
  const demo = createDemo();
  demo.play.click();
  await settleAudio();
  assert.equal(demo.contexts[0].oscillators.length, 0);
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
});

test('Tap Pad starts on its first audible kick and stays synchronized despite clock drift and output latency', async () => {
  for (const { audioRate, outputLatency, timestamps } of [
    { audioRate: 1.02, outputLatency: 0.08, timestamps: true },
    { audioRate: 0.98, outputLatency: 0, timestamps: false }
  ]) {
    const demo = createDemo({ audioRate, outputLatency });
    await settleAudio();
    const context = demo.contexts[0];
    if (!timestamps) context.getOutputTimestamp = undefined;
    const kicks = context.oscillators.filter(source => source.type === 'sine'
      && source.frequency.events[0]?.value === 48 * 3.1);
    assert.equal(kicks.length, 8);
    demo.advance((kicks[0].startTime + outputLatency) * 1000 / audioRate - 1);
    assert.equal(demo.active(), 0);
    demo.advance(1.001);
    for (let beat = 0; beat < kicks.length; beat += 1) {
      if (beat) demo.advance(500 / audioRate);
      assert.equal(demo.active(), 1);
      assert.equal(demo.parts[0].style.visibility, 'visible');
      assert.ok(Math.abs(Number(demo.parts[0].attributes.r) - 88) < 0.001);
      assert.equal(kicks[beat].startTime, 6 + beat * 0.5);
    }
    assert.deepEqual(demo.errors, []);
  }
});

test('resuming Tap Pad preserves its phase until the resumed sound reaches the output', async () => {
  const audioRate = 1.02;
  const outputLatency = 0.08;
  const demo = createDemo({ audioRate, outputLatency });
  await settleAudio();
  demo.advance((6.09 + outputLatency) * 1000 / audioRate);
  assert.ok(Math.abs(Number(demo.parts[0].attributes.r) - 106) < 0.001);
  demo.play.click();
  demo.advance(1000);
  assert.ok(Math.abs(Number(demo.parts[0].attributes.r) - 106) < 0.001);
  const context = demo.contexts[0];
  const count = context.sources.length;
  demo.play.click();
  await settleAudio();
  const kicks = context.sources.slice(count).filter(source => source.type === 'sine'
    && source.frequency.events[0]?.value === 48 * 3.1);
  assert.equal(kicks.length, 7);
  assert.ok(Math.abs(kicks[0].startTime - context.currentTime - 0.41) < 0.00001);
  demo.advance(outputLatency * 1000 / audioRate - 1);
  assert.ok(Math.abs(Number(demo.parts[0].attributes.r) - 106) < 0.001);
  demo.advance(1 + 45 / audioRate);
  assert.ok(Math.abs(Number(demo.parts[0].attributes.r) - 115) < 0.001);
  assert.equal(demo.parts[0].style.visibility, 'visible');
  assert.deepEqual(demo.errors, []);
});

test('icon feedback follows the beat, calculator notes scroll, and Turntable winds down', () => {
  const demo = createDemo();
  const [tap, notes, pendulum, platter] = demo.parts;
  demo.advance(6000);
  assert.equal(tap.attributes.r, '88');
  assert.equal(tap.style.visibility, 'visible');
  assert.equal(Number(tap.style.opacity ?? 1), 1);
  demo.advance(90);
  assert.equal(Number(tap.attributes.r), 106);
  assert.equal(tap.style.visibility, 'visible');
  assert.equal(Number(tap.style.opacity ?? 1), 1);
  demo.play.click();
  demo.advance(1000);
  assert.equal(Number(tap.attributes.r), 106);
  demo.play.click();
  demo.advance(89);
  assert.ok(Number(tap.attributes.r) > 123);
  assert.equal(tap.style.visibility, 'visible');
  assert.equal(Number(tap.style.opacity ?? 1), 1);
  demo.advance(1);
  assert.equal(Number(tap.attributes.r), 124);
  assert.equal(tap.style.visibility, 'hidden');
  assert.equal(Number(tap.style.opacity ?? 1), 1);
  demo.play.click();
  demo.advance(1000);
  assert.equal(tap.style.visibility, 'hidden');
  demo.play.click();
  demo.advance(319);
  assert.equal(tap.style.visibility, 'hidden');
  demo.advance(1);
  assert.equal(Number(tap.attributes.r), 88);
  assert.equal(tap.style.visibility, 'visible');
  assert.equal(Number(tap.style.opacity ?? 1), 1);
  demo.advance(3500);
  assert.equal(demo.active(), 2);
  assert.equal(notes.attributes.transform, 'translate(0 0)');
  demo.advance(75);
  assert.ok(Math.abs(Number(notes.attributes.transform.match(/translate\(([^ ]+)/)[1]) + 19.2) < 1e-9);
  demo.advance(3924);
  assert.ok(Math.abs(Number(notes.attributes.transform.match(/translate\(([^ ]+)/)[1]) + 1023.744) < 1e-9);
  const pausedNotes = notes.attributes.transform;
  demo.play.click();
  demo.advance(500);
  assert.equal(notes.attributes.transform, pausedNotes);
  demo.play.click();
  demo.advance(1);
  assert.equal(demo.active(), 3);
  assert.equal(pendulum.attributes.transform, 'rotate(28 254.051 454)');
  assert.deepEqual(demo.signatureBeats.map(circle => circle.attributes.fill), ['none', '#000', '#000', '#000']);
  demo.advance(500);
  assert.equal(pendulum.attributes.transform, 'rotate(-28 254.051 454)');
  assert.deepEqual(demo.signatureBeats.map(circle => circle.attributes.fill), ['#000', 'none', '#000', '#000']);
  demo.play.click();
  demo.advance(1000);
  assert.deepEqual(demo.signatureBeats.map(circle => circle.attributes.fill), ['#000', 'none', '#000', '#000']);
  demo.play.click();
  demo.advance(500);
  assert.deepEqual(demo.signatureBeats.map(circle => circle.attributes.fill), ['#000', '#000', 'none', '#000']);
  demo.advance(500);
  assert.deepEqual(demo.signatureBeats.map(circle => circle.attributes.fill), ['#000', '#000', '#000', 'none']);
  demo.advance(500);
  assert.deepEqual(demo.signatureBeats.map(circle => circle.attributes.fill), ['none', '#000', '#000', '#000']);
  demo.advance(2000);
  assert.equal(platter.attributes.transform, 'rotate(0 218.125 256)');
  demo.advance(450);
  const earlyAngle = Number(platter.attributes.transform.match(/rotate\(([^ ]+)/)[1]);
  assert.ok(Math.abs(earlyAngle - 20.25) < 1e-9);
  demo.advance(1350);
  const laterAngle = Number(platter.attributes.transform.match(/rotate\(([^ ]+)/)[1]);
  assert.ok(Math.abs(laterAngle - 260) < 1e-9);
});

test('Turntable winds up and brakes gradually with line speed proportional to its lower pitch', async () => {
  const demo = createDemo();
  await settleAudio();
  const wind = demo.contexts[0].oscillators.find(source => source.type === 'sawtooth');
  const events = wind.frequency.events;
  assert.deepEqual(events, [
    { value: 0, time: 18 },
    { value: 65.4064, time: 19 },
    { value: 65.4064, time: 21 },
    { value: 0, time: 23 }
  ]);
  assert.equal(wind.frequency.events.some(event => event.curve === 'exponential'), false);
  const angle = () => Number(demo.parts[3].attributes.transform.match(/rotate\(([^ ]+)/)[1]);
  let elapsed = 0;
  const speeds = [];
  for (const [time, expectedRpm] of [[18.4, 40 / 3], [18.8, 80 / 3], [19.6, 100 / 3], [20.8, 100 / 3], [21.6, 70 / 3], [22.6, 20 / 3]]) {
    demo.advance(time * 1000 - 1 - elapsed);
    const before = angle();
    demo.advance(2);
    elapsed = time * 1000 + 1;
    const rpm = ((angle() - before + 360) % 360) / 2 * 60000 / 360;
    assert.ok(Math.abs(rpm - expectedRpm) < 1e-7);
    const next = events.findIndex(event => event.time > time);
    const from = events[next - 1];
    const to = events[next];
    const pitch = from.value + (to.value - from.value) * (time - from.time) / (to.time - from.time);
    assert.ok(Math.abs(rpm / (100 / 3) - pitch / 65.4064) < 1e-7);
    speeds.push(rpm);
  }
  assert.ok(speeds[1] > speeds[0]);
  assert.ok(Math.abs(speeds[4] - speeds[5] - 50 / 3) < 1e-7);
});

test('resuming during Turntable wind-up or braking preserves the RPM, pitch ramp and line angle', async () => {
  for (const [time, speedRatio] of [[18400, 0.4], [22700, 0.15]]) {
    const demo = createDemo();
    await settleAudio();
    demo.advance(time);
    demo.play.click();
    const transform = demo.parts[3].attributes.transform;
    const context = demo.contexts[0];
    const count = context.sources.length;
    demo.advance(5000);
    assert.equal(demo.parts[3].attributes.transform, transform);
    demo.play.click();
    await settleAudio();
    assert.equal(demo.parts[3].attributes.transform, transform);
    const resumed = context.sources.slice(count).find(source => source.type === 'sawtooth');
    assert.ok(Math.abs(resumed.frequency.events[0].value / 65.4064 - speedRatio) < 1e-9);
    assert.deepEqual(resumed.frequency.events.at(-1), { value: 0, time: 28 });
    assert.ok(Math.abs(resumed.stopTime - 28.6) < 1e-9);
    demo.advance(23000 - time - 1);
    const angle = Number(demo.parts[3].attributes.transform.match(/rotate\(([^ ]+)/)[1]);
    assert.ok(Math.abs(angle - 340) < 0.001);
    demo.advance(1);
    assert.equal(demo.active(), 5);
  }
});

test('tool scenes synthesize kicks, triplet echoes, eight metronome ticks and wind-down', async () => {
  const demo = createDemo();
  await settleAudio();
  assert.deepEqual(demo.errors, []);
  const context = demo.contexts[0];
  const kicks = context.oscillators.filter(source => source.type === 'sine' && source.startTime >= 6 && source.startTime < 10);
  assert.equal(kicks.length, 8);
  assert.deepEqual(kicks.map(source => source.startTime),
    Array.from({ length: 8 }, (_, index) => 6 + index * 0.5));
  assert.ok(kicks.every(source => source.frequency.events[1].value === 48));
  demo.advance(9999);
  assert.equal(demo.active(), 1);
  demo.advance(1);
  assert.equal(demo.active(), 2);
  const plucks = context.oscillators.filter(source => source.type === 'custom' && source.startTime >= 10 && source.startTime < 14);
  assert.equal(plucks.length, 8);
  assert.deepEqual(plucks.slice(0, 4).map(source => source.frequency.events[0].value),
    plucks.slice(4).map(source => source.frequency.events[0].value));
  assert.ok(plucks.every(source => source.outputs[0].outputs[0].outputs.includes(context.delays[0])));
  assert.equal(plucks[0].startTime, 10);
  assert.equal(plucks.at(-1).startTime, 13.5);
  assert.equal(context.delays.length, 1);
  assert.equal(context.delays[0].delayTime.value, 1 / 6);
  const clicks = context.sources.filter(source => source.kind === 'buffer' && source.startTime >= 14 && source.startTime < 18);
  assert.equal(clicks.length, 8);
  for (const [index, click] of clicks.entries()) {
    assert.equal(click.startTime, 14 + index * 0.5);
    const highPass = click.outputs[0];
    const envelope = highPass.outputs[0].outputs[0];
    const gain = envelope.gain;
    assert.equal(envelope.outputs[0].outputs[0], context.analyser);
    const accented = index % 4 === 0;
    assert.equal(highPass.frequency.events[0].value, 1800 * (accented ? 1.55 : 1));
    assert.equal(gain.events[1].value, 0.9 * (accented ? 0.675 : 0.425));
  }
  const echoes = context.sources.filter(source => source.kind === 'buffer'
    && source.startTime > 18 && source.startTime <= 18.5);
  assert.equal(echoes.length, 0);
  const wind = context.oscillators.find(source => source.type === 'sawtooth');
  assert.equal(wind.startTime, 18);
  assert.equal(clicks.at(-1).startTime, 17.5);
  assert.equal(wind.stopTime, 23.6);
  assert.equal(wind.frequency.events[0].value, 0);
  assert.deepEqual(wind.frequency.events.at(-1), { value: 0, time: 23 });
});

test('resuming in Turntable does not schedule a metronome tail', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  demo.advance(18200);
  demo.play.click();
  const previousCount = context.sources.length;
  demo.play.click();
  await settleAudio();
  const resumedEchoes = context.sources.slice(previousCount)
    .filter(source => source.kind === 'buffer' && source.outputs[0].type === 'highpass'
      && source.startTime >= 18 && source.startTime <= 18.6);
  assert.equal(resumedEchoes.length, 0);
});

test('Turntable mixes sparse crackle independently of its quieter tone, resumes in place and stops with the platter', async () => {
  const demo = createDemo({ random: () => 0.75 });
  await settleAudio();
  const context = demo.contexts[0];
  const crackle = context.sources.find(source => source.kind === 'buffer' && source.buffer.duration === 5);
  const wind = context.oscillators.find(source => source.type === 'sawtooth');
  assert.equal(crackle.startTime, 18);
  assert.equal(crackle.stopTime, 23);
  assert.equal(crackle.offset, 0);
  const samples = crackle.buffer.getChannelData(0);
  assert.ok(samples.some(value => value !== 0));
  assert.ok(samples.every(value => Math.abs(value) <= 0.12));
  assert.ok(samples.some(value => Math.abs(value) > 0.055));
  assert.ok(samples.filter(value => value !== 0).length < samples.length * 0.05);
  const filter = crackle.outputs[0];
  assert.equal(filter.type, 'lowpass');
  assert.equal(filter.frequency.value, 3500);
  assert.equal(filter.outputs[0], wind.outputs[0].outputs[0].outputs[0]);
  demo.advance(21000);
  demo.play.click();
  assert.equal(crackle.stopTime, 21.02);
  const count = context.sources.length;
  demo.advance(1000);
  crackle.finish();
  assert.equal(filter.disconnected, true);
  demo.play.click();
  await settleAudio();
  const resumed = context.sources.slice(count).find(source => source.kind === 'buffer' && source.buffer.duration === 5);
  assert.equal(resumed.startTime, 22);
  assert.equal(resumed.offset, 3);
  assert.equal(resumed.stopTime, 24);
  demo.advance(2100);
  demo.play.click();
  const afterStop = context.sources.length;
  demo.play.click();
  await settleAudio();
  assert.equal(context.sources.slice(afterStop).filter(source => source.kind === 'buffer' && source.buffer.duration === 5).length, 0);
  assert.deepEqual(demo.errors, []);
});

test('tool tails overlap transitions without adding beats or delaying the scenes', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const toolReverbs = context.convolvers.filter(reverb => reverb.buffer.duration > 1);
  assert.equal(toolReverbs.length, 1);
  for (const reverb of toolReverbs) {
    assert.equal(reverb.outputs[0].gain.value, 0.5);
    const samples = reverb.buffer.getChannelData(0);
    assert.ok(Math.abs(samples.length / context.sampleRate - 1.1) < 0.0001);
    assert.ok(samples.slice(-4800).some(value => Math.abs(value) > 0.001));
  }
  const wet = context.delays[0].outputs[1];
  assert.deepEqual(wet.gain.events.at(-1), { value: 0, time: 14.6 });
  const wind = context.oscillators.find(source => source.type === 'sawtooth');
  assert.equal(wind.outputs[0].outputs[0].gain.events[1].value, 0.04);
  assert.deepEqual(wind.outputs[0].outputs[0].gain.events.slice(-2), [
    { value: 0.04, time: 21.8 },
    { value: 0, time: 23.6 }
  ]);
  for (const [time, slide] of [[10000, 2], [14000, 3], [18000, 4], [23000, 5]]) {
    demo.advance(time - context.currentTime * 1000);
    assert.equal(demo.active(), slide);
  }
  demo.play.click();
  demo.advance(20);
  context.sources.forEach(source => source.finish());
  assert.ok(context.convolvers.every(node => node.disconnected));
  assert.ok(wet.disconnected);
});

test('resuming during the wind-down tail preserves its stopped pitch and remaining fade', async () => {
  for (const time of [23300, 23600]) {
    const demo = createDemo();
    await settleAudio();
    const context = demo.contexts[0];
    demo.advance(time);
    demo.play.click();
    const count = context.sources.length;
    demo.play.click();
    await settleAudio();
    const resumed = context.sources.slice(count);
    assert.ok(resumed.every(source => source.type !== 'sine' || source.startTime >= 25.3));
    const wind = resumed.find(source => source.type === 'sawtooth');
    if (time === 23600) {
      assert.equal(wind, undefined);
    } else {
      assert.equal(wind.startTime, 23.3);
      assert.equal(wind.stopTime, 23.6);
      assert.equal(wind.frequency.events[0].value, 0);
      const envelope = wind.outputs[0].outputs[0].gain.events;
      assert.ok(Math.abs(envelope[1].value - 0.005) < 0.00001);
      assert.deepEqual(envelope.at(-1), { value: 0, time: 23.6 });
    }
    assert.deepEqual(demo.errors, []);
  }
});

test('Sound keeps scheduled voices intact while pause cancels them and resume skips past beats', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const count = context.sources.length;
  demo.sound.click();
  demo.sound.click();
  await settleAudio();
  assert.equal(context.sources.length, count);
  assert.ok(context.sources.every(source => source.stops.length === 1));
  demo.advance(8000);
  demo.play.click();
  assert.ok(context.sources.every(source => source.stops.length === 2 && source.stopTime === context.currentTime + 0.02));
  demo.advance(20000);
  assert.equal(context.sources.length, count);
  demo.play.click();
  await settleAudio();
  const resumed = context.sources.slice(count);
  assert.ok(resumed.every(source => source.startTime >= 28));
  assert.equal(resumed.filter(source => source.type === 'sine' && source.startTime < 30).length, 4);
  assert.deepEqual(demo.errors, []);
});
