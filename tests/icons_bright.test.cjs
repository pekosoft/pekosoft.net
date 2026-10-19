const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "icons.js"), "utf8");

test("preview Bright inherits Settings until locally overridden and restores its button state", () => {
  const values = new Map();
  const classes = new Map();
  const attributes = new Map();
  const button = {
    classList: { toggle: (name, enabled) => classes.set(name, enabled) },
    setAttribute: (name, value) => attributes.set(name, value),
  };
  const context = vm.createContext({
    localStorage: { getItem: (key) => values.get(key) ?? null },
    previewStage: { classList: button.classList },
    document: { getElementById: () => button },
  });
  const start = source.indexOf("function getPreviewBright()");
  const end = source.indexOf("function applyPreviewToggles()", start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  const check = (expected) => {
    vm.runInContext("applyPreviewBright()", context);
    assert.equal(classes.get("preview-bright-on"), expected);
    assert.equal(classes.get("button-on"), expected);
    assert.equal(attributes.get("aria-pressed"), String(expected));
  };
  check(false);
  values.set("global.bright_guides", "true");
  check(true);
  values.set("icons.preview_bright", "false");
  check(false);
  values.set("icons.preview_bright", "true");
  values.set("global.bright_guides", "false");
  check(true);
  values.delete("icons.preview_bright");
  check(false);
});
