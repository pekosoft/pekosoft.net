const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'tuner.js'), 'utf8');
const template = fs.readFileSync(path.join(__dirname, '..', 'tools', 'tuner.php'), 'utf8');
const help = fs.readFileSync(path.join(__dirname, '..', 'help', 'tuner.php'), 'utf8');
const profiles = {
  guitar: { notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], midi: [40, 45, 50, 55, 59, 64] },
  bass: { notes: ['E1', 'A1', 'D2', 'G2'], midi: [28, 33, 38, 43] },
  ukulele: { notes: ['G4', 'C4', 'E4', 'A4'], midi: [67, 60, 64, 69] },
  violin: { notes: ['G3', 'D4', 'A4', 'E5'], midi: [55, 62, 69, 76] },
  viola: { notes: ['C3', 'G3', 'D4', 'A4'], midi: [48, 55, 62, 69] },
  cello: { notes: ['C2', 'G2', 'D3', 'A3'], midi: [36, 43, 50, 57] },
  mandolin: { notes: ['G3', 'D4', 'A4', 'E5'], midi: [55, 62, 69, 76] },
  banjo: { notes: ['G4', 'D3', 'G3', 'B3', 'D4'], midi: [67, 50, 55, 59, 62] }
};

function createTuner(initialStorage = {}) {
  const storage = new Map(Object.entries(initialStorage));
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', disabled: false });
    return elements.get(id);
  };
  const functions = [
    'setProfile', 'saveSettings', 'loadSettings', 'clearPanel', 'resetAll', 'updateProfileSelect'
  ].map(name => source.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`))[0]).join('\n');
  const tuner = vm.runInNewContext(`
    ${source.slice(0, source.indexOf('function renderTargetButtons()'))}
    ${functions}
    ({
      state, profiles: PROFILE_TEMPLATES, getProfileTargets, getCurrentTarget,
      setCurrentSelectedIndex, findNearestTargetIndexByMidi, setProfile, loadSettings, resetAll
    });
  `, {
    document: { getElementById: element },
    window: { addEventListener() {} },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    stopTargetTone() {}, stopListening() {}, renderTargetButtons() {}, syncReadout() {},
    updateFollowButton() {}, updateGuidesButton() {}, updateHoldButton() {},
    updateListenButton() {}, updateSoundToggleButton() {}, redrawTimeline() {}, setStatus() {}
  });
  tuner.loadSettings();
  return { ...tuner, storage, element };
}

test('Profile menu matches every supported instrument and Chromatic', () => {
  const tuner = createTuner();
  const select = template.match(/<select id="profile-select">([\s\S]*?)<\/select>/)[1];
  const options = [...select.matchAll(/<option value="([^"]+)">/g)].map(([, value]) => value);
  assert.deepEqual(options.sort(), Object.keys(tuner.profiles).sort());
  assert.deepEqual(Object.keys(tuner.state.selectedIndex).sort(), Object.keys(profiles).sort());
});

for (const [profile, expected] of Object.entries(profiles)) {
  test(`${profile} uses its standard notes, octaves, frequencies and saved selection`, () => {
    const tuner = createTuner();
    tuner.setProfile(profile);
    const targets = tuner.getProfileTargets(profile);
    assert.deepEqual(Array.from(targets, target => target.noteName), expected.notes);
    assert.deepEqual(Array.from(targets, target => target.midi), expected.midi);
    targets.forEach((target, index) => {
      assert.ok(Math.abs(target.hz - 440 * 2 ** ((expected.midi[index] - 69) / 12)) < 1e-9);
      assert.equal(tuner.findNearestTargetIndexByMidi(targets, target.midi), index);
      assert.ok(help.includes(expected.notes.join(' ')));
    });
    assert.equal(tuner.element('profile-select').value, profile);
    assert.equal(tuner.element('chromatic-octave-input').disabled, true);
    assert.equal(tuner.getCurrentTarget(), null);
    tuner.setCurrentSelectedIndex(0);
    assert.equal(tuner.getCurrentTarget().noteName, expected.notes[0]);
    assert.equal(tuner.storage.get('tuner.profile'), profile);
    const restored = createTuner(Object.fromEntries(tuner.storage));
    assert.equal(restored.state.profile, profile);
    assert.equal(restored.getCurrentTarget(), null);
  });
}

test('Chromatic retains twelve semitones and its adjustable octave', () => {
  const tuner = createTuner();
  tuner.setProfile('chromatic');
  tuner.state.chromaticOctave = 5;
  const targets = tuner.getProfileTargets('chromatic');
  assert.equal(targets.length, 12);
  assert.equal(targets[0].noteName, 'C5');
  assert.equal(targets[11].noteName, 'B5');
  assert.equal(tuner.element('chromatic-octave-input').disabled, false);
});

test('all instrument frequencies follow the global A4 reference', () => {
  const tuner = createTuner({ 'global.a4_hz': '442' });
  for (const [profile, expected] of Object.entries(profiles)) {
    tuner.getProfileTargets(profile).forEach((target, index) => {
      assert.ok(Math.abs(target.hz - 442 * 2 ** ((expected.midi[index] - 69) / 12)) < 1e-9);
    });
  }
});

test('each instrument retains its own selected target until Reset clears every profile', () => {
  const tuner = createTuner();
  for (const profile of Object.keys(profiles)) {
    tuner.setProfile(profile);
    tuner.setCurrentSelectedIndex(1);
  }
  for (const [profile, expected] of Object.entries(profiles)) {
    tuner.setProfile(profile);
    assert.equal(tuner.getCurrentTarget().noteName, expected.notes[1]);
  }
  tuner.setProfile('chromatic');
  tuner.setCurrentSelectedIndex(4);
  tuner.resetAll();
  assert.equal(tuner.state.profile, 'guitar');
  assert.equal(tuner.state.chromaticIndex, -1);
  assert.equal(tuner.storage.get('tuner.profile'), 'guitar');
  for (const profile of Object.keys(profiles)) {
    assert.equal(tuner.state.selectedIndex[profile], -1);
    tuner.setProfile(profile);
    assert.equal(tuner.getCurrentTarget(), null);
  }
});
