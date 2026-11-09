const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'player.js'), 'utf8');
const importSource = source.slice(source.indexOf('function isAudioFile('), source.indexOf('\nloadPlaylistFromStorage();'));

function setup() {
    function element() {
        const listeners = {};
        const classes = new Set();
        return {
            listeners, value: 'selected',
            classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
            contains: target => target === targetElement,
            addEventListener: (type, listener) => { listeners[type] = listener; }
        };
    }
    const targetElement = element();
    const input = element();
    const document = element();
    document.getElementById = () => targetElement;
    const warnings = [];
    const alerts = [];
    const played = [];
    const playlist = [{ name: 'Existing.wav', file: {} }];
    const context = vm.createContext({
        document, window: element(), audioFileInput: input, playlist,
        console: { warn: message => warnings.push(message) },
        alert: message => alerts.push(message),
        getCustomPlaylist: () => playlist,
        addToPlaylist: files => playlist.push(...files.map(file => ({ name: file.name, file }))),
        playPlaylistItem: index => played.push(index)
    });
    vm.runInContext(importSource, context);
    return { context, targetElement, input, document, warnings, alerts, played, playlist };
}

function drag(files = [], types = ['Files']) {
    return {
        dataTransfer: { files, types, dropEffect: 'move' },
        prevented: false,
        preventDefault() { this.prevented = true; }
    };
}

test('Playlist drop appends multiple audio files in order and plays the first added track', () => {
    const app = setup();
    const event = drag([{ name: 'First.wav', type: 'audio/wav' }, { name: 'Second.FLAC', type: '' }]);
    app.targetElement.listeners.drop(event);
    assert.equal(event.prevented, true);
    assert.deepEqual(app.playlist.map(item => item.name), ['Existing.wav', 'First.wav', 'Second.FLAC']);
    assert.deepEqual(app.played, [1]);
});

test('unsupported drops report skipped files without replacing the existing playlist', () => {
    const app = setup();
    app.targetElement.listeners.drop(drag([{ name: 'Notes.txt', type: 'text/plain' }]));
    assert.equal(app.playlist.length, 1);
    assert.equal(app.played.length, 0);
    assert.match(app.alerts[0], /Notes.txt/);
    assert.deepEqual(app.alerts, app.warnings);
});

test('mixed drops retain audio and report unsupported files', () => {
    const app = setup();
    app.targetElement.listeners.drop(drag([{ name: 'Track.mp3', type: 'audio/mpeg' }, { name: 'Photo.png', type: 'image/png' }]));
    assert.equal(app.playlist.length, 2);
    assert.deepEqual(app.played, [1]);
    assert.match(app.alerts[0], /Photo.png/);
});

test('file drag feedback survives child transitions and clears after leaving or dropping', () => {
    const app = setup();
    const enter = app.targetElement.listeners.dragenter;
    const leave = app.targetElement.listeners.dragleave;
    enter(drag());
    enter(drag());
    leave(drag());
    assert.equal(app.targetElement.classList.contains('playlist-drop-target'), true);
    leave(drag());
    assert.equal(app.targetElement.classList.contains('playlist-drop-target'), false);
    enter(drag());
    app.targetElement.listeners.drop(drag());
    assert.equal(app.targetElement.classList.contains('playlist-drop-target'), false);
});

test('dragover uses copy inside Playlist and blocks file navigation outside it', () => {
    const app = setup();
    const inside = drag();
    inside.target = app.targetElement;
    app.targetElement.listeners.dragover(inside);
    app.document.listeners.dragover(inside);
    assert.equal(inside.dataTransfer.dropEffect, 'copy');
    const outside = drag();
    app.document.listeners.dragover(outside);
    assert.equal(outside.prevented, true);
    assert.equal(outside.dataTransfer.dropEffect, 'none');
    app.document.listeners.drop(outside);
    assert.equal(app.playlist.length, 1);
});

test('text drags are untouched and Open files uses the same import path', () => {
    const app = setup();
    const text = drag([], ['text/plain']);
    app.targetElement.listeners.dragover(text);
    app.document.listeners.drop(text);
    assert.equal(text.prevented, false);
    app.input.listeners.change({ target: { files: [{ name: 'Track.wav', type: 'audio/wav' }] } });
    assert.equal(app.playlist.length, 2);
    assert.deepEqual(app.played, [1]);
    assert.equal(app.input.value, '');
});
