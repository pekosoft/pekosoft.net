// Pekosoft Audio Calculator
// pekosoft.net/js/audio_calculator.js

window.addEventListener('DOMContentLoaded', () => {
  const config = {
    bitDepths: [8, 16, 20, 24, 32, 64],
    sampleRates: [8000, 11025, 16000, 22050, 32000, 44100, 48000, 88200, 96000, 176400, 192000, 352800, 384000, 705600, 768000]
  };

  const refs = {
    grid: document.getElementById('quality-grid'),
    duration: document.getElementById('duration-field'),
    bitDepth: document.getElementById('bit-depth-field'),
    amplitudeLevels: document.getElementById('amplitude-levels-field'),
    sampleRate: document.getElementById('sample-rate-field'),
    preset: document.getElementById('preset-field'),
    channels: document.getElementById('channels-field'),
    fileSize: document.getElementById('file-size-field'),
    bitRate: document.getElementById('bit-rate-field'),
    totalSamples: document.getElementById('total-samples-field'),
    dynamicRange: document.getElementById('dynamic-range-field'),
    frequencyRange: document.getElementById('frequency-range-field'),
    panel: document.getElementById('audio-calculator-panel'),
    copyButton: document.getElementById('copy-button'),
    resetButton: document.getElementById('reset-button'),
    valuesButton: document.getElementById('toggle-values-button'),
    panelModeButtons: document.querySelectorAll('.info-display-button')
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const FALLBACK_VIEWPORT_WIDTH = 800;
  const FALLBACK_VIEWPORT_HEIGHT = 300;
  const STORAGE_KEY = 'audio_calculator.state';
  const DEFAULT_STATE = {
    duration: 60,
    bitDepth: 24,
    sampleRate: 96000,
    channels: 2,
    preset: 'custom',
    valuesVisible: true
  };
  let geometry = null;
  let panelView = 'selected';
  let valuesVisible = DEFAULT_STATE.valuesVisible;
  let valuesLayer = null;
  let resizeObserver = null;
  const presetValueByPair = {
    '8|22050|1': '8|22050|1',
    '16|32000|2': '16|32000|2',
    '16|44100|2': '16|44100|2',
    '16|48000|2': '16|48000|2',
    '24|96000|6': '24|96000|6',
    '24|192000|8': '24|192000|8',
    '32|192000|2': '32|192000|2',
    '64|768000|2': '64|768000|2'
  };

  function createSvgNode(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });
    return node;
  }

  function getCurrentValues() {
    return {
      duration: Math.max(0, parseFloat(refs.duration.value) || 0),
      bitDepth: parseInt(refs.bitDepth.value, 10),
      sampleRate: parseInt(refs.sampleRate.value, 10),
      channels: parseInt(refs.channels.value, 10)
    };
  }

  function clampToOptions(value, options, fallback) {
    return options.includes(value) ? value : fallback;
  }

  function readStoredState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      return {
        duration: Math.max(0, parseFloat(parsed.duration) || DEFAULT_STATE.duration),
        bitDepth: clampToOptions(parseInt(parsed.bitDepth, 10), config.bitDepths, DEFAULT_STATE.bitDepth),
        sampleRate: clampToOptions(parseInt(parsed.sampleRate, 10), config.sampleRates, DEFAULT_STATE.sampleRate),
        channels: Math.min(10, Math.max(1, parseInt(parsed.channels, 10) || DEFAULT_STATE.channels)),
        preset: typeof parsed.preset === 'string' ? parsed.preset : DEFAULT_STATE.preset,
        valuesVisible: typeof parsed.valuesVisible === 'boolean' ? parsed.valuesVisible : DEFAULT_STATE.valuesVisible
      };
    } catch {
      return null;
    }
  }

  function applyState(state) {
    refs.duration.value = String(state.duration);
    refs.bitDepth.value = String(state.bitDepth);
    refs.sampleRate.value = String(state.sampleRate);
    refs.channels.value = String(state.channels);
    if (refs.preset) {
      refs.preset.value = state.preset || 'custom';
    }
    valuesVisible = state.valuesVisible !== false;
    syncValuesButton();
    applyValuesVisibility();
  }

  function saveState() {
    try {
      const state = {
        duration: Math.max(0, parseFloat(refs.duration.value) || DEFAULT_STATE.duration),
        bitDepth: parseInt(refs.bitDepth.value, 10),
        sampleRate: parseInt(refs.sampleRate.value, 10),
        channels: parseInt(refs.channels.value, 10),
        preset: refs.preset ? refs.preset.value : 'custom',
        valuesVisible
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable.
    }
  }

  function resetState() {
    applyState(DEFAULT_STATE);
    updateOutputFields();
  }

  function computeMetrics(values) {
    const totalSamples = Math.round(values.duration * values.sampleRate * values.channels);
    const bytes = (values.duration * values.sampleRate * values.bitDepth * values.channels) / 8;
    const sizeMb = bytes / (1024 * 1024);
    const bitRate = (values.sampleRate * values.bitDepth * values.channels) / 1000;
    const dynamicRange = 20 * Math.log10(Math.pow(2, values.bitDepth));
    const maxFrequency = values.sampleRate / 2;
    const amplitudeLevels = (1n << BigInt(values.bitDepth)).toString();

    return {
      totalSamples,
      sizeMb,
      bitRate,
      dynamicRange,
      maxFrequency,
      amplitudeLevels
    };
  }

  function formatSampleRate(rate) {
    return (rate / 1000).toFixed(3).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
  }

  function formatFrequency(freq) {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(3)} kHz`;
    }
    return `${freq.toFixed(3)} Hz`;
  }

  function updateOutputFields() {
    const values = getCurrentValues();
    const metrics = computeMetrics(values);

    refs.fileSize.value = metrics.sizeMb.toFixed(3);
    refs.bitRate.value = Math.round(metrics.bitRate).toString();
    refs.totalSamples.value = metrics.totalSamples.toString();
    refs.dynamicRange.value = metrics.dynamicRange.toFixed(3);
    refs.amplitudeLevels.value = metrics.amplitudeLevels;
    refs.frequencyRange.value = metrics.maxFrequency >= 1000
      ? (metrics.maxFrequency / 1000).toFixed(3)
      : metrics.maxFrequency.toFixed(3);

    syncPresetSelection(values);

    updateSelectedCell();
    updatePanel();
    saveState();
  }

  function syncPresetSelection(values) {
    if (!refs.preset) return;

    const pairKey = `${values.bitDepth}|${values.sampleRate}|${values.channels}`;
    refs.preset.value = presetValueByPair[pairKey] || 'custom';
  }

  function applyPreset() {
    if (!refs.preset) return;
    if (refs.preset.value === 'custom') return;

    const [bitDepth, sampleRate, channels] = refs.preset.value.split('|');
    refs.bitDepth.value = bitDepth;
    refs.sampleRate.value = sampleRate;
    refs.channels.value = channels;
    updateOutputFields();
  }

  function getSelectedSummary(values, metrics) {
    return [
      `Duration: ${values.duration.toFixed(3)} s`,
      `Bit depth: ${values.bitDepth} bit`,
      `Amplitude levels: ${metrics.amplitudeLevels}`,
      `Sample rate: ${formatSampleRate(values.sampleRate)} kHz`,
      `Channels: ${values.channels}`,
      `File size: ${metrics.sizeMb.toFixed(3)} MB`,
      `Bit rate: ${Math.round(metrics.bitRate)} kb/s`,
      `Total samples: ${metrics.totalSamples}`,
      `Dynamic range: ${metrics.dynamicRange.toFixed(3)} dB`,
      `Frequency range: ${formatFrequency(metrics.maxFrequency)}`
    ].join('\n');
  }

  function getAllSummary(values) {
    const lines = [];
    lines.push(`Duration: ${values.duration.toFixed(3)} s | Channels: ${values.channels}`);
    lines.push('');

    config.bitDepths.forEach((depth) => {
      config.sampleRates.forEach((rate) => {
        const metrics = computeMetrics({
          duration: values.duration,
          bitDepth: depth,
          sampleRate: rate,
          channels: values.channels
        });

        lines.push(
          `${depth} bit @ ${formatSampleRate(rate)} kHz: ${metrics.sizeMb.toFixed(3)} MB | ${Math.round(metrics.bitRate)} kb/s | ${metrics.dynamicRange.toFixed(1)} dB | ${formatFrequency(metrics.maxFrequency)}`
        );
      });
    });

    return lines.join('\n');
  }

  function updatePanel() {
    const values = getCurrentValues();
    const metrics = computeMetrics(values);

    if (panelView === 'all') {
      refs.panel.value = getAllSummary(values);
      return;
    }

    refs.panel.value = getSelectedSummary(values, metrics);
  }

  function syncPanelModeButtons() {
    refs.panelModeButtons.forEach((button) => {
      const isCurrentView = button.dataset.panelView === panelView;
      button.classList.toggle('button-on', isCurrentView);
      button.setAttribute('aria-pressed', isCurrentView ? 'true' : 'false');
    });
  }

  function setPanelView(view) {
    if (view !== 'selected' && view !== 'all') return;
    panelView = view;
    syncPanelModeButtons();
    updatePanel();
  }

  function syncValuesButton() {
    if (!refs.valuesButton) return;
    refs.valuesButton.classList.toggle('button-on', valuesVisible);
    refs.valuesButton.setAttribute('aria-pressed', String(valuesVisible));
  }

  function applyValuesVisibility() {
    valuesLayer?.setAttribute('display', valuesVisible ? 'inline' : 'none');
  }

  function setCellRect(rect, sampleRateIndex, bitDepthIndex) {
    if (!geometry || !rect) return;

    const x = geometry.marginX + (sampleRateIndex * geometry.cellWidth);
    const y = geometry.marginY + ((config.bitDepths.length - bitDepthIndex - 1) * geometry.cellHeight);

    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(geometry.cellWidth));
    rect.setAttribute('height', String(geometry.cellHeight));
  }

  function getGridCellFromPoint(clientX, clientY) {
    if (!geometry) return null;

    const rect = refs.grid.getBoundingClientRect();
    const scaledX = ((clientX - rect.left) / rect.width) * geometry.viewportWidth;
    const scaledY = ((clientY - rect.top) / rect.height) * geometry.viewportHeight;

    const xRatio = (scaledX - geometry.marginX) / geometry.innerWidth;
    const yRatio = (geometry.viewportHeight - scaledY - geometry.marginY) / geometry.innerHeight;

    const sampleRateIndex = Math.floor(xRatio * config.sampleRates.length);
    const bitDepthIndex = Math.floor(yRatio * config.bitDepths.length);

    if (sampleRateIndex < 0 || sampleRateIndex >= config.sampleRates.length) return null;
    if (bitDepthIndex < 0 || bitDepthIndex >= config.bitDepths.length) return null;

    return { sampleRateIndex, bitDepthIndex };
  }

  function updateHoverCell(clientX, clientY) {
    const hoverCell = document.getElementById('hover-cell');
    if (!hoverCell) return;

    const cell = getGridCellFromPoint(clientX, clientY);
    if (!cell) {
      hoverCell.setAttribute('visibility', 'hidden');
      return;
    }

    setCellRect(hoverCell, cell.sampleRateIndex, cell.bitDepthIndex);
    hoverCell.setAttribute('visibility', 'visible');
  }

  function clearHoverCell() {
    const hoverCell = document.getElementById('hover-cell');
    if (!hoverCell) return;
    hoverCell.setAttribute('visibility', 'hidden');
  }

  function setupGridResizeObserver() {
    if (typeof ResizeObserver === 'undefined') return;

    if (resizeObserver) {
      resizeObserver.disconnect();
    }

    const parent = refs.grid.parentElement;
    const toolContainer = document.getElementById('tool-container');
    resizeObserver = new ResizeObserver(() => {
      buildGrid();
    });

    if (parent) {
      resizeObserver.observe(parent);
    }

    if (toolContainer) {
      resizeObserver.observe(toolContainer);
    }
  }

  function buildGrid() {
    const viewportWidth = Math.max(320, Math.round(refs.grid.clientWidth || FALLBACK_VIEWPORT_WIDTH));
    const viewportHeight = Math.max(180, Math.round(refs.grid.clientHeight || FALLBACK_VIEWPORT_HEIGHT));
    const marginX = Math.min(96, Math.max(44, Math.round(viewportWidth * 0.07)));
    const marginY = Math.min(72, Math.max(34, Math.round(viewportHeight * 0.14)));
    const innerWidth = viewportWidth - (2 * marginX);
    const innerHeight = viewportHeight - (2 * marginY);
    const cellWidth = innerWidth / config.sampleRates.length;
    const cellHeight = innerHeight / config.bitDepths.length;

    refs.grid.setAttribute('viewBox', `0 0 ${viewportWidth} ${viewportHeight}`);
    refs.grid.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    refs.grid.innerHTML = '';
    valuesLayer = null;
    clearHoverCell();

    geometry = {
      viewportWidth,
      viewportHeight,
      cellWidth,
      cellHeight,
      marginX,
      marginY,
      innerWidth,
      innerHeight
    };

    for (let i = 0; i <= config.sampleRates.length; i += 1) {
      const x = marginX + (i * cellWidth);
      refs.grid.appendChild(createSvgNode('line', {
        class: 'grid-line',
        x1: x,
        y1: marginY,
        x2: x,
        y2: viewportHeight - marginY
      }));
    }

    for (let i = 0; i <= config.bitDepths.length; i += 1) {
      const y = marginY + (i * cellHeight);
      refs.grid.appendChild(createSvgNode('line', {
        class: 'grid-line',
        x1: marginX,
        y1: y,
        x2: viewportWidth - marginX,
        y2: y
      }));
    }

    valuesLayer = createSvgNode('g', { id: 'quality-grid-values' });
    refs.grid.appendChild(valuesLayer);

    config.sampleRates.forEach((rate, index) => {
      const x = marginX + (index * cellWidth) + (cellWidth / 2);

      const bottomLabel = createSvgNode('text', {
        class: 'grid-label',
        x,
        y: viewportHeight - marginY + 24,
        'text-anchor': 'middle'
      });
      bottomLabel.textContent = formatSampleRate(rate);
      valuesLayer.appendChild(bottomLabel);

      const topLabel = createSvgNode('text', {
        class: 'grid-label',
        x,
        y: marginY - 12,
        'text-anchor': 'middle'
      });
      topLabel.textContent = Math.round((rate / 2) / 1000);
      valuesLayer.appendChild(topLabel);
    });

    config.bitDepths.forEach((depth, index) => {
      const y = viewportHeight - marginY - (index * cellHeight) - (cellHeight / 2);

      const leftLabel = createSvgNode('text', {
        class: 'grid-label',
        x: marginX - 14,
        y,
        'text-anchor': 'end',
        'dominant-baseline': 'middle'
      });
      leftLabel.textContent = depth;
      valuesLayer.appendChild(leftLabel);

      const dynamicRangeLabel = createSvgNode('text', {
        class: 'grid-label',
        x: viewportWidth - marginX + 14,
        y,
        'text-anchor': 'start',
        'dominant-baseline': 'middle'
      });
      dynamicRangeLabel.textContent = (20 * Math.log10(Math.pow(2, depth))).toFixed(0);
      valuesLayer.appendChild(dynamicRangeLabel);
    });

    const hoverCell = createSvgNode('rect', {
      class: 'hover-cell',
      id: 'hover-cell',
      visibility: 'hidden'
    });
    refs.grid.appendChild(hoverCell);

    const selectedCell = createSvgNode('rect', { class: 'selected-cell', id: 'selected-cell' });
    refs.grid.appendChild(selectedCell);

    applyValuesVisibility();
    updateSelectedCell();
  }

  function updateSelectedCell() {
    if (!geometry) return;

    const sampleRate = parseInt(refs.sampleRate.value, 10);
    const bitDepth = parseInt(refs.bitDepth.value, 10);

    const sampleRateIndex = config.sampleRates.indexOf(sampleRate);
    const bitDepthIndex = config.bitDepths.indexOf(bitDepth);

    if (sampleRateIndex < 0 || bitDepthIndex < 0) return;

    const cell = document.getElementById('selected-cell');
    if (!cell) return;

    setCellRect(cell, sampleRateIndex, bitDepthIndex);
  }

  function selectFromGridPoint(clientX, clientY) {
    const cell = getGridCellFromPoint(clientX, clientY);
    if (!cell) return;

    refs.sampleRate.value = String(config.sampleRates[cell.sampleRateIndex]);
    refs.bitDepth.value = String(config.bitDepths[cell.bitDepthIndex]);

    updateOutputFields();
  }

  refs.grid.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    selectFromGridPoint(event.clientX, event.clientY);
  });

  refs.grid.addEventListener('pointermove', (event) => {
    updateHoverCell(event.clientX, event.clientY);
  });

  refs.grid.addEventListener('pointerleave', clearHoverCell);
  refs.grid.addEventListener('pointerup', clearHoverCell);
  refs.grid.addEventListener('pointercancel', clearHoverCell);

  refs.duration.addEventListener('input', updateOutputFields);
  refs.bitDepth.addEventListener('change', updateOutputFields);
  refs.sampleRate.addEventListener('change', updateOutputFields);
  if (refs.preset) {
    refs.preset.addEventListener('change', applyPreset);
  }
  refs.channels.addEventListener('change', updateOutputFields);

  refs.panelModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setPanelView(button.dataset.panelView);
    });
  });

  refs.valuesButton?.addEventListener('click', () => {
    valuesVisible = !valuesVisible;
    syncValuesButton();
    applyValuesVisibility();
    saveState();
  });

  if (refs.copyButton) {
    refs.copyButton.addEventListener('click', () => {
      const text = refs.panel.value.trim();
      if (!text) return;
      navigator.clipboard.writeText(text);
    });
  }

    syncPanelModeButtons();
  if (refs.resetButton) {
    refs.resetButton.addEventListener('click', resetState);
  }

  window.addEventListener('resize', buildGrid);

  const storedState = readStoredState();
  if (storedState) {
    applyState(storedState);
  } else {
    applyState(DEFAULT_STATE);
  }

  setupGridResizeObserver();
  buildGrid();
  updateOutputFields();
});

// END OF FILE
