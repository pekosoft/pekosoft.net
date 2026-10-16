const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'bpm_calculator.js'), 'utf8');
const playbackSource = source.slice(
  source.indexOf('function getCurrentPlayheadMs()'),
  source.indexOf('function stopAllAudioNow()')
);

function createPlayback(overrides = {}) {
  const sounds = [];
  const timers = new Map();
  let timerId = 0;
  const context = {
    state: {
      bpm: 120, selected: '5-base', viewMode: 'all', isLoopOn: true,
      isPlaying: false, rows: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      modes: { base: true, dotted: false, triplet: false }, ...overrides
    },
    audioContext: { currentTime: 10, state: 'running' },
    noteData: { values: Array(11).fill('note') },
    getMultiplier: type => type === 'dotted' ? 1.5 : type === 'triplet' ? 2 / 3 : 1,
    playbackEvents: [], playbackScheduleKeys: {},
    playbackScheduledUntil: { beat: 0, delay: 0 },
    playbackTimer: null, playbackAnimationFrame: null, timelineStartTime: 0,
    pausedTimelineMs: 0, scheduledAudioNodes: [], scheduledVisualEvents: [],
    playbackBeatOriginSec: 0, playbackTempo: 120, pausedBeatPhase: 0,
    currentBeatMs: null, currentDelayMs: null, lastVisualCheckSec: 0,
    beatHighlightUntilSec: 0, delayHighlightUntilSec: 0,
    VISUAL_MATCH_TOLERANCE_MS: 2, VISUAL_HIGHLIGHT_HOLD_SEC: 0.07,
    FIXED_CLICK_DURATION_SEC: 0.004,
    togglePlayButton: { classList: { add() {}, remove() {} } },
    initAudioContext() {}, updateMetersSourceBridge() {}, drawCanvas() {},
    updateTimelineReadout() {}, stopAllRowPreviews() {},
    timelineFollow: { reset() {} },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  for (const [name, kind] of [['playClick', 'beat'], ['playDelayClick', 'delay']]) {
    context[name] = time => {
      const sound = { kind, startTime: time, stopTime: time + 0.05, stopped: false };
      sound.oscillator = { stop() { sound.stopped = true; } };
      sounds.push(sound);
      context.scheduledAudioNodes.push(sound);
    };
  }
  vm.createContext(context);
  vm.runInContext(playbackSource, context);
  const advance = elapsed => {
    context.audioContext.currentTime = context.timelineStartTime + elapsed;
    context.schedulePlaybackEvents();
  };
  return { context, sounds, timers, advance };
}

test('only queues the look-ahead window, even for the longest note', () => {
  const { context, sounds } = createPlayback({ selected: '0-dotted' });
  context.startPlayback();
  assert.equal(sounds.length, 1);
  assert.equal(sounds[0].kind, 'beat');
  assert.ok(sounds.every(sound => sound.startTime < context.audioContext.currentTime + 0.16));
});

test('changing note cancels old pending delays without restarting or duplicating beats', () => {
  const { context, sounds, advance } = createPlayback({ selected: '4-base' });
  context.startPlayback();
  advance(0.9);
  const beat = sounds.find(sound => sound.kind === 'beat' && Math.abs(sound.startTime - 11.01) < 1e-8);
  const oldDelay = sounds.find(sound => sound.kind === 'delay');
  assert.ok(beat && oldDelay);
  const origin = context.timelineStartTime;
  context.state.selected = '6-base';
  advance(0.95);
  assert.equal(oldDelay.stopped, true);
  assert.equal(beat.stopped, false);
  assert.equal(context.timelineStartTime, origin);
  advance(1.15);
  assert.ok(sounds.some(sound => sound.kind === 'delay' && Math.abs(sound.startTime - (origin + 1.25)) < 1e-8));
  assert.equal(sounds.filter(sound => sound.kind === 'beat' && sound.startTime === beat.startTime).length, 1);
});

test('deselecting notes cancels pending delays but keeps the beat running', () => {
  const { context, sounds, advance } = createPlayback({ selected: '6-base' });
  context.startPlayback();
  advance(0.15);
  const delay = sounds.find(sound => sound.kind === 'delay');
  assert.ok(delay);
  context.state.selected = null;
  advance(0.16);
  assert.equal(delay.stopped, true);
  advance(0.4);
  assert.ok(sounds.some(sound => sound.kind === 'beat' && sound.startTime > 10.5));
});

test('rapid switching at 320 BPM keeps unique beat times and a bounded audio queue', () => {
  const { context, sounds, advance } = createPlayback({ bpm: 320 });
  context.startPlayback();
  for (let index = 1; index < 400; index++) {
    context.state.selected = `${index % 11}-${index % 2 ? 'base' : 'triplet'}`;
    advance(index * 0.025);
    assert.ok(context.scheduledAudioNodes.length < 8);
    assert.ok(context.scheduledAudioNodes.every(sound =>
      sound.startTime < context.audioContext.currentTime + 0.151));
  }
  const beats = sounds.filter(sound => sound.kind === 'beat');
  assert.equal(new Set(beats.map(sound => sound.startTime)).size, beats.length);
  for (let index = 1; index < beats.length; index++) {
    assert.ok(Math.abs(beats[index].startTime - beats[index - 1].startTime - 60 / 320) < 1e-8);
  }
});

test('a stalled timer skips missed beats instead of playing a catch-up burst', () => {
  const { context, sounds, advance } = createPlayback();
  context.startPlayback();
  advance(2.9);
  const recovered = sounds.slice(1);
  assert.ok(recovered.every(sound => sound.startTime >= context.audioContext.currentTime));
  assert.equal(recovered.filter(sound => sound.kind === 'beat').length, 1);
});

test('rapid Note knob changes schedule immediately without disturbing the 320 BPM beat clock', () => {
  const { context, sounds } = createPlayback({
    bpm: 320, modes: { base: true, dotted: true, triplet: true }
  });
  Object.assign(context, {
    noteKnob: { style: { setProperty() {} }, dataset: {}, setAttribute() {} },
    resultTable: { querySelectorAll: () => [] },
    selectionRenderFrame: null, saveState() {}, updatePanel() {},
    getValueLabel: (note, type) => `${note} ${type}`
  });
  vm.runInContext(source.slice(
    source.indexOf('function getRowDelayMs('),
    source.indexOf('function updateSortButton(')
  ), context);
  context.startPlayback();
  const beatOrigin = context.playbackBeatOriginSec;
  const transportOrigin = context.timelineStartTime;
  for (let index = 1; index < 400; index++) {
    context.audioContext.currentTime = transportOrigin + index * 0.025;
    const pendingBeats = context.scheduledAudioNodes.filter(sound => sound.kind === 'beat');
    context.setNoteKnobIndex(index % 34);
    assert.equal(context.playbackBeatOriginSec, beatOrigin);
    assert.equal(context.timelineStartTime, transportOrigin);
    assert.ok(pendingBeats.every(sound => !sound.stopped));
    assert.ok(context.scheduledAudioNodes.length < 8);
    assert.ok(context.scheduledAudioNodes.every(sound =>
      sound.startTime < context.audioContext.currentTime + 0.151));
  }
  const beats = sounds.filter(sound => sound.kind === 'beat');
  assert.equal(new Set(beats.map(sound => sound.startTime)).size, beats.length);
  for (let index = 1; index < beats.length; index++) {
    assert.ok(Math.abs(beats[index].startTime - beats[index - 1].startTime - 60 / 320) < 1e-8);
  }
});

test('pause cancels queued audio and resume preserves position with only one scheduler', () => {
  const { context, sounds, timers, advance } = createPlayback({ selected: '6-base' });
  context.startPlayback();
  advance(0.15);
  const pending = sounds.filter(sound => sound.stopTime > context.audioContext.currentTime);
  context.pausePlayback();
  assert.ok(pending.every(sound => sound.stopped));
  assert.equal(context.scheduledVisualEvents.length, 0);
  assert.equal(timers.size, 0);
  assert.ok(Math.abs(context.pausedTimelineMs - 150) < 1e-8);
  context.audioContext.currentTime += 5;
  context.startPlayback();
  context.startPlayback();
  assert.equal(timers.size, 1);
  assert.ok(Math.abs(context.getCurrentPlayheadMs() - 140) < 1e-8);
});

test('single mode reschedules visible notes within the window rather than a whole minute', () => {
  const { context, sounds, advance } = createPlayback({ viewMode: 'single' });
  context.startPlayback();
  assert.ok(sounds.every(sound => sound.startTime < context.audioContext.currentTime + 0.16));
  advance(0.4);
  const oldDelay = sounds.find(sound => sound.kind === 'delay' && Math.abs(sound.startTime - 10.51) < 1e-8);
  assert.ok(oldDelay);
  context.state.rows.delete(5);
  advance(0.42);
  assert.equal(oldDelay.stopped, true);
});

test('non-looping playback waits for the minute end rather than stopping after scheduling its final beat', () => {
  const { context, advance } = createPlayback({ isLoopOn: false });
  context.startPlayback();
  advance(59.4);
  context.runPlaybackScheduler();
  assert.equal(context.state.isPlaying, true);
  advance(60.07);
  context.runPlaybackScheduler();
  assert.equal(context.state.isPlaying, false);
});

test('loop boundaries schedule one new downbeat without duplicating end-of-minute delays', () => {
  const { context, sounds, advance } = createPlayback();
  context.startPlayback();
  advance(59.9);
  advance(59.95);
  advance(60.01);
  const boundary = context.timelineStartTime + 60;
  for (const kind of ['beat', 'delay']) {
    assert.equal(sounds.filter(sound => sound.kind === kind && Math.abs(sound.startTime - boundary) < 1e-8).length, 1);
  }
});

test('turning Loop off cancels events already queued for the next minute', () => {
  const { context, sounds, advance } = createPlayback();
  context.startPlayback();
  advance(59.9);
  const nextDownbeat = sounds.find(sound =>
    sound.kind === 'beat' && Math.abs(sound.startTime - context.timelineStartTime - 60) < 1e-8);
  assert.ok(nextDownbeat);
  context.state.isLoopOn = false;
  advance(59.92);
  assert.equal(nextDownbeat.stopped, true);
});

test('changing tempo replaces upcoming events and retains the transport position', () => {
  const { context, sounds, advance } = createPlayback();
  context.startPlayback();
  advance(0.4);
  const pending = sounds.filter(sound => sound.startTime > context.audioContext.currentTime);
  const origin = context.timelineStartTime;
  context.state.bpm = 160;
  advance(0.42);
  assert.ok(pending.every(sound => sound.stopped));
  assert.equal(context.timelineStartTime, origin);
  advance(0.45);
  assert.ok(sounds.some(sound => !sound.stopped && sound.kind === 'beat'
    && Math.abs(sound.startTime - origin - 0.48) < 1e-8));
});

test('tempo changes preserve fractional beat phase instead of snapping to a new grid', () => {
  const { context, sounds, advance } = createPlayback({ selected: null });
  context.startPlayback();
  advance(30.2);
  context.state.bpm = 121;
  advance(30.2);
  const phase = (context.audioContext.currentTime - context.playbackBeatOriginSec) * 121 / 60;
  assert.ok(Math.abs(phase - 60.4) < 1e-8);
  advance(30.4);
  const next = sounds.find(sound => !sound.stopped && sound.startTime > context.timelineStartTime + 30.2);
  assert.ok(Math.abs(next.startTime - context.timelineStartTime - (30.2 + 0.6 * 60 / 121)) < 1e-8);
});

test('a continuous tempo sweep never produces arbitrarily short or skipped beat intervals', () => {
  const { context, sounds, advance } = createPlayback({ selected: null });
  context.startPlayback();
  for (let tick = 1; tick <= 800; tick++) {
    context.state.bpm = 120 + 60 * Math.sin(tick / 100);
    advance(tick * 0.025);
  }
  const beats = sounds.filter(sound => sound.kind === 'beat' && !sound.stopped);
  for (let index = 1; index < beats.length; index++) {
    const interval = beats[index].startTime - beats[index - 1].startTime;
    assert.ok(interval >= 60 / 180 - 0.002, `Short interval: ${interval}`);
    assert.ok(interval <= 60 / 60 + 0.002, `Long interval: ${interval}`);
  }
});

test('visual and audio queues stay bounded when animation frames are suspended', () => {
  const { context, advance } = createPlayback({ bpm: 320 });
  context.startPlayback();
  for (let index = 1; index < 4000; index++) {
    advance(index * 0.025);
  }
  assert.ok(context.scheduledAudioNodes.length < 8);
  assert.ok(context.scheduledVisualEvents.length < 10);
});

test('a tempo edit immediately before a beat does not discard that beat', () => {
  const { context, sounds, advance } = createPlayback({ selected: null });
  context.startPlayback();
  advance(0.4995);
  context.state.bpm = 121;
  advance(0.4995);
  const next = sounds.filter(sound => !sound.stopped && sound.kind === 'beat'
    && sound.startTime > context.audioContext.currentTime);
  assert.equal(next.length, 1);
  assert.ok(next[0].startTime - context.audioContext.currentTime < 0.001);
});

test('fractional tempo stays evenly spaced across consecutive minute boundaries', () => {
  const { context, sounds, advance } = createPlayback({ bpm: 120.5, selected: null });
  context.startPlayback();
  for (let tick = 1; tick <= 4840; tick++) advance(tick * 0.025);
  const beats = sounds.filter(sound => sound.kind === 'beat');
  for (let index = 1; index < beats.length; index++) {
    assert.ok(Math.abs(beats[index].startTime - beats[index - 1].startTime - 60 / 120.5) < 1e-8);
  }
});

test('non-looping fractional tempo includes every beat before the minute endpoint', () => {
  const { context, sounds, advance } = createPlayback({ bpm: 120.5, selected: null, isLoopOn: false });
  context.startPlayback();
  for (let tick = 1; tick <= 2405; tick++) advance(tick * 0.025);
  const beats = sounds.filter(sound => sound.kind === 'beat');
  assert.equal(beats.length, 121);
  assert.ok(beats.every(sound => sound.startTime < context.timelineStartTime + 60));
});

test('changing tempo while paused resumes the saved beat phase at the new rate', () => {
  const { context, sounds, advance } = createPlayback({ selected: null });
  context.startPlayback();
  advance(0.2);
  context.pausePlayback();
  assert.ok(Math.abs(context.pausedBeatPhase - 0.4) < 1e-8);
  context.state.bpm = 240;
  context.audioContext.currentTime += 10;
  context.startPlayback();
  const expected = context.audioContext.currentTime + 0.01 + 0.6 * 60 / 240;
  advance(context.pausedTimelineMs / 1000 + 0.05);
  assert.ok(sounds.some(sound => !sound.stopped && Math.abs(sound.startTime - expected) < 1e-8));
});

test('playhead follows the displayed beat phase after tempo changes, not an unrelated elapsed position', () => {
  const { context, advance } = createPlayback({ bpm: 320 });
  context.startPlayback();
  advance(1.875);
  context.state.bpm = 160;
  advance(1.875);
  assert.ok(Math.abs(context.getTimelinePlayheadMs() - 3750) < 1e-8);
  assert.ok(Math.abs(context.getCurrentPlayheadMs() - 1875) < 1e-8);
  context.pausePlayback();
  assert.ok(Math.abs(context.getTimelinePlayheadMs() - 3750) < 1e-8);
  context.stopPlayback();
  assert.equal(context.getTimelinePlayheadMs(), 0);
});

test('Single mode playhead follows elapsed Timeline position', () => {
  const { context, advance } = createPlayback({ viewMode: 'single' });
  context.startPlayback();
  advance(1.875);
  assert.ok(Math.abs(context.getTimelinePlayheadMs() - 1875) < 1e-8);
});

test('Position and Current follow the playhead, not the originating beat of a delayed note', () => {
  const { context, advance } = createPlayback({ selected: '4-base' });
  let readout;
  context.updateTimelineReadout = (position, beat) => { readout = { position, beat }; };
  context.startPlayback();
  advance(2.25);
  context.updatePlaybackReadout();
  assert.ok(Math.abs(readout.position - 2250) < 1e-8);
  assert.equal(readout.beat, 5);
  context.state.bpm = 60;
  advance(2.25);
  context.pausePlayback();
  assert.ok(Math.abs(readout.position - 4500) < 1e-8);
  assert.equal(readout.beat, 5);
  context.stopPlayback();
  assert.deepEqual(readout, { position: 0, beat: 0 });
});

test('stop resets beat phase and restarting creates one fresh downbeat', () => {
  const { context, sounds, timers, advance } = createPlayback();
  context.startPlayback();
  advance(0.23);
  context.state.bpm = 160;
  advance(0.24);
  context.pausePlayback();
  context.stopPlayback();
  assert.equal(context.pausedBeatPhase, 0);
  assert.equal(context.pausedTimelineMs, 0);
  const count = sounds.length;
  context.startPlayback();
  assert.equal(sounds.length, count + 1);
  assert.equal(sounds.at(-1).kind, 'beat');
  assert.equal(timers.size, 1);
  assert.ok(Math.abs(sounds.at(-1).startTime - context.audioContext.currentTime - 0.01) < 1e-8);
});

test('full-range tempo jumps and simultaneous note switches stay bounded', () => {
  const { context, sounds, advance } = createPlayback();
  context.startPlayback();
  for (let tick = 1; tick <= 2400; tick++) {
    context.state.bpm = tick % 40 < 20 ? 30 : 320;
    context.state.selected = `${tick % 11}-${tick % 2 ? 'dotted' : 'triplet'}`;
    advance(tick * 0.025);
    assert.ok(context.scheduledAudioNodes.length < 8);
  }
  const beats = sounds.filter(sound => sound.kind === 'beat' && !sound.stopped);
  for (let index = 1; index < beats.length; index++) {
    const gap = beats[index].startTime - beats[index - 1].startTime;
    assert.ok(gap >= 60 / 320 - 0.002 && gap <= 60 / 30 + 0.002, `Invalid beat gap: ${gap}`);
  }
});

test('all note values and modifiers schedule the correct first delay', () => {
  for (const bpm of [30, 120, 320]) {
    for (let index = 0; index < 11; index++) {
      for (const type of ['base', 'dotted', 'triplet']) {
        const { context, sounds, advance } = createPlayback({ bpm, selected: `${index}-${type}` });
        context.startPlayback();
        const expected = context.getSelectedRowMs() / 1000;
        for (let tick = 1; tick <= Math.ceil(Math.min(expected, 60) / 0.025); tick++) advance(tick * 0.025);
        const delay = sounds.find(sound => sound.kind === 'delay');
        if (expected > 60) {
          assert.equal(delay, undefined);
          continue;
        }
        assert.ok(delay, `Missing ${index}-${type} at ${bpm} BPM`);
        assert.ok(Math.abs(delay.startTime - context.timelineStartTime - expected) < 1e-8);
      }
    }
  }
});
