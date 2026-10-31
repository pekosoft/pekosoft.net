const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'visualizer.js'), 'utf8');
const names = ['clock', 'cake', 'speedometer', 'metronome', 'ticker', 'lines', 'stars', 'pulse', 'blink'];

function renderer(saved = {}) {
  const nodes = new Map();
  function node(key) {
    if (nodes.has(key)) return nodes.get(key);
    const classes = new Set();
    const element = {
      style: {}, attributes: {}, events: {},
      classList: {
        toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
        contains(name) { return classes.has(name); }
      },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, handler) { this.events[name] = handler; },
      getBoundingClientRect() { return { width: 900, height: 600 }; },
      closest(selector) { return node(`${key} ${selector}`); },
      querySelector(selector) {
        if (selector === '.button-text') {
          const name = key.replace('toggle-', '').replace('-button', '');
          return { textContent: name[0].toUpperCase() + name.slice(1) };
        }
        return node(selector);
      }
    };
    nodes.set(key, element);
    return element;
  }
  const storage = new Map(Object.entries(saved));
  const document = { getElementById: node, querySelector: node };
  const context = vm.createContext({
    document, Date,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    }
  });
  vm.runInContext(source.slice(0, source.indexOf('// Keep ticker hidden')), context);
  vm.runInContext(source.slice(source.indexOf('function loadToggleState()'), source.indexOf("window.addEventListener('pekosoft:global-defaults-change'")), context);
  return { context, nodes, storage, click: key => node(key).events.click() };
}

test('One selects any meter independently of All toggles and cannot deselect it', () => {
  const { context, nodes, click, storage } = renderer();
  click('tool-mode-all-button');
  click('toggle-clock-button');
  click('tool-mode-single-button');
  click('toggle-clock-button');
  click('toggle-clock-button');
  assert.equal(storage.get('visualizer.single_meter'), 'clock');
  assert.equal(JSON.parse(storage.get('visualizer.toggles')).clock, false);
  assert.equal(nodes.get(':scope > .module-header .module-title').textContent, 'Visualizer: Clock');
  const meters = vm.runInContext('meters', context);
  for (const name of names) {
    assert.equal(meters[name].classList.contains('hidden'), name !== 'clock');
    assert.equal(nodes.get(`toggle-${name}-button`).attributes['aria-pressed'], name === 'clock' ? 'true' : 'false');
  }
  click('tool-mode-all-button');
  assert.equal(meters.clock.classList.contains('hidden'), true);
  assert.equal(meters.pulse.classList.contains('hidden'), false);
  assert.equal(nodes.get(':scope > .module-header .module-title').textContent, 'Visualizer: All');
});

test('One is the default and Reset mode, while saved All remains supported', () => {
  assert.equal(renderer().context.loadToolMode(), 'single');
  assert.equal(renderer({ 'visualizer.tool_mode': 'all' }).context.loadToolMode(), 'all');
  assert.match(source, /resetButton\.addEventListener[\s\S]*setToolViewMode\('single', true\)/);
  assert.equal(renderer().context.loadSingleMeterName(), 'clock');
  assert.match(source, /resetButton\.addEventListener[\s\S]*singleMeterName = 'clock'/);
});

test('All layout fills the module with a grid recalculated for enabled meters', () => {
  const { nodes, click } = renderer();
  click('tool-mode-all-button');
  const grid = nodes.get('.visualizer-meters');
  assert.equal(grid.style.gridTemplateColumns, 'repeat(3, minmax(0, 1fr))');
  assert.equal(grid.style.gridTemplateRows, 'repeat(3, minmax(0, 1fr))');
  for (const name of names.slice(1)) click(`toggle-${name}-button`);
  assert.equal(grid.style.gridTemplateColumns, 'repeat(1, minmax(0, 1fr))');
  assert.equal(grid.style.gridTemplateRows, 'repeat(1, minmax(0, 1fr))');
});

test('All meter artwork stays square within rectangular grid cells', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'visualizer.css'), 'utf8');
  assert.match(css, /\.meter > :not\(\.label\) \{\s*width: min\(100cqw, 100cqh\);\s*height: min\(100cqw, 100cqh\);/);
  assert.doesNotMatch(css, /body\.visualizer-mask-on \.ticker-container \{/);
  assert.match(css, /\.meter \{\s*position: relative;\s*overflow: hidden;/);
  assert.doesNotMatch(css, /overflow: visible/);
});

test('One works when every All meter is disabled and Next cycles every meter', () => {
  const { context, click, storage } = renderer({
    'visualizer.toggles': JSON.stringify(Object.fromEntries(names.map(name => [name, false])))
  });
  click('tool-mode-single-button');
  click('toggle-clock-button');
  for (const name of names.slice(1).concat('clock')) {
    click('tool-single-next-button');
    assert.equal(storage.get('visualizer.single_meter'), name);
  }
  assert.equal(vm.runInContext('meters.clock.classList.contains("hidden")', context), false);
});

test('Visualizer markup contains one module, meter tabs and footer controls', () => {
  const php = fs.readFileSync(path.join(root, 'tools', 'visualizer.php'), 'utf8');
  assert.match(php, /\$availableModules = \["tool"\]/);
  assert.match(php, /id="tool-container" class="container one-module-tool"/);
  assert.doesNotMatch(php, /controls-container|tool-single-prev-button|#radio_button/);
  assert.equal((php.match(/id="tool-single-next-button"/g) || []).length, 1);
  const footer = php.slice(php.indexOf('<div class="module-footer'));
  assert.doesNotMatch(php, /id="bpm"|visualizer-bpm-inline/);
  for (const id of ['toggle-play-button', 'toggle-cross-button', 'toggle-mask-button', 'toggle-title-button', 'reset-button']) {
    assert.ok(footer.includes(`id="${id}"`), id);
  }
  assert.match(footer, /#selected/);
});

test('Visualizer uses global BPM only, including defaults and Reset', () => {
  for (const [saved, expected] of [
    [{ 'global.default_bpm': '90', 'visualizer.bpm': '5' }, 90],
    [{ 'visualizer.bpm': '5' }, 120],
    [{ 'global.default_bpm': '900' }, 480]
  ]) {
    assert.equal(renderer(saved).context.loadBpm(), expected);
  }
  assert.doesNotMatch(source, /bpmInput|saveBpm|visualizer\.bpm/);
  assert.match(source, /resetButton\.addEventListener[\s\S]*currentBpm = loadBpm\(\)/);
});

test('saved One selection restores a meter disabled in All without changing preferences', () => {
  const { context, storage, nodes } = renderer({
    'visualizer.tool_mode': 'single',
    'visualizer.single_meter': 'clock',
    'visualizer.toggles': JSON.stringify({ clock: false })
  });
  vm.runInContext('toolViewMode = loadToolMode(); singleMeterName = loadSingleMeterName(); renderToolMeters();', context);
  assert.equal(nodes.get(':scope > .module-header .module-title').textContent, 'Visualizer: Clock');
  assert.equal(vm.runInContext('meters.clock.classList.contains("hidden")', context), false);
  assert.equal(JSON.parse(storage.get('visualizer.toggles')).clock, false);
});
