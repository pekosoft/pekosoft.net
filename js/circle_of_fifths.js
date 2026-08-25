// Pekosoft Circle Of Fifths
// pekosoft.net/js/circle_of_fifths.js

(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const STORAGE_KEY = "circle_of_fifths.settings";
  const FULL_CIRCLE = Math.PI * 2;
  const DEFAULT_PLAYBACK_SPEED = 100;
  const MIN_PLAYBACK_SPEED = 50;
  const MAX_PLAYBACK_SPEED = 150;
  const WHEEL_CENTER = 320;
  const WHEEL_CENTER_RADIUS = 102;
  const WHEEL_OUTER_RADIUS = 300;
  const WHEEL_RING_WIDTH = (WHEEL_OUTER_RADIUS - WHEEL_CENTER_RADIUS) / 3;
  const WHEEL_DIM_INNER_RADIUS = WHEEL_CENTER_RADIUS;
  const WHEEL_DIM_OUTER_RADIUS = WHEEL_DIM_INNER_RADIUS + WHEEL_RING_WIDTH;
  const WHEEL_MINOR_INNER_RADIUS = WHEEL_DIM_OUTER_RADIUS;
  const WHEEL_MINOR_OUTER_RADIUS = WHEEL_MINOR_INNER_RADIUS + WHEEL_RING_WIDTH;
  const WHEEL_MAJOR_INNER_RADIUS = WHEEL_MINOR_OUTER_RADIUS;
  const WHEEL_MAJOR_OUTER_RADIUS = WHEEL_OUTER_RADIUS;

  const NOTE_TO_SEMITONE = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    Fb: 4,
    "E#": 5,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
    Cb: 11
  };

  const MIDI_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const PIANO_START_MIDI = 60;
  const PIANO_OCTAVES = 2;
  const PIANO_WHITE_KEYS_PER_OCTAVE = 7;
  const PIANO_WHITE_KEY_COUNT = PIANO_OCTAVES * PIANO_WHITE_KEYS_PER_OCTAVE;
  const PIANO_KEY_COUNT = PIANO_OCTAVES * 12;
  const PIANO_END_MIDI = PIANO_START_MIDI + PIANO_KEY_COUNT - 1;
  const TIMELINE_START_MIDI = PIANO_START_MIDI;
  const TIMELINE_END_MIDI = PIANO_END_MIDI;
  const TIMELINE_ROW_COUNT = PIANO_KEY_COUNT;

  const KEYS = [
    { major: "C", minor: "Am", dim: "Bdim", signature: "No sharps or flats", scale: ["C", "D", "E", "F", "G", "A", "B"], majorRoot: "C", minorRoot: "A", dimRoot: "B" },
    { major: "G", minor: "Em", dim: "F#dim", signature: "1 sharp (F#)", scale: ["G", "A", "B", "C", "D", "E", "F#"], majorRoot: "G", minorRoot: "E", dimRoot: "F#" },
    { major: "D", minor: "Bm", dim: "C#dim", signature: "2 sharps (F#, C#)", scale: ["D", "E", "F#", "G", "A", "B", "C#"], majorRoot: "D", minorRoot: "B", dimRoot: "C#" },
    { major: "A", minor: "F#m", dim: "G#dim", signature: "3 sharps (F#, C#, G#)", scale: ["A", "B", "C#", "D", "E", "F#", "G#"], majorRoot: "A", minorRoot: "F#", dimRoot: "G#" },
    { major: "E", minor: "C#m", dim: "D#dim", signature: "4 sharps (F#, C#, G#, D#)", scale: ["E", "F#", "G#", "A", "B", "C#", "D#"], majorRoot: "E", minorRoot: "C#", dimRoot: "D#" },
    { major: "B", minor: "G#m", dim: "A#dim", signature: "5 sharps (F#, C#, G#, D#, A#)", scale: ["B", "C#", "D#", "E", "F#", "G#", "A#"], majorRoot: "B", minorRoot: "G#", dimRoot: "A#" },
    { major: "F#/Gb", minor: "D#m/Ebm", dim: "E#dim/Fdim", signature: "6 sharps or 6 flats", scale: ["F#", "G#", "A#", "B", "C#", "D#", "E#"], majorRoot: "F#", minorRoot: "D#", dimRoot: "E#" },
    { major: "Db", minor: "Bbm", dim: "Cdim", signature: "5 flats (Bb, Eb, Ab, Db, Gb)", scale: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"], majorRoot: "Db", minorRoot: "Bb", dimRoot: "C" },
    { major: "Ab", minor: "Fm", dim: "Gdim", signature: "4 flats (Bb, Eb, Ab, Db)", scale: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"], majorRoot: "Ab", minorRoot: "F", dimRoot: "G" },
    { major: "Eb", minor: "Cm", dim: "Ddim", signature: "3 flats (Bb, Eb, Ab)", scale: ["Eb", "F", "G", "Ab", "Bb", "C", "D"], majorRoot: "Eb", minorRoot: "C", dimRoot: "D" },
    { major: "Bb", minor: "Gm", dim: "Adim", signature: "2 flats (Bb, Eb)", scale: ["Bb", "C", "D", "Eb", "F", "G", "A"], majorRoot: "Bb", minorRoot: "G", dimRoot: "A" },
    { major: "F", minor: "Dm", dim: "Edim", signature: "1 flat (Bb)", scale: ["F", "G", "A", "Bb", "C", "D", "E"], majorRoot: "F", minorRoot: "D", dimRoot: "E" }
  ];

  const DIATONIC_QUALITIES = ["major", "minor", "minor", "major", "major", "minor", "dim"];
  const ROMAN_NUMERALS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
  const PROGRESSION_DEGREES = [1, 5, 6, 4];

  class CircleOfFifths {
    constructor() {
      this.svg = document.getElementById("circle-wheel");
      if (!this.svg) return;

      this.majorGroup = document.getElementById("major-ring");
      this.minorGroup = document.getElementById("minor-ring");
      this.dimGroup = document.getElementById("dim-ring");
      this.spokesGroup = document.getElementById("spokes");
      this.keyDisplay = document.getElementById("key-display");
      this.relativeDisplay = document.getElementById("relative-display");
      this.signatureDisplay = document.getElementById("signature-display");
      this.toneSelect = document.getElementById("tone-type");
      this.playScaleButton = document.getElementById("play-scale-button");
      this.playTriadButton = document.getElementById("play-triad-button");
      this.playProgressionButton = document.getElementById("play-progression-button");
      this.playDiatonicButton = document.getElementById("play-diatonic-button");
      this.playDimButton = document.getElementById("play-dim-button");
      this.soundButton = document.getElementById("sound-master-button");
      this.stopButton = document.getElementById("stop-button");
      this.resetButton = document.getElementById("reset-button");
      this.rotateButton = document.getElementById("rotate-button");
      this.toggleDimButton = document.getElementById("toggle-dim-button");
      this.toggleSignatureButton = document.getElementById("toggle-signature-button");
      this.arrowUpButton = document.getElementById("arrow-up");
      this.arrowDownButton = document.getElementById("arrow-down");
      this.arrowLeftButton = document.getElementById("arrow-left");
      this.arrowRightButton = document.getElementById("arrow-right");
      this.speedDisplay = document.getElementById("speed-display");
      this.speedSlider = document.getElementById("speed-slider");
      this.speedDownButton = document.getElementById("speed-decrease-button");
      this.speedUpButton = document.getElementById("speed-increase-button");
      this.volumeSlider = document.getElementById("volume-slider");
      this.volumeDownButton = document.getElementById("volume-decrease-button");
      this.volumeUpButton = document.getElementById("volume-increase-button");
      this.piano = document.getElementById("piano");
      this.timelineCanvas = document.getElementById("timeline-canvas");
      this.timelineContext = this.timelineCanvas?.getContext("2d") || null;
      this.timelineGuidesButton = document.getElementById("timeline-guides-button");
      this.timelineBrightButton = document.getElementById("timeline-bright-button");
      this.panelText = document.getElementById("panel-text");
      this.copyButton = document.getElementById("copy-button");

      this.selectedIndex = 0;
      this.selectedMode = "major";
      this.showDim = true;
      this.showSignatures = false;
      this.guidesOn = true;
      this.timelineBright = localStorage.getItem("circle_of_fifths.timeline_bright") === null
        ? (window.PekoBrightGuides?.getGlobal() || false)
        : localStorage.getItem("circle_of_fifths.timeline_bright") === "true";
      this.soundEnabled = true;
      this.playbackSpeed = Number(this.speedSlider?.value || DEFAULT_PLAYBACK_SPEED);
      this.volume = Number(this.volumeSlider?.value || 70);
      this.rotationOffset = 0;
      this.rotateOn = false;
      this.audioContext = null;
      this.analyser = null;
      this.masterGain = null;
      this.compressor = null;
      this.activeVoices = [];
      this.sequenceTimers = [];
      this.sequenceActive = false;
      this.lastAudioActivitySec = 0;
      this.maxVoices = 18;
      this.timelineEvents = [];
      this.timelineWindowMs = 30000;
      this.timelineDisplayWidth = 0;
      this.timelineDisplayHeight = 0;
      this.timelineScaleX = 1;
      this.timelineScaleY = 1;
      this.pianoKeys = [];
      this.pianoNoteTimers = new Map();

      this.loadSettings();
      this.bindEvents();
      this.renderPiano();
      this.renderWheel();
      this.updateControls();
      this.updatePanel();
      this.resizeTimeline();
      this.drawTimeline();
      this.startTimelineLoop();
      this.installTimelineBitmapHook();
      this.ensureSharedModuleControls();

      window.circleOfFifthsTool = this;
    }

    loadSettings() {
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      } catch (_) {
        saved = null;
      }

      if (saved && typeof saved === "object") {
        if (Number.isFinite(saved.selectedIndex)) this.selectedIndex = this.normalizeIndex(saved.selectedIndex);
        if (["major", "minor", "dim"].includes(saved.selectedMode)) this.selectedMode = saved.selectedMode;
        if (typeof saved.showDim === "boolean") this.showDim = saved.showDim;
        if (typeof saved.showSignatures === "boolean") this.showSignatures = saved.showSignatures;
        if (typeof saved.guidesOn === "boolean") this.guidesOn = saved.guidesOn;
        if (typeof saved.soundEnabled === "boolean") this.soundEnabled = saved.soundEnabled;
        if (Number.isFinite(saved.playbackSpeed)) this.playbackSpeed = this.clamp(saved.playbackSpeed, MIN_PLAYBACK_SPEED, MAX_PLAYBACK_SPEED);
        if (Number.isFinite(saved.volume)) this.volume = this.clamp(saved.volume, 0, 100);
        if (Number.isFinite(saved.rotationOffset)) this.rotationOffset = this.normalizeIndex(saved.rotationOffset);
        if (typeof saved.rotateOn === "boolean") this.rotateOn = saved.rotateOn;
        if (saved.tone && this.toneSelect?.querySelector(`option[value="${saved.tone}"]`)) this.toneSelect.value = saved.tone;
      }

      if (this.rotateOn) this.alignRotationToSelectedKey();
      if (!this.toneSelect?.value && this.toneSelect?.querySelector('option[value="piano"]')) this.toneSelect.value = "piano";
      if (!this.showDim && this.selectedMode === "dim") this.selectedMode = "major";
      if (this.speedSlider) this.speedSlider.value = String(this.playbackSpeed);
      this.updateSpeedDisplay();
      if (this.volumeSlider) this.volumeSlider.value = String(this.volume);
    }

    saveSettings() {
      const state = {
        selectedIndex: this.selectedIndex,
        selectedMode: this.selectedMode,
        showDim: this.showDim,
        showSignatures: this.showSignatures,
        guidesOn: this.guidesOn,
        soundEnabled: this.soundEnabled,
        playbackSpeed: this.playbackSpeed,
        volume: this.volume,
        rotationOffset: this.rotationOffset,
        rotateOn: this.rotateOn,
        tone: this.toneSelect?.value || "piano"
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    bindEvents() {
      this.playScaleButton?.addEventListener("click", () => this.playScale());
      this.playTriadButton?.addEventListener("click", () => this.playTriad(this.selectedMode));
      this.playProgressionButton?.addEventListener("click", () => this.playProgression());
      this.playDiatonicButton?.addEventListener("click", () => this.playDiatonicChords());
      this.playDimButton?.addEventListener("click", () => this.focusMode("dim"));
      this.soundButton?.addEventListener("click", () => {
        this.soundEnabled = !this.soundEnabled;
        if (this.audioContext && this.audioContext.state === "suspended") {
          this.audioContext.resume().catch(() => {
            // Resume is best-effort; the next gesture can retry.
          });
        }
        this.updateMasterGain();
        this.updateControls();
        this.saveSettings();
      });
      this.stopButton?.addEventListener("click", () => {
        this.stopAllAudio(false);
        this.logTimeline("stop", "STOP", []);
      });
      this.resetButton?.addEventListener("click", () => this.reset());
      this.rotateButton?.addEventListener("click", () => {
        this.rotateOn = !this.rotateOn;
        if (this.rotateOn) {
          this.alignRotationToSelectedKey();
        } else {
          this.rotationOffset = 0;
        }
        this.renderWheel();
        this.updateControls();
        this.saveSettings();
      });
      this.toggleDimButton?.addEventListener("click", () => {
        this.showDim = !this.showDim;
        if (!this.showDim && this.selectedMode === "dim") this.selectedMode = "major";
        this.renderWheel();
        this.updateControls();
        this.updatePanel();
        this.saveSettings();
      });
      this.toggleSignatureButton?.addEventListener("click", () => {
        this.showSignatures = !this.showSignatures;
        this.renderWheel();
        this.updateControls();
        this.saveSettings();
      });
      this.arrowLeftButton?.addEventListener("click", () => this.stepKey(-1));
      this.arrowRightButton?.addEventListener("click", () => this.stepKey(1));
      this.arrowUpButton?.addEventListener("click", () => this.focusMode("major"));
      this.arrowDownButton?.addEventListener("click", () => this.focusMode("minor"));
      this.bindSvgButton(this.arrowLeftButton, () => this.stepKey(-1));
      this.bindSvgButton(this.arrowRightButton, () => this.stepKey(1));
      this.bindSvgButton(this.arrowUpButton, () => this.focusMode("major"));
      this.bindSvgButton(this.arrowDownButton, () => this.focusMode("minor"));
      this.speedSlider?.addEventListener("input", () => this.setPlaybackSpeed(Number(this.speedSlider.value)));
      this.volumeSlider?.addEventListener("input", () => {
        this.volume = this.clamp(Number(this.volumeSlider.value), 0, 100);
        this.updateMasterGain();
        this.saveSettings();
      });
      this.bindHoldButton(this.speedDownButton, () => this.bumpPlaybackSpeed(-1));
      this.bindHoldButton(this.speedUpButton, () => this.bumpPlaybackSpeed(1));
      this.bindHoldButton(this.volumeDownButton, () => this.bumpVolume(-2));
      this.bindHoldButton(this.volumeUpButton, () => this.bumpVolume(2));
      this.toneSelect?.addEventListener("change", () => this.saveSettings());
      this.timelineGuidesButton?.addEventListener("click", () => {
        this.guidesOn = !this.guidesOn;
        this.updateControls();
        this.drawTimeline();
        this.saveSettings();
      });
      this.timelineBrightButton?.addEventListener("click", () => {
        this.timelineBright = !this.timelineBright;
        localStorage.setItem("circle_of_fifths.timeline_bright", String(this.timelineBright));
        this.updateControls();
        this.drawTimeline();
      });
      window.addEventListener("pekosoft:bright-guides-global-change", (event) => {
        this.timelineBright = !!event.detail?.enabled;
        this.updateControls();
        this.drawTimeline();
      });
      this.copyButton?.addEventListener("click", () => this.copyPanelText());
      window.addEventListener("resize", () => {
        this.resizeTimeline();
        this.drawTimeline();
      });
    }

    installTimelineBitmapHook() {
      window.buildTimelineBitmap = (timelineContainer) => {
        if (!timelineContainer || !this.timelineCanvas || !timelineContainer.contains(this.timelineCanvas)) return null;
        this.resizeTimeline();
        this.drawTimeline();
        return this.timelineCanvas;
      };
    }

    ensureSharedModuleControls() {
      window.setTimeout(() => {
        window.setupPanelSyntaxHighlighting?.();
        window.setupPanelWrapToggle?.();
        window.setupTimelineCopyButton?.();
      }, 0);
    }

    bindSvgButton(element, action) {
      element?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        action();
      });
    }

    reset() {
      this.stopAllAudio(true);
      this.selectedIndex = 0;
      this.selectedMode = "major";
      this.showDim = true;
      this.showSignatures = false;
      this.guidesOn = true;
      this.soundEnabled = true;
      this.playbackSpeed = DEFAULT_PLAYBACK_SPEED;
      this.volume = 70;
      this.rotationOffset = 0;
      this.rotateOn = false;
      if (this.speedSlider) this.speedSlider.value = String(this.playbackSpeed);
      this.updateSpeedDisplay();
      if (this.volumeSlider) this.volumeSlider.value = String(this.volume);
      if (this.toneSelect?.querySelector('option[value="piano"]')) this.toneSelect.value = "piano";
      this.updateMasterGain();
      this.renderWheel();
      this.updateControls();
      this.updatePanel();
      this.highlightPianoScale();
      this.saveSettings();
    }

    renderWheel() {
      this.majorGroup.replaceChildren();
      this.minorGroup.replaceChildren();
      this.dimGroup.replaceChildren();
      this.spokesGroup.replaceChildren();
      const related = this.getRelatedSets();
      const step = FULL_CIRCLE / KEYS.length;

      KEYS.forEach((key, index) => {
        const slot = this.normalizeIndex(index + this.rotationOffset);
        const startAngle = -Math.PI / 2 - step / 2 + slot * step;
        const endAngle = startAngle + step;
        this.appendSector(this.majorGroup, index, "major", WHEEL_MAJOR_INNER_RADIUS, WHEEL_MAJOR_OUTER_RADIUS, startAngle, endAngle, this.getWheelLabel(key.major, "major"), WHEEL_MAJOR_INNER_RADIUS + WHEEL_RING_WIDTH / 2, related);
        this.appendSector(this.minorGroup, index, "minor", WHEEL_MINOR_INNER_RADIUS, WHEEL_MINOR_OUTER_RADIUS, startAngle, endAngle, this.getWheelLabel(key.minor, "minor"), WHEEL_MINOR_INNER_RADIUS + WHEEL_RING_WIDTH / 2, related);
        this.appendSector(this.dimGroup, index, "dim", WHEEL_DIM_INNER_RADIUS, WHEEL_DIM_OUTER_RADIUS, startAngle, endAngle, this.getWheelLabel(key.dim, "dim"), WHEEL_DIM_INNER_RADIUS + WHEEL_RING_WIDTH / 2, related);
        this.appendSpoke(startAngle);
        if (this.showSignatures) this.appendLabel(this.majorGroup, this.compactSignature(key.signature), startAngle + step / 2, 286, "signature", "");
      });

      this.dimGroup.style.display = this.showDim ? "" : "none";
      this.highlightPianoScale();
    }

    appendSector(group, index, mode, innerRadius, outerRadius, startAngle, endAngle, label, labelRadius, related) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", this.ringSectorPath(320, 320, innerRadius, outerRadius, startAngle, endAngle));
      path.setAttribute("class", this.getSectorClass(index, mode, related));
      path.dataset.index = String(index);
      path.dataset.mode = mode;
      path.setAttribute("role", "button");
      path.setAttribute("tabindex", "0");
      path.addEventListener("pointerdown", (event) => this.selectSector(event, index, mode));
      path.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") this.selectSector(event, index, mode);
      });
      group.appendChild(path);
      this.appendLabel(group, label, startAngle + (endAngle - startAngle) / 2, labelRadius, mode, this.getStateClasses(index, mode, related).join(" "));
    }

    appendLabel(group, label, angle, radius, className, stateClass) {
      const position = this.polar(320, 320, radius, angle);
      const labelGroup = document.createElementNS(SVG_NS, "g");
      labelGroup.setAttribute("class", `wheel-label ${className} ${stateClass || ""}`.trim());
      labelGroup.setAttribute("transform", `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`);
      labelGroup.setAttribute("aria-label", label);
      labelGroup.dataset.label = label;
      this.appendLabelText(labelGroup, label, className);
      group.appendChild(labelGroup);
    }

    appendLabelText(labelGroup, label, className) {
      const fontSize = this.getLabelFontSize(className);
      const glyphs = String(label).split("").map((character) => ({
        character,
        width: this.getGlyphWidth(character, fontSize)
      }));
      const totalWidth = glyphs.reduce((sum, glyph) => sum + glyph.width, 0);
      let cursor = -totalWidth / 2;

      glyphs.forEach((glyph) => {
        const x = cursor + glyph.width / 2;
        if (glyph.character === "♭") {
          labelGroup.appendChild(this.createFlatGlyph(x, fontSize));
        } else {
          const text = document.createElementNS(SVG_NS, "text");
          text.setAttribute("x", x.toFixed(2));
          text.setAttribute("y", "0");
          text.textContent = glyph.character;
          if (glyph.character === "°") {
            text.setAttribute("class", "scale-degree");
            text.setAttribute("y", (-fontSize * 0.27).toFixed(2));
          }
          labelGroup.appendChild(text);
        }
        cursor += glyph.width;
      });
    }

    createFlatGlyph(x, fontSize) {
      const height = fontSize * 1.12;
      const width = fontSize * 0.5;
      const stemX = x - width * 0.18;
      const top = -height * 0.52;
      const bottom = height * 0.34;
      const bellyTop = -height * 0.06;
      const bellyBottom = height * 0.3;
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("class", "flat-symbol");
      path.setAttribute("d", [
        `M ${stemX.toFixed(2)} ${top.toFixed(2)}`,
        `L ${stemX.toFixed(2)} ${bottom.toFixed(2)}`,
        `C ${(stemX + width).toFixed(2)} ${(bellyBottom - height * 0.06).toFixed(2)} ${(stemX + width * 0.92).toFixed(2)} ${(bellyTop - height * 0.1).toFixed(2)} ${stemX.toFixed(2)} ${bellyTop.toFixed(2)}`
      ].join(" "));
      return path;
    }

    getLabelFontSize(className) {
      if (className === "dim" || className === "signature") return 12;
      if (className === "minor") return 14;
      return 20;
    }

    getGlyphWidth(character, fontSize) {
      if (character === "♭") return fontSize * 0.56;
      if (character === "°") return fontSize * 0.36;
      if (character === "/") return fontSize * 0.34;
      if (character === "#") return fontSize * 0.62;
      if (character === "m") return fontSize * 0.78;
      if (/[A-Z0-9]/.test(character)) return fontSize * 0.66;
      return fontSize * 0.5;
    }

    appendSpoke(angle) {
      const inner = this.polar(WHEEL_CENTER, WHEEL_CENTER, WHEEL_DIM_INNER_RADIUS, angle);
      const outer = this.polar(WHEEL_CENTER, WHEEL_CENTER, WHEEL_OUTER_RADIUS, angle);
      const spoke = document.createElementNS(SVG_NS, "line");
      spoke.setAttribute("x1", inner.x.toFixed(2));
      spoke.setAttribute("y1", inner.y.toFixed(2));
      spoke.setAttribute("x2", outer.x.toFixed(2));
      spoke.setAttribute("y2", outer.y.toFixed(2));
      spoke.setAttribute("class", "wheel-spoke");
      this.spokesGroup.appendChild(spoke);
    }

    getRelatedSets() {
      const tonic = this.selectedIndex;
      return {
        major: new Set([this.normalizeIndex(tonic - 1), tonic, this.normalizeIndex(tonic + 1)]),
        minor: new Set([this.normalizeIndex(tonic - 1), tonic, this.normalizeIndex(tonic + 1)]),
        dim: new Set([tonic])
      };
    }

    getSectorClass(index, mode, related) {
      const classes = ["circle-sector", `${mode}-sector`, ...this.getStateClasses(index, mode, related)];
      return classes.join(" ");
    }

    getStateClasses(index, mode, related) {
      const classes = [];
      const isMajorFocus = this.selectedMode === "major";
      const isMinorFocus = this.selectedMode === "minor";
      if (isMajorFocus && mode === "major" && index === this.normalizeIndex(this.selectedIndex + 1)) classes.push("related-major");
      if (isMajorFocus && mode === "major" && index === this.normalizeIndex(this.selectedIndex - 1)) classes.push("related-major");
      if (isMinorFocus && mode === "minor" && index === this.normalizeIndex(this.selectedIndex + 1)) classes.push("related-minor");
      if (isMinorFocus && mode === "minor" && index === this.normalizeIndex(this.selectedIndex - 1)) classes.push("related-minor");
      if (isMajorFocus && mode === "minor" && index === this.selectedIndex) classes.push("cross-relative");
      if (isMinorFocus && mode === "major" && index === this.selectedIndex) classes.push("cross-relative");
      if (mode === "major" && index === this.selectedIndex) classes.push("is-tonic");
      if (mode === "major" && index === this.normalizeIndex(this.selectedIndex + 1)) classes.push("is-dominant");
      if (mode === "major" && index === this.normalizeIndex(this.selectedIndex - 1)) classes.push("is-subdominant");
      if (mode === "minor" && index === this.selectedIndex) classes.push("is-relative");
      if (mode === "dim" && index === this.selectedIndex) classes.push("is-diminished");
      if (index === this.selectedIndex && mode === this.selectedMode) classes.push(`active-${mode}`);
      return classes;
    }

    selectSector(event, index, mode) {
      event.preventDefault();
      event.stopPropagation();
      this.selectedIndex = index;
      this.selectedMode = mode;
      this.alignRotationToSelectedKey();
      this.renderWheel();
      this.updateControls();
      this.updatePanel();
      this.saveSettings();
      this.playTriad(mode);
    }

    stepKey(delta) {
      this.selectedIndex = this.normalizeIndex(this.selectedIndex + delta);
      this.alignRotationToSelectedKey();
      this.renderWheel();
      this.updateControls();
      this.updatePanel();
      this.saveSettings();
      this.playTriad(this.selectedMode);
    }

    focusMode(mode) {
      if (!["major", "minor", "dim"].includes(mode)) return;
      if (mode === "dim" && !this.showDim) this.showDim = true;
      this.selectedMode = mode;
      this.renderWheel();
      this.updateControls();
      this.updatePanel();
      this.saveSettings();
      this.playTriad(mode);
    }

    updateControls() {
      const key = KEYS[this.selectedIndex];
      if (this.keyDisplay) this.keyDisplay.value = this.formatDisplayLabel(key.major);
      if (this.relativeDisplay) this.relativeDisplay.value = this.formatDisplayLabel(key.minor);
      if (this.signatureDisplay) this.signatureDisplay.value = this.formatDisplayLabel(key.signature);
      this.updateSpeedDisplay();
      this.rotateButton?.classList.toggle("button-on", this.rotateOn);
      this.soundButton?.classList.toggle("button-on", this.soundEnabled);
      this.toggleDimButton?.classList.toggle("button-on", this.showDim);
      this.toggleSignatureButton?.classList.toggle("button-on", this.showSignatures);
      this.timelineGuidesButton?.classList.toggle("button-on", this.guidesOn);
      this.timelineBrightButton?.classList.toggle("button-on", this.timelineBright);
      this.arrowUpButton?.classList.toggle("button-on", this.selectedMode === "major");
      this.arrowDownButton?.classList.toggle("button-on", this.selectedMode === "minor");
    }

    alignRotationToSelectedKey() {
      if (!this.rotateOn) return;
      this.rotationOffset = this.normalizeIndex(-this.selectedIndex);
    }

    updatePanel() {
      if (!this.panelText) return;
      const key = KEYS[this.selectedIndex];
      const prev = KEYS[this.normalizeIndex(this.selectedIndex - 1)];
      const next = KEYS[this.normalizeIndex(this.selectedIndex + 1)];
      const diatonic = this.getDiatonicChords(this.selectedIndex).map((chord, index) => `${ROMAN_NUMERALS[index]} = ${this.formatDisplayLabel(chord.label)}`);
      const progression = PROGRESSION_DEGREES.map((degree) => this.formatDisplayLabel(this.getDiatonicChord(this.selectedIndex, degree).label)).join(" - ");

      const lines = [
        "// Circle Of Fifths",
        "",
        `Key: ${this.formatDisplayLabel(key.major)}`,
        `Focus: ${this.getModeLabel(this.selectedMode)}`,
        `Signature: ${this.formatDisplayLabel(key.signature)}`,
        `Relative Minor: ${this.formatDisplayLabel(key.minor)}`,
        `Diminished: ${this.formatDisplayLabel(key.dim)}`,
        "",
        "// Related Chords Marked On Wheel",
        `Subdominant: ${this.formatDisplayLabel(prev.major)}`,
        `Tonic: ${this.formatDisplayLabel(key.major)}`,
        `Dominant: ${this.formatDisplayLabel(next.major)}`,
        `Relative: ${this.formatDisplayLabel(key.minor)}`,
        `Minor neighbors: ${this.formatDisplayLabel(prev.minor)}, ${this.formatDisplayLabel(key.minor)}, ${this.formatDisplayLabel(next.minor)}`,
        `Leading-tone diminished: ${this.formatDisplayLabel(key.dim)}`,
        "",
        "// Scale",
        key.scale.map((note) => this.formatDisplayLabel(note)).join("  "),
        "",
        "// Diatonic Chords",
        ...diatonic,
        "",
        "// I V vi IV",
        progression
      ];
      this.panelText.value = lines.join("\n");
    }

    async ensureAudio() {
      if (!this.audioContext) {
        try {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 2048;
          this.analyser.smoothingTimeConstant = 0.78;
          this.masterGain = this.audioContext.createGain();
          this.compressor = this.audioContext.createDynamicsCompressor();
          this.compressor.threshold.value = -18;
          this.compressor.knee.value = 9;
          this.compressor.ratio.value = 12;
          this.compressor.attack.value = 0.003;
          this.compressor.release.value = 0.16;
          this.analyser.connect(this.masterGain);
          this.masterGain.connect(this.compressor);
          this.compressor.connect(this.audioContext.destination);
          this.updateMasterGain();
          window.addEventListener('pekosoft:global-sound-change', () => this.updateMasterGain());
          this.updateMetersSource();
        } catch (_) {
          this.audioContext = null;
          this.analyser = null;
          this.masterGain = null;
          this.compressor = null;
          window.__pekosoftMetersSource = null;
          return false;
        }
      }

      if (this.audioContext.state === "suspended") {
        try {
          await this.audioContext.resume();
        } catch (_) {
          return false;
        }
      }

      return true;
    }

    updateMasterGain() {
      if (!this.masterGain || !this.audioContext) return;
      const globalSoundOn = localStorage.getItem('global.sound') !== 'false';
      const gain = this.soundEnabled && globalSoundOn ? Math.pow(this.clamp(this.volume, 0, 100) / 100, 1.15) * 0.34 : 0;
      this.masterGain.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
    }

    updateMetersSource() {
      if (!this.audioContext || !this.analyser) return;
      window.__pekosoftMetersSource = {
        analyser: this.analyser,
        channelCount: 1,
        sampleRate: this.audioContext.sampleRate,
        isActive: () => {
          const now = this.audioContext.currentTime;
          this.pruneVoices();
          return this.sequenceActive || this.activeVoices.length > 0 || (now - this.lastAudioActivitySec) < 0.25;
        },
        isStopped: () => !this.sequenceActive && this.activeVoices.length === 0
      };
    }

    async playTriad(mode = this.selectedMode) {
      if (!(await this.ensureAudio())) return;
      const safeMode = mode === "minor" || mode === "dim" ? mode : "major";
      const chord = this.getChordForMode(safeMode, this.selectedIndex);
      this.stopAllAudio(false);
      this.playChord(chord, { durationSec: 0.68, velocity: 0.18, type: "triad" });
    }

    async playScale() {
      if (!(await this.ensureAudio())) return;
      const key = KEYS[this.selectedIndex];
      const notes = this.getAscendingScaleMidis(key.scale);
      const stepMs = this.getSequenceStepMs(340);
      this.startSequence(notes.map((midi) => ({ kind: "note", midi, label: this.midiToNoteName(midi) })), stepMs, 0.34, 0.22, "scale");
    }

    async playProgression() {
      if (!(await this.ensureAudio())) return;
      const chords = PROGRESSION_DEGREES.map((degree) => this.getDiatonicChord(this.selectedIndex, degree));
      const stepMs = this.getSequenceStepMs(740);
      this.startSequence(chords.map((chord) => ({ kind: "chord", chord })), stepMs, 0.74, 0.15, "progression");
    }

    async playDiatonicChords() {
      if (!(await this.ensureAudio())) return;
      const chords = this.getDiatonicChords(this.selectedIndex);
      const stepMs = this.getSequenceStepMs(590);
      this.startSequence(chords.map((chord) => ({ kind: "chord", chord })), stepMs, 0.66, 0.145, "diatonic");
    }

    playChord(chord, options = {}) {
      if (!this.audioContext || !this.analyser) return;
      this.pruneVoices();
      const durationSec = this.clamp(Number(options.durationSec) || 0.5, 0.08, 1.4);
      const velocity = this.clamp(Number(options.velocity) || 0.16, 0.01, 0.28);
      chord.midis.forEach((midi, voiceIndex) => {
        this.playMidi(midi, {
          durationSec,
          velocity: Math.max(0.01, velocity - voiceIndex * 0.012),
          timeline: false
        });
      });
      this.logTimeline(options.type || "triad", chord.label, chord.midis);
    }

    playMidi(midi, options = {}) {
      if (!this.audioContext || !this.analyser) return;
      this.pruneVoices();
      this.limitVoices();
      const durationSec = this.clamp(Number(options.durationSec) || 0.3, 0.04, 1.4);
      const freq = this.midiToFrequency(midi);
      const baseFrequencyHz = typeof window.getTransientBaseFrequencyHz === "function" ? window.getTransientBaseFrequencyHz() : 880;
      const voice = window.playTransientSound?.({
        audioContext: this.audioContext,
        tone: this.normalizeToneType(this.toneSelect?.value || "piano"),
        gain: this.clamp(Number(options.velocity) || 0.18, 0.01, 0.3),
        pitchRatio: freq / baseFrequencyHz,
        durationSec,
        baseFrequencyHz,
        destinationNode: this.analyser
      });

      if (voice) {
        this.activeVoices.push(voice);
        this.lastAudioActivitySec = Math.max(this.lastAudioActivitySec, voice.stopTime || this.audioContext.currentTime);
        this.updateMetersSource();
        this.markPianoMidis([midi], durationSec * 1000);
      }
      if (options.timeline !== false) this.logTimeline("note", this.midiToNoteName(midi), [midi]);
    }

    startSequence(items, stepMs, durationScale, velocity, type) {
      this.stopAllAudio(false);
      this.sequenceActive = true;
      this.updateMetersSource();
      items.forEach((item, index) => {
        const timer = window.setTimeout(() => {
          if (item.kind === "chord") {
            this.playChord(item.chord, { durationSec: Math.max(0.1, (stepMs / 1000) * durationScale), velocity, type });
          } else {
            this.playMidi(item.midi, { durationSec: Math.max(0.08, (stepMs / 1000) * durationScale), velocity, timeline: false });
            this.logTimeline(type, item.label, [item.midi]);
          }
        }, index * stepMs);
        this.sequenceTimers.push(timer);
      });

      const stopTimer = window.setTimeout(() => {
        this.sequenceActive = false;
        this.updateMetersSource();
      }, items.length * stepMs + 250);
      this.sequenceTimers.push(stopTimer);
    }

    stopAllAudio(clearTimeline) {
      this.sequenceTimers.forEach((timer) => window.clearTimeout(timer));
      this.sequenceTimers = [];
      this.sequenceActive = false;
      if (this.audioContext) {
        this.activeVoices.forEach((voice) => {
          if (!voice?.stopNode) return;
          try {
            voice.stopNode.stop(this.audioContext.currentTime);
          } catch (_) {
            try {
              voice.stopNode.stop();
            } catch (__) {}
          }
        });
      }
      this.activeVoices = [];
      this.clearPianoActivity();
      if (clearTimeline) this.timelineEvents = [];
      this.updateMetersSource();
      this.drawTimeline();
    }

    pruneVoices() {
      if (!this.audioContext) return;
      const now = this.audioContext.currentTime;
      this.activeVoices = this.activeVoices.filter((voice) => voice && voice.stopTime > now);
    }

    limitVoices() {
      while (this.activeVoices.length >= this.maxVoices) {
        const voice = this.activeVoices.shift();
        if (!voice?.stopNode) continue;
        try {
          voice.stopNode.stop();
        } catch (_) {}
      }
    }

    getChordForMode(mode, index) {
      const key = KEYS[index];
      if (mode === "minor") return this.buildChord(key.minorRoot, "minor", key.minor);
      if (mode === "dim") return this.buildChord(key.dimRoot, "dim", key.dim);
      return this.buildChord(key.majorRoot, "major", key.major);
    }

    getDiatonicChords(index) {
      return [1, 2, 3, 4, 5, 6, 7].map((degree) => this.getDiatonicChord(index, degree));
    }

    getDiatonicChord(index, degree) {
      const key = KEYS[index];
      const scaleMidis = this.getAscendingScaleMidis(key.scale).slice(0, 7);
      const rootIndex = degree - 1;
      const thirdIndex = rootIndex + 2;
      const fifthIndex = rootIndex + 4;
      const rootMidi = this.getScaleMidi(scaleMidis, rootIndex);
      const thirdMidi = this.getScaleMidi(scaleMidis, thirdIndex);
      const fifthMidi = this.getScaleMidi(scaleMidis, fifthIndex);
      const quality = DIATONIC_QUALITIES[rootIndex];
      const label = quality === "major" ? key.scale[rootIndex] : quality === "minor" ? `${key.scale[rootIndex]}m` : `${key.scale[rootIndex]}dim`;
      return { label, quality, midis: this.fitMidisToPianoRange([rootMidi, thirdMidi, fifthMidi]) };
    }

    fitMidisToPianoRange(midis) {
      const fitted = midis.slice();
      while (Math.max(...fitted) > PIANO_END_MIDI) fitted.forEach((midi, index) => fitted[index] = midi - 12);
      while (Math.min(...fitted) < PIANO_START_MIDI) fitted.forEach((midi, index) => fitted[index] = midi + 12);
      return fitted;
    }

    getScaleMidi(scaleMidis, index) {
      return scaleMidis[index % 7] + Math.floor(index / 7) * 12;
    }

    buildChord(rootNote, quality, label) {
      const intervals = quality === "dim" ? [0, 3, 6] : quality === "minor" ? [0, 3, 7] : [0, 4, 7];
      const rootMidi = this.noteToChordRootMidi(rootNote);
      return { label, quality, midis: intervals.map((interval) => rootMidi + interval) };
    }

    renderPiano() {
      if (!this.piano) return;
      this.piano.replaceChildren();
      this.pianoKeys = [];
      const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
      const blackKeys = [
        { note: "C#", left: 0.72 },
        { note: "D#", left: 1.72 },
        { note: "F#", left: 3.72 },
        { note: "G#", left: 4.72 },
        { note: "A#", left: 5.72 }
      ];
      for (let octaveIndex = 0; octaveIndex < PIANO_OCTAVES; octaveIndex++) {
        const octaveMidi = PIANO_START_MIDI + octaveIndex * 12;
        const whiteOffset = octaveIndex * PIANO_WHITE_KEYS_PER_OCTAVE;
        whiteKeys.forEach((note, index) => {
          const midi = octaveMidi + this.noteToSemitone(note);
          this.appendPianoKey(note, "white", ((whiteOffset + index) / PIANO_WHITE_KEY_COUNT) * 100, midi);
        });
      }
      for (let octaveIndex = 0; octaveIndex < PIANO_OCTAVES; octaveIndex++) {
        const octaveMidi = PIANO_START_MIDI + octaveIndex * 12;
        const whiteOffset = octaveIndex * PIANO_WHITE_KEYS_PER_OCTAVE;
        blackKeys.forEach((key) => {
          const midi = octaveMidi + this.noteToSemitone(key.note);
          this.appendPianoKey(key.note, "black", ((whiteOffset + key.left) / PIANO_WHITE_KEY_COUNT) * 100, midi);
        });
      }
      this.highlightPianoScale();
    }

    appendPianoKey(note, color, leftPercent, midi) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `piano-key ${color}`;
      button.style.left = `${leftPercent}%`;
      button.dataset.note = note;
      button.dataset.midi = String(midi);
      button.textContent = note;
      button.title = this.midiToNoteName(midi) + String(Math.floor(midi / 12) - 1);
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.playPianoNote(note, button);
      });
      this.piano.appendChild(button);
      this.pianoKeys.push(button);
    }

    async playPianoNote(note, button) {
      if (!(await this.ensureAudio())) return;
      const midi = Number(button?.dataset.midi);
      this.playMidi(Number.isFinite(midi) ? midi : this.noteToMidi(note, 4), { durationSec: 0.34, velocity: 0.2 });
    }

    markPianoMidis(midis, durationMs) {
      const holdMs = this.clamp(Number(durationMs) || 200, 200, 1400);
      midis.forEach((midi) => {
        const midiNumber = Math.round(Number(midi));
        if (!Number.isFinite(midiNumber)) return;
        const keys = this.pianoKeys.filter((button) => Number(button.dataset.midi) === midiNumber);
        if (!keys.length) return;
        const existingTimer = this.pianoNoteTimers.get(midiNumber);
        if (existingTimer) window.clearTimeout(existingTimer);
        keys.forEach((button) => button.classList.add("active"));
        const timer = window.setTimeout(() => {
          keys.forEach((button) => button.classList.remove("active"));
          this.pianoNoteTimers.delete(midiNumber);
        }, holdMs);
        this.pianoNoteTimers.set(midiNumber, timer);
      });
    }

    clearPianoActivity() {
      this.pianoNoteTimers.forEach((timer) => window.clearTimeout(timer));
      this.pianoNoteTimers.clear();
      this.pianoKeys.forEach((button) => button.classList.remove("active"));
    }

    highlightPianoScale() {
      const key = KEYS[this.selectedIndex];
      const scaleSemitones = new Set(key.scale.map((note) => this.noteToSemitone(note)));
      this.pianoKeys.forEach((button) => {
        const semitone = this.noteToSemitone(button.dataset.note || "C");
        button.classList.toggle("button-on", scaleSemitones.has(semitone));
      });
    }

    logTimeline(type, label, midis) {
      const now = performance.now();
      this.timelineEvents.push({ type, label: this.formatDisplayLabel(label), midis: midis.slice(0, 6), time: now });
      if (this.timelineEvents.length > 220) this.timelineEvents.splice(0, this.timelineEvents.length - 220);
      this.drawTimeline();
    }

    resizeTimeline() {
      if (!this.timelineCanvas) return;
      const rect = this.timelineCanvas.getBoundingClientRect();
      const fallbackRect = this.timelineCanvas.parentElement?.getBoundingClientRect();
      const width = Math.max(640, rect.width || fallbackRect?.width || 640);
      const height = Math.max(220, rect.height || fallbackRect?.height || 256);
      const pixelRatio = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1));
      const bitmapWidth = Math.max(1, Math.round(width * pixelRatio));
      const bitmapHeight = Math.max(1, Math.round(height * pixelRatio));

      this.timelineDisplayWidth = width;
      this.timelineDisplayHeight = height;
      this.timelineScaleX = bitmapWidth / width;
      this.timelineScaleY = bitmapHeight / height;

      if (this.timelineCanvas.width !== bitmapWidth) this.timelineCanvas.width = bitmapWidth;
      if (this.timelineCanvas.height !== bitmapHeight) this.timelineCanvas.height = bitmapHeight;
    }

    drawTimeline() {
      if (!this.timelineCanvas || !this.timelineContext) return;
      this.resizeTimeline();
      const canvas = this.timelineCanvas;
      const ctx = this.timelineContext;
      const width = this.timelineDisplayWidth || canvas.width;
      const height = this.timelineDisplayHeight || canvas.height;
      const now = performance.now();
      const labelGutter = 34;
      const plotWidth = Math.max(1, width - labelGutter);
      const rowHeight = height / TIMELINE_ROW_COUNT;
      const colors = this.getRootColors();
      this.timelineEvents = this.timelineEvents.filter((event) => now - event.time <= this.timelineWindowMs);
      ctx.setTransform(this.timelineScaleX || 1, 0, 0, this.timelineScaleY || 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = colors.black;
      ctx.fillRect(0, 0, width, height);

      if (this.guidesOn) {
        ctx.strokeStyle = this.timelineBright ? colors.white : colors.grey1;
        ctx.lineWidth = 1;
        for (let row = 0; row <= TIMELINE_ROW_COUNT; row++) {
          const y = Math.min(height - 0.5, Math.max(0.5, Math.round(row * rowHeight) + 0.5));
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        for (let i = 0; i <= 10; i++) {
          const x = Math.round(labelGutter + (plotWidth / 10) * i) + 0.5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        ctx.fillStyle = this.timelineBright ? colors.white : colors.grey2;
        ctx.font = `${Math.max(8, Math.min(12, Math.floor(rowHeight - 2)))}px Arial`;
        ctx.textBaseline = "middle";
        for (let midi = TIMELINE_START_MIDI; midi <= TIMELINE_END_MIDI; midi++) {
          const y = this.getTimelineNoteY(midi, rowHeight);
          ctx.fillText(this.midiToTimelineNoteName(midi), 6, y);
        }
      }

      this.timelineEvents.forEach((event) => {
        const age = now - event.time;
        const x = labelGutter + plotWidth - (age / this.timelineWindowMs) * plotWidth;
        const midis = event.midis.length ? event.midis : [60];
        const rowColor = event.type === "stop" ? colors.grey2 : event.type === "progression" ? colors.white : colors.color1;
        const blockWidth = 4;
        const blockX = Math.max(labelGutter, Math.round(x) - Math.floor(blockWidth / 2));
        midis.forEach((midi) => {
          const rowTop = this.getTimelineRowTop(midi, rowHeight);
          ctx.fillStyle = rowColor;
          ctx.fillRect(blockX, Math.round(rowTop) + 1, blockWidth, Math.max(2, Math.round(rowHeight) - 2));
        });
      });
    }

    getTimelineRowTop(midi, rowHeight) {
      const rawMidi = Math.round(Number(midi));
      const midiNumber = Number.isFinite(rawMidi) ? this.clamp(rawMidi, TIMELINE_START_MIDI, TIMELINE_END_MIDI) : TIMELINE_START_MIDI;
      return (TIMELINE_END_MIDI - midiNumber) * rowHeight;
    }

    getTimelineNoteY(midi, rowHeight) {
      return this.getTimelineRowTop(midi, rowHeight) + rowHeight / 2;
    }

    startTimelineLoop() {
      const tick = () => {
        this.drawTimeline();
        window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    }

    async copyPanelText() {
      if (!this.panelText || !navigator.clipboard?.writeText) return;
      try {
        await navigator.clipboard.writeText(this.panelText.value);
        this.copyButton?.classList.add("button-on");
        window.setTimeout(() => this.copyButton?.classList.remove("button-on"), 260);
      } catch (_) {}
    }
    getRootColors() {
      const rootStyles = window.getComputedStyle(document.documentElement);
      return {
        black: rootStyles.getPropertyValue("--black").trim(),
        color1: rootStyles.getPropertyValue("--color1").trim(),
        grey1: rootStyles.getPropertyValue("--grey1").trim(),
        grey2: rootStyles.getPropertyValue("--grey2").trim(),
        white: rootStyles.getPropertyValue("--white").trim()
      };
    }

    setPlaybackSpeed(value) {
      this.playbackSpeed = this.clamp(Math.round(value), MIN_PLAYBACK_SPEED, MAX_PLAYBACK_SPEED);
      if (this.speedSlider) this.speedSlider.value = String(this.playbackSpeed);
      this.updateSpeedDisplay();
      this.saveSettings();
      this.drawTimeline();
    }

    bumpPlaybackSpeed(delta) {
      this.setPlaybackSpeed(this.playbackSpeed + delta);
    }

    updateSpeedDisplay() {
      if (this.speedDisplay) this.speedDisplay.value = `${this.playbackSpeed}%`;
    }

    getSequenceStepMs(baseMs) {
      return baseMs * (100 / this.clamp(this.playbackSpeed, MIN_PLAYBACK_SPEED, MAX_PLAYBACK_SPEED));
    }

    bindHoldButton(element, action) {
      if (!element) return;
      let intervalId = null;
      let activePointerId = null;

      const stop = () => {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      };

      const start = () => {
        stop();
        action();
        intervalId = window.setInterval(action, 100);
      };

      const stopPointer = (event) => {
        if (activePointerId === null) return;
        if (event && event.pointerId !== activePointerId) return;
        if (event && typeof element.releasePointerCapture === "function") {
          try {
            element.releasePointerCapture(activePointerId);
          } catch (_) {}
        }
        activePointerId = null;
        stop();
      };

      element.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        activePointerId = event.pointerId;
        if (typeof element.setPointerCapture === "function") {
          try {
            element.setPointerCapture(activePointerId);
          } catch (_) {}
        }
        start();
      });
      element.addEventListener("pointerup", stopPointer);
      element.addEventListener("pointercancel", stopPointer);
    }

    bumpVolume(delta) {
      this.volume = this.clamp(this.volume + delta, 0, 100);
      if (this.volumeSlider) this.volumeSlider.value = String(this.volume);
      this.updateMasterGain();
      this.saveSettings();
    }

    getChordLabel(mode, index) {
      const key = KEYS[index];
      if (mode === "minor") return this.formatDisplayLabel(key.minor);
      if (mode === "dim") return this.formatDisplayLabel(key.dim);
      return this.formatDisplayLabel(key.major);
    }

    getModeLabel(mode) {
      if (mode === "minor") return "Minor";
      if (mode === "dim") return "Diminished";
      return "Major";
    }

    normalizeToneType(tone) {
      const allowed = ["sine", "square", "sawtooth", "triangle", "piano"];
      return allowed.includes(tone) ? tone : "piano";
    }

    compactSignature(signature) {
      if (signature === "No sharps or flats") return "0";
      if (signature === "6 sharps or 6 flats") return "6#/6♭";
      const match = signature.match(/^(\d+)\s+(sharp|sharps|flat|flats)/i);
      if (!match) return signature;
      return `${match[1]}${match[2].startsWith("sharp") ? "#" : "♭"}`;
    }

    getWheelLabel(label, mode) {
      const compactLabel = mode === "dim" ? String(label).split("/")[0] : label;
      return this.formatDisplayLabel(compactLabel);
    }

    formatDisplayLabel(value) {
      return String(value)
        .replace(/dim\b/g, "°")
        .replace(/([A-G])b/g, "$1♭");
    }

    getAscendingScaleMidis(scale) {
      const midis = [];
      let previous = null;
      scale.concat(scale[0]).forEach((note, index) => {
        let midi = this.noteToMidi(note, index === scale.length ? 5 : 4);
        while (previous !== null && midi <= previous) midi += 12;
        midis.push(midi);
        previous = midi;
      });
      return midis;
    }

    noteToChordRootMidi(note) {
      return this.noteToMidi(note, 4);
    }

    noteToMidi(note, octave) {
      return 12 * (octave + 1) + this.noteToSemitone(note);
    }

    noteToSemitone(note) {
      const normalized = this.normalizeNoteName(note);
      return NOTE_TO_SEMITONE[normalized] ?? 0;
    }

    normalizeNoteName(note) {
      return String(note || "C")
        .replace(/dim$/i, "")
        .replace(/m$/i, "")
        .split("/")[0]
        .trim();
    }

    midiToFrequency(midi) {
      const a4 = parseFloat(localStorage.getItem("global.a4_hz"));
      const a4Hz = Number.isFinite(a4) && a4 > 0 ? a4 : 440;
      return a4Hz * Math.pow(2, (midi - 69) / 12);
    }

    midiToNoteName(midi) {
      return MIDI_NOTE_NAMES[this.normalizeIndex(midi)] || "C";
    }

    midiToTimelineNoteName(midi) {
      return `${this.midiToNoteName(midi)}${Math.floor(midi / 12) - 1}`;
    }

    ringSectorPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
      const p1 = this.polar(cx, cy, outerRadius, startAngle);
      const p2 = this.polar(cx, cy, outerRadius, endAngle);
      const p3 = this.polar(cx, cy, innerRadius, endAngle);
      const p4 = this.polar(cx, cy, innerRadius, startAngle);
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      return [
        `M ${p1.x} ${p1.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
        `L ${p3.x} ${p3.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
        "Z"
      ].join(" ");
    }

    polar(cx, cy, radius, angle) {
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      };
    }

    normalizeIndex(index) {
      return ((index % 12) + 12) % 12;
    }

    clamp(value, min, max) {
      const safeValue = Number.isFinite(value) ? value : min;
      return Math.min(max, Math.max(min, safeValue));
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    new CircleOfFifths();
  });
})();

// END OF FILE
