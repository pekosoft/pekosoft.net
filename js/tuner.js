// Pekosoft Tuner
// pekosoft.net/js/tuner.js

const listenButton = document.getElementById('listen-button');
const toneButton = document.getElementById('tone-button');
const holdButton = document.getElementById('hold-button');

const profileSelect = document.getElementById('profile-select');
const followButton = document.getElementById('follow-button');
const clearPanelButton = document.getElementById('clear-panel-button');
const resetButton = document.getElementById('reset-button');

const detectedNoteField = document.getElementById('detected-note-field');
const detectedHzField = document.getElementById('detected-hz-field');
const targetNoteField = document.getElementById('target-note-field');
const targetHzField = document.getElementById('target-hz-field');
const centsField = document.getElementById('cents-field');
const chromaticOctaveInput = document.getElementById('chromatic-octave-input');
const toneTypeSelect = document.getElementById('tone-type');

const detectedNoteLabel = document.getElementById('detected-note');
const detectedHzLabel = document.getElementById('detected-hz');
const centsReadout = document.getElementById('cents-readout');
const statusReadout = document.getElementById('status-readout');

const targetGrid = document.getElementById('target-grid');
const tunerNeedle = document.getElementById('tuner-needle');

const volumeSlider = document.getElementById('volume-slider');
const volumeIncreaseButton = document.getElementById('volume-increase-button');
const volumeDecreaseButton = document.getElementById('volume-decrease-button');

const guidesButton = document.getElementById('guides-button');
window.addEventListener('pekosoft:timeline-bright-change', () => redrawTimeline());
const tunerTimelineSvg = document.getElementById('tuner-timeline-svg');
const tunerTimelineContainer = document.getElementById('timeline-container');
const tunerSvgUtils = window.PekoSvgUtils;
const tunerSvgTimeline = window.PekoSvgTimeline;
let disconnectTunerTimelineResize = null;

const tunerText = document.getElementById('tuner-text');
const copyButton = document.getElementById('copy-button');
const panelClearButton = document.getElementById('panel-clear-button');

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const PROFILE_TEMPLATES = {
  chromatic: [],
  guitar: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  bass: ['E1', 'A1', 'D2', 'G2']
};

const STORAGE = {
  profile: 'tuner.profile',
  followTarget: 'tuner.follow_target',
  chromaticOctave: 'tuner.chromatic_octave',
  chromaticIndex: 'tuner.chromatic_index',
  guitarIndex: 'tuner.guitar_index',
  bassIndex: 'tuner.bass_index',
  toneType: 'tuner.tone_type',
  volume: 'tuner.volume',
  guides: 'tuner.show_guides',
  panel: 'tuner.panel',
  timeline: 'tuner.timeline'
};

const state = {
  profile: 'guitar',
  followTarget: true,
  hold: false,
  listening: false,
  toneOn: false,
  toneRunning: false,
  detectedHz: 0,
  smoothedHz: 0,
  detectedMidi: null,
  detectedNote: '--',
  targetNote: 'E2',
  targetHz: 82.407,
  cents: 0,
  chromaticOctave: 4,
  chromaticIndex: 9,
  selectedIndex: {
    guitar: 0,
    bass: 0
  },
  toneType: 'sine',
  volume: 30,
  showGuides: true,
  timeline: [],
  lastTimelineTs: 0,
  lastPanelTs: 0,
  rafId: 0
};

let audioContext = null;
let mediaStream = null;
let mediaSource = null;
let analyserNode = null;
let meterSinkGainNode = null;
let toneAnalyserNode = null;
let timeDomainBuffer = null;
let toneVoice = null;

const TUNER_TIMELINE_WIDTH = 4096;
const TUNER_TIMELINE_MIN_HEIGHT = 256;
const TIMELINE_STEP = 10;
const TIMELINE_MAX_POINTS = Math.floor((TUNER_TIMELINE_WIDTH - 48) / TIMELINE_STEP);

function getA4Hz() {
  const savedA4 = parseFloat(localStorage.getItem('global.a4_hz'));
  return Number.isFinite(savedA4) && savedA4 > 0 ? savedA4 : 440;
}

function normalizeToneType(value) {
  const allowed = ['sine', 'square', 'sawtooth', 'triangle', 'piano'];
  return allowed.includes(value) ? value : 'sine';
}

function parseNoteName(noteName) {
  const match = /^([A-G](?:#)?)(-?\d+)$/.exec(noteName);
  if (!match) return null;
  const notePart = match[1];
  const octave = parseInt(match[2], 10);
  const noteIndex = NOTE_NAMES.indexOf(notePart);
  if (noteIndex < 0 || !Number.isFinite(octave)) return null;
  const midi = (octave + 1) * 12 + noteIndex;
  const hz = midiToFrequency(midi);
  return { noteName, midi, hz };
}

function midiToFrequency(midi) {
  return getA4Hz() * Math.pow(2, (midi - 69) / 12);
}

function frequencyToMidi(frequency) {
  return 69 + 12 * Math.log2(frequency / getA4Hz());
}

function midiToNoteName(midiValue) {
  const rounded = Math.round(midiValue);
  const note = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${note}${octave}`;
}

function getProfileTargets(profile) {
  if (profile === 'chromatic') {
    return CHROMATIC_NAMES.map((noteName, index) => {
      const midi = (state.chromaticOctave + 1) * 12 + index;
      return {
        noteName: `${noteName}${state.chromaticOctave}`,
        midi,
        hz: midiToFrequency(midi)
      };
    });
  }

  return PROFILE_TEMPLATES[profile]
    .map(parseNoteName)
    .filter(Boolean);
}

function getCurrentSelectedIndex() {
  if (state.profile === 'chromatic') return state.chromaticIndex;
  return state.selectedIndex[state.profile] || 0;
}

function setCurrentSelectedIndex(index) {
  if (state.profile === 'chromatic') {
    state.chromaticIndex = index;
    return;
  }
  state.selectedIndex[state.profile] = index;
}

function getCurrentTarget() {
  const targets = getProfileTargets(state.profile);
  if (!targets.length) return null;
  const index = Math.max(0, Math.min(getCurrentSelectedIndex(), targets.length - 1));
  return targets[index];
}

function updateCurrentTarget() {
  const target = getCurrentTarget();
  if (!target) {
    state.targetNote = '--';
    state.targetHz = 0;
    return;
  }

  state.targetNote = target.noteName;
  state.targetHz = target.hz;

  if (state.toneRunning && toneVoice) {
    updateToneFrequency(target.hz);
  }
}

function findNearestTargetIndexByMidi(targets, midi) {
  if (!targets.length || !Number.isFinite(midi)) return 0;

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < targets.length; i++) {
    const distance = Math.abs(targets[i].midi - midi);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = i;
    }
  }

  return nearestIndex;
}

function renderTargetButtons() {
  const targets = getProfileTargets(state.profile);
  targetGrid.innerHTML = '';

  targets.forEach((target, index) => {
    const button = document.createElement('button');
    button.className = 'square tuner-target-button';
    if (index === getCurrentSelectedIndex()) {
      button.classList.add('button-on');
    }

    button.innerHTML = `<span class="button-note">${target.noteName}</span>`;
    button.addEventListener('click', () => {
      setCurrentSelectedIndex(index);
      state.followTarget = false;
      updateFollowButton();
      updateCurrentTarget();
      saveSettings();
      renderTargetButtons();
      syncReadout();
    });

    targetGrid.appendChild(button);
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setNeedleByCents(cents) {
  const clamped = clamp(cents, -50, 50);
  const ratio = (clamped + 50) / 100;
  const percent = ratio * 100;
  tunerNeedle.style.left = `calc(${percent}% - 1px)`;
}

function formatHz(value) {
  if (!Number.isFinite(value) || value <= 0) return '0.000';
  return value.toFixed(3);
}

function formatCents(value) {
  if (!Number.isFinite(value)) return '0.0';
  return value.toFixed(1);
}

function setStatus(text) {
  statusReadout.textContent = text;
}

function syncReadout() {
  if (profileSelect) {
    profileSelect.value = state.profile;
  }

  detectedNoteLabel.textContent = state.detectedNote;
  detectedHzLabel.textContent = `${formatHz(state.smoothedHz)} HZ`;
  centsReadout.textContent = `${formatCents(state.cents)} cents`;

  detectedNoteField.value = state.detectedNote;
  detectedHzField.value = formatHz(state.smoothedHz);
  targetNoteField.value = state.targetNote;
  targetHzField.value = formatHz(state.targetHz);
  centsField.value = formatCents(state.cents);

  setNeedleByCents(state.cents);
}

function updateProfileSelect() {
  if (!profileSelect) return;
  profileSelect.value = state.profile;
}

function updateFollowButton() {
  followButton.classList.toggle('button-on', state.followTarget);
}

function updateGuidesButton() {
  guidesButton.classList.toggle('button-on', state.showGuides);
}

function updateHoldButton() {
  holdButton.classList.toggle('button-on', state.hold);
}

function updateListenButton() {
  listenButton.classList.toggle('button-on', state.listening);
}

function updateToneButton() {
  toneButton.classList.toggle('button-on', state.toneOn);
}

function getTunerTimelineHeight() {
  if (!tunerTimelineSvg) return TUNER_TIMELINE_MIN_HEIGHT;
  return tunerSvgTimeline?.resolveHeight?.({
    svg: tunerTimelineSvg,
    minHeight: TUNER_TIMELINE_MIN_HEIGHT
  }) || TUNER_TIMELINE_MIN_HEIGHT;
}

function drawGuides(timelineHeight) {
  if (!state.showGuides) return;
  if (!tunerTimelineSvg || !tunerSvgUtils) return;

  const baseLineColor = getCssVariable('--grey1');
  const baseLabelColor = getCssVariable('--grey2');
  const lineColor = window.PekoBrightGuides?.getTimelineGuideColor(baseLineColor) || baseLineColor;
  const labelColor = window.PekoBrightGuides?.getTimelineGuideColor(baseLabelColor) || baseLabelColor;
  const guidesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  guidesLayer.setAttribute('class', 'tuner-timeline-guides');
  tunerTimelineSvg.appendChild(guidesLayer);

  const lines = [
    { cents: -50, label: '-50' },
    { cents: -25, label: '-25' },
    { cents: 0, label: '0' },
    { cents: 25, label: '+25' },
    { cents: 50, label: '+50' }
  ];

  lines.forEach((line) => {
    const y = centsToTimelineY(line.cents, timelineHeight);
    guidesLayer.appendChild(tunerSvgUtils.createLine({
      x1: 0,
      y1: y,
      x2: TUNER_TIMELINE_WIDTH,
      y2: y,
      color: lineColor
    }));
    guidesLayer.appendChild(tunerSvgUtils.createText({
      x: 44,
      y: y - 4,
      text: line.label,
      color: labelColor,
      size: 12,
      anchor: 'end'
    }));
  });
}

function centsToTimelineY(cents, timelineHeight) {
  const clamped = clamp(cents, -50, 50);
  const ratio = (clamped + 50) / 100;
  return timelineHeight - Math.round(ratio * timelineHeight);
}

function redrawTimeline() {
  if (!tunerTimelineSvg || !tunerSvgUtils) return;
  const timelineHeight = getTunerTimelineHeight();
  tunerSvgTimeline?.setViewBox?.({
    svg: tunerTimelineSvg,
    width: TUNER_TIMELINE_WIDTH,
    height: timelineHeight
  });
  tunerTimelineSvg.innerHTML = '';

  drawGuides(timelineHeight);

  if (state.timeline.length < 1) {
    return;
  }

  const points = [];

  for (let i = 0; i < state.timeline.length; i++) {
    const entry = state.timeline[i];
    const x = 48 + i * TIMELINE_STEP;
    const y = centsToTimelineY(entry.cents, timelineHeight);
    points.push(`${Math.round(x)} ${Math.round(y)}`);
  }

  tunerTimelineSvg.appendChild(tunerSvgUtils.createPath({
    d: `M ${points.join(' L ')}`,
    stroke: getCssVariable('--color1'),
    fill: 'none',
    width: 1
  }));
}

function addTimelinePoint(cents, nowMs) {
  if (!Number.isFinite(cents)) return;
  if (nowMs - state.lastTimelineTs < 120) return;
  state.lastTimelineTs = nowMs;

  state.timeline.push({ cents: clamp(cents, -50, 50) });
  if (state.timeline.length > TIMELINE_MAX_POINTS) {
    state.timeline.shift();
  }

  redrawTimeline();
}

function getCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function appendPanelLine(text) {
  if (!text) return;
  tunerText.value += `${text}\n`;
  tunerText.scrollTop = tunerText.scrollHeight;
  localStorage.setItem(STORAGE.panel, tunerText.value);
}

function logDetection(nowMs) {
  if (nowMs - state.lastPanelTs < 1000) return;
  state.lastPanelTs = nowMs;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const mmm = String(now.getMilliseconds()).padStart(3, '0');

  appendPanelLine(`[${hh}:${mm}:${ss}.${mmm}] Note: ${state.detectedNote} | HZ: ${formatHz(state.smoothedHz)} | Target: ${state.targetNote} | Cents: ${formatCents(state.cents)}`);
}

function autoCorrelatePitch(buffer, sampleRate) {
  const size = buffer.length;

  let rms = 0;
  for (let i = 0; i < size; i++) {
    const value = buffer[i];
    rms += value * value;
  }
  rms = Math.sqrt(rms / size);

  if (rms < 0.012) {
    return -1;
  }

  let r1 = 0;
  let r2 = size - 1;
  const threshold = 0.2;

  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buffer[size - i]) < threshold) {
      r2 = size - i;
      break;
    }
  }

  const sliced = buffer.slice(r1, r2);
  const newSize = sliced.length;
  const correlations = new Array(newSize).fill(0);

  for (let lag = 0; lag < newSize; lag++) {
    let sum = 0;
    for (let i = 0; i < newSize - lag; i++) {
      sum += sliced[i] * sliced[i + lag];
    }
    correlations[lag] = sum;
  }

  let dip = 0;
  while (dip < newSize - 1 && correlations[dip] > correlations[dip + 1]) {
    dip++;
  }

  let maxIndex = -1;
  let maxValue = -1;
  for (let i = dip; i < newSize; i++) {
    if (correlations[i] > maxValue) {
      maxValue = correlations[i];
      maxIndex = i;
    }
  }

  if (maxIndex <= 0) return -1;

  let refined = maxIndex;
  if (maxIndex > 0 && maxIndex < newSize - 1) {
    const x1 = correlations[maxIndex - 1];
    const x2 = correlations[maxIndex];
    const x3 = correlations[maxIndex + 1];
    const denom = x1 - 2 * x2 + x3;
    if (denom !== 0) {
      refined = maxIndex - (x3 - x1) / (2 * denom);
    }
  }

  const frequency = sampleRate / refined;
  if (!Number.isFinite(frequency) || frequency < 30 || frequency > 1500) {
    return -1;
  }

  return frequency;
}

function applyDetectedFrequency(frequency, nowMs) {
  if (!Number.isFinite(frequency) || frequency <= 0) return;

  if (state.smoothedHz <= 0) {
    state.smoothedHz = frequency;
  } else {
    state.smoothedHz = state.smoothedHz * 0.72 + frequency * 0.28;
  }

  const midi = frequencyToMidi(state.smoothedHz);
  const detectedNote = midiToNoteName(midi);

  state.detectedHz = frequency;
  state.detectedMidi = midi;
  state.detectedNote = detectedNote;

  const targets = getProfileTargets(state.profile);
  if (state.followTarget && targets.length > 0) {
    const nearestIndex = findNearestTargetIndexByMidi(targets, midi);
    setCurrentSelectedIndex(nearestIndex);
    updateCurrentTarget();
    renderTargetButtons();
  }

  if (state.targetHz > 0) {
    state.cents = 1200 * Math.log2(state.smoothedHz / state.targetHz);
  } else {
    state.cents = 0;
  }

  syncReadout();
  addTimelinePoint(state.cents, nowMs);
  logDetection(nowMs);
}

async function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

function updateMetersSourceBridge() {
  if (!audioContext) {
    window.__pekosoftMetersSource = null;
    return;
  }

  if (state.listening && analyserNode) {
    window.__pekosoftMetersSource = {
      analyser: analyserNode,
      channelCount: 1,
      sampleRate: audioContext.sampleRate,
      isActive: () => state.listening,
      isStopped: () => !state.listening
    };
    return;
  }

  if (toneAnalyserNode) {
    window.__pekosoftMetersSource = {
      analyser: toneAnalyserNode,
      channelCount: 1,
      sampleRate: audioContext.sampleRate,
      isActive: () => state.toneRunning,
      isStopped: () => !state.toneRunning
    };
    return;
  }

  window.__pekosoftMetersSource = null;
}

function cleanupMicGraph() {
  if (mediaSource) {
    try { mediaSource.disconnect(); } catch (error) { }
    mediaSource = null;
  }

  if (analyserNode) {
    try { analyserNode.disconnect(); } catch (error) { }
    analyserNode = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  timeDomainBuffer = null;
  updateMetersSourceBridge();
}

function ensureMeterSinkNode() {
  if (!audioContext) return null;
  if (!meterSinkGainNode) {
    meterSinkGainNode = audioContext.createGain();
    meterSinkGainNode.gain.value = 0;
    meterSinkGainNode.connect(audioContext.destination);
  }
  return meterSinkGainNode;
}

function ensureToneMetersAnalyserNode() {
  if (!audioContext) return null;
  if (!toneAnalyserNode) {
    toneAnalyserNode = audioContext.createAnalyser();
    toneAnalyserNode.fftSize = 2048;
    toneAnalyserNode.smoothingTimeConstant = 0.15;
    toneAnalyserNode.connect(audioContext.destination);
  }
  return toneAnalyserNode;
}

async function startListening() {
  if (state.listening) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Mic API unavailable');
    return;
  }

  try {
    await ensureAudioContext();

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    mediaSource = audioContext.createMediaStreamSource(mediaStream);
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 4096;
    analyserNode.smoothingTimeConstant = 0.15;

    mediaSource.connect(analyserNode);
    const sinkNode = ensureMeterSinkNode();
    if (sinkNode) {
      analyserNode.connect(sinkNode);
    }

    updateMetersSourceBridge();
    timeDomainBuffer = new Float32Array(analyserNode.fftSize);

    state.listening = true;
    updateListenButton();
    setStatus('Listening');

    schedulePitchFrame();
  } catch (error) {
    cleanupMicGraph();
    state.listening = false;
    updateListenButton();
    setStatus('Mic permission denied');
    console.error('Unable to start tuner microphone input:', error);
  }
}

function stopListening() {
  if (!state.listening) return;
  state.listening = false;
  updateListenButton();
  cleanupMicGraph();
  setStatus('Mic off');
}

function schedulePitchFrame() {
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
  }
  state.rafId = requestAnimationFrame(processPitchFrame);
}

function processPitchFrame() {
  if (!state.listening || !analyserNode || !timeDomainBuffer) {
    state.rafId = 0;
    return;
  }

  analyserNode.getFloatTimeDomainData(timeDomainBuffer);
  const frequency = autoCorrelatePitch(timeDomainBuffer, audioContext.sampleRate);

  const nowMs = performance.now();

  if (!state.hold) {
    if (frequency > 0) {
      applyDetectedFrequency(frequency, nowMs);
      setStatus('Signal detected');
    } else {
      setStatus('Waiting for note');
    }
  }

  state.rafId = requestAnimationFrame(processPitchFrame);
}

async function startTone() {
  if (state.toneRunning) {
    state.toneOn = true;
    updateToneGain();
    updateToneButton();
    updateMetersSourceBridge();
    return;
  }

  try {
    await ensureAudioContext();
    const target = getCurrentTarget();
    const toneDestinationNode = ensureToneMetersAnalyserNode() || audioContext.destination;
    if (!target) return;

    if (typeof window.createSustainedToneVoice === 'function') {
      toneVoice = window.createSustainedToneVoice({
        audioContext,
        tone: state.toneType,
        frequency: target.hz,
        destinationNode: toneDestinationNode,
        standardGain: state.volume / 100,
        pianoPeakGain: Math.max(state.volume / 100, 0.0001),
        pianoBodyGain: Math.max((state.volume / 100) * 0.5, 0.0001)
      });
    } else {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = state.toneType;
      oscillator.frequency.setValueAtTime(target.hz, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(state.volume / 100, audioContext.currentTime + 0.03);
      oscillator.connect(gainNode);
      gainNode.connect(toneDestinationNode);
      oscillator.start();
      toneVoice = { oscillator, gainNode, tone: state.toneType };
    }

    state.toneRunning = true;
    state.toneOn = true;
    updateToneGain();
    updateToneButton();
    updateMetersSourceBridge();
  } catch (error) {
    console.error('Unable to start tuner reference tone:', error);
  }
}

function updateToneFrequency(frequency) {
  if (!toneVoice || !toneVoice.oscillator) return;

  if (typeof window.updateSustainedToneFrequency === 'function') {
    window.updateSustainedToneFrequency(toneVoice, {
      frequency,
      audioContext,
      glideSec: 0.012
    });
    return;
  }

  if (audioContext) {
    toneVoice.oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  } else {
    toneVoice.oscillator.frequency.value = frequency;
  }
}

function updateToneGain() {
  if (!toneVoice || !toneVoice.gainNode || !audioContext) return;

  const targetGain = state.toneOn ? clamp(state.volume / 100, 0, 1) : 0;
  const now = audioContext.currentTime;
  toneVoice.gainNode.gain.cancelScheduledValues(now);
  toneVoice.gainNode.gain.setTargetAtTime(targetGain, now, 0.015);
}

function stopTone() {
  if (!toneVoice || !toneVoice.oscillator) {
    state.toneRunning = false;
    state.toneOn = false;
    updateToneButton();
    updateMetersSourceBridge();
    return;
  }

  if (typeof window.releaseSustainedToneVoice === 'function' && audioContext) {
    const voiceToRelease = toneVoice;
    toneVoice = null;
    window.releaseSustainedToneVoice({
      audioContext,
      voice: voiceToRelease,
      releaseSec: 0.08
    });
  } else {
    const now = audioContext ? audioContext.currentTime : 0;
    const gainNode = toneVoice.gainNode;
    const oscillator = toneVoice.oscillator;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
    oscillator.stop(now + 0.09);
    oscillator.onended = () => {
      try { oscillator.disconnect(); } catch (error) { }
      try { gainNode.disconnect(); } catch (error) { }
    };
    toneVoice = null;
  }

  state.toneRunning = false;
  state.toneOn = false;
  updateToneButton();
  updateMetersSourceBridge();
}

function setProfile(profileName) {
  if (!PROFILE_TEMPLATES[profileName]) return;

  state.profile = profileName;
  updateProfileSelect();

  if (profileName !== 'chromatic') {
    chromaticOctaveInput.disabled = true;
  } else {
    chromaticOctaveInput.disabled = false;
  }

  updateCurrentTarget();
  renderTargetButtons();
  syncReadout();
  saveSettings();
}

function saveSettings() {
  localStorage.setItem(STORAGE.profile, state.profile);
  localStorage.setItem(STORAGE.followTarget, String(state.followTarget));
  localStorage.setItem(STORAGE.chromaticOctave, String(state.chromaticOctave));
  localStorage.setItem(STORAGE.chromaticIndex, String(state.chromaticIndex));
  localStorage.setItem(STORAGE.guitarIndex, String(state.selectedIndex.guitar || 0));
  localStorage.setItem(STORAGE.bassIndex, String(state.selectedIndex.bass || 0));
  localStorage.setItem(STORAGE.toneType, state.toneType);
  localStorage.setItem(STORAGE.volume, String(state.volume));
  localStorage.setItem(STORAGE.guides, String(state.showGuides));
  localStorage.setItem(STORAGE.panel, tunerText.value);
  localStorage.setItem(STORAGE.timeline, JSON.stringify(state.timeline));
}

function loadSettings() {
  const savedProfile = localStorage.getItem(STORAGE.profile);
  const savedFollowTarget = localStorage.getItem(STORAGE.followTarget);
  const savedChromaticOctave = parseInt(localStorage.getItem(STORAGE.chromaticOctave), 10);
  const savedChromaticIndex = parseInt(localStorage.getItem(STORAGE.chromaticIndex), 10);
  const savedGuitarIndex = parseInt(localStorage.getItem(STORAGE.guitarIndex), 10);
  const savedBassIndex = parseInt(localStorage.getItem(STORAGE.bassIndex), 10);
  const savedToneType = localStorage.getItem(STORAGE.toneType);
  const savedVolume = parseInt(localStorage.getItem(STORAGE.volume), 10);
  const savedGuides = localStorage.getItem(STORAGE.guides);
  const savedPanel = localStorage.getItem(STORAGE.panel);
  const savedTimeline = localStorage.getItem(STORAGE.timeline);

  if (savedProfile && PROFILE_TEMPLATES[savedProfile]) {
    state.profile = savedProfile;
  }

  if (savedFollowTarget !== null) {
    state.followTarget = savedFollowTarget === 'true';
  }

  if (Number.isFinite(savedChromaticOctave)) {
    state.chromaticOctave = clamp(savedChromaticOctave, 0, 8);
  }

  if (Number.isFinite(savedChromaticIndex)) {
    state.chromaticIndex = clamp(savedChromaticIndex, 0, 11);
  }

  if (Number.isFinite(savedGuitarIndex)) {
    state.selectedIndex.guitar = clamp(savedGuitarIndex, 0, PROFILE_TEMPLATES.guitar.length - 1);
  }

  if (Number.isFinite(savedBassIndex)) {
    state.selectedIndex.bass = clamp(savedBassIndex, 0, PROFILE_TEMPLATES.bass.length - 1);
  }

  state.toneType = normalizeToneType(savedToneType || 'sine');
  state.volume = Number.isFinite(savedVolume) ? clamp(savedVolume, 0, 100) : 30;

  if (savedGuides !== null) {
    state.showGuides = savedGuides === 'true';
  } else {
    state.showGuides = localStorage.getItem('global.guides') !== 'false';
  }

  if (savedPanel) {
    tunerText.value = savedPanel;
  }

  if (savedTimeline) {
    try {
      const timelineData = JSON.parse(savedTimeline);
      if (Array.isArray(timelineData)) {
        state.timeline = timelineData
          .filter((entry) => entry && Number.isFinite(entry.cents))
          .slice(-TIMELINE_MAX_POINTS)
          .map((entry) => ({ cents: clamp(entry.cents, -50, 50) }));
      }
    } catch (error) {
      state.timeline = [];
    }
  }

  chromaticOctaveInput.value = String(state.chromaticOctave);
  if (profileSelect) {
    profileSelect.value = state.profile;
  }
  toneTypeSelect.value = state.toneType;
  volumeSlider.value = String(state.volume);

  updateFollowButton();
  updateProfileSelect();
  updateGuidesButton();
  updateHoldButton();
  updateListenButton();
  updateToneButton();

  if (state.profile === 'chromatic') {
    chromaticOctaveInput.disabled = false;
  } else {
    chromaticOctaveInput.disabled = true;
  }

  updateCurrentTarget();
  renderTargetButtons();
  syncReadout();
  redrawTimeline();
}

function clearPanel() {
  tunerText.value = '';
  saveSettings();
}

function resetAll() {
  stopTone();
  stopListening();

  state.profile = 'guitar';
  state.followTarget = true;
  state.hold = false;
  state.detectedHz = 0;
  state.smoothedHz = 0;
  state.detectedMidi = null;
  state.detectedNote = '--';
  state.targetNote = 'E2';
  state.targetHz = parseNoteName('E2').hz;
  state.cents = 0;
  state.chromaticOctave = 4;
  state.chromaticIndex = 9;
  state.selectedIndex.guitar = 0;
  state.selectedIndex.bass = 0;
  state.toneType = 'sine';
  state.volume = 30;
  state.showGuides = localStorage.getItem('global.guides') !== 'false';
  state.timeline = [];
  state.lastTimelineTs = 0;
  state.lastPanelTs = 0;

  chromaticOctaveInput.value = '4';
  chromaticOctaveInput.disabled = true;
  toneTypeSelect.value = 'sine';
  volumeSlider.value = '30';

  setStatus('Mic off');

  clearPanel();
  redrawTimeline();

  updateProfileSelect();
  updateFollowButton();
  updateGuidesButton();
  updateHoldButton();
  updateListenButton();
  updateToneButton();

  updateCurrentTarget();
  renderTargetButtons();
  syncReadout();
  saveSettings();
}

listenButton.addEventListener('click', () => {
  if (state.listening) {
    stopListening();
  } else {
    startListening();
  }
});

toneButton.addEventListener('click', () => {
  if (!state.toneRunning) {
    state.toneOn = true;
    startTone();
    return;
  }

  state.toneOn = !state.toneOn;
  updateToneButton();
  updateToneGain();
  updateMetersSourceBridge();
});

holdButton.addEventListener('click', () => {
  state.hold = !state.hold;
  updateHoldButton();
  setStatus(state.hold ? 'Hold readout' : (state.listening ? 'Listening' : 'Mic off'));
});

if (profileSelect) {
  profileSelect.addEventListener('change', () => {
    setProfile(profileSelect.value);
  });
}

followButton.addEventListener('click', () => {
  state.followTarget = !state.followTarget;
  updateFollowButton();
  saveSettings();
});

chromaticOctaveInput.addEventListener('input', () => {
  const value = parseInt(chromaticOctaveInput.value, 10);
  if (!Number.isFinite(value)) return;
  state.chromaticOctave = clamp(value, 0, 8);
  chromaticOctaveInput.value = String(state.chromaticOctave);
  updateCurrentTarget();
  renderTargetButtons();
  syncReadout();
  saveSettings();
});

toneTypeSelect.addEventListener('change', () => {
  state.toneType = normalizeToneType(toneTypeSelect.value);
  toneTypeSelect.value = state.toneType;

  if (state.toneRunning) {
    const keepAudible = state.toneOn;
    stopTone();
    startTone();
    if (!keepAudible) {
      state.toneOn = false;
      updateToneButton();
      updateToneGain();
      updateMetersSourceBridge();
    }
  }

  saveSettings();
});

volumeSlider.addEventListener('input', () => {
  state.volume = clamp(parseInt(volumeSlider.value, 10) || 0, 0, 100);
  volumeSlider.value = String(state.volume);
  updateToneGain();
  saveSettings();
});

function bindHoldAction(button, action) {
  let interval = null;
  let activePointerId = null;

  const start = () => {
    action();
    interval = setInterval(action, 100);
  };

  const stop = () => {
    clearInterval(interval);
    interval = null;
  };

  const stopPointer = (event) => {
    if (activePointerId === null) return;
    if (event && event.pointerId !== activePointerId) return;
    if (event && typeof button.releasePointerCapture === 'function') {
      try {
        button.releasePointerCapture(activePointerId);
      } catch (_) {}
    }
    activePointerId = null;
    stop();
  };

  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    activePointerId = event.pointerId;
    if (typeof button.setPointerCapture === 'function') {
      try {
        button.setPointerCapture(activePointerId);
      } catch (_) {}
    }
    start();
  });

  button.addEventListener('pointerup', stopPointer);
  button.addEventListener('pointercancel', stopPointer);
}

bindHoldAction(volumeIncreaseButton, () => {
  state.volume = clamp(state.volume + 1, 0, 100);
  volumeSlider.value = String(state.volume);
  updateToneGain();
  saveSettings();
});

bindHoldAction(volumeDecreaseButton, () => {
  state.volume = clamp(state.volume - 1, 0, 100);
  volumeSlider.value = String(state.volume);
  updateToneGain();
  saveSettings();
});

guidesButton.addEventListener('click', () => {
  state.showGuides = !state.showGuides;
  updateGuidesButton();
  redrawTimeline();
  saveSettings();
});

copyButton.addEventListener('click', () => {
  const content = tunerText.value.trim();
  if (!content) return;
  navigator.clipboard.writeText(content);
});

panelClearButton.addEventListener('click', clearPanel);
clearPanelButton.addEventListener('click', clearPanel);

resetButton.addEventListener('click', resetAll);

window.addEventListener('beforeunload', () => {
  stopTone();
  stopListening();
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }
});

loadSettings();

window.addEventListener('pekosoft:global-defaults-change', (event) => {
  if (!['a4_hz', 'all'].includes(event.detail?.changed)) return;
  updateCurrentTarget();
  renderTargetButtons();
  syncReadout();
});

setStatus('Mic off');

if (tunerTimelineSvg && tunerSvgTimeline?.observeResize) {
  disconnectTunerTimelineResize = tunerSvgTimeline.observeResize({
    svg: tunerTimelineSvg,
    container: tunerTimelineContainer,
    onResize: redrawTimeline
  });
}

// END OF FILE
