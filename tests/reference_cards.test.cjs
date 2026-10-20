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
  chords: ['value', 'formula', 'piano', 'letter_c', 'table_rows', 'play'],
  prefixes: ['text', 'value', 'formula', 'value', 'text']
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
    chords: [0, 1, 2, 3, 4],
    prefixes: [0, 1, 2, 3, 4]
  };
  const bpmLabels = { 3: 'Half', 4: 'Double', 5: 'Triplet', 6: 'Dotted', 7: 'SPB', 8: 'BPS' };
  return order[mode]
    .filter(index => visibility[index] !== false)
    .map(index => {
      if (mode === 'bpm' && bpmLabels[index]) return `${bpmLabels[index]}: ${row[index].text}`;
      if (mode === 'tempi' && index === 1) return `BPM: ${row[index].text}`;
      if (mode === 'prefixes' && index > 0) return `${['Prefix', 'Symbol', 'Power', 'Multiplier', 'Writing'][index]}: ${row[index].text}`;
      return row[index].text;
    })
    .join('\n');
}

for (const mode of ['bpm', 'tempi', 'notes', 'scales', 'chords', 'prefixes']) {
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

  test(`${mode} cards render and copy every table value with Play only where available`, () => {
    const { context, state, table, cards } = createRenderer(mode);
    context.renderCards();
    assert.equal(cards.children.length, table.rows.length);
    cards.children.forEach((card, rowIndex) => {
      const row = table.rows[rowIndex];
      const nodes = descendants(card);
      const heading = nodes.find(node => node.className === 'reference-card-title');
      assert.equal(heading.innerHTML, row[0].html || row[0].text);
      const values = nodes.filter(node => node.textContent !== undefined).map(node => node.textContent);
      const playColumnIndex = table.columns.indexOf('Play');
      row.slice(1, playColumnIndex === -1 ? undefined : playColumnIndex).forEach(cell => {
        const value = cell.html ? cell.html.replace(/<[^>]*>/g, '') : cell.text;
        assert.ok(values.some(text => text === value || text.endsWith(`: ${value}`)), `Missing ${cell.text}`);
      });
      const copy = nodes.find(node => node.dataset.copyText !== undefined);
      assert.equal(copy.dataset.copyText, expectedCopy(mode, row, state.visibility[mode]));
      const play = nodes.find(node => node.dataset.playMode);
      if (playColumnIndex === -1) {
        assert.equal(play, undefined);
        return;
      }
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
      const playColumnIndex = table.columns.indexOf('Play');
      assert.equal(nodes.some(node => node.dataset.playMode), playColumnIndex !== -1 && column !== playColumnIndex);
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

test('Metric prefixes contain all 24 SI names and case-sensitive symbols plus the unprefixed unit', () => {
  const { table } = createRenderer('prefixes');
  const expected = [
    ['quecto', 'q', -30], ['ronto', 'r', -27], ['yocto', 'y', -24],
    ['zepto', 'z', -21], ['atto', 'a', -18], ['femto', 'f', -15],
    ['pico', 'p', -12], ['nano', 'n', -9], ['micro', '\u00b5', -6],
    ['milli', 'm', -3], ['centi', 'c', -2], ['deci', 'd', -1],
    ['No prefix', '-', 0],
    ['deca', 'da', 1], ['hecto', 'h', 2], ['kilo', 'k', 3],
    ['mega', 'M', 6], ['giga', 'G', 9], ['tera', 'T', 12],
    ['peta', 'P', 15], ['exa', 'E', 18], ['zetta', 'Z', 21],
    ['yotta', 'Y', 24], ['ronna', 'R', 27], ['quetta', 'Q', 30]
  ];
  assert.equal(table.rows.length, expected.length);
  table.rows.forEach((row, index) => {
    const [name, symbol, exponent] = expected[index];
    assert.equal(row[0].text, name);
    assert.equal(row[1].text, symbol);
    assert.equal(row[2].text, `10^${exponent}`);
    assert.equal(row[2].html, `10<sup>${exponent}</sup>`);
    const multiplier = row[3].text;
    if (exponent < 0) {
      assert.match(multiplier, /^0\.\d+$/);
      assert.equal(multiplier.length, 2 - exponent);
      assert.equal(BigInt(multiplier.replace('.', '')), 1n);
    } else {
      assert.equal(BigInt(multiplier), 10n ** BigInt(exponent));
    }
  });
});

test('all metric prefix names link to Wikipedia in tables and cards without linking the unprefixed unit', () => {
  const { context, table, cards, elements } = createRenderer('prefixes');
  const articles = [
    'Quecto-', 'Ronto-', 'Yocto-', 'Zepto-', 'Atto-', 'Femto-', 'Pico-', 'Nano-',
    'Micro-', 'Milli-', 'Centi-', 'Deci-', null, 'Deca-', 'Hecto-', 'Kilo-',
    'Mega-', 'Giga-', 'Tera-', 'Peta-', 'Exa-', 'Zetta-', 'Yotta-', 'Ronna-', 'Quetta-'
  ];
  context.renderTable();
  context.renderCards();
  articles.forEach((article, index) => {
    const cell = table.rows[index][0];
    const tableCell = elements.get('resultTable').children[index].children[0];
    const heading = descendants(cards.children[index]).find(node => node.className === 'reference-card-title');
    if (article === null) {
      assert.equal(cell.html, undefined);
      assert.equal(tableCell.textContent, 'No prefix');
      assert.equal(heading.innerHTML, 'No prefix');
      return;
    }
    const expected = `<a href="https://en.wikipedia.org/wiki/${article}" target="wiki">${cell.text}</a>`;
    assert.equal(cell.html, expected);
    assert.equal(tableCell.innerHTML, expected);
    assert.equal(heading.innerHTML, expected);
    const copy = descendants(cards.children[index]).find(node => node.dataset.copyText !== undefined);
    assert.ok(copy.dataset.copyText.startsWith(`${cell.text}\n`));
    assert.doesNotMatch(copy.dataset.copyText, /<a|https:/);
  });
});

test('existing saved settings enable every new prefix column without changing the active mode', () => {
  const { context, state } = createRenderer('bpm', {
    'reference.mode': 'notes',
    'reference.column_visibility': JSON.stringify({ notes: [true, false] })
  });
  context.loadSettings();
  assert.equal(state.activeMode, 'notes');
  assert.equal(state.visibility.notes[1], false);
  assert.deepEqual(Array.from(state.visibility.prefixes), [true, true, true, true, true]);
});

test('Metric text columns have readable default widths and preserve resized widths', () => {
  const { context, elements } = createRenderer('prefixes');
  context.renderTable();
  const headers = elements.get('header-row');
  const multiplier = headers.children.find(header => header.dataset.columnLabel === 'Multiplier');
  assert.equal(multiplier.style.width, '36ch');
  const writing = headers.children.find(header => header.dataset.columnLabel === 'Writing');
  assert.equal(writing.style.width, '16ch');
  multiplier.dataset.columnWidth = '480';
  writing.dataset.columnWidth = '240';
  context.renderTable();
  assert.equal(headers.children.find(header => header.dataset.columnLabel === 'Multiplier').style.width, '480px');
  assert.equal(headers.children.find(header => header.dataset.columnLabel === 'Writing').style.width, '240px');
});

test('Metric prefixes settings survive reload and reset with the other Reference modes', () => {
  const { context, state, storage } = createRenderer('prefixes');
  state.view = 'cards';
  state.sort = 'desc';
  state.visibility.prefixes[2] = false;
  state.visibility.prefixes[4] = false;
  context.saveSettings();
  const restored = createRenderer('bpm', Object.fromEntries(storage));
  restored.context.loadSettings();
  assert.equal(restored.state.activeMode, 'prefixes');
  assert.equal(restored.state.view, 'cards');
  assert.equal(restored.state.sort, 'desc');
  assert.deepEqual(Array.from(restored.state.visibility.prefixes), [true, true, false, true, false]);
  restored.context.resetReference();
  assert.equal(restored.state.activeMode, 'bpm');
  assert.equal(restored.state.view, 'table');
  assert.equal(restored.state.sort, 'asc');
  assert.deepEqual(Array.from(restored.state.visibility.prefixes), [true, true, true, true, true]);
});

test('every metric multiplier has capitalized Writing in the English short scale including fractions and unity', () => {
  const { table } = createRenderer('prefixes');
  const expected = [
    'Nonillionth', 'Octillionth', 'Septillionth', 'Sextillionth', 'Quintillionth',
    'Quadrillionth', 'Trillionth', 'Billionth', 'Millionth', 'Thousandth',
    'Hundredth', 'Tenth', 'One', 'Ten', 'Hundred', 'Thousand', 'Million',
    'Billion', 'Trillion', 'Quadrillion', 'Quintillion', 'Sextillion',
    'Septillion', 'Octillion', 'Nonillion'
  ];
  assert.equal(table.columns[4], 'Writing');
  assert.equal(table.aligns[4], 'left');
  assert.deepEqual(Array.from(table.rows, row => row[4].text), expected);
});

test('four-column prefix preferences enable Writing while preserving every existing column preference', () => {
  const { context, state } = createRenderer('bpm', {
    'reference.mode': 'prefixes',
    'reference.column_visibility': JSON.stringify({ prefixes: [false, true, false, true] })
  });
  context.loadSettings();
  assert.equal(state.activeMode, 'prefixes');
  assert.deepEqual(Array.from(state.visibility.prefixes), [false, true, false, true, true]);
});
