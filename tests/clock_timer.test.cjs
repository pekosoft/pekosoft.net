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
      if (name === "click" && this.disabled) return;
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
  const windowListeners = new Map();
  const ids = [
    "clock-hour", "clock-minute", "clock-second", "reset-button", "clock-sound-button",
    "clock-haptic-button", "clock-mode-view", "calendar-mode-view",
    "clock-page", "timer-mode-view", "countdown-mode-view", "timer-display",
    "countdown-display", "countdown-hours", "countdown-minutes", "countdown-seconds",
    "countdown-hours-knob", "countdown-minutes-knob", "countdown-seconds-knob",
    "countdown-alarm-button", "time-ms-button",
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
  const intervals = new Map();
  let intervalId = 0;
  class ClockDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
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
      addEventListener(name, callback) { windowListeners.set(name, callback); },
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
    setInterval(callback) {
      intervalId += 1;
      intervals.set(intervalId, callback);
      return intervalId;
    },
    clearInterval(id) { intervals.delete(id); }
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
    feedback: context.window.clockFeedback,
    dispatchStorage(key, value) {
      if (value === null) storage.delete(key);
      else storage.set(key, value);
      windowListeners.get("storage")({ key, newValue: value });
    },
    setNow(value) {
      now = value;
    },
    runFrame() {
      const callback = nextFrame;
      nextFrame = null;
      callback?.();
    },
    runAlarmTick() {
      for (const [id, callback] of intervals) {
        if (id !== 1) callback();
      }
    },
    runClockTick() { intervals.get(1)(); },
    getIntervalCount() {
      return intervals.size;
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
  elements.get("countdown-mode-button").dispatch("click");
  elements.get("clock-sound-button").dispatch("click");
  elements.get("clock-haptic-button").dispatch("click");
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

test("Sound and Haptic are independent and persist for each tab", () => {
  const clock = createClock();
  const { elements, storage } = clock;
  const sound = elements.get("clock-sound-button");
  const haptic = elements.get("clock-haptic-button");
  sound.dispatch("click");
  elements.get("timer-mode-button").dispatch("click");
  assert.equal(sound.attributes.get("aria-pressed"), "false");
  haptic.dispatch("click");
  elements.get("countdown-mode-button").dispatch("click");
  assert.equal(sound.attributes.get("aria-pressed"), "false");
  assert.equal(haptic.attributes.get("aria-pressed"), "false");
  sound.dispatch("click");
  elements.get("calendar-mode-button").dispatch("click");
  assert.equal(sound.disabled, true);
  assert.equal(haptic.disabled, true);
  assert.equal(elements.get("time-start-button").disabled, true);
  sound.dispatch("click");
  haptic.dispatch("click");
  const reloaded = createClock(Object.fromEntries(storage));
  assert.equal(reloaded.elements.get("clock-sound-button").disabled, true);
  reloaded.elements.get("clock-mode-button").dispatch("click");
  assert.equal(reloaded.elements.get("clock-sound-button").attributes.get("aria-pressed"), "true");
  assert.equal(reloaded.elements.get("clock-haptic-button").attributes.get("aria-pressed"), "false");
  reloaded.elements.get("timer-mode-button").dispatch("click");
  assert.equal(reloaded.elements.get("clock-sound-button").attributes.get("aria-pressed"), "false");
  assert.equal(reloaded.elements.get("clock-haptic-button").attributes.get("aria-pressed"), "true");
  reloaded.elements.get("countdown-mode-button").dispatch("click");
  assert.equal(reloaded.elements.get("clock-sound-button").attributes.get("aria-pressed"), "true");
  reloaded.elements.get("reset-button").dispatch("click");
  for (const mode of ["clock", "timer", "countdown"]) {
    assert.equal(reloaded.storage.has(`clock.${mode}_sound`), false);
    assert.equal(reloaded.storage.has(`clock.${mode}_haptic`), false);
  }
});

test("Legacy feedback preferences migrate without losing untouched tab choices", () => {
  const clock = createClock({ "clock.sound_on": "false", "clock.haptic": "true" });
  clock.feedback.restore("sound", true);
  clock.feedback.restore("haptic", true);
  clock.elements.get("timer-mode-button").dispatch("click");
  clock.elements.get("clock-sound-button").dispatch("click");
  const reloaded = createClock(Object.fromEntries(clock.storage));
  reloaded.elements.get("clock-mode-button").dispatch("click");
  assert.equal(reloaded.elements.get("clock-sound-button").attributes.get("aria-pressed"), "true");
  reloaded.elements.get("timer-mode-button").dispatch("click");
  assert.equal(reloaded.elements.get("clock-sound-button").attributes.get("aria-pressed"), "false");
  assert.equal(reloaded.elements.get("clock-haptic-button").attributes.get("aria-pressed"), "true");
});

test("Ticks follow the selected running tab and Calendar is silent", () => {
  const clock = createClock({ "clock.clock_sound": "true", "clock.timer_sound": "true", "clock.timer_haptic": "true" });
  clock.setNow(2000);
  clock.runClockTick();
  assert.equal(clock.sounds.length, 1);
  clock.elements.get("timer-mode-button").dispatch("click");
  clock.setNow(3000);
  clock.runClockTick();
  assert.equal(clock.sounds.length, 1);
  clock.elements.get("time-start-button").dispatch("click");
  clock.setNow(4000);
  clock.runClockTick();
  assert.equal(clock.sounds.length, 2);
  assert.deepEqual(clock.vibrations, [10]);
  clock.elements.get("calendar-mode-button").dispatch("click");
  clock.setNow(5000);
  clock.runClockTick();
  assert.equal(clock.sounds.length, 2);
  assert.deepEqual(clock.vibrations, [10]);
});

test("Countdown completion uses its own settings while Calendar is selected", () => {
  const clock = createClock({
    "clock.mode": "countdown", "clock.countdown_sound": "true", "clock.countdown_haptic": "true",
    "clock.countdown_minutes": "0", "clock.countdown_seconds": "1"
  });
  clock.elements.get("time-start-button").dispatch("click");
  clock.elements.get("calendar-mode-button").dispatch("click");
  clock.setNow(2000);
  clock.runFrame();
  assert.equal(clock.sounds.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(clock.vibrations)), [[120, 80, 120]]);
});

test("Global feedback changes apply on Calendar and update across tabs", () => {
  const clock = createClock({ "clock.mode": "calendar" });
  clock.feedback.setAll("sound", true);
  clock.feedback.setAll("haptic", true);
  assert.equal(clock.elements.get("clock-sound-button").disabled, true);
  clock.elements.get("timer-mode-button").dispatch("click");
  assert.equal(clock.elements.get("clock-sound-button").attributes.get("aria-pressed"), "true");
  assert.equal(clock.elements.get("clock-haptic-button").attributes.get("aria-pressed"), "true");
  clock.dispatchStorage("clock.timer_sound", "false");
  clock.dispatchStorage("clock.timer_haptic", "false");
  assert.equal(clock.elements.get("clock-sound-button").attributes.get("aria-pressed"), "false");
  assert.equal(clock.elements.get("clock-haptic-button").attributes.get("aria-pressed"), "false");
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

test("Timer milliseconds toggle preserves precision and remains independent of Countdown", () => {
  const clock = createClock({ "clock.mode": "timer" });
  const { elements, storage } = clock;
  const msButton = elements.get("time-ms-button");
  assert.equal(msButton.hidden, false);
  assert.equal(msButton.attributes.get("aria-pressed"), "true");
  elements.get("time-start-button").dispatch("click");
  clock.setNow(2250);
  clock.runFrame();
  msButton.dispatch("click");
  assert.equal(elements.get("timer-display").textContent, "00:00:01");
  assert.equal(storage.get("clock.timer_ms"), "false");
  elements.get("time-start-button").dispatch("click");
  elements.get("countdown-mode-button").dispatch("click");
  assert.equal(msButton.attributes.get("aria-pressed"), "true");
  msButton.dispatch("click");
  assert.equal(storage.get("clock.countdown_ms"), "false");
  elements.get("timer-mode-button").dispatch("click");
  assert.equal(msButton.attributes.get("aria-pressed"), "false");
  msButton.dispatch("click");
  assert.equal(elements.get("timer-display").textContent, "00:00:01.250");
  msButton.dispatch("click");
  const reloaded = createClock(Object.fromEntries(storage));
  assert.equal(reloaded.elements.get("time-ms-button").attributes.get("aria-pressed"), "false");
  assert.equal(reloaded.elements.get("timer-display").textContent, "00:00:00");
  reloaded.elements.get("reset-button").dispatch("click");
  assert.equal(reloaded.storage.has("clock.timer_ms"), false);
  assert.equal(reloaded.elements.get("time-ms-button").hidden, true);
  reloaded.elements.get("timer-mode-button").dispatch("click");
  assert.equal(reloaded.elements.get("time-ms-button").attributes.get("aria-pressed"), "true");
  assert.equal(reloaded.elements.get("timer-display").textContent, "00:00:00.000");
});

test("Countdown milliseconds toggle preserves precision, rounds up and persists", () => {
  const clock = createClock({ "clock.mode": "countdown" });
  const { elements, storage } = clock;
  assert.equal(elements.get("time-ms-button").attributes.get("aria-pressed"), "true");
  elements.get("time-start-button").dispatch("click");
  clock.setNow(2250);
  clock.runFrame();
  elements.get("time-ms-button").dispatch("click");
  assert.equal(elements.get("countdown-display").textContent, "00:00:59");
  assert.equal(storage.get("clock.countdown_ms"), "false");
  elements.get("time-ms-button").dispatch("click");
  assert.equal(elements.get("countdown-display").textContent, "00:00:58.750");
  elements.get("reset-button").dispatch("click");
  assert.equal(elements.get("time-ms-button").attributes.get("aria-pressed"), "true");
  assert.equal(storage.has("clock.countdown_ms"), false);
  assert.equal(createClock({ "clock.countdown_ms": "false" }).elements.get("countdown-display").textContent, "00:01:00");
});

test("Countdown alarm repeats until dismissed and obeys Sound", () => {
  const clock = createClock({ "clock.mode": "countdown", "clock.countdown_alarm": "true", "clock.countdown_minutes": "0", "clock.countdown_seconds": "1" });
  const { elements, storage, sounds } = clock;
  elements.get("clock-sound-button").dispatch("click");
  elements.get("time-start-button").dispatch("click");
  clock.setNow(2000);
  clock.runFrame();
  assert.equal(elements.get("countdown-mode-view").classList.contains("countdown-alarm"), true);
  assert.equal(sounds.length, 3);
  clock.runAlarmTick();
  assert.equal(sounds.length, 6);
  storage.set("global.sound", "false");
  clock.runAlarmTick();
  assert.equal(sounds.length, 6);
  elements.get("countdown-alarm-button").dispatch("click");
  assert.equal(elements.get("countdown-mode-view").classList.contains("countdown-alarm"), false);
  assert.equal(clock.getIntervalCount(), 1);
  assert.equal(storage.get("clock.countdown_alarm"), "false");
});

test("Restart, editing duration and Reset stop an active countdown alarm", () => {
  for (const action of ["restart", "edit", "reset"]) {
    const clock = createClock({ "clock.mode": "countdown", "clock.countdown_alarm": "true", "clock.countdown_minutes": "0", "clock.countdown_seconds": "1" });
    const { elements } = clock;
    elements.get("time-start-button").dispatch("click");
    clock.setNow(2000);
    clock.runFrame();
    assert.equal(clock.getIntervalCount(), 2);
    if (action === "restart") elements.get("time-start-button").dispatch("click");
    if (action === "edit") elements.get("countdown-seconds").dispatch("input");
    if (action === "reset") elements.get("reset-button").dispatch("click");
    assert.equal(clock.getIntervalCount(), 1);
    assert.equal(elements.get("countdown-mode-view").classList.contains("countdown-alarm"), false);
    if (action === "reset") assert.equal(clock.storage.has("clock.countdown_alarm"), false);
  }
});
