const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const api = require('../js/audio_markers.js');
function wav(chunks, rate = 48000) {
  const fmt = Buffer.alloc(16); fmt.writeUInt16LE(1); fmt.writeUInt16LE(1, 2); fmt.writeUInt32LE(rate, 4); fmt.writeUInt32LE(rate * 2, 8); fmt.writeUInt16LE(2, 12); fmt.writeUInt16LE(16, 14);
  const all = [chunk('fmt ', fmt), ...chunks];
  const body = Buffer.concat([Buffer.from('WAVE'), ...all]);
  const header = Buffer.alloc(8); header.write('RIFF'); header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}
function chunk(id, payload) { const h = Buffer.alloc(8); h.write(id); h.writeUInt32LE(payload.length, 4); return Buffer.concat([h, payload, payload.length & 1 ? Buffer.from([0]) : Buffer.alloc(0)]); }
function cue(id, sample) { const b = Buffer.alloc(28); b.writeUInt32LE(1, 0); b.writeUInt32LE(id, 4); b.writeUInt32LE(sample, 24); return chunk('cue ', b); }
function labl(id, name) { const text = Buffer.from(name + '\0', 'utf8'); const b = Buffer.alloc(4 + text.length); b.writeUInt32LE(id); text.copy(b, 4); return b; }
test('parses cue sample offsets and UTF-8 labels regardless of chunk order and padding', () => {
  const adtl = chunk('LIST', Buffer.concat([Buffer.from('adtl'), chunk('labl', labl(7, 'Café 🎵'))]));
  const parsed = api.parseAudioMarkers(wav([adtl, cue(7, 96000), cue(8, 24000)]));
  assert.deepEqual(parsed.markers, [{ id: 8, sampleOffset: 24000, time: 0.5, name: '' }, { id: 7, sampleOffset: 96000, time: 2, name: 'Café 🎵' }]);
  assert.deepEqual(parsed.errors, []);
});
test('non-WAV input is not an error and WAV without valid format reports errors', () => {
  assert.deepEqual(api.parseAudioMarkers(Buffer.from('ID3')).errors, []);
  const result = api.parseAudioMarkers(wav([cue(2, 3)], 0));
  assert.ok(result.errors.some(x => /sample rate/.test(x)));
  assert.equal(result.markers[0].name, '');
  assert.equal(result.markers[0].time, null);
});
test('reports malformed/truncated cue, LIST and RIFF structures without throwing', () => {
  const good = wav([cue(1, 1)]);
  const truncated = Buffer.from(good); truncated.writeUInt32LE(1000, 40);
  assert.ok(api.parseAudioMarkers(truncated).errors.some(x => /Truncated cue/.test(x)));
  const badList = wav([chunk('LIST', Buffer.from('adtlbad'))]);
  assert.ok(api.parseAudioMarkers(badList).errors.length > 0);
  const short = Buffer.from('RIFF');
  assert.ok(api.parseAudioMarkers(short).errors.length > 0);
});
test('exports browser global', () => {
  const context = { globalThis: null, TextDecoder, Uint8Array, DataView, ArrayBuffer };
  context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/audio_markers.js'), 'utf8'), context);
  assert.equal(typeof context.AudioMarkers.parseAudioMarkers, 'function');
});

test('encoded WAV marker chunks retain positions and Unicode names, including duplicate source IDs', () => {
  const markers = [
    { id: 8, time: 0, name: '' },
    { id: 8, time: 1.25, name: 'Café 🎵' },
    { id: 2, time: 2.5, name: 'End' }
  ];
  const encoded = api.encodeWavMarkerChunks(markers, 48000);
  const result = api.parseAudioMarkers(wav([Buffer.from(encoded)]));
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.markers.map(({ time, name }) => ({ time, name })), markers.map(({ time, name }) => ({ time, name })));
  assert.equal(new Set(result.markers.map(marker => marker.id)).size, 3);
  assert.throws(() => api.encodeWavMarkerChunks([{ time: -1, name: 'Invalid' }], 48000), RangeError);
});

