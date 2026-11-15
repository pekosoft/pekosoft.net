const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const audioMarkers = require('../js/audio_markers.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'player.js'), 'utf8');
const markerSource = source.slice(source.indexOf('function drawTimelineMarkers('), source.indexOf('\nfunction drawBpmRuler('));
const historySource = source.slice(source.indexOf('function captureBufferSnapshot('), source.indexOf('\nasync function undoWaveformEdit('));
const editSource = source.slice(source.indexOf('function replaceTimelineMarkerRange('), source.indexOf('\nwindow.copyTimelineAudioToClipboard'));
const reverseSource = source.slice(source.indexOf('async function reverseBufferRange('), source.indexOf('\nfunction updateActionButtonStates('));
const encoderSource = source.slice(source.indexOf('function writeStringToDataView('), source.indexOf('\nasync function refreshAudioSourceFromBuffer('));

function element() {
    return {
        attributes: {}, children: [], listeners: {},
        setAttribute(name, value) { this.attributes[name] = String(value); },
        append(...children) { this.children.push(...children); },
        appendChild(child) { this.children.push(child); },
        addEventListener(type, handler) { this.listeners[type] = handler; }
    };
}

test('timeline markers show names and positions and seek to their exact time', () => {
    const ruler = element();
    const seeks = [];
    const context = vm.createContext({
        document: { createElementNS: () => element() },
        timelineRuler: ruler,
        timelineMarkers: [{ time: 2.5, name: 'Verse' }, { time: 0, name: '' }, { time: 11, name: 'Outside' }],
        formatDurationForPanel: seconds => `${seconds} seconds`,
        seekToTimelineRatio: ratio => seeks.push(ratio)
    });
    vm.runInContext(markerSource, context);
    context.drawTimelineMarkers(10, 200, 24);
    assert.equal(ruler.children.length, 2);
    const marker = ruler.children[0];
    assert.equal(marker.children[0].textContent, 'Verse: 2.5 seconds');
    assert.equal(marker.attributes['aria-label'], 'Verse: 2.5 seconds');
    assert.equal(ruler.children[1].children[0].textContent, 'Marker: 0 seconds');
    let stopped = false;
    marker.listeners.pointerdown({ button: 0, stopPropagation() { stopped = true; } });
    assert.equal(stopped, true);
    let prevented = false;
    marker.listeners.keydown({ key: 'Enter', preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.deepEqual(seeks, [0.25, 0.25]);
});

test('edited WAV output retains markers with its audio and a correct RIFF size', async () => {
    const context = vm.createContext({ window: { AudioMarkers: audioMarkers }, Blob, Float32Array });
    vm.runInContext(encoderSource, context);
    const buffer = { numberOfChannels: 1, sampleRate: 4, length: 4, getChannelData: () => new Float32Array([0, 0.5, -0.5, 0]) };
    const markers = [{ time: 0.5, name: 'Verse' }, { time: 0.75, name: '' }];
    const blob = context.encodeAudioBufferToWavBlob(buffer, markers);
    const bytes = Buffer.from(await blob.arrayBuffer());
    assert.equal(bytes.readUInt32LE(4), bytes.length - 8);
    assert.equal(bytes.readInt16LE(46), 16383);
    assert.equal(bytes.readInt16LE(48), -16384);
    assert.deepEqual(audioMarkers.parseAudioMarkers(bytes).markers.map(({ time, name }) => ({ time, name })), markers);
    const plain = Buffer.from(await context.encodeAudioBufferToWavBlob(buffer).arrayBuffer());
    assert.equal(plain.length, 52);
    assert.equal(plain.readUInt32LE(4), 44);
});

test('cut, paste, reverse and undo keep markers aligned to edited samples', async () => {
    function buffer(length) {
        const samples = new Float32Array(length);
        return { numberOfChannels: 1, sampleRate: 10, length, duration: length / 10, getChannelData: () => samples };
    }
    const context = vm.createContext({
        cloneAudioBuffer: value => value,
        cloneAudioBufferRange: (value, start, end) => buffer(end - start),
        mainAudioContext: { createBuffer: (channels, length) => buffer(length) },
        audioPlayer: { currentTime: 0 },
        hasActiveSelection: () => false,
        getProcessSampleBounds: () => ({ startSample: 20, endSample: 50 }),
        updateActionButtonStates() {}, updateLoopPlaybackMode() {}, updateSelectionDisplay() {},
        redrawTimelineCanvas() {}, refreshAudioSourceFromBuffer: async () => {}
    });
    vm.runInContext(`
        let loadedAudioBuffer = makeBuffer(100), audioClipboardBuffer = null, audioClipboardMarkers = [];
        let timelineMarkers = [{time: 1, name: 'Before'}, {time: 2, name: 'Start'}, {time: 4, name: 'Inside'}, {time: 5, name: 'End'}, {time: 8, name: 'After'}];
        let selectionStartTime = null, selectionEndTime = null, waveformCacheDirty = false;
        let undoBufferStack = [], redoBufferStack = [];
        const MAX_BUFFER_HISTORY = 20;
        ${historySource}
        ${editSource}
        ${reverseSource}
    `, Object.assign(context, { makeBuffer: buffer }));
    await context.cutBufferRange();
    const markerValues = () => Array.from(vm.runInContext('timelineMarkers.map(m => [m.name, m.time])', context), item => Array.from(item));
    assert.deepEqual(markerValues(), [['Before', 1], ['End', 2], ['After', 5]]);
    await context.pasteClipboardBuffer();
    assert.deepEqual(markerValues(), [['Start', 0], ['Inside', 2], ['Before', 4], ['End', 5], ['After', 8]]);
    await context.reverseBufferRange();
    assert.deepEqual(markerValues(), [['Start', 0], ['Before', 2.9], ['Inside', 4.9], ['End', 5], ['After', 8]]);
    await vm.runInContext('restoreBufferSnapshot(undoBufferStack[0])', context);
    assert.deepEqual(markerValues(), [['Before', 1], ['Start', 2], ['Inside', 4], ['End', 5], ['After', 8]]);
});
