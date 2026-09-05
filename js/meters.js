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
    wavescope: document.getElementById('wavescope')
  };

  const buttonByMode = {
    spectroscope: document.getElementById('tool-spectroscope-button'),
    level: document.getElementById('tool-level-button'),
    oscilloscope: document.getElementById('tool-oscilloscope-button'),
    wavescope: document.getElementById('tool-wavescope-button')
  };

  const guidesButton = document.getElementById('tool-guides-button');
  const brightButton = document.getElementById('tool-bright-button');
  const colorButton = document.getElementById('tool-color-button');
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
  const guideLabelInset = 6;
  const guideLabelHeight = 10;
  const guideLabelGap = 4;
  const guideGridLeft = 32;
  const guideGridTop = guideLabelInset + guideLabelHeight + guideLabelGap;

  function snapGuideCoordinate(value) {
    const dpr = window.devicePixelRatio || 1;
    return (Math.round((value * dpr) - 0.5) + 0.5) / dpr;
  }

  function setCrispGuideStroke(ctx) {
    ctx.lineWidth = 1 / (window.devicePixelRatio || 1);
  }

  function drawToolGuideLabel(ctx, text, x, y, align = 'left', bounds = null) {
    ctx.save();
    ctx.font = '10px Arial';
    const textWidth = ctx.measureText(text).width;
    const minX = guideLabelInset;
    const minY = guideLabelInset;
    const maxY = bounds ? Math.max(minY, bounds.height - guideLabelHeight - guideLabelInset) : y;
    const safeY = Math.max(minY, Math.min(maxY, y));

    let safeAlign = align;
    let safeX = x;

    if (bounds) {
      const maxTextRight = Math.max(minX, bounds.width - 6);
      if (safeAlign === 'left') {
        safeX = Math.max(minX, Math.min(maxTextRight - textWidth, x));
      } else if (safeAlign === 'right') {
        const minRight = minX + textWidth;
        safeX = Math.max(minRight, Math.min(maxTextRight, x));
      } else {
        const half = textWidth / 2;
        const minCenter = minX + half;
        const maxCenter = maxTextRight - half;
        safeX = Math.max(minCenter, Math.min(maxCenter, x));
      }
    }

    ctx.textAlign = safeAlign;
    ctx.textBaseline = 'top';
    ctx.fillStyle = guideColor;
    ctx.fillText(text, safeX, safeY);
    ctx.restore();
  }

  function drawHorizontalGuideLabel(ctx, text, y, width, height) {
    const labelY = y <= guideLabelInset
      ? Math.round(y) + guideLabelGap
      : Math.round(y) - guideLabelHeight - guideLabelGap;
    drawToolGuideLabel(
      ctx,
      text,
      guideGridLeft - guideLabelGap,
      labelY,
      'right',
      { width, height }
    );
  }

  function drawVerticalGuideLabel(ctx, text, x, width, height) {
    drawToolGuideLabel(ctx, text, Math.round(x) + guideLabelGap, guideLabelInset, 'left', { width, height });
  }

  function frequencyToSpectrumX(freqHz, width, sampleRate) {
    const fMin = 20;
    const nyquist = Math.max(fMin + 1, sampleRate / 2);
    if (freqHz <= fMin) return 0;
    if (freqHz >= nyquist) return width;
    return width * Math.log(freqHz / fMin) / Math.log(nyquist / fMin);
  }

  function drawWaveformDbScale(ctx, width, height, centerY, amplitude) {
    const minusSixDbGain = Math.pow(10, -6 / 20);
    const marks = [
      { label: '0 dB', offset: -1 },
      { label: '-6 dB', offset: -minusSixDbGain },
      { label: '-∞', offset: 0 },
      { label: '-6 dB', offset: minusSixDbGain },
      { label: '0 dB', offset: 1 }
    ];
    ctx.save();
    ctx.strokeStyle = guideColor;
    setCrispGuideStroke(ctx);
    marks.slice(1, -1).forEach(({ offset }) => {
      const y = snapGuideCoordinate(centerY + (offset * amplitude));
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });
    ctx.restore();

    marks.forEach(({ label, offset }) => {
      drawHorizontalGuideLabel(ctx, label, centerY + (offset * amplitude), width, height);
    });
  }

  function drawWaveformValueSeparator(ctx, height) {
    const x = snapGuideCoordinate(guideGridLeft);
    ctx.save();
    ctx.strokeStyle = guideColor;
    setCrispGuideStroke(ctx);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.restore();
  }

  function drawToolGuidesForOscilloscope(ctx, width, height) {
    drawWaveformValueSeparator(ctx, height);
    drawWaveformDbScale(ctx, width, height, height / 2, height / 2);
  }

  function drawToolGuidesForLevelMeter(ctx, width, height, channelCount) {
    const dBMarks = [-60, -40, -24, -12, -6, 0];
    const gap = channelCount > 1 ? 4 : 0;
    const barH = Math.floor((height - gap * (channelCount - 1)) / channelCount);
    ctx.save();
    ctx.strokeStyle = guideColor;
    setCrispGuideStroke(ctx);

    ctx.font = '10px Arial';
    let lastLabelRight = -Infinity;
    const minLabelGap = 4;

    dBMarks.forEach((db) => {
      const amplitude = Math.pow(10, db / 20);
      const x = snapGuideCoordinate(width * amplitude);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const label = `${db} dB`;
      const labelWidth = ctx.measureText(label).width;
      const labelRight = x - guideLabelGap;
      const labelLeft = labelRight - labelWidth;
      if (labelLeft >= lastLabelRight + minLabelGap || db === 0) {
        drawVerticalGuideLabel(ctx, label, x, width, height);
        lastLabelRight = labelRight;
      }
    });

    const splitY = channelCount > 1
      ? snapGuideCoordinate(barH + gap / 2)
      : snapGuideCoordinate(height / 2);
    ctx.beginPath();
    ctx.moveTo(0, splitY);
    ctx.lineTo(width, splitY);
    ctx.stroke();

    ctx.restore();
  }

  function drawToolGuidesForSpectrum(ctx, width, height, sampleRate) {
    const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    const dBMarks = [-60, -48, -36, -24, -12, 0];
    ctx.save();
    ctx.strokeStyle = guideColor;
    setCrispGuideStroke(ctx);

    dBMarks.forEach((db) => {
      const ratio = (db + 60) / 60;
      const rawY = snapGuideCoordinate(height - (Math.max(0, Math.min(1, ratio)) * height));
      const y = db === 0 ? guideGridTop : rawY;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      drawHorizontalGuideLabel(ctx, `${db}`, y, width, height);
    });

    freqs.forEach((freq) => {
      const rawX = snapGuideCoordinate(frequencyToSpectrumX(freq, width, sampleRate));
      const x = freq === 20 ? guideGridLeft : rawX;
      const label = freq >= 1000 ? `${(freq / 1000).toFixed(freq >= 10000 ? 0 : 1)}k` : `${freq}`;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      drawVerticalGuideLabel(ctx, label, x, width, height);
    });

    ctx.restore();
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

    const remap = (source) => {
      if (!oldSize || !Array.isArray(source) || !source.length) {
        return new Array(newSize).fill(null);
      }

      const result = new Array(newSize);
      const denom = Math.max(1, newSize - 1);
      const sourceDenom = Math.max(1, oldSize - 1);

      for (let i = 0; i < newSize; i++) {
        const t = i / denom;
        const sourceIndex = Math.round(t * sourceDenom);
        result[i] = source[Math.max(0, Math.min(oldSize - 1, sourceIndex))];
      }
      return result;
    };

    wavescopeState.width = newSize;
    wavescopeState.historyMinL = remap(oldMinL);
    wavescopeState.historyMaxL = remap(oldMaxL);
    wavescopeState.historyMinR = remap(oldMinR);
    wavescopeState.historyMaxR = remap(oldMaxR);
  }

  let activeMode = getSavedMode();
  if (!availableModes.includes(activeMode)) {
    activeMode = availableModes[0];
  }

  let guidesOn = getSavedGuides();
  let brightGuides = getSavedBright();
  let multicolorOn = getSavedMulticolor();
  let meterNeedsRedraw = true;
  let wasMeterActive = false;
  let meterPalette = null;
  const meterReleaseMs = 350;

  function applyMode(nextMode) {
    if (!availableModes.includes(nextMode)) return;
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

  function drawOscilloscopeFromData(ctx, width, height, data, source, shouldCache = false) {
    drawGuidesBehind('oscilloscope', ctx, width, height, null, 0);

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

  function renderWavescope(ctx, canvas, source) {
    resizeCanvasToDisplaySize(canvas, ctx);
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    source.analyser.getByteTimeDomainData(timeArray);
    if (source.channelCount > 1 && source.analyserRight) {
      source.analyserRight.getByteTimeDomainData(timeArrayR);
    }

    const pixelWidth = Math.max(1, Math.floor(width));
    if (wavescopeState.width !== pixelWidth) {
      resizeWavescopeHistory(pixelWidth);
    }

    const nowMs = performance.now();
    const pushIntervalMs = 1000 / wavescopeState.sampleRateHz;
    const elapsedMs = wavescopeState.lastPushMs ? (nowMs - wavescopeState.lastPushMs) : pushIntervalMs;
    const pushCount = Math.max(1, Math.min(8, Math.floor(elapsedMs / pushIntervalMs)));

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
    wavescopeState.lastPushMs = nowMs;

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

    if (mode === 'oscilloscope') {
      drawToolGuidesForOscilloscope(ctx, width, height);
      return;
    }

    if (mode === 'wavescope') {
      const isStereo = (source?.channelCount || 1) > 1;
      const lanes = isStereo
        ? [{ label: 'L', center: 0.25 }, { label: 'R', center: 0.75 }]
        : [{ label: '', center: 0.5 }];
      const laneAmplitude = isStereo ? 0.18 : 0.5;

      drawWaveformValueSeparator(ctx, height);
      lanes.forEach(({ label, center }) => {
        drawWaveformDbScale(ctx, width, height, height * center, height * laneAmplitude);
        if (label) {
          drawToolGuideLabel(ctx, label, width - 8, Math.round(height * center) - 6, 'right', { width, height });
        }
      });
      return;
    }

    if (mode === 'spectroscope') {
      const sampleRate = source?.sampleRate || 44100;
      drawToolGuidesForSpectrum(ctx, width, height, sampleRate);
      return;
    }

    if (mode === 'level') {
      const channelCount = source?.channelCount || 2;
      drawToolGuidesForLevelMeter(ctx, width, height, channelCount);
    }
  }

  function drawIdleMeterFrame(canvas, ctx, source) {
    if (source && activeMode === 'wavescope') {
      renderWavescope(ctx, canvas, source);
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
    const source = getSourceConfig();
    const canvas = canvasByMode[activeMode];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawIdleMeterFrame(canvas, ctx, source);
    meterNeedsRedraw = false;
  }

  const meterFrameIntervalMs = 1000 / 60;
  let lastMeterFrameMs = 0;

  function tick(timestamp) {
    const elapsedMs = timestamp - lastMeterFrameMs;
    if (lastMeterFrameMs && elapsedMs < meterFrameIntervalMs) {
      requestAnimationFrame(tick);
      return;
    }
    lastMeterFrameMs = timestamp - (elapsedMs % meterFrameIntervalMs);

    const source = getSourceConfig();
    const sourceIsActive = Boolean(source && (!source.isActive || source.isActive()));
    const releaseIsActive = Boolean(source && !sourceIsActive && (
      (activeMode === 'spectroscope' && spectrumDisplayState.levels.some((value) => value > 0))
      || (activeMode === 'level' && (levelDisplayState.left > 0 || levelDisplayState.right > 0))
    ));
    const meterIsActive = sourceIsActive || releaseIsActive;
    const activityEnded = wasMeterActive && !meterIsActive;
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
          }
          meterNeedsRedraw = false;
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

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(() => {
      meterNeedsRedraw = true;
    });
    Object.values(canvasByMode).forEach((canvas) => {
      if (canvas) resizeObserver.observe(canvas);
    });
  } else {
    window.addEventListener('resize', () => {
      meterNeedsRedraw = true;
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

  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      clearMeterFrame('wavescope');
    });
  }

  applyMode(activeMode);
  applyGuides(guidesOn);
  applyBright(brightGuides);
  applyMulticolor(multicolorOn, false);
  window.__pekosoftClearMeterFrame = clearMeterFrame;
  requestAnimationFrame(tick);
})();
