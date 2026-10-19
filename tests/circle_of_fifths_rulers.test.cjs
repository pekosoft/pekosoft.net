const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "circle_of_fifths.js"), "utf8");
const start = source.indexOf("    drawTimeline() {");
const end = source.indexOf("    getTimelineRowTop(", start);
assert.ok(start >= 0 && end > start);
const draw = vm.runInNewContext(`(function ${source.slice(start, end).trim()})`, {
  performance: { now: () => 0 },
  TIMELINE_ROW_COUNT: 25,
  TIMELINE_START_MIDI: 48,
  TIMELINE_END_MIDI: 72,
});

for (const rulers of [true, false]) {
  for (const guides of [true, false]) {
    test(`Timeline rulers ${rulers}, guides ${guides} render independently`, () => {
      const labels = [];
      const lines = [];
      const blocks = [];
      const context = {
        setTransform() {}, clearRect() {}, beginPath() {},
        moveTo(x, y) { lines.push([x, y]); },
        lineTo() {}, stroke() {}, closePath() {},
        fillText(text) { labels.push(text); },
        fillRect(x) { blocks.push(x); },
      };
      draw.call({
        timelineCanvas: { width: 500, height: 250 },
        timelineContext: context,
        resizeTimeline() {},
        getRootColors: () => ({}),
        guidesOn: guides,
        timelineRulers: rulers,
        timelineEvents: [{ time: 0, midis: [60] }],
        timelineWindowMs: 30000,
        getTimelineNoteY: () => 10,
        getTimelineRowTop: () => 10,
        midiToTimelineNoteName: (midi) => String(midi),
      });
      assert.equal(labels.length, rulers ? 25 : 0);
      assert.equal(lines.length > 0, guides);
      assert.equal(blocks.length, 1);
    });
  }
}
