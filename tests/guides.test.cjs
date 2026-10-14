const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'guides.js'), 'utf8');

function createTabs() {
  const values = new Map();
  const pending = [];
  const writes = [];
  const tabs = [];

  function createTab(slug, moduleIds = []) {
    const windowListeners = new Map();
    const documentListeners = new Map();
    const inputs = new Map(['guides', 'bright-guides', 'rulers'].map(id => [id, { checked: false }]));
    const settingsButtons = new Map();
    const moduleButtons = moduleIds.map(id => createButton(id, true));
    const tab = { changes: [], moduleButtons, inputs };
    tabs.push(tab);

    function createButton(id, enabled) {
      const classes = new Set(enabled ? ['button-on'] : []);
      return {
        id,
        classList: {
          contains: name => classes.has(name),
          toggle(name, state) {
            if (state) classes.add(name);
            else classes.delete(name);
          }
        },
        setAttribute() {},
        closest() { return this; },
        click() {
          const next = !classes.has('button-on');
          this.classList.toggle('button-on', next);
          tab.changes.push({ id, enabled: next });
          localStorage.setItem(id === 'tool-guides-button' ? `meters.${slug}.guides` : `${slug}.show_guides`, String(next));
          documentListeners.get('click')?.forEach(listener => listener({ target: this }));
        }
      };
    }

    ['guides', 'bright-guides', 'rulers'].forEach(id => settingsButtons.set(id, createButton('', false)));
    const localStorage = {
      get length() { return values.size; },
      key(index) { return [...values.keys()][index] ?? null; },
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) {
        value = String(value);
        const oldValue = this.getItem(key);
        if (oldValue === value) return;
        values.set(key, value);
        writes.push({ tab, key, value });
        tabs.filter(other => other !== tab).forEach(other => pending.push(() => other.storage({ key, oldValue, newValue: value })));
      },
      removeItem(key) {
        const oldValue = this.getItem(key);
        if (oldValue === null) return;
        values.delete(key);
        tabs.filter(other => other !== tab).forEach(other => pending.push(() => other.storage({ key, oldValue, newValue: null })));
      }
    };
    const window = {
      location: { pathname: `/${slug}` },
      addEventListener(type, listener) {
        if (!windowListeners.has(type)) windowListeners.set(type, []);
        windowListeners.get(type).push(listener);
      },
      dispatchEvent(event) {
        windowListeners.get(event.type)?.forEach(listener => listener(event));
      }
    };
    const document = {
      getElementById: id => inputs.get(id) ?? null,
      querySelector(selector) {
        const id = selector.match(/data-setting-toggle="([^"]+)"/)?.[1];
        return settingsButtons.get(id) ?? null;
      },
      querySelectorAll: () => moduleButtons,
      addEventListener(type, listener) {
        if (!documentListeners.has(type)) documentListeners.set(type, []);
        documentListeners.get(type).push(listener);
      }
    };
    class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options.detail;
      }
    }
    vm.runInNewContext(source, { window, document, localStorage, CustomEvent });
    tab.window = window;
    tab.storage = event => windowListeners.get('storage')?.forEach(listener => listener(event));
    return tab;
  }

  function settle() {
    let processed = 0;
    while (pending.length) {
      assert.ok(processed++ < 1000, 'Cross-tab storage events must settle instead of toggling forever');
      pending.shift()();
    }
  }

  return { createTab, settle, values, writes };
}

test('global Guides changes are atomic and settle across tabs', () => {
  const browser = createTabs();
  const player = browser.createTab('player', ['tool-guides-button', 'guides-button']);
  const other = browser.createTab('drum_machine', ['tool-guides-button', 'timeline-guides-button']);
  browser.createTab('help');
  for (const enabled of [false, true, false, true]) {
    const start = browser.writes.length;
    player.window.PekoGuides.setGlobal(enabled);
    const globalWrites = browser.writes.slice(start).filter(write => write.key === 'global.guides');
    assert.deepEqual(globalWrites.map(write => write.value), [String(enabled)], 'No intermediate global states');
    browser.settle();
    assert.equal(browser.values.get('global.guides'), String(enabled));
    for (const tab of [player, other]) {
      assert.equal(tab.inputs.get('guides').checked, enabled);
      tab.moduleButtons.forEach(button => assert.equal(button.classList.contains('button-on'), enabled));
    }
    assert.equal(browser.writes.slice(start).filter(write => write.key === 'global.guides').length, 1, 'Receiving tabs must not rebroadcast');
  }
});

test('queued storage events apply the latest state without writing it back', () => {
  const browser = createTabs();
  const player = browser.createTab('player', ['tool-guides-button', 'guides-button']);
  const other = browser.createTab('drum_machine', ['tool-guides-button', 'timeline-guides-button']);
  for (const [api, key] of [
    ['PekoGuides', 'global.guides'],
    ['PekoBrightGuides', 'global.bright_guides'],
    ['PekoRulers', 'global.rulers']
  ]) {
    player.window[api].setGlobal(false);
    player.window[api].setGlobal(true);
    const start = browser.writes.length;
    browser.settle();
    assert.equal(browser.values.get(key), 'true');
    assert.equal(other.window[api].getGlobal(), true);
    assert.equal(browser.writes.slice(start).filter(write => write.key === key).length, 0);
  }
});

test('local Guides toggles retain independent module states', () => {
  const browser = createTabs();
  const player = browser.createTab('player', ['tool-guides-button', 'guides-button']);
  player.window.PekoGuides.setGlobal(false);
  player.moduleButtons[0].click();
  assert.equal(player.inputs.get('guides').checked, true);
  assert.equal(player.moduleButtons[1].classList.contains('button-on'), false);
  player.moduleButtons[0].click();
  assert.equal(player.inputs.get('guides').checked, false);
});
