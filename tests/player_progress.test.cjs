const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'player.js'), 'utf8');
const stateSource = source.slice(source.indexOf('function updateActionButtonStates()'), source.indexOf('    setButtonGrey(fadeInButton,'));
const inputSource = source.slice(source.indexOf("progressSlider.addEventListener('input'"), source.indexOf('// Volume controls'));

function setup(duration) {
    const buttons = {};
    const context = {
        mediaRecorder: null, recordingPending: false, recordingStream: null,
        recordingFormatSelect: {}, audioPlayer: { duration, paused: true, currentTime: 0 },
        hasLoadedAudioSource: () => false, playlist: [], loadedAudioBuffer: null,
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
