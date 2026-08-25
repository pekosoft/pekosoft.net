// Shared guide state coordinator
// pekosoft.net/js/guides.js

(() => {
  const defaultGuides = true;
  const storageKeys = [
    "tap_pad.show_guides",
    "bpm_calculator.show_guides",
    "metronome.show_guides",
    "turntable.show_guides",
    "bpm_circle.show_guides",
    "bpm_curve.guides",
    "bpm_curve.timeline_guides",
    "circle_of_fifths.timeline_guides",
    "drum_machine.timeline_guides",
    "player.show_guides",
    "player.tool_guides",
    "piano.timeline_guides",
    "tuner.show_guides",
    "visualizer.show_guides",
    "meters.audio_calculator.guides",
    "meters.blockchain.guides",
    "meters.bpm_calculator.guides",
    "meters.bpm_circle.guides",
    "meters.bpm_curve.guides",
    "meters.circle_of_fifths.guides",
    "meters.drum_machine.guides",
    "meters.icons.guides",
    "meters.metronome.guides",
    "meters.notepad.guides",
    "meters.piano.guides",
    "meters.player.guides",
    "meters.reference.guides",
    "meters.tap_pad.guides",
    "meters.tuner.guides",
    "meters.turntable.guides",
    "meters.visualizer.guides"
  ];
  const nestedStateFields = {
    "bpm_calculator.state": ["showGuides"],
    "bpm_curve.state": ["guides", "timelineGuides"],
    "circle_of_fifths.settings": ["guidesOn"],
    "drum_machine.state": ["timelineGuides"],
    "piano.settings": ["timelineGuides"]
  };

  const buttonIds = new Set(["guides-button", "timeline-guides-button", "tool-guides-button"]);
  const brightRegistryKey = "global.bright_guides.modules";
  const brightControlKeys = [
    "bpm_calculator:timeline-bright-button",
    "bpm_calculator:tool-bright-button",
    "bpm_circle:tool-bright-button",
    "bpm_curve:timeline-bright-button",
    "bpm_curve:tool-bright-button",
    "circle_of_fifths:timeline-bright-button",
    "circle_of_fifths:tool-bright-button",
    "drum_machine:timeline-bright-button",
    "drum_machine:tool-bright-button",
    "metronome:timeline-bright-button",
    "metronome:tool-bright-button",
    "piano:timeline-bright-button",
    "piano:tool-bright-button",
    "player:timeline-bright-button",
    "player:tool-bright-button",
    "tap_pad:timeline-bright-button",
    "tap_pad:tool-bright-button",
    "tuner:timeline-bright-button",
    "tuner:tool-bright-button",
    "turntable:timeline-bright-button",
    "turntable:tool-bright-button"
  ];

  function readBoolean(value, fallback) {
    if (value === null || value === undefined) return fallback;
    return value === true || value === "true" || value === "on" || value === "1";
  }

  function getGlobal() {
    return readBoolean(localStorage.getItem("global.guides"), defaultGuides);
  }

  function getBrightGlobal() {
    return localStorage.getItem("global.bright_guides") === "true";
  }

  function getTimelineBrightStorageKey() {
    return `${getPageSlug()}.timeline_bright`;
  }

  function getTimelineBright() {
    const saved = localStorage.getItem(getTimelineBrightStorageKey());
    return saved === null ? getBrightGlobal() : saved === "true";
  }

  function getTimelineGuideColor(fallback) {
    return getTimelineBright() ? "#fff" : fallback;
  }

  function getRegistry() {
    try {
      const parsed = JSON.parse(localStorage.getItem("global.guides.modules") || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveRegistry(registry) {
    localStorage.setItem("global.guides.modules", JSON.stringify(registry));
  }

  function getPageSlug() {
    const path = (window.location.pathname || "").replace(/\/$/, "");
    return (path.split("/").pop() || "index").replace(/\.php$/i, "");
  }

  function getButtonKey(button) {
    const slug = getPageSlug();
    if (button.id === "tool-guides-button") return `meters.${slug}.guides`;
    if (button.id === "timeline-guides-button") {
      if (slug === "bpm_curve") return "bpm_curve.timeline_guides";
      return `${slug}.timeline_guides`;
    }
    if (slug === "bpm_curve") return "bpm_curve.guides";
    if (slug === "bpm_calculator") return "bpm_calculator.show_guides";
    if (slug === "metronome") return "metronome.show_guides";
    if (slug === "tap_pad") return "tap_pad.show_guides";
    if (slug === "turntable") return "turntable.show_guides";
    if (slug === "player") return "player.show_guides";
    if (slug === "tuner") return "tuner.show_guides";
    return `${slug}.show_guides`;
  }

  function guideButtons() {
    return [...document.querySelectorAll("button")].filter((button) => buttonIds.has(button.id));
  }

  function updateSettingsButton() {
    const settingsInput = document.getElementById("guides");
    const registry = getRegistry();
    const values = Object.values(registry);
    const anyGuideOn = values.length ? values.some(Boolean) : getGlobal();
    if (settingsInput) settingsInput.checked = anyGuideOn;
    const settingsButton = document.querySelector('[data-setting-toggle="guides"]');
    if (settingsButton) {
      settingsButton.classList.toggle("button-on", anyGuideOn);
      settingsButton.setAttribute("aria-pressed", String(anyGuideOn));
    }
  }

  function updateBrightSettingsButton() {
    const input = document.getElementById("bright-guides");
    const button = document.querySelector('[data-setting-toggle="bright-guides"]');
    const enabled = getBrightGlobal();
    if (input) input.checked = enabled;
    if (button) {
      button.classList.toggle("button-on", enabled);
      button.setAttribute("aria-pressed", String(enabled));
    }
  }

  function brightButtons() {
    return [...document.querySelectorAll("#timeline-bright-button, #tool-bright-button")];
  }

  function syncBrightSettingsFromTools() {
    const buttons = brightButtons();
    if (!buttons.length) return;
    const registry = window.PekoLocalToggleRegistry;
    const enabled = registry
      ? registry.syncButtons(brightRegistryKey, brightControlKeys, getBrightGlobal(), buttons)
      : buttons.some((button) => button.classList.contains("button-on"));
    localStorage.setItem("global.bright_guides", String(enabled));
    updateBrightSettingsButton();
  }

  function syncPageRegistry() {
    const registry = getRegistry();
    if (!Object.keys(registry).length) {
      storageKeys.forEach((key) => {
        registry[key] = getGlobal();
      });
    }
    guideButtons().forEach((button) => {
      registry[getButtonKey(button)] = button.classList.contains("button-on");
    });
    saveRegistry(registry);
    localStorage.setItem("global.guides", String(Object.values(registry).some(Boolean)));
    updateSettingsButton();
  }

  function clearNestedGuideState() {
    Object.entries(nestedStateFields).forEach(([storageKey, fields]) => {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (!saved || typeof saved !== "object") return;
        fields.forEach((field) => delete saved[field]);
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch (_) {
        localStorage.removeItem(storageKey);
      }
    });
  }

  function setGlobal(nextState) {
    const enabled = !!nextState;
    localStorage.setItem("global.guides", String(enabled));
    storageKeys.forEach((key) => localStorage.removeItem(key));
    clearNestedGuideState();

    const registry = {};
    storageKeys.forEach((key) => {
      registry[key] = enabled;
    });
    saveRegistry(registry);

    guideButtons().forEach((button) => {
      if (button.classList.contains("button-on") !== enabled) button.click();
    });
    updateSettingsButton();
    window.dispatchEvent(new CustomEvent("pekosoft:guides-global-change", {
      detail: { enabled }
    }));
  }

  function clearBrightLocalOverrides() {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (/^meters\..+\.bright$/.test(key || "") || key?.endsWith(".timeline_bright")) {
        localStorage.removeItem(key);
      }
    }
  }

  let isSyncingBrightButtons = false;

  function setBrightGlobal(nextState) {
    const enabled = !!nextState;
    window.PekoLocalToggleRegistry?.setAll(brightRegistryKey, brightControlKeys, enabled);
    localStorage.setItem("global.bright_guides", String(enabled));
    clearBrightLocalOverrides();
    syncTimelineBrightButton();
    isSyncingBrightButtons = true;
    try {
      brightButtons().forEach((button) => {
        if (button.classList.contains("button-on") !== enabled) button.click();
      });
    } finally {
      isSyncingBrightButtons = false;
    }
    updateBrightSettingsButton();
    window.dispatchEvent(new CustomEvent("pekosoft:bright-guides-global-change", {
      detail: { enabled }
    }));
    window.dispatchEvent(new CustomEvent("pekosoft:timeline-bright-change", {
      detail: { enabled }
    }));
  }

  function syncTimelineBrightButton() {
    const button = document.querySelector("#timeline-bright-button[data-shared-timeline-bright]");
    if (!button) return;
    const enabled = getTimelineBright();
    button.classList.toggle("button-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
  }

  function toggleTimelineBright() {
    localStorage.setItem(getTimelineBrightStorageKey(), String(!getTimelineBright()));
    syncTimelineBrightButton();
    window.dispatchEvent(new CustomEvent("pekosoft:timeline-bright-change", {
      detail: { enabled: getTimelineBright() }
    }));
  }

  window.PekoGuides = {
    getGlobal,
    setGlobal,
    syncPageRegistry,
    updateSettingsButton,
    getBrightGlobal,
    setBrightGlobal,
    updateBrightSettingsButton,
    syncBrightSettingsFromTools,
    getTimelineBright,
    getTimelineGuideColor
  };

  window.PekoBrightGuides = {
    getGlobal: getBrightGlobal,
    setGlobal: setBrightGlobal,
    updateSettingsButton: updateBrightSettingsButton,
    syncFromTools: syncBrightSettingsFromTools,
    getTimelineBright,
    getTimelineGuideColor
  };

  document.addEventListener("click", (event) => {
    if (event.target.closest?.("#guides-button, #timeline-guides-button, #tool-guides-button")) {
      syncPageRegistry();
    }
    if (!isSyncingBrightButtons && event.target.closest?.("#timeline-bright-button, #tool-bright-button")) {
      syncBrightSettingsFromTools();
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === "global.guides" && event.newValue !== null) {
      setGlobal(readBoolean(event.newValue, defaultGuides));
    }
    if (event.key === "global.bright_guides" && event.newValue !== null) {
      setBrightGlobal(event.newValue === "true");
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    updateSettingsButton();
    updateBrightSettingsButton();
    syncTimelineBrightButton();
    document.querySelector("#timeline-bright-button[data-shared-timeline-bright]")?.addEventListener("click", toggleTimelineBright);
  });
})();
