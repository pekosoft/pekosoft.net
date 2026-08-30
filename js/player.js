// Pekosoft Player
// pekosoft.net/js/player.js

// Variable declarations
const audioFileInput = document.getElementById('audio-file');
const audioPlayer = document.getElementById('audio-player');

const ejectButton = document.getElementById('eject-button');
const playButton = document.getElementById('play-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const stopButton = document.getElementById('stop-button');
const recordButton = document.getElementById('record-button');
const downloadButton = document.getElementById('download-button');
const toggleLoop = document.getElementById('toggle-loop-button');
const toggleSound = document.getElementById('toggle-sound-button');
const resetButton = document.getElementById('reset-button');
const toggleInput = document.getElementById('toggle-input-button');

const canvas = document.getElementById('waveform');
const canvasCtx = canvas.getContext('2d');
const staticCanvas = document.getElementById('static-waveform');
const staticCanvasCtx = staticCanvas.getContext('2d');
const volumeCanvas = document.getElementById('volume-meter');
const volumeCtx = volumeCanvas.getContext('2d');
const freqCanvas = document.getElementById('frequency-analyzer');
const freqCtx = freqCanvas.getContext('2d');

const progressSlider = document.getElementById('progress-slider');
const seekBackward = document.getElementById('seek-backward-button');
const seekForward = document.getElementById('seek-forward-button');

const volumeSlider = document.getElementById('volume-slider');
const volumeDecreaseButton = document.getElementById('volume-decrease-button');
const volumeIncreaseButton = document.getElementById('volume-increase-button');

const timerElement = document.getElementById('timer');
const toolTimerDisplayElement = document.getElementById('tool-timer-display');
const durationDisplayElement = document.getElementById('duration-display');
const selectionDisplayElement = document.getElementById('selection-display');
const remainingDisplayElement = document.getElementById('remaining-display');
const bpmInput = document.getElementById('bpm-input');
const snapNoteSelect = document.getElementById('snap-note-select');
const audioInput = document.getElementById('audio-input');
const panelTextElement = document.getElementById('player-text');
const copyButton = document.getElementById('copy-button');
const guidesButton = document.getElementById('guides-button');
window.addEventListener('pekosoft:timeline-bright-change', () => redrawTimelineCanvas());
const timelineZoomButton = document.getElementById('timeline-zoom-button');
const timelineRulerButton = document.getElementById('timeline-ruler-button');
const bpmRulerButton = document.getElementById('bpm-ruler-button');
const snapButton = document.getElementById('snap-button');
const timelinePanButton = document.getElementById('timeline-pan-button');
const waveformColorButton = document.getElementById('waveform-color-button');
const panelMetaButton = document.getElementById('panel-meta-button');
const panelInputButton = document.getElementById('panel-input-button');
const panelPlaylistButton = document.getElementById('panel-playlist-button');
const fadeCurveSelect = document.getElementById('fade-curve-select');
const responseSelect = document.getElementById('response-select');
const fadeInButton = document.getElementById('fade-in-button');
const fadeOutButton = document.getElementById('fade-out-button');
const normalizeButton = document.getElementById('normalize-button');
const reverseButton = document.getElementById('reverse-button');
const cutButton = document.getElementById('cut-button');
const pasteButton = document.getElementById('paste-button');
const deleteButton = document.getElementById('delete-button');
const selectAllButton = document.getElementById('select-all-button');
const selectNoneButton = document.getElementById('select-none-button');
const undoButton = document.getElementById('undo-button');
const redoButton = document.getElementById('redo-button');

const timelineRulerCanvas = document.getElementById('timeline-ruler');
const timelineRulerCtx = timelineRulerCanvas ? timelineRulerCanvas.getContext('2d') : null;
const bpmRulerCanvas = document.getElementById('bpm-ruler');
const bpmRulerCtx = bpmRulerCanvas ? bpmRulerCanvas.getContext('2d') : null;

const bassKnob = document.getElementById('bass-knob');
const trebleKnob = document.getElementById('treble-knob');
const balanceKnob = document.getElementById('balance-knob');
const speedKnob = document.getElementById('speed-knob');

const toolLevelButton = document.getElementById('tool-level-button');
const toolGuidesButton = document.getElementById('tool-guides-button');
const toolSpectroscopeButton = document.getElementById('tool-spectroscope-button');
const toolSpectrogramButton = document.getElementById('tool-spectrogram-button');
const toolOscilloscopeButton = document.getElementById('tool-oscilloscope-button');

const playheadCanvas = document.getElementById('playhead');
const playheadCtx = playheadCanvas.getContext('2d');
const timelineScroll = document.querySelector('#timeline-container .timeline-scroll');
const playerTimeline = document.querySelector('#timeline-container .player-timeline');
const waveformOverlay = document.querySelector('#timeline-container .waveform-overlay');
const cssVars = getComputedStyle(document.documentElement);
const colorPrimary = cssVars.getPropertyValue('--color1').trim();
const colorSecondary = cssVars.getPropertyValue('--color2').trim();
const colorBlack = cssVars.getPropertyValue('--black').trim() || '#000';
const colorWhite = cssVars.getPropertyValue('--white').trim();
const colorGrey2 = cssVars.getPropertyValue('--grey2').trim();
const PLAYER_TIMELINE_DETAIL_WIDTH = 4096;

function updateMetersSourceBridge() {
    window.__pekosoftMetersSource = {
        analyser: mainAnalyser,
        analyserLeft,
        analyserRight,
        channelCount: loadedChannelCount || 1,
        sampleRate: mainAudioContext.sampleRate,
        mediaElement: audioPlayer,
        isActive: () => Boolean(inputSource || recordingSource || (!audioPlayer.paused && !audioPlayer.ended)),
        isStopped: () => {
            if (!audioPlayer.paused) return false;
            if (audioPlayer.ended) return true;
            const t = Number.isFinite(audioPlayer.currentTime) ? audioPlayer.currentTime : 0;
            return t <= 0.02;
        }
    };
}

const STORAGE = {
    input: 'player.input',
    volume: 'player.volume',
    loop: 'player.loop',
    sound: 'player.sound',
    toolMeter: 'player.tool_meter',
    panelSource: 'player.panel_source',
    inputMonitor: 'player.input_monitor',
    showGuides: 'player.show_guides',
    toolGuides: 'player.tool_guides',
    timelineZoom: 'player.timeline_zoom',
    timelineRuler: 'player.timeline_ruler',
    bpmRuler: 'player.bpm_ruler',
    snap: 'player.snap',
    snapNote: 'player.snap_note',
    timelinePan: 'player.timeline_pan',
    bpm: 'player.bpm',
    waveformMultiColor: 'player.waveform_multi_color',
    fadeCurve: 'player.fade_curve',
    response: 'player.response',
    bass: 'player.bass',
    treble: 'player.treble',
    balance: 'player.balance',
    speed: 'player.speed'
};

let loadedAudioBuffer = null;
let audioClipboardBuffer = null;
let waveformCacheCanvas = null;
let waveformCacheCtx = null;
let waveformCacheDirty = true;
let generatedAudioObjectUrl = null;
let selectionStartTime = null;
let selectionEndTime = null;
let isWaveformSelecting = false;
let selectionAnchorTime = 0;
let waveformSelectionMode = null;
let isBpmRulerSelectionDragging = false;
let bpmRulerSelectionOffsetSeconds = 0;
const SELECTION_EDGE_HIT_PX = 8;
const MAX_BUFFER_HISTORY = 20;
let undoBufferStack = [];
let redoBufferStack = [];
const savedPlayerGuides = localStorage.getItem(STORAGE.showGuides);
let showGuides = savedPlayerGuides === null
    ? localStorage.getItem('global.guides') !== 'false'
    : savedPlayerGuides === 'true';
const savedPlayerPan = localStorage.getItem(STORAGE.timelinePan);
let showPanLine = savedPlayerPan === 'true';
const savedPlayerRuler = localStorage.getItem(STORAGE.timelineRuler);
let showTimelineRuler = savedPlayerRuler === null ? true : savedPlayerRuler === 'true';
const savedPlayerBpmRuler = localStorage.getItem(STORAGE.bpmRuler);
let showBpmRuler = savedPlayerBpmRuler === null ? true : savedPlayerBpmRuler === 'true';
if (savedPlayerBpmRuler === null) {
    localStorage.setItem(STORAGE.bpmRuler, 'true');
}
const savedSnapToBeat = localStorage.getItem(STORAGE.snap);
let snapToBeat = savedSnapToBeat === null ? true : savedSnapToBeat === 'true';
if (savedSnapToBeat === null) {
    localStorage.setItem(STORAGE.snap, 'true');
}
let snapNoteValue = normalizeSnapNoteValue(localStorage.getItem(STORAGE.snapNote));
let loopEnabled = localStorage.getItem(STORAGE.loop) === 'true';
let bpmValue = (() => {
    const parsed = parseFloat(localStorage.getItem(STORAGE.bpm));
    return Number.isFinite(parsed) ? Math.max(1, Math.min(400, parsed)) : 120;
})();
const savedWaveformMultiColor = localStorage.getItem(STORAGE.waveformMultiColor);
let showWaveformMultiColor = savedWaveformMultiColor === null ? true : savedWaveformMultiColor === 'true';
if (savedWaveformMultiColor === null) {
    localStorage.setItem(STORAGE.waveformMultiColor, 'true');
}
const savedToolGuides = localStorage.getItem(STORAGE.toolGuides);
let showToolGuides = savedToolGuides === null ? true : savedToolGuides === 'true';
if (savedToolGuides === null) {
    localStorage.setItem(STORAGE.toolGuides, 'true');
}
let mediaRecorder;
let audioChunks = [];
let startTime;
let timerInterval;
let selectedDeviceId = null;
let inputStream = null;
let inputSource = null;
let recordingStream = null;
let recordingSource = null;
let responseAnimationFrameId = null;
let responseAnimationToken = 0;

function setButtonGrey(buttonElement, isGrey) {
    if (!buttonElement) return;
    buttonElement.classList.toggle('grey', isGrey);
}

function hasLoadedAudioSource() {
    return Boolean((audioPlayer.currentSrc || audioPlayer.src || '').trim());
}

function revokeGeneratedAudioUrl() {
    if (!generatedAudioObjectUrl) return;
    URL.revokeObjectURL(generatedAudioObjectUrl);
    generatedAudioObjectUrl = null;
}

function cloneAudioBuffer(buffer) {
    if (!buffer) return null;
    const clone = mainAudioContext.createBuffer(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        clone.copyToChannel(buffer.getChannelData(channel), channel);
    }

    return clone;
}

function captureBufferSnapshot() {
    if (!loadedAudioBuffer) return null;
    return {
        buffer: cloneAudioBuffer(loadedAudioBuffer),
        selectionStart: selectionStartTime,
        selectionEnd: selectionEndTime
    };
}

function clearBufferHistory() {
    undoBufferStack = [];
    redoBufferStack = [];
    updateActionButtonStates();
}

function pushUndoSnapshot() {
    const snapshot = captureBufferSnapshot();
    if (!snapshot) return;

    undoBufferStack.push(snapshot);
    if (undoBufferStack.length > MAX_BUFFER_HISTORY) {
        undoBufferStack.shift();
    }

    redoBufferStack = [];
}

async function restoreBufferSnapshot(snapshot) {
    if (!snapshot?.buffer) return;
    loadedAudioBuffer = cloneAudioBuffer(snapshot.buffer);
    selectionStartTime = snapshot.selectionStart;
    selectionEndTime = snapshot.selectionEnd;
    updateLoopPlaybackMode();
    updateSelectionDisplay();
    waveformCacheDirty = true;
    redrawTimelineCanvas();
    await refreshAudioSourceFromBuffer();
    updateActionButtonStates();
}

async function undoWaveformEdit() {
    if (!loadedAudioBuffer || undoBufferStack.length === 0) return;

    const currentSnapshot = captureBufferSnapshot();
    if (currentSnapshot) {
        redoBufferStack.push(currentSnapshot);
    }

    const previousSnapshot = undoBufferStack.pop();
    await restoreBufferSnapshot(previousSnapshot);
}

async function redoWaveformEdit() {
    if (!loadedAudioBuffer || redoBufferStack.length === 0) return;

    const currentSnapshot = captureBufferSnapshot();
    if (currentSnapshot) {
        undoBufferStack.push(currentSnapshot);
        if (undoBufferStack.length > MAX_BUFFER_HISTORY) {
            undoBufferStack.shift();
        }
    }

    const nextSnapshot = redoBufferStack.pop();
    await restoreBufferSnapshot(nextSnapshot);
}

function getSelectedFadeCurve() {
    const mode = fadeCurveSelect?.value || 'sinusoid';
    return mode === 'linear' || mode === 'exponential' || mode === 'logarithmic' ? mode : 'sinusoid';
}

function parseCssColorToRgb(colorValue, fallback = { r: 255, g: 255, b: 255 }) {
    if (typeof colorValue !== 'string') return fallback;

    const value = colorValue.trim();
    if (value.startsWith('#')) {
        const hex = value.slice(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16)
            };
        }

        if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16)
            };
        }
    }

    const rgbMatch = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbMatch) {
        return {
            r: Number(rgbMatch[1]),
            g: Number(rgbMatch[2]),
            b: Number(rgbMatch[3])
        };
    }

    return fallback;
}

function mixRgb(lowRgb, highRgb, ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    return {
        r: Math.round(lowRgb.r + (highRgb.r - lowRgb.r) * clamped),
        g: Math.round(lowRgb.g + (highRgb.g - lowRgb.g) * clamped),
        b: Math.round(lowRgb.b + (highRgb.b - lowRgb.b) * clamped)
    };
}

function saturateRgb(rgb, amount = 1.2) {
    const luma = (0.2126 * rgb.r) + (0.7152 * rgb.g) + (0.0722 * rgb.b);
    const scale = Math.max(0, amount);
    return {
        r: Math.max(0, Math.min(255, Math.round(luma + ((rgb.r - luma) * scale)))),
        g: Math.max(0, Math.min(255, Math.round(luma + ((rgb.g - luma) * scale)))),
        b: Math.max(0, Math.min(255, Math.round(luma + ((rgb.b - luma) * scale))))
    };
}

function getWaveformBandMixRatio(lowLevel, highLevel) {
    const safeLow = Math.max(0, lowLevel);
    const safeHigh = Math.max(0, highLevel);
    const lowWithOverlap = (safeLow * 1.02) + (safeHigh * 0.18);
    const highWithOverlap = (safeHigh * 1.12) + (safeLow * 0.30);
    const sum = lowWithOverlap + highWithOverlap;

    if (sum <= 0) {
        return 0.5;
    }

    const baseRatio = highWithOverlap / sum;
    const centered = baseRatio - 0.5;
    const contrasted = 0.5 + (centered * 1.38);
    return Math.max(0, Math.min(1, contrasted));
}

function getWaveformBandColor(lowRgb, highRgb, ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const blendStart = 0.43;
    const blendEnd = 0.57;

    if (clamped <= blendStart) {
        return lowRgb;
    }

    if (clamped >= blendEnd) {
        return highRgb;
    }

    const localRatio = (clamped - blendStart) / (blendEnd - blendStart);
    const mixed = mixRgb(lowRgb, highRgb, localRatio);
    return saturateRgb(mixed, 1.26);
}

function rgbToCss(rgb) {
    return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

function updateWaveformColorButtonState() {
    if (!waveformColorButton) return;
    waveformColorButton.classList.toggle('button-on', showWaveformMultiColor);
}

function clampBpm(value) {
    const parsed = Math.round(parseFloat(value));
    if (!Number.isFinite(parsed)) return 120;
    return Math.max(1, Math.min(400, parsed));
}

function setBpmValue(value, persist = true) {
    bpmValue = clampBpm(value);
    if (bpmInput) {
        bpmInput.value = String(bpmValue);
    }
    if (persist) {
        localStorage.setItem(STORAGE.bpm, String(bpmValue));
    }
    drawBpmRuler();
}

function updateBpmRulerButtonState() {
    if (!bpmRulerButton) return;
    bpmRulerButton.classList.toggle('button-on', showBpmRuler);
}

function updateSnapButtonState() {
    if (!snapButton) return;
    snapButton.classList.toggle('button-on', snapToBeat);
}

function getAllowedSnapNotes() {
    return ['8/1', '4/1', '2/1', '1/1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128'];
}

function normalizeSnapNoteValue(value) {
    const allowed = getAllowedSnapNotes();
    return allowed.includes(value) ? value : '1/4';
}

function getSnapNoteRatio() {
    const [numeratorRaw, denominatorRaw] = normalizeSnapNoteValue(snapNoteValue).split('/');
    const numerator = Math.max(1, parseInt(numeratorRaw, 10));
    const denominator = Math.max(1, parseInt(denominatorRaw, 10));
    return numerator / denominator;
}

function getBeatSeconds() {
    const bpm = Math.max(1, bpmValue);
    return 60 / bpm;
}

function getSnapStepSeconds() {
    const quarterBeatSeconds = getBeatSeconds();
    const noteRatio = getSnapNoteRatio();
    return quarterBeatSeconds * 4 * noteRatio;
}

function snapSecondsToBeat(seconds, duration = loadedAudioBuffer?.duration || audioPlayer.duration || 0) {
    if (!snapToBeat) {
        return seconds;
    }

    if (!Number.isFinite(seconds)) {
        return seconds;
    }

    const snapStepSeconds = getSnapStepSeconds();
    if (!Number.isFinite(snapStepSeconds) || snapStepSeconds <= 0) {
        return seconds;
    }

    const snapped = Math.round(seconds / snapStepSeconds) * snapStepSeconds;
    if (!Number.isFinite(duration) || duration <= 0) {
        return Math.max(0, snapped);
    }

    return Math.max(0, Math.min(duration, snapped));
}

function getCurveRatio(ratio, mode = getSelectedFadeCurve()) {
    const clampedRatio = Math.max(0, Math.min(1, ratio));

    if (mode === 'linear') {
        return clampedRatio;
    }

    if (mode === 'exponential') {
        const intensity = 4;
        return (Math.exp(intensity * clampedRatio) - 1) / (Math.exp(intensity) - 1);
    }

    if (mode === 'logarithmic') {
        const intensity = 9;
        return Math.log1p(intensity * clampedRatio) / Math.log1p(intensity);
    }

    return (1 - Math.cos(Math.PI * clampedRatio)) / 2;
}

function hasActiveSelection() {
    if (!loadedAudioBuffer || !Number.isFinite(loadedAudioBuffer.duration) || loadedAudioBuffer.duration <= 0) {
        return false;
    }

    if (!Number.isFinite(selectionStartTime) || !Number.isFinite(selectionEndTime)) {
        return false;
    }

    return Math.abs(selectionEndTime - selectionStartTime) > (1 / loadedAudioBuffer.sampleRate);
}

function getSelectionBoundsSeconds() {
    if (!loadedAudioBuffer || !Number.isFinite(loadedAudioBuffer.duration) || loadedAudioBuffer.duration <= 0) {
        return null;
    }

    if (!hasActiveSelection()) {
        return {
            start: 0,
            end: loadedAudioBuffer.duration,
            fromSelection: false
        };
    }

    const duration = loadedAudioBuffer.duration;
    const start = Math.max(0, Math.min(duration, Math.min(selectionStartTime, selectionEndTime)));
    const end = Math.max(0, Math.min(duration, Math.max(selectionStartTime, selectionEndTime)));

    return {
        start,
        end,
        fromSelection: true
    };
}

function setWaveformSelection(startSeconds, endSeconds) {
    if (!loadedAudioBuffer || !Number.isFinite(loadedAudioBuffer.duration) || loadedAudioBuffer.duration <= 0) {
        selectionStartTime = null;
        selectionEndTime = null;
        updateSelectionDisplay();
        redrawTimelineCanvas();
        updateActionButtonStates();
        return;
    }

    const duration = loadedAudioBuffer.duration;
    const clampedStart = Math.max(0, Math.min(duration, startSeconds));
    const clampedEnd = Math.max(0, Math.min(duration, endSeconds));
    const snappedStart = snapSecondsToBeat(clampedStart, duration);
    const snappedEnd = snapSecondsToBeat(clampedEnd, duration);

    selectionStartTime = snappedStart;
    selectionEndTime = snappedEnd;

    updateLoopPlaybackMode();
    updateSelectionDisplay();
    redrawTimelineCanvas();
    updateActionButtonStates();
}

function clearWaveformSelection() {
    selectionStartTime = null;
    selectionEndTime = null;
    updateLoopPlaybackMode();
    updateSelectionDisplay();
    redrawTimelineCanvas();
    updateActionButtonStates();
}

function getSelectionLoopBounds() {
    if (!hasActiveSelection()) {
        return null;
    }

    const duration = audioPlayer.duration || loadedAudioBuffer?.duration || 0;
    if (!Number.isFinite(duration) || duration <= 0) {
        return null;
    }

    const start = Math.max(0, Math.min(duration, Math.min(selectionStartTime, selectionEndTime)));
    const end = Math.max(0, Math.min(duration, Math.max(selectionStartTime, selectionEndTime)));
    const minimumSpan = 1 / Math.max(1, loadedAudioBuffer?.sampleRate || 1);

    if ((end - start) <= minimumSpan) {
        return null;
    }

    return { start, end };
}

function updateLoopPlaybackMode() {
    const loopSelection = getSelectionLoopBounds();
    audioPlayer.loop = loopEnabled && !loopSelection;
    if (toggleLoop) {
        toggleLoop.classList.toggle('button-on', loopEnabled);
    }
}

function applySelectionLoopIfNeeded() {
    if (!loopEnabled) {
        return false;
    }

    const loopSelection = getSelectionLoopBounds();
    if (!loopSelection) {
        return false;
    }

    const epsilonSeconds = Math.max(0.005, 1 / Math.max(1, loadedAudioBuffer?.sampleRate || 1));
    const now = audioPlayer.currentTime || 0;

    if (now < (loopSelection.end - epsilonSeconds)) {
        return false;
    }

    const duration = audioPlayer.duration || loadedAudioBuffer?.duration || 0;
    audioPlayer.currentTime = loopSelection.start;
    progressSlider.max = duration;
    progressSlider.value = String(loopSelection.start);
    setRemainingDisplay(duration - loopSelection.start);
    updateTimeFieldBars();
    drawPlayhead();
    syncTimelineScrollPosition();
    return true;
}

function selectAllWaveform() {
    if (!loadedAudioBuffer || !Number.isFinite(loadedAudioBuffer.duration) || loadedAudioBuffer.duration <= 0) {
        return;
    }

    setWaveformSelection(0, loadedAudioBuffer.duration);
}

function getWaveformPointerTime(event) {
    if (!loadedAudioBuffer || !Number.isFinite(loadedAudioBuffer.duration) || loadedAudioBuffer.duration <= 0) {
        return null;
    }

    const rect = staticCanvas.getBoundingClientRect();
    if (!rect || rect.width <= 0) return null;

    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const rawTime = ratio * loadedAudioBuffer.duration;
    return snapSecondsToBeat(rawTime, loadedAudioBuffer.duration);
}

function getWaveformPointerX(event) {
    const rect = staticCanvas.getBoundingClientRect();
    if (!rect || rect.width <= 0) return null;
    return Math.max(0, Math.min(rect.width, event.clientX - rect.left));
}

function getCanvasPointerX(event, canvasElement) {
    if (!canvasElement) return null;

    const rect = canvasElement.getBoundingClientRect();
    if (!rect || rect.width <= 0) return null;

    return Math.max(0, Math.min(rect.width, event.clientX - rect.left));
}

function getCanvasPointerTime(event, canvasElement, shouldSnapToBeat = false) {
    if (!loadedAudioBuffer || !Number.isFinite(loadedAudioBuffer.duration) || loadedAudioBuffer.duration <= 0) {
        return null;
    }

    const pointerX = getCanvasPointerX(event, canvasElement);
    if (!Number.isFinite(pointerX)) return null;

    const rect = canvasElement.getBoundingClientRect();
    if (!rect || rect.width <= 0) return null;

    const ratio = Math.max(0, Math.min(1, pointerX / rect.width));
    const rawTime = ratio * loadedAudioBuffer.duration;
    return shouldSnapToBeat ? snapSecondsToBeat(rawTime, loadedAudioBuffer.duration) : rawTime;
}

function getSelectionEdgeAtX(pointerX, pointerType = 'mouse') {
    if (!hasActiveSelection() || !loadedAudioBuffer || loadedAudioBuffer.duration <= 0) {
        return null;
    }

    const rect = staticCanvas.getBoundingClientRect();
    if (!rect || rect.width <= 0) return null;

    const hitPx = pointerType === 'touch' ? Math.max(SELECTION_EDGE_HIT_PX, 24) : SELECTION_EDGE_HIT_PX;

    const start = Math.min(selectionStartTime, selectionEndTime);
    const end = Math.max(selectionStartTime, selectionEndTime);
    const startX = (start / loadedAudioBuffer.duration) * rect.width;
    const endX = (end / loadedAudioBuffer.duration) * rect.width;

    if (Math.abs(pointerX - startX) <= hitPx) {
        return 'start';
    }

    if (Math.abs(pointerX - endX) <= hitPx) {
        return 'end';
    }

    return null;
}

function updateWaveformSelectionCursor(event) {
    if (!staticCanvas) return;

    if (!hasActiveSelection()) {
        staticCanvas.style.cursor = 'crosshair';
        return;
    }

    const pointerX = event ? getWaveformPointerX(event) : null;
    if (!Number.isFinite(pointerX)) {
        staticCanvas.style.cursor = 'crosshair';
        return;
    }

    const edge = getSelectionEdgeAtX(pointerX, event?.pointerType || 'mouse');
    staticCanvas.style.cursor = edge ? 'ew-resize' : 'crosshair';
}

function updateBpmRulerSelectionCursor(event) {
    if (!bpmRulerCanvas) return;

    if (isBpmRulerSelectionDragging) {
        bpmRulerCanvas.style.cursor = 'move';
        return;
    }

    const pointerX = event ? getCanvasPointerX(event, bpmRulerCanvas) : null;
    if (!Number.isFinite(pointerX)) {
        bpmRulerCanvas.style.cursor = '';
        return;
    }

    const bounds = getSelectionPixelBoundsForWidth(bpmRulerCanvas.width);
    if (!bounds) {
        bpmRulerCanvas.style.cursor = '';
        return;
    }

    bpmRulerCanvas.style.cursor = pointerX >= bounds.x1 && pointerX <= bounds.x2 ? 'move' : '';
}

function writeStringToDataView(view, offset, text) {
    for (let index = 0; index < text.length; index++) {
        view.setUint8(offset + index, text.charCodeAt(index));
    }
}

function encodeAudioBufferToWavBlob(audioBuffer) {
    const channelCount = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const frameCount = audioBuffer.length;
    const interleaved = new Float32Array(frameCount * channelCount);

    let cursor = 0;
    const channels = [];
    for (let channel = 0; channel < channelCount; channel++) {
        channels.push(audioBuffer.getChannelData(channel));
    }

    for (let sampleIndex = 0; sampleIndex < frameCount; sampleIndex++) {
        for (let channel = 0; channel < channelCount; channel++) {
            interleaved[cursor++] = channels[channel][sampleIndex];
        }
    }

    const bytesPerSample = 2;
    const dataChunkSize = interleaved.length * bytesPerSample;
    const arrayBuffer = new ArrayBuffer(44 + dataChunkSize);
    const view = new DataView(arrayBuffer);

    writeStringToDataView(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataChunkSize, true);
    writeStringToDataView(view, 8, 'WAVE');
    writeStringToDataView(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channelCount, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
    view.setUint16(32, channelCount * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeStringToDataView(view, 36, 'data');
    view.setUint32(40, dataChunkSize, true);

    let offset = 44;
    for (let index = 0; index < interleaved.length; index++) {
        const sample = Math.max(-1, Math.min(1, interleaved[index]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += bytesPerSample;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

async function refreshAudioSourceFromBuffer() {
    if (!loadedAudioBuffer) return;

    const wasPlaying = !audioPlayer.paused && !audioPlayer.ended && hasLoadedAudioSource();
    const targetTime = Math.max(0, Math.min(audioPlayer.currentTime || 0, loadedAudioBuffer.duration || 0));
    const editedBlob = encodeAudioBufferToWavBlob(loadedAudioBuffer);

    revokeGeneratedAudioUrl();
    generatedAudioObjectUrl = URL.createObjectURL(editedBlob);

    audioPlayer.src = generatedAudioObjectUrl;
    if (downloadButton) {
        downloadButton.dataset.audioUrl = generatedAudioObjectUrl;
    }

    await new Promise((resolve) => {
        const handleLoadedMetadata = () => {
            const seekTime = Math.max(0, Math.min(targetTime, audioPlayer.duration || 0));
            audioPlayer.currentTime = seekTime;
            progressSlider.max = audioPlayer.duration || 0;
            progressSlider.value = audioPlayer.currentTime || 0;
            setDurationDisplay(audioPlayer.duration || 0);
            setRemainingDisplay((audioPlayer.duration || 0) - (audioPlayer.currentTime || 0));
            updateTimeFieldBars();
            drawPlayhead();

            if (wasPlaying) {
                audioPlayer.play().catch((error) => {
                    console.warn('Playback resume after edit failed:', error);
                });
            }

            resolve();
        };

        audioPlayer.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
    });

    // Keep panel analysis in sync after every waveform edit/undo/redo cycle.
    panelState.meta.fileSize = `${(editedBlob.size / 1024 / 1024).toFixed(2)} MB`;
    panelState.meta.duration = formatDurationForPanel(loadedAudioBuffer.duration);
    panelState.meta.sampleRate = `${loadedAudioBuffer.sampleRate} Hz`;
    panelState.meta.channels = loadedAudioBuffer.numberOfChannels;
    panelState.meta.format = 'audio/wav';
    applyPanelMetaAnalysis(loadedAudioBuffer);
    renderPanel();
}

function formatDurationForPanel(durationInSeconds) {
    const safeDuration = Number.isFinite(durationInSeconds) ? Math.max(0, durationInSeconds) : 0;
    const minutes = Math.floor(safeDuration / 60);
    const seconds = Math.floor(safeDuration % 60);
    const milliseconds = Math.floor((safeDuration % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
}

function formatAnalysisTimestamp(dateObj = new Date()) {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function getProcessSampleBounds() {
    if (!loadedAudioBuffer) return null;

    const range = getSelectionBoundsSeconds();
    if (!range) return null;

    const startSample = Math.max(0, Math.min(loadedAudioBuffer.length, Math.floor(range.start * loadedAudioBuffer.sampleRate)));
    const endSample = Math.max(startSample + 1, Math.min(loadedAudioBuffer.length, Math.ceil(range.end * loadedAudioBuffer.sampleRate)));

    return {
        startSample,
        endSample,
        fromSelection: range.fromSelection
    };
}

function cloneAudioBufferRange(buffer, startSample, endSample) {
    if (!buffer) return null;

    const safeStart = Math.max(0, Math.min(buffer.length, Math.floor(startSample)));
    const safeEnd = Math.max(safeStart, Math.min(buffer.length, Math.ceil(endSample)));
    const sampleLength = safeEnd - safeStart;

    if (sampleLength <= 0) return null;

    const clone = mainAudioContext.createBuffer(
        buffer.numberOfChannels,
        sampleLength,
        buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        clone.copyToChannel(channelData.subarray(safeStart, safeEnd), channel);
    }

    return clone;
}

function setTimelineCopyButtonsGrey(isGrey) {
    const timelineCopyButtons = document.querySelectorAll('.timeline-copy-button');
    timelineCopyButtons.forEach((button) => {
        setButtonGrey(button, isGrey);
    });
}

function copySelectionToAudioClipboard(bounds = getProcessSampleBounds()) {
    if (!loadedAudioBuffer || !bounds) {
        updateActionButtonStates();
        return false;
    }

    const copied = cloneAudioBufferRange(loadedAudioBuffer, bounds.startSample, bounds.endSample);
    if (!copied) {
        updateActionButtonStates();
        return false;
    }

    audioClipboardBuffer = copied;
    updateActionButtonStates();
    return true;
}

async function deleteBufferRange(bounds = getProcessSampleBounds()) {
    if (!loadedAudioBuffer || !bounds) return;

    const removeStart = Math.max(0, Math.min(loadedAudioBuffer.length, bounds.startSample));
    const removeEnd = Math.max(removeStart + 1, Math.min(loadedAudioBuffer.length, bounds.endSample));
    const removeLength = removeEnd - removeStart;
    if (removeLength <= 0) return;

    pushUndoSnapshot();

    const sampleRate = loadedAudioBuffer.sampleRate;
    const removeStartSeconds = removeStart / sampleRate;
    const removeDurationSeconds = removeLength / sampleRate;
    let targetTime = Math.max(0, audioPlayer.currentTime || 0);
    if (targetTime > removeStartSeconds) {
        targetTime = Math.max(removeStartSeconds, targetTime - removeDurationSeconds);
    }

    const newLength = loadedAudioBuffer.length - removeLength;
    const channelCount = loadedAudioBuffer.numberOfChannels;

    if (newLength <= 0) {
        loadedAudioBuffer = mainAudioContext.createBuffer(channelCount, 1, sampleRate);
    } else {
        const editedBuffer = mainAudioContext.createBuffer(channelCount, newLength, sampleRate);

        for (let channel = 0; channel < channelCount; channel++) {
            const sourceData = loadedAudioBuffer.getChannelData(channel);
            const targetData = editedBuffer.getChannelData(channel);
            if (removeStart > 0) {
                targetData.set(sourceData.subarray(0, removeStart), 0);
            }
            if (removeEnd < loadedAudioBuffer.length) {
                targetData.set(sourceData.subarray(removeEnd), removeStart);
            }
        }

        loadedAudioBuffer = editedBuffer;
    }

    selectionStartTime = null;
    selectionEndTime = null;
    audioPlayer.currentTime = targetTime;
    updateLoopPlaybackMode();
    updateSelectionDisplay();
    waveformCacheDirty = true;
    redrawTimelineCanvas();
    await refreshAudioSourceFromBuffer();
    updateActionButtonStates();
}

async function cutBufferRange() {
    if (!loadedAudioBuffer) return;

    const bounds = getProcessSampleBounds();
    if (!bounds) return;

    if (!copySelectionToAudioClipboard(bounds)) return;
    await deleteBufferRange(bounds);
}

async function pasteClipboardBuffer() {
    if (!audioClipboardBuffer) {
        updateActionButtonStates();
        return;
    }

    if (!loadedAudioBuffer) {
        loadedAudioBuffer = cloneAudioBuffer(audioClipboardBuffer);
        selectionStartTime = 0;
        selectionEndTime = loadedAudioBuffer.duration;
        updateLoopPlaybackMode();
        updateSelectionDisplay();
        waveformCacheDirty = true;
        redrawTimelineCanvas();
        await refreshAudioSourceFromBuffer();
        updateActionButtonStates();
        return;
    }

    if (loadedAudioBuffer.sampleRate !== audioClipboardBuffer.sampleRate) {
        console.warn('Paste skipped because sample rates do not match.');
        return;
    }

    const sampleRate = loadedAudioBuffer.sampleRate;
    let replaceStart = Math.max(0, Math.min(loadedAudioBuffer.length, Math.floor((audioPlayer.currentTime || 0) * sampleRate)));
    let replaceEnd = replaceStart;

    if (hasActiveSelection()) {
        const selection = getSelectionBoundsSeconds();
        if (selection) {
            replaceStart = Math.max(0, Math.min(loadedAudioBuffer.length, Math.floor(selection.start * sampleRate)));
            replaceEnd = Math.max(replaceStart, Math.min(loadedAudioBuffer.length, Math.ceil(selection.end * sampleRate)));
        }
    }

    const insertedLength = audioClipboardBuffer.length;
    const removedLength = replaceEnd - replaceStart;
    const newLength = loadedAudioBuffer.length - removedLength + insertedLength;
    const channelCount = Math.max(loadedAudioBuffer.numberOfChannels, audioClipboardBuffer.numberOfChannels);

    pushUndoSnapshot();

    const editedBuffer = mainAudioContext.createBuffer(channelCount, Math.max(1, newLength), sampleRate);
    const insertAt = replaceStart;

    for (let channel = 0; channel < channelCount; channel++) {
        const targetData = editedBuffer.getChannelData(channel);
        const sourceData = channel < loadedAudioBuffer.numberOfChannels
            ? loadedAudioBuffer.getChannelData(channel)
            : null;
        const clipboardData = channel < audioClipboardBuffer.numberOfChannels
            ? audioClipboardBuffer.getChannelData(channel)
            : null;

        if (sourceData && replaceStart > 0) {
            targetData.set(sourceData.subarray(0, replaceStart), 0);
        }

        if (clipboardData && insertedLength > 0) {
            targetData.set(clipboardData, insertAt);
        }

        if (sourceData && replaceEnd < loadedAudioBuffer.length) {
            targetData.set(sourceData.subarray(replaceEnd), insertAt + insertedLength);
        }
    }

    loadedAudioBuffer = editedBuffer;

    const insertStartSeconds = insertAt / sampleRate;
    const insertEndSeconds = (insertAt + insertedLength) / sampleRate;
    selectionStartTime = insertStartSeconds;
    selectionEndTime = insertEndSeconds;
    audioPlayer.currentTime = Math.max(0, Math.min(insertEndSeconds, loadedAudioBuffer.duration || insertEndSeconds));
    updateLoopPlaybackMode();
    updateSelectionDisplay();
    waveformCacheDirty = true;
    redrawTimelineCanvas();
    await refreshAudioSourceFromBuffer();
    updateActionButtonStates();
}

window.copyTimelineAudioToClipboard = async () => {
    copySelectionToAudioClipboard();
};

async function applyFadeToBuffer(type) {
    if (!loadedAudioBuffer) return;

    const bounds = getProcessSampleBounds();
    if (!bounds) return;

    pushUndoSnapshot();

    const mode = getSelectedFadeCurve();
    const sampleSpan = Math.max(1, bounds.endSample - bounds.startSample);

    for (let channel = 0; channel < loadedAudioBuffer.numberOfChannels; channel++) {
        const channelData = loadedAudioBuffer.getChannelData(channel);

        for (let index = bounds.startSample; index < bounds.endSample; index++) {
            const ratio = sampleSpan <= 1 ? 1 : (index - bounds.startSample) / (sampleSpan - 1);
            const gain = type === 'out'
                ? getCurveRatio(1 - ratio, mode)
                : getCurveRatio(ratio, mode);
            channelData[index] *= gain;
        }
    }

    waveformCacheDirty = true;
    redrawTimelineCanvas();
    await refreshAudioSourceFromBuffer();
    updateActionButtonStates();
}

async function normalizeBufferToZeroDb() {
    if (!loadedAudioBuffer) return;

    const bounds = getProcessSampleBounds();
    if (!bounds) return;

    let peak = 0;
    for (let channel = 0; channel < loadedAudioBuffer.numberOfChannels; channel++) {
        const channelData = loadedAudioBuffer.getChannelData(channel);
        for (let index = bounds.startSample; index < bounds.endSample; index++) {
            const abs = Math.abs(channelData[index]);
            if (abs > peak) peak = abs;
        }
    }

    if (peak <= 0) {
        updateActionButtonStates();
        return;
    }

    pushUndoSnapshot();

    const gain = 1 / peak;
    for (let channel = 0; channel < loadedAudioBuffer.numberOfChannels; channel++) {
        const channelData = loadedAudioBuffer.getChannelData(channel);
        for (let index = bounds.startSample; index < bounds.endSample; index++) {
            channelData[index] *= gain;
        }
    }

    waveformCacheDirty = true;
    redrawTimelineCanvas();
    await refreshAudioSourceFromBuffer();
    updateActionButtonStates();
}

async function reverseBufferRange() {
    if (!loadedAudioBuffer) return;

    const bounds = getProcessSampleBounds();
    if (!bounds) return;

    pushUndoSnapshot();

    for (let channel = 0; channel < loadedAudioBuffer.numberOfChannels; channel++) {
        const channelData = loadedAudioBuffer.getChannelData(channel);
        let left = bounds.startSample;
        let right = bounds.endSample - 1;

        while (left < right) {
            const temp = channelData[left];
            channelData[left] = channelData[right];
            channelData[right] = temp;
            left++;
            right--;
        }
    }

    waveformCacheDirty = true;
    redrawTimelineCanvas();
    await refreshAudioSourceFromBuffer();
    updateActionButtonStates();
}

function updateActionButtonStates() {
    const isRecording = Boolean(mediaRecorder && mediaRecorder.state === 'recording');
    const isPlaying = !audioPlayer.paused && !audioPlayer.ended && hasLoadedAudioSource();
    const hasAudio = hasLoadedAudioSource();
    const hasDownloadableRecording = Boolean(downloadButton && downloadButton.dataset.audioUrl);
    const canSeek = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0;
    const hasPlayablePlaylist = playlist.some(item => Boolean(item?.file));
    const hasEditableBuffer = Boolean(loadedAudioBuffer);
    const hasSelection = hasActiveSelection();
    const hasTimelineDuration = hasEditableBuffer && Number.isFinite(loadedAudioBuffer.duration) && loadedAudioBuffer.duration > 0;
    const hasAudioClipboard = Boolean(audioClipboardBuffer && audioClipboardBuffer.length > 0);

    setButtonGrey(playButton, !hasAudio || isRecording);
    setButtonGrey(prevButton, !hasPlayablePlaylist || isRecording);
    setButtonGrey(nextButton, !hasPlayablePlaylist || isRecording);
    setButtonGrey(stopButton, !(isRecording || isPlaying || (audioPlayer.currentTime || 0) > 0));
    setButtonGrey(downloadButton, !hasDownloadableRecording);
    setButtonGrey(toggleLoop, false);
    setButtonGrey(seekBackward, !canSeek);
    setButtonGrey(seekForward, !canSeek);
    setButtonGrey(fadeInButton, !hasTimelineDuration || isRecording);
    setButtonGrey(fadeOutButton, !hasTimelineDuration || isRecording);
    setButtonGrey(normalizeButton, !hasTimelineDuration || isRecording);
    setButtonGrey(reverseButton, !hasTimelineDuration || isRecording);
    setButtonGrey(cutButton, !hasTimelineDuration || isRecording);
    setButtonGrey(pasteButton, !hasAudioClipboard || isRecording);
    setButtonGrey(deleteButton, !hasTimelineDuration || isRecording);
    setButtonGrey(selectAllButton, !hasTimelineDuration || isRecording);
    setButtonGrey(selectNoneButton, !hasSelection || isRecording);
    setButtonGrey(undoButton, !hasTimelineDuration || isRecording || undoBufferStack.length === 0);
    setButtonGrey(redoButton, !hasTimelineDuration || isRecording || redoBufferStack.length === 0);
    setTimelineCopyButtonsGrey(!hasTimelineDuration || isRecording);
    setButtonGrey(waveformColorButton, false);

    if (selectAllButton) {
        const isFullSelection = hasSelection
            && Math.abs(Math.min(selectionStartTime, selectionEndTime) - 0) <= (1 / Math.max(1, loadedAudioBuffer?.sampleRate || 1))
            && Math.abs(Math.max(selectionStartTime, selectionEndTime) - (loadedAudioBuffer?.duration || 0)) <= (1 / Math.max(1, loadedAudioBuffer?.sampleRate || 1));
        selectAllButton.classList.toggle('button-on', Boolean(isFullSelection));
    }

    if (selectNoneButton) {
        selectNoneButton.classList.toggle('button-on', !hasSelection);
    }
}

const panelState = {
    meta: {
        fileName: '-',
        fileSize: '-',
        duration: '-',
        sampleRate: '-',
        channels: '-',
        format: '-',
        analysisUpdated: '-',
        digitalPeak: '-',
        truePeak: '-',
        loudnessRms: '-',
        lufsEstimate: '-',
        lrDiff: '-',
        phaseDiff: '-',
        averagePitch: '-',
        dcOffset: '-'
    },
    input: {
        sampleRate: '-',
        channels: '-',
        latency: '-',
        device: '-'
    }
};

// Freeze flag for visuals
let freezeVisuals = false;

// Shared AudioContext + analyser
let mainAudioContext = new (window.AudioContext || window.webkitAudioContext)();
let mainAnalyser = mainAudioContext.createAnalyser();
mainAnalyser.fftSize = 2048;

// Master gain node - controls speaker output without interrupting analyser feed
let masterGain = mainAudioContext.createGain();
masterGain.connect(mainAudioContext.destination);
let playerSoundMuted = false;

function updatePlayerMasterGain() {
    masterGain.gain.value = !playerSoundMuted && localStorage.getItem('global.sound') !== 'false' ? 1 : 0;
}

window.addEventListener('pekosoft:global-sound-change', updatePlayerMasterGain);

let bassFilter = mainAudioContext.createBiquadFilter();
bassFilter.type = 'lowshelf';
bassFilter.frequency.value = 180;
bassFilter.gain.value = 0;

let trebleFilter = mainAudioContext.createBiquadFilter();
trebleFilter.type = 'highshelf';
trebleFilter.frequency.value = 4000;
trebleFilter.gain.value = 0;

let stereoPanner = typeof mainAudioContext.createStereoPanner === 'function'
    ? mainAudioContext.createStereoPanner()
    : null;
if (stereoPanner) {
    stereoPanner.pan.value = 0;
}

function reconnectOutputChain() {
    try { mainAnalyser.disconnect(); } catch (error) { }
    try { bassFilter.disconnect(); } catch (error) { }
    try { trebleFilter.disconnect(); } catch (error) { }
    if (stereoPanner) {
        try { stereoPanner.disconnect(); } catch (error) { }
    }

    mainAnalyser.connect(bassFilter);
    bassFilter.connect(trebleFilter);

    if (stereoPanner) {
        trebleFilter.connect(stereoPanner);
        stereoPanner.connect(masterGain);
    } else {
        trebleFilter.connect(masterGain);
    }
}

reconnectOutputChain();

const playerKnobState = {
    bass: 0,
    treble: 0,
    balance: 0,
    speed: 100
};

function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function setKnobAngle(knob, value, min, max) {
    if (!knob) return;
    const ratio = (value - min) / Math.max(1e-9, (max - min));
    const angle = -135 + (Math.max(0, Math.min(1, ratio)) * 270);
    knob.style.setProperty('--knob-angle', `${angle}deg`);
}

function setBassValue(value, persist = true) {
        const next = Math.round(clampNumber(value, -12, 12));
        playerKnobState.bass = next;
        setKnobAngle(bassKnob, next, -12, 12);
        bassFilter.gain.setValueAtTime(next, mainAudioContext.currentTime);
        if (persist) localStorage.setItem(STORAGE.bass, String(next));
}

function setTrebleValue(value, persist = true) {
    const next = Math.round(clampNumber(value, -12, 12));
    playerKnobState.treble = next;
    setKnobAngle(trebleKnob, next, -12, 12);
    trebleFilter.gain.setValueAtTime(next, mainAudioContext.currentTime);
    if (persist) localStorage.setItem(STORAGE.treble, String(next));
}

function setBalanceValue(value, persist = true) {
    const next = Math.round(clampNumber(value, -100, 100));
    playerKnobState.balance = next;
    setKnobAngle(balanceKnob, next, -100, 100);
    if (stereoPanner) {
        stereoPanner.pan.setValueAtTime(next / 100, mainAudioContext.currentTime);
    }
    if (persist) localStorage.setItem(STORAGE.balance, String(next));
}

function setSpeedValue(value, persist = true) {
    const next = Math.round(clampNumber(value, 50, 150));
    playerKnobState.speed = next;
    setKnobAngle(speedKnob, next, 50, 150);
    audioPlayer.playbackRate = next / 100;
    if (persist) localStorage.setItem(STORAGE.speed, String(next));
}

function getStoredNumber(key, fallback) {
    const parsed = parseFloat(localStorage.getItem(key));
    return Number.isFinite(parsed) ? parsed : fallback;
}

function bindKnobControl(knob, handlers) {
    if (!knob) return;

    let dragStartY = 0;
    let dragStartValue = 0;
    let dragging = false;

    knob.addEventListener('wheel', (event) => {
        event.preventDefault();
        const direction = event.deltaY < 0 ? 1 : -1;
        handlers.nudge(direction);
    }, { passive: false });

    knob.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
            event.preventDefault();
            handlers.nudge(1);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
            event.preventDefault();
            handlers.nudge(-1);
        } else if (event.key === 'Home' && typeof handlers.home === 'function') {
            event.preventDefault();
            handlers.home();
        } else if (event.key === 'End' && typeof handlers.end === 'function') {
            event.preventDefault();
            handlers.end();
        }
    });

    knob.addEventListener('dblclick', (event) => {
        event.preventDefault();
        handlers.reset();
    });

    knob.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (typeof knob.focus === 'function') {
            knob.focus({ preventScroll: true });
        }
        dragging = true;
        dragStartY = event.clientY;
        dragStartValue = handlers.get();
        if (typeof knob.setPointerCapture === 'function') {
            knob.setPointerCapture(event.pointerId);
        }
    });

    knob.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        event.preventDefault();
        const deltaY = dragStartY - event.clientY;
        handlers.drag(dragStartValue, deltaY);
    });

    const endDrag = (event) => {
        if (!dragging) return;
        dragging = false;
        if (event && typeof knob.releasePointerCapture === 'function') {
            try {
                knob.releasePointerCapture(event.pointerId);
            } catch (error) { }
        }
    };

    knob.addEventListener('pointerup', endDrag);
    knob.addEventListener('pointercancel', endDrag);
}

function initPlayerKnobs() {
    setBassValue(getStoredNumber(STORAGE.bass, 0), false);
    setTrebleValue(getStoredNumber(STORAGE.treble, 0), false);
    setBalanceValue(getStoredNumber(STORAGE.balance, 0), false);
    setSpeedValue(getStoredNumber(STORAGE.speed, 100), false);

    bindKnobControl(bassKnob, {
        get: () => playerKnobState.bass,
        nudge: (direction) => setBassValue(playerKnobState.bass + direction, true),
        drag: (startValue, deltaY) => setBassValue(startValue + (deltaY * 0.08), true),
        home: () => setBassValue(-12, true),
        end: () => setBassValue(12, true),
        reset: () => setBassValue(0, true)
    });

    bindKnobControl(trebleKnob, {
        get: () => playerKnobState.treble,
        nudge: (direction) => setTrebleValue(playerKnobState.treble + direction, true),
        drag: (startValue, deltaY) => setTrebleValue(startValue + (deltaY * 0.08), true),
        home: () => setTrebleValue(-12, true),
        end: () => setTrebleValue(12, true),
        reset: () => setTrebleValue(0, true)
    });

    bindKnobControl(balanceKnob, {
        get: () => playerKnobState.balance,
        nudge: (direction) => setBalanceValue(playerKnobState.balance + (direction * 2), true),
        drag: (startValue, deltaY) => setBalanceValue(startValue + (deltaY * 0.5), true),
        home: () => setBalanceValue(-100, true),
        end: () => setBalanceValue(100, true),
        reset: () => setBalanceValue(0, true)
    });

    bindKnobControl(speedKnob, {
        get: () => playerKnobState.speed,
        nudge: (direction) => setSpeedValue(playerKnobState.speed + direction, true),
        drag: (startValue, deltaY) => setSpeedValue(startValue + (deltaY * 0.12), true),
        home: () => setSpeedValue(50, true),
        end: () => setSpeedValue(150, true),
        reset: () => setSpeedValue(100, true)
    });
}

let audioPlayerSource = null; // Persistent MediaElementSource
let channelSplitter = null;
let analyserLeft = null;
let analyserRight = null;
let loadedChannelCount = 1;
updateMetersSourceBridge();

// Canvas resizing

function resizePlayheadCanvas() {
    playheadCanvas.width = staticCanvas.width;
    playheadCanvas.height = staticCanvas.height;
}

function getTimelineZoomMode() {
    return localStorage.getItem(STORAGE.timelineZoom) === 'detail' ? 'detail' : 'fit';
}

function getTimelineWidth() {
    if (getTimelineZoomMode() === 'fit') {
        return Math.max(1, Math.floor(timelineScroll?.clientWidth || 0));
    }

    return PLAYER_TIMELINE_DETAIL_WIDTH;
}

function syncTimelineScrollPosition() {
    if (!timelineScroll) return;

    if (getTimelineZoomMode() === 'fit') {
        timelineScroll.scrollLeft = 0;
        return;
    }

    if (!loadedAudioBuffer || !Number.isFinite(loadedAudioBuffer.duration) || loadedAudioBuffer.duration <= 0) {
        timelineScroll.scrollLeft = 0;
        return;
    }

    const ratio = Math.max(0, Math.min(1, (audioPlayer.currentTime || 0) / loadedAudioBuffer.duration));
    const maxScroll = Math.max(0, timelineScroll.scrollWidth - timelineScroll.clientWidth);
    timelineScroll.scrollLeft = ratio * maxScroll;
}

function updateTimelineZoomButtonState() {
    if (!timelineZoomButton) return;
    timelineZoomButton.classList.toggle('button-on', getTimelineZoomMode() === 'fit');
}

function updateTimelineRulerVisibility() {
    if (!timelineRulerCanvas) return;
    timelineRulerCanvas.style.display = showTimelineRuler ? 'block' : 'none';
}

function updateBpmRulerVisibility() {
    if (!bpmRulerCanvas) return;
    bpmRulerCanvas.style.display = showBpmRuler ? 'block' : 'none';
}

function applyTimelineZoom() {
    const timelineWidth = getTimelineWidth();
    const widthPx = `${timelineWidth}px`;
    const isFitMode = getTimelineZoomMode() === 'fit';

    if (playerTimeline) {
        playerTimeline.style.width = widthPx;
        playerTimeline.style.minWidth = isFitMode ? '0px' : '1024px';
    }

    if (waveformOverlay) {
        waveformOverlay.style.width = widthPx;
    }

    if (timelineRulerCanvas) {
        timelineRulerCanvas.style.width = widthPx;
    }

    if (bpmRulerCanvas) {
        bpmRulerCanvas.style.width = widthPx;
    }

    staticCanvas.style.width = widthPx;
    playheadCanvas.style.width = widthPx;

    updateTimelineZoomButtonState();
}

function resizeCanvas(canvasElement) {
    const rect = canvasElement.getBoundingClientRect();
    if (canvasElement.width !== rect.width || canvasElement.height !== rect.height) {
        canvasElement.width = rect.width;
        canvasElement.height = rect.height;
    }
}

function resizeAllCanvases() {
    applyTimelineZoom();
    updateTimelineRulerVisibility();
    updateBpmRulerVisibility();
    if (showTimelineRuler && timelineRulerCanvas) {
        resizeCanvas(timelineRulerCanvas);
    }
    if (showBpmRuler && bpmRulerCanvas) {
        resizeCanvas(bpmRulerCanvas);
    }
    resizeCanvas(staticCanvas);
    resizePlayheadCanvas();
    // Only resize the visible meter canvas (hidden canvases return 0 from getBoundingClientRect)
    const activeMeter = document.querySelector('.meter-canvas.active');

    if (activeMeter) resizeCanvas(activeMeter);

    waveformCacheDirty = true;

    // Canvas resize clears pixels; always redraw timeline layers, even when no audio is loaded.
    redrawTimelineCanvas();

    if (loadedAudioBuffer) {
        drawPlayhead(); // restore playhead after resize
    }

    syncTimelineScrollPosition();
}

let timelineResizeRafId = null;

function scheduleTimelineResize() {
    if (timelineResizeRafId !== null) {
        cancelAnimationFrame(timelineResizeRafId);
    }

    timelineResizeRafId = requestAnimationFrame(() => {
        timelineResizeRafId = null;
        resizeAllCanvases();
        updateTimeFieldBars();
    });
}

function observeTimelineContainerState() {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                scheduleTimelineResize();
                break;
            }
        }
    });

    observer.observe(timelineContainer, {
        attributes: true,
        attributeFilter: ['class']
    });
}

function renderPanel() {
    if (!panelTextElement) return;

    if (localStorage.getItem(STORAGE.panelSource) === 'input') {
        panelTextElement.value = [
            `Sample rate: ${panelState.input.sampleRate}`,
            `Channels: ${panelState.input.channels}`,
            `Latency: ${panelState.input.latency}`,
            `Device: ${panelState.input.device}`
        ].join('\n');
        return;
    }

    if (localStorage.getItem(STORAGE.panelSource) === 'playlist') {
        if (playlist.length === 0) {
            panelTextElement.value = 'Playlist is empty.';
            return;
        }
        panelTextElement.value = playlist.map((item, i) =>
            `${i + 1}. ${item.name}`
        ).join('\n');
        return;
    }

    panelTextElement.value = [
        `File name: ${panelState.meta.fileName}`,
        `File size: ${panelState.meta.fileSize}`,
        `Duration: ${panelState.meta.duration}`,
        `Sample rate: ${panelState.meta.sampleRate}`,
        `Channels: ${panelState.meta.channels}`,
        `Format: ${panelState.meta.format}`,
        '',
        `Analysis updated: ${panelState.meta.analysisUpdated}`,
        `Digital peak: ${panelState.meta.digitalPeak}`,
        `True peak (estimated): ${panelState.meta.truePeak}`,
        `RMS level: ${panelState.meta.loudnessRms}`,
        `LUFS (estimated): ${panelState.meta.lufsEstimate}`,
        `L/R difference: ${panelState.meta.lrDiff}`,
        `Phase difference: ${panelState.meta.phaseDiff}`,
        `Average pitch (estimated): ${panelState.meta.averagePitch}`,
        `DC offset: ${panelState.meta.dcOffset}`
    ].join('\n');
}

if (panelMetaButton) {
    panelMetaButton.addEventListener('click', () => {
        localStorage.setItem(STORAGE.panelSource, 'meta');
        updatePanelButtonStates();
        renderPanel();
    });
}
if (panelInputButton) {
    panelInputButton.addEventListener('click', () => {
        localStorage.setItem(STORAGE.panelSource, 'input');
        updatePanelButtonStates();
        updateAudioInfo();
        renderPanel();
    });
}
if (panelPlaylistButton) {
    panelPlaylistButton.addEventListener('click', () => {
        localStorage.setItem(STORAGE.panelSource, 'playlist');
        updatePanelButtonStates();
        renderPanel();
    });
}

function showActiveMeter() {
    return;
}

function applySavedPanelSource() {
    const saved = localStorage.getItem(STORAGE.panelSource);
    if (saved !== 'input' && saved !== 'playlist') localStorage.setItem(STORAGE.panelSource, 'meta');
    updatePanelButtonStates();
}

function updatePanelButtonStates() {
    const saved = localStorage.getItem(STORAGE.panelSource);
    if (panelMetaButton) panelMetaButton.classList.toggle('button-on', saved === 'meta');
    if (panelInputButton) panelInputButton.classList.toggle('button-on', saved === 'input');
    if (panelPlaylistButton) panelPlaylistButton.classList.toggle('button-on', saved === 'playlist');
}

function applySavedToolMeter() {
    return;
}

function updateToolMeterButtonStates() {
    const saved = localStorage.getItem(STORAGE.toolMeter) || 'spectroscope';
    if (toolSpectroscopeButton) toolSpectroscopeButton.classList.toggle('button-on', saved === 'spectroscope');
    if (toolSpectrogramButton) toolSpectrogramButton.classList.toggle('button-on', saved === 'spectrogram');
    if (toolLevelButton) toolLevelButton.classList.toggle('button-on', saved === 'level');
    if (toolOscilloscopeButton) toolOscilloscopeButton.classList.toggle('button-on', saved === 'oscilloscope');
    if (toolGuidesButton) toolGuidesButton.classList.toggle('button-on', showToolGuides);
}

function applySavedToolGuides() {
    return;
}

function connectSourceToMeters(sourceNode) {
    if (!sourceNode) return;
    sourceNode.connect(mainAnalyser);
    if (channelSplitter) sourceNode.connect(channelSplitter);
}

function connectSourceToChannelSplitter(sourceNode) {
    if (!sourceNode || !channelSplitter) return;
    sourceNode.connect(channelSplitter);
}

function disconnectSourceFromChannelSplitter(sourceNode) {
    if (!sourceNode || !channelSplitter) return;
    try {
        sourceNode.disconnect(channelSplitter);
    } catch (error) { }
}

function disconnectSourceFromMeters(sourceNode) {
    if (!sourceNode) return;
    try {
        sourceNode.disconnect();
    } catch (error) {
        console.warn('Error disconnecting source from meters:', error);
    }
}

function restoreMeterChannelCount() {
    if (recordingSource) {
        loadedChannelCount = Math.max(1, recordingSource.channelCount || 1);
        return;
    }
    if (inputSource) {
        loadedChannelCount = Math.max(1, inputSource.channelCount || 1);
        return;
    }
    if (loadedAudioBuffer) {
        loadedChannelCount = loadedAudioBuffer.numberOfChannels;
        return;
    }
    loadedChannelCount = 1;
}

function syncVisualFreeze() {
    const isPlaying = !audioPlayer.paused && !audioPlayer.ended && Boolean(audioPlayer.currentSrc);
    const isRecording = Boolean(mediaRecorder && mediaRecorder.state === 'recording');
    const hasLiveInput = Boolean(inputSource || recordingSource);
    freezeVisuals = !(isPlaying || isRecording || hasLiveInput);
}

async function setInputMonitoringEnabled(enabled) {
    if (!enabled) {
        if (inputSource) {
            disconnectSourceFromMeters(inputSource);
            inputSource = null;
        }
        if (inputStream) { inputStream.getTracks().forEach(track => track.stop()); inputStream = null; }
        toggleInput.classList.remove('button-on');
        localStorage.setItem(STORAGE.inputMonitor, 'false');
        restoreMeterChannelCount();
        syncVisualFreeze();
        return;
    }

    if (toggleInput.classList.contains('button-on')) {
        localStorage.setItem(STORAGE.inputMonitor, 'true');
        return;
    }

    try {
        if (mainAudioContext.state === 'suspended') {
            await mainAudioContext.resume();
        }
        inputStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                channelCount: { ideal: 2 }
            }
        });
        inputSource = mainAudioContext.createMediaStreamSource(inputStream);
        connectSourceToMeters(inputSource);
        loadedChannelCount = Math.max(1, inputSource.channelCount || 1);
        recreateChannelSplitter(loadedChannelCount);
        toggleInput.classList.add('button-on');
        localStorage.setItem(STORAGE.inputMonitor, 'true');
        syncVisualFreeze();
    } catch (err) {
        toggleInput.classList.remove('button-on');
        localStorage.setItem(STORAGE.inputMonitor, 'false');
        syncVisualFreeze();
        console.error('Error enabling input monitoring:', err);
    }
}

function clampVolumePercent(value) {
    return Math.max(0, Math.min(100, Math.round(parseFloat(value) || 0)));
}

function setPlayerVolumePercent(value, persist = true) {
    const percent = clampVolumePercent(value);
    volumeSlider.value = String(percent);
    audioPlayer.volume = percent / 100;
    if (persist) {
        localStorage.setItem(STORAGE.volume, String(percent));
    }
}

function getStoredVolumePercent() {
    const savedVolume = parseFloat(localStorage.getItem(STORAGE.volume));
    if (!Number.isFinite(savedVolume)) {
        return 100;
    }
    // Migrate older 0-1 stored values to sitewide 0-100 controls.
    return savedVolume <= 1 ? savedVolume * 100 : savedVolume;
}

function normalizeResponseMode(value) {
    return value === 'fade' ? value : 'instant';
}

function getSelectedResponseMode() {
    return normalizeResponseMode(responseSelect?.value || localStorage.getItem(STORAGE.response));
}

function getTargetPlaybackRate() {
    const speed = Number.isFinite(playerKnobState.speed) ? playerKnobState.speed : 100;
    return Math.max(0.05, speed / 100);
}

function getTargetVolumeLevel() {
    return clampVolumePercent(volumeSlider?.value || 100) / 100;
}

function cancelResponseAnimation(resetToTargets = false) {
    responseAnimationToken++;
    if (responseAnimationFrameId !== null) {
        cancelAnimationFrame(responseAnimationFrameId);
        responseAnimationFrameId = null;
    }

    if (resetToTargets) {
        audioPlayer.volume = getTargetVolumeLevel();
        audioPlayer.playbackRate = getTargetPlaybackRate();
    }
}

function runResponseAnimation(durationMs, onStep) {
    const token = ++responseAnimationToken;

    return new Promise((resolve) => {
        const startTime = performance.now();

        const step = (now) => {
            if (token !== responseAnimationToken) {
                responseAnimationFrameId = null;
                resolve(false);
                return;
            }

            const ratio = durationMs <= 0
                ? 1
                : Math.max(0, Math.min(1, (now - startTime) / durationMs));
            onStep(ratio);

            if (ratio >= 1) {
                responseAnimationFrameId = null;
                resolve(true);
                return;
            }

            responseAnimationFrameId = requestAnimationFrame(step);
        };

        responseAnimationFrameId = requestAnimationFrame(step);
    });
}

async function startPlaybackWithResponse() {
    updateMetersSourceBridge();

    if (mainAudioContext.state === 'suspended') {
        await mainAudioContext.resume();
    }

    const responseMode = getSelectedResponseMode();
    const targetVolume = getTargetVolumeLevel();
    const targetRate = getTargetPlaybackRate();
    const curveMode = getSelectedFadeCurve();

    cancelResponseAnimation(false);

    if (responseMode === 'instant') {
        audioPlayer.volume = targetVolume;
        audioPlayer.playbackRate = targetRate;
        await audioPlayer.play();
        return;
    }

    if (responseMode === 'fade') {
        audioPlayer.playbackRate = targetRate;
        audioPlayer.volume = 0;
        await audioPlayer.play();

        await runResponseAnimation(3000, (ratio) => {
            audioPlayer.volume = targetVolume * getCurveRatio(ratio, curveMode);
        });

        audioPlayer.volume = targetVolume;
        audioPlayer.playbackRate = targetRate;
        return;
    }
}

async function pausePlaybackWithResponse() {
    const targetVolume = getTargetVolumeLevel();
    const targetRate = getTargetPlaybackRate();
    const responseMode = getSelectedResponseMode();
    const curveMode = getSelectedFadeCurve();

    if (!hasLoadedAudioSource() || audioPlayer.paused || responseMode === 'instant') {
        cancelResponseAnimation(false);
        audioPlayer.pause();
        audioPlayer.volume = targetVolume;
        audioPlayer.playbackRate = targetRate;
        playButton.classList.remove('button-on');
        syncVisualFreeze();
        return;
    }

    cancelResponseAnimation(false);

    if (responseMode === 'fade') {
        const startVolume = Math.max(0, Math.min(1, audioPlayer.volume));
        await runResponseAnimation(3000, (ratio) => {
            audioPlayer.volume = startVolume * getCurveRatio(1 - ratio, curveMode);
        });
        audioPlayer.pause();
        audioPlayer.volume = targetVolume;
        audioPlayer.playbackRate = targetRate;
        playButton.classList.remove('button-on');
        syncVisualFreeze();
        return;
    }
}

async function stopPlaybackWithResponse() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
    }

    const targetVolume = getTargetVolumeLevel();
    const targetRate = getTargetPlaybackRate();
    const responseMode = getSelectedResponseMode();
    const curveMode = getSelectedFadeCurve();

    const finalizeStop = () => {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.volume = targetVolume;
        audioPlayer.playbackRate = targetRate;
        playheadCtx.clearRect(0, 0, playheadCanvas.width, playheadCanvas.height);
        playButton.classList.remove('button-on');
        stopTimer();
        setRemainingDisplay(audioPlayer.duration || 0);
        updateTimeFieldBars();

        syncVisualFreeze();
        if (freezeVisuals) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            volumeCtx.clearRect(0, 0, volumeCanvas.width, volumeCanvas.height);
            freqCtx.clearRect(0, 0, freqCanvas.width, freqCanvas.height);
        }
        updateActionButtonStates();
    };

    if (!hasLoadedAudioSource() || audioPlayer.paused || audioPlayer.ended || responseMode === 'instant') {
        cancelResponseAnimation(false);
        finalizeStop();
        return;
    }

    cancelResponseAnimation(false);

    if (responseMode === 'fade') {
        const startVolume = Math.max(0, Math.min(1, audioPlayer.volume));
        await runResponseAnimation(3000, (ratio) => {
            audioPlayer.volume = startVolume * getCurveRatio(1 - ratio, curveMode);
        });
        finalizeStop();
        return;
    }
}

function adjustSeek(deltaSeconds) {
    const nextTime = Math.max(0, Math.min(audioPlayer.duration || 0, (audioPlayer.currentTime || 0) + deltaSeconds));
    progressSlider.value = String(nextTime);
    audioPlayer.currentTime = nextTime;
    updateTimeFieldBars();
}

function seekToTimelineRatio(ratio, shouldSnapToBeat = false) {
    const duration = audioPlayer.duration || loadedAudioBuffer?.duration || 0;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const rawTime = clampedRatio * duration;
    const nextTime = shouldSnapToBeat ? snapSecondsToBeat(rawTime, duration) : rawTime;
    progressSlider.max = duration;
    progressSlider.value = String(nextTime);
    audioPlayer.currentTime = nextTime;
    updateTimeFieldBars();
    setRemainingDisplay(duration - nextTime);
    drawPlayhead();
    syncTimelineScrollPosition();
}

function handleRulerSeek(event, rulerCanvas, shouldSnapToBeat = false) {
    if (!rulerCanvas) return;

    const rect = rulerCanvas.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;

    const ratio = (event.clientX - rect.left) / rect.width;
    seekToTimelineRatio(ratio, shouldSnapToBeat);
}

function adjustVolume(deltaPercent) {
    setPlayerVolumePercent((parseFloat(volumeSlider.value) || 0) + deltaPercent);
}

let seekBackwardInterval = null;
let seekForwardInterval = null;
let volumeDownInterval = null;
let volumeUpInterval = null;

function startHold(action, intervalRefName) {
    action();
    window[intervalRefName] = setInterval(action, 100);
}

function stopHold(intervalRefName) {
    clearInterval(window[intervalRefName]);
    window[intervalRefName] = null;
}

function bindHoldAction(element, startFn, stopFn) {
    if (!element) return;
    let activePointerId = null;

    const stop = (event) => {
        if (activePointerId === null) return;
        if (event && event.pointerId !== activePointerId) return;
        if (event && typeof element.releasePointerCapture === 'function') {
            try {
                element.releasePointerCapture(activePointerId);
            } catch (_) {}
        }
        activePointerId = null;
        stopFn();
    };

    element.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        activePointerId = event.pointerId;
        if (typeof element.setPointerCapture === 'function') {
            try {
                element.setPointerCapture(activePointerId);
            } catch (_) {}
        }
        startFn();
    });

    element.addEventListener('pointerup', stop);
    element.addEventListener('pointercancel', stop);
}

function bindKeyboardAction(element, actionFn) {
    if (!element) return;
    element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            actionFn();
        }
    });
}

function bindWaveformSelection() {
    if (!staticCanvas) return;

    staticCanvas.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        const pointerTime = getWaveformPointerTime(event);
        if (!Number.isFinite(pointerTime)) return;
        const pointerX = getWaveformPointerX(event);

        event.preventDefault();
        isWaveformSelecting = true;

        const edge = Number.isFinite(pointerX) ? getSelectionEdgeAtX(pointerX, event.pointerType || 'mouse') : null;
        waveformSelectionMode = edge || 'new';

        if (waveformSelectionMode === 'new') {
            selectionAnchorTime = pointerTime;
            setWaveformSelection(pointerTime, pointerTime);
        }

        if (typeof staticCanvas.setPointerCapture === 'function') {
            try {
                staticCanvas.setPointerCapture(event.pointerId);
            } catch (error) {
                console.warn('Could not capture waveform pointer:', error);
            }
        }
    });

    staticCanvas.addEventListener('pointermove', (event) => {
        if (!isWaveformSelecting) {
            updateWaveformSelectionCursor(event);
            return;
        }

        const pointerTime = getWaveformPointerTime(event);
        if (!Number.isFinite(pointerTime)) return;

        if (waveformSelectionMode === 'start') {
            const currentEnd = Math.max(selectionStartTime, selectionEndTime);
            setWaveformSelection(pointerTime, currentEnd);
            return;
        }

        if (waveformSelectionMode === 'end') {
            const currentStart = Math.min(selectionStartTime, selectionEndTime);
            setWaveformSelection(currentStart, pointerTime);
            return;
        }

        setWaveformSelection(selectionAnchorTime, pointerTime);
    });

    staticCanvas.addEventListener('pointerup', (event) => {
        if (!isWaveformSelecting) return;
        isWaveformSelecting = false;
        waveformSelectionMode = null;

        if (typeof staticCanvas.releasePointerCapture === 'function') {
            try {
                staticCanvas.releasePointerCapture(event.pointerId);
            } catch (error) {
                console.warn('Could not release waveform pointer:', error);
            }
        }

        if (!hasActiveSelection()) {
            clearWaveformSelection();
        }

        updateWaveformSelectionCursor(event);
    });

    staticCanvas.addEventListener('pointercancel', (event) => {
        isWaveformSelecting = false;
        waveformSelectionMode = null;
        if (!hasActiveSelection()) {
            clearWaveformSelection();
        }

        updateWaveformSelectionCursor(event);
    });

    staticCanvas.addEventListener('pointerleave', () => {
        if (!isWaveformSelecting) {
            updateWaveformSelectionCursor();
        }
    });
}

function bindWaveformEditControls() {
    if (fadeCurveSelect) {
        const savedCurve = localStorage.getItem(STORAGE.fadeCurve);
        if (savedCurve === 'linear' || savedCurve === 'exponential' || savedCurve === 'logarithmic' || savedCurve === 'sinusoid') {
            fadeCurveSelect.value = savedCurve;
        } else {
            fadeCurveSelect.value = 'sinusoid';
        }

        fadeCurveSelect.addEventListener('change', () => {
            localStorage.setItem(STORAGE.fadeCurve, getSelectedFadeCurve());
        });
    }

    if (responseSelect) {
        const savedResponse = normalizeResponseMode(localStorage.getItem(STORAGE.response));
        responseSelect.value = savedResponse;
        if (!localStorage.getItem(STORAGE.response)) {
            localStorage.setItem(STORAGE.response, 'instant');
        }

        responseSelect.addEventListener('change', () => {
            const mode = normalizeResponseMode(responseSelect.value);
            responseSelect.value = mode;
            localStorage.setItem(STORAGE.response, mode);
        });
    }

    if (selectAllButton) {
        selectAllButton.addEventListener('click', () => {
            selectAllWaveform();
        });
    }

    if (selectNoneButton) {
        selectNoneButton.addEventListener('click', () => {
            clearWaveformSelection();
        });
    }

    if (fadeInButton) {
        fadeInButton.addEventListener('click', async () => {
            await applyFadeToBuffer('in');
        });
    }

    if (fadeOutButton) {
        fadeOutButton.addEventListener('click', async () => {
            await applyFadeToBuffer('out');
        });
    }

    if (normalizeButton) {
        normalizeButton.addEventListener('click', async () => {
            await normalizeBufferToZeroDb();
        });
    }

    if (reverseButton) {
        reverseButton.addEventListener('click', async () => {
            await reverseBufferRange();
        });
    }

    if (cutButton) {
        cutButton.addEventListener('click', async () => {
            await cutBufferRange();
        });
    }

    if (pasteButton) {
        pasteButton.addEventListener('click', async () => {
            await pasteClipboardBuffer();
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            await deleteBufferRange();
        });
    }

    if (undoButton) {
        undoButton.addEventListener('click', async () => {
            await undoWaveformEdit();
        });
    }

    if (redoButton) {
        redoButton.addEventListener('click', async () => {
            await redoWaveformEdit();
        });
    }
}

window.addEventListener('load', () => {
    bindWaveformSelection();
    bindWaveformEditControls();
    setBpmValue(bpmValue, false);
    if (snapNoteSelect) {
        snapNoteSelect.value = normalizeSnapNoteValue(snapNoteValue);
    }

    if (!localStorage.getItem(STORAGE.timelineZoom)) {
        localStorage.setItem(STORAGE.timelineZoom, 'fit');
    }

    resizeAllCanvases();
    connectAudioElement(audioPlayer);   // connect once
    applySavedPanelSource();
    initPlayerKnobs();

    setPlayerVolumePercent(getStoredVolumePercent(), false);

    loopEnabled = localStorage.getItem(STORAGE.loop) === 'true';
    updateLoopPlaybackMode();

    const savedMuted = localStorage.getItem(STORAGE.sound) === 'true';
    playerSoundMuted = savedMuted;
    updatePlayerMasterGain();
    toggleSound.classList.toggle('button-on', !savedMuted);

    renderPanel();
    updateTimeFieldBars();
    syncVisualFreeze();

    if (guidesButton) {
        guidesButton.classList.toggle('button-on', showGuides);
    }
    if (timelineRulerButton) {
        timelineRulerButton.classList.toggle('button-on', showTimelineRuler);
    }
    updateBpmRulerButtonState();
    updateSnapButtonState();
    if (timelinePanButton) {
        timelinePanButton.classList.toggle('button-on', showPanLine);
    }
    updateWaveformColorButtonState();
    updateTimelineRulerVisibility();
    updateBpmRulerVisibility();
    updateTimelineZoomButtonState();
    redrawTimelineCanvas();
    updateActionButtonStates();
    observeTimelineContainerState();
});

window.addEventListener('resize', () => {
    resizeAllCanvases();
    updateTimeFieldBars();
});

// Audio input device selection
navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        audioInput.innerHTML = '';
        devices.filter(d => d.kind === 'audioinput').forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Input ${audioInput.length + 1}`;
            audioInput.appendChild(option);
        });
        const savedInput = localStorage.getItem(STORAGE.input);
        selectedDeviceId = savedInput || audioInput.value;
        if (savedInput) audioInput.value = savedInput;

        if (localStorage.getItem(STORAGE.inputMonitor) === 'true') {
            setInputMonitoringEnabled(true);
        }
    })
    .catch(error => console.error('Error enumerating devices:', error));

audioInput.addEventListener('change', () => {
    selectedDeviceId = audioInput.value;
    localStorage.setItem(STORAGE.input, selectedDeviceId);
    updateAudioInfo();
});

// Player controls
ejectButton.addEventListener('click', () => audioFileInput.click());

playButton.addEventListener('click', async () => {
    if (audioPlayer.paused || audioPlayer.ended) {
        const duration = audioPlayer.duration || 0;
        if (duration > 0 && (audioPlayer.ended || audioPlayer.currentTime >= duration)) {
            audioPlayer.currentTime = 0;
        }
        try {
            await startPlaybackWithResponse();
        } catch (error) {
            if (error?.name !== 'AbortError') throw error;
        }
        playButton.classList.toggle('button-on', !audioPlayer.paused && !audioPlayer.ended);
    } else {
        await pausePlaybackWithResponse();
    }
    syncVisualFreeze();
    updateActionButtonStates();
});

function getAdjacentPlayableIndex(direction) {
    if (playlist.length === 0) return -1;

    let index = currentPlaylistIndex;
    if (index < 0) {
        index = direction > 0 ? -1 : playlist.length;
    }

    for (let tries = 0; tries < playlist.length; tries++) {
        index = (index + direction + playlist.length) % playlist.length;
        if (playlist[index]?.file) return index;
    }

    return -1;
}

function playPreviousPlaylistItem() {
    const index = getAdjacentPlayableIndex(-1);
    if (index < 0) return;
    playPlaylistItem(index);
}

function playNextPlaylistItem() {
    const index = getAdjacentPlayableIndex(1);
    if (index < 0) return;
    playPlaylistItem(index);
}

if (prevButton) {
    prevButton.addEventListener('click', playPreviousPlaylistItem);
}

if (nextButton) {
    nextButton.addEventListener('click', playNextPlaylistItem);
}

stopButton.addEventListener('click', async () => {
    await stopPlaybackWithResponse();
});

// Progress and seek
audioPlayer.addEventListener('timeupdate', () => {
    progressSlider.max = audioPlayer.duration || 0;
    progressSlider.value = audioPlayer.currentTime || 0;
    setDurationDisplay(audioPlayer.duration || 0);

    applySelectionLoopIfNeeded();

    // Clean playback timer
    const ms = Math.floor(audioPlayer.currentTime * 1000);
    setPlayerTimerText(formatTime(ms));

    updateTimeFieldBars();
    // Remaining time
    const remaining = (audioPlayer.duration || 0) - (audioPlayer.currentTime || 0);
    setRemainingDisplay(remaining);
    updateActionButtonStates();
});

audioPlayer.addEventListener('loadedmetadata', () => {
    setDurationDisplay(audioPlayer.duration || 0);
    updateActionButtonStates();
});

audioPlayer.addEventListener('ended', async () => {
    if (loopEnabled) {
        const loopSelection = getSelectionLoopBounds();
        if (loopSelection) {
            audioPlayer.currentTime = loopSelection.start;
            try {
                await audioPlayer.play();
                playButton.classList.add('button-on');
            } catch (error) {
                console.warn('Selection loop resume failed:', error);
            }
            syncVisualFreeze();
            updateActionButtonStates();
            return;
        }
    }

    playButton.classList.remove('button-on');
    syncVisualFreeze();
    updateActionButtonStates();
});

progressSlider.addEventListener('input', () => {
    audioPlayer.currentTime = progressSlider.value;
    updateTimeFieldBars();
    updateActionButtonStates();
});

// Volume controls
volumeSlider.addEventListener('input', () => {
    setPlayerVolumePercent(volumeSlider.value);
});

bindHoldAction(seekBackward, () => startHold(() => adjustSeek(-0.5), 'seekBackwardInterval'), () => stopHold('seekBackwardInterval'));
bindHoldAction(seekForward, () => startHold(() => adjustSeek(0.5), 'seekForwardInterval'), () => stopHold('seekForwardInterval'));
bindHoldAction(volumeDecreaseButton, () => startHold(() => adjustVolume(-5), 'volumeDownInterval'), () => stopHold('volumeDownInterval'));
bindHoldAction(volumeIncreaseButton, () => startHold(() => adjustVolume(5), 'volumeUpInterval'), () => stopHold('volumeUpInterval'));

bindKeyboardAction(seekBackward, () => adjustSeek(-0.5));
bindKeyboardAction(seekForward, () => adjustSeek(0.5));
bindKeyboardAction(volumeDecreaseButton, () => adjustVolume(-5));
bindKeyboardAction(volumeIncreaseButton, () => adjustVolume(5));

// Toggle loop
toggleLoop.addEventListener('click', () => {
    loopEnabled = !loopEnabled;
    localStorage.setItem(STORAGE.loop, loopEnabled ? 'true' : 'false');
    updateLoopPlaybackMode();
});

// Toggle sound (master output only; meters keep running)
toggleSound.addEventListener('click', () => {
    playerSoundMuted = !playerSoundMuted;
    if (mainAudioContext && mainAudioContext.state === 'suspended') {
        mainAudioContext.resume().catch(() => {
            // Resume is best-effort; the next gesture can retry.
        });
    }
    updatePlayerMasterGain();
    localStorage.setItem(STORAGE.sound, playerSoundMuted);
    toggleSound.classList.toggle('button-on', !playerSoundMuted);
});

if (copyButton) {
    copyButton.addEventListener('click', () => {
        const panelData = panelTextElement ? panelTextElement.value.trim() : '';
        if (!panelData) return;
        navigator.clipboard.writeText(panelData);
    });
}
if (guidesButton) {
    guidesButton.addEventListener('click', () => {
        showGuides = !showGuides;
        guidesButton.classList.toggle('button-on', showGuides);
        localStorage.setItem(STORAGE.showGuides, showGuides ? 'true' : 'false');
        redrawTimelineCanvas();
        drawPlayhead();
    });
}

if (timelineZoomButton) {
    timelineZoomButton.addEventListener('click', () => {
        const nextMode = getTimelineZoomMode() === 'fit' ? 'detail' : 'fit';
        localStorage.setItem(STORAGE.timelineZoom, nextMode);
        resizeAllCanvases();
    });
}

if (timelineRulerButton) {
    timelineRulerButton.addEventListener('click', () => {
        showTimelineRuler = !showTimelineRuler;
        timelineRulerButton.classList.toggle('button-on', showTimelineRuler);
        localStorage.setItem(STORAGE.timelineRuler, showTimelineRuler ? 'true' : 'false');
        resizeAllCanvases();
    });
}

if (bpmRulerButton) {
    bpmRulerButton.addEventListener('click', () => {
        showBpmRuler = !showBpmRuler;
        updateBpmRulerButtonState();
        localStorage.setItem(STORAGE.bpmRuler, showBpmRuler ? 'true' : 'false');
        resizeAllCanvases();
    });
}

if (snapButton) {
    snapButton.addEventListener('click', () => {
        snapToBeat = !snapToBeat;
        updateSnapButtonState();
        localStorage.setItem(STORAGE.snap, snapToBeat ? 'true' : 'false');
    });
}

if (timelinePanButton) {
    timelinePanButton.addEventListener('click', () => {
        showPanLine = !showPanLine;
        timelinePanButton.classList.toggle('button-on', showPanLine);
        localStorage.setItem(STORAGE.timelinePan, showPanLine ? 'true' : 'false');
        redrawTimelineCanvas();
        drawPlayhead();
    });
}

if (waveformColorButton) {
    waveformColorButton.addEventListener('click', () => {
        showWaveformMultiColor = !showWaveformMultiColor;
        localStorage.setItem(STORAGE.waveformMultiColor, showWaveformMultiColor ? 'true' : 'false');
        updateWaveformColorButtonState();
        waveformCacheDirty = true;
        redrawTimelineCanvas();
    });
}

if (bpmInput) {
    bpmInput.addEventListener('change', () => {
        setBpmValue(bpmInput.value);
    });

    bpmInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            setBpmValue(bpmInput.value);
        }
    });
}

if (snapNoteSelect) {
    snapNoteSelect.addEventListener('change', () => {
        snapNoteValue = normalizeSnapNoteValue(snapNoteSelect.value);
        snapNoteSelect.value = snapNoteValue;
        localStorage.setItem(STORAGE.snapNote, snapNoteValue);

        if (hasActiveSelection()) {
            setWaveformSelection(selectionStartTime, selectionEndTime);
        }
    });
}

if (timelineRulerCanvas) {
    timelineRulerCanvas.addEventListener('pointerdown', (event) => {
        handleRulerSeek(event, timelineRulerCanvas, false);
    });
}

if (bpmRulerCanvas) {
    bpmRulerCanvas.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;

        const pointerX = getCanvasPointerX(event, bpmRulerCanvas);
        const pointerTime = getCanvasPointerTime(event, bpmRulerCanvas, true);
        const bounds = getSelectionPixelBoundsForWidth(bpmRulerCanvas.width);

        if (!Number.isFinite(pointerX) || !Number.isFinite(pointerTime) || !bounds || pointerX < bounds.x1 || pointerX > bounds.x2) {
            handleRulerSeek(event, bpmRulerCanvas, true);
            return;
        }

        event.preventDefault();

        const selectionStart = Math.min(selectionStartTime, selectionEndTime);
        isBpmRulerSelectionDragging = true;
        bpmRulerSelectionOffsetSeconds = pointerTime - selectionStart;
        updateBpmRulerSelectionCursor(event);

        if (typeof bpmRulerCanvas.setPointerCapture === 'function') {
            try {
                bpmRulerCanvas.setPointerCapture(event.pointerId);
            } catch (error) {
                console.warn('Could not capture BPM ruler pointer:', error);
            }
        }
    });

    bpmRulerCanvas.addEventListener('pointermove', (event) => {
        if (!isBpmRulerSelectionDragging) {
            updateBpmRulerSelectionCursor(event);
            return;
        }

        const pointerTime = getCanvasPointerTime(event, bpmRulerCanvas, true);
        if (!Number.isFinite(pointerTime) || !hasActiveSelection() || !loadedAudioBuffer) return;

        const duration = loadedAudioBuffer.duration;
        const selectionStart = Math.min(selectionStartTime, selectionEndTime);
        const selectionEnd = Math.max(selectionStartTime, selectionEndTime);
        const span = Math.max(0, selectionEnd - selectionStart);
        const maxStart = Math.max(0, duration - span);
        const nextStart = Math.max(0, Math.min(maxStart, pointerTime - bpmRulerSelectionOffsetSeconds));

        setWaveformSelection(nextStart, nextStart + span);
    });

    bpmRulerCanvas.addEventListener('pointerup', (event) => {
        if (!isBpmRulerSelectionDragging) return;

        isBpmRulerSelectionDragging = false;
        bpmRulerSelectionOffsetSeconds = 0;
        if (typeof bpmRulerCanvas.releasePointerCapture === 'function') {
            try {
                bpmRulerCanvas.releasePointerCapture(event.pointerId);
            } catch (error) {
                console.warn('Could not release BPM ruler pointer:', error);
            }
        }

        updateBpmRulerSelectionCursor(event);
    });

    bpmRulerCanvas.addEventListener('pointercancel', (event) => {
        isBpmRulerSelectionDragging = false;
        bpmRulerSelectionOffsetSeconds = 0;
        updateBpmRulerSelectionCursor(event);
    });

    bpmRulerCanvas.addEventListener('pointerleave', () => {
        if (!isBpmRulerSelectionDragging) {
            updateBpmRulerSelectionCursor();
        }
    });
}

const barsToggle = document.getElementById('toggle-bars');
if (barsToggle) {
    barsToggle.addEventListener('change', () => {
        updateTimeFieldBars();
    });
}

// Reset button
resetButton.addEventListener('click', () => {
    // Clear all current-tool keys (settings + session data) without touching sitewide state.
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('player.')) {
            localStorage.removeItem(key);
        }
    }

    for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('player.')) {
            sessionStorage.removeItem(key);
        }
    }

    location.reload();
});

// Recording
recordButton.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        revokeGeneratedAudioUrl();
        audioPlayer.src = '';
        clearMetaInfo();
        clearStaticWaveform();
        resetAnalyser();

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                channelCount: { ideal: 2 } // native sample rate
            }
        });

        recordingStream = stream;
        recordingSource = mainAudioContext.createMediaStreamSource(stream);
        connectSourceToMeters(recordingSource);
        loadedChannelCount = Math.max(1, recordingSource.channelCount || 1);
        recreateChannelSplitter(loadedChannelCount);

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        recordButton.classList.add('button-on');
        startTimer();
        mediaRecorder.start();
        updateActionButtonStates();

        syncVisualFreeze();

        mediaRecorder.addEventListener('dataavailable', event => audioChunks.push(event.data));

        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            revokeGeneratedAudioUrl();
            audioPlayer.src = audioUrl;
            downloadButton.dataset.audioUrl = audioUrl;
            recordButton.classList.remove('button-on');
            stopTimer();

            if (recordingSource) {
                disconnectSourceFromMeters(recordingSource);
                recordingSource = null;
            }
            if (recordingStream) {
                recordingStream.getTracks().forEach(track => track.stop());
                recordingStream = null;
            }

            restoreMeterChannelCount();
            syncVisualFreeze();

            const reader = new FileReader();
            reader.onload = (e) => {
                mainAudioContext.decodeAudioData(e.target.result).then(buffer => {
                    drawStaticWaveform(buffer);
                    displayRecordingInfo(audioBlob, buffer);
                    updateActionButtonStates();
                });
            };
            reader.readAsArrayBuffer(audioBlob);
            updateActionButtonStates();
        });
    } else {
        mediaRecorder.stop();
        updateActionButtonStates();
    }
});

// Reset analyser
function resetAnalyser() {
    mainAnalyser.disconnect();
    mainAnalyser = mainAudioContext.createAnalyser();
    mainAnalyser.fftSize = 2048;
    reconnectOutputChain();

    if (audioPlayerSource) {
        audioPlayerSource.disconnect();
        audioPlayerSource.connect(mainAnalyser);
        if (channelSplitter) audioPlayerSource.connect(channelSplitter);
    }
    if (inputSource) {
        inputSource.disconnect();
        connectSourceToMeters(inputSource);
    }
    if (recordingSource) {
        recordingSource.disconnect();
        connectSourceToMeters(recordingSource);
    }
    updateMetersSourceBridge();
}

// Recreate channel splitter based on actual channel count
function recreateChannelSplitter(channelCount) {
    if (channelCount < 1) channelCount = 1;
    
    // Disconnect old splitter if it exists
    if (channelSplitter) {
        try {
            disconnectSourceFromChannelSplitter(audioPlayerSource);
            disconnectSourceFromChannelSplitter(inputSource);
            disconnectSourceFromChannelSplitter(recordingSource);
            channelSplitter.disconnect();
        } catch (e) {
            // Ignore errors during disconnect
        }
    }
    
    // Create new splitter with correct channel count
    channelSplitter = mainAudioContext.createChannelSplitter(Math.max(2, channelCount));
    analyserLeft = mainAudioContext.createAnalyser();
    analyserRight = mainAudioContext.createAnalyser();
    analyserLeft.fftSize = 2048;
    analyserRight.fftSize = 2048;
    
    // Reconnect chain
    connectSourceToChannelSplitter(audioPlayerSource);
    connectSourceToChannelSplitter(inputSource);
    connectSourceToChannelSplitter(recordingSource);
    channelSplitter.connect(analyserLeft, 0);
    if (channelCount > 1) {
        channelSplitter.connect(analyserRight, 1);
    }
    updateMetersSourceBridge();
}

// Persistent MediaElementSource for audioPlayer
function connectAudioElement(element) {
    if (!audioPlayerSource) {
        audioPlayerSource = mainAudioContext.createMediaElementSource(element);
        audioPlayerSource.connect(mainAnalyser);
        reconnectOutputChain();

        recreateChannelSplitter(Math.max(2, loadedChannelCount || 1));
    }
}

// Download audio
downloadButton.addEventListener('click', () => {
    if (!downloadButton.dataset.audioUrl) return;
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getFullYear())}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `pekosoft_player_${timestamp}.wav`;
    const link = document.createElement('a');
    link.href = downloadButton.dataset.audioUrl;
    link.download = typeof window.ensurePekosoftFilename === 'function'
        ? window.ensurePekosoftFilename(filename)
        : (filename.toLowerCase().startsWith('pekosoft_') ? filename : `pekosoft_${filename}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    updateActionButtonStates();
});

// INPUT monitoring toggle
toggleInput.addEventListener('click', async () => {
    await setInputMonitoringEnabled(!toggleInput.classList.contains('button-on'));
});

// Timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        setPlayerTimerText(formatTime(elapsedTime));
    }, 10);
}

function stopTimer() {
    clearInterval(timerInterval);
    setPlayerTimerText('00:00:000');
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    return `${pad(minutes)}:${pad(seconds)}:${padMilliseconds(milliseconds)}`;
}

function setPlayerTimerText(value) {
    if (timerElement) {
        timerElement.value = value;
    }
    if (toolTimerDisplayElement) {
        toolTimerDisplayElement.textContent = value;
    }
}

function applyTimeFieldBar(input, ratio) {
    if (!input) return;

    if (!window.enableInputBackgrounds) {
        input.style.backgroundSize = '0px 4px';
        return;
    }

    const clampedRatio = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
    const barWidth = Math.round(input.clientWidth * clampedRatio);
    input.style.backgroundSize = `${barWidth}px 4px`;
}

function updateTimeFieldBars() {
    const duration = audioPlayer.duration || loadedAudioBuffer?.duration || 0;
    const current = audioPlayer.currentTime || 0;
    const progressRatio = duration > 0 ? current / duration : 0;
    const selectionDuration = getActiveSelectionDurationSeconds();
    const selectionRatio = duration > 0 ? selectionDuration / duration : 0;

    applyTimeFieldBar(timerElement, progressRatio);
    applyTimeFieldBar(durationDisplayElement, duration > 0 ? 1 : 0);
    applyTimeFieldBar(selectionDisplayElement, selectionRatio);
    applyTimeFieldBar(remainingDisplayElement, duration > 0 ? 1 - progressRatio : 0);
}

function getActiveSelectionDurationSeconds() {
    if (!hasActiveSelection()) return 0;
    return Math.abs(selectionEndTime - selectionStartTime);
}

function updateSelectionDisplay() {
    if (!selectionDisplayElement) return;
    const selectionDuration = getActiveSelectionDurationSeconds();
    selectionDisplayElement.value = selectionDuration > 0
        ? formatTime(Math.floor(selectionDuration * 1000))
        : '00:00:000';
    updateTimeFieldBars();
}

function setDurationDisplay(seconds) {
    if (!durationDisplayElement) return;
    if (!Number.isFinite(seconds) || seconds <= 0) {
        durationDisplayElement.value = '00:00:000';
        updateTimeFieldBars();
        return;
    }
    durationDisplayElement.value = formatTime(Math.floor(seconds * 1000));
    updateTimeFieldBars();
}

function setRemainingDisplay(seconds) {
    if (!remainingDisplayElement) return;
    if (!Number.isFinite(seconds) || seconds <= 0) {
        remainingDisplayElement.value = '00:00:000';
        updateTimeFieldBars();
        return;
    }
    remainingDisplayElement.value = formatTime(Math.floor(seconds * 1000));
    updateTimeFieldBars();
}

function pad(number) { return number < 10 ? '0' + number : number; }
function padMilliseconds(number) { return number.toString().padStart(3, '0'); }

// Meta helpers
function clearMetaInfo() {
    panelState.meta.fileName = '-';
    panelState.meta.fileSize = '-';
    panelState.meta.duration = '-';
    panelState.meta.sampleRate = '-';
    panelState.meta.channels = '-';
    panelState.meta.format = '-';
    panelState.meta.analysisUpdated = '-';
    panelState.meta.digitalPeak = '-';
    panelState.meta.truePeak = '-';
    panelState.meta.loudnessRms = '-';
    panelState.meta.lufsEstimate = '-';
    panelState.meta.lrDiff = '-';
    panelState.meta.phaseDiff = '-';
    panelState.meta.averagePitch = '-';
    panelState.meta.dcOffset = '-';
    loadedChannelCount = 1;
    setDurationDisplay(0);
    renderPanel();
    updateActionButtonStates();
}

function clearStaticWaveform() {
    selectionStartTime = null;
    selectionEndTime = null;
    updateLoopPlaybackMode();
    updateSelectionDisplay();
    clearBufferHistory();
    redrawTimelineCanvas();
    updateActionButtonStates();
}

function clearLoadedTimelineAudio() {
    loadedAudioBuffer = null;
    revokeGeneratedAudioUrl();
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
    audioPlayer.load();
    if (progressSlider) {
        progressSlider.value = 0;
        progressSlider.max = 0;
    }
    if (downloadButton) {
        downloadButton.dataset.audioUrl = '';
    }
    clearStaticWaveform();
    clearMetaInfo();
}

function toDb(value) {
    if (!Number.isFinite(value) || value <= 0) return '-INF';
    return (20 * Math.log10(value)).toFixed(1);
}

function estimatePitchHzFromBuffer(buffer) {
    if (!buffer || !Number.isFinite(buffer.sampleRate) || buffer.sampleRate <= 0) return null;

    const sampleRate = buffer.sampleRate;
    const minHz = 50;
    const maxHz = 1000;
    const minLag = Math.max(1, Math.floor(sampleRate / maxHz));
    const maxLag = Math.max(minLag + 1, Math.floor(sampleRate / minHz));
    const windowSize = Math.min(4096, Math.max(maxLag * 3, 1024), buffer.length);
    if (windowSize <= maxLag + 2) return null;

    const start = Math.max(0, Math.floor((buffer.length - windowSize) / 2));
    const channels = Math.max(1, buffer.numberOfChannels || 1);
    const mono = new Float32Array(windowSize);

    for (let channel = 0; channel < channels; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < windowSize; i++) {
            mono[i] += data[start + i] || 0;
        }
    }

    for (let i = 0; i < windowSize; i++) {
        mono[i] /= channels;
    }

    let bestLag = -1;
    let bestScore = 0;
    const lagScores = new Float32Array(maxLag + 1);

    for (let lag = minLag; lag <= maxLag; lag++) {
        let numerator = 0;
        let energyA = 0;
        let energyB = 0;
        const limit = windowSize - lag;

        for (let i = 0; i < limit; i++) {
            const a = mono[i];
            const b = mono[i + lag];
            numerator += a * b;
            energyA += a * a;
            energyB += b * b;
        }

        const denom = Math.sqrt(energyA * energyB);
        if (denom <= 1e-12) continue;

        const score = numerator / denom;
        lagScores[lag] = score;

        if (score > bestScore) {
            bestScore = score;
            bestLag = lag;
        }
    }

    if (bestLag <= 0 || bestScore < 0.2) return null;

    // Prefer the first strong local peak to avoid octave errors on periodic material.
    const peakThreshold = Math.max(0.6, bestScore * 0.85);
    let selectedLag = bestLag;
    for (let lag = minLag + 1; lag < maxLag; lag++) {
        const prev = lagScores[lag - 1];
        const curr = lagScores[lag];
        const next = lagScores[lag + 1];
        if (curr >= peakThreshold && curr >= prev && curr >= next) {
            selectedLag = lag;
            break;
        }
    }

    const left = lagScores[selectedLag - 1] || 0;
    const center = lagScores[selectedLag] || 0;
    const right = lagScores[selectedLag + 1] || 0;
    const denom = (left - (2 * center) + right);
    let refinedLag = selectedLag;
    if (Math.abs(denom) > 1e-12) {
        const offset = 0.5 * (left - right) / denom;
        if (Number.isFinite(offset) && Math.abs(offset) <= 1) {
            refinedLag = selectedLag + offset;
        }
    }

    return sampleRate / refinedLag;
}

function analyzeAudioBufferLight(buffer) {
    if (!buffer || !Number.isFinite(buffer.length) || buffer.length <= 0) {
        return null;
    }

    const channels = Math.max(1, buffer.numberOfChannels || 1);
    const sampleLength = buffer.length;
    const step = Math.max(1, Math.floor(sampleLength / 500000));

    let digitalPeak = 0;
    let truePeakEstimate = 0;
    let sumSquares = 0;
    let sumAbsDc = 0;
    let sampleCount = 0;

    for (let channel = 0; channel < channels; channel++) {
        const data = buffer.getChannelData(channel);
        let prev = data[0] || 0;

        for (let i = 0; i < sampleLength; i += step) {
            const value = data[i] || 0;
            const abs = Math.abs(value);
            const inter = Math.abs((value + prev) * 0.5);
            if (abs > digitalPeak) digitalPeak = abs;
            if (inter > truePeakEstimate) truePeakEstimate = inter;
            sumSquares += value * value;
            sumAbsDc += value;
            sampleCount++;
            prev = value;
        }
    }

    const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
    const dcOffset = sampleCount > 0 ? Math.abs(sumAbsDc / sampleCount) : 0;

    let lrDiffDb = null;
    let phaseCorrelation = null;
    if (channels >= 2) {
        const left = buffer.getChannelData(0);
        const right = buffer.getChannelData(1);
        let leftSq = 0;
        let rightSq = 0;
        let cross = 0;

        for (let i = 0; i < sampleLength; i += step) {
            const l = left[i] || 0;
            const r = right[i] || 0;
            leftSq += l * l;
            rightSq += r * r;
            cross += l * r;
        }

        const leftRms = Math.sqrt(leftSq / Math.max(1, Math.ceil(sampleLength / step)));
        const rightRms = Math.sqrt(rightSq / Math.max(1, Math.ceil(sampleLength / step)));
        if (leftRms > 0 && rightRms > 0) {
            lrDiffDb = 20 * Math.log10(leftRms / rightRms);
            phaseCorrelation = cross / Math.sqrt(Math.max(1e-12, leftSq * rightSq));
        }
    }

    const pitchHz = estimatePitchHzFromBuffer(buffer);

    return {
        digitalPeakDbfs: toDb(digitalPeak),
        truePeakDbtp: toDb(Math.max(digitalPeak, truePeakEstimate)),
        rmsDbfs: toDb(rms),
        lufsEstimate: (20 * Math.log10(Math.max(1e-12, rms)) - 0.7).toFixed(1),
        lrDiffDb: lrDiffDb,
        phaseCorrelation: phaseCorrelation,
        averagePitchHz: pitchHz,
        dcOffsetPercent: (dcOffset * 100)
    };
}

function applyPanelMetaAnalysis(buffer) {
    const analysis = analyzeAudioBufferLight(buffer);
    if (!analysis) {
        panelState.meta.analysisUpdated = '-';
        panelState.meta.digitalPeak = '-';
        panelState.meta.truePeak = '-';
        panelState.meta.loudnessRms = '-';
        panelState.meta.lufsEstimate = '-';
        panelState.meta.lrDiff = '-';
        panelState.meta.phaseDiff = '-';
        panelState.meta.averagePitch = '-';
        panelState.meta.dcOffset = '-';
        return;
    }

    panelState.meta.analysisUpdated = formatAnalysisTimestamp(new Date());
    panelState.meta.digitalPeak = `${analysis.digitalPeakDbfs} dBFS`;
    panelState.meta.truePeak = `${analysis.truePeakDbtp} dBTP`;
    panelState.meta.loudnessRms = `${analysis.rmsDbfs} dBFS`;
    panelState.meta.lufsEstimate = `${analysis.lufsEstimate} LUFS`;
    panelState.meta.lrDiff = Number.isFinite(analysis.lrDiffDb)
        ? `${analysis.lrDiffDb >= 0 ? '+' : ''}${analysis.lrDiffDb.toFixed(1)} dB`
        : 'N/A (mono)';
    panelState.meta.phaseDiff = Number.isFinite(analysis.phaseCorrelation)
        ? analysis.phaseCorrelation.toFixed(2)
        : 'N/A (mono)';
    panelState.meta.averagePitch = Number.isFinite(analysis.averagePitchHz)
        ? `${analysis.averagePitchHz.toFixed(1)} Hz`
        : 'N/A';
    panelState.meta.dcOffset = `${analysis.dcOffsetPercent.toFixed(3)} %`;
}

function displayRecordingInfo(blob, buffer) {
    const durationInSeconds = buffer.duration;
    const durationFormatted = formatDurationForPanel(durationInSeconds);
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const fileSize = (blob.size / 1024 / 1024).toFixed(2);

    panelState.meta.fileName = 'New recording';
    panelState.meta.fileSize = `${fileSize} MB`;
    panelState.meta.duration = durationFormatted;
    panelState.meta.sampleRate = `${sampleRate} Hz`;
    panelState.meta.channels = numChannels;
    panelState.meta.format = 'audio/wav';
    applyPanelMetaAnalysis(buffer);
    loadedChannelCount = numChannels;
    setDurationDisplay(durationInSeconds);
    renderPanel();
}

function displayFileInfo(file, buffer) {
    const durationInSeconds = buffer.duration;
    const durationFormatted = formatDurationForPanel(durationInSeconds);
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const fileSize = (file.size / 1024 / 1024).toFixed(2);

    panelState.meta.fileName = file.name;
    panelState.meta.fileSize = `${fileSize} MB`;
    panelState.meta.duration = durationFormatted;
    panelState.meta.sampleRate = `${sampleRate} Hz`;
    panelState.meta.channels = numChannels;
    panelState.meta.format = file.type || 'audio';
    applyPanelMetaAnalysis(buffer);
    loadedChannelCount = numChannels;
    setDurationDisplay(durationInSeconds);
    renderPanel();
}

// Static waveform
function drawStaticWaveform(audioBuffer) {
    loadedAudioBuffer = audioBuffer;
    selectionStartTime = null;
    selectionEndTime = null;
    updateLoopPlaybackMode();
    updateSelectionDisplay();
    clearBufferHistory();
    waveformCacheDirty = true;
    redrawTimelineCanvas();
    updateActionButtonStates();
    
    // Update channel splitter based on actual audio channel count
    if (audioBuffer) {
        const channels = audioBuffer.numberOfChannels || 1;
        loadedChannelCount = channels;
        recreateChannelSplitter(channels);
    }
}

function drawReferenceLines() {
    if (!showGuides) return;

    const channels = loadedAudioBuffer ? loadedAudioBuffer.numberOfChannels : 1;
    const channelHeight = staticCanvas.height / channels;
    const baseGrey1 = getComputedStyle(document.documentElement).getPropertyValue('--grey1').trim();
    const grey1 = window.PekoBrightGuides?.getTimelineGuideColor(baseGrey1) || baseGrey1;
    // -3 dB amplitude ratio: 10^(-3/20)
    const DB3_AMP = Math.pow(10, -3 / 20);

    staticCanvasCtx.save();
    staticCanvasCtx.font = '11px Arial';
    staticCanvasCtx.textAlign = 'right';
    staticCanvasCtx.lineWidth = 1;

    staticCanvasCtx.strokeStyle = grey1;
    staticCanvasCtx.setLineDash([]);

    for (let channel = 0; channel < channels; channel++) {
        const top = channel * channelHeight;
        const amp = channelHeight / 2;
        const centerY = Math.round(top + amp) + 0.5;

        // Channel separator (solid between channels)
        if (channel > 0) {
            staticCanvasCtx.beginPath();
            staticCanvasCtx.moveTo(0, Math.round(top) + 0.5);
            staticCanvasCtx.lineTo(staticCanvas.width, Math.round(top) + 0.5);
            staticCanvasCtx.stroke();
        }

        // Center line (0 dB / silence)
        staticCanvasCtx.beginPath();
        staticCanvasCtx.moveTo(0, centerY);
        staticCanvasCtx.lineTo(staticCanvas.width, centerY);
        staticCanvasCtx.stroke();

        // -3 dB lines (above and below center)
        const db3offset = amp * DB3_AMP;
        const db3TopY = Math.round(centerY - db3offset) + 0.5;
        const db3BotY = Math.round(centerY + db3offset) + 0.5;

        staticCanvasCtx.beginPath();
        staticCanvasCtx.moveTo(0, db3TopY);
        staticCanvasCtx.lineTo(staticCanvas.width, db3TopY);
        staticCanvasCtx.stroke();

        staticCanvasCtx.beginPath();
        staticCanvasCtx.moveTo(0, db3BotY);
        staticCanvasCtx.lineTo(staticCanvas.width, db3BotY);
        staticCanvasCtx.stroke();

        // Labels
        staticCanvasCtx.setLineDash([]);
        staticCanvasCtx.fillStyle = grey1;
        staticCanvasCtx.fillText('0', 38, centerY - 3);
        staticCanvasCtx.fillText('-3', 38, db3TopY - 3);
        staticCanvasCtx.fillText('-3', 38, db3BotY - 3);
    }

    staticCanvasCtx.restore();
}

function drawPanLine() {
    if (!showPanLine) return;

    const width = staticCanvas.width;
    const height = staticCanvas.height;
    const centerY = height / 2;
    const amplitude = (height - 1) / 2;

    staticCanvasCtx.save();
    staticCanvasCtx.strokeStyle = colorSecondary;
    staticCanvasCtx.lineWidth = 1;
    staticCanvasCtx.beginPath();

    if (!loadedAudioBuffer || loadedAudioBuffer.numberOfChannels < 2) {
        staticCanvasCtx.moveTo(0, centerY);
        staticCanvasCtx.lineTo(width, centerY);
        staticCanvasCtx.stroke();
        staticCanvasCtx.restore();
        return;
    }

    const left = loadedAudioBuffer.getChannelData(0);
    const right = loadedAudioBuffer.getChannelData(1);
    const columns = Math.max(1, width);
    const step = Math.max(1, Math.floor(Math.min(left.length, right.length) / columns));

    const smoothingColumns = 12;
    const alpha = 2 / (smoothingColumns + 1);
    let smoothedBalance = 0;
    let hasSmoothedValue = false;

    for (let x = 0; x < columns; x++) {
        const start = x * step;
        const end = Math.min(start + step, left.length, right.length);

        if (start >= end) break;

        let l2 = 0;
        let r2 = 0;
        let n = 0;

        for (let i = start; i < end; i++) {
            const l = left[i];
            const r = right[i];
            l2 += l * l;
            r2 += r * r;
            n++;
        }

        const lRms = n > 0 ? Math.sqrt(l2 / n) : 0;
        const rRms = n > 0 ? Math.sqrt(r2 / n) : 0;
        const denom = lRms + rRms;
        const balance = denom > 1e-8 ? (rRms - lRms) / denom : 0;

        if (!hasSmoothedValue) {
            smoothedBalance = balance;
            hasSmoothedValue = true;
        } else {
            smoothedBalance += alpha * (balance - smoothedBalance);
        }

        const y = centerY + (smoothedBalance * amplitude);

        if (x === 0) {
            staticCanvasCtx.moveTo(x, y);
        } else {
            staticCanvasCtx.lineTo(x, y);
        }
    }

    staticCanvasCtx.stroke();
    staticCanvasCtx.restore();
}

function drawWaveformToContext(targetCtx, targetCanvas, buffer) {
    const numChannels = buffer.numberOfChannels;
    const channelHeight = targetCanvas.height / numChannels;
    const sampleRate = buffer.sampleRate || 44100;
    const lowBandCutoffHz = 280;
    const lowBandAlpha = (() => {
        const dt = 1 / Math.max(1, sampleRate);
        const rc = 1 / (2 * Math.PI * lowBandCutoffHz);
        return dt / (rc + dt);
    })();

    const lowFreqRgb = parseCssColorToRgb(colorSecondary, { r: 255, g: 0, b: 255 });
    const highFreqRgb = parseCssColorToRgb(colorPrimary, { r: 0, g: 128, b: 255 });
    targetCtx.lineWidth = 1.5;

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        const step = Math.max(1, Math.floor(channelData.length / targetCanvas.width));
        const amp = channelHeight / 2;
        const columns = Math.min(targetCanvas.width, channelData.length);
        let lowBandState = 0;

        if (!showWaveformMultiColor) {
            targetCtx.strokeStyle = colorPrimary;
            targetCtx.beginPath();
            for (let i = 0; i < columns; i++) {
                const start = i * step;
                if (start >= channelData.length) break;

                const end = Math.min(start + step, channelData.length);
                let min = 1;
                let max = -1;

                for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
                    const sample = channelData[sampleIndex];
                    if (sample < min) min = sample;
                    if (sample > max) max = sample;
                }

                const y1 = channel * channelHeight + (1 + min) * amp;
                const y2 = channel * channelHeight + (1 + max) * amp;
                targetCtx.moveTo(i, y1);
                targetCtx.lineTo(i, y2);
            }
            targetCtx.stroke();
            continue;
        }

        for (let i = 0; i < columns; i++) {
            const start = i * step;
            if (start >= channelData.length) break;

            const end = Math.min(start + step, channelData.length);
            let min = 1;
            let max = -1;
            let lowEnergy = 0;
            let highEnergy = 0;

            for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
                const sample = channelData[sampleIndex];
                if (sample < min) min = sample;
                if (sample > max) max = sample;

                // Split into low/high bands so bass trends toward --color2 and treble toward --color1.
                lowBandState += (sample - lowBandState) * lowBandAlpha;
                const highBandSample = sample - lowBandState;

                lowEnergy += Math.abs(lowBandState);
                highEnergy += Math.abs(highBandSample);
            }

            const count = Math.max(1, end - start);
            const lowLevel = lowEnergy / count;
            const highLevel = highEnergy / count;
            const ratio = getWaveformBandMixRatio(lowLevel, highLevel);
            targetCtx.strokeStyle = rgbToCss(getWaveformBandColor(lowFreqRgb, highFreqRgb, ratio));

            const y1 = channel * channelHeight + (1 + min) * amp;
            const y2 = channel * channelHeight + (1 + max) * amp;
            targetCtx.beginPath();
            targetCtx.moveTo(i, y1);
            targetCtx.lineTo(i, y2);
            targetCtx.stroke();
        }
    }
}

function rebuildWaveformCache() {
    if (!loadedAudioBuffer) {
        waveformCacheDirty = false;
        return;
    }

    if (!waveformCacheCanvas) {
        waveformCacheCanvas = document.createElement('canvas');
        waveformCacheCtx = waveformCacheCanvas.getContext('2d');
    }

    if (waveformCacheCanvas.width !== staticCanvas.width || waveformCacheCanvas.height !== staticCanvas.height) {
        waveformCacheCanvas.width = staticCanvas.width;
        waveformCacheCanvas.height = staticCanvas.height;
    }

    waveformCacheCtx.clearRect(0, 0, waveformCacheCanvas.width, waveformCacheCanvas.height);
    drawWaveformToContext(waveformCacheCtx, waveformCacheCanvas, loadedAudioBuffer);
    waveformCacheDirty = false;
}

function getSelectionPixelBoundsForWidth(canvasWidth) {
    if (!hasActiveSelection() || !loadedAudioBuffer || loadedAudioBuffer.duration <= 0) {
        return null;
    }

    const safeWidth = Math.max(1, canvasWidth);
    const startTime = Math.max(0, Math.min(loadedAudioBuffer.duration, Math.min(selectionStartTime, selectionEndTime)));
    const endTime = Math.max(0, Math.min(loadedAudioBuffer.duration, Math.max(selectionStartTime, selectionEndTime)));
    const x1 = Math.round((startTime / loadedAudioBuffer.duration) * safeWidth);
    const x2 = Math.round((endTime / loadedAudioBuffer.duration) * safeWidth);
    return {
        x1,
        x2,
        width: Math.max(1, x2 - x1)
    };
}

function getSelectionPixelBounds() {
    return getSelectionPixelBoundsForWidth(staticCanvas.width);
}

function drawSelectionFill() {
    const bounds = getSelectionPixelBounds();
    if (!bounds) return;

    staticCanvasCtx.save();
    staticCanvasCtx.fillStyle = colorGrey2;
    staticCanvasCtx.fillRect(bounds.x1, 0, bounds.width, staticCanvas.height);
    staticCanvasCtx.restore();
}

function drawSelectionEdges() {
    // Selection is rendered only as a background fill.
}

function redrawTimelineCanvas() {
    staticCanvasCtx.clearRect(0, 0, staticCanvas.width, staticCanvas.height);
    drawReferenceLines();
    drawSelectionFill();

    if (loadedAudioBuffer) {
        if (waveformCacheDirty) {
            rebuildWaveformCache();
        }

        if (waveformCacheCanvas) {
            staticCanvasCtx.drawImage(waveformCacheCanvas, 0, 0);
        }
    }

    drawPanLine();
    drawTimelineRuler();
    drawBpmRuler();
}

function formatRulerTime(seconds, stepSeconds) {
    const total = Math.max(0, seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (stepSeconds < 1) {
        return `${Math.floor(total)}.${Math.floor((total % 1) * 1000).toString().padStart(3, '0')}`;
    }

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}`;
    }

    return `${minutes}:${Math.floor(secs).toString().padStart(2, '0')}`;
}

function getRulerMajorStep(durationSeconds, widthPx) {
    const targetMajorPixels = 112;
    const secondsPerPixel = durationSeconds / Math.max(1, widthPx);
    const targetSeconds = targetMajorPixels * secondsPerPixel;
    const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
    for (const step of steps) {
        if (step >= targetSeconds) return step;
    }
    return steps[steps.length - 1];
}

function getRulerTickHeight(heightPx) {
    return Math.max(1, Math.floor(heightPx * 0.55));
}

function drawTimelineRuler() {
    if (!showTimelineRuler || !timelineRulerCanvas || !timelineRulerCtx) return;

    const width = timelineRulerCanvas.width;
    const height = timelineRulerCanvas.height;

    timelineRulerCtx.clearRect(0, 0, width, height);
    timelineRulerCtx.fillStyle = colorBlack;
    timelineRulerCtx.fillRect(0, 0, width, height);
    timelineRulerCtx.imageSmoothingEnabled = false;

    if (!loadedAudioBuffer || !Number.isFinite(loadedAudioBuffer.duration) || loadedAudioBuffer.duration <= 0) {
        return;
    }

    const duration = loadedAudioBuffer.duration;
    const majorStep = getRulerMajorStep(duration, width);
    const minorStep = Math.max(majorStep / 4, 0.01);
    const majorCount = Math.ceil(duration / majorStep);
    const majorPixels = (majorStep / duration) * width;
    const minLabelSpacingPx = 96;
    const labelEveryMajors = Math.max(1, Math.ceil(minLabelSpacingPx / Math.max(1, majorPixels)));

    timelineRulerCtx.strokeStyle = colorGrey2;
    timelineRulerCtx.fillStyle = colorGrey2;
    timelineRulerCtx.font = '10px Arial';
    timelineRulerCtx.textAlign = 'left';
    timelineRulerCtx.textBaseline = 'bottom';

    for (let i = 0; i <= majorCount; i++) {
        if (i % labelEveryMajors !== 0) {
            continue;
        }

        const t = i * majorStep;
        const clampedT = Math.min(t, duration);
        const x = Math.round((clampedT / duration) * width);
        const tickHeight = getRulerTickHeight(height);
        const tickTop = height - tickHeight;

        timelineRulerCtx.fillRect(x, tickTop, 1, tickHeight);
        timelineRulerCtx.fillText(formatRulerTime(clampedT, majorStep), x + 3, height - 2);
    }
}

function drawBpmRuler() {
    if (!showBpmRuler || !bpmRulerCanvas || !bpmRulerCtx) return;

    const width = bpmRulerCanvas.width;
    const height = bpmRulerCanvas.height;

    bpmRulerCtx.clearRect(0, 0, width, height);
    bpmRulerCtx.fillStyle = colorBlack;
    bpmRulerCtx.fillRect(0, 0, width, height);
    bpmRulerCtx.imageSmoothingEnabled = false;

    if (!loadedAudioBuffer || !Number.isFinite(loadedAudioBuffer.duration) || loadedAudioBuffer.duration <= 0) {
        return;
    }

    const duration = loadedAudioBuffer.duration;
    const bpm = Math.max(1, bpmValue);
    const beatSeconds = 60 / bpm;
    const totalBeats = Math.floor(duration / beatSeconds);

    const selectionBounds = getSelectionPixelBoundsForWidth(width);
    if (selectionBounds) {
        bpmRulerCtx.fillStyle = colorGrey2;
        bpmRulerCtx.fillRect(selectionBounds.x1, 0, selectionBounds.width, height);
    }

    bpmRulerCtx.strokeStyle = colorGrey2;
    bpmRulerCtx.fillStyle = colorGrey2;
    bpmRulerCtx.font = '10px Arial';
    bpmRulerCtx.textAlign = 'left';
    bpmRulerCtx.textBaseline = 'top';

    const beatsPerBar = 4;
    const barSeconds = beatSeconds * beatsPerBar;
    const totalBars = Math.floor(duration / barSeconds);
    const pixelsPerBar = (barSeconds / duration) * width;
    const minLabelSpacingPx = 56;
    const labelEveryBars = Math.max(1, Math.ceil(minLabelSpacingPx / Math.max(1, pixelsPerBar)));

    // Draw only bar ticks to keep BPM ruler readable.
    for (let bar = 0; bar <= totalBars; bar++) {
        if (bar % labelEveryBars !== 0) {
            continue;
        }

        const t = bar * barSeconds;
        const x = Math.round((Math.min(t, duration) / duration) * width);
        const tickTop = 0;
        const tickHeight = getRulerTickHeight(height);

        bpmRulerCtx.fillRect(x, tickTop, 1, tickHeight);
        bpmRulerCtx.fillText(String((bar * beatsPerBar) + 1), x + 3, 2);
    }
}

// Playhead

function drawPlayhead() {
    if (!loadedAudioBuffer) return;

    playheadCtx.clearRect(0, 0, playheadCanvas.width, playheadCanvas.height);

    const position = (audioPlayer.currentTime / loadedAudioBuffer.duration) * playheadCanvas.width;

    playheadCtx.beginPath();
    playheadCtx.strokeStyle = colorWhite;
    playheadCtx.lineWidth = 1;
    playheadCtx.moveTo(position, 0);
    playheadCtx.lineTo(position, playheadCanvas.height);
    playheadCtx.stroke();
}

audioPlayer.addEventListener('timeupdate', drawPlayhead);

audioPlayer.addEventListener('ended', () => {
    playButton.classList.remove('button-on');
    syncVisualFreeze();
});

// Audio input details

function updateAudioInfo() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const deviceLabel = audioInput.selectedOptions[0]?.text || 'Unknown Device';
            panelState.input.sampleRate = `${audioContext.sampleRate} Hz`;
            panelState.input.channels = source.channelCount;
            panelState.input.latency = `${audioContext.baseLatency.toFixed(4)} s`;
            panelState.input.device = deviceLabel;
            renderPanel();
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
        })
        .catch(error => {
            panelState.input.sampleRate = '-';
            panelState.input.channels = '-';
            panelState.input.latency = '-';
            panelState.input.device = 'Permission denied';
            renderPanel();
            console.error('Error updating audio info:', error);
        });
}

// Playlist Module
const playlistItems = document.getElementById('playlist-items');
const playlistTotalTracks = document.getElementById('playlist-total-tracks');
const playlistTotalDuration = document.getElementById('playlist-total-duration');
const playlistTotalBytes = document.getElementById('playlist-total-bytes');
const playlistRandomizeButton = document.getElementById('playlist-randomize-button');
const playlistClearButton = document.getElementById('playlist-clear-button');
const playlistCleanButton = document.getElementById('playlist-clean-button');
const playlistAutoCleanButton = document.getElementById('playlist-auto-clean-button');
const playlistSaveButton = document.getElementById('playlist-save-button');
const playlistLoadButton = document.getElementById('playlist-load-button');

let playlist = [];
let currentPlaylistIndex = -1;

const STORAGE_PLAYLIST = 'player.playlist';
const STORAGE_PLAYLIST_AUTO_CLEAN = 'player.playlist_auto_clean';
const PLAYLIST_WAVEFORM_SAMPLE_COUNT = 96;

function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--:---';
    const totalMs = Math.floor(seconds * 1000);
    const minutes = Math.floor(totalMs / 60000);
    const sec = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    return `${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(ms).padStart(3, '0')}`;
}

function formatAddedTimestamp(timestamp) {
    if (!Number.isFinite(timestamp) || timestamp <= 0) return '-';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '-';

    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${d}-${m}-${y} ${h}:${min}`;
}

function createPlaylistWaveformPeaks(audioBuffer, sampleCount = PLAYLIST_WAVEFORM_SAMPLE_COUNT) {
    if (!audioBuffer || !Number.isFinite(audioBuffer.length) || audioBuffer.length <= 0) {
        return null;
    }

    const safeCount = Math.max(8, Math.floor(sampleCount));
    const peaks = new Array(safeCount).fill(0);
    const channelCount = Math.max(1, audioBuffer.numberOfChannels || 1);
    const blockSize = Math.max(1, Math.floor(audioBuffer.length / safeCount));

    for (let i = 0; i < safeCount; i++) {
        const start = i * blockSize;
        const end = i === safeCount - 1 ? audioBuffer.length : Math.min(audioBuffer.length, start + blockSize);
        let peak = 0;

        for (let channel = 0; channel < channelCount; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
                const value = Math.abs(channelData[sampleIndex] || 0);
                if (value > peak) peak = value;
            }
        }

        peaks[i] = Math.max(0, Math.min(1, peak));
    }

    return peaks;
}

function drawPlaylistWaveform(canvasElement, peaks) {
    if (!canvasElement) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    const width = canvasElement.width;
    const height = canvasElement.height;
    ctx.clearRect(0, 0, width, height);

    if (!Array.isArray(peaks) || peaks.length === 0) {
        return;
    }

    const centerY = Math.floor(height / 2);
    ctx.strokeStyle = colorWhite;
    ctx.lineWidth = 1;

    const stepX = width / peaks.length;
    for (let i = 0; i < peaks.length; i++) {
        const amp = Math.max(0, Math.min(1, Number(peaks[i]) || 0));
        const ySpan = Math.max(1, Math.round(amp * (height * 0.5)));
        const x = Math.round((i + 0.5) * stepX);
        ctx.beginPath();
        ctx.moveTo(x + 0.5, centerY - ySpan);
        ctx.lineTo(x + 0.5, centerY + ySpan);
        ctx.stroke();
    }
}

function updatePlaylistItemWaveform(item) {
    if (!item?.file || item.waveformPreviewPending || Array.isArray(item.waveformPeaks)) return;

    item.waveformPreviewPending = true;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const sourceBuffer = event?.target?.result;
            if (!(sourceBuffer instanceof ArrayBuffer)) return;

            const decodeBuffer = sourceBuffer.slice(0);
            const decoded = await mainAudioContext.decodeAudioData(decodeBuffer);
            item.waveformPeaks = createPlaylistWaveformPeaks(decoded);
            if (!Number.isFinite(item.duration) || item.duration <= 0) {
                item.duration = decoded.duration;
            }
            if (!Number.isFinite(item.channels) || item.channels <= 0) {
                item.channels = decoded.numberOfChannels;
            }
            renderPlaylist();
            savePlaylistToStorage();
        } catch (error) {
            console.error('Error decoding playlist waveform preview:', error);
        } finally {
            item.waveformPreviewPending = false;
        }
    };

    reader.onerror = (error) => {
        item.waveformPreviewPending = false;
        console.error('Error reading playlist file for waveform preview:', error);
    };

    reader.readAsArrayBuffer(item.file);
}

function updatePlaylistItemDuration(item) {
    if (!item?.file || item.duration !== null) return;

    const tempAudio = document.createElement('audio');
    tempAudio.preload = 'metadata';
    const tempUrl = URL.createObjectURL(item.file);
    tempAudio.src = tempUrl;

    const finalize = () => {
        URL.revokeObjectURL(tempUrl);
    };

    tempAudio.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(tempAudio.duration) && tempAudio.duration > 0) {
            item.duration = tempAudio.duration;
            renderPlaylist();
            savePlaylistToStorage();
        }
        finalize();
    }, { once: true });

    tempAudio.addEventListener('error', finalize, { once: true });
}

function updatePlaylistSummary() {
    const trackCount = playlist.length;
    const totalDurationSeconds = playlist.reduce((sum, item) => {
        if (!Number.isFinite(item?.duration) || item.duration < 0) return sum;
        return sum + item.duration;
    }, 0);
    const totalBytesValue = playlist.reduce((sum, item) => {
        if (!Number.isFinite(item?.size) || item.size < 0) return sum;
        return sum + item.size;
    }, 0);

    if (playlistTotalTracks) {
        playlistTotalTracks.textContent = String(trackCount);
    }
    if (playlistTotalDuration) {
        playlistTotalDuration.textContent = formatDuration(totalDurationSeconds);
    }
    if (playlistTotalBytes) {
        playlistTotalBytes.textContent = Math.round(totalBytesValue).toLocaleString('en-US');
    }
}

function isDeadPlaylistItem(item) {
    return !item?.file;
}

function getDeadPlaylistCount() {
    return playlist.reduce((count, item) => count + (isDeadPlaylistItem(item) ? 1 : 0), 0);
}

function isAutoCleanDeadFilesEnabled() {
    return localStorage.getItem(STORAGE_PLAYLIST_AUTO_CLEAN) === 'true';
}

function syncPlaylistDeadFileButtons() {
    const deadCount = getDeadPlaylistCount();

    if (playlistCleanButton) {
        setButtonGrey(playlistCleanButton, deadCount === 0);
    }

    if (playlistAutoCleanButton) {
        playlistAutoCleanButton.classList.toggle('button-on', isAutoCleanDeadFilesEnabled());
    }
}

function cleanDeadPlaylistItems() {
    if (!playlist.length) return 0;

    const previousLength = playlist.length;
    const currentItem = currentPlaylistIndex >= 0 ? playlist[currentPlaylistIndex] : null;

    playlist = playlist.filter((item) => !isDeadPlaylistItem(item));

    if (currentItem?.file) {
        currentPlaylistIndex = playlist.indexOf(currentItem);
    } else {
        currentPlaylistIndex = -1;
    }

    if (currentPlaylistIndex >= playlist.length) {
        currentPlaylistIndex = -1;
    }

    const removedCount = previousLength - playlist.length;
    if (removedCount > 0) {
        renderPlaylist();
        savePlaylistToStorage();
        updateActionButtonStates();
    }

    syncPlaylistDeadFileButtons();
    return removedCount;
}

function setAutoCleanDeadFilesEnabled(enabled) {
    localStorage.setItem(STORAGE_PLAYLIST_AUTO_CLEAN, enabled ? 'true' : 'false');
    syncPlaylistDeadFileButtons();
    if (enabled) {
        cleanDeadPlaylistItems();
    }
}

function addToPlaylist(files) {
    if (!files || files.length === 0) return;

    for (let file of files) {
        if (file.type.startsWith('audio/')) {
            const item = {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                addedAt: Date.now(),
                file: file,
                duration: null,
                channels: null,
                waveformPeaks: null,
                waveformPreviewPending: false
            };
            playlist.push(item);
            updatePlaylistItemDuration(item);
            updatePlaylistItemWaveform(item);
        }
    }

    renderPlaylist();
    savePlaylistToStorage();
}

function renderPlaylist() {
    playlistItems.innerHTML = '';

    playlist.forEach((item, index) => {
        const row = document.createElement('tr');
        const isDead = isDeadPlaylistItem(item);
        row.className = index === currentPlaylistIndex && !isDead ? 'active' : '';
        row.classList.toggle('dead', isDead);
        row.dataset.index = index;

        const indexCell = document.createElement('td');
        indexCell.className = 'col-index';
        indexCell.textContent = index + 1;

        const nameCell = document.createElement('td');
        nameCell.className = 'col-name';
        nameCell.textContent = item.name;
        nameCell.title = item.name;

        const waveformCell = document.createElement('td');
        waveformCell.className = 'col-waveform playlist-waveform';
        const waveformCanvas = document.createElement('canvas');
        waveformCanvas.className = 'playlist-waveform-canvas';
        waveformCanvas.width = 160;
        waveformCanvas.height = 24;
        drawPlaylistWaveform(waveformCanvas, item.waveformPeaks);
        waveformCell.appendChild(waveformCanvas);

        const durationCell = document.createElement('td');
        durationCell.className = 'col-duration';
        durationCell.textContent = item.duration ? formatDuration(item.duration) : '--:--:---';

        const sizeCell = document.createElement('td');

        const channelsCell = document.createElement('td');
        channelsCell.className = 'col-channels';
        channelsCell.textContent = item.channels !== null ? item.channels : '--';

        sizeCell.className = 'col-size';
        sizeCell.textContent = formatFileSize(item.size);

        const typeCell = document.createElement('td');
        typeCell.className = 'col-type';
        typeCell.textContent = (item.type || '').split('/')[1]?.toUpperCase() || 'AUDIO';

        const modifiedCell = document.createElement('td');
        modifiedCell.className = 'col-modified';
        modifiedCell.textContent = formatAddedTimestamp(item.lastModified);

        const addedCell = document.createElement('td');
        addedCell.className = 'col-added';
        addedCell.textContent = formatAddedTimestamp(item.addedAt);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'col-actions';

        const playBtn = document.createElement('button');
        playBtn.className = 'action-btn square icon-only';
        playBtn.type = 'button';
        const isActiveTrack = index === currentPlaylistIndex;
        const isPlayingTrack = isActiveTrack && !audioPlayer.paused && !audioPlayer.ended;
        playBtn.title = isDead ? 'File not loaded' : 'Toggle play';
        playBtn.setAttribute('aria-label', isDead ? 'File not loaded' : 'Toggle play');
        playBtn.classList.toggle('button-on', isPlayingTrack);
        playBtn.innerHTML = '<svg class="icons" role="img"><use href="/icons.svg#play" /></svg>';
        setButtonGrey(playBtn, isDead);
        playBtn.addEventListener('click', () => togglePlaylistItemPlayback(index));

        const removeBtn = document.createElement('button');
        removeBtn.className = 'action-btn square icon-only';
        removeBtn.type = 'button';
        removeBtn.title = 'Remove track';
        removeBtn.setAttribute('aria-label', 'Remove track');
        removeBtn.innerHTML = '<svg class="icons" role="img"><use href="/icons.svg#delete" /></svg>';
        removeBtn.addEventListener('click', () => removeFromPlaylist(index));

        actionsCell.appendChild(playBtn);
        actionsCell.appendChild(removeBtn);

        row.appendChild(indexCell);
        row.appendChild(nameCell);
        row.appendChild(waveformCell);
        row.appendChild(durationCell);
        row.appendChild(channelsCell);
        row.appendChild(sizeCell);
        row.appendChild(typeCell);
        row.appendChild(modifiedCell);
        row.appendChild(addedCell);
        row.appendChild(actionsCell);

        playlistItems.appendChild(row);
    });

    updatePlaylistSummary();
    syncPlaylistDeadFileButtons();

    if (localStorage.getItem(STORAGE.panelSource) === 'playlist') renderPanel();
}

function playPlaylistItem(index) {
    if (index < 0 || index >= playlist.length) return;

    const item = playlist[index];
    if (!item?.file) {
        renderPlaylist();
        return;
    }

    currentPlaylistIndex = index;
    renderPlaylist();

    let url;
    try {
        url = URL.createObjectURL(item.file);
        revokeGeneratedAudioUrl();
        audioPlayer.src = url;
    } catch (error) {
        console.error('Error creating object URL for playlist item:', error);
        return;
    }

    const playLoadedFile = async () => {
        if (mainAudioContext.state === 'suspended') {
            await mainAudioContext.resume();
        }
        try {
            await audioPlayer.play();
            playButton.classList.add('button-on');
            syncVisualFreeze();
            updateActionButtonStates();
            renderPlaylist();
        } catch (error) {
            playButton.classList.remove('button-on');
            syncVisualFreeze();
            updateActionButtonStates();
            renderPlaylist();
            console.error('Error playing playlist item:', error);
        }
    };
    playLoadedFile();

    clearMetaInfo();
    clearStaticWaveform();

    const reader = new FileReader();
    reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const offlineAudioContext = new OfflineAudioContext(2, 44100 * 40, 44100);
        offlineAudioContext.decodeAudioData(arrayBuffer).then(buffer => {
            item.duration = buffer.duration;
            item.channels = buffer.numberOfChannels;
            item.waveformPeaks = createPlaylistWaveformPeaks(buffer);
            drawStaticWaveform(buffer);
            displayFileInfo(item.file, buffer);
            renderPlaylist();
            savePlaylistToStorage();
            updateActionButtonStates();
        }).catch((error) => {
            console.error('Error decoding playlist item:', error);
        });
    };
    reader.onerror = (error) => {
        console.error('Error reading playlist item:', error);
    };
    reader.readAsArrayBuffer(item.file);
}

async function togglePlaylistItemPlayback(index) {
    if (index < 0 || index >= playlist.length) return;

    const isCurrent = index === currentPlaylistIndex;
    const canToggleCurrent = isCurrent && Boolean(playlist[index]?.file) && hasLoadedAudioSource();

    if (!canToggleCurrent) {
        playPlaylistItem(index);
        return;
    }

    if (!audioPlayer.paused && !audioPlayer.ended) {
        audioPlayer.pause();
        playButton.classList.remove('button-on');
        syncVisualFreeze();
        updateActionButtonStates();
        renderPlaylist();
        return;
    }

    if (audioPlayer.ended || audioPlayer.currentTime >= (audioPlayer.duration || 0)) {
        audioPlayer.currentTime = 0;
    }

    if (mainAudioContext.state === 'suspended') {
        await mainAudioContext.resume();
    }

    try {
        await audioPlayer.play();
        playButton.classList.add('button-on');
    } catch (error) {
        playButton.classList.remove('button-on');
        console.error('Error toggling playlist item playback:', error);
    }

    syncVisualFreeze();
    updateActionButtonStates();
    renderPlaylist();
}

function removeFromPlaylist(index) {
    if (index < 0 || index >= playlist.length) return;

    if (index === currentPlaylistIndex) {
        clearLoadedTimelineAudio();
        currentPlaylistIndex = -1;
    } else if (index < currentPlaylistIndex) {
        currentPlaylistIndex--;
    }

    playlist.splice(index, 1);
    renderPlaylist();
    savePlaylistToStorage();
}

function randomizePlaylist() {
    for (let i = playlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
    currentPlaylistIndex = -1;
    renderPlaylist();
    savePlaylistToStorage();
}

function clearPlaylist() {
    if (playlist.length === 0) return;
    if (!confirm('Clear entire playlist? This cannot be undone.')) return;

    playlist = [];
    currentPlaylistIndex = -1;
    revokeGeneratedAudioUrl();
    audioPlayer.src = '';
    clearStaticWaveform();
    clearMetaInfo();
    renderPlaylist();
    savePlaylistToStorage();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
}

function savePlaylistToStorage() {
    const playlistData = playlist.map(item => ({
        name: item.name,
        size: item.size,
        type: item.type,
        lastModified: item.lastModified,
        addedAt: item.addedAt,
        duration: item.duration,
        channels: item.channels,
        waveformPeaks: Array.isArray(item.waveformPeaks) ? item.waveformPeaks : null
    }));
    localStorage.setItem(STORAGE_PLAYLIST, JSON.stringify(playlistData));
}

function loadPlaylistFromStorage() {
    const raw = localStorage.getItem(STORAGE_PLAYLIST);
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) return;

        playlist = data
            .filter(item => item && typeof item.name === 'string')
            .map(item => ({
                name: item.name,
                size: Number.isFinite(item.size) ? item.size : 0,
                type: item.type || 'audio',
                lastModified: Number.isFinite(item.lastModified) ? item.lastModified : 0,
                addedAt: Number.isFinite(item.addedAt) ? item.addedAt : Date.now(),
                duration: Number.isFinite(item.duration) ? item.duration : null,
                channels: Number.isFinite(item.channels) ? item.channels : null,
                waveformPeaks: Array.isArray(item.waveformPeaks) ? item.waveformPeaks : null,
                waveformPreviewPending: false,
                file: null
            }));

        currentPlaylistIndex = -1;
        renderPlaylist();
        if (isAutoCleanDeadFilesEnabled()) {
            cleanDeadPlaylistItems();
        }
    } catch (error) {
        console.error('Error loading playlist from localStorage:', error);
    }
}

function exportPlaylistAsJSON() {
    const playlistData = playlist.map(item => ({
        name: item.name,
        size: item.size,
        type: item.type,
        addedAt: item.addedAt,
        duration: item.duration,
        channels: item.channels,
        waveformPeaks: Array.isArray(item.waveformPeaks) ? item.waveformPeaks : null
    }));

    const dataStr = JSON.stringify(playlistData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const filename = `playlist-${day}-${month}-${year}.json`;
    link.href = url;
    link.download = typeof window.ensurePekosoftFilename === 'function'
        ? window.ensurePekosoftFilename(filename)
        : `pekosoft_${filename}`;
    link.click();
    URL.revokeObjectURL(url);
}

// Playlist button event listeners
if (playlistRandomizeButton) {
    playlistRandomizeButton.addEventListener('click', randomizePlaylist);
}

if (playlistClearButton) {
    playlistClearButton.addEventListener('click', clearPlaylist);
}

if (playlistCleanButton) {
    playlistCleanButton.addEventListener('click', cleanDeadPlaylistItems);
}

if (playlistAutoCleanButton) {
    playlistAutoCleanButton.addEventListener('click', () => {
        setAutoCleanDeadFilesEnabled(!isAutoCleanDeadFilesEnabled());
    });
}

if (playlistSaveButton) {
    playlistSaveButton.addEventListener('click', exportPlaylistAsJSON);
}

if (playlistLoadButton) {
    playlistLoadButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (Array.isArray(data)) {
                        playlist = data
                            .filter(item => item && typeof item.name === 'string')
                            .map(item => ({
                                name: item.name,
                                size: Number.isFinite(item.size) ? item.size : 0,
                                type: item.type || 'audio',
                                lastModified: Number.isFinite(item.lastModified) ? item.lastModified : 0,
                                addedAt: Number.isFinite(item.addedAt) ? item.addedAt : Date.now(),
                                duration: Number.isFinite(item.duration) ? item.duration : null,
                                channels: Number.isFinite(item.channels) ? item.channels : null,
                                waveformPeaks: Array.isArray(item.waveformPeaks) ? item.waveformPeaks : null,
                                waveformPreviewPending: false,
                                file: null
                            }));
                        currentPlaylistIndex = -1;
                        renderPlaylist();
                        if (isAutoCleanDeadFilesEnabled()) {
                            cleanDeadPlaylistItems();
                        }
                        savePlaylistToStorage();
                    }
                } catch (error) {
                    console.error('Error loading playlist:', error);
                    alert('Invalid playlist file format');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    });
}

// Update file input to add to playlist instead of replacing
audioFileInput.addEventListener('change', function (event) {
    const files = event.target.files;
    if (files && files.length > 0) {
        const firstNewIndex = playlist.length;
        addToPlaylist(files);
        const firstNewPlayableIndex = playlist.findIndex((item, index) => index >= firstNewIndex && item?.file);
        if (firstNewPlayableIndex !== -1) {
            playPlaylistItem(firstNewPlayableIndex);
        }
    }
});

loadPlaylistFromStorage();
syncPlaylistDeadFileButtons();

audioPlayer.addEventListener('play', renderPlaylist);
audioPlayer.addEventListener('pause', renderPlaylist);
audioPlayer.addEventListener('ended', renderPlaylist);

// END OF FILE
