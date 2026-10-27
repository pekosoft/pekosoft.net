const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'audio.js'), 'utf8');

function createAudio() {
  const nodes = [];
  function parameter() {
    return {
      events: [],
      setValueAtTime(value, time) { this.events.push(['set', value, time]); },
      linearRampToValueAtTime(value, time) { this.events.push(['linear', value, time]); },
      exponentialRampToValueAtTime(value, time) { this.events.push(['exponential', value, time]); }
    };
  }
  function node(kind) {
    const result = {
      kind,
      connections: [],
      gain: parameter(),
      frequency: parameter(),
      Q: parameter(),
      pan: parameter(),
      connect(target) { this.connections.push(target); },
      disconnect() { this.disconnected = true; },
      start(...args) { this.started = args; },
      stop(time) { this.stopped = time; },
      addEventListener(event, callback) {
        assert.equal(event, 'ended');
        this.end = callback;
      }
    };
    nodes.push(result);
    return result;
  }
  const audioContext = {
    currentTime: 1,
    sampleRate: 48000,
    state: 'running',
    destination: {},
    createGain: () => node('gain'),
    createStereoPanner: () => node('panner'),
    createOscillator: () => node('oscillator'),
    createBufferSource: () => node('noise'),
    createBiquadFilter: () => node('filter'),
    createBuffer(channels, length, sampleRate) {
      const data = new Float32Array(length);
      return { sampleRate, duration: length / sampleRate, getChannelData: () => data };
    }
  };
  const context = { window: {}, localStorage: { getItem: () => null } };
  vm.runInNewContext(source, context);
  return { audioContext, nodes, play: options => context.window.playDrumSound({ audioContext, ...options }) };
}

test('default PERC is filtered noise with a multi-burst shaker envelope, not an oscillator', () => {
  const { audioContext, nodes, play } = createAudio();
  const destinationNode = {};
  const hit = play({ voice: 'perc', when: 2, destinationNode, tone: 0.6, level: 0.62, velocity: 0.5, pan: -0.16 });
  assert.equal(hit.voice, 'perc');
  assert.equal(hit.sources.length, 1);
  assert.equal(nodes.some(node => node.kind === 'oscillator'), false);
  const noise = hit.sources[0];
  assert.equal(noise.kind, 'noise');
  assert.equal(noise.loop, true);
  assert.equal(noise.buffer.sampleRate, audioContext.sampleRate);
  assert.ok(noise.buffer.getChannelData(0).some(value => value !== 0));
  assert.equal(noise.started[0], 2);
  assert.ok(noise.started[1] >= 0 && noise.started[1] < noise.buffer.duration);
  assert.equal(noise.stopped, 2.14);
  assert.equal(hit.stopTime, 2.14);
  const filters = nodes.filter(node => node.kind === 'filter');
  assert.deepEqual(filters.map(node => node.type), ['highpass', 'lowpass']);
  assert.equal(filters[0].frequency.events[0][1], 1240);
  assert.equal(filters[1].frequency.events[0][1], 10000);
  assert.deepEqual(noise.connections, [filters[0]]);
  assert.deepEqual(filters[0].connections, [filters[1]]);
  const envelope = filters[1].connections[0];
  assert.deepEqual(envelope.gain.events.map(event => event[1]), [0.0001, 0.8, 0.25, 0.65, 0.2, 0.45, 0.0001]);
  assert.ok(envelope.gain.events.every((event, index, events) => index === 0 || event[2] > events[index - 1][2]));
  assert.deepEqual(envelope.gain.events.at(-1), ['exponential', 0.0001, hit.stopTime]);
  const output = envelope.connections[0];
  assert.equal(output.gain.events[0][1], 0.31);
  const panner = output.connections[0];
  assert.equal(panner.pan.events[0][1], -0.16);
  assert.deepEqual(panner.connections, [destinationNode]);
  noise.end();
  assert.ok(nodes.every(node => node.disconnected));
});

test('PERC retains pitch, tone and decay controls over their supported ranges', () => {
  for (const [frequency, tone, decay, highPass, lowPass, duration] of [
    [120, 0, 0.025, 240, 4000, 0.025],
    [2400, 1, 0.8, 4800, 14000, 0.8],
    [-1, -1, -1, 240, 4000, 0.025],
    [99999, 2, 2, 4800, 14000, 0.8],
    [NaN, NaN, NaN, 1240, 10000, 0.14]
  ]) {
    const { nodes, play } = createAudio();
    const hit = play({ voice: 'perc', when: 2, frequency, tone, decay });
    const filters = nodes.filter(node => node.kind === 'filter');
    assert.equal(filters[0].frequency.events[0][1], highPass);
    assert.equal(filters[1].frequency.events[0][1], lowPass);
    assert.equal(hit.stopTime, 2 + duration);
  }
});

test('repeated PERC hits reuse cached noise and schedule safely without stereo panning', () => {
  const { audioContext, play } = createAudio();
  delete audioContext.createStereoPanner;
  const first = play({ voice: 'perc', when: 0 });
  const second = play({ voice: 'perc', when: 3 });
  assert.equal(first.sources[0].buffer, second.sources[0].buffer);
  assert.equal(first.sources[0].started[0], 1.001);
  assert.equal(second.sources[0].started[0], 3);
  assert.notEqual(first.sources[0], second.sources[0]);
});

test('PERC limits brightness below Nyquist at lower sample rates', () => {
  const { audioContext, nodes, play } = createAudio();
  audioContext.sampleRate = 22050;
  play({ voice: 'perc', tone: 1 });
  const lowPass = nodes.find(node => node.kind === 'filter' && node.type === 'lowpass');
  assert.equal(lowPass.frequency.events[0][1], 22050 * 0.45);
});

test('other drum voices keep their source types and default durations', () => {
  for (const [voice, kinds, duration] of [
    ['kick', ['oscillator'], 0.36],
    ['snare', ['noise', 'oscillator'], 0.21],
    ['hat', ['noise'], 0.06]
  ]) {
    const { play } = createAudio();
    const hit = play({ voice, when: 2 });
    assert.deepEqual(Array.from(hit.sources, node => node.kind), kinds);
    assert.ok(Math.abs(hit.stopTime - 2 - duration) < 1e-10);
  }
});
