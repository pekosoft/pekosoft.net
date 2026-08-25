// Pekosoft BPM Circle
// pekosoft.net/js/bpm_circle.js

window.addEventListener('DOMContentLoaded', () => {
  new BPMVisualizer();
});

class BPMVisualizer {
  constructor() {
    this.bpmInput = document.getElementById('bpmInput');
    this.toggleButton = document.getElementById('toggle-play-button');
    this.stopButton = document.getElementById('stop-button');
    this.resetButton = document.getElementById('reset-button');
    this.copyButton = document.getElementById('copy-button');
    this.togglePlayheadButton = document.getElementById('toggle-playhead-button');
    this.holdButton = document.getElementById('hold-button');
    this.loopButton = document.getElementById('loop-button');
    this.soundMasterButton = document.getElementById('sound-master-button');
    this.prevButton = document.getElementById('prev-button');
    this.nextButton = document.getElementById('next-button');
    this.allButton = document.getElementById('all-button');
    this.noneButton = document.getElementById('none-button');
    this.tempoSlider = document.getElementById('tempo-slider');
    this.tempoDecreaseButton = document.getElementById('decrease-button');
    this.tempoIncreaseButton = document.getElementById('increase-button');
    this.beatLine = document.querySelector('.beat-line');
    this.linearPlayhead = document.querySelector('.linear-playhead');
    this.beatSoundSelect = document.getElementById('beat-sound-type');
    this.volumeSlider = document.getElementById('volume-slider');
    this.volumeDownButton = document.getElementById('volume-decrease-button');
    this.volumeUpButton = document.getElementById('volume-increase-button');
    this.noteGroups = {
      1: { segments: [], count: 1 },
      2: { segments: [], count: 2 },
      4: { segments: [], count: 4 },
      8: { segments: [], count: 8 },
      16: { segments: [], count: 16 },
      32: { segments: [], count: 32 },
      64: { segments: [], count: 64 },
      128: { segments: [], count: 128 }
    };

    this.infoText = document.querySelector('.info-text');
    
    this.currentBeats = {
      1: 0,
      2: 0,
      4: 0,
      8: 0,
      16: 0,
      32: 0,
      64: 0,
      128: 0
    };
    
    // Prefer FactoryDefaults, then localStorage, then fallback
    let defaultBPM = 120;
    if (window.FactoryDefaults && typeof window.FactoryDefaults.defaultBPM === 'number') {
      defaultBPM = window.FactoryDefaults.defaultBPM;
    } else {
      const globalDefaultBPM = parseFloat(localStorage.getItem('global.default_bpm'));
      if (Number.isFinite(globalDefaultBPM)) {
        defaultBPM = Math.max(1, Math.min(300, globalDefaultBPM));
      }
    }
    this.DEFAULT_BPM = defaultBPM;
    this.DEFAULT_BEAT_SOUND = 'click';
    this.DEFAULT_VOLUME = 100;
    this.interval = null;
    this.isPlaying = false;

    this.audioContext = null;
    this.metersAnalyser = null;
    this.masterMuteGainNode = null;
    this.metersLastActiveSec = 0;
    this.initAudio();
    
    this.soundStates = {
      1: false,
      2: false,
      4: false,
      8: false,
      16: false,
      32: false,
      64: false,
      128: false
    };

    this.frequencies = {
      1: 600,
      2: 800,
      4: 1000,
      8: 1200,
      16: 1400,
      32: 1600,
      64: 1800,
      128: 2000
    };

    this.masterVolume = this.DEFAULT_VOLUME / 100;

    this.selectedSegmentInfo = null;

    this.isLineVisible = false;
    this.lineRotation = 0;
    this.lastTickTime = null;

    this.isHoldEnabled = false;
    this.lastActiveSegments = {
      1: null,
      2: null,
      4: null,
      8: null,
      16: null,
      32: null,
      64: null,
      128: null
    };

    this.linearNoteGroups = {
      1: { segments: [], count: 1 },
      2: { segments: [], count: 2 },
      4: { segments: [], count: 4 },
      8: { segments: [], count: 8 },
      16: { segments: [], count: 16 },
      32: { segments: [], count: 32 },
      64: { segments: [], count: 64 },
      128: { segments: [], count: 128 }
    };
    this.isLoopEnabled = true;

    this.isSoundMasterEnabled = true;

    this.displayMode = 'selected';
    this.initInfoDisplayButtons();

    this.initializeSegments();
    this.initializeLinearSegments();
    this.initSegmentHoverInfo();
    this.initSoundButtons();
    this.initPlayheadButton();
    this.initHoldButton();
    this.initLoopButton();
    this.initSoundMasterButton();
    this.init();

    this.isLineVisible = true;
    this.togglePlayheadButton.classList.add('button-on');
    this.beatLine.classList.add('visible');
    this.linearPlayhead.classList.add('visible');
    this.loopButton.classList.add('button-on');

    this.loadSavedSettings();

    this.initNavigationButtons();

    this.initTempoControls();
    this.initVolumeControls();
    this.initBeatSoundSelector();
    this.initCopyButton();
  }

  setToggleButtonState(button, enabled) {
    if (!button) return;
    button.classList.toggle('button-on', enabled);
    button.classList.toggle('active', enabled);
  }

  async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      window.addEventListener('pekosoft:global-sound-change', () => this.updateMasterSoundOutput());
      this.ensureMetersAnalyser();
      this.updateMetersSourceBridge();
    } catch (e) {
      console.error('Web Audio API is not supported in this browser');
    }
  }

  ensureMasterMuteGainNode() {
    if (!this.audioContext) return null;
    if (!this.masterMuteGainNode) {
      this.masterMuteGainNode = this.audioContext.createGain();
      this.masterMuteGainNode.gain.value = this.isSoundMasterEnabled && localStorage.getItem('global.sound') !== 'false' ? 1 : 0;
      this.masterMuteGainNode.connect(this.audioContext.destination);
    }
    return this.masterMuteGainNode;
  }

  ensureMetersAnalyser() {
    if (!this.audioContext) return null;
    if (!this.metersAnalyser) {
      this.metersAnalyser = this.audioContext.createAnalyser();
      this.metersAnalyser.fftSize = 2048;
      this.metersAnalyser.connect(this.ensureMasterMuteGainNode());
    }
    return this.metersAnalyser;
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

  createSegments(radius, count) {
    const segments = [];
    const angleStep = (2 * Math.PI) / count;
    const gap = count === 1 ? 0 : 0.005;
    
    if (count === 1) {
      const d = `M0,${-radius} A${radius},${radius} 0 1,1 0,${radius} A${radius},${radius} 0 1,1 0,${-radius}`;
      segments.push(d);
    } else {
      for (let i = 0; i < count; i++) {
        const startAngle = i * angleStep + gap/2;
        const endAngle = (i + 1) * angleStep - gap/2;
        
        const startX = radius * Math.sin(startAngle);
        const startY = -radius * Math.cos(startAngle);
        const endX = radius * Math.sin(endAngle);
        const endY = -radius * Math.cos(endAngle);
        
        const largeArcFlag = 0;
        const sweepFlag = 1;
        
        const d = `M${startX},${startY} A${radius},${radius} 0 ${largeArcFlag},${sweepFlag} ${endX},${endY}`;
        segments.push(d);
      }
    }
    
    return segments;
  }

  createLinearSegments(count, rowIndex) {
    const segments = [];
    const width = 800;
    const gap = 1;
    const segmentWidth = (width / count) - gap;
    const y = 14 + rowIndex * 25;
    
    for (let i = 0; i < count; i++) {
      const x = i * (segmentWidth + gap);
      const d = `M${x},${y} H${x + segmentWidth}`;
      segments.push(d);
    }
    
    return segments;
  }

  initializeSegments() {
    const radii = {
      1: 35,
      2: 50,
      4: 65,
      8: 80,
      16: 95,
      32: 110,
      64: 125,
      128: 140
    };

    Object.entries(this.noteGroups).forEach(([division, group]) => {
      const container = document.querySelector(`.note-${division} .segments`);

      const paths = this.createSegments(radii[division], group.count);
      paths.forEach((d, i) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'segment');
        path.setAttribute('data-beat', i);
        container.appendChild(path);
      });
      
      group.segments = container.querySelectorAll('.segment');
    });
  }

  initializeLinearSegments() {
    let rowIndex = 0;
    Object.entries(this.linearNoteGroups).forEach(([division, group]) => {
      const container = document.querySelector(`.linear-note-${division}`);
      
      const paths = this.createLinearSegments(group.count, rowIndex);
      paths.forEach((d, i) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'linear-segment');
        path.setAttribute('data-beat', i);
        container.appendChild(path);
      });
      
      group.segments = container.querySelectorAll('.linear-segment');
      rowIndex++;
    });
  }

  initSegmentHoverInfo() {
    const updateInfoDisplay = (division, index, group) => {
      if (this.displayMode !== 'selected') return;
      
      const bpm = parseInt(this.bpmInput.value) || this.DEFAULT_BPM;
      const noteValue = `1/${division}`;
      const beatNumber = index + 1;
      
      const quarterNoteMs = 60000 / bpm;  // Duration of one quarter note in ms
      const wholeBeatMs = quarterNoteMs * 4;  // Duration of whole note (4 quarter notes)
      const beatMs = wholeBeatMs * (index / group.count);  // Time position
      const noteDuration = wholeBeatMs / group.count;  // Duration of one note of this division
      
      this.infoText.value = `BPM: ${bpm}. Note value: ${noteValue}. Beat number: ${beatNumber}. Position: ${beatMs.toFixed(3)} ms. Duration: ${noteDuration.toFixed(3)} ms.`;
    };

    const handleSegments = (segments, division, group, isLinear) => {
      segments.forEach((segment, index) => {
        segment.addEventListener('mouseover', () => {
          updateInfoDisplay(division, index, group);
          if (isLinear) {
            const circularSegment = document.querySelector(`.note-${division} .segment[data-beat="${index}"]`);
            if (circularSegment) circularSegment.classList.add('hover');
          } else {
            const linearSegment = document.querySelector(`.linear-note-${division} .linear-segment[data-beat="${index}"]`);
            if (linearSegment) linearSegment.classList.add('hover');
          }
        });
        
        segment.addEventListener('mouseout', () => {
          if (this.displayMode === 'selected') {
            if (this.selectedSegmentInfo) {
              this.updateInfoDisplay();
            } else {
              this.infoText.value = '';
            }
          }
          if (isLinear) {
            const circularSegment = document.querySelector(`.note-${division} .segment[data-beat="${index}"]`);
            if (circularSegment) circularSegment.classList.remove('hover');
          } else {
            const linearSegment = document.querySelector(`.linear-note-${division} .linear-segment[data-beat="${index}"]`);
            if (linearSegment) linearSegment.classList.remove('hover');
          }
        });

        segment.addEventListener('click', () => {
          const isCurrentlySelected = segment.classList.contains('selected');
          
          document.querySelectorAll('.segment, .linear-segment').forEach(s => 
            s.classList.remove('selected')
          );
          
          if (isCurrentlySelected) {
            this.selectedSegmentInfo = null;
            this.infoText.value = '';
            localStorage.removeItem('bpm_circle.selected_segment');
          } else {
            segment.classList.add('selected');
            if (isLinear) {
              document.querySelector(`.note-${division} .segment[data-beat="${index}"]`).classList.add('selected');
            } else {
              document.querySelector(`.linear-note-${division} .linear-segment[data-beat="${index}"]`).classList.add('selected');
            }
            
            this.selectedSegmentInfo = {
              division,
              index,
              group,
              updateInfo: () => {
                this.updateInfoDisplay();
              }
            };
            this.selectedSegmentInfo.updateInfo();
            
            localStorage.setItem('bpm_circle.selected_segment', JSON.stringify({ division, index }));
          }
        });
      });
    };

    Object.entries(this.noteGroups).forEach(([division, group]) => {
      const circularSegments = document.querySelectorAll(`.note-${division} .segment`);
      const linearSegments = document.querySelectorAll(`.linear-note-${division} .linear-segment`);
      
      handleSegments(circularSegments, division, group, false);
      handleSegments(linearSegments, division, group, true);
    });
  }

  initSoundButtons() {
    const footer = document.getElementById('note-value-footer');
    if (!footer) return;
    const createSoundButton = (division) => {
      const button = document.createElement('button');
      button.className = `sound-button note-${division} square icon-only`;
      button.title = `Toggle 1/${division} note`;
      button.innerHTML = `
        <svg class="icons" role="img">
          <use href="/icons.svg#1_${division}" />
        </svg>
      `;
      button.addEventListener('click', () => this.toggleSound(division));
      return button;
    };
    [1, 2, 4, 8, 16, 32, 64, 128].forEach(division => {
      const button = createSoundButton(division);
      footer.appendChild(button);
    });
  }

  initPlayheadButton() {
    this.togglePlayheadButton.addEventListener('click', () => {
      this.toggleLine();
      this.togglePlayheadButton.classList.toggle('button-on', this.isLineVisible);
    });
  }

  initHoldButton() {
    this.holdButton.addEventListener('click', () => {
      this.toggleHold();
      this.holdButton.classList.toggle('button-on', this.isHoldEnabled);
    });
  }

  initLoopButton() {
    this.loopButton.addEventListener('click', () => {
      this.toggleLoop();
      this.loopButton.classList.toggle('button-on', this.isLoopEnabled);
    });
  }

  initSoundMasterButton() {
    this.soundMasterButton.classList.add('button-on');
    this.soundMasterButton.addEventListener('click', () => {
      this.toggleSoundMaster();
      this.soundMasterButton.classList.toggle('button-on', this.isSoundMasterEnabled);
    });
  }

  toggleSound(division) {
    this.soundStates[division] = !this.soundStates[division];
    const button = document.querySelector(`.sound-button.note-${division}`);
    if (button) {
      button.classList.toggle('button-on', this.soundStates[division]);
    }
    const noteGroup = document.querySelector(`.note-${division}`);
    const linearNoteGroup = document.querySelector(`.linear-note-${division}`);
    noteGroup.setAttribute('data-sound-enabled', this.soundStates[division]);
    linearNoteGroup.setAttribute('data-sound-enabled', this.soundStates[division]);
    if (this.soundStates[division] && !this.audioContext) {
      this.initAudio();
    }
    localStorage.setItem(`sound-${division}`, this.soundStates[division]);
    if (this.displayMode === 'active') {
      this.updateInfoDisplay();
    }
  }

  setSoundState(division, enabled, persist = true) {
    this.soundStates[division] = !!enabled;

    const button = document.querySelector(`.sound-button.note-${division}`);
    if (button) {
      button.classList.toggle('button-on', this.soundStates[division]);
    }

    const noteGroup = document.querySelector(`.note-${division}`);
    const linearNoteGroup = document.querySelector(`.linear-note-${division}`);
    if (noteGroup) noteGroup.setAttribute('data-sound-enabled', this.soundStates[division]);
    if (linearNoteGroup) linearNoteGroup.setAttribute('data-sound-enabled', this.soundStates[division]);

    if (this.soundStates[division] && !this.audioContext) {
      this.initAudio();
    }

    if (persist) {
      localStorage.setItem(`sound-${division}`, this.soundStates[division]);
    }
  }
  updateSoundButtonStates() {
    [1, 2, 4, 8, 16, 32, 64, 128].forEach(division => {
      const button = document.querySelector(`.sound-button.note-${division}`);
      if (button) {
        button.classList.toggle('button-on', !!this.soundStates[division]);
      }
    });
  }

  playClick(frequency = 1000) {
    if (!this.audioContext) return;
    if (typeof window.playTransientSound !== 'function') return;

    const tone = this.beatSoundSelect ? this.beatSoundSelect.value : this.DEFAULT_BEAT_SOUND;
    const base = typeof window.getTransientBaseFrequencyHz === 'function'
      ? window.getTransientBaseFrequencyHz()
      : 880;
    const ratio = base > 0 ? frequency / base : 1;

    window.playTransientSound({
      audioContext: this.audioContext,
      destinationNode: this.ensureMetersAnalyser(),
      tone,
      gain: Math.max(0, this.masterVolume * 0.35),
      pitchRatio: ratio,
      durationSec: 0.06,
      ignoreGlobalSound: true
    });
    this.touchMetersActivity(this.audioContext.currentTime);
    this.updateMetersSourceBridge();
  }

  init() {
    this.bpmInput.addEventListener('input', () => this.updateBPM());

    this.bpmInput.addEventListener('blur', () => {
      if (!this.bpmInput.value || isNaN(parseInt(this.bpmInput.value))) {
        this.bpmInput.value = this.DEFAULT_BPM;
        this.updateBPM(false);
      }
    });
    
    this.toggleButton.addEventListener('click', () => this.togglePlayback());
    this.stopButton.addEventListener('click', () => this.stopPlayback());
    this.resetButton.addEventListener('click', () => this.reset());
    
    const savedBPM = localStorage.getItem('bpm_circle.bpm');
    if (savedBPM !== null) {
      this.bpmInput.value = savedBPM;
      this.updateBPM(false);
    } else {
      this.bpmInput.value = this.DEFAULT_BPM;
      this.updateBPM(false);
    }

    window.addEventListener('pekosoft:global-defaults-change', (event) => {
      const defaults = event.detail;
      if (!defaults || !['bpm', 'all'].includes(defaults.changed)) return;
      const bpm = defaults.bpm;
      if (!Number.isFinite(bpm)) return;
      this.DEFAULT_BPM = Math.min(300, Math.max(1, Math.round(bpm)));
      this.bpmInput.value = String(this.DEFAULT_BPM);
      this.updateBPM(this.isPlaying);
    });
  }

  reset() {
    if (this.isPlaying) {
      this.togglePlayback();
    }

    // Reset BPM
    this.bpmInput.value = this.DEFAULT_BPM;
    this.tempoSlider.value = this.DEFAULT_BPM;
    this.updateBPM(false);

    // Reset segments
    Object.values(this.noteGroups).forEach(group => {
      group.segments.forEach(segment => {
        segment.classList.remove('active', 'selected', 'hold');
      });
    });
    Object.values(this.linearNoteGroups).forEach(group => {
      group.segments.forEach(segment => {
        segment.classList.remove('active', 'selected', 'hold');
      });
    });
    Object.keys(this.currentBeats).forEach(key => {
      this.currentBeats[key] = 0;
    });

    // Reset sound states, set only 1/4 note on
    Object.keys(this.soundStates).forEach(division => {
      this.soundStates[division] = false;
      const button = document.querySelector(`.sound-button.note-${division}`);
      if (button) button.classList.remove('button-on');
      const noteGroup = document.querySelector(`.note-${division}`);
      const linearNoteGroup = document.querySelector(`.linear-note-${division}`);
      noteGroup.setAttribute('data-sound-enabled', 'false');
      linearNoteGroup.setAttribute('data-sound-enabled', 'false');
    });
    this.soundStates[4] = true;
    const button4 = document.querySelector('.sound-button.note-4');
    if (button4) button4.classList.add('button-on');
    const noteGroup4 = document.querySelector('.note-4');
    const linearNoteGroup4 = document.querySelector('.linear-note-4');
    if (noteGroup4) noteGroup4.setAttribute('data-sound-enabled', 'true');
    if (linearNoteGroup4) linearNoteGroup4.setAttribute('data-sound-enabled', 'true');

    // Reset toggles
    this.isLineVisible = true;
    this.togglePlayheadButton.classList.add('button-on');
    this.beatLine.classList.add('visible');
    this.linearPlayhead.classList.add('visible');
    this.linearPlayhead.setAttribute('x1', '0');
    this.linearPlayhead.setAttribute('x2', '0');

    this.isLoopEnabled = true;
    this.loopButton.classList.add('button-on');

    this.isHoldEnabled = false;
    this.holdButton.classList.remove('button-on');

    this.isSoundMasterEnabled = true;
    this.soundMasterButton.classList.add('button-on');

    // Reset info panel
    this.selectedSegmentInfo = null;
    this.infoText.value = '';

    // Reset beat sound and volume
    if (this.beatSoundSelect) {
      this.beatSoundSelect.value = this.DEFAULT_BEAT_SOUND;
      localStorage.removeItem('bpm_circle.beat_sound');
    }
    this.masterVolume = this.DEFAULT_VOLUME / 100;
    if (this.volumeSlider) {
      this.volumeSlider.value = this.DEFAULT_VOLUME;
    }
    localStorage.removeItem('bpm_circle.volume');

    // Remove all localStorage state
    localStorage.removeItem('bpm_circle.bpm');
    Object.keys(this.soundStates).forEach(division => {
      localStorage.removeItem(`sound-${division}`);
    });
    localStorage.removeItem('bpm_circle.line_visible');
    localStorage.removeItem('bpm_circle.hold_enabled');
    localStorage.removeItem('bpm_circle.loop_enabled');
    localStorage.removeItem('bpm_circle.selected_segment');
    localStorage.removeItem('bpm_circle.sound_master_enabled');
    localStorage.removeItem('bpm_circle.info_display');
    this.updateMetersSourceBridge();
  }

  togglePlayback() {
    this.isPlaying = !this.isPlaying;
    this.toggleButton.classList.toggle('playing', this.isPlaying);
    this.toggleButton.classList.toggle('button-on', this.isPlaying);
    
    if (this.isPlaying) {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {
          // Resume is best-effort; the next gesture can retry.
        });
      }
      this.lastTickTime = performance.now();
      this.tick();
      this.updateBPM(true);
    } else {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }

    this.updateMetersSourceBridge();
  }

  stopPlayback() {
    this.isPlaying = false;
    this.toggleButton.classList.remove('playing');
    this.toggleButton.classList.remove('button-on');

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    Object.values(this.noteGroups).forEach(group => {
      group.segments.forEach(segment => {
        segment.classList.remove('active', 'hold');
      });
    });

    Object.values(this.linearNoteGroups).forEach(group => {
      group.segments.forEach(segment => {
        segment.classList.remove('active', 'hold');
      });
    });

    Object.keys(this.currentBeats).forEach(key => {
      this.currentBeats[key] = 0;
    });

    Object.keys(this.lastActiveSegments).forEach(key => {
      this.lastActiveSegments[key] = null;
    });

    this.lineRotation = 0;
    this.beatLine.setAttribute('transform', 'rotate(0)');
    this.linearPlayhead.setAttribute('x1', '0');
    this.linearPlayhead.setAttribute('x2', '0');
    this.lastTickTime = null;

    if (this.displayMode === 'active') {
      this.updateInfoDisplay();
    }

    this.updateMetersSourceBridge();
  }

  updateBPM(startPlaying = true) {
    const inputValue = this.bpmInput.value;
    if (inputValue === '') {
      return;
    }

    const bpm = Math.min(300, Math.max(1, parseInt(inputValue) || this.DEFAULT_BPM));
    this.bpmInput.value = bpm;
    
    this.updateInfoDisplay();
    
    if (this.interval) {
      clearInterval(this.interval);
    }

    if (startPlaying && this.isPlaying) {
      const beatDuration = (60000 / bpm); 
      const interval128 = beatDuration / 16; 

      this.interval = setInterval(() => {
        const now = performance.now();
        this.lastTickTime = now;
        this.tick();
      }, interval128);
    }

    if (bpm) {
      localStorage.setItem('bpm_circle.bpm', bpm.toString());
    }
    this.tempoSlider.value = this.bpmInput.value;
  }

  toggleHold() {
    this.isHoldEnabled = !this.isHoldEnabled;
    this.setToggleButtonState(this.holdButton, this.isHoldEnabled);
    
    if (!this.isHoldEnabled) {
      Object.values(this.noteGroups).forEach(group => {
        group.segments.forEach(segment => {
          segment.classList.remove('hold');
        });
      });
      Object.values(this.linearNoteGroups).forEach(group => {
        group.segments.forEach(segment => {
          segment.classList.remove('hold');
        });
      });
      Object.keys(this.lastActiveSegments).forEach(key => {
        this.lastActiveSegments[key] = null;
      });
    }
    
    localStorage.setItem('bpm_circle.hold_enabled', this.isHoldEnabled);
  }

  toggleLoop() {
    this.isLoopEnabled = !this.isLoopEnabled;
    this.setToggleButtonState(this.loopButton, this.isLoopEnabled);
    
    localStorage.setItem('bpm_circle.loop_enabled', this.isLoopEnabled);
  }

  toggleSoundMaster() {
    this.isSoundMasterEnabled = !this.isSoundMasterEnabled;
    this.setToggleButtonState(this.soundMasterButton, this.isSoundMasterEnabled);
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // Resume is best-effort; the next gesture can retry.
      });
    }
    this.updateMasterSoundOutput();
    localStorage.setItem('bpm_circle.sound_master_enabled', this.isSoundMasterEnabled);
    if (this.displayMode === 'active') {
      this.updateInfoDisplay();
    }
  }

  updateMasterSoundOutput() {
    const muteGain = this.ensureMasterMuteGainNode();
    if (!muteGain || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    const globalSoundOn = localStorage.getItem('global.sound') !== 'false';
    muteGain.gain.cancelScheduledValues(now);
    muteGain.gain.setValueAtTime(this.isSoundMasterEnabled && globalSoundOn ? 1 : 0, now);
  }

  tick() {
    Object.values(this.noteGroups).forEach(group => {
      group.segments.forEach(segment => {
        segment.classList.remove('active');
      });
    });
    
    Object.values(this.linearNoteGroups).forEach(group => {
      group.segments.forEach(segment => {
        segment.classList.remove('active');
      });
    });

    const beat128 = this.currentBeats[128];

    Object.entries(this.noteGroups).forEach(([division, group]) => {
      if (beat128 % (128 / division) === 0) {
        const currentBeat = this.currentBeats[division];
        
        if (this.lastActiveSegments[division] !== null && this.isHoldEnabled) {
          this.lastActiveSegments[division].classList.remove('hold');
          const linearSegment = this.linearNoteGroups[division].segments[this.lastActiveSegments[division].dataset.beat];
          if (linearSegment) {
            linearSegment.classList.remove('hold');
          }
        }
        
        group.segments.forEach(segment => {
          if (parseInt(segment.dataset.beat) === currentBeat) {
            segment.classList.add('active');
            if (this.isHoldEnabled) {
              segment.classList.add('hold');
              this.lastActiveSegments[division] = segment;
            }
          }
        });
        
        const linearGroup = this.linearNoteGroups[division];
        linearGroup.segments.forEach(segment => {
          if (parseInt(segment.dataset.beat) === currentBeat) {
            segment.classList.add('active');
            if (this.isHoldEnabled) {
              segment.classList.add('hold');
            }
          }
        });
        
        if (this.soundStates[division]) {
          this.playClick(this.frequencies[division]);
        }
        
        this.currentBeats[division] = (currentBeat + 1) % group.count;
      }
    });

    const progress = beat128 / 128;
    const x = progress * 800;  
    this.linearPlayhead.setAttribute('x1', x);
    this.linearPlayhead.setAttribute('x2', x);
    
    this.currentBeats[128] = (beat128 + 1) % 128;
    
    if (!this.isLoopEnabled && this.currentBeats[128] === 0) {
      this.isPlaying = false;
      this.toggleButton.classList.remove('playing');
      this.toggleButton.classList.remove('button-on');
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }
    
    this.updateLineRotation();
    
    if (this.displayMode === 'active') {
      this.updateInfoDisplay();
    }
  }

  toggleLine() {
    this.isLineVisible = !this.isLineVisible;
    this.setToggleButtonState(this.togglePlayheadButton, this.isLineVisible);
    this.beatLine.classList.toggle('visible', this.isLineVisible);
    this.linearPlayhead.classList.toggle('visible', this.isLineVisible);
    
    localStorage.setItem('bpm_circle.line_visible', this.isLineVisible);
  }

  updateLineRotation() {
    if (!this.lastTickTime) {
      this.lastTickTime = performance.now();
      return;
    }
    
    const rotationPerBeat = 360 / 128; 
    this.lineRotation = (this.currentBeats[128] * rotationPerBeat) % 360;
    
    this.beatLine.setAttribute('transform', `rotate(${this.lineRotation})`);
  }

  loadSavedSettings() {
    const soundDivisions = Object.keys(this.soundStates);
    const hasSavedSoundState = soundDivisions.some(division => {
      const saved = localStorage.getItem(`sound-${division}`);
      return saved === 'true' || saved === 'false';
    });

    if (hasSavedSoundState) {
      soundDivisions.forEach(division => {
        const saved = localStorage.getItem(`sound-${division}`);
        this.setSoundState(parseInt(division, 10), saved === 'true', false);
      });
    } else {
      // Factory default only when no saved sound state exists.
      this.setSoundState(4, true, true);
    }

    const lineVisible = localStorage.getItem('bpm_circle.line_visible');
    if (lineVisible === 'false') {
      this.isLineVisible = false;
      this.beatLine.classList.remove('visible');
      this.linearPlayhead.classList.remove('visible');
      this.setToggleButtonState(this.togglePlayheadButton, false);
    } else if (lineVisible === 'true') {
      this.isLineVisible = true;
      this.beatLine.classList.add('visible');
      this.linearPlayhead.classList.add('visible');
      this.setToggleButtonState(this.togglePlayheadButton, true);
    }

    const holdEnabled = localStorage.getItem('bpm_circle.hold_enabled');
    if (holdEnabled === 'true') {
      this.isHoldEnabled = true;
      this.setToggleButtonState(this.holdButton, true);
    } else if (holdEnabled === 'false') {
      this.isHoldEnabled = false;
      this.setToggleButtonState(this.holdButton, false);
    }

    const loopEnabled = localStorage.getItem('bpm_circle.loop_enabled');
    if (loopEnabled === 'false') {
      this.isLoopEnabled = false;
      this.setToggleButtonState(this.loopButton, false);
    } else if (loopEnabled === 'true') {
      this.isLoopEnabled = true;
      this.setToggleButtonState(this.loopButton, true);
    }

    const selectedSegment = localStorage.getItem('bpm_circle.selected_segment');
    if (selectedSegment) {
      const { division, index } = JSON.parse(selectedSegment);
      const circularSegment = document.querySelector(`.note-${division} .segment[data-beat="${index}"]`);
      const linearSegment = document.querySelector(`.linear-note-${division} .linear-segment[data-beat="${index}"]`);
      
      if (circularSegment && linearSegment) {
        circularSegment.classList.add('selected');
        linearSegment.classList.add('selected');
        
        this.selectedSegmentInfo = {
          division,
          index,
          group: this.noteGroups[division],
          updateInfo: () => {
            this.updateInfoDisplay();
          }
        };
        this.selectedSegmentInfo.updateInfo();
      }
    }
    
    const soundMasterEnabled = localStorage.getItem('bpm_circle.sound_master_enabled');
    if (soundMasterEnabled === 'false') {
      this.isSoundMasterEnabled = false;
      this.setToggleButtonState(this.soundMasterButton, false);
    } else if (soundMasterEnabled === 'true') {
      this.isSoundMasterEnabled = true;
      this.setToggleButtonState(this.soundMasterButton, true);
    }

    const savedDisplayMode = localStorage.getItem('bpm_circle.info_display');
    if (savedDisplayMode === 'selected' || savedDisplayMode === 'active' || savedDisplayMode === 'all') {
      this.displayMode = savedDisplayMode;
      this.syncInfoDisplayButtons();
      this.updateInfoDisplay();
    }

    const savedBeatSound = localStorage.getItem('bpm_circle.beat_sound');
    if (this.beatSoundSelect && savedBeatSound) {
      this.beatSoundSelect.value = savedBeatSound;
    }

    const savedVolume = parseInt(localStorage.getItem('bpm_circle.volume') || '', 10);
    if (this.volumeSlider && Number.isFinite(savedVolume)) {
      this.volumeSlider.value = Math.min(100, Math.max(0, savedVolume));
    }
    this.masterVolume = ((this.volumeSlider ? parseInt(this.volumeSlider.value, 10) : this.DEFAULT_VOLUME) || this.DEFAULT_VOLUME) / 100;
  }

  initBeatSoundSelector() {
    if (!this.beatSoundSelect) return;
    if (!this.beatSoundSelect.value) {
      this.beatSoundSelect.value = this.DEFAULT_BEAT_SOUND;
    }
    this.beatSoundSelect.addEventListener('change', () => {
      localStorage.setItem('bpm_circle.beat_sound', this.beatSoundSelect.value);
    });
  }

  initVolumeControls() {
    if (!this.volumeSlider) return;

    const applyVolume = (value) => {
      const clamped = Math.max(0, Math.min(100, value));
      this.volumeSlider.value = clamped;
      this.masterVolume = clamped / 100;
      localStorage.setItem('bpm_circle.volume', String(clamped));
    };

    this.volumeSlider.addEventListener('input', () => {
      applyVolume(parseInt(this.volumeSlider.value, 10) || 0);
    });

    window.bindPekosoftRangeButtons(
      this.volumeSlider,
      this.volumeDownButton,
      this.volumeUpButton
    );
  }

  initCopyButton() {
    if (!this.copyButton || !this.infoText) return;
    this.copyButton.addEventListener('click', () => {
      const value = this.infoText.value.trim();
      if (!value) return;
      navigator.clipboard.writeText(value);
    });
  }

  initNavigationButtons() {
    let prevInterval = null;
    let nextInterval = null;
    let prevPointerId = null;
    let nextPointerId = null;

    const capturePointer = (button, event) => {
      if (typeof button.setPointerCapture !== 'function') return;
      try {
        button.setPointerCapture(event.pointerId);
      } catch (_) {}
    };

    const releasePointer = (button, pointerId) => {
      if (pointerId === null || typeof button.releasePointerCapture !== 'function') return;
      try {
        button.releasePointerCapture(pointerId);
      } catch (_) {}
    };

    this.prevButton.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      prevPointerId = event.pointerId;
      capturePointer(this.prevButton, event);
      this.selectPrevSegment();
      prevInterval = setInterval(() => this.selectPrevSegment(), 200);
    });
    this.prevButton.addEventListener('pointerup', (event) => {
      if (prevPointerId !== null && event.pointerId !== prevPointerId) return;
      if (prevInterval) clearInterval(prevInterval);
      releasePointer(this.prevButton, prevPointerId);
      prevPointerId = null;
    });
    this.prevButton.addEventListener('pointercancel', (event) => {
      if (prevPointerId !== null && event.pointerId !== prevPointerId) return;
      if (prevInterval) clearInterval(prevInterval);
      releasePointer(this.prevButton, prevPointerId);
      prevPointerId = null;
    });

    this.nextButton.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      nextPointerId = event.pointerId;
      capturePointer(this.nextButton, event);
      this.selectNextSegment();
      nextInterval = setInterval(() => this.selectNextSegment(), 200);
    });
    this.nextButton.addEventListener('pointerup', (event) => {
      if (nextPointerId !== null && event.pointerId !== nextPointerId) return;
      if (nextInterval) clearInterval(nextInterval);
      releasePointer(this.nextButton, nextPointerId);
      nextPointerId = null;
    });
    this.nextButton.addEventListener('pointercancel', (event) => {
      if (nextPointerId !== null && event.pointerId !== nextPointerId) return;
      if (nextInterval) clearInterval(nextInterval);
      releasePointer(this.nextButton, nextPointerId);
      nextPointerId = null;
    });

    this.allButton.addEventListener('click', () => this.toggleAllNotes(true));
    this.noneButton.addEventListener('click', () => this.toggleAllNotes(false));
  }

  initInfoDisplayButtons() {
    this.infoDisplayButtons = {
      selected: document.getElementById('info-display-selected-button'),
      active: document.getElementById('info-display-active-button'),
      all: document.getElementById('info-display-all-button')
    };

    Object.entries(this.infoDisplayButtons).forEach(([mode, button]) => {
      if (!button) return;
      button.addEventListener('click', () => {
        this.setInfoDisplayMode(mode);
      });
    });

    this.syncInfoDisplayButtons();
  }

  setInfoDisplayMode(mode) {
    if (mode !== 'selected' && mode !== 'active' && mode !== 'all') return;
    this.displayMode = mode;
    localStorage.setItem('bpm_circle.info_display', this.displayMode);
    this.syncInfoDisplayButtons();
    this.updateInfoDisplay();
  }

  syncInfoDisplayButtons() {
    if (!this.infoDisplayButtons) return;
    Object.entries(this.infoDisplayButtons).forEach(([mode, button]) => {
      if (!button) return;
      button.classList.toggle('button-on', mode === this.displayMode);
    });
  }

  updateInfoDisplay() {
    const bpm = parseInt(this.bpmInput.value) || this.DEFAULT_BPM;
    const quarterNoteMs = 60000 / bpm;
    const wholeBeatMs = quarterNoteMs * 4;
    
    let infoText = '';

    const formatNoteInfo = (division, index, group) => {
      const noteValue = `1/${division}`;
      const beatNumber = index + 1;
      const beatMs = wholeBeatMs * (index / group.count);
      const noteDuration = wholeBeatMs / group.count;
      return `Note value: ${noteValue}. Beat number: ${beatNumber}. Position: ${beatMs.toFixed(3)} ms. Duration: ${noteDuration.toFixed(3)} ms.\n`;
    };

    switch (this.displayMode) {
      case 'selected':
        if (this.selectedSegmentInfo) {
          const { division, index, group } = this.selectedSegmentInfo;
          infoText = `BPM: ${bpm}. ${formatNoteInfo(division, index, group)}`;
        }
        break;

      case 'active':
        infoText = `BPM: ${bpm}.\n`;
        Object.entries(this.soundStates).forEach(([division, enabled]) => {
          if (enabled) {
            for (let i = 0; i < this.noteGroups[division].count; i++) {
              infoText += formatNoteInfo(division, i, this.noteGroups[division]);
            }
          }
        });
        break;

      case 'all':
        infoText = `BPM: ${bpm}.\n`;
        Object.entries(this.noteGroups).forEach(([division, group]) => {
          for (let i = 0; i < group.count; i++) {
            infoText += formatNoteInfo(division, i, group);
          }
        });
        break;
    }

    this.infoText.value = infoText.trim();
  }

  selectPrevSegment() {
    const currentSegment = document.querySelector('.segment.selected');
    let targetSegment;
    
    if (!currentSegment) {
      targetSegment = document.querySelector('.note-4 .segment[data-beat="3"]');
    } else {
      const allSegments = Array.from(document.querySelectorAll('.segment'));
      const currentIndex = allSegments.indexOf(currentSegment);
      targetSegment = allSegments[currentIndex - 1] || allSegments[allSegments.length - 1];
    }
    
    if (targetSegment) {
      document.querySelectorAll('.segment, .linear-segment').forEach(s => s.classList.remove('selected'));
      targetSegment.classList.add('selected');
      
      const division = targetSegment.closest('[class*="note-"]').classList[0].split('-')[1];
      const beat = targetSegment.dataset.beat;
      const linearSegment = document.querySelector(`.linear-note-${division} .linear-segment[data-beat="${beat}"]`);
      if (linearSegment) linearSegment.classList.add('selected');
      
      this.selectedSegmentInfo = {
        division,
        index: parseInt(beat),
        group: this.noteGroups[division],
        updateInfo: () => {
          this.updateInfoDisplay();
        }
      };
      localStorage.setItem('bpm_circle.selected_segment', JSON.stringify({ division, index: parseInt(beat) }));
      this.selectedSegmentInfo.updateInfo();
    }
  }

  selectNextSegment() {
    const currentSegment = document.querySelector('.segment.selected');
    let targetSegment;
    
    if (!currentSegment) {
      targetSegment = document.querySelector('.note-4 .segment[data-beat="0"]');
    } else {
      const allSegments = Array.from(document.querySelectorAll('.segment'));
      const currentIndex = allSegments.indexOf(currentSegment);
      targetSegment = allSegments[currentIndex + 1] || allSegments[0];
    }
    
    if (targetSegment) {
      document.querySelectorAll('.segment, .linear-segment').forEach(s => s.classList.remove('selected'));
      targetSegment.classList.add('selected');
      
      const division = targetSegment.closest('[class*="note-"]').classList[0].split('-')[1];
      const beat = targetSegment.dataset.beat;
      const linearSegment = document.querySelector(`.linear-note-${division} .linear-segment[data-beat="${beat}"]`);
      if (linearSegment) linearSegment.classList.add('selected');
      
      this.selectedSegmentInfo = {
        division,
        index: parseInt(beat),
        group: this.noteGroups[division],
        updateInfo: () => {
          this.updateInfoDisplay();
        }
      };
      localStorage.setItem('bpm_circle.selected_segment', JSON.stringify({ division, index: parseInt(beat) }));
      this.selectedSegmentInfo.updateInfo();
    }
  }

  toggleAllNotes(enable) {
    Object.keys(this.soundStates).forEach(division => {
      if (this.soundStates[division] !== enable) {
        this.soundStates[division] = enable;
        const button = document.querySelector(`.sound-button.note-${division}`);
        if (button) button.classList.toggle('button-on', enable);
        
        const noteGroup = document.querySelector(`.note-${division}`);
        const linearNoteGroup = document.querySelector(`.linear-note-${division}`);
        noteGroup.setAttribute('data-sound-enabled', enable);
        linearNoteGroup.setAttribute('data-sound-enabled', enable);
        
        localStorage.setItem(`sound-${division}`, enable);
      }
    });

    if (enable && !this.audioContext) {
      this.initAudio();
    }
    
    if (this.displayMode === 'active' || this.displayMode === 'all') {
      this.updateInfoDisplay();
    }
  }

  initTempoControls() {
    const slider = this.tempoSlider;
    const downButton = this.tempoDecreaseButton;
    const upButton = this.tempoIncreaseButton;

    slider.value = this.bpmInput.value;

    slider.addEventListener('input', () => {
      this.bpmInput.value = slider.value;
      this.updateBPM();
    });

    let downInterval;
    let downPointerId = null;
    let upPointerId = null;

    const capturePointer = (button, event) => {
      if (typeof button.setPointerCapture !== 'function') return;
      try {
        button.setPointerCapture(event.pointerId);
      } catch (_) {}
    };

    const releasePointer = (button, pointerId) => {
      if (pointerId === null || typeof button.releasePointerCapture !== 'function') return;
      try {
        button.releasePointerCapture(pointerId);
      } catch (_) {}
    };

    const startTempoDown = () => {
      const currentValue = parseInt(this.bpmInput.value);
      if (currentValue > 1) {
        this.bpmInput.value = currentValue - 1;
        slider.value = this.bpmInput.value;
        this.updateBPM();
      }
    };
    
    downButton.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      downPointerId = event.pointerId;
      capturePointer(downButton, event);
      startTempoDown();
      downInterval = setInterval(startTempoDown, 100);
    });
    
    downButton.addEventListener('pointerup', (event) => {
      if (downPointerId !== null && event.pointerId !== downPointerId) return;
      clearInterval(downInterval);
      releasePointer(downButton, downPointerId);
      downPointerId = null;
    });

    let upInterval;
    const startTempoUp = () => {
      const currentValue = parseInt(this.bpmInput.value);
      if (currentValue < 300) {
        this.bpmInput.value = currentValue + 1;
        slider.value = this.bpmInput.value;
        this.updateBPM();
      }
    };
    
    upButton.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      upPointerId = event.pointerId;
      capturePointer(upButton, event);
      startTempoUp();
      upInterval = setInterval(startTempoUp, 100);
    });
    
    upButton.addEventListener('pointerup', (event) => {
      if (upPointerId !== null && event.pointerId !== upPointerId) return;
      clearInterval(upInterval);
      releasePointer(upButton, upPointerId);
      upPointerId = null;
    });
    downButton.addEventListener('pointercancel', (event) => {
      if (downPointerId !== null && event.pointerId !== downPointerId) return;
      clearInterval(downInterval);
      releasePointer(downButton, downPointerId);
      downPointerId = null;
    });
    upButton.addEventListener('pointercancel', (event) => {
      if (upPointerId !== null && event.pointerId !== upPointerId) return;
      clearInterval(upInterval);
      releasePointer(upButton, upPointerId);
      upPointerId = null;
    });
  }
}

// END OF FILE
