const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'bpm_calculator.js'), 'utf8');
const renderSource = source.slice(source.indexOf('function drawCanvas()'), source.indexOf('function createSvgElement('));
const inputSource = source.slice(source.indexOf('function updateNumericInput('), source.indexOf('function setupToolMenuPanel('));

function createRenderer() {
  let created = 0;
  let rebuilds = 0;
  function element(attributes = {}) {
    created++;
    return {
      attributes, children: [],
      setAttribute(name, value) { this.attributes[name] = value; },
      append(...nodes) { this.children.push(...nodes); },
      appendChild(node) { this.children.push(node); },
      replaceChildren(...nodes) { rebuilds++; this.children = nodes; },
      get firstElementChild() { return this.children[0]; }
    };
  }
  const colors = { '--color1': '#0080ff', '--color2': '#ff00ff', '--white': '#fff', '--grey1': '#222' };
  const context = {
    state: {
      bpm: 320, viewMode: 'all', selected: '6-triplet',
      rows: new Set(Array.from({ length: 11 }, (_, i) => i)),
      modes: { base: true, dotted: true, triplet: true },
      showGuides: true, showPlayhead: true, isPlaying: false
    },
    timelineSvg: element(), timelineRenderKey: '', timelineLayer: null,
    timelinePlayhead: null, timelineMarkers: [],
    currentBeatMs: null, currentDelayMs: null,
    BPM_TIMELINE_WIDTH: 4096, VISUAL_MATCH_TOLERANCE_MS: 2,
    noteData: { values: ['8/1', '4/1', '2/1', '1/1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128'] },
    getTimelineHeight: () => 256, syncTimelineViewport() {},
    getCssVariable: name => colors[name],
    getComputedStyle: () => ({ getPropertyValue: name => colors[name] }),
    document: { documentElement: {} }, window: {},
    getTimelinePlayheadMs: () => 1000,
    bpmTimelineRulers: { render() {}, getVisible: () => false },
    timelineUtils: {}, timelineFollow: null,
    svgUtils: { createElement: () => element() },
    createTimelineLine: (x1, y1, x2, y2, stroke) => element({ x1, y1, x2, y2, stroke }),
    createTimelineCircle: (cx, cy, r, fill) => element({ cx, cy, r, fill })
  };
  vm.createContext(context);
  vm.runInContext(renderSource, context);
  return { context, counts: () => ({ created, rebuilds }) };
}

test('steady playback reuses all Timeline nodes instead of rebuilding the SVG', () => {
  const { context, counts } = createRenderer();
  context.drawCanvas();
  const before = counts();
  for (let frame = 0; frame < 180; frame++) {
    context.currentBeatMs = frame % 2 ? 0 : null;
    context.drawCanvas();
  }
  assert.deepEqual(counts(), before);
});

test('tempo and selection changes invalidate geometry once, not on subsequent animation frames', () => {
  const { context, counts } = createRenderer();
  context.drawCanvas();
  context.state.bpm = 120;
  context.drawCanvas();
  assert.equal(counts().rebuilds, 2);
  context.state.selected = '5-base';
  context.drawCanvas();
  assert.equal(counts().rebuilds, 3);
  context.drawCanvas();
  assert.equal(counts().rebuilds, 3);
});

test('cached markers highlight and return to their base state without node replacement', () => {
  const { context, counts } = createRenderer();
  context.drawCanvas();
  const beat = context.timelineMarkers.find(marker => marker.kind === 'beat' && marker.ms === 0);
  const created = counts().created;
  context.currentBeatMs = 0;
  context.currentDelayMs = 0;
  context.drawCanvas();
  assert.equal(beat.line.attributes.stroke, '#fff');
  assert.equal(beat.circle.attributes.fill, '#fff');
  context.currentBeatMs = null;
  context.currentDelayMs = null;
  context.drawCanvas();
  assert.equal(beat.line.attributes.stroke, '#0080ff');
  assert.equal(beat.circle.attributes.fill, '#0080ff');
  assert.equal(counts().created, created);
});

test('Guides and Playhead toggles invalidate cached geometry', () => {
  const { context, counts } = createRenderer();
  context.drawCanvas();
  context.state.showGuides = false;
  context.drawCanvas();
  context.state.showPlayhead = false;
  context.drawCanvas();
  assert.equal(context.timelinePlayhead, null);
  assert.equal(counts().rebuilds, 3);
});

test('Single mode cache changes when visible notes change', () => {
  const { context, counts } = createRenderer();
  context.state.viewMode = 'single';
  context.drawCanvas();
  const initial = context.timelineMarkers.length;
  context.state.rows.delete(5);
  context.drawCanvas();
  assert.equal(context.timelineMarkers.length, initial - 3);
  assert.equal(counts().rebuilds, 2);
});

test('Timeline resize and ruler changes invalidate geometry', () => {
  const { context, counts } = createRenderer();
  context.drawCanvas();
  context.getTimelineHeight = () => 512;
  context.drawCanvas();
  context.bpmTimelineRulers.getVisible = () => true;
  context.drawCanvas();
  assert.equal(counts().rebuilds, 3);
});

test('Bright and palette changes invalidate the cached presentation', () => {
  const { context, counts } = createRenderer();
  context.drawCanvas();
  context.window.PekoBrightGuides = {
    getTimelineBright: () => true,
    getTimelineGuideColor: color => color
  };
  context.drawCanvas();
  context.getCssVariable = () => '#abcdef';
  context.drawCanvas();
  assert.equal(counts().rebuilds, 3);
});

test('fractional tempos include the last beat before the minute boundary', () => {
  const { context } = createRenderer();
  context.state.bpm = 120.5;
  context.drawCanvas();
  const beats = context.timelineMarkers.filter(marker => marker.kind === 'beat');
  assert.equal(beats.length, 121);
  assert.ok(beats.at(-1).ms < 60000);
});

test('numeric edits remain intact until committed and invalid values are explicitly rejected', () => {
  const context = { editingNumericInput: null };
  vm.createContext(context);
  vm.runInContext(inputSource, context);
  const input = {
    value: '12', message: '', reports: 0,
    setCustomValidity(message) { this.message = message; },
    reportValidity() { this.reports++; }
  };
  assert.equal(context.readPositiveInput(input, false), 12);
  context.updateNumericInput(input, 30);
  assert.equal(input.value, '12');
  assert.equal(context.readPositiveInput(input, true), 12);
  context.updateNumericInput(input, 30);
  assert.equal(input.value, '30.000');
  for (const invalid of ['', '-1', 'NaN', 'Infinity', '0']) {
    input.value = invalid;
    assert.equal(context.readPositiveInput(input, true), null);
    assert.equal(input.message, 'Enter a positive number.');
  }
  assert.equal(input.reports, 5);
  context.updateNumericInput(input, 120);
  assert.equal(input.value, '120.000');
  assert.equal(input.message, '');
});
