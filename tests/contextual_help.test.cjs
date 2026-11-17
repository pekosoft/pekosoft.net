const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'index.js'), 'utf8');
const helpSource = source.slice(source.indexOf('function getStatusAssociatedLabel('), source.indexOf('const SITE_PLAY_STORAGE_KEY'));

function matches(element, selector) {
  return selector.split(',').some(part => {
    const excluded = [...part.matchAll(/:not\(([^)]+)\)/g)].map(match => match[1]);
    if (excluded.some(value => matches(element, value))) return false;
    const simple = part.trim().replace(/:not\([^)]+\)/g, '');
    const tag = simple.match(/^[\w-]+/)?.[0];
    if (tag && element.tagName.toLowerCase() !== tag) return false;
    const id = simple.match(/#([\w-]+)/)?.[1];
    if (id && element.id !== id) return false;
    const classes = [...simple.matchAll(/\.([\w-]+)/g)];
    if (classes.some(match => !element.classList.contains(match[1]))) return false;
    return [...simple.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)].every(([, name, value]) =>
      element.hasAttribute(name) && (value === undefined || element.getAttribute(name) === value));
  });
}

function createElement(tag, attributes = {}, text = '', children = []) {
  const element = {
    tagName: tag.toUpperCase(), id: attributes.id || '', type: attributes.type || '',
    textContent: text, children, childNodes: [{ nodeType: 3, textContent: text }, ...children], parentElement: null,
    dataset: Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith('data-'))
      .map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value])),
    classList: { contains: name => (attributes.class || '').split(/\s+/).includes(name) },
    getAttribute: name => attributes[name] ?? null,
    hasAttribute: name => Object.hasOwn(attributes, name),
    setAttribute(name, value) { attributes[name] = value; },
    addEventListener() {},
    closest(selector) {
      for (let node = this; node; node = node.parentElement) {
        if (matches(node, selector)) return node;
      }
      return null;
    },
    querySelector(selector) {
      for (const child of children) {
        if (matches(child, selector)) return child;
        const nested = child.querySelector(selector);
        if (nested) return nested;
      }
      return null;
    }
  };
  children.forEach(child => { child.parentElement = element; });
  return element;
}

function createHelp(url) {
  const location = new URL(url, 'http://localhost:8000');
  const assigned = [];
  location.assign = href => assigned.push(href);
  const listeners = new Map();
  const headings = [];
  const text = createElement('span');
  const icon = createElement('use');
  const helpIcon = createElement('svg');
  const link = createElement('a', { title: 'Open Help', 'data-status-help': '' }, '', [helpIcon]);
  const back = createElement('button', { title: 'Back', 'data-status-back': '' });
  const bar = {
    getAttribute: () => 'Ready',
    querySelector: selector => ({
      '[data-status-text]': text, '[data-status-help]': link,
      '[data-status-icon]': icon, '[data-status-back]': back
    })[selector]
  };
  const document = {
    querySelectorAll: selector => ({
      '[data-statusbar]': [bar], label: [], '.feature-row h1': headings
    })[selector] || [],
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    }
  };
  const window = { location, history: { length: 2 }, setTimeout: () => 1 };
  const api = vm.runInNewContext(`${helpSource}
    ({ getStatusDescriptor, getStatusHelpHref, setupStatusBars, scrollToRequestedHelpEntry });
  `, { document, window, URLSearchParams, clearTimeout() {} });
  api.setupStatusBars();
  return {
    ...api, link, helpIcon, location, assigned,
    dispatch(type, target, properties = {}) {
      const event = {
        target, preventDefault() { this.prevented = true; },
        stopImmediatePropagation() { this.stopped = true; }, ...properties
      };
      listeners.get(type)?.forEach(handler => handler(event));
      return event;
    },
    addHeading(name, kind, entry) {
      const object = createElement('span', { class: 'object' }, kind);
      const heading = createElement('h1', entry ? { 'data-help-entry': entry } : {}, `${name} ${kind}`, [object]);
      heading.childNodes = [{ textContent: `${name} ` }, object];
      const row = createElement('div', { class: 'feature-row' }, '', [heading]);
      row.scrollIntoView = () => { row.scrolled = true; };
      headings.push(heading);
      return row;
    }
  };
}

test('status Help retains the control destination through hover, focus and clicking its icon', () => {
  for (const [page, release] of [['/tap_pad', 'tap_pad'], ['/drum_machine', 'drum_machine'], ['/help?t=metronome', 'metronome']]) {
    const help = createHelp(page);
    const control = createElement('button', { title: 'Reset to default' }, 'Reset',
      [createElement('span', { class: 'button-text' }, 'Reset')]);
    help.dispatch('mouseover', control);
    const destination = `/help?t=${release}&e=reset&k=button`;
    assert.equal(help.link.href, destination);
    help.dispatch('mouseout', control, { relatedTarget: help.helpIcon });
    help.dispatch('mouseover', help.helpIcon);
    help.dispatch('focusout', control, { relatedTarget: help.link });
    help.dispatch('focusin', help.link);
    const shortcutClick = help.dispatch('click', help.helpIcon, { ctrlKey: true });
    const shortcutKey = help.dispatch('keydown', help.link, { key: 'Enter', ctrlKey: true });
    assert.ok(!shortcutClick.prevented && !shortcutKey.prevented);
    assert.deepEqual(help.assigned, []);
    const click = help.dispatch('click', help.helpIcon);
    assert.equal(help.link.hidden, false);
    assert.equal(help.link.href, destination);
    assert.equal(help.link.getAttribute('aria-label'), 'Open Help for Reset');
    assert.ok(!click.prevented);
    const url = new URL(help.link.href, help.location);
    help.location.pathname = url.pathname;
    help.location.search = url.search;
    const row = help.addHeading('Reset', 'button');
    help.scrollToRequestedHelpEntry();
    assert.equal(row.scrolled, true);
  }
});

test('Instrument Bright has its own Help target without changing the existing Timeline Bright target', () => {
  const control = createElement('button', { title: 'Toggle bright BPM', 'data-help-entry': 'Instrument bright' }, 'Bright',
    [createElement('span', { class: 'button-text' }, 'Bright')]);
  const help = createHelp('/tap_pad');
  assert.equal(help.getStatusHelpHref(help.getStatusDescriptor(control)), '/help?t=tap_pad&e=instrument+bright&k=button');

  for (const entry of ['instrument+bright', 'bright']) {
    const page = createHelp(`/help?t=tap_pad&e=${entry}&k=button`);
    const instrument = page.addHeading('Bright', 'button', 'Instrument bright');
    const timeline = page.addHeading('Bright', 'button');
    page.scrollToRequestedHelpEntry();
    assert.equal(Boolean(instrument.scrolled), entry === 'instrument+bright');
    assert.equal(Boolean(timeline.scrolled), entry === 'bright');
  }
});

test('shared Settings use canonical names and General Help without replacing local tool targets', () => {
  for (const page of ['/', '/tap_pad', '/player', '/about?t=turntable', '/history?t=clock', '/contact']) {
    const help = createHelp(page);
    const guides = createElement('button', { title: 'Timeline guides', 'data-setting-toggle': 'guides' }, 'Guides');
    const darkMode = createElement('button', { id: 'toggle-mode-button', title: 'Toggle dark mode', 'aria-label': 'Toggle dark mode' }, 'Dark mode');
    const statusBar = createElement('button', { id: 'toggle-footer-button', title: 'Toggle status bar', 'aria-label': 'Toggle status bar' }, 'Status bar');
    const reset = createElement('button', { title: 'Reset to default' }, 'Reset');
    const font = createElement('button', { title: 'Default font size', 'aria-label': 'Font', class: 'knob-control' });
    createElement('div', { id: 'settings-menu-container' }, '', [guides, darkMode, statusBar, reset, font]);
    assert.equal(help.getStatusHelpHref(help.getStatusDescriptor(guides)), '/help?t=index&e=guides&k=option', page);
    assert.equal(help.getStatusHelpHref(help.getStatusDescriptor(darkMode)), '/help?t=index&e=dark+mode&k=option', page);
    assert.equal(help.getStatusHelpHref(help.getStatusDescriptor(statusBar)), '/help?t=index&e=status+bar&k=option', page);
    assert.equal(help.getStatusHelpHref(help.getStatusDescriptor(reset)), '/help?t=index&e=reset&k=button', page);
    assert.equal(help.getStatusHelpHref(help.getStatusDescriptor(font)), '/help?t=index&e=font&k=knob', page);
    help.location.pathname = '/help';
    help.location.search = '?t=index&e=guides&k=option';
    const localGuides = help.addHeading('Guides', 'button');
    const globalGuides = help.addHeading('Guides', 'option');
    help.scrollToRequestedHelpEntry();
    assert.equal(globalGuides.scrolled, true);
    assert.ok(!localGuides.scrolled);
  }
  const help = createHelp('/tap_pad');
  const localReset = createElement('button', { title: 'Reset to default' }, 'Reset');
  assert.equal(help.getStatusHelpHref(help.getStatusDescriptor(localReset)), '/help?t=tap_pad&e=reset&k=button');
});

test('Ctrl+click and Ctrl+Enter still open the real control entry without triggering its action', () => {
  for (const [type, properties] of [['click', { ctrlKey: true }], ['keydown', { key: 'Enter', ctrlKey: true }]]) {
    const help = createHelp('/tap_pad');
    const control = createElement('button', { title: 'Set default BPM' }, 'Set',
      [createElement('span', { class: 'button-text' }, 'Set')]);
    const event = help.dispatch(type, control, properties);
    assert.equal(event.prevented, true);
    assert.equal(event.stopped, true);
    assert.deepEqual(help.assigned, ['/help?t=tap_pad&e=set&k=button']);
  }
});
