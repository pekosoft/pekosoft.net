// Pekosoft BPM Curve
// pekosoft.net/js/bpm_curve.js

window.addEventListener('DOMContentLoaded', () => {
  new BPMCurve();
});

class BPMCurve {
  constructor() {
    this.svg = document.getElementById('curve-svg');
    this.gridLayer = document.getElementById('curve-grid');
    this.curveLine = document.getElementById('curve-line');
    this.playhead = document.getElementById('curve-playhead');
    this.pointsLayer = document.getElementById('curve-points');
    this.labelsLayer = document.getElementById('curve-labels');
    this.statusText = document.getElementById('curve-status');
    this.infoText = document.querySelector('.info-text');

    this.playButton = document.getElementById('play-button');
    this.stopButton = document.getElementById('stop-button');
    this.loopButton = document.getElementById('loop-button');
    this.soundButton = document.getElementById('sound-button');
    this.beatSoundButton = document.getElementById('beat-sound-button');
    this.toneButton = document.getElementById('tone-button');
    this.beatsButton = document.getElementById('beats-button');
    this.addPointButton = document.getElementById('add-point-button');
    this.removePointButton = document.getElementById('remove-point-button');
    this.resetButton = document.getElementById('reset-button');
    this.copyButton = document.getElementById('copy-button');
    this.guidesButton = document.getElementById('guides-button');
    this.timelineGuidesButton = document.getElementById('timeline-guides-button');
    this.timelineBrightButton = document.getElementById('timeline-bright-button');
    this.panelValuesButton = document.getElementById('panel-values-button');
    this.panelCurveButton = document.getElementById('panel-curve-button');
    this.toggleValuesButton = document.getElementById('toggle-values-button');
    this.prevPointButton = document.getElementById('prev-point-button');
    this.nextPointButton = document.getElementById('next-point-button');
    this.undoButton = document.getElementById('undo-button');
    this.redoButton = document.getElementById('redo-button');
    this.selectAllPointsButton = document.getElementById('select-all-points-button');
    this.selectNoPointsButton = document.getElementById('select-no-points-button');
    this.moveUpButton = document.getElementById('move-up-button');
    this.moveDownButton = document.getElementById('move-down-button');
    this.moveLeftButton = document.getElementById('move-left-button');
    this.moveRightButton = document.getElementById('move-right-button');
    this.copySvgButton = document.getElementById('copy-svg-button');
    this.saveSvgButton = document.getElementById('save-svg-button');

    this.bpmOutput = document.getElementById('bpm-output');
    this.beatsOutput = document.getElementById('beats-output');
    this.pointsOutput = document.getElementById('points-output');
    this.positionInput = document.getElementById('position-input');
    this.hzInput = document.getElementById('hz-input');
    this.durationInput = document.getElementById('duration-input');
    this.beatSelect = document.getElementById('beat-sound-type');
    this.toneSelect = document.getElementById('tone-type');
    this.curveSelect = document.getElementById('curve-select');
    this.beatVolumeSlider = document.getElementById('beat-volume-slider');
    this.beatVolumeDecreaseButton = document.getElementById('beat-volume-decrease-button');
    this.beatVolumeIncreaseButton = document.getElementById('beat-volume-increase-button');
    this.toneVolumeSlider = document.getElementById('tone-volume-slider');
    this.toneVolumeDecreaseButton = document.getElementById('tone-volume-decrease-button');
    this.toneVolumeIncreaseButton = document.getElementById('tone-volume-increase-button');

    this.timelineSvg = document.getElementById('curve-timeline-svg');
    this.timelineContainer = document.getElementById('timeline-container');
    this.timelineWidth = 4096;
    this.timelineMinHeight = 256;
    this.svgUtils = window.PekoSvgUtils;
    this.svgTimeline = window.PekoSvgTimeline;
    this.timelineResizeObserver = null;

    this.svgWidth = 960;
    this.svgHeight = 520;
    this.padding = { top: 24, right: 28, bottom: 64, left: 60 };
    this.minBpm = 0;
    this.maxBpm = 280;
    this.defaultDuration = 10;
    this.defaultHz = 440;
    this.defaultBeatTone = 'click';
    this.defaultTone = 'sine';
    this.defaultCurve = 'sinusoid';
    this.defaultBeatVolume = 100;
    this.defaultToneVolume = 100;
    this.referenceHz = this.defaultHz;

    this.playPosition = 0;
    this.isPlaying = false;
    this.isLoopEnabled = true;
    this.isSoundEnabled = true;
    this.isBeatSoundEnabled = true;
    this.isToneEnabled = false;
    this.beatVolume = this.defaultBeatVolume;
    this.toneVolume = this.defaultToneVolume;
    this.isBeatsVisible = localStorage.getItem('bpm_curve.beats') === 'true';
    this.isValuesVisible = true;
    this.isAllPointsSelected = false;
    this.panelView = localStorage.getItem('bpm_curve.panel_view') === 'curve' ? 'curve' : 'values';
    this.isGuidesVisible = localStorage.getItem('bpm_curve.guides') === null
      ? localStorage.getItem('global.guides') !== 'false'
      : localStorage.getItem('bpm_curve.guides') === 'true';
    this.isTimelineGuidesVisible = localStorage.getItem('bpm_curve.timeline_guides') === null
      ? localStorage.getItem('global.guides') !== 'false'
      : localStorage.getItem('bpm_curve.timeline_guides') === 'true';
    this.isTimelineBright = localStorage.getItem('bpm_curve.timeline_bright') === null
      ? (window.PekoBrightGuides?.getGlobal() || false)
      : localStorage.getItem('bpm_curve.timeline_bright') === 'true';
    this.audioContext = null;
    this.metersAnalyser = null;
    this.masterMuteGainNode = null;
    this.metersLastActiveSec = 0;
    this.toneVoiceState = {};
    this.animationFrame = null;
    this.playStartedAt = 0;
    this.lastPlaybackPosition = 0;
    this.pointIdSeed = 1;
    this.selectedPointId = null;
    this.points = this.createDefaultPoints();
    this.undoStack = [];
    this.redoStack = [];
    this.historyLimit = 120;
    this.isApplyingHistory = false;
    this.holdIntervalId = null;
    this.holdTimeoutId = null;
    this.activeHoldButton = null;
    this.lastPointTapId = null;
    this.lastPointTapAt = 0;
    this.resizeRaf = 0;
    this.resizeObserver = null;
    this.lastBeatSoundAt = -Infinity;

    this.loadState();
    this.bindEvents();
    this.syncButtonStates();
    this.render();
  }

  createPoint(time, bpm, curve = this.defaultCurve) {
    return {
      id: this.pointIdSeed++,
      time: this.clamp(time, 0, this.getDuration()),
      bpm: this.clamp(bpm, this.minBpm, this.maxBpm),
      curve
    };
  }

  createDefaultPoints() {
    this.pointIdSeed = 1;
    return [
      this.createPoint(0, 120),
      this.createPoint(this.defaultDuration / 2, 240),
      this.createPoint(this.defaultDuration, 120)
    ];
  }

  bindEvents() {
    this.playButton.addEventListener('click', () => this.togglePlayback());
    this.stopButton?.addEventListener('click', () => {
      this.stopPlayback();
      this.playPosition = 0;
      this.render();
    });
    this.loopButton.addEventListener('click', () => {
      this.isLoopEnabled = !this.isLoopEnabled;
      this.syncButtonStates();
      this.saveState();
    });
    this.soundButton.addEventListener('click', () => {
      this.isSoundEnabled = !this.isSoundEnabled;
      this.syncButtonStates();
      this.updateContinuousTone();
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {
          // Resume is best-effort; the next gesture can retry.
        });
      }
      this.updateMasterSoundOutput();
      this.saveState();
    });
    this.beatSoundButton?.addEventListener('click', () => {
      this.isBeatSoundEnabled = !this.isBeatSoundEnabled;
      this.syncButtonStates();
      this.saveState();
    });
    this.toneButton?.addEventListener('click', () => {
      this.isToneEnabled = !this.isToneEnabled;
      this.syncButtonStates();
      this.updateContinuousTone();
      this.saveState();
    });
    this.beatsButton?.addEventListener('click', () => {
      this.isBeatsVisible = !this.isBeatsVisible;
      this.syncButtonStates();
      this.render();
      this.saveState();
    });
    this.toggleValuesButton?.addEventListener('click', () => this.toggleValues());
    this.prevPointButton?.addEventListener('click', () => this.selectPrevPoint());
    this.nextPointButton?.addEventListener('click', () => this.selectNextPoint());
    this.undoButton?.addEventListener('click', () => this.undo());
    this.redoButton?.addEventListener('click', () => this.redo());
    this.selectAllPointsButton?.addEventListener('click', () => this.selectAllPoints());
    this.selectNoPointsButton?.addEventListener('click', () => this.selectNoPoints());
    this.bindHoldButton(this.moveUpButton, () => this.moveSelectedPoints(0, 1), () => this.hasMoveTargets());
    this.bindHoldButton(this.moveDownButton, () => this.moveSelectedPoints(0, -1), () => this.hasMoveTargets());
    this.bindHoldButton(this.moveLeftButton, () => this.moveSelectedPoints(-0.02, 0), () => this.hasMoveTargets());
    this.bindHoldButton(this.moveRightButton, () => this.moveSelectedPoints(0.02, 0), () => this.hasMoveTargets());
    this.addPointButton.addEventListener('click', () => this.addPointAtCurrentPosition());
    this.removePointButton.addEventListener('click', () => this.removeSelectedOrNearestPoint());
    this.resetButton.addEventListener('click', () => this.resetCurve());
    this.copySvgButton?.addEventListener('click', () => {
      this.copyCurveAsPng();
    });
    this.saveSvgButton?.addEventListener('click', () => {
      this.saveCurveAsPng();
    });
    this.copyButton.addEventListener('click', () => this.copySummary());
    this.guidesButton?.addEventListener('click', () => {
      this.isGuidesVisible = !this.isGuidesVisible;
      localStorage.setItem('bpm_curve.guides', this.isGuidesVisible ? 'true' : 'false');
      this.syncButtonStates();
      this.render();
    });
    this.timelineGuidesButton?.addEventListener('click', () => {
      this.isTimelineGuidesVisible = !this.isTimelineGuidesVisible;
      localStorage.setItem('bpm_curve.timeline_guides', this.isTimelineGuidesVisible ? 'true' : 'false');
      this.syncButtonStates();
      this.renderTimeline();
      this.saveState();
    });
    this.timelineBrightButton?.addEventListener('click', () => {
      this.isTimelineBright = !this.isTimelineBright;
      localStorage.setItem('bpm_curve.timeline_bright', String(this.isTimelineBright));
      this.syncButtonStates();
      this.renderTimeline();
    });
    window.addEventListener('pekosoft:bright-guides-global-change', (event) => {
      this.isTimelineBright = !!event.detail?.enabled;
      this.syncButtonStates();
      this.renderTimeline();
    });
    this.panelValuesButton?.addEventListener('click', () => this.setPanelView('values'));
    this.panelCurveButton?.addEventListener('click', () => this.setPanelView('curve'));

    this.positionInput.addEventListener('input', () => {
      this.playPosition = this.clamp(parseFloat(this.positionInput.value) || 0, 0, this.getDuration());
      this.render();
    });

    this.bpmOutput.addEventListener('change', () => this.handleBpmFieldCommit());
    this.bpmOutput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.handleBpmFieldCommit();
        this.bpmOutput.blur();
      }
    });

    this.durationInput.addEventListener('input', () => {
      const nextDuration = Math.max(1, parseFloat(this.durationInput.value) || this.defaultDuration);
      this.setDuration(nextDuration);
    });

    this.hzInput.addEventListener('input', () => {
      const typedHz = this.clamp(parseFloat(this.hzInput.value) || this.defaultHz, 20, 20000);
      const bpm = Math.max(0, this.sampleBpmAt(this.playPosition));
      if (bpm > 0) {
        this.referenceHz = this.clamp((typedHz * 120) / bpm, 20, 20000);
      } else {
        this.referenceHz = typedHz;
      }
      this.renderSummary();
      this.updateContinuousTone();
      this.saveState();
    });

    this.beatSelect?.addEventListener('change', () => {
      this.saveState();
    });

    this.toneSelect.addEventListener('change', () => {
      this.renderSummary();
      this.updateContinuousTone();
      this.saveState();
    });

    this.curveSelect.addEventListener('change', () => {
      this.applyCurveToSelection(this.curveSelect.value);
    });

    this.beatVolumeSlider?.addEventListener('input', () => {
      this.updateBeatVolume(parseInt(this.beatVolumeSlider.value, 10) || 0);
    });
    this.bindHoldButton(this.beatVolumeDecreaseButton, () => this.updateBeatVolume(this.beatVolume - 1), () => true);
    this.bindHoldButton(this.beatVolumeIncreaseButton, () => this.updateBeatVolume(this.beatVolume + 1), () => true);

    this.toneVolumeSlider?.addEventListener('input', () => {
      this.updateToneVolume(parseInt(this.toneVolumeSlider.value, 10) || 0);
    });
    this.bindHoldButton(this.toneVolumeDecreaseButton, () => this.updateToneVolume(this.toneVolume - 1), () => true);
    this.bindHoldButton(this.toneVolumeIncreaseButton, () => this.updateToneVolume(this.toneVolume + 1), () => true);

    this.svg.addEventListener('pointerdown', (event) => this.handleSvgPointerDown(event));
    this.svg.addEventListener('dblclick', (event) => this.handleSvgDoubleClick(event));
    this.svg.addEventListener('pointermove', (event) => this.handleSvgPointerMove(event));
    this.svg.addEventListener('pointerup', () => this.endDrag());
    this.svg.addEventListener('pointercancel', () => this.endDrag());

    window.addEventListener('pointerup', () => this.endDrag());
    window.addEventListener('resize', () => this.scheduleResizeRender());

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleResizeRender());
      this.resizeObserver.observe(this.svg);

      if (this.timelineContainer) {
        this.resizeObserver.observe(this.timelineContainer);
      }
    }

    if (this.timelineSvg && this.svgTimeline?.observeResize) {
      this.timelineResizeObserver = this.svgTimeline.observeResize({
        svg: this.timelineSvg,
        container: this.timelineContainer,
        onResize: () => this.renderTimeline()
      });
    }
  }

  scheduleResizeRender() {
    if (this.resizeRaf) return;
    this.resizeRaf = window.requestAnimationFrame(() => {
      this.resizeRaf = 0;
      this.render();
    });
  }

  async saveCurveAsPng() {
    const bitmap = await this.buildCurveBitmap();
    if (!bitmap) return;

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const filename = `bpm_curve_curve_${day}-${month}-${year}_${hours}-${minutes}-${seconds}.png`;

    const link = document.createElement('a');
    link.href = bitmap.toDataURL('image/png');
    link.download = typeof window.ensurePekosoftFilename === 'function'
      ? window.ensurePekosoftFilename(filename)
      : `pekosoft_${filename}`;
    link.click();
  }

  async copyCurveAsPng() {
    if (!navigator.clipboard || typeof navigator.clipboard.write !== 'function' || typeof ClipboardItem === 'undefined') {
      return;
    }

    const bitmap = await this.buildCurveBitmap();
    if (!bitmap) return;

    const blob = await new Promise((resolve) => {
      bitmap.toBlob((result) => resolve(result), 'image/png');
    });
    if (!blob) return;

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
  }

  cloneSvgWithInlineStyles() {
    const sourceSvg = this.svg;
    const cloneSvg = sourceSvg.cloneNode(true);

    cloneSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    cloneSvg.setAttribute('width', String(this.svgWidth));
    cloneSvg.setAttribute('height', String(this.svgHeight));
    cloneSvg.setAttribute('viewBox', `0 0 ${this.svgWidth} ${this.svgHeight}`);
    cloneSvg.setAttribute('preserveAspectRatio', 'none');

    const sourceElements = [sourceSvg, ...sourceSvg.querySelectorAll('*')];
    const cloneElements = [cloneSvg, ...cloneSvg.querySelectorAll('*')];
    const styleProps = [
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'stroke-dasharray',
      'opacity',
      'font-family',
      'font-size',
      'font-weight',
      'text-anchor',
      'dominant-baseline',
      'letter-spacing',
      'visibility',
      'display'
    ];

    for (let index = 0; index < sourceElements.length; index++) {
      const sourceNode = sourceElements[index];
      const cloneNode = cloneElements[index];
      if (!sourceNode || !cloneNode) continue;

      const computed = window.getComputedStyle(sourceNode);
      styleProps.forEach((prop) => {
        const value = computed.getPropertyValue(prop);
        if (value) {
          cloneNode.style.setProperty(prop, value);
        }
      });
    }

    const nonStretchGroups = cloneSvg.querySelectorAll('[data-non-stretch="1"]');
    nonStretchGroups.forEach((group) => {
      const x = parseFloat(group.getAttribute('data-origin-x') || '0');
      const y = parseFloat(group.getAttribute('data-origin-y') || '0');
      group.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    });

    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('x', '0');
    background.setAttribute('y', '0');
    background.setAttribute('width', String(this.svgWidth));
    background.setAttribute('height', String(this.svgHeight));
    background.setAttribute('fill', '#000');
    cloneSvg.insertBefore(background, cloneSvg.firstChild);

    return cloneSvg;
  }

  buildCurveBitmap() {
    const width = this.svgWidth;
    const height = this.svgHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const cloneSvg = this.cloneSvgWithInlineStyles();
    const svgData = new XMLSerializer().serializeToString(cloneSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(image, 0, 0, width, height);
          URL.revokeObjectURL(url);
          resolve(canvas);
          return;
        }

        URL.revokeObjectURL(url);
        resolve(null);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      image.src = url;
    });
  }

  getDuration() {
    return Math.max(1, parseFloat(this.durationInput.value) || this.defaultDuration);
  }

  getHz() {
    return Math.max(20, this.referenceHz || this.defaultHz);
  }

  getBeatGain() {
    return this.clamp(this.beatVolume, 0, 100) / 100;
  }

  getToneGain() {
    return this.clamp(this.toneVolume, 0, 100) / 100;
  }

  getCurrentCurveHz(atTime = this.playPosition) {
    const bpm = Math.max(0, this.sampleBpmAt(atTime));
    return this.clamp(this.getHz() * (bpm / 120), 20, 20000);
  }

  normalizeBeatTone(tone) {
    const allowed = ['click', 'kick', 'hat', 'sine', 'square', 'sawtooth', 'triangle', 'piano'];
    return allowed.includes(tone) ? tone : this.defaultBeatTone;
  }

  normalizeToneChoice(tone) {
    const allowed = ['sine', 'square', 'sawtooth', 'triangle', 'piano'];
    return allowed.includes(tone) ? tone : this.defaultTone;
  }

  getToneTag() {
    const tone = this.normalizeToneChoice(this.toneSelect.value);
    if (tone === 'sine') return 'sin';
    if (tone === 'square') return 'sqr';
    if (tone === 'sawtooth') return 'saw';
    if (tone === 'triangle') return 'tri';
    return tone;
  }

  createSnapshot() {
    return {
      points: this.points.map((point) => ({ id: point.id, time: point.time, bpm: point.bpm, curve: point.curve })),
      selectedPointId: this.selectedPointId,
      isAllPointsSelected: this.isAllPointsSelected,
      playPosition: this.playPosition,
      duration: this.getDuration(),
      hz: this.getHz(),
      tone: this.toneSelect.value,
      curve: this.curveSelect.value,
      toneEnabled: this.isToneEnabled,
      isValuesVisible: this.isValuesVisible
    };
  }

  snapshotsMatch(left, right) {
    if (!left || !right) return false;
    return JSON.stringify(left) === JSON.stringify(right);
  }

  bindHoldButton(button, action, canRun) {
    if (!button) return;

    const start = (event) => {
      event.preventDefault();
      if (typeof canRun === 'function' && !canRun()) return;
      this.startHoldAction(button, action);
    };

    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', () => this.stopHoldAction(button));
    button.addEventListener('pointerleave', () => this.stopHoldAction(button));
    button.addEventListener('pointercancel', () => this.stopHoldAction(button));
    button.addEventListener('click', (event) => event.preventDefault());
  }

  startHoldAction(button, action) {
    this.stopHoldAction(this.activeHoldButton);
    this.activeHoldButton = button;
    action();
    this.holdTimeoutId = window.setTimeout(() => {
      this.holdIntervalId = window.setInterval(() => {
        action();
      }, 70);
    }, 280);
  }

  stopHoldAction(button) {
    if (button && this.activeHoldButton && button !== this.activeHoldButton) return;
    if (this.holdTimeoutId !== null) {
      window.clearTimeout(this.holdTimeoutId);
      this.holdTimeoutId = null;
    }
    if (this.holdIntervalId !== null) {
      window.clearInterval(this.holdIntervalId);
      this.holdIntervalId = null;
    }
    if (!button || button === this.activeHoldButton) {
      this.activeHoldButton = null;
    }
  }

  applySnapshot(snapshot) {
    if (!snapshot) return;

    this.isApplyingHistory = true;
    this.points = snapshot.points.map((point) => ({
      id: point.id,
      time: this.clamp(point.time, 0, snapshot.duration),
      bpm: this.clamp(point.bpm, this.minBpm, this.maxBpm),
      curve: typeof point.curve === 'string' ? point.curve : this.defaultCurve
    }));
    this.points.sort((left, right) => left.time - right.time);
    this.pointIdSeed = this.points.reduce((maxId, point) => Math.max(maxId, point.id), 0) + 1;
    this.selectedPointId = snapshot.selectedPointId;
    this.isAllPointsSelected = !!snapshot.isAllPointsSelected;
    this.durationInput.value = String(snapshot.duration);
    this.playPosition = this.clamp(snapshot.playPosition, 0, snapshot.duration);
    this.referenceHz = this.clamp(snapshot.hz, 20, 20000);
    this.hzInput.value = this.getCurrentCurveHz().toFixed(2).replace(/\.00$/, '');
    this.toneSelect.value = snapshot.tone;
    this.curveSelect.value = snapshot.curve;
    this.isToneEnabled = !!snapshot.toneEnabled;
    this.isValuesVisible = snapshot.isValuesVisible !== false;
    this.syncCurveSelectToSelection();
    this.applyToolValuesVisibility();
    this.isApplyingHistory = false;
    this.render();
  }

  recordUndoState() {
    if (this.isApplyingHistory) return;
    const snapshot = this.createSnapshot();
    const latest = this.undoStack[this.undoStack.length - 1];
    if (this.snapshotsMatch(latest, snapshot)) return;
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.historyLimit) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const current = this.createSnapshot();
    const previous = this.undoStack.pop();
    this.redoStack.push(current);
    this.applySnapshot(previous);
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const current = this.createSnapshot();
    const next = this.redoStack.pop();
    this.undoStack.push(current);
    this.applySnapshot(next);
  }

  toggleValues() {
    this.isValuesVisible = !this.isValuesVisible;
    this.applyToolValuesVisibility();
    this.render();
    this.syncButtonStates();
    this.saveState();
  }

  getCurveTargetPoint() {
    if (this.isAllPointsSelected) {
      return this.points[0] || null;
    }

    const selectedPoint = this.getSelectedPoint();
    if (selectedPoint) return selectedPoint;

    const points = this.getSortedPoints();
    if (points.length === 0) return null;

    let candidate = points[0];
    for (const point of points) {
      if (point.time <= this.playPosition) {
        candidate = point;
      } else {
        break;
      }
    }

    return candidate;
  }

  syncCurveSelectToSelection() {
    const targetPoint = this.getCurveTargetPoint();
    if (!targetPoint) return;
    this.curveSelect.value = targetPoint.curve || this.defaultCurve;
  }

  applyCurveToSelection(curve) {
    const nextCurve = typeof curve === 'string' ? curve : this.defaultCurve;
    const targetPoint = this.getCurveTargetPoint();
    if (!targetPoint) return;

    this.recordUndoState();

    if (this.isAllPointsSelected) {
      this.points.forEach((point) => {
        point.curve = nextCurve;
      });
    } else {
      targetPoint.curve = nextCurve;
    }

    this.syncCurveSelectToSelection();
    this.render();
    this.saveState();
  }

  applyToolValuesVisibility() {
    if (this.labelsLayer) {
      this.labelsLayer.style.display = this.isValuesVisible ? '' : 'none';
    }
  }

  selectAllPoints() {
    if (!this.points.length) return;
    this.isAllPointsSelected = true;
    this.selectedPointId = this.getSortedPoints()[0].id;
    this.syncCurveSelectToSelection();
    this.render();
  }

  selectNoPoints() {
    this.isAllPointsSelected = false;
    this.selectedPointId = null;
    this.syncCurveSelectToSelection();
    this.render();
  }

  selectPrevPoint() {
    const points = this.getSortedPoints();
    if (!points.length) return;

    this.isAllPointsSelected = false;
    const currentIndex = points.findIndex((point) => point.id === this.selectedPointId);
    if (currentIndex >= 0) {
      const nextIndex = Math.max(0, currentIndex - 1);
      this.selectPointById(points[nextIndex].id);
      this.syncCurveSelectToSelection();
      return;
    }

        bpm: this.clamp(bpm, this.minBpm, this.maxBpm),
        curve = this.defaultCurve
    for (let index = points.length - 1; index >= 0; index--) {
      if (points[index].time < this.playPosition) {
        nextIndex = index;
        break;
      }
    }
    this.selectPointById(points[nextIndex].id);
    this.syncCurveSelectToSelection();
  }

  selectNextPoint() {
    const points = this.getSortedPoints();
    if (!points.length) return;

    this.isAllPointsSelected = false;
    const currentIndex = points.findIndex((point) => point.id === this.selectedPointId);
    if (currentIndex >= 0) {
      const nextIndex = Math.min(points.length - 1, currentIndex + 1);
      this.selectPointById(points[nextIndex].id);
      this.syncCurveSelectToSelection();
      return;
    }

    let nextIndex = points.length - 1;
    for (let index = 0; index < points.length; index++) {
      if (points[index].time > this.playPosition) {
        nextIndex = index;
        break;
      }
    }
    this.selectPointById(points[nextIndex].id);
    this.syncCurveSelectToSelection();
  }

  getMoveTargets() {
    if (this.isAllPointsSelected) return this.points;
    const selectedPoint = this.getSelectedPoint();
    if (selectedPoint) return [selectedPoint];
    return [];
  }

  hasMoveTargets() {
    return this.getMoveTargets().length > 0;
  }

  canRemoveSelectedPoint() {
    if (this.isAllPointsSelected) return false;
    const selectedPoint = this.getSelectedPoint();
    return !!selectedPoint && !this.isEndpointPointId(selectedPoint.id);
  }

  moveSelectedPoints(deltaTime, deltaBpm) {
    const targets = this.getMoveTargets();
    if (targets.length === 0) return;

    const updates = targets.map((point) => ({
      point,
      time: this.getConstrainedPointTime(point.id, point.time + deltaTime),
      bpm: this.clamp(point.bpm + deltaBpm, this.minBpm, this.maxBpm)
    }));
    const hasChanges = updates.some((update) => update.point.time !== update.time || update.point.bpm !== update.bpm);
    if (!hasChanges) return;

    this.recordUndoState();
    updates.forEach((update) => {
      update.point.time = update.time;
      update.point.bpm = update.bpm;
    });

    this.points.sort((left, right) => left.time - right.time);
    const selectedPoint = this.getSelectedPoint();
    if (selectedPoint) {
      this.playPosition = selectedPoint.time;
    }
    this.render();
  }

  handleBpmFieldCommit() {
    const parsed = parseFloat(this.bpmOutput.value);
    if (!Number.isFinite(parsed)) {
      this.updateOutputs();
      return;
    }

    const nextBpm = this.clamp(Math.round(parsed), this.minBpm, this.maxBpm);
    this.recordUndoState();

    if (this.isAllPointsSelected) {
      this.points.forEach((point) => {
        point.bpm = nextBpm;
      });
      this.render();
      return;
    }

    const selectedPoint = this.getSelectedPoint();
    if (selectedPoint) {
      selectedPoint.bpm = nextBpm;
      this.playPosition = selectedPoint.time;
      this.render();
      return;
    }

    const targetTime = this.clamp(this.playPosition, 0, this.getDuration());
    const epsilon = 0.02;
    let targetPoint = this.points.find((point) => Math.abs(point.time - targetTime) <= epsilon) || null;

    if (targetPoint) {
      targetPoint.bpm = nextBpm;
    } else {
      targetPoint = this.createPoint(targetTime, nextBpm);
      this.points.push(targetPoint);
      this.points.sort((left, right) => left.time - right.time);
    }

    this.isAllPointsSelected = false;
    this.selectedPointId = targetPoint.id;
    this.playPosition = targetPoint.time;
    this.render();
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  syncButtonStates() {
    this.loopButton.classList.toggle('button-on', this.isLoopEnabled);
    this.soundButton.classList.toggle('button-on', this.isSoundEnabled);
    this.beatSoundButton?.classList.toggle('button-on', this.isBeatSoundEnabled);
    this.toggleValuesButton?.classList.toggle('button-on', this.isValuesVisible);
    this.selectAllPointsButton?.classList.remove('button-on');
    this.playButton.classList.toggle('button-on', this.isPlaying);
    this.playButton.querySelector('.button-text').textContent = this.isPlaying ? 'Pause' : 'Play';
    this.toneButton?.classList.toggle('button-on', this.isToneEnabled);
    this.beatsButton?.classList.toggle('button-on', this.isBeatsVisible);
    this.guidesButton?.classList.toggle('button-on', this.isGuidesVisible);
    this.timelineGuidesButton?.classList.toggle('button-on', this.isTimelineGuidesVisible);
    this.timelineBrightButton?.classList.toggle('button-on', this.isTimelineBright);
    this.panelValuesButton?.classList.toggle('button-on', this.panelView === 'values');
    this.panelCurveButton?.classList.toggle('button-on', this.panelView === 'curve');
    if (this.removePointButton) {
      const removeDisabled = !this.canRemoveSelectedPoint();
      this.removePointButton.disabled = removeDisabled;
      this.removePointButton.classList.toggle('grey', removeDisabled);
      this.removePointButton.setAttribute('aria-disabled', removeDisabled ? 'true' : 'false');
    }
    if (this.undoButton) {
      const undoDisabled = this.undoStack.length === 0;
      this.undoButton.disabled = undoDisabled;
      this.undoButton.classList.toggle('grey', undoDisabled);
      this.undoButton.setAttribute('aria-disabled', undoDisabled ? 'true' : 'false');
    }
    if (this.redoButton) {
      const redoDisabled = this.redoStack.length === 0;
      this.redoButton.disabled = redoDisabled;
      this.redoButton.classList.toggle('grey', redoDisabled);
      this.redoButton.setAttribute('aria-disabled', redoDisabled ? 'true' : 'false');
    }
  }

  setPanelView(view) {
    const nextView = view === 'curve' ? 'curve' : 'values';
    if (this.panelView === nextView) return;
    this.panelView = nextView;
    localStorage.setItem('bpm_curve.panel_view', this.panelView);
    this.syncButtonStates();
    this.renderSummary();
  }

  loadState() {
    const saved = localStorage.getItem('bpm_curve.state');
    if (!saved) return;

    try {
      const state = JSON.parse(saved);
      if (Number.isFinite(state.duration)) {
        this.durationInput.value = String(state.duration);
      }
      if (Number.isFinite(state.position)) {
        this.playPosition = state.position;
      }
      if (Number.isFinite(state.hz)) {
        this.referenceHz = this.clamp(state.hz, 20, 20000);
        this.hzInput.value = this.getCurrentCurveHz().toFixed(2).replace(/\.00$/, '');
      }
      if (typeof state.beat === 'string' && this.beatSelect) {
        this.beatSelect.value = this.normalizeBeatTone(state.beat);
      }
      if (typeof state.tone === 'string') {
        this.toneSelect.value = this.normalizeToneChoice(state.tone);
      }
      if (typeof state.curve === 'string') {
        this.curveSelect.value = state.curve;
      }
      if (typeof state.loop === 'boolean') {
        this.isLoopEnabled = state.loop;
      }
      if (typeof state.sound === 'boolean') {
        this.isSoundEnabled = state.sound;
      }
      if (typeof state.beatSound === 'boolean') {
        this.isBeatSoundEnabled = state.beatSound;
      }
      if (Number.isFinite(state.beatVolume)) {
        this.beatVolume = this.clamp(Math.round(state.beatVolume), 0, 100);
      } else if (Number.isFinite(state.volume)) {
        this.beatVolume = this.clamp(Math.round(state.volume), 0, 100);
      }
      if (Number.isFinite(state.toneVolume)) {
        this.toneVolume = this.clamp(Math.round(state.toneVolume), 0, 100);
      } else if (Number.isFinite(state.volume)) {
        this.toneVolume = this.clamp(Math.round(state.volume), 0, 100);
      }
      if (typeof state.toneEnabled === 'boolean') {
        this.isToneEnabled = state.toneEnabled;
      }
      if (typeof state.beats === 'boolean') {
        this.isBeatsVisible = state.beats;
      }
      if (typeof state.guides === 'boolean') {
        this.isGuidesVisible = state.guides;
      }
      if (typeof state.timelineGuides === 'boolean') {
        this.isTimelineGuidesVisible = state.timelineGuides;
      }
      if (typeof state.valuesVisible === 'boolean') {
        this.isValuesVisible = state.valuesVisible;
      }
      if (typeof state.allPointsSelected === 'boolean') {
        this.isAllPointsSelected = state.allPointsSelected;
      }
      if (Array.isArray(state.points) && state.points.length >= 2) {
        this.points = state.points
          .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.bpm))
          .map((point) => ({
            id: this.pointIdSeed++,
            time: this.clamp(point.time, 0, this.getDuration()),
            bpm: this.clamp(point.bpm, this.minBpm, this.maxBpm),
            curve: typeof point.curve === 'string' ? point.curve : this.defaultCurve
          }));
      }
      if (typeof state.selectedPointId === 'number') {
        this.selectedPointId = state.selectedPointId;
      }
      this.points.sort((left, right) => left.time - right.time);
      this.applyToolValuesVisibility();
      this.syncVolumeControls();
    } catch {
      this.points = this.createDefaultPoints();
    }
  }

  saveState() {
    const state = {
      duration: this.getDuration(),
      position: this.playPosition,
      hz: this.getHz(),
      beat: this.normalizeBeatTone(this.beatSelect ? this.beatSelect.value : this.defaultBeatTone),
      tone: this.normalizeToneChoice(this.toneSelect.value),
      curve: this.curveSelect.value,
      loop: this.isLoopEnabled,
      sound: this.isSoundEnabled,
      beatSound: this.isBeatSoundEnabled,
      beatVolume: this.beatVolume,
      toneVolume: this.toneVolume,
      toneEnabled: this.isToneEnabled,
      beats: this.isBeatsVisible,
      guides: this.isGuidesVisible,
      timelineGuides: this.isTimelineGuidesVisible,
      valuesVisible: this.isValuesVisible,
      allPointsSelected: this.isAllPointsSelected,
      points: this.points.map((point) => ({ time: point.time, bpm: point.bpm, curve: point.curve })),
      selectedPointId: this.selectedPointId
    };

    localStorage.setItem('bpm_curve.state', JSON.stringify(state));
  }

  resetCurve() {
    this.stopPlayback();
    this.durationInput.value = String(this.defaultDuration);
    this.referenceHz = this.defaultHz;
    this.hzInput.value = String(this.defaultHz);
    if (this.beatSelect) {
      this.beatSelect.value = this.defaultBeatTone;
    }
    this.toneSelect.value = this.defaultTone;
    this.curveSelect.value = this.defaultCurve;
    this.isLoopEnabled = true;
    this.isSoundEnabled = true;
    this.isBeatSoundEnabled = true;
    this.beatVolume = this.defaultBeatVolume;
    this.toneVolume = this.defaultToneVolume;
    this.isToneEnabled = false;
    this.isBeatsVisible = false;
    this.isValuesVisible = true;
    this.isAllPointsSelected = false;
    this.isGuidesVisible = localStorage.getItem('global.guides') !== 'false';
    this.isTimelineGuidesVisible = localStorage.getItem('global.guides') !== 'false';
    this.playPosition = 0;
    this.points = this.createDefaultPoints();
    this.selectedPointId = null;
    this.undoStack = [];
    this.redoStack = [];
    this.applyToolValuesVisibility();
    this.stopContinuousTone();
    localStorage.removeItem('bpm_curve.state');
    localStorage.removeItem('bpm_curve.guides');
    localStorage.removeItem('bpm_curve.timeline_guides');
    this.syncButtonStates();
    this.syncVolumeControls();
    this.render();
  }

  updateBeatVolume(nextVolume, shouldSave = true) {
    this.beatVolume = this.clamp(Math.round(nextVolume), 0, 100);
    this.syncVolumeControls();
    if (shouldSave) {
      this.saveState();
    }
  }

  updateToneVolume(nextVolume, shouldSave = true) {
    this.toneVolume = this.clamp(Math.round(nextVolume), 0, 100);
    this.syncVolumeControls();
    this.updateContinuousTone();
    if (shouldSave) {
      this.saveState();
    }
  }

  syncVolumeControls() {
    if (this.beatVolumeSlider) {
      this.beatVolumeSlider.value = String(this.beatVolume);
    }
    if (this.toneVolumeSlider) {
      this.toneVolumeSlider.value = String(this.toneVolume);
    }
  }

  setDuration(nextDuration) {
    this.recordUndoState();
    const previousDuration = this.getDuration();
    const duration = Math.max(1, nextDuration);
    const scale = previousDuration > 0 ? duration / previousDuration : 1;
    this.durationInput.value = duration.toFixed(2).replace(/\.00$/, '');
    this.points = this.points.map((point) => ({
      ...point,
      time: this.clamp(point.time * scale, 0, duration)
    }));
    this.playPosition = this.clamp(this.playPosition * scale, 0, duration);
    this.render();
    this.saveState();
  }

  getSortedPoints() {
    return [...this.points].sort((left, right) => left.time - right.time);
  }

  getPointIndexById(id) {
    return this.points.findIndex((point) => point.id === id);
  }

  isEndpointPointId(pointId) {
    const points = this.getSortedPoints();
    return points.length > 0 && (points[0].id === pointId || points[points.length - 1].id === pointId);
  }

  getEndpointFixedTime(pointId) {
    const points = this.getSortedPoints();
    if (points.length === 0) return null;
    if (points[0].id === pointId) return 0;
    if (points[points.length - 1].id === pointId) return this.getDuration();
    return null;
  }

  getConstrainedPointTime(pointId, requestedTime) {
    const endpointTime = this.getEndpointFixedTime(pointId);
    if (endpointTime !== null) return endpointTime;

    const duration = this.getDuration();
    const sorted = this.getSortedPoints();
    const index = sorted.findIndex((point) => point.id === pointId);
    if (index < 0) {
      return this.clamp(requestedTime, 0, duration);
    }

    const minGap = 0.01;
    const previous = sorted[index - 1] || null;
    const next = sorted[index + 1] || null;
    const minTime = previous ? (previous.time + minGap) : 0;
    const maxTime = next ? (next.time - minGap) : duration;
    return this.clamp(requestedTime, minTime, maxTime);
  }

  getSelectedPoint() {
    if (this.selectedPointId === null) return null;
    return this.points.find((point) => point.id === this.selectedPointId) || null;
  }

  selectPointById(id) {
    this.isAllPointsSelected = false;
    this.selectedPointId = id;
    const point = this.getSelectedPoint();
    if (point) {
      this.playPosition = point.time;
      this.curveSelect.value = point.curve || this.defaultCurve;
    }
    this.render();
  }

  addPointAtCurrentPosition() {
    this.recordUndoState();
    const time = this.clamp(this.playPosition, 0, this.getDuration());
    const bpm = this.sampleBpmAt(time);
    const point = this.createPoint(time, bpm, this.curveSelect.value);
    this.points.push(point);
    this.points.sort((left, right) => left.time - right.time);
    this.isAllPointsSelected = false;
    this.selectedPointId = point.id;
    this.render();
    this.saveState();
  }

  removeSelectedOrNearestPoint() {
    if (this.points.length <= 2) return;
    if (!this.canRemoveSelectedPoint()) return;

    let index = this.getPointIndexById(this.selectedPointId);
    if (index >= 0) {
      this.recordUndoState();
      const removed = this.points.splice(index, 1)[0];
      if (removed && this.selectedPointId === removed.id) {
        this.selectedPointId = this.points[Math.max(0, index - 1)]?.id ?? this.points[0]?.id ?? null;
      }
      this.render();
      this.saveState();
    }
  }

  handleSvgPointerDown(event) {
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }

    const position = this.getSvgPosition(event);
    const pointElement = event.target.closest('.curve-point');
    let pointId = Number.parseInt(pointElement?.getAttribute('data-point-id') || '', 10);

    if (!Number.isFinite(pointId)) {
      // On touch, allow a larger hit radius so dragging near a point won't create a new one.
      const snapRadiusPx = event.pointerType === 'touch' ? 24 : 12;
      pointId = this.findNearestPointId(position, snapRadiusPx);
    }

    if (Number.isFinite(pointId)) {
      const now = performance.now();
      const isDoubleTap = this.lastPointTapId === pointId && (now - this.lastPointTapAt) <= 320;
      this.lastPointTapId = pointId;
      this.lastPointTapAt = now;

      if (isDoubleTap) {
        this.lastPointTapId = null;
        this.lastPointTapAt = 0;
        this.removePointById(pointId);
        return;
      }

      this.selectPointById(pointId);
      this.dragState = {
        id: pointId,
        pointerId: event.pointerId,
        historyRecorded: false
      };
      this.capturePointer(event.pointerId);
      return;
    }

    if (event.target.closest('svg')) {
      const time = this.getTimeFromSvgX(position.x);
      const bpm = this.clamp(this.getBpmFromY(position.y), this.minBpm, this.maxBpm);
      const point = this.addPointAtPosition(time, bpm);
      if (point) {
        this.dragState = {
          id: point.id,
          pointerId: event.pointerId,
          historyRecorded: true
        };
        this.capturePointer(event.pointerId);
      }
    }
  }

  handleSvgDoubleClick(event) {
    event.preventDefault();
  }

  handleSvgPointerMove(event) {
    if (!this.dragState || this.dragState.pointerId !== event.pointerId) return;
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }
    const point = this.points.find((entry) => entry.id === this.dragState.id);
    if (!point) return;

    if (!this.dragState.historyRecorded) {
      this.recordUndoState();
      this.dragState.historyRecorded = true;
    }

    const position = this.getSvgPosition(event);
    const requestedTime = this.getTimeFromSvgX(position.x);
    const nextTime = this.getConstrainedPointTime(point.id, requestedTime);
    const nextBpm = this.clamp(this.getBpmFromY(position.y), this.minBpm, this.maxBpm);
    point.time = nextTime;
    point.bpm = nextBpm;
    this.points.sort((left, right) => left.time - right.time);
    this.playPosition = nextTime;
    this.render();
    this.saveState();
  }

  endDrag() {
    this.dragState = null;
    this.stopHoldAction();
  }

  capturePointer(pointerId) {
    if (typeof this.svg.setPointerCapture !== 'function') return;
    try {
      this.svg.setPointerCapture(pointerId);
    } catch {
      // Ignore capture failures; drag still works where capture is unsupported.
    }
  }

  findNearestPointId(position, radiusPx = 12) {
    const duration = this.getDuration();
    const range = this.getBpmRange();
    const innerWidth = this.getInnerWidth();
    const innerHeight = this.getInnerHeight();
    const scale = this.getSvgScaleFactors();
    const radiusSvgX = radiusPx / (scale.x || 1);
    const radiusSvgY = radiusPx / (scale.y || 1);

    let bestId = null;
    let bestDistance = Infinity;

    this.points.forEach((point) => {
      const x = this.padding.left + (point.time / duration) * innerWidth;
      const y = this.padding.top + innerHeight - (((point.bpm - range.min) / (range.max - range.min || 1)) * innerHeight);
      const dx = position.x - x;
      const dy = position.y - y;
      const normalized = Math.sqrt(((dx * dx) / ((radiusSvgX * radiusSvgX) || 1)) + ((dy * dy) / ((radiusSvgY * radiusSvgY) || 1)));
      if (normalized <= 1 && normalized < bestDistance) {
        bestDistance = normalized;
        bestId = point.id;
      }
    });

    return bestId;
  }

  addPointAtPosition(time, bpm) {
    this.recordUndoState();
    const point = this.createPoint(time, bpm, this.curveSelect.value);
    this.points.push(point);
    this.points.sort((left, right) => left.time - right.time);
    this.isAllPointsSelected = false;
    this.selectedPointId = point.id;
    this.playPosition = point.time;
    this.render();
    this.saveState();
    return point;
  }

  removePointById(pointId) {
    if (this.points.length <= 2) return;
    if (this.isEndpointPointId(pointId)) return;

    const index = this.getPointIndexById(pointId);
    if (index < 0) return;

    this.recordUndoState();
    this.points.splice(index, 1);
    this.isAllPointsSelected = false;
    this.selectedPointId = this.points[Math.max(0, index - 1)]?.id ?? this.points[0]?.id ?? null;
    const selectedPoint = this.getSelectedPoint();
    if (selectedPoint) {
      this.playPosition = selectedPoint.time;
    }
    this.render();
    this.saveState();
  }

  getSvgPosition(event) {
    const rect = this.svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.svgWidth;
    const y = ((event.clientY - rect.top) / rect.height) * this.svgHeight;
    return { x, y };
  }

  getTimeFromSvgX(x) {
    const innerWidth = this.getInnerWidth();
    const clampedX = this.clamp(x, this.padding.left, this.svgWidth - this.padding.right);
    return ((clampedX - this.padding.left) / (innerWidth || 1)) * this.getDuration();
  }

  getInnerWidth() {
    return this.svgWidth - this.padding.left - this.padding.right;
  }

  getInnerHeight() {
    return this.svgHeight - this.padding.top - this.padding.bottom;
  }

  getBpmRange() {
    return {
      min: this.minBpm,
      max: this.maxBpm
    };
  }

  getYFromBpm(bpm) {
    const range = this.getBpmRange();
    const innerHeight = this.getInnerHeight();
    const scale = (bpm - range.min) / (range.max - range.min || 1);
    return this.padding.top + innerHeight - (scale * innerHeight);
  }

  getBpmFromY(y) {
    const range = this.getBpmRange();
    const innerHeight = this.getInnerHeight();
    const clampedY = this.clamp(y, this.padding.top, this.svgHeight - this.padding.bottom);
    const scale = 1 - ((clampedY - this.padding.top) / (innerHeight || 1));
    return range.min + scale * (range.max - range.min);
  }

  getSvgScaleFactors() {
    const rect = this.svg.getBoundingClientRect();
    const scaleX = rect.width > 0 ? rect.width / this.svgWidth : 1;
    const scaleY = rect.height > 0 ? rect.height / this.svgHeight : 1;
    return {
      x: scaleX || 1,
      y: scaleY || 1
    };
  }

  applyNonStretchTextTransform(textNode, x, y) {
    const scale = this.getSvgScaleFactors();
    const inverseX = 1 / scale.x;
    const inverseY = 1 / scale.y;
    textNode.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${inverseX.toFixed(5)} ${inverseY.toFixed(5)})`);
  }

  createNonStretchGroup(x, y, scale = this.getSvgScaleFactors()) {
    const inverseX = 1 / scale.x;
    const inverseY = 1 / scale.y;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-non-stretch', '1');
    group.setAttribute('data-origin-x', x.toFixed(2));
    group.setAttribute('data-origin-y', y.toFixed(2));
    group.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${inverseX.toFixed(5)} ${inverseY.toFixed(5)})`);
    return group;
  }

  sampleBpmAt(time) {
    const points = this.getSortedPoints();
    const duration = this.getDuration();
    const clampedTime = this.clamp(time, 0, duration);

    if (points.length === 0) return 0;
    if (clampedTime <= points[0].time) return points[0].bpm;
    if (clampedTime >= points[points.length - 1].time) return points[points.length - 1].bpm;

    for (let index = 0; index < points.length - 1; index++) {
      const left = points[index];
      const right = points[index + 1];
      if (clampedTime >= left.time && clampedTime <= right.time) {
        const span = right.time - left.time || 1;
        const ratio = (clampedTime - left.time) / span;
        const curveRatio = this.getCurveRatio(ratio, left.curve || this.defaultCurve);
        return left.bpm + (right.bpm - left.bpm) * curveRatio;
      }
    }

    return points[points.length - 1].bpm;
  }

  getCurveRatio(ratio, mode = this.curveSelect.value) {

    if (mode === 'linear') {
      return ratio;
    }

    if (mode === 'exponential') {
      const intensity = 4;
      return (Math.exp(intensity * ratio) - 1) / (Math.exp(intensity) - 1);
    }

    if (mode === 'logarithmic') {
      const intensity = 9;
      return Math.log1p(intensity * ratio) / Math.log1p(intensity);
    }

    return (1 - Math.cos(Math.PI * ratio)) / 2;
  }

  integrateBeats() {
    return this.integrateBeatsTo(this.getDuration());
  }

  integrateBeatsTo(time) {
    const duration = this.getDuration();
    const endTime = this.clamp(time, 0, duration);
    const samples = Math.max(16, Math.round((endTime / duration) * 512));
    const step = endTime / samples;
    let beats = 0;
    let previous = this.sampleBpmAt(0);

    for (let index = 1; index <= samples; index++) {
      const currentTime = step * index;
      const current = this.sampleBpmAt(currentTime);
      beats += ((previous + current) * 0.5 * step) / 60;
      previous = current;
    }

    return beats;
  }

  getBeatTimes() {
    const duration = this.getDuration();
    const beatTimes = [];
    const samples = Math.max(256, Math.min(2048, Math.round(duration * 80)));
    const step = duration / samples;
    let previousTime = 0;
    let previousBpm = this.sampleBpmAt(0);
    let accumulatedBeats = 0;
    let nextBeat = 1;

    for (let index = 1; index <= samples; index++) {
      const currentTime = step * index;
      const currentBpm = this.sampleBpmAt(currentTime);
      const segmentBeats = ((previousBpm + currentBpm) * 0.5 * (currentTime - previousTime)) / 60;
      const segmentEndBeats = accumulatedBeats + segmentBeats;

      while (segmentEndBeats >= nextBeat) {
        const ratio = segmentBeats > 0 ? (nextBeat - accumulatedBeats) / segmentBeats : 0;
        const beatTime = previousTime + ((currentTime - previousTime) * this.clamp(ratio, 0, 1));
        beatTimes.push(beatTime);
        nextBeat += 1;
      }

      accumulatedBeats = segmentEndBeats;
      previousTime = currentTime;
      previousBpm = currentBpm;
    }

    return beatTimes;
  }

  buildCurvePath() {
    const duration = this.getDuration();
    const points = [];
    const samples = 256;
    const innerWidth = this.getInnerWidth();
    const range = this.getBpmRange();
    const innerHeight = this.getInnerHeight();

    for (let index = 0; index <= samples; index++) {
      const time = (duration * index) / samples;
      const bpm = this.sampleBpmAt(time);
      const x = this.padding.left + (time / duration) * innerWidth;
      const y = this.padding.top + innerHeight - (((bpm - range.min) / (range.max - range.min || 1)) * innerHeight);
      points.push(`${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
    }

    return points.join(' ');
  }

  renderGrid() {
    if (!this.isGuidesVisible && !this.isBeatsVisible) {
      this.gridLayer.replaceChildren();
      return;
    }

    const duration = this.getDuration();
    const innerWidth = this.getInnerWidth();
    const fragment = document.createDocumentFragment();
    if (this.isGuidesVisible) {
      const range = this.getBpmRange();
      const innerHeight = this.getInnerHeight();
      const scale = this.getSvgScaleFactors();

      const verticalCount = Math.max(2, Math.round(duration));
      for (let index = 0; index <= verticalCount; index++) {
        const time = (duration / verticalCount) * index;
        const x = this.padding.left + (time / duration) * innerWidth;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toFixed(2));
        line.setAttribute('y1', this.padding.top);
        line.setAttribute('x2', x.toFixed(2));
        line.setAttribute('y2', (this.svgHeight - this.padding.bottom).toFixed(2));
        fragment.appendChild(line);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '0');
        label.setAttribute('y', '0');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.textContent = `${time.toFixed(1)}`;
        const labelGroup = this.createNonStretchGroup(x, this.svgHeight - 28, scale);
        labelGroup.appendChild(label);
        fragment.appendChild(labelGroup);
      }

      const horizontalCount = 6;
      for (let index = 0; index <= horizontalCount; index++) {
        const bpm = range.min + ((range.max - range.min) / horizontalCount) * index;
        const y = this.getYFromBpm(bpm);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', this.padding.left);
        line.setAttribute('y1', y.toFixed(2));
        line.setAttribute('x2', (this.svgWidth - this.padding.right).toFixed(2));
        line.setAttribute('y2', y.toFixed(2));
        fragment.appendChild(line);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '0');
        label.setAttribute('y', '0');
        label.setAttribute('dominant-baseline', 'middle');
        label.textContent = `${Math.round(bpm)}`;
        const labelGroup = this.createNonStretchGroup(12, y + 4, scale);
        labelGroup.appendChild(label);
        fragment.appendChild(labelGroup);
      }
    }

    if (this.isBeatsVisible) {
      const beatTimes = this.getBeatTimes();
      const drawBeatLine = (time) => {
        const x = this.padding.left + (time / duration) * innerWidth;
        const beatBpm = this.sampleBpmAt(time);
        const curveY = this.getYFromBpm(beatBpm);
        const beatLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        beatLine.setAttribute('class', 'curve-beat-line');
        beatLine.setAttribute('x1', x.toFixed(2));
        beatLine.setAttribute('y1', curveY.toFixed(2));
        beatLine.setAttribute('x2', x.toFixed(2));
        beatLine.setAttribute('y2', (this.svgHeight - this.padding.bottom).toFixed(2));
        fragment.appendChild(beatLine);
      };

      drawBeatLine(0);
      beatTimes.forEach((time) => {
        drawBeatLine(time);
      });
    }

    this.gridLayer.replaceChildren(fragment);
  }

  renderPoints() {
    const fragment = document.createDocumentFragment();
    const labelsFragment = document.createDocumentFragment();
    const duration = this.getDuration();
    const range = this.getBpmRange();
    const innerWidth = this.getInnerWidth();
    const innerHeight = this.getInnerHeight();
    const placedLabels = [];
    const scale = this.getSvgScaleFactors();
    const pointRadiusPx = 8;

    this.points.forEach((point) => {
      const x = this.padding.left + (point.time / duration) * innerWidth;
      const y = this.padding.top + innerHeight - (((point.bpm - range.min) / (range.max - range.min || 1)) * innerHeight);

      const pointGroup = this.createNonStretchGroup(x, y, scale);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'curve-point');
      if (this.isAllPointsSelected || point.id === this.selectedPointId) {
        circle.classList.add('selected');
      }
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', pointRadiusPx.toFixed(2));
      circle.setAttribute('data-point-id', String(point.id));
      circle.setAttribute('tabindex', '0');
      circle.setAttribute('role', 'button');
      circle.setAttribute('aria-label', `${point.time.toFixed(2)} seconds, ${Math.round(point.bpm)} bpm`);
      pointGroup.appendChild(circle);
      fragment.appendChild(pointGroup);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'curve-point-label');
      const labelText = String(Math.round(point.bpm));
      const estimatedWidth = Math.max(56, labelText.length * 8);
      const estimatedWidthSvg = estimatedWidth / scale.x;
      const canFitOnRight = (x + 14 + estimatedWidthSvg) <= (this.svgWidth - this.padding.right - 2);
      const labelX = canFitOnRight ? (x + 14) : (x - 14 - estimatedWidthSvg);
      const labelOffsets = [0, -24, 24, -48, 48, -72, 72];
      let labelY = y - 12;
      const paddingX = 10;
      const paddingY = 6;

      for (let offsetIndex = 0; offsetIndex < labelOffsets.length; offsetIndex++) {
        const candidateY = (y - 12) + labelOffsets[offsetIndex];
        const candidateRect = {
          left: labelX,
          right: labelX + estimatedWidth,
          top: candidateY - 12,
          bottom: candidateY + 4
        };

        const overlaps = placedLabels.some((placedRect) => {
          return !(
            (candidateRect.right + paddingX) < (placedRect.left - paddingX) ||
            (candidateRect.left - paddingX) > (placedRect.right + paddingX) ||
            (candidateRect.bottom + paddingY) < (placedRect.top - paddingY) ||
            (candidateRect.top - paddingY) > (placedRect.bottom + paddingY)
          );
        });

        if (!overlaps) {
          labelY = candidateY;
          placedLabels.push(candidateRect);
          break;
        }

        if (offsetIndex === labelOffsets.length - 1) {
          labelY = candidateY;
          placedLabels.push(candidateRect);
        }
      }
      label.setAttribute('x', '0');
      label.setAttribute('y', '0');
      label.setAttribute('dominant-baseline', 'middle');
      label.textContent = labelText;
      const labelGroup = this.createNonStretchGroup(labelX, labelY, scale);
      labelGroup.appendChild(label);
      labelsFragment.appendChild(labelGroup);
    });

    this.pointsLayer.replaceChildren(fragment);
    this.labelsLayer.replaceChildren(labelsFragment);
  }

  updateOutputs() {
    const currentBpm = this.sampleBpmAt(this.playPosition);
    if (document.activeElement !== this.bpmOutput) {
      this.bpmOutput.value = Math.round(currentBpm).toString();
    }
    this.beatsOutput.value = this.integrateBeats().toFixed(2);
    this.pointsOutput.value = String(this.points.length);
    this.positionInput.max = this.getDuration().toFixed(2);
    this.positionInput.value = this.playPosition.toFixed(2);
    if (document.activeElement !== this.hzInput) {
      this.hzInput.value = this.getCurrentCurveHz().toFixed(2).replace(/\.00$/, '');
    }
    this.durationInput.value = this.getDuration().toFixed(2).replace(/\.00$/, '');
  }

  renderSummary() {
    const duration = this.getDuration();
    const beats = this.integrateBeats();

    const valuesLines = [
      `Curve: duration: ${duration.toFixed(2)}s`,
      `Bpm: ${Math.round(this.sampleBpmAt(this.playPosition))}`,
      `Beats: ${beats.toFixed(2)}`,
      `Points: ${this.points.length}`,
      `Position: ${this.playPosition.toFixed(2)}s`,
      `Hz: ${this.getCurrentCurveHz().toFixed(2).replace(/\.00$/, '')}`,
      `Duration: ${duration.toFixed(2)}s`,
      `Curve: ${this.curveSelect.value}`
    ];

    const curveLines = [];
    this.getSortedPoints().forEach((point, index) => {
      curveLines.push(`Beat: ${index + 1}, ${point.time.toFixed(2)}s: ${Math.round(point.bpm)} bpm [${point.curve || this.defaultCurve}]`);
    });

    if (this.panelView === 'curve') {
      this.infoText.value = curveLines.join('\n');
    } else {
      this.infoText.value = valuesLines.join('\n');
    }

    if (this.statusText) {
      this.statusText.textContent = `Duration: ${duration.toFixed(2)}s`;
    }
  }

  renderPlayhead() {
    const duration = this.getDuration();
    const innerWidth = this.getInnerWidth();
    const x = this.padding.left + (this.playPosition / duration) * innerWidth;
    this.playhead.setAttribute('x1', x.toFixed(2));
    this.playhead.setAttribute('x2', x.toFixed(2));
    this.playhead.setAttribute('y1', this.padding.top.toFixed(2));
    this.playhead.setAttribute('y2', (this.svgHeight - this.padding.bottom).toFixed(2));
    this.playhead.classList.add('visible');
  }

  render() {
    this.points.sort((left, right) => left.time - right.time);
    this.updateOutputs();
    this.renderSummary();
    this.renderGrid();
    this.curveLine.setAttribute('d', this.buildCurvePath());
    this.renderPoints();
    this.renderPlayhead();
    this.renderTimeline();
    this.syncButtonStates();
    this.saveState();
  }

  getCssVariable(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  renderTimeline() {
    if (!this.timelineSvg || !this.svgUtils) return;

    const height = this.svgTimeline?.resolveHeight?.({
      svg: this.timelineSvg,
      minHeight: this.timelineMinHeight
    }) || this.timelineMinHeight;
    const width = this.timelineWidth;
    const padding = { top: 12, right: 12, bottom: 26, left: 40 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const range = this.getBpmRange();
    const duration = this.getDuration();

    this.svgTimeline?.setViewBox?.({
      svg: this.timelineSvg,
      width,
      height
    });
    this.timelineSvg.innerHTML = '';

    const barsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    if (this.isTimelineGuidesVisible) {
      const guidesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.timelineSvg.appendChild(guidesLayer);

      const verticalCount = Math.max(2, Math.round(duration));
      for (let index = 0; index <= verticalCount; index++) {
        const time = (duration / verticalCount) * index;
        const x = padding.left + (time / duration) * innerWidth;
        guidesLayer.appendChild(this.svgUtils.createLine({
          x1: x,
          y1: padding.top,
          x2: x,
          y2: padding.top + innerHeight,
          color: this.isTimelineBright ? '#fff' : this.getCssVariable('--grey1', '#404040')
        }));
        guidesLayer.appendChild(this.svgUtils.createText({
          x: x - 14,
          y: height - 6,
          text: `${time.toFixed(1)}s`,
          color: this.isTimelineBright ? '#fff' : this.getCssVariable('--grey2', '#808080'),
          size: 13,
          anchor: 'start'
        }));
      }
    }

    this.timelineSvg.appendChild(barsLayer);

    // Timeline data uses 1px vertical bars only. Height encodes BPM.
    const barSpacing = 6;
    const barCount = Math.max(1, Math.floor(innerWidth / barSpacing));
    for (let index = 0; index <= barCount; index++) {
      const time = (duration * index) / barCount;
      const bpm = this.sampleBpmAt(time);
      const x = padding.left + (index * barSpacing);
      const y = padding.top + innerHeight - ((bpm - range.min) / (range.max - range.min || 1)) * innerHeight;
      barsLayer.appendChild(this.svgUtils.createLine({
        x1: x,
        y1: y,
        x2: x,
        y2: padding.top + innerHeight,
        color: this.getCssVariable('--color1', '#0080ff')
      }));
    }
  }

  ensureAudioContext() {
    if (this.audioContext) return this.audioContext;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      window.addEventListener('pekosoft:global-sound-change', () => this.updateMasterSoundOutput());
      this.ensureMetersAnalyser();
      this.updateMetersSourceBridge();
    } catch {
      this.audioContext = null;
    }
    return this.audioContext;
  }

  ensureMetersAnalyser() {
    if (!this.audioContext) return null;
    if (!this.metersAnalyser) {
      this.metersAnalyser = this.audioContext.createAnalyser();
      this.metersAnalyser.fftSize = 2048;
      if (!this.masterMuteGainNode) {
        this.masterMuteGainNode = this.audioContext.createGain();
        this.masterMuteGainNode.gain.value = this.isSoundEnabled && localStorage.getItem('global.sound') !== 'false' ? 1 : 0;
        this.masterMuteGainNode.connect(this.audioContext.destination);
      }
      this.metersAnalyser.connect(this.masterMuteGainNode);
    }
    return this.metersAnalyser;
  }

  updateMasterSoundOutput() {
    if (!this.masterMuteGainNode || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    const globalSoundOn = localStorage.getItem('global.sound') !== 'false';
    this.masterMuteGainNode.gain.cancelScheduledValues(now);
    this.masterMuteGainNode.gain.setValueAtTime(this.isSoundEnabled && globalSoundOn ? 1 : 0, now);
  }

  touchMetersActivity(whenSec) {
    const fallbackNow = this.audioContext ? this.audioContext.currentTime : 0;
    const value = Number.isFinite(whenSec) ? whenSec : fallbackNow;
    this.metersLastActiveSec = Math.max(this.metersLastActiveSec, value);
  }

  updateMetersSourceBridge() {
    const analyser = this.ensureMetersAnalyser();
    if (!this.audioContext || !analyser) {
      window.__pekosoftMetersSource = null;
      return;
    }

    window.__pekosoftMetersSource = {
      analyser,
      channelCount: 1,
      sampleRate: this.audioContext.sampleRate,
      isActive: () => this.isPlaying || ((this.audioContext.currentTime - this.metersLastActiveSec) < 0.20),
      isStopped: () => !this.isPlaying
    };
  }

  playPointSound() {
    if (!this.isBeatSoundEnabled || typeof window.playTransientSound !== 'function') return;
    const audioContext = this.ensureAudioContext();
    if (!audioContext) return;
    if ((audioContext.currentTime - this.lastBeatSoundAt) < 0.02) return;

    const baseFrequency = typeof window.getTransientBaseFrequencyHz === 'function'
      ? window.getTransientBaseFrequencyHz()
      : 880;
    const frequencyRatio = this.getHz() / baseFrequency;
    const beatTone = this.normalizeBeatTone(this.beatSelect ? this.beatSelect.value : this.defaultBeatTone);

    window.playTransientSound({
      audioContext,
      destinationNode: this.ensureMetersAnalyser(),
      tone: beatTone,
      gain: 0.4 * this.getBeatGain(),
      pitchRatio: frequencyRatio,
      durationSec: 0.06
    });
    this.lastBeatSoundAt = audioContext.currentTime;
    this.touchMetersActivity(audioContext.currentTime);
    this.updateMetersSourceBridge();
  }

  stopContinuousTone() {
    if (typeof window.stopContinuousToneVoice === 'function') {
      window.stopContinuousToneVoice(this.toneVoiceState);
      return;
    }

    this.toneVoiceState = {};
  }

  updateContinuousTone() {
    const audioContext = this.ensureAudioContext();
    if (!audioContext) return;

    if (!this.isToneEnabled || !this.isPlaying) {
      this.stopContinuousTone();
      return;
    }

    const selectedTone = this.normalizeToneChoice(this.toneSelect.value);
    const bpm = this.sampleBpmAt(this.playPosition);
    const bpmRatio = Math.max(0, bpm) / 120;
    const toneLevel = 0.08;

    if (typeof window.updateContinuousToneVoice === 'function') {
      this.toneVoiceState = window.updateContinuousToneVoice({
        audioContext,
        tone: selectedTone,
        baseHz: this.getHz(),
        bpmRatio,
        gain: toneLevel * this.getToneGain(),
        enabled: true,
        destinationNode: this.ensureMetersAnalyser(),
        voiceState: this.toneVoiceState
      }) || this.toneVoiceState;
    }
    this.touchMetersActivity(audioContext.currentTime);
    this.updateMetersSourceBridge();
  }

  togglePlayback() {
    if (this.isPlaying) {
      this.stopPlayback();
      return;
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // Resume is best-effort; the next gesture can retry.
      });
    }

    this.isPlaying = true;
    this.playStartedAt = performance.now() - (this.playPosition * 1000);
    this.lastPlaybackPosition = this.playPosition;
    this.syncButtonStates();
    this.updateContinuousTone();
    this.updateMetersSourceBridge();
    this.animationFrame = requestAnimationFrame((timestamp) => this.tickPlayback(timestamp));
  }

  stopPlayback() {
    this.isPlaying = false;
    this.stopContinuousTone();
    this.syncButtonStates();
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.updateMetersSourceBridge();
  }

  tickPlayback(timestamp) {
    if (!this.isPlaying) return;

    const duration = this.getDuration();
    const elapsed = (timestamp - this.playStartedAt) / 1000;
    let nextPosition = elapsed;
    let wrapped = false;

    if (nextPosition >= duration) {
      if (this.isLoopEnabled) {
        nextPosition = nextPosition % duration;
        this.playStartedAt = timestamp - (nextPosition * 1000);
        wrapped = true;
      } else {
        this.playPosition = duration;
        this.render();
        this.stopPlayback();
        return;
      }
    }

    const previousPosition = this.lastPlaybackPosition;
    this.playPosition = nextPosition;
    this.updateContinuousTone();
    this.triggerSoundsBetween(previousPosition, nextPosition, wrapped);
    this.lastPlaybackPosition = nextPosition;
    this.render();
    this.animationFrame = requestAnimationFrame((nextTimestamp) => this.tickPlayback(nextTimestamp));
  }

  triggerSoundsBetween(previousPosition, nextPosition, wrapped) {
    const triggerBeatRange = (startTime, endTime) => {
      const startBeats = this.integrateBeatsTo(startTime);
      const endBeats = this.integrateBeatsTo(endTime);
      const startIndex = Math.floor(startBeats);
      const endIndex = Math.floor(endBeats);
      for (let beatIndex = startIndex + 1; beatIndex <= endIndex; beatIndex++) {
        this.playPointSound();
      }
    };

    if (!wrapped && nextPosition >= previousPosition) {
      triggerBeatRange(previousPosition, nextPosition);
      return;
    }

    triggerBeatRange(previousPosition, this.getDuration());
    triggerBeatRange(0, nextPosition);
  }

  copySummary() {
    navigator.clipboard?.writeText(this.infoText.value || '');
  }
}

// END OF FILE
