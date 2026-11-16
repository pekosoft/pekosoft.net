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

function setupMarkerModule() {
    function node() {
        const classes = new Set();
        return {
            children: [], listeners: {}, attributes: {}, disabled: false,
            classList: {
                toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
                contains: name => classes.has(name)
            },
            setAttribute(name, value) { this.attributes[name] = String(value); },
            append(...children) { this.children.push(...children); },
            appendChild(child) { this.children.push(child); },
            replaceChildren(...children) { this.children = children; },
            addEventListener(type, handler) { this.listeners[type] = handler; },
            fire(type) { if (!this.disabled) this.listeners[type]?.(); }
        };
    }
    const elements = new Map();
    for (const id of ['marker-items', 'marker-lines', ...['drop', 'previous', 'next', 'select-all', 'deselect-all', 'show', 'lines', 'delete', 'lock'].map(name => `marker-${name}-button`)]) {
        elements.set(id, node());
    }
    const storage = new Map();
    const context = vm.createContext({
        document: {
            getElementById: id => elements.get(id),
            createElement: node, createElementNS: node,
            createTextNode: text => ({ textContent: text })
        },
        window: {}, localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value)
        },
        timelineMarkers: [], markerChangesPending: false,
        loadedAudioBuffer: { duration: 10 },
        audioPlayer: { duration: 10, currentTime: 0, paused: true, ended: false },
        mediaRecorder: null, currentPlaylistItem: {},
        hasLoadedAudioSource: () => true,
        formatDurationForPanel: value => String(value),
        updateActionButtonStates() {},
        playButton: { click() { context.played = true; } },
        seekToTimelineRatio(ratio) { context.audioPlayer.currentTime = ratio * 10; },
        redrawTimelineCanvas() { context.window.refreshMarkerModule(); }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'player_markers.js'), 'utf8'), context);
    return { context, elements, click: name => elements.get(`marker-${name}-button`).fire('click') };
}

test('Markers controls create, rename, seek, display and delete selected markers', () => {
    const app = setupMarkerModule();
    app.context.audioPlayer.currentTime = 6;
    app.click('drop');
    app.context.audioPlayer.currentTime = 2;
    app.click('drop');
    assert.deepEqual(Array.from(app.context.timelineMarkers, marker => marker.time), [2, 6]);
    const firstName = app.elements.get('marker-items').children[0].children[2].children[0];
    firstName.value = 'Verse';
    firstName.fire('change');
    assert.equal(app.context.timelineMarkers[0].name, 'Verse');
    app.click('lines');
    assert.equal(app.elements.get('marker-lines').children.length, 2);
    app.click('show');
    assert.equal(app.context.window.markerRulerVisible, false);
    app.click('next');
    assert.equal(app.context.audioPlayer.currentTime, 6);
    app.click('previous');
    assert.equal(app.context.audioPlayer.currentTime, 2);
    app.elements.get('marker-items').children[0].children[1].children[0].fire('click');
    assert.equal(app.context.played, true);
    app.click('select-all');
    app.click('lock');
    assert.equal(app.elements.get('marker-drop-button').disabled, true);
    assert.equal(app.elements.get('marker-delete-button').disabled, true);
    app.click('lock');
    app.click('delete');
    assert.equal(app.context.timelineMarkers.length, 0);
    assert.equal(app.elements.get('marker-lines').children.length, 0);
    assert.equal(app.context.markerChangesPending, true);
    assert.equal(app.context.currentPlaylistItem.markersModified, true);
});

test('marker navigation wraps and skips the current marker during playback', () => {
    const app = setupMarkerModule();
    app.context.timelineMarkers = [
        { time: 2, name: 'First' },
        { time: 6, name: 'Second' },
        { time: 6, name: 'Same position' },
        { time: 8, name: 'Last' }
    ];
    app.context.window.refreshMarkerModule();
    app.context.audioPlayer.currentTime = 6.25;
    app.click('previous');
    assert.equal(app.context.audioPlayer.currentTime, 2);
    app.click('previous');
    assert.equal(app.context.audioPlayer.currentTime, 8);
    app.click('next');
    assert.equal(app.context.audioPlayer.currentTime, 2);
    app.context.audioPlayer.currentTime = 1;
    app.click('previous');
    assert.equal(app.context.audioPlayer.currentTime, 8);
    app.context.audioPlayer.currentTime = 9;
    app.click('next');
    assert.equal(app.context.audioPlayer.currentTime, 2);
});

test('recording markers use the recorder position and remain editable without exporting stale audio', () => {
    const app = setupMarkerModule();
    const recorder = { state: 'recording', markers: [], dropMarker() { this.requested = true; } };
    app.context.mediaRecorder = recorder;
    app.context.currentPlaylistItem = null;
    app.context.timelineMarkers = recorder.markers;
    app.context.window.refreshMarkerModule();
    app.click('drop');
    assert.equal(recorder.requested, true);
    app.context.window.addRecordingMarker(recorder, 1.25);
    assert.equal(recorder.markers[0].time, 1.25);
    assert.equal(app.context.markerChangesPending, false);
    assert.equal(app.elements.get('marker-items').children[0].children[1].children[0].disabled, true);
    app.click('select-all');
    app.click('delete');
    assert.equal(recorder.markers.length, 0);
    assert.equal(app.context.markerChangesPending, false);
});

test('PCM recorder reports marker positions in captured frames before stopping', () => {
    const messages = [];
    let Processor;
    class AudioWorkletProcessor {
        constructor() { this.port = { postMessage: message => messages.push(message) }; }
    }
    const context = vm.createContext({
        AudioWorkletProcessor, Float32Array,
        registerProcessor(name, value) { Processor = value; }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'pcm_recorder.js'), 'utf8'), context);
    const recorder = new Processor({ processorOptions: { channelCount: 1 } });
    recorder.port.onmessage({ data: 'start' });
    recorder.process([[new Float32Array(128)]]);
    recorder.port.onmessage({ data: 'marker' });
    recorder.process([[new Float32Array(128)]]);
    recorder.port.onmessage({ data: 'marker' });
    recorder.port.onmessage({ data: 'stop' });
    assert.deepEqual(messages.filter(message => message.type === 'marker').map(message => message.frame), [128, 256]);
    assert.equal(messages.find(message => message.type === 'data').channels[0].length, 256);
    assert.equal(messages.at(-1).type, 'stop');
});
