// Pekosoft Drum Machine
// pekosoft.net/js/drum_machine.js

(() => {
  const STORAGE_KEY = "drum_machine.state";
  const PLAYLIST_STORAGE_KEY = "drum_machine.playlist";
  const STEP_COUNT = 16;
  const SCHEDULE_AHEAD_SEC = 0.1;
  const SCHEDULER_DELAY_MS = 25;
  const TIMELINE_WINDOW_MS = 8000;

  const VOICES = [
    { id: "kick", label: "KICK", key: "D" },
    { id: "snare", label: "SNARE", key: "F" },
    { id: "hat", label: "HI-HAT", key: "J" },
    { id: "perc", label: "PERC", key: "K" }
  ];

  const VOICE_ICONS = {
    kick: "beat",
    snare: "snare",
    hat: "hi_hat",
    perc: "maraca"
  };

  const VOICE_LIMITS = {
    kick: { frequency: [35, 180], decay: [0.06, 1.2] },
    snare: { frequency: [90, 360], decay: [0.04, 0.8] },
    hat: { frequency: [3000, 14000], decay: [0.015, 0.5] },
    perc: { frequency: [120, 2400], decay: [0.025, 0.8] }
  };

  const VOICE_PARAMETERS = [
    ["pitch", "frequency", 1, "Hz"],
    ["decay", "decay", 0.001, "ms"],
    ["tone", "tone", 0.01, "%"],
    ["level", "level", 0.01, "%"],
    ["pan", "pan", 0.01, "%"]
  ];

  const PATTERN_PRESETS = {
    basic: {
      kick:  [2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      hat:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      perc:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    four_floor: {
      kick:  [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
      snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      hat:   [1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 2, 0],
      perc:  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
    },
    breakbeat: {
      kick:  [2, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      snare: [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 2, 0, 1, 0],
      hat:   [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 2, 1],
      perc:  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1]
    },
    electro: {
      kick:  [2, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 1, 0],
      snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
      hat:   [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 2, 0],
      perc:  [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]
    },
    empty: {
      kick:  Array(STEP_COUNT).fill(0),
      snare: Array(STEP_COUNT).fill(0),
      hat:   Array(STEP_COUNT).fill(0),
      perc:  Array(STEP_COUNT).fill(0)
    }
  };

  const KIT_PRESETS = {
    classic: {
      kick:  { frequency: 55, decay: 0.35, tone: 0.48, level: 0.9, pan: 0 },
      snare: { frequency: 180, decay: 0.2, tone: 0.72, level: 0.78, pan: 0 },
      hat:   { frequency: 8000, decay: 0.06, tone: 0.78, level: 0.58, pan: 0.16 },
      perc:  { frequency: 620, decay: 0.14, tone: 0.6, level: 0.62, pan: -0.16 }
    },
    deep: {
      kick:  { frequency: 42, decay: 0.62, tone: 0.28, level: 0.94, pan: 0 },
      snare: { frequency: 145, decay: 0.3, tone: 0.52, level: 0.78, pan: 0 },
      hat:   { frequency: 6500, decay: 0.1, tone: 0.56, level: 0.52, pan: 0.2 },
      perc:  { frequency: 360, decay: 0.24, tone: 0.42, level: 0.66, pan: -0.18 }
    },
    tight: {
      kick:  { frequency: 68, decay: 0.18, tone: 0.7, level: 0.86, pan: 0 },
      snare: { frequency: 210, decay: 0.1, tone: 0.84, level: 0.74, pan: 0 },
      hat:   { frequency: 9600, decay: 0.035, tone: 0.88, level: 0.52, pan: 0.12 },
      perc:  { frequency: 920, decay: 0.07, tone: 0.78, level: 0.58, pan: -0.12 }
    },
    bright: {
      kick:  { frequency: 74, decay: 0.3, tone: 0.72, level: 0.86, pan: 0 },
      snare: { frequency: 230, decay: 0.23, tone: 0.9, level: 0.8, pan: 0 },
      hat:   { frequency: 11200, decay: 0.075, tone: 0.94, level: 0.6, pan: 0.22 },
      perc:  { frequency: 1380, decay: 0.12, tone: 0.86, level: 0.6, pan: -0.22 }
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max, fallback) {
    const parsed = Number(value);
    return Math.max(min, Math.min(max, Number.isFinite(parsed) ? parsed : fallback));
  }

  function normalizePattern(pattern) {
    const fallback = PATTERN_PRESETS.basic;
    const normalized = {};

    VOICES.forEach(({ id }) => {
      const source = pattern && Array.isArray(pattern[id]) ? pattern[id] : fallback[id];
      normalized[id] = Array.from({ length: STEP_COUNT }, (_, index) => {
        return Math.round(clamp(source[index], 0, 2, 0));
      });
    });

    return normalized;
  }

  function normalizeVoices(voices) {
    const normalized = {};

    VOICES.forEach(({ id }) => {
      const source = voices && voices[id] ? voices[id] : KIT_PRESETS.classic[id];
      const fallback = KIT_PRESETS.classic[id];
      const limits = VOICE_LIMITS[id];
      normalized[id] = {
        frequency: clamp(source.frequency, limits.frequency[0], limits.frequency[1], fallback.frequency),
        decay: clamp(source.decay, limits.decay[0], limits.decay[1], fallback.decay),
        tone: clamp(source.tone, 0, 1, fallback.tone),
        level: clamp(source.level, 0, 1, fallback.level),
        pan: clamp(source.pan, -1, 1, fallback.pan)
      };
    });

    return normalized;
  }

  function normalizeFreeHits(hits) {
    return (Array.isArray(hits) ? hits : [])
      .filter((hit) => hit && VOICES.some(({ id }) => id === hit.voice) &&
        Number.isFinite(hit.step) && hit.step >= 0 && hit.step < STEP_COUNT)
      .map((hit) => ({ voice: hit.voice, step: hit.step, velocity: Math.round(clamp(hit.velocity, 1, 2, 1)) }));
  }

  function timeAtStep(step, bpm, swing) {
    const straight = 60 / bpm / 4;
    const pair = Math.floor(step / 2);
    const remainder = step - pair * 2;
    const first = straight * (1 + swing / 100);
    return pair * straight * 2 + (remainder <= 1
      ? remainder * first : first + (remainder - 1) * straight * (1 - swing / 100));
  }

  function stepAtTime(time, bpm, swing) {
    const straight = 60 / bpm / 4;
    const pair = Math.floor(time / (straight * 2));
    const remainder = time - pair * straight * 2;
    const first = straight * (1 + swing / 100);
    return pair * 2 + (remainder <= first
      ? remainder / first : 1 + (remainder - first) / (straight * (1 - swing / 100)));
  }

  function createDefaultState() {
    const globalBpm = Number.parseFloat(localStorage.getItem("global.default_bpm"));
    return {
      mode: "pad",
      blink: false,
      snap: true,
      loop: false,
      metronome: false,
      countIn: 1,
      bpm: Number.isFinite(globalBpm) ? clamp(globalBpm, 30, 320, 120) : 120,
      swing: 0,
      volume: 80,
      sound: true,
      haptic: localStorage.getItem("global.haptics") === "true",
      timelineGuides: localStorage.getItem("global.guides") !== "false",
      length: STEP_COUNT,
      patternName: "basic",
      kitName: "classic",
      selectedVoice: "kick",
      pattern: clone(PATTERN_PRESETS.basic),
      freeHits: [],
      voices: clone(KIT_PRESETS.classic),
      mutes: { kick: false, snare: false, hat: false, perc: false }
    };
  }

  function normalizeState(rawState, useGlobalDefaults) {
    const defaults = createDefaultState();
    const raw = rawState && typeof rawState === "object" ? rawState : {};
    const globalBpm = Number.parseFloat(localStorage.getItem("global.default_bpm"));
    const patternNames = [...Object.keys(PATTERN_PRESETS), "custom"];
    const kitNames = [...Object.keys(KIT_PRESETS), "custom"];
    const voiceIds = VOICES.map(({ id }) => id);
    const mutes = {};

    VOICES.forEach(({ id }) => {
      mutes[id] = !!(raw.mutes && raw.mutes[id]);
    });

    return {
      mode: ["grid", "pad"].includes(raw.mode) ? raw.mode : defaults.mode,
      blink: raw.blink === undefined ? defaults.blink : !!raw.blink,
      snap: raw.snap === undefined ? defaults.snap : !!raw.snap,
      loop: raw.loop === undefined ? defaults.loop : !!raw.loop,
      metronome: raw.metronome === undefined ? defaults.metronome : !!raw.metronome,
      countIn: [0, 1, 2, 4].includes(raw.countIn) ? raw.countIn : defaults.countIn,
      bpm: useGlobalDefaults && Number.isFinite(globalBpm)
        ? clamp(globalBpm, 30, 320, defaults.bpm)
        : clamp(raw.bpm, 30, 320, defaults.bpm),
      swing: Math.round(clamp(raw.swing, 0, 50, defaults.swing)),
      volume: Math.round(clamp(raw.volume, 0, 100, defaults.volume)),
      sound: raw.sound === undefined ? defaults.sound : !!raw.sound,
      haptic: raw.haptic === undefined ? defaults.haptic : !!raw.haptic,
      timelineGuides: raw.timelineGuides === undefined ? defaults.timelineGuides : !!raw.timelineGuides,
      length: [4, 8, 12, 16].includes(Number(raw.length)) ? Number(raw.length) : defaults.length,
      patternName: patternNames.includes(raw.patternName) ? raw.patternName : defaults.patternName,
      kitName: kitNames.includes(raw.kitName) ? raw.kitName : defaults.kitName,
      selectedVoice: voiceIds.includes(raw.selectedVoice) ? raw.selectedVoice : defaults.selectedVoice,
      pattern: normalizePattern(raw.pattern),
      freeHits: normalizeFreeHits(raw.freeHits),
      voices: normalizeVoices(raw.voices),
      mutes
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return normalizeState(saved, true);
    } catch (_) {
      return createDefaultState();
    }
  }

  function normalizeRecordingEvent(event) {
    if (!event || typeof event !== "object") return null;
    const voice = VOICES.some((item) => item.id === event.voice) ? event.voice : null;
    if (!voice) return null;

    const timestampMs = Math.max(0, Number(event.timestampMs) || 0);
    const durationMs = Math.max(8, Number(event.durationMs) || 50);
    const velocity = Math.round(clamp(event.velocity, 1, 2, 1));
    const settings = normalizeVoices({ [voice]: event.settings })[voice];
    return { voice, velocity, timestampMs, durationMs, settings };
  }

  function normalizeRecording(recording, index = 0) {
    if (!recording || typeof recording !== "object") return null;
    const fixedDuration = recording.fixedDuration === true && Number.isFinite(recording.durationMs) && recording.durationMs > 0;
    const events = (Array.isArray(recording.events) ? recording.events : [])
      .map(normalizeRecordingEvent)
      .filter(Boolean)
      .filter((event) => !fixedDuration || event.timestampMs < recording.durationMs)
      .sort((left, right) => left.timestampMs - right.timestampMs);
    const hiddenEvents = (Array.isArray(recording.hiddenEvents) ? recording.hiddenEvents : [])
      .map(normalizeRecordingEvent).filter(Boolean)
      .filter((event) => fixedDuration && event.timestampMs >= recording.durationMs)
      .sort((left, right) => left.timestampMs - right.timestampMs);
    if (!events.length && !fixedDuration) return null;

    const eventEnd = Math.max(0, ...events.map((event) => event.timestampMs + event.durationMs));
    const createdAt = Number.isFinite(Number(recording.createdAt)) ? Number(recording.createdAt) : Date.now();
    const fallbackId = `${createdAt}-${index}`;
    return {
      id: String(recording.id || fallbackId),
      name: String(recording.name || `Recording ${index + 1}`).trim() || `Recording ${index + 1}`,
      createdAt,
      durationMs: fixedDuration ? recording.durationMs : Math.max(eventEnd, Number(recording.durationMs) || 0),
      ...(fixedDuration ? { fixedDuration: true } : {}),
      bpm: Math.round(clamp(recording.bpm, 30, 320, 120)),
      swing: Math.round(clamp(recording.swing, 0, 50, 0)),
      voices: normalizeVoices(recording.voices ||
        Object.fromEntries([...hiddenEvents, ...events].map((event) => [event.voice, event.settings]))),
      kitName: Object.hasOwn(KIT_PRESETS, recording.kitName) ? recording.kitName : "custom",
      patternName: Object.hasOwn(PATTERN_PRESETS, recording.patternName) ? recording.patternName : "custom",
      hiddenEvents,
      events
    };
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
    const channelData = [];

    for (let channel = 0; channel < channelCount; channel++) {
      channelData.push(audioBuffer.getChannelData(channel));
    }

    let cursor = 0;
    for (let frame = 0; frame < frameCount; frame++) {
      for (let channel = 0; channel < channelCount; channel++) {
        interleaved[cursor++] = channelData[channel][frame];
      }
    }

    const bytesPerSample = 2;
    const dataChunkSize = interleaved.length * bytesPerSample;
    const arrayBuffer = new ArrayBuffer(44 + dataChunkSize);
    const view = new DataView(arrayBuffer);

    writeStringToDataView(view, 0, "RIFF");
    view.setUint32(4, 36 + dataChunkSize, true);
    writeStringToDataView(view, 8, "WAVE");
    writeStringToDataView(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channelCount, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
    view.setUint16(32, channelCount * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeStringToDataView(view, 36, "data");
    view.setUint32(40, dataChunkSize, true);

    let offset = 44;
    for (let index = 0; index < interleaved.length; index++) {
      const sample = Math.max(-1, Math.min(1, interleaved[index]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += bytesPerSample;
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  function formatPekosoftTimestamp(date = new Date()) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
  }

  class DrumMachine {
    constructor() {
      this.state = loadState();
      this.timelineBright = localStorage.getItem("drum_machine.timeline_bright") === null
        ? (window.PekoBrightGuides?.getGlobal() || false)
        : localStorage.getItem("drum_machine.timeline_bright") === "true";
      const savedPlaylist = this.loadRecordingPlaylist();
      this.recordings = savedPlaylist.recordings;
      this.selectedRecordingIndex = savedPlaylist.selectedRecordingIndex;
      this.gridSource = savedPlaylist.gridSource;
      this.hitGesture = null;
      this.isPlaying = false;
      this.isRecording = false;
      this.isCountingIn = false;
      this.countInBeatsRemaining = 0;
      this.countInTotalBeats = 0;
      this.guideBeat = 0;
      this.nextGuideTime = 0;
      this.guideTimer = null;
      this.guideSources = new Set();
      this.isRecordingPlayback = false;
      this.playingRecordingIndex = -1;
      this.recordingStartTime = 0;
      this.recordingStartedAt = 0;
      this.recordingEvents = [];
      this.recordingSessionId = 0;
      this.recordingCaptureTimers = new Map();
      this.recordingWindowTimer = null;
      this.recordingPlaybackTimer = null;
      this.recordingPlayback = null;
      this.transportSessionId = 0;
      this.currentStep = -1;
      this.nextStep = 0;
      this.nextStepTime = 0;
      this.schedulerTimer = null;
      this.sequencerPlayback = null;
      this.visualTimers = new Set();
      this.voiceFlashTimers = new Map();
      this.activeSources = new Set();
      this.lastMetersActivitySec = 0;
      this.paintGesture = null;
      this.tapTimes = [];
      this.tapFlashTimer = null;
      this.timelineEvents = [];
      this.timelineAnimationFrame = null;

      this.elements = {
        grid: document.getElementById("sequencer-grid"),
        mode: document.getElementById("mode-button"),
        blink: document.getElementById("blink-button"),
        snap: document.getElementById("snap-button"),
        gridSource: document.getElementById("grid-source-button"),
        play: document.getElementById("play-button"),
        record: document.getElementById("record-button"),
        metronome: document.getElementById("metronome-button"),
        countIn: document.getElementById("count-in-select"),
        recordingStatus: document.getElementById("recording-status"),
        loop: document.getElementById("loop-button"),
        stop: document.getElementById("stop-button"),
        saveWav: document.getElementById("save-wav-button"),
        tap: document.getElementById("tap-button"),
        sound: document.getElementById("toggle-sound-button"),
        haptic: document.getElementById("haptic-button"),
        reset: document.getElementById("reset-button"),
        historyList: document.getElementById("pattern-history-list"),
        historyCode: document.getElementById("pattern-history-code"),
        historySort: document.getElementById("history-sort-button"),
        historyView: document.getElementById("history-view-button"),
        historyUndo: document.getElementById("history-undo-button"),
        historyRedo: document.getElementById("history-redo-button"),
        random: document.getElementById("random-button"),
        clear: document.getElementById("clear-button"),
        bpmInput: document.getElementById("bpm-input"),
        bpmSlider: document.getElementById("tempo-slider"),
        swingInput: document.getElementById("swing-input"),
        swingSlider: document.getElementById("swing-slider"),
        volumeSlider: document.getElementById("volume-slider"),
        patternSelect: document.getElementById("pattern-select"),
        kitSelect: document.getElementById("kit-select"),
        lengthSelect: document.getElementById("length-select"),
        voiceSelect: document.getElementById("voice-select"),
        pitchInput: document.getElementById("pitch-input"),
        decayInput: document.getElementById("decay-input"),
        toneInput: document.getElementById("tone-input"),
        levelInput: document.getElementById("level-input"),
        panInput: document.getElementById("pan-input"),
        pitchKnob: document.getElementById("pitch-knob"),
        decayKnob: document.getElementById("decay-knob"),
        toneKnob: document.getElementById("tone-knob"),
        levelKnob: document.getElementById("level-knob"),
        panKnob: document.getElementById("pan-knob"),
        timelineCanvas: document.getElementById("drum-roll"),
        timelineGuides: document.getElementById("timeline-guides-button"),
        timelineBright: document.getElementById("timeline-bright-button"),
        playlistItems: document.getElementById("recording-playlist-items"),
        playlistCount: document.getElementById("recording-playlist-count"),
        playlistDuration: document.getElementById("recording-playlist-duration"),
        playlistHits: document.getElementById("recording-playlist-hits"),
        playlistPrevious: document.getElementById("playlist-previous-button"),
        playlistNext: document.getElementById("playlist-next-button"),
        playlistClear: document.getElementById("playlist-clear-button"),
        playlistLoad: document.getElementById("playlist-load-button"),
        playlistSave: document.getElementById("playlist-save-button"),
        playlistFileInput: document.getElementById("playlist-file-input"),
        patternText: document.getElementById("pattern-text"),
        open: document.getElementById("open-button"),
        save: document.getElementById("save-button"),
        apply: document.getElementById("apply-button"),
        copy: document.getElementById("copy-button"),
        fileInput: document.getElementById("file-input")
      };

      this.history = new window.PekosoftHistory({
        list: this.elements.historyList,
        listContainer: document.getElementById("pattern-history-table"),
        codeView: this.elements.historyCode,
        sortButton: this.elements.historySort,
        viewButton: this.elements.historyView,
        undoButton: this.elements.historyUndo,
        redoButton: this.elements.historyRedo,
        initialLabel: "Initial pattern",
        initialIcon: "reset",
        sortStorageKey: "drum_machine.history_sort",
        viewStorageKey: "drum_machine.history_view",
        limit: 50,
        restore: (snapshot) => {
          this.restoreGridSnapshot(snapshot);
        }
      });
      this.setupControlsMenu();
      this.buildGrid();
        this.setupTimeline();
      this.setupAudio();
      this.bindEvents();
      this.updateAll();
        this.renderRecordingPlaylist();
      this.gridObserver = new ResizeObserver(() => this.renderGridHits());
      this.gridObserver.observe(this.elements.grid);

      window.addEventListener("pekosoft:global-defaults-change", (event) => {
          const defaults = event.detail;
          if (!defaults || !["bpm", "all"].includes(defaults.changed)) return;
          const bpm = defaults.bpm;
        if (Number.isFinite(bpm)) this.setBpm(bpm);
      });
    }

      loadRecordingPlaylist() {
        try {
          const saved = JSON.parse(localStorage.getItem(PLAYLIST_STORAGE_KEY) || "null");
          const source = Array.isArray(saved) ? saved : saved?.recordings;
          const recordings = (Array.isArray(source) ? source : [])
            .map(normalizeRecording)
            .filter(Boolean);
          const selectedId = Array.isArray(saved) ? null : saved?.selectedId;
          const selectedIndex = recordings.findIndex((recording) => recording.id === selectedId);
          return {
            recordings,
            gridSource: recordings.length && saved?.source !== "pattern" ? "recording" : "pattern",
            selectedRecordingIndex: selectedIndex >= 0 ? selectedIndex : (recordings.length ? recordings.length - 1 : -1)
          };
        } catch (error) {
          console.warn("Drum Machine recordings could not be loaded:", error);
          return { recordings: [], selectedRecordingIndex: -1, gridSource: "pattern" };
        }
      }

      saveRecordingPlaylist() {
        const selected = this.recordings[this.selectedRecordingIndex] || null;
        const data = {
          version: 1,
          source: this.gridSource,
          selectedId: selected?.id || null,
          recordings: this.recordings
        };
        try {
          localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
          this.reportStorageError("Recordings", error);
        }
      }

      reportStorageError(subject, error) {
        const status = document.querySelector('#controls-container [data-status-text]');
        if (status) status.textContent = `ERROR: ${subject} could not be saved.`;
        console.error(`Drum Machine ${subject.toLowerCase()} could not be saved:`, error);
      }

      formatRecordingDuration(durationMs) {
        const total = Math.max(0, Math.round(Number(durationMs) || 0));
        const minutes = Math.floor(total / 60000);
        const seconds = Math.floor((total % 60000) / 1000);
        const milliseconds = total % 1000;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(milliseconds).padStart(3, "0")}`;
      }

      formatRecordingAdded(timestamp) {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
      }

      drawRecordingPreview(canvas, recording) {
        const context = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;
        const rowHeight = height / VOICES.length;
        const styles = getComputedStyle(document.documentElement);
        context.clearRect(0, 0, width, height);
        context.fillStyle = styles.getPropertyValue("--color1").trim();

        recording.events.forEach((event) => {
          const row = VOICES.findIndex((item) => item.id === event.voice);
          if (row < 0) return;
          const x = recording.durationMs > 0 ? (event.timestampMs / recording.durationMs) * width : 0;
          const blockHeight = event.velocity === 2 ? rowHeight - 1 : Math.max(2, rowHeight * 0.55);
          const y = (row * rowHeight) + ((rowHeight - blockHeight) / 2);
          context.fillRect(Math.min(width - 1, x), y, 2, blockHeight);
        });
      }

      renderRecordingPlaylist() {
        if (!this.elements.playlistItems) return;
        this.elements.playlistItems.textContent = "";

        this.recordings.forEach((recording, index) => {
          const row = document.createElement("tr");
          row.dataset.index = String(index);
          row.classList.toggle("table-row-selected", index === this.selectedRecordingIndex);
          row.addEventListener("click", (event) => {
            if (event.target.closest("button")) return;
            this.selectRecording(index);
          });
          row.addEventListener("dblclick", () => this.startRecordingPlayback(index));

          const indexCell = document.createElement("td");
          indexCell.className = "recording-col-index";
          indexCell.textContent = String(index + 1);

          const nameCell = document.createElement("td");
          nameCell.className = "recording-col-name";
          nameCell.textContent = recording.name;
          nameCell.title = recording.name;

          const previewCell = document.createElement("td");
          previewCell.className = "recording-col-preview";
          const preview = document.createElement("canvas");
          preview.className = "recording-preview-canvas";
          preview.width = 160;
          preview.height = 24;
          preview.setAttribute("aria-label", `${recording.name} preview`);
          this.drawRecordingPreview(preview, recording);
          previewCell.appendChild(preview);

          const durationCell = document.createElement("td");
          durationCell.className = "recording-col-duration";
          durationCell.textContent = this.formatRecordingDuration(recording.durationMs);

          const hitsCell = document.createElement("td");
          hitsCell.className = "recording-col-hits";
          hitsCell.textContent = String(recording.events.length);

          const bpmCell = document.createElement("td");
          bpmCell.className = "recording-col-bpm";
          bpmCell.textContent = String(recording.bpm);

          const addedCell = document.createElement("td");
          addedCell.className = "recording-col-added";
          addedCell.textContent = this.formatRecordingAdded(recording.createdAt);

          const playCell = document.createElement("td");
          playCell.className = "recording-col-play";

          const playButton = document.createElement("button");
          playButton.type = "button";
          playButton.className = "square icon-only";
          playButton.classList.toggle("button-on", this.isRecordingPlayback && index === this.playingRecordingIndex);
          playButton.title = "Toggle recording playback";
          playButton.setAttribute("aria-label", `Play ${recording.name}`);
          playButton.innerHTML = '<svg class="icons" role="img"><use href="/icons.svg#play" /></svg>';
          playButton.addEventListener("click", () => this.toggleRecordingPlayback(index));

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "square icon-only";
          removeButton.title = "Remove recording";
          removeButton.setAttribute("aria-label", `Remove ${recording.name}`);
          removeButton.innerHTML = '<svg class="icons" role="img"><use href="/icons.svg#delete" /></svg>';
          removeButton.addEventListener("click", () => this.removeRecording(index));

          const removeCell = document.createElement("td");
          removeCell.className = "recording-col-remove";
          playCell.appendChild(playButton);
          removeCell.appendChild(removeButton);
          row.append(indexCell, nameCell, previewCell, durationCell, hitsCell, bpmCell, addedCell, playCell, removeCell);
          this.elements.playlistItems.appendChild(row);
        });

        const totalDuration = this.recordings.reduce((sum, recording) => sum + recording.durationMs, 0);
        const totalHits = this.recordings.reduce((sum, recording) => sum + recording.events.length, 0);
        this.elements.playlistCount.textContent = String(this.recordings.length);
        this.elements.playlistDuration.textContent = this.formatRecordingDuration(totalDuration);
        this.elements.playlistHits.textContent = String(totalHits);
        this.updateRecordingControls();
      }

      selectRecording(index) {
        if (this.isRecording || this.isCountingIn) return;
        if (index < 0 || index >= this.recordings.length) return;
        if (this.gridSource === "pattern" || this.isPlaying) this.pausePlayback(true);
        if (index !== this.selectedRecordingIndex ||
            (this.isRecordingPlayback && index !== this.playingRecordingIndex)) {
          this.stopRecordingPlayback();
        }
        this.selectedRecordingIndex = index;
        this.gridSource = "recording";
        this.refreshGrid();
        this.saveRecordingPlaylist();
        this.renderRecordingPlaylist();
      }

      removeRecording(index) {
        if (index < 0 || index >= this.recordings.length) return;
        if (index === this.playingRecordingIndex || !this.isRecordingPlayback) this.stopRecordingPlayback();
        this.recordings.splice(index, 1);
        if (index < this.playingRecordingIndex) this.playingRecordingIndex--;
        if (!this.recordings.length) {
          this.selectedRecordingIndex = -1;
        } else if (index < this.selectedRecordingIndex) {
          this.selectedRecordingIndex--;
        } else if (this.selectedRecordingIndex >= this.recordings.length) {
          this.selectedRecordingIndex = this.recordings.length - 1;
        }
        if (!this.recordings.length) this.gridSource = "pattern";
        this.refreshGrid();
        this.saveRecordingPlaylist();
        this.renderRecordingPlaylist();
      }

      clearRecordingPlaylist() {
        if (!this.recordings.length) return;
        if (!confirm("Clear all Drum Machine recordings?")) return;
        this.stopRecordingPlayback();
        this.recordings = [];
        this.selectedRecordingIndex = -1;
        this.gridSource = "pattern";
        this.refreshGrid();
        this.saveRecordingPlaylist();
        this.renderRecordingPlaylist();
      }

      playAdjacentRecording(direction) {
        if (!this.recordings.length) return;
        const start = this.selectedRecordingIndex >= 0 ? this.selectedRecordingIndex : 0;
        const index = (start + direction + this.recordings.length) % this.recordings.length;
        this.startRecordingPlayback(index);
      }

      exportRecordingPlaylist() {
        if (!this.recordings.length) return;
        const data = JSON.stringify({ release: "drum_machine", version: 1, recordings: this.recordings }, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = window.ensurePekosoftFilename("drum_machine_recordings.json");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      async importRecordingPlaylist() {
        const file = this.elements.playlistFileInput.files[0];
        if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          const source = Array.isArray(data) ? data : data?.recordings;
          if (!Array.isArray(source)) throw new Error("Recordings array is missing");
          const imported = source.map(normalizeRecording).filter(Boolean);
          if (!imported.length) throw new Error("No valid recordings found");
          this.stopAll(true);
          this.recordings = imported;
          this.selectedRecordingIndex = 0;
          this.gridSource = "recording";
          this.refreshGrid();
          this.saveRecordingPlaylist();
          this.renderRecordingPlaylist();
        } catch (error) {
          console.warn("Drum Machine recordings could not be imported:", error);
        } finally {
          this.elements.playlistFileInput.value = "";
        }
      }

    setupAudio() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.channelCountMode = "explicit";
      this.analyser.channelCount = 2;
      this.channelSplitter = this.audioContext.createChannelSplitter(2);
      this.analyserLeft = this.audioContext.createAnalyser();
      this.analyserRight = this.audioContext.createAnalyser();
      this.analyserLeft.fftSize = 2048;
      this.analyserRight.fftSize = 2048;
      this.analyser.connect(this.channelSplitter);
      this.channelSplitter.connect(this.analyserLeft, 0);
      this.channelSplitter.connect(this.analyserRight, 1);
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.008;
      this.compressor.release.value = 0.18;
      this.masterGain = this.audioContext.createGain();
      this.analyser.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      this.guideGain = this.audioContext.createGain();
      this.guideGain.gain.value = 0.4;
      this.guideGain.connect(this.masterGain);
      this.applyMasterGain();
      window.addEventListener('pekosoft:global-sound-change', () => this.applyMasterGain());

      window.__pekosoftMetersSource = {
        analyser: this.analyser,
        analyserLeft: this.analyserLeft,
        analyserRight: this.analyserRight,
        channelCount: 2,
        sampleRate: this.audioContext.sampleRate,
        isActive: () => {
          return this.isPlaying || this.isRecordingPlayback || (this.audioContext.currentTime - this.lastMetersActivitySec) < 0.25;
        }
      };
    }

    async ensureAudioReady() {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    }

    applyMasterGain() {
      if (!this.masterGain || !this.audioContext) return;
      const now = this.audioContext.currentTime;
      const globalSoundOn = localStorage.getItem('global.sound') !== 'false';
      const gain = this.state.sound && globalSoundOn ? this.state.volume / 100 : 0;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(gain, now);
    }

    setupTimeline() {
      this.timelineContext = this.elements.timelineCanvas.getContext("2d");
      this.elements.timelineGuides.addEventListener("click", () => {
        this.state.timelineGuides = !this.state.timelineGuides;
        this.saveState();
        this.updateTimelineButton();
        this.updatePanel();
      });
      this.elements.timelineBright.addEventListener("click", () => {
        this.timelineBright = !this.timelineBright;
        localStorage.setItem("drum_machine.timeline_bright", String(this.timelineBright));
        this.updateTimelineButton();
      });
      window.addEventListener("pekosoft:bright-guides-global-change", (event) => {
        this.timelineBright = !!event.detail?.enabled;
        this.updateTimelineButton();
      });
      this.drawTimeline();
    }

    syncTimelineCanvas() {
      const canvas = this.elements.timelineCanvas;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return null;

      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      this.timelineContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width, height };
    }

    drawTimeline() {
      this.timelineAnimationFrame = requestAnimationFrame(() => this.drawTimeline());
      const size = this.syncTimelineCanvas();
      if (!size) return;

      const { width, height } = size;
      const context = this.timelineContext;
      const now = performance.now();
      const windowStart = now - TIMELINE_WINDOW_MS;
      const rowHeight = height / VOICES.length;
      const rootStyles = getComputedStyle(document.documentElement);
      const primaryColor = rootStyles.getPropertyValue("--color1").trim();
      const guideColor = this.timelineBright ? "#fff" : rootStyles.getPropertyValue("--grey1").trim();

      this.timelineEvents = this.timelineEvents.filter((event) => event.endTime >= windowStart);
      context.clearRect(0, 0, width, height);

      if (this.state.timelineGuides) {
        context.lineWidth = 1;
        context.strokeStyle = guideColor;
        for (let row = 0; row <= VOICES.length; row++) {
          const y = Math.min(height - 0.5, Math.max(0.5, row * rowHeight));
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(width, y);
          context.stroke();
        }
        if (this.timelineBright) {
          context.beginPath();
          context.moveTo(0.5, 0.5);
          context.lineTo(width - 0.5, 0.5);
          context.lineTo(width - 0.5, height - 0.5);
          context.lineTo(0.5, height - 0.5);
          context.closePath();
          context.stroke();
        }
      }

      context.fillStyle = primaryColor;
      this.timelineEvents.forEach((event) => {
        if (event.startTime > now) return;

        const eventStart = Math.max(event.startTime, windowStart);
        const eventEnd = Math.min(event.endTime, now);
        if (eventEnd <= eventStart) return;

        const x = ((eventStart - windowStart) / TIMELINE_WINDOW_MS) * width;
        const eventWidth = ((eventEnd - eventStart) / TIMELINE_WINDOW_MS) * width;
        const row = VOICES.findIndex(({ id }) => id === event.voice);
        const blockHeight = Math.max(6, rowHeight * (event.velocity === 2 ? 0.58 : 0.34));
        const y = (row * rowHeight) + ((rowHeight - blockHeight) / 2);
        context.fillRect(x, y, Math.max(3, eventWidth), blockHeight);
      });
    }

    recordTimelineHit(voice, velocity, when, stopTime, settings, minimumDurationMs = 40) {
      const delayMs = Math.max(0, (when - this.audioContext.currentTime) * 1000);
      const durationMs = Math.max(minimumDurationMs, (stopTime - when) * 1000);
      const startTime = performance.now() + delayMs;
      const event = {
        voice,
        velocity,
        startTime,
        endTime: startTime + durationMs,
        settings: { ...settings }
      };
      this.timelineEvents.push(event);
      return event;
    }

    setupControlsMenu() {
      const menu = document.getElementById("voice-menu-controls");
      const values = document.getElementById("voice-menu-values");
      const panel = document.getElementById("controls-icon-panel");
      [this.elements.kitSelect, this.elements.voiceSelect, this.elements.pitchInput,
        this.elements.decayInput, this.elements.toneInput, this.elements.levelInput,
        this.elements.panInput].forEach((input) => values.appendChild(input.closest(".pair")));
      menu.appendChild(this.elements.pitchKnob.closest(".controls-knobs"));
      panel.appendChild(menu);
      menu.hidden = false;
    }

    getGridRecording() {
      return this.gridSource === "pattern" ? null : this.recordings?.[this.selectedRecordingIndex] || null;
    }

    getSourceSettings() {
      return this.getGridRecording() || this.state;
    }

    getSourceVoices() {
      return this.getSourceSettings().voices || this.state.voices;
    }

    setRecordingWindow(recording, durationMs) {
      const events = [...recording.events, ...(recording.hiddenEvents || [])]
        .sort((left, right) => left.timestampMs - right.timestampMs);
      recording.durationMs = durationMs;
      recording.fixedDuration = true;
      recording.events = events.filter((event) => event.timestampMs < durationMs);
      recording.hiddenEvents = events.filter((event) => event.timestampMs >= durationMs);
    }

    getGridLength() {
      const recording = this.getGridRecording();
      return recording
        ? Math.max(1, Math.ceil(stepAtTime(recording.durationMs / 1000, recording.bpm, recording.swing) - 1e-8))
        : this.state.length;
    }

    getPatternHits() {
      const hits = [];
      VOICES.forEach(({ id }) => this.state.pattern[id].forEach((velocity, step) => {
        if (velocity) hits.push({ key: `step:${id}:${step}`, voice: id, step, velocity });
      }));
      (this.state.freeHits || []).forEach((hit, index) => hits.push({ ...hit, key: `free:${index}` }));
      return hits.sort((left, right) => left.step - right.step);
    }

    getGridHits() {
      if (this.isRecording) return this.recordingEvents.map((event, index) => ({
        key: `capture:${index}`, voice: event.voice, velocity: event.velocity,
        step: stepAtTime(event.timestampMs / 1000, this.recordingSettings.bpm, this.recordingSettings.swing)
      }));
      const recording = this.getGridRecording();
      return recording ? recording.events.map((event, index) => ({
        key: `recording:${index}`, voice: event.voice, velocity: event.velocity,
        step: stepAtTime(event.timestampMs / 1000, recording.bpm, recording.swing)
      })) : this.getPatternHits().filter((hit) => hit.step < this.state.length);
    }

    refreshGrid() {
      const focused = document.activeElement;
      const selector = focused?.matches(".grid-hit") ? `.grid-hit[data-hit="${focused.dataset.hit}"]`
        : focused?.matches(".step-button") ? `.step-button[data-voice="${focused.dataset.voice}"][data-step="${focused.dataset.step}"]` : null;
      this.hitGesture = null;
      const recording = this.getGridRecording();
      if (recording ? this.recordingPlayback?.recording.id !== recording.id : !this.isPlaying) this.currentStep = -1;
      this.buildGrid();
      this.updateAll();
      if (selector) this.elements.grid.querySelector(selector)?.focus({ preventScroll: true });
    }

    positionGridHit(button, hit) {
      const bankIndex = Math.floor(hit.step / 8);
      const bank = this.elements.grid.querySelector(`.sequence-bank[data-bank="${bankIndex}"]`);
      const first = bank?.querySelector(`.step-button[data-voice="${hit.voice}"]`);
      if (!first) return;
      const second = first.nextElementSibling;
      const bounds = first.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const bankBounds = bank.getBoundingClientRect();
      const pitch = second.getBoundingClientRect().left - bounds.left;
      bank.appendChild(button);
      const left = bounds.left - bankBounds.left + (hit.step % 8) * pitch;
      button.style.left = `${Math.min(bankBounds.width - bounds.width, left)}px`;
      button.style.top = `${bounds.top - bankBounds.top}px`;
      button.style.width = `${bounds.width}px`;
      button.style.height = `${bounds.height}px`;
    }

    renderGridHits() {
      if (this.hitGesture) return;
      const focusedKey = document.activeElement?.dataset.hit;
      this.elements.grid.querySelectorAll(".grid-hit").forEach((hit) => hit.remove());
      if (this.state.mode === "pad") return;
      this.getGridHits().forEach((hit) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `grid-hit square velocity-${hit.velocity}`;
        button.dataset.hit = hit.key;
        button.dataset.step = String(Math.floor(hit.step));
        button.classList.toggle("current-step", Math.floor(hit.step) === this.currentStep);
        button.classList.toggle("muted-hit", this.state.mutes[hit.voice]);
        const mark = document.createElement("span");
        mark.className = "step-mark";
        mark.setAttribute("aria-hidden", "true");
        button.appendChild(mark);
        const recording = this.isRecording ? this.recordingSettings : this.getGridRecording();
        const time = timeAtStep(hit.step, recording?.bpm || this.state.bpm, recording?.swing ?? this.state.swing);
        const label = `${hit.voice}, ${(time * 1000).toFixed(3)} ms, ${hit.velocity === 2 ? "accent" : "normal"}`;
        button.title = label;
        button.setAttribute("aria-label", label);
        button.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown Delete Enter");
        button.disabled = this.isRecording || this.isCountingIn;
        this.positionGridHit(button, hit);
      });
      if (focusedKey) this.elements.grid.querySelector(`.grid-hit[data-hit="${focusedKey}"]`)?.focus({ preventScroll: true });
    }

    getGridPoint(x, y) {
      const banks = [...this.elements.grid.querySelectorAll(".sequence-bank")];
      const bank = banks.find((element) => {
        const bounds = element.getBoundingClientRect();
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
      });
      if (!bank) return null;
      const first = bank.querySelector(".step-button");
      const bounds = first.getBoundingClientRect();
      const pitch = first.nextElementSibling.getBoundingClientRect().left - bounds.left;
      if (!pitch) return null;
      const voice = VOICES.find(({ id }) => {
        const row = bank.querySelector(`.step-button[data-voice="${id}"]`).getBoundingClientRect();
        return y >= row.top && y <= row.bottom;
      });
      if (!voice) return null;
      return {
        voice: voice.id,
        step: Number(bank.dataset.bank) * 8 + Math.max(0, Math.min(7.999999, (x - bounds.left) / pitch))
      };
    }

    constrainHitStep(step) {
      const recording = this.getGridRecording();
      const end = recording
        ? stepAtTime(Math.max(0, recording.durationMs - 0.001) / 1000, recording.bpm, recording.swing)
        : this.state.length - 0.000001;
      return this.state.snap
        ? Math.max(0, Math.min(Math.floor(end), Math.round(step)))
        : Math.max(0, Math.min(end, step));
    }

    editGridHit(key, voice, step, velocity) {
      if (this.isRecording || this.isCountingIn) return;
      const before = this.patternSnapshot();
      const recording = this.getGridRecording();
      if (recording) {
        const index = key === null ? -1 : Number(key.split(":")[1]);
        const existing = recording.events[index];
        const settings = existing?.voice === voice ? existing.settings : { ...this.getSourceVoices()[voice] };
        if (index >= 0) recording.events.splice(index, 1);
        if (velocity) recording.events.push({
          ...existing,
          durationMs: existing?.voice === voice ? existing.durationMs : Math.max(8, settings.decay * 1000),
          voice, velocity, settings,
          timestampMs: timeAtStep(step, recording.bpm, recording.swing) * 1000
        });
        recording.events.sort((left, right) => left.timestampMs - right.timestampMs);
        recording.fixedDuration = true;
      } else {
        if (key?.startsWith("step:")) {
          const [, oldVoice, oldStep] = key.split(":");
          this.state.pattern[oldVoice][Number(oldStep)] = 0;
        } else if (key?.startsWith("free:")) {
          this.state.freeHits.splice(Number(key.split(":")[1]), 1);
        }
        if (velocity) {
          if (Number.isInteger(step) && !this.state.pattern[voice][step]) this.state.pattern[voice][step] = velocity;
          else this.state.freeHits.push({ voice, step, velocity });
        }
      }
      this.commitPatternChange(before, true, velocity ? "Edited hit" : "Removed hit", "pen");
    }

    cancelScheduledHit(hit) {
      hit.sources.forEach((source) => {
        try {
          source.stop(this.audioContext.currentTime);
        } catch (_) {
          // Source may already have ended.
        }
        this.activeSources.delete(source);
      });
      hit.visualTimers.forEach((timer) => {
        window.clearTimeout(timer);
        this.visualTimers.delete(timer);
      });
      window.clearTimeout(hit.captureTimer);
      this.recordingCaptureTimers.delete(hit.captureTimer);
      if (hit.timelineEvent) this.timelineEvents = this.timelineEvents.filter((event) => event !== hit.timelineEvent);
    }

    refreshScheduledHits() {
      const now = this.audioContext?.currentTime;
      if (!Number.isFinite(now)) return;
      const recording = this.getGridRecording();
      const playback = this.recordingPlayback;
      if (recording && playback?.recording.id === recording.id) {
        playback.recording = recording;
        playback.duration = Math.max(8, recording.durationMs) / 1000;
        playback.pending = playback.pending.filter((hit) => {
          if (hit.when <= now) return true;
          this.cancelScheduledHit(hit);
          return false;
        });
        playback.cycle = Math.max(0, Math.floor((now - playback.startTime) / playback.duration));
        playback.eventIndex = 0;
        playback.skipThrough = now;
        window.clearTimeout(this.recordingPlaybackTimer);
        this.scheduleRecordingPlayback();
      } else if (!recording && this.sequencerPlayback) {
        const hits = this.getPatternHits().filter((hit) => hit.step < this.state.length);
        this.sequencerPlayback.pending.forEach((pending) => {
          pending.scheduledHits = pending.scheduledHits.filter((hit) => {
            if (hit.when <= now) return true;
            this.cancelScheduledHit(hit);
            return false;
          });
          pending.sources = pending.scheduledHits.flatMap((hit) => hit.sources);
          pending.captureTimers = pending.scheduledHits.map((hit) => hit.captureTimer);
          pending.timelineEvents = pending.scheduledHits.map((hit) => hit.timelineEvent).filter(Boolean);
          pending.visualTimers = pending.visualTimers.filter((timer) => this.visualTimers.has(timer));
          pending.freeHits = hits.filter((hit) => Math.floor(hit.step) === pending.step)
            .map((hit) => ({ ...hit, when: pending.when + (hit.step - pending.step) * pending.duration }))
            .filter((hit) => hit.when > now);
          this.scheduleFreeHits(pending);
        });
      }
    }

    restoreGridSnapshot(snapshot) {
      const data = JSON.parse(snapshot);
      if (this.isRecording || this.isCountingIn) this.stopAll(false);
      const current = this.getSourceSettings();
      const target = data.recording || data;
      const timingChanged = target.id !== current.id ||
        ["bpm", "swing", data.recording ? "durationMs" : "length"]
          .some((property) => target[property] !== undefined && target[property] !== current[property]);
      const wasPlaying = this.isPlaying || this.isRecordingPlayback;
      if (timingChanged) {
        this.pausePlayback(true);
        this.stopRecordingPlayback();
      }
      if (data.recording) {
        const index = this.recordings.findIndex((recording) => recording.id === data.recording.id);
        if (index < 0) {
          this.elements.recordingStatus.textContent = "Recording is no longer available.";
          console.warn("Drum Machine history recording is no longer in Playlist:", data.recording.id);
          return;
        }
        this.recordings[index] = data.recording;
        this.selectedRecordingIndex = index;
        this.gridSource = "recording";
        this.saveRecordingPlaylist();
      } else {
        this.gridSource = "pattern";
        this.state.pattern = normalizePattern(data.pattern || data);
        this.state.freeHits = normalizeFreeHits(data.freeHits);
        for (const property of ["length", "bpm", "swing", "voices", "kitName", "patternName"]) {
          if (data[property] !== undefined) this.state[property] = data[property];
        }
        this.saveState();
      }
      this.refreshScheduledHits();
      this.refreshGrid();
      this.renderRecordingPlaylist();
      if (timingChanged && wasPlaying) return this.togglePlayback();
    }

    buildGrid() {
      this.elements.grid.textContent = "";

      const length = this.getGridLength();
      for (let bankIndex = 0; bankIndex < Math.max(2, Math.ceil(length / 8)); bankIndex++) {
        const bank = document.createElement("div");
        bank.className = "sequence-bank";
        bank.dataset.bank = String(bankIndex);
        bank.classList.toggle("bank-continuation", bankIndex % 2 === 1);

        const voiceSpacer = document.createElement("div");
        voiceSpacer.className = "sequence-heading bank-leading";
        voiceSpacer.setAttribute("aria-hidden", "true");
        bank.appendChild(voiceSpacer);

        const muteHeading = document.createElement("div");
        muteHeading.className = "sequence-heading bank-leading";
        muteHeading.setAttribute("aria-hidden", "true");
        bank.appendChild(muteHeading);

        for (let localStep = 0; localStep < 8; localStep++) {
          const step = (bankIndex * 8) + localStep;
          const number = document.createElement("div");
          number.className = "step-number" + (step % 4 === 0 ? " beat-start" : "");
          number.textContent = String(step + 1);
          bank.appendChild(number);
        }

        VOICES.forEach(({ id, label, key }, index) => {
          const trigger = document.createElement("button");
          trigger.type = "button";
          trigger.className = "voice-trigger pad bank-leading";
          trigger.dataset.voice = id;
          const iconId = VOICE_ICONS[id];
          trigger.innerHTML = iconId
            ? `<svg class="voice-icon" viewBox="0 0 512 512" aria-hidden="true"><use href="/icons.svg#${iconId}" /></svg>`
            : label;
          const shortcut = document.createElement("kbd");
          shortcut.className = "voice-shortcut";
          shortcut.textContent = key;
          shortcut.setAttribute("aria-hidden", "true");
          trigger.appendChild(shortcut);
          trigger.title = `Play ${label.toLowerCase()} (${key} / ${index + 1})`;
          trigger.setAttribute("aria-label", trigger.title);
          trigger.setAttribute("aria-keyshortcuts", `${key.toLowerCase()} ${index + 1}`);
          bank.appendChild(trigger);

          const mute = document.createElement("button");
          mute.type = "button";
          mute.className = "voice-mute pad bank-leading";
          mute.dataset.voice = id;
          mute.title = `Toggle sound ${label.toLowerCase()}`;
          mute.setAttribute("aria-label", `Toggle sound ${label.toLowerCase()}`);
          mute.innerHTML = '<svg class="icons" role="img"><use href="/icons.svg#sound" /></svg>';
          bank.appendChild(mute);

          for (let localStep = 0; localStep < 8; localStep++) {
            const step = (bankIndex * 8) + localStep;
            const button = document.createElement("button");
            button.type = "button";
            button.className = "step-button pad" + (step % 4 === 0 ? " beat-start" : "");
            button.dataset.voice = id;
            button.dataset.step = String(step);
            button.innerHTML = '<span class="step-mark" aria-hidden="true"></span>';
            bank.appendChild(button);
          }
        });

        this.elements.grid.appendChild(bank);
      }
    }

    bindEvents() {
      this.elements.mode.addEventListener("click", () => {
        this.state.mode = this.state.mode === "grid" ? "pad" : "grid";
        this.saveAndRender();
      });
      this.elements.blink.addEventListener("click", () => {
        this.state.blink = !this.state.blink;
        this.saveState();
        this.updateToggleButtons();
        this.updatePanel();
      });
      this.elements.snap.addEventListener("click", () => {
        this.state.snap = !this.state.snap;
        this.saveState();
        this.updateToggleButtons();
        this.updatePanel();
      });
      this.elements.gridSource.addEventListener("click", () => {
        if (this.isRecording || this.isCountingIn) return;
        this.pausePlayback(true);
        this.stopRecordingPlayback();
        this.gridSource = this.getGridRecording() ? "pattern" : "recording";
        this.setCurrentStep(-1);
        this.saveRecordingPlaylist();
        this.refreshGrid();
      });
      this.elements.grid.addEventListener("pointerdown", (event) => this.handleGridPointerDown(event));
      this.elements.grid.addEventListener("click", (event) => this.handleGridClick(event));
      this.elements.grid.addEventListener("keydown", (event) => this.handleGridKeyDown(event));
      document.addEventListener("pointermove", (event) => this.handlePaintMove(event), { passive: false });
      document.addEventListener("pointerup", (event) => this.endPaintGesture(event), true);
      document.addEventListener("pointercancel", (event) => this.endPaintGesture(event), true);

      this.elements.play.addEventListener("click", () => this.togglePlayback());
      this.elements.record.addEventListener("click", () => this.toggleRecording());
      this.elements.metronome.addEventListener("click", () => {
        this.state.metronome = !this.state.metronome;
        if (!this.state.metronome && !this.isCountingIn) this.stopGuide();
        this.startGuide();
        this.saveState();
        this.updateToggleButtons();
        this.updatePanel();
      });
      this.elements.countIn.addEventListener("change", () => {
        const bars = Number(this.elements.countIn.value);
        this.state.countIn = [0, 1, 2, 4].includes(bars) ? bars : 1;
        this.saveState();
        this.updatePanel();
      });
      this.elements.loop.addEventListener("click", () => this.toggleRecordingLoop());
      this.elements.stop.addEventListener("click", () => this.stopAll(true));
      this.elements.saveWav.addEventListener("click", () => this.savePatternAsWav());
      this.elements.tap.addEventListener("click", () => this.tapTempo());
      this.elements.sound.addEventListener("click", () => {
        this.state.sound = !this.state.sound;
        this.applyMasterGain();
        this.saveState();
        this.updateToggleButtons();
        this.updatePanel();
      });
      this.elements.haptic.addEventListener("click", () => {
        this.state.haptic = !this.state.haptic;
        this.saveState();
        this.updateToggleButtons();
        this.updatePanel();
      });
      this.elements.reset.addEventListener("click", () => this.reset());

      this.elements.playlistPrevious.addEventListener("click", () => this.playAdjacentRecording(-1));
      this.elements.playlistNext.addEventListener("click", () => this.playAdjacentRecording(1));
      this.elements.playlistClear.addEventListener("click", () => this.clearRecordingPlaylist());
      this.elements.playlistLoad.addEventListener("click", () => this.elements.playlistFileInput.click());
      this.elements.playlistSave.addEventListener("click", () => this.exportRecordingPlaylist());
      this.elements.playlistFileInput.addEventListener("change", () => this.importRecordingPlaylist());

      this.elements.random.addEventListener("click", () => this.randomizePattern());
      this.elements.clear.addEventListener("click", () => this.clearPattern());

      this.elements.bpmInput.addEventListener("change", () => this.setBpm(this.elements.bpmInput.value));
      this.elements.bpmSlider.addEventListener("input", () => this.setBpm(this.elements.bpmSlider.value));
      this.elements.swingInput.addEventListener("change", () => this.setSwing(this.elements.swingInput.value));
      this.elements.swingSlider.addEventListener("input", () => this.setSwing(this.elements.swingSlider.value));
      this.elements.volumeSlider.addEventListener("input", () => this.setVolume(this.elements.volumeSlider.value));

      window.bindPekosoftRangeButtons(
        this.elements.bpmSlider,
        document.getElementById("tempo-decrease-button"),
        document.getElementById("tempo-increase-button")
      );
      window.bindPekosoftRangeButtons(
        this.elements.swingSlider,
        document.getElementById("swing-decrease-button"),
        document.getElementById("swing-increase-button")
      );
      window.bindPekosoftRangeButtons(
        this.elements.volumeSlider,
        document.getElementById("volume-decrease-button"),
        document.getElementById("volume-increase-button")
      );

      this.elements.patternSelect.addEventListener("change", () => {
        if (PATTERN_PRESETS[this.elements.patternSelect.value]) {
          this.loadPatternPreset(this.elements.patternSelect.value);
        }
      });
      this.elements.kitSelect.addEventListener("change", () => {
        if (KIT_PRESETS[this.elements.kitSelect.value]) {
          this.loadKitPreset(this.elements.kitSelect.value);
        }
      });
      this.elements.lengthSelect.addEventListener("change", () => this.setLength(this.elements.lengthSelect.value));
      this.elements.voiceSelect.addEventListener("change", () => {
        this.state.selectedVoice = this.elements.voiceSelect.value;
        this.saveState();
        this.updateGrid();
        this.updateVoiceFields();
        this.updatePanel();
      });

      VOICE_PARAMETERS.forEach(([name, property, scale]) => {
        const input = this.elements[`${name}Input`];
        const knob = this.elements[`${name}Knob`];
        const set = (value) => this.setVoiceParameter(property, value * scale);
        input.addEventListener("change", () => this.setVoiceParameter(property, Number(input.value) * scale));
        bindKnobControl(knob, {
          get: () => Number(input.value),
          nudge: (direction) => set(Number(input.value) + direction * Number(input.step)),
          drag: (start, delta) => set(Math.round(start + delta * (Number(input.max) - Number(input.min)) / 270)),
          home: () => set(Number(input.min)),
          end: () => set(Number(input.max)),
          reset: () => this.setVoiceParameter(property, KIT_PRESETS.classic[this.state.selectedVoice][property])
        });
      });

      this.elements.open.addEventListener("click", () => this.elements.fileInput.click());
      this.elements.fileInput.addEventListener("change", () => this.openPatternFile());
      this.elements.save.addEventListener("click", () => this.savePatternFile());
      this.elements.apply.addEventListener("click", () => this.applyPatternText());
      this.elements.copy.addEventListener("click", () => this.copyPatternText());
      this.elements.patternText.addEventListener("input", () => {
        this.elements.patternText.classList.remove("pattern-error");
      });

      document.addEventListener("keydown", (event) => this.handleGlobalKeyDown(event));
      window.addEventListener("pagehide", () => this.stopAll(false));
    }

    handleGridPointerDown(event) {
      const trigger = event.target.closest(".voice-trigger");
      if (this.state.mode === "pad" && trigger && event.button === 0) {
        event.preventDefault();
        this.selectVoice(trigger.dataset.voice);
        this.auditionVoice(trigger.dataset.voice);
        return;
      }

      const hitButton = event.target.closest(".grid-hit");
      const stepButton = event.target.closest(".step-button");
      if (event.button === 0 && !this.isRecording && !this.isCountingIn &&
          (hitButton || (stepButton && !stepButton.disabled && (!this.state.snap || this.getGridRecording())))) {
        event.preventDefault();
        const point = this.getGridPoint(event.clientX, event.clientY);
        if (!point) return;
        const hit = hitButton ? this.getGridHits().find((item) => item.key === hitButton.dataset.hit) : null;
        this.hitGesture = {
          pointerId: event.pointerId, key: hit?.key ?? null, button: hitButton,
          startX: event.clientX, startY: event.clientY, moved: false,
          offset: hit ? point.step - hit.step : 0,
          voice: hit?.voice || point.voice,
          step: hit?.step ?? (this.state.snap ? Number(stepButton.dataset.step) : this.constrainHitStep(point.step)),
          velocity: hit?.velocity || 1
        };
        return;
      }

      const button = event.target.closest(".step-button");
      if (!button || button.disabled || event.button !== 0 || this.isRecording || this.isCountingIn) return;

      event.preventDefault();
      const voice = button.dataset.voice;
      const step = Number(button.dataset.step);
      const value = (this.state.pattern[voice][step] + 1) % 3;
      this.paintGesture = {
        pointerId: event.pointerId,
        before: this.patternSnapshot(),
        value,
        visited: new Set()
      };
      this.paintStep(button);
    }

    handlePaintMove(event) {
      if (this.hitGesture && event.pointerId === this.hitGesture.pointerId) {
        event.preventDefault();
        const gesture = this.hitGesture;
        if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) < 4 && !gesture.moved) return;
        const point = this.getGridPoint(event.clientX, event.clientY);
        if (!point) return;
        gesture.moved = true;
        gesture.voice = point.voice;
        gesture.step = this.constrainHitStep(point.step - gesture.offset);
        if (gesture.button) this.positionGridHit(gesture.button, gesture);
        return;
      }
      if (!this.paintGesture || event.pointerId !== this.paintGesture.pointerId) return;
      event.preventDefault();
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const button = target ? target.closest(".step-button") : null;
      if (button && !button.disabled) this.paintStep(button);
    }

    paintStep(button) {
      const voice = button.dataset.voice;
      const step = Number(button.dataset.step);
      const key = `${voice}:${step}`;
      if (this.paintGesture.visited.has(key)) return;

      this.paintGesture.visited.add(key);
      this.state.pattern[voice][step] = this.paintGesture.value;
      this.updateStepButton(button, voice, step);
      this.refreshScheduledHits();
      this.renderGridHits();
    }

    endPaintGesture(event) {
      if (this.hitGesture && event.pointerId === this.hitGesture.pointerId) {
        const gesture = this.hitGesture;
        this.hitGesture = null;
        if (event.type === "pointercancel") {
          this.renderGridHits();
          return;
        }
        const velocity = gesture.key && !gesture.moved ? (gesture.velocity + 1) % 3 : gesture.velocity;
        this.editGridHit(gesture.key, gesture.voice, gesture.step, velocity);
        return;
      }
      if (!this.paintGesture || event.pointerId !== this.paintGesture.pointerId) return;
      const before = this.paintGesture.before;
      const changedSteps = this.paintGesture.visited.size;
      this.paintGesture = null;
      const label = changedSteps === 1 ? "Changed step" : `Painted ${changedSteps} steps`;
      this.commitPatternChange(before, true, label, "pen");
    }

    handleGridClick(event) {
      const trigger = event.target.closest(".voice-trigger");
      if (trigger) {
        if (this.state.mode === "pad" && event.detail !== 0) return;
        this.selectVoice(trigger.dataset.voice);
        this.auditionVoice(trigger.dataset.voice);
        return;
      }

      const mute = event.target.closest(".voice-mute");
      if (mute) {
        const voice = mute.dataset.voice;
        this.state.mutes[voice] = !this.state.mutes[voice];
        this.saveState();
        this.updateGrid();
        this.updatePanel();
      }
    }

    handleGridKeyDown(event) {
      const hitButton = event.target.closest(".grid-hit");
      if (hitButton && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Delete", "Backspace", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        const hit = this.getGridHits().find((item) => item.key === hitButton.dataset.hit);
        if (!hit) return;
        let { voice, step, velocity } = hit;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          step = this.constrainHitStep(step + (event.key === "ArrowLeft" ? -1 : 1) * (this.state.snap ? 1 : 0.1));
        } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          const index = VOICES.findIndex(({ id }) => id === voice);
          voice = VOICES[Math.max(0, Math.min(VOICES.length - 1, index + (event.key === "ArrowUp" ? -1 : 1)))].id;
        } else if (event.key === "Delete" || event.key === "Backspace") velocity = 0;
        else velocity = (velocity + 1) % 3;
        this.editGridHit(hit.key, voice, step, velocity);
        const edited = this.getGridHits().find((item) => item.voice === voice && Math.abs(item.step - step) < 1e-8 && item.velocity === velocity);
        if (edited) this.elements.grid.querySelector(`.grid-hit[data-hit="${edited.key}"]`)?.focus();
        return;
      }
      const button = event.target.closest(".step-button");
      if (!button || button.disabled || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      if (this.getGridRecording()) {
        this.editGridHit(null, button.dataset.voice, Number(button.dataset.step), 1);
        return;
      }
      const before = this.patternSnapshot();
      const voice = button.dataset.voice;
      const step = Number(button.dataset.step);
      this.state.pattern[voice][step] = (this.state.pattern[voice][step] + 1) % 3;
      const voiceLabel = VOICES.find((item) => item.id === voice)?.label || voice;
      this.commitPatternChange(before, true, `Changed ${voiceLabel} step ${step + 1}`, "pen");
    }

    handleGlobalKeyDown(event) {
      const target = event.target;
      const isEditing = target && (
        ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) ||
        target.isContentEditable
      );
      if (isEditing || event.defaultPrevented || event.repeat || event.isComposing ||
          event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.code === "Space") {
        if (target?.closest("button")) return;
        event.preventDefault();
        this.togglePlayback();
        return;
      }

      const voice = VOICES.find(({ key }, index) => (
        event.key.toUpperCase() === key || event.key === String(index + 1)
      ));
      if (voice) {
        event.preventDefault();
        this.selectVoice(voice.id);
        this.auditionVoice(voice.id);
      }
    }

    selectVoice(voice) {
      this.state.selectedVoice = voice;
      this.elements.voiceSelect.value = voice;
      this.saveState();
      this.updateGrid();
      this.updateVoiceFields();
      this.updatePanel();
    }

    async auditionVoice(voice) {
      await this.ensureAudioReady();
      this.playVoice(voice, 2, this.audioContext.currentTime + 0.001);
      this.flashVoice(voice, 0);
      this.vibrate(8);
    }

    async toggleRecording() {
      if (this.isRecording || this.isCountingIn) {
        this.finishRecording();
        return;
      }
      await this.startRecording();
    }

    async startRecording() {
      if (this.isRecording || this.isCountingIn) return;
      this.stopRecordingPlayback();
      const sessionId = ++this.recordingSessionId;
      this.isCountingIn = true;
      this.countInTotalBeats = this.state.countIn * 4;
      this.countInBeatsRemaining = this.countInTotalBeats;
      this.updateRecordingControls();
      await this.ensureAudioReady();
      if (!this.isCountingIn || sessionId !== this.recordingSessionId) return;
      this.recordingCaptureTimers.forEach((pending, timer) => window.clearTimeout(timer));
      this.recordingCaptureTimers.clear();
      this.recordingEvents = [];
      if (!this.countInTotalBeats) {
        this.beginRecording(this.audioContext.currentTime);
        this.startGuide();
        return;
      }
      this.stopGuide();
      this.startGuide();
    }

    beginRecording(when) {
      this.isCountingIn = false;
      this.recordingStartTime = when;
      this.recordingStartedAt = Date.now();
      this.isRecording = true;
      const source = this.getSourceSettings();
      this.recordingSettings = {
        bpm: source.bpm, swing: source.swing, voices: clone(this.getSourceVoices()),
        kitName: source.kitName, patternName: source.patternName
      };
      this.recordingDuration = this.getGridRecording()
        ? source.durationMs / 1000 : timeAtStep(source.length, source.bpm, source.swing);
      this.recordingEndTime = this.state.loop ? Infinity : when + this.recordingDuration;
      this.updateGrid();

      if (this.timelineEvents.length) {
        const performanceNow = performance.now();
        const audioNow = this.audioContext.currentTime;
        const performanceStart = performanceNow + ((when - audioNow) * 1000);
        // Include hits at the boundary even if the scheduler wakes slightly late.
        this.timelineEvents
          .filter((event) => event.startTime >= performanceStart - 0.001)
          .forEach((event) => {
            const when = audioNow + ((event.startTime - performanceNow) / 1000);
            this.queueRecordingEvent(
              event.voice,
              event.velocity,
              when,
              event.endTime - event.startTime,
              event.settings || this.getSourceVoices()[event.voice],
              event
            );
          });
      }
      this.updateRecordingControls();
      this.scheduleRecordingWindow();
    }

    sweepRecording(when) {
      const elapsed = Math.max(0, Math.min(when, this.recordingEndTime) - this.recordingStartTime);
      const duration = this.recordingDuration;
      const count = this.recordingEvents.length;
      this.recordingEvents = this.recordingEvents.filter((event) => {
        const position = event.timestampMs / 1000;
        // The position at the cursor is still part of the unswept region.
        const lastPass = Math.ceil((elapsed - position) / duration - 1e-9) - 1;
        return event.recordedTime >= lastPass * duration + position - 1e-9;
      });
      if (this.recordingEvents.length !== count) this.renderGridHits();
    }

    scheduleRecordingWindow() {
      if (!this.isRecording) return;
      const now = this.audioContext.currentTime;
      if (now >= this.recordingEndTime) {
        this.finishRecording();
        return;
      }
      this.sweepRecording(now);
      const elapsed = Math.max(0, now - this.recordingStartTime);
      const position = elapsed % this.recordingDuration;
      const step = Math.min(this.getGridLength() - 1,
        Math.floor(stepAtTime(position, this.recordingSettings.bpm, this.recordingSettings.swing)));
      if (step !== this.currentStep) this.setCurrentStep(step);
      this.updateRecordingControls();
      this.recordingWindowTimer = window.setTimeout(
        () => this.scheduleRecordingWindow(),
        Math.min(SCHEDULER_DELAY_MS, Math.max(0, (this.recordingEndTime - now) * 1000))
      );
    }

    startGuide() {
      if (this.guideTimer !== null) return;
      if (!this.isCountingIn && !(this.state.metronome && (this.isPlaying || this.isRecording || this.isRecordingPlayback))) return;
      this.guideBeat = 0;
      this.nextGuideTime = this.audioContext.currentTime + 0.03;
      this.scheduleGuide();
    }

    scheduleGuide() {
      const now = this.audioContext.currentTime;
      while (this.nextGuideTime < now + SCHEDULE_AHEAD_SEC) {
        if (this.isCountingIn && this.countInBeatsRemaining === 0) {
          if (this.nextGuideTime > now) break;
          this.beginRecording(this.nextGuideTime);
        }
        if (!this.isCountingIn && !(this.state.metronome && (this.isPlaying || this.isRecording || this.isRecordingPlayback))) {
          this.stopGuide();
          return;
        }
        const result = window.playTransientSound({
          audioContext: this.audioContext,
          destinationNode: this.guideGain,
          tone: "click",
          when: this.nextGuideTime,
          pitchRatio: this.guideBeat % 4 === 0 ? 1.5 : 1,
          gain: 1
        });
        if (result) {
          this.guideSources.add(result.stopNode);
          result.stopNode.addEventListener("ended", () => this.guideSources.delete(result.stopNode), { once: true });
        }
        if (this.isCountingIn) {
          this.countInBeatsRemaining--;
          this.updateRecordingControls();
        }
        this.guideBeat++;
        this.nextGuideTime += 60 / this.getSourceSettings().bpm;
      }
      this.guideTimer = window.setTimeout(() => this.scheduleGuide(), SCHEDULER_DELAY_MS);
    }

    stopGuide() {
      window.clearTimeout(this.guideTimer);
      this.guideTimer = null;
      this.guideSources.forEach((source) => {
        try {
          source.stop(this.audioContext.currentTime);
        } catch (_) {
          // Source may already have ended.
        }
      });
      this.guideSources.clear();
    }

    commitRecordedEvent(pending) {
      if (!this.isRecording || pending.sessionId !== this.recordingSessionId ||
          pending.when < this.recordingStartTime - 0.000001 ||
          pending.when >= this.recordingEndTime) return;
      const recordedTime = Math.max(0, pending.when - this.recordingStartTime);
      const duration = this.recordingDuration;
      const position = recordedTime - Math.floor((recordedTime + 1e-9) / duration) * duration;
      const timestampMs = Math.max(0, position * 1000);
      this.sweepRecording(this.audioContext.currentTime);
      const elapsed = Math.min(this.audioContext.currentTime, this.recordingEndTime) - this.recordingStartTime;
      const lastPass = Math.ceil((elapsed - timestampMs / 1000) / duration - 1e-9) - 1;
      if (recordedTime < lastPass * duration + timestampMs / 1000 - 1e-9) return;
      this.recordingEvents.push({
        voice: pending.voice,
        velocity: pending.velocity,
        timestampMs,
        durationMs: pending.durationMs,
        recordedTime,
        settings: { ...pending.settings }
      });
      this.renderGridHits();
      this.updateRecordingControls();
    }

    queueRecordingEvent(voice, velocity, when, durationMs, settings, timelineEvent = null) {
      if (!this.isRecording || when < this.recordingStartTime - 0.000001) return;
      const pending = {
        sessionId: this.recordingSessionId,
        voice,
        velocity,
        when,
        durationMs,
        timelineEvent,
        settings: { ...settings }
      };
      const delayMs = Math.max(0, (when - this.audioContext.currentTime) * 1000);
      if (delayMs === 0) {
        this.commitRecordedEvent(pending);
        return;
      }

      const timer = window.setTimeout(() => {
        if (!this.recordingCaptureTimers.has(timer)) return;
        this.recordingCaptureTimers.delete(timer);
        this.commitRecordedEvent(pending);
      }, delayMs);
      this.recordingCaptureTimers.set(timer, pending);
      return timer;
    }

    getNextRecordingName() {
      const names = new Set(this.recordings.map((recording) => recording.name));
      let number = 1;
      while (names.has(`Recording ${number}`)) number++;
      return `Recording ${number}`;
    }

    finishRecording() {
      if (this.isCountingIn) {
        this.isCountingIn = false;
        this.recordingSessionId++;
        this.stopGuide();
        this.startGuide();
        this.updateRecordingControls();
        return null;
      }
      if (!this.isRecording) return null;
      const audioNow = Math.min(this.audioContext.currentTime, this.recordingEndTime);
      window.clearTimeout(this.recordingWindowTimer);
      this.recordingWindowTimer = null;
      this.recordingCaptureTimers.forEach((pending, timer) => {
        window.clearTimeout(timer);
        if (pending.when <= audioNow) this.commitRecordedEvent(pending);
      });
      this.recordingCaptureTimers.clear();
      this.sweepRecording(audioNow);
      this.isRecording = false;
      if (!this.isPlaying) this.stopGuide();

      const recording = normalizeRecording({
        id: `${this.recordingStartedAt}-${Math.random().toString(36).slice(2, 8)}`,
        name: this.getNextRecordingName(),
        createdAt: this.recordingStartedAt,
        durationMs: this.recordingDuration * 1000,
        fixedDuration: true,
        ...this.recordingSettings,
        voices: clone(this.getSourceVoices()),
        kitName: this.getSourceSettings().kitName,
        events: this.recordingEvents
      }, this.recordings.length);

      this.recordingEvents = [];
      if (!recording) {
        this.updateRecordingControls();
        return null;
      }

      this.recordings.push(recording);
      if (this.isPlaying) this.pausePlayback(true);
      this.selectedRecordingIndex = this.recordings.length - 1;
      this.gridSource = "recording";
      this.refreshGrid();
      this.saveRecordingPlaylist();
      this.renderRecordingPlaylist();
      return recording;
    }

    async toggleRecordingPlayback(index = null) {
      const targetIndex = index === null ? this.selectedRecordingIndex : index;
      if (this.isRecordingPlayback && targetIndex === this.playingRecordingIndex) {
        this.stopRecordingPlayback();
        return;
      }
      await this.startRecordingPlayback(index);
    }

    async startRecordingPlayback(index = null) {
      if (this.isCountingIn) this.finishRecording();
      if (this.isRecording) {
        const completed = this.finishRecording();
        if (index === null && completed) index = this.selectedRecordingIndex;
      }
      if (index === null) index = this.selectedRecordingIndex;
      if (index < 0 || index >= this.recordings.length) return;
      const recordingId = this.recordings[index]?.id;
      if (!recordingId) return;
      this.stopRecordingPlayback();
      this.pausePlayback(true);
      const sessionId = this.transportSessionId;
      await this.ensureAudioReady();
      if (sessionId !== this.transportSessionId) return;

      index = this.recordings.findIndex((recording) => recording.id === recordingId);
      if (index < 0) return;
      const recording = this.recordings[index];
      this.selectedRecordingIndex = index;
      this.gridSource = "recording";
      this.refreshGrid();
      this.playingRecordingIndex = index;
      this.isRecordingPlayback = true;
      this.recordingPlayback = {
        recording,
        startTime: this.audioContext.currentTime + 0.03,
        duration: Math.max(8, recording.durationMs) / 1000,
        cycle: 0,
        eventIndex: 0,
        endCycle: this.state.loop ? Infinity : 1,
        pending: []
      };
      this.scheduleRecordingPlayback();
      this.startGuide();

      this.saveRecordingPlaylist();
      this.renderRecordingPlaylist();
      this.updateToggleButtons();
    }

    toggleRecordingLoop() {
      if (this.isRecording && this.audioContext.currentTime >= this.recordingEndTime) this.finishRecording();
      if (this.sequencerPlayback && this.audioContext.currentTime >= this.sequencerPlayback.endTime) {
        this.finishSequencerPlayback();
      }
      this.state.loop = !this.state.loop;
      const sequencer = this.sequencerPlayback;
      if (sequencer) {
        const now = this.audioContext.currentTime;
        const currentCycle = sequencer.cycles.find((cycle) => cycle.endTime > now) ||
          { index: sequencer.cycle, endTime: Infinity };
        sequencer.endCycle = this.state.loop ? Infinity : currentCycle.index + 1;
        sequencer.endTime = this.state.loop ? Infinity : currentCycle.endTime;
        if (!this.state.loop) {
          sequencer.pending = sequencer.pending.filter((step) => {
            if (step.cycle < sequencer.endCycle) return true;
            step.sources.forEach((source) => {
              try {
                source.stop(now);
              } catch (_) {
                // Source may already have ended.
              }
              this.activeSources.delete(source);
            });
            step.visualTimers.forEach((timer) => {
              window.clearTimeout(timer);
              this.visualTimers.delete(timer);
            });
            step.captureTimers.forEach((timer) => {
              window.clearTimeout(timer);
              this.recordingCaptureTimers.delete(timer);
            });
            this.recordingCaptureTimers.forEach((pending, timer) => {
              if (!step.timelineEvents.includes(pending.timelineEvent)) return;
              window.clearTimeout(timer);
              this.recordingCaptureTimers.delete(timer);
            });
            this.timelineEvents = this.timelineEvents.filter((event) => !step.timelineEvents.includes(event));
            return false;
          });
          if (sequencer.cycle >= sequencer.endCycle) {
            sequencer.cycle = sequencer.endCycle;
            this.nextStep = 0;
            this.nextStepTime = currentCycle.endTime;
            sequencer.cycles = sequencer.cycles.filter((cycle) => cycle.index < sequencer.endCycle);
          }
        }
        window.clearTimeout(this.schedulerTimer);
        this.scheduler(sequencer);
      }
      if (this.isRecording) {
        const elapsed = Math.max(0, this.audioContext.currentTime - this.recordingStartTime);
        this.recordingEndTime = this.state.loop ? Infinity : this.recordingStartTime +
          (Math.floor(elapsed / this.recordingDuration) + 1) * this.recordingDuration;
        window.clearTimeout(this.recordingWindowTimer);
        this.scheduleRecordingWindow();
      }
      const playback = this.recordingPlayback;
      if (playback) {
        const now = this.audioContext.currentTime;
        const currentCycle = Math.max(0, Math.floor((now - playback.startTime) / playback.duration));
        playback.endCycle = this.state.loop ? Infinity : currentCycle + 1;
        if (!this.state.loop) {
          // Lookahead may already include the next pass, especially for short takes.
          playback.pending = playback.pending.filter((hit) => {
            if (hit.cycle < playback.endCycle) return true;
            hit.sources.forEach((source) => {
              try {
                source.stop(now);
              } catch (_) {
                // Source may already have ended.
              }
              this.activeSources.delete(source);
            });
            window.clearTimeout(hit.visualTimer);
            this.visualTimers.delete(hit.visualTimer);
            return false;
          });
          const endTime = playback.startTime + playback.endCycle * playback.duration;
          const timelineEnd = performance.now() + (endTime - now) * 1000;
          this.timelineEvents = this.timelineEvents.filter((event) => event.startTime < timelineEnd);
          if (playback.cycle >= playback.endCycle) {
            playback.cycle = playback.endCycle;
            playback.eventIndex = 0;
          }
        }
        window.clearTimeout(this.recordingPlaybackTimer);
        this.scheduleRecordingPlayback();
      }
      this.saveState();
      this.updateToggleButtons();
      this.updatePanel();
    }

    scheduleRecordingPlayback() {
      const playback = this.recordingPlayback;
      if (!this.isRecordingPlayback || !playback) return;
      const now = this.audioContext.currentTime;
      const endTime = playback.startTime + playback.endCycle * playback.duration;
      if (now >= endTime) {
        this.stopRecordingPlayback();
        return;
      }
      if (this.getGridRecording()?.id === playback.recording.id) {
        const time = Math.max(0, now - playback.startTime) % playback.duration;
        const step = Math.floor(stepAtTime(time, playback.recording.bpm, playback.recording.swing));
        if (step !== this.currentStep) this.setCurrentStep(step);
      }
      playback.pending = playback.pending.filter((hit) => hit.when >= now);
      // Skip missed passes after a delayed callback instead of replaying a burst.
      const currentCycle = Math.max(0, Math.floor((now - playback.startTime) / playback.duration));
      if (playback.cycle < currentCycle) {
        playback.cycle = currentCycle;
        playback.eventIndex = 0;
      }
      const events = playback.recording.events;
      while (events.length && playback.cycle < playback.endCycle) {
        const event = events[playback.eventIndex];
        const when = playback.startTime + playback.cycle * playback.duration + event.timestampMs / 1000;
        if (when >= now + SCHEDULE_AHEAD_SEC) break;
        if (when >= now - 0.000001 && when > (playback.skipThrough ?? -Infinity) && !this.state.mutes[event.voice]) {
          const boundary = playback.recording.fixedDuration
            ? playback.startTime + (playback.cycle + 1) * playback.duration : null;
          const result = this.playVoice(event.voice, event.velocity, when, event.settings, false, boundary);
          const visualTimer = this.flashVoice(event.voice, Math.max(0, (when - now) * 1000));
          playback.pending.push({
            cycle: playback.cycle, when, sources: result?.sources || [], visualTimer,
            visualTimers: [visualTimer], timelineEvent: result?.timelineEvent
          });
        }
        playback.eventIndex++;
        if (playback.eventIndex === events.length) {
          playback.eventIndex = 0;
          playback.cycle++;
        }
      }
      this.recordingPlaybackTimer = window.setTimeout(
        () => this.scheduleRecordingPlayback(),
        Math.min(SCHEDULER_DELAY_MS, Math.max(1, (endTime - now) * 1000))
      );
    }

    stopRecordingPlayback() {
      this.transportSessionId = (this.transportSessionId || 0) + 1;
      window.clearTimeout(this.recordingPlaybackTimer);
      this.recordingPlaybackTimer = null;
      this.recordingPlayback = null;
      if (!this.isRecordingPlayback && this.playingRecordingIndex < 0) return;
      this.isRecordingPlayback = false;
      this.playingRecordingIndex = -1;
      if (!this.isPlaying && !this.isRecording && !this.isCountingIn) this.stopGuide();
      if (!this.isPlaying) this.setCurrentStep(-1);
      this.visualTimers.forEach((timer) => window.clearTimeout(timer));
      this.visualTimers.clear();
      this.voiceFlashTimers.clear();
      this.activeSources.forEach((source) => {
        try {
          source.stop(this.audioContext.currentTime);
        } catch (_) {
          // Source may already have ended.
        }
      });
      this.activeSources.clear();
      document.querySelectorAll(".voice-trigger.voice-hit").forEach((trigger) => trigger.classList.remove("voice-hit"));
      this.pruneTimelineAt(performance.now());
      this.updateRecordingControls();
      this.renderRecordingPlaylist();
    }

    stopAll(resetPlayhead) {
      this.finishRecording();
      this.pausePlayback(resetPlayhead);
      this.stopRecordingPlayback();
    }

    playVoice(voice, velocity, when, settingsOverride = null, captureEvent = true, stopAt = null) {
      const settings = settingsOverride || this.getSourceVoices()[voice];
      const result = window.playDrumSound({
        audioContext: this.audioContext,
        destinationNode: this.analyser,
        voice,
        when,
        velocity: velocity === 2 ? 1 : 0.68,
        level: settings.level,
        pan: settings.pan,
        frequency: settings.frequency,
        decay: settings.decay,
        tone: settings.tone,
        snap: settings.tone
      });

      if (!result) return;
      if (stopAt !== null) {
        result.stopTime = Math.min(result.stopTime, stopAt);
        result.sources.forEach((source) => source.stop(result.stopTime));
      }
      result.timelineEvent = this.recordTimelineHit(voice, velocity, when, result.stopTime, settings, stopAt === null ? 40 : 0);
      if (captureEvent) {
        result.captureTimer = this.queueRecordingEvent(
          voice, velocity, when, Math.max(8, (result.stopTime - when) * 1000), settings, result.timelineEvent
        );
      }
      this.lastMetersActivitySec = Math.max(this.lastMetersActivitySec, result.stopTime);
      result.sources.forEach((source) => this.activeSources.add(source));
      const cleanupDelay = Math.max(0, (result.stopTime - this.audioContext.currentTime) * 1000) + 100;
      window.setTimeout(() => {
        result.sources.forEach((source) => this.activeSources.delete(source));
      }, cleanupDelay);
      return result;
    }

    async togglePlayback() {
      if (this.getGridRecording()) {
        await this.toggleRecordingPlayback();
        return;
      }
      if (this.isPlaying) {
        this.pausePlayback(false);
        return;
      }

      this.stopRecordingPlayback();
      this.gridSource = "pattern";
      this.refreshGrid();
      const sessionId = this.transportSessionId;
      await this.ensureAudioReady();
      if (sessionId !== this.transportSessionId) return;
      this.isPlaying = true;
      this.nextStep = !this.isRecording && this.currentStep >= 0
        ? (this.currentStep + 1) % this.state.length : 0;
      this.nextStepTime = this.audioContext.currentTime + 0.03;
      this.sequencerPlayback = {
        cycle: 0,
        endCycle: this.state.loop ? Infinity : 1,
        endTime: Infinity,
        cycles: [{ index: 0, endTime: Infinity }],
        pending: []
      };
      this.updateToggleButtons();
      this.scheduler();
      this.startGuide();
    }

    scheduler(playback = this.sequencerPlayback) {
      if (!this.isPlaying || !playback || playback !== this.sequencerPlayback) return;
      const now = this.audioContext.currentTime;
      if (now >= playback.endTime) {
        this.finishSequencerPlayback();
        return;
      }
      playback.pending = playback.pending.filter((step) => step.when + step.duration > now);
      playback.cycles = playback.cycles.filter((cycle) => cycle.endTime > now);

      while (playback.cycle < playback.endCycle && this.nextStepTime < now + SCHEDULE_AHEAD_SEC) {
        if (!playback.cycles.some((cycle) => cycle.index === playback.cycle)) {
          playback.cycles.push({ index: playback.cycle, endTime: Infinity });
        }
        playback.pending.push(this.scheduleStep(this.nextStep, this.nextStepTime));
        this.nextStepTime += this.getStepDuration(this.nextStep);
        this.nextStep = (this.nextStep + 1) % this.state.length;
        if (this.nextStep === 0) {
          playback.cycles.find((cycle) => cycle.index === playback.cycle).endTime = this.nextStepTime;
          playback.cycle++;
          if (playback.cycle === playback.endCycle) playback.endTime = this.nextStepTime;
        }
      }

      playback.pending.forEach((step) => this.scheduleFreeHits(step));
      this.schedulerTimer = window.setTimeout(
        () => this.scheduler(playback),
        Math.min(SCHEDULER_DELAY_MS, Math.max(0, (playback.endTime - now) * 1000))
      );
    }

    finishSequencerPlayback() {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
      this.sequencerPlayback = null;
      this.isPlaying = false;
      if (!this.isRecording && !this.isCountingIn) this.stopGuide();
      this.setCurrentStep(-1);
      this.updateToggleButtons();
    }

    getStepDuration(step) {
      const straightDuration = (60 / this.state.bpm) / 4;
      const swingRatio = this.state.swing / 100;
      return straightDuration * (step % 2 === 0 ? 1 + swingRatio : 1 - swingRatio);
    }

    scheduleStep(step, when) {
      const playback = this.sequencerPlayback;
      const pending = {
        step, cycle: playback.cycle, when, duration: this.getStepDuration(step), scheduledHits: [],
        sources: [], visualTimers: [], captureTimers: [], timelineEvents: [],
        freeHits: (this.state.freeHits || [])
          .filter((hit) => Math.floor(hit.step) === step)
          .map((hit) => ({ ...hit, when: when + (hit.step - step) * this.getStepDuration(step) }))
      };
      const delayMs = Math.max(0, (when - this.audioContext.currentTime) * 1000);
      pending.visualTimers.push(this.scheduleVisual(() => {
        if (this.isPlaying && !this.isRecording && playback === this.sequencerPlayback && !this.getGridRecording()) this.setCurrentStep(step);
      }, delayMs));

      VOICES.forEach(({ id }) => {
        const velocity = this.state.pattern[id][step];
        if (!velocity || this.state.mutes[id]) return;
        this.schedulePatternHit(pending, id, velocity, when);
      });
      return pending;
    }

    scheduleFreeHits(pending) {
      const now = this.audioContext.currentTime;
      pending.freeHits = pending.freeHits.filter((hit) => {
        if (hit.when >= now + SCHEDULE_AHEAD_SEC) return true;
        if (hit.when >= now - 0.000001 && !this.state.mutes[hit.voice]) {
          this.schedulePatternHit(pending, hit.voice, hit.velocity, hit.when);
        }
        return false;
      });
    }

    schedulePatternHit(pending, voice, velocity, when) {
      const result = this.playVoice(voice, velocity, when);
      const hit = {
        when, sources: result?.sources || [], captureTimer: result?.captureTimer,
        timelineEvent: result?.timelineEvent, visualTimers: []
      };
      if (result) {
        pending.sources.push(...result.sources);
        pending.captureTimers.push(result.captureTimer);
        pending.timelineEvents.push(result.timelineEvent);
      }
      const delayMs = Math.max(0, (when - this.audioContext.currentTime) * 1000);
      hit.visualTimers.push(this.flashVoice(voice, delayMs));
      if (voice === "kick") {
        const playback = this.sequencerPlayback;
        hit.visualTimers.push(this.scheduleVisual(() => {
          if (playback === this.sequencerPlayback) this.vibrate(8);
        }, delayMs));
      }
      pending.visualTimers.push(...hit.visualTimers);
      pending.scheduledHits.push(hit);
    }

    scheduleVisual(callback, delayMs) {
      const timer = window.setTimeout(() => {
        if (!this.visualTimers.has(timer)) return;
        this.visualTimers.delete(timer);
        callback();
      }, delayMs);
      this.visualTimers.add(timer);
      return timer;
    }

    flashVoice(voice, delayMs) {
      if (!this.state.blink) return;
      return this.scheduleVisual(() => {
        if (!this.state.blink) return;
        const triggers = document.querySelectorAll(`.voice-trigger[data-voice="${voice}"]`);
        const previous = this.voiceFlashTimers.get(voice);
        window.clearTimeout(previous);
        this.visualTimers.delete(previous);
        triggers.forEach((trigger) => trigger.classList.add("voice-hit"));
        const timer = this.scheduleVisual(() => {
          triggers.forEach((trigger) => trigger.classList.remove("voice-hit"));
          this.voiceFlashTimers.delete(voice);
        }, 80);
        this.voiceFlashTimers.set(voice, timer);
      }, delayMs);
    }

    pausePlayback(resetPlayhead) {
      this.transportSessionId = (this.transportSessionId || 0) + 1;
      const playback = this.sequencerPlayback;
      this.sequencerPlayback = null;
      playback?.pending.forEach((step) => step.captureTimers.forEach((timer) => {
        window.clearTimeout(timer);
        this.recordingCaptureTimers.delete(timer);
      }));
      if (playback) {
        this.recordingCaptureTimers.forEach((pending, timer) => {
          if (!playback.pending.some((step) => step.timelineEvents.includes(pending.timelineEvent))) return;
          window.clearTimeout(timer);
          this.recordingCaptureTimers.delete(timer);
        });
      }
      this.isPlaying = false;
      if (!this.isRecording && !this.isCountingIn) this.stopGuide();
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
      this.visualTimers.forEach((timer) => window.clearTimeout(timer));
      this.visualTimers.clear();
      this.voiceFlashTimers.clear();
      this.activeSources.forEach((source) => {
        try {
          source.stop(this.audioContext.currentTime);
        } catch (_) {
          // Source may already have ended.
        }
      });
      this.activeSources.clear();
      this.pruneTimelineAt(performance.now());
      document.querySelectorAll(".voice-trigger.voice-hit").forEach((trigger) => {
        trigger.classList.remove("voice-hit");
      });
      if (resetPlayhead) this.setCurrentStep(-1);
      this.updateToggleButtons();
    }

    pruneTimelineAt(timelineNow) {
      this.timelineEvents = this.timelineEvents
        .filter((event) => event.startTime <= timelineNow)
        .map((event) => ({ ...event, endTime: Math.min(event.endTime, timelineNow) }));
    }

    setCurrentStep(step) {
      this.currentStep = step;
      document.querySelectorAll(".step-button.current-step, .grid-hit.current-step").forEach((button) => {
        button.classList.remove("current-step");
      });
      if (step >= 0) {
        document.querySelectorAll(`.step-button[data-step="${step}"], .grid-hit[data-step="${step}"]`).forEach((button) => {
          button.classList.add("current-step");
        });
      }
    }

    vibrate(duration) {
      if (this.state.haptic && "vibrate" in navigator) navigator.vibrate(duration);
    }

    tapTempo() {
      if (this.isRecording || this.isCountingIn) return;
      const now = performance.now();
      if (this.tapTimes.length && now - this.tapTimes[this.tapTimes.length - 1] > 2000) {
        this.tapTimes = [];
      }
      this.tapTimes.push(now);
      this.tapTimes = this.tapTimes.slice(-6);

      this.elements.tap.classList.add("button-on");
      window.clearTimeout(this.tapFlashTimer);
      this.tapFlashTimer = window.setTimeout(() => this.elements.tap.classList.remove("button-on"), 90);
      this.vibrate(8);

      if (this.tapTimes.length < 2) return;
      const intervals = this.tapTimes.slice(1).map((time, index) => time - this.tapTimes[index]);
      const average = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      this.setBpm(60000 / average);
    }

    setBpm(value) {
      return this.setSourceTiming("bpm", Math.round(clamp(value, 30, 320, this.getSourceSettings().bpm)));
    }

    setSwing(value) {
      return this.setSourceTiming("swing", Math.round(clamp(value, 0, 50, this.getSourceSettings().swing)));
    }

    setLength(value) {
      const length = Number(value);
      if (![4, 8, 12, 16].includes(length)) {
        console.warn("Drum Machine Length must be 4, 8, 12 or 16 steps:", value);
        this.updateControls();
        return;
      }
      return this.setSourceTiming("length", length);
    }

    setSourceTiming(property, value) {
      if (this.isRecording || this.isCountingIn) return;
      const source = this.getSourceSettings();
      const recording = this.getGridRecording();
      if (property !== "length" && source[property] === value) return;
      const before = this.patternSnapshot();
      const wasPlaying = (recording ? this.isRecordingPlayback : this.isPlaying) ||
        (Number.isInteger(this.timingRestartSessionId) && this.timingRestartSessionId === this.transportSessionId);
      const restart = property === "length" || !!recording;
      if (restart) {
        this.pausePlayback(true);
        this.stopRecordingPlayback();
      }
      if (recording) {
        const oldBpm = recording.bpm;
        const oldSwing = recording.swing;
        const steps = stepAtTime(recording.durationMs / 1000, oldBpm, oldSwing);
        if (property !== "length") {
          recording[property] = value;
          [...recording.events, ...(recording.hiddenEvents || [])].forEach((event) => {
            const step = stepAtTime(event.timestampMs / 1000, oldBpm, oldSwing);
            event.timestampMs = timeAtStep(step, recording.bpm, recording.swing) * 1000;
          });
        }
        this.setRecordingWindow(recording,
          timeAtStep(property === "length" ? value : steps, recording.bpm, recording.swing) * 1000);
      } else {
        source[property] = value;
        if (property === "length") this.nextStep = 0;
      }
      this.commitPatternChange(before, false, `Changed ${property === "bpm" ? "BPM" : property}`, "pen");
      if (restart && wasPlaying) {
        const pending = this.togglePlayback();
        const sessionId = this.transportSessionId;
        this.timingRestartSessionId = sessionId;
        return pending.finally(() => {
          if (this.timingRestartSessionId === sessionId) this.timingRestartSessionId = null;
        });
      }
    }

    setVolume(value) {
      this.state.volume = Math.round(clamp(value, 0, 100, this.state.volume));
      this.elements.volumeSlider.value = String(this.state.volume);
      this.applyMasterGain();
      this.saveState();
      this.updatePanel();
    }

    setVoiceParameter(property, value) {
      const before = this.patternSnapshot();
      const voice = this.state.selectedVoice;
      const limits = VOICE_LIMITS[voice];
      const source = this.getSourceSettings();
      source.voices = clone(this.getSourceVoices());
      const settings = source.voices[voice];

      if (property === "frequency") {
        settings.frequency = clamp(value, limits.frequency[0], limits.frequency[1], settings.frequency);
      } else if (property === "decay") {
        settings.decay = clamp(value, limits.decay[0], limits.decay[1], settings.decay);
      } else if (property === "pan") {
        settings.pan = clamp(value, -1, 1, settings.pan);
      } else {
        settings[property] = clamp(value, 0, 1, settings[property]);
      }

      source.kitName = "custom";
      const recording = this.getGridRecording();
      if (recording) [...recording.events, ...(recording.hiddenEvents || [])]
        .filter((event) => event.voice === voice).forEach((event) => {
          event.settings[property] = settings[property];
          if (property === "decay") event.durationMs = settings.decay * 1000;
        });
      this.commitPatternChange(before, false, `Changed ${voice} ${property}`, "pen");
    }

    loadPatternPreset(name) {
      if (this.isRecording || this.isCountingIn) return;
      const before = this.patternSnapshot();
      const recording = this.getGridRecording();
      const source = this.getSourceSettings();
      if (recording) {
        recording.events = [];
        recording.hiddenEvents = [];
        recording.fixedDuration = true;
        for (let step = 0; step < this.getGridLength(); step++) {
          VOICES.forEach(({ id }) => {
            const velocity = PATTERN_PRESETS[name][id][step % STEP_COUNT];
            if (velocity) recording.events.push(this.createRecordingHit(id, step, velocity));
          });
        }
        recording.events = recording.events.filter((event) => event.timestampMs < recording.durationMs);
      } else {
        this.state.pattern = clone(PATTERN_PRESETS[name]);
        this.state.freeHits = [];
      }
      source.patternName = name;
      if (before === this.patternSnapshot()) {
        this.saveState();
        this.refreshGrid();
        return;
      }
      const label = this.elements.patternSelect.selectedOptions?.[0]?.textContent || name;
      this.commitPatternChange(before, false, `Loaded ${label} pattern`, "open");
    }

    loadKitPreset(name) {
      const before = this.patternSnapshot();
      const source = this.getSourceSettings();
      source.voices = clone(KIT_PRESETS[name]);
      source.kitName = name;
      const recording = this.getGridRecording();
      if (recording) [...recording.events, ...(recording.hiddenEvents || [])].forEach((event) => {
        event.settings = { ...source.voices[event.voice] };
        event.durationMs = event.settings.decay * 1000;
      });
      this.commitPatternChange(before, false, `Loaded ${name} kit`, "open");
      this.auditionVoice(this.state.selectedVoice);
    }

    createRecordingHit(voice, step, velocity) {
      const recording = this.getGridRecording();
      const settings = { ...this.getSourceVoices()[voice] };
      return {
        voice, velocity, settings, durationMs: settings.decay * 1000,
        timestampMs: timeAtStep(step, recording.bpm, recording.swing) * 1000
      };
    }

    randomizePattern() {
      if (this.isRecording || this.isCountingIn) return;
      const before = this.patternSnapshot();
      const recording = this.getGridRecording();
      const length = this.getGridLength();
      if (recording) {
        recording.events = [];
        recording.hiddenEvents = [];
        recording.fixedDuration = true;
      } else {
        this.state.freeHits = [];
      }
      const probabilities = { kick: 0.3, snare: 0.2, hat: 0.68, perc: 0.16 };

      VOICES.forEach(({ id }) => {
        for (let step = 0; step < (recording ? length : STEP_COUNT); step++) {
          if (step >= length) {
            this.state.pattern[id][step] = 0;
            continue;
          }
          const active = Math.random() < probabilities[id];
          let velocity = active ? (Math.random() < 0.2 ? 2 : 1) : 0;
          if ((id === "kick" && step % STEP_COUNT === 0) ||
              (id === "snare" && step % 8 === 4)) velocity = 2;
          if (recording) {
            if (velocity) recording.events.push(this.createRecordingHit(id, step, velocity));
          } else this.state.pattern[id][step] = velocity;
        }
      });

      if (recording) {
        recording.events = recording.events.filter((event) => event.timestampMs < recording.durationMs)
          .sort((left, right) => left.timestampMs - right.timestampMs);
      }
      this.commitPatternChange(before, true, "Randomized pattern", "random");
    }

    clearPattern() {
      if (this.isRecording || this.isCountingIn) return;
      const before = this.patternSnapshot();
      const recording = this.getGridRecording();
      if (recording) {
        recording.events = [];
        recording.hiddenEvents = [];
        recording.fixedDuration = true;
      } else {
        VOICES.forEach(({ id }) => this.state.pattern[id].fill(0));
        this.state.freeHits = [];
      }
      this.commitPatternChange(before, true, "Cleared pattern", "close");
    }

    patternSnapshot() {
      const recording = this.getGridRecording();
      return JSON.stringify(recording ? { recording } : {
        pattern: this.state.pattern, freeHits: this.state.freeHits,
        bpm: this.state.bpm, swing: this.state.swing, length: this.state.length,
        voices: this.state.voices, kitName: this.state.kitName, patternName: this.state.patternName
      });
    }

    commitPatternChange(before, markCustom, label = "Changed pattern", icon = "undo") {
      if (before === this.patternSnapshot()) return;
      if (markCustom) this.getSourceSettings().patternName = "custom";
      const after = this.patternSnapshot();
      this.refreshScheduledHits();
      this.history.record(label, before, after, { icon });
      this.saveRecordingPlaylist();
      this.saveState();
      this.refreshGrid();
      this.renderRecordingPlaylist();
    }

    undo() {
      this.history.undo();
    }

    redo() {
      this.history.redo();
    }

    reset() {
      this.stopAll(true);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PLAYLIST_STORAGE_KEY);
      this.recordings = [];
      this.selectedRecordingIndex = -1;
      this.gridSource = "pattern";
      this.renderRecordingPlaylist();
      this.state = createDefaultState();
      this.history.clear();
      this.tapTimes = [];
      this.timelineEvents = [];
      this.applyMasterGain();
      this.saveState();
      this.refreshGrid();
    }

    getExportData() {
      const source = this.getSourceSettings();
      const data = {
        release: "drum_machine",
        version: 1,
        mode: this.state.mode,
        blink: this.state.blink,
        snap: this.state.snap,
        loop: this.state.loop,
        metronome: this.state.metronome,
        countIn: this.state.countIn,
        bpm: source.bpm,
        swing: source.swing,
        volume: this.state.volume,
        sound: this.state.sound,
        haptic: this.state.haptic,
        timelineGuides: this.state.timelineGuides,
        length: this.getGridLength(),
        patternName: source.patternName || "custom",
        kitName: source.kitName || "custom",
        selectedVoice: this.state.selectedVoice,
        pattern: clone(this.state.pattern),
        freeHits: clone(this.state.freeHits),
        voices: clone(this.getSourceVoices()),
        mutes: clone(this.state.mutes)
      };
      const recording = this.getGridRecording();
      if (recording) {
        for (const property of ["pattern", "freeHits", "bpm", "swing", "length", "patternName", "kitName", "voices"]) {
          delete data[property];
        }
        data.recording = clone(recording);
      }
      return data;
    }

    updatePanel() {
      const text = JSON.stringify(this.getExportData(), null, 2);
      if (this.elements.patternText.value === text) return;
      this.elements.patternText.value = text;
      this.elements.patternText.dispatchEvent(new Event("input", { bubbles: true }));
    }

    applyPatternText() {
      try {
        const data = JSON.parse(this.elements.patternText.value);
        const imported = data?.recording ? normalizeRecording(data.recording) : null;
        if (data?.recording && !imported) throw new Error("Recording data is invalid");
        if (!data || (!imported && (!data.pattern || typeof data.pattern !== "object"))) {
          throw new Error("Pattern or recording data is missing");
        }
        const recording = this.getGridRecording();
        const before = this.patternSnapshot();
        this.stopAll(false);
        this.gridSource = recording ? "recording" : "pattern";
        if (recording) this.selectedRecordingIndex = this.recordings.indexOf(recording);
        const shared = normalizeState({ ...this.state, ...data }, false);
        for (const property of ["mode", "blink", "snap", "loop", "metronome", "countIn",
          "volume", "sound", "haptic", "timelineGuides", "selectedVoice", "mutes"]) {
          this.state[property] = shared[property];
        }
        if (recording) {
          const identity = { id: recording.id, name: recording.name, createdAt: recording.createdAt };
          if (imported) Object.assign(recording, imported, identity);
          else {
            const settings = normalizeState({ ...this.state, ...data, freeHits: data.freeHits || [] }, false);
            Object.assign(recording, {
              bpm: settings.bpm, swing: settings.swing, voices: settings.voices,
              patternName: settings.patternName, kitName: settings.kitName, events: [], hiddenEvents: []
            });
            recording.durationMs = timeAtStep(settings.length, settings.bpm, settings.swing) * 1000;
            recording.fixedDuration = true;
            VOICES.forEach(({ id }) => settings.pattern[id].forEach((velocity, step) => {
              if (!velocity) return;
              const event = this.createRecordingHit(id, step, velocity);
              (step < settings.length ? recording.events : recording.hiddenEvents).push(event);
            }));
            settings.freeHits.forEach((hit) => {
              const event = this.createRecordingHit(hit.voice, hit.step, hit.velocity);
              (hit.step < settings.length ? recording.events : recording.hiddenEvents).push(event);
            });
            recording.events.sort((left, right) => left.timestampMs - right.timestampMs);
          }
        } else if (imported) {
          if (this.recordings.some((item) => item.id === imported.id)) {
            imported.id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          }
          this.recordings.push(imported);
          this.selectedRecordingIndex = this.recordings.length - 1;
          this.gridSource = "recording";
        } else {
          this.state = normalizeState({ ...this.state, ...data, freeHits: data.freeHits || [] }, false);
        }
        this.applyMasterGain();
        this.commitPatternChange(before, false, "Applied pattern data", "check");
        this.saveAndRender();
        this.showPanelSuccess(this.elements.apply);
      } catch (error) {
        this.elements.patternText.classList.add("pattern-error");
        console.warn("Drum Machine pattern could not be applied:", error);
      }
    }

    async copyPatternText() {
      await navigator.clipboard.writeText(this.elements.patternText.value);
      this.showPanelSuccess(this.elements.copy);
    }

    savePatternFile() {
      const blob = new Blob([this.elements.patternText.value], { type: "application/json" });
      const link = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = window.ensurePekosoftFilename(`drum_machine_${this.getGridRecording() ? "recording" : "pattern"}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      this.showPanelSuccess(this.elements.save);
    }

    async savePatternAsWav() {
      if (typeof window.OfflineAudioContext !== "function") {
        console.warn("Drum Machine WAV export is not supported in this browser.");
        return;
      }

      const sampleRate = 44100;
      const recording = this.getGridRecording();
      const totalDuration = timeAtStep(this.state.length, this.state.bpm, this.state.swing);

      const longestDecay = VOICES.reduce((max, { id }) => {
        const decay = Number(this.state.voices[id]?.decay) || 0;
        return Math.max(max, decay);
      }, 0);
      const renderDuration = recording ? recording.durationMs / 1000 : Math.max(1, totalDuration + longestDecay + 0.35);
      const offlineContext = new OfflineAudioContext(2, Math.ceil(renderDuration * sampleRate), sampleRate);

      const events = recording ? recording.events.filter((event) => !this.state.mutes[event.voice]) : this.getPatternHits()
        .filter((hit) => hit.step < this.state.length && !this.state.mutes[hit.voice])
        .map((hit) => ({
          voice: hit.voice, velocity: hit.velocity,
          timestampMs: (timeAtStep(hit.step, this.state.bpm, this.state.swing) + 0.02) * 1000,
          settings: this.state.voices[hit.voice]
        }));
      events.forEach((event) => {
        const settings = event.settings;
        window.playDrumSound({
          audioContext: offlineContext,
          destinationNode: offlineContext.destination,
          voice: event.voice,
          when: event.timestampMs / 1000,
          velocity: event.velocity === 2 ? 1 : 0.68,
          level: (settings.level || 0) * (this.state.volume / 100),
          pan: settings.pan,
          frequency: settings.frequency,
          decay: settings.decay,
          tone: settings.tone,
          snap: settings.tone
        });
      });

      const audioBuffer = await offlineContext.startRendering();
      const blob = encodeAudioBufferToWavBlob(audioBuffer);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `drum_machine_${recording ? "recording" : "pattern"}_${formatPekosoftTimestamp()}.wav`;

      link.href = objectUrl;
      link.download = typeof window.ensurePekosoftFilename === "function"
        ? window.ensurePekosoftFilename(filename)
        : `pekosoft_${filename}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      this.showPanelSuccess(this.elements.saveWav);
    }

    async openPatternFile() {
      const file = this.elements.fileInput.files[0];
      if (!file) return;
      this.elements.patternText.value = await file.text();
      this.elements.patternText.dispatchEvent(new Event("input", { bubbles: true }));
      this.applyPatternText();
      this.elements.fileInput.value = "";
    }

    showPanelSuccess(button) {
      button.classList.add("button-on");
      window.setTimeout(() => button.classList.remove("button-on"), 500);
    }

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (error) {
        this.reportStorageError("Pattern", error);
      }
    }

    saveAndRender() {
      this.saveState();
      this.updateAll();
    }

    updateAll() {
      this.updateGrid();
      this.updateControls();
      this.updateToggleButtons();
      this.updateTimelineButton();
      this.updatePanel();
    }

    updateGrid() {
      const isPadMode = this.state.mode === "pad";
      const modeLabel = isPadMode ? "Switch to grid" : "Switch to pad";
      this.elements.grid.classList.toggle("pad-mode", isPadMode);
      this.elements.grid.classList.toggle("hit-grid", true);
      const recording = this.getGridRecording();
      this.elements.grid.setAttribute("aria-label", isPadMode ? "Four drum pads" : recording ? `${recording.name} hit editor` : "16-step drum sequencer");
      this.elements.random.disabled = isPadMode || this.isRecording || this.isCountingIn;
      this.elements.clear.disabled = isPadMode || this.isRecording || this.isCountingIn;
      this.elements.gridSource.disabled = !this.recordings?.length || this.isRecording || this.isCountingIn;
      this.elements.gridSource.classList.toggle("button-on", !!recording);
      this.elements.gridSource.setAttribute("aria-pressed", String(!!recording));
      this.elements.gridSource.title = recording ? "Show sequencer pattern" : "Show selected recording";
      const modeIcon = this.elements.mode.querySelector("use");
      const modeIconHref = isPadMode ? "/icons.svg#drum_machine" : "/icons.svg#view_grid";
      if (modeIcon.getAttribute("href") !== modeIconHref) {
        this.elements.mode.classList.toggle("button-on", isPadMode);
        this.elements.mode.setAttribute("aria-pressed", String(isPadMode));
        this.elements.mode.title = modeLabel;
        modeIcon.setAttribute("href", modeIconHref);
      }

      document.querySelectorAll(".step-button").forEach((button) => {
        this.updateStepButton(button, button.dataset.voice, Number(button.dataset.step));
      });

      document.querySelectorAll(".voice-trigger").forEach((trigger) => {
        const voice = trigger.dataset.voice;
        trigger.classList.toggle("selected-voice", voice === this.state.selectedVoice);
        trigger.classList.toggle("muted-step", this.state.mutes[voice]);
      });

      document.querySelectorAll(".voice-mute").forEach((button) => {
        const muted = this.state.mutes[button.dataset.voice];
        const soundEnabled = !muted;
        button.classList.toggle("button-on", soundEnabled);
        button.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
      });
      this.renderGridHits();
    }

    updateStepButton(button, voice, step) {
      const velocity = this.isRecording || this.getGridRecording() ? 0 : this.state.pattern[voice][step];
      const disabled = step >= this.getGridLength() || this.isRecording || this.isCountingIn;
      const muted = this.state.mutes[voice];
      const voiceLabel = VOICES.find((item) => item.id === voice).label;
      const velocityLabel = velocity === 2 ? "accent" : velocity === 1 ? "on" : "off";
      button.classList.toggle("velocity-1", velocity === 1);
      button.classList.toggle("velocity-2", velocity === 2);
      button.classList.toggle("muted-step", muted);
      button.classList.toggle("current-step", step === this.currentStep);
      button.disabled = disabled;
      button.setAttribute("aria-pressed", velocity > 0 ? "true" : "false");
      button.setAttribute("aria-label", `${voiceLabel}, step ${step + 1}, ${disabled ? "disabled" : velocityLabel}`);
      button.title = `${voiceLabel} step ${step + 1}: ${disabled ? "disabled" : velocityLabel}`;
    }

    updateControls() {
      const source = this.getSourceSettings();
      this.elements.bpmInput.value = String(source.bpm);
      this.elements.bpmSlider.value = String(source.bpm);
      this.elements.swingInput.value = String(source.swing);
      this.elements.swingSlider.value = String(source.swing);
      this.elements.volumeSlider.value = String(this.state.volume);
      this.elements.patternSelect.value = source.patternName || "custom";
      this.elements.kitSelect.value = source.kitName || "custom";
      const length = this.getGridLength();
      const exactSteps = this.getGridRecording()
        ? stepAtTime(source.durationMs / 1000, source.bpm, source.swing) : length;
      const standardLength = [4, 8, 12, 16].find((steps) => Math.abs(steps - exactSteps) < 1e-8);
      const custom = this.elements.lengthSelect.querySelector?.('option[value="custom"]');
      if (custom) {
        custom.hidden = !!standardLength;
        custom.textContent = `${Number(exactSteps.toFixed(3))} (recorded)`;
      }
      this.elements.lengthSelect.value = standardLength ? String(standardLength) : "custom";
      this.elements.voiceSelect.value = this.state.selectedVoice;
      this.elements.countIn.value = String(this.state.countIn);
      this.updateVoiceFields();
    }

    updateVoiceFields() {
      const voice = this.state.selectedVoice;
      const settings = this.getSourceVoices()[voice];
      const limits = VOICE_LIMITS[voice];
      this.elements.pitchInput.min = String(limits.frequency[0]);
      this.elements.pitchInput.max = String(limits.frequency[1]);
      this.elements.pitchInput.value = settings.frequency.toFixed(3);
      this.elements.decayInput.min = String(limits.decay[0] * 1000);
      this.elements.decayInput.max = String(limits.decay[1] * 1000);
      this.elements.decayInput.value = (settings.decay * 1000).toFixed(3);
      this.elements.toneInput.value = String(Math.round(settings.tone * 100));
      this.elements.levelInput.value = String(Math.round(settings.level * 100));
      this.elements.panInput.value = String(Math.round(settings.pan * 100));
      VOICE_PARAMETERS.forEach(([name, , , unit]) => {
        const input = this.elements[`${name}Input`];
        const knob = this.elements[`${name}Knob`];
        const value = Number(input.value);
        const min = Number(input.min);
        const max = Number(input.max);
        knob.style.setProperty("--knob-angle", `${-135 + (value - min) / (max - min) * 270}deg`);
        knob.setAttribute("role", "slider");
        knob.setAttribute("aria-orientation", "vertical");
        knob.setAttribute("aria-valuemin", String(min));
        knob.setAttribute("aria-valuemax", String(max));
        knob.setAttribute("aria-valuenow", String(value));
        knob.setAttribute("aria-valuetext", `${input.value} ${unit}`);
      });
    }

    updateToggleButtons() {
      this.elements.blink.classList.toggle("button-on", this.state.blink);
      this.elements.blink.setAttribute("aria-pressed", this.state.blink ? "true" : "false");
      this.elements.snap.classList.toggle("button-on", this.state.snap);
      this.elements.snap.setAttribute("aria-pressed", String(this.state.snap));
      this.elements.loop.classList.toggle("button-on", this.state.loop);
      this.elements.loop.setAttribute("aria-pressed", String(this.state.loop));
      this.elements.metronome.classList.toggle("button-on", this.state.metronome);
      this.elements.metronome.setAttribute("aria-pressed", String(this.state.metronome));
      if (!this.state.blink) {
        this.voiceFlashTimers.forEach((timer) => {
          window.clearTimeout(timer);
          this.visualTimers.delete(timer);
        });
        this.voiceFlashTimers.clear();
        document.querySelectorAll(".voice-trigger.voice-hit").forEach((trigger) => trigger.classList.remove("voice-hit"));
      }
      this.elements.sound.classList.toggle("button-on", this.state.sound);
      this.elements.sound.setAttribute("aria-pressed", this.state.sound ? "true" : "false");
      this.elements.haptic.classList.toggle("button-on", this.state.haptic);
      this.elements.haptic.setAttribute("aria-pressed", this.state.haptic ? "true" : "false");
      this.updateRecordingControls();
    }

    updateRecordingControls() {
      const armed = this.isRecording || this.isCountingIn;
      const playing = this.isPlaying || this.isRecordingPlayback;
      if (this.gridArmed !== armed) {
        this.gridArmed = armed;
        this.hitGesture = null;
        this.updateGrid();
      }
      this.elements.record.classList.toggle("recording", armed);
      this.elements.record.setAttribute("aria-pressed", armed ? "true" : "false");
      this.elements.record.title = this.isCountingIn ? "Cancel count-in" : this.isRecording ? "Stop recording" : "Start recording";
      this.elements.countIn.disabled = armed;
      [this.elements.lengthSelect, this.elements.bpmInput, this.elements.bpmSlider, this.elements.tap,
        this.elements.swingInput, this.elements.swingSlider, this.elements.patternSelect,
        document.getElementById("swing-decrease-button"), document.getElementById("swing-increase-button"),
        document.getElementById("tempo-decrease-button"), document.getElementById("tempo-increase-button")]
        .filter(Boolean).forEach((element) => { element.disabled = armed; });
      const status = this.isCountingIn
        ? `Count-in: ${this.countInTotalBeats - this.countInBeatsRemaining} / ${this.countInTotalBeats} beats`
        : this.isRecording ? `Recording: ${this.getGridLength()} steps${this.state.loop ? " · Overwrite" : ""}` : "Ready";
      if (this.elements.recordingStatus.textContent !== status) this.elements.recordingStatus.textContent = status;
      this.elements.play.classList.toggle("button-on", playing);
      this.elements.play.setAttribute("aria-pressed", String(playing));
      this.elements.playlistPrevious.disabled = this.recordings.length < 2;
      this.elements.playlistNext.disabled = this.recordings.length < 2;
      this.elements.playlistClear.disabled = this.recordings.length === 0;
      this.elements.playlistSave.disabled = this.recordings.length === 0;
    }

    updateTimelineButton() {
      this.elements.timelineGuides.classList.toggle("button-on", this.state.timelineGuides);
      this.elements.timelineGuides.setAttribute("aria-pressed", this.state.timelineGuides ? "true" : "false");
      this.elements.timelineBright.classList.toggle("button-on", this.timelineBright);
      this.elements.timelineBright.setAttribute("aria-pressed", this.timelineBright ? "true" : "false");
    }

  }

  document.addEventListener("DOMContentLoaded", () => {
    window.drumMachine = new DrumMachine();
  });
})();

// END OF FILE
