// Pekosoft BPM Calculator
// pekosoft.net/js/bpm_calculator.js

// ELEMENT DECLARATIONS

const bpmInput = document.getElementById('bpm-input');
const bpmSlider = document.getElementById('tempo-slider');
const halfButton = document.getElementById('half-button');
const doubleButton = document.getElementById('double-button');
const resetButton = document.getElementById('reset-button');
const stopButton = document.getElementById('stop-button');
const increaseButton = document.getElementById('increase-button');
const decreaseButton = document.getElementById('decrease-button');
const resultTable = document.getElementById('result-table');
const panelText = document.getElementById('bpm-text');
const timelineSvg = document.getElementById('bpm-timeline-svg');
const copyButton = document.getElementById('copy-button');
const toolCopyButton = document.getElementById('tool-copy-button');
const sortButton = document.getElementById('sort-button');
const columnPresetSelect = document.getElementById('column-preset-select');
const viewModeSelect = document.getElementById('view-mode');
const baseModeButton = document.getElementById('base-mode-button');
const dottedModeButton = document.getElementById('dotted-mode-button');
const tripletModeButton = document.getElementById('triplet-mode-button');
const blue = getCssVariable('--color1');
const magenta = getCssVariable('--color2');
const spbField = document.getElementById('spb-field');
const bpsField = document.getElementById('bps-field');
const togglePlayButton = document.getElementById('toggle-play-button');
const toggleSoundButton = document.getElementById('toggle-sound-button');
const toggleLoopButton = document.getElementById('toggle-loop-button');
const togglePlayheadButton = document.getElementById('toggle-playhead-button');
const guidesButton = document.getElementById('guides-button');
const timelineBrightButton = document.getElementById('timeline-bright-button');
const rulersButton = document.getElementById('rulers-button');
const followButton = document.getElementById('follow-button');
const selectNoneButton = document.getElementById('select-none-button');
const positionField = document.getElementById('position-field');
const beatField = document.getElementById('beat-field');
const volumeSlider = document.getElementById('volume-slider');
const volumeIncreaseButton = document.getElementById('volume-increase-button');
const volumeDecreaseButton = document.getElementById('volume-decrease-button');
const beatSoundSelect = document.getElementById('beat-sound-type');
const toneTypeSelect = document.getElementById('tone-type');
const noteKnob = document.getElementById('note-knob');
const noteSelect = document.getElementById('note-select');
const typeSelect = document.getElementById('type-select');
const timelineContainer = document.getElementById('timeline-container');
const timelineScroll = timelineSvg?.closest('.scrollable');
const svgUtils = window.PekoSvgUtils;
const timelineUtils = window.PekoSvgTimeline;
const BPM_TIMELINE_WIDTH = 4096;
const BPM_MIN_TIMELINE_HEIGHT = 256;
const globalGuidesDefault = localStorage.getItem('global.guides') !== 'false';
const reducedMotionDefault = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let disconnectTimelineResize = null;
let timelineFollow = null;
const bpmTimelineRulers = timelineUtils?.createRulerLayout?.({
  container: timelineContainer,
  scrollElement: timelineScroll,
  cornerRuler: document.getElementById('bpm-timeline-ruler-corner'),
  verticalRuler: document.getElementById('bpm-timeline-vertical-ruler'),
  horizontalRuler: document.getElementById('bpm-timeline-horizontal-ruler'),
  button: rulersButton,
  storageKey: 'bpm_calculator.rulers',
  onVisibilityChange: () => drawCanvas()
});

// Column buttons

const columnButtons = {
  select: document.getElementById('toggle-select-button'),
  note: document.getElementById('toggle-note-button'),
  value: document.getElementById('toggle-value-button'),
  ms: document.getElementById('toggle-ms-button'),
  hz: document.getElementById('toggle-hz-button'),
  cm: document.getElementById('toggle-cm-button'),
  inches: document.getElementById('toggle-inches-button'),
  usa: document.getElementById('toggle-usa-button'),
  uk: document.getElementById('toggle-uk-button'),
  bpm: document.getElementById('toggle-bpm-button'),
  diff: document.getElementById('toggle-diff-button'),
  percent: document.getElementById('toggle-percent-button'),
  rest: document.getElementById('toggle-rest-button'),
  close: document.getElementById('toggle-close-button'),
  play: document.getElementById('toggle-play-button-column')
};

const columnHeaders = {
  select: document.getElementById('select-header'),
  note: document.getElementById('note-header'),
  value: document.getElementById('value-header'),
  ms: document.getElementById('ms-header'),
  hz: document.getElementById('hz-header'),
  cm: document.getElementById('cm-header'),
  inches: document.getElementById('inches-header'),
  usa: document.getElementById('usa-header'),
  uk: document.getElementById('uk-header'),
  bpm: document.getElementById('bpm-header'),
  diff: document.getElementById('diff-header'),
  percent: document.getElementById('percent-header'),
  rest: document.getElementById('rest-header'),
  close: document.getElementById('close-header'),
  play: document.getElementById('play-header')
};

// CONSTANTS

let minBPM = 30;
let maxBPM = 320;
const DELAY_GAIN_RATIO = 0.15;
const DELAY_PITCH_RATIO = Math.pow(2, -3 / 12);

spbField.min = (60 / maxBPM).toFixed(3);
spbField.max = (60 / minBPM).toFixed(3);
spbField.step = "0.001";

bpsField.min = (minBPM / 60).toFixed(3);
bpsField.max = (maxBPM / 60).toFixed(3);
bpsField.step = "0.001";

bpmInput.setAttribute('step', '0.001');
bpmInput.setAttribute('min', minBPM);
bpmInput.setAttribute('max', maxBPM);

const noteData = {
  symbols: ['8_1', '4_1', '2_1', '1_1', '1_2', '1_4', '1_8', '1_16', '1_32', '1_64', '1_128'],
  restSymbols: ['8_1_rest', '4_1_rest', '2_1_rest', '1_1_rest', '1_2_rest', '1_4_rest', '1_8_rest', '1_16_rest', '1_32_rest', '1_64_rest', '1_128_rest'],
  values: ['8/1', '4/1', '2/1', '1/1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128'],
  usa: ['Octuple', 'Quadruple', 'Double', 'Whole', 'Half', 'Quarter', '8th', '16th', '32nd', '64th', '128th'],
  uk: ['Octuple', 'Quadruple', 'Breve', 'Semibreve', 'Minim', 'Crotchet', 'Quaver', 'Semiquaver', 'Demisemiquaver', 'Hemidemisemiquaver', 'Semihemidemisemiquaver'],
  wiki: ['Maxima_(music)', 'Longa_(music)', 'Double_whole_note', 'Whole_note', 'Half_note', 'Quarter_note', 'Eighth_note', 'Sixteenth_note', 'Thirty-second_note', 'Sixty-fourth_note', 'Hundred_twenty-eighth_note']
};

// STATE

let needsFullRebuild = false; // when true, calculateValues will start from scratch
let editingNumericInput = null;
let selectionRenderFrame = null;

function createDefaultColumns() {
  return {
    select: true,
    note: true,
    value: true,
    ms: true,
    hz: true,
    cm: true,
    inches: true,
    usa: true,
    uk: true,
    bpm: true,
    diff: true,
    percent: true,
    rest: true,
    close: true,
    play: true
  };
}

function createColumnPresetColumns(preset) {
  const full = createDefaultColumns();

  if (preset === 'default') {
    return {
      ...full,
      inches: false,
      uk: false,
      bpm: false,
      diff: false,
      percent: false
    };
  }

  if (preset === 'no-numbers') {
    return {
      ...full,
      value: false,
      ms: false,
      hz: false,
      cm: false,
      inches: false,
      bpm: false,
      diff: false,
      percent: false
    };
  }

  if (preset === 'no-text') {
    return {
      ...full,
      value: false,
      usa: false,
      uk: false
    };
  }

  return full;
}

function getMatchingColumnPreset() {
  const presetNames = ['default', 'full', 'no-numbers', 'no-text'];

  return presetNames.find(preset => {
    const presetColumns = createColumnPresetColumns(preset);
    return Object.keys(presetColumns).every(key => state.columns[key] === presetColumns[key]);
  }) || '';
}

function createDefaultState() {
  return {
    bpm: 120,
    columns: createColumnPresetColumns('default'),
    rows: new Set([...Array(11).keys()]),
    modes: { dotted: true, base: true, triplet: true },
    selected: '5-base',
    viewMode: 'all',
    isPlaying: false,
    isSoundOn: true,
    isLoopOn: false,
    showPlayhead: true,
    showGuides: globalGuidesDefault,
    followTimeline: !reducedMotionDefault,
    soundVolume: 100,
    beatSound: 'click',
    toneType: 'sine',
    sort: 'desc'
  };
}

let state = createDefaultState();

// Audio playback
let audioContext = null;
let masterOutputGainNode = null;
let metersAnalyserNode = null;
let metersLastActiveSec = 0;
let playbackTimer = null;
let timelineStartTime = 0;
let playbackEvents = [];
let playbackScheduleKeys = {};
let playbackScheduledUntil = { beat: 0, delay: 0 };
let playbackAnimationFrame = null;
let playbackBeatOriginSec = 0;
let playbackTempo = 120;
let pausedBeatPhase = 0;
let timelineRenderKey = '';
let timelineLayer = null;
let timelinePlayhead = null;
let timelineMarkers = [];
let currentBeatMs = null;
let currentDelayMs = null;
let scheduledAudioNodes = [];
let scheduledVisualEvents = [];
let lastVisualCheckSec = 0;
let beatHighlightUntilSec = 0;
let delayHighlightUntilSec = 0;
let pausedTimelineMs = 0;
const activeRowPreviews = new Map();
const VISUAL_HIGHLIGHT_HOLD_SEC = 0.07;
const VISUAL_MATCH_TOLERANCE_MS = 2;
const FIXED_CLICK_DURATION_SEC = 0.004;

// STATE LOAD / SAVE

function loadState() {
  const saved = localStorage.getItem('bpm_calculator.state');
  if (saved) {
    const parsed = JSON.parse(saved);
    state.bpm = parsed.bpm ?? 120;
    state.columns = { ...createDefaultColumns(), ...(parsed.columns ?? {}) };
    state.rows = new Set(parsed.rows);
    state.modes = parsed.modes ?? { dotted: true, base: true, triplet: true };
    state.selected = parsed.selected === null ? null : (parsed.selected ?? '5-base');
    state.viewMode = parsed.viewMode ?? 'all';
    state.isSoundOn = parsed.isSoundOn ?? true;
    state.isLoopOn = parsed.isLoopOn ?? false;
    state.showPlayhead = parsed.showPlayhead ?? true;
    state.showGuides = parsed.showGuides ?? state.showGuides;
    state.followTimeline = parsed.followTimeline ?? state.followTimeline;
    state.soundVolume = parsed.soundVolume ?? 100;
    state.beatSound = parsed.beatSound ?? 'click';
    state.toneType = parsed.toneType ?? 'sine';
    state.sort = parsed.sort === 'asc' ? 'asc' : 'desc';
  }
  // Global BPM overrides per-app saved BPM
  const globalBPM = parseFloat(localStorage.getItem('global.default_bpm'));
  if (!isNaN(globalBPM)) state.bpm = globalBPM;
}

function saveState() {
  const saveObj = {
    bpm: state.bpm,
    columns: state.columns,
    rows: [...state.rows],
    modes: state.modes,
    selected: state.selected,
    viewMode: state.viewMode,
    isSoundOn: state.isSoundOn,
    isLoopOn: state.isLoopOn,
    showPlayhead: state.showPlayhead,
    showGuides: state.showGuides,
    followTimeline: state.followTimeline,
    soundVolume: state.soundVolume,
    beatSound: state.beatSound,
    toneType: state.toneType,
    sort: state.sort
  };
  localStorage.setItem('bpm_calculator.state', JSON.stringify(saveObj));
}

function getSoundGain() {
  return Math.max(0, Math.min(state.soundVolume, 100)) / 100;
}

function normalizeTone(tone) {
  const allowed = ['click', 'kick', 'hat', 'sine', 'square', 'sawtooth', 'triangle', 'piano'];
  return allowed.includes(tone) ? tone : 'click';
}

function normalizeToneType(tone) {
  const allowed = ['sine', 'square', 'sawtooth', 'triangle', 'piano'];
  return allowed.includes(tone) ? tone : 'sine';
}

// CALCULATION + RENDER

// helper: restrict numeric input to three decimals without losing caret
function enforceThreeDecimals(input) {
  let v = input.value;
  if (v.includes('.')) {
    const [int, dec] = v.split('.');
    if (dec.length > 3) {
      input.value = int + '.' + dec.slice(0, 3);
    }
  }
}

function updateNumericInput(input, value) {
  if (input === editingNumericInput) return;
  input.value = value.toFixed(3);
  input.setCustomValidity('');
}

function readPositiveInput(input, commit) {
  editingNumericInput = commit ? null : input;
  const value = input.value.trim() === '' ? NaN : Number(input.value);
  const valid = Number.isFinite(value) && value > 0;
  input.setCustomValidity(valid ? '' : 'Enter a positive number.');
  if (!valid) {
    if (commit) input.reportValidity();
    return null;
  }
  return value;
}

function setupToolMenuPanel() {
  const menuControls = document.getElementById('bpm-tool-menu-controls');
  const iconPanel = document.getElementById('tool-icon-panel');
  if (!menuControls || !iconPanel) return;

  iconPanel.appendChild(menuControls);
  menuControls.hidden = false;
}

function getRowDelayMs(i, type) {
  const multiplier = getMultiplier(type);
  return (60000 / (state.bpm / Math.pow(2, 5 - i))) * multiplier;
}

function getVisibleRowDescriptors() {
  const descriptors = [];

  noteData.values.forEach((note, i) => {
    if (!state.rows.has(i)) return;
    ['dotted', 'base', 'triplet'].forEach(type => {
      if (!state.modes[type]) return;
      const multiplier = getMultiplier(type);
      descriptors.push({
        note,
        i,
        type,
        multiplier,
        ms: getRowDelayMs(i, type),
        rowKey: `row-${i}-${type}`
      });
    });
  });

  descriptors.sort((left, right) => {
    const direction = state.sort === 'asc' ? 1 : -1;
    if (left.ms !== right.ms) return (left.ms - right.ms) * direction;
    if (left.i !== right.i) return (left.i - right.i) * direction;
    return left.type.localeCompare(right.type) * direction;
  });

  return descriptors;
}

function getNoteKnobIndex(selected = state.selected) {
  return getVisibleRowDescriptors().findIndex(row => row.rowKey === `row-${selected}`) + 1;
}

function updateMenuOptions(menu, options) {
  if (menu.options.length === options.length && options.every((option, index) =>
    menu.options[index].value === option.value && menu.options[index].text === option.label)) return;
  menu.replaceChildren(...options.map(option => new Option(option.label, option.value)));
}

function syncNoteControls() {
  const rows = getVisibleRowDescriptors();
  const index = rows.findIndex(row => row.rowKey === `row-${state.selected}`) + 1;
  const selected = rows[index - 1];
  const label = selected ? getValueLabel(selected.note, selected.type) : 'None';
  const notes = Array.from(new Set(rows.map(row => row.i)), i => ({
    value: String(i), label: noteData.values[i]
  }));
  const types = ['base', 'dotted', 'triplet'].filter(type => rows.some(row => row.type === type))
    .map(type => ({ value: type, label: getNoteTypeLabel(type) }));
  updateMenuOptions(noteSelect, [{ value: '', label: 'None' }, ...notes]);
  updateMenuOptions(typeSelect, selected ? types : [{ value: '', label: 'None' }, ...types]);
  noteSelect.value = selected ? String(selected.i) : '';
  typeSelect.value = selected ? selected.type : '';
  noteSelect.disabled = rows.length === 0;
  typeSelect.disabled = !selected;
  noteKnob.disabled = rows.length === 0;
  noteKnob.style.setProperty('--knob-angle', `${-135 + index / Math.max(1, rows.length) * 270}deg`);
  noteKnob.setAttribute('role', 'slider');
  noteKnob.setAttribute('aria-orientation', 'vertical');
  noteKnob.setAttribute('aria-valuemin', '0');
  noteKnob.setAttribute('aria-valuemax', String(rows.length));
  noteKnob.setAttribute('aria-valuenow', String(index));
  noteKnob.setAttribute('aria-valuetext', label);
  noteKnob.title = `Note: ${label}`;
  noteKnob.dataset.statusLabel = noteKnob.title;
}

function setSelectedNote(rowId) {
  if (state.selected === rowId) return;
  state.selected = rowId;
  if (state.isPlaying) schedulePlaybackEvents();
  resultTable.querySelectorAll('input[type="radio"]').forEach(input => {
    input.checked = input.value === rowId;
  });
  resultTable.querySelectorAll('tr').forEach(row => {
    row.classList.toggle('table-row-selected', row.id === `row-${rowId}`);
  });
  syncNoteControls();
  saveState();
  if (selectionRenderFrame !== null) return;
  selectionRenderFrame = requestAnimationFrame(() => {
    selectionRenderFrame = null;
    updatePanel();
    drawCanvas();
  });
}

function setNoteKnobIndex(index) {
  const rows = getVisibleRowDescriptors();
  const row = rows[Math.max(0, Math.min(rows.length, Math.round(index))) - 1];
  setSelectedNote(row ? `${row.i}-${row.type}` : null);
}

function initNoteControls() {
  noteSelect.addEventListener('change', () => {
    if (noteSelect.value === '') {
      setSelectedNote(null);
      return;
    }
    const rows = getVisibleRowDescriptors().filter(row => String(row.i) === noteSelect.value);
    const currentType = state.selected?.split('-')[1] || 'base';
    const row = rows.find(row => row.type === currentType) || rows[0];
    if (!row) throw new Error('Selected note value is no longer available in Instrument.');
    setSelectedNote(`${row.i}-${row.type}`);
  });
  typeSelect.addEventListener('change', () => {
    const row = getVisibleRowDescriptors().find(row =>
      String(row.i) === noteSelect.value && row.type === typeSelect.value);
    if (!row) throw new Error('Selected note type is no longer available in Instrument.');
    setSelectedNote(`${row.i}-${row.type}`);
  });
  bindKnobControl(noteKnob, {
    get: () => getNoteKnobIndex(),
    nudge: direction => setNoteKnobIndex(getNoteKnobIndex() + direction),
    drag: (startValue, deltaY) => setNoteKnobIndex(startValue + Math.round(deltaY / 14)),
    home: () => setNoteKnobIndex(0),
    end: () => setNoteKnobIndex(getVisibleRowDescriptors().length),
    reset: () => setNoteKnobIndex(getNoteKnobIndex(createDefaultState().selected))
  });
}

function updateSortButton() {
  if (!sortButton) return;
  const iconUse = sortButton.querySelector('use');
  sortButton.classList.remove('button-on');
  sortButton.removeAttribute('aria-pressed');
  sortButton.title = 'Sort rows';
  if (iconUse) {
    iconUse.setAttribute('href', '/icons.svg#arrow_up_down');
  }
}

function getVisibleValuesText() {
  const bpm = state.bpm;
  const spb = 60 / bpm;
  const bps = bpm / 60;
  const speedOfSound = getSpeedOfSoundCmPerSec();
  const rows = getVisibleRowDescriptors().map(({ note, i, type, multiplier, ms }) => {
    const hz = 1 / (ms / 1000);
    const wavelength = speedOfSound / hz;
    const valueLabel = getValueLabel(note, type);
    const values = [];

    if (state.columns.ms) values.push(`${ms.toFixed(3)} MS`);
    if (state.columns.hz) values.push(`${hz.toFixed(3)} HZ`);
    if (state.columns.cm) values.push(`${wavelength.toFixed(3)} CM`);
    if (state.columns.inches) values.push(`${(wavelength / 2.54).toFixed(3)} IN`);

    if (state.columns.usa && state.columns.uk) {
      values.push(`${noteData.usa[i]} / ${noteData.uk[i]}`);
    } else if (state.columns.usa) {
      values.push(noteData.usa[i]);
    } else if (state.columns.uk) {
      values.push(noteData.uk[i]);
    }

    if (state.columns.bpm) values.push(`${(60000 / ms).toFixed(3)} BPM`);
    if (state.columns.diff) values.push(`${((60000 / ms) - state.bpm).toFixed(3)} DIFF`);
    if (state.columns.percent) values.push(`${(Math.pow(2, 5 - i) * multiplier * 100).toFixed(3)} %`);

    return `${valueLabel}: ${values.join(' | ')}`;
  });

  return `${bpm.toFixed(3)} BPM = ${spb.toFixed(3)} SPB = ${bps.toFixed(3)} BPS\n\n${rows.join('\n')}`;
}

function getValueLabel(note, type) {
  return `${note} ${getNoteTypeLabel(type).toLowerCase()}`;
}

function getNoteTypeLabel(type) {
  if (type === 'dotted') return 'Dotted';
  if (type === 'triplet') return 'Triplet';
  return 'Straight';
}

function calculateValues() {
  if (state.selected) {
    const [index, type] = state.selected.split('-');
    if (!state.rows.has(Number(index)) || !state.modes[type]) state.selected = null;
  }
  if (state.isPlaying) schedulePlaybackEvents();
  // always show exactly three decimals in bpm input
  updateNumericInput(bpmInput, state.bpm);

  const spb = 60 / state.bpm;
  const bps = state.bpm / 60;

  updateNumericInput(spbField, spb);
  updateNumericInput(bpsField, bps);

  bpmSlider.value = state.bpm;
  viewModeSelect.value = state.viewMode;

  const activeIds = new Set();
  const orderedRowKeys = [];

  if (needsFullRebuild) {
    resultTable.innerHTML = '';
    needsFullRebuild = false;
  }

  getVisibleRowDescriptors().forEach(({ note, i, multiplier, type, rowKey }) => {
    activeIds.add(rowKey);
    orderedRowKeys.push(rowKey);
    renderRow(note, i, multiplier, type);
  });

  orderedRowKeys.forEach((rowKey, index) => {
    const row = document.getElementById(rowKey);
    if (row && row !== resultTable.children[index]) {
      resultTable.insertBefore(row, resultTable.children[index] || null);
    }
  });

  for (const rowId of activeRowPreviews.keys()) {
    const rowKey = `row-${rowId}`;
    if (!activeIds.has(rowKey)) {
      stopRowPreview(rowId);
    }
  }

  // remove unused rows (those not in activeIds)
  resultTable.querySelectorAll('tr').forEach(row => {
    if (!activeIds.has(row.id)) {
      row.remove();
    }
  });

  updateColumnHeaders();
  updateModeButtons();
  updateSortButton();
  syncNoteControls();
  updatePanel();
  updatePlaybackReadout();
  drawCanvas();

  saveState();
  // update all numeric inputs' backgrounds in a batch
  requestAnimationFrame(() => {
    document.querySelectorAll('input[type="number"]').forEach(updateCellBar);
  });
}

function getSpeedOfSoundCmPerSec() {
  const sosMetersPerSec = parseFloat(localStorage.getItem('global.speed_of_sound'));
  return !isNaN(sosMetersPerSec) ? sosMetersPerSec * 100 : 34300;
}

function bindRowBpmInput(input, clampBpm, computeBpmFromValue) {
  if (!input) return;

  const handler = (e) => {
    enforceThreeDecimals(e.target);
    const rawVal = readPositiveInput(e.target, e.type === 'change');
    if (rawVal === null) return;

    const ii = parseInt(e.target.dataset.i, 10);
    const mult = parseFloat(e.target.dataset.multiplier);
    const newBpm = computeBpmFromValue(rawVal, ii, mult);
    if (!isFinite(newBpm) || newBpm <= 0) return;

    state.bpm = clampBpm(newBpm);
    scheduleCalculation();
  };

  input.addEventListener('input', handler);
  input.addEventListener('change', handler);
}

function renderRow(note, i, multiplier, type) {
  const bpm = state.bpm;
  const speedOfSound = getSpeedOfSoundCmPerSec();
  const ms = (60000 / (bpm / Math.pow(2, 5 - i))) * multiplier;
  const hz = 1 / (ms / 1000);
  const wavelength = speedOfSound / hz;
  const valueLabel = getValueLabel(note, type);
  const rowId = `${i}-${type}`;
  const rowKey = `row-${rowId}`;

  let row = document.getElementById(rowKey);
  const clampBpm = (val) => Math.max(minBPM, Math.min(maxBPM, val));

  if (!row) {
    row = document.createElement('tr');
    row.id = rowKey;

    row.innerHTML = `
      ${state.columns.select ? `<td class="select-field"><input type="radio" name="rowSelect" value="${rowId}" title="Select note" aria-label="Select note" ${state.selected === rowId ? 'checked' : ''}></td>` : ''}
      ${state.columns.note ? `<td class="note-field"><svg class="icons" role="img" aria-label="Note"><use href="/icons.svg#${noteData.symbols[i]}" /></svg></td>` : ''}
      ${state.columns.value ? `<td class="left value-field">${valueLabel}</td>` : ''}
      ${state.columns.ms ? `<td class="right ms-field"><input type="number" class="ms-input" step="0.001" data-i="${i}" data-multiplier="${multiplier}" value="${ms.toFixed(3)}"></td>` : ''}
      ${state.columns.hz ? `<td class="right hz-field"><input type="number" class="hz-input" step="0.001" data-i="${i}" data-multiplier="${multiplier}" value="${hz.toFixed(3)}"></td>` : ''}
      ${state.columns.cm ? `<td class="right cm-field"><input type="number" class="cm-input" step="0.001" data-i="${i}" data-multiplier="${multiplier}" value="${wavelength.toFixed(3)}"></td>` : ''}
      ${state.columns.inches ? `<td class="right inches-field"><input type="number" class="inches-input" step="0.001" data-i="${i}" data-multiplier="${multiplier}" value="${(wavelength/2.54).toFixed(3)}"></td>` : ''}
      ${state.columns.usa ? `<td class="left usa-field" title="${noteData.usa[i]}"><a href="https://en.wikipedia.org/wiki/${noteData.wiki[i]}" target="_blank" rel="noopener noreferrer">${noteData.usa[i]}</a></td>` : ''}
      ${state.columns.uk ? `<td class="left uk-field" title="${noteData.uk[i]}">${noteData.uk[i]}</td>` : ''}
      ${state.columns.bpm ? `<td class="right bpm-field"><input type="number" class="row-bpm-input" step="0.001" data-i="${i}" data-multiplier="${multiplier}" value="${(60000 / ms).toFixed(3)}"></td>` : ''}
      ${state.columns.diff ? `<td class="right diff-field"><input type="number" class="diff-input" step="0.001" readonly data-i="${i}" data-multiplier="${multiplier}" value="${((60000 / ms) - state.bpm).toFixed(3)}"></td>` : ''}
      ${state.columns.percent ? `<td class="right percent-field"><input type="number" class="percent-input" step="0.001" readonly data-i="${i}" data-multiplier="${multiplier}" value="${(Math.pow(2, 5 - i) * multiplier * 100).toFixed(3)}"></td>` : ''}
      ${state.columns.rest ? `<td class="rest-field"><svg class="icons" role="img" aria-label="Rest"><use href="/icons.svg#${noteData.restSymbols[i]}" /></svg></td>` : ''}
      ${state.columns.play ? `<td class="play-field"><button class="square transparent icon-only play-toggle-button" type="button" title="Play note" aria-label="Play" data-row-id="${rowId}" data-ms="${ms.toFixed(3)}"><svg class="icons icons-small" aria-hidden="true"><use href="/icons.svg#play" /></svg></button></td>` : ''}
      ${state.columns.close ? `<td class="close-field"><button class="square transparent icon-only" type="button" title="Close row" aria-label="Close" id="row-close-${rowId}"><svg class="icons icons-small" aria-hidden="true"><use href="/icons.svg#close" /></svg></button></td>` : ''}
    `;

    // radio selection listener
    row.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        setSelectedNote(rowId);
      });
    });

    // attach omni-directional listeners with both input & change events
    bindRowBpmInput(row.querySelector('.ms-input'), clampBpm, (msVal, ii, mult) => {
      return (60000 * mult * Math.pow(2, 5 - ii)) / msVal;
    });

    bindRowBpmInput(row.querySelector('.hz-input'), clampBpm, (hzVal, ii, mult) => {
      const msVal = 1000 / hzVal;
      return (60000 * mult * Math.pow(2, 5 - ii)) / msVal;
    });

    bindRowBpmInput(row.querySelector('.cm-input'), clampBpm, (cmVal, ii, mult) => {
      const hzVal = getSpeedOfSoundCmPerSec() / cmVal;
      const msVal = 1000 / hzVal;
      return (60000 * mult * Math.pow(2, 5 - ii)) / msVal;
    });

    bindRowBpmInput(row.querySelector('.inches-input'), clampBpm, (inVal, ii, mult) => {
      // convert back to cm for calculation
      const cmVal = inVal * 2.54;
      const hzVal = getSpeedOfSoundCmPerSec() / cmVal;
      const msVal = 1000 / hzVal;
      return (60000 * mult * Math.pow(2, 5 - ii)) / msVal;
    });

    // global bpm = rowBpmVal * multiplier * 2^(5-i)
    bindRowBpmInput(row.querySelector('.row-bpm-input'), clampBpm, (rowBpmVal, ii, mult) => {
      return rowBpmVal * mult * Math.pow(2, 5 - ii);
    });

    const playButton = row.querySelector('.play-toggle-button');
    if (playButton) {
      playButton.addEventListener('click', () => {
        const msVal = parseFloat(playButton.dataset.ms);
        const buttonRowId = playButton.dataset.rowId;
        if (buttonRowId) {
          toggleRowPreview(buttonRowId, msVal);
        }
      });
    }

    resultTable.appendChild(row);
  } else {
    // update existing row's input values and radio check state
    if (state.columns.value) row.querySelector('.value-field').textContent = valueLabel;
    if (state.columns.ms) updateNumericInput(row.querySelector('.ms-input'), ms);
    if (state.columns.hz) updateNumericInput(row.querySelector('.hz-input'), hz);
    if (state.columns.cm) updateNumericInput(row.querySelector('.cm-input'), wavelength);
    if (state.columns.inches) {
      const inp = row.querySelector('.inches-input');
      if (inp) updateNumericInput(inp, wavelength / 2.54);
    }
    if (state.columns.bpm) updateNumericInput(row.querySelector('.row-bpm-input'), 60000 / ms);
    if (state.columns.diff) {
      const diffInput = row.querySelector('.diff-input');
      if (diffInput) diffInput.value = ((60000 / ms) - state.bpm).toFixed(3);
    }
    if (state.columns.percent) {
      const percentInput = row.querySelector('.percent-input');
      if (percentInput) percentInput.value = (Math.pow(2, 5 - i) * multiplier * 100).toFixed(3);
    }
    const radio = row.querySelector('input[type="radio"]');
    if (radio) radio.checked = state.selected === rowId;
  }
  const playButton = row.querySelector('.play-toggle-button');
  if (playButton) {
    playButton.dataset.ms = ms.toFixed(3);
    const isActive = activeRowPreviews.has(rowId);
    playButton.classList.toggle('button-on', isActive);
    playButton.title = isActive ? 'Stop note' : 'Play note';
  }
  
  // Update row selection styling
  if (state.selected === rowId) {
    row.classList.add('table-row-selected');
  } else {
    row.classList.remove('table-row-selected');
  }
}

function getMultiplier(type) {
  return type === 'dotted' ? 1.5 : type === 'triplet' ? 2 / 3 : 1;
}

function closeRow(index) {
  ['dotted', 'base', 'triplet'].forEach(type => {
    stopRowPreview(`${index}-${type}`);
  });
  state.rows.delete(index);
  // ensure the table is rebuilt from scratch to avoid stale elements
  needsFullRebuild = true;
  scheduleCalculation();
}

function updateColumnHeaders() {
  for (let key in columnHeaders) {
    const visible = state.columns[key];

    // Toggle header cell
    columnHeaders[key].style.display = visible ? '' : 'none';

    // Toggle every body cell with that class
    resultTable.querySelectorAll(`.${key}-field`).forEach(cell => {
      cell.style.display = visible ? '' : 'none';
    });

    // Toggle button state
    columnButtons[key]?.classList.toggle('button-on', visible);
  }

  if (columnPresetSelect) {
    columnPresetSelect.value = getMatchingColumnPreset();
  }
}

function updateModeButtons() {
  baseModeButton.classList.toggle('button-on', state.modes.base);
  dottedModeButton.classList.toggle('button-on', state.modes.dotted);
  tripletModeButton.classList.toggle('button-on', state.modes.triplet);
}

function updateCellBar(el) {
  // el might be a <td> containing an input, or it might be the input itself
  let input, value;
  if (el.tagName === 'INPUT') {
    input = el;
    value = parseFloat(input.value);
  } else {
    input = el.querySelector('input');
    value = input ? parseFloat(input.value) : parseFloat(el.textContent);
  }
  if (!isNaN(value)) {
    const px = Math.max(0, Math.min(value, 10000)); // Clamp large values if needed
    const size = window.enableInputBackgrounds ? `${px}px 4px` : '0px 4px';
    if (input) {
      if (input.style.backgroundSize !== size) {
        input.style.backgroundSize = size;
      }
    } else if (el.tagName !== 'INPUT') {
      if (el.style.backgroundSize !== size) {
        el.style.backgroundSize = size;
      }
    }
  }
}

function updatePanel() {
  if (state.viewMode === 'single') {
    panelText.value = getVisibleValuesText();
    return;
  }

  const bpm = state.bpm;
  const spb = 60 / bpm;
  const bps = bpm / 60;
  let output = `${bpm.toFixed(3)} BPM = ${spb.toFixed(3)} SPB = ${bps.toFixed(3)} BPS\n\n`;

  if (state.viewMode === 'all') {
    if (!state.selected) {
      panelText.value = output + 'No note selected.';
      return;
    }

    const [iStr, type] = state.selected.split('-');
    const i = parseInt(iStr);
    const valueLabel = noteData.values[i];  
    const multiplier = type === 'dotted' ? 1.5 : type === 'triplet' ? 2 / 3 : 1;
    const label = getValueLabel(valueLabel, type);
    const noteMs = (60000 / (bpm / Math.pow(2, 5 - i))) * multiplier;

    const beatInterval = 60000 / bpm;
    const numBeats = Math.ceil(state.bpm);

    for (let n = 0; n < numBeats; n++) {
      const beatTime = n * (60000 / state.bpm);
      const beatPos = beatTime.toFixed(3);
      const delayPos = (beatTime + noteMs).toFixed(3);
      output += `Beat ${n + 1}: ${beatPos} MS | ${label}: ${delayPos} MS\n`;
    }
  }

  panelText.value = output;
}

function drawCanvas() {
  if (!timelineSvg) return;

  const h = getTimelineHeight();

  const w = BPM_TIMELINE_WIDTH;
  const timelineStyles = getComputedStyle(document.documentElement);
  const beatColor = timelineStyles.getPropertyValue('--color1').trim();
  const delayColor = timelineStyles.getPropertyValue('--color2').trim();
  const highlightColor = timelineStyles.getPropertyValue('--white').trim();
  const guideColor = window.PekoBrightGuides?.getTimelineGuideColor(getCssVariable('--grey1')) || getCssVariable('--grey1');
  const isBright = state.showGuides && Boolean(window.PekoBrightGuides?.getTimelineBright?.());
  const renderKey = JSON.stringify([
    h, state.bpm, state.viewMode, state.selected, [...state.rows], state.modes,
    state.showGuides, state.showPlayhead, isBright, bpmTimelineRulers?.getVisible(),
    beatColor, delayColor, highlightColor, guideColor
  ]);
  if (renderKey === timelineRenderKey && timelineSvg.firstElementChild === timelineLayer) {
    updateTimelineAnimation(highlightColor);
    return;
  }
  timelineRenderKey = renderKey;
  syncTimelineViewport(h);
  bpmTimelineRulers?.render({
    width: w,
    height: h,
    color: guideColor,
    bright: isBright,
    drawVertical: (svg, dimensions) => {
      timelineUtils.drawVerticalRuler(svg, {
        ...dimensions,
        title: 'BEAT',
        ticks: [{ position: h / 2, label: 'NOTE', labelPosition: 'below' }],
        color: guideColor
      });
    },
    drawHorizontal: (svg, dimensions) => {
      timelineUtils.drawHorizontalRuler(svg, {
        ...dimensions,
        ticks: getBpmTimelineHorizontalTicks(),
        color: guideColor
      });
    }
  });
  const offsetX = 16;
  const usableWidth = w - offsetX;
  const layer = svgUtils.createElement('g');
  timelineLayer = layer;
  timelineMarkers = [];
  timelinePlayhead = null;
  timelineSvg.replaceChildren(layer);
  if (state.showGuides) {
    const middleY = (h / 2) + 0.5;
    layer.appendChild(createTimelineLine(0, middleY, w, middleY, guideColor));
    if (isBright) {
      const boundary = bpmTimelineRulers?.getVisible()
        ? [[w, 0, w, h], [w, h, 0, h]]
        : [[0, 0, w, 0], [w, 0, w, h], [w, h, 0, h], [0, h, 0, 0]];
      boundary.forEach(([x1, y1, x2, y2]) => {
        layer.appendChild(createTimelineLine(x1, y1, x2, y2, guideColor, false));
      });
    }
  }

  if (state.showPlayhead) {
    timelinePlayhead = createTimelineLine(offsetX, 0, offsetX, h, highlightColor);
    layer.appendChild(timelinePlayhead);
  }

  const addMarker = (kind, ms, x, color, title, highlightCircle = true) => {
    const isBeat = kind === 'beat';
    const line = createTimelineLine(x, isBeat ? 0 : h / 2, x, isBeat ? h / 2 : h, color);
    const circle = createTimelineCircle(x, isBeat ? 16 : h - 16, 8, color, title);
    layer.append(line, circle);
    timelineMarkers.push({ kind, ms, line, circle, color, highlightCircle, lineLit: false, circleLit: false });
  };

  if (state.viewMode === 'single') {
    addMarker('beat', 0, offsetX, beatColor, 'Beat 1');

    const bpm = state.bpm;

    noteData.values.forEach((note, i) => {
      if (!state.rows.has(i)) return;

      ['dotted', 'base', 'triplet'].forEach(type => {
        if (!state.modes[type]) return;

        const multiplier = type === 'dotted' ? 1.5 : type === 'triplet' ? 2 / 3 : 1;
        const noteMs = (60000 / (bpm / Math.pow(2, 5 - i))) * multiplier;
        const delayX = offsetX + (noteMs / 60000) * usableWidth;
        addMarker('delay', noteMs, delayX, delayColor,
          `${note}${type === 'base' ? '' : ` ${type}`} = ${noteMs.toFixed(3)} MS`
        );
        
      });
    });
  }

  else if (state.viewMode === 'all') {
    const bpm = state.bpm;
    const beatInterval = 60000 / bpm;
    const numBeats = Math.ceil(state.bpm);

    for (let n = 0; n < numBeats; n++) {
      const beatTime = n * (60000 / state.bpm);
      const beatX = offsetX + (beatTime / 60000) * usableWidth;

      addMarker('beat', beatTime, beatX, beatColor,
        `Beat ${n + 1} | ${beatTime.toFixed(3)} ms`, 'both');

      if (state.selected) {
        const [iStr, type] = state.selected.split('-');
        const i = parseInt(iStr);
        const noteLabel = noteData.values[i];
        const multiplier = type === 'dotted' ? 1.5 : type === 'triplet' ? 2 / 3 : 1;
        const noteMs = (60000 / (bpm / Math.pow(2, 5 - i))) * multiplier;
        const delayMs = beatTime + noteMs;

        if (delayMs <= 60000) {
          const delayX = offsetX + (delayMs / 60000) * usableWidth;
          const nearestBeat = Math.round(delayMs / beatInterval);
          const delayCoincidesBeat = nearestBeat < numBeats
            && Math.abs(delayMs - nearestBeat * beatInterval) < VISUAL_MATCH_TOLERANCE_MS;
          addMarker('delay', delayMs, delayX, delayColor,
            `${noteLabel} ${type} | ${delayMs.toFixed(3)} ms`, delayCoincidesBeat);
        }
      }
    }
  }

  updateTimelineAnimation(highlightColor);
}

function updateTimelineAnimation(highlightColor) {
  const playheadMs = getTimelinePlayheadMs();
  if (timelinePlayhead) {
    const x = 16 + Math.max(0, Math.min(60000, playheadMs)) / 60000 * (BPM_TIMELINE_WIDTH - 16);
    timelinePlayhead.setAttribute('x1', x);
    timelinePlayhead.setAttribute('x2', x);
  }
  for (const marker of timelineMarkers) {
    const currentMs = marker.kind === 'beat' ? currentBeatMs : currentDelayMs;
    const lit = currentMs !== null && Math.abs(currentMs - marker.ms) < VISUAL_MATCH_TOLERANCE_MS;
    const circleLit = lit && Boolean(marker.highlightCircle) && (marker.highlightCircle !== 'both'
      || (currentDelayMs !== null && Math.abs(currentDelayMs - marker.ms) < VISUAL_MATCH_TOLERANCE_MS));
    if (lit !== marker.lineLit) {
      marker.line.setAttribute('stroke', lit ? highlightColor : marker.color);
      marker.lineLit = lit;
    }
    if (circleLit !== marker.circleLit) {
      marker.circle.setAttribute('fill', circleLit ? highlightColor : marker.color);
      marker.circleLit = circleLit;
    }
  }
  if (state.isPlaying) timelineFollow?.followRatio(playheadMs / 60000);
}

function createSvgElement(name) {
  return svgUtils.createElement(name);
}

function getBpmTimelineHorizontalTicks() {
  return Array.from({ length: 6 }, (_, index) => {
    const seconds = (index + 1) * 10;
    return { position: (seconds / 60) * BPM_TIMELINE_WIDTH, label: `${seconds}s` };
  });
}

function createTimelineLine(x1, y1, x2, y2, color, snap = true) {
  return svgUtils.createLine({
    x1,
    y1,
    x2,
    y2,
    stroke: color.trim(),
    strokeWidth: 1,
    crisp: true,
    snap
  });
}

function createTimelineCircle(cx, cy, r, color, titleText = '') {
  return svgUtils.createCircle({
    cx,
    cy,
    r,
    fill: color.trim(),
    title: titleText
  });
}

function getTimelineHeight() {
  return timelineUtils.getHeight(timelineSvg, BPM_MIN_TIMELINE_HEIGHT);
}

function syncTimelineViewport(height) {
  timelineUtils.syncViewBox(timelineSvg, BPM_TIMELINE_WIDTH, height);
}

function setupTimelineResizeHandling() {
  if (disconnectTimelineResize) {
    disconnectTimelineResize();
  }

  disconnectTimelineResize = timelineUtils.observeResize({
    svg: timelineSvg,
    container: timelineContainer,
    onResize: drawCanvas
  });
}

function setupTimelineFollow() {
  timelineFollow?.destroy();
  timelineFollow = timelineUtils.createFollowController({
    scrollElement: timelineScroll,
    onEnabledChange: (enabled) => {
      state.followTimeline = enabled;
      updateFollowButton();
      saveState();
    }
  });
  timelineFollow.setEnabled(state.followTimeline);
}

// EVENT LISTENERS

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupToolMenuPanel);
} else {
  setupToolMenuPanel();
}

for (let key in columnButtons) {
  columnButtons[key]?.addEventListener('click', () => {
    state.columns[key] = !state.columns[key];
    // toggling a column may require creating/removing cells
    needsFullRebuild = true;
    calculateValues();
  });
}

columnPresetSelect?.addEventListener('change', () => {
  state.columns = createColumnPresetColumns(columnPresetSelect.value);
  needsFullRebuild = true;
  calculateValues();
});

// remove redundant real-time handlers; 'change' handler below will take care of updates


baseModeButton.addEventListener('click', () => {
  state.modes.base = !state.modes.base;
  needsFullRebuild = true;
  calculateValues();
});
dottedModeButton.addEventListener('click', () => {
  state.modes.dotted = !state.modes.dotted;
  needsFullRebuild = true;
  calculateValues();
});
tripletModeButton.addEventListener('click', () => {
  state.modes.triplet = !state.modes.triplet;
  needsFullRebuild = true;
  calculateValues();
});

// schedule calculations to avoid repeated work on rapid events
let calcScheduled = false;
function scheduleCalculation() {
  if (state.isPlaying) schedulePlaybackEvents();
  if (!calcScheduled) {
    calcScheduled = true;
    requestAnimationFrame(() => {
      calcScheduled = false;
      calculateValues();
    });
  }
}

bpmInput.addEventListener("input", () => {
  enforceThreeDecimals(bpmInput);
  const val = readPositiveInput(bpmInput, false);
  if (val === null) return;
  state.bpm = Math.max(minBPM, Math.min(maxBPM, val));
  scheduleCalculation();
});
// ensure value always three decimals
bpmInput.addEventListener("change", () => {
  const val = readPositiveInput(bpmInput, true);
  if (val === null) return;
  state.bpm = Math.max(minBPM, Math.min(maxBPM, val));
  scheduleCalculation();
});

bpmSlider.addEventListener("input", () => {
  let val = parseFloat(bpmSlider.value);
  if (isFinite(val)) {
    // store exactly three-decimal value to avoid float artifact drift
    val = parseFloat(val.toFixed(3));
    state.bpm = val;
  }
  scheduleCalculation();
});
// ensure slider snap to 3 decimals when interaction finishes
bpmSlider.addEventListener("change", () => {
  state.bpm = parseFloat(bpmSlider.value);
  bpmInput.value = state.bpm.toFixed(3);
  scheduleCalculation();
});

// allow editing SPB/BPS to update global BPM
spbField.addEventListener('input', () => {
  enforceThreeDecimals(spbField);
  readPositiveInput(spbField, false);
});
spbField.addEventListener('change', () => {
  const spb = readPositiveInput(spbField, true);
  if (spb === null) return;
  const newBpm = 60 / spb;
  state.bpm = Math.max(minBPM, Math.min(maxBPM, newBpm));
  // keep the field rounded after we schedule an update
  spbField.value = spb.toFixed(3);
  scheduleCalculation();
});

bpsField.addEventListener('input', () => {
  enforceThreeDecimals(bpsField);
  readPositiveInput(bpsField, false);
});

bpsField.addEventListener('change', () => {
  const bps = readPositiveInput(bpsField, true);
  if (bps === null) return;
  const newBpm = bps * 60;
  state.bpm = Math.max(minBPM, Math.min(maxBPM, newBpm));
  bpsField.value = bps.toFixed(3);
  scheduleCalculation();
});

halfButton.addEventListener('click', () => {
  const newBPM = Math.max(minBPM, state.bpm / 2);
  state.bpm = newBPM;
  calculateValues();
});

doubleButton.addEventListener('click', () => {
  const newBPM = Math.min(maxBPM, state.bpm * 2);
  state.bpm = newBPM;
  calculateValues();
});

viewModeSelect.addEventListener('change', function () {
  state.viewMode = this.value;
  calculateValues();
});

sortButton?.addEventListener('click', () => {
  state.sort = state.sort === 'asc' ? 'desc' : 'asc';
  calculateValues();
});

copyButton.addEventListener("click", () => {
  const data = panelText.value.trim();
  if (data.length > 0) navigator.clipboard.writeText(data);
});

toolCopyButton?.addEventListener('click', () => {
  const data = getVisibleValuesText().trim();
  if (data.length > 0) navigator.clipboard.writeText(data);
});

selectNoneButton.addEventListener('click', () => {
  setSelectedNote(null);
});

resetButton.addEventListener('click', () => {
  stopPlayback();
  timelineStartTime = 0;
  state = createDefaultState();
  timelineFollow?.setEnabled(state.followTimeline);
  timelineFollow?.reset();

  if (volumeSlider) {
    volumeSlider.value = String(state.soundVolume);
  }
  if (beatSoundSelect) {
    beatSoundSelect.value = state.beatSound;
  }
  if (toneTypeSelect) {
    toneTypeSelect.value = state.toneType;
  }

  resultTable.innerHTML = '';

  calculateValues();
  updateMasterOutputMute();
  updateSoundButton();
  updateLoopButton();
  updatePlayheadButton();
  updateGuidesButton();
  updateFollowButton();
  localStorage.removeItem('meters.bpm_calculator.meter');
  localStorage.removeItem('meters.bpm_calculator.speed');
  localStorage.removeItem('meters.bpm_calculator.rate');
  const meterSelect = document.getElementById('meters-meter');
  const speedInput = document.getElementById('meters-speed');
  const rateSelect = document.getElementById('meters-rate');
  if (meterSelect) meterSelect.value = 'spectroscope';
  if (speedInput) speedInput.value = '1';
  if (rateSelect) rateSelect.value = 'standard';
});


// HOLD

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

  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activateFn();
  });
}

let increaseInterval, decreaseInterval, volumeIncreaseInterval, volumeDecreaseInterval;

function startIncrease() { adjustBPM(1); increaseInterval = setInterval(() => adjustBPM(1), 100); }
function stopIncrease() { clearInterval(increaseInterval); }
function startDecrease() { adjustBPM(-1); decreaseInterval = setInterval(() => adjustBPM(-1), 100); }
function stopDecrease() { clearInterval(decreaseInterval); }
function startVolumeIncrease() { adjustVolume(1); volumeIncreaseInterval = setInterval(() => adjustVolume(1), 100); }
function stopVolumeIncrease() { clearInterval(volumeIncreaseInterval); }
function startVolumeDecrease() { adjustVolume(-1); volumeDecreaseInterval = setInterval(() => adjustVolume(-1), 100); }
function stopVolumeDecrease() { clearInterval(volumeDecreaseInterval); }

function adjustBPM(delta) {
  const updated = state.bpm + delta;
  const clamped = Math.min(Math.max(updated, minBPM), maxBPM);
  const rounded = Math.round(clamped); // always whole number
  state.bpm = parseFloat(rounded.toFixed(3)); // always 3 decimals in field
  scheduleCalculation();
}

function adjustVolume(delta) {
  state.soundVolume = Math.min(Math.max(state.soundVolume + delta, 0), 100);
  if (volumeSlider) {
    volumeSlider.value = String(state.soundVolume);
  }
  updateActiveRowPreviewVolume();
  saveState();
}

handleHold(startIncrease, stopIncrease, () => adjustBPM(1), increaseButton);
handleHold(startDecrease, stopDecrease, () => adjustBPM(-1), decreaseButton);
handleHold(startVolumeIncrease, stopVolumeIncrease, () => adjustVolume(1), volumeIncreaseButton);
handleHold(startVolumeDecrease, stopVolumeDecrease, () => adjustVolume(-1), volumeDecreaseButton);

function getCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// AUDIO PLAYBACK

function touchMetersActivity(whenSec) {
  const fallbackNow = audioContext ? audioContext.currentTime : 0;
  const value = Number.isFinite(whenSec) ? whenSec : fallbackNow;
  metersLastActiveSec = Math.max(metersLastActiveSec, value);
}

function ensureMetersAnalyserNode() {
  if (!audioContext) return null;
  if (!metersAnalyserNode) {
    metersAnalyserNode = audioContext.createAnalyser();
    metersAnalyserNode.fftSize = 2048;
    metersAnalyserNode.connect(ensureMasterOutputGainNode());
  }
  return metersAnalyserNode;
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
    isActive: () => state.isPlaying || activeRowPreviews.size > 0 || ((audioContext.currentTime - metersLastActiveSec) < 0.20),
    isStopped: () => !state.isPlaying && activeRowPreviews.size === 0
  };
}

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  ensureMasterOutputGainNode();
  ensureMetersAnalyserNode();
  updateMetersSourceBridge();
}

function ensureMasterOutputGainNode() {
  if (!audioContext) return null;
  if (!masterOutputGainNode) {
    masterOutputGainNode = audioContext.createGain();
    masterOutputGainNode.connect(audioContext.destination);
  }
  updateMasterOutputMute();
  updateMetersSourceBridge();
  return masterOutputGainNode;
}

function updateMasterOutputMute() {
  if (!audioContext || !masterOutputGainNode) return;
  const now = audioContext.currentTime;
  const target = state.isSoundOn && localStorage.getItem('global.sound') !== 'false' ? 1 : 0;
  masterOutputGainNode.gain.cancelScheduledValues(now);
  masterOutputGainNode.gain.setValueAtTime(target, now);
}

window.addEventListener('pekosoft:global-sound-change', updateMasterOutputMute);

function playClick(when, durationSec) {
  if (!audioContext) return;
  const destinationNode = ensureMetersAnalyserNode();
  if (!destinationNode) return;
  const now = audioContext.currentTime;
  const startTime = Math.max(when ?? now, now + 0.001);
  const dur = 0.050; // Fixed 50ms duration for clean separation
  const event = window.playTransientSound?.({
    audioContext,
    destinationNode,
    tone: normalizeTone(state.beatSound),
    when: startTime,
    gain: getSoundGain(),
    pitchRatio: 1,
    durationSec: dur
  });
  touchMetersActivity(startTime);
  updateMetersSourceBridge();
  if (event?.stopNode) {
    scheduledAudioNodes.push({ oscillator: event.stopNode, gainNode: event.gainNode, startTime, stopTime: event.stopTime, kind: 'beat' });
  }
}

function playDelayClick(when, durationSec) {
  if (!audioContext) return;
  const destinationNode = ensureMetersAnalyserNode();
  if (!destinationNode) return;
  const now = audioContext.currentTime;
  const startTime = Math.max(when ?? now, now + 0.001);
  const dur = durationSec ?? 0.012;
  const event = window.playTransientSound?.({
    audioContext,
    destinationNode,
    tone: normalizeTone(state.beatSound),
    when: startTime,
    gain: getSoundGain() * DELAY_GAIN_RATIO,
    pitchRatio: DELAY_PITCH_RATIO,
    durationSec: dur
  });
  touchMetersActivity(startTime);
  updateMetersSourceBridge();
  if (event?.stopNode) {
    scheduledAudioNodes.push({ oscillator: event.stopNode, gainNode: event.gainNode, startTime, stopTime: event.stopTime, kind: 'delay' });
  }
}

function playNote(durationMs) {
  initAudioContext();
  if (!audioContext) return;
  const destinationNode = ensureMetersAnalyserNode();
  if (!destinationNode) return;
  
  const now = audioContext.currentTime;
  const startTime = now + 0.001;
  const durationSec = durationMs / 1000;
  const event = window.playTransientSound?.({
    audioContext,
    destinationNode,
    tone: normalizeTone(state.beatSound),
    when: startTime,
    gain: getSoundGain(),
    pitchRatio: 1,
    durationSec
  });
  touchMetersActivity(startTime);
  updateMetersSourceBridge();
  if (event?.stopNode) {
    scheduledAudioNodes.push({ oscillator: event.stopNode, gainNode: event.gainNode, stopTime: event.stopTime });
  }
}

function stopRowPreview(rowId) {
  const active = activeRowPreviews.get(rowId);
  if (!active) return;

  clearTimeout(active.timeoutId);
  if (active.oscillator) {
    try {
      active.oscillator.stop(audioContext?.currentTime ?? 0);
    } catch (e) {}
  }

  activeRowPreviews.delete(rowId);
  updateMetersSourceBridge();
  const button = resultTable.querySelector(`button.play-toggle-button[data-row-id="${rowId}"]`);
  if (button) {
    button.classList.remove('button-on');
    button.title = 'Play note';
  }
}

function stopAllRowPreviews() {
  const activeRows = [...activeRowPreviews.keys()];
  activeRows.forEach(stopRowPreview);
}

function startRowPreview(rowId, durationMs) {
  initAudioContext();
  if (!audioContext || !isFinite(durationMs) || durationMs <= 0) return;

  stopRowPreview(rowId);

  let oscillator = null;
  let gainNode = null;

  const destinationNode = ensureMetersAnalyserNode();
  if (!destinationNode) return;
  const now = audioContext.currentTime;
  const startTime = now + 0.001;
  const durationSec = durationMs / 1000;
  const a4 = parseFloat(localStorage.getItem('global.a4_hz'));
  const baseFrequencyHz = Number.isFinite(a4) && a4 > 0 ? a4 : 440;
  const event = window.playTransientSound?.({
    audioContext,
    destinationNode,
    tone: normalizeToneType(state.toneType),
    when: startTime,
    gain: getSoundGain(),
    pitchRatio: 1,
    baseFrequencyHz,
    durationSec
  });
  if (event?.stopNode) {
    oscillator = event.stopNode;
    gainNode = event.gainNode;
  }

  const timeoutId = setTimeout(() => {
    stopRowPreview(rowId);
  }, durationMs + 25);

  activeRowPreviews.set(rowId, { oscillator, gainNode, timeoutId });
  touchMetersActivity(startTime);
  updateMetersSourceBridge();

  const button = resultTable.querySelector(`button.play-toggle-button[data-row-id="${rowId}"]`);
  if (button) {
    button.classList.add('button-on');
    button.title = 'Stop note';
  }

  if (oscillator && gainNode) {
    oscillator.addEventListener('ended', () => {
      if (activeRowPreviews.get(rowId)?.oscillator === oscillator) {
        stopRowPreview(rowId);
      }
    }, { once: true });
  }
}

function toggleRowPreview(rowId, durationMs) {
  if (activeRowPreviews.has(rowId)) {
    stopRowPreview(rowId);
  } else {
    startRowPreview(rowId, durationMs);
  }
}

function updateActiveRowPreviewVolume() {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const gain = Math.max(getSoundGain(), 0.0001);

  activeRowPreviews.forEach((active) => {
    const node = active?.gainNode;
    if (!node?.gain) return;
    try {
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(gain, now);
    } catch (e) {}
  });
}

function updateTimelineReadout(positionMs = 0, beatNumber = 0) {
  if (positionField) positionField.value = Number(positionMs).toFixed(3);
  if (beatField) beatField.value = String(Math.max(0, Math.floor(beatNumber)));
}

function getCurrentPlayheadMs() {
  if (state.isPlaying && audioContext) {
    if (timelineStartTime > 0) {
      const elapsedMs = Math.max(0, (audioContext.currentTime - timelineStartTime) * 1000);
      if (state.isLoopOn) {
        return ((elapsedMs % 60000) + 60000) % 60000;
      }
      return Math.max(0, Math.min(60000, elapsedMs));
    }
  }

  return pausedTimelineMs;
}

function getTimelinePlayheadMs() {
  if (state.viewMode !== 'all') return getCurrentPlayheadMs();
  const phase = state.isPlaying && audioContext
    ? Math.max(0, (audioContext.currentTime - playbackBeatOriginSec) * playbackTempo / 60)
    : pausedBeatPhase;
  return Math.min(60000, (phase % Math.ceil(state.bpm)) * 60000 / state.bpm);
}

function updatePlaybackReadout() {
  const position = getTimelinePlayheadMs();
  const beat = state.isPlaying || pausedTimelineMs > 0
    ? (state.viewMode === 'single' ? 1 : Math.floor(position * state.bpm / 60000) + 1)
    : 0;
  updateTimelineReadout(position, beat);
}

function getTimelineEvents() {
  const events = [];
  const bpm = state.bpm;
  const beatInterval = 60000 / bpm;
  const numBeats = Math.ceil(bpm);

  if (state.viewMode === 'single') {
    events.push({ timeMs: 0, kind: 'beat', beatNumber: 1 });
    noteData.values.forEach((note, i) => {
      if (!state.rows.has(i)) return;
      ['dotted', 'base', 'triplet'].forEach(type => {
        if (!state.modes[type]) return;
        const multiplier = getMultiplier(type);
        const delayMs = (60000 / (bpm / Math.pow(2, 5 - i))) * multiplier;
        if (delayMs <= 60000) {
          events.push({ timeMs: delayMs, kind: 'delay', beatNumber: 1 });
        }
      });
    });
  } else {
    // Always generate beat events, even if no delay is selected
    for (let n = 0; n < numBeats; n++) {
      const beatTime = n * beatInterval;
      events.push({ timeMs: beatTime, kind: 'beat', beatNumber: n + 1 });
      
      // Only generate delay events if a row is selected
      if (state.selected) {
        const [iStr, type] = state.selected.split('-');
        const i = parseInt(iStr, 10);
        const multiplier = getMultiplier(type);
        const noteMs = (60000 / (bpm / Math.pow(2, 5 - i))) * multiplier;
        const delayMs = beatTime + noteMs;
        if (delayMs <= 60000) {
          events.push({ timeMs: delayMs, kind: 'delay', beatNumber: n + 1 });
        }
      }
    }
  }

  events.sort((a, b) => a.timeMs - b.timeMs);
  return events;
}

function getSelectedRowMs() {
  // Parse selected row format: "index-type" (e.g., "5-base")
  const [indexStr, type] = state.selected.split('-');
  const i = parseInt(indexStr, 10);
  const multiplier = getMultiplier(type);
  const ms = (60000 / (state.bpm / Math.pow(2, 5 - i))) * multiplier;
  return ms;
}

function updateVisualMarkers() {
  if (!audioContext) return;
  
  const now = audioContext.currentTime;
  const coincideToleranceMs = VISUAL_MATCH_TOLERANCE_MS;
  if (lastVisualCheckSec === 0) {
    lastVisualCheckSec = now - 0.05;
  }
  let shouldRedraw = false;
  
  scheduledVisualEvents = scheduledVisualEvents.filter(event => {
    if (event.time > now + 0.2) {
      return true;
    }
    
    if (event.time > lastVisualCheckSec && event.time <= now + 0.002) {
      if (event.kind === 'beat') {
        currentBeatMs = event.ms;
        beatHighlightUntilSec = now + VISUAL_HIGHLIGHT_HOLD_SEC;
        if (currentDelayMs !== null && Math.abs(currentDelayMs - event.ms) > coincideToleranceMs) {
          currentDelayMs = null;
          delayHighlightUntilSec = 0;
        }
      } else {
        currentDelayMs = event.ms;
        delayHighlightUntilSec = now + VISUAL_HIGHLIGHT_HOLD_SEC;
        if (currentBeatMs !== null && Math.abs(currentBeatMs - event.ms) > coincideToleranceMs) {
          currentBeatMs = null;
          beatHighlightUntilSec = 0;
        }
      }
      shouldRedraw = true;
    }
    
    return event.time > now - 0.25;
  });

  if (currentBeatMs !== null && now >= beatHighlightUntilSec) {
    currentBeatMs = null;
    shouldRedraw = true;
  }
  if (currentDelayMs !== null && now >= delayHighlightUntilSec) {
    currentDelayMs = null;
    shouldRedraw = true;
  }

  if (state.isPlaying && (state.showPlayhead || state.followTimeline)) {
    shouldRedraw = true;
  }

  lastVisualCheckSec = now;
  updatePlaybackReadout();

  if (shouldRedraw) {
    drawCanvas();
  }
}

function cancelPlaybackEvents(kind, includeStarted = false) {
  const now = audioContext.currentTime;
  scheduledAudioNodes = scheduledAudioNodes.filter(event => {
    if (event.stopTime <= now) return false;
    if ((kind && event.kind !== kind) || (!includeStarted && event.startTime <= now)) return true;
    event.oscillator.stop(now);
    return false;
  });
  scheduledVisualEvents = scheduledVisualEvents.filter(event =>
    (kind && event.kind !== kind) || (!includeStarted && event.time <= now));
}

function schedulePlaybackEvents() {
  if (!state.isPlaying || !audioContext) return;
  const now = audioContext.currentTime;
  const elapsed = Math.max(0, now - timelineStartTime);
  const until = elapsed + 0.15;
  const beatKey = JSON.stringify([state.bpm, state.viewMode, state.isLoopOn]);
  const delayKey = JSON.stringify([beatKey, state.viewMode === 'all'
    ? state.selected : [[...state.rows], state.modes]]);

  if (playbackScheduleKeys.beat !== beatKey || playbackScheduleKeys.delay !== delayKey) {
    const beatChanged = playbackScheduleKeys.beat !== beatKey;
    if (playbackTempo !== state.bpm) {
      const phase = (now - playbackBeatOriginSec) * playbackTempo / 60;
      playbackBeatOriginSec = now - phase * 60 / state.bpm;
      playbackTempo = state.bpm;
    }
    cancelPlaybackEvents(beatChanged ? null : 'delay');
    if (beatChanged && playbackScheduleKeys.beat) playbackScheduledUntil.beat = elapsed + 0.000001;
    if (playbackScheduleKeys.delay) playbackScheduledUntil.delay = elapsed + 0.000001;
    playbackScheduleKeys = { beat: beatKey, delay: delayKey };
    playbackEvents = getTimelineEvents();
    currentDelayMs = null;
    delayHighlightUntilSec = 0;
  }

  scheduledAudioNodes = scheduledAudioNodes.filter(event => event.stopTime > now);
  scheduledVisualEvents = scheduledVisualEvents.filter(event => event.time >= now - 0.25);
  for (const kind of ['beat', 'delay']) {
    // Skip missed events after a stall instead of playing a catch-up burst.
    const from = Math.max(playbackScheduledUntil[kind], elapsed);
    if (state.viewMode === 'all') {
      scheduleBeatWindow(kind, from, until);
      playbackScheduledUntil[kind] = until;
      continue;
    }
    const firstCycle = Math.max(0, Math.floor(from / 60) - 1);
    const lastCycle = state.isLoopOn ? Math.floor(until / 60) : 0;
    for (let cycle = firstCycle; cycle <= lastCycle; cycle++) {
      for (const event of playbackEvents) {
        if (event.kind !== kind) continue;
        const position = cycle * 60 + event.timeMs / 1000;
        if (position < from || position >= until) continue;
        const time = timelineStartTime + position;
        if (kind === 'beat') playClick(time, FIXED_CLICK_DURATION_SEC);
        else playDelayClick(time, FIXED_CLICK_DURATION_SEC);
        scheduledVisualEvents.push({
          time, kind, ms: event.timeMs, beatNumber: event.beatNumber
        });
      }
    }
    playbackScheduledUntil[kind] = until;
  }
  scheduledVisualEvents.sort((a, b) => a.time - b.time);
}

function scheduleBeatWindow(kind, from, until) {
  if (kind === 'delay' && !state.selected) return;
  const interval = 60 / state.bpm;
  const offset = kind === 'delay' ? getSelectedRowMs() / 1000 / interval : 0;
  const fromTime = timelineStartTime + from;
  const untilTime = Math.min(timelineStartTime + until,
    state.isLoopOn ? Infinity : timelineStartTime + 60 + (kind === 'delay' ? 0.000001 : 0));
  const firstBeat = Math.max(0, Math.ceil((fromTime - playbackBeatOriginSec) / interval - offset - 1e-9));
  const beatsPerMinute = Math.ceil(state.bpm);
  for (let beat = firstBeat; ; beat++) {
    const time = playbackBeatOriginSec + (beat + offset) * interval;
    if (time >= untilTime) break;
    if (time < fromTime) continue;
    const beatInMinute = beat % beatsPerMinute;
    const ms = (beatInMinute + offset) * interval * 1000;
    if (kind === 'delay' && ms > 60000 + 0.000001) continue;
    if (kind === 'beat') playClick(time, FIXED_CLICK_DURATION_SEC);
    else playDelayClick(time, FIXED_CLICK_DURATION_SEC);
    scheduledVisualEvents.push({ time, kind, ms, beatNumber: beatInMinute + 1 });
  }
}

function runPlaybackScheduler() {
  if (!state.isPlaying) return;
  if (!state.isLoopOn && audioContext.currentTime >= timelineStartTime + 60.06) {
    stopPlayback();
    return;
  }
  schedulePlaybackEvents();
  playbackTimer = setTimeout(runPlaybackScheduler, 25);
}

function animatePlayback() {
  if (!state.isPlaying) return;
  updateVisualMarkers();
  playbackAnimationFrame = requestAnimationFrame(animatePlayback);
}

function startPlayback() {
  if (state.isPlaying) return;
  initAudioContext();
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {
      // Resume is best-effort; the next gesture can retry.
    });
  }

  timelineStartTime = audioContext.currentTime + 0.01 - pausedTimelineMs / 1000;
  playbackTempo = state.bpm;
  playbackBeatOriginSec = audioContext.currentTime + 0.01 - pausedBeatPhase * 60 / playbackTempo;
  playbackScheduledUntil = { beat: pausedTimelineMs / 1000, delay: pausedTimelineMs / 1000 };
  playbackScheduleKeys = {};
  state.isPlaying = true;
  togglePlayButton.classList.add('button-on');
  currentBeatMs = null;
  currentDelayMs = null;
  lastVisualCheckSec = audioContext.currentTime;
  beatHighlightUntilSec = 0;
  delayHighlightUntilSec = 0;
  updateMetersSourceBridge();
  runPlaybackScheduler();
  animatePlayback();
}

function pausePlayback() {
  if (!state.isPlaying) return;
  pausedTimelineMs = getCurrentPlayheadMs();
  pausedBeatPhase = Math.max(0, (audioContext.currentTime - playbackBeatOriginSec) * playbackTempo / 60);
  state.isPlaying = false;
  togglePlayButton.classList.remove('button-on');
  clearTimeout(playbackTimer);
  playbackTimer = null;
  cancelAnimationFrame(playbackAnimationFrame);
  playbackAnimationFrame = null;
  cancelPlaybackEvents(null, true);
  updateMetersSourceBridge();
  updatePlaybackReadout();
  drawCanvas();
}

function stopPlayback() {
  
    const now = audioContext?.currentTime ?? 0;
    scheduledAudioNodes.forEach(({ oscillator, stopTime }) => {
      if (stopTime > now) {
        try {
          oscillator.stop(now);
        } catch (e) {}
      }
    });
    scheduledAudioNodes = [];
    scheduledVisualEvents = [];
  
  state.isPlaying = false;
  togglePlayButton.classList.remove('button-on');
  clearTimeout(playbackTimer);
  playbackTimer = null;
  cancelAnimationFrame(playbackAnimationFrame);
  playbackAnimationFrame = null;
  timelineStartTime = 0;
  pausedTimelineMs = 0;
  pausedBeatPhase = 0;
  lastVisualCheckSec = 0;
  beatHighlightUntilSec = 0;
  delayHighlightUntilSec = 0;
  currentBeatMs = null;
  currentDelayMs = null;
  playbackEvents = [];

  stopAllRowPreviews();
  timelineFollow?.reset();
  updateTimelineReadout(0, 0);
  updateMetersSourceBridge();
  drawCanvas();
}

function stopAllAudioNow() {
  const now = audioContext?.currentTime ?? 0;
  scheduledAudioNodes.forEach(({ oscillator }) => {
    try {
      oscillator.stop(now);
    } catch (e) {}
  });
  scheduledAudioNodes = [];

  activeRowPreviews.forEach((active) => {
    if (active.oscillator) {
      try {
        active.oscillator.stop(now);
      } catch (e) {}
      active.oscillator = null;
      active.gainNode = null;
    }
  });
}

function updateSoundButton() {
  if (toggleSoundButton) {
    toggleSoundButton.classList.toggle('button-on', state.isSoundOn);
  }
}

function updateLoopButton() {
  if (toggleLoopButton) {
    toggleLoopButton.classList.toggle('button-on', state.isLoopOn);
  }
}

function updatePlayheadButton() {
  if (togglePlayheadButton) {
    togglePlayheadButton.classList.toggle('button-on', state.showPlayhead);
  }
}

function updateGuidesButton() {
  if (guidesButton) {
    guidesButton.classList.toggle('button-on', state.showGuides);
  }
}

function updateFollowButton() {
  if (followButton) {
    followButton.classList.toggle('button-on', state.followTimeline);
    followButton.setAttribute('aria-pressed', state.followTimeline ? 'true' : 'false');
  }
}

// Event listeners for play and sound buttons
if (togglePlayButton) {
  togglePlayButton.addEventListener('click', () => {
    if (state.isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  });
}

if (stopButton) {
  stopButton.addEventListener('click', () => {
    stopPlayback();
  });
}

if (toggleSoundButton) {
  toggleSoundButton.addEventListener('click', () => {
    state.isSoundOn = !state.isSoundOn;
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {
        // Resume is best-effort; the next gesture can retry.
      });
    }
    // SOUND is master output mute/unmute; keep playback timing/state running.
    updateMasterOutputMute();
    updateSoundButton();
    saveState();
  });
}

if (toggleLoopButton) {
  toggleLoopButton.addEventListener('click', () => {
    state.isLoopOn = !state.isLoopOn;
    updateLoopButton();
    saveState();
  });
}

if (togglePlayheadButton) {
  togglePlayheadButton.addEventListener('click', () => {
    state.showPlayhead = !state.showPlayhead;
    updatePlayheadButton();
    saveState();
    drawCanvas();
  });
}

if (guidesButton) {
  guidesButton.addEventListener('click', () => {
    state.showGuides = !state.showGuides;
    updateGuidesButton();
    saveState();
    drawCanvas();
  });
}

window.addEventListener('pekosoft:timeline-bright-change', () => {
  drawCanvas();
});

if (followButton) {
  followButton.addEventListener('click', () => {
    state.followTimeline = !state.followTimeline;
    timelineFollow?.setEnabled(state.followTimeline);
    if (state.followTimeline) {
      timelineFollow?.followRatio(getCurrentPlayheadMs() / 60000);
    }
    updateFollowButton();
    saveState();
  });
}

// INITIAL LOAD

loadState();
document.addEventListener('DOMContentLoaded', initNoteControls);
state.beatSound = normalizeTone(state.beatSound);
state.toneType = normalizeToneType(state.toneType);
setupTimelineFollow();
calculateValues();
updateSoundButton();
updateLoopButton();
updatePlayheadButton();
updateGuidesButton();
updateFollowButton();
updateTimelineReadout(0, 0);
setupTimelineResizeHandling();
drawCanvas();

if (volumeSlider) {
  volumeSlider.value = String(state.soundVolume);
  volumeSlider.addEventListener('input', () => {
    state.soundVolume = Math.min(Math.max(parseInt(volumeSlider.value, 10) || 0, 0), 100);
    updateActiveRowPreviewVolume();
    saveState();
  });
}

if (beatSoundSelect) {
  beatSoundSelect.value = state.beatSound;
  beatSoundSelect.addEventListener('change', () => {
    state.beatSound = normalizeTone(beatSoundSelect.value);
    saveState();
  });
}

if (toneTypeSelect) {
  toneTypeSelect.value = state.toneType;
  toneTypeSelect.addEventListener('change', () => {
    state.toneType = normalizeToneType(toneTypeSelect.value);
    saveState();
  });
}

window.addEventListener('pekosoft:global-defaults-change', (event) => {
  const defaults = event.detail;
  if (!defaults || !['bpm', 'a4_hz', 'speed_of_sound', 'all'].includes(defaults.changed)) return;
  if (defaults.changed === 'bpm' || defaults.changed === 'all') state.bpm = defaults.bpm;
  scheduleCalculation();
});

// no extra update needed here – calculateValues() already applies backgrounds on its own

// Event delegation for dynamically-generated row close buttons
resultTable.addEventListener('click', (e) => {
  const closeButton = e.target.closest('button[id^="row-close-"]');
  if (closeButton) {
    const rowIdMatch = closeButton.id.match(/row-close-(\d+)/);
    if (rowIdMatch) {
      closeRow(parseInt(rowIdMatch[1], 10));
    }
  }
});

// END OF FILE
