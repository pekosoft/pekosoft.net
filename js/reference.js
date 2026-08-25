// Pekosoft Reference
// pekosoft.net/js/reference.js

const modeButtons = {
  bpm: document.getElementById('table-bpm-button'),
  notes: document.getElementById('table-notes-button'),
  scales: document.getElementById('table-scales-button'),
  chords: document.getElementById('table-chords-button')
};

const resetButton = document.getElementById('reset-button');

const columnButtons = [
  document.getElementById('toggle-col-1-button'),
  document.getElementById('toggle-col-2-button'),
  document.getElementById('toggle-col-3-button'),
  document.getElementById('toggle-col-4-button'),
  document.getElementById('toggle-col-5-button'),
  document.getElementById('toggle-col-6-button'),
  document.getElementById('toggle-col-7-button'),
  document.getElementById('toggle-col-8-button'),
  document.getElementById('toggle-col-9-button'),
  document.getElementById('toggle-col-10-button')
];

const columnButtonLabels = [
  document.getElementById('toggle-col-1-text'),
  document.getElementById('toggle-col-2-text'),
  document.getElementById('toggle-col-3-text'),
  document.getElementById('toggle-col-4-text'),
  document.getElementById('toggle-col-5-text'),
  document.getElementById('toggle-col-6-text'),
  document.getElementById('toggle-col-7-text'),
  document.getElementById('toggle-col-8-text'),
  document.getElementById('toggle-col-9-text'),
  document.getElementById('toggle-col-10-text')
];

const headerRow = document.getElementById('header-row');
const resultTable = document.getElementById('resultTable');
const resultTableElement = resultTable.closest('table');
const cardsView = document.getElementById('cards-view');
const tableScrollContainer = document.querySelector('#tool-container .standard.scrollable');
const viewToggleButton = document.getElementById('toggle-view-button');
const viewToggleText = document.getElementById('toggle-view-text');
const sortToggleButton = document.getElementById('toggle-sort-button');
const sortToggleText = document.getElementById('toggle-sort-text');

const STORAGE = {
  mode: 'reference.mode',
  visibility: 'reference.column_visibility',
  view: 'reference.view',
  sort: 'reference.sort'
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const state = {
  activeMode: 'bpm',
  view: 'table',
  sort: 'asc',
  visibility: {
    bpm: [true, true, true, true, true, true, true, true, true, true],
    notes: [true, true, true, true, true, true],
    scales: [true, true, true, true, true, true],
    chords: [true, true, true, true, true, true]
  }
};

let referenceAudioContext = null;
let referenceOutputGainNode = null;
const playbackState = {
  timeoutIds: [],
  sustainedVoices: [],
  transientVoices: [],
  activePlayButton: null
};

function getReferenceAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!referenceAudioContext) {
    referenceAudioContext = new AudioContextClass();
    referenceOutputGainNode = referenceAudioContext.createGain();
    referenceOutputGainNode.connect(referenceAudioContext.destination);
    window.addEventListener('pekosoft:global-sound-change', updateReferenceOutputGain);
  }

  updateReferenceOutputGain();

  if (referenceAudioContext.state === 'suspended') {
    referenceAudioContext.resume().catch(() => {
      // ignore resume races on repeated clicks
    });
  }

  return referenceAudioContext;
}

function updateReferenceOutputGain() {
  if (!referenceOutputGainNode || !referenceAudioContext) return;
  const now = referenceAudioContext.currentTime;
  referenceOutputGainNode.gain.cancelScheduledValues(now);
  referenceOutputGainNode.gain.setValueAtTime(localStorage.getItem('global.sound') !== 'false' ? 1 : 0, now);
}

function buildPlayButtonHtml(modeKey, payload = {}) {
  const attrs = Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `data-play-${key}="${String(value)}"`)
    .join(' ');

  return `<button class="square icon-only reference-play-button" title="Play" data-play-mode="${modeKey}" ${attrs} aria-label="Play"><svg class="icons icons-small"><use href="/icons.svg#play" /></svg></button>`;
}

function buildPlayCell(modeKey, payload = {}) {
  return {
    html: buildPlayButtonHtml(modeKey, payload),
    className: 'center',
    playMode: modeKey,
    playPayload: payload
  };
}

function createPlayButtonElement(modeKey, payload = {}, extraClass = '') {
  const button = document.createElement('button');
  button.className = `square icon-only reference-play-button ${extraClass}`.trim();
  button.title = 'Play';
  button.setAttribute('aria-label', 'Play');
  button.setAttribute('aria-pressed', 'false');
  button.dataset.playMode = modeKey;

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    button.dataset[`play${key[0].toUpperCase()}${key.slice(1)}`] = String(value);
  });

  button.innerHTML = '<svg class="icons icons-small"><use href="/icons.svg#play" /></svg>';
  return button;
}

function setActivePlayButton(buttonElement) {
  if (playbackState.activePlayButton) {
    playbackState.activePlayButton.classList.remove('button-on');
    playbackState.activePlayButton.setAttribute('aria-pressed', 'false');
  }

  playbackState.activePlayButton = buttonElement || null;

  if (!playbackState.activePlayButton) return;
  playbackState.activePlayButton.classList.add('button-on');
  playbackState.activePlayButton.setAttribute('aria-pressed', 'true');
}

function clearPlaybackState() {
  playbackState.timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  playbackState.timeoutIds = [];

  playbackState.transientVoices.forEach((voice) => {
    if (!voice || !voice.stopNode) return;
    try {
      voice.stopNode.stop();
    } catch {
      // ignore stop races on already-stopped nodes
    }
  });
  playbackState.transientVoices = [];

  if (!referenceAudioContext) {
    playbackState.sustainedVoices = [];
    return;
  }

  playbackState.sustainedVoices.forEach((voice) => {
    if (typeof window.releaseSustainedToneVoice !== 'function') return;
    window.releaseSustainedToneVoice({
      audioContext: referenceAudioContext,
      voice,
      releaseSec: 0.05
    });
  });

  playbackState.sustainedVoices = [];
  setActivePlayButton(null);
}

function scheduleTransientSequence(audioContext, steps) {
  const now = audioContext.currentTime;
  let maxEndSec = 0;

  steps.forEach((step) => {
    if (typeof window.playTransientSound !== 'function') return;

    const voice = window.playTransientSound({
      audioContext,
      tone: step.tone || 'click',
      when: now + Math.max(step.offsetSec || 0, 0),
      gain: step.gain ?? 0.22,
      pitchRatio: step.pitchRatio ?? 1,
      durationSec: step.durationSec ?? 0.12,
      baseFrequencyHz: step.baseFrequencyHz ?? 220,
      destinationNode: referenceOutputGainNode
    });

    if (voice) {
      playbackState.transientVoices.push(voice);
    }

    const endSec = Math.max(step.offsetSec || 0, 0) + (step.durationSec ?? 0.12);
    if (endSec > maxEndSec) maxEndSec = endSec;
  });

  return maxEndSec;
}

function playBpmTempo(audioContext, bpmValue) {
  const bpm = Number.isFinite(bpmValue) && bpmValue > 0 ? bpmValue : 120;
  const beatSec = 60 / bpm;
  const beats = 8;
  const steps = [];

  for (let i = 0; i < beats; i++) {
    steps.push({
      offsetSec: i * beatSec,
      tone: i % 4 === 0 ? 'kick' : 'click',
      gain: i % 4 === 0 ? 0.34 : 0.24,
      durationSec: i % 4 === 0 ? 0.08 : 0.04,
      pitchRatio: 1
    });
  }

  return scheduleTransientSequence(audioContext, steps);
}

function playNoteTone(audioContext, hzValue) {
  const frequency = Number.isFinite(hzValue) && hzValue > 0 ? hzValue : 440;

  if (typeof window.createSustainedToneVoice !== 'function' || typeof window.releaseSustainedToneVoice !== 'function') {
    return scheduleTransientSequence(audioContext, [{ tone: 'piano', gain: 0.3, pitchRatio: frequency / 440, durationSec: 0.45, baseFrequencyHz: 440 }]);
  }

  const voice = window.createSustainedToneVoice({
    audioContext,
    tone: 'sine',
    frequency,
    standardGain: 0.2,
    destinationNode: referenceOutputGainNode
  });

  if (!voice) return;

  playbackState.sustainedVoices.push(voice);
  const timeoutId = window.setTimeout(() => {
    window.releaseSustainedToneVoice({
      audioContext,
      voice,
      releaseSec: 0.12
    });
    playbackState.sustainedVoices = playbackState.sustainedVoices.filter((item) => item !== voice);
  }, 650);
  playbackState.timeoutIds.push(timeoutId);
  return 0.65;
}

function parseDashSeparatedNumbers(value) {
  return String(value || '')
    .split('-')
    .map((part) => Number(part.trim()))
    .filter((num) => Number.isFinite(num));
}

function playScalePattern(audioContext, intervalsText) {
  const intervals = parseDashSeparatedNumbers(intervalsText);
  if (!intervals.length) return;

  const semitoneOffsets = [0];
  let sum = 0;
  intervals.forEach((step) => {
    sum += step;
    semitoneOffsets.push(sum);
  });

  const tonicHz = 261.6256;
  const noteStepSec = 0.15;
  const steps = semitoneOffsets.map((semi, index) => ({
    offsetSec: index * noteStepSec,
    tone: 'piano',
    gain: 0.24,
    pitchRatio: Math.pow(2, semi / 12),
    durationSec: 0.14,
    baseFrequencyHz: tonicHz
  }));

  return scheduleTransientSequence(audioContext, steps);
}

function playChordPattern(audioContext, semitonesText) {
  const semitoneOffsets = parseDashSeparatedNumbers(semitonesText);
  if (!semitoneOffsets.length) return;

  const rootHz = 261.6256;
  const steps = semitoneOffsets.map((semi) => ({
    offsetSec: 0,
    tone: 'piano',
    gain: 0.2,
    pitchRatio: Math.pow(2, semi / 12),
    durationSec: 0.48,
    baseFrequencyHz: rootHz
  }));

  return scheduleTransientSequence(audioContext, steps);
}

function schedulePlaybackFinish(clearAfterSec, playButton) {
  const durationMs = Math.max(120, Math.ceil(clearAfterSec * 1000) + 80);
  const timeoutId = window.setTimeout(() => {
    if (playbackState.activePlayButton === playButton) {
      setActivePlayButton(null);
    }
  }, durationMs);
  playbackState.timeoutIds.push(timeoutId);
}

function playReferencePreviewSound(buttonElement) {
  if (!buttonElement) return;

  const audioContext = getReferenceAudioContext();
  if (!audioContext) return;

  if (playbackState.activePlayButton === buttonElement) {
    clearPlaybackState();
    return;
  }

  clearPlaybackState();
  setActivePlayButton(buttonElement);

  const modeKey = buttonElement.dataset.playMode || state.activeMode;
  let playbackSec = 0.12;

  if (modeKey === 'bpm') {
    playbackSec = playBpmTempo(audioContext, parseFloat(buttonElement.dataset.playBpm || '120'));
    schedulePlaybackFinish(playbackSec, buttonElement);
    return;
  }

  if (modeKey === 'notes') {
    playbackSec = playNoteTone(audioContext, parseFloat(buttonElement.dataset.playHz || '440'));
    schedulePlaybackFinish(playbackSec, buttonElement);
    return;
  }

  if (modeKey === 'scales') {
    playbackSec = playScalePattern(audioContext, buttonElement.dataset.playIntervals || '2-2-1-2-2-2-1');
    schedulePlaybackFinish(playbackSec, buttonElement);
    return;
  }

  if (modeKey === 'chords') {
    playbackSec = playChordPattern(audioContext, buttonElement.dataset.playSemitones || '0-4-7');
    schedulePlaybackFinish(playbackSec, buttonElement);
  }
}

function isOdd(num) {
  return num % 2 !== 0 ? 'Odd' : 'Even';
}

function getWikiLink(num) {
  if (num >= 1 && num <= 10) return `https://en.wikipedia.org/wiki/${num}`;
  return `https://en.wikipedia.org/wiki/${num}_(number)`;
}

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToNoteName(midi) {
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function getScaleWikiLink(scaleName) {
  const links = {
    'Major (Ionian)': 'https://en.wikipedia.org/wiki/Major_scale',
    'Natural Minor (Aeolian)': 'https://en.wikipedia.org/wiki/Minor_scale',
    'Harmonic Minor': 'https://en.wikipedia.org/wiki/Harmonic_minor_scale',
    'Melodic Minor': 'https://en.wikipedia.org/wiki/Melodic_minor_scale',
    Dorian: 'https://en.wikipedia.org/wiki/Dorian_mode',
    Phrygian: 'https://en.wikipedia.org/wiki/Phrygian_mode',
    Lydian: 'https://en.wikipedia.org/wiki/Lydian_mode',
    Mixolydian: 'https://en.wikipedia.org/wiki/Mixolydian_mode',
    Locrian: 'https://en.wikipedia.org/wiki/Locrian_mode',
    'Major Pentatonic': 'https://en.wikipedia.org/wiki/Pentatonic_scale',
    'Minor Pentatonic': 'https://en.wikipedia.org/wiki/Pentatonic_scale',
    Blues: 'https://en.wikipedia.org/wiki/Blues_scale',
    'Whole Tone': 'https://en.wikipedia.org/wiki/Whole_tone_scale',
    Chromatic: 'https://en.wikipedia.org/wiki/Chromatic_scale'
  };

  return links[scaleName] || null;
}

function makeBpmRows() {
  const formatter1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const formatter3 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3, minimumFractionDigits: 3 });
  const words = [
    'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
    'Twenty-one', 'Twenty-two', 'Twenty-three', 'Twenty-four', 'Twenty-five', 'Twenty-six', 'Twenty-seven', 'Twenty-eight', 'Twenty-nine', 'Thirty',
    'Thirty-one', 'Thirty-two', 'Thirty-three', 'Thirty-four', 'Thirty-five', 'Thirty-six', 'Thirty-seven', 'Thirty-eight', 'Thirty-nine', 'Forty',
    'Forty-one', 'Forty-two', 'Forty-three', 'Forty-four', 'Forty-five', 'Forty-six', 'Forty-seven', 'Forty-eight', 'Forty-nine', 'Fifty',
    'Fifty-one', 'Fifty-two', 'Fifty-three', 'Fifty-four', 'Fifty-five', 'Fifty-six', 'Fifty-seven', 'Fifty-eight', 'Fifty-nine', 'Sixty',
    'Sixty-one', 'Sixty-two', 'Sixty-three', 'Sixty-four', 'Sixty-five', 'Sixty-six', 'Sixty-seven', 'Sixty-eight', 'Sixty-nine', 'Seventy',
    'Seventy-one', 'Seventy-two', 'Seventy-three', 'Seventy-four', 'Seventy-five', 'Seventy-six', 'Seventy-seven', 'Seventy-eight', 'Seventy-nine', 'Eighty',
    'Eighty-one', 'Eighty-two', 'Eighty-three', 'Eighty-four', 'Eighty-five', 'Eighty-six', 'Eighty-seven', 'Eighty-eight', 'Eighty-nine', 'Ninety',
    'Ninety-one', 'Ninety-two', 'Ninety-three', 'Ninety-four', 'Ninety-five', 'Ninety-six', 'Ninety-seven', 'Ninety-eight', 'Ninety-nine', 'One hundred',
    'One hundred one', 'One hundred two', 'One hundred three', 'One hundred four', 'One hundred five', 'One hundred six', 'One hundred seven', 'One hundred eight', 'One hundred nine', 'One hundred ten',
    'One hundred eleven', 'One hundred twelve', 'One hundred thirteen', 'One hundred fourteen', 'One hundred fifteen', 'One hundred sixteen', 'One hundred seventeen', 'One hundred eighteen', 'One hundred nineteen', 'One hundred twenty',
    'One hundred twenty-one', 'One hundred twenty-two', 'One hundred twenty-three', 'One hundred twenty-four', 'One hundred twenty-five', 'One hundred twenty-six', 'One hundred twenty-seven', 'One hundred twenty-eight', 'One hundred twenty-nine', 'One hundred thirty',
    'One hundred thirty-one', 'One hundred thirty-two', 'One hundred thirty-three', 'One hundred thirty-four', 'One hundred thirty-five', 'One hundred thirty-six', 'One hundred thirty-seven', 'One hundred thirty-eight', 'One hundred thirty-nine', 'One hundred forty',
    'One hundred forty-one', 'One hundred forty-two', 'One hundred forty-three', 'One hundred forty-four', 'One hundred forty-five', 'One hundred forty-six', 'One hundred forty-seven', 'One hundred forty-eight', 'One hundred forty-nine', 'One hundred fifty',
    'One hundred fifty-one', 'One hundred fifty-two', 'One hundred fifty-three', 'One hundred fifty-four', 'One hundred fifty-five', 'One hundred fifty-six', 'One hundred fifty-seven', 'One hundred fifty-eight', 'One hundred fifty-nine', 'One hundred sixty',
    'One hundred sixty-one', 'One hundred sixty-two', 'One hundred sixty-three', 'One hundred sixty-four', 'One hundred sixty-five', 'One hundred sixty-six', 'One hundred sixty-seven', 'One hundred sixty-eight', 'One hundred sixty-nine', 'One hundred seventy',
    'One hundred seventy-one', 'One hundred seventy-two', 'One hundred seventy-three', 'One hundred seventy-four', 'One hundred seventy-five', 'One hundred seventy-six', 'One hundred seventy-seven', 'One hundred seventy-eight', 'One hundred seventy-nine', 'One hundred eighty',
    'One hundred eighty-one', 'One hundred eighty-two', 'One hundred eighty-three', 'One hundred eighty-four', 'One hundred eighty-five', 'One hundred eighty-six', 'One hundred eighty-seven', 'One hundred eighty-eight', 'One hundred eighty-nine', 'One hundred ninety',
    'One hundred ninety-one', 'One hundred ninety-two', 'One hundred ninety-three', 'One hundred ninety-four', 'One hundred ninety-five', 'One hundred ninety-six', 'One hundred ninety-seven', 'One hundred ninety-eight', 'One hundred ninety-nine', 'Two hundred',
    'Two hundred one', 'Two hundred two', 'Two hundred three', 'Two hundred four', 'Two hundred five', 'Two hundred six', 'Two hundred seven', 'Two hundred eight', 'Two hundred nine', 'Two hundred ten',
    'Two hundred eleven', 'Two hundred twelve', 'Two hundred thirteen', 'Two hundred fourteen', 'Two hundred fifteen', 'Two hundred sixteen', 'Two hundred seventeen', 'Two hundred eighteen', 'Two hundred nineteen', 'Two hundred twenty',
    'Two hundred twenty-one', 'Two hundred twenty-two', 'Two hundred twenty-three', 'Two hundred twenty-four', 'Two hundred twenty-five', 'Two hundred twenty-six', 'Two hundred twenty-seven', 'Two hundred twenty-eight', 'Two hundred twenty-nine', 'Two hundred thirty',
    'Two hundred thirty-one', 'Two hundred thirty-two', 'Two hundred thirty-three', 'Two hundred thirty-four', 'Two hundred thirty-five', 'Two hundred thirty-six', 'Two hundred thirty-seven', 'Two hundred thirty-eight', 'Two hundred thirty-nine', 'Two hundred forty',
    'Two hundred forty-one', 'Two hundred forty-two', 'Two hundred forty-three', 'Two hundred forty-four', 'Two hundred forty-five', 'Two hundred forty-six', 'Two hundred forty-seven', 'Two hundred forty-eight', 'Two hundred forty-nine', 'Two hundred fifty',
    'Two hundred fifty-one', 'Two hundred fifty-two', 'Two hundred fifty-three', 'Two hundred fifty-four', 'Two hundred fifty-five', 'Two hundred fifty-six', 'Two hundred fifty-seven', 'Two hundred fifty-eight', 'Two hundred fifty-nine', 'Two hundred sixty',
    'Two hundred sixty-one', 'Two hundred sixty-two', 'Two hundred sixty-three', 'Two hundred sixty-four', 'Two hundred sixty-five', 'Two hundred sixty-six', 'Two hundred sixty-seven', 'Two hundred sixty-eight', 'Two hundred sixty-nine', 'Two hundred seventy',
    'Two hundred seventy-one', 'Two hundred seventy-two', 'Two hundred seventy-three', 'Two hundred seventy-four', 'Two hundred seventy-five', 'Two hundred seventy-six', 'Two hundred seventy-seven', 'Two hundred seventy-eight', 'Two hundred seventy-nine', 'Two hundred eighty',
    'Two hundred eighty-one', 'Two hundred eighty-two', 'Two hundred eighty-three', 'Two hundred eighty-four', 'Two hundred eighty-five', 'Two hundred eighty-six', 'Two hundred eighty-seven', 'Two hundred eighty-eight', 'Two hundred eighty-nine', 'Two hundred ninety',
    'Two hundred ninety-one', 'Two hundred ninety-two', 'Two hundred ninety-three', 'Two hundred ninety-four', 'Two hundred ninety-five', 'Two hundred ninety-six', 'Two hundred ninety-seven', 'Two hundred ninety-eight', 'Two hundred ninety-nine', 'Three hundred'
  ];

  return Array.from({ length: 300 }, (_, i) => {
    const bpm = i + 1;
    return [
      { text: String(bpm), html: `<a href="${getWikiLink(bpm)}" target="wiki">${bpm}</a>`, className: 'right' },
      { text: words[i], className: 'left' },
      { text: isOdd(bpm), className: 'left' },
      { text: formatter1.format(bpm / 2), className: 'right' },
      { text: formatter1.format(bpm * 2), className: 'right' },
      { text: formatter1.format(bpm * 1.5), className: 'right' },
      { text: formatter1.format(bpm * (2 / 3)), className: 'right' },
      { text: formatter3.format(60 / bpm), className: 'right' },
      { text: formatter3.format(bpm / 60), className: 'right' },
      buildPlayCell('bpm', { bpm })
    ];
  });
}

function makeNotesRows() {
  const speedOfSoundCmPerSec = 34300;
  const rows = [];

  for (let midi = 21; midi <= 108; midi++) {
    const hz = midiToFrequency(midi);
    const wavelengthCm = speedOfSoundCmPerSec / hz;
    const pianoKey = midi - 20;

    rows.push([
      { text: midiToNoteName(midi), className: 'left' },
      { text: String(midi), className: 'right' },
      { text: hz.toFixed(3), className: 'right' },
      { text: wavelengthCm.toFixed(3), className: 'right' },
      { text: String(pianoKey), className: 'right' },
      buildPlayCell('notes', { hz: hz.toFixed(3) })
    ]);
  }

  return rows;
}

function makeScalesRows() {
  return [
    ['Major (Ionian)', '2-2-1-2-2-2-1', '1 2 3 4 5 6 7', 'C D E F G A B', '7'],
    ['Natural Minor (Aeolian)', '2-1-2-2-1-2-2', '1 2 b3 4 5 b6 b7', 'C D Eb F G Ab Bb', '7'],
    ['Harmonic Minor', '2-1-2-2-1-3-1', '1 2 b3 4 5 b6 7', 'C D Eb F G Ab B', '7'],
    ['Melodic Minor', '2-1-2-2-2-2-1', '1 2 b3 4 5 6 7', 'C D Eb F G A B', '7'],
    ['Dorian', '2-1-2-2-2-1-2', '1 2 b3 4 5 6 b7', 'C D Eb F G A Bb', '7'],
    ['Phrygian', '1-2-2-2-1-2-2', '1 b2 b3 4 5 b6 b7', 'C Db Eb F G Ab Bb', '7'],
    ['Lydian', '2-2-2-1-2-2-1', '1 2 3 #4 5 6 7', 'C D E F# G A B', '7'],
    ['Mixolydian', '2-2-1-2-2-1-2', '1 2 3 4 5 6 b7', 'C D E F G A Bb', '7'],
    ['Locrian', '1-2-2-1-2-2-2', '1 b2 b3 4 b5 b6 b7', 'C Db Eb F Gb Ab Bb', '7'],
    ['Major Pentatonic', '2-2-3-2-3', '1 2 3 5 6', 'C D E G A', '5'],
    ['Minor Pentatonic', '3-2-2-3-2', '1 b3 4 5 b7', 'C Eb F G Bb', '5'],
    ['Blues', '3-2-1-1-3-2', '1 b3 4 b5 5 b7', 'C Eb F Gb G Bb', '6'],
    ['Whole Tone', '2-2-2-2-2-2', '1 2 3 #4 #5 b7', 'C D E F# G# A#', '6'],
    ['Chromatic', '1-1-1-1-1-1-1-1-1-1-1-1', '1 b2 2 b3 3 4 #4 5 b6 6 b7 7', 'C C# D D# E F F# G G# A A# B', '12']
  ].map((row) => {
    const scaleName = row[0];
    const wikiLink = getScaleWikiLink(scaleName);
    const mapped = row.map((value, index) => {
      if (index !== 0) {
        return { text: value, className: 'right' };
      }

      if (!wikiLink) {
        return { text: value, className: 'left' };
      }

      return {
        text: value,
        html: `<a href="${wikiLink}" target="wiki">${value}</a>`,
        className: 'left'
      };
    });

    mapped.push(buildPlayCell('scales', { intervals: row[1] }));
    return mapped;
  });
}

function makeChordsRows() {
  return [
    ['Major', '1 3 5', '0-4-7', 'C E G', '3'],
    ['Minor', '1 b3 5', '0-3-7', 'C Eb G', '3'],
    ['Diminished', '1 b3 b5', '0-3-6', 'C Eb Gb', '3'],
    ['Augmented', '1 3 #5', '0-4-8', 'C E G#', '3'],
    ['Sus2', '1 2 5', '0-2-7', 'C D G', '3'],
    ['Sus4', '1 4 5', '0-5-7', 'C F G', '3'],
    ['Major 7', '1 3 5 7', '0-4-7-11', 'C E G B', '4'],
    ['Dominant 7', '1 3 5 b7', '0-4-7-10', 'C E G Bb', '4'],
    ['Minor 7', '1 b3 5 b7', '0-3-7-10', 'C Eb G Bb', '4'],
    ['Half-diminished 7', '1 b3 b5 b7', '0-3-6-10', 'C Eb Gb Bb', '4'],
    ['Diminished 7', '1 b3 b5 bb7', '0-3-6-9', 'C Eb Gb A', '4'],
    ['Minor Major 7', '1 b3 5 7', '0-3-7-11', 'C Eb G B', '4'],
    ['Add9', '1 3 5 9', '0-4-7-14', 'C E G D', '4'],
    ['Major 9', '1 3 5 7 9', '0-4-7-11-14', 'C E G B D', '5'],
    ['Minor 9', '1 b3 5 b7 9', '0-3-7-10-14', 'C Eb G Bb D', '5']
  ].map((row) => {
    const mapped = row.map((value, index) => ({ text: value, className: index === 0 ? 'left' : 'right' }));
    mapped.push(buildPlayCell('chords', { semitones: row[2] }));
    return mapped;
  });
}

const TABLES = {
  bpm: {
    columns: ['BPM', 'WRITING', 'PARITY', 'HALF', 'DOUBLE', 'TRIPLET', 'DOTTED', 'SPB', 'BPS', 'PLAY'],
    aligns: ['right', 'left', 'left', 'right', 'right', 'right', 'right', 'right', 'right', 'center'],
    rows: makeBpmRows()
  },
  notes: {
    columns: ['NOTE', 'MIDI', 'HZ', 'WAVE CM', 'PIANO KEY', 'PLAY'],
    aligns: ['left', 'right', 'right', 'right', 'right', 'center'],
    rows: makeNotesRows()
  },
  scales: {
    columns: ['SCALE', 'INTERVALS', 'DEGREES', 'C EXAMPLE', 'COUNT', 'PLAY'],
    aligns: ['left', 'left', 'left', 'left', 'right', 'center'],
    rows: makeScalesRows()
  },
  chords: {
    columns: ['CHORD', 'FORMULA', 'SEMITONES', 'C EXAMPLE', 'NOTES', 'PLAY'],
    aligns: ['left', 'left', 'left', 'left', 'right', 'center'],
    rows: makeChordsRows()
  }
};

function loadSettings() {
  const savedMode = localStorage.getItem(STORAGE.mode);
  if (savedMode && TABLES[savedMode]) {
    state.activeMode = savedMode;
  }

  const savedView = localStorage.getItem(STORAGE.view);
  if (savedView === 'table' || savedView === 'cards') {
    state.view = savedView;
  }

  const savedSort = localStorage.getItem(STORAGE.sort);
  if (savedSort === 'asc' || savedSort === 'desc') {
    state.sort = savedSort;
  }

  const savedVisibilityRaw = localStorage.getItem(STORAGE.visibility);
  if (!savedVisibilityRaw) return;

  try {
    const savedVisibility = JSON.parse(savedVisibilityRaw);
    Object.keys(TABLES).forEach((modeKey) => {
      if (!Array.isArray(savedVisibility[modeKey])) return;
      state.visibility[modeKey] = TABLES[modeKey].columns.map((_, index) => {
        const value = savedVisibility[modeKey][index];
        return value !== false;
      });
    });
  } catch (error) {
    // ignore corrupted storage
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE.mode, state.activeMode);
  localStorage.setItem(STORAGE.visibility, JSON.stringify(state.visibility));
  localStorage.setItem(STORAGE.view, state.view);
  localStorage.setItem(STORAGE.sort, state.sort);
}

function getDefaultVisibility() {
  return Object.fromEntries(
    Object.entries(TABLES).map(([modeKey, table]) => [
      modeKey,
      table.columns.map(() => true)
    ])
  );
}

function resetReference() {
  clearPlaybackState();
  state.activeMode = 'bpm';
  state.view = 'table';
  state.sort = 'asc';
  state.visibility = getDefaultVisibility();
  saveSettings();
  updateModeButtons();
  updateColumnButtons();
  updateViewButton();
  updateSortButton();
  renderView();
}

function updateModeButtons() {
  Object.keys(modeButtons).forEach((modeKey) => {
    modeButtons[modeKey].classList.toggle('button-on', modeKey === state.activeMode);
  });
}

function updateColumnButtons() {
  const columns = TABLES[state.activeMode].columns;
  const visibility = state.visibility[state.activeMode];

  for (let i = 0; i < columnButtons.length; i++) {
    const button = columnButtons[i];
    const label = columnButtonLabels[i];
    const columnLabel = columns[i];

    if (!columnLabel) {
      button.hidden = true;
      continue;
    }

    button.hidden = false;
    label.textContent = columnLabel;
    button.title = `Toggle ${columnLabel} column`;
    button.classList.toggle('button-on', visibility[i] !== false);
    button.setAttribute('aria-pressed', visibility[i] !== false ? 'true' : 'false');
  }
}

function updateViewButton() {
  const isCardsView = state.view === 'cards';
  viewToggleButton.classList.toggle('button-on', isCardsView);
  viewToggleButton.setAttribute('aria-pressed', isCardsView ? 'true' : 'false');
  viewToggleButton.title = isCardsView ? 'VIEW: Switch to standard view' : 'VIEW: Switch to cards view';
  viewToggleText.textContent = 'VIEW';
}

function updateSortButton() {
  const isDescending = state.sort === 'desc';
  sortToggleButton.classList.toggle('button-on', isDescending);
  sortToggleButton.setAttribute('aria-pressed', isDescending ? 'true' : 'false');
  sortToggleButton.title = isDescending ? 'SORT: Descending' : 'SORT: Ascending';
  sortToggleText.textContent = 'SORT';
}

function getOrderedRows(table) {
  const rows = table.rows || [];
  if (state.sort === 'desc') {
    return [...rows].reverse();
  }
  return rows;
}

function renderTable() {
  const table = TABLES[state.activeMode];
  const visibility = state.visibility[state.activeMode];
  const aligns = table.aligns || [];

  headerRow.innerHTML = '';
  resultTable.innerHTML = '';

  table.columns.forEach((columnLabel, index) => {
    if (visibility[index] === false) return;

    const th = document.createElement('th');
    th.textContent = columnLabel;
    th.title = columnLabel;

    if (state.activeMode === 'bpm' && index === 0) {
      th.innerHTML = `${columnLabel} <svg class="icons icons-small reference-external-icon"><use href="/icons.svg#external" /></svg>`;
    }

    headerRow.appendChild(th);
  });

  getOrderedRows(table).forEach((rowCells) => {
    const row = document.createElement('tr');

    rowCells.forEach((cell, index) => {
      if (visibility[index] === false) return;

      const td = document.createElement('td');
      const alignmentClass = aligns[index];
      if (alignmentClass === 'left' || alignmentClass === 'right') {
        td.className = alignmentClass;
      } else if (cell.className) {
        td.className = cell.className;
      }

      if (cell.html) {
        td.innerHTML = cell.html;
      } else {
        td.textContent = cell.text ?? '';
      }

      row.appendChild(td);
    });

    resultTable.appendChild(row);
  });
}

function getCellContent(cell) {
  if (cell.html) return cell.html;
  return cell.text ?? '';
}

function getCardLabel(modeKey, columnLabel) {
  const labels = {
    bpm: {
      WRITING: 'Writing',
      PARITY: 'Parity',
      HALF: 'Half',
      DOUBLE: 'Double',
      TRIPLET: 'Triplet',
      DOTTED: 'Dotted',
      SPB: 'SPB',
      BPS: 'BPS',
      PLAY: 'Play'
    },
    notes: {
      MIDI: 'MIDI',
      HZ: 'Hz',
      'WAVE CM': 'Wave cm',
      'PIANO KEY': 'Piano key',
      PLAY: 'Play'
    },
    scales: {
      INTERVALS: 'Interval',
      DEGREES: 'Degrees',
      'C EXAMPLE': 'C example',
      COUNT: 'Count',
      PLAY: 'Play'
    },
    chords: {
      FORMULA: 'Formula',
      SEMITONES: 'Semitones',
      'C EXAMPLE': 'C example',
      NOTES: 'Notes',
      PLAY: 'Play'
    }
  };

  return labels[modeKey]?.[columnLabel] || columnLabel;
}

function appendBpmCardBody({ card, rowCells, table, visibility, copyLines }) {
  const getIndex = (columnName) => table.columns.indexOf(columnName);
  const getValue = (columnName) => {
    const index = getIndex(columnName);
    if (index === -1 || visibility[index] === false) return null;
    return String(rowCells[index].text ?? '').trim();
  };

  const writingValue = getValue('WRITING');
  if (writingValue) {
    const writingLine = document.createElement('p');
    writingLine.className = 'reference-card-line';
    writingLine.title = 'Writing';
    writingLine.textContent = writingValue;
    card.appendChild(writingLine);
    copyLines.push(writingValue);
  }

  const parityValue = getValue('PARITY');
  if (parityValue) {
    const parityLine = document.createElement('p');
    parityLine.className = 'reference-card-line';
    parityLine.title = 'Parity';
    parityLine.textContent = parityValue;
    card.appendChild(parityLine);
    copyLines.push(parityValue);
  }

  const appendPairLine = (leftName, rightName) => {
    const leftValue = getValue(leftName);
    const rightValue = getValue(rightName);
    if (!leftValue && !rightValue) return;

    const line = document.createElement('p');
    line.className = 'reference-card-line reference-card-bpm-pair';

    if (leftValue) {
      const left = document.createElement('span');
      left.className = 'reference-card-bpm-pair-left';
      left.textContent = `${getCardLabel('bpm', leftName.toUpperCase())}: ${leftValue}`;
      line.appendChild(left);
      copyLines.push(left.textContent);
    }

    if (rightValue) {
      const right = document.createElement('span');
      right.className = 'reference-card-bpm-pair-right';
      right.textContent = `${getCardLabel('bpm', rightName.toUpperCase())}: ${rightValue}`;
      line.appendChild(right);
      copyLines.push(right.textContent);
    }

    card.appendChild(line);
  };

  appendPairLine('HALF', 'DOUBLE');
  appendPairLine('TRIPLET', 'DOTTED');

  const spbValue = getValue('SPB');
  if (spbValue) {
    const spb = document.createElement('span');
    spb.className = 'reference-card-bpm-corner reference-card-bpm-corner-left';
    spb.title = 'SPB';
    spb.textContent = spbValue;
    spb.setAttribute('data-label', 'SPB');
    card.appendChild(spb);
    copyLines.push(`SPB: ${spbValue}`);
  }

  const bpsValue = getValue('BPS');
  if (bpsValue) {
    const bps = document.createElement('span');
    bps.className = 'reference-card-bpm-corner reference-card-bpm-corner-right';
    bps.title = 'BPS';
    bps.textContent = bpsValue;
    bps.setAttribute('data-label', 'BPS');
    card.appendChild(bps);
    copyLines.push(`BPS: ${bpsValue}`);
  }
}

function appendScalesCardBody({ card, rowCells, table, visibility, copyLines }) {
  const getIndex = (columnName) => table.columns.indexOf(columnName);
  const getValue = (columnName) => {
    const index = getIndex(columnName);
    if (index === -1 || visibility[index] === false) return null;
    return String(rowCells[index].text ?? '').trim();
  };

  ['INTERVALS', 'DEGREES', 'C EXAMPLE'].forEach((columnName) => {
    const value = getValue(columnName);
    if (!value) return;

    const line = document.createElement('p');
    line.className = 'reference-card-line';
    line.title = getCardLabel('scales', columnName);
    line.textContent = value;
    card.appendChild(line);
    copyLines.push(value);
  });

  const countValue = getValue('COUNT');
  if (countValue) {
    const count = document.createElement('span');
    count.className = 'reference-card-scales-count';
    count.title = 'Count';
    count.textContent = countValue;
    card.appendChild(count);
    copyLines.push(countValue);
  }
}

function appendNotesCardBody({ card, rowCells, table, visibility, copyLines }) {
  const getIndex = (columnName) => table.columns.indexOf(columnName);
  const getValue = (columnName) => {
    const index = getIndex(columnName);
    if (index === -1 || visibility[index] === false) return null;
    return String(rowCells[index].text ?? '').trim();
  };

  ['HZ', 'WAVE CM'].forEach((columnName) => {
    const value = getValue(columnName);
    if (!value) return;

    const line = document.createElement('p');
    line.className = 'reference-card-line';
    line.title = getCardLabel('notes', columnName);
    line.textContent = value;
    card.appendChild(line);
    copyLines.push(value);
  });

  const pianoKeyValue = getValue('PIANO KEY');
  if (pianoKeyValue) {
    const pianoKey = document.createElement('span');
    pianoKey.className = 'reference-card-notes-corner reference-card-notes-corner-left';
    pianoKey.title = 'Piano key';
    pianoKey.textContent = pianoKeyValue;
    card.appendChild(pianoKey);
    copyLines.push(pianoKeyValue);
  }

  const midiValue = getValue('MIDI');
  if (midiValue) {
    const midi = document.createElement('span');
    midi.className = 'reference-card-notes-corner reference-card-notes-corner-right';
    midi.title = 'MIDI';
    midi.textContent = midiValue;
    card.appendChild(midi);
    copyLines.push(midiValue);
  }
}

function appendChordsCardBody({ card, rowCells, table, visibility, copyLines }) {
  const getIndex = (columnName) => table.columns.indexOf(columnName);
  const getValue = (columnName) => {
    const index = getIndex(columnName);
    if (index === -1 || visibility[index] === false) return null;
    return String(rowCells[index].text ?? '').trim();
  };

  ['FORMULA', 'SEMITONES', 'C EXAMPLE'].forEach((columnName) => {
    const value = getValue(columnName);
    if (!value) return;

    const line = document.createElement('p');
    line.className = 'reference-card-line';
    line.title = getCardLabel('chords', columnName);
    line.textContent = value;
    card.appendChild(line);
    copyLines.push(value);
  });

  const notesValue = getValue('NOTES');
  if (notesValue) {
    const notes = document.createElement('span');
    notes.className = 'reference-card-chords-notes';
    notes.title = 'Notes';
    notes.textContent = notesValue;
    card.appendChild(notes);
    copyLines.push(notesValue);
  }
}

function renderCards() {
  const table = TABLES[state.activeMode];
  const visibility = state.visibility[state.activeMode];
  cardsView.innerHTML = '';
  const playColumnIndex = table.columns.indexOf('PLAY');

  getOrderedRows(table).forEach((rowCells) => {
    const card = document.createElement('article');
    card.className = 'reference-card border';

    if (playColumnIndex !== -1 && visibility[playColumnIndex] !== false) {
      const playCell = rowCells[playColumnIndex];
      const playButton = createPlayButtonElement(playCell.playMode || state.activeMode, playCell.playPayload || {}, 'reference-card-play-toggle');
      card.appendChild(playButton);
    }

    const copyButton = document.createElement('button');
    copyButton.className = 'square icon-only reference-card-copy-button';
    copyButton.title = 'Copy';
    copyButton.setAttribute('aria-label', 'Copy');
    copyButton.innerHTML = '<svg class="icons icons-small"><use href="/icons.svg#copy" /></svg>';
    card.appendChild(copyButton);

    if (visibility[0] !== false) {
      const heading = document.createElement('h2');
      heading.className = 'reference-card-title';
      heading.innerHTML = getCellContent(rowCells[0]);
      card.appendChild(heading);
    }

    const copyLines = [];
    if (visibility[0] !== false) {
      copyLines.push(String(rowCells[0].text ?? '').trim());
    }

    if (state.activeMode === 'bpm') {
      appendBpmCardBody({ card, rowCells, table, visibility, copyLines });
    } else if (state.activeMode === 'notes') {
      appendNotesCardBody({ card, rowCells, table, visibility, copyLines });
    } else if (state.activeMode === 'scales') {
      appendScalesCardBody({ card, rowCells, table, visibility, copyLines });
    } else if (state.activeMode === 'chords') {
      appendChordsCardBody({ card, rowCells, table, visibility, copyLines });
    } else {
      for (let i = 1; i < rowCells.length; i++) {
        if (i === playColumnIndex) continue;
        if (visibility[i] === false) continue;

        const line = document.createElement('p');
        line.className = 'reference-card-line';
        const label = getCardLabel(state.activeMode, table.columns[i]);
        line.innerHTML = `<span class="reference-card-label">${label}:</span> ${getCellContent(rowCells[i])}`;

        card.appendChild(line);

        const lineValue = String(rowCells[i].text ?? '').trim();
        const lineText = `${label}: ${lineValue}`;
        copyLines.push(lineText);
      }
    }

    copyButton.dataset.copyText = copyLines.filter(Boolean).join('\n');

    cardsView.appendChild(card);
  });
}

function renderView() {
  const isCardsView = state.view === 'cards';
  resultTableElement.classList.toggle('hidden', isCardsView);
  cardsView.classList.toggle('hidden', !isCardsView);

  if (isCardsView) {
    renderCards();
  } else {
    renderTable();
  }
}

function scrollTableToTop() {
  if (!tableScrollContainer) return;
  tableScrollContainer.scrollTop = 0;
}

function setMode(modeKey) {
  if (!TABLES[modeKey]) return;
  state.activeMode = modeKey;
  updateModeButtons();
  updateColumnButtons();
  renderView();
  scrollTableToTop();
  saveSettings();
}

function toggleView() {
  state.view = state.view === 'cards' ? 'table' : 'cards';
  updateViewButton();
  renderView();
  scrollTableToTop();
  saveSettings();
}

function toggleSort() {
  state.sort = state.sort === 'asc' ? 'desc' : 'asc';
  updateSortButton();
  renderView();
  scrollTableToTop();
  saveSettings();
}

function toggleColumn(index) {
  const columns = TABLES[state.activeMode].columns;
  if (index < 0 || index >= columns.length) return;

  const modeVisibility = state.visibility[state.activeMode];
  modeVisibility[index] = modeVisibility[index] === false;

  updateColumnButtons();
  renderView();
  saveSettings();
}

modeButtons.bpm.addEventListener('click', () => setMode('bpm'));
modeButtons.notes.addEventListener('click', () => setMode('notes'));
modeButtons.scales.addEventListener('click', () => setMode('scales'));
modeButtons.chords.addEventListener('click', () => setMode('chords'));
resetButton.addEventListener('click', resetReference);
viewToggleButton.addEventListener('click', toggleView);
sortToggleButton.addEventListener('click', toggleSort);

columnButtons.forEach((button, index) => {
  button.addEventListener('click', () => toggleColumn(index));
});

tableScrollContainer.addEventListener('click', (event) => {
  const playButton = event.target.closest('.reference-play-button');
  if (playButton) {
    playReferencePreviewSound(playButton);
    return;
  }

  const copyButton = event.target.closest('.reference-card-copy-button');
  if (!copyButton) return;

  const textToCopy = copyButton.dataset.copyText || '';
  if (!textToCopy) return;

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(textToCopy).catch(() => {
      // ignore clipboard permission failures
    });
  }
});

loadSettings();
updateModeButtons();
updateColumnButtons();
updateViewButton();
updateSortButton();
renderView();
scrollTableToTop();

// END OF FILE
