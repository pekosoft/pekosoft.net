// Pekosoft Turntable
// pekosoft.net/js/turntable.js

// Element references
const turntable = document.querySelector('.turntable');

const togglePlayButton = document.getElementById('toggle-play-button');
const btnStop = document.getElementById('stop-button');
const btn8 = document.getElementById('8-button');
const btn16 = document.getElementById('16-button');
const btn22 = document.getElementById('22-button');
const btn33 = document.getElementById('33-button');
const btn45 = document.getElementById('45-button');
const btn78 = document.getElementById('78-button');
const reverseButton = document.getElementById('reverse-button');
const torqueButton = document.getElementById('torque-button');
const hapticButton = document.getElementById('haptic-button');
const resetButton = document.getElementById('reset-button');
const btn7in = document.getElementById('7in-button');
const btn10in = document.getElementById('10in-button');
const btn12in = document.getElementById('12in-button');
const standardHoleButton = document.getElementById('standard-hole-button');
const jukeboxButton = document.getElementById('jukebox-button');
const centerHole = document.querySelector('.center-hole');
const btnLabelS = document.getElementById('label-s-button');
const btnLabelL = document.getElementById('label-l-button');
const labelSmall = document.querySelector('.label-small');
const labelLarge = document.querySelector('.label-large');
const btnGuides = document.getElementById("guides-button");
const rulersButton = document.getElementById('rulers-button');
const btnTimelineRPM = document.getElementById('toggle-timeline-rpm-button');
const btnTimelineSpeed = document.getElementById('toggle-timeline-speed-button');
const btnTimelinePlayhead = document.getElementById('toggle-playhead-button');
const btnTimelineFollow = document.getElementById('follow-button');
window.addEventListener('pekosoft:timeline-bright-change', () => redrawTimeline());
const increaseButton = document.getElementById('increase-button');
const decreaseButton = document.getElementById('decrease-button');
const volumeSlider = document.getElementById('volume-slider');
const volumeIncreaseButton = document.getElementById('volume-increase-button');
const volumeDecreaseButton = document.getElementById('volume-decrease-button');

const rpmSlider = document.getElementById('tempo-slider');

const sprField = document.getElementById('spr-field');
const rpmInput = document.getElementById('rpm-input');
const dpsField = document.getElementById('dps-field');
const actualSpeedField = document.getElementById('actual-speed');
const hzField = document.getElementById('hz-field');

const turntableTimelineSvg = document.getElementById("turntable-timeline-svg");
const turntableTimelineContainer = document.getElementById('timeline-container');
const turntableTimelineScroll = turntableTimelineSvg?.closest('.timeline-scroll');
const turntableSvgUtils = window.PekoSvgUtils;
const turntableSvgTimeline = window.PekoSvgTimeline;
const turntableTimelineRulers = turntableSvgTimeline?.createRulerLayout?.({
  container: turntableTimelineContainer,
  scrollElement: turntableTimelineScroll,
  cornerRuler: document.getElementById('turntable-timeline-ruler-corner'),
  verticalRuler: document.getElementById('turntable-timeline-vertical-ruler'),
  horizontalRuler: document.getElementById('turntable-timeline-horizontal-ruler'),
  button: rulersButton,
  storageKey: 'turntable.rulers',
  onVisibilityChange: () => redrawTimeline()
});
let disconnectTurntableTimelineResize = null;
let turntableTimelineFollow = null;
const turntableText = document.getElementById("turntable-text");
const copyButton = document.getElementById("copy-button");

// Audio
let audioContext = null;
let toneVoice = null;
let isTonePlaying = false;
let metersAnalyserNode = null;
let masterMuteGainNode = null;
let metersLastActiveSec = 0;

const toggleSoundButton = document.getElementById('toggle-sound-button');
const toneTypeSelect = document.getElementById('tone-type');

function ensureMasterMuteGainNode() {
  if (!audioContext) return null;
  if (!masterMuteGainNode) {
    masterMuteGainNode = audioContext.createGain();
    masterMuteGainNode.gain.value = isTonePlaying && localStorage.getItem('global.sound') !== 'false' ? 1 : 0;
    masterMuteGainNode.connect(audioContext.destination);
  }
  return masterMuteGainNode;
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    ensureMetersAnalyserNode();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {
      // Resume is best-effort; the next gesture can retry.
    });
  }
  return audioContext;
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
    isActive: () => isPlaying || !!toneVoice || ((audioContext.currentTime - metersLastActiveSec) < 0.20),
    isStopped: () => !isPlaying && !toneVoice
  };
}

// Default values
let toneType = 'sine';
let referenceFrequency = 440;
let soundVolume = 20;

function getA4Hz() {
  const savedA4 = parseFloat(localStorage.getItem('global.a4_hz'));
  return Number.isFinite(savedA4) && savedA4 > 0 ? savedA4 : 440;
}

function normalizeToneType(value) {
  const allowed = ['sine', 'square', 'sawtooth', 'triangle', 'piano'];
  return allowed.includes(value) ? value : 'sine';
}

function setToneType(value) {
  toneType = normalizeToneType(value);
  if (toneTypeSelect) {
    toneTypeSelect.value = toneType;
  }
  if (isTonePlaying && toneVoice) {
    stopTone();
  }
}

function setTimelineGuides(enabled, persist = true) {
  showGuides = !!enabled;
  btnGuides?.classList.toggle('button-on', showGuides);
  btnGuides?.setAttribute('aria-pressed', showGuides ? 'true' : 'false');
  if (persist) {
    localStorage.setItem('turntable.show_guides', String(showGuides));
  }
}

function applySoundButtonUI() {
  toggleSoundButton.classList.toggle('button-on', isTonePlaying);
  toggleSoundButton.setAttribute('aria-pressed', isTonePlaying ? 'true' : 'false');
}

function rpmToReferenceHz(rpm) {
  return Math.abs(rpm) * (getA4Hz() / 33.333);
}

// Defaults
let targetSpeed = 33.333;
let showGuides = localStorage.getItem('global.guides') !== 'false';
let showTimelineRPM = localStorage.getItem('turntable.timeline_rpm') !== 'false';
let showTimelineSpeed = localStorage.getItem('turntable.timeline_speed') !== 'false';
let showTimelinePlayhead = localStorage.getItem('turntable.timeline_playhead') !== 'false';
let followTimeline = localStorage.getItem('turntable.timeline_follow') === null
  ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : localStorage.getItem('turntable.timeline_follow') === 'true';
let speedHistory = [];
let lastLogTime = 0;
let lastTimelineSampleTime = -Infinity;
const TURNTABLE_GRAPH_OFFSET = 0;
const TURNTABLE_TIMELINE_WIDTH = 4096;
const TURNTABLE_TIMELINE_MIN_HEIGHT = 256;

const state = {
  rpm: targetSpeed,
  spr: 60 / targetSpeed,
  dps: 200,
};

// State
let isPlaying = false;
let isAnimating = false;
let isScratching = false;
let isDragging = false;
let wasPlaying = false;
let currentSpeed = 0;
let currentSpeedButton = btn33;
const speedButtons = [btn8, btn16, btn22, btn33, btn45, btn78];
let rotationAngle = 0;
let lastFrameTime = 0;
let direction = 1;
let torqueMode = true;
let hapticMode = false;
let scratchLastAngle = 0;
let scratchLastMoveTime = 0;
let scratchIdleMuteTimer = null;
let scratchPointerId = null;
let holeMode = 'standard';
const TORQUE_ACCELERATION_RPM_PER_SEC = 60;

function getMotorTargetSpeed() {
  return isPlaying ? direction * targetSpeed : 0;
}

function moveTowards(value, target, maxDelta) {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}

function startAnimation() {
  if (isAnimating) return;
  isAnimating = true;
  lastFrameTime = 0;
  requestAnimationFrame(animateTurntable);
}

function setupTurntableToolMenuPanel() {
  const menuControls = document.getElementById('turntable-tool-menu-controls');
  const iconPanel = document.getElementById('tool-icon-panel');
  if (!menuControls || !iconPanel) return;

  iconPanel.appendChild(menuControls);
  menuControls.hidden = false;
}

function applyHoleMode(mode) {
  holeMode = mode === 'jukebox' || mode === 'off' ? mode : 'standard';

  centerHole.classList.toggle('hidden', holeMode === 'off');
  centerHole.style.width = holeMode === 'jukebox' ? '12.46%' : '2.3%';
  centerHole.style.height = holeMode === 'jukebox' ? '12.46%' : '2.3%';

  jukeboxButton.classList.toggle('button-on', holeMode === 'jukebox');
  if (standardHoleButton) {
    standardHoleButton.classList.toggle('button-on', holeMode === 'standard');
  }
}

// Limits
const minRPM = 1;
const maxRPM = 100;
const minSPR = 0.6;
const maxSPR = 60;
const TURNTABLE_TIMELINE_SAMPLE_INTERVAL_MS = 100;
const TURNTABLE_TIMELINE_SAMPLE_SPACING = 4;
const TURNTABLE_TIMELINE_MAX_SAMPLES = Math.floor(
  (TURNTABLE_TIMELINE_WIDTH - TURNTABLE_GRAPH_OFFSET) / TURNTABLE_TIMELINE_SAMPLE_SPACING
) + 1;

// UI Init
rpmInput.setAttribute('min', minRPM);
rpmInput.setAttribute('max', maxRPM);
sprField.setAttribute('min', minSPR);
sprField.setAttribute('max', maxSPR);

updateAllFields();
updateActualSpeed(currentSpeed);
updateButtonHighlight();
torqueButton.classList.add('button-on');
if (volumeSlider) {
  volumeSlider.value = String(soundVolume);
}

// Helpers
function updateAllFields() {
  rpmInput.value = state.rpm.toFixed(3);
  sprField.value = state.spr.toFixed(3);
  dpsField.value = state.dps.toFixed(3);
  rpmSlider.value = state.rpm;
}

function updateVolume(value) {
  soundVolume = Math.min(Math.max(parseInt(value, 10) || 0, 0), 100);
  if (volumeSlider) {
    volumeSlider.value = String(soundVolume);
  }
  if (toneVoice && toneVoice.gainNode && audioContext) {
    const now = audioContext.currentTime;
    const targetGain = getVolumeGain();
    toneVoice.gainNode.gain.cancelScheduledValues(now);
    toneVoice.gainNode.gain.setTargetAtTime(targetGain, now, 0.015);
  }
  // masterMuteGainNode is mute-only (0 or 1), not used for volume.
  saveSettings();
}

function getVolumeGain() {
  return soundVolume / 100;
}

function updateStateFromRPM(rpm) {
  state.rpm = rpm;
  state.spr = 60 / rpm;
  state.dps =
    Math.abs(rpm - 16.667) < 0.01 ? 100 :
      Math.abs(rpm - 33.333) < 0.01 ? 200 :
        rpm * 6;
  updateAllFields();
}

function updateActualSpeed(speed) {
  actualSpeedField.value = Math.abs(speed).toFixed(3);
  hzField.value = rpmToReferenceHz(speed).toFixed(3);
}

function rpmToDegreesPerMs(rpm) {
  return (rpm * 360) / 60000;
}

function scheduleScratchIdleMute() {
  if (scratchIdleMuteTimer) {
    clearTimeout(scratchIdleMuteTimer);
    scratchIdleMuteTimer = null;
  }

  scratchIdleMuteTimer = setTimeout(() => {
    if (!isDragging || !toneVoice || !audioContext || !toneVoice.gainNode || !toneVoice.gainNode.gain) return;
    const now = audioContext.currentTime;
    toneVoice.gainNode.gain.cancelScheduledValues(now);
    toneVoice.gainNode.gain.setTargetAtTime(0, now, 0.005);
    currentSpeed = 0;
    updateActualSpeed(0);
  }, 120);
}

function getAngleFromCenter(x, y) {
  const rect = turntable.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return Math.atan2(y - cy, x - cx) * (180 / Math.PI);
}

function isPointInsidePlatter(x, y) {
  const rect = turntable.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const radius = Math.min(turntable.clientWidth, turntable.clientHeight) / 2;
  const dx = x - cx;
  const dy = y - cy;
  return (dx * dx + dy * dy) <= (radius * radius);
}

function updateButtonHighlight() {
  speedButtons.forEach(btn =>
    btn.classList.toggle('button-on', btn === currentSpeedButton)
  );
}

function clearButtonHighlight() {
  currentSpeedButton = null;
  speedButtons.forEach(btn =>
    btn.classList.remove('button-on')
  );
}

function getSpeedButtonForRPM(rpm) {
  if (!Number.isFinite(rpm)) return null;
  return speedButtons.find(btn => Math.abs(parseFloat(btn.dataset.rpm) - rpm) < 0.01) || null;
}

function getTimelineRPM() {
  return targetSpeed;
}

function getTimelinePlayheadRatio() {
  if (speedHistory.length === 0) return 0;
  return getTimelineSampleX(speedHistory.length - 1) / TURNTABLE_TIMELINE_WIDTH;
}

function getTimelineSampleX(index) {
  return TURNTABLE_GRAPH_OFFSET + (index * TURNTABLE_TIMELINE_SAMPLE_SPACING);
}

function recordTimelineSample(timestamp) {
  if (timestamp - lastTimelineSampleTime < TURNTABLE_TIMELINE_SAMPLE_INTERVAL_MS) return;
  lastTimelineSampleTime = timestamp;

  if (speedHistory.length >= TURNTABLE_TIMELINE_MAX_SAMPLES) {
    speedHistory = [];
    turntableTimelineFollow?.reset();
  }

  speedHistory.push({
    rpm: getTimelineRPM(),
    speed: Math.abs(currentSpeed)
  });
  if (speedHistory.length > TURNTABLE_TIMELINE_MAX_SAMPLES) {
    speedHistory.shift();
  }

  redrawTimeline();
  turntableTimelineFollow?.followRatio(getTimelinePlayheadRatio());
}

function logRPM(time) {
  const now = Date.now();
  if (now - lastLogTime < 1000) return;
  lastLogTime = now;

  const timeString = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  const rpm = getTimelineRPM();
  const logLine = `[${timeString}] RPM: ${rpm.toFixed(3)} | Speed: ${Math.abs(currentSpeed).toFixed(3)} RPM | SPR: ${state.spr.toFixed(3)} | DPS: ${state.dps.toFixed(3)}\n`;
  turntableText.value += logLine;
  turntableText.scrollTop = turntableText.scrollHeight;

  localStorage.setItem("turntable.panel", turntableText.value);
  localStorage.setItem("turntable.speed_history", JSON.stringify(speedHistory));
}

function getTurntableTimelineHeight() {
  if (!turntableTimelineSvg) return TURNTABLE_TIMELINE_MIN_HEIGHT;
  return turntableSvgTimeline?.resolveHeight?.({
    svg: turntableTimelineSvg,
    minHeight: TURNTABLE_TIMELINE_MIN_HEIGHT
  }) || TURNTABLE_TIMELINE_MIN_HEIGHT;
}

function redrawTimeline() {
  if (!turntableTimelineSvg || !turntableSvgUtils) return;
  const timelineHeight = getTurntableTimelineHeight();
  turntableSvgTimeline?.setViewBox?.({
    svg: turntableTimelineSvg,
    width: TURNTABLE_TIMELINE_WIDTH,
    height: timelineHeight
  });
  const guideColor = window.PekoBrightGuides?.getTimelineGuideColor(getCssVariable('--grey1')) || getCssVariable('--grey1');
  turntableTimelineRulers?.render({
    width: TURNTABLE_TIMELINE_WIDTH,
    height: timelineHeight,
    color: guideColor,
    bright: showGuides && Boolean(window.PekoBrightGuides?.getTimelineBright?.()),
    drawVertical: (svg, dimensions) => {
      turntableSvgTimeline.drawVerticalRuler(svg, {
        ...dimensions,
        title: 'RPM',
        ticks: getTurntableTimelineVerticalTicks(timelineHeight),
        color: guideColor
      });
    },
    drawHorizontal: (svg, dimensions) => {
      turntableSvgTimeline.drawHorizontalRuler(svg, {
        ...dimensions,
        ticks: getTurntableTimelineHorizontalTicks(),
        color: guideColor
      });
    }
  });
  turntableTimelineSvg.innerHTML = '';

  drawReferenceLines(timelineHeight);

  const rpmLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const speedLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  rpmLayer.setAttribute('class', 'turntable-timeline-rpm');
  speedLayer.setAttribute('class', 'turntable-timeline-speed');
  if (showTimelineSpeed) turntableTimelineSvg.appendChild(speedLayer);
  if (showTimelineRPM) turntableTimelineSvg.appendChild(rpmLayer);

  speedHistory.forEach((sample, index) => {
    if (index === 0) return;

    const previous = speedHistory[index - 1];
    const previousX = getTimelineSampleX(index - 1);
    const x = getTimelineSampleX(index);
    const previousRPMY = getTimelineY(previous.rpm, timelineHeight);
    const rpmY = getTimelineY(sample.rpm, timelineHeight);
    const previousSpeedY = getTimelineY(previous.speed, timelineHeight);
    const speedY = getTimelineY(sample.speed, timelineHeight);

    if (showTimelineRPM) {
      rpmLayer.appendChild(turntableSvgUtils.createLine({
        x1: previousX,
        y1: previousRPMY,
        x2: x,
        y2: previousRPMY,
        color: getCssVariable('--color1')
      }));
      rpmLayer.appendChild(turntableSvgUtils.createLine({
        x1: x,
        y1: previousRPMY,
        x2: x,
        y2: rpmY,
        color: getCssVariable('--color1')
      }));
    }
    if (showTimelineSpeed) {
      speedLayer.appendChild(turntableSvgUtils.createLine({
        x1: previousX,
        y1: previousSpeedY,
        x2: x,
        y2: speedY,
        color: getCssVariable('--color2')
      }));
    }
  });

  if (showTimelinePlayhead && speedHistory.length > 0) {
    const playheadX = getTimelineSampleX(speedHistory.length - 1);
    turntableTimelineSvg.appendChild(turntableSvgUtils.createLine({
      x1: playheadX,
      y1: 0,
      x2: playheadX,
      y2: timelineHeight,
      color: getCssVariable('--white'),
      snap: false
    }));
  }
}

function getTimelineY(speed, timelineHeight) {
  const boundedSpeed = Math.max(0, Math.min(maxRPM, Number(speed) || 0));
  return timelineHeight - ((boundedSpeed / maxRPM) * timelineHeight);
}

function drawReferenceLines(timelineHeight) {
  if (!showGuides) return;
  if (!turntableTimelineSvg || !turntableSvgUtils) return;

  const guideColor = window.PekoBrightGuides?.getTimelineGuideColor(getCssVariable('--grey1')) || getCssVariable('--grey1');
  const refSpeeds = [0, 8, 16.667, 22.5, 33, 45, 78];
  const guidesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  guidesLayer.setAttribute('class', 'turntable-timeline-guides');
  turntableTimelineSvg.appendChild(guidesLayer);

  if (window.PekoBrightGuides?.getTimelineBright()) {
    const boundary = turntableTimelineRulers?.getVisible()
      ? [[TURNTABLE_TIMELINE_WIDTH, 0, TURNTABLE_TIMELINE_WIDTH, timelineHeight], [TURNTABLE_TIMELINE_WIDTH, timelineHeight, 0, timelineHeight]]
      : [[0, 0, TURNTABLE_TIMELINE_WIDTH, 0], [TURNTABLE_TIMELINE_WIDTH, 0, TURNTABLE_TIMELINE_WIDTH, timelineHeight], [TURNTABLE_TIMELINE_WIDTH, timelineHeight, 0, timelineHeight], [0, timelineHeight, 0, 0]];
    boundary.forEach(([x1, y1, x2, y2]) => {
      guidesLayer.appendChild(turntableSvgUtils.createLine({ x1, y1, x2, y2, color: guideColor, snap: false }));
    });
  }

  refSpeeds.forEach(rpm => {
    const y = Math.floor(getTimelineY(rpm, timelineHeight)) + 0.5;
    guidesLayer.appendChild(turntableSvgUtils.createLine({
      x1: 0,
      y1: y,
      x2: TURNTABLE_TIMELINE_WIDTH,
      y2: y,
      color: guideColor,
      snap: false
    }));
  });
}

function getTurntableTimelineVerticalTicks(timelineHeight) {
  return [0, 8, 16.667, 22.5, 33, 45, 78].map((rpm) => ({
    position: getTimelineY(rpm, timelineHeight),
    label: getTurntableRulerLabel(rpm)
  }));
}

function getTurntableRulerLabel(rpm) {
  if (Math.abs(rpm - 16.667) < 0.01) return '16';
  if (rpm === 22.5) return '22';
  return String(rpm);
}

function getTurntableTimelineHorizontalTicks() {
  const secondsPerTick = 10;
  const pixelsPerSecond = (1000 / TURNTABLE_TIMELINE_SAMPLE_INTERVAL_MS) * TURNTABLE_TIMELINE_SAMPLE_SPACING;
  const ticks = [];
  for (let seconds = 0; seconds * pixelsPerSecond <= TURNTABLE_TIMELINE_WIDTH; seconds += secondsPerTick) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    ticks.push({
      position: seconds * pixelsPerSecond,
      label: `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
    });
  }
  return ticks;
}

function getCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Animation loop
function animateTurntable(timestamp) {
  if (!isAnimating) return;
  if (!lastFrameTime) lastFrameTime = timestamp;
  const deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  const motorTargetSpeed = getMotorTargetSpeed();

  if (isScratching) {
    if (toneVoice && audioContext && toneVoice.gainNode && toneVoice.gainNode.gain) {
      const idleMs = performance.now() - scratchLastMoveTime;
      const scratchAudible = idleMs <= 50;
      const now = audioContext.currentTime;
      toneVoice.gainNode.gain.cancelScheduledValues(now);
      toneVoice.gainNode.gain.setTargetAtTime(scratchAudible ? getVolumeGain() : 0, now, 0.01);
    }
  } else if (torqueMode) {
    currentSpeed = moveTowards(
      currentSpeed,
      motorTargetSpeed,
      TORQUE_ACCELERATION_RPM_PER_SEC * (deltaTime / 1000)
    );
  } else {
    currentSpeed = motorTargetSpeed;
  }

  if (!isScratching && Math.abs(motorTargetSpeed) < 0.01 && Math.abs(currentSpeed) < 0.01) {
    currentSpeed = 0;
    updateActualSpeed(0);

    if (toneVoice) {
      stopTone();
    }

    isAnimating = false;
    return;
  }

  updateActualSpeed(currentSpeed);

  if (toneVoice && !isScratching) {
    referenceFrequency = rpmToReferenceHz(currentSpeed);
    if (typeof window.updateSustainedToneFrequency === 'function') {
      window.updateSustainedToneFrequency(toneVoice, {
        frequency: referenceFrequency,
        audioContext,
        glideSec: 0.015
      });
    } else {
      toneVoice.oscillator.frequency.setValueAtTime(referenceFrequency, audioContext.currentTime);
    }
  }

  if (!isScratching && currentSpeed === 0 && toneVoice) {
    stopTone();
  } else if (Math.abs(currentSpeed) > 0.01 && !toneVoice) {
    startTone();
  }

  const degreesPerMs = rpmToDegreesPerMs(currentSpeed);
  rotationAngle = (rotationAngle + degreesPerMs * deltaTime) % 360;
  turntable.style.transform = `rotate(${rotationAngle}deg)`;

  recordTimelineSample(timestamp);
  logRPM(timestamp);
  requestAnimationFrame(animateTurntable);
}

// Button logic
togglePlayButton.addEventListener('click', () => {
  isPlaying = !isPlaying;

  togglePlayButton.classList.toggle('button-on', isPlaying);
  if (isPlaying) ensureAudioContext();

  if (!torqueMode) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }

  if (isPlaying || Math.abs(currentSpeed) > 0.01) {
    startAnimation();
  }

  updateMetersSourceBridge();
  saveSettings();
});

btnStop.addEventListener('click', () => {
  isPlaying = false;
  isAnimating = false;
  currentSpeed = 0;
  rotationAngle = 0;
  turntable.style.transform = `rotate(0deg)`;
  updateActualSpeed(0);
  togglePlayButton.classList.remove('button-on');
  if (toneVoice) {
    stopTone();
  }
  updateMetersSourceBridge();
  saveSettings();
});

function setSpeed(button, rpm) {
  currentSpeedButton = button;
  targetSpeed = rpm;
  updateStateFromRPM(rpm);
  updateButtonHighlight();
  if (!torqueMode) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }
  saveSettings();
}

btn8.addEventListener('click', () => setSpeed(btn8, 8));
btn16.addEventListener('click', () => setSpeed(btn16, 16.667));
btn22.addEventListener('click', () => setSpeed(btn22, 22.5));
btn33.addEventListener('click', () => setSpeed(btn33, 33.333));
btn45.addEventListener('click', () => setSpeed(btn45, 45));
btn78.addEventListener('click', () => setSpeed(btn78, 78));

rpmInput.addEventListener('input', () => {
  const val = parseFloat(rpmInput.value);
  if (isNaN(val) || val < minRPM || val > maxRPM) return;
  targetSpeed = val;
  updateStateFromRPM(val);
  clearButtonHighlight();
  if (!torqueMode) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }
  saveSettings();
});

sprField.addEventListener('input', () => {
  const val = parseFloat(sprField.value);
  if (isNaN(val)) return;
  const clamped = Math.min(maxSPR, Math.max(minSPR, val));
  const newRPM = 60 / clamped;
  targetSpeed = newRPM;
  updateStateFromRPM(newRPM);
  clearButtonHighlight();
  if (!torqueMode) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }
  saveSettings();
});

dpsField.addEventListener('input', () => {
  const val = parseFloat(dpsField.value);
  if (isNaN(val)) return;
  const newRPM = val / 6;
  targetSpeed = newRPM;
  updateStateFromRPM(newRPM);
  clearButtonHighlight();
  if (!torqueMode) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }
  saveSettings();
});

reverseButton.addEventListener('click', () => {
  direction *= -1;
  reverseButton.classList.toggle('button-on', direction === -1);
  if (!torqueMode && !isScratching) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }
  if (isPlaying) startAnimation();
  saveSettings();
});

torqueButton.addEventListener('click', () => {
  torqueMode = !torqueMode;
  torqueButton.classList.toggle('button-on', torqueMode);
  if (!isPlaying) {
    currentSpeed = 0;
    updateActualSpeed(0);
  } else if (!torqueMode) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }
  saveSettings();
});

hapticButton.addEventListener('click', () => {
  hapticMode = !hapticMode;
  hapticButton.classList.toggle('button-on', hapticMode);
  saveSettings();
});

resetButton.addEventListener('click', () => {
  isPlaying = false;
  isAnimating = false;
  togglePlayButton.classList.remove('button-on');
  isTonePlaying = false;
  applySoundButtonUI();
  direction = 1;
  reverseButton.classList.remove('button-on');
  torqueMode = true;
  torqueButton.classList.add('button-on');
  hapticMode = false;
  hapticButton.classList.remove('button-on');
  setToneType('sine');
  soundVolume = 20;
  if (volumeSlider) {
    volumeSlider.value = String(soundVolume);
  }
  targetSpeed = 33.333;
  updateStateFromRPM(targetSpeed);
  currentSpeed = 0;
  updateActualSpeed(0);
  rotationAngle = 0;
  turntable.style.transform = `rotate(0deg)`;
  currentSpeedButton = btn33;
  updateButtonHighlight();

  document.querySelector('.ring-7').classList.add('hidden');
  document.querySelector('.ring-10').classList.add('hidden');
  document.querySelector('.ring-12').classList.remove('hidden');
  btn7in.classList.remove('button-on');
  btn10in.classList.remove('button-on');
  btn12in.classList.add('button-on');

  // Reset panel and timeline
  turntableText.value = "";
  speedHistory = [];
  lastTimelineSampleTime = -Infinity;
  showTimelineRPM = true;
  showTimelineSpeed = true;
  showTimelinePlayhead = true;
  followTimeline = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  turntableTimelineFollow?.setEnabled(followTimeline);
  turntableTimelineFollow?.reset();
  setTimelineGuides(localStorage.getItem('global.guides') !== 'false', false);
  updateTimelineControlButtons();
  redrawTimeline();

  // Clear all turntable-specific localStorage keys
  [
    'turntable.rpm',
    'turntable.direction',
    'turntable.torque',
    'turntable.haptic',
    'turntable.volume',
    'turntable.tone_type',
    'turntable.speed_btn',
    'turntable.ring7',
    'turntable.ring10',
    'turntable.ring12',
    'turntable.show_guides',
    'turntable.panel',
    'turntable.rpm_history',
    'turntable.speed_history',
    'turntable.timeline_rpm',
    'turntable.timeline_speed',
    'turntable.timeline_playhead',
    'turntable.timeline_follow',
    'turntable.rulers',
    'turntable.hole_mode',
    'turntable.jukebox',
    'turntable.label_s',
    'turntable.label_l'
  ].forEach(key => localStorage.removeItem(key));
  turntableTimelineRulers?.setVisible(true, false);

  // Reset Jukebox button and state
  if (typeof jukeboxButton !== 'undefined' && typeof centerHole !== 'undefined') {
    applyHoleMode('standard');
  }

  // Reset Label S button and state
  if (typeof labelSmall !== 'undefined') {
    labelSmall.classList.add('hidden');
  }
  if (typeof btnLabelS !== 'undefined') {
    btnLabelS.classList.remove('button-on');
  }

  // Reset Label L button and state
  if (typeof labelLarge !== 'undefined') {
    labelLarge.classList.add('hidden');
  }
  if (typeof btnLabelL !== 'undefined') {
    btnLabelL.classList.remove('button-on');
  }

  if (toneVoice) {
    stopTone();
  }

  saveSettings();
});

btn7in.addEventListener('click', () => {
  document.querySelector('.ring-7').classList.toggle('hidden');
  btn7in.classList.toggle('button-on');
  saveSettings();
});

btn10in.addEventListener('click', () => {
  document.querySelector('.ring-10').classList.toggle('hidden');
  btn10in.classList.toggle('button-on');
  saveSettings();
});

btn12in.addEventListener('click', () => {
  document.querySelector('.ring-12').classList.toggle('hidden');
  btn12in.classList.toggle('button-on');
  saveSettings();
});

standardHoleButton?.addEventListener('click', () => {
  applyHoleMode(holeMode === 'standard' ? 'off' : 'standard');
  saveSettings();
});

jukeboxButton.addEventListener('click', () => {
  applyHoleMode(holeMode === 'jukebox' ? 'off' : 'jukebox');
  saveSettings();
});

btnLabelS.addEventListener('click', () => {
  labelSmall.classList.toggle('hidden');
  btnLabelS.classList.toggle('button-on', !labelSmall.classList.contains('hidden'));
  localStorage.setItem('turntable.label_s', !labelSmall.classList.contains('hidden'));
});

btnLabelL.addEventListener('click', () => {
  labelLarge.classList.toggle('hidden');
  btnLabelL.classList.toggle('button-on', !labelLarge.classList.contains('hidden'));
  localStorage.setItem('turntable.label_l', !labelLarge.classList.contains('hidden'));

  redrawTimeline();
});

btnGuides.addEventListener('click', () => {
  setTimelineGuides(!showGuides);
  redrawTimeline();
});

function updateTimelineControlButtons() {
  btnTimelineRPM?.classList.toggle('button-on', showTimelineRPM);
  btnTimelineSpeed?.classList.toggle('button-on', showTimelineSpeed);
  btnTimelinePlayhead?.classList.toggle('button-on', showTimelinePlayhead);
  btnTimelineFollow?.classList.toggle('button-on', followTimeline);
  btnTimelineFollow?.setAttribute('aria-pressed', followTimeline ? 'true' : 'false');
}

btnTimelineRPM?.addEventListener('click', () => {
  showTimelineRPM = !showTimelineRPM;
  updateTimelineControlButtons();
  saveSettings();
  redrawTimeline();
});

btnTimelineSpeed?.addEventListener('click', () => {
  showTimelineSpeed = !showTimelineSpeed;
  updateTimelineControlButtons();
  saveSettings();
  redrawTimeline();
});

btnTimelinePlayhead?.addEventListener('click', () => {
  showTimelinePlayhead = !showTimelinePlayhead;
  updateTimelineControlButtons();
  saveSettings();
  redrawTimeline();
});

btnTimelineFollow?.addEventListener('click', () => {
  followTimeline = !followTimeline;
  turntableTimelineFollow?.setEnabled(followTimeline);
  if (followTimeline) {
    turntableTimelineFollow?.centerRatio(getTimelinePlayheadRatio());
  }
  updateTimelineControlButtons();
  saveSettings();
});

copyButton.addEventListener("click", () => {
  const turntableData = turntableText.value.trim();
  if (turntableData.length === 0) return;
  navigator.clipboard.writeText(turntableData);
});

rpmSlider.addEventListener('input', () => {
  const val = parseFloat(rpmSlider.value);
  if (isNaN(val) || val < minRPM || val > maxRPM) return;
  targetSpeed = val;
  updateStateFromRPM(val);
  clearButtonHighlight();
  if (!torqueMode) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }
  saveSettings();
});

// Scratch
function startScratch(x, y) {
  if (!isPointInsidePlatter(x, y)) return;
  wasPlaying = isPlaying;
  isPlaying = false;
  isScratching = true;
  isDragging = true;
  currentSpeed = 0;
  updateActualSpeed(0);
  scratchLastAngle = getAngleFromCenter(x, y);
  scratchLastMoveTime = performance.now();

  if (hapticMode && 'vibrate' in navigator) navigator.vibrate(10);

  ensureAudioContext();
  scheduleScratchIdleMute();
  startAnimation();
}

function moveScratch(x, y) {
  if (!isDragging) return;
  const currentAngle = getAngleFromCenter(x, y);
  let delta = currentAngle - scratchLastAngle;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  rotationAngle = (rotationAngle + delta + 360) % 360;
  turntable.style.transform = `rotate(${rotationAngle}deg)`;
  const now = performance.now();
  const elapsedMs = Math.max(1, now - scratchLastMoveTime);
  const scratchSpeed = Math.sign(delta) * Math.min(maxRPM, (Math.abs(delta) / 360) * (60000 / elapsedMs));
  const isMoving = Math.abs(scratchSpeed) >= 0.5;

  if (isMoving && !toneVoice) {
    startTone();
  }

  if (toneVoice && audioContext) {
    const audioNow = audioContext.currentTime;
    const gainNode = toneVoice.gainNode;
    if (gainNode && gainNode.gain) {
      gainNode.gain.cancelScheduledValues(audioNow);
      gainNode.gain.setTargetAtTime(isMoving ? getVolumeGain() : 0, audioNow, 0.01);
    }

    if (isMoving) {
      const scratchFrequency = rpmToReferenceHz(scratchSpeed);
      if (typeof window.updateSustainedToneFrequency === 'function') {
        window.updateSustainedToneFrequency(toneVoice, {
          frequency: scratchFrequency,
          audioContext,
          glideSec: 0.01
        });
      } else {
        toneVoice.oscillator.frequency.setValueAtTime(scratchFrequency, audioNow);
      }
    }

    touchMetersActivity(audioNow);
    updateMetersSourceBridge();
  }

  currentSpeed = isMoving ? scratchSpeed : 0;
  updateActualSpeed(currentSpeed);
  scratchLastAngle = currentAngle;
  scratchLastMoveTime = now;
  scheduleScratchIdleMute();
}

function endScratch() {
  if (!isDragging) {
    scratchPointerId = null;
    return;
  }
  isDragging = false;
  isScratching = false;
  scratchPointerId = null;
  isPlaying = wasPlaying;
  scratchLastMoveTime = 0;
  if (scratchIdleMuteTimer) {
    clearTimeout(scratchIdleMuteTimer);
    scratchIdleMuteTimer = null;
  }
  if (isPlaying) {
    if (!torqueMode) {
      currentSpeed = getMotorTargetSpeed();
      updateActualSpeed(currentSpeed);
    }
    if (toneVoice && toneVoice.gainNode && audioContext) {
      const now = audioContext.currentTime;
      toneVoice.gainNode.gain.cancelScheduledValues(now);
      toneVoice.gainNode.gain.setTargetAtTime(getVolumeGain(), now, 0.01);
    }
  }
  if (!torqueMode && !isPlaying) {
    currentSpeed = 0;
    updateActualSpeed(0);
  }
  if (isPlaying || Math.abs(currentSpeed) > 0.01) {
    startAnimation();
  } else if (toneVoice) {
    stopTone();
  }
}

function startTone() {
  ensureAudioContext();
  referenceFrequency = rpmToReferenceHz(currentSpeed);
  if (typeof window.createSustainedToneVoice === 'function') {
    toneVoice = window.createSustainedToneVoice({
      audioContext,
      tone: normalizeToneType(toneType),
      frequency: referenceFrequency,
      destinationNode: ensureMetersAnalyserNode(),
      standardGain: getVolumeGain(),
      pianoPeakGain: Math.max(getVolumeGain(), 0.0001),
      pianoBodyGain: Math.max(getVolumeGain() * 0.5, 0.0001)
    });
    touchMetersActivity(audioContext.currentTime);
    updateMetersSourceBridge();
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const selectedTone = normalizeToneType(toneType);
  if (selectedTone === 'piano') {
    const real = new Float32Array(8);
    const imag = new Float32Array([0, 1.0, 0.46, 0.23, 0.14, 0.08, 0.04, 0.02]);
    const periodicWave = audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
    oscillator.setPeriodicWave(periodicWave);
  } else {
    oscillator.type = selectedTone;
  }
  oscillator.frequency.setValueAtTime(referenceFrequency, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(getVolumeGain(), audioContext.currentTime + 0.05);
  oscillator.connect(gainNode).connect(ensureMetersAnalyserNode());
  oscillator.start();
  toneVoice = { oscillator, gainNode, tone: selectedTone };
  touchMetersActivity(audioContext.currentTime);
  updateMetersSourceBridge();
}

function stopTone() {
  if (toneVoice && toneVoice.oscillator && toneVoice.gainNode) {
    if (typeof window.releaseSustainedToneVoice === 'function') {
      const voiceToRelease = toneVoice;
      toneVoice = null;
      window.releaseSustainedToneVoice({
        audioContext,
        voice: voiceToRelease,
        releaseSec: 0.1,
        onEnded: () => {
          if (toneVoice === voiceToRelease) {
            toneVoice = null;
          }
          updateMetersSourceBridge();
        }
      });
      updateMetersSourceBridge();
      return;
    }

    const now = audioContext.currentTime;
    const fadeDuration = 0.1;
    const oscillator = toneVoice.oscillator;
    const gainNode = toneVoice.gainNode;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);
    oscillator.stop(now + fadeDuration + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    toneVoice = null;
    updateMetersSourceBridge();
  }
}

function endPointerScratch(event) {
  if (event.pointerId !== scratchPointerId) return;
  if (turntable.hasPointerCapture(event.pointerId)) {
    turntable.releasePointerCapture(event.pointerId);
  }
  endScratch();
}

turntable.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || scratchPointerId !== null) return;
  if (!isPointInsidePlatter(event.clientX, event.clientY)) return;

  scratchPointerId = event.pointerId;
  turntable.setPointerCapture(event.pointerId);
  startScratch(event.clientX, event.clientY);
  event.preventDefault();
});

turntable.addEventListener('pointermove', event => {
  if (event.pointerId !== scratchPointerId) return;
  moveScratch(event.clientX, event.clientY);
  event.preventDefault();
});

turntable.addEventListener('pointerup', endPointerScratch);
turntable.addEventListener('pointercancel', endPointerScratch);
turntable.addEventListener('lostpointercapture', endPointerScratch);

toneTypeSelect.addEventListener('change', () => {
  setToneType(toneTypeSelect.value);
  saveSettings();
});

toggleSoundButton.addEventListener('click', () => {
  isTonePlaying = !isTonePlaying;
  applySoundButtonUI();
  ensureAudioContext();
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {
      // Resume is best-effort; the next gesture can retry.
    });
  }
  const muteGain = ensureMasterMuteGainNode();
  if (muteGain && audioContext) {
    const now = audioContext.currentTime;
    muteGain.gain.cancelScheduledValues(now);
    muteGain.gain.setTargetAtTime(isTonePlaying && localStorage.getItem('global.sound') !== 'false' ? 1 : 0, now, 0.015);
  }
  if (audioContext) {
    touchMetersActivity(audioContext.currentTime);
  }
  updateMetersSourceBridge();
});

window.addEventListener('pekosoft:global-sound-change', () => {
  const muteGain = ensureMasterMuteGainNode();
  if (!muteGain || !audioContext) return;
  muteGain.gain.setTargetAtTime(isTonePlaying && localStorage.getItem('global.sound') !== 'false' ? 1 : 0, audioContext.currentTime, 0.015);
});

volumeSlider.addEventListener('input', () => {
  updateVolume(volumeSlider.value);
});

// Settings
function saveSettings() {
  localStorage.setItem('turntable.rpm', state.rpm);
  localStorage.setItem('turntable.direction', direction);
  localStorage.setItem('turntable.torque', torqueMode);
  localStorage.setItem('turntable.haptic', hapticMode);
  localStorage.setItem('turntable.volume', String(soundVolume));
  localStorage.setItem('turntable.tone_type', toneType);
  localStorage.setItem('turntable.speed_btn', currentSpeedButton?.id || '');
  localStorage.setItem('turntable.ring7', !document.querySelector('.ring-7').classList.contains('hidden'));
  localStorage.setItem('turntable.ring10', !document.querySelector('.ring-10').classList.contains('hidden'));
  localStorage.setItem('turntable.ring12', !document.querySelector('.ring-12').classList.contains('hidden'));
  localStorage.setItem('turntable.hole_mode', holeMode);
  localStorage.setItem('turntable.jukebox', String(holeMode === 'jukebox'));
  localStorage.setItem('turntable.show_guides', showGuides);
  localStorage.setItem('turntable.timeline_rpm', showTimelineRPM);
  localStorage.setItem('turntable.timeline_speed', showTimelineSpeed);
  localStorage.setItem('turntable.timeline_playhead', showTimelinePlayhead);
  localStorage.setItem('turntable.timeline_follow', followTimeline);
}

function loadSettings() {
  const savedRPM = parseFloat(localStorage.getItem('turntable.rpm'));
  const savedDir = parseInt(localStorage.getItem('turntable.direction'));
  const savedTorque = localStorage.getItem('turntable.torque');
  const savedHapticRaw = localStorage.getItem('turntable.haptic');
  const savedVolume = localStorage.getItem('turntable.volume');
  const savedToneType = localStorage.getItem('turntable.tone_type');
  const savedBtnId = localStorage.getItem('turntable.speed_btn');
  const savedHoleMode = localStorage.getItem('turntable.hole_mode');
  const savedJukebox = localStorage.getItem('turntable.jukebox') === 'true';
  const savedTimelineRPM = localStorage.getItem('turntable.timeline_rpm');
  const savedTimelineSpeed = localStorage.getItem('turntable.timeline_speed');
  const savedTimelinePlayhead = localStorage.getItem('turntable.timeline_playhead');
  const savedTimelineFollow = localStorage.getItem('turntable.timeline_follow');

  const globalRPM = parseFloat(localStorage.getItem('global.default_rpm'));
  const hasGlobalRPM = !isNaN(globalRPM);
  let appliedRPM = null;
  if (hasGlobalRPM) {
    targetSpeed = globalRPM;
    updateStateFromRPM(globalRPM);
    appliedRPM = globalRPM;
  } else if (!isNaN(savedRPM)) {
    targetSpeed = savedRPM;
    updateStateFromRPM(savedRPM);
    appliedRPM = savedRPM;
  }

  if (savedDir === 1 || savedDir === -1) {
    direction = savedDir;
    reverseButton.classList.toggle('button-on', direction === -1);
  }

  torqueMode = savedTorque === null ? true : savedTorque === 'true';
  torqueButton.classList.toggle('button-on', torqueMode);

  hapticMode = savedHapticRaw === null
    ? localStorage.getItem('global.haptics') === 'true'
    : savedHapticRaw === 'true';
  hapticButton.classList.toggle('button-on', hapticMode);

  if (savedVolume !== null) {
    soundVolume = Math.min(Math.max(parseInt(savedVolume, 10) || 0, 0), 100);
  }
  if (volumeSlider) {
    volumeSlider.value = String(soundVolume);
  }

  toneType = normalizeToneType(savedToneType || toneTypeSelect?.value || 'sine');
  if (toneTypeSelect) {
    toneTypeSelect.value = toneType;
  }

  if (hasGlobalRPM) {
    currentSpeedButton = getSpeedButtonForRPM(globalRPM);
  } else if (savedBtnId) {
    const btn = document.getElementById(savedBtnId);
    currentSpeedButton = btn || getSpeedButtonForRPM(appliedRPM);
  } else if (appliedRPM !== null) {
    currentSpeedButton = getSpeedButtonForRPM(appliedRPM);
  }

  updateButtonHighlight();
  updateActualSpeed(currentSpeed);

  const ring7 = localStorage.getItem('turntable.ring7') === 'true';
  const ring10 = localStorage.getItem('turntable.ring10') === 'true';
  const ring12 = localStorage.getItem('turntable.ring12') !== 'false';

  document.querySelector('.ring-7').classList.toggle('hidden', !ring7);
  document.querySelector('.ring-10').classList.toggle('hidden', !ring10);
  document.querySelector('.ring-12').classList.toggle('hidden', !ring12);

  btn7in.classList.toggle('button-on', ring7);
  btn10in.classList.toggle('button-on', ring10);
  btn12in.classList.toggle('button-on', ring12);

  const initialHoleMode = savedHoleMode === 'off' || savedHoleMode === 'standard' || savedHoleMode === 'jukebox'
    ? savedHoleMode
    : (savedJukebox ? 'jukebox' : 'standard');
  applyHoleMode(initialHoleMode);

  const labelSVisible = localStorage.getItem('turntable.label_s') === 'true';
  const labelLVisible = localStorage.getItem('turntable.label_l') === 'true';

  labelSmall.classList.toggle('hidden', !labelSVisible);
  btnLabelS.classList.toggle('button-on', labelSVisible);

  labelLarge.classList.toggle('hidden', !labelLVisible);
  btnLabelL.classList.toggle('button-on', labelLVisible);

  const savedPanel = localStorage.getItem("turntable.panel");
  if (savedPanel) {
    turntableText.value = savedPanel;
    turntableText.scrollTop = turntableText.scrollHeight;
  }

  const savedGuides = localStorage.getItem("turntable.show_guides");
  if (savedGuides !== null) {
    showGuides = savedGuides === "true";
  } else {
    showGuides = localStorage.getItem('global.guides') !== 'false';
  }
  setTimelineGuides(showGuides, false);

  showTimelineRPM = savedTimelineRPM !== 'false';
  showTimelineSpeed = savedTimelineSpeed !== 'false';
  showTimelinePlayhead = savedTimelinePlayhead !== 'false';
  followTimeline = savedTimelineFollow === null
    ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : savedTimelineFollow === 'true';
  updateTimelineControlButtons();

  const savedSpeedHistory = localStorage.getItem("turntable.speed_history");
  if (savedSpeedHistory) {
    try {
      const parsedHistory = JSON.parse(savedSpeedHistory);
      if (Array.isArray(parsedHistory)) {
        speedHistory = parsedHistory
          .map((sample) => {
            return {
              rpm: Number(sample?.rpm),
              speed: Number(sample?.speed)
            };
          })
          .filter((sample) => Number.isFinite(sample.rpm) && Number.isFinite(sample.speed))
          .slice(-TURNTABLE_TIMELINE_MAX_SAMPLES);
      }
    } catch (_) {
      speedHistory = [];
    }
  }

  redrawTimeline();
}

// Increase/Decrease button logic
let increaseInterval = null;
let decreaseInterval = null;
let volumeIncreaseInterval = null;
let volumeDecreaseInterval = null;

function increaseRPM() {
  const newRPM = Math.min(maxRPM, parseFloat(state.rpm) + 1);
  targetSpeed = newRPM;
  updateStateFromRPM(newRPM);
  clearButtonHighlight();
  if (!torqueMode) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }
  saveSettings();
}

function decreaseRPM() {
  const newRPM = Math.max(minRPM, parseFloat(state.rpm) - 1);
  targetSpeed = newRPM;
  updateStateFromRPM(newRPM);
  clearButtonHighlight();
  if (!torqueMode) {
    currentSpeed = getMotorTargetSpeed();
    updateActualSpeed(currentSpeed);
  }
  saveSettings();
}

function increaseVolume() {
  updateVolume(soundVolume + 1);
}

function decreaseVolume() {
  updateVolume(soundVolume - 1);
}

function startHoldIncrease() {
  increaseRPM();
  increaseInterval = setInterval(increaseRPM, 100);
}

function stopHoldIncrease() {
  clearInterval(increaseInterval);
}

function startHoldDecrease() {
  decreaseRPM();
  decreaseInterval = setInterval(decreaseRPM, 100);
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

function handleHold(startFn, stopFn, activateFn, element) {
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

  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activateFn();
  });
}

handleHold(startHoldIncrease, stopHoldIncrease, increaseRPM, increaseButton);
handleHold(startHoldDecrease, stopHoldDecrease, decreaseRPM, decreaseButton);
handleHold(startHoldVolumeIncrease, stopHoldVolumeIncrease, increaseVolume, volumeIncreaseButton);
handleHold(startHoldVolumeDecrease, stopHoldVolumeDecrease, decreaseVolume, volumeDecreaseButton);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTurntableToolMenuPanel);
} else {
  setupTurntableToolMenuPanel();
}

loadSettings();

if (turntableTimelineScroll && turntableSvgTimeline?.createFollowController) {
  turntableTimelineFollow = turntableSvgTimeline.createFollowController({
    scrollElement: turntableTimelineScroll,
    onEnabledChange: (enabled) => {
      followTimeline = enabled;
      updateTimelineControlButtons();
      saveSettings();
    }
  });
  turntableTimelineFollow.setEnabled(followTimeline);
}
updateTimelineControlButtons();

window.addEventListener('pekosoft:global-defaults-change', (event) => {
  const defaults = event.detail;
  if (!defaults || !['rpm', 'a4_hz', 'all'].includes(defaults.changed)) return;

  if (defaults.changed === 'all') {
    setToneType('sine');
  }

  if ((defaults.changed === 'rpm' || defaults.changed === 'all') && Number.isFinite(defaults.rpm)) {
    targetSpeed = defaults.rpm;
    updateStateFromRPM(defaults.rpm);
    currentSpeedButton = getSpeedButtonForRPM(defaults.rpm);
    updateButtonHighlight();
    if (!torqueMode) currentSpeed = getMotorTargetSpeed();
  }

  referenceFrequency = rpmToReferenceHz(currentSpeed);
  updateActualSpeed(currentSpeed);
  if (defaults.changed === 'all') {
    setTimelineGuides(localStorage.getItem('global.guides') !== 'false', false);
    redrawTimeline();
  }
});

if (turntableTimelineSvg && turntableSvgTimeline?.observeResize) {
  disconnectTurntableTimelineResize = turntableSvgTimeline.observeResize({
    svg: turntableTimelineSvg,
    container: turntableTimelineContainer,
    onResize: redrawTimeline
  });
}

// END OF FILE
