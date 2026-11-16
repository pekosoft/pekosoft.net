const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { setImmediate: settleAudio } = require('node:timers/promises');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'js', 'demo.js'), 'utf8');
const audioScript = fs.readFileSync(path.join(__dirname, '..', 'js', 'audio.js'), 'utf8');
const template = fs.readFileSync(path.join(__dirname, '..', 'demo.php'), 'utf8');

function createDemo({ blocked = false, fullscreenFailure = false, theme = 'dark', random = Math.random } = {}) {
  let now = 0;
  let nextFrame = 0;
  const frames = new Map();
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
  const darkMode = element();
  const sound = element();
  const loop = element();
  const download = element();
  const fullscreen = element();
  const status = element();
  const openingLogo = element();
  const openingSlogan = element();
  const staticBackground = element();
  const staticNoise = element();
  const glitchFrame = element();
  const nodes = {
    '[data-demo-glitch-frame]': glitchFrame,
    '[data-demo-static]': staticBackground,
    '[data-demo-noise]': staticNoise,
    '[data-demo-opening-logo]': openingLogo,
    '[data-demo-slogan]': openingSlogan,
    '[data-demo-floppy]': closingIcon,
    '[data-demo-url]': closingUrl,
    '[data-demo-play]': play,
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
    get currentTime() { return now / 1000; }
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
    console: { error: (...args) => errors.push(args) }
  });
  return {
    play, sound, loop, download, fullscreen, darkMode, storage, document, window, status, slides, contexts, errors, parts, signatureBeats, descriptions, titles, staticBackground, staticNoise, glitchFrame, openingLogo, openingSlogan, closingIcon, closingUrlLink, closingUrlText, closingUrlCaret,
    advance(milliseconds) {
      now += milliseconds;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback(now));
    },
    active() { return slides.findIndex(slide => !slide.hidden); }
  };
}

test('video download includes audio when muted and restores paused playback and position', async () => {
  const demo = createDemo();
  await settleAudio();
  demo.advance(7000);
  demo.play.click();
  demo.sound.click();
  demo.window.downloadDemoVideo = async ({ startAudio, render, onProgress }) => {
    assert.ok([demo.play, demo.sound, demo.darkMode, demo.loop, demo.download, demo.fullscreen]
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

test('sparse background grains animate only during tool scenes and freeze when paused', () => {
  const demo = createDemo();
  assert.equal(demo.staticBackground.style.display, 'none');
  demo.advance(5999);
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
  demo.advance(3760);
  for (const duration of [6000, 4000, 5000]) {
    assert.equal(demo.staticBackground.style.display, 'block');
    demo.advance(duration);
  }
  assert.equal(demo.staticBackground.style.display, 'none');
  const closingFrame = demo.staticNoise.getAttribute('patternTransform');
  demo.advance(12300);
  assert.equal(demo.staticBackground.style.display, 'none');
  assert.equal(demo.staticNoise.getAttribute('patternTransform'), closingFrame);
  demo.play.click();
  assert.equal(demo.staticBackground.style.display, 'none');
  demo.advance(6000);
  assert.equal(demo.staticBackground.style.display, 'block');
  assert.equal(demo.staticNoise.getAttribute('patternTransform'), firstFrame);
});

test('tool descriptions follow titles without overlap and stay until the scene ends, with pause support', () => {
  const demo = createDemo();
  demo.advance(6000);
  for (const [index, duration] of [[1, 4000], [2, 6000], [3, 4000], [4, 5000]]) {
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
  for (const [milliseconds, slide] of [[2700, 1], [4000, 2], [6000, 3], [4000, 4], [5000, 5], [3300, 6], [1000, 7], [1000, 8], [1000, 9], [1000, 10], [1000, 11]]) {
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
  const kicks = context.oscillators.filter(source => source.type === 'sine');
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

test('noise-only floppy texture starts with the disc and resumes the same waveform without replaying seeks', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const drive = context.sources.find(source => source.kind === 'buffer' && source.startTime === 25.3);
  const samples = drive.buffer.getChannelData(0);
  const rms = (start, end) => {
    const section = samples.slice(Math.round(start * context.sampleRate), Math.round(end * context.sampleRate));
    return Math.sqrt(section.reduce((sum, value) => sum + value ** 2, 0) / section.length);
  };
  assert.ok(rms(0.4, 0.58) > 0.001);
  const section = samples.slice(Math.round(0.4 * context.sampleRate), Math.round(0.58 * context.sampleRate));
  let resonantEnergy = 0;
  for (let bin = Math.ceil(600 * section.length / context.sampleRate);
    bin <= Math.floor(850 * section.length / context.sampleRate); bin += 1) {
    let real = 0;
    let imaginary = 0;
    for (let index = 0; index < section.length; index += 1) {
      const phase = 2 * Math.PI * bin * index / section.length;
      real += section[index] * Math.cos(phase);
      imaginary += section[index] * Math.sin(phase);
    }
    resonantEnergy += 2 * (real ** 2 + imaginary ** 2) / section.length ** 2;
  }
  assert.ok(resonantEnergy / rms(0.4, 0.58) ** 2 < 0.2);
  assert.ok(rms(1.55, 1.6) < rms(0.72, 0.78));
  assert.ok(samples.every(value => Number.isFinite(value) && Math.abs(value) < 1));
  demo.advance(25299);
  assert.equal(demo.closingIcon.style.opacity, '0');
  assert.ok(drive.startTime > context.currentTime);
  demo.advance(1);
  assert.equal(demo.closingIcon.style.opacity, '1');
  assert.equal(drive.startTime, context.currentTime);
  assert.equal(drive.offset, 0);
  assert.ok(Math.abs(drive.stopTime - 26.9) < 1e-9);
  demo.advance(410);
  demo.play.click();
  assert.equal(drive.stops.at(-1), context.currentTime + 0.02);
  const previousCount = context.sources.length;
  demo.advance(1000);
  demo.play.click();
  await settleAudio();
  const resumed = context.sources.slice(previousCount);
  const resumedDrive = resumed.find(source => source.buffer === drive.buffer);
  assert.equal(resumedDrive.startTime, context.currentTime);
  assert.ok(Math.abs(resumedDrive.stopTime - context.currentTime - 1.19) < 1e-9);
  assert.ok(Math.abs(resumedDrive.offset - 0.41) < 1e-9);
  assert.deepEqual(demo.errors, []);
});

test('floppy spindle friction has no crackle at glitch times', async () => {
  const demo = createDemo({ random: () => 0.999999 });
  await settleAudio();
  const context = demo.contexts[0];
  const drive = context.sources.find(source => source.kind === 'buffer' && source.startTime === 25.3);
  const samples = drive.buffer.getChannelData(0);
  const peak = (start, end) => samples
    .slice(Math.round(start * context.sampleRate), Math.round(end * context.sampleRate))
    .reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
  for (const [start, end] of [[0.2, 0.24], [1.3, 1.34]]) {
    assert.ok(peak(start, end) < 0.06, `Unexpected crackle near ${start}s`);
  }
});

test('mouse clicks match opening and floppy glitches without replaying past clicks after pause', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const glitches = context.sources.filter(source => source.kind === 'buffer'
    && (source.startTime < 1.3 || (source.startTime >= 25.5 && source.startTime < 28)));
  const times = [0.9, 1.16, 25.52, 26.62, 27.72];
  assert.equal(glitches.length, times.length);
  glitches.forEach((source, index) => {
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
  demo.advance(260);
  assert.equal(demo.openingLogo.style.opacity, '0.25');
  demo.advance(24360);
  assert.equal(demo.glitchFrame.hidden, false);
  demo.advance(55);
  demo.play.click();
  assert.ok(glitches.every(source => source.stops.at(-1) === context.currentTime + 0.02));
  const count = context.sources.length;
  demo.advance(1000);
  demo.play.click();
  await settleAudio();
  const resumed = context.sources.slice(count).filter(source => source.buffer === glitches[0].buffer
    && source.startTime < 29);
  assert.equal(resumed.length, 2);
  assert.ok(Math.abs(resumed[0].startTime - 27.62) < 1e-9);
  assert.deepEqual(demo.errors, []);
});

test('floppy sound does not replay after the generated drive sequence has ended', async () => {
  const demo = createDemo();
  await settleAudio();
  demo.advance(26901);
  demo.play.click();
  const context = demo.contexts[0];
  const drive = context.sources.find(source => source.kind === 'buffer' && source.startTime === 25.3);
  const previousCount = context.sources.length;
  demo.play.click();
  await settleAudio();
  const resumed = context.sources.slice(previousCount);
  assert.ok(resumed.every(source => source.buffer !== drive.buffer));
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

test('floppy waits 300 ms after Turntable and remains visible for three seconds', () => {
  const demo = createDemo();
  demo.advance(24999);
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
  assert.equal(demo.closingIcon.style.opacity, '1');
  demo.advance(2999);
  assert.equal(demo.active(), 5);
  demo.advance(1);
  assert.equal(demo.active(), 6);
});

test('floppy glitches use brief blank frames and freeze when paused', () => {
  const demo = createDemo();
  assert.equal(demo.glitchFrame.hidden, true);
  demo.advance(25300);
  assert.equal(demo.glitchFrame.hidden, true);
  demo.advance(219);
  assert.equal(demo.glitchFrame.hidden, true);
  demo.advance(1);
  assert.equal(demo.glitchFrame.hidden, false);
  demo.play.click();
  demo.advance(500);
  assert.equal(demo.glitchFrame.hidden, false);
  demo.play.click();
  demo.advance(40);
  assert.equal(demo.glitchFrame.hidden, false);
  demo.advance(40);
  assert.equal(demo.glitchFrame.hidden, false);
  demo.advance(40);
  assert.equal(demo.glitchFrame.hidden, true);
  demo.advance(980);
  assert.equal(demo.glitchFrame.hidden, false);
  demo.advance(1680);
  assert.equal(demo.active(), 6);
  assert.equal(demo.glitchFrame.hidden, true);
});

test('point icons fade in and out, rotating except the last icon and freezing when paused', () => {
  const demo = createDemo();
  demo.advance(28300);
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
  demo.advance(28300);
  assert.equal(demo.slides[6].querySelector('[data-demo-point-icon]').style.transform, 'rotate(-90deg)');
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
  demo.advance(27300);
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  demo.play.click();
  await settleAudio();
  assert.equal(demo.active(), 0);
  assert.equal(demo.contexts[0].oscillators.filter(source => source.type === 'triangle').length, 2);
});

test('closing URL becomes clickable after its caret and turns blue later, including pause and restart', () => {
  const demo = createDemo();
  demo.advance(33300);
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
  assert.equal(demo.closingUrlLink.attributes.href, '/');
  assert.equal(demo.closingUrlLink.attributes['data-demo-url-color'], undefined);
  demo.advance(49);
  assert.equal(demo.closingUrlLink.attributes['data-demo-url-color'], undefined);
  demo.advance(1);
  assert.equal(demo.closingUrlLink.attributes['data-demo-url-color'], '');
  demo.advance(1920);
  assert.equal(demo.play.attributes['aria-pressed'], 'false');
  demo.advance(5000);
  assert.equal(demo.closingUrlText.textContent, 'pekosoft.net');
  assert.equal(demo.closingUrlCaret.style.visibility, 'hidden');
  demo.play.click();
  demo.advance(33300);
  assert.equal(demo.closingUrlText.textContent, '');
  assert.equal(demo.closingUrlLink.attributes.href, undefined);
  assert.equal(demo.closingUrlLink.attributes['data-demo-url-color'], undefined);
  assert.equal(demo.closingUrlCaret.style.visibility, 'visible');
});

test('keyboard taps match each typed character and resume without replaying previous keys', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const keys = context.sources.filter(source => source.kind === 'buffer' && source.startTime >= 33.3);
  assert.equal(keys.length, 'pekosoft.net'.length);
  for (const [index, key] of keys.entries()) {
    assert.ok(Math.abs(key.startTime - (33.3 + (index + 1) * 0.09)) < 1e-9);
    assert.ok(key.stopTime - key.startTime < 0.03);
    const highPass = key.outputs[0];
    const lowPass = highPass.outputs[0];
    assert.ok(highPass.frequency.events[0].value < 1000);
    assert.ok(lowPass.frequency.events[0].value < 4000);
  }
  demo.advance(33615);
  assert.equal(demo.closingUrlText.textContent, 'pek');
  demo.play.click();
  assert.ok(keys.every(key => key.stops.length === 2));
  const previousCount = context.sources.length;
  demo.advance(1000);
  demo.play.click();
  await settleAudio();
  const remaining = context.sources.slice(previousCount).filter(source => source.kind === 'buffer');
  assert.equal(remaining.length, keys.length - 3);
  assert.ok(Math.abs(remaining[0].startTime - 34.66) < 1e-9);
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
  demo.advance(31300);
  await settleAudio();
  assert.equal(demo.active(), 0);
  assert.equal(demo.play.attributes['aria-pressed'], 'true');
  assert.equal(demo.contexts[0].oscillators.filter(source => source.type === 'triangle').length, 2);
  demo.loop.click();
  demo.advance(37300);
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

test('icon feedback follows the beat, calculator notes scroll, and Turntable winds down', () => {
  const demo = createDemo();
  const [tap, notes, pendulum, platter] = demo.parts;
  demo.advance(6000);
  assert.equal(tap.attributes.r, '92');
  assert.equal(Number(tap.style.opacity ?? 1), 1);
  demo.advance(125);
  assert.equal(Number(tap.attributes.r), 99);
  assert.equal(Number(tap.style.opacity ?? 1), 1);
  demo.play.click();
  demo.advance(1000);
  assert.equal(Number(tap.attributes.r), 99);
  demo.play.click();
  demo.advance(250);
  assert.equal(Number(tap.attributes.r), 113);
  assert.equal(Number(tap.style.opacity ?? 1), 1);
  demo.advance(124);
  assert.ok(Number(tap.attributes.r) > 119);
  assert.equal(Number(tap.style.opacity ?? 1), 1);
  demo.advance(1);
  assert.equal(Number(tap.attributes.r), 92);
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
  assert.equal(notes.attributes.transform, 'translate(-1024 0)');
  demo.advance(999);
  assert.ok(Math.abs(Number(notes.attributes.transform.match(/translate\(([^ ]+)/)[1]) + 1279.744) < 1e-9);
  demo.advance(1);
  assert.equal(notes.attributes.transform, 'translate(0 0)');
  demo.advance(500);
  assert.equal(notes.attributes.transform, 'translate(-128 0)');
  demo.advance(499);
  assert.equal(demo.active(), 2);
  assert.ok(Math.abs(Number(notes.attributes.transform.match(/translate\(([^ ]+)/)[1]) + 255.744) < 1e-9);
  demo.advance(1);
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
  assert.ok(earlyAngle > 80 && earlyAngle < 90);
  demo.advance(1350);
  const laterAngle = Number(platter.attributes.transform.match(/rotate\(([^ ]+)/)[1]);
  assert.ok(laterAngle > earlyAngle && laterAngle < earlyAngle * 4);
});

test('tool scenes synthesize kicks, triplet echoes, accented transition clicks and a descending wind-down', async () => {
  const demo = createDemo();
  await settleAudio();
  assert.deepEqual(demo.errors, []);
  const context = demo.contexts[0];
  const kicks = context.oscillators.filter(source => source.type === 'sine');
  assert.equal(kicks.length, 8);
  assert.deepEqual(kicks.map(source => source.startTime),
    Array.from({ length: 8 }, (_, index) => 6 + index * 0.5));
  assert.ok(kicks.every(source => source.frequency.events[1].value === 48));
  demo.advance(9999);
  assert.equal(demo.active(), 1);
  demo.advance(1);
  assert.equal(demo.active(), 2);
  const plucks = context.oscillators.filter(source => source.type === 'custom');
  assert.equal(plucks.length, 12);
  assert.ok(plucks.every(source => source.outputs[0].outputs[0].outputs.includes(context.delays[0])));
  assert.equal(plucks[0].startTime, 10);
  assert.equal(plucks.at(-1).startTime, 15.5);
  assert.equal(context.delays.length, 1);
  assert.equal(context.delays[0].delayTime.value, 1 / 6);
  const clicks = context.sources.filter(source => source.kind === 'buffer' && source.startTime >= 16 && source.startTime <= 20);
  assert.equal(clicks.length, 9);
  for (const [index, click] of clicks.entries()) {
    assert.equal(click.startTime, 16 + index * 0.5);
    const highPass = click.outputs[0];
    const envelope = highPass.outputs[0].outputs[0];
    const gain = envelope.gain;
    assert.equal(envelope.outputs[0].outputs[0], context.analyser);
    assert.equal(highPass.frequency.events[0].value, 1800 * (index % 4 === 0 ? 1.55 : 1));
    assert.equal(gain.events[1].value, 0.9 * (index % 4 === 0 ? 0.675 : 0.425));
  }
  const wind = context.oscillators.find(source => source.type === 'sawtooth');
  assert.equal(wind.startTime, 20);
  assert.equal(clicks.at(-1).startTime, wind.startTime);
  assert.equal(wind.stopTime, 25.6);
  assert.equal(wind.frequency.events[1].time, 25);
  assert.equal(wind.frequency.events[0].value / wind.frequency.events[1].value, 8);
});

test('tool tails overlap transitions without adding beats or delaying the scenes', async () => {
  const demo = createDemo();
  await settleAudio();
  const context = demo.contexts[0];
  const toolReverbs = context.convolvers;
  assert.equal(toolReverbs.length, 1);
  for (const reverb of toolReverbs) {
    const samples = reverb.buffer.getChannelData(0);
    assert.ok(Math.abs(samples.length / context.sampleRate - 1.1) < 0.0001);
    assert.ok(samples.slice(-4800).some(value => Math.abs(value) > 0.001));
  }
  const wet = context.delays[0].outputs[1];
  assert.deepEqual(wet.gain.events.at(-1), { value: 0, time: 16.6 });
  const wind = context.oscillators.find(source => source.type === 'sawtooth');
  assert.deepEqual(wind.outputs[0].outputs[0].gain.events.slice(-2), [
    { value: 0.2, time: 23.8 },
    { value: 0, time: 25.6 }
  ]);
  for (const [time, slide] of [[10000, 2], [16000, 3], [20000, 4], [25000, 5]]) {
    demo.advance(time - context.currentTime * 1000);
    assert.equal(demo.active(), slide);
  }
  demo.play.click();
  demo.advance(20);
  context.sources.forEach(source => source.finish());
  assert.ok(context.convolvers.every(node => node.disconnected));
  assert.ok(wet.disconnected);
});

test('resuming during the wind-down tail preserves its low pitch and remaining fade', async () => {
  for (const time of [25300, 25600]) {
    const demo = createDemo();
    await settleAudio();
    const context = demo.contexts[0];
    demo.advance(time);
    demo.play.click();
    const count = context.sources.length;
    demo.play.click();
    await settleAudio();
    const resumed = context.sources.slice(count);
    assert.ok(resumed.every(source => source.type !== 'sine'));
    const wind = resumed.find(source => source.type === 'sawtooth');
    if (time === 25600) {
      assert.equal(wind, undefined);
    } else {
      assert.equal(wind.startTime, 25.3);
      assert.equal(wind.stopTime, 25.6);
      assert.equal(wind.frequency.events[0].value, 130.8128 / 8);
      const envelope = wind.outputs[0].outputs[0].gain.events;
      assert.ok(Math.abs(envelope[1].value - 0.025) < 0.00001);
      assert.deepEqual(envelope.at(-1), { value: 0, time: 25.6 });
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
  assert.equal(resumed.filter(source => source.type === 'sine').length, 4);
  assert.deepEqual(demo.errors, []);
});
