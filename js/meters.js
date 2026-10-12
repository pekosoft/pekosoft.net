// Shared meters module behavior
// pekosoft.net/js/meters.js

(function () {
  const metersContainer = document.getElementById('meters-container');
  if (!metersContainer) return;

  const path = (window.location.pathname || '').toLowerCase();

  const canvasByMode = {
    spectroscope: document.getElementById('frequency-analyzer'),
    level: document.getElementById('volume-meter'),
    oscilloscope: document.getElementById('waveform'),
    wavescope: document.getElementById('wavescope'),
    phasescope: document.getElementById('phasescope')
  };

  const buttonByMode = {
    spectroscope: document.getElementById('tool-spectroscope-button'),
    level: document.getElementById('tool-level-button'),
    oscilloscope: document.getElementById('tool-oscilloscope-button'),
    wavescope: document.getElementById('tool-wavescope-button'),
    phasescope: document.getElementById('tool-phasescope-button')
  };

  const guidesButton = document.getElementById('tool-guides-button');
  const brightButton = document.getElementById('tool-bright-button');
  const colorButton = document.getElementById('tool-color-button');
  const rulersButton = document.getElementById('tool-rulers-button');
  const freezeButton = document.getElementById('meters-freeze-button');
  const crosshairButton = document.getElementById('meters-crosshair-button');
  const saveButton = document.getElementById('meters-save-button');
  const copyButton = document.getElementById('meters-copy-button');
  const meterPlot = metersContainer.querySelector('.meter-plot');
  const crosshairOverlay = metersContainer.querySelector('.meters-crosshair');
  const rulerLayout = metersContainer.querySelector('.meters-ruler-layout');
  const rulerCorner = document.getElementById('meters-ruler-corner');
  const horizontalRuler = document.getElementById('meters-horizontal-ruler');
  const verticalRuler = document.getElementById('meters-vertical-ruler');
  const timelineUtils = window.PekoSvgTimeline;
  const availableModes = Object.keys(canvasByMode).filter((mode) => !!canvasByMode[mode]);
  if (!availableModes.length) return;

  const release = (path.split('/').pop() || 'index.php').replace(/\.php$/i, '') || 'index';
  const storagePrefix = `meters.${release}`;

  function getSavedMode() {
    const saved = localStorage.getItem(`${storagePrefix}.mode`);
    return availableModes.includes(saved) ? saved : 'oscilloscope';
  }

  function getSavedGuides() {
    const saved = localStorage.getItem(`${storagePrefix}.guides`);
    return saved === null ? localStorage.getItem('global.guides') !== 'false' : saved === 'on';
  }

  function getSavedBright() {
    const saved = localStorage.getItem(`${storagePrefix}.bright`);
    return saved === null
      ? (window.PekoBrightGuides?.getGlobal() || false)
      : saved === 'on';
  }

  function getSavedRulers() {
    const saved = localStorage.getItem(`${storagePrefix}.rulers`);
    return saved === null ? window.PekoRulers.getGlobal() : saved === 'on';
  }

  function getSavedMulticolor() {
    const saved = localStorage.getItem(`${storagePrefix}.multicolor`);
    return saved === null
      ? localStorage.getItem('global.multicolor') !== 'false'
      : saved === 'on';
  }

  function resizeCanvasToDisplaySize(canvas, ctx) {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      let previousImage = null;
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;

      if (oldWidth > 0 && oldHeight > 0) {
        previousImage = document.createElement('canvas');
        previousImage.width = oldWidth;
        previousImage.height = oldHeight;
        const previousCtx = previousImage.getContext('2d');
        if (previousCtx) {
          previousCtx.drawImage(canvas, 0, 0);
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (previousImage) {
        const logicalOldWidth = oldWidth / dpr;
        const logicalOldHeight = oldHeight / dpr;
        const logicalNewWidth = width / dpr;
        const logicalNewHeight = height / dpr;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.drawImage(previousImage, 0, 0, logicalOldWidth, logicalOldHeight, 0, 0, logicalNewWidth, logicalNewHeight);
        ctx.restore();
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const colorGrey1 = getComputedStyle(document.documentElement).getPropertyValue('--grey1').trim() || '#222';
  let guideColor = colorGrey1;

  function snapGuideCoordinate(value) {
    const dpr = window.devicePixelRatio || 1;
    return (Math.round((value * dpr) - 0.5) + 0.5) / dpr;
  }

  function setCrispGuideStroke(ctx) {
    ctx.lineWidth = 1 / (window.devicePixelRatio || 1);
  }

  function frequencyToSpectrumX(freqHz, width, sampleRate) {
    const fMin = 20;
    const nyquist = Math.max(fMin + 1, sampleRate / 2);
    if (freqHz <= fMin) return 0;
    if (freqHz >= nyquist) return width;
    return width * Math.log(freqHz / fMin) / Math.log(nyquist / fMin);
  }

  function getWaveformDbTicks(height, centerY, amplitude, channelLabel = '') {
    const minusSixDbGain = Math.pow(10, -6 / 20);
    return [
      { label: '0 dB', offset: -1 },
      { label: '-6 dB', offset: -minusSixDbGain },
      { label: channelLabel ? `${channelLabel} -∞` : '-∞', offset: 0 },
      { label: '-6 dB', offset: minusSixDbGain },
      { label: '0 dB', offset: 1 }
    ].map(({ label, offset }) => ({
      position: Math.max(0, Math.min(height - 1, Math.floor(centerY + offset * amplitude))),
      label,
      labelPosition: offset === -1 && !channelLabel ? 'below' : 'above'
    }));
  }

  function drawBrightGuideBoundary(ctx, width, height, completeFrame = false) {
    if (!brightGuides) return;

    const dpr = window.devicePixelRatio || 1;
    const lineWidth = 1 / dpr;
    ctx.save();
    ctx.fillStyle = guideColor;
    if (!rulersOn || completeFrame) {
      ctx.fillRect(0, 0, width, lineWidth);
    }
    ctx.fillRect(Math.max(0, width - lineWidth), 0, lineWidth, height);
    ctx.fillRect(0, Math.max(0, height - lineWidth), width, lineWidth);
    if (!rulersOn || completeFrame) {
      ctx.fillRect(0, 0, lineWidth, height);
    }
    ctx.restore();
  }

  function buildMeterBitmap() {
    const bitmap = buildTimelineBitmap(meterPlot);
    if (!bitmap) throw new Error('No Meters bitmap is available to export.');
    if (guidesOn && brightGuides) {
      const ctx = bitmap.getContext('2d');
      if (!ctx) throw new Error('Could not draw the Meters bitmap outline.');
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      drawBrightGuideBoundary(ctx, bitmap.width / dpr, bitmap.height / dpr, true);
      ctx.restore();
    }
    return bitmap;
  }

  function getMeterTicks(mode, width, height, source) {
    if (mode === 'phasescope') {
      const { centerX, centerY, radius } = getPhasescopeGeometry(width, height);
      return {
        horizontal: [-1, 0, 1].map((value) => ({
          position: centerX + value * radius,
          label: value > 0 ? '+1' : `${value}`
        })),
        vertical: [1, 0, -1].map((value) => ({
          position: centerY - value * radius,
          label: value > 0 ? '+1' : `${value}`,
          labelPosition: value === 1 ? 'below' : 'above'
        }))
      };
    }
    if (mode === 'spectroscope') {
      const sampleRate = source?.sampleRate || 44100;
      return {
        horizontal: [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
          .filter((freq) => freq <= sampleRate / 2)
          .map((freq) => ({
            position: Math.max(0, Math.min(width - 1, Math.floor(frequencyToSpectrumX(freq, width, sampleRate)))),
            label: freq >= 1000 ? `${freq / 1000}k` : `${freq}`
          })),
        vertical: [-60, -48, -36, -24, -12, 0].map((db) => ({
          position: Math.max(0, Math.min(height - 1, Math.floor(-db / 60 * height))),
          label: `${db}`,
          labelPosition: db === 0 ? 'below' : 'above'
        }))
      };
    }
    if (mode === 'level') {
      const channels = (source?.channelCount || 2) > 1 ? 2 : 1;
      const gap = channels > 1 ? 4 : 0;
      const barHeight = Math.floor((height - gap * (channels - 1)) / channels);
      return {
        horizontal: getLevelHorizontalTicks(width),
        vertical: [{ position: channels > 1 ? barHeight + gap / 2 : height / 2, label: '' }],
        labels: channels > 1
          ? [
            { position: barHeight / 2, label: 'L' },
            { position: barHeight + gap + barHeight / 2, label: 'R' }
          ]
          : [{ position: height / 2 - 9, label: 'M' }]
      };
    }
    const stereo = mode === 'wavescope' && (source?.channelCount || 1) > 1;
    return {
      horizontal: getMeterTimeTicks(mode, width, source),
      vertical: stereo
        ? [
          ...getWaveformDbTicks(height, height * 0.25, height * 0.18, 'L'),
          ...getWaveformDbTicks(height, height * 0.75, height * 0.18, 'R')
        ]
        : getWaveformDbTicks(height, height / 2, height / 2)
    };
  }

  function getLevelHorizontalTicks(width) {
    const ctx = canvasByMode.level.getContext('2d');
    if (!ctx) return [];
    width = Math.floor(width);
    const ticks = [-60, -40, -24, -12, -6, -3, 0].map((db) => ({
      position: Math.max(0, Math.min(width - 1, Math.floor(width * Math.pow(10, db / 20)))),
      label: `${db} dB`,
      labelPosition: db === 0 ? 'before' : 'after'
    }));
    ctx.save();
    ctx.font = '12px Arial, sans-serif';
    const endLabelLeft = width - 0.5 - 3 - ctx.measureText('0 dB').width;
    let labelRight = 0;
    const visibleTicks = ticks.filter((tick) => {
      const labelWidth = ctx.measureText(tick.label).width;
      const labelLeft = tick.labelPosition === 'before'
        ? endLabelLeft
        : tick.position + 0.5 + 3;
      const labelEnd = labelLeft + labelWidth;
      if (tick.position < 12 || labelLeft < labelRight + 4 || labelEnd > width
        || (tick.labelPosition !== 'before' && labelEnd + 4 > endLabelLeft)) {
        return false;
      }
      labelRight = labelEnd;
      return true;
    });
    ctx.restore();
    return visibleTicks;
  }

  function getMeterTimeTicks(mode, width, source) {
    const scrolling = mode === 'wavescope';
    const duration = scrolling
      ? Math.max(0, Math.floor(width) - 1) / wavescopeState.sampleRateHz
      : timeArray.length / (source?.sampleRate || 44100) * 1000;
    if (duration <= 0) return [];

    const targetStep = duration / Math.max(1, Math.floor(width / 80));
    const magnitude = Math.pow(10, Math.floor(Math.log10(targetStep)));
    const step = [1, 2, 5, 10].find((factor) => factor * magnitude >= targetStep) * magnitude;
    const decimals = Math.max(0, -Math.floor(Math.log10(step)));
    const ticks = [];
    for (let i = 1; i * step < duration; i++) {
      const value = i * step;
      ticks.push({
        position: scrolling
          ? Math.floor(width) - 1 - value * wavescopeState.sampleRateHz
          : value / duration * width,
        label: `${scrolling ? '-' : ''}${value.toFixed(decimals)} ${scrolling ? 's' : 'ms'}`
      });
    }
    if (scrolling) {
      ticks.push({ position: Math.max(0, Math.floor(width) - 1), label: '0 s', labelPosition: 'before' });
    }
    return ticks.sort((a, b) => a.position - b.position);
  }

  let rulerRenderKey = '';

  function drawMeterRulers(source) {
    rulerLayout.classList.toggle('timeline-rulers-hidden', !rulersOn);
    const canvas = canvasByMode[activeMode];
    const { width, height } = canvas.getBoundingClientRect();
    const key = [activeMode, width, height, source?.sampleRate, source?.channelCount, guideColor, rulersOn].join(':');
    if (key === rulerRenderKey) return;
    rulerRenderKey = key;
    meterNeedsRedraw = true;
    if (!rulersOn) return;

    const ticks = getMeterTicks(activeMode, width, height, source);
    verticalRuler.setAttribute('aria-label', activeMode === 'level'
      ? 'Meter channel ruler'
      : activeMode === 'phasescope' ? 'Meter mid amplitude ruler' : 'Meter decibel ruler');
    horizontalRuler.setAttribute('aria-label', activeMode === 'phasescope'
      ? 'Meter side amplitude ruler' : 'Meter horizontal ruler');
    timelineUtils.syncViewBox(verticalRuler, 48, height);
    timelineUtils.drawVerticalRuler(verticalRuler, {
      width: 48, height, ticks: ticks.vertical, labels: ticks.labels, color: guideColor, bright: brightGuides, sideBorders: true,
      topBorder: false
    });
    timelineUtils.syncViewBox(horizontalRuler, width, 24);
    timelineUtils.drawHorizontalRuler(horizontalRuler, {
      width, height: 24, ticks: ticks.horizontal, color: guideColor,
      bright: brightGuides, sideBorders: true, leftBorder: false,
      tickLength: activeMode === 'level' ? 5 : undefined,
      labelBaseline: activeMode === 'level' ? 14 : undefined
    });
    if (activeMode !== 'level') {
      let labelRight = 0;
      horizontalRuler.querySelectorAll('text').forEach((label) => {
        const bounds = label.getBBox();
        if (bounds.x < labelRight + 4 || bounds.x + bounds.width > width) {
          label.remove();
        } else {
          labelRight = bounds.x + bounds.width;
        }
      });
    }
    timelineUtils.syncViewBox(rulerCorner, 48, 24);
    timelineUtils.drawRulerCorner(rulerCorner, {
      width: 48, height: 24, color: guideColor, bright: brightGuides,
      title: activeMode === 'level' ? '' : activeMode === 'phasescope' ? 'M/S' : 'dB', sideBorders: true
    });
  }

  const timeArray = new Uint8Array(2048);
  const timeArrayR = new Uint8Array(2048);
  let freqArray = new Uint8Array(0);

  const pausedFrameState = {
    oscilloscopeReady: false,
    oscilloscopeData: new Uint8Array(2048),
    spectrumReady: false,
    levelReady: false,
    levelLeft: 0,
    levelRight: 0,
    levelChannels: 1
  };

  const levelDisplayState = {
    left: 0,
    right: 0,
    lastUpdateMs: 0
  };

  const spectrumDisplayState = {
    levels: new Float32Array(32),
    lastUpdateMs: 0
  };

  const phasescopeState = {
    left: new Float32Array(0),
    right: new Float32Array(0),
    ready: false,
    correlation: null,
    correlationMin: null,
    correlationMax: null,
    correlationHistory: [],
    invalidSource: null
  };

  const wavescopeState = {
    historyMinL: [],
    historyMaxL: [],
    historyMinR: [],
    historyMaxR: [],
    width: 0,
    lastPushMs: 0,
    sampleRateHz: 90,
    smoothMinL: 0,
    smoothMaxL: 0,
    smoothMinR: 0,
    smoothMaxR: 0
  };

  function resetWavescopeHistory(width = wavescopeState.width || 0) {
    const size = Math.max(0, Math.floor(width));
    wavescopeState.width = size;
    wavescopeState.historyMinL = new Array(size).fill(null);
    wavescopeState.historyMaxL = new Array(size).fill(null);
    wavescopeState.historyMinR = new Array(size).fill(null);
    wavescopeState.historyMaxR = new Array(size).fill(null);
    wavescopeState.lastPushMs = 0;
    wavescopeState.smoothMinL = 0;
    wavescopeState.smoothMaxL = 0;
    wavescopeState.smoothMinR = 0;
    wavescopeState.smoothMaxR = 0;
  }

  function resizeWavescopeHistory(nextWidth) {
    const newSize = Math.max(1, Math.floor(nextWidth));

    // Ignore transient tiny widths during window drag/relayout,
    // otherwise history gets crushed and appears to disappear.
    if (wavescopeState.width > 0 && newSize < 32) {
      return;
    }

    if (wavescopeState.width === newSize) {
      return;
    }

    const oldSize = wavescopeState.width;
    const oldMinL = wavescopeState.historyMinL;
    const oldMaxL = wavescopeState.historyMaxL;
    const oldMinR = wavescopeState.historyMinR;
    const oldMaxR = wavescopeState.historyMaxR;

    const resize = (source) => {
      if (!oldSize || !Array.isArray(source) || !source.length) {
        return new Array(newSize).fill(null);
      }

      return newSize > oldSize
        ? new Array(newSize - oldSize).fill(null).concat(source)
        : source.slice(oldSize - newSize);
    };

    wavescopeState.width = newSize;
    wavescopeState.historyMinL = resize(oldMinL);
    wavescopeState.historyMaxL = resize(oldMaxL);
    wavescopeState.historyMinR = resize(oldMinR);
    wavescopeState.historyMaxR = resize(oldMaxR);
  }

  let activeMode = getSavedMode();
  if (!availableModes.includes(activeMode)) {
    activeMode = availableModes[0];
  }

  let guidesOn = getSavedGuides();
  let brightGuides = getSavedBright();
  let rulersOn = getSavedRulers();
  let multicolorOn = getSavedMulticolor();
  let crosshairOn = localStorage.getItem(`${storagePrefix}.crosshair`) === 'on';
  let crosshairPointer = null;
  let frozen = false;
  let frozenSource = null;
  let meterNeedsRedraw = true;
  let wasMeterActive = false;
  let meterPalette = null;
  const meterReleaseMs = 350;

  function updateCrosshair() {
    if (!crosshairOn || !crosshairPointer) {
      crosshairOverlay.hidden = true;
      return;
    }
    const rect = meterPlot.getBoundingClientRect();
    const isTouch = crosshairPointer.pointerType === 'touch';
    const x = isTouch ? crosshairPointer.x * rect.width : crosshairPointer.x - rect.left;
    const y = isTouch ? crosshairPointer.y * rect.height : crosshairPointer.y - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) {
      crosshairOverlay.hidden = true;
      return;
    }
    crosshairOverlay.style.setProperty('--meter-crosshair-x', `${Math.floor(x)}px`);
    crosshairOverlay.style.setProperty('--meter-crosshair-y', `${Math.floor(y)}px`);
    crosshairOverlay.hidden = false;
  }

  function applyCrosshair(nextState, persist = true) {
    crosshairOn = !!nextState;
    if (persist) {
      localStorage.setItem(`${storagePrefix}.crosshair`, crosshairOn ? 'on' : 'off');
    }
    crosshairButton.classList.toggle('button-on', crosshairOn);
    crosshairButton.setAttribute('aria-pressed', String(crosshairOn));
    meterPlot.classList.toggle('meters-crosshair-on', crosshairOn);
    if (!crosshairOn && crosshairPointer?.pointerType === 'touch') crosshairPointer = null;
    updateCrosshair();
  }

  function moveCrosshair(event) {
    if (event.pointerType === 'touch') {
      if (!crosshairOn || !event.isPrimary) return;
      const rect = meterPlot.getBoundingClientRect();
      crosshairPointer = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
        pointerType: 'touch'
      };
    } else {
      crosshairPointer = { x: event.clientX, y: event.clientY, pointerType: event.pointerType };
    }
    updateCrosshair();
  }

  function leaveCrosshair(event) {
    if (event.pointerType !== 'touch') clearCrosshair();
  }

  function clearCrosshair() {
    crosshairPointer = null;
    updateCrosshair();
  }

  function applyFreeze(nextState) {
    frozen = !!nextState;
    frozenSource = frozen ? getSourceConfig() : null;
    wavescopeState.lastPushMs = 0;
    freezeButton.classList.toggle('button-on', frozen);
    freezeButton.setAttribute('aria-pressed', String(frozen));
    meterNeedsRedraw = true;
  }

  function applyMode(nextMode) {
    if (!availableModes.includes(nextMode)) return;
    if (activeMode !== nextMode) wavescopeState.lastPushMs = 0;
    activeMode = nextMode;
    localStorage.setItem(`${storagePrefix}.mode`, activeMode);

    Object.entries(canvasByMode).forEach(([mode, canvas]) => {
      if (!canvas) return;
      canvas.classList.toggle('active', mode === activeMode);
    });

    Object.entries(buttonByMode).forEach(([mode, button]) => {
      if (!button) return;
      button.classList.toggle('button-on', mode === activeMode);
    });
    meterNeedsRedraw = true;
  }

  function applyGuides(nextState) {
    guidesOn = !!nextState;
    localStorage.setItem(`${storagePrefix}.guides`, guidesOn ? 'on' : 'off');
    if (guidesButton) {
      guidesButton.classList.toggle('button-on', guidesOn);
    }
    meterNeedsRedraw = true;
    requestAnimationFrame(redrawMeterFrame);
  }

  function applyBright(nextState, persist = true) {
    brightGuides = !!nextState;
    guideColor = brightGuides ? '#fff' : colorGrey1;
    if (persist) {
      localStorage.setItem(`${storagePrefix}.bright`, brightGuides ? 'on' : 'off');
    }
    if (brightButton) {
      brightButton.classList.toggle('button-on', brightGuides);
    }
    meterNeedsRedraw = true;
  }

  function applyRulers(nextState, persist = true) {
    rulersOn = !!nextState;
    if (persist) {
      localStorage.setItem(`${storagePrefix}.rulers`, rulersOn ? 'on' : 'off');
    }
    rulersButton.classList.toggle('button-on', rulersOn);
    rulersButton.setAttribute('aria-pressed', String(rulersOn));
    meterNeedsRedraw = true;
  }

  function applyMulticolor(nextState, persist = true) {
    multicolorOn = !!nextState;
    if (persist) {
      localStorage.setItem(`${storagePrefix}.multicolor`, multicolorOn ? 'on' : 'off');
    }
    if (colorButton) {
      colorButton.classList.toggle('button-on', multicolorOn);
    }
    meterNeedsRedraw = true;
  }

  function parseCssColorToRgb(input, fallback) {
    if (!input || typeof input !== 'string') return fallback;
    const value = input.trim();

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

    const rgbMatch = value.match(/rgba?\(([^)]+)\)/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(',').map((part) => parseFloat(part.trim()));
      if (parts.length >= 3) {
        return {
          r: Math.max(0, Math.min(255, Math.round(parts[0]))),
          g: Math.max(0, Math.min(255, Math.round(parts[1]))),
          b: Math.max(0, Math.min(255, Math.round(parts[2])))
        };
      }
    }

    return fallback;
  }

  function mixRgb(a, b, t) {
    return {
      r: Math.round(a.r + ((b.r - a.r) * t)),
      g: Math.round(a.g + ((b.g - a.g) * t)),
      b: Math.round(a.b + ((b.b - a.b) * t))
    };
  }

  function getMeterColor(source, ratio, reverse = false) {
    const t = Math.max(0, Math.min(1, ratio));
    if (!multicolorOn) return source.palette.primary;
    return reverse
      ? mixRgb(source.palette.primary, source.palette.secondary, t)
      : mixRgb(source.palette.secondary, source.palette.primary, t);
  }

  function getMeterColorStyle(source, ratio, reverse = false) {
    const rgb = getMeterColor(source, ratio, reverse);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  function getMeterPalette() {
    if (meterPalette) return meterPalette;

    const fallbackSecondary = { r: 0, g: 96, b: 192 };
    const fallbackPrimary = { r: 0, g: 128, b: 255 };
    const fallbackWhite = { r: 255, g: 255, b: 255 };
    const css = getComputedStyle(document.documentElement);
    meterPalette = {
      secondary: parseCssColorToRgb(css.getPropertyValue('--color2'), fallbackSecondary),
      primary: parseCssColorToRgb(css.getPropertyValue('--color1'), fallbackPrimary),
      white: parseCssColorToRgb(css.getPropertyValue('--white'), fallbackWhite)
    };
    return meterPalette;
  }

  function getSourceConfig() {
    const source = window.__pekosoftMetersSource;
    if (!source) return null;

    const analyser = source.analyser || null;
    if (!analyser) return null;

    const analyserLeft = source.analyserLeft || null;
    const analyserRight = source.analyserRight || null;
    const channelCount = Number.isFinite(source.channelCount) ? source.channelCount : (analyserRight ? 2 : 1);
    const sampleRate = Number.isFinite(source.sampleRate) ? source.sampleRate : 44100;

    return {
      analyser,
      analyserLeft,
      analyserRight,
      channelCount,
      sampleRate,
      isActive: typeof source.isActive === 'function' ? source.isActive : null,
      isStopped: typeof source.isStopped === 'function' ? source.isStopped : null,
      palette: getMeterPalette()
    };
  }

  function getPhasescopeGeometry(width, height) {
    const plotTop = Math.min(32, height / 2);
    const plotHeight = Math.max(0, height - plotTop * 2);
    return {
      centerX: width / 2,
      centerY: height / 2,
      radius: Math.max(0, (Math.min(width, plotHeight) - 16) / 2),
      plotTop,
      plotHeight
    };
  }

  function getPhaseCorrelation(left, right) {
    const count = Math.min(left.length, right.length);
    const leftOffset = left.length - count;
    const rightOffset = right.length - count;
    let leftEnergy = 0;
    let rightEnergy = 0;
    let product = 0;
    for (let i = 0; i < count; i++) {
      const l = left[leftOffset + i];
      const r = right[rightOffset + i];
      leftEnergy += l * l;
      rightEnergy += r * r;
      product += l * r;
    }
    const denominator = Math.sqrt(leftEnergy * rightEnergy);
    return denominator > 0 ? Math.max(-1, Math.min(1, product / denominator)) : null;
  }

  function updatePhaseCorrelation(correlation, nowMs = performance.now()) {
    phasescopeState.correlation = correlation;
    phasescopeState.correlationMin = correlation;
    phasescopeState.correlationMax = correlation;
    if (correlation === null) {
      phasescopeState.correlationHistory.length = 0;
      return;
    }
    const history = phasescopeState.correlationHistory;
    while (history.length && history[0].time <= nowMs - 1000) history.shift();
    history.push({ time: nowMs, value: correlation });
    for (const sample of history) {
      phasescopeState.correlationMin = Math.min(phasescopeState.correlationMin, sample.value);
      phasescopeState.correlationMax = Math.max(phasescopeState.correlationMax, sample.value);
    }
  }

  function drawPhasescopeFromData(ctx, width, height, source) {
    const { centerX, centerY, radius, plotTop, plotHeight } = getPhasescopeGeometry(width, height);
    ctx.clearRect(0, 0, width, height);
    drawGuidesBehind('phasescope', ctx, width, height, source);
    const paletteSource = source || { palette: getMeterPalette() };
    if (source && phasescopeState.ready) {
      const count = Math.min(phasescopeState.left.length, phasescopeState.right.length);
      const leftOffset = phasescopeState.left.length - count;
      const rightOffset = phasescopeState.right.length - count;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, plotTop, width, plotHeight);
      ctx.clip();
      ctx.lineWidth = 1;
      if (multicolorOn && radius > 0) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, getMeterColorStyle(source, 0, true));
        gradient.addColorStop(1, getMeterColorStyle(source, 1, true));
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = getMeterColorStyle(source, 0);
      }
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const left = phasescopeState.left[leftOffset + i];
        const right = phasescopeState.right[rightOffset + i];
        const x = centerX + (right - left) * radius / 2;
        const y = centerY - (left + right) * radius / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    const correlation = source && phasescopeState.ready ? phasescopeState.correlation : null;
    const scaleLeft = Math.min(8, width / 2);
    const scaleWidth = Math.max(0, width - scaleLeft * 2);
    const scaleY = Math.max(0, height - 12);
    ctx.save();
    ctx.font = '12px Arial, sans-serif';
    if (guidesOn) {
      ctx.strokeStyle = guideColor;
      ctx.fillStyle = guideColor;
      setCrispGuideStroke(ctx);
      ctx.beginPath();
      ctx.moveTo(scaleLeft, snapGuideCoordinate(scaleY));
      ctx.lineTo(scaleLeft + scaleWidth, snapGuideCoordinate(scaleY));
      for (let i = 0; i <= 10; i++) {
        const x = snapGuideCoordinate(scaleLeft + scaleWidth * i / 10);
        ctx.moveTo(x, scaleY - 3);
        ctx.lineTo(x, scaleY + 4);
      }
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillText('-1', scaleLeft, scaleY - 8);
      ctx.textAlign = 'right';
      ctx.fillText('+1', scaleLeft + scaleWidth, scaleY - 8);
      ctx.textAlign = 'center';
      ctx.fillText('0', centerX, scaleY - 8);
    }
    const value = correlation === null ? '-' : `${correlation >= 0 ? '+' : ''}${correlation.toFixed(2)}`;
    const { primary, secondary } = paletteSource.palette;
    const blue = `rgb(${primary.r}, ${primary.g}, ${primary.b})`;
    const magenta = `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`;
    ctx.fillStyle = blue;
    ctx.textAlign = 'center';
    ctx.fillText(source && phasescopeState.invalidSource
      ? 'Stereo unavailable'
      : width >= 180 ? `Correlation: ${value}` : value, centerX, 16);
    if (correlation !== null) {
      const drawCursor = (value, color) => {
        ctx.fillStyle = color;
        const x = scaleLeft + (value + 1) / 2 * scaleWidth;
        ctx.fillRect(Math.floor(x), scaleY + 1, 1, 8);
      };
      drawCursor(phasescopeState.correlationMin, magenta);
      drawCursor(phasescopeState.correlationMax, magenta);
      drawCursor(correlation, blue);
    }
    ctx.restore();
  }

  function renderPhasescope(ctx, canvas, source) {
    resizeCanvasToDisplaySize(canvas, ctx);
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const stereo = source.channelCount > 1;
    const leftAnalyser = stereo ? source.analyserLeft : source.analyserLeft || source.analyser;
    const rightAnalyser = stereo ? source.analyserRight : leftAnalyser;
    if (!leftAnalyser || !rightAnalyser) {
      if (phasescopeState.invalidSource !== source.analyser) {
        console.error('Meters Phasescope requires separate left and right analysers for stereo audio.');
      }
      phasescopeState.invalidSource = source.analyser;
      phasescopeState.ready = false;
      updatePhaseCorrelation(null);
    } else {
      phasescopeState.invalidSource = null;
      if (phasescopeState.left.length !== leftAnalyser.fftSize) {
        phasescopeState.left = new Float32Array(leftAnalyser.fftSize);
      }
      if (phasescopeState.right.length !== rightAnalyser.fftSize) {
        phasescopeState.right = new Float32Array(rightAnalyser.fftSize);
      }
      leftAnalyser.getFloatTimeDomainData(phasescopeState.left);
      if (stereo) rightAnalyser.getFloatTimeDomainData(phasescopeState.right);
      else phasescopeState.right.set(phasescopeState.left);
      updatePhaseCorrelation(getPhaseCorrelation(phasescopeState.left, phasescopeState.right));
      phasescopeState.ready = true;
    }
    drawPhasescopeFromData(ctx, width, height, source);
  }

  function drawOscilloscopeFromData(ctx, width, height, data, source, shouldCache = false) {
    drawGuidesBehind('oscilloscope', ctx, width, height, source, 0);

    if (shouldCache) {
      pausedFrameState.oscilloscopeData.set(data);
      pausedFrameState.oscilloscopeReady = true;
    }

    ctx.lineWidth = 1;
    const sliceWidth = width / data.length;
    let x = 0;
    for (let i = 1; i < data.length; i++) {
      const previousY = height / 2 - (((data[i - 1] - 128) / 128) * height / 2);
      const y = height / 2 - (((data[i] - 128) / 128) * height / 2);
      const amplitude = Math.abs((data[i] - 128) / 128);
      ctx.strokeStyle = getMeterColorStyle(source, amplitude, true);
      ctx.beginPath();
      ctx.moveTo(x, previousY);
      ctx.lineTo(x + sliceWidth, y);
      ctx.stroke();
      x += sliceWidth;
    }
  }

  function renderOscilloscope(ctx, canvas, analyser, source) {
    resizeCanvasToDisplaySize(canvas, ctx);
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    analyser.getByteTimeDomainData(timeArray);
    let hasSignal = false;
    for (let i = 0; i < timeArray.length; i++) {
      if (Math.abs((timeArray[i] - 128) / 128) >= 0.004) {
        hasSignal = true;
        break;
      }
    }
    if (!hasSignal && !meterNeedsRedraw) return;

    ctx.clearRect(0, 0, width, height);
    if (!hasSignal && pausedFrameState.oscilloscopeReady) {
      drawOscilloscopeFromData(ctx, width, height, pausedFrameState.oscilloscopeData, source, false);
      return;
    }
    drawOscilloscopeFromData(ctx, width, height, timeArray, source, true);
  }

  function drawSpectrumFromData(ctx, width, height, source, data, shouldCache = false) {
    if (shouldCache) {
      pausedFrameState.spectrumReady = true;
    }

    drawGuidesBehind('spectroscope', ctx, width, height, source, 0);

    const barCount = 32;
    const barWidth = width / barCount;
    const minimumFrequencyHz = 20;
    const nyquistFrequencyHz = Math.max(minimumFrequencyHz + 1, (source?.sampleRate || 44100) / 2);
    const frequencyBinWidthHz = shouldCache ? nyquistFrequencyHz / data.length : 0;
    const nowMs = performance.now();
    const elapsedMs = spectrumDisplayState.lastUpdateMs ? nowMs - spectrumDisplayState.lastUpdateMs : 0;
    const release = elapsedMs > 0 ? Math.exp(-elapsedMs / meterReleaseMs) : 0;

    for (let i = 0; i < barCount; i++) {
      const startFrequencyHz = minimumFrequencyHz * Math.pow(nyquistFrequencyHz / minimumFrequencyHz, i / barCount);
      const endFrequencyHz = minimumFrequencyHz * Math.pow(nyquistFrequencyHz / minimumFrequencyHz, (i + 1) / barCount);
      let currentValue = 0;

      if (shouldCache) {
        const startBin = Math.max(0, Math.floor(startFrequencyHz / frequencyBinWidthHz));
        const endBin = Math.min(data.length, Math.max(startBin + 1, Math.ceil(endFrequencyHz / frequencyBinWidthHz)));
        for (let bin = startBin; bin < endBin; bin++) {
          currentValue = Math.max(currentValue, data[bin] / 255);
        }
      }

      const previousValue = spectrumDisplayState.levels[i];
      const value = shouldCache
        ? (currentValue >= previousValue ? currentValue : Math.max(currentValue, previousValue * release))
        : previousValue;
      if (shouldCache) spectrumDisplayState.levels[i] = value < 0.001 ? 0 : value;
      const h = Math.round(value * height);
      const t = i / Math.max(1, barCount - 1);
      ctx.fillStyle = getMeterColorStyle(source, t);
      ctx.fillRect(i * barWidth, height - h, Math.max(1, barWidth - 1), h);
    }

    if (shouldCache) spectrumDisplayState.lastUpdateMs = nowMs;
  }

  function renderSpectrum(ctx, canvas, source) {
    resizeCanvasToDisplaySize(canvas, ctx);
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    if (freqArray.length !== source.analyser.frequencyBinCount) {
      freqArray = new Uint8Array(source.analyser.frequencyBinCount);
    }
    source.analyser.getByteFrequencyData(freqArray);
    ctx.clearRect(0, 0, width, height);
    drawSpectrumFromData(ctx, width, height, source, freqArray, true);
  }

  function renderWavescope(ctx, canvas, source, sampleLive = true) {
    resizeCanvasToDisplaySize(canvas, ctx);
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    const pixelWidth = Math.max(1, Math.floor(width));
    if (wavescopeState.width !== pixelWidth) {
      resizeWavescopeHistory(pixelWidth);
    }
    if (!sampleLive) {
      drawWavescopeFromHistory(ctx, width, height, source);
      return;
    }

    (source.analyserLeft || source.analyser).getByteTimeDomainData(timeArray);
    if (source.channelCount > 1 && source.analyserRight) {
      source.analyserRight.getByteTimeDomainData(timeArrayR);
    }

    const nowMs = performance.now();
    const pushIntervalMs = 1000 / wavescopeState.sampleRateHz;
    const elapsedMs = wavescopeState.lastPushMs ? (nowMs - wavescopeState.lastPushMs) : pushIntervalMs;
    const elapsedPushCount = Math.floor(elapsedMs / pushIntervalMs);
    const pushCount = Math.min(8, elapsedPushCount);

    const getMinMaxNormalized = (array) => {
      let min = 255;
      let max = 0;
      for (let i = 0; i < array.length; i++) {
        const v = array[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      return {
        min: (min - 128) / 128,
        max: (max - 128) / 128
      };
    };

    const minMaxL = getMinMaxNormalized(timeArray);
    const minMaxR = source.channelCount > 1 && source.analyserRight
      ? getMinMaxNormalized(timeArrayR)
      : minMaxL;

    const silenceLevel = Math.max(
      Math.abs(minMaxL.min),
      Math.abs(minMaxL.max),
      Math.abs(minMaxR.min),
      Math.abs(minMaxR.max)
    );
    const isSilent = silenceLevel < 0.004;

    // Smoothed min/max gives a readable zoomed-out scrolling capture.
    wavescopeState.smoothMinL = (wavescopeState.smoothMinL * 0.82) + (minMaxL.min * 0.18);
    wavescopeState.smoothMaxL = (wavescopeState.smoothMaxL * 0.82) + (minMaxL.max * 0.18);
    wavescopeState.smoothMinR = (wavescopeState.smoothMinR * 0.82) + (minMaxR.min * 0.18);
    wavescopeState.smoothMaxR = (wavescopeState.smoothMaxR * 0.82) + (minMaxR.max * 0.18);

    if (!isSilent) {
      for (let i = 0; i < pushCount; i++) {
        wavescopeState.historyMinL.shift();
        wavescopeState.historyMinL.push(wavescopeState.smoothMinL);
        wavescopeState.historyMaxL.shift();
        wavescopeState.historyMaxL.push(wavescopeState.smoothMaxL);
        wavescopeState.historyMinR.shift();
        wavescopeState.historyMinR.push(wavescopeState.smoothMinR);
        wavescopeState.historyMaxR.shift();
        wavescopeState.historyMaxR.push(wavescopeState.smoothMaxR);
      }
    }
    wavescopeState.lastPushMs = isSilent || !wavescopeState.lastPushMs
      ? nowMs
      : wavescopeState.lastPushMs + elapsedPushCount * pushIntervalMs;

    drawWavescopeFromHistory(ctx, width, height, source);
  }

  function drawWavescopeFromHistory(ctx, width, height, source) {
    ctx.clearRect(0, 0, width, height);
    drawGuidesBehind('wavescope', ctx, width, height, source, 0);

    const isStereo = source.channelCount > 1;
    const lanes = isStereo
      ? [
        { centerY: height * 0.25, historyMin: wavescopeState.historyMinL, historyMax: wavescopeState.historyMaxL },
        { centerY: height * 0.75, historyMin: wavescopeState.historyMinR, historyMax: wavescopeState.historyMaxR }
      ]
      : [{ centerY: height * 0.5, historyMin: wavescopeState.historyMinL, historyMax: wavescopeState.historyMaxL }];
    const laneAmplitude = isStereo ? (height * 0.18) : (height * 0.5);

    const hasRenderableSamples = lanes.some((lane) => {
      for (let i = 0; i < lane.historyMin.length; i++) {
        if (lane.historyMin[i] !== null && lane.historyMax[i] !== null) {
          return true;
        }
      }
      return false;
    });

    // Keep previous Wavescope frame when there is no current sample data,
    // so resize/idle transitions do not blank the view.
    if (!hasRenderableSamples) {
      return;
    }

    lanes.forEach((lane) => {
      // Opaque body with --color1 only (no alpha and no outline).
      // Draw each contiguous sample run as its own polygon so separate hits do not bridge.
      const segments = [];
      let segmentTop = [];
      let segmentBottom = [];

      for (let x = 0; x < lane.historyMin.length; x++) {
        const minValue = lane.historyMin[x];
        const maxValue = lane.historyMax[x];
        const hasSample = minValue !== null && maxValue !== null;

        if (!hasSample) {
          if (segmentTop.length > 0) {
            segments.push({ top: segmentTop, bottom: segmentBottom });
            segmentTop = [];
            segmentBottom = [];
          }
          continue;
        }

        const yMax = lane.centerY - (maxValue * laneAmplitude);
        const yMin = lane.centerY - (minValue * laneAmplitude);
        segmentTop.push({ x, y: yMax });
        segmentBottom.push({ x, y: yMin });
      }

      if (segmentTop.length > 0) {
        segments.push({ top: segmentTop, bottom: segmentBottom });
      }

      if (!segments.length) return;

      segments.forEach((segment) => {
        for (let i = 1; i < segment.top.length; i++) {
          const amplitude = Math.max(
            Math.abs(segment.top[i].y - lane.centerY),
            Math.abs(segment.bottom[i].y - lane.centerY)
          ) / laneAmplitude;
          ctx.fillStyle = getMeterColorStyle(source, amplitude, true);
          ctx.beginPath();
          ctx.moveTo(segment.top[i - 1].x, segment.top[i - 1].y);
          ctx.lineTo(segment.top[i].x, segment.top[i].y);
          ctx.lineTo(segment.bottom[i].x, segment.bottom[i].y);
          ctx.lineTo(segment.bottom[i - 1].x, segment.bottom[i - 1].y);
          ctx.closePath();
          ctx.fill();
        }
      });
    });
  }

  function drawLevelFromValues(ctx, width, height, source, left, right, channels, shouldCache = false) {
    if (shouldCache) {
      pausedFrameState.levelReady = true;
      pausedFrameState.levelLeft = left;
      pausedFrameState.levelRight = right;
      pausedFrameState.levelChannels = channels;
    }

    drawGuidesBehind('level', ctx, width, height, source, 0);

    const gap = channels > 1 ? 4 : 0;
    const barHeight = Math.max(1, Math.floor((height - gap * (channels - 1)) / channels));

    const leftWidth = Math.round(width * left);
    const rightWidth = Math.round(width * right);

    const drawChannel = (top, valueWidth) => {
      if (!valueWidth) return;
      if (!multicolorOn) {
        ctx.fillStyle = getMeterColorStyle(source, 0);
        ctx.fillRect(0, top, valueWidth, barHeight);
        return;
      }
      const gradient = ctx.createLinearGradient(0, top, width, top);
      gradient.addColorStop(0, getMeterColorStyle(source, 0, true));
      gradient.addColorStop(1, getMeterColorStyle(source, 1, true));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, top, valueWidth, barHeight);
    };

    drawChannel(0, leftWidth);

    if (channels > 1) {
      drawChannel(barHeight + gap, rightWidth);
    }
  }

  function renderLevel(ctx, canvas, source) {
    resizeCanvasToDisplaySize(canvas, ctx);
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    const getRms = (analyser) => {
      analyser.getByteTimeDomainData(timeArray);
      let sum = 0;
      for (let i = 0; i < timeArray.length; i++) {
        const centered = (timeArray[i] - 128) / 128;
        sum += centered * centered;
      }
      return Math.sqrt(sum / timeArray.length);
    };

    const currentLeft = getRms(source.analyserLeft || source.analyser);
    const currentRight = source.channelCount > 1 && source.analyserRight ? getRms(source.analyserRight) : currentLeft;
    const nowMs = performance.now();
    const elapsedMs = levelDisplayState.lastUpdateMs ? nowMs - levelDisplayState.lastUpdateMs : 0;
    const release = elapsedMs > 0 ? Math.exp(-elapsedMs / meterReleaseMs) : 0;
    const left = currentLeft >= levelDisplayState.left ? currentLeft : Math.max(currentLeft, levelDisplayState.left * release);
    const right = currentRight >= levelDisplayState.right ? currentRight : Math.max(currentRight, levelDisplayState.right * release);
    levelDisplayState.left = left < 0.001 ? 0 : left;
    levelDisplayState.right = right < 0.001 ? 0 : right;
    levelDisplayState.lastUpdateMs = nowMs;

    const channels = source.channelCount > 1 ? 2 : 1;

    ctx.clearRect(0, 0, width, height);
    drawLevelFromValues(ctx, width, height, source, levelDisplayState.left, levelDisplayState.right, channels, true);
  }

  function clearMeterFrame(modeToClear = activeMode) {
    if (frozen) return;
    if (modeToClear === 'phasescope') {
      phasescopeState.ready = false;
      updatePhaseCorrelation(null);
      phasescopeState.invalidSource = null;
      meterNeedsRedraw = true;
    }
    if (modeToClear === 'wavescope') {
      const wavescopeCanvas = canvasByMode.wavescope;
      const wavescopeWidth = wavescopeCanvas
        ? (wavescopeCanvas.width / (window.devicePixelRatio || 1) || wavescopeCanvas.clientWidth || 0)
        : 0;
      resetWavescopeHistory(wavescopeWidth);
    }

    const canvas = canvasByMode[modeToClear];
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      resizeCanvasToDisplaySize(canvas, ctx);
      const width = canvas.width / (window.devicePixelRatio || 1) || canvas.clientWidth;
      const height = canvas.height / (window.devicePixelRatio || 1) || canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);
    }
  }

  function drawGuidesBehind(mode, ctx, width, height, source) {
    if (!guidesOn) {
      return;
    }

    if (mode === 'phasescope') {
      const { centerX, centerY, radius } = getPhasescopeGeometry(width, height);
      const diagonal = radius * Math.SQRT1_2;
      ctx.save();
      ctx.strokeStyle = guideColor;
      setCrispGuideStroke(ctx);
      ctx.beginPath();
      const x = snapGuideCoordinate(centerX);
      const y = snapGuideCoordinate(centerY);
      ctx.moveTo(centerX - radius, y);
      ctx.lineTo(centerX + radius, y);
      ctx.moveTo(x, centerY - radius);
      ctx.lineTo(x, centerY + radius);
      ctx.moveTo(centerX - diagonal, centerY - diagonal);
      ctx.lineTo(centerX + diagonal, centerY + diagonal);
      ctx.moveTo(centerX - diagonal, centerY + diagonal);
      ctx.lineTo(centerX + diagonal, centerY - diagonal);
      ctx.stroke();
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = guideColor;
      ctx.textAlign = 'left';
      ctx.fillText('L', centerX - radius, centerY - radius + 12);
      ctx.textAlign = 'right';
      ctx.fillText('R', centerX + radius, centerY - radius + 12);
      ctx.restore();
      drawBrightGuideBoundary(ctx, width, height);
      return;
    }

    const ticks = getMeterTicks(mode, width, height, source);
    ctx.save();
    ctx.strokeStyle = guideColor;
    setCrispGuideStroke(ctx);
    ticks.horizontal.forEach(({ position }) => {
      if (rulersOn && position === 0) return;
      const x = snapGuideCoordinate(position + 0.5);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });
    ticks.vertical.forEach(({ position }) => {
      if (rulersOn && mode !== 'level' && position === 0) return;
      const y = snapGuideCoordinate(position + 0.5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });
    ctx.restore();
    drawBrightGuideBoundary(ctx, width, height);
  }

  function drawIdleMeterFrame(canvas, ctx, source) {
    if (activeMode === 'phasescope') {
      resizeCanvasToDisplaySize(canvas, ctx);
      drawPhasescopeFromData(
        ctx,
        canvas.width / (window.devicePixelRatio || 1),
        canvas.height / (window.devicePixelRatio || 1),
        source
      );
      return;
    }
    if (source && activeMode === 'wavescope') {
      renderWavescope(ctx, canvas, source, !frozen);
      return;
    }

    resizeCanvasToDisplaySize(canvas, ctx);
    const width = canvas.width / (window.devicePixelRatio || 1) || canvas.clientWidth;
    const height = canvas.height / (window.devicePixelRatio || 1) || canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    if (!source) {
      drawGuidesBehind(activeMode, ctx, width, height, null);
      return;
    }

    if (activeMode === 'oscilloscope' && pausedFrameState.oscilloscopeReady) {
      drawOscilloscopeFromData(ctx, width, height, pausedFrameState.oscilloscopeData, source, false);
    } else if (activeMode === 'spectroscope' && pausedFrameState.spectrumReady) {
      drawSpectrumFromData(ctx, width, height, source, null, false);
    } else if (activeMode === 'level' && pausedFrameState.levelReady) {
      drawLevelFromValues(
        ctx,
        width,
        height,
        source,
        pausedFrameState.levelLeft,
        pausedFrameState.levelRight,
        pausedFrameState.levelChannels,
        false
      );
    } else {
      drawGuidesBehind(activeMode, ctx, width, height, source);
    }
  }

  function redrawMeterFrame() {
    const source = frozen
      ? (frozenSource ? { ...frozenSource, palette: getMeterPalette() } : null)
      : getSourceConfig();
    drawMeterRulers(source);
    const canvas = canvasByMode[activeMode];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawIdleMeterFrame(canvas, ctx, source);
    if (guidesOn) {
      const width = canvas.width / (window.devicePixelRatio || 1) || canvas.clientWidth;
      const height = canvas.height / (window.devicePixelRatio || 1) || canvas.clientHeight;
      drawBrightGuideBoundary(ctx, width, height);
    }
    meterNeedsRedraw = false;
  }

  const meterFrameIntervalMs = 1000 / 60;
  let lastMeterFrameMs = 0;

  function tick(timestamp) {
    if (frozen) {
      if (meterNeedsRedraw) redrawMeterFrame();
      requestAnimationFrame(tick);
      return;
    }
    const elapsedMs = timestamp - lastMeterFrameMs;
    if (lastMeterFrameMs && elapsedMs < meterFrameIntervalMs) {
      requestAnimationFrame(tick);
      return;
    }
    lastMeterFrameMs = timestamp - (elapsedMs % meterFrameIntervalMs);

    const source = getSourceConfig();
    drawMeterRulers(source);
    const sourceIsActive = Boolean(source && (!source.isActive || source.isActive()));
    const releaseIsActive = Boolean(source && !sourceIsActive && (
      (activeMode === 'spectroscope' && spectrumDisplayState.levels.some((value) => value > 0))
      || (activeMode === 'level' && (levelDisplayState.left > 0 || levelDisplayState.right > 0))
    ));
    const meterIsActive = sourceIsActive || releaseIsActive;
    const activityEnded = wasMeterActive && !meterIsActive;
    if (activityEnded) wavescopeState.lastPushMs = 0;
    const canvas = canvasByMode[activeMode];
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (!meterIsActive) {
          if (meterNeedsRedraw || activityEnded) {
            drawIdleMeterFrame(canvas, ctx, source);
            meterNeedsRedraw = false;
          }
        } else {
          if (activeMode === 'oscilloscope') {
            renderOscilloscope(ctx, canvas, source.analyser, source);
          } else if (activeMode === 'wavescope') {
            renderWavescope(ctx, canvas, source);
          } else if (activeMode === 'spectroscope') {
            renderSpectrum(ctx, canvas, source);
          } else if (activeMode === 'level') {
            renderLevel(ctx, canvas, source);
          } else if (activeMode === 'phasescope') {
            renderPhasescope(ctx, canvas, source);
          }
          meterNeedsRedraw = false;
        }

        if (guidesOn) {
          const width = canvas.width / (window.devicePixelRatio || 1) || canvas.clientWidth;
          const height = canvas.height / (window.devicePixelRatio || 1) || canvas.clientHeight;
          drawBrightGuideBoundary(ctx, width, height);
        }
      }
    }
    wasMeterActive = meterIsActive;
    requestAnimationFrame(tick);
  }

  Object.entries(buttonByMode).forEach(([mode, button]) => {
    if (!button) return;
    button.addEventListener('click', () => applyMode(mode));
  });

  if (guidesButton) {
    guidesButton.addEventListener('click', () => applyGuides(!guidesOn));
  }

  if (brightButton) {
    brightButton.addEventListener('click', () => applyBright(!brightGuides));
  }

  if (colorButton) {
    colorButton.addEventListener('click', () => applyMulticolor(!multicolorOn));
  }

  rulersButton.addEventListener('click', () => applyRulers(!rulersOn));
  freezeButton.addEventListener('click', () => applyFreeze(!frozen));
  crosshairButton.addEventListener('click', () => applyCrosshair(!crosshairOn));
  saveButton.addEventListener('click', () => {
    try {
      const bitmap = buildMeterBitmap();
      const now = new Date();
      const date = [now.getDate(), now.getMonth() + 1, now.getFullYear()].map(value => String(value).padStart(2, '0')).join('-');
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(value => String(value).padStart(2, '0')).join('-');
      triggerDownloadFromCanvas(bitmap, `${release}_meters_${activeMode}_${date}_${time}.png`);
    } catch (error) {
      console.warn('Meters bitmap save failed:', error);
    }
  });
  copyButton.addEventListener('click', async () => {
    try {
      await copyBitmapToClipboard(buildMeterBitmap());
    } catch (error) {
      console.warn('Meters bitmap copy failed:', error);
    }
  });
  meterPlot.addEventListener('pointerdown', moveCrosshair);
  meterPlot.addEventListener('pointerenter', moveCrosshair);
  meterPlot.addEventListener('pointermove', moveCrosshair);
  meterPlot.addEventListener('pointerleave', leaveCrosshair);
  meterPlot.addEventListener('pointercancel', clearCrosshair);
  window.addEventListener('blur', clearCrosshair);
  window.addEventListener('scroll', updateCrosshair, true);

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(() => {
      meterNeedsRedraw = true;
      updateCrosshair();
    });
    Object.values(canvasByMode).forEach((canvas) => {
      if (canvas) resizeObserver.observe(canvas);
    });
  } else {
    window.addEventListener('resize', () => {
      meterNeedsRedraw = true;
      updateCrosshair();
    });
  }

  const themeObserver = new MutationObserver(() => {
    meterPalette = null;
    meterNeedsRedraw = true;
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('pekosoft:bright-guides-global-change', (event) => {
    applyBright(event.detail?.enabled, false);
  });

  window.addEventListener('pekosoft:multicolor-global-change', (event) => {
    applyMulticolor(event.detail?.enabled, false);
  });

  window.addEventListener('pekosoft:rulers-global-change', (event) => {
    applyRulers(event.detail?.enabled, false);
  });

  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      localStorage.removeItem(`${storagePrefix}.crosshair`);
      applyCrosshair(false, false);
      applyFreeze(false);
      clearMeterFrame('wavescope');
      clearMeterFrame('phasescope');
    });
  }

  applyMode(activeMode);
  applyGuides(guidesOn);
  applyBright(brightGuides);
  applyRulers(rulersOn, false);
  applyMulticolor(multicolorOn, false);
  applyCrosshair(crosshairOn, false);
  window.__pekosoftClearMeterFrame = clearMeterFrame;
  requestAnimationFrame(tick);
})();

// END OF FILE
