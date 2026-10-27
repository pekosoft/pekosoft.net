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
    globalThis.api = { DrumMachine, createDefaultState, normalizeState, loadState, normalizeRecording };
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

test('Metronome and Count-in defaults, validation, persistence and pattern exchange', () => {
  const { machine, storage, api } = createMachine();
  assert.equal(machine.state.metronome, false);
  assert.equal(machine.state.countIn, 1);
  for (const invalid of [-1, 3, 8, null, '2', true]) {
    assert.equal(api.normalizeState({ countIn: invalid }, false).countIn, 1);
  }
  for (const bars of [0, 1, 2, 4]) {
    machine.state.metronome = true;
    machine.state.countIn = bars;
    machine.saveState();
    assert.equal(JSON.parse(storage.get('drum_machine.state')).countIn, bars);
    assert.equal(api.loadState().countIn, bars);
    const imported = api.normalizeState(machine.getExportData(), false);
    assert.equal(imported.metronome, true);
    assert.equal(imported.countIn, bars);
  }
  assert.equal(api.createDefaultState().metronome, false);
  assert.equal(api.createDefaultState().countIn, 1);
});

test('Loop defaults off and survives save, reload, export and import', () => {
  const { machine, storage, api } = createMachine();
  assert.equal(machine.state.loop, false);
  assert.equal(api.normalizeState({}, false).loop, false);
  machine.state.loop = true;
  machine.saveState();
  assert.equal(JSON.parse(storage.get('drum_machine.state')).loop, true);
  assert.equal(api.loadState().loop, true);
  assert.equal(machine.getExportData().loop, true);
  assert.equal(api.normalizeState(machine.getExportData(), false).loop, true);
  assert.equal(api.createDefaultState().loop, false);
});

function createTransport() {
  const result = createMachine();
  const { machine, context } = result;
  const timers = new Map();
  const handlers = {};
  const clicks = [];
  let nextTimer = 1;
  context.window.setTimeout = (callback, delay) => {
    const id = nextTimer++;
    timers.set(id, { callback, at: machine.audioContext.currentTime + delay / 1000 });
    return id;
  };
  context.window.clearTimeout = id => timers.delete(id);
  context.performance = { now: () => machine.audioContext.currentTime * 1000 };
  const elements = {};
  machine.elements = new Proxy(elements, {
    get(target, name) {
      return target[name] ||= {
        classList: { toggle() {}, remove() {} },
        addEventListener(event, callback) { handlers[`${String(name)}:${event}`] = callback; },
        setAttribute(name, value) { this[name] = value; },
        textContent: ''
      };
    }
  });
  Object.assign(machine, {
    audioContext: { currentTime: 0 },
    guideGain: { name: 'audible-guide' },
    guideSources: new Set(),
    guideTimer: null,
    guideBeat: 0,
    nextGuideTime: 0,
    isPlaying: false,
    isRecording: false,
    isCountingIn: false,
    isRecordingPlayback: false,
    playingRecordingIndex: -1,
    recordingPlayback: null,
    recordingPlaybackTimer: null,
    transportSessionId: 0,
    recordingSessionId: 0,
    recordingCaptureTimers: new Map(),
    recordingEvents: [],
    recordings: [],
    selectedRecordingIndex: -1,
    timelineEvents: [],
    visualTimers: new Set(),
    activeSources: new Set()
  });
  machine.ensureAudioReady = async () => {};
  machine.renderRecordingPlaylist = () => machine.updateRecordingControls();
  context.window.playTransientSound = options => {
    const source = { stopped: false, stop() { this.stopped = true; }, addEventListener() {} };
    clicks.push({ ...options, source });
    return { stopNode: source };
  };
  function advance(time) {
    while (true) {
      const pending = [...timers.entries()].filter(([, timer]) => timer.at <= time)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!pending) break;
      const [id, timer] = pending;
      timers.delete(id);
      machine.audioContext.currentTime = timer.at;
      timer.callback();
    }
    machine.audioContext.currentTime = time;
  }
  return { ...result, clicks, timers, handlers, advance };
}

test('Drum Machine matches Metronome beat timing and count at 120 BPM and other tempos', () => {
  const metronomeSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'metronome.js'), 'utf8');
  const schedulerSource = metronomeSource.slice(
    metronomeSource.indexOf('function playMetronome() {'),
    metronomeSource.indexOf('function stopMetronome() {')
  );
  for (const bpm of [60, 120, 180]) {
    const { machine, context, clicks, advance } = createTransport();
    const beats = [];
    machine.state.bpm = bpm;
    machine.state.metronome = true;
    machine.isPlaying = true;
    Object.assign(context, {
      audioContext: machine.audioContext,
      getValidatedBPM: () => bpm,
      tick: time => beats.push(time),
      nextTickTime: 0,
      setTimeout: context.window.setTimeout
    });
    vm.runInContext(`${schedulerSource}\nplayMetronome();`, context);
    machine.startGuide();
    advance(59.9);
    assert.equal(beats.length, bpm);
    assert.equal(clicks.length, bpm);
    for (let index = 0; index < beats.length; index++) {
      assert.ok(Math.abs((clicks[index].when - clicks[0].when) - (beats[index] - beats[0])) < 1e-9);
      assert.equal(clicks[index].pitchRatio, index % 4 === 0 ? 1.5 : 1);
    }
    for (const swing of [0, 25, 50]) {
      machine.state.swing = swing;
      const barDuration = Array.from({ length: 16 }, (_, step) => machine.getStepDuration(step))
        .reduce((sum, duration) => sum + duration, 0);
      assert.ok(Math.abs(barDuration - 4 * 60 / bpm) < 1e-9);
    }
    if (bpm === 120) {
      assert.equal(beats[1] - beats[0], 0.5);
      assert.equal(clicks[1].when - clicks[0].when, 0.5);
      assert.equal(machine.getStepDuration(0) + machine.getStepDuration(1), 0.25);
    }
  }
});

function createRecordingPlayback(durationMs = 437.25, timestamps = [17.125, 193.375]) {
  const result = createTransport();
  const { machine, context } = result;
  const sounds = [];
  machine.recordings = [{
    id: 'loop-take',
    name: 'Loop take',
    durationMs,
    events: timestamps.map((timestampMs, index) => ({
      voice: index % 2 ? 'snare' : 'kick',
      velocity: index % 2 ? 1 : 2,
      timestampMs,
      durationMs: 8,
      settings: { ...machine.state.voices[index % 2 ? 'snare' : 'kick'] }
    }))
  }];
  machine.selectedRecordingIndex = 0;
  machine.updatePanel = () => {};
  machine.bindEvents();
  context.window.playDrumSound = options => {
    const source = { stop(when) { this.stoppedAt = when; } };
    sounds.push({ ...options, source });
    return { sources: [source], stopTime: options.when + 0.008 };
  };
  return { ...result, sounds };
}

test('Playlist Loop keeps exact non-bar-aligned duration, silence, timing and settings across passes', async () => {
  const { machine, sounds, advance, timers } = createRecordingPlayback();
  machine.state.loop = true;
  machine.queueRecordingEvent = () => assert.fail('Playlist playback must never recapture events');
  await machine.startRecordingPlayback();
  advance(2.2);
  for (let cycle = 0; cycle < 5; cycle++) {
    for (let index = 0; index < 2; index++) {
      const event = machine.recordings[0].events[index];
      const sound = sounds[cycle * 2 + index];
      assert.ok(Math.abs(sound.when - (0.03 + cycle * 0.43725 + event.timestampMs / 1000)) < 1e-10);
      assert.equal(sound.voice, event.voice);
      assert.equal(sound.velocity, event.velocity === 2 ? 1 : 0.68);
      assert.equal(sound.frequency, event.settings.frequency);
    }
  }
  assert.equal(machine.recordingEvents.length, 0);
  assert.equal(machine.isRecordingPlayback, true);
  assert.ok(timers.size < 10, 'Only a bounded lookahead and source cleanup timers remain');
  machine.stopAll(true);
  const count = sounds.length;
  advance(10);
  assert.equal(sounds.length, count);
  assert.equal(machine.recordingPlaybackTimer, null);
});

test('Loop can be enabled during a one-shot pass and disabled without an extra pass', async () => {
  const { machine, sounds, handlers, storage, advance } = createRecordingPlayback();
  await machine.startRecordingPlayback();
  advance(0.3);
  handlers['loop:click']();
  assert.equal(machine.elements.loop['aria-pressed'], 'true');
  assert.equal(JSON.parse(storage.get('drum_machine.state')).loop, true);
  advance(0.9);
  handlers['loop:click']();
  assert.equal(machine.elements.loop['aria-pressed'], 'false');
  const endTime = 0.03 + 2 * 0.43725;
  advance(endTime - 0.0001);
  assert.equal(machine.isRecordingPlayback, true);
  advance(endTime + 0.001);
  assert.equal(machine.isRecordingPlayback, false);
  assert.equal(sounds.filter(sound => sound.source.stoppedAt === undefined || sound.source.stoppedAt >= sound.when).length, 4);
  const scheduled = sounds.length;
  advance(5);
  assert.equal(sounds.length, scheduled);
});

test('Loop Off cancels already-scheduled future passes of an 8 ms take and can be re-enabled', async () => {
  const { machine, sounds, advance } = createRecordingPlayback(8, [0]);
  machine.state.loop = true;
  machine.state.blink = true;
  await machine.startRecordingPlayback();
  assert.ok(sounds.length >= 8, 'Lookahead crosses several short passes');
  advance(0.041);
  machine.toggleRecordingLoop();
  const endTime = 0.046;
  assert.ok(sounds.filter(sound => sound.when >= endTime - 1e-10)
    .every(sound => sound.source.stoppedAt === 0.041));
  assert.ok(machine.timelineEvents.every(event => event.startTime < endTime * 1000));
  assert.equal(machine.recordingPlayback.cycle, 2);
  machine.toggleRecordingLoop();
  advance(0.09);
  const audible = sounds.filter(sound => sound.source.stoppedAt === undefined || sound.source.stoppedAt >= sound.when);
  const atBoundary = audible.filter(sound => Math.abs(sound.when - endTime) < 1e-10);
  assert.equal(atBoundary.length, 1, 'Re-enabling schedules canceled passes exactly once');
  assert.equal(machine.isRecordingPlayback, true);
  machine.toggleRecordingLoop();
  const expectedEnd = 0.03 + (Math.floor((0.09 - 0.03) / 0.008) + 1) * 0.008;
  advance(expectedEnd + 0.001);
  assert.equal(machine.isRecordingPlayback, false);
});

test('One-shot Playlist playback stops at its stored duration and schedules only bounded lookahead', async () => {
  const { machine, sounds, advance, timers } = createRecordingPlayback(60000, [0, 1000, 59000]);
  await machine.startRecordingPlayback();
  assert.equal(sounds.length, 1);
  assert.ok(timers.size <= 2);
  advance(60.029);
  assert.equal(machine.isRecordingPlayback, true);
  advance(60.031);
  assert.equal(machine.isRecordingPlayback, false);
  assert.equal(sounds.length, 3);
});

test('Late and suspended playback callbacks do not burst-replay missed hits or shift the loop origin', async () => {
  const { machine, sounds, timers, advance } = createRecordingPlayback(100, [0, 40]);
  machine.state.loop = true;
  await machine.startRecordingPlayback();
  const origin = machine.recordingPlayback.startTime;
  for (let index = 0; index < 20; index++) {
    const id = machine.recordingPlaybackTimer;
    const timer = timers.get(id);
    timers.delete(id);
    timer.callback();
  }
  assert.equal(sounds.length, 2, 'A frozen audio clock must not schedule extra passes');
  machine.audioContext.currentTime = 2.155;
  const timer = timers.get(machine.recordingPlaybackTimer);
  timers.delete(machine.recordingPlaybackTimer);
  const before = sounds.length;
  timer.callback();
  assert.ok(sounds.length - before <= 2);
  sounds.slice(before).forEach(sound => {
    assert.ok(sound.when >= 2.155);
    const phase = ((sound.when - origin) / 0.1) % 1;
    assert.ok(Math.abs(phase) < 1e-10 || Math.abs(phase - 1) < 1e-10 || Math.abs(phase - 0.4) < 1e-10);
  });
  assert.equal(machine.recordingPlayback.startTime, origin);
  machine.stopRecordingPlayback();
  // Avoid the helper's older cleanup timers rewinding the simulated clock.
  timers.clear();
  advance(3);
  assert.equal(machine.isRecordingPlayback, false);
});

test('Stop, selection, removal, import, pattern apply and Reset cancel all pending loop playback', async () => {
  for (const action of ['stop', 'selection', 'removal', 'import', 'apply', 'reset', 'record', 'play']) {
    const { machine, sounds, advance } = createRecordingPlayback(8, [0]);
    machine.state.loop = true;
    machine.state.countIn = 0;
    await machine.startRecordingPlayback();
    const scheduled = [...sounds];
    if (action === 'stop') machine.stopAll(true);
    if (action === 'selection') {
      machine.recordings.push({ ...machine.recordings[0], id: 'other' });
      machine.selectRecording(1);
    }
    if (action === 'removal') machine.removeRecording(0);
    if (action === 'import') {
      machine.elements.playlistFileInput.files = [{ text: async () => JSON.stringify({ recordings: machine.recordings }) }];
      await machine.importRecordingPlaylist();
    }
    if (action === 'apply' || action === 'reset') {
      machine.applyMasterGain = () => {};
      machine.saveAndRender = () => {};
      machine.commitPatternChange = () => {};
      machine.showPanelSuccess = () => {};
      machine.history = { clear() {} };
      machine.elements.patternText.value = JSON.stringify(machine.getExportData());
      if (action === 'apply') machine.applyPatternText();
      else {
        machine.reset();
        assert.equal(machine.state.loop, false);
      }
    }
    if (action === 'record') await machine.startRecording();
    if (action === 'play') {
      machine.scheduler = () => {};
      await machine.togglePlayback();
    }
    const count = sounds.length;
    advance(0.5);
    assert.equal(sounds.length, count, action);
    assert.equal(machine.recordingPlaybackTimer, null, action);
    assert.equal(machine.isRecordingPlayback, false, action);
    assert.ok(scheduled.every(sound => sound.source.stoppedAt === 0), action);
  }
});

test('Pending audio resumes and repeated transport actions cannot restart canceled Playlist playback', async () => {
  for (const action of ['stop', 'selection', 'removal', 'reset', 'record', 'play', 'repeat']) {
    const { machine, sounds } = createRecordingPlayback();
    machine.state.loop = true;
    const resumes = [];
    machine.ensureAudioReady = () => new Promise(resolve => resumes.push(resolve));
    const starting = machine.startRecordingPlayback();
    let second;
    if (action === 'stop') machine.stopAll(true);
    if (action === 'selection') {
      machine.recordings.push({ ...machine.recordings[0], id: 'other' });
      machine.selectRecording(1);
    }
    if (action === 'removal') machine.removeRecording(0);
    if (action === 'reset') {
      machine.applyMasterGain = () => {};
      machine.saveAndRender = () => {};
      machine.history = { clear() {} };
      machine.reset();
    }
    if (action === 'record') second = machine.startRecording();
    if (action === 'play') {
      machine.scheduler = () => {};
      second = machine.togglePlayback();
    }
    if (action === 'repeat') second = machine.startRecordingPlayback();
    resumes.forEach(resolve => resolve());
    await starting;
    if (second) await second;
    assert.equal(machine.isRecordingPlayback, action === 'repeat', action);
    assert.equal(sounds.length, action === 'repeat' ? 1 : 0, action);
  }
});

test('Count-in uses four straight beats per bar, then records without lead-in or clicks', async () => {
  for (const bars of [1, 2, 4]) {
    const { machine, clicks, advance } = createTransport();
    machine.state.countIn = bars;
    machine.state.swing = 50;
    machine.state.length = 4;
    await machine.startRecording();
    assert.equal(machine.isCountingIn, true);
    assert.equal(machine.isRecording, false);
    assert.equal(machine.elements.countIn.disabled, true);
    assert.equal(machine.elements.record.title, 'Cancel count-in');
    machine.queueRecordingEvent('kick', 2, 0.1, 100, machine.state.voices.kick);
    const boundary = 0.03 + bars * 2;
    advance(boundary - 0.01);
    assert.equal(machine.isRecording, false);
    assert.equal(clicks.length, bars * 4);
    clicks.forEach((click, index) => {
      assert.ok(Math.abs(click.when - (0.03 + index * 0.5)) < 0.000001);
      assert.equal(click.pitchRatio, index % 4 === 0 ? 1.5 : 1);
      assert.equal(click.destinationNode, machine.guideGain);
    });
    advance(boundary + 0.03);
    assert.equal(machine.isCountingIn, false);
    assert.equal(machine.isRecording, true);
    assert.ok(Math.abs(machine.recordingStartTime - boundary) < 0.000001);
    assert.equal(machine.elements.recordingStatus.textContent, 'Recording: 4 steps');
    assert.equal(machine.recordingEvents.length, 0);
    assert.equal(machine.timelineEvents.length, 0);
    machine.queueRecordingEvent('snare', 2, boundary + 0.03, 100, machine.state.voices.snare);
    assert.ok(Math.abs(machine.recordingEvents[0].timestampMs - 30) < 0.001);
    const recording = machine.finishRecording();
    assert.equal(recording.events.length, 1);
    assert.equal(recording.events[0].voice, 'snare');
    assert.equal(recording.durationMs, 500);
    assert.equal(machine.elements.countIn.disabled, false);
    assert.equal(machine.elements.recordingStatus.textContent, 'Ready');
  }
});

test('Count-in Off records immediately and Metronome stays out of recorded events', async () => {
  const { machine, clicks, advance } = createTransport();
  machine.state.countIn = 0;
  machine.state.metronome = true;
  await machine.startRecording();
  assert.equal(machine.isRecording, true);
  assert.equal(machine.recordingStartTime, 0);
  advance(1.9);
  assert.equal(clicks.length, 4);
  assert.equal(machine.recordingEvents.length, 0);
  assert.equal(machine.timelineEvents.length, 0);
  assert.equal(machine.finishRecording().durationMs, 2000);
  assert.equal(machine.recordings.length, 1);
  assert.equal(machine.guideTimer, null);
  assert.ok(clicks.every(click => click.source.stopped));
});

test('Stop, Record, Reset and Playlist playback cancel Count-in without a take or late restart', async () => {
  for (const action of ['stop', 'record', 'reset', 'playback']) {
    const { machine, clicks, advance } = createTransport();
    await machine.startRecording();
    advance(0.6);
    if (action === 'stop') machine.stopAll(true);
    if (action === 'record') await machine.toggleRecording();
    if (action === 'reset') {
      machine.history = { clear() {} };
      machine.applyMasterGain = () => {};
      machine.saveAndRender = () => {};
      machine.reset();
    }
    if (action === 'playback') await machine.startRecordingPlayback();
    const count = clicks.length;
    advance(10);
    assert.equal(machine.isCountingIn, false);
    assert.equal(machine.isRecording, false);
    assert.equal(machine.recordings.length, 0);
    assert.equal(clicks.length, count);
    assert.equal(machine.guideTimer, null);
    assert.ok(clicks.every(click => click.source.stopped));
  }
});

test('Stop while audio resumes cannot arm a delayed recording', async () => {
  const { machine } = createTransport();
  let resume;
  machine.ensureAudioReady = () => new Promise(resolve => { resume = resolve; });
  const starting = machine.startRecording();
  machine.stopAll(true);
  resume();
  await starting;
  assert.equal(machine.isRecording, false);
  assert.equal(machine.isCountingIn, false);
  assert.equal(machine.guideTimer, null);
});

test('BPM and Length are frozen through Count-in and recording', async () => {
  const { machine, clicks, advance } = createTransport();
  machine.updatePanel = () => {};
  await machine.startRecording();
  advance(0.1);
  machine.setBpm(60);
  advance(1.6);
  [0.03, 0.53, 1.03, 1.53].forEach((time, index) => {
    assert.ok(Math.abs(clicks[index].when - time) < 0.000001);
  });
  assert.equal(machine.isCountingIn, true);
  advance(2.06);
  assert.ok(Math.abs(machine.recordingStartTime - 2.03) < 0.000001);
  assert.equal(machine.isRecording, true);
  assert.equal(machine.state.bpm, 120);
  machine.setBpm(240);
  assert.equal(machine.state.bpm, 120);
  assert.equal(machine.elements.lengthSelect.disabled, true);
  machine.finishRecording();
  assert.equal(machine.elements.lengthSelect.disabled, false);
});

test('Every selected Length auto-finishes at its exact BPM-derived audio boundary', async () => {
  for (const length of [4, 8, 12, 16]) {
    for (const bpm of [60, 120, 237]) {
      const { machine, advance } = createTransport();
      Object.assign(machine.state, { countIn: 0, length, bpm, swing: 50 });
      await machine.startRecording();
      const duration = length * 60 / bpm / 4;
      machine.queueRecordingEvent('kick', 2, 0.01, 100, machine.state.voices.kick);
      machine.queueRecordingEvent('snare', 1, duration - 0.001, 1500, machine.state.voices.snare);
      machine.queueRecordingEvent('perc', 1, duration, 100, machine.state.voices.perc);
      machine.queueRecordingEvent('hat', 1, duration + 0.01, 100, machine.state.voices.hat);
      advance(duration - 0.0001);
      assert.equal(machine.isRecording, true);
      advance(duration + 0.001);
      assert.equal(machine.isRecording, false, `Length ${length}, BPM ${bpm}`);
      assert.equal(machine.recordings.length, 1);
      const recording = machine.recordings[0];
      assert.ok(Math.abs(recording.durationMs - duration * 1000) < 1e-8);
      assert.equal(recording.fixedDuration, true);
      assert.deepEqual(Array.from(recording.events, event => event.voice), ['kick', 'snare']);
      assert.equal(machine.recordingWindowTimer, null);
      assert.equal(machine.recordingCaptureTimers.size, 0);
    }
  }
});

test('Loop overwrites silence across more than two passes and preserves the unvisited partial region', async () => {
  const { machine, advance } = createTransport();
  Object.assign(machine.state, { countIn: 0, length: 4, loop: true });
  await machine.startRecording();
  const hit = (time, voice) => {
    advance(time);
    machine.queueRecordingEvent(voice, 2, time, 900, machine.state.voices[voice]);
  };
  hit(0.1, 'kick');
  hit(0.4, 'snare');
  hit(0.6, 'hat');
  hit(0.9, 'perc');
  advance(1.05);
  assert.equal(machine.recordings.length, 0);
  hit(1.1, 'kick');
  advance(1.3);
  const recording = machine.finishRecording();
  assert.equal(recording.durationMs, 500);
  assert.deepEqual(Array.from(recording.events, event => event.voice), ['kick', 'perc']);
  assert.deepEqual(Array.from(recording.events, event => Math.round(event.timestampMs)), [100, 400]);
  advance(3);
  assert.equal(machine.recordings.length, 1);
  assert.equal(machine.recordingCaptureTimers.size, 0);
});

test('A silent overwrite pass erases all hits and remains a playable fixed-length take', async () => {
  const { machine, advance } = createTransport();
  Object.assign(machine.state, { countIn: 0, length: 4, loop: true });
  await machine.startRecording();
  machine.queueRecordingEvent('kick', 2, 0.1, 100, machine.state.voices.kick);
  advance(1);
  const recording = machine.finishRecording();
  assert.equal(recording.events.length, 0);
  assert.equal(recording.durationMs, 500);
  await machine.startRecordingPlayback();
  advance(2.1);
  assert.equal(machine.isRecordingPlayback, true);
  machine.stopAll(true);
});

test('Exact boundary belongs only to the next Loop pass and Loop off ends at the next boundary', async () => {
  const { machine, advance } = createTransport();
  machine.updatePanel = () => {};
  Object.assign(machine.state, { countIn: 0, length: 4, loop: true });
  await machine.startRecording();
  machine.queueRecordingEvent('kick', 2, 0.5, 100, machine.state.voices.kick);
  advance(0.55);
  assert.equal(machine.recordingEvents.length, 1);
  assert.equal(machine.recordingEvents[0].timestampMs, 0);
  machine.toggleRecordingLoop();
  assert.equal(machine.recordingEndTime, 1);
  machine.queueRecordingEvent('snare', 1, 0.95, 1000, machine.state.voices.snare);
  machine.queueRecordingEvent('hat', 1, 1, 100, machine.state.voices.hat);
  advance(1.01);
  assert.equal(machine.isRecording, false);
  assert.equal(machine.recordings.length, 1);
  assert.deepEqual(Array.from(machine.recordings[0].events, event => event.voice), ['kick', 'snare']);
  assert.equal(machine.recordings[0].durationMs, 500);
});

test('Late callbacks finalize only the fixed first cycle and cannot resurrect overwritten earlier passes', async () => {
  for (const loop of [false, true]) {
    const { machine, timers } = createTransport();
    Object.assign(machine.state, { countIn: 0, length: 4, loop });
    await machine.startRecording();
    machine.queueRecordingEvent('kick', 2, 0.1, 100, machine.state.voices.kick);
    machine.queueRecordingEvent('snare', 2, 0.45, 1000, machine.state.voices.snare);
    const callbacks = [...machine.recordingCaptureTimers.keys()].map(id => timers.get(id).callback);
    machine.audioContext.currentTime = loop ? 1.2 : 0.8;
    callbacks.forEach(callback => callback());
    if (loop) {
      machine.queueRecordingEvent('hat', 2, 1.2, 100, machine.state.voices.hat);
      assert.deepEqual(Array.from(machine.recordingEvents, event => event.voice), ['hat']);
    }
    machine.scheduleRecordingWindow();
    const recording = loop ? machine.finishRecording() : machine.recordings[0];
    assert.equal(recording.durationMs, 500);
    assert.deepEqual(Array.from(recording.events, event => event.voice), loop ? ['hat'] : ['kick', 'snare']);
  }
});

test('Stopping just before a queued boundary hit excludes even sub-millisecond pending capture', async () => {
  const { machine, advance } = createTransport();
  Object.assign(machine.state, { countIn: 0, length: 4, loop: true });
  await machine.startRecording();
  advance(0.4995);
  machine.queueRecordingEvent('kick', 2, 0.5, 100, machine.state.voices.kick);
  const recording = machine.finishRecording();
  assert.equal(recording.events.length, 0);
  assert.equal(recording.durationMs, 500);
  advance(1);
  assert.equal(machine.recordingEvents.length, 0);
});

test('Fixed takes retain silence and crop out-of-window hits through normalization, persistence and import', async () => {
  const { machine, api } = createTransport();
  const events = [100, 499, 500, 700].map(timestampMs => ({
    voice: 'kick', timestampMs, durationMs: 2000, settings: machine.state.voices.kick
  }));
  const fixed = api.normalizeRecording({ fixedDuration: true, durationMs: 500, events });
  assert.equal(fixed.durationMs, 500);
  assert.equal(fixed.events.length, 2);
  assert.equal(api.normalizeRecording({ durationMs: 500, events }).durationMs, 2700);
  assert.equal(api.normalizeRecording({ fixedDuration: true, durationMs: 500, events: [] }).durationMs, 500);
  assert.equal(api.normalizeRecording({ fixedDuration: true, durationMs: Infinity, events: [] }), null);
  machine.recordings = [fixed];
  machine.selectedRecordingIndex = 0;
  machine.saveRecordingPlaylist();
  assert.equal(machine.loadRecordingPlaylist().recordings[0].durationMs, 500);
  machine.elements.playlistFileInput.files = [{ text: async () => JSON.stringify({ recordings: [fixed] }) }];
  await machine.importRecordingPlaylist();
  assert.equal(machine.recordings[0].durationMs, 500);
  assert.equal(machine.recordings[0].fixedDuration, true);
});

test('Stop in the first partial pass pads silence and reset, import and apply leave no capture callbacks', async () => {
  for (const action of ['stop', 'reset', 'import', 'apply']) {
    const { machine, advance } = createTransport();
    Object.assign(machine.state, { countIn: 0, length: 4, loop: true });
    await machine.startRecording();
    machine.queueRecordingEvent('kick', 2, 0.1, 100, machine.state.voices.kick);
    machine.queueRecordingEvent('snare', 2, 0.4, 100, machine.state.voices.snare);
    advance(0.2);
    if (action === 'stop') {
      machine.stopAll(true);
      assert.equal(machine.recordings[0].durationMs, 500);
      assert.equal(machine.recordings[0].events.length, 1);
    }
    if (action === 'import') {
      machine.elements.playlistFileInput.files = [{ text: async () => JSON.stringify({
        recordings: [{ fixedDuration: true, durationMs: 800, events: [] }]
      }) }];
      await machine.importRecordingPlaylist();
      assert.equal(machine.recordings.length, 1);
      assert.equal(machine.recordings[0].durationMs, 800);
    }
    if (action === 'reset' || action === 'apply') {
      machine.history = { clear() {} };
      machine.applyMasterGain = machine.saveAndRender = machine.commitPatternChange = machine.showPanelSuccess = () => {};
      if (action === 'reset') machine.reset();
      else {
        machine.elements.patternText.value = JSON.stringify(machine.getExportData());
        machine.applyPatternText();
      }
    }
    advance(3);
    assert.equal(machine.isRecording, false, action);
    assert.equal(machine.recordingCaptureTimers.size, 0, action);
    assert.equal(machine.recordingWindowTimer, null, action);
    assert.equal(machine.elements.lengthSelect.disabled, false, action);
    if (action === 'reset') assert.equal(machine.recordings.length, 0);
  }
});

test('Fixed recording playback schedules every voice tail to stop at each boundary', async () => {
  const { machine, sounds, advance } = createRecordingPlayback(500, [100, 499]);
  machine.recordings[0].fixedDuration = true;
  machine.state.loop = true;
  await machine.startRecordingPlayback();
  advance(1.5);
  sounds.forEach(sound => {
    const cycle = Math.floor((sound.when - 0.03 + 1e-8) / 0.5);
    assert.ok(sound.source.stoppedAt <= 0.03 + (cycle + 1) * 0.5 + 1e-8);
  });
  assert.equal(sounds[1].source.stoppedAt, 0.53);
  machine.timelineEvents.forEach(event => {
    const cycle = Math.floor((event.startTime / 1000 - 0.03 + 1e-8) / 0.5);
    assert.ok(event.endTime / 1000 <= 0.03 + (cycle + 1) * 0.5 + 1e-8);
  });
});

test('Selected fixed recording WAV exports the exact window without pattern hits or tail padding', async () => {
  const { machine, context } = createTransport();
  const renders = [];
  const drums = [];
  let wav;
  context.OfflineAudioContext = context.window.OfflineAudioContext = class {
    constructor(channels, frames, sampleRate) {
      renders.push({ channels, frames, sampleRate });
      Object.assign(this, { destination: {}, channels, frames, sampleRate });
    }
    async startRendering() {
      return { numberOfChannels: this.channels, sampleRate: this.sampleRate, length: this.frames,
        getChannelData: () => new Float32Array(this.frames) };
    }
  };
  context.window.playDrumSound = options => drums.push(options);
  context.window.playTransientSound = () => assert.fail('Guide must not be exported');
  context.Blob = Blob;
  context.URL = { createObjectURL: blob => { wav = blob; return 'blob:fixed'; }, revokeObjectURL() {} };
  context.document.createElement = () => ({ click() {}, remove() {} });
  context.document.body = { appendChild() {} };
  machine.showPanelSuccess = () => {};
  machine.recordings = [{ fixedDuration: true, durationMs: 500, events: [{
    voice: 'snare', velocity: 2, timestampMs: 499, durationMs: 2000, settings: machine.state.voices.snare
  }] }];
  machine.selectedRecordingIndex = 0;
  await machine.savePatternAsWav();
  assert.equal(renders[0].frames, 22050);
  assert.equal(drums.length, 1);
  assert.equal(drums[0].when, 0.499);
  assert.equal(drums[0].voice, 'snare');
  const header = new DataView(await wav.arrayBuffer());
  assert.equal(header.getUint32(40, true), 22050 * 2 * 2);
});

test('Live pads and scheduled sequencer drums share one fixed window while sequencer transport can continue', async () => {
  const { machine, context, advance } = createTransport();
  Object.assign(machine.state, { countIn: 0, length: 4 });
  machine.state.pattern = { kick: [2, 0, 0, 0], snare: [0, 0, 0, 2], hat: [0, 0, 0, 0], perc: [0, 0, 0, 0] };
  machine.updatePanel = () => {};
  context.navigator = {};
  context.window.playDrumSound = options => ({
    sources: [{ stop() {} }], stopTime: options.when + 1
  });
  await machine.startRecording();
  await machine.togglePlayback();
  advance(0.1);
  await machine.auditionVoice('perc');
  advance(0.55);
  assert.equal(machine.isRecording, false);
  assert.equal(machine.isPlaying, true);
  assert.deepEqual(Array.from(machine.recordings[0].events, event => event.voice), ['kick', 'perc', 'snare']);
  assert.equal(machine.recordings[0].durationMs, 500);
  machine.pausePlayback(true);
});

test('Loop Count-in occurs only once, and import cancels armed audio resumes', async () => {
  const { machine, clicks, advance } = createTransport();
  Object.assign(machine.state, { countIn: 1, length: 4, loop: true });
  await machine.startRecording();
  advance(3.7);
  assert.equal(machine.isRecording, true);
  assert.equal(clicks.length, 4);
  assert.equal(machine.recordings.length, 0);
  machine.stopAll(true);
  assert.equal(machine.recordings[0].durationMs, 500);
  let resume;
  machine.ensureAudioReady = () => new Promise(resolve => { resume = resolve; });
  const starting = machine.startRecording();
  machine.elements.playlistFileInput.files = [{ text: async () => JSON.stringify({
    recordings: [{ fixedDuration: true, durationMs: 1000, events: [] }]
  }) }];
  await machine.importRecordingPlaylist();
  resume();
  await starting;
  advance(10);
  assert.equal(machine.isCountingIn, false);
  assert.equal(machine.isRecording, false);
  assert.equal(machine.recordings.length, 1);
  assert.equal(machine.recordings[0].durationMs, 1000);
});

test('Count-in boundary captures already-scheduled and just-started sequencer hits once', async () => {
  const { machine, advance } = createTransport();
  machine.isPlaying = true;
  await machine.startRecording();
  advance(2);
  machine.timelineEvents = [2.02, 2.03, 2.04, 2.1].map(time => ({
    voice: 'kick', velocity: 2, startTime: time * 1000, endTime: time * 1000 + 100,
    settings: machine.state.voices.kick
  }));
  advance(2.2);
  assert.equal(machine.recordingEvents.length, 3);
  assert.deepEqual(Array.from(machine.recordingEvents, event => Math.round(event.timestampMs)), [0, 10, 70]);
});

test('Metronome runs for sequencer playback but not when idle or during Playlist playback', () => {
  const { machine, clicks, advance } = createTransport();
  machine.state.metronome = true;
  machine.startGuide();
  assert.equal(clicks.length, 0);
  machine.isRecordingPlayback = true;
  machine.startGuide();
  assert.equal(clicks.length, 0);
  machine.isRecordingPlayback = false;
  machine.isPlaying = true;
  machine.startGuide();
  advance(1);
  assert.equal(clicks.length, 3);
  machine.pausePlayback(false);
  const count = clicks.length;
  advance(5);
  assert.equal(clicks.length, count);
  assert.equal(machine.guideTimer, null);
});

test('Metronome toggles immediately without changing the take and Count-in menu saves selection', async () => {
  const { machine, handlers, storage, clicks, advance } = createTransport();
  machine.updatePanel = () => {};
  machine.bindEvents();
  machine.elements.countIn.value = '2';
  handlers['countIn:change']();
  assert.equal(machine.state.countIn, 2);
  assert.equal(JSON.parse(storage.get('drum_machine.state')).countIn, 2);
  machine.state.countIn = 0;
  await machine.startRecording();
  handlers['metronome:click']();
  assert.equal(machine.elements.metronome['aria-pressed'], 'true');
  advance(0.6);
  const count = clicks.length;
  handlers['metronome:click']();
  assert.equal(machine.elements.metronome['aria-pressed'], 'false');
  advance(1.6);
  assert.equal(clicks.length, count);
  assert.equal(machine.isRecording, true);
  assert.equal(machine.recordingEvents.length, 0);
  assert.equal(machine.state.metronome, false);
  assert.equal(JSON.parse(storage.get('drum_machine.state')).metronome, false);
});

test('Applying pattern data cancels Count-in and restores exported guide settings', async () => {
  const { machine, advance, api } = createTransport();
  await machine.startRecording();
  machine.elements.patternText.value = JSON.stringify({
    ...machine.getExportData(), metronome: true, countIn: 4
  });
  machine.commitPatternChange = () => {};
  machine.applyMasterGain = () => {};
  machine.saveAndRender = () => {};
  machine.showPanelSuccess = () => {};
  machine.applyPatternText();
  advance(10);
  assert.equal(machine.isCountingIn, false);
  assert.equal(machine.isRecording, false);
  assert.equal(machine.state.metronome, true);
  assert.equal(machine.state.countIn, 4);
  machine.history = { clear() {} };
  machine.reset();
  assert.equal(machine.state.metronome, api.createDefaultState().metronome);
  assert.equal(machine.state.countIn, 1);
});

test('WAV rendering includes only pattern drums, regardless of Metronome and Count-in settings', async () => {
  const { machine, context } = createTransport();
  const drums = [];
  const renders = [];
  context.OfflineAudioContext = context.window.OfflineAudioContext = class {
    constructor() { this.destination = {}; }
    async startRendering() {
      return { numberOfChannels: 1, sampleRate: 44100, length: 1, getChannelData: () => [0] };
    }
  };
  context.window.playDrumSound = options => drums.push({
    voice: options.voice, when: options.when, velocity: options.velocity, level: options.level
  });
  context.window.playTransientSound = () => assert.fail('Guide must never render into WAV');
  context.Blob = Blob;
  context.URL = { createObjectURL: () => 'blob:test', revokeObjectURL() {} };
  context.document.createElement = () => ({ click() {}, remove() {} });
  context.document.body = { appendChild() {} };
  machine.showPanelSuccess = () => {};
  for (const enabled of [false, true]) {
    machine.state.metronome = enabled;
    machine.state.countIn = enabled ? 4 : 0;
    drums.length = 0;
    await machine.savePatternAsWav();
    renders.push([...drums]);
  }
  assert.ok(renders[0].length > 0);
  assert.deepEqual(renders[0], renders[1]);
});

test('Playlist previews keep their pattern color when recording selection changes', () => {
  const { machine, context } = createMachine();
  const previews = [];
  function createElement(tag) {
    const element = {
      dataset: {},
      classList: { toggle() {} },
      addEventListener() {},
      setAttribute() {},
      append() {},
      appendChild() {}
    };
    if (tag === 'canvas') {
      const drawing = {
        fillStyle: '',
        blocks: [],
        clearRect() { this.blocks = []; },
        fillRect(...bounds) { this.blocks.push({ color: this.fillStyle, bounds }); }
      };
      element.getContext = () => drawing;
      previews.push(drawing);
    }
    return element;
  }
  context.document.createElement = createElement;
  context.getComputedStyle = () => ({
    getPropertyValue: name => ({ '--black': '#000', '--color1': '#0080ff' })[name]
  });
  machine.elements = {
    playlistItems: createElement('tbody'),
    playlistCount: {},
    playlistDuration: {},
    playlistHits: {}
  };
  machine.updateRecordingControls = () => {};
  const events = [
    { voice: 'kick', timestampMs: 0, velocity: 1 },
    { voice: 'snare', timestampMs: 500, velocity: 2 },
    { voice: 'perc', timestampMs: 1000, velocity: 1 }
  ];
  machine.recordings = [0, 1].map(index => ({
    name: `Recording ${index + 1}`,
    durationMs: 1000,
    createdAt: 0,
    bpm: 120,
    events
  }));
  for (const selectedIndex of [0, 1, -1]) {
    machine.selectedRecordingIndex = selectedIndex;
    previews.length = 0;
    machine.renderRecordingPlaylist();
    assert.equal(previews.length, 2);
    for (const preview of previews) {
      assert.equal(preview.blocks.length, events.length);
      assert.ok(preview.blocks.every(block => block.color === '#0080ff'));
      assert.deepEqual(preview.blocks.map(block => block.bounds[0]), [0, 80, 159]);
    }
  }
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

test('Mode updates pattern control availability without changing the pattern or flickering on drum selection', () => {
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
      title: 'Switch to pad',
      querySelector: () => icon,
      classList: { toggle: (...args) => mutations.push(args) },
      setAttribute: (...args) => mutations.push(args)
    },
    voiceSelect: {},
    random: {},
    clear: {}
  };
  machine.updateVoiceFields = () => {};
  machine.updatePanel = () => {};
  const pattern = JSON.stringify(machine.state.pattern);
  for (const mode of ['grid', 'pad', 'grid', 'pad']) {
    machine.state.mode = mode;
    machine.updateGrid();
    assert.equal(machine.elements.random.disabled, mode === 'pad');
    assert.equal(machine.elements.clear.disabled, mode === 'pad');
    assert.equal(iconHref, mode === 'pad' ? '/icons.svg#drum_machine' : '/icons.svg#view_grid');
    assert.equal(machine.elements.mode.title, mode === 'pad' ? 'Switch to grid' : 'Switch to pad');
    const count = mutations.length;
    for (const voice of ['kick', 'snare', 'hat', 'perc']) machine.selectVoice(voice);
    assert.equal(mutations.length, count);
    assert.equal(JSON.stringify(machine.state.pattern), pattern);
  }
});
