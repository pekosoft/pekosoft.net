const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'site_ui.js'), 'utf8');

function fixture({ url = '/', refs = ['/', '/first', '/?brand=one'], saved = {}, native = false,
  background = '/photo.png', rootInversion = false } = {}) {
  const nodes = [];
  function element(tag = 'div') {
    const node = {
      tagName: tag.toUpperCase(), children: [], attributes: {}, dataset: {}, style: {}, events: {},
      get parentElement() { return this.parent; },
      get firstChild() { return this.children[0] || null; },
      get className() { return this.attributes.class || ''; },
      set className(value) { this.attributes.class = value; },
      classList: {
        contains(name) { return node.className.split(' ').includes(name); },
        toggle(name, on) {
          const names = new Set(node.className.split(' ').filter(Boolean));
          if (on ?? !names.has(name)) names.add(name);
          else names.delete(name);
          node.className = [...names].join(' ');
        }
      },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name] ?? null; },
      addEventListener(name, callback) { (this.events[name] ||= []).push(callback); },
      fire(name, event = {}) { for (const callback of this.events[name] || []) callback(event); },
      click() { this.fire('click'); },
      append(...children) {
        for (const child of children) { child.remove(); child.parent = this; this.children.push(child); }
      },
      prepend(child) { this.append(child); this.children.unshift(this.children.pop()); },
      insertBefore(child, reference) {
        child.remove();
        child.parent = this;
        const index = reference ? this.children.indexOf(reference) : this.children.length;
        this.children.splice(index, 0, child);
      },
      replaceChildren(...children) {
        for (const child of [...this.children]) child.remove();
        this.append(...children);
      },
      remove() {
        if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
        this.parent = null;
      },
      after(child) { this.parent.append(child); },
      closest(selector) {
        if (selector === 'li' && this.tagName === 'LI' ||
            selector === '.toc-controls' && this.classList.contains('toc-controls')) return this;
        return this.parent?.closest(selector) || null;
      },
      matches(selector) { return selector === 'a[href]' && this.tagName === 'A'; },
      querySelectorAll(selector) {
        const descendants = this.children.flatMap(child => [child, ...child.querySelectorAll('*')]);
        if (selector === '*') return descendants;
        if (selector === 'a[href]') return descendants.filter(child => child.tagName === 'A');
        return [];
      },
      querySelector(selector) {
        const descendants = this.querySelectorAll('*');
        if (selector === '.toc-controls') return descendants.find(child => child.classList.contains('toc-controls'));
        if (selector === 'a[href="/"]' || selector === 'li a[href="/"]') {
          return descendants.find(child => child.tagName === 'A' && new URL(child.href).pathname === '/' &&
            !new URL(child.href).search && (selector[0] !== 'l' || child.closest('li')));
        }
        if (selector === 'li a[aria-current="page"]') {
          return descendants.find(child => child.tagName === 'A' && child.getAttribute('aria-current') === 'page' && child.closest('li'));
        }
        return descendants.find(child => child.tagName === 'IMG' || child.className === 'external-link-icon' ||
          child.getAttribute('href')?.endsWith('#external'));
      }
    };
    nodes.push(node);
    return node;
  }
  const values = new Map(Object.entries(saved));
  const localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const location = new URL(url, 'http://localhost:8000');
  const destinations = [];
  location.assign = ref => destinations.push(new URL(ref, location.href).href);
  const document = element();
  document.currentScript = { dataset: { background, rootInversion: String(rootInversion) } };
  document.documentElement = element('html');
  document.body = element('body');
  document.append(document.body);
  document.getElementById = id => nodes.find(node => node.id === id);
  document.createElement = element;
  document.createElementNS = (namespace, tag) => element(tag);
  const toc = element('nav');
  toc.id = 'toc';
  document.body.append(toc);
  for (const ref of refs) {
    const item = element('li');
    const link = element('a');
    link.href = new URL(ref, location.href).href;
    link.origin = location.origin;
    item.append(link);
    toc.append(item);
  }
  const controls = element();
  document.body.append(controls);
  document.querySelector = selector => selector === '#settings-panel .settings-panel-scroll' ? controls : null;
  if (native) {
    const play = element('button');
    play.id = 'play-site-button';
    controls.append(play);
    play.addEventListener('click', () => {
      localStorage.setItem('global.site_play_active', String(localStorage.getItem('global.site_play_active') !== 'true'));
      play.classList.toggle('button-on', localStorage.getItem('global.site_play_active') === 'true');
    });
  }
  const timers = new Map();
  let nextTimer = 0;
  const window = element();
  window.location = location;
  const context = {
    document, window, localStorage, URL, console,
    MutationObserver: class { observe() {} },
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  vm.runInNewContext(source.replace("  document.addEventListener('DOMContentLoaded', () => {",
    "  globalThis.features = { setupBackground, setupNavigation, markExternalLinks };\n  document.addEventListener('DOMContentLoaded', () => {"), context);
  return { ...context, features: context.features, controls, toc, values, timers, destinations, element };
}

test('Background defaults off, persists a toggle and restores off when storage is reset', () => {
  const page = fixture({ rootInversion: true });
  page.features.setupBackground();
  const button = page.document.getElementById('toggle-background-button');
  assert.equal(button.getAttribute('aria-pressed'), 'false');
  assert.equal(page.document.body.children[0].style.backgroundImage, 'none');
  assert.equal(page.document.body.children[0].classList.contains('bitmap'), true);
  button.click();
  assert.equal(page.values.get('global.background_enabled'), 'true');
  assert.equal(page.document.body.children[0].style.backgroundImage, 'url("/photo.png")');
  const restored = fixture({ saved: Object.fromEntries(page.values) });
  restored.features.setupBackground();
  assert.equal(restored.document.getElementById('toggle-background-button').getAttribute('aria-pressed'), 'true');
  restored.values.clear();
  restored.window.fire('storage', { key: null });
  assert.equal(restored.document.getElementById('toggle-background-button').getAttribute('aria-pressed'), 'false');
});

test('Background sits immediately before Reset in flat, wrapped and inline Settings', () => {
  for (const layout of ['flat', 'wrapped', 'inline']) {
    const page = fixture();
    const mode = page.element('button');
    mode.id = 'toggle-mode-button';
    const share = page.element('button');
    const reset = page.element('button');
    reset.id = 'reset-settings-button';
    page.controls.append(mode, share);
    if (layout === 'wrapped') {
      const row = page.element();
      row.append(reset);
      page.controls.append(row);
    } else {
      page.controls.append(reset);
    }
    if (layout === 'inline') page.document.querySelector = () => null;
    page.features.setupBackground();
    const button = page.document.getElementById('toggle-background-button');
    const siblings = reset.parentElement.children;
    assert.equal(siblings[siblings.indexOf(reset) - 1], button, layout);
    assert.deepEqual(page.controls.children.slice(0, 2), [mode, share], layout);
    assert.equal(button.children.some(child => child.tagName === 'SPAN'), layout !== 'inline', layout);
  }
});

test('Gradient background follows the accent variables and toggle without bitmap inversion', () => {
  const page = fixture({
    background: 'gradient', rootInversion: true,
    saved: { 'global.background_enabled': 'true' }
  });
  page.features.setupBackground();
  const background = page.document.body.children[0];
  const button = page.document.getElementById('toggle-background-button');
  assert.equal(background.style.backgroundImage, 'linear-gradient(135deg, var(--color2), var(--color1))');
  assert.equal(background.classList.contains('bitmap'), false);
  button.click();
  assert.equal(background.style.backgroundImage, 'none');
  assert.equal(page.document.documentElement.classList.contains('site-background-enabled'), false);
  button.click();
  assert.equal(background.style.backgroundImage, 'linear-gradient(135deg, var(--color2), var(--color1))');
});

test('Navigation preserves brand queries, wraps and places Home only in the toolbar', () => {
  const page = fixture({ url: '/?brand=one' });
  page.features.setupNavigation();
  page.document.getElementById('next-site-button').click();
  assert.equal(page.destinations.pop(), 'http://localhost:8000/');
  page.document.getElementById('prev-site-button').click();
  assert.equal(page.destinations.pop(), 'http://localhost:8000/first');
  assert.equal(page.toc.querySelectorAll('a[href]').filter(link => new URL(link.href).pathname === '/' && !new URL(link.href).search).length, 1);
  assert.equal(page.toc.children[0].children.length, 4);
});

test('Playback has one timer, advances with its query and Escape cancels it', () => {
  const page = fixture({ url: '/first' });
  page.features.setupNavigation();
  const play = page.document.getElementById('play-site-button');
  play.click();
  page.window.fire('pageshow');
  assert.equal(page.timers.size, 1);
  [...page.timers.values()][0]();
  assert.equal(page.destinations.pop(), 'http://localhost:8000/?brand=one');
  page.document.fire('keydown', { key: 'Escape' });
  assert.equal(page.timers.size, 0);
  assert.equal(play.getAttribute('aria-pressed'), 'false');
});

test('Skip and Play omit opted-out links while retaining their manual destinations', () => {
  const page = fixture({ url: '/updates', refs: ['/', '/bands', '/updates', '/tree'] });
  const tree = page.toc.querySelectorAll('a[href]').find(link => new URL(link.href).pathname === '/tree');
  tree.dataset.playSkip = 'true';
  page.features.setupNavigation();
  page.document.getElementById('next-site-button').click();
  assert.equal(page.destinations.pop(), 'http://localhost:8000/');
  page.document.getElementById('prev-site-button').click();
  assert.equal(page.destinations.pop(), 'http://localhost:8000/bands');
  page.document.getElementById('play-site-button').click();
  [...page.timers.values()][0]();
  assert.equal(page.destinations.pop(), 'http://localhost:8000/');
  assert.ok(page.toc.querySelectorAll('a[href]').includes(tree));
});

test('Existing Play is moved, not rebound, and previous navigation stops its controller', () => {
  const page = fixture({ native: true, url: '/first' });
  page.features.setupNavigation();
  const play = page.document.getElementById('play-site-button');
  assert.equal(play.events.click.length, 1);
  play.click();
  page.document.getElementById('prev-site-button').click();
  assert.equal(page.values.get('global.site_play_active'), 'false');
  assert.equal(page.timers.size, 0);
  assert.equal(page.destinations.pop(), 'http://localhost:8000/');
});

test('A button-based front-page link moves to Home with its original Beta destination and handler', () => {
  const page = fixture({ refs: ['/player', '/tuner'], url: '/beta' });
  const column = page.element();
  const home = page.element('button');
  home.dataset.href = '/beta';
  home.setAttribute('aria-current', 'page');
  home.addEventListener('click', () => page.window.location.assign(home.dataset.href));
  column.append(home);
  page.toc.append(column);
  const query = page.toc.querySelector.bind(page.toc);
  page.toc.querySelector = selector => selector.startsWith('.toc-content') ? home : query(selector);
  page.features.setupNavigation();
  assert.equal(page.toc.children[0].children[0], home);
  assert.equal(home.events.click.length, 1);
  home.click();
  assert.equal(page.destinations.pop(), 'http://localhost:8000/beta');
  assert.equal(page.toc.children.includes(column), false);
});

test('External text links get one decorative marker, unlike internal and image links', () => {
  const page = fixture();
  page.document.querySelector = selector => selector === 'link[rel="canonical"]'
    ? { href: 'https://site.example/first' } : null;
  const links = ['/first', 'https://other.example/text', 'https://other.example/image', 'https://site.example/about'].map(href => {
    const link = page.element('a');
    link.href = new URL(href, page.window.location.href).href;
    link.textContent = 'Destination';
    page.document.body.append(link);
    return link;
  });
  links[2].append(page.element('img'));
  page.features.markExternalLinks(page.document);
  page.features.markExternalLinks(page.document);
  assert.equal(links[0].children.length, 0);
  assert.equal(links[1].children.length, 1);
  assert.equal(links[1].children[0].getAttribute('aria-hidden'), 'true');
  assert.equal(links[2].children.length, 1);
  assert.equal(links[3].children.length, 0);
});
