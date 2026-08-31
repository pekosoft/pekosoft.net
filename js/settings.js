// Pekosoft Settings
// pekosoft.net/js/settings.js

// Global FactoryDefaults

window.FactoryDefaults = {
  fontSize: "medium",
  grid: false,
  gridSize: 16,
  guides: true,
  brightGuides: false,
  sound: true,
  headers: true,
  layout: true,
  haptics: false,
  toggleButtonText: false,
  alpha: false,
  multicolor: true,
  wrap: false,
  inputBackgroundsEnabled: true,
  theme: "dark",
  footer: true,
  defaultBPM: 120,
  defaultRPM: 33.333,
  a4Hz: 440,
  speedOfSound: 343
};

document.addEventListener("DOMContentLoaded", () => {
  const settings = {
    grid: document.getElementById("grid"),
    gridSizeKnob: document.getElementById("grid-size-knob"),
    gridSizeValue: document.getElementById("grid-size-value"),
    fontSizeKnob: document.getElementById("font-size-knob"),
    guides: document.getElementById("guides"),
    brightGuides: document.getElementById("bright-guides"),
    sound: document.getElementById("sound"),
    headers: document.getElementById("headers"),
    layout: document.getElementById("layout"),
    haptics: document.getElementById("haptics"),
    toggleButtonText: document.getElementById("toggle-button-text"),
    fontSizeSelector: document.getElementById("font_size_selector"),
    toggleAlpha: document.getElementById("toggle-alpha"),
    multicolor: document.getElementById("multicolor"),
    toggleWrap: document.getElementById("toggle-wrap"),
    resetButton: document.getElementById("reset-settings-button"),
    defaultBPM: document.getElementById("default_bpm"),
    defaultBPMKnob: document.getElementById("default-bpm-knob"),
    defaultRPM: document.getElementById("default_rpm"),
    defaultRPMKnob: document.getElementById("default-rpm-knob"),
    a4Hz: document.getElementById("a4_hz"),
    a4HzKnob: document.getElementById("a4-hz-knob"),
    speedOfSound: document.getElementById("speed_of_sound"),
    speedOfSoundKnob: document.getElementById("speed-of-sound-knob"),
  };

  const defaults = window.FactoryDefaults;
  const gridSizes = [8, 16, 32, 64];
  const rpmPresets = [8, 16.667, 22.5, 33.333, 45, 78];
  const fontSizes = ["small", "medium", "large"];
  const knobDragPixelsDefault = 14;
  const knobDragPixelsSensitive = 2;
  const numericRanges = {
    defaultBPM: { min: 30, max: 320 },
    a4Hz: { min: 400, max: 480 },
    speedOfSound: { min: 300, max: 380 }
  };
  const phoneSettingsQuery = window.matchMedia("(max-width: 799px)");
  let suppressPhoneFieldClick = false;

  document.querySelectorAll(".settings-panel .setting-row :is(label, input, select)").forEach((field) => {
    field.addEventListener("pointerdown", (event) => {
      if (!phoneSettingsQuery.matches) return;

      suppressPhoneFieldClick = true;
      event.preventDefault();
    });
  });
  document.addEventListener("click", (event) => {
    if (!suppressPhoneFieldClick) return;

    suppressPhoneFieldClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  function syncToggleButtonState(input) {
    const button = document.querySelector(`[data-setting-toggle="${input.id}"]`);
    if (!button) return;

    button.classList.toggle("button-on", input.checked);
    button.setAttribute("aria-pressed", String(input.checked));
  }

  function syncAllToggleButtonStates() {
    document.querySelectorAll("[data-setting-toggle]").forEach((button) => {
      const input = document.getElementById(button.dataset.settingToggle);
      if (input instanceof HTMLInputElement) syncToggleButtonState(input);
    });
  }

  // Load settings into the UI
  loadSettings();
  applyGridSetting();
  applyGridSizeSetting();
  applyButtonTextSetting();
  applyFontSizeSetting();
  applyAlphaSetting();
  localStorage.removeItem("global.maximize");
  initGridSizeKnob();
  initFontSizeKnob();
  initNumericKnob(settings.defaultBPMKnob, settings.defaultBPM, {
    defaultValue: defaults.defaultBPM,
    min: numericRanges.defaultBPM.min,
    max: numericRanges.defaultBPM.max,
    step: 1,
    dragStep: 1,
    dragPixelsPerStep: knobDragPixelsSensitive,
    decimals: 0,
  });
  initDefaultRPMKnob();
  initNumericKnob(settings.a4HzKnob, settings.a4Hz, {
    defaultValue: defaults.a4Hz,
    min: numericRanges.a4Hz.min,
    max: numericRanges.a4Hz.max,
    step: 1,
    dragStep: 1,
    dragPixelsPerStep: knobDragPixelsSensitive,
    decimals: 0,
  });
  initNumericKnob(settings.speedOfSoundKnob, settings.speedOfSound, {
    defaultValue: defaults.speedOfSound,
    min: numericRanges.speedOfSound.min,
    max: numericRanges.speedOfSound.max,
    step: 1,
    dragStep: 1,
    dragPixelsPerStep: knobDragPixelsSensitive,
    decimals: 0,
  });

  document.querySelectorAll("[data-setting-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.settingToggle);
      if (!(input instanceof HTMLInputElement)) return;

      input.checked = !input.checked;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      syncToggleButtonState(input);
    });
  });

  document.querySelectorAll(".settings-toggle-row input[type=checkbox]").forEach((input) => {
    input.addEventListener("change", () => syncToggleButtonState(input));
  });

  // Event listeners
  if (settings.grid) {
    settings.grid.addEventListener("change", () => {
      saveGridSetting();
      applyGridSetting();
      if (window.applySiteSettings) window.applySiteSettings();
    });
  }

  if (settings.guides) {
    settings.guides.addEventListener("change", () => {
      saveGuidesSetting();
      if (window.PekoGuides) window.PekoGuides.setGlobal(settings.guides.checked);
      if (window.applySiteSettings) window.applySiteSettings();
    });
  }

  if (settings.brightGuides) {
    settings.brightGuides.addEventListener("change", () => {
      localStorage.setItem("global.bright_guides", settings.brightGuides.checked);
      if (window.PekoBrightGuides) window.PekoBrightGuides.setGlobal(settings.brightGuides.checked);
      if (window.applySiteSettings) window.applySiteSettings();
    });
  }

  if (settings.sound) {
    settings.sound.addEventListener("change", () => {
      saveSoundSetting();
    });
  }

  if (settings.haptics) {
    settings.haptics.addEventListener("change", () => {
      saveHapticsSetting();
      if (window.applySiteSettings) window.applySiteSettings();
    });
  }

  if (settings.headers) {
    settings.headers.addEventListener("change", () => {
      saveHeadersSetting();
      if (window.applySiteSettings) window.applySiteSettings();
    });
  }

  if (settings.layout) {
    settings.layout.addEventListener("change", () => {
      saveLayoutSetting();
      if (window.applySiteSettings) window.applySiteSettings();
    });
  }

  if (settings.toggleButtonText) {
    settings.toggleButtonText.addEventListener("change", () => {
      saveButtonTextSetting();
      applyButtonTextSetting();
      if (window.applySiteSettings) window.applySiteSettings();
    });
  }

  if (settings.fontSizeSelector) {
    settings.fontSizeSelector.addEventListener("change", () => {
      setFontSize(settings.fontSizeSelector.value, true);
    });
  }

  if (settings.toggleAlpha) {
    settings.toggleAlpha.addEventListener("change", () => {
      saveAlphaSetting();
      applyAlphaSetting();
      if (window.applySiteSettings) window.applySiteSettings();
    });
  }

  if (settings.multicolor) {
    settings.multicolor.addEventListener("change", () => {
      setGlobalMulticolor(settings.multicolor.checked);
    });
  }

  if (settings.toggleWrap) {
    settings.toggleWrap.addEventListener("change", () => {
      saveWrapSetting();
      if (window.applySiteSettings) window.applySiteSettings();
    });
  }

  if (settings.defaultBPM) {
    settings.defaultBPM.addEventListener("input", () => {
      const val = clampSettingNumber(settings.defaultBPM.value, numericRanges.defaultBPM.min, numericRanges.defaultBPM.max, defaults.defaultBPM);
      settings.defaultBPM.value = `${val}`;
      localStorage.setItem("global.default_bpm", val);
      dispatchGlobalDefaultsChange("bpm");
    });
  }

  if (settings.defaultRPM) {
    settings.defaultRPM.addEventListener("input", () => {
      const val = parseFloat(settings.defaultRPM.value);
      if (!isNaN(val)) {
        localStorage.setItem("global.default_rpm", val);
        dispatchGlobalDefaultsChange("rpm");
      }
    });
  }

  if (settings.a4Hz) {
    settings.a4Hz.addEventListener("input", () => {
      const val = clampSettingNumber(settings.a4Hz.value, numericRanges.a4Hz.min, numericRanges.a4Hz.max, defaults.a4Hz);
      settings.a4Hz.value = `${val}`;
      localStorage.setItem("global.a4_hz", val);
      dispatchGlobalDefaultsChange("a4_hz");
    });
  }

  if (settings.speedOfSound) {
    settings.speedOfSound.addEventListener("input", () => {
      const val = clampSettingNumber(settings.speedOfSound.value, numericRanges.speedOfSound.min, numericRanges.speedOfSound.max, defaults.speedOfSound);
      settings.speedOfSound.value = `${val}`;
      localStorage.setItem("global.speed_of_sound", val);
      dispatchGlobalDefaultsChange("speed_of_sound");
    });
  }

  if (settings.resetButton) {
    settings.resetButton.addEventListener("click", () => {
      resetSettings();
    });
  }

  // Load from localStorage

  function loadSettings() {
    if (settings.grid) {
      settings.grid.checked = (localStorage.getItem("global.grid") ?? defaults.grid) === "true";
    }
    if (settings.guides) {
      settings.guides.checked = window.PekoGuides
        ? window.PekoGuides.getGlobal()
        : (localStorage.getItem("global.guides") ?? String(defaults.guides)) === "true";
    }
    if (settings.brightGuides) {
      settings.brightGuides.checked = window.PekoBrightGuides
        ? window.PekoBrightGuides.getGlobal()
        : (localStorage.getItem("global.bright_guides") ?? String(defaults.brightGuides)) === "true";
    }
    if (settings.sound) {
      settings.sound.checked = window.PekoSound
        ? window.PekoSound.getGlobal()
        : (localStorage.getItem("global.sound") ?? String(defaults.sound)) === "true";
    }
    const savedGridSize = normalizeGridSize(parseInt(localStorage.getItem("global.grid_size") ?? `${defaults.gridSize}`, 10));
    setGridSize(savedGridSize, false);
    if (settings.haptics) {
      settings.haptics.checked = window.PekoHaptics
        ? window.PekoHaptics.getGlobal()
        : (localStorage.getItem("global.haptics") ?? defaults.haptics) === "true";
    }
    if (settings.headers) {
      settings.headers.checked = localStorage.getItem("global.headers") !== "false";
    }
    if (settings.layout) {
      settings.layout.checked = localStorage.getItem("global.layout") !== "false";
    }
    if (settings.toggleButtonText) {
      settings.toggleButtonText.checked = (localStorage.getItem("global.toggle_button_text") ?? defaults.toggleButtonText) === "true";
    }
    if (settings.fontSizeSelector) {
      const savedFontSize = localStorage.getItem("global.font_size") ?? defaults.fontSize;
      setFontSize(savedFontSize, false);
    }
    if (settings.toggleAlpha) {
      settings.toggleAlpha.checked = (localStorage.getItem("global.alpha") ?? defaults.alpha) === "true";
    }
    if (settings.multicolor) {
      settings.multicolor.checked = (localStorage.getItem("global.multicolor") ?? String(defaults.multicolor)) === "true";
    }
    if (settings.toggleWrap) {
      settings.toggleWrap.checked = (localStorage.getItem("global.wrap") ?? defaults.wrap) === "true";
    }
    if (settings.defaultBPM) {
      const savedBPM = clampSettingNumber(localStorage.getItem("global.default_bpm"), numericRanges.defaultBPM.min, numericRanges.defaultBPM.max, defaults.defaultBPM);
      settings.defaultBPM.value = `${savedBPM}`;
      localStorage.setItem("global.default_bpm", savedBPM);
    }
    if (settings.defaultRPM) {
      const savedRPM = parseFloat(localStorage.getItem("global.default_rpm") ?? `${defaults.defaultRPM}`);
      setDefaultRPM(savedRPM, false);
    }
    if (settings.a4Hz) {
      const savedA4Hz = clampSettingNumber(localStorage.getItem("global.a4_hz"), numericRanges.a4Hz.min, numericRanges.a4Hz.max, defaults.a4Hz);
      settings.a4Hz.value = `${savedA4Hz}`;
      localStorage.setItem("global.a4_hz", savedA4Hz);
    }
    if (settings.speedOfSound) {
      const savedSpeedOfSound = clampSettingNumber(localStorage.getItem("global.speed_of_sound"), numericRanges.speedOfSound.min, numericRanges.speedOfSound.max, defaults.speedOfSound);
      settings.speedOfSound.value = `${savedSpeedOfSound}`;
      localStorage.setItem("global.speed_of_sound", savedSpeedOfSound);
    }
    refreshNumericKnobAngles();
    syncAllToggleButtonStates();
  }

  // Save to localStorage
  function saveGridSetting() {
    localStorage.setItem("global.grid", settings.grid.checked);
  }

  function saveGuidesSetting() {
    localStorage.setItem("global.guides", settings.guides.checked);
  }

  function saveSoundSetting() {
    if (window.PekoSound) {
      window.PekoSound.setGlobal(settings.sound.checked);
      return;
    }
    localStorage.setItem("global.sound", String(settings.sound.checked));
  }

  function saveGridSizeSetting() {
    localStorage.setItem("global.grid_size", getCurrentGridSize());
  }

  function saveHapticsSetting() {
    if (window.PekoHaptics) {
      window.PekoHaptics.setGlobal(settings.haptics.checked);
      return;
    }
    localStorage.setItem("global.haptics", settings.haptics.checked);
  }

  function saveHeadersSetting() {
    localStorage.setItem("global.headers", settings.headers.checked);
  }

  function saveLayoutSetting() {
    localStorage.setItem("global.layout", settings.layout.checked);
  }

  function saveButtonTextSetting() {
    localStorage.setItem("global.toggle_button_text", settings.toggleButtonText.checked);
  }

  function saveFontSizeSetting() {
    localStorage.setItem("global.font_size", settings.fontSizeSelector.value);
  }

  function saveAlphaSetting() {
    localStorage.setItem("global.alpha", settings.toggleAlpha.checked);
  }

  function setGlobalMulticolor(nextState) {
    const enabled = !!nextState;
    localStorage.setItem("global.multicolor", String(enabled));
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (/^meters\..+\.multicolor$/.test(key || "")) {
        localStorage.removeItem(key);
      }
    }
    window.dispatchEvent(new CustomEvent("pekosoft:multicolor-global-change", {
      detail: { enabled }
    }));
  }

  function saveWrapSetting() {
    const nextWrapState = settings.toggleWrap.checked;
    if (window.PekoWrap) {
      window.PekoWrap.setGlobal(nextWrapState);
      return;
    }
    localStorage.setItem("global.wrap", String(nextWrapState));
    clearPanelWrapOverrides();
  }

  function dispatchGlobalDefaultsChange(changed) {
    window.dispatchEvent(new CustomEvent("pekosoft:global-defaults-change", {
      detail: {
        changed,
        bpm: clampSettingNumber(localStorage.getItem("global.default_bpm"), numericRanges.defaultBPM.min, numericRanges.defaultBPM.max, defaults.defaultBPM),
        rpm: normalizeRPMPreset(parseFloat(localStorage.getItem("global.default_rpm"))),
        a4Hz: clampSettingNumber(localStorage.getItem("global.a4_hz"), numericRanges.a4Hz.min, numericRanges.a4Hz.max, defaults.a4Hz),
        speedOfSound: clampSettingNumber(localStorage.getItem("global.speed_of_sound"), numericRanges.speedOfSound.min, numericRanges.speedOfSound.max, defaults.speedOfSound)
      }
    }));
  }

  function clearPanelWrapOverrides() {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.endsWith(".panel_wrap")) localStorage.removeItem(key);
    }
  }

  // Apply individual settings
  function applyGridSetting() {
    // intentionally left blank
  }

  function applyGridSizeSetting() {
    const size = getCurrentGridSize();
    document.documentElement.style.setProperty("--grid-size", `${size}px`);
  }

  function applyButtonTextSetting() {
    // intentionally left blank
  }

  function applyFontSizeSetting() {
    const fontSize = settings.fontSizeSelector.value;
    window.applyFontSize(fontSize);
  }

  function applyAlphaSetting() {
    const alphaOn = localStorage.getItem("global.alpha") === "true";

    const originalGrey = getComputedStyle(document.documentElement)
      .getPropertyValue("--grey1")
      .trim();

    const color = alphaOn
      ? expandHex(originalGrey) + "80"
      : originalGrey;

    document.documentElement.style.setProperty("--grey1", color);
  }

  function expandHex(hex) {
    // expand shorthand like #222 → #222222
    if (hex.length === 4) {
      return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex.slice(0, 7); // removes alpha if present
  }

  // Reset settings to defaults
  function resetSettings() {
    const stopButton = document.getElementById("stop-button");
    const toolResetButton = document.getElementById("reset-button");

    stopButton?.click();
    toolResetButton?.click();

    localStorage.clear();
    localStorage.setItem("global.grid", defaults.grid);
    localStorage.setItem("global.grid_size", defaults.gridSize);
    localStorage.setItem("global.guides", defaults.guides);
    if (window.PekoGuides) window.PekoGuides.setGlobal(defaults.guides);
    localStorage.setItem("global.bright_guides", defaults.brightGuides);
    if (window.PekoBrightGuides) window.PekoBrightGuides.setGlobal(defaults.brightGuides);
    if (window.PekoSound) {
      window.PekoSound.setGlobal(defaults.sound);
    } else {
      localStorage.setItem("global.sound", defaults.sound);
    }
    if (window.PekoHaptics) {
      window.PekoHaptics.setGlobal(defaults.haptics);
    } else {
      localStorage.setItem("global.haptics", defaults.haptics);
    }
    localStorage.setItem("global.headers", defaults.headers);
    localStorage.setItem("global.layout", defaults.layout);
    localStorage.setItem("global.toggle_button_text", defaults.toggleButtonText);
    localStorage.setItem("global.font_size", defaults.fontSize);
    localStorage.setItem("global.alpha", defaults.alpha);
    setGlobalMulticolor(defaults.multicolor);
    if (window.PekoWrap) {
      window.PekoWrap.setGlobal(defaults.wrap);
    } else {
      localStorage.setItem("global.wrap", defaults.wrap);
      clearPanelWrapOverrides();
    }
    localStorage.setItem("global.input_backgrounds_enabled", defaults.inputBackgroundsEnabled);
    localStorage.setItem("global.theme", defaults.theme);
    localStorage.setItem("global.footer", defaults.footer);
    localStorage.setItem("global.default_bpm", defaults.defaultBPM);
    localStorage.setItem("global.default_rpm", defaults.defaultRPM);
    localStorage.setItem("global.a4_hz", defaults.a4Hz);
    localStorage.setItem("global.speed_of_sound", defaults.speedOfSound);
    dispatchGlobalDefaultsChange("all");

    // Also apply immediately
    window.enableInputBackgrounds = defaults.inputBackgroundsEnabled;
    const toggle = document.getElementById("toggle-bars");
    if (toggle) toggle.checked = defaults.inputBackgroundsEnabled;

    document.querySelectorAll('input[type="number"]').forEach(input => {
      const val = parseFloat(input.value) || 0;
      input.style.backgroundSize = window.enableInputBackgrounds ? `${val}px 4px` : "0px 4px";
    });

    if (typeof applyColorTheme === "function") applyColorTheme(defaults.theme);
    if (typeof updateFooterVisibility === "function") updateFooterVisibility();
    if (typeof stopSitePlay === "function") stopSitePlay();
    loadSettings();
    if (window.applySiteSettings) window.applySiteSettings();

    // Restore any minimized modules immediately, no page refresh needed
    document.querySelectorAll(".module-minimized").forEach((container) => {
      container.classList.remove("module-minimized");
      container.querySelector(".module-minimize-btn")?.classList.remove("button-on");
    });

    // Close the settings panel on mobile
    if (typeof isDesktopSidebarLayout === "function" && !isDesktopSidebarLayout()) {
      const settingsPanel = document.getElementById("settings-panel");
      settingsPanel?.classList.remove("settings-panel-open");
      document.getElementById("toggle-settings-panel-button")?.setAttribute("aria-expanded", "false");
    }
  }

  function normalizeGridSize(value) {
    return gridSizes.includes(value) ? value : defaults.gridSize;
  }

  function normalizeFontSize(value) {
    return fontSizes.includes(value) ? value : defaults.fontSize;
  }

  function normalizeRPMPreset(value) {
    if (!Number.isFinite(value)) return defaults.defaultRPM;
    let closest = rpmPresets[0];
    let minDistance = Math.abs(value - closest);
    for (const preset of rpmPresets) {
      const distance = Math.abs(value - preset);
      if (distance < minDistance) {
        minDistance = distance;
        closest = preset;
      }
    }
    return closest;
  }

  function clampSettingNumber(value, min, max, fallback) {
    const number = parseFloat(value);
    const safeValue = Number.isFinite(number) ? number : fallback;
    return Math.min(max, Math.max(min, safeValue));
  }

  function getCurrentGridSize() {
    return normalizeGridSize(parseInt(settings.gridSizeValue?.value || `${defaults.gridSize}`, 10));
  }

  function setGridSize(value, persist = true) {
    const normalized = normalizeGridSize(value);
    const index = gridSizes.indexOf(normalized);
    const angle = -135 + (index / (gridSizes.length - 1)) * 270;

    if (settings.gridSizeValue) {
      settings.gridSizeValue.value = `${normalized}`;
    }
    if (settings.gridSizeKnob) {
      settings.gridSizeKnob.style.setProperty("--knob-angle", `${angle}deg`);
    }

    if (persist) {
      saveGridSizeSetting();
      applyGridSizeSetting();
      if (window.applySiteSettings) window.applySiteSettings();
    }
  }

  function updateGridSizeFromPointer(event) {
    const current = getCurrentGridSize();
    const index = gridSizes.indexOf(current);
    return Math.max(0, index);
  }

  function initGridSizeKnob() {
    const current = normalizeGridSize(parseInt(localStorage.getItem("global.grid_size") ?? `${defaults.gridSize}`, 10));
    setGridSize(current, false);
    applyGridSizeSetting();
    initDiscreteKnob(settings.gridSizeKnob, {
      values: gridSizes,
      getValue: getCurrentGridSize,
      setValue: (value) => setGridSize(value, true),
      defaultValue: defaults.gridSize,
    });
  }

  function getCurrentFontSize() {
    return normalizeFontSize(settings.fontSizeSelector?.value || defaults.fontSize);
  }

  function getCurrentRPMPreset() {
    return normalizeRPMPreset(parseFloat(settings.defaultRPM?.value || `${defaults.defaultRPM}`));
  }

  function setFontSize(value, persist = true) {
    const normalized = normalizeFontSize(value);
    const index = fontSizes.indexOf(normalized);
    const angle = -135 + (index / (fontSizes.length - 1)) * 270;

    if (settings.fontSizeSelector) {
      settings.fontSizeSelector.value = normalized;
    }
    if (settings.fontSizeKnob) {
      settings.fontSizeKnob.style.setProperty("--knob-angle", `${angle}deg`);
    }

    if (persist) {
      saveFontSizeSetting();
      applyFontSizeSetting();
      if (window.applySiteSettings) window.applySiteSettings();
    }
  }

  function initFontSizeKnob() {
    const current = normalizeFontSize(localStorage.getItem("global.font_size") ?? defaults.fontSize);
    setFontSize(current, false);
    initDiscreteKnob(settings.fontSizeKnob, {
      values: fontSizes,
      getValue: getCurrentFontSize,
      setValue: (value) => setFontSize(value, true),
      defaultValue: defaults.fontSize,
    });
  }

  function formatRPMPreset(value) {
    if (!Number.isFinite(value)) return `${defaults.defaultRPM}`;
    if (Math.abs(value - 16.667) < 0.0005) return "16.667";
    if (Math.abs(value - 33.333) < 0.0005) return "33.333";
    return Number.isInteger(value) ? `${value}` : `${value}`;
  }

  function setDefaultRPM(value, persist = true) {
    const normalized = normalizeRPMPreset(value);
    if (settings.defaultRPM) {
      settings.defaultRPM.value = formatRPMPreset(normalized);
      settings.defaultRPM.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (persist) {
      if (window.applySiteSettings) window.applySiteSettings();
    }
  }

  function initDefaultRPMKnob() {
    const savedRPM = parseFloat(localStorage.getItem("global.default_rpm") ?? `${defaults.defaultRPM}`);
    setDefaultRPM(savedRPM, false);
    initDiscreteKnob(settings.defaultRPMKnob, {
      values: rpmPresets,
      getValue: getCurrentRPMPreset,
      setValue: (value) => setDefaultRPM(value, true),
      defaultValue: defaults.defaultRPM,
    });
  }

  function initNumericKnob(knob, input, config) {
    if (!knob || !input) return;

    const decimals = Number.isInteger(config.decimals) ? config.decimals : getInputDecimals(input, config.step);
    const wheelStep = config.step ?? getStepValue(input, 1);
    const dragStep = config.dragStep ?? wheelStep;
    const dragPixelsPerStep = config.dragPixelsPerStep ?? knobDragPixelsDefault;
    const defaultValue = config.defaultValue;

    syncNumericKnobAngle(knob, input, config);

    input.addEventListener("input", () => {
      syncNumericKnobAngle(knob, input, config);
    });

    attachKnobBehavior(knob, {
      onWheel: (direction) => {
        stepNumericInput(input, direction * wheelStep, decimals, config);
        syncNumericKnobAngle(knob, input, config);
      },
      onHome: () => {
        const inputMin = input.min === "" ? -Infinity : parseFloat(input.min);
        const min = Number.isFinite(config.min) ? config.min : inputMin;
        if (!Number.isFinite(min)) return;
        setNumericInputValue(input, min, decimals, config);
        syncNumericKnobAngle(knob, input, config);
      },
      onEnd: () => {
        const inputMax = input.max === "" ? Infinity : parseFloat(input.max);
        const max = Number.isFinite(config.max) ? config.max : inputMax;
        if (!Number.isFinite(max)) return;
        setNumericInputValue(input, max, decimals, config);
        syncNumericKnobAngle(knob, input, config);
      },
      onDoubleClick: () => {
        setNumericInputValue(input, defaultValue, decimals, config);
        syncNumericKnobAngle(knob, input, config);
      },
      onDragStart: () => parseFloat(input.value || `${defaultValue}`) || defaultValue,
      onDragMove: ({ startValue, deltaY }) => {
        const nextValue = startValue + Math.round(deltaY / dragPixelsPerStep) * dragStep;
        setNumericInputValue(input, nextValue, decimals, config);
        syncNumericKnobAngle(knob, input, config);
      },
    });
  }

  function initDiscreteKnob(knob, config) {
    if (!knob) return;

    const dragPixelsPerStep = config.dragPixelsPerStep ?? knobDragPixelsDefault;

    const updateAngle = () => {
      const current = config.getValue();
      const index = Math.max(0, config.values.indexOf(current));
      const angle = -135 + (index / Math.max(1, config.values.length - 1)) * 270;
      knob.style.setProperty("--knob-angle", `${angle}deg`);
      return index;
    };

    updateAngle();

    attachKnobBehavior(knob, {
      onWheel: (direction) => {
        const current = config.getValue();
        const index = Math.max(0, config.values.indexOf(current));
        const nextIndex = Math.max(0, Math.min(config.values.length - 1, index + direction));
        config.setValue(config.values[nextIndex]);
        updateAngle();
      },
      onHome: () => {
        config.setValue(config.values[0]);
        updateAngle();
      },
      onEnd: () => {
        config.setValue(config.values[config.values.length - 1]);
        updateAngle();
      },
      onDoubleClick: () => {
        config.setValue(config.defaultValue);
        updateAngle();
      },
      onDragStart: () => Math.max(0, config.values.indexOf(config.getValue())),
      onDragMove: ({ startValue, deltaY }) => {
        const nextIndex = Math.max(0, Math.min(config.values.length - 1, startValue + Math.round(deltaY / dragPixelsPerStep)));
        config.setValue(config.values[nextIndex]);
        updateAngle();
      },
    });
  }

  function attachKnobBehavior(knob, handlers) {
    let isDragging = false;
    let dragStartY = 0;
    let dragMoved = false;
    let suppressClick = false;
    let dragStartValue;

    knob.addEventListener("click", () => {
      if (suppressClick) {
        suppressClick = false;
      }
    });

    knob.addEventListener("wheel", (event) => {
      event.preventDefault();
      handlers.onWheel(event.deltaY > 0 ? -1 : 1);
    }, { passive: false });

    knob.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp" || event.key === "ArrowRight") {
        event.preventDefault();
        handlers.onWheel(1);
      } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
        event.preventDefault();
        handlers.onWheel(-1);
      } else if (event.key === "Home" && typeof handlers.onHome === "function") {
        event.preventDefault();
        handlers.onHome();
      } else if (event.key === "End" && typeof handlers.onEnd === "function") {
        event.preventDefault();
        handlers.onEnd();
      }
    });

    knob.addEventListener("dblclick", (event) => {
      event.preventDefault();
      handlers.onDoubleClick();
    });

    knob.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (typeof knob.focus === "function") {
        knob.focus({ preventScroll: true });
      }
      isDragging = true;
      dragStartY = event.clientY;
      dragMoved = false;
      suppressClick = false;
      dragStartValue = handlers.onDragStart();
      if (typeof knob.setPointerCapture === "function") {
        try {
          knob.setPointerCapture(event.pointerId);
        } catch (_) {
          // Ignore capture failures; drag still works without explicit capture.
        }
      }
    });

    knob.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      event.preventDefault();
      if (Math.abs(event.clientY - dragStartY) >= 6) {
        dragMoved = true;
      }
      handlers.onDragMove({ startValue: dragStartValue, deltaY: dragStartY - event.clientY });
    });

    const endDrag = (event) => {
      if (!isDragging) return;
      isDragging = false;
      if (dragMoved) {
        suppressClick = true;
      }
      if (typeof knob.releasePointerCapture === "function") {
        try {
          knob.releasePointerCapture(event.pointerId);
        } catch (_) {
          // Ignore if capture was never acquired.
        }
      }
    };

    knob.addEventListener("pointerup", endDrag);
    knob.addEventListener("pointercancel", endDrag);
  }

  function getStepValue(input, fallback) {
    const parsed = parseFloat(input.step);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function getInputDecimals(input, fallbackStep = 1) {
    const step = input.step && input.step !== "any" ? input.step : `${fallbackStep}`;
    const decimalPart = step.includes(".") ? step.split(".")[1] : "";
    return decimalPart.length;
  }

  function clampNumericValue(value, input, config) {
    const inputMin = input.min === "" ? -Infinity : parseFloat(input.min);
    const inputMax = input.max === "" ? Infinity : parseFloat(input.max);
    const min = Number.isFinite(config.min) ? config.min : inputMin;
    const max = Number.isFinite(config.max) ? config.max : inputMax;
    return Math.min(max, Math.max(min, value));
  }

  function setNumericInputValue(input, value, decimals, config) {
    const clamped = clampNumericValue(value, input, config);
    const formatted = decimals > 0 ? clamped.toFixed(decimals) : `${Math.round(clamped)}`;
    input.value = formatted;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function stepNumericInput(input, delta, decimals, config) {
    const current = parseFloat(input.value || `${config.defaultValue}`);
    const baseValue = Number.isFinite(current) ? current : config.defaultValue;
    setNumericInputValue(input, baseValue + delta, decimals, config);
  }

  function syncNumericKnobAngle(knob, input, config) {
    const current = parseFloat(input.value || `${config.defaultValue}`);
    const value = Number.isFinite(current) ? current : config.defaultValue;
    const min = Number.isFinite(config.min) ? config.min : (input.min === "" ? config.defaultValue - 100 : parseFloat(input.min));
    const max = Number.isFinite(config.max) ? config.max : (input.max === "" ? config.defaultValue + 100 : parseFloat(input.max));
    const safeMax = max <= min ? min + 1 : max;
    const ratio = Math.min(1, Math.max(0, (value - min) / (safeMax - min)));
    const angle = -135 + ratio * 270;
    knob.style.setProperty("--knob-angle", `${angle}deg`);
  }

  function refreshNumericKnobAngles() {
    syncNumericKnobAngle(settings.defaultBPMKnob, settings.defaultBPM, {
      defaultValue: defaults.defaultBPM,
      min: numericRanges.defaultBPM.min,
      max: numericRanges.defaultBPM.max,
    });
    syncNumericKnobAngle(settings.a4HzKnob, settings.a4Hz, {
      defaultValue: defaults.a4Hz,
      min: numericRanges.a4Hz.min,
      max: numericRanges.a4Hz.max,
    });
    syncNumericKnobAngle(settings.speedOfSoundKnob, settings.speedOfSound, {
      defaultValue: defaults.speedOfSound,
      min: numericRanges.speedOfSound.min,
      max: numericRanges.speedOfSound.max,
    });
  }
});

// Expose applyFontSize globally for user.js
window.applyFontSize = function (size) {
  const fontSizeValue =
    size === "small" ? "12px" :
      size === "medium" ? "18px" :
        "22px";
  document.documentElement.style.setProperty("--font-size", fontSizeValue);
}

// END OF FILE
