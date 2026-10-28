const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules.js'), 'utf8');

test('More uses regular control spacing and borders and indicates its open state', () => {
  const styles = fs.readFileSync(path.join(__dirname, '..', 'css', 'index.css'), 'utf8');
  const rule = selector => {
    const start = styles.indexOf(`${selector} {`);
    assert.ok(start >= 0, selector);
    return styles.slice(start, styles.indexOf('}', start));
  };
  const menu = rule('.module-panel-menu:has(> .controls-values)');
  assert.match(menu, /gap:\s*0;/);
  assert.match(menu, /padding:\s*0;/);
  for (const selector of ['.module-panel-menu-label', '.module-panel-menu select']) {
    assert.match(rule(selector), /border:\s*1px solid var\(--grey1\)/);
  }
  assert.match(rule('.module-more-btn.button-on'), /color:\s*var\(--color1\)/);
  assert.match(rule('.module-more-btn.button-on .icons'), /fill:\s*var\(--color1\)/);
});

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

test('More closes only on its own button and survives outside, module and fullscreen actions', async () => {
  function element() {
    const classes = new Set();
    return {
      hidden: false, attributes: {}, handlers: {},
      classList: {
        add: name => classes.add(name),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name),
        toggle(name, enabled = !classes.has(name)) {
          if (enabled) classes.add(name);
          else classes.delete(name);
          return enabled;
        }
      },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, callback) { this.handlers[name] = callback; }
    };
  }
  const container = element();
  container.contains = target => target === container;
  const iconPanel = element();
  iconPanel.hidden = true;
  const controls = Object.fromEntries(
    ['actions', 'titleEl', 'iconBtn', 'moreBtn', 'minimizeBtn', 'maximizeBtn', 'fullscreenBtn', 'closeBtn', 'header']
      .map(name => [name, element()])
  );
  const documentHandlers = {};
  const context = vm.createContext({
    ...controls, container, iconPanel, id: 'controls',
    Node: class {},
    document: {
      fullscreenElement: null,
      addEventListener(name, callback) { documentHandlers[name] = callback; },
      async exitFullscreen() { this.fullscreenElement = null; }
    },
    window: { addEventListener() {} },
    localStorage: { setItem() {} },
    updateIconPanelInset() {},
    updateMinimizeButtonState() {},
    isLockedModule: () => false,
    isTwoColumnLayoutActive: () => false,
    syncModuleMoreButtonState() {},
    syncMaximizedModuleState() {},
    toggleModule: () => container.classList.toggle('hidden')
  });
  container.requestFullscreen = async () => { context.document.fullscreenElement = container; };
  vm.runInContext(extractSource('  function collapseMore() {', '  const body = container.querySelector'), context);
  const assertOpen = () => {
    assert.equal(iconPanel.hidden, false);
    assert.equal(controls.moreBtn.attributes['aria-expanded'], 'true');
    assert.equal(controls.moreBtn.classList.contains('button-on'), true);
    assert.equal(container.classList.contains('module-icon-panel-open'), true);
  };
  controls.moreBtn.handlers.click();
  assertOpen();
  documentHandlers.pointerdown({ target: new context.Node() });
  assertOpen();
  controls.iconBtn.handlers.click();
  assertOpen();
  for (const name of ['minimizeBtn', 'maximizeBtn', 'fullscreenBtn', 'closeBtn']) {
    await controls[name].handlers.click();
    assertOpen();
    await controls[name].handlers.click();
    assertOpen();
  }
  documentHandlers.fullscreenchange();
  assertOpen();
  controls.moreBtn.handlers.click();
  assert.equal(iconPanel.hidden, true);
  assert.equal(controls.moreBtn.attributes['aria-expanded'], 'false');
  assert.equal(controls.moreBtn.classList.contains('button-on'), false);
});

test('Layout reset preserves an open More mode', () => {
  const { context, containers } = createLayout({ controls: 'maximized' });
  const container = containers.get('controls-container');
  container.classList.add('module-icon-panel-open');
  container.more.classList.add('button-on');
  container.more.setAttribute('aria-expanded', 'true');
  context.document.querySelectorAll = () => [container];
  container.id = 'controls-container';
  context.syncFirstModule = () => {};
  context.syncMaximizedModuleState = () => {};
  vm.runInContext(extractSource('function resetModuleLayout() {', 'window.resetModuleLayout'), context);
  context.resetModuleLayout();
  assert.equal(container.classList.contains('module-icon-panel-open'), true);
  assert.equal(container.more.classList.contains('button-on'), true);
  assert.equal(container.more.attributes['aria-expanded'], 'true');
  assert.equal(container.iconPanel.attributes.hidden, undefined);
});

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
