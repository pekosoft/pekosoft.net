// Pekosoft Visualizer
// pekosoft.net/js/visualizer.js

let currentBpm = 120;
const togglePlayButton = document.getElementById('toggle-play-button');
const toggleCrossButton = document.getElementById('toggle-cross-button');
const toggleMaskButton = document.getElementById('toggle-mask-button');
const toggleTitleButton = document.getElementById('toggle-title-button');
const pulseContainer = document.querySelector('.pulse-container');
const clockHand = document.getElementById('clock-hand');
const blinkContainer = document.querySelector('.blink-container');
const cakeContainer = document.getElementById('cake-container');
const clockDotsContainer = document.getElementById('clock-dots-container');
const pendulum = document.getElementById('pendulum');
const speedometerNeedle = document.getElementById('speedometer-needle');
const speedometerLabels = document.getElementById('speedometer-labels');
const totalBeatsDisplay = document.getElementById('total-beats');
const starsContainer = document.getElementById('stars-container');
const tickerText = document.querySelector('.ticker-text');
const tickerContainer = tickerText.closest('.ticker-container');
const linesContainer = document.querySelector('.lines-container');

const pulseMeter = pulseContainer.closest('.meter');
const clockMeter = clockHand.closest('.meter');
const blinkMeter = blinkContainer.closest('.meter');
const cakeMeter = cakeContainer.closest('.meter');
const speedometerMeter = speedometerNeedle.closest('.meter');
const metronomeMeter = pendulum.closest('.meter');
const starsMeter = starsContainer.closest('.meter');
const tickerMeter = tickerText.closest('.meter');
const linesMeter = linesContainer.closest('.meter');
const toolContainer = document.getElementById('tool-container');
const toolBody = toolContainer ? toolContainer.querySelector('.visualizer-meters') : null;
const toolModeAllButton = document.getElementById('tool-mode-all-button');
const toolModeSingleButton = document.getElementById('tool-mode-single-button');
const toolSingleNextButton = document.getElementById('tool-single-next-button');

const buttons = {
  clock: document.getElementById('toggle-clock-button'),
  cake: document.getElementById('toggle-cake-button'),
  speedometer: document.getElementById('toggle-speedometer-button'),
  metronome: document.getElementById('toggle-metronome-button'),
  ticker: document.getElementById('toggle-ticker-button'),
  lines: document.getElementById('toggle-lines-button'),
  stars: document.getElementById('toggle-stars-button'),
  pulse: document.getElementById('toggle-pulse-button'),
  blink: document.getElementById('toggle-blink-button'),
};

const meters = {
  pulse: pulseMeter,
  clock: clockMeter,
  blink: blinkMeter,
  cake: cakeMeter,
  speedometer: speedometerMeter,
  metronome: metronomeMeter,
  stars: starsMeter,
  ticker: tickerMeter,
  lines: linesMeter,
};

let isPaused = true;
let totalBeats = 0;
let lastUpdateTime = Date.now();
let animationInterval = null;
let cakeBuiltBpm = null;
let lastTickerBpm = null;
let lastTickerLayoutSignature = '';
let starElements = [];
let linesBuiltBpm = null;
let restartTickerOnNextUpdate = false;
let maskEnabled = true;
let crossEnabled = true;
let titleEnabled = true;
let toolViewMode = 'single';
let singleMeterName = 'clock';

// Keep ticker hidden until playback starts.
tickerText.style.visibility = 'hidden';

function startAnimation() {
  if (!animationInterval) animationInterval = setInterval(updateAnimation, 100);
}

function stopAnimation() {
  clearInterval(animationInterval);
  animationInterval = null;
}

function updateTickerMotion(bpm, forceRestart) {
  const delay = 60 / bpm;
  const duration = delay * 2;
  const containerWidth = tickerContainer.clientWidth;
  const textWidth = tickerText.scrollWidth;
  const gap = Math.max(10, Math.round(containerWidth * 0.08));
  const start = containerWidth + gap;
  const end = -(textWidth + gap);

  tickerText.style.setProperty('--ticker-start', `${start}px`);
  tickerText.style.setProperty('--ticker-end', `${end}px`);

  const hasAnimation = tickerText.style.animation && tickerText.style.animation !== 'none';

  if (forceRestart || !hasAnimation) {
    tickerText.style.animation = 'none';
    void tickerText.offsetWidth;
    tickerText.style.animation = `scroll-left ${duration}s linear infinite`;
  } else {
    // Just update duration, let animation continue
    tickerText.style.animationDuration = `${duration}s`;
  }
}

function updateAnimation() {
  const bpm = currentBpm;

  tickerText.textContent = `BPM: ${bpm}`;
  updateTickerMotion(bpm, restartTickerOnNextUpdate);
  restartTickerOnNextUpdate = false;

  const delay = 60 / bpm;
  document.documentElement.style.setProperty('--delay', `${delay}s`);

  const animationState = isPaused ? 'paused' : 'running';
  pulseContainer.style.animationPlayState = animationState;
  blinkContainer.style.animationPlayState = animationState;
  tickerText.style.animationPlayState = animationState;

  if (bpm !== cakeBuiltBpm) {
    cakeContainer.innerHTML = '';
    for (let i = 0; i < bpm; i++) {
      const line = document.createElement('div');
      line.className = 'cake-line';
      const angle = (360 / bpm) * i;
      line.style.transform = `rotate(${angle}deg)`;
      cakeContainer.appendChild(line);
    }
    cakeBuiltBpm = bpm;
  }

  if (bpm !== linesBuiltBpm) {
    buildLines(bpm);
    linesBuiltBpm = bpm;
  }

  const needleAngle = -135 + (bpm / 480) * 270;
  speedometerNeedle.style.transform = `translateX(-50%) rotate(${needleAngle}deg)`;

  const currentTime = Date.now();
  if (!isPaused) {
    const elapsedTime = (currentTime - lastUpdateTime) / 1000;
    const beats = (bpm / 60) * elapsedTime;
    totalBeats += beats;
    totalBeatsDisplay.textContent = `Total beats: ${Math.round(totalBeats)}`;
    updateStars(bpm);
  }

  // Keep these lines on beat-stepped angles to avoid high-BPM sweep blur artifacts.
  const beatIndex = Math.floor(totalBeats);
  const clockAngle = (beatIndex % 60) * 6;
  const metronomeAngle = beatIndex % 2 === 0 ? -45 : 45;
  clockHand.style.transform = `rotate(${clockAngle}deg)`;
  pendulum.style.transform = `rotate(${metronomeAngle}deg)`;

  lastUpdateTime = currentTime;
}

function createClockDots() {
  clockDotsContainer.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const dot = document.createElement('div');
    dot.className = 'clock-dot';
    const angle = (360 / 60) * i;
    const radius = 150;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    dot.style.transform = `translate(${x}px, ${y}px)`;
    clockDotsContainer.appendChild(dot);
  }
}

function createSpeedometerLabels() {
  speedometerLabels.innerHTML = '';
  const labels = [];
  for (let bpm = 0; bpm <= 480; bpm += 30) labels.push(bpm);
  const totalLabels = labels.length;
  const startAngle = -225;
  const endAngle = 45;
  const angleIncrement = (endAngle - startAngle) / (totalLabels - 1);

  labels.forEach((label, index) => {
    const angle = startAngle + angleIncrement * index;
    const radian = (angle * Math.PI) / 180;
    const radius = 150;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'speedometer-label';
    labelDiv.style.transform = `translate(${x}px, ${y}px) rotate(${angle + 90}deg)`;
    labelDiv.textContent = label;
    speedometerLabels.appendChild(labelDiv);
  });
}

function updateStars(bpm) {
  if (starElements.length !== bpm) {
    starsContainer.innerHTML = '';
    starElements = [];
    for (let i = 0; i < bpm; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      starsContainer.appendChild(star);
      starElements.push(star);
    }
  }
  starElements.forEach(star => {
    const size = Math.random() * 3 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
  });
}

function buildLines(bpm) {
  linesContainer.innerHTML = '';
  if (bpm < 1) return;
  if (bpm === 1) {
    const line = document.createElement('div');
    line.className = 'timeline-line';
    line.style.setProperty('--x', '50%');
    linesContainer.appendChild(line);
    return;
  }
  for (let i = 0; i < bpm; i++) {
    const line = document.createElement('div');
    line.className = 'timeline-line';
    const left = (i / (bpm - 1)) * 100;
    line.style.setProperty('--x', left + '%');
    linesContainer.appendChild(line);
  }
}

function loadToggleState() {
  try {
    const json = localStorage.getItem('visualizer.toggles');
    if (!json) return null;
    return JSON.parse(json);
  } catch { return null; }
}

function saveToggleState(state) {
  localStorage.setItem('visualizer.toggles', JSON.stringify(state));
}

function loadToolMode() {
  const saved = localStorage.getItem('visualizer.tool_mode');
  return saved === 'all' ? 'all' : 'single';
}

function saveToolMode(mode) {
  localStorage.setItem('visualizer.tool_mode', mode === 'single' ? 'single' : 'all');
}

function loadSingleMeterName() {
  const saved = localStorage.getItem('visualizer.single_meter');
  return saved && Object.hasOwn(defaultState, saved) ? saved : 'clock';
}

function saveSingleMeterName(name) {
  if (defaultState[name] === undefined) return;
  localStorage.setItem('visualizer.single_meter', name);
}

function loadBpm() {
  const globalBpm = parseInt(localStorage.getItem('global.default_bpm'), 10);
  if (Number.isFinite(globalBpm)) return Math.min(480, Math.max(1, globalBpm));
  return 120;
}

function loadCrosshair() {
  const saved = localStorage.getItem('visualizer.crosshair');
  return saved === null ? true : saved === 'true';
}

function saveCrosshair(on) {
  localStorage.setItem('visualizer.crosshair', on ? 'true' : 'false');
}

function applyCrosshair(on, save = true) {
  document.body.classList.toggle('visualizer-crosshair-on', on);
  if (toggleCrossButton) {
    toggleCrossButton.classList.toggle('button-on', on);
  }
  if (save) {
    saveCrosshair(on);
  }
}

function loadMask() {
  const saved = localStorage.getItem('visualizer.mask');
  return saved === null ? true : saved === 'true';
}

function saveMask(on) {
  localStorage.setItem('visualizer.mask', on ? 'true' : 'false');
}

function applyMask(on, save = true) {
  document.body.classList.toggle('visualizer-mask-on', on);
  if (toggleMaskButton) {
    toggleMaskButton.classList.toggle('button-on', on);
  }
  if (save) {
    saveMask(on);
  }
}

function loadTitles() {
  const saved = localStorage.getItem('visualizer.titles');
  return saved === null ? true : saved === 'true';
}

function saveTitles(on) {
  localStorage.setItem('visualizer.titles', on ? 'true' : 'false');
}

function applyTitles(on, save = true) {
  document.body.classList.toggle('visualizer-titles-on', on);
  if (toggleTitleButton) {
    toggleTitleButton.classList.toggle('button-on', on);
  }
  if (save) {
    saveTitles(on);
  }
}

function applyToggle(name, on, save) {
  if (!meters[name] || !buttons[name]) return;
  toggleState[name] = !!on;
  buttons[name].classList.toggle('button-on', on);
  if (save) {
    saveToggleState(toggleState);
  }
  renderToolMeters();
}

function ensureSingleMeterName() {
  if (!Object.hasOwn(defaultState, singleMeterName)) {
    singleMeterName = 'clock';
    saveSingleMeterName(singleMeterName);
  }
}

function updateToolModeButtons() {
  if (toolModeAllButton) {
    toolModeAllButton.classList.toggle('button-on', toolViewMode === 'all');
  }
  if (toolModeSingleButton) {
    toolModeSingleButton.classList.toggle('button-on', toolViewMode === 'single');
  }

  const skipDisabled = toolViewMode !== 'single';
  [toolSingleNextButton].forEach((button) => {
    if (!button) return;
    button.classList.toggle('grey', skipDisabled);
    button.disabled = skipDisabled;
    button.setAttribute('aria-disabled', skipDisabled ? 'true' : 'false');
  });
  Object.keys(defaultState).forEach((name) => {
    const selected = toolViewMode === 'single' ? name === singleMeterName : toggleState[name];
    buttons[name].classList.toggle('button-on', selected);
    buttons[name].setAttribute('aria-pressed', selected ? 'true' : 'false');
    const label = buttons[name].querySelector('.button-text').textContent;
    buttons[name].title = `${toolViewMode === 'single' ? 'Select' : 'Toggle'} ${label.toLowerCase()}`;
  });
  const title = toolContainer.querySelector(':scope > .module-header .module-title');
  if (title) {
    const label = toolViewMode === 'single'
      ? buttons[singleMeterName].querySelector('.button-text').textContent : 'All';
    title.textContent = `Visualizer: ${label}`;
  }
}

function updateToolSizing() {
  if (!toolContainer || !toolBody) return;

  const singleMode = toolViewMode === 'single';
  toolContainer.classList.toggle('visualizer-single-mode', singleMode);
  toolBody.classList.toggle('circular-instrument', singleMode);
  if (!singleMode) {
    const count = Object.values(meters).filter((meter) => !meter.classList.contains('hidden')).length;
    const { width, height } = toolBody.getBoundingClientRect();
    let columns = 1;
    let largestSize = 0;
    for (let candidate = 1; candidate <= count; candidate++) {
      const rows = Math.ceil(count / candidate);
      const size = Math.min((width - (candidate - 1) * 8) / candidate, (height - (rows - 1) * 8) / rows);
      if (size > largestSize) {
        largestSize = size;
        columns = candidate;
      }
    }
    toolBody.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    toolBody.style.gridTemplateRows = `repeat(${Math.max(1, Math.ceil(count / columns))}, minmax(0, 1fr))`;
  }
}

function renderToolMeters() {
  ensureSingleMeterName();

  Object.keys(defaultState).forEach((name) => {
    const meter = meters[name];
    if (!meter) return;

    if (toolViewMode === 'all') {
      meter.classList.toggle('hidden', !toggleState[name]);
      return;
    }

    const shouldShow = name === singleMeterName;
    meter.classList.toggle('hidden', !shouldShow);
  });

  updateToolModeButtons();
  updateToolSizing();
}

function setToolViewMode(mode, save = true) {
  toolViewMode = mode === 'single' ? 'single' : 'all';
  if (save) {
    saveToolMode(toolViewMode);
  }
  renderToolMeters();
}

function stepSingleMeter(direction) {
  if (toolViewMode !== 'single') return;

  const names = Object.keys(buttons);

  const currentIndex = Math.max(0, names.indexOf(singleMeterName));
  const nextIndex = (currentIndex + direction + names.length) % names.length;
  singleMeterName = names[nextIndex];
  saveSingleMeterName(singleMeterName);
  renderToolMeters();
}

const defaultState = {
  pulse: true,
  clock: true,
  blink: true,
  cake: true,
  speedometer: true,
  metronome: true,
  stars: true,
  ticker: true,
  lines: true,
};

const loadedToggleState = loadToggleState() || {};
const toggleState = Object.keys(defaultState).reduce((acc, key) => {
  const value = loadedToggleState[key];
  if (typeof value === 'boolean') {
    acc[key] = value;
  } else {
    acc[key] = defaultState[key];
  }
  return acc;
}, {});

Object.keys(defaultState).forEach(name => {
  if (!buttons[name] || !meters[name]) return;
  buttons[name].addEventListener('click', () => {
    if (toolViewMode === 'single') {
      singleMeterName = name;
      saveSingleMeterName(name);
      renderToolMeters();
      return;
    }
    const current = !!toggleState[name];
    applyToggle(name, !current, true);
  });
});

Object.keys(defaultState).forEach(name => {
  applyToggle(name, !!toggleState[name], false);
});

if (toolModeAllButton) {
  toolModeAllButton.addEventListener('click', () => {
    setToolViewMode('all', true);
  });
}

if (toolModeSingleButton) {
  toolModeSingleButton.addEventListener('click', () => {
    setToolViewMode('single', true);
  });
}

if (toolSingleNextButton) {
  toolSingleNextButton.addEventListener('click', () => {
    stepSingleMeter(1);
  });
}

window.addEventListener('pekosoft:global-defaults-change', (event) => {
  const defaults = event.detail;
  if (!defaults || !['bpm', 'all'].includes(defaults.changed) || !Number.isFinite(defaults.bpm)) return;
  const bpm = Math.min(480, Math.max(1, Math.round(defaults.bpm)));
  currentBpm = bpm;
  updateStars(bpm);
  restartTickerOnNextUpdate = true;
  updateAnimation();
});

togglePlayButton.addEventListener('click', () => {
  isPaused = !isPaused;
  togglePlayButton.classList.toggle('button-on', !isPaused);
  if (!isPaused) {
    tickerText.style.visibility = 'visible';
    startAnimation();
  } else {
    stopAnimation();
  }
  updateAnimation();
});

if (toggleMaskButton) {
  toggleMaskButton.addEventListener('click', () => {
    maskEnabled = !maskEnabled;
    applyMask(maskEnabled, true);
  });
}

if (toggleTitleButton) {
  toggleTitleButton.addEventListener('click', () => {
    titleEnabled = !titleEnabled;
    applyTitles(titleEnabled, true);
  });
}

if (toggleCrossButton) {
  toggleCrossButton.addEventListener('click', () => {
    crossEnabled = !crossEnabled;
    applyCrosshair(crossEnabled, true);
  });
}

const resetButton = document.getElementById('reset-button');
resetButton.addEventListener('click', () => {
  isPaused = true;
  totalBeats = 0;
  currentBpm = loadBpm();
  togglePlayButton.classList.toggle('button-on', false);
  stopAnimation();
  Object.keys(defaultState).forEach(name => {
    applyToggle(name, defaultState[name], true);
  });
  singleMeterName = 'clock';
  saveSingleMeterName(singleMeterName);
  setToolViewMode('single', true);
  crossEnabled = true;
  applyCrosshair(crossEnabled, true);
  maskEnabled = true;
  applyMask(maskEnabled, true);
  titleEnabled = true;
  applyTitles(titleEnabled, true);
  tickerText.style.visibility = 'hidden';
  updateAnimation();
});

window.addEventListener('resize', () => {
  if (isPaused) return;
  restartTickerOnNextUpdate = true;
  updateAnimation();
});

// Load saved BPM on page init
currentBpm = loadBpm();
toolViewMode = loadToolMode();
singleMeterName = loadSingleMeterName();
crossEnabled = loadCrosshair();
applyCrosshair(crossEnabled, false);
maskEnabled = loadMask();
applyMask(maskEnabled, false);
titleEnabled = loadTitles();
applyTitles(titleEnabled, false);

createClockDots();
createSpeedometerLabels();
updateStars(currentBpm);
buildLines(currentBpm);
renderToolMeters();
document.addEventListener('DOMContentLoaded', renderToolMeters);
new ResizeObserver(updateToolSizing).observe(toolBody);

// END OF FILE
