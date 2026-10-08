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
    signalFrequency: document.getElementById('signal-frequency-field'),
    signalAmplitude: document.getElementById('signal-amplitude-field'),
    signalAmplitudeDbfs: document.getElementById('signal-amplitude-dbfs-field'),
    signalWindow: document.getElementById('signal-window-field'),
    fileSize: document.getElementById('file-size-field'),
    bitRate: document.getElementById('bit-rate-field'),
    totalSamples: document.getElementById('total-samples-field'),
    dynamicRange: document.getElementById('dynamic-range-field'),
    frequencyRange: document.getElementById('frequency-range-field'),
    panel: document.getElementById('audio-calculator-panel'),
    copyButton: document.getElementById('copy-button'),
    resetButton: document.getElementById('reset-button'),
    valuesButton: document.getElementById('toggle-values-button'),
    timeline: document.getElementById('sampling-timeline'),
    timelineScroll: document.querySelector('#timeline-container .timeline-scroll'),
    timelineGuidesButton: document.getElementById('timeline-guides-button'),
    panelModeButtons: document.querySelectorAll('.info-display-button')
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const FALLBACK_VIEWPORT_WIDTH = 800;
  const FALLBACK_VIEWPORT_HEIGHT = 300;
  const STORAGE_KEY = 'audio_calculator.state';
  const WINDOW_TICKS_PER_SECOND = 10000;
  const SAMPLING_RANGE = 1 / 32;
  refs.signalAmplitudeDbfs.min = String(20 * Math.log10(Number.MIN_VALUE));
  refs.signalAmplitudeDbfs.max = String(20 * Math.log10(Number(refs.signalAmplitude.max) / 100));
  const DEFAULT_STATE = {
    duration: 60,
    bitDepth: 24,
    sampleRate: 96000,
    channels: 2,
    signalFrequency: 2000,
    signalAmplitude: 0.025,
    signalWindow: 0.001,
    preset: 'custom',
    valuesVisible: true,
    signalVisible: true,
    quantizedVisible: true,
    samplePointsVisible: true
  };
  const samplingLayers = [
    { key: 'signalVisible', id: 'sampling-signal', description: 'white signal', button: document.getElementById('toggle-signal-button') },
    { key: 'quantizedVisible', id: 'sampling-quantized', description: 'blue quantized steps', button: document.getElementById('toggle-quantized-steps-button') },
    { key: 'samplePointsVisible', id: 'sampling-points', description: 'magenta sample points', button: document.getElementById('toggle-sample-points-button') }
  ];
  const samplingLayerVisibility = Object.fromEntries(samplingLayers.map(({ key }) => [key, DEFAULT_STATE[key]]));
  const controlKnobs = [
    { id: 'bit-depth-knob', field: refs.bitDepth, label: 'Bit depth', defaultValue: String(DEFAULT_STATE.bitDepth) },
    { id: 'sample-rate-knob', field: refs.sampleRate, label: 'Sam. rate', defaultValue: String(DEFAULT_STATE.sampleRate) },
    { id: 'channels-knob', field: refs.channels, label: 'Channels', defaultValue: String(DEFAULT_STATE.channels) },
    { id: 'window-knob', field: refs.signalWindow, label: 'Window', stateKey: 'signalWindow', scale: 1000, decimals: 3, unit: 'ms', defaultValue: (DEFAULT_STATE.signalWindow * 1000).toFixed(3) },
    { id: 'frequency-knob', field: refs.signalFrequency, label: 'Frequency', stateKey: 'signalFrequency', scale: 1, decimals: 0, unit: 'Hz', defaultValue: String(DEFAULT_STATE.signalFrequency) },
    { id: 'amplitude-knob', field: refs.signalAmplitude, label: 'Amplitude', stateKey: 'signalAmplitude', scale: 100, step: 0.025, decimals: 3, unit: '% FS', defaultValue: (DEFAULT_STATE.signalAmplitude * 100).toFixed(3) }
  ].map((control) => ({ ...control, knob: document.getElementById(control.id) }));
  let signalFrequency = DEFAULT_STATE.signalFrequency;
  let signalAmplitude = DEFAULT_STATE.signalAmplitude;
  let signalWindow = DEFAULT_STATE.signalWindow;
  let geometry = null;
  let panelView = 'selected';
  let valuesVisible = DEFAULT_STATE.valuesVisible;
  let valuesLayer = null;
  let resizeObserver = null;
  const svgUtils = window.PekoSvgUtils;
  const timelineUtils = window.PekoSvgTimeline;
  let timelineGuidesVisible = localStorage.getItem('audio_calculator.timeline_guides') === null
    ? window.PekoGuides.getGlobal()
    : localStorage.getItem('audio_calculator.timeline_guides') === 'true';
  const timelineRulers = timelineUtils.createRulerLayout({
    container: document.getElementById('timeline-container'),
    scrollElement: refs.timelineScroll,
    cornerRuler: document.getElementById('sampling-timeline-ruler-corner'),
    verticalRuler: document.getElementById('sampling-timeline-vertical-ruler'),
    horizontalRuler: document.getElementById('sampling-timeline-horizontal-ruler'),
    button: document.getElementById('rulers-button'),
    storageKey: 'audio_calculator.rulers',
    onVisibilityChange: renderSamplingTimeline
  });
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
      channels: parseInt(refs.channels.value, 10),
      signalFrequency,
      signalAmplitude,
      signalWindow
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
      const duration = parseFloat(parsed.duration);
      return {
        duration: Number.isFinite(duration) ? Math.max(0, duration) : DEFAULT_STATE.duration,
        bitDepth: clampToOptions(parseInt(parsed.bitDepth, 10), config.bitDepths, DEFAULT_STATE.bitDepth),
        sampleRate: clampToOptions(parseInt(parsed.sampleRate, 10), config.sampleRates, DEFAULT_STATE.sampleRate),
        channels: Math.min(10, Math.max(1, parseInt(parsed.channels, 10) || DEFAULT_STATE.channels)),
        signalFrequency: readIllustrationSetting(parsed.signalFrequency, DEFAULT_STATE.signalFrequency, refs.signalFrequency, 1),
        signalAmplitude: readIllustrationSetting(parsed.signalAmplitude, DEFAULT_STATE.signalAmplitude, refs.signalAmplitude, 100),
        signalWindow: readIllustrationSetting(parsed.signalWindow, DEFAULT_STATE.signalWindow, refs.signalWindow, 1000),
        preset: typeof parsed.preset === 'string' ? parsed.preset : DEFAULT_STATE.preset,
        valuesVisible: typeof parsed.valuesVisible === 'boolean' ? parsed.valuesVisible : DEFAULT_STATE.valuesVisible,
        signalVisible: typeof parsed.signalVisible === 'boolean' ? parsed.signalVisible : DEFAULT_STATE.signalVisible,
        quantizedVisible: typeof parsed.quantizedVisible === 'boolean' ? parsed.quantizedVisible : DEFAULT_STATE.quantizedVisible,
        samplePointsVisible: typeof parsed.samplePointsVisible === 'boolean' ? parsed.samplePointsVisible : DEFAULT_STATE.samplePointsVisible
      };
    } catch {
      return null;
    }
  }

  function readIllustrationSetting(value, fallback, field, scale) {
    if (value === undefined) return fallback;
    const inputValue = value * scale;
    const min = Number(field.min);
    const max = Number(field.max);
    const step = Number(field.step);
    if (!Number.isFinite(value) || inputValue < min || inputValue > max) {
      console.warn(`Invalid saved illustration value for ${field.id}; restoring its default.`);
      return fallback;
    }
    if (field.step === 'any') return value;
    return (min + Math.round((inputValue - min) / step) * step) / scale;
  }

  function applyState(state) {
    refs.duration.value = String(state.duration);
    refs.bitDepth.value = String(state.bitDepth);
    refs.sampleRate.value = String(state.sampleRate);
    refs.channels.value = String(state.channels);
    signalFrequency = state.signalFrequency;
    signalAmplitude = state.signalAmplitude;
    signalWindow = state.signalWindow;
    refs.signalFrequency.value = String(signalFrequency);
    refs.signalWindow.value = (signalWindow * 1000).toFixed(3);
    syncAmplitudeFields();
    if (refs.preset) {
      refs.preset.value = state.preset || 'custom';
    }
    valuesVisible = state.valuesVisible !== false;
    samplingLayers.forEach(({ key }) => {
      samplingLayerVisibility[key] = state[key] !== false;
    });
    syncValuesButton();
    applyValuesVisibility();
  }

  function saveState() {
    try {
      const state = {
        duration: getCurrentValues().duration,
        bitDepth: parseInt(refs.bitDepth.value, 10),
        sampleRate: parseInt(refs.sampleRate.value, 10),
        channels: parseInt(refs.channels.value, 10),
        signalFrequency,
        signalAmplitude,
        signalWindow,
        preset: refs.preset ? refs.preset.value : 'custom',
        valuesVisible,
        ...samplingLayerVisibility
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable.
    }
  }

  function resetState() {
    ['audio_calculator.timeline_guides', 'audio_calculator.rulers', 'audio_calculator.timeline_bright'].forEach((key) => localStorage.removeItem(key));
    timelineGuidesVisible = window.PekoGuides.getGlobal();
    timelineRulers.setVisible(window.PekoRulers.getGlobal(), false);
    const brightButton = document.getElementById('timeline-bright-button');
    const bright = window.PekoBrightGuides.getTimelineBright();
    brightButton.classList.toggle('button-on', bright);
    brightButton.setAttribute('aria-pressed', String(bright));
    window.PekoGuides.syncPageRegistry();
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
    syncControlKnobs();

    updateSelectedCell();
    updatePanel();
    renderSamplingTimeline();
    saveState();
  }

  function getSamplingIllustration({ bitDepth, sampleRate, signalFrequency = 2000, signalAmplitude = 0.025, signalWindow = DEFAULT_STATE.signalWindow }) {
    const duration = signalWindow;
    const frequency = signalFrequency;
    const amplitude = signalAmplitude;
    const range = SAMPLING_RANGE;
    const step = 2 ** (1 - bitDepth);
    const signalAt = (time) => amplitude * Math.sin(2 * Math.PI * frequency * time);
    // Count in 0.1 ms ticks so rounding cannot drop a sample at the window's endpoint.
    const windowTicks = Math.round(duration * WINDOW_TICKS_PER_SECOND);
    const samples = Array.from({ length: Math.floor(windowTicks * sampleRate / WINDOW_TICKS_PER_SECOND) + 1 }, (_, index) => {
      const time = index / sampleRate;
      const signal = signalAt(time);
      return { time, signal, quantized: Math.round(signal / step) * step };
    });
    return { duration, frequency, amplitude, range, step, signalAt, samples };
  }

  function renderSamplingTimeline() {
    const values = getCurrentValues();
    const illustration = getSamplingIllustration(values);
    const { duration, frequency, range, signalAt, samples } = illustration;
    const width = Math.max(1, Math.round(refs.timelineScroll.clientWidth));
    const height = Math.max(1, Math.round(refs.timelineScroll.clientHeight));
    timelineUtils.syncViewBox(refs.timeline, width, height);
    refs.timeline.replaceChildren();
    refs.timelineGuidesButton.classList.toggle('button-on', timelineGuidesVisible);
    refs.timelineGuidesButton.setAttribute('aria-pressed', String(timelineGuidesVisible));
    const xTickCount = Math.max(1, Math.min(4, Math.floor(width / 90)));
    const leftPadding = Math.min(4, width - 1);
    const plotWidth = width - leftPadding;
    const plotHeight = Math.max(1, height - 1);
    const verticalPadding = Math.min(4, plotHeight / 4);
    const toX = (time) => leftPadding + time / duration * plotWidth;
    const toY = (value) => verticalPadding + (plotHeight - 2 * verticalPadding) * (1 - value / range) / 2;
    const xTicks = Array.from({ length: xTickCount - 1 }, (_, index) => ({
      position: Math.round(toX(duration * (index + 1) / xTickCount)),
      label: `${(duration * 1000 * (index + 1) / xTickCount).toFixed(3)} ms`
    }));
    const tickSpacing = (plotHeight - 2 * verticalPadding) / 8;
    const labelStep = [1, 2, 4].find((step) => tickSpacing * step >= 44);
    const yTicks = Array.from({ length: 9 }, (_, index) => ({
      position: Math.floor(toY(-range + range * index / 4)),
      label: index > 0 && index < 8 && (labelStep === undefined ? index === 4 : index % labelStep === 0)
        ? (-range + range * index / 4).toFixed(3)
        : '',
      labelPosition: 'above'
    }));
    const levelGuides = yTicks.map(({ position }) => position);
    const guideColor = window.PekoBrightGuides.getTimelineGuideColor('var(--grey1)');
    const bright = timelineGuidesVisible && window.PekoBrightGuides.getTimelineBright();
    const rulersVisible = timelineRulers.getVisible();

    timelineRulers.render({
      width,
      height,
      color: guideColor,
      bright,
      cornerTitle: 'FS',
      drawVertical: (svg, dimensions) => timelineUtils.drawVerticalRuler(svg, {
        ...dimensions,
        ticks: yTicks,
        color: guideColor
      }),
      drawHorizontal: (svg, dimensions) => timelineUtils.drawHorizontalRuler(svg, {
        ...dimensions,
        ticks: xTicks,
        color: guideColor
      })
    });

    if (timelineGuidesVisible) {
      xTicks.forEach(({ position }) => {
        refs.timeline.appendChild(svgUtils.createLine({
          x1: position + 0.5, y1: 0, x2: position + 0.5, y2: height,
          color: guideColor, snap: false
        }));
      });
      levelGuides.forEach((position) => {
        if ((position === 0 && (rulersVisible || bright)) || (position === plotHeight && bright)) return;
        refs.timeline.appendChild(svgUtils.createLine({
          x1: 0, y1: position + 0.5, x2: width, y2: position + 0.5,
          color: guideColor, snap: false
        }));
      });
      if (bright) {
        const edges = rulersVisible
          ? [[width, 0, width, height], [width, height, 0, height]]
          : [[0, 0, width, 0], [width, 0, width, height], [width, height, 0, height], [0, height, 0, 0]];
        edges.forEach(([x1, y1, x2, y2]) => {
          refs.timeline.appendChild(svgUtils.createLine({ x1, y1, x2, y2, color: guideColor, snap: false }));
        });
      }
    }

    const segmentCount = Math.max(128, Math.min(2048, Math.ceil(plotWidth)), Math.ceil(frequency * duration * 64));
    const signalTimes = [...new Set([
      ...Array.from({ length: segmentCount + 1 }, (_, index) => duration * index / segmentCount),
      ...samples.map((sample) => sample.time)
    ])].sort((a, b) => a - b);
    const signal = svgUtils.createPath({
      points: signalTimes.map((time) => ({ x: toX(time), y: toY(signalAt(time)) })),
      color: 'var(--white)',
      strokeWidth: 1,
      crisp: false,
      title: `Original ${(frequency / 1000).toFixed(3)} kHz sine wave`
    });
    signal.id = 'sampling-signal';
    refs.timeline.appendChild(signal);
    const quantizedPoints = [];
    samples.forEach((sample, index) => {
      if (index > 0) {
        quantizedPoints.push({ x: toX(sample.time), y: toY(samples[index - 1].quantized) });
      }
      quantizedPoints.push({ x: toX(sample.time), y: toY(sample.quantized) });
    });
    quantizedPoints.push({ x: toX(duration), y: toY(samples[samples.length - 1].quantized) });
    const quantized = svgUtils.createPath({
      points: quantizedPoints,
      color: 'var(--color1)',
      strokeWidth: 2,
      crisp: false,
      title: 'Quantized sample values held until the next sample'
    });
    quantized.id = 'sampling-quantized';
    refs.timeline.appendChild(quantized);
    const markers = createSvgNode('g', { id: 'sampling-points' });
    const radius = Math.max(0.75, Math.min(3, plotWidth / samples.length / 4));
    samples.forEach((sample) => {
      markers.appendChild(svgUtils.createCircle({
        cx: toX(sample.time), cy: toY(sample.quantized), r: radius,
        fill: 'var(--color2)',
        title: `${(sample.time * 1000).toFixed(3)} ms / ${sample.quantized.toFixed(6)} FS`
      }));
    });
    refs.timeline.appendChild(markers);
    syncSamplingLayers();
  }

  function syncSamplingLayers() {
    samplingLayers.forEach(({ key, id, button }) => {
      const visible = samplingLayerVisibility[key];
      button.classList.toggle('button-on', visible);
      button.setAttribute('aria-pressed', String(visible));
      refs.timeline.querySelector(`#${id}`)?.setAttribute('display', visible ? 'inline' : 'none');
    });
    const visibleLayers = samplingLayers
      .filter(({ key }) => samplingLayerVisibility[key])
      .map(({ description }) => description)
      .join(', ');
    const values = getCurrentValues();
    const { amplitudeLevels } = computeMetrics(values);
    refs.timeline.setAttribute('aria-label', `Sampling and quantization: ${values.bitDepth}-bit / ${(values.sampleRate / 1000).toFixed(3)} kHz / ${amplitudeLevels} levels. Mono illustration: ${(values.signalWindow * 1000).toFixed(3)} ms / ${(values.signalFrequency / 1000).toFixed(3)} kHz / ${formatSignalLevel(values.signalAmplitude)}. Visible: ${visibleLayers || 'none'}. Amplitude range plus or minus ${SAMPLING_RANGE.toFixed(3)} full scale.`);
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

  function formatSignalLevel(amplitude) {
    return amplitude === 0 ? 'silence' : `${(20 * Math.log10(amplitude)).toFixed(3)} dBFS`;
  }

  function formatAmplitudePercent(amplitude) {
    const percent = amplitude * 100;
    return percent > 0 && percent < 0.001
      ? percent.toExponential(6)
      : percent.toFixed(6).replace(/(\.\d{3})0+$/, '$1');
  }

  function syncAmplitudeFields(source) {
    if (source !== refs.signalAmplitude) {
      refs.signalAmplitude.value = formatAmplitudePercent(signalAmplitude);
    }
    if (source !== refs.signalAmplitudeDbfs) {
      refs.signalAmplitudeDbfs.value = signalAmplitude === 0 ? '' : (20 * Math.log10(signalAmplitude)).toFixed(3);
    }
  }

  function refreshIllustration() {
    syncControlKnobs();
    updatePanel();
    renderSamplingTimeline();
    saveState();
  }

  function getKnobStep(control) {
    return control.step !== undefined ? control.step : Number(control.field.step);
  }

  function getKnobIndex(control) {
    if (!control.stateKey) return control.field.selectedIndex;
    return (getCurrentValues()[control.stateKey] * control.scale - Number(control.field.min)) / getKnobStep(control);
  }

  function getKnobMaximum(control) {
    if (!control.stateKey) return control.field.options.length - 1;
    return Math.round((Number(control.field.max) - Number(control.field.min)) / getKnobStep(control));
  }

  function syncControlKnobs() {
    controlKnobs.forEach((control) => {
      const { knob, field, label } = control;
      const index = getKnobIndex(control);
      const angle = -135 + (index / Math.max(1, getKnobMaximum(control))) * 270;
      const value = control.stateKey
        ? `${control.stateKey === 'signalAmplitude' ? formatAmplitudePercent(signalAmplitude) : (getCurrentValues()[control.stateKey] * control.scale).toFixed(control.decimals)} ${control.unit}`
        : field.options[index].textContent;
      knob.style.setProperty('--knob-angle', `${angle}deg`);
      knob.title = `${label}: ${value}`;
      knob.dataset.statusLabel = `${label}: ${value}.`;
      if (control.stateKey) {
        knob.setAttribute('role', 'slider');
        knob.setAttribute('aria-orientation', 'vertical');
        knob.setAttribute('aria-valuemin', field.min);
        knob.setAttribute('aria-valuemax', field.max);
        knob.setAttribute('aria-valuenow', String(getCurrentValues()[control.stateKey] * control.scale));
        knob.setAttribute('aria-valuetext', value);
      }
    });
  }

  function initControlKnobs() {
    controlKnobs.forEach((control) => {
      const { knob, field, defaultValue } = control;
      let drag = null;
      let suppressClick = false;
      let clickTimer = null;

      const setIndex = (index) => {
        const nextIndex = Math.max(0, Math.min(getKnobMaximum(control), index));
        if (getKnobIndex(control) === nextIndex) {
          if (control.stateKey === 'signalAmplitude') syncAmplitudeFields();
          else if (control.stateKey) field.value = (getCurrentValues()[control.stateKey] * control.scale).toFixed(control.decimals);
          return;
        }
        if (control.stateKey) {
          const value = Number(field.min) + nextIndex * getKnobStep(control);
          field.value = control.stateKey === 'signalAmplitude'
            ? formatAmplitudePercent(value / control.scale)
            : value.toFixed(control.decimals);
        } else {
          field.selectedIndex = nextIndex;
        }
        field.dispatchEvent(new Event('change', { bubbles: true }));
        syncControlKnobs();
        saveState();
      };

      knob.addEventListener('click', () => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          setIndex(getKnobIndex(control) + 1);
          clickTimer = null;
        }, 320);
      });

      knob.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (event.deltaY !== 0) setIndex(getKnobIndex(control) + (event.deltaY > 0 ? -1 : 1));
      }, { passive: false });

      knob.addEventListener('keydown', (event) => {
        const indices = {
          ArrowUp: getKnobIndex(control) + 1,
          ArrowRight: getKnobIndex(control) + 1,
          ArrowDown: getKnobIndex(control) - 1,
          ArrowLeft: getKnobIndex(control) - 1,
          Home: 0,
          End: getKnobMaximum(control)
        };
        if (!(event.key in indices)) return;
        event.preventDefault();
        setIndex(indices[event.key]);
      });

      knob.addEventListener('dblclick', (event) => {
        event.preventDefault();
        clearTimeout(clickTimer);
        clickTimer = null;
        setIndex(control.stateKey
          ? (Number(defaultValue) - Number(field.min)) / getKnobStep(control)
          : Array.from(field.options).findIndex((option) => option.value === defaultValue));
      });

      knob.addEventListener('pointerdown', (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        knob.focus({ preventScroll: true });
        clearTimeout(clickTimer);
        clickTimer = null;
        suppressClick = false;
        drag = { pointerId: event.pointerId, y: event.clientY, index: getKnobIndex(control), moved: false };
        knob.setPointerCapture(event.pointerId);
      });

      knob.addEventListener('pointermove', (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        event.preventDefault();
        const deltaY = drag.y - event.clientY;
        const pixelsPerStep = control.stateKey ? 160 / getKnobMaximum(control) : 14;
        const deltaSteps = Math.round(deltaY / pixelsPerStep);
        if (Math.abs(deltaY) >= 6 || (control.stateKey && deltaSteps !== 0)) drag.moved = true;
        setIndex(drag.index + deltaSteps);
      });

      const endDrag = (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        suppressClick = drag.moved;
        drag = null;
        if (knob.hasPointerCapture(event.pointerId)) knob.releasePointerCapture(event.pointerId);
      };
      knob.addEventListener('pointerup', endDrag);
      knob.addEventListener('pointercancel', endDrag);
      knob.addEventListener('lostpointercapture', endDrag);
    });
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
      `Frequency range: ${formatFrequency(metrics.maxFrequency)}`,
      '',
      `Illustration window: ${(values.signalWindow * 1000).toFixed(3)} ms`,
      `Signal frequency: ${formatFrequency(values.signalFrequency)}`,
      `Signal amplitude: ${formatAmplitudePercent(values.signalAmplitude)}% FS (${formatSignalLevel(values.signalAmplitude)})`
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

    lines.push('');
    lines.push(`Illustration: ${(values.signalWindow * 1000).toFixed(3)} ms | ${formatFrequency(values.signalFrequency)} | ${formatAmplitudePercent(values.signalAmplitude)}% FS (${formatSignalLevel(values.signalAmplitude)})`);
    return lines.join('\n');
  }

  function getSamplingErrorMetrics(samples) {
    const getRmsStats = (values) => {
      const peak = Math.max(...values.map((value) => Math.abs(value)));
      if (peak === 0) return { peak: 0, rms: 0, dbfs: -Infinity };
      const normalizedRms = Math.hypot(...values.map((value) => value / peak)) / Math.sqrt(values.length);
      return {
        peak,
        rms: peak * normalizedRms,
        dbfs: 20 * (Math.log10(peak) + Math.log10(normalizedRms))
      };
    };
    const signal = getRmsStats(samples.map((sample) => sample.signal));
    const error = getRmsStats(samples.map((sample) => sample.quantized - sample.signal));
    return {
      rmsError: error.rms,
      errorDbfs: error.dbfs,
      peakError: error.peak,
      snr: signal.peak === 0 ? null : error.peak === 0 ? Infinity : signal.dbfs - error.dbfs
    };
  }

  function getSamplePointsSummary(values) {
    const { duration, samples } = getSamplingIllustration(values);
    const { rmsError, errorDbfs, peakError, snr } = getSamplingErrorMetrics(samples);
    const rmsText = rmsError === 0 && peakError > 0 ? `<${Number.MIN_VALUE.toPrecision(9)}` : rmsError.toPrecision(9);
    const snrText = snr === null ? 'undefined (zero signal)' : snr === Infinity ? 'Infinity dB (zero error)' : `${snr.toFixed(3)} dB`;
    const formatRow = (columns) => columns.map((column, index) => String(column).padStart([4, 12, 16, 16, 16][index])).join(' | ');
    return [
      `Bit depth: ${values.bitDepth} bit | Sample rate: ${formatSampleRate(values.sampleRate)} kHz`,
      '',
      `Mono illustration: ${(duration * 1000).toFixed(3)} ms | ${samples.length} sample points`,
      `Signal frequency: ${formatFrequency(values.signalFrequency)}`,
      `Signal amplitude: ${formatAmplitudePercent(values.signalAmplitude)}% FS (${formatSignalLevel(values.signalAmplitude)})`,
      '',
      `RMS error: ${rmsText} FS (${errorDbfs.toFixed(3)} dBFS)`,
      `Peak error: ${peakError.toPrecision(9)} FS`,
      `SNR: ${snrText}`,
      'Error = quantized - signal. Amplitudes are in full scale (FS).',
      '',
      formatRow(['#', 'Time (ms)', 'Signal (FS)', 'Quantized (FS)', 'Error (FS)']),
      ...samples.map(({ time, signal, quantized }, index) => formatRow([
        index,
        (time * 1000).toFixed(6),
        signal.toPrecision(9),
        quantized.toPrecision(9),
        (quantized - signal).toPrecision(9)
      ]))
    ].join('\n');
  }

  function updatePanel() {
    const values = getCurrentValues();
    const metrics = computeMetrics(values);

    if (panelView === 'all') {
      refs.panel.value = getAllSummary(values);
      return;
    }

    if (panelView === 'points') {
      refs.panel.value = getSamplePointsSummary(values);
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
    if (view !== 'selected' && view !== 'all' && view !== 'points') return;
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
    const selectedCellLabel = createSvgNode('text', {
      class: 'selected-cell-label',
      id: 'selected-cell-label',
      'text-anchor': 'middle',
      'dominant-baseline': 'central'
    });
    refs.grid.appendChild(selectedCellLabel);

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
    const label = document.getElementById('selected-cell-label');
    label.setAttribute('x', String(geometry.marginX + (sampleRateIndex + 0.5) * geometry.cellWidth));
    label.setAttribute('y', String(geometry.marginY + (config.bitDepths.length - bitDepthIndex - 0.5) * geometry.cellHeight));
    label.style.setProperty('--selected-cell-font-size', `${Math.min(geometry.cellWidth * 0.65, geometry.cellHeight * 0.6)}px`);
    label.textContent = refs.channels.value;
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
    refs.preset.addEventListener('change', () => {
      applyPreset();
      syncControlKnobs();
      saveState();
    });
  }
  refs.channels.addEventListener('change', updateOutputFields);
  controlKnobs.filter((control) => control.stateKey).forEach((control) => {
    const updateIllustration = () => {
      if (!control.field.checkValidity()) {
        control.field.reportValidity();
        return;
      }
      const value = control.field.valueAsNumber / control.scale;
      if (control.stateKey === 'signalFrequency') signalFrequency = value;
      else if (control.stateKey === 'signalWindow') signalWindow = value;
      else {
        signalAmplitude = value;
        syncAmplitudeFields(control.field);
      }
      refreshIllustration();
    };
    control.field.addEventListener('input', updateIllustration);
    control.field.addEventListener('change', () => {
      updateIllustration();
      if (control.field.checkValidity()) {
        control.field.value = control.stateKey === 'signalAmplitude'
          ? formatAmplitudePercent(signalAmplitude)
          : control.field.valueAsNumber.toFixed(control.decimals);
      }
    });
  });
  const updateAmplitudeDbfs = () => {
    if (!refs.signalAmplitudeDbfs.checkValidity()) {
      refs.signalAmplitudeDbfs.reportValidity();
      return;
    }
    signalAmplitude = refs.signalAmplitudeDbfs.value === ''
      ? 0
      : 10 ** (refs.signalAmplitudeDbfs.valueAsNumber / 20);
    syncAmplitudeFields(refs.signalAmplitudeDbfs);
    refreshIllustration();
  };
  refs.signalAmplitudeDbfs.addEventListener('input', updateAmplitudeDbfs);
  refs.signalAmplitudeDbfs.addEventListener('change', () => {
    updateAmplitudeDbfs();
    if (refs.signalAmplitudeDbfs.checkValidity()) syncAmplitudeFields();
  });

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

  refs.timelineGuidesButton.addEventListener('click', () => {
    timelineGuidesVisible = !timelineGuidesVisible;
    localStorage.setItem('audio_calculator.timeline_guides', String(timelineGuidesVisible));
    renderSamplingTimeline();
  });
  samplingLayers.forEach(({ key, button }) => {
    button.addEventListener('click', () => {
      samplingLayerVisibility[key] = !samplingLayerVisibility[key];
      syncSamplingLayers();
      saveState();
    });
  });
  window.addEventListener('pekosoft:guides-global-change', (event) => {
    timelineGuidesVisible = event.detail.enabled;
    renderSamplingTimeline();
  });
  window.addEventListener('pekosoft:timeline-bright-change', renderSamplingTimeline);

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
  timelineUtils.observeResize({
    svg: refs.timeline,
    container: document.getElementById('timeline-container'),
    onResize: renderSamplingTimeline
  });
  initControlKnobs();
  buildGrid();
  updateOutputFields();
});

// END OF FILE
