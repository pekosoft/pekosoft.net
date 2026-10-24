const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules.js'), 'utf8');

function extractSource(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}

const layoutSource = [
  extractSource('const moduleIds =', 'const legacyModuleIds ='),
  extractSource('function syncModuleMoreButtonState(', 'window.syncModuleMoreButtonState'),
  extractSource('function isTwoColumnLayoutEnabled(', 'function syncModuleViewportHeight('),
  extractSource('function disableMinimizeForTwoColumnLayout(', 'function getCurrentModuleOrder(')
].join('\n');

function createLayout(savedStates, options = {}) {
  function element(classes = []) {
    const names = new Set(classes);
    return {
      classList: {
        add: (...values) => values.forEach(value => names.add(value)),
        remove: (...values) => values.forEach(value => names.delete(value)),
        contains: value => names.has(value),
        toggle(value, enabled) {
          if (enabled) names.add(value);
          else names.delete(value);
        }
      },
      disabled: false,
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; }
    };
  }

  const storage = new Map(Object.entries(savedStates).map(([id, state]) => [`module_${id}_state`, state]));
  if (options.layout !== undefined) storage.set('global.layout', options.layout);
  const writes = [];
  const containers = new Map();
  for (const id of options.presentIds || Object.keys(savedStates)) {
    const state = savedStates[id];
    const container = element(state === 'maximized' || state === 'minimized' ? [`module-${state}`] : []);
    container.minimize = element(state === 'minimized' ? ['button-on'] : []);
    container.more = element();
    container.iconPanel = element();
    container.iconPanel.childElementCount = options.emptyMore ? 0 : 1;
    container.querySelector = selector => ({
      '.module-minimize-btn': container.minimize,
      '.module-more-btn': container.more,
      '.module-icon-panel': container.iconPanel
    })[selector] || null;
    containers.set(`${id}-container`, container);
  }

  const context = vm.createContext({
    document: { getElementById: id => containers.get(id) || null },
    window: { matchMedia: () => ({ matches: options.wide !== false }) },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem(key, value) { storage.set(key, value); writes.push([key, value]); }
    }
  });
  vm.runInContext(layoutSource, context);
  return { context, storage, writes, containers };
}

for (const id of ['tool', 'controls', 'timeline', 'playlist', 'history', 'panel', 'meters']) {
  test(`two-column setup preserves the saved maximized ${id} module across repeated initialization`, () => {
    const { context, storage, writes, containers } = createLayout({ [id]: 'maximized' });
    const container = containers.get(`${id}-container`);
    for (let count = 0; count < 3; count++) {
      context.disableMinimizeForTwoColumnLayout();
      assert.equal(storage.get(`module_${id}_state`), 'maximized');
      assert.equal(container.classList.contains('module-maximized'), true);
      assert.equal(container.classList.contains('module-minimized'), false);
      assert.equal(container.minimize.disabled, true);
      assert.equal(container.minimize.attributes['aria-disabled'], 'true');
      assert.equal(container.more.disabled, false);
    }
    assert.deepEqual(writes, []);
  });
}

test('two-column setup clears only saved minimized states and updates their controls', () => {
  const { context, storage, writes, containers } = createLayout({
    tool: 'maximized', controls: 'minimized', timeline: 'normal'
  });
  context.disableMinimizeForTwoColumnLayout();
  assert.equal(storage.get('module_tool_state'), 'maximized');
  assert.equal(storage.get('module_controls_state'), 'normal');
  assert.equal(storage.get('module_timeline_state'), 'normal');
  assert.deepEqual(writes, [['module_controls_state', 'normal']]);
  const controls = containers.get('controls-container');
  assert.equal(controls.classList.contains('module-minimized'), false);
  assert.equal(controls.minimize.classList.contains('button-on'), false);
  assert.equal(controls.minimize.classList.contains('grey'), true);
  assert.equal(controls.minimize.disabled, true);
  assert.equal(controls.more.disabled, false);
});

test('normal and unsaved module states remain unchanged', () => {
  const { context, storage, writes } = createLayout({ tool: 'normal' }, { presentIds: ['tool', 'controls'] });
  context.disableMinimizeForTwoColumnLayout();
  assert.equal(storage.get('module_tool_state'), 'normal');
  assert.equal(storage.has('module_controls_state'), false);
  assert.deepEqual(writes, []);
});

test('empty More menus are greyed out and disabled', () => {
  const { context, containers } = createLayout({ tool: 'normal' }, { emptyMore: true });
  const more = containers.get('tool-container').more;
  assert.equal(more.disabled, false);
  assert.equal(more.classList.contains('grey'), false);
  context.syncModuleMoreButtonState(containers.get('tool-container'));
  assert.equal(more.disabled, true);
  assert.equal(more.classList.contains('grey'), true);
  assert.equal(more.attributes['aria-disabled'], 'true');
});

test('modules absent from the current page retain their saved states', () => {
  const { context, storage, writes } = createLayout(
    { tool: 'maximized', controls: 'minimized' }, { presentIds: ['tool'] }
  );
  context.disableMinimizeForTwoColumnLayout();
  assert.equal(storage.get('module_controls_state'), 'minimized');
  assert.deepEqual(writes, []);
});

for (const options of [{ layout: 'false' }, { wide: false }]) {
  test(`minimized state is preserved when two-column layout is inactive: ${JSON.stringify(options)}`, () => {
    const { context, storage, writes, containers } = createLayout({ tool: 'minimized' }, options);
    context.disableMinimizeForTwoColumnLayout();
    assert.equal(storage.get('module_tool_state'), 'minimized');
    assert.equal(containers.get('tool-container').classList.contains('module-minimized'), true);
    assert.equal(containers.get('tool-container').minimize.disabled, false);
    assert.deepEqual(writes, []);
  });
}
