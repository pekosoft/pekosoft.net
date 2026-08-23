// Pekosoft Tap Pad
// pekosoft.net/js/tap_pad.js

let tapHistory = [];
let averageBpm = 0;

const MIN_TAPS_FOR_AVG = 4; // 4 taps = 3 intervals
const RESET_GAP_MS = 8000; // Timeout value for Timer

const TIMER_DEFAULT_ENABLED = true;

const CURRENT_LINE_DEFAULT_ENABLED = true;
const AVERAGE_LINE_DEFAULT_ENABLED = true;
const TARGET_LINE_DEFAULT_ENABLED = true;

const X_STEP = 10;

const TIMELINE_WIDTH = 4096;
const MIN_TIMELINE_HEIGHT = 256;

const TAP_PAD_GRAPH_OFFSET = 48;
const TAP_CLICK_DURATION_SEC = 0.05;
const TAP_PLAYBACK_SCHEDULE_AHEAD_SEC = 0.12;
const TAP_PLAYBACK_TIMER_MS = 25;
const TAP_BLINK_DURATION_MS = 90;

const timelineSvg = document.getElementById("tap-timeline-svg");
const svgUtils = window.PekoSvgUtils;
const timelineUtils = window.PekoSvgTimeline;
let disconnectTimelineResize = null;

const tapPadText = document.getElementById("tap-pad-text");
const copyButton = document.getElementById("copy-button");
const tapPlayButton = document.getElementById("tap-play-button");
const tapCopyButton = document.getElementById("tap-copy-button");
const tapBlinkButton = document.getElementById("tap-blink-button");
const targetInput = document.getElementById("target");
const targetKnob = document.getElementById("target-knob");
const timerButton = document.getElementById("timer-button");
const toggleSoundButton = document.getElementById("toggle-sound-button");
const beatSoundSelect = document.getElementById("beat-sound-type");
const volumeSlider = document.getElementById("volume-slider");
const volumeIncreaseButton = document.getElementById("volume-increase-button");
const volumeDecreaseButton = document.getElementById("volume-decrease-button");

const currentLineButton = document.getElementById("current-line-button");
const averageLineButton = document.getElementById("average-line-button");
const targetLineButton = document.getElementById("target-line-button");
const btnGuides = document.getElementById("guides-button");
window.addEventListener('pekosoft:timeline-bright-change', () => redrawTimeline());
const btnHaptic = document.getElementById("haptic-button");

const currentBpmInput = document.getElementById("current-bpm");
const averageBpmInput = document.getElementById("average-bpm");
const tapsInput = document.getElementById("taps");
const tapButton = document.getElementById("tap-button");

let timerEnabled = readBoolFromStorage("tap_pad.timer_enabled", TIMER_DEFAULT_ENABLED);
let hapticMode = false;
let blinkMode = readBoolFromStorage("tap_pad.blink", false);
let blinkTimeout = null;
let isTapPlaybackOn = false;
let tapPlaybackBpm = 0;
let tapPlaybackTimer = null;
let tapPlaybackNextBeatTime = 0;
let tapPlaybackEvents = [];
let isSoundOn = readBoolFromStorage("tap_pad.sound_on", true);
let soundVolume = clampVolume(parseInt(localStorage.getItem("tap_pad.volume"), 10));
let beatSound = normalizeTone(localStorage.getItem("tap_pad.beat_sound") || "click");

let showCurrentLine = readBoolFromStorage("tap_pad.show_current_line", CURRENT_LINE_DEFAULT_ENABLED);
let showAverageLine = readBoolFromStorage("tap_pad.show_average_line", AVERAGE_LINE_DEFAULT_ENABLED);
let showTargetLine = readBoolFromStorage("tap_pad.show_target_line", TARGET_LINE_DEFAULT_ENABLED);
const globalGuidesDefault = localStorage.getItem('global.guides') !== 'false';
let showGuides = readBoolFromStorage("tap_pad.show_guides", globalGuidesDefault);

applyTimerButtonUI();
applyLineButtonsUI();
applySoundButtonUI();
applyBlinkButtonUI();
applyTapPlaybackButtonUI();
if (btnGuides) btnGuides.classList.toggle('button-on', showGuides);
if (beatSoundSelect) beatSoundSelect.value = beatSound;
if (volumeSlider) volumeSlider.value = String(soundVolume);

// Load haptic state
const savedHapticRaw = localStorage.getItem('tap_pad.haptic');
hapticMode = savedHapticRaw === null
  ? localStorage.getItem('global.haptics') === 'true'
  : savedHapticRaw === 'true';
if (btnHaptic) btnHaptic.classList.toggle('button-on', hapticMode);

const savedTarget = localStorage.getItem("tap_pad.target");
const globalBpm = parseFloat(localStorage.getItem('global.default_bpm'));
if (!isNaN(globalBpm)) {
  targetInput.value = globalBpm;
} else if (savedTarget !== null) {
  targetInput.value = savedTarget;
}

setTargetValue(parseFloat(targetInput.value) || getDefaultTargetValue(), false);

const savedHistory = localStorage.getItem("tap_pad.history");
if (savedHistory) {
  tapHistory = JSON.parse(savedHistory) || [];
}

// If timer is enabled, keep history aligned to the last session
let historyTrimmed = false;
if (timerEnabled) {
  historyTrimmed = trimHistoryToLastSession();
  if (historyTrimmed) {
    // If the session changed, panel should not show old session lines
    localStorage.removeItem("tap_pad.panel");
    tapPadText.value = "";
  }
}

const savedPanel = localStorage.getItem("tap_pad.panel");
if (savedPanel && !historyTrimmed) {
  tapPadText.value = savedPanel;
  tapPadText.scrollTop = tapPadText.scrollHeight;
}

syncStatsFromHistory();
redrawTimeline();
initTargetKnob();
setupTimelineResizeHandling();

if (timerButton) {
  timerButton.addEventListener("click", () => {
    setTimerEnabled(!timerEnabled);
  });
  makeKeyboardActivatable(timerButton, () => setTimerEnabled(!timerEnabled));
}

if (currentLineButton) {
  currentLineButton.addEventListener("click", () => {
    showCurrentLine = !showCurrentLine;
    localStorage.setItem("tap_pad.show_current_line", showCurrentLine ? "1" : "0");
    applyLineButtonsUI();
    redrawTimeline();
  });
  makeKeyboardActivatable(currentLineButton, () => currentLineButton.click());
}

if (averageLineButton) {
  averageLineButton.addEventListener("click", () => {
    showAverageLine = !showAverageLine;
    localStorage.setItem("tap_pad.show_average_line", showAverageLine ? "1" : "0");
    applyLineButtonsUI();
    redrawTimeline();
  });
  makeKeyboardActivatable(averageLineButton, () => averageLineButton.click());
}

if (targetLineButton) {
  targetLineButton.addEventListener("click", () => {
    showTargetLine = !showTargetLine;
    localStorage.setItem("tap_pad.show_target_line", showTargetLine ? "1" : "0");
    applyLineButtonsUI();
    redrawTimeline();
  });
  makeKeyboardActivatable(targetLineButton, () => targetLineButton.click());
}

if (btnGuides) {
  btnGuides.addEventListener("click", () => {
    showGuides = !showGuides;
    btnGuides.classList.toggle('button-on', showGuides);
    localStorage.setItem('tap_pad.show_guides', showGuides);
    redrawTimeline();
  });
  makeKeyboardActivatable(btnGuides, () => btnGuides.click());
}

if (btnHaptic) {
  btnHaptic.addEventListener("click", () => {
    hapticMode = !hapticMode;
    btnHaptic.classList.toggle('button-on', hapticMode);
    localStorage.setItem('tap_pad.haptic', hapticMode);
  });
  makeKeyboardActivatable(btnHaptic, () => btnHaptic.click());
}

if (toggleSoundButton) {
  toggleSoundButton.addEventListener("click", () => {
    isSoundOn = !isSoundOn;
    localStorage.setItem("tap_pad.sound_on", isSoundOn ? "1" : "0");
    if (tapAudioContext && tapAudioContext.state === "suspended") {
      tapAudioContext.resume().catch(() => {
        // Resume is best-effort; the next gesture can retry.
      });
    }
    if (tapAudioContext) {
      const muteNode = ensureTapMasterMuteGainNode(tapAudioContext);
      if (muteNode) {
        const now = tapAudioContext.currentTime;
        muteNode.gain.cancelScheduledValues(now);
        muteNode.gain.setValueAtTime(isSoundOn ? 1 : 0, now);
      }
    }
    applySoundButtonUI();
  });
  makeKeyboardActivatable(toggleSoundButton, () => toggleSoundButton.click());
}

if (beatSoundSelect) {
  beatSoundSelect.addEventListener("change", () => {
    beatSound = normalizeTone(beatSoundSelect.value);
    beatSoundSelect.value = beatSound;
    localStorage.setItem("tap_pad.beat_sound", beatSound);
  });
}

if (volumeSlider) {
  volumeSlider.addEventListener("input", () => {
    soundVolume = clampVolume(parseInt(volumeSlider.value, 10));
    volumeSlider.value = String(soundVolume);
    localStorage.setItem("tap_pad.volume", String(soundVolume));
  });
}

copyButton.addEventListener("click", () => {
  const tapPadData = tapPadText.value.trim();
  if (tapPadData.length === 0) return;
  navigator.clipboard.writeText(tapPadData);
});

if (tapCopyButton) {
  tapCopyButton.addEventListener("click", copyPadInteger);
  makeKeyboardActivatable(tapCopyButton, copyPadInteger);
}

if (tapPlayButton) {
  tapPlayButton.addEventListener("click", () => {
    isTapPlaybackOn ? stopTapPlayback() : startTapPlayback();
  });
  makeKeyboardActivatable(tapPlayButton, () => tapPlayButton.click());
}

if (tapBlinkButton) {
  tapBlinkButton.addEventListener("click", () => {
    blinkMode = !blinkMode;
    localStorage.setItem("tap_pad.blink", blinkMode ? "1" : "0");
    applyBlinkButtonUI();
  });
  makeKeyboardActivatable(tapBlinkButton, () => tapBlinkButton.click());
}

document.getElementById("reset-button").addEventListener("click", () => {
  stopTapPlayback();

  tapHistory = [];
  averageBpm = 0;

  currentBpmInput.value = "0";
  averageBpmInput.value = "0";
  tapsInput.value = "0";
  tapButton.innerText = "0";

  localStorage.removeItem("tap_pad.target");
  localStorage.removeItem("tap_pad.history");
  localStorage.removeItem("tap_pad.panel");
  localStorage.removeItem("tap_pad.timer_enabled");
  localStorage.removeItem("tap_pad.show_current_line");
  localStorage.removeItem("tap_pad.show_average_line");
  localStorage.removeItem("tap_pad.show_target_line");
  localStorage.removeItem("tap_pad.show_guides");
  localStorage.removeItem("tap_pad.haptic");
  localStorage.removeItem("tap_pad.blink");
  localStorage.removeItem("tap_pad.sound_on");
  localStorage.removeItem("tap_pad.beat_sound");
  localStorage.removeItem("tap_pad.volume");

  setTargetValue(getDefaultTargetValue(), false);

  timerEnabled = TIMER_DEFAULT_ENABLED;
  showCurrentLine = CURRENT_LINE_DEFAULT_ENABLED;
  showAverageLine = AVERAGE_LINE_DEFAULT_ENABLED;
  showTargetLine = TARGET_LINE_DEFAULT_ENABLED;
  showGuides = localStorage.getItem('global.guides') !== 'false';
  hapticMode = false;
  blinkMode = false;
  isSoundOn = true;
  beatSound = "click";
  soundVolume = 100;

  applyTimerButtonUI();
  applyLineButtonsUI();
  applyBlinkButtonUI();
  btnGuides.classList.remove('button-on');
  btnHaptic.classList.remove('button-on');
  applySoundButtonUI();
  if (beatSoundSelect) beatSoundSelect.value = beatSound;
  if (volumeSlider) volumeSlider.value = String(soundVolume);

  redrawTimeline();

  tapPadText.value = "";
});

targetInput.addEventListener("input", () => {
  setTargetValue(parseFloat(targetInput.value) || 0);
});

window.addEventListener('pekosoft:global-defaults-change', (event) => {
  const defaults = event.detail;
  if (!defaults || !['bpm', 'all'].includes(defaults.changed)) return;
  const bpm = defaults.bpm;
  if (Number.isFinite(bpm)) setTargetValue(bpm, false);
});

tapButton.addEventListener("click", () => {
  const now = Date.now();

  if (isTapPlaybackOn) {
    stopTapPlayback();
  }

  blinkPad();
  playTapSound();

  // Trigger haptic feedback
  if (hapticMode && 'vibrate' in navigator) navigator.vibrate(10);

  let diff = 0;
  let currentBpm = 0;

  if (tapHistory.length > 0) {
    diff = now - tapHistory[tapHistory.length - 1].time;

    // Pause = new session (only if TIMER is enabled)
    if (timerEnabled && diff > RESET_GAP_MS) {
      resetSession({ clearPanel: true });
      diff = 0;
      currentBpm = 0;
    } else {
      currentBpm = diff > 0 ? 60000 / diff : 0;
    }
  }

  const record = { time: now, bpm: currentBpm };
  tapHistory.push(record);
  localStorage.setItem("tap_pad.history", JSON.stringify(tapHistory));

  if (tapHistory.length > 1) {
    currentBpmInput.value = currentBpm.toFixed(3);
  } else {
    currentBpmInput.value = "0";
  }

  tapsInput.value = tapHistory.length;

  if (tapHistory.length >= MIN_TAPS_FOR_AVG) {
    const intervals = tapHistory.length - 1;
    const totalTime = tapHistory[tapHistory.length - 1].time - tapHistory[0].time;
    averageBpm = totalTime > 0 ? (intervals * 60000) / totalTime : 0;

    averageBpmInput.value = averageBpm.toFixed(3);
    tapButton.innerText = Math.round(averageBpm);
  } else {
    averageBpm = 0;
    averageBpmInput.value = "0";
    tapButton.innerText = tapHistory.length === 1 ? "X" : Math.round(currentBpm);
  }

  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });

  let logLine = `[${timestamp}]`;

  if (tapHistory.length > 1) {
    const beat = tapHistory.length;

    logLine += ` Tap: ${beat} | Current BPM: ${currentBpm.toFixed(3)} | Current interval: ${diff.toFixed(3)} ms`;

    if (tapHistory.length >= MIN_TAPS_FOR_AVG) {
      const averageInterval =
        (tapHistory[tapHistory.length - 1].time - tapHistory[0].time) / (beat - 1);

      logLine += ` | Average BPM: ${averageBpm.toFixed(3)} | Average interval: ${averageInterval.toFixed(3)} ms`;
    }
  } else {
    logLine += ` Tap: 1`;
  }

  tapPadText.value += logLine + "\n";
  tapPadText.scrollTop = tapPadText.scrollHeight;
  localStorage.setItem("tap_pad.panel", tapPadText.value);

  redrawTimeline();
});

function setTimerEnabled(enabled) {
  timerEnabled = !!enabled;
  localStorage.setItem("tap_pad.timer_enabled", timerEnabled ? "1" : "0");
  applyTimerButtonUI();
}

function applyTimerButtonUI() {
  if (!timerButton) return;
  timerButton.classList.toggle("button-on", timerEnabled);
  timerButton.setAttribute("aria-pressed", timerEnabled ? "true" : "false");
}

function applyLineButtonsUI() {
  if (currentLineButton) {
    currentLineButton.classList.toggle("button-on", showCurrentLine);
    currentLineButton.setAttribute("aria-pressed", showCurrentLine ? "true" : "false");
  }
  if (averageLineButton) {
    averageLineButton.classList.toggle("button-on", showAverageLine);
    averageLineButton.setAttribute("aria-pressed", showAverageLine ? "true" : "false");
  }
  if (targetLineButton) {
    targetLineButton.classList.toggle("button-on", showTargetLine);
    targetLineButton.setAttribute("aria-pressed", showTargetLine ? "true" : "false");
  }
}

function applySoundButtonUI() {
  if (!toggleSoundButton) return;
  toggleSoundButton.classList.toggle("button-on", isSoundOn);
  toggleSoundButton.setAttribute("aria-pressed", isSoundOn ? "true" : "false");
}

function applyBlinkButtonUI() {
  if (!tapBlinkButton) return;
  tapBlinkButton.classList.toggle("button-on", blinkMode);
  tapBlinkButton.setAttribute("aria-pressed", blinkMode ? "true" : "false");
}

function applyTapPlaybackButtonUI() {
  if (!tapPlayButton) return;
  tapPlayButton.classList.toggle("button-on", isTapPlaybackOn);
  tapPlayButton.setAttribute("aria-pressed", isTapPlaybackOn ? "true" : "false");
}

function getCurrentPadInteger() {
  if (!tapButton) return null;
  const value = parseInt(tapButton.textContent.trim(), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function startTapPlayback() {
  const bpm = getCurrentPadInteger();
  if (!bpm) return;

  const context = await ensureTapAudioContextReady();
  if (!context || isTapPlaybackOn) return;

  tapPlaybackBpm = bpm;
  tapPlaybackNextBeatTime = context.currentTime + 0.001;
  isTapPlaybackOn = true;
  applyTapPlaybackButtonUI();
  updateTapMetersSourceBridge();
  scheduleTapPlayback();
}

function stopTapPlayback() {
  if (tapPlaybackTimer !== null) {
    window.clearTimeout(tapPlaybackTimer);
    tapPlaybackTimer = null;
  }

  stopTapPlaybackEvents();
  isTapPlaybackOn = false;
  tapPlaybackBpm = 0;
  tapPlaybackNextBeatTime = 0;
  applyTapPlaybackButtonUI();
  updateTapMetersSourceBridge();
}

function scheduleTapPlayback() {
  tapPlaybackTimer = null;
  if (!isTapPlaybackOn || !tapAudioContext) return;

  const context = tapAudioContext;
  const beatIntervalSec = 60 / tapPlaybackBpm;
  if (!Number.isFinite(beatIntervalSec) || beatIntervalSec <= 0) {
    stopTapPlayback();
    return;
  }

  const now = context.currentTime;
  pruneTapPlaybackEvents(now);

  if (tapPlaybackNextBeatTime < now - beatIntervalSec) {
    tapPlaybackNextBeatTime = now + 0.001;
  }

  let scheduledCount = 0;
  while (tapPlaybackNextBeatTime < now + TAP_PLAYBACK_SCHEDULE_AHEAD_SEC && scheduledCount < 128) {
    // Meters receive every beat; SOUND mutes only the master output.
    const event = playTapTransient(context, tapPlaybackNextBeatTime, TAP_CLICK_DURATION_SEC);
    schedulePadBlink(tapPlaybackNextBeatTime);
    if (event?.stopNode) {
      tapPlaybackEvents.push({
        stopNode: event.stopNode,
        stopTime: event.stopTime
      });
    }
    tapPlaybackNextBeatTime += beatIntervalSec;
    scheduledCount++;
  }

  tapPlaybackTimer = window.setTimeout(scheduleTapPlayback, TAP_PLAYBACK_TIMER_MS);
}

function pruneTapPlaybackEvents(now = tapAudioContext?.currentTime ?? 0) {
  tapPlaybackEvents = tapPlaybackEvents.filter(event => !Number.isFinite(event.stopTime) || event.stopTime > now - 0.20);
}

function stopTapPlaybackEvents() {
  const now = tapAudioContext?.currentTime ?? 0;
  tapPlaybackEvents.forEach((event) => {
    if (!event.stopNode || (Number.isFinite(event.stopTime) && event.stopTime <= now)) return;
    try {
      event.stopNode.stop(now);
    } catch {
      // ignore stop races on already-ended scheduled clicks
    }
  });
  tapPlaybackEvents = [];
}

function copyPadInteger() {
  if (!tapButton || !navigator.clipboard || typeof navigator.clipboard.writeText !== "function") return;
  const integerText = tapButton.textContent.trim();
  if (!/^-?\d+$/.test(integerText)) return;
  navigator.clipboard.writeText(integerText);
}

function blinkPad() {
  if (!blinkMode || !tapButton) return;
  if (blinkTimeout !== null) window.clearTimeout(blinkTimeout);
  tapButton.classList.add("pad-blink-active");
  blinkTimeout = window.setTimeout(() => {
    tapButton.classList.remove("pad-blink-active");
    blinkTimeout = null;
  }, TAP_BLINK_DURATION_MS);
}

function schedulePadBlink(whenSec) {
  if (!blinkMode || !tapButton || !tapAudioContext) return;
  const delayMs = Math.max(0, (whenSec - tapAudioContext.currentTime) * 1000);
  window.setTimeout(blinkPad, delayMs);
}

function normalizeTone(tone) {
  const allowed = ["click", "kick", "hat", "sine", "square", "sawtooth", "triangle", "piano"];
  return allowed.includes(tone) ? tone : "click";
}

function clampVolume(value) {
  if (!Number.isFinite(value)) return 100;
  return Math.max(0, Math.min(100, value));
}

function playTapSound() {
  if (typeof window.playTransientSound !== "function") return;

  ensureTapAudioContextReady().then((context) => {
    if (!context) return;
    playTapTransient(context, undefined, TAP_CLICK_DURATION_SEC);
  });
}

function playTapTransient(context, when, durationSec = TAP_CLICK_DURATION_SEC) {
  if (typeof window.playTransientSound !== "function" || !context) return null;

  const now = context.currentTime;
  const startTime = Math.max(when ?? now, now + 0.001);
  tapMetersLastActiveSec = Math.max(tapMetersLastActiveSec, startTime);

  const event = window.playTransientSound({
    audioContext: context,
    destinationNode: ensureTapMetersAnalyser(context),
    tone: beatSound,
    when: startTime,
    gain: soundVolume / 100,
    pitchRatio: 1,
    durationSec
  });

  updateTapMetersSourceBridge();
  return event;
}

let tapAudioContext = null;
let tapAudioResumePromise = null;
let tapMetersAnalyser = null;
let tapMasterMuteGainNode = null;
let tapMetersLastActiveSec = 0;

function ensureTapMasterMuteGainNode(context) {
  if (!context) return null;
  if (!tapMasterMuteGainNode) {
    tapMasterMuteGainNode = context.createGain();
    tapMasterMuteGainNode.gain.value = isSoundOn ? 1 : 0;
    tapMasterMuteGainNode.connect(context.destination);
  }
  return tapMasterMuteGainNode;
}

function ensureTapMetersAnalyser(context) {
  if (!context) return null;
  if (!tapMetersAnalyser) {
    tapMetersAnalyser = context.createAnalyser();
    tapMetersAnalyser.fftSize = 2048;
    tapMetersAnalyser.connect(ensureTapMasterMuteGainNode(context));
  }
  return tapMetersAnalyser;
}

function updateTapMetersSourceBridge() {
  const context = tapAudioContext;
  const analyser = ensureTapMetersAnalyser(context);
  if (!context || !analyser) {
    window.__pekosoftMetersSource = null;
    return;
  }

  window.__pekosoftMetersSource = {
    analyser,
    channelCount: 1,
    sampleRate: context.sampleRate,
    isActive: () => isTapPlaybackOn || (context.currentTime - tapMetersLastActiveSec) < 0.20,
    isStopped: () => !isTapPlaybackOn
  };
}

function getTapAudioContext() {
  if (tapAudioContext) return tapAudioContext;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  tapAudioContext = new AudioContextCtor();
  ensureTapMetersAnalyser(tapAudioContext);
  updateTapMetersSourceBridge();
  return tapAudioContext;
}

async function ensureTapAudioContextReady() {
  const context = getTapAudioContext();
  if (!context) return null;

  if (context.state === "suspended") {
    if (!tapAudioResumePromise) {
      tapAudioResumePromise = context.resume()
        .catch(() => null)
        .finally(() => {
          tapAudioResumePromise = null;
        });
    }
    await tapAudioResumePromise;
  }

  if (context.state === "closed") {
    return null;
  }
  updateTapMetersSourceBridge();
  return context;
}

function readBoolFromStorage(key, fallback) {
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === "1" || v === "true";
}

function resetSession({ clearPanel = false } = {}) {
  tapHistory = [];
  averageBpm = 0;

  // redraw timeline so Guides (if enabled) remain visible
  redrawTimeline();

  if (clearPanel) {
    tapPadText.value = "";
    localStorage.removeItem("tap_pad.panel");
  }

  localStorage.setItem("tap_pad.history", JSON.stringify(tapHistory));

  currentBpmInput.value = "0";
  averageBpmInput.value = "0";
  tapsInput.value = "0";
  tapButton.innerText = "0";
}

function trimHistoryToLastSession() {
  if (tapHistory.length < 2) return false;

  let cutIndex = 0;

  for (let i = tapHistory.length - 1; i > 0; i--) {
    const gap = tapHistory[i].time - tapHistory[i - 1].time;
    if (gap > RESET_GAP_MS) {
      cutIndex = i;
      break;
    }
  }

  if (cutIndex > 0) {
    tapHistory = tapHistory.slice(cutIndex);
    localStorage.setItem("tap_pad.history", JSON.stringify(tapHistory));
    return true;
  }

  return false;
}

function syncStatsFromHistory() {
  const taps = tapHistory.length;
  tapsInput.value = taps;

  if (taps < 1) {
    currentBpmInput.value = "0";
    averageBpmInput.value = "0";
    tapButton.innerText = "0";
    averageBpm = 0;
    return;
  }

  let currentBpm = 0;

  if (taps > 1) {
    const diff = tapHistory[taps - 1].time - tapHistory[taps - 2].time;
    currentBpm = diff > 0 ? 60000 / diff : 0;
    currentBpmInput.value = currentBpm.toFixed(3);
  } else {
    currentBpmInput.value = "0";
  }

  if (taps >= MIN_TAPS_FOR_AVG) {
    const intervals = taps - 1;
    const totalTime = tapHistory[taps - 1].time - tapHistory[0].time;
    averageBpm = totalTime > 0 ? (intervals * 60000) / totalTime : 0;

    averageBpmInput.value = averageBpm.toFixed(3);
    tapButton.innerText = Math.round(averageBpm);
  } else {
    averageBpm = 0;
    averageBpmInput.value = "0";
    tapButton.innerText = taps > 1 ? Math.round(currentBpm) : "0";
  }
}

function drawCurrentPoint(index, bpm, timelineHeight) {
  const x = TAP_PAD_GRAPH_OFFSET + Math.round(index * X_STEP) + 0.5;
  const y = timelineHeight - bpm + 0.5;
  return { x, y };
}

function drawAveragePoint(index, bpm, timelineHeight) {
  const x = TAP_PAD_GRAPH_OFFSET + Math.round(index * X_STEP) + 0.5;
  const y = timelineHeight - bpm + 0.5;
  return { x, y };
}

function averageBpmAtIndex(i) {
  // i is 0-based index in tapHistory
  const tapNumber = i + 1;
  if (tapNumber < MIN_TAPS_FOR_AVG) return 0;

  const intervals = i; // intervals since first tap
  const totalTime = tapHistory[i].time - tapHistory[0].time;
  if (totalTime <= 0) return 0;

  return (intervals * 60000) / totalTime;
}

function redrawTimeline() {
  if (!timelineSvg) return;

  const timelineHeight = getTimelineHeight();
  syncTimelineViewport(timelineHeight);

  timelineSvg.innerHTML = "";

  const currentColor = getCssVariable("--color1");
  const averageColor = getCssVariable("--color2");
  const whiteColor = getCssVariable("--white");
  const baseGuideColor = getCssVariable("--grey1");
  const guideColor = window.PekoBrightGuides?.getTimelineGuideColor(baseGuideColor) || baseGuideColor;

  const guidesLayer = svgUtils.createElement("g");
  const targetLayer = svgUtils.createElement("g");
  const currentBarsLayer = svgUtils.createElement("g");
  const currentPathLayer = svgUtils.createElement("g");
  const averageBarsLayer = svgUtils.createElement("g");
  const averagePathLayer = svgUtils.createElement("g");

  timelineSvg.appendChild(guidesLayer);
  timelineSvg.appendChild(targetLayer);
  timelineSvg.appendChild(currentBarsLayer);
  timelineSvg.appendChild(currentPathLayer);
  timelineSvg.appendChild(averageBarsLayer);
  timelineSvg.appendChild(averagePathLayer);

  if (showTargetLine) {
    drawTargetLine(targetLayer, whiteColor, timelineHeight);
  }

  drawReferenceLines(guidesLayer, guideColor, timelineHeight);

  const currentPoints = [{ x: TAP_PAD_GRAPH_OFFSET + 0.5, y: timelineHeight + 0.5 }];
  const averagePoints = [{ x: TAP_PAD_GRAPH_OFFSET + 0.5, y: timelineHeight + 0.5 }];

  // Start at 2nd tap (1st BPM is not meaningful)
  for (let i = 1; i < tapHistory.length; i++) {
    if (showCurrentLine) {
      const point = drawCurrentPoint(i + 1, tapHistory[i].bpm, timelineHeight);
      currentPoints.push(point);
      currentBarsLayer.appendChild(createTimelineLine(point.x, point.y, point.x, timelineHeight, currentColor));
    }

    if (showAverageLine) {
      const avg = averageBpmAtIndex(i);
      if (avg > 0) {
        const point = drawAveragePoint(i + 1, avg, timelineHeight);
        averagePoints.push(point);
        averageBarsLayer.appendChild(createTimelineLine(point.x, point.y, point.x, timelineHeight, averageColor));
      }
    }
  }

  if (showCurrentLine && currentPoints.length > 1) {
    currentPathLayer.appendChild(createTimelinePath(currentPoints, currentColor));
  }

  if (showAverageLine && averagePoints.length > 1) {
    averagePathLayer.appendChild(createTimelinePath(averagePoints, averageColor));
  }
}

function drawReferenceLines(layer, color, timelineHeight) {
  if (!showGuides) return;

  const maxGuide = Math.floor(timelineHeight / 30) * 30;
  const titleY = Math.round(timelineHeight - (maxGuide - 30)) - 5;

  const title = svgUtils.createText({
    x: 40,
    y: titleY,
    text: "BPM",
    fill: color,
    fontSize: 12,
    fontFamily: "Arial, sans-serif",
    textAnchor: "end"
  });
  layer.appendChild(title);

  layer.appendChild(createTimelineLine(
    TAP_PAD_GRAPH_OFFSET,
    0,
    TAP_PAD_GRAPH_OFFSET,
    timelineHeight,
    color
  ));

  for (let bpm = 30; bpm <= maxGuide; bpm += 30) {
    const y = Math.round(timelineHeight - bpm) + 0.5;
    layer.appendChild(createTimelineLine(0, y, TIMELINE_WIDTH, y, color));

    if (bpm >= maxGuide - 30) continue;

    const label = svgUtils.createText({
      x: 40,
      y: y - 5,
      text: bpm.toString(),
      fill: color,
      fontSize: 12,
      fontFamily: "Arial, sans-serif",
      textAnchor: "end"
    });
    layer.appendChild(label);
  }
}

function drawTargetLine(layer, color, timelineHeight) {
  const targetValue = parseFloat(targetInput.value);
  const y = timelineHeight - targetValue + 0.5;
  layer.appendChild(createTimelineLine(0, y, TIMELINE_WIDTH, y, color));
}

function getTimelineHeight() {
  return timelineUtils.getHeight(timelineSvg, MIN_TIMELINE_HEIGHT);
}

function syncTimelineViewport(height) {
  timelineUtils.syncViewBox(timelineSvg, TIMELINE_WIDTH, height);
}

function setupTimelineResizeHandling() {
  if (disconnectTimelineResize) {
    disconnectTimelineResize();
  }

  disconnectTimelineResize = timelineUtils.observeResize({
    svg: timelineSvg,
    container: document.getElementById("timeline-container"),
    onResize: redrawTimeline
  });
}

function createTimelineLine(x1, y1, x2, y2, color) {
  return svgUtils.createLine({
    x1,
    y1,
    x2,
    y2,
    stroke: color,
    strokeWidth: 1,
    crisp: true
  });
}

function createTimelinePath(points, color) {
  return svgUtils.createPath({
    points,
    stroke: color,
    strokeWidth: 1,
    fill: "none",
    crisp: true
  });
}

function getCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function clampTargetValue(value) {
  return Math.min(320, Math.max(30, value));
}

let volumeIncreaseInterval = null;
let volumeDecreaseInterval = null;

function getDefaultTargetValue() {
  const globalBpm = parseFloat(localStorage.getItem('global.default_bpm'));
  return !isNaN(globalBpm) ? globalBpm : 120;
}

function setTargetValue(value, persist = true) {
  const nextValue = clampTargetValue(value);
  targetInput.value = String(nextValue);
  if (persist) {
    localStorage.setItem("tap_pad.target", String(nextValue));
  }
  redrawTimeline();
  syncTargetKnobAngle();
}

function increaseVolume() {
  soundVolume = clampVolume(soundVolume + 1);
  if (volumeSlider) volumeSlider.value = String(soundVolume);
  localStorage.setItem("tap_pad.volume", String(soundVolume));
}

function decreaseVolume() {
  soundVolume = clampVolume(soundVolume - 1);
  if (volumeSlider) volumeSlider.value = String(soundVolume);
  localStorage.setItem("tap_pad.volume", String(soundVolume));
}

function startHoldVolumeIncrease() {
  increaseVolume();
  volumeIncreaseInterval = setInterval(increaseVolume, 100);
}

function stopHoldVolumeIncrease() {
  clearInterval(volumeIncreaseInterval);
}

function startHoldVolumeDecrease() {
  decreaseVolume();
  volumeDecreaseInterval = setInterval(decreaseVolume, 100);
}

function stopHoldVolumeDecrease() {
  clearInterval(volumeDecreaseInterval);
}

function handleHold(startFn, stopFn, element) {
  let activePointerId = null;

  const stop = (event) => {
    if (activePointerId === null) return;
    if (event && event.pointerId !== activePointerId) return;
    if (event && typeof element.releasePointerCapture === "function") {
      try {
        element.releasePointerCapture(activePointerId);
      } catch (_) {}
    }
    activePointerId = null;
    stopFn();
  };

  element.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      activePointerId = e.pointerId;
      if (typeof element.setPointerCapture === "function") {
        try {
          element.setPointerCapture(activePointerId);
        } catch (_) {}
      }
      startFn();
    }
  );

  element.addEventListener("pointerup", stop);
  element.addEventListener("pointercancel", stop);
}

if (volumeIncreaseButton && volumeDecreaseButton) {
  handleHold(startHoldVolumeIncrease, stopHoldVolumeIncrease, volumeIncreaseButton);
  handleHold(startHoldVolumeDecrease, stopHoldVolumeDecrease, volumeDecreaseButton);
}

function syncTargetKnobAngle() {
  if (!targetKnob || !targetInput) return;
  const current = parseFloat(targetInput.value || `${getDefaultTargetValue()}`);
  const value = Number.isFinite(current) ? current : getDefaultTargetValue();
  const min = 30;
  const max = 320;
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -135 + ratio * 270;
  targetKnob.style.setProperty("--knob-angle", `${angle}deg`);
}

function attachKnobBehavior(knob, handlers) {
  let isDragging = false;
  let dragStartY = 0;
  let dragMoved = false;
  let suppressClick = false;
  let dragStartValue;

  knob.addEventListener("click", () => {
    if (suppressClick) {
      suppressClick = false;
    }
  });

  knob.addEventListener("wheel", (event) => {
    event.preventDefault();
    handlers.onWheel(event.deltaY > 0 ? -1 : 1);
  }, { passive: false });

  knob.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      handlers.onWheel(1);
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      handlers.onWheel(-1);
    } else if (event.key === "Home" && typeof handlers.onHome === "function") {
      event.preventDefault();
      handlers.onHome();
    } else if (event.key === "End" && typeof handlers.onEnd === "function") {
      event.preventDefault();
      handlers.onEnd();
    }
  });

  knob.addEventListener("dblclick", (event) => {
    event.preventDefault();
    handlers.onDoubleClick();
  });

  knob.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (typeof knob.focus === "function") {
      knob.focus({ preventScroll: true });
    }
    isDragging = true;
    dragStartY = event.clientY;
    dragMoved = false;
    suppressClick = false;
    dragStartValue = handlers.onDragStart();
    if (typeof knob.setPointerCapture === "function") {
      try {
        knob.setPointerCapture(event.pointerId);
      } catch (_) {
        // Ignore capture failures; drag still works without explicit capture.
      }
    }
  });

  knob.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    event.preventDefault();
    if (Math.abs(event.clientY - dragStartY) >= 6) {
      dragMoved = true;
    }
    handlers.onDragMove({ startValue: dragStartValue, deltaY: dragStartY - event.clientY });
  });

  const endDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    if (dragMoved) {
      suppressClick = true;
    }
    if (typeof knob.releasePointerCapture === "function") {
      try {
        knob.releasePointerCapture(event.pointerId);
      } catch (_) {
        // Ignore if capture was never acquired.
      }
    }
  };

  knob.addEventListener("pointerup", endDrag);
  knob.addEventListener("pointercancel", endDrag);
}

function initTargetKnob() {
  if (!targetKnob || !targetInput) return;

  syncTargetKnobAngle();

  attachKnobBehavior(targetKnob, {
    onWheel: (direction) => {
      setTargetValue((parseFloat(targetInput.value) || getDefaultTargetValue()) + direction);
    },
    onHome: () => {
      const min = targetInput.min === "" ? 30 : parseFloat(targetInput.min);
      setTargetValue(Number.isFinite(min) ? min : 30);
    },
    onEnd: () => {
      const max = targetInput.max === "" ? 320 : parseFloat(targetInput.max);
      setTargetValue(Number.isFinite(max) ? max : 320);
    },
    onDoubleClick: () => {
      setTargetValue(getDefaultTargetValue());
    },
    onDragStart: () => parseFloat(targetInput.value || `${getDefaultTargetValue()}`) || getDefaultTargetValue(),
    onDragMove: ({ startValue, deltaY }) => {
      const nextValue = startValue + Math.round(deltaY);
      setTargetValue(nextValue);
    },
  });
}

function makeKeyboardActivatable(button, actionFn) {
  if (!button) return;
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      actionFn();
    }
  });
}

makeKeyboardActivatable(volumeIncreaseButton, increaseVolume);
makeKeyboardActivatable(volumeDecreaseButton, decreaseVolume);

// END OF FILE
