const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'player.js'), 'utf8');
const stateSource = source.slice(source.indexOf('function updateActionButtonStates()'), source.indexOf('    setButtonGrey(fadeInButton,'));
const inputSource = source.slice(source.indexOf("progressSlider.addEventListener('input'"), source.indexOf('// Volume controls'));
const buttonGreySource = source.slice(source.indexOf('function setButtonGrey('), source.indexOf('\nfunction hasLoadedAudioSource('));
const soundSource = source.slice(source.indexOf('function updatePlayerMasterGain()'), source.indexOf('\nlet bassFilter'));
const monitoringSource = source.slice(source.indexOf('async function setInputMonitoringEnabled('), source.indexOf('\nfunction clampVolumePercent('));
const soundClickSource = source.slice(source.indexOf("toggleSound.addEventListener('click'"), source.indexOf('\nif (copyButton)'));
const playClickSource = source.slice(source.indexOf("playButton.addEventListener('click'"), source.indexOf('\nfunction getAdjacentPlayableIndex('));

function setup(duration) {
    const buttons = {};
    const context = {
        mediaRecorder: null, recordingPending: false, recordingStream: null,
        recordingFormatSelect: {}, audioPlayer: { duration, paused: true, currentTime: 0 },
        hasLoadedAudioSource: () => false, playlist: [], loadedAudioBuffer: null, markerChangesPending: false,
        hasActiveSelection: () => false, audioClipboardBuffer: null,
        progressSlider: { value: '5', addEventListener(type, handler) { this[type] = handler; } },
        updateTimeFieldBars() {},
        setButtonGrey(button, grey) { buttons[button] = grey; }
    };
    for (const name of ['playButton', 'prevButton', 'nextButton', 'stopButton', 'downloadButton', 'toggleLoop', 'seekBackward', 'seekForward']) {
        context[name] = name === 'downloadButton' ? { dataset: {} } : name;
    }
    vm.createContext(context);
    vm.runInContext(`${stateSource}}\n${inputSource}`, context);
    return { context, buttons, update: () => context.updateActionButtonStates() };
}

test('unseekable audio disables the Progress playhead together with both seek buttons', () => {
    for (const duration of [NaN, Infinity, 0, -1]) {
        const app = setup(duration);
        app.update();
        assert.equal(app.context.progressSlider.disabled, true);
        assert.equal(app.buttons.seekBackward, true);
        assert.equal(app.buttons.seekForward, true);
        app.context.progressSlider.input();
        assert.equal(app.context.audioPlayer.currentTime, 0);
    }
});

function setupPlayClick() {
    const classes = new Set();
    const button = {
        classList: {
            add: name => classes.add(name),
            toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
            contains: name => classes.has(name)
        },
        addEventListener(type, handler) { this[type] = handler; }
    };
    const audio = { paused: true, ended: false, duration: 10, currentTime: 0 };
    let resolveStart, rejectStart;
    const start = new Promise((resolve, reject) => { resolveStart = resolve; rejectStart = reject; });
    const context = vm.createContext({
        playButton: button, audioPlayer: audio,
        startPlaybackWithResponse: () => start,
        pausePlaybackWithResponse: async () => {},
        syncVisualFreeze() {}, updateActionButtonStates() {}
    });
    vm.runInContext(playClickSource, context);
    return { button, audio, resolveStart, rejectStart };
}

test('Play becomes active immediately while a fade is still pending', async () => {
    const app = setupPlayClick();
    const pending = app.button.click();
    assert.equal(app.button.classList.contains('button-on'), true);
    app.audio.paused = false;
    app.resolveStart();
    await pending;
    assert.equal(app.button.classList.contains('button-on'), true);
});

test('Play reflects the actual state when starting fails or playback ends', async () => {
    const failed = setupPlayClick();
    const pending = failed.button.click();
    assert.equal(failed.button.classList.contains('button-on'), true);
    failed.rejectStart(new Error('Playback failed'));
    await assert.rejects(pending, /Playback failed/);
    assert.equal(failed.button.classList.contains('button-on'), false);

    const ended = setupPlayClick();
    const finished = ended.button.click();
    ended.audio.ended = true;
    ended.resolveStart();
    await finished;
    assert.equal(ended.button.classList.contains('button-on'), false);
});

function setupInputMonitoring() {
    function button() {
        const classes = new Set();
        return {
            disabled: false, listeners: {},
            classList: {
                add: name => classes.add(name),
                remove: name => classes.delete(name),
                contains: name => classes.has(name),
                toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
            },
            addEventListener(type, handler) { this.listeners[type] = handler; }
        };
    }
    const sound = button();
    const input = button();
    const events = {};
    const storage = new Map();
    const stream = { getTracks: () => [], getAudioTracks: () => [] };
    const gain = { gain: { value: 1 } };
    const connections = [];
    const errors = [];
    const context = vm.createContext({
        toggleSound: sound, toggleInput: input, masterGain: gain,
        window: { addEventListener: (type, handler) => { events[type] = handler; } },
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value)
        },
        STORAGE: { inputMonitor: 'player.input_monitor' },
        mainAudioContext: { state: 'running', createMediaStreamSource: () => ({}) },
        requestSelectedInput: async () => stream,
        disconnectSourceFromMeters() {},
        releaseInputStream() {},
        connectSourceToMeters() { connections.push(gain.gain.value); },
        getInputChannelCount: () => 2,
        recreateChannelSplitter() {},
        restoreMeterChannelCount() {},
        syncVisualFreeze() {},
        updateAudioInfo() {},
        reportInputError: error => errors.push(error)
    });
    vm.runInContext(`
        let playerSoundMuted = false, inputSource = null, inputStream = null;
        let recordingSource = null, recordingStream = null, systemAudioStream = null;
        let inputRequestId = 0, pendingInputRequests = 0, loadedChannelCount = 1;
        ${buttonGreySource}
        ${soundSource}
        ${monitoringSource}
        ${soundClickSource}
        updatePlayerMasterGain();
    `, context);
    return { context, sound, input, gain, events, storage, connections, errors };
}

test('Input mutes Sound before connecting and restores the previous Sound setting', async () => {
    for (const initiallyMuted of [false, true]) {
        const app = setupInputMonitoring();
        if (initiallyMuted) app.sound.listeners.click();
        await app.context.setInputMonitoringEnabled(true);
        assert.deepEqual(app.connections, [0]);
        assert.equal(app.gain.gain.value, 0);
        assert.equal(app.sound.disabled, true);
        assert.equal(app.sound.classList.contains('grey'), true);
        assert.equal(app.sound.classList.contains('button-on'), false);
        assert.equal(app.input.classList.contains('button-on'), true);
        await app.context.setInputMonitoringEnabled(false);
        assert.equal(app.gain.gain.value, initiallyMuted ? 0 : 1);
        assert.equal(app.sound.disabled, false);
        assert.equal(app.sound.classList.contains('grey'), false);
        assert.equal(app.sound.classList.contains('button-on'), !initiallyMuted);
    }
});

test('global Sound changes cannot unmute active Input and apply after it stops', async () => {
    const app = setupInputMonitoring();
    await app.context.setInputMonitoringEnabled(true);
    for (const enabled of [false, true]) {
        app.storage.set('global.sound', String(enabled));
        app.events['pekosoft:global-sound-change']({ detail: { enabled } });
        assert.equal(app.gain.gain.value, 0);
        assert.equal(app.sound.classList.contains('button-on'), false);
    }
    await app.context.setInputMonitoringEnabled(false);
    assert.equal(app.gain.gain.value, 1);
    assert.equal(app.sound.classList.contains('button-on'), true);
});

test('failed or cancelled Input requests do not change Sound', async () => {
    const app = setupInputMonitoring();
    app.context.requestSelectedInput = async () => { throw new Error('Permission denied'); };
    await app.context.setInputMonitoringEnabled(true);
    assert.equal(app.errors.length, 1);
    assert.equal(app.gain.gain.value, 1);
    assert.equal(app.sound.disabled, false);

    let resolve;
    app.context.requestSelectedInput = () => new Promise(done => { resolve = done; });
    const pending = app.context.setInputMonitoringEnabled(true);
    await app.context.setInputMonitoringEnabled(false);
    resolve({ getTracks: () => [] });
    await pending;
    assert.equal(app.gain.gain.value, 1);
    assert.equal(app.sound.disabled, false);
    assert.equal(app.input.classList.contains('button-on'), false);
});

test('loading seekable audio enables Progress and resetting its duration disables it again', () => {
    const app = setup(NaN);
    app.update();
    app.context.audioPlayer.duration = 20;
    app.update();
    assert.equal(app.context.progressSlider.disabled, false);
    assert.equal(app.buttons.seekBackward, false);
    assert.equal(app.buttons.seekForward, false);
    app.context.progressSlider.input();
    assert.equal(app.context.audioPlayer.currentTime, '5');
    app.context.audioPlayer.duration = NaN;
    app.update();
    assert.equal(app.context.progressSlider.disabled, true);
});
