const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules.js'), 'utf8');
const configSource = source.slice(source.indexOf('const moduleConfig ='), source.indexOf('function syncModuleMoreButtonState('));
const panelSource = source.slice(source.indexOf('function createModuleIconPanel('), source.indexOf('function setupModuleTabSkipButtons('));
const skipSource = source.slice(source.indexOf('function setupModuleTabSkipButtons('), source.indexOf('function setupModuleTabTitle('));
const titleSource = source.slice(source.indexOf('function setupModuleTabTitle('), source.indexOf('function setupModuleHeader('));

const tabGroups = [
  { file: 'tools\\reference.php', module: 'tool', title: 'Instrument', tabs: [
    ['table-bpm-button', 'BPM'], ['table-tempi-button', 'Italian Tempi'], ['table-notes-button', 'Notes'],
    ['table-scales-button', 'Scales'], ['table-chords-button', 'Chords']
  ] },
  { file: 'meters.php', module: 'meters', title: 'Meters', tabs: [
    ['tool-spectroscope-button', 'Spectroscope'], ['tool-level-button', 'Level meter'],
    ['tool-oscilloscope-button', 'Oscilloscope'], ['tool-wavescope-button', 'Wavescope'],
    ['tool-phasescope-button', 'Phasescope']
  ] },
  { file: 'tools\\player.php', module: 'panel', title: 'Panel', tabs: [
    ['panel-meta-button', 'Meta'], ['panel-input-button', 'Input'], ['panel-playlist-button', 'Playlist']
  ] },
  { file: 'tools\\metronome.php', module: 'panel', title: 'Panel', tabs: [
    ['panel-beats-button', 'Beats'], ['panel-tempi-button', 'Italian Tempi']
  ] },
  { file: 'tools\\icons.php', module: 'panel', title: 'Panel', tabs: [
    ['panel-current-button', 'Current'], ['panel-all-button', 'All']
  ] },
  { file: 'tools\\bpm_circle.php', module: 'panel', title: 'Panel', tabs: [
    ['info-display-selected-button', 'Selected'], ['info-display-active-button', 'Active'], ['info-display-all-button', 'All']
  ] },
  { file: 'tools\\bpm_curve.php', module: 'panel', title: 'Panel', tabs: [
    ['panel-curve-button', 'Curve'], ['panel-values-button', 'Values']
  ] },
  { file: 'tools\\audio_calculator.php', module: 'panel', title: 'Panel', tabs: [
    ['info-display-selected-button', 'Selected'], ['info-display-all-button', 'All'], ['info-display-points-button', 'Points']
  ] }
];

function createTitleUpdater(id, labels, selected = 0) {
  const observers = [];
  const buttons = labels.map((label, index) => ({
    active: index === selected,
    dataset: { moduleTab: label },
    classList: { contains: name => name === 'button-on' && buttons[index].active }
  }));
  let title = '';
  let writes = 0;
  const titleElement = {
    get textContent() { return title; },
    set textContent(value) { title = value; writes++; }
  };
  const container = {
    id: `${id}-container`,
    querySelectorAll: () => buttons,
    querySelector: () => titleElement
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
    observe(target, options) { this.targets.push({ target, options }); }
  }
  const context = vm.createContext({ MutationObserver });
  vm.runInContext(configSource + titleSource, context);
  context.setupModuleTabTitle(container);
  return {
    buttons, observers, titleElement, writes: () => writes,
    select(index) {
      buttons.forEach((button, current) => { button.active = current === index; });
      observers.forEach(observer => observer.callback());
    }
  };
}

for (const group of tabGroups) {
  test(`${group.file} declares every content tab and updates its ${group.title} title`, () => {
    const template = fs.readFileSync(path.join(__dirname, '..', ...group.file.split('\\')), 'utf8');
    const tabs = Array.from(template.matchAll(/<button\b[^>]*\bid="([^"]+)"[^>]*\bdata-module-tab="([^"]+)"/g),
      match => [match[1], match[2]]);
    assert.deepEqual(tabs, group.tabs);
    const updater = createTitleUpdater(group.module, tabs.map(([, label]) => label));
    assert.equal(updater.titleElement.textContent, `${group.title}: ${tabs[0][1]}`);
    tabs.forEach(([, label], index) => {
      updater.select(index);
      assert.equal(updater.titleElement.textContent, `${group.title}: ${label}`);
    });
    updater.select(0);
    assert.equal(updater.titleElement.textContent, `${group.title}: ${tabs[0][1]}`);
  });
}

test('tab-button labels name their content without Show or view', () => {
  const tabIds = new Set(tabGroups.flatMap(group => group.tabs.map(([id]) => id)));
  [
    'playlist-presets-button', 'playlist-custom-button',
    'tool-mode-all-button', 'tool-mode-single-button',
    'piano-range-one-button', 'piano-range-two-button'
  ].forEach(id => tabIds.add(id));
  const toolsDirectory = path.join(__dirname, '..', 'tools');
  const files = fs.readdirSync(toolsDirectory)
    .filter(file => file.endsWith('.php'))
    .map(file => path.join(toolsDirectory, file));
  files.push(path.join(__dirname, '..', 'meters.php'));
  const checkedIds = new Set();
  for (const file of files) {
    const template = fs.readFileSync(file, 'utf8');
    for (const [, attributes, content] of template.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
      const id = attributes.match(/\bid="([^"]+)"/)?.[1];
      if (!tabIds.has(id) && !/\b(?:data-module-tab|data-panel-view)=|\brole="tab"/.test(attributes)) continue;
      const title = attributes.match(/\btitle="([^"]*)"/)?.[1];
      assert.ok(title?.trim(), `${file}: ${id} needs a content tooltip`);
      const labels = [
        title,
        ...Array.from(attributes.matchAll(/\b(?:aria-label|data-module-tab)="([^"]*)"/g), match => match[1]),
        ...Array.from(content.matchAll(/<span\b[^>]*class="button-text"[^>]*>([^<]*)<\/span>/g), match => match[1])
      ];
      labels.forEach(label => assert.doesNotMatch(label, /\b(?:show|view)\b/i, `${file}: ${id}`));
      checkedIds.add(id);
    }
  }
  tabIds.forEach(id => assert.ok(checkedIds.has(id), `${id} was not checked`));
});

test('every module More menu keeps its container without a decorative background icon', () => {
  const document = {
    createElement(tag) {
      assert.equal(tag, 'div');
      return { innerHTML: '' };
    }
  };
  const context = vm.createContext({ document });
  vm.runInContext(panelSource, context);
  for (const id of ['tool', 'controls', 'timeline', 'playlist', 'history', 'panel', 'meters']) {
    const panel = context.createModuleIconPanel(id);
    assert.equal(panel.className, 'module-icon-panel');
    assert.equal(panel.id, `${id}-icon-panel`);
    assert.equal(panel.hidden, true);
    assert.equal(panel.innerHTML, '');
  }
});

test('saved selections are reflected when headers are created, not only after clicks', () => {
  const updater = createTitleUpdater('meters', ['Spectroscope', 'Level meter', 'Oscilloscope'], 2);
  assert.equal(updater.titleElement.textContent, 'Meters: Oscilloscope');
});

test('selection changes are observed without intercepting tab clicks or other controls', () => {
  const updater = createTitleUpdater('tool', ['BPM', 'Italian Tempi', 'Notes']);
  assert.equal(updater.observers.length, 1);
  assert.equal(updater.observers[0].targets.length, 3);
  updater.observers[0].targets.forEach(({ target, options }, index) => {
    assert.equal(target, updater.buttons[index]);
    assert.equal(options.attributes, true);
    assert.deepEqual(Array.from(options.attributeFilter), ['class']);
  });
  const writes = updater.writes();
  updater.observers[0].callback();
  assert.equal(updater.writes(), writes);
  updater.select(1);
  assert.equal(updater.titleElement.textContent, 'Instrument: Italian Tempi');
});

test('modules without tabs keep their normal titles and install no observer', () => {
  const updater = createTitleUpdater('controls', []);
  assert.equal(updater.observers.length, 0);
  assert.equal(updater.writes(), 0);
});

test('no selected tab restores the base title without changing the selection', () => {
  const updater = createTitleUpdater('panel', ['Meta', 'Input', 'Playlist'], -1);
  assert.equal(updater.titleElement.textContent, 'Panel');
  updater.select(2);
  assert.equal(updater.titleElement.textContent, 'Panel: Playlist');
  updater.select(-1);
  assert.equal(updater.titleElement.textContent, 'Panel');
});

test('separate modules maintain independent active-tab titles', () => {
  const panel = createTitleUpdater('panel', ['Beats', 'Italian Tempi']);
  const meters = createTitleUpdater('meters', ['Spectroscope', 'Level meter']);
  panel.select(1);
  assert.equal(panel.titleElement.textContent, 'Panel: Italian Tempi');
  assert.equal(meters.titleElement.textContent, 'Meters: Spectroscope');
  meters.select(1);
  assert.equal(meters.titleElement.textContent, 'Meters: Level meter');
  assert.equal(panel.titleElement.textContent, 'Panel: Italian Tempi');
});

const tabSections = [
  ...tabGroups,
  { file: 'tools\\player.php', module: 'playlist', tabs: [
    ['playlist-presets-button'], ['playlist-custom-button']
  ] }
];

function createSkipSection(count, selected = 0, existingButton = null) {
  const clicks = [];
  let skipButton = existingButton;
  const tabs = Array.from({ length: count }, (_, index) => ({
    active: index === selected,
    disabled: false,
    hidden: false,
    classList: { contains: name => name === 'button-on' && tabs[index].active },
    click() {
      clicks.push(index);
      tabs.forEach((tab, current) => { tab.active = current === index; });
    }
  }));
  const section = {
    querySelector(selector) {
      assert.equal(selector, '.module-tab-skip-button');
      return skipButton;
    },
    querySelectorAll(selector) {
      assert.equal(selector, ':scope > button:not(.module-tab-skip-button)');
      return tabs;
    },
    appendChild(button) { skipButton = button; }
  };
  return { section, tabs, clicks, skip: () => skipButton };
}

function setupSkipSections(groups) {
  const document = {
    querySelectorAll(selector) {
      assert.equal(selector, '.module-tabs');
      return groups.map(group => group.section);
    },
    createElement(tag) {
      assert.equal(tag, 'button');
      return {
        attributes: {}, dataset: {}, listeners: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(name, callback) { this.listeners[name] = callback; },
        click() { this.listeners.click(); }
      };
    }
  };
  const context = vm.createContext({ document });
  vm.runInContext(skipSource, context);
  context.setupModuleTabSkipButtons();
  return context;
}

for (const group of tabSections) {
  test(`${group.file} ${group.module} has an isolated tab section and cycles through every tab`, () => {
    const template = fs.readFileSync(path.join(__dirname, '..', ...group.file.split('\\')), 'utf8');
    const sections = Array.from(template.matchAll(/<div class="controls-buttons wrapper module-tabs">([\s\S]*?)<\/div>/g),
      match => Array.from(match[1].matchAll(/<button\b[^>]*\bid="([^"]+)"/g), button => button[1])
        .filter(id => id !== 'meters-next-button'));
    assert.ok(sections.some(tabs => JSON.stringify(tabs) === JSON.stringify(group.tabs.map(([id]) => id))));
    const fixture = createSkipSection(group.tabs.length, group.tabs.length - 1);
    setupSkipSections([fixture]);
    assert.deepEqual(fixture.clicks, []);
    for (let index = 0; index < group.tabs.length; index++) {
      fixture.skip().click();
      assert.equal(fixture.clicks.at(-1), index);
    }
    fixture.tabs[0].click();
    fixture.skip().click();
    assert.equal(fixture.clicks.at(-1), 1);
  });
}

test('Metronome Panel tabs precede its content and are not in its footer', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'tools', 'metronome.php'), 'utf8');
  const panel = template.slice(template.indexOf('<div id="panel-container"'));
  const footerIndex = panel.indexOf('<div class="module-footer');
  const textIndex = panel.indexOf('<textarea id="metronome-text"');
  for (const id of ['panel-beats-button', 'panel-tempi-button']) {
    assert.ok(panel.indexOf(`id="${id}"`) < textIndex);
    assert.equal(panel.slice(footerIndex).includes(`id="${id}"`), false);
  }
  assert.ok(textIndex < footerIndex);
  assert.ok(panel.slice(footerIndex).includes('id="copy-button"'));
});

test('Skip is an accessible native button with shared Help and no duplicate initialization', () => {
  const fixture = createSkipSection(3, 1);
  const context = setupSkipSections([fixture]);
  const button = fixture.skip();
  assert.equal(button.type, 'button');
  assert.equal(button.title, 'Next tab');
  assert.equal(button.attributes['aria-label'], 'Skip to next tab');
  assert.equal(button.dataset.helpRelease, 'index');
  assert.equal(button.dataset.helpEntry, 'Skip');
  assert.match(button.innerHTML, /icons\.svg#skip_right/);
  assert.match(button.innerHTML, />Skip<\/span>/);
  context.setupModuleTabSkipButtons();
  assert.equal(fixture.skip(), button);
  button.click();
  assert.deepEqual(fixture.clicks, [2]);
});

test('Meters keeps its existing Next meter button and handler instead of adding another', () => {
  const existingButton = { click: () => {} };
  const fixture = createSkipSection(5, 0, existingButton);
  setupSkipSections([fixture]);
  assert.equal(fixture.skip(), existingButton);
  const template = fs.readFileSync(path.join(__dirname, '..', 'meters.php'), 'utf8');
  assert.match(template, /id="meters-next-button" class="square module-tab-skip-button"/);
});

test('Skip follows the current selection and ignores unavailable tabs', () => {
  const fixture = createSkipSection(4, 0);
  setupSkipSections([fixture]);
  fixture.tabs[1].disabled = true;
  fixture.tabs[2].hidden = true;
  fixture.skip().click();
  assert.deepEqual(fixture.clicks, [3]);
  fixture.skip().click();
  assert.deepEqual(fixture.clicks, [3, 0]);
  fixture.tabs.forEach(tab => { tab.disabled = true; });
  fixture.skip().click();
  assert.deepEqual(fixture.clicks, [3, 0]);
});

test('Skip without a selected tab chooses the first and does not affect another section', () => {
  const first = createSkipSection(2, -1);
  const second = createSkipSection(3, 1);
  setupSkipSections([first, second]);
  first.skip().click();
  assert.deepEqual(first.clicks, [0]);
  assert.deepEqual(second.clicks, []);
  second.skip().click();
  assert.deepEqual(second.clicks, [2]);
  assert.deepEqual(first.clicks, [0]);
});
