// User Settings
// pekosoft.net/js/user.js

document.addEventListener("DOMContentLoaded", () => {
  const layoutMedia = window.matchMedia("(min-width: 800px)");

  applySiteSettings();

  window.applySiteSettings = applySiteSettings;

  if (typeof layoutMedia.addEventListener === "function") {
    layoutMedia.addEventListener("change", applySiteSettings);
  } else if (typeof layoutMedia.addListener === "function") {
    layoutMedia.addListener(applySiteSettings);
  }

  requestAnimationFrame(applySiteSettings);
  requestAnimationFrame(() => requestAnimationFrame(applySiteSettings));
  window.addEventListener("load", applySiteSettings);
  window.setTimeout(applySiteSettings, 100);
  window.setTimeout(applySiteSettings, 300);

  const heading = document.querySelector(".top-heading");
  if (heading && typeof ResizeObserver === "function") {
    const headingObserver = new ResizeObserver(applySiteSettings);
    headingObserver.observe(heading);
  }

  function applySiteSettings() {
    // GRID TOGGLE

    const grid = localStorage.getItem("global.grid") === "true";
    if (grid) {
      document.documentElement.classList.add("show-grid");
    } else {
      document.documentElement.classList.remove("show-grid");
    }

    const allowedGridSizes = [4, 8, 16, 32, 64];
    const parsedGridSize = parseInt(localStorage.getItem("global.grid_size") || "16", 10);
    const gridSize = allowedGridSizes.includes(parsedGridSize) ? parsedGridSize : 16;
    document.documentElement.style.setProperty("--grid-size", `${gridSize}px`);

    // FONT SIZE

    const fontSize = localStorage.getItem("global.font_size") || "large";
    applyFontSize(fontSize);

    // BUTTON TEXT TOGGLE

    const showText = localStorage.getItem("global.toggle_button_text") === "true";
    document.body.classList.toggle("show-button-text", showText);
    document.querySelectorAll("button:not(.transparent):not(.icon-only)").forEach(btn => {
      // Keep header buttons and TOC buttons with their original styling
      const isHeaderButton = btn.closest(".top-heading, .heading");
      const isTocButton = btn.classList.contains("toc-button");
      if (isHeaderButton || isTocButton) return;
      
      if (showText) {
        btn.classList.remove("square");
      } else {
        btn.classList.add("square");
      }
    });

    // MODULE HEADERS TOGGLE

    const showHeaders = localStorage.getItem("global.headers") !== "false";
    if (!showHeaders) {
      document.querySelectorAll(".module-minimized").forEach(container => {
        container.classList.remove("module-minimized");
        const minimizeBtn = container.querySelector(".module-minimize-btn");
        if (minimizeBtn) minimizeBtn.classList.remove("button-on");
        const id = container.id ? container.id.replace("-container", "") : null;
        if (id) localStorage.setItem("module_" + id + "_state", "normal");
      });
      document.querySelectorAll(".module-icon-panel").forEach(panel => {
        panel.hidden = true;
        panel.closest(".container")?.classList.remove("module-icon-panel-open");
      });
      document.querySelectorAll(".module-icon-btn").forEach(button => {
        button.classList.remove("button-on");
        button.setAttribute("aria-expanded", "false");
      });
      document.querySelectorAll(".module-more-btn").forEach(button => {
        button.classList.remove("button-on");
        button.setAttribute("aria-expanded", "false");
        window.syncModuleMoreButtonState?.(button.closest(".container"));
      });
      document.querySelectorAll(".module-header-actions").forEach(actions => {
        actions.hidden = true;
      });
      document.querySelectorAll(".module-title").forEach(title => {
        title.hidden = false;
      });
    }
    document.body.classList.toggle("hide-module-headers", !showHeaders);

    // LAYOUT TOGGLE

    const twoColumnLayout = localStorage.getItem("global.layout") !== "false";
    const modulePage = document.documentElement.classList.contains("modules-page");
    const twoColumnLayoutActive = twoColumnLayout && modulePage && layoutMedia.matches;
    document.documentElement.classList.toggle("layout-two-columns", twoColumnLayout);
    document.body.classList.toggle("layout-two-columns", twoColumnLayoutActive);

    document.querySelectorAll(".container").forEach(container => {
      const id = container.id ? container.id.replace("-container", "") : null;
      const minimizeBtn = container.querySelector(".module-minimize-btn");

      if (twoColumnLayoutActive && container.classList.contains("module-minimized")) {
        container.classList.remove("module-minimized");
        if (minimizeBtn) minimizeBtn.classList.remove("button-on");
        window.syncModuleMoreButtonState?.(container);
        if (id) localStorage.setItem("module_" + id + "_state", "normal");
      }

      if (minimizeBtn) {
        minimizeBtn.classList.toggle("grey", twoColumnLayoutActive);
        minimizeBtn.disabled = twoColumnLayoutActive;
        minimizeBtn.setAttribute("aria-disabled", twoColumnLayoutActive ? "true" : "false");
        minimizeBtn.title = twoColumnLayoutActive ? "Minimize" : "Minimize";
      }
    });

    // ALPHA TOGGLE

    const alphaOn = localStorage.getItem("global.alpha") === "true";

    // Read --grey1 from index.css
    let baseGrey = getComputedStyle(document.documentElement)
      .getPropertyValue("--grey1")
      .trim();

    // Expand shorthand hex (#222 → #222222)
    if (baseGrey.length === 4) {
      baseGrey = "#" + baseGrey[1] + baseGrey[1] + baseGrey[2] + baseGrey[2] + baseGrey[3] + baseGrey[3];
    }

    // Remove existing alpha if already present (e.g. #22222280)
    baseGrey = baseGrey.slice(0, 7);

    // Append alpha if enabled
    const finalGrey = alphaOn ? baseGrey + "80" : baseGrey;

    // Apply
    document.documentElement.style.setProperty("--grey1", finalGrey);

    const heading = document.querySelector(".top-heading");
    const layoutTopPadding = heading ? Math.ceil(heading.getBoundingClientRect().bottom + 16) : 64;
    document.body.style.paddingTop = `${layoutTopPadding}px`;
  }

  function applyFontSize(size) {
    const fontSizeValue =
      size === "small" ? "12px" :
        size === "medium" ? "18px" :
          "22px";
    document.documentElement.style.setProperty("--font-size", fontSizeValue);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle-bars");

  if (toggle) {
    // Load saved preference from localStorage
    const saved = localStorage.getItem("global.input_backgrounds_enabled");
    const enabled = saved !== "false"; // default to true
    toggle.checked = enabled;
    window.enableInputBackgrounds = enabled;

    // On toggle change
    toggle.addEventListener("change", () => {
      const value = toggle.checked;
      localStorage.setItem("global.input_backgrounds_enabled", value);
      window.enableInputBackgrounds = value;

      // Refresh all input backgrounds
      document.querySelectorAll('input[type="number"]').forEach(input => {
        input.style.backgroundSize = value
          ? `${parseFloat(input.value) || 0}px 4px`
          : "0px 4px";
      });
    });
  }
});

// FIELD BAR TOGGLE

(function setupInputBackgrounds() {
  const toggleId = "toggle-bars";

  // Init global flag from localStorage, default true
  const saved = localStorage.getItem("global.input_backgrounds_enabled")
  window.enableInputBackgrounds = saved === null ? true : saved === "true";

  // Background updater for input[type=number]
  function updateBackground(input) {
    if (!window.enableInputBackgrounds) {
      input.style.backgroundSize = "0px 4px";
      return;
    }
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      input.style.backgroundSize = `${value}px 4px`;
    }
  }


  // Attach background behavior to all number inputs
  function observeInputs() {
    const inputs = document.querySelectorAll('input[type="number"]');

    inputs.forEach(input => {
      updateBackground(input);

      input.addEventListener('input', () => updateBackground(input));

      // Monkey patch setter to catch programmatic .value changes
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (descriptor && descriptor.configurable && !input.__patched) {
        const originalSet = descriptor.set;
        Object.defineProperty(input, 'value', {
          get: descriptor.get,
          set(newVal) {
            originalSet.call(this, newVal);
            updateBackground(this);
          }
        });
        input.__patched = true; // Prevent double-patching
      }
    });
  }

  // Initial run
  function init() {
    observeInputs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Toggle handler for checkbox
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;

    toggle.checked = window.enableInputBackgrounds;

    toggle.addEventListener("change", () => {
      const value = toggle.checked;
      localStorage.setItem("global.input_backgrounds_enabled", value);
      window.enableInputBackgrounds = value;

      document.querySelectorAll('input[type="number"]').forEach(updateBackground);
    });
  });
})();

// END OF FILE
