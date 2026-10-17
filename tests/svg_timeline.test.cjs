const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'svg_timeline.js'), 'utf8');

function createRulers() {
  function element(name = 'div') {
    return {
      name, attributes: {}, children: [], listeners: new Map(),
      classList: { toggle() {} },
      style: { setProperty(name, value) { this[name] = value; } },
      setAttribute(name, value) { this.attributes[name] = value; },
      appendChild(node) { this.children.push(node); },
      replaceChildren() { this.children = []; },
      addEventListener(type, listener) { this.listeners.set(type, listener); }
    };
  }
  const window = { addEventListener() {} };
  vm.runInNewContext(source, {
    window,
    document: { createElementNS: (namespace, name) => element(name) },
    localStorage: { getItem: () => null }
  });
  const timelineUtils = window.PekoSvgTimeline;
  const layout = element();
  const horizontalRuler = element('svg');
  const scrollElement = element();
  scrollElement.scrollLeft = 0;
  const controller = timelineUtils.createRulerLayout({
    container: { querySelector: () => layout },
    scrollElement,
    cornerRuler: element('svg'),
    verticalRuler: element('svg'),
    horizontalRuler
  });

  function render(bright = true) {
    controller.render({
      width: 4096, height: 256, bright, color: '#fff',
      drawHorizontal(svg, dimensions) {
        timelineUtils.drawHorizontalRuler(svg, {
          ...dimensions, color: '#fff',
          ticks: [{ position: 4096, label: '60s' }]
        });
      }
    });
  }

  return { controller, horizontalRuler, scrollElement, timelineUtils, render };
}

function verticalLines(svg) {
  return svg.children
    .filter(node => node.name === 'line' && node.attributes.x1 === node.attributes.x2)
    .map(node => node.attributes);
}

test('bright shared Timeline rulers close the right edge for the full ruler height', () => {
  const { horizontalRuler, render } = createRulers();
  render();
  const lines = verticalLines(horizontalRuler);
  assert.ok(lines.some(line =>
    line.x1 === '4095.5' && line.y1 === '0' && line.y2 === '24'
  ), 'The end tick alone leaves the upper-right corner open');
  assert.ok(!lines.some(line => line.x1 === '0.5'), 'Do not duplicate the adjoining vertical ruler');
});

test('non-bright shared Timeline rulers retain ticks without an outer frame', () => {
  const { horizontalRuler, render } = createRulers();
  render(false);
  assert.equal(horizontalRuler.children.filter(node => node.name === 'line').length, 2);
  assert.ok(verticalLines(horizontalRuler).every(line => Number(line.y1) > 0));
});

test('shared Timeline rulers preserve fractional horizontal scrolling', () => {
  const { horizontalRuler, scrollElement, render } = createRulers();
  scrollElement.scrollLeft = 3221.333251953125;
  render();
  assert.equal(horizontalRuler.style.transform, 'translateX(-3221.333251953125px)');
  assert.equal(horizontalRuler.style.width, '4096px');
  scrollElement.scrollLeft = 0;
  scrollElement.listeners.get('scroll')();
  assert.equal(horizontalRuler.style.transform, 'translateX(0px)');
});

test('hidden shared Timeline rulers do not render an outline', () => {
  const { controller, horizontalRuler, render } = createRulers();
  controller.setVisible(false, false);
  render();
  assert.equal(horizontalRuler.children.length, 0);
});

test('direct horizontal ruler callers retain their existing border options', () => {
  const { horizontalRuler, timelineUtils } = createRulers();
  const options = { width: 4096, height: 24, color: '#fff', bright: true };
  timelineUtils.drawHorizontalRuler(horizontalRuler, options);
  assert.equal(verticalLines(horizontalRuler).length, 0);
  timelineUtils.drawHorizontalRuler(horizontalRuler, {
    ...options, sideBorders: true, leftBorder: false
  });
  assert.equal(verticalLines(horizontalRuler).length, 1);
  assert.equal(verticalLines(horizontalRuler)[0].x1, '4095.5');
});
