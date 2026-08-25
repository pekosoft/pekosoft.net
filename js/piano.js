// Pekosoft Piano
// pekosoft.net/js/piano.js

const cssVars = getComputedStyle(document.documentElement);
const colorPrimary = cssVars.getPropertyValue('--color1').trim();

function clampVolume(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

class Piano {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    // Set up analyzer (before masterGain so it measures signal regardless of output mute)
    this.analyzer = this.audioContext.createAnalyser();
    this.analyzer.fftSize = 2048;
    // Route: oscillators → analyzer → masterGain → destination
    this.analyzer.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    // Shared source for meters module on Piano page.
    window.__pekosoftMetersSource = {
      analyser: this.analyzer,
      channelCount: 1,
      sampleRate: this.audioContext.sampleRate
    };
    
    // Load settings from localStorage or use defaults
    const settings = this.loadSettings();
    this.toneType = this.normalizeToneType(settings.toneType);
    this.showNoteLabels = settings.showNoteLabels || false;
    this.showOctaveLabels = settings.showOctaveLabels || false;
    this.lastNotePlayed = settings.lastNotePlayed || null;
    this.hapticEnabled = settings.hapticEnabled || false;
    this.volume = Number.isFinite(settings.volume) ? settings.volume : 100;
    this.isSoundEnabled = settings.isSoundEnabled !== undefined ? settings.isSoundEnabled : true;
    this.updateMasterGain();
    window.addEventListener('pekosoft:global-sound-change', () => this.updateMasterGain());
    this.glideEnabled = settings.glideEnabled !== undefined ? settings.glideEnabled : true;
    this.timelineGuides = settings.timelineGuides !== undefined ? settings.timelineGuides : true;
    this.timelineBright = localStorage.getItem('piano.timeline_bright') === null
      ? (window.PekoBrightGuides?.getGlobal() || false)
      : localStorage.getItem('piano.timeline_bright') === 'true';
    this.rangeMode = settings.rangeMode === 'one' ? 'one' : 'two';
    this.startOctave = Number.isFinite(Number(settings.startOctave)) ? Number(settings.startOctave) : 4;
    this.rollWindowMs = 8000;
    this.rollNotes = [];
    this.activeRollNotes = new Map();
    this.resizeRafId = null;
    this.pointerNotes = new Map();

    // Define key spacing relative to each octave's internal coordinate system
    const keyWidth = 50;
    const blackKeyOffset = 35;

    this.keyWidth = keyWidth;
    this.octaveWidth = keyWidth * 7;
    this.keys = this.createPianoKeys(keyWidth, blackKeyOffset);
    this.minOctave = Math.min(...this.keys.map(key => key.octave));
    this.maxOctave = Math.max(...this.keys.map(key => key.octave));
    this.startOctave = this.getClampedStartOctave(this.startOctave);

    // Map to store active oscillators and gains
    this.activeOscillators = new Map();
    this.activeGains = new Map();
    
    // Recording functionality
    this.isRecording = false;
    this.isPlaying = false;
    this.recordedNotes = [];
    this.recordStartTime = 0;
    this.playbackInterval = null;

    // Load recorded sequence from localStorage
    try {
      const savedRecording = localStorage.getItem('piano.recording');
      if (savedRecording) {
        this.recordedNotes = JSON.parse(savedRecording);
      }
    } catch (e) {
      this.recordedNotes = [];
    }

    // Add new property for formatted text
    this.formattedRecording = '';

    // Add looping property
    this.isLooping = false;
    
    this.init();
    this.initTimelineCanvases();
    this.setupResizeHandler();
    this.setupPointerHandler();
    this.observeTimelineContainerState();
    this.initTimelineButtons();
    this.initToggleButton();
    this.initOctaveButton();
    this.initGlideButton();
    this.initToneSelector();
    this.initResetButton();
    this.initRangeButtons();
    this.initRecordButton();
    this.initPlayButton();
    this.updateNoteLabels(); // Set initial note label visibility
    this.initRecordingText(); // Add this line before end of constructor
    this.initLoopButton(); // Add this line before end of constructor
    this.initSaveButton(); // Add this line before end of constructor
    this.initSaveControlsButton(); // Add this line before end of constructor
    this.initOpenButton(); // Add this line before end of constructor
    this.initHapticButton(); // Add this line before end of constructor
    this.initSoundButton(); // Add this line for master sound toggle
    this.initCopyButton(); // Add this line before end of constructor
    this.initVolumeControls();
    this.updateActionButtonStates();
  }

  loadSettings() {
    try {
      const settings = localStorage.getItem('piano.settings');
      const parsedSettings = settings ? JSON.parse(settings) : {};

      if (parsedSettings.hapticEnabled === undefined) {
        parsedSettings.hapticEnabled = localStorage.getItem('global.haptics') === 'true';
      }

      if (parsedSettings.timelineGuides === undefined) {
        parsedSettings.timelineGuides = localStorage.getItem('global.guides') !== 'false';
      }

      return parsedSettings;
    } catch (e) {
      return {};
    }
  }

  saveSettings() {
    const settings = {
      toneType: this.toneType,
      showNoteLabels: this.showNoteLabels,
      showOctaveLabels: this.showOctaveLabels,
      lastNotePlayed: this.lastNotePlayed,
      hapticEnabled: this.hapticEnabled,
      isSoundEnabled: this.isSoundEnabled,
      glideEnabled: this.glideEnabled,
      volume: this.volume,
      timelineGuides: this.timelineGuides,
      rangeMode: this.rangeMode,
      startOctave: this.startOctave
    };
    localStorage.setItem('piano.settings', JSON.stringify(settings));
  }

  setButtonGrey(buttonId, isGrey) {
    const button = document.getElementById(buttonId);
    if (!button) {
      return;
    }

    button.classList.toggle('grey', isGrey);
  }

  updateActionButtonStates() {
    const textarea = document.getElementById('recordingText');
    const hasRecordedNotes = this.recordedNotes.length > 0;
    const hasPanelText = textarea ? textarea.value.trim().length > 0 : false;

    this.setButtonGrey('play-button', !hasRecordedNotes);
    this.setButtonGrey('loop-button', !hasRecordedNotes);
    this.setButtonGrey('save-controls-button', !hasRecordedNotes);
    this.setButtonGrey('save-button', !hasRecordedNotes);
    this.setButtonGrey('copy-button', !hasPanelText);
  }

  parseRecordingText(content) {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return [];
    }

    return trimmedContent.split('\n').map(line => {
      const match = line.trim().match(/^(\d+)ms: (start|stop) (.+)$/);
      if (!match) {
        throw new Error('Invalid recording line');
      }

      return {
        timestamp: parseInt(match[1], 10),
        type: match[2],
        note: match[3]
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }

  resetSettings() {
    this.isRecording = false;
    this.isPlaying = false;
    localStorage.removeItem('piano.settings');
    localStorage.removeItem('piano.recording');
    this.recordedNotes = [];
    this.toneType = 'sine';
    this.showNoteLabels = false;
    this.showOctaveLabels = false;
    this.lastNotePlayed = null;
    this.hapticEnabled = false;
    this.glideEnabled = true;
    this.volume = 100;
    this.timelineGuides = true;
    this.rangeMode = 'two';
    this.startOctave = 4;
    this.rollNotes = [];
    this.activeRollNotes.clear();
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    Array.from(this.activeOscillators.keys()).forEach(note => {
      const key = this.keys.find(currentKey => currentKey.note === note);
      if (key) {
        this.stopNote(key);
      }
    });
    document.getElementById('haptic-button').classList.remove('button-on');
    document.getElementById('glide-button').classList.add('button-on');
    // Update UI
    document.getElementById('tone-type').value = 'sine';
    document.getElementById('toggle-notes-button').classList.remove('button-on');
    document.getElementById('toggle-octaves-button').classList.remove('button-on');
    document.getElementById('hzDisplay').value = '';
    document.getElementById('noteDisplay').value = '';
    document.getElementById('midiDisplay').value = '';
    document.getElementById('record-button').classList.remove('recording');
    document.getElementById('play-button').classList.remove('button-on');
    document.getElementById('loop-button').classList.remove('button-on');
    document.getElementById('volume-slider').value = '100';
    this.applyRangeMode(false);
    document.getElementById('recordingText').classList.remove('error');
    document.getElementById('copy-button').classList.remove('copied');
    this.isLooping = false;
    this.masterGain.gain.value = 1;
    this.updateNoteLabels();
    this.updateOctaveLabels();
    this.updateRecordingText();
    this.updateActionButtonStates();
  }

  createOscillator(freq) {
    const tone = this.toneType;

    if (typeof window.createSustainedToneVoice === 'function') {
      const voice = window.createSustainedToneVoice({
        audioContext: this.audioContext,
        tone,
        frequency: freq,
        destinationNode: this.analyzer,
        standardGain: 0.5,
        pianoPeakGain: 0.65,
        pianoBodyGain: 0.25
      });
      if (voice) return voice;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    if (tone === 'piano') {
      const real = new Float32Array(8);
      const imag = new Float32Array([0, 1.0, 0.46, 0.23, 0.14, 0.08, 0.04, 0.02]);
      const periodicWave = this.audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
      oscillator.setPeriodicWave(periodicWave);
      oscillator.frequency.setValueAtTime(freq * 1.01, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(freq, this.audioContext.currentTime + 0.03);
    } else {
      oscillator.type = tone;
      oscillator.frequency.value = freq;
    }

    gainNode.gain.value = 0;
    
    oscillator.connect(gainNode);
    gainNode.connect(this.analyzer);
    
    oscillator.start();

    if (tone === 'piano') {
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.65, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.25, now + 0.08);
    } else {
      gainNode.gain.setTargetAtTime(0.5, this.audioContext.currentTime, 0.01);
    }
    
    return { oscillator, gainNode, tone };
  }

  normalizeToneType(tone) {
    const allowed = ['sine', 'square', 'sawtooth', 'triangle', 'piano'];
    return allowed.includes(tone) ? tone : 'sine';
  }

  createPianoKeys(keyWidth, blackKeyOffset) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const whiteKeyIndexByNote = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    const blackKeyOffsetByNote = { 'C#': 0, 'D#': 1, 'F#': 3, 'G#': 4, 'A#': 5 };
    const octaveGroups = new Map();

    for (let midi = 21; midi <= 108; midi++) {
      const noteName = noteNames[midi % 12];
      const octaveNumber = Math.floor(midi / 12) - 1;
      const frequency = 440 * Math.pow(2, (midi - 69) / 12);
      const octaveKey = String(octaveNumber);
      const octaveDisplayNumber = octaveNumber;

      if (!octaveGroups.has(octaveKey)) {
        octaveGroups.set(octaveKey, []);
      }

      const type = noteName.includes('#') ? 'black' : 'white';
      const x = type === 'black'
        ? (blackKeyOffsetByNote[noteName] * keyWidth) + blackKeyOffset
        : whiteKeyIndexByNote[noteName] * keyWidth;

      octaveGroups.get(octaveKey).push({
        note: `${noteName}${octaveNumber}`,
        freq: Number(frequency.toFixed(3)),
        type,
        x,
        octave: octaveDisplayNumber,
        midi
      });
    }

    return Array.from(octaveGroups.values()).flat();
  }

  applyRangeMode(shouldSave = true) {
    const pianoContainer = document.getElementById('piano');
    if (!pianoContainer) return;

    const isOne = this.rangeMode === 'one';
    const visibleOctaveCount = this.getVisibleOctaveCount();
    this.startOctave = this.getClampedStartOctave(this.startOctave, visibleOctaveCount);
    const visibleEndOctave = this.startOctave + visibleOctaveCount;

    pianoContainer.classList.toggle('piano-range-one', isOne);
    pianoContainer.classList.toggle('piano-range-two', !isOne);

    pianoContainer.querySelectorAll('svg[data-octave]').forEach(svg => {
      const octave = Number(svg.dataset.octave);
      const isVisible = octave >= this.startOctave && octave < visibleEndOctave;
      svg.classList.toggle('piano-octave-hidden', !isVisible);
      if (isVisible) {
        const visibleIndex = octave - this.startOctave;
        const rowIndex = Math.floor(visibleIndex / 2);
        const columnIndex = visibleIndex % 2;
        const rowCount = Math.ceil(visibleOctaveCount / 2);
        svg.style.order = String(((rowCount - 1 - rowIndex) * 2) + columnIndex);
      } else {
        svg.style.removeProperty('order');
      }
    });

    document.getElementById('piano-range-one-button')?.classList.toggle('button-on', isOne);
    document.getElementById('piano-range-two-button')?.classList.toggle('button-on', !isOne);
    document.getElementById('piano-scroll-left-button')?.classList.toggle('grey', this.startOctave <= this.minOctave);
    document.getElementById('piano-scroll-right-button')?.classList.toggle('grey', this.startOctave >= this.getMaxStartOctave(visibleOctaveCount));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pianoContainer.scrollLeft = 0;
        this.updateLabelTransforms();
      });
    });

    if (shouldSave) {
      this.saveSettings();
    }
  }

  getVisibleOctaveCount() {
    return this.rangeMode === 'one' ? 2 : 4;
  }

  getMaxStartOctave(visibleOctaveCount = this.getVisibleOctaveCount()) {
    return Math.max(this.minOctave, this.maxOctave - visibleOctaveCount + 1);
  }

  getClampedStartOctave(startOctave, visibleOctaveCount = this.getVisibleOctaveCount()) {
    const numericStart = Number.isFinite(Number(startOctave)) ? Number(startOctave) : 4;
    return Math.max(this.minOctave, Math.min(this.getMaxStartOctave(visibleOctaveCount), Math.round(numericStart)));
  }

  scrollOctaves(direction) {
    const nextStartOctave = this.getClampedStartOctave(this.startOctave + direction);
    if (nextStartOctave === this.startOctave) return;
    this.startOctave = nextStartOctave;
    this.applyRangeMode(true);
  }

  bindHoldButton(button, action) {
    if (!button) return;
    let intervalId = null;
    let activePointerId = null;

    const start = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      activePointerId = event.pointerId;
      if (typeof button.setPointerCapture === 'function') {
        try {
          button.setPointerCapture(activePointerId);
        } catch (_) {}
      }
      action();
      window.clearInterval(intervalId);
      intervalId = window.setInterval(action, 180);
    };

    const stop = () => {
      window.clearInterval(intervalId);
      intervalId = null;
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

    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', stopPointer);
    button.addEventListener('pointercancel', stopPointer);
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action();
      }
    });
  }

  initRangeButtons() {
    const oneButton = document.getElementById('piano-range-one-button');
    const twoButton = document.getElementById('piano-range-two-button');
    const leftButton = document.getElementById('piano-scroll-left-button');
    const rightButton = document.getElementById('piano-scroll-right-button');

    oneButton?.addEventListener('click', () => {
      this.rangeMode = 'one';
      this.applyRangeMode(true);
    });

    twoButton?.addEventListener('click', () => {
      this.rangeMode = 'two';
      this.applyRangeMode(true);
    });

    this.bindHoldButton(leftButton, () => this.scrollOctaves(-1));
    this.bindHoldButton(rightButton, () => this.scrollOctaves(1));
  }

  init() {
    const pianoContainer = document.getElementById('piano');
    pianoContainer.innerHTML = '';
    
    // Create separate SVG for each octave. Partial edge octaves keep the same coordinate space as full octaves.
    const octaveViewBoxWidth = 350; // 7 white keys * 50 each
    const viewBoxHeight = 200;
    const octaves = Array.from(new Set(this.keys.map(key => key.octave))).sort((a, b) => a - b);
    
    octaves.forEach(octave => {
      const octaveKeys = this.keys.filter(key => key.octave === octave);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${octaveViewBoxWidth} ${viewBoxHeight}`);
      svg.setAttribute('width', String(octaveViewBoxWidth));
      svg.setAttribute('height', String(viewBoxHeight));
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.classList.add(`octave-${octave}`);
      svg.dataset.octave = String(octave);
      
      // Create white keys first.
      octaveKeys.filter(key => key.type === 'white').forEach(key => {
        const keyElement = this.createKey(key);
        svg.appendChild(keyElement);
      });
      
      // Create black keys on top.
      octaveKeys.filter(key => key.type === 'black').forEach(key => {
        const keyElement = this.createKey(key);
        svg.appendChild(keyElement);
      });
      
      // Append the SVG to the piano container.
      pianoContainer.appendChild(svg);
    });

    this.applyRangeMode(false);
    
    // After piano is initialized, restore last note display if available
    if (this.lastNotePlayed) {
      const lastKey = this.keys.find(key => key.note === this.lastNotePlayed);
      if (lastKey) {
        document.getElementById('hzDisplay').value = lastKey.freq.toFixed(3);
        document.getElementById('noteDisplay').value = lastKey.note;
        document.getElementById('midiDisplay').value = lastKey.midi;
      }
    }
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.scheduleCanvasResize();
      this.updateLabelTransforms();
    });

    const pianoContainer = document.getElementById('piano');
    if (pianoContainer && typeof ResizeObserver === 'function') {
      const pianoObserver = new ResizeObserver(() => this.updateLabelTransforms());
      pianoObserver.observe(pianoContainer);
    }
  }

  setupPointerHandler() {
    window.addEventListener('pointermove', (event) => this.handlePointerMove(event));
    window.addEventListener('pointerup', (event) => this.handleKeyPointerUp(event));
    window.addEventListener('pointercancel', (event) => this.handleKeyPointerUp(event));
  }

  getKeyAtPoint(clientX, clientY) {
    const pianoContainer = document.getElementById('piano');
    const keyElement = document.elementFromPoint(clientX, clientY)?.closest?.('.key');
    if (!pianoContainer || !keyElement || !pianoContainer.contains(keyElement)) return null;
    return this.keys.find(key => key.note === keyElement.dataset.note) || null;
  }

  handlePointerMove(event) {
    if (!this.glideEnabled || !this.pointerNotes.has(event.pointerId)) return;

    event.preventDefault();
    const key = this.getKeyAtPoint(event.clientX, event.clientY);
    const previousNote = this.pointerNotes.get(event.pointerId);

    if (!key) {
      this.stopPointerNote(event.pointerId);
      return;
    }

    if (previousNote === key.note) return;
    this.stopPointerNote(event.pointerId);
    this.pointerNotes.set(event.pointerId, key.note);
    this.playNote(key);
  }

  updateLabelTransforms() {
    document.querySelectorAll('#piano svg[data-octave]').forEach(svg => {
      const rect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;
      if (!rect.width || !rect.height || !viewBox.width || !viewBox.height) return;

      const scaleX = rect.width / viewBox.width;
      const scaleY = rect.height / viewBox.height;
      const labelScaleX = scaleX ? scaleY / scaleX : 1;

      svg.querySelectorAll('.note-label, .octave-label').forEach(label => {
        const x = Number(label.getAttribute('x')) || 0;
        const y = Number(label.getAttribute('y')) || 0;
        label.setAttribute('transform', `translate(${x} ${y}) scale(${labelScaleX} 1) translate(${-x} ${-y})`);
      });
    });
  }

  scheduleCanvasResize() {
    if (this.resizeRafId !== null) {
      cancelAnimationFrame(this.resizeRafId);
    }

    this.resizeRafId = requestAnimationFrame(() => {
      this.resizeRafId = null;
      this.resizeCanvases();
    });
  }

  observeTimelineContainerState() {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.scheduleCanvasResize();
          break;
        }
      }
    });

    observer.observe(timelineContainer, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  resizeCanvas(canvas, ctx) {
    if (!canvas || !ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resizeCanvases() {
    this.resizeCanvas(this.pianoRollCanvas, this.pianoRollCtx);
  }

  initTimelineCanvases() {
    this.pianoRollCanvas = document.getElementById('piano-roll');
    this.pianoRollCtx = this.pianoRollCanvas.getContext('2d');
    this.resizeCanvases();
    this.drawPianoRoll();
  }

  initTimelineButtons() {
    const guidesButton = document.getElementById('timeline-guides-button');
    const brightButton = document.getElementById('timeline-bright-button');

    guidesButton.classList.toggle('button-on', this.timelineGuides);
    brightButton.classList.toggle('button-on', this.timelineBright);
    guidesButton.addEventListener('click', () => {
      this.timelineGuides = !this.timelineGuides;
      guidesButton.classList.toggle('button-on', this.timelineGuides);
      this.saveSettings();
      this.updateActionButtonStates();
    });
    brightButton.addEventListener('click', () => {
      this.timelineBright = !this.timelineBright;
      localStorage.setItem('piano.timeline_bright', String(this.timelineBright));
      brightButton.classList.toggle('button-on', this.timelineBright);
    });
    window.addEventListener('pekosoft:bright-guides-global-change', (event) => {
      this.timelineBright = !!event.detail?.enabled;
      brightButton.classList.toggle('button-on', this.timelineBright);
    });
  }

  drawPianoRoll() {
    requestAnimationFrame(() => this.drawPianoRoll());

    const width = this.pianoRollCanvas.width / window.devicePixelRatio;
    const height = this.pianoRollCanvas.height / window.devicePixelRatio;
    const now = performance.now();
    const windowStart = now - this.rollWindowMs;
    const midiValues = this.keys.map(key => key.midi);
    const minMidi = Math.min(...midiValues);
    const maxMidi = Math.max(...midiValues);
    const rowCount = maxMidi - minMidi + 1;
    const rowHeight = height / rowCount;

    this.rollNotes = this.rollNotes.filter(note => {
      const noteEnd = note.endTime ?? now;
      return noteEnd >= windowStart;
    });

    this.pianoRollCtx.clearRect(0, 0, width, height);

    if (this.timelineGuides) {
      this.pianoRollCtx.lineWidth = 1;
      this.pianoRollCtx.strokeStyle = this.timelineBright ? '#fff' : 'rgba(255, 255, 255, 0.08)';
      for (let row = 0; row <= rowCount; row++) {
        const y = row * rowHeight;
        this.pianoRollCtx.beginPath();
        this.pianoRollCtx.moveTo(0, y);
        this.pianoRollCtx.lineTo(width, y);
        this.pianoRollCtx.stroke();
      }
    }

    this.pianoRollCtx.fillStyle = colorPrimary;
    this.rollNotes.forEach((noteEvent) => {
      const noteStart = Math.max(noteEvent.startTime, windowStart);
      const noteEnd = Math.min(noteEvent.endTime ?? now, now);
      if (noteEnd <= noteStart) {
        return;
      }

      const x = ((noteStart - windowStart) / this.rollWindowMs) * width;
      const noteWidth = ((noteEnd - noteStart) / this.rollWindowMs) * width;
      const rowIndex = maxMidi - noteEvent.midi;
      const y = rowIndex * rowHeight;

      this.pianoRollCtx.globalAlpha = noteEvent.endTime ? 0.7 : 0.95;
      this.pianoRollCtx.fillRect(x, y + 1, Math.max(2, noteWidth), Math.max(2, rowHeight - 2));
    });
    this.pianoRollCtx.globalAlpha = 1;
  }

  startRollNote(key) {
    const rollNote = {
      note: key.note,
      midi: key.midi,
      startTime: performance.now(),
      endTime: null
    };
    this.rollNotes.push(rollNote);
    this.activeRollNotes.set(key.note, rollNote);
  }

  stopRollNote(key) {
    const activeNote = this.activeRollNotes.get(key.note);
    if (!activeNote) {
      return;
    }

    activeNote.endTime = performance.now();
    this.activeRollNotes.delete(key.note);
  }

  initToggleButton() {
    const button = document.getElementById('toggle-notes-button');
    if (this.showNoteLabels) {
      button.classList.add('button-on');
    }
    button.addEventListener('click', () => {
      this.showNoteLabels = !this.showNoteLabels;
      if (this.showNoteLabels) {
        button.classList.add('button-on');
      } else {
        button.classList.remove('button-on');
      }
      this.updateNoteLabels();
      this.saveSettings();
    });
  }

  initOctaveButton() {
    const button = document.getElementById('toggle-octaves-button');
    if (this.showOctaveLabels) {
      button.classList.add('button-on');
    }
    button.addEventListener('click', () => {
      this.showOctaveLabels = !this.showOctaveLabels;
      if (this.showOctaveLabels) {
        button.classList.add('button-on');
      } else {
        button.classList.remove('button-on');
      }
      this.updateOctaveLabels();
      this.saveSettings();
    });
  }

  initGlideButton() {
    const button = document.getElementById('glide-button');
    if (!button) return;
    button.classList.toggle('button-on', this.glideEnabled);
    button.addEventListener('click', () => {
      this.glideEnabled = !this.glideEnabled;
      button.classList.toggle('button-on', this.glideEnabled);
      this.stopPointerNotes();
      this.saveSettings();
    });
  }

  initToneSelector() {
    const selector = document.getElementById('tone-type');
    selector.value = this.toneType;
    selector.addEventListener('change', (e) => {
      this.toneType = e.target.value;
      this.saveSettings();
    });
  }

  initResetButton() {
    const resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', () => {
      this.resetSettings();
    });
  }

  initRecordButton() {
    const button = document.getElementById('record-button');
    button.addEventListener('click', () => {
      if (!this.isRecording) {
        this.startRecording();
      } else {
        this.stopRecording();
      }
    });
  }

  initPlayButton() {
    const button = document.getElementById('play-button');
    button.addEventListener('click', () => {
      if (!this.isPlaying) {
        this.startPlayback();
      } else {
        this.stopPlayback();
      }
    });
  }

  initLoopButton() {
    const button = document.getElementById('loop-button');
    button.addEventListener('click', () => {
      this.isLooping = !this.isLooping;
      if (this.isLooping) {
        button.classList.add('button-on');
      } else {
        button.classList.remove('button-on');
      }
    });
  }

  initSaveButton() {
    const button = document.getElementById('save-button');
    button.addEventListener('click', () => {
      this.saveRecordingToFile();
    });
  }

  initOpenButton() {
    const button = document.getElementById('open-button');
    const fileInput = document.getElementById('file-input');
    
    button.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const textarea = document.getElementById('recordingText');
            this.recordedNotes = this.parseRecordingText(event.target.result);
            
            // Save to localStorage
            localStorage.setItem('piano.recording', JSON.stringify(this.recordedNotes));
            
            // Update display
            this.updateRecordingText();
            textarea.classList.remove('error');
            
            // Reset file input
            fileInput.value = '';
          } catch (e) {
            document.getElementById('recordingText').classList.add('error');
          }
        };
        
        reader.readAsText(file);
      }
    });
  }

  initHapticButton() {
    const button = document.getElementById('haptic-button');
    if (this.hapticEnabled) {
      button.classList.add('button-on');
    }
    button.addEventListener('click', () => {
      this.hapticEnabled = !this.hapticEnabled;
      if (this.hapticEnabled) {
        button.classList.add('button-on');
      } else {
        button.classList.remove('button-on');
      }
      this.saveSettings();
    });
  }

  initSoundButton() {
    const button = document.getElementById('sound-master-button');
    button.classList.toggle('button-on', this.isSoundEnabled);
    button.addEventListener('click', () => {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {
          // Resume is best-effort; the next gesture can retry.
        });
      }
      this.isSoundEnabled = !this.isSoundEnabled;
      button.classList.toggle('button-on', this.isSoundEnabled);
      this.updateMasterGain();
      this.saveSettings();
    });
  }

  updateMasterGain() {
    if (!this.masterGain) return;
    const globalSoundOn = localStorage.getItem('global.sound') !== 'false';
    this.masterGain.gain.value = this.isSoundEnabled && globalSoundOn ? this.volume / 100 : 0;
  }

  initCopyButton() {
    const button = document.getElementById('copy-button');
    button.addEventListener('click', () => {
      const textarea = document.getElementById('recordingText');
      navigator.clipboard.writeText(textarea.value).then(() => {
        textarea.classList.remove('error');
        button.classList.add('copied');
        setTimeout(() => {
          button.classList.remove('copied');
        }, 1000);
      }).catch(() => {
        textarea.classList.add('error');
      });
    });
  }

  initVolumeControls() {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDecreaseButton = document.getElementById('volume-decrease-button');
    const volumeIncreaseButton = document.getElementById('volume-increase-button');

    const updateVolume = (newVolume) => {
      this.volume = clampVolume(newVolume);
      volumeSlider.value = String(this.volume);
      this.updateMasterGain();
      this.saveSettings();
    };

    volumeSlider.value = String(this.volume);
    this.updateMasterGain();

    volumeSlider.addEventListener('input', (event) => {
      updateVolume(event.target.value);
    });

    volumeDecreaseButton.addEventListener('click', () => {
      updateVolume(this.volume - 1);
    });

    volumeIncreaseButton.addEventListener('click', () => {
      updateVolume(this.volume + 1);
    });
  }

  vibrate() {
    if (this.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(50); // 50ms vibration
    }
  }

  startRecording() {
    this.isRecording = true;
    this.recordedNotes = [];
    this.recordStartTime = Date.now();
    const button = document.getElementById('record-button');
    button.classList.add('recording');
    this.updateRecordingText();
    this.updateActionButtonStates();
  }

  stopRecording() {
    this.isRecording = false;
    const button = document.getElementById('record-button');
    button.classList.remove('recording');
    
    // Save recording to localStorage
    // Save recording and last played note to localStorage
    localStorage.setItem('piano.recording', JSON.stringify(this.recordedNotes));
    this.saveSettings();
    this.updateRecordingText();
    this.updateActionButtonStates();
  }

  startPlayback() {
    if (this.recordedNotes.length === 0) {
      this.updateActionButtonStates();
      return;
    }

    this.isPlaying = true;
    const button = document.getElementById('play-button');
    button.classList.add('button-on');

    let currentIndex = 0;
    let startTime = Date.now();

    this.playbackInterval = setInterval(() => {
      const currentTime = Date.now() - startTime;
      
      while (currentIndex < this.recordedNotes.length && 
             this.recordedNotes[currentIndex].timestamp <= currentTime) {
        const note = this.recordedNotes[currentIndex];
        const key = this.keys.find(k => k.note === note.note);
        
        if (note.type === 'start') {
          this.playNote(key, { persistLastNote: false, allowHaptic: false });
        } else {
          this.stopNote(key);
        }
        
        currentIndex++;
      }

      if (currentIndex >= this.recordedNotes.length) {
        if (this.isLooping) {
          // Reset for next loop
          currentIndex = 0;
          startTime = Date.now();
          // Stop any lingering notes
          Array.from(this.activeOscillators.keys()).forEach(note => {
            const key = this.keys.find(k => k.note === note);
            this.stopNote(key);
          });
        } else {
          this.stopPlayback();
        }
      }
    }, 10);
  }

  stopPlayback() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    
    // Stop all active notes
    Array.from(this.activeOscillators.keys()).forEach(note => {
      const key = this.keys.find(k => k.note === note);
      this.stopNote(key);
    });

    const button = document.getElementById('play-button');
    button.classList.remove('button-on');
    this.updateActionButtonStates();
  }

  updateNoteLabels() {
    document.querySelectorAll('.note-label').forEach(label => {
      label.classList.toggle('visible', this.showNoteLabels);
    });
  }

  updateOctaveLabels() {
    document.querySelectorAll('.octave-label').forEach(label => {
      label.classList.toggle('visible', this.showOctaveLabels);
    });
  }

  createKey(key) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const keyElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const isWhite = key.type === 'white';
    
    keyElement.setAttribute('x', key.x);
    keyElement.setAttribute('y', '0');
    keyElement.setAttribute('width', isWhite ? '50' : '30');
    keyElement.setAttribute('height', isWhite ? '200' : '120');
    keyElement.setAttribute('class', `key ${key.type}-key`);
    keyElement.setAttribute('data-note', key.note);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', isWhite ? (Number(key.x) + 25) : (Number(key.x) + 15));
    text.setAttribute('y', isWhite ? '170' : '92');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'note-label');
    if (this.showNoteLabels) text.classList.add('visible');

    const noteName = key.note.replace(/[0-9]/g, '');
    text.textContent = noteName;

    const octaveText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    octaveText.setAttribute('x', isWhite ? (Number(key.x) + 25) : (Number(key.x) + 15));
    octaveText.setAttribute('y', isWhite ? '186' : '106');
    octaveText.setAttribute('text-anchor', 'middle');
    octaveText.setAttribute('class', 'octave-label');
    if (this.showOctaveLabels) octaveText.classList.add('visible');
    octaveText.textContent = key.octave;
    
    group.appendChild(keyElement);
    group.appendChild(text);
    group.appendChild(octaveText);
    
    group.addEventListener('pointerdown', (event) => this.handleKeyPointerDown(event, key));
    group.addEventListener('pointerenter', (event) => this.handleKeyPointerEnter(event, key));
    group.addEventListener('pointerup', (event) => this.handleKeyPointerUp(event));
    group.addEventListener('pointercancel', (event) => this.handleKeyPointerUp(event));
    group.addEventListener('lostpointercapture', (event) => this.handleKeyPointerUp(event));
    
    return group;
  }

  handleKeyPointerDown(event, key) {
    event.preventDefault();
    const group = event.currentTarget;
    try {
      group.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture can fail for synthetic events.
    }
    this.pointerNotes.set(event.pointerId, key.note);
    this.playNote(key);
  }

  handleKeyPointerEnter(event, key) {
    if (!this.glideEnabled || !event.buttons || !this.pointerNotes.has(event.pointerId)) return;
    const previousNote = this.pointerNotes.get(event.pointerId);
    if (previousNote === key.note) return;
    this.stopPointerNote(event.pointerId);
    this.pointerNotes.set(event.pointerId, key.note);
    this.playNote(key);
  }

  handleKeyPointerUp(event) {
    this.stopPointerNote(event.pointerId);
  }

  stopPointerNote(pointerId) {
    const note = this.pointerNotes.get(pointerId);
    if (!note) return;
    const key = this.keys.find(currentKey => currentKey.note === note);
    if (key) {
      this.stopNote(key);
    }
    this.pointerNotes.delete(pointerId);
  }

  stopPointerNotes() {
    Array.from(this.pointerNotes.keys()).forEach(pointerId => this.stopPointerNote(pointerId));
  }

  playNote(key, options = {}) {
    const { persistLastNote = true, allowHaptic = true } = options;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // Resume is best-effort; the next gesture can retry.
      });
    }
    if (allowHaptic) {
      this.vibrate();
    }
    if (!this.activeOscillators.has(key.note)) {
      const keyElement = document.querySelector(`[data-note="${key.note}"]`);
      keyElement.classList.add('active');
      
      const { oscillator, gainNode, tone } = this.createOscillator(key.freq);
      this.activeOscillators.set(key.note, oscillator);
      this.activeGains.set(key.note, { gainNode, tone });
      
      // Update displays
      document.getElementById('hzDisplay').value = key.freq.toFixed(3);
      document.getElementById('noteDisplay').value = key.note;
      document.getElementById('midiDisplay').value = key.midi;

      this.lastNotePlayed = key.note;
      if (persistLastNote) {
        this.saveSettings();
      }
      this.startRollNote(key);
      // Record note if recording
      if (this.isRecording) {
        this.recordedNotes.push({
          note: key.note,
          type: 'start',
          timestamp: Date.now() - this.recordStartTime
        });
        this.updateRecordingText();
      }
    }
  }

  stopNote(key) {
    if (this.activeOscillators.has(key.note)) {
      const keyElement = document.querySelector(`[data-note="${key.note}"]`);
      keyElement.classList.remove('active');
      
      const activeVoice = this.activeGains.get(key.note);
      const gainNode = activeVoice.gainNode;
      const isPiano = activeVoice.tone === 'piano';
      const now = this.audioContext.currentTime;
      const oscillator = this.activeOscillators.get(key.note);

      if (typeof window.releaseSustainedToneVoice === 'function') {
        window.releaseSustainedToneVoice({
          audioContext: this.audioContext,
          voice: { oscillator, gainNode, tone: activeVoice.tone },
          releaseSec: isPiano ? 0.12 : 0.1,
          onEnded: () => {
            try {
              gainNode.disconnect();
            } catch {
              // ignore disconnect races
            }
          }
        });
      } else {
        if (isPiano) {
          // Longer exponential tail avoids release click artifacts on piano-like timbre.
          gainNode.gain.cancelScheduledValues(now);
          gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        } else {
          gainNode.gain.setTargetAtTime(0, now, 0.01);
        }

        setTimeout(() => {
          oscillator.stop();
          gainNode.disconnect();
        }, isPiano ? 160 : 100);
      }
      
      this.activeOscillators.delete(key.note);
      this.activeGains.delete(key.note);
      this.stopRollNote(key);

      // Record note stop if recording
      if (this.isRecording) {
        this.recordedNotes.push({
          note: key.note,
          type: 'stop',
          timestamp: Date.now() - this.recordStartTime
        });
        this.updateRecordingText();
      }
    }
  }

  initRecordingText() {
    const textarea = document.getElementById('recordingText');
    textarea.addEventListener('input', () => {
      try {
        this.recordedNotes = this.parseRecordingText(textarea.value);
        
        // Save to localStorage
        localStorage.setItem('piano.recording', JSON.stringify(this.recordedNotes));
        
        // Remove error styling if present
        textarea.classList.remove('error');
      } catch (e) {
        // Visual feedback for invalid format
        textarea.classList.add('error');
      }
      this.updateActionButtonStates();
    });
    
    // Initial load of recording
    this.updateRecordingText();
  }

  updateRecordingText() {
    const textarea = document.getElementById('recordingText');
    this.formattedRecording = this.recordedNotes
      .map(note => `${note.timestamp}ms: ${note.type} ${note.note}`)
      .join('\n');
    textarea.value = this.formattedRecording;
    this.updateActionButtonStates();
  }

  saveRecordingToFile() {
    if (this.recordedNotes.length === 0) return;

    // Create text content
    const content = this.formattedRecording;
    
    // Create blob
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    
    // Generate filename with timestamp in the requested format
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const timestamp = `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
    a.download = `pekosoft_piano_recording_${timestamp}.txt`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  initSaveControlsButton() {
    const button = document.getElementById('save-controls-button');
    button.addEventListener('click', () => {
      this.synthesizeRecordingAsWav();
    });
  }

  async synthesizeRecordingAsWav() {
    if (this.recordedNotes.length === 0) return;

    const maxTimestamp = Math.max(...this.recordedNotes.map(n => n.timestamp));
    const sampleRate = 44100;
    const durationSeconds = (maxTimestamp + 1000) / 1000;
    const offlineContext = new OfflineAudioContext(1, sampleRate * durationSeconds, sampleRate);

    // Track active notes to synthesize
    const activeNotes = new Map();

    this.recordedNotes.forEach((event) => {
      const time = event.timestamp / 1000;
      const key = this.keys.find(k => k.note === event.note);
      if (!key) return;

      if (event.type === 'start') {
        const oscillator = offlineContext.createOscillator();
        const gainNode = offlineContext.createGain();
        
        if (this.toneType === 'piano') {
          const real = new Float32Array(8);
          const imag = new Float32Array([0, 1.0, 0.46, 0.23, 0.14, 0.08, 0.04, 0.02]);
          const periodicWave = offlineContext.createPeriodicWave(real, imag, { disableNormalization: false });
          oscillator.setPeriodicWave(periodicWave);
          oscillator.frequency.setValueAtTime(key.freq * 1.01, time);
          oscillator.frequency.exponentialRampToValueAtTime(key.freq, time + 0.03);
        } else {
          oscillator.type = this.toneType;
          oscillator.frequency.value = key.freq;
        }
        gainNode.gain.value = 0;
        
        oscillator.connect(gainNode);
        gainNode.connect(offlineContext.destination);
        
        oscillator.start(time);

        if (this.toneType === 'piano') {
          gainNode.gain.setValueAtTime(0.0001, time);
          gainNode.gain.exponentialRampToValueAtTime(0.65, time + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.25, time + 0.08);
        } else {
          gainNode.gain.setTargetAtTime(0.5, time, 0.01);
        }
        
        activeNotes.set(event.note, { oscillator, gainNode, startTime: time });
      } else if (event.type === 'stop') {
        const noteData = activeNotes.get(event.note);
        if (noteData) {
          const { gainNode, oscillator } = noteData;
          if (this.toneType === 'piano') {
            gainNode.gain.cancelScheduledValues(time);
            gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), time);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
            oscillator.stop(time + 0.16);
          } else {
            gainNode.gain.setTargetAtTime(0, time, 0.01);
            oscillator.stop(time + 0.1);
          }
          activeNotes.delete(event.note);
        }
      }
    });

    // Stop any lingering notes
    activeNotes.forEach(({ oscillator, gainNode }) => {
      if (this.toneType === 'piano') {
        gainNode.gain.cancelScheduledValues(durationSeconds);
        gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), durationSeconds);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, durationSeconds + 0.12);
        oscillator.stop(durationSeconds + 0.16);
      } else {
        gainNode.gain.setTargetAtTime(0, durationSeconds, 0.01);
        oscillator.stop(durationSeconds + 0.1);
      }
    });

    try {
      const audioBuffer = await offlineContext.startRendering();
      const wavBlob = Piano.encodeWav(audioBuffer);

      // Create download link
      const a = document.createElement('a');
      a.href = URL.createObjectURL(wavBlob);

      // Generate filename with timestamp
      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const timestamp = `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
      a.download = `pekosoft_piano_recording_${timestamp}.wav`;

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error('Error synthesizing WAV:', e);
    }
  }

  static encodeWav(audioBuffer) {
    const data = audioBuffer.getChannelData(0);
    const length = data.length;
    const sampleRate = audioBuffer.sampleRate;

    const wavData = Piano.floatTo16BitPCM(data);
    const dataLength = length * 2;
    const totalLength = 36 + dataLength;

    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, totalLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      view.setInt16(offset, wavData[i], true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  static floatTo16BitPCM(float32Array) {
    const length = float32Array.length;
    const int16Array = new Int16Array(length);

    for (let i = 0; i < length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return int16Array;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Piano();
});

// END OF FILE
