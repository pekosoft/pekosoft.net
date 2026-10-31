const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'reference.js'), 'utf8');
const tempiSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'tempi.js'), 'utf8');
const cablesSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'cables.js'), 'utf8');
const renderSource = source.slice(0, source.indexOf("modeButtons.bpm.addEventListener('click'"));
const spriteSource = fs.readFileSync(path.join(__dirname, '..', 'icons.svg'), 'utf8');
const spriteIcons = new Set([...spriteSource.matchAll(/<symbol id="([^"]+)"/g)].map(match => match[1]));
const columnIcons = {
  bpm: ['bpm', 'text', 'plus_minus', 'triangle_down', 'triangle_up', 'triplet', '1_4_dotted', 'clock', 'pulse', 'play'],
  tempi: ['italy', 'bpm', 'play'],
  notes: ['tuner', 'arrow_up_down', 'mic', 'midi', 'wavelength', 'cm', 'piano', 'play'],
  scales: ['timeline', 'ruler', 'quantized_steps', 'letter_c', 'table_rows', 'play'],
  chords: ['value', 'formula', 'piano', 'letter_c', 'table_rows', 'play'],
  prefixes: ['text', 'value', 'formula', 'value', 'text'],
  cables: ['connector', 'connector', 'table_rows', 'text', 'calendar', 'connector', 'value', 'wavelength', 'pulse', 'asterisk', 'mic', 'asterisk', 'ruler', 'asterisk', 'asterisk', 'asterisk', 'table_rows', 'external']
};

function createRenderer(mode, savedSettings = {}, href = 'https://pekosoft.net/reference') {
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
        const tableTitles = {
          bpm: 'BPM', tempi: 'Italian tempi', notes: 'Notes', scales: 'Scales',
          chords: 'Chords', prefixes: 'Metric prefixes', cables: 'Cables'
        };
        const tableMode = id.match(/^table-(.+)-button$/)?.[1];
        if (tableMode) node.title = tableTitles[tableMode];
        if (/^toggle-col-\d+-button$/.test(id)) {
          const icon = element();
          node.querySelector = selector => selector === 'use' ? icon
            : selector === '.button-text' ? document.getElementById(id.replace('-button', '-text')) : null;
        }
        elements.set(id, node);
      }
      return elements.get(id);
    },
    querySelector: () => element(),
    querySelectorAll: () => Array.from({ length: 18 }, (_, index) => document.getElementById(`toggle-col-${index + 1}-button`)),
    createElement: element
  };
  const storage = new Map(Object.entries(savedSettings));
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  };
  const location = { href };
  const history = {
    state: { existing: true },
    replaceState(state, title, url) { this.state = state; location.href = url; }
  };
  const warnings = [];
  const context = vm.createContext({
    document, localStorage, URL, window: { location, history },
    console: { warn: (...args) => warnings.push(args) }
  });
  vm.runInContext(tempiSource, context);
  vm.runInContext(cablesSource, context);
  vm.runInContext(renderSource, context);
  const state = vm.runInContext('state', context);
  const tables = vm.runInContext('TABLES', context);
  state.activeMode = mode;
  return { context, state, table: tables[mode], cards: elements.get('cards-view'), elements, storage, location, history, warnings };
}

for (const mode of Object.keys(columnIcons)) {
  test(`${mode} direct links override the saved table and retain other preferences`, () => {
    const { context, state, location, history } = createRenderer('bpm', {
      'reference.mode': 'notes', 'reference.view': 'cards', 'reference.sort': 'desc'
    }, `https://pekosoft.net/reference?other=kept&a=${mode}#section`);
    context.loadSettings();
    context.updateReferenceUrl();
    assert.equal(state.activeMode, mode);
    assert.equal(state.view, 'cards');
    assert.equal(state.sort, 'desc');
    assert.equal(location.href, `https://pekosoft.net/reference?other=kept&a=${mode}#section`);
    assert.deepEqual(history.state, { existing: true });
    context.setMode('cables');
    assert.equal(context.document.title, 'Pekosoft - Reference - Cables');
    assert.equal(new URL(location.href).searchParams.get('a'), 'cables');
    assert.equal(new URL(location.href).searchParams.get('other'), 'kept');
    assert.equal(new URL(location.href).hash, '#section');
  });
}

test('Reference without a requested table retains the saved selection in its share URL', () => {
  const { context, state, location } = createRenderer('bpm', { 'reference.mode': 'prefixes' });
  context.loadSettings();
  context.updateReferenceUrl();
  assert.equal(state.activeMode, 'prefixes');
  assert.equal(location.href, 'https://pekosoft.net/reference?a=prefixes');
});

for (const requested of ['missing', '', 'constructor', '__proto__']) {
  test(`Reference reports invalid table ${JSON.stringify(requested)} and uses the saved selection`, () => {
    const { context, state, location, warnings } = createRenderer('bpm', {
      'reference.mode': 'notes'
    }, `https://pekosoft.net/reference?a=${requested}`);
    context.loadSettings();
    context.updateReferenceUrl();
    assert.equal(state.activeMode, 'notes');
    assert.equal(warnings.length, 1);
    assert.equal(location.href, 'https://pekosoft.net/reference?a=notes');
  });
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
    prefixes: [0, 1, 2, 3, 4],
    cables: Array.from({ length: 17 }, (_, index) => index + 1)
  };
  const bpmLabels = { 3: 'Half', 4: 'Double', 5: 'Triplet', 6: 'Dotted', 7: 'SPB', 8: 'BPS' };
  return order[mode]
    .filter(index => visibility[index] !== false)
    .map(index => {
      if (mode === 'bpm' && bpmLabels[index]) return `${bpmLabels[index]}: ${row[index].text}`;
      if (mode === 'tempi' && index === 1) return `BPM: ${row[index].text}`;
      if (mode === 'prefixes' && index > 0) return `${['Prefix', 'Symbol', 'Power', 'Multiplier', 'Writing'][index]}: ${row[index].text}`;
      if (mode === 'cables' && index > 1) {
        const columns = ['Icon', 'Cable', 'Family', 'Version', 'Year', 'Connectors', 'Contacts', 'Signal', 'Rate', 'Video', 'Audio', 'Power', 'Length', 'Impedance', 'Shielding', 'Compatibility', 'Notes', 'Source'];
        return `${columns[index]}: ${row[index].text}`;
      }
      return row[index].text;
    })
    .join('\n');
}

for (const mode of ['bpm', 'tempi', 'notes', 'scales', 'chords', 'prefixes', 'cables']) {
  test(`${mode} toggles retain existing SVG references in both views`, () => {
    const { context, state, table, elements } = createRenderer(mode);
    context.updateColumnButtons();
    const icons = Array.from({ length: 18 }, (_, index) => elements.get(`toggle-col-${index + 1}-button`).querySelector('use'));
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
    for (let index = 0; index < 18; index++) {
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
      const titleIndex = table.titleColumn || 0;
      assert.equal(heading.innerHTML, row[titleIndex].html || row[titleIndex].text);
      const values = nodes.filter(node => node.textContent !== undefined).map(node => node.textContent);
      const playColumnIndex = table.columns.indexOf('Play');
      row.slice(titleIndex + 1, playColumnIndex === -1 ? undefined : playColumnIndex).forEach(cell => {
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
      assert.equal(nodes.some(node => node.className === 'reference-card-title'), column !== (table.titleColumn || 0));
      if (mode === 'cables') {
        assert.equal(nodes.some(node => node.className === 'reference-card-icon'), column !== 0);
      }
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
  const icons = [...template.match(/\$columnIcons = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(icons, columnIcons.bpm);
  const capacity = Number(template.match(/\$columnNumber <= (\d+)/)[1]);
  assert.equal(capacity, createRenderer('cables').table.columns.length);
  assert.match(template, /\$columnIcons\[\$columnNumber - 1\] \?\? 'asterisk'/);
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
  assert.equal(restored.location.href, 'https://pekosoft.net/reference?a=bpm');
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

test('Cables provides at least 140 unique sourced rows with 18 complete columns', () => {
  const { table } = createRenderer('cables');
  assert.equal(table.columns.length, 18);
  assert.ok(table.rows.length >= 140, `Only ${table.rows.length} cable rows`);
  const names = new Set();
  table.rows.forEach(row => {
    assert.equal(row.length, table.columns.length);
    assert.ok(!names.has(row[1].text), `Duplicate ${row[1].text}`);
    names.add(row[1].text);
    row.forEach(cell => assert.ok(typeof cell.text === 'string' && cell.text.length > 0));
    assert.match(row[17].text, /^https:\/\//);
    assert.match(row[17].html, /rel="noopener"/);
    const icons = [...row[0].html.matchAll(/href="\/icons\.svg#([^"]+)"/g)];
    assert.ok(icons.length > 0);
    icons.forEach(([, icon]) => assert.ok(spriteIcons.has(icon), `Missing ${icon}`));
  });
});

test('Cables includes every listed USB, HDMI, DisplayPort and Thunderbolt revision', () => {
  const { table } = createRenderer('cables');
  const names = new Set(Array.from(table.rows, row => row[1].text));
  const expected = [
    'USB 1.0 Low-Speed', 'USB 1.0 Full-Speed', 'USB 1.1 Low-Speed', 'USB 1.1 Full-Speed',
    'USB 2.0 High-Speed', 'USB 3.0 SuperSpeed', 'USB 3.1 Gen 1', 'USB 3.1 Gen 2',
    'USB 3.2 Gen 1x1', 'USB 3.2 Gen 1x2', 'USB 3.2 Gen 2x1', 'USB 3.2 Gen 2x2',
    'USB4 20Gbps', 'USB4 40Gbps', 'USB4 80Gbps', 'USB4 asymmetric',
    'HDMI 1.0', 'HDMI 1.1', 'HDMI 1.2', 'HDMI 1.2a', 'HDMI 1.3', 'HDMI 1.3a',
    'HDMI 1.3b', 'HDMI 1.3b1', 'HDMI 1.3c', 'HDMI 1.4', 'HDMI 1.4a', 'HDMI 1.4b',
    'HDMI 2.0', 'HDMI 2.0a', 'HDMI 2.0b', 'HDMI 2.1', 'HDMI 2.1a', 'HDMI 2.1b', 'HDMI 2.2',
    'DisplayPort 1.0', 'DisplayPort 1.1', 'DisplayPort 1.1a', 'DisplayPort 1.2', 'DisplayPort 1.2a',
    'DisplayPort 1.3', 'DisplayPort 1.4', 'DisplayPort 1.4a', 'DisplayPort 2.0',
    'DisplayPort 2.1', 'DisplayPort 2.1a', 'DisplayPort 2.1b',
    'Thunderbolt 1', 'Thunderbolt 2', 'Thunderbolt 3', 'Thunderbolt 4', 'Thunderbolt 5'
  ];
  expected.forEach(name => assert.ok(names.has(name), `Missing ${name}`));
});

test('Cables distinguishes signaling rates, asymmetric bandwidth and independent power ratings', () => {
  const { table } = createRenderer('cables');
  const rows = new Map(Array.from(table.rows, row => [row[1].text, row.slice(1)]));
  assert.equal(rows.get('USB4 asymmetric')[7].text, '120 / 40 Gb/s');
  assert.equal(rows.get('HDMI 2.2')[7].text, '96 Gb/s');
  assert.equal(rows.get('DisplayPort 1.2')[7].text, '21.6 Gb/s');
  assert.match(rows.get('DisplayPort 1.2')[15].text, /17.28 Gb\/s payload/);
  assert.equal(rows.get('Thunderbolt 5')[7].text, '80 Gb/s, boost 120 / 40 Gb/s');
  assert.match(rows.get('USB Type-C')[15].text, /independent/);
  assert.match(rows.get('USB Power Delivery 3.1')[10].text, /240 W/);
  assert.match(rows.get('MIDI DIN')[9].text, /no audio samples/);
});

test('Cables column preferences beyond ten survive reload and Reset without affecting old modes', () => {
  const original = createRenderer('cables', {
    'reference.column_visibility': JSON.stringify({ bpm: [false], prefixes: [true, false] })
  });
  original.context.loadSettings();
  assert.equal(original.state.visibility.bpm[0], false);
  assert.equal(original.state.visibility.prefixes[1], false);
  assert.equal(original.state.visibility.cables.length, 18);
  assert.ok(original.state.visibility.cables.every(Boolean));
  original.state.view = 'cards';
  original.state.sort = 'desc';
  original.context.toggleColumn(17);
  const restored = createRenderer('bpm', Object.fromEntries(original.storage));
  restored.context.loadSettings();
  assert.equal(restored.state.activeMode, 'cables');
  assert.equal(restored.state.view, 'cards');
  assert.equal(restored.state.sort, 'desc');
  assert.equal(restored.state.visibility.cables[17], false);
  assert.equal(restored.state.visibility.bpm[0], false);
  restored.context.resetReference();
  assert.equal(restored.state.activeMode, 'bpm');
  assert.equal(restored.state.view, 'table');
  assert.equal(restored.state.sort, 'asc');
  assert.ok(restored.state.visibility.cables.every(Boolean));
});

test('Cables uses readable default widths, preserves resizing and does not leak widths to other modes', () => {
  const { context, state, elements, table } = createRenderer('cables');
  assert.equal(table.widths.length, table.columns.length);
  context.renderTable();
  const headers = elements.get('header-row');
  const notes = () => headers.children.find(header => header.dataset.columnLabel === 'Notes');
  assert.equal(notes().style.width, '54ch');
  notes().dataset.columnWidth = '520';
  context.renderTable();
  assert.equal(notes().style.width, '520px');
  state.activeMode = 'chords';
  context.renderTable();
  assert.equal(notes().style.width, undefined);
  notes().dataset.columnWidth = '110';
  state.activeMode = 'cables';
  context.renderTable();
  assert.equal(notes().style.width, '54ch');
});

test('starting in Cables cards creates headers for the shared table-resizing controller', () => {
  const { context, state, elements, cards, table } = createRenderer('cables');
  state.view = 'cards';
  context.renderView();
  assert.equal(cards.children.length, table.rows.length);
  assert.equal(elements.get('header-row').cells.length, 18);
  state.view = 'table';
  context.renderView();
  assert.equal(elements.get('header-row').cells.length, 18);
  assert.equal(elements.get('resultTable').children.length, table.rows.length);
});

test('the leading Icon preserves old cable visibility preferences and stays out of copied text', () => {
  const visibility = Array(17).fill(true);
  visibility[0] = false;
  visibility[16] = false;
  const { context, state, cards } = createRenderer('cables', {
    'reference.column_visibility': JSON.stringify({ cables: visibility })
  });
  context.loadSettings();
  assert.equal(state.visibility.cables.length, 18);
  assert.equal(state.visibility.cables[0], true);
  assert.equal(state.visibility.cables[1], false);
  assert.equal(state.visibility.cables[17], false);
  context.renderCards();
  const nodes = descendants(cards.children[0]);
  assert.ok(nodes.some(node => node.className === 'reference-card-icon'));
  assert.ok(!nodes.some(node => node.className === 'reference-card-title'));
  const copy = nodes.find(node => node.dataset.copyText !== undefined);
  assert.doesNotMatch(copy.dataset.copyText, /Icon:|Connector\n|Source:/);
});

test('Cables uses the shared connector sprite and never wraps table text', () => {
  const symbol = spriteSource.match(/<symbol id="connector" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/);
  assert.ok(symbol);
  assert.equal(symbol[1], '0 0 512 512');
  assert.match(symbol[2], /<path/);
  assert.doesNotMatch(symbol[2], /<text|\b(?:fill|stroke|style)=/);
  const template = fs.readFileSync(path.join(__dirname, '..', 'tools', 'reference.php'), 'utf8');
  assert.match(template, /id="table-cables-button"[\s\S]*?href="\/icons.svg#connector"/);
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'reference.css'), 'utf8');
  assert.doesNotMatch(css, /table\[data-reference-mode="cables"\][^{]*\{[^}]*white-space:\s*normal/);
  assert.match(css, /#tool-container th,\s*#tool-container td\s*\{\s*white-space:\s*nowrap/);
});

test('cable icons identify their respective connectors instead of one generic plug', () => {
  const { table } = createRenderer('cables');
  const rows = new Map(Array.from(table.rows, row => [row[1].text, row]));
  const expected = {
    'USB 1.0 Full-Speed': ['connector', 'connector_usb_b'],
    'USB Mini-A': ['connector_usb_mini'],
    'USB Mini-B': ['connector_usb_mini'],
    'USB Micro-A': ['connector_usb_micro'],
    'USB Micro-B': ['connector_usb_micro'],
    'USB Battery Charging': ['connector', 'connector_usb_b', 'connector_usb_micro'],
    'USB Power Delivery 1.0': ['connector', 'connector_usb_b'],
    'USB Type-C': ['connector_usb_c'],
    'USB4 80Gbps': ['connector_usb_c'],
    'HDMI 2.2': ['connector_hdmi'],
    'DisplayPort 2.1b': ['connector_displayport'],
    'Thunderbolt 5': ['connector_usb_c'],
    'Category 6A': ['connector_rj45'],
    'Category 7': ['connector_gg45', 'connector_tera'],
    '6.35 mm TS': ['connector_jack_ts'],
    '6.35 mm TRS balanced': ['connector_jack_trs'],
    '3.5 mm TRRS CTIA': ['connector_jack_trrs'],
    '4.4 mm balanced headphones': ['connector_jack_trrrs'],
    'XLR microphone / line': ['connector_xlr'],
    'XLR stereo microphone': ['connector_xlr_5'],
    'XLR balanced headphones': ['connector_xlr_4'],
    'RCA audio': ['connector_rca'],
    'S/PDIF coaxial': ['connector_rca'],
    'ADAT Lightpipe': ['connector_toslink'],
    'MADI optical': ['connector_fiber'],
    'Word clock': ['connector_bnc'],
    'MIDI DIN': ['midi'],
    'MIDI TRS Type A': ['connector_jack_trs', 'midi'],
    'DMX512': ['connector_xlr_5'],
    'VGA': ['connector_vga'],
    'DVI-D dual-link': ['connector_dvi'],
    'SCART': ['connector_scart'],
    'S-Video': ['connector_din_4'],
    'PS/2': ['connector_din'],
    'SATA III': ['connector_sata'],
    'FireWire 800': ['connector_firewire'],
    'RS-232 serial': ['connector_db25', 'connector_de9'],
    'speakON 4-pole': ['connector_speaker'],
    'Banana speaker cable': ['connector_banana'],
    'Speaker wire': ['connector_binding']
  };
  Object.entries(expected).forEach(([name, icons]) => {
    const actual = [...rows.get(name)[0].html.matchAll(/href="\/icons\.svg#([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(actual, icons, name);
  });
  const symbols = [...spriteSource.matchAll(/<symbol id="(connector[^"]*)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)];
  symbols.forEach(([, id, viewBox, geometry]) => {
    assert.equal(viewBox, '0 0 512 512', id);
    assert.doesNotMatch(geometry, /<text|\b(?:fill|stroke|style)=/, id);
  });
  const ids = symbols.map(match => match[1]);
  assert.deepEqual(ids, [...ids].sort());
});
