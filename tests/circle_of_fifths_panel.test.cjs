const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "circle_of_fifths.js"), "utf8");
const storage = new Map();
let copiedText = "";
const window = {
  addEventListener(type, callback) {
    assert.equal(type, "DOMContentLoaded");
    callback();
  },
  setTimeout(callback) { callback(); }
};
assert.ok(source.includes("new CircleOfFifths();"));
vm.runInNewContext(source.replace("new CircleOfFifths();", "window.CircleOfFifths = CircleOfFifths;"), {
  window,
  navigator: { clipboard: { async writeText(text) { copiedText = text; } } },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  }
});

function createButton() {
  const button = {
    active: false,
    attributes: {},
    classList: {
      toggle(name, active) {
        assert.equal(name, "button-on");
        button.active = active;
      }
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
  return button;
}

function createTool() {
  storage.clear();
  const tool = Object.assign(Object.create(window.CircleOfFifths.prototype), {
    selectedIndex: 0,
    selectedMode: "major",
    panelMode: "selected",
    showDim: true,
    rotateOn: false,
    panelText: { value: "" },
    panelModeButtons: { selected: createButton(), all: createButton() },
    updateSpeedDisplay() {}
  });
  return tool;
}

test("Selected keeps the existing detailed C major analysis", () => {
  const tool = createTool();
  tool.updatePanel();
  assert.equal(tool.panelText.value, [
    "// Circle Of Fifths", "",
    "Key: C", "Focus: Major", "Signature: No sharps or flats",
    "Relative Minor: Am", "Diminished: B\u00b0", "",
    "// Related Chords Marked On Wheel",
    "Subdominant: F", "Tonic: C", "Dominant: G", "Relative: Am",
    "Minor neighbors: Dm, Am, Em", "Leading-tone diminished: B\u00b0", "",
    "// Scale", "C  D  E  F  G  A  B", "",
    "// Diatonic Chords", "I = C", "ii = Dm", "iii = Em", "IV = F",
    "V = G", "vi = Am", "vii\u00b0 = B\u00b0", "",
    "// I V vi IV", "C - G - Am - F"
  ].join("\n"));
  assert.equal(tool.panelModeButtons.selected.active, true);
  assert.equal(tool.panelModeButtons.selected.attributes["aria-pressed"], "true");
  assert.equal(tool.panelModeButtons.all.active, false);
  assert.equal(tool.panelModeButtons.all.attributes["aria-pressed"], "false");
});

test("All contains each key pair once in circle order with compact analysis", () => {
  const tool = createTool();
  tool.panelMode = "all";
  tool.updatePanel();
  const text = tool.panelText.value;
  assert.deepEqual(text.split("\n").filter((line) => line.startsWith("// ")), [
    "// Circle Of Fifths - All Keys",
    "// C / Am", "// G / Em", "// D / Bm", "// A / F#m", "// E / C#m",
    "// B / G#m", "// F#/G\u266d / D#m/E\u266dm", "// D\u266d / B\u266dm",
    "// A\u266d / Fm", "// E\u266d / Cm", "// B\u266d / Gm", "// F / Dm"
  ]);
  for (const label of ["Signature:", "Diminished:", "Scale:", "Diatonic Chords:", "I V vi IV:"]) {
    assert.equal(text.split("\n").filter((line) => line.startsWith(label)).length, 12);
  }
  assert.ok(text.includes("Scale: F#  G#  A#  B  C#  D#  E#"));
  assert.ok(text.includes("Diminished: E#\u00b0/F\u00b0"));
  assert.ok(text.includes("Signature: 5 flats (B\u266d, E\u266d, A\u266d, D\u266d, G\u266d)"));
  assert.ok(text.includes("Diatonic Chords: I = C, ii = Dm, iii = Em, IV = F, V = G, vi = Am, vii\u00b0 = B\u00b0"));
  assert.ok(text.includes("I V vi IV: D\u266d - A\u266d - B\u266dm - G\u266d"));
  assert.equal(text.split("\n").length, 85);
  assert.equal(tool.panelModeButtons.all.active, true);
  assert.equal(tool.panelModeButtons.all.attributes["aria-pressed"], "true");
  assert.equal(tool.panelModeButtons.selected.active, false);
});

test("All stays independent of wheel selection and Selected follows the latest selection", () => {
  const tool = createTool();
  tool.panelMode = "all";
  tool.updatePanel();
  const overview = tool.panelText.value;
  tool.selectedIndex = 7;
  tool.selectedMode = "minor";
  tool.updatePanel();
  assert.equal(tool.panelText.value, overview);
  assert.equal(tool.selectedIndex, 7);
  assert.equal(tool.selectedMode, "minor");
  tool.panelMode = "selected";
  tool.updatePanel();
  assert.ok(tool.panelText.value.includes("Key: D\u266d\nFocus: Minor"));
  assert.ok(tool.panelText.value.includes("Relative Minor: B\u266dm"));
  assert.equal(tool.panelModeButtons.selected.active, true);
});

for (const panelMode of ["selected", "all"]) {
  test(`Saved ${panelMode} tab is restored`, () => {
    const tool = createTool();
    tool.panelMode = panelMode;
    tool.saveSettings();
    assert.equal(JSON.parse(storage.get("circle_of_fifths.settings")).panelMode, panelMode);
    tool.panelMode = "selected";
    tool.loadSettings();
    tool.updatePanel();
    assert.equal(tool.panelMode, panelMode);
    assert.equal(tool.panelModeButtons[panelMode].active, true);
  });
}

for (const saved of [{ selectedIndex: 3 }, { panelMode: "invalid" }]) {
  test(`Legacy or invalid saved tab uses Selected: ${JSON.stringify(saved)}`, () => {
    const tool = createTool();
    storage.set("circle_of_fifths.settings", JSON.stringify(saved));
    tool.loadSettings();
    tool.updatePanel();
    assert.equal(tool.panelMode, "selected");
    assert.equal(tool.panelModeButtons.selected.active, true);
    if (saved.selectedIndex === 3) assert.ok(tool.panelText.value.includes("Key: A\n"));
  });
}

test("Reset returns to Selected and persists it", () => {
  const tool = createTool();
  tool.panelMode = "all";
  for (const method of ["stopAllAudio", "updateMasterGain", "renderWheel", "updateControls", "highlightPianoScale"]) {
    tool[method] = () => {};
  }
  tool.reset();
  assert.equal(tool.panelMode, "selected");
  assert.equal(tool.panelModeButtons.selected.active, true);
  assert.ok(tool.panelText.value.includes("Key: C\n"));
  assert.equal(JSON.parse(storage.get("circle_of_fifths.settings")).panelMode, "selected");
});

test("Copy uses the current tab text", async () => {
  const tool = createTool();
  for (const mode of ["all", "selected"]) {
    tool.panelMode = mode;
    tool.updatePanel();
    await tool.copyPanelText();
    assert.equal(copiedText, tool.panelText.value);
    assert.equal(copiedText.includes("// Circle Of Fifths - All Keys"), mode === "all");
  }
});
