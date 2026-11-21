const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "clock.js"), "utf8");

function createElement(value = "") {
  const listeners = new Map();
  const classes = new Set();
  return {
    value,
    textContent: "",
    title: "",
    hidden: false,
    disabled: false,
    style: { setProperty(name, value) { this[name] = value; } },
    dataset: {},
    attributes: new Map(),
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      contains: name => classes.has(name),
      toggle(name, force) {
        const enabled = force === undefined ? !classes.has(name) : force;
        if (enabled) classes.add(name);
        else classes.delete(name);
        return enabled;
      }
    },
    setAttribute(name, attributeValue) {
      this.attributes.set(name, attributeValue);
    },
    addEventListener(name, handler) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(handler);
    },
    dispatch(name) {
      for (const handler of listeners.get(name) || []) handler();
    }
  };
}

function createClock(saved = {}) {
  const storage = new Map(Object.entries(saved));
  const sounds = [];
  const vibrations = [];
  const elements = new Map();
  const knobBindings = new Map();
  const documentListeners = new Map();
  const ids = [
    "clock-hour", "clock-minute", "clock-second", "reset-button", "clock-sound-button",
    "clock-haptic-button", "clock-mode-view", "calendar-mode-view",
    "clock-page", "timer-mode-view", "countdown-mode-view", "timer-display",
    "countdown-display", "countdown-hours", "countdown-minutes", "countdown-seconds",
    "countdown-hours-knob", "countdown-minutes-knob", "countdown-seconds-knob",
    "clock-mode-button", "calendar-mode-button", "timer-mode-button", "countdown-mode-button", "time-start-button",
    "time-start-icon", "time-start-text", "clock-local-time", "clock-time-zone",
    "clock-local-date"
  ];

  for (const id of ids) elements.set(id, createElement());
  elements.get("countdown-hours").value = "0";
  elements.get("countdown-minutes").value = "1";
  elements.get("countdown-seconds").value = "0";
  elements.get("time-start-button").disabled = true;

  let now = 1000;
  let nextFrame = null;
  let frameId = 0;
  class ClockDate extends Date {
    static now() {
      return now;
    }
  }
  class AudioContextStub {
    constructor() {
      this.currentTime = 0;
      this.state = "running";
    }
  }

  const context = {
    Date: ClockDate,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    document: {
      getElementById: id => elements.get(id) ?? null,
      addEventListener(name, callback) { documentListeners.set(name, callback); },
      visibilityState: "visible"
    },
    window: {
      AudioContext: AudioContextStub,
      PekoSound: { syncFromTools() {} },
      playTransientSound: options => sounds.push(options)
    },
    navigator: {
      vibrate: pattern => vibrations.push(pattern)
    },
    bindKnobControl: (knob, handlers) => knobBindings.set(knob, handlers),
    requestAnimationFrame: callback => {
      nextFrame = callback;
      frameId += 1;
      return frameId;
    },
    setInterval() {
      return 1;
    }
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  documentListeners.get("DOMContentLoaded")();

  return {
    elements,
    storage,
    sounds,
    vibrations,
    knobBindings,
    setNow(value) {
      now = value;
    },
    runFrame() {
      const callback = nextFrame;
      nextFrame = null;
      callback?.();
    }
  };
}

test("Timer counts elapsed time across pause and resume, and Reset stops it", () => {
  const clock = createClock();
  const elements = clock.elements;

  elements.get("timer-mode-button").dispatch("click");
  elements.get("time-start-button").dispatch("click");
  clock.setNow(2250);
  clock.runFrame();
  assert.equal(elements.get("timer-display").textContent, "00:00:01.250");

  elements.get("time-start-button").dispatch("click");
  assert.equal(elements.get("timer-display").textContent, "00:00:01.250");
  clock.setNow(5000);
  elements.get("time-start-button").dispatch("click");
  clock.setNow(6000);
  clock.runFrame();
  assert.equal(elements.get("timer-display").textContent, "00:00:02.250");

  elements.get("reset-button").dispatch("click");
  assert.equal(elements.get("timer-display").textContent, "00:00:00.000");
  assert.equal(elements.get("clock-mode-view").hidden, false);
  assert.equal(elements.get("time-start-button").disabled, true);
});

test("Countdown completion feedback still runs when paused at its deadline", () => {
  const clock = createClock();
  const elements = clock.elements;

  elements.get("countdown-hours").value = "0";
  elements.get("countdown-minutes").value = "0";
  elements.get("countdown-seconds").value = "2";
  elements.get("countdown-seconds").dispatch("input");
  elements.get("clock-sound-button").dispatch("click");
  elements.get("clock-haptic-button").dispatch("click");
  elements.get("countdown-mode-button").dispatch("click");
  elements.get("time-start-button").dispatch("click");
  assert.equal(elements.get("countdown-seconds").disabled, true);

  clock.setNow(1750);
  clock.runFrame();
  assert.equal(elements.get("countdown-display").textContent, "00:00:01.250");

  clock.setNow(3000);
  elements.get("time-start-button").dispatch("click");

  assert.equal(elements.get("countdown-display").textContent, "00:00:00.000");
  assert.equal(elements.get("countdown-display").classList.contains("countdown-complete"), true);
  assert.equal(elements.get("countdown-seconds").disabled, false);
  assert.equal(clock.sounds.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(clock.vibrations)), [[120, 80, 120]]);
});

test("Countdown fields load saved values and disable Start when the duration is zero", () => {
  const clock = createClock({
    "clock.mode": "countdown",
    "clock.countdown_hours": "100",
    "clock.countdown_minutes": "0",
    "clock.countdown_seconds": "0"
  });
  const elements = clock.elements;

  assert.equal(elements.get("countdown-hours").value, "99");
  assert.equal(elements.get("time-start-button").disabled, false);

  elements.get("countdown-hours").value = "0";
  elements.get("countdown-minutes").value = "0";
  elements.get("countdown-seconds").value = "0";
  elements.get("countdown-seconds").dispatch("input");

  assert.equal(elements.get("time-start-button").disabled, true);
  assert.equal(clock.storage.get("clock.countdown_seconds"), "0");
});

test("Calendar selection is restored, shows only its view, and Reset returns to Clock", () => {
  const clock = createClock({ "clock.mode": "calendar" });
  const elements = clock.elements;

  for (const mode of ["clock", "calendar", "timer", "countdown"]) {
    assert.equal(elements.get(`${mode}-mode-view`).hidden, mode !== "calendar");
    assert.equal(elements.get(`${mode}-mode-button`).attributes.get("aria-pressed"), String(mode === "calendar"));
  }
  assert.equal(elements.get("time-start-button").disabled, true);

  elements.get("timer-mode-button").dispatch("click");
  assert.equal(clock.storage.get("clock.mode"), "timer");
  elements.get("calendar-mode-button").dispatch("click");
  assert.equal(clock.storage.get("clock.mode"), "calendar");
  assert.equal(elements.get("time-start-button").disabled, true);
  elements.get("reset-button").dispatch("click");
  assert.equal(clock.storage.has("clock.mode"), false);
  assert.equal(elements.get("clock-mode-view").hidden, false);
  assert.equal(elements.get("calendar-mode-view").hidden, true);
});

test("Timer and Countdown continue running while Calendar is selected", () => {
  const clock = createClock();
  const elements = clock.elements;

  elements.get("timer-mode-button").dispatch("click");
  elements.get("time-start-button").dispatch("click");
  elements.get("countdown-mode-button").dispatch("click");
  elements.get("time-start-button").dispatch("click");
  elements.get("calendar-mode-button").dispatch("click");
  assert.equal(elements.get("time-start-button").disabled, true);

  clock.setNow(2250);
  clock.runFrame();
  assert.equal(elements.get("timer-display").textContent, "00:00:01.250");
  assert.equal(elements.get("countdown-display").textContent, "00:00:58.750");

  elements.get("timer-mode-button").dispatch("click");
  assert.equal(elements.get("time-start-button").attributes.get("aria-pressed"), "true");
  assert.equal(elements.get("time-start-button").dataset.helpEntry, "Timer");
  elements.get("countdown-mode-button").dispatch("click");
  assert.equal(elements.get("time-start-button").attributes.get("aria-pressed"), "true");
  assert.equal(elements.get("time-start-button").dataset.helpEntry, "Countdown");
});

test("Countdown knobs update fields, display and saved values, and follow running and reset states", () => {
  const clock = createClock({ "clock.countdown_minutes": "5" });
  const { elements, knobBindings } = clock;
  const hours = elements.get("countdown-hours-knob");
  const minutes = elements.get("countdown-minutes-knob");
  const seconds = elements.get("countdown-seconds-knob");
  const minuteControl = knobBindings.get(minutes);

  assert.equal(minutes.attributes.get("aria-valuenow"), "5");
  minuteControl.nudge(1);
  knobBindings.get(hours).end();
  knobBindings.get(seconds).drag(0, 270);
  assert.equal(elements.get("countdown-display").textContent, "99:06:59.000");
  assert.equal(clock.storage.get("clock.countdown_minutes"), "6");
  assert.equal(seconds.attributes.get("aria-valuenow"), "59");

  elements.get("countdown-mode-button").dispatch("click");
  elements.get("time-start-button").dispatch("click");
  assert.equal(minutes.disabled, true);
  minuteControl.nudge(1);
  assert.equal(elements.get("countdown-minutes").value, "6");
  elements.get("time-start-button").dispatch("click");
  assert.equal(minutes.disabled, false);
  minuteControl.reset();
  assert.equal(elements.get("countdown-minutes").value, "1");
  elements.get("countdown-hours").value = "3";
  elements.get("countdown-hours").dispatch("input");
  assert.equal(hours.attributes.get("aria-valuenow"), "3");

  elements.get("reset-button").dispatch("click");
  assert.equal(hours.attributes.get("aria-valuenow"), "0");
  assert.equal(minutes.attributes.get("aria-valuenow"), "1");
  assert.equal(seconds.attributes.get("aria-valuenow"), "0");
});
