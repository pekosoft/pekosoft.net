// Pekosoft Metronome
// pekosoft.net/js/metronome.js

// Variable declarations

const bpmInput = document.getElementById('bpm-input');
const bpmSlider = document.getElementById('tempo-slider');
const halfButton = document.getElementById('half-button');
const doubleButton = document.getElementById('double-button');
const resetButton = document.getElementById('reset-button');
const stopButton = document.getElementById('stop-button');
const togglePlayButton = document.getElementById("toggle-play-button");
const beatSoundSelect = document.getElementById("beat-sound-type");
const signatureSelect = document.getElementById('signature-type');
const toggleSoundButton = document.getElementById("toggle-sound-button");
const toggleAccentButton = document.getElementById("toggle-accent-button");
const toggleBlinkButton = document.getElementById("toggle-blink-button");
const increaseButton = document.getElementById('increase-button');
const decreaseButton = document.getElementById('decrease-button');
const volumeSlider = document.getElementById('volume-slider');
const volumeIncreaseButton = document.getElementById('volume-increase-button');
const volumeDecreaseButton = document.getElementById('volume-decrease-button');
const pendulum = document.querySelector('.pendulum');
const metronomeText = document.getElementById('metronome-text');
const copyButton = document.getElementById("copy-button");
const panelBeatsButton = document.getElementById("panel-beats-button");
const panelTempiButton = document.getElementById("panel-tempi-button");
const btnGuides = document.getElementById("guides-button");
const btnHaptic = document.getElementById("haptic-button");
const baseBpmButton = document.getElementById("base-bpm-button");
const baseTempiButton = document.getElementById("base-tempi-button");
const baseSignatureButton = document.getElementById("base-signature-button");
const baseBpmText = document.getElementById('base-bpm-text');
const baseTempiText = document.getElementById('base-tempi-text');
const metronomeSpacer = document.querySelector('.metronome-spacer');
const metronomeToolContainer = document.getElementById('tool-container');

let audioContext = new AudioContext();
let metersAnalyserNode = null;
let masterMuteGainNode = null;
let metersLastActiveSec = 0;
let isPlaying = false;
let isSoundOn = true;
let isBlinkOn = false;
let show_guides = localStorage.getItem('global.guides') !== 'false';
let hapticMode = false;
let soundVolume = 100;
let accentOn = true;
let showBaseBpm = false;
let showBaseTempi = false;
let showBaseSignature = true;
let showPanelTempi = false;
let mutedBeatIndexes = new Set();
let beatsPanelText = '';
let pendulumDirection = -30;
let metronomeTimer = null;
let beatCount = 0;
let beatInBar = -1;
let lastTickTime = null;
let nextTickTime = 0;
let beatHistory = [];
// Horizontal offset (pixels) to shift data plots right so guide labels stay visible
const METRONOME_GRAPH_OFFSET = 48;
let lastTop = { x: METRONOME_GRAPH_OFFSET, y: 0 };
const METRONOME_TIMELINE_WIDTH = 4096;
const METRONOME_TIMELINE_MIN_HEIGHT = 256;
const METRONOME_BODY_WIDTH = 330;
const METRONOME_BODY_HEIGHT = 402;
let metronomeScaleFrame = null;

const minBPM = 30;
const maxBPM = 320;

function ensureMasterMuteGainNode() {
  if (!audioContext) return null;
  if (!masterMuteGainNode) {
    masterMuteGainNode = audioContext.createGain();
    masterMuteGainNode.gain.value = isSoundOn ? 1 : 0;
    masterMuteGainNode.connect(audioContext.destination);
  }
  return masterMuteGainNode;
}

function ensureMetersAnalyserNode() {
  if (!audioContext) return null;
  if (!metersAnalyserNode) {
    metersAnalyserNode = audioContext.createAnalyser();
    metersAnalyserNode.fftSize = 2048;
    metersAnalyserNode.connect(ensureMasterMuteGainNode());
  }
  return metersAnalyserNode;
}

function touchMetersActivity(whenSec) {
  const fallbackNow = audioContext ? audioContext.currentTime : 0;
  const value = Number.isFinite(whenSec) ? whenSec : fallbackNow;
  metersLastActiveSec = Math.max(metersLastActiveSec, value);
}

function updateMetersSourceBridge() {
  const analyser = ensureMetersAnalyserNode();
  if (!audioContext || !analyser) {
    window.__pekosoftMetersSource = null;
    return;
  }

  window.__pekosoftMetersSource = {
    analyser,
    channelCount: 1,
    sampleRate: audioContext.sampleRate,
    isActive: () => isPlaying || ((audioContext.currentTime - metersLastActiveSec) < 0.20),
    isStopped: () => !isPlaying
  };
}

const italianTempi = [
  { name: 'Larghissimo', min: 20, max: 24 },
  { name: 'Grave', min: 25, max: 45 },
  { name: 'Largo', min: 46, max: 60 },
  { name: 'Larghetto', min: 61, max: 66 },
  { name: 'Adagio', min: 67, max: 76 },
  { name: 'Andante', min: 77, max: 108 },
  { name: 'Moderato', min: 109, max: 120 },
  { name: 'Allegro', min: 121, max: 156 },
  { name: 'Vivace', min: 157, max: 176 },
  { name: 'Presto', min: 177, max: 200 },
  { name: 'Prestissimo', min: 201, max: 320 }
];

const signatureOptions = {
  '2/4': { beatsPerBar: 2 },
  '3/4': { beatsPerBar: 3 },
  '4/4': { beatsPerBar: 4 },
  '5/4': { beatsPerBar: 5 },
  '6/8': { beatsPerBar: 6 },
  '7/8': { beatsPerBar: 7 },
  '9/8': { beatsPerBar: 9 }
};

const metronomeTimelineSvg = document.getElementById("metronome-timeline-svg");
const metronomeTimelineContainer = document.getElementById("timeline-container");
const metronomeSvgUtils = window.PekoSvgUtils;
const metronomeSvgTimeline = window.PekoSvgTimeline;
let disconnectMetronomeTimelineResize = null;

function updateMetronomeScale() {
  if (!metronomeSpacer) return;

  const isMaximized = metronomeToolContainer ? metronomeToolContainer.classList.contains('module-maximized') : false;
  const spacerRect = metronomeSpacer.getBoundingClientRect();
  const spacerStyle = window.getComputedStyle(metronomeSpacer);
  const paddingX = parseFloat(spacerStyle.paddingLeft) + parseFloat(spacerStyle.paddingRight);
  const paddingY = parseFloat(spacerStyle.paddingTop) + parseFloat(spacerStyle.paddingBottom);
  const borderX = parseFloat(spacerStyle.borderLeftWidth) + parseFloat(spacerStyle.borderRightWidth);
  const borderY = parseFloat(spacerStyle.borderTopWidth) + parseFloat(spacerStyle.borderBottomWidth);
  const availableWidth = Math.max(spacerRect.width - paddingX - borderX, 1);
  const availableHeight = Math.max(spacerRect.height - paddingY - borderY, 1);
  const maxScale = isMaximized ? 2 : 1;
  const scale = Math.max(0.25, Math.min(maxScale, availableWidth / METRONOME_BODY_WIDTH, availableHeight / METRONOME_BODY_HEIGHT));

  document.documentElement.style.setProperty('--metronome-scale', String(scale));
}

function requestMetronomeScaleUpdate() {
  if (metronomeScaleFrame !== null) return;
  metronomeScaleFrame = window.requestAnimationFrame(() => {
    metronomeScaleFrame = null;
    updateMetronomeScale();
  });
}

updateMetronomeScale();

window.addEventListener('resize', requestMetronomeScaleUpdate);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', requestMetronomeScaleUpdate);
}

if (typeof ResizeObserver === 'function' && metronomeSpacer) {
  const metronomeResizeObserver = new ResizeObserver(requestMetronomeScaleUpdate);
  metronomeResizeObserver.observe(metronomeSpacer);
}

if (metronomeToolContainer) {
  const metronomeScaleObserver = new MutationObserver(requestMetronomeScaleUpdate);
  metronomeScaleObserver.observe(metronomeToolContainer, { attributes: true, attributeFilter: ['class'] });
}

document.addEventListener('DOMContentLoaded', () => {
  updateMetronomeScale();
  bpmInput.setAttribute('step', '0.001');
  bpmInput.setAttribute('min', minBPM);
  bpmInput.setAttribute('max', maxBPM);
  updateSoundButton();
  updateBlinkButton();
});

// BPM Logic

function getValidatedBPM() {
  const bpm = parseFloat(bpmInput.value);
  if (isNaN(bpm)) return null;
  const clamped = Math.min(Math.max(bpm, minBPM), maxBPM);
  return parseFloat(clamped.toFixed(3));
}

function toSpacedText(value) {
  return String(value).toUpperCase().split('').join(' ');
}

function getItalianTempoLabel(bpmValue) {
  const bpm = Number(bpmValue);
  if (!Number.isFinite(bpm)) return 'Unknown';
  const match = italianTempi.find((tempo) => bpm >= tempo.min && bpm <= tempo.max);
  return match ? match.name : 'Unknown';
}

function buildTempiListText() {
  return italianTempi
    .map((tempo) => `${tempo.name}: ${tempo.min}-${tempo.max} BPM`)
    .join("\n");
}

function getSignatureLabel() {
  return signatureSelect ? signatureSelect.value : '4/4';
}

function getSignatureValue() {
  const label = getSignatureLabel();
  return signatureOptions[label] || signatureOptions['4/4'];
}

function isBeatMuted(index) {
  return mutedBeatIndexes.has(index);
}

function saveMutedBeatSettings() {
  localStorage.setItem('metronome.muted_beats', JSON.stringify([...mutedBeatIndexes].sort((left, right) => left - right)));
}

function normalizeMutedBeatIndexes(persist = false) {
  const { beatsPerBar } = getSignatureValue();
  mutedBeatIndexes = new Set([...mutedBeatIndexes].filter((index) => index >= 0 && index < beatsPerBar));
  if (persist) saveMutedBeatSettings();
}

function toggleMutedBeat(index) {
  if (isBeatMuted(index)) {
    mutedBeatIndexes.delete(index);
  } else {
    mutedBeatIndexes.add(index);
  }
  saveMutedBeatSettings();
  updateBaseSignatureCircles();
}

function updateBaseSignatureCircles() {
  const wrapper = metronomeToolContainer ? metronomeToolContainer.querySelector('.metronome-wrapper') : null;
  if (!wrapper) return;

  let circles = document.getElementById('base-signature-circles');
  if (!circles) {
    circles = document.createElement('div');
    circles.id = 'base-signature-circles';
    circles.className = 'metronome-signature-circles';
    circles.addEventListener('click', (event) => {
      const circle = event.target.closest('.signature-beat');
      if (!circle || !circles.contains(circle)) return;
      const index = Number(circle.dataset.beatIndex);
      if (!Number.isInteger(index)) return;
      toggleMutedBeat(index);
    });
    wrapper.appendChild(circles);
  }

  const { beatsPerBar } = getSignatureValue();
  normalizeMutedBeatIndexes();

  while (circles.children.length < beatsPerBar) {
    const circle = document.createElement('button');
    circle.type = 'button';
    circle.classList.add('signature-beat');
    circles.appendChild(circle);
  }

  while (circles.children.length > beatsPerBar) {
    circles.lastElementChild.remove();
  }

  for (let index = 0; index < beatsPerBar; index++) {
    const isActiveBeat = isPlaying && index === beatInBar;
    const isMutedBeat = isBeatMuted(index);
    const circle = circles.children[index];
    circle.dataset.beatIndex = String(index);
    circle.classList.add('signature-beat');
    circle.classList.toggle('signature-beat-active', isActiveBeat);
    circle.classList.toggle('signature-beat-muted', isMutedBeat);
    circle.setAttribute('aria-label', `Toggle beat ${index + 1}`);
    circle.setAttribute('aria-pressed', isMutedBeat ? 'true' : 'false');
    circle.title = `Toggle beat ${index + 1}`;
  }
  circles.hidden = !showBaseSignature;
}

function updateBaseText() {
  const bpm = getValidatedBPM();
  const bpmText = bpm === null ? '0.000' : bpm.toFixed(3);
  const tempiText = getItalianTempoLabel(bpm);
  applyBaseInfoVisibility();

  if (baseBpmText) {
    baseBpmText.textContent = toSpacedText(bpmText);
    baseBpmText.hidden = !showBaseBpm;
  }

  if (baseTempiText) {
    baseTempiText.textContent = toSpacedText(tempiText);
    baseTempiText.hidden = !showBaseTempi;
  }
}

function applyBaseInfoVisibility() {
  if (baseBpmText) {
    baseBpmText.hidden = !showBaseBpm;
    baseBpmText.style.display = showBaseBpm ? 'block' : 'none';
  }
  if (baseTempiText) {
    baseTempiText.hidden = !showBaseTempi;
    baseTempiText.style.display = showBaseTempi ? 'block' : 'none';
  }
  const circles = document.getElementById('base-signature-circles');
  if (circles) {
    circles.hidden = !showBaseSignature;
    circles.style.display = showBaseSignature ? 'flex' : 'none';
  }
}

function persistBaseInfoState() {
  localStorage.setItem('metronome.show_base_bpm', JSON.stringify(showBaseBpm));
  localStorage.setItem('metronome.show_base_tempi', JSON.stringify(showBaseTempi));
  localStorage.setItem('metronome.show_base_signature', JSON.stringify(showBaseSignature));
}

function setBaseInfoMode(mode, persist = true) {
  showBaseBpm = mode === 'bpm';
  showBaseTempi = mode === 'tempi';
  showBaseSignature = mode === 'signature';

  if (persist) {
    persistBaseInfoState();
  }

  updateToggleButtons();
  updateBaseText();
  updateBaseSignatureCircles();
  applyBaseInfoVisibility();
}

function normalizeBaseInfoState(hasSavedMode = false) {
  const activeCount = (showBaseBpm ? 1 : 0) + (showBaseTempi ? 1 : 0) + (showBaseSignature ? 1 : 0);

  if (activeCount > 1) {
    if (showBaseBpm) return setBaseInfoMode('bpm', true);
    if (showBaseTempi) return setBaseInfoMode('tempi', true);
    return setBaseInfoMode('signature', true);
  }

  if (activeCount === 1) {
    if (showBaseBpm) return setBaseInfoMode('bpm', true);
    if (showBaseTempi) return setBaseInfoMode('tempi', true);
    return setBaseInfoMode('signature', true);
  }

  if (!hasSavedMode) {
    return setBaseInfoMode('signature', true);
  }

  return setBaseInfoMode('none', true);
}

function updateToggleButtons() {
  if (baseBpmButton) {
    baseBpmButton.classList.toggle('button-on', showBaseBpm);
  }
  if (baseTempiButton) {
    baseTempiButton.classList.toggle('button-on', showBaseTempi);
  }
  if (baseSignatureButton) {
    baseSignatureButton.classList.toggle('button-on', showBaseSignature);
  }
  if (panelBeatsButton) {
    panelBeatsButton.classList.toggle('button-on', !showPanelTempi);
  }
  if (panelTempiButton) {
    panelTempiButton.classList.toggle('button-on', showPanelTempi);
  }
  if (toggleAccentButton) {
    toggleAccentButton.classList.toggle('button-on', accentOn);
  }
}

function renderPanelView() {
  if (!metronomeText) return;

  if (showPanelTempi) {
    metronomeText.value = buildTempiListText();
    metronomeText.scrollTop = 0;
  } else {
    metronomeText.value = beatsPanelText;
    metronomeText.scrollTop = metronomeText.scrollHeight;
  }

  if (typeof updatePanelDownloadButtonState === 'function') {
    updatePanelDownloadButtonState(document.getElementById('panel-container'));
  }
}

function updateBPM(value, persist = true) {
  const clamped = Math.min(Math.max(parseFloat(value), minBPM), maxBPM);
  const formatted = clamped.toFixed(3);
  bpmInput.value = formatted;
  bpmSlider.value = Math.round(clamped);
  updateBaseText();
  updateBaseSignatureCircles();
  if (persist) {
    saveSettings();
  }
}

function updateVolume(value) {
  soundVolume = Math.min(Math.max(parseInt(value, 10) || 0, 0), 100);
  if (volumeSlider) {
    volumeSlider.value = String(soundVolume);
  }
  saveSettings();
}

function getVolumeGain() {
  return soundVolume / 100;
}

function playClick(when, accented = false) {
  if (!audioContext || typeof window.playTransientSound !== 'function') return;

  const tone = beatSoundSelect.value;
  const accentStrongTone = tone === 'click' || tone === 'kick';
  const gainMultiplier = accented
    ? (accentStrongTone ? 1.35 : 1)
    : 0.85;
  const pitchRatio = accented
    ? (accentStrongTone ? 1.55 : 1.25)
    : 1;

  window.playTransientSound({
    audioContext,
    destinationNode: ensureMetersAnalyserNode(),
    tone,
    when,
    gain: Math.min(1, getVolumeGain() * gainMultiplier),
    pitchRatio,
    durationSec: 0.05
  });
  touchMetersActivity(when);
  updateMetersSourceBridge();
}

function tick(time) {
  const signature = getSignatureValue();
  beatCount = beatHistory.length + 1;
  beatInBar = (beatCount - 1) % signature.beatsPerBar;
  pendulumDirection *= -1;
  pendulum.style.transition = 'transform 0.1s linear';
  pendulum.style.transform = `rotate(${pendulumDirection}deg)`;
  if (!isBeatMuted(beatInBar)) {
    playClick(time, accentOn && beatInBar === 0);
  }
  if (isBlinkOn) toggleBlink();
  if (hapticMode && 'vibrate' in navigator) navigator.vibrate(10);

  const durationMs = lastTickTime !== null ? (time - lastTickTime) * 1000 : 0;
  lastTickTime = time;

  const bpm = getValidatedBPM() || 'Unknown';
  const timeString = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  const logMessage = `[${timeString}] Beat: ${beatCount} | BPM: ${bpm.toFixed(3)} | Interval: ${durationMs.toFixed(3)} ms`;
  beatsPanelText += logMessage + "\n";
  localStorage.setItem("metronome.panel", beatsPanelText);

  if (!showPanelTempi) {
    renderPanelView();
  }

  beatHistory.push({ time: time * 1000, bpm: bpm });
  localStorage.setItem("metronome.beat_history", JSON.stringify(beatHistory));

  redrawTimeline();
  updateBaseSignatureCircles();
}

function playMetronome() {
  const scheduleAheadTime = 0.1;
  function scheduler() {
    const bpm = getValidatedBPM();
    const tickInterval = 60 / bpm;
    const currentTime = audioContext.currentTime;
    while (nextTickTime < currentTime + scheduleAheadTime) {
      tick(nextTickTime);
      nextTickTime += tickInterval;
    }
    metronomeTimer = setTimeout(scheduler, 25);
  }
  if (nextTickTime === 0) {
    nextTickTime = audioContext.currentTime + 0.001;
  }
  scheduler();
}

function stopMetronome() {
  clearTimeout(metronomeTimer);
  metronomeTimer = null;
  isPlaying = false;
  nextTickTime = 0;
  beatCount = 0;
  beatInBar = -1;
  lastTickTime = null;
  clearBlink();
  pendulum.style.transition = 'none';
  pendulum.style.transform = `rotate(${pendulumDirection}deg)`;
  togglePlayButton.classList.remove("button-on");
  updateBaseSignatureCircles();
  updateMetersSourceBridge();
}

function clearBeatSessionData() {
  beatsPanelText = "";
  beatHistory = [];
  beatCount = 0;
  beatInBar = -1;
  lastTickTime = null;
  nextTickTime = 0;
  lastTop = { x: METRONOME_GRAPH_OFFSET, y: 0 };
  pendulumDirection = -30;
  pendulum.style.transition = 'none';
  pendulum.style.transform = 'rotate(-30deg)';
  localStorage.removeItem("metronome.panel");
  localStorage.removeItem("metronome.beat_history");
  redrawTimeline();
  renderPanelView();
  applyBaseInfoVisibility();
  updateBaseSignatureCircles();
}

async function startMetronome() {
  const bpm = getValidatedBPM();
  if (bpm === null) {
    alert(`Please enter a valid BPM between ${minBPM} and ${maxBPM}.`);
    return;
  }
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch (e) {
      console.error("Failed to resume AudioContext", e);
      return;
    }
  }
  if (isPlaying) return;
  isPlaying = true;
  togglePlayButton.classList.add("button-on");
  updateMetersSourceBridge();
  playMetronome();
}

function getMetronomeTimelineHeight() {
  if (!metronomeTimelineSvg) return METRONOME_TIMELINE_MIN_HEIGHT;
  return metronomeSvgTimeline?.resolveHeight?.({
    svg: metronomeTimelineSvg,
    minHeight: METRONOME_TIMELINE_MIN_HEIGHT
  }) || METRONOME_TIMELINE_MIN_HEIGHT;
}

function redrawTimeline() {
  if (!metronomeTimelineSvg || !metronomeSvgUtils) return;
  const timelineHeight = getMetronomeTimelineHeight();
  const { beatsPerBar } = getSignatureValue();
  const primaryColor = getCssVariable('--color1');
  const accentColor = getCssVariable('--color2');
  metronomeSvgTimeline?.setViewBox?.({
    svg: metronomeTimelineSvg,
    width: METRONOME_TIMELINE_WIDTH,
    height: timelineHeight
  });
  metronomeTimelineSvg.innerHTML = '';
  lastTop = { x: METRONOME_GRAPH_OFFSET, y: timelineHeight };

  drawReferenceLines(timelineHeight);

  const barsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const lineLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  barsLayer.setAttribute('class', 'metronome-timeline-bars');
  lineLayer.setAttribute('class', 'metronome-timeline-line');
  metronomeTimelineSvg.appendChild(barsLayer);
  metronomeTimelineSvg.appendChild(lineLayer);

  for (let i = 0; i < beatHistory.length; i++) {
    const bpm = Number(beatHistory[i].bpm) || 0;
    const x = METRONOME_GRAPH_OFFSET + Math.round((i + 1) * 10);
    const height = Math.min(timelineHeight, Math.max(0, bpm));
    const topY = timelineHeight - height;
    const isAccentBeat = accentOn && (i % beatsPerBar === 0);
    const strokeColor = isAccentBeat ? accentColor : primaryColor;

    barsLayer.appendChild(metronomeSvgUtils.createLine({
      x1: x,
      y1: topY,
      x2: x,
      y2: timelineHeight,
      color: strokeColor
    }));

    if (i > 0) {
      lineLayer.appendChild(metronomeSvgUtils.createLine({
        x1: x,
        y1: topY,
        x2: lastTop.x,
        y2: lastTop.y,
        color: primaryColor
      }));
    }

    lastTop = { x, y: topY };
  }
}

function drawReferenceLines(timelineHeight) {
  if (!show_guides) return;
  if (!metronomeTimelineSvg || !metronomeSvgUtils) return;

  const maxGuide = Math.floor(timelineHeight / 30) * 30;
  const titleY = timelineHeight - Math.min(timelineHeight, maxGuide - 30) - 5;
  const guidesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  guidesLayer.setAttribute('class', 'metronome-timeline-guides');
  metronomeTimelineSvg.appendChild(guidesLayer);

  guidesLayer.appendChild(metronomeSvgUtils.createText({
    x: 40,
    y: titleY,
    text: 'BPM',
    color: getCssVariable('--grey1'),
    size: 12,
    anchor: 'end'
  }));

  guidesLayer.appendChild(metronomeSvgUtils.createLine({
    x1: METRONOME_GRAPH_OFFSET,
    y1: 0,
    x2: METRONOME_GRAPH_OFFSET,
    y2: timelineHeight,
    color: getCssVariable('--grey1')
  }));

  for (let bpm = 30; bpm <= maxGuide; bpm += 30) {
    const y = timelineHeight - Math.min(timelineHeight, bpm);
    guidesLayer.appendChild(metronomeSvgUtils.createLine({
      x1: 0,
      y1: y,
      x2: METRONOME_TIMELINE_WIDTH,
      y2: y,
      color: getCssVariable('--grey1')
    }));

    if (bpm >= maxGuide - 30) continue;

    guidesLayer.appendChild(metronomeSvgUtils.createText({
      x: 40,
      y: y - 5,
      text: String(bpm),
      color: getCssVariable('--grey1'),
      size: 12,
      anchor: 'end'
    }));
  }
}

function toggleBlink() {
  metronomeToolContainer.classList.toggle('blink-bg');
}

function clearBlink() {
  metronomeToolContainer.classList.remove('blink-bg');
}

function updateSoundButton() {
  toggleSoundButton.classList.toggle('button-on', isSoundOn);
}

function updateBlinkButton() {
  toggleBlinkButton.classList.toggle('button-on', isBlinkOn);
}

function saveSettings() {
  localStorage.setItem('metronome.bpm', bpmInput.value);
  localStorage.setItem('metronome.beat_sound', beatSoundSelect.value);
  localStorage.setItem('metronome.sound_on', JSON.stringify(isSoundOn));
  localStorage.setItem('metronome.blink_on', JSON.stringify(isBlinkOn));
  localStorage.setItem('metronome.volume', String(soundVolume));
  localStorage.setItem('metronome.signature', getSignatureLabel());
  localStorage.setItem('metronome.accent_on', JSON.stringify(accentOn));
  localStorage.setItem('metronome.show_base_signature', JSON.stringify(showBaseSignature));
  saveMutedBeatSettings();
}

function loadSettings() {
  const savedBPM = localStorage.getItem('metronome.bpm');
  const savedBeatSound = localStorage.getItem('metronome.beat_sound');
  const savedSound = localStorage.getItem('metronome.sound_on');
  const savedBlink = localStorage.getItem('metronome.blink_on');
  const savedVolume = localStorage.getItem('metronome.volume');
  const savedPanel = localStorage.getItem("metronome.panel");
  const savedBeats = localStorage.getItem("metronome.beat_history");
  const savedGuides = localStorage.getItem('metronome.show_guides');
  const savedHaptic = localStorage.getItem('metronome.haptic');
  const savedShowBaseBpm = localStorage.getItem('metronome.show_base_bpm');
  const savedShowBaseTempi = localStorage.getItem('metronome.show_base_tempi');
  const savedShowBaseSignature = localStorage.getItem('metronome.show_base_signature');
  const savedShowPanelTempi = localStorage.getItem('metronome.show_panel_tempi');
  const savedSignature = localStorage.getItem('metronome.signature');
  const savedAccent = localStorage.getItem('metronome.accent_on');
  const savedMutedBeats = localStorage.getItem('metronome.muted_beats');
  const hasSavedBaseMode = savedShowBaseBpm !== null || savedShowBaseTempi !== null || savedShowBaseSignature !== null;

  const globalBPM = parseFloat(localStorage.getItem('global.default_bpm'));
  if (!isNaN(globalBPM)) {
    updateBPM(globalBPM, false);
  } else if (savedBPM !== null) {
    updateBPM(savedBPM, false);
  }
  if (savedBeatSound !== null) beatSoundSelect.value = savedBeatSound;
  if (savedSound !== null) isSoundOn = JSON.parse(savedSound);
  if (savedBlink !== null) isBlinkOn = JSON.parse(savedBlink);
  if (savedVolume !== null) soundVolume = Math.min(Math.max(parseInt(savedVolume, 10) || 0, 0), 100);
  if (savedGuides !== null) {
    show_guides = JSON.parse(savedGuides);
  } else {
    show_guides = localStorage.getItem('global.guides') !== 'false';
  }
  if (savedHaptic !== null) {
    hapticMode = JSON.parse(savedHaptic);
  } else {
    hapticMode = localStorage.getItem('global.haptics') === 'true';
  }
  if (savedShowBaseBpm !== null) {
    showBaseBpm = JSON.parse(savedShowBaseBpm);
  }
  if (savedShowBaseTempi !== null) {
    showBaseTempi = JSON.parse(savedShowBaseTempi);
  }
  if (savedShowBaseSignature !== null) {
    showBaseSignature = JSON.parse(savedShowBaseSignature);
  }
  if (savedShowPanelTempi !== null) {
    showPanelTempi = JSON.parse(savedShowPanelTempi);
  }
  if (savedAccent !== null) {
    accentOn = JSON.parse(savedAccent);
  }
  if (savedSignature !== null && signatureSelect) {
    signatureSelect.value = savedSignature;
  }
  if (savedMutedBeats !== null) {
    try {
      const parsedMutedBeats = JSON.parse(savedMutedBeats);
      if (Array.isArray(parsedMutedBeats)) {
        mutedBeatIndexes = new Set(parsedMutedBeats.filter((index) => Number.isInteger(index)));
      }
    } catch (_) {
      mutedBeatIndexes = new Set();
    }
    normalizeMutedBeatIndexes(false);
  }
  if (savedPanel) {
    beatsPanelText = savedPanel;
  }
  if (savedBeats) {
    beatHistory = JSON.parse(savedBeats);
    beatCount = beatHistory.length;
  }

  normalizeBaseInfoState(hasSavedBaseMode);

  redrawTimeline();

  updateSoundButton();
  updateBlinkButton();
  if (volumeSlider) {
    volumeSlider.value = String(soundVolume);
  }
  btnGuides.classList.toggle('button-on', show_guides);
  btnHaptic.classList.toggle('button-on', hapticMode);
  updateToggleButtons();
  renderPanelView();
  updateBaseText();
  updateBaseSignatureCircles();
  if (!isBlinkOn) clearBlink();
}

btnGuides.addEventListener('click', () => {
  show_guides = !show_guides;
  btnGuides.classList.toggle('button-on', show_guides);
  localStorage.setItem('metronome.show_guides', show_guides);
  redrawTimeline();
});

btnHaptic.addEventListener('click', () => {
  hapticMode = !hapticMode;
  btnHaptic.classList.toggle('button-on', hapticMode);
  localStorage.setItem('metronome.haptic', hapticMode);
});

if (baseBpmButton) {
  baseBpmButton.addEventListener('click', () => {
    setBaseInfoMode(showBaseBpm ? 'none' : 'bpm');
  });
}

if (baseTempiButton) {
  baseTempiButton.addEventListener('click', () => {
    setBaseInfoMode(showBaseTempi ? 'none' : 'tempi');
  });
}

if (baseSignatureButton) {
  baseSignatureButton.addEventListener('click', () => {
    setBaseInfoMode(showBaseSignature ? 'none' : 'signature');
  });
}

if (toggleAccentButton) {
  toggleAccentButton.addEventListener('click', () => {
    accentOn = !accentOn;
    localStorage.setItem('metronome.accent_on', JSON.stringify(accentOn));
    updateToggleButtons();
    redrawTimeline();
  });
}

if (signatureSelect) {
  signatureSelect.addEventListener('change', () => {
    beatInBar = -1;
    normalizeMutedBeatIndexes(true);
    saveSettings();
    updateBaseSignatureCircles();
  });
}

if (panelBeatsButton) {
  panelBeatsButton.addEventListener('click', () => {
    showPanelTempi = false;
    localStorage.setItem('metronome.show_panel_tempi', JSON.stringify(showPanelTempi));
    updateToggleButtons();
    renderPanelView();
  });
}

if (panelTempiButton) {
  panelTempiButton.addEventListener('click', () => {
    showPanelTempi = true;
    localStorage.setItem('metronome.show_panel_tempi', JSON.stringify(showPanelTempi));
    updateToggleButtons();
    renderPanelView();
  });
}

if (stopButton) {
  stopButton.addEventListener('click', () => {
    stopMetronome();
    clearBeatSessionData();
  });
}

resetButton.addEventListener('click', () => {
  stopMetronome();
  localStorage.removeItem('metronome.bpm');
  localStorage.removeItem('metronome.beat_sound');
  localStorage.removeItem('metronome.sound_on');
  localStorage.removeItem('metronome.blink_on');
  localStorage.removeItem('metronome.volume');
  localStorage.removeItem("metronome.panel");
  localStorage.removeItem("metronome.beat_history");
  localStorage.removeItem('metronome.show_guides');
  localStorage.removeItem('metronome.haptic');
  localStorage.removeItem('metronome.show_base_bpm');
  localStorage.removeItem('metronome.show_base_tempi');
  localStorage.removeItem('metronome.show_base_signature');
  localStorage.removeItem('metronome.show_panel_tempi');
  localStorage.removeItem('metronome.signature');
  localStorage.removeItem('metronome.accent_on');
  localStorage.removeItem('metronome.muted_beats');

  isSoundOn = true;
  isBlinkOn = false;
  show_guides = localStorage.getItem('global.guides') !== 'false';
  hapticMode = false;
  accentOn = true;
  showBaseBpm = false;
  showBaseTempi = false;
  showBaseSignature = true;
  showPanelTempi = false;
  mutedBeatIndexes = new Set();
  soundVolume = 100;
  beatSoundSelect.value = "click";
  if (signatureSelect) signatureSelect.value = '4/4';
  pendulumDirection = -30;
  updateBPM(120);
  updateSoundButton();
  updateBlinkButton();
  if (volumeSlider) {
    volumeSlider.value = String(soundVolume);
  }
  btnGuides.classList.remove('button-on');
  btnHaptic.classList.remove('button-on');
  updateToggleButtons();
  clearBeatSessionData();
  updateBaseText();
});

togglePlayButton.addEventListener('click', () => {
  isPlaying ? stopMetronome() : startMetronome();
});
toggleSoundButton.addEventListener('click', () => {
  isSoundOn = !isSoundOn;
  updateSoundButton();
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {
      // Resume is best-effort; the next gesture can retry.
    });
  }
  const muteGain = ensureMasterMuteGainNode();
  if (muteGain && audioContext) {
    const now = audioContext.currentTime;
    muteGain.gain.cancelScheduledValues(now);
    muteGain.gain.setValueAtTime(isSoundOn ? 1 : 0, now);
  }
  saveSettings();
});
toggleBlinkButton.addEventListener('click', () => {
  isBlinkOn = !isBlinkOn;
  updateBlinkButton();
  if (!isBlinkOn) clearBlink();
  saveSettings();
});
beatSoundSelect.addEventListener('change', saveSettings);
bpmInput.addEventListener('input', () => updateBPM(parseFloat(bpmInput.value)));
bpmSlider.addEventListener('input', () => updateBPM(bpmSlider.value));
volumeSlider.addEventListener('input', () => updateVolume(volumeSlider.value));
halfButton.addEventListener('click', () => {
  const newBPM = Math.max(minBPM, bpmInput.value / 2);
  updateBPM(newBPM);
});
doubleButton.addEventListener('click', () => {
  const newBPM = Math.min(maxBPM, bpmInput.value * 2);
  updateBPM(newBPM);
});
copyButton.addEventListener("click", () => {
  const data = metronomeText.value.trim();
  if (data.length === 0) return;
  navigator.clipboard.writeText(data);
});

// Increase/Decrease button logic
let increaseInterval = null;
let decreaseInterval = null;
let volumeIncreaseInterval = null;
let volumeDecreaseInterval = null;

function increaseBPM() {
  const bpm = Math.min(maxBPM, parseInt(bpmInput.value) + 1);
  updateBPM(bpm);
}

function decreaseBPM() {
  const bpm = Math.max(minBPM, parseInt(bpmInput.value) - 1);
  updateBPM(bpm);
}

function increaseVolume() {
  updateVolume(soundVolume + 1);
}

function decreaseVolume() {
  updateVolume(soundVolume - 1);
}

function startHoldIncrease() {
  increaseBPM();
  increaseInterval = setInterval(increaseBPM, 100);
}

function stopHoldIncrease() {
  clearInterval(increaseInterval);
}

function startHoldDecrease() {
  decreaseBPM();
  decreaseInterval = setInterval(decreaseBPM, 100);
}

function stopHoldDecrease() {
  clearInterval(decreaseInterval);
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
    if (event && typeof element.releasePointerCapture === 'function') {
      try {
        element.releasePointerCapture(activePointerId);
      } catch (_) {}
    }
    activePointerId = null;
    stopFn();
  };

  element.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    activePointerId = e.pointerId;
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

handleHold(startHoldIncrease, stopHoldIncrease, increaseButton);
handleHold(startHoldDecrease, stopHoldDecrease, decreaseButton);
handleHold(startHoldVolumeIncrease, stopHoldVolumeIncrease, volumeIncreaseButton);
handleHold(startHoldVolumeDecrease, stopHoldVolumeDecrease, volumeDecreaseButton);

// Get CSS variables

function getCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

loadSettings();

window.addEventListener('pekosoft:global-defaults-change', (event) => {
  const defaults = event.detail;
  if (!defaults || !['bpm', 'all'].includes(defaults.changed)) return;
  const bpm = defaults.bpm;
  if (Number.isFinite(bpm)) updateBPM(bpm, false);
});

if (metronomeTimelineSvg && metronomeSvgTimeline?.observeResize) {
  disconnectMetronomeTimelineResize = metronomeSvgTimeline.observeResize({
    svg: metronomeTimelineSvg,
    container: metronomeTimelineContainer,
    onResize: redrawTimeline
  });
}

// END OF FILE
