const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'table_cards.js'), 'utf8');
const historySource = fs.readFileSync(path.join(__dirname, '..', 'js', 'history.js'), 'utf8');

class Element {
  constructor(tag = 'div', text = '') {
    this.tagName = tag.toUpperCase();
    this.text = text;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.style = {};
    this.listeners = {};
    this.classes = new Set();
    this.colSpan = 1;
    this.classList = {
      contains: name => this.classes.has(name),
      toggle: (name, active = !this.classes.has(name)) => active ? this.classes.add(name) : this.classes.delete(name),
      add: name => this.classes.add(name),
      remove: name => this.classes.delete(name)
    };
  }
  set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)); }
  get className() { return [...this.classes].join(' '); }
  set textContent(value) { this.text = value; this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
  get cells() { return this.children.filter(child => ['TD', 'TH'].includes(child.tagName)); }
  get rows() { return this.children.filter(child => child.tagName === 'TR'); }
  appendChild(child) { child.remove(); child.parentElement = this; this.children.push(child); return child; }
  append(...children) { children.forEach(child => this.appendChild(child)); }
  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(child => child !== this);
      this.parentElement = null;
    }
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  querySelectorAll(selector) {
    const matches = element => selector.split(',').some(part => {
      const value = part.trim();
      return value.startsWith('.') ? element.classList.contains(value.slice(1)) : element.tagName === value.toUpperCase();
    });
    return this.children.flatMap(child => [...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) {
    for (let current = this; current; current = current.parentElement) {
      if (selector === 'table' && current.tagName === 'TABLE') return current;
      if (selector === '.playlist-table' && current.classList.contains('playlist-table')) return current;
      if (selector === '[hidden], .hidden' && (current.hidden || current.classList.contains('hidden'))) return current;
    }
    return null;
  }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  dispatchEvent(event) { this.listeners[event.type]?.forEach(callback => callback(event)); }
  async click() {
    const event = { type: 'click', stopped: false, stopPropagation() { this.stopped = true; } };
    for (const callback of this.listeners.click || []) await callback(event);
    return event;
  }
}

function createEnvironment(saved = {}, clipboard = true) {
  const elements = new Map();
  const storage = new Map(Object.entries(saved));
  const frames = [];
  const observers = [];
  const copied = [];
  const prompts = [];
  const warnings = [];
  const document = {
    createElement: tag => new Element(tag),
    getElementById: id => elements.get(id) || null,
    addEventListener() {},
    querySelectorAll: () => []
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target, options) { this.target = target; this.options = options; this.connected = true; }
    disconnect() { this.connected = false; }
  }
  const window = { prompt: (...values) => prompts.push(values) };
  const context = vm.createContext({
    document, window, MutationObserver, requestAnimationFrame: callback => frames.push(callback),
    getComputedStyle: element => ({ display: element.style.display || 'table-cell' }),
    CustomEvent: class { constructor(type) { this.type = type; } },
    navigator: { clipboard: clipboard ? { writeText: async text => copied.push(text) } : null },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    console: { warn: (...values) => warnings.push(values) }
  });
  vm.runInContext(source, context);
  return { context, window, elements, storage, frames, observers, copied, prompts, warnings };
}

function createTable(headers = ['Name', 'Value', 'Play'], values = [['First', '10', ''], ['Second', '20', '']]) {
  const table = new Element('table');
  const head = new Element('thead');
  const heading = new Element('tr');
  heading.append(...headers.map(label => new Element('th', label)));
  head.append(heading);
  const body = new Element('tbody');
  values.forEach(values => {
    const row = new Element('tr');
    row.append(...values.map(value => new Element('td', value)));
    body.append(row);
  });
  table.append(head, body);
  table.tHead = head;
  table.tBodies = [body];
  return { table, body, headers: heading.cells };
}

test('Cards preserve every original cell, row, action and summary without cloning', async () => {
  const environment = createEnvironment();
  const { table, body } = createTable(['Name', 'Value', 'Play', 'Waveform', 'Link'], [['First', '10', '', '', '']]);
  const row = body.rows[0];
  const cells = [...row.cells];
  const play = new Element('button');
  let played = 0;
  play.addEventListener('click', () => played++);
  cells[2].append(play);
  const canvas = new Element('canvas');
  const link = new Element('a', 'Commit');
  cells[3].append(canvas);
  cells[4].append(link);
  const footer = new Element('tfoot', 'Total: 2');
  table.append(footer);
  const cards = new environment.window.TableCards(table);
  cards.setCards(true);
  assert.equal(body.rows[0], row);
  cells.forEach((cell, index) => assert.equal(row.cells[index], cell));
  assert.deepEqual(cells.map(cell => cell.dataset.cardLabel), ['Name', 'Value', 'Play', 'Waveform', 'Link']);
  assert.equal(row.cells.length, 6);
  assert.equal(footer.textContent, 'Total: 2');
  await play.click();
  assert.equal(played, 1);
  cards.setCards(false);
  assert.deepEqual(row.cells, cells);
  assert.equal(play.parentElement, cells[2]);
  assert.equal(canvas.parentElement, cells[3]);
  assert.equal(link.parentElement, cells[4]);
});

test('BPM Calculator omitted columns map to the enabled headers, not raw indexes', () => {
  const environment = createEnvironment();
  const { table, body, headers } = createTable(['Select', 'Note', 'Ms', 'Play'], [['500', '']]);
  headers[0].style.display = 'none';
  headers[1].style.display = 'none';
  new environment.window.TableCards(table).setCards(true);
  assert.deepEqual(body.rows[0].cells.slice(0, 2).map(cell => cell.dataset.cardLabel), ['Ms', 'Play']);
});

test('Cards headings omit field-label prefixes across shared Cards views', () => {
  const styles = fs.readFileSync(path.join(__dirname, '..', 'css', 'table_cards.css'), 'utf8');
  assert.match(styles, /td\[data-card-label\]:not\(\[data-card-label=""\]\):not\(\[data-card-heading="true"\]\)::before/);
});

test('paired card presentation copies each original field once', () => {
  const environment = createEnvironment();
  const { table } = createTable(['UK', 'USA'], [['Semibreve Semibreve / Whole', 'Whole']]);
  const cards = new environment.window.TableCards(table);
  cards.setCards(true);
  const row = table.tBodies[0].rows[0];
  row.cells[0].dataset.cardCopyValue = 'Semibreve';
  assert.equal(cards.getRowText(row), 'UK: Semibreve\nUSA: Whole');
});

test('Player last-row separators are restricted to table view', () => {
  const styles = fs.readFileSync(path.join(__dirname, '..', 'css', 'player.css'), 'utf8');
  assert.match(styles, /\.playlist-data:not\(\.table-cards\) tbody tr:last-child td\s*\{/);
  assert.doesNotMatch(styles, /\.playlist-data tbody tr:last-child td\s*\{/);
});

test('Cards width is constrained to its container independently of inline table widths', () => {
  const styles = fs.readFileSync(path.join(__dirname, '..', 'css', 'table_cards.css'), 'utf8');
  const layout = /table\.table-cards\s*\{([^}]+)\}/.exec(styles);
  assert.ok(layout);
  assert.match(layout[1], /min-width:\s*100%\s*;/);
  assert.match(layout[1], /max-width:\s*100%\s*;/);
});

test('copy uses current editable values and excludes action controls', async () => {
  const environment = createEnvironment();
  const { table, body } = createTable();
  const row = body.rows[0];
  const input = new Element('input');
  input.type = 'number';
  input.value = '123.456';
  row.cells[1].textContent = '';
  row.cells[1].append(input);
  row.cells[2].append(new Element('button', 'Play'));
  new environment.window.TableCards(table).setCards(true);
  const event = await row.querySelector('.table-card-copy').click();
  assert.equal(event.stopped, true);
  assert.deepEqual(environment.copied, ['Name: First\nValue: 123.456']);
});

test('clipboard failures notify through the existing copy-prompt pattern', async () => {
  const environment = createEnvironment({}, false);
  const { table, body } = createTable();
  new environment.window.TableCards(table).setCards(true);
  await body.rows[0].querySelector('.table-card-copy').click();
  assert.equal(environment.warnings.length, 1);
  assert.deepEqual(environment.prompts, [['Copy card:', 'Name: First\nValue: 10']]);
});

test('asynchronous rows and sorting refresh once without changing row identity or duplicating actions', () => {
  const environment = createEnvironment();
  const { table, body } = createTable();
  new environment.window.TableCards(table).setCards(true);
  const first = body.rows[0];
  body.append(first);
  const added = new Element('tr');
  added.append(new Element('td', 'Third'), new Element('td', '30'), new Element('td'));
  body.append(added);
  environment.observers[0].callback();
  environment.observers[0].callback();
  assert.equal(environment.frames.length, 1);
  environment.frames.shift()();
  assert.equal(body.rows[1], first);
  assert.equal(added.cells[0].dataset.cardLabel, 'Name');
  body.rows.forEach(row => assert.equal(row.querySelectorAll('.table-card-actions').length, 1));
  assert.deepEqual(Array.from(environment.observers[0].options.attributeFilter), ['class', 'style', 'hidden']);
});

test('loading and unavailable messages remain messages rather than data cards', () => {
  const environment = createEnvironment();
  const { table, body } = createTable(['Title', 'Date', 'Number', 'Commit'], [['Loading']]);
  body.rows[0].cells[0].colSpan = 4;
  new environment.window.TableCards(table).setCards(true);
  assert.equal(body.rows[0].classList.contains('table-card-message'), true);
  assert.equal(body.rows[0].cells[0].dataset.cardLabel, '');
  assert.equal(body.rows[0].querySelector('.table-card-copy'), null);
});

test('view, accessible toggle state and reset are persisted independently for each table', async () => {
  const environment = createEnvironment({ 'example.view': 'cards' });
  const first = createTable().table;
  first.dataset.cardsKey = 'example.view';
  first.dataset.cardsButton = 'example-toggle';
  const button = new Element('button');
  const reset = new Element('button');
  environment.elements.set('example-toggle', button);
  environment.elements.set('reset-button', reset);
  const cards = new environment.window.TableCards(first);
  const other = new environment.window.TableCards(createTable().table);
  assert.equal(cards.active, true);
  assert.equal(other.active, false);
  assert.equal(button.attributes['aria-pressed'], 'true');
  assert.equal(button.title, 'Switch to table');
  await button.click();
  assert.equal(environment.storage.get('example.view'), 'table');
  await button.click();
  await reset.click();
  assert.equal(cards.active, false);
  assert.equal(button.attributes['aria-pressed'], 'false');
  assert.equal(environment.storage.get('example.view'), 'table');
});

test('turning Cards off before a pending refresh leaves the original table intact', () => {
  const environment = createEnvironment();
  const { table, body } = createTable();
  const cards = new environment.window.TableCards(table);
  cards.setCards(true);
  environment.observers[0].callback();
  cards.setCards(false);
  environment.frames.shift()();
  assert.equal(body.rows[0].cells.length, 3);
  assert.equal(environment.observers[0].connected, false);
});

test('History cycles List, Cards, JSON and JavaScript while retaining restoration and saved formats', async () => {
  const environment = createEnvironment();
  vm.runInContext(historySource, environment.context);
  const { table, body } = createTable(['#', 'Type', 'Change', 'Time'], []);
  const container = new Element();
  container.append(table);
  const codeView = new Element('textarea');
  const viewButton = new Element('button');
  const restored = [];
  const history = new environment.window.PekosoftHistory({
    list: body, listContainer: container, codeView, viewButton, viewStorageKey: 'history.view',
    restore: value => restored.push(value)
  });
  history.record('Changed pattern', '{"value":1}', '{"value":2}');
  await viewButton.click();
  assert.equal(history.viewMode, 'cards');
  assert.equal(table.classList.contains('table-cards'), true);
  assert.equal(container.hidden, false);
  assert.equal(codeView.hidden, true);
  assert.equal(environment.storage.get('history.view'), 'cards');
  history.goTo(0);
  assert.deepEqual(restored, ['{"value":1}']);
  assert.equal(body.rows[0].cells[2].dataset.cardLabel, 'Change');
  await viewButton.click();
  assert.equal(history.viewMode, 'json');
  assert.equal(container.hidden, true);
  assert.equal(codeView.hidden, false);
  assert.doesNotThrow(() => JSON.parse(codeView.value));
  await viewButton.click();
  assert.equal(history.viewMode, 'javascript');
  assert.match(codeView.value, /^const history = /);
  await viewButton.click();
  assert.equal(history.viewMode, 'list');
  assert.equal(body.rows[0].cells.length, 4);
  environment.storage.set('history.view', 'cards');
  const restoredHistory = new environment.window.PekosoftHistory({ list: body, viewStorageKey: 'history.view' });
  assert.equal(restoredHistory.viewMode, 'cards');
});

test('all data-table surfaces load the shared view or retain Reference Cards', () => {
  const root = path.join(__dirname, '..');
  for (const [file, key, button] of [
    ['bpm_calculator.php', 'bpm_calculator.table_view', 'table-view-button'],
    ['player.php', 'player.playlist_table_view', 'playlist-view-button'],
    ['drum_machine.php', 'drum_machine.playlist_table_view', 'playlist-view-button']
  ]) {
    const template = fs.readFileSync(path.join(root, 'tools', file), 'utf8');
    assert.ok(template.includes(`data-cards-key="${key}"`));
    assert.ok(template.includes(`data-cards-button="${button}"`));
    assert.ok(template.includes(`id="${button}"`));
  }
  const updates = fs.readFileSync(path.join(root, 'updates.php'), 'utf8');
  assert.match(updates, /data-cards-key="updates.table_view"/);
  assert.match(updates, /id="updates-view-button"/);
  const reference = fs.readFileSync(path.join(root, 'tools', 'reference.php'), 'utf8');
  assert.match(reference, /id="cards-view"/);
  const head = fs.readFileSync(path.join(root, 'elements', 'head.php'), 'utf8');
  assert.match(head, /\/js\/table_cards\.js/);
  assert.match(head, /\/css\/table_cards\.css/);
});

test('History restores Cards and every previously supported saved format', () => {
  for (const mode of ['cards', 'list', 'json', 'javascript']) {
    const environment = createEnvironment({ 'history.view': mode });
    vm.runInContext(historySource, environment.context);
    const { table, body } = createTable(['#', 'Type', 'Change', 'Time'], []);
    const container = new Element();
    const codeView = new Element('textarea');
    const history = new environment.window.PekosoftHistory({
      list: body, listContainer: container, codeView, viewStorageKey: 'history.view'
    });
    assert.equal(history.viewMode, mode);
    assert.equal(table.classList.contains('table-cards'), mode === 'cards');
    assert.equal(container.hidden, !['list', 'cards'].includes(mode));
    assert.equal(codeView.hidden, ['list', 'cards'].includes(mode));
  }
});
