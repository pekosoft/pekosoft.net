const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'reference.js'), 'utf8');
const tempiSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'tempi.js'), 'utf8');
const renderSource = source.slice(0, source.indexOf("modeButtons.bpm.addEventListener('click'"));
const spriteSource = fs.readFileSync(path.join(__dirname, '..', 'icons.svg'), 'utf8');
const spriteIcons = new Set([...spriteSource.matchAll(/<symbol id="([^"]+)"/g)].map(match => match[1]));
const columnIcons = {
  bpm: ['bpm', 'text', 'plus_minus', 'triangle_down', 'triangle_up', 'triplet', '1_4_dotted', 'clock', 'pulse', 'play'],
  tempi: ['italy', 'bpm', 'play'],
  notes: ['tuner', 'arrow_up_down', 'mic', 'midi', 'wavelength', 'cm', 'piano', 'play'],
  scales: ['timeline', 'ruler', 'quantized_steps', 'letter_c', 'table_rows', 'play'],
  chords: ['value', 'formula', 'piano', 'letter_c', 'table_rows', 'play']
};

function createRenderer(mode, savedSettings = {}) {
  function element() {
    return {
      children: [], dataset: {}, attributes: {}, attributeWrites: [], style: {}, className: '',
      classList: { toggle() {} },
      setAttribute(name, value) { this.attributes[name] = value; this.attributeWrites.push(name); },
      getAttribute(name) { return this.attributes[name] ?? null; },
      appendChild(node) { this.children.push(node); },
      closest() { return table; },
      get cells() { return this.children; },
      set textContent(value) { this.text = value; this.html = ''; this.children = []; },
      get textContent() {
        return this.text ?? (this.html || '').replace(/<[^>]*>/g, '') + this.children.map(child => child.textContent).join('');
      },
      set innerHTML(value) { this.html = value; this.children = []; },
      get innerHTML() { return this.html || ''; }
    };
  }
  const table = element();
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        const node = element();
        if (/^toggle-col-\d+-button$/.test(id)) {
          const icon = element();
          node.querySelector = selector => selector === 'use' ? icon : null;
        }
        elements.set(id, node);
      }
      return elements.get(id);
    },
    querySelector: () => element(),
    createElement: element
  };
  const storage = new Map(Object.entries(savedSettings));
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  };
  const context = vm.createContext({ document, localStorage });
  vm.runInContext(tempiSource, context);
  vm.runInContext(renderSource, context);
  const state = vm.runInContext('state', context);
  const tables = vm.runInContext('TABLES', context);
  state.activeMode = mode;
  return { context, state, table: tables[mode], cards: elements.get('cards-view'), elements, storage };
}

function descendants(node) {
  return node.children.flatMap(child => [child, ...descendants(child)]);
}

function expectedCopy(mode, row, visibility) {
  const order = {
    bpm: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    tempi: [0, 1],
    notes: [0, 1, 2, 4, 5, 6, 3],
    scales: [0, 1, 2, 3, 4],
    chords: [0, 1, 2, 3, 4]
  };
  const bpmLabels = { 3: 'Half', 4: 'Double', 5: 'Triplet', 6: 'Dotted', 7: 'SPB', 8: 'BPS' };
  return order[mode]
    .filter(index => visibility[index] !== false)
    .map(index => {
      if (mode === 'bpm' && bpmLabels[index]) return `${bpmLabels[index]}: ${row[index].text}`;
      if (mode === 'tempi' && index === 1) return `BPM: ${row[index].text}`;
      return row[index].text;
    })
    .join('\n');
}

for (const mode of ['bpm', 'tempi', 'notes', 'scales', 'chords']) {
  test(`${mode} toggles retain existing SVG references in both views`, () => {
    const { context, state, table, elements } = createRenderer(mode);
    context.updateColumnButtons();
    const icons = Array.from({ length: 10 }, (_, index) => elements.get(`toggle-col-${index + 1}-button`).querySelector('use'));
    icons.forEach(icon => { icon.attributeWrites.length = 0; });
    for (const view of ['table', 'cards']) {
      state.view = view;
      for (let index = 0; index < table.columns.length; index++) {
        context.toggleColumn(index);
        assert.equal(elements.get(`toggle-col-${index + 1}-button`).attributes['aria-pressed'], 'false');
        context.toggleColumn(index);
        assert.equal(elements.get(`toggle-col-${index + 1}-button`).attributes['aria-pressed'], 'true');
      }
    }
    icons.forEach(icon => assert.deepEqual(icon.attributeWrites, [], 'Column toggles must not reload SVG symbols'));
  });

  test(`${mode} column controls switch to matching existing icons without changing visibility`, () => {
    const { context, state, elements } = createRenderer('bpm');
    context.updateColumnButtons();
    state.activeMode = mode;
    state.visibility[mode][1] = false;
    context.updateColumnButtons();
    const columns = vm.runInContext(`TABLES.${mode}.columns`, context);
    assert.equal(columnIcons[mode].length, columns.length);
    for (let index = 0; index < 10; index++) {
      const button = elements.get(`toggle-col-${index + 1}-button`);
      assert.equal(button.hidden, index >= columns.length);
      if (button.hidden) continue;
      const icon = columnIcons[mode][index];
      assert.ok(spriteIcons.has(icon), `Missing sprite icon: ${icon}`);
      assert.equal(button.querySelector('use').attributes.href, `/icons.svg#${icon}`);
      const label = context.formatButtonLabel(columns[index]);
      assert.equal(elements.get(`toggle-col-${index + 1}-text`).textContent, label);
      assert.equal(button.title, `Toggle ${label} column`);
      assert.equal(button.attributes['aria-pressed'], index === 1 ? 'false' : 'true');
    }
    assert.equal(state.visibility[mode][1], false);
  });

  test(`${mode} cards render and copy every table value with the matching Play payload`, () => {
    const { context, state, table, cards } = createRenderer(mode);
    context.renderCards();
    assert.equal(cards.children.length, table.rows.length);
    cards.children.forEach((card, rowIndex) => {
      const row = table.rows[rowIndex];
      const nodes = descendants(card);
      const heading = nodes.find(node => node.className === 'reference-card-title');
      assert.equal(heading.innerHTML, row[0].html || row[0].text);
      const values = nodes.filter(node => node.textContent !== undefined).map(node => node.textContent);
      row.slice(1, -1).forEach(cell => {
        assert.ok(values.some(value => value === cell.text || value.endsWith(`: ${cell.text}`)), `Missing ${cell.text}`);
      });
      const copy = nodes.find(node => node.dataset.copyText !== undefined);
      assert.equal(copy.dataset.copyText, expectedCopy(mode, row, state.visibility[mode]));
      const play = nodes.find(node => node.dataset.playMode);
      assert.equal(play.dataset.playMode, row.at(-1).playMode);
      Object.entries(row.at(-1).playPayload).forEach(([key, value]) => {
        assert.equal(play.dataset[`play${key[0].toUpperCase()}${key.slice(1)}`], String(value));
      });
      assert.equal(play.attributes['aria-label'], 'Play');
    });
  });

  test(`${mode} column toggles omit only the corresponding card information and copied value`, () => {
    const { context, state, table, cards } = createRenderer(mode);
    const visibility = state.visibility[mode];
    for (let column = 0; column < table.columns.length; column++) {
      visibility[column] = false;
      context.renderCards();
      const card = cards.children[0];
      const nodes = descendants(card);
      assert.equal(
        nodes.find(node => node.dataset.copyText !== undefined).dataset.copyText,
        expectedCopy(mode, table.rows[0], visibility)
      );
      assert.equal(nodes.some(node => node.className === 'reference-card-title'), column !== 0);
      assert.equal(nodes.some(node => node.dataset.playMode), column !== table.columns.length - 1);
      if (column > 0 && column < table.columns.length - 1) {
        const title = context.getCardLabel(mode, table.columns[column]);
        assert.ok(!nodes.some(node => node.title === title), `Hidden ${title} still rendered`);
      }
      visibility[column] = true;
    }
  });

  test(`${mode} cards preserve descending order and can render with every column hidden`, () => {
    const { context, state, table, cards } = createRenderer(mode);
    state.sort = 'desc';
    context.renderCards();
    assert.equal(
      descendants(cards.children[0]).find(node => node.dataset.copyText !== undefined).dataset.copyText,
      expectedCopy(mode, table.rows.at(-1), state.visibility[mode])
    );
    state.visibility[mode].fill(false);
    context.renderCards();
    cards.children.forEach(card => {
      const nodes = descendants(card);
      assert.equal(nodes.length, 1);
      assert.equal(nodes[0].attributes['aria-label'], 'Copy');
      assert.equal(nodes[0].dataset.copyText, '');
    });
  });

  test(`${mode} standard table retains all data and respects column visibility`, () => {
    const { context, state, table, elements } = createRenderer(mode);
    context.renderTable();
    const headers = elements.get('header-row');
    const rows = elements.get('resultTable');
    assert.deepEqual(headers.children.map(cell => cell.dataset.columnLabel), Array.from(table.columns));
    assert.equal(rows.children.length, table.rows.length);
    rows.children.forEach((row, index) => {
      assert.equal(row.children.length, table.columns.length);
      row.children.forEach((cell, column) => {
        const expected = table.rows[index][column];
        assert.equal(expected.html ? cell.innerHTML : cell.textContent, expected.html || expected.text);
      });
    });
    state.visibility[mode][1] = false;
    context.renderTable();
    assert.equal(headers.children.length, table.columns.length - 1);
    assert.equal(rows.children[0].children.length, table.columns.length - 1);
  });
}

test('initial column icons match BPM mode before the first update', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'tools', 'reference.php'), 'utf8');
  const buttons = [...template.matchAll(/<button id="toggle-col-(\d+)-button"[^>]*>\s*<svg[^>]*>\s*<use href="([^"]+)"/g)];
  assert.equal(buttons.length, columnIcons.bpm.length);
  buttons.forEach(([, index, href]) => {
    assert.equal(href, `/icons.svg#${columnIcons.bpm[Number(index) - 1]}`);
  });
});

test('Formula uses a shared monochrome geometry icon without font dependencies', () => {
  const symbol = spriteSource.match(/<symbol id="formula" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/);
  assert.ok(symbol, 'The formula icon must exist in the shared sprite');
  assert.equal(symbol[1], '0 0 512 512');
  assert.match(symbol[2], /<path\b/);
  assert.doesNotMatch(symbol[2], /\b(?:fill|stroke|style)\s*=|<text\b/);
});

test('MIDI uses a shared monochrome five-pin connector icon', () => {
  const symbol = spriteSource.match(/<symbol id="midi" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/);
  assert.ok(symbol, 'The MIDI icon must exist in the shared sprite');
  assert.equal(symbol[1], '0 0 512 512');
  assert.equal([...symbol[2].matchAll(/<circle\b/g)].length, 5);
  assert.match(symbol[2], /<rect\b/);
  assert.doesNotMatch(symbol[2], /\b(?:fill|stroke|style)\s*=|<text\b/);
});

test('card labels resolve title-case column names to their intended labels', () => {
  const { context } = createRenderer('scales');
  assert.equal(context.getCardLabel('scales', 'Intervals'), 'Interval');
  assert.equal(context.getCardLabel('bpm', 'Half'), 'Half');
  assert.equal(context.getCardLabel('notes', 'Hz'), 'Hz');
});

test('Tempi previews use the midpoint of each shared range with the existing BPM player', () => {
  const { context, table } = createRenderer('tempi');
  const tempi = vm.runInContext('italianTempi', context);
  assert.equal(table.rows.length, 11);
  table.rows.forEach((row, index) => {
    const tempo = tempi[index];
    assert.equal(row[0].text, tempo.name);
    assert.equal(row[1].text, `${tempo.min}-${tempo.max}`);
    assert.equal(row[2].playMode, 'bpm');
    assert.equal(row[2].playPayload.bpm, (tempo.min + tempo.max) / 2);
  });
});

test('existing saved settings enable all new Tempi columns without changing other modes', () => {
  const { context, state } = createRenderer('bpm', {
    'reference.mode': 'scales',
    'reference.column_visibility': JSON.stringify({ bpm: [false, true], scales: [true, false] })
  });
  context.loadSettings();
  assert.equal(state.activeMode, 'scales');
  assert.deepEqual(Array.from(state.visibility.tempi), [true, true, true]);
  assert.equal(state.visibility.bpm[0], false);
  assert.equal(state.visibility.scales[1], false);
});

test('Tempi mode, view, sort and column settings survive reload and reset to existing defaults', () => {
  const { context, state, storage } = createRenderer('tempi');
  state.view = 'cards';
  state.sort = 'desc';
  state.visibility.tempi[1] = false;
  context.saveSettings();
  const restored = createRenderer('bpm', Object.fromEntries(storage));
  restored.context.loadSettings();
  assert.equal(restored.state.activeMode, 'tempi');
  assert.equal(restored.state.view, 'cards');
  assert.equal(restored.state.sort, 'desc');
  assert.deepEqual(Array.from(restored.state.visibility.tempi), [true, false, true]);
  restored.context.resetReference();
  assert.equal(restored.state.activeMode, 'bpm');
  assert.equal(restored.state.view, 'table');
  assert.equal(restored.state.sort, 'asc');
  assert.deepEqual(Array.from(restored.state.visibility.tempi), [true, true, true]);
  assert.equal(restored.storage.get('reference.mode'), 'bpm');
});
