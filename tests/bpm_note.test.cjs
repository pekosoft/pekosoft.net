const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'bpm_calculator.js'), 'utf8');
const sharedSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'index.js'), 'utf8');
const controlSource = sharedSource.slice(
  sharedSource.indexOf('function bindKnobControl('),
  sharedSource.indexOf('// Function to toggle the TOC visibility')
);
const noteSource = source.slice(
  source.indexOf('function getRowDelayMs('),
  source.indexOf('function updateSortButton(')
) + source.slice(source.indexOf('function getValueLabel('), source.indexOf('function calculateValues('));

function createControl(overrides = {}) {
  const listeners = new Map();
  const attributes = new Map();
  const frames = new Map();
  const stats = { scheduled: 0, drawn: 0, panel: 0, saved: [] };
  let frameId = 0;
  let rows = [];
  let radios = [];
  const knob = {
    disabled: false, dataset: {}, style: { setProperty() {} }, capture: null,
    addEventListener(name, listener) { listeners.set(name, listener); },
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name); },
    focus() {},
    setPointerCapture(id) { this.capture = id; },
    hasPointerCapture(id) { return this.capture === id; },
    releasePointerCapture() { this.capture = null; },
    emit(name, values = {}) {
      const event = {
        pointerId: 1, isPrimary: true, button: 0, clientY: 100, deltaY: 0,
        prevented: false, preventDefault() { this.prevented = true; }, ...values
      };
      listeners.get(name)(event);
      return event;
    }
  };
  const context = {
    state: {
      bpm: 120, selected: '5-base', sort: 'desc', isPlaying: false,
      rows: new Set(Array.from({ length: 11 }, (_, i) => i)),
      modes: { base: true, dotted: true, triplet: true }, ...overrides
    },
    noteData: { values: '8/1 4/1 2/1 1/1 1/2 1/4 1/8 1/16 1/32 1/64 1/128'.split(' ') },
    getMultiplier: type => type === 'dotted' ? 1.5 : type === 'triplet' ? 2 / 3 : 1,
    createDefaultState: () => ({ selected: '5-base' }),
    noteKnob: knob, selectionRenderFrame: null,
    resultTable: { querySelectorAll: selector => selector === 'tr' ? rows : radios },
    schedulePlaybackEvents() { stats.scheduled++; },
    saveState() { stats.saved.push(context.state.selected); },
    updatePanel() { stats.panel++; },
    drawCanvas() { stats.drawn++; },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; }
  };
  vm.createContext(context);
  vm.runInContext(controlSource + noteSource, context);
  const rebuild = (includeRadios = true) => {
    rows = Array.from(context.getVisibleRowDescriptors(), descriptor => {
      const row = { id: descriptor.rowKey, selected: descriptor.rowKey === `row-${context.state.selected}` };
      row.classList = {
        toggle(name, selected) {
          assert.equal(name, 'table-row-selected');
          row.selected = selected;
        }
      };
      return row;
    });
    radios = includeRadios ? rows.map(row => ({
      value: row.id.slice(4), checked: row.selected
    })) : [];
    context.syncNoteKnob();
  };
  rebuild();
  context.initNoteKnob();
  return {
    context, knob, stats, frames, rebuild,
    rows: () => rows, radios: () => radios,
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback());
    }
  };
}

test('Note knob uses all 33 visible notes in the Instrument table order', () => {
  const { context, knob } = createControl();
  const visible = Array.from(context.getVisibleRowDescriptors());
  assert.equal(visible.length, 33);
  assert.equal(knob.getAttribute('aria-valuemax'), '33');
  visible.forEach((row, index) => {
    context.setNoteKnobIndex(index + 1);
    assert.equal(context.state.selected, `${row.i}-${row.type}`);
    assert.equal(knob.getAttribute('aria-valuetext'), context.getValueLabel(row.note, row.type));
  });
});

test('Note knob excludes hidden note families and modifiers', () => {
  const { context, knob } = createControl({
    rows: new Set([4, 6, 9]), modes: { base: true, dotted: false, triplet: true }, selected: null
  });
  assert.equal(knob.getAttribute('aria-valuemax'), '6');
  for (let index = 1; index <= 6; index++) {
    context.setNoteKnobIndex(index);
    const [family, type] = context.state.selected.split('-');
    assert.ok([4, 6, 9].includes(Number(family)));
    assert.notEqual(type, 'dotted');
  }
});

test('sorting preserves selection and reverses the knob position and next-note order', () => {
  const { context, knob, rebuild } = createControl();
  const before = context.getNoteKnobIndex();
  context.state.sort = 'asc';
  rebuild();
  assert.equal(context.state.selected, '5-base');
  assert.equal(context.getNoteKnobIndex() + before, 34);
  const next = context.getVisibleRowDescriptors()[context.getNoteKnobIndex()];
  knob.emit('keydown', { key: 'ArrowRight' });
  assert.equal(context.state.selected, `${next.i}-${next.type}`);
});

test('table selection synchronizes the knob and radios, schedules immediately, and batches rendering', () => {
  const control = createControl({ isPlaying: true });
  const { context, knob, stats, frames } = control;
  context.setSelectedNote('6-triplet');
  context.setSelectedNote('7-base');
  assert.equal(stats.scheduled, 2);
  assert.equal(stats.drawn, 0);
  assert.equal(frames.size, 1);
  assert.equal(knob.getAttribute('aria-valuetext'), '1/16 straight');
  assert.deepEqual(control.radios().filter(radio => radio.checked).map(radio => radio.value), ['7-base']);
  assert.deepEqual(control.rows().filter(row => row.selected).map(row => row.id), ['row-7-base']);
  assert.deepEqual(stats.saved, ['6-triplet', '7-base']);
  control.flush();
  assert.equal(stats.drawn, 1);
  assert.equal(stats.panel, 1);
  assert.equal(context.selectionRenderFrame, null);
});

test('keyboard controls clamp at None and the last visible note without wrapping', () => {
  const { context, knob } = createControl();
  knob.emit('keydown', { key: 'Home' });
  assert.equal(context.state.selected, null);
  assert.equal(knob.getAttribute('aria-valuetext'), 'None');
  knob.emit('keydown', { key: 'ArrowDown' });
  assert.equal(context.state.selected, null);
  knob.emit('keydown', { key: 'ArrowUp' });
  assert.equal(context.getNoteKnobIndex(), 1);
  knob.emit('keydown', { key: 'End' });
  assert.equal(context.getNoteKnobIndex(), 33);
  knob.emit('keydown', { key: 'ArrowRight' });
  assert.equal(context.getNoteKnobIndex(), 33);
  knob.emit('keydown', { key: 'ArrowLeft' });
  assert.equal(context.getNoteKnobIndex(), 32);
});

test('wheel changes one note per step, prevents page scrolling, and ignores zero vertical movement', () => {
  const { context, knob } = createControl();
  const initial = context.getNoteKnobIndex();
  assert.equal(knob.emit('wheel', { deltaY: -1 }).prevented, true);
  assert.equal(context.getNoteKnobIndex(), initial + 1);
  knob.emit('wheel', { deltaY: 1 });
  assert.equal(context.getNoteKnobIndex(), initial);
  knob.emit('wheel');
  assert.equal(context.getNoteKnobIndex(), initial);
});

test('vertical dragging advances discrete notes and stops on capture loss', () => {
  const { context, knob } = createControl();
  const initial = context.getNoteKnobIndex();
  knob.emit('pointerdown');
  knob.emit('pointermove', { clientY: 58 });
  assert.equal(context.getNoteKnobIndex(), initial + 3);
  knob.emit('pointermove', { pointerId: 2, clientY: 0 });
  assert.equal(context.getNoteKnobIndex(), initial + 3);
  knob.emit('lostpointercapture');
  assert.equal(knob.capture, null);
  knob.emit('pointermove', { clientY: 0 });
  assert.equal(context.getNoteKnobIndex(), initial + 3);
});

test('right-button and secondary-pointer gestures do not start dragging', () => {
  const { context, knob } = createControl();
  knob.emit('pointerdown', { button: 2 });
  knob.emit('pointermove', { clientY: 0 });
  knob.emit('pointerdown', { isPrimary: false });
  knob.emit('pointermove', { clientY: 0 });
  assert.equal(context.state.selected, '5-base');
  assert.equal(knob.capture, null);
});

test('double-click restores the default note only when it is visible', () => {
  const { context, knob, rebuild } = createControl({ selected: null });
  knob.emit('dblclick');
  assert.equal(context.state.selected, '5-base');
  context.state.modes.base = false;
  context.setSelectedNote(null);
  rebuild();
  knob.emit('dblclick');
  assert.equal(context.state.selected, null);
});

test('empty and single-note tables keep valid ranges and never select hidden notes', () => {
  const { context, knob, rebuild } = createControl({ rows: new Set(), selected: null });
  assert.equal(knob.disabled, true);
  assert.equal(knob.getAttribute('aria-valuemax'), '0');
  knob.emit('wheel', { deltaY: -1 });
  assert.equal(context.state.selected, null);
  context.state.rows.add(6);
  context.state.modes = { base: false, dotted: false, triplet: true };
  rebuild();
  assert.equal(knob.disabled, false);
  knob.emit('keydown', { key: 'End' });
  assert.equal(context.state.selected, '6-triplet');
  assert.equal(knob.getAttribute('aria-valuenow'), '1');
  knob.emit('keydown', { key: 'ArrowUp' });
  assert.equal(context.state.selected, '6-triplet');
});

test('Note knob still selects and highlights rows when the Select column is hidden', () => {
  const control = createControl();
  control.rebuild(false);
  control.knob.emit('keydown', { key: 'ArrowUp' });
  assert.equal(control.radios().length, 0);
  assert.deepEqual(control.rows().filter(row => row.selected).map(row => row.id),
    [`row-${control.context.state.selected}`]);
});

test('unchanged selection does not schedule audio, render, or save again', () => {
  const { context, stats, frames } = createControl({ isPlaying: true });
  context.setSelectedNote('5-base');
  context.setNoteKnobIndex(context.getNoteKnobIndex());
  assert.equal(stats.scheduled, 0);
  assert.equal(frames.size, 0);
  assert.equal(stats.saved.length, 0);
});
