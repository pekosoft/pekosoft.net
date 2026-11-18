const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'svg_timeline.js'), 'utf8');

function createRulers(devicePixelRatio = 1) {
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
  const window = { devicePixelRatio, addEventListener() {} };
  vm.runInNewContext(source, {
    window,
    document: { createElementNS: (namespace, name) => element(name) },
    localStorage: { getItem: () => null }
  });
  const timelineUtils = window.PekoSvgTimeline;
  const layout = element();
  const cornerRuler = element('svg');
  const verticalRuler = element('svg');
  const horizontalRuler = element('svg');
  const scrollElement = element();
  scrollElement.scrollLeft = 0;
  const controller = timelineUtils.createRulerLayout({
    container: { querySelector: () => layout },
    scrollElement,
    cornerRuler,
    verticalRuler,
    horizontalRuler
  });

  function render(bright = true) {
    controller.render({
      width: 4096, height: 256, bright, color: '#fff',
      drawVertical(svg, dimensions) {
        timelineUtils.drawVerticalRuler(svg, { ...dimensions, color: '#fff' });
      },
      drawHorizontal(svg, dimensions) {
        timelineUtils.drawHorizontalRuler(svg, {
          ...dimensions, color: '#fff',
          ticks: [{ position: 4096, label: '60s' }]
        });
      }
    });
  }

  return { controller, cornerRuler, verticalRuler, horizontalRuler, scrollElement, timelineUtils, render };
}

function verticalLines(svg) {
  return svg.children
    .filter(node => node.name === 'line' && node.attributes.x1 === node.attributes.x2)
    .map(node => node.attributes);
}

test('corner seams align with adjoining rulers at fractional device scale in regular and Bright modes', () => {
  const dpr = 1.25;
  const { cornerRuler, verticalRuler, horizontalRuler, timelineUtils, render } = createRulers(dpr);
  const plot = { appendChild: node => extensions.push(node), children: [] };
  const extensions = plot.children;
  timelineUtils.drawTickExtensions(plot, {
    width: 4096, height: 256, color: '#fff', vertical: [{ position: 32 }]
  });
  const lines = svg => svg.children.filter(node => node.name === 'line').map(node => node.attributes);
  const horizontal = svg => lines(svg).filter(line => line.y1 === line.y2);
  for (const bright of [false, true]) {
    render(bright);
    assert.deepEqual(verticalLines(cornerRuler).map(line => line.x1), verticalLines(verticalRuler).map(line => line.x1));
    assert.deepEqual(horizontal(cornerRuler).map(line => line.y1), horizontal(horizontalRuler).map(line => line.y1));
    for (const svg of [cornerRuler, verticalRuler, horizontalRuler, plot]) {
      for (const line of lines(svg)) assert.equal(Number(line['stroke-width']) * dpr, 1);
    }
  }
});

test('ruler tick extensions span the plot on both axes without repeating coincident ticks', () => {
  const { timelineUtils } = createRulers();
  const lines = timelineUtils.getTickExtensionLines({
    width: 100, height: 50,
    horizontal: [{ position: 0 }, { position: 25.8 }, { position: 26.1 }, { position: 100 }],
    vertical: [{ position: 0 }, { position: 10.9 }, { position: 20, drawLine: false }, { position: 50 }]
  });
  assert.equal(JSON.stringify(lines), JSON.stringify([
    [26.5, 0, 26.5, 50], [99.5, 0, 99.5, 50], [0, 10.5, 100, 10.5]
  ]));
});

test('bright shared Timeline rulers close the right edge for the full ruler height', () => {
  const { horizontalRuler, render } = createRulers();
  render();
  const lines = verticalLines(horizontalRuler);
  assert.ok(lines.some(line =>
    line.x1 === '4095.5' && line.y1 === '0' && line.y2 === '24'
  ), 'The outer frame owns the right edge');
  assert.equal(lines.filter(line => line.x1 === '4095.5').length, 1, 'The end tick does not double the frame');
  assert.ok(!lines.some(line => line.x1 === '0.5'), 'Do not duplicate the adjoining vertical ruler');
});

test('non-bright shared Timeline rulers retain ticks without an outer frame', () => {
  const { horizontalRuler, render } = createRulers();
  render(false);
  assert.equal(horizontalRuler.children.filter(node => node.name === 'line').length, 2);
  const [tick] = verticalLines(horizontalRuler);
  assert.equal(tick.y1, '23.5');
  assert.equal(tick.y2, '0');
});

test('Player top and bottom rulers extend their ticks from the plot seam to the outer edge', () => {
  const { horizontalRuler, timelineUtils } = createRulers();
  for (const bright of [false, true]) {
    for (const [axisPosition, seam, edge] of [['bottom', '23.5', '0'], ['top', '0.5', '24']]) {
      timelineUtils.drawHorizontalRuler(horizontalRuler, {
        width: 120, height: 24, color: '#fff', ticks: [{ position: 40, label: '9' }],
        bright, axisPosition, sideBorders: true, leftBorder: false
      });
      const tick = verticalLines(horizontalRuler).find(line => line.x1 === '40.5');
      assert.equal(tick.y1, seam);
      assert.equal(tick.y2, edge);
      assert.ok(horizontalRuler.children.some(node => node.name === 'text' && node.textContent === '9'));
    }
  }
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

test('vertical rulers support short ticks without changing existing full-width ticks', () => {
  const { horizontalRuler: ruler, timelineUtils } = createRulers();
  const options = { width: 48, height: 256, color: '#fff', ticks: [{ position: 32, label: '' }] };
  timelineUtils.drawVerticalRuler(ruler, options);
  const tick = () => ruler.children.find(node =>
    node.name === 'line' && node.attributes.y1 === node.attributes.y2
  ).attributes;
  assert.equal(tick().x1, '0');
  assert.equal(tick().x2, '48');
  timelineUtils.drawVerticalRuler(ruler, { ...options, tickLength: 5 });
  assert.equal(tick().x1, '43');
  assert.equal(tick().x2, '48');
  assert.equal(tick().y1, '32.5');
  assert.equal(tick()['shape-rendering'], 'crispEdges');
});
