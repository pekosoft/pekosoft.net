// Pekosoft Index
// pekosoft.net/js/index.js

function syncPekosoftViewport() {
  const viewport = window.visualViewport;
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;
  const offsetTop = viewport ? viewport.offsetTop : 0;
  const bottomGap = viewport ? window.innerHeight - viewport.offsetTop - viewport.height : 0;
  const root = document.documentElement;

  if (Number.isFinite(width) && width > 0) {
    root.style.setProperty('--visual-viewport-width', `${Math.round(width)}px`);
  }

  if (Number.isFinite(height) && height > 0) {
    const roundedHeight = Math.round(height);
    root.style.setProperty('--visual-viewport-height', `${roundedHeight}px`);
    root.style.setProperty('--module-viewport-height', `${roundedHeight}px`);
  }

  if (Number.isFinite(offsetTop) && offsetTop >= 0) {
    root.style.setProperty('--visual-viewport-offset-top', `${Math.round(offsetTop)}px`);
  }

  if (Number.isFinite(bottomGap)) {
    root.style.setProperty('--visual-viewport-bottom-gap', `${Math.max(0, Math.round(bottomGap))}px`);
  }
}

window.syncPekosoftViewport = syncPekosoftViewport;
syncPekosoftViewport();
window.addEventListener('resize', syncPekosoftViewport);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncPekosoftViewport);
  window.visualViewport.addEventListener('scroll', syncPekosoftViewport);
}

// Function to toggle the TOC visibility

function isDesktopSidebarLayout() {
  return window.matchMedia("(min-width: 800px)").matches;
}

function getCurrentToolControlKey(button) {
  const slug = (window.location.pathname || '')
    .replace(/\/$/, '')
    .split('/')
    .pop()
    ?.replace(/\.php$/i, '') || 'index';
  return `${slug}:${button.id}`;
}

function getLocalToggleRegistry(storageKey, controlKeys, defaultEnabled) {
  let registry = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved && typeof saved === 'object') registry = saved;
  } catch (_) {
    // A malformed registry is replaced with the current global default.
  }

  controlKeys.forEach((key) => {
    if (typeof registry[key] !== 'boolean') registry[key] = defaultEnabled;
  });
  return registry;
}

function saveLocalToggleRegistry(storageKey, registry) {
  localStorage.setItem(storageKey, JSON.stringify(registry));
}

function setLocalToggleRegistryState(storageKey, controlKeys, enabled) {
  const registry = getLocalToggleRegistry(storageKey, controlKeys, enabled);
  controlKeys.forEach((key) => {
    registry[key] = enabled;
  });
  saveLocalToggleRegistry(storageKey, registry);
}

function syncLocalToggleRegistryFromButtons(storageKey, controlKeys, defaultEnabled, buttons) {
  const registry = getLocalToggleRegistry(storageKey, controlKeys, defaultEnabled);
  buttons.forEach((button) => {
    registry[getCurrentToolControlKey(button)] = button.classList.contains('button-on');
  });
  saveLocalToggleRegistry(storageKey, registry);
  return Object.values(registry).some(Boolean);
}

window.PekoLocalToggleRegistry = {
  getCurrentToolControlKey,
  get: getLocalToggleRegistry,
  save: saveLocalToggleRegistry,
  setAll: setLocalToggleRegistryState,
  syncButtons: syncLocalToggleRegistryFromButtons
};

const SOUND_REGISTRY_KEY = 'global.sound.modules';
const SOUND_CONTROL_KEYS = [
  'bpm_calculator:toggle-sound-button',
  'bpm_circle:sound-master-button',
  'bpm_curve:sound-button',
  'bpm_curve:beat-sound-button',
  'circle_of_fifths:sound-master-button',
  'drum_machine:toggle-sound-button',
  'metronome:toggle-sound-button',
  'piano:sound-master-button',
  'player:toggle-sound-button',
  'tap_pad:toggle-sound-button',
  'turntable:toggle-sound-button'
];

function getSoundButtons() {
  return [...document.querySelectorAll('#toggle-sound-button, #sound-master-button, #sound-button, #beat-sound-button')];
}

function getGlobalSound() {
  return localStorage.getItem('global.sound') !== 'false';
}

function syncGlobalSoundSetting() {
  const soundInput = document.getElementById('sound');
  const soundButton = document.querySelector('[data-setting-toggle="sound"]');
  const enabled = getGlobalSound();

  if (soundInput instanceof HTMLInputElement) soundInput.checked = enabled;
  if (soundButton) {
    soundButton.classList.toggle('button-on', enabled);
    soundButton.setAttribute('aria-pressed', String(enabled));
  }
}

function updateGlobalSoundIndicator(enabled) {
  localStorage.setItem('global.sound', String(enabled));
  syncGlobalSoundSetting();
  dispatchGlobalSoundChange(enabled);
}

let isSyncingToolSoundButtons = false;

function syncToolSoundButtons(enabled) {
  const buttons = getSoundButtons();
  isSyncingToolSoundButtons = true;
  try {
    buttons.forEach((button) => {
      if (button.classList.contains('button-on') !== enabled) button.click();
    });
  } finally {
    isSyncingToolSoundButtons = false;
  }
}

function restoreToolSoundButtons() {
  const registry = getLocalToggleRegistry(SOUND_REGISTRY_KEY, SOUND_CONTROL_KEYS, getGlobalSound());
  const buttons = getSoundButtons();
  isSyncingToolSoundButtons = true;
  try {
    buttons.forEach((button) => {
      const enabled = registry[getCurrentToolControlKey(button)];
      if (button.classList.contains('button-on') !== enabled) button.click();
    });
  } finally {
    isSyncingToolSoundButtons = false;
  }
}

function dispatchGlobalSoundChange(enabled) {
  window.dispatchEvent(new CustomEvent('pekosoft:global-sound-change', {
    detail: { enabled }
  }));
}

function setGlobalSound(enabled) {
  const nextState = !!enabled;
  setLocalToggleRegistryState(SOUND_REGISTRY_KEY, SOUND_CONTROL_KEYS, nextState);
  syncToolSoundButtons(nextState);
  updateGlobalSoundIndicator(nextState);
}

function syncGlobalSoundFromTools() {
  const buttons = getSoundButtons();
  if (!buttons.length) return;
  const anyEnabled = syncLocalToggleRegistryFromButtons(
    SOUND_REGISTRY_KEY,
    SOUND_CONTROL_KEYS,
    getGlobalSound(),
    buttons
  );
  updateGlobalSoundIndicator(anyEnabled);
}

window.PekoSound = {
  getGlobal: getGlobalSound,
  setGlobal: setGlobalSound,
  syncSetting: syncGlobalSoundSetting,
  syncFromTools: syncGlobalSoundFromTools
};

window.addEventListener('storage', (event) => {
  if (event.key !== 'global.sound') return;
  setGlobalSound(event.newValue !== 'false');
});

function initializeGlobalSoundSetting() {
  syncGlobalSoundSetting();
  restoreToolSoundButtons();
}

function getGlobalHaptics() {
  return localStorage.getItem('global.haptics') === 'true';
}

const HAPTICS_REGISTRY_KEY = 'global.haptics.modules';
const HAPTICS_CONTROL_KEYS = [
  'drum_machine:haptic-button',
  'metronome:haptic-button',
  'piano:haptic-button',
  'tap_pad:haptic-button',
  'turntable:haptic-button'
];

function clearStoredHapticsField(storageKey, field) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (!stored || typeof stored !== 'object') return;
    delete stored[field];
    localStorage.setItem(storageKey, JSON.stringify(stored));
  } catch (_) {
    localStorage.removeItem(storageKey);
  }
}

function clearHapticsLocalOverrides() {
  ['metronome.haptic', 'tap_pad.haptic', 'turntable.haptic'].forEach((key) => localStorage.removeItem(key));
  clearStoredHapticsField('drum_machine.state', 'haptic');
  clearStoredHapticsField('piano.settings', 'hapticEnabled');
}

function syncGlobalHapticsSetting() {
  const hapticsInput = document.getElementById('haptics');
  const hapticsButton = document.querySelector('[data-setting-toggle="haptics"]');
  const enabled = getGlobalHaptics();

  if (hapticsInput instanceof HTMLInputElement) hapticsInput.checked = enabled;
  if (hapticsButton) {
    hapticsButton.classList.toggle('button-on', enabled);
    hapticsButton.setAttribute('aria-pressed', String(enabled));
  }
}

function updateGlobalHapticsIndicator(enabled) {
  localStorage.setItem('global.haptics', String(enabled));
  syncGlobalHapticsSetting();
}

let isSyncingToolHapticsButtons = false;

function syncToolHapticsButtons(enabled) {
  const buttons = document.querySelectorAll('#haptic-button');
  isSyncingToolHapticsButtons = true;
  try {
    buttons.forEach((button) => {
      if (button.classList.contains('button-on') !== enabled) button.click();
    });
  } finally {
    isSyncingToolHapticsButtons = false;
  }
}

function restoreToolHapticsButtons() {
  const registry = getLocalToggleRegistry(HAPTICS_REGISTRY_KEY, HAPTICS_CONTROL_KEYS, getGlobalHaptics());
  const buttons = document.querySelectorAll('#haptic-button');
  isSyncingToolHapticsButtons = true;
  try {
    buttons.forEach((button) => {
      const enabled = registry[getCurrentToolControlKey(button)];
      if (button.classList.contains('button-on') !== enabled) button.click();
    });
  } finally {
    isSyncingToolHapticsButtons = false;
  }
}

function setGlobalHaptics(enabled) {
  const nextState = !!enabled;
  clearHapticsLocalOverrides();
  setLocalToggleRegistryState(HAPTICS_REGISTRY_KEY, HAPTICS_CONTROL_KEYS, nextState);
  syncToolHapticsButtons(nextState);
  updateGlobalHapticsIndicator(nextState);
}

function syncGlobalHapticsFromTools() {
  const buttons = [...document.querySelectorAll('#haptic-button')];
  if (!buttons.length) return;
  const anyEnabled = syncLocalToggleRegistryFromButtons(
    HAPTICS_REGISTRY_KEY,
    HAPTICS_CONTROL_KEYS,
    getGlobalHaptics(),
    buttons
  );
  updateGlobalHapticsIndicator(anyEnabled);
}

window.PekoHaptics = {
  getGlobal: getGlobalHaptics,
  setGlobal: setGlobalHaptics,
  syncSetting: syncGlobalHapticsSetting,
  syncFromTools: syncGlobalHapticsFromTools
};

function initializeGlobalHapticsSetting() {
  syncGlobalHapticsSetting();
  restoreToolHapticsButtons();
}

document.addEventListener('click', (event) => {
  if (isSyncingToolSoundButtons) return;
  if (event.target.closest('#toggle-sound-button, #sound-master-button, #sound-button, #beat-sound-button')) {
    syncGlobalSoundFromTools();
  }
});

document.addEventListener('click', (event) => {
  if (isSyncingToolHapticsButtons) return;
  if (event.target.closest('#haptic-button')) syncGlobalHapticsFromTools();
});

function syncSidebarState() {
  const tocOpen = document.getElementById('toc')?.classList.contains('toc-open') || false;
  const settingsOpen = document.getElementById('settings-panel')?.classList.contains('settings-panel-open') || false;

  document.body.classList.toggle('toc-sidebar-open', tocOpen);
  document.body.classList.toggle('settings-sidebar-open', settingsOpen);

  if (isDesktopSidebarLayout()) {
    localStorage.setItem('global.toc_sidebar_open', String(tocOpen));
    localStorage.setItem('global.settings_sidebar_open', String(settingsOpen));
  }
}

function restoreDesktopSidebarState() {
  const toc = document.getElementById('toc');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsToggle = document.getElementById('toggle-settings-panel-button');
  if (!toc || !settingsPanel || !settingsToggle) return;

  if (!isDesktopSidebarLayout()) {
    toc.classList.remove('toc-open');
    settingsPanel.classList.remove('settings-panel-open');
    settingsToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('toc-sidebar-open', 'settings-sidebar-open');
    return;
  }

  const tocOpen = localStorage.getItem('global.toc_sidebar_open') === 'true';
  const settingsOpen = localStorage.getItem('global.settings_sidebar_open') === 'true';

  toc.classList.toggle('toc-open', tocOpen);
  settingsPanel.classList.toggle('settings-panel-open', settingsOpen);
  settingsToggle.setAttribute('aria-expanded', String(settingsOpen));
  syncSidebarState();
}

function toggleMenu() {
  const toc = document.getElementById('toc');
  const settingsPanel = document.getElementById('settings-panel');

  if (settingsPanel && !isDesktopSidebarLayout()) {
    settingsPanel.classList.remove('settings-panel-open');
    document.getElementById('toggle-settings-panel-button')?.setAttribute('aria-expanded', 'false');
  }

  toc.classList.toggle('toc-open');
  syncSidebarState();
}

function toggleSettingsPanel() {
  const settingsPanel = document.getElementById('settings-panel');
  const settingsToggle = document.getElementById('toggle-settings-panel-button');
  const toc = document.getElementById('toc');
  if (!settingsPanel || !settingsToggle) return;

  if (toc && !isDesktopSidebarLayout()) {
    toc.classList.remove('toc-open');
  }

  settingsPanel.classList.toggle('settings-panel-open');
  settingsToggle.setAttribute('aria-expanded', String(settingsPanel.classList.contains('settings-panel-open')));
  syncSidebarState();
}

// Function to close the TOC when clicked outside

document.addEventListener('click', function (event) {
  if (!event.isTrusted) return;

  const toc = document.getElementById('toc');
  const burger = document.querySelector('#burger-container');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsMenu = document.querySelector('#settings-menu-container');

  const isClickInsideToc = toc.contains(event.target);
  const isClickOnBurger = burger.contains(event.target);
  const isDesktopSidebarInteraction = isDesktopSidebarLayout() &&
    ((settingsPanel?.contains(event.target) || false) || (settingsMenu?.contains(event.target) || false));

  // If click is outside of TOC and not on the burger icon, close the TOC
  if (!isDesktopSidebarLayout() && !isClickInsideToc && !isClickOnBurger && !isDesktopSidebarInteraction && toc.classList.contains('toc-open')) {
    toc.classList.remove('toc-open');
    syncSidebarState();
  }
});

document.addEventListener('click', function (event) {
  if (!event.isTrusted) return;

  const settingsPanel = document.getElementById('settings-panel');
  const settingsMenu = document.querySelector('#settings-menu-container');
  const toc = document.getElementById('toc');
  const burger = document.querySelector('#burger-container');
  if (!settingsPanel || !settingsMenu) return;

  const isDesktopSidebarInteraction = isDesktopSidebarLayout() &&
    ((toc?.contains(event.target) || false) || (burger?.contains(event.target) || false));

  if (!isDesktopSidebarLayout() && !settingsPanel.contains(event.target) && !settingsMenu.contains(event.target) && !isDesktopSidebarInteraction) {
    settingsPanel.classList.remove('settings-panel-open');
    document.getElementById('toggle-settings-panel-button')?.setAttribute('aria-expanded', 'false');
    syncSidebarState();
  }
});

// Function to close the TOC when ESC key is pressed

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    const toc = document.getElementById('toc');
    if (toc.classList.contains('toc-open')) {
      toc.classList.remove('toc-open');
    }

    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel?.classList.contains('settings-panel-open')) {
      settingsPanel.classList.remove('settings-panel-open');
      document.getElementById('toggle-settings-panel-button')?.setAttribute('aria-expanded', 'false');
    }

    syncSidebarState();
  }
});

// Function to collapse/expand DIVs

function toggleDiv(containerId) {
  const contentContainer = document.getElementById(containerId); // Get the relevant container

  if (contentContainer.classList.contains('collapsed')) {
    contentContainer.classList.remove('collapsed');
  } else {
    contentContainer.classList.add('collapsed');
  }
}

// Function to count rows in tables

function CountRows() {
  const table = document.getElementById('filter_table');
  const rowsShown = document.getElementById('rows_shown');

  if (!table || !rowsShown) return 0;

  const rows = Array.from(table.querySelectorAll('tr'));
  const visibleRows = rows.filter((row) => row.offsetParent !== null);
  const rowCount = Math.max(visibleRows.length - 1, 0);

  rowsShown.textContent = String(rowCount);
  return rowCount;
}

const COLOR_THEME_STORAGE_KEY = 'global.theme';

function getColorTheme() {
  return localStorage.getItem(COLOR_THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

function applyColorTheme(theme) {
  const normalizedTheme = theme === 'light' ? 'light' : 'dark';
  localStorage.setItem(COLOR_THEME_STORAGE_KEY, normalizedTheme);
  document.documentElement.classList.toggle('invert-colors', normalizedTheme === 'light');
  updateModeButtonState();
}

function toggleMode() {
  applyColorTheme(getColorTheme() === 'dark' ? 'light' : 'dark');
}

function updateModeButtonState() {
  const toggleModeButton = document.getElementById('toggle-mode-button');
  if (toggleModeButton) {
    const darkModeActive = getColorTheme() === 'dark';
    toggleModeButton.classList.toggle('button-on', darkModeActive);
    toggleModeButton.setAttribute('aria-pressed', String(darkModeActive));
  }
}

function updateFullscreenButtonState() {
  const toggleFullscreenButton = document.getElementById('toggle-fullscreen-button');
  if (toggleFullscreenButton) {
    toggleFullscreenButton.classList.toggle('button-on', Boolean(document.fullscreenElement));
  }
}

function normalizeNavigationPath(pathname) {
  const path = pathname.replace(/\/$/, '') || '/index.php';
  return path.replace(/\.php$/, '');
}

function isCurrentNavigationUrl(candidateUrl, currentUrl) {
  const currentPath = normalizeNavigationPath(currentUrl.pathname);
  const candidatePath = normalizeNavigationPath(candidateUrl.pathname);
  const contextPages = new Set(['/about', '/help', '/history']);

  if (!contextPages.has(currentPath)) {
    return candidatePath === currentPath;
  }

  return candidatePath === currentPath &&
    (candidateUrl.searchParams.get('t') || '') === (currentUrl.searchParams.get('t') || '');
}

function markActiveFooterLink() {
  const footerLinks = document.querySelectorAll('.footer a[href]');
  if (!footerLinks.length) return;

  const currentUrl = new URL(window.location.href);

  footerLinks.forEach(link => {
    const linkUrl = new URL(link.getAttribute('href') || '', window.location.origin);
    const isCurrent = isCurrentNavigationUrl(linkUrl, currentUrl);

    link.classList.toggle('current', isCurrent);
    if (isCurrent) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function markActiveTocButton() {
  const tocButtons = document.querySelectorAll('#toc .toc-button[data-href]');
  if (!tocButtons.length) return;

  const currentUrl = new URL(window.location.href);
  let currentMarked = false;

  tocButtons.forEach(button => {
    const buttonUrl = new URL(button.dataset.href || '', window.location.origin);
    const isCurrent = !currentMarked && isCurrentNavigationUrl(buttonUrl, currentUrl);

    if (isCurrent) {
      currentMarked = true;
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

function syncSidebarFooterHeight() {
  const footer = document.querySelector('.footer');
  const footerVisible = footer && !document.documentElement.classList.contains('footer-hidden');
  const footerHeight = footerVisible ? Math.ceil(footer.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty('--sidebar-footer-height', `${footerHeight}px`);
}

function updateFooterVisibility() {
  const footerVisible = localStorage.getItem('global.footer') !== 'false';
  document.documentElement.classList.toggle('footer-hidden', !footerVisible);
  syncSidebarFooterHeight();

  const toggleFooterButton = document.getElementById('toggle-footer-button');
  if (toggleFooterButton) {
    toggleFooterButton.setAttribute('aria-pressed', String(footerVisible));
    toggleFooterButton.classList.toggle('button-on', footerVisible);
  }
}

function toggleFooterVisibility() {
  const footerVisible = !document.documentElement.classList.contains('footer-hidden');
  localStorage.setItem('global.footer', String(!footerVisible));
  updateFooterVisibility();
}

function ensurePekosoftFilename(filename) {
  const safeName = String(filename || '').trim();
  if (!safeName) return 'pekosoft_file';
  return safeName.toLowerCase().startsWith('pekosoft_')
    ? safeName
    : `pekosoft_${safeName}`;
}

window.ensurePekosoftFilename = ensurePekosoftFilename;

document.addEventListener('pointerdown', function (event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest('button[id$="decrease-button"], button[id$="increase-button"]');
  if (button && !button.disabled) {
    button.focus({ preventScroll: true });
  }
}, true);

function bindPekosoftRangeButtons(slider, decreaseButton, increaseButton, options = {}) {
  if (!slider || !decreaseButton || !increaseButton) return null;

  const holdDelay = Math.max(0, Number(options.holdDelay) || 350);
  const repeatDelay = Math.max(16, Number(options.repeatDelay) || 80);
  let holdTimer = null;
  let repeatTimer = null;
  let didRepeat = false;

  function step(direction) {
    direction > 0 ? slider.stepUp() : slider.stepDown();
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function stopRepeating() {
    clearTimeout(holdTimer);
    clearInterval(repeatTimer);
    holdTimer = null;
    repeatTimer = null;
  }

  function bind(button, direction) {
    button.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || button.disabled) return;
      didRepeat = false;
      try {
        button.setPointerCapture?.(event.pointerId);
      } catch (_) {
        // Capture may be unavailable for synthetic or accessibility pointers.
      }
      holdTimer = setTimeout(function () {
        didRepeat = true;
        step(direction);
        repeatTimer = setInterval(function () {
          step(direction);
        }, repeatDelay);
      }, holdDelay);
    });

    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (eventName) {
      button.addEventListener(eventName, stopRepeating);
    });

    button.addEventListener('click', function (event) {
      if (didRepeat) {
        event.preventDefault();
        didRepeat = false;
        return;
      }
      step(direction);
    });
  }

  bind(decreaseButton, -1);
  bind(increaseButton, 1);

  return { destroy: stopRepeating };
}

window.bindPekosoftRangeButtons = bindPekosoftRangeButtons;

function triggerDownloadFromCanvas(canvas, filename) {
  if (!canvas) return;

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = ensurePekosoftFilename(filename);
  link.click();
}

function buildTimelineBitmap(timelineContainer) {
  if (!timelineContainer) return null;

  const canvases = Array.from(timelineContainer.querySelectorAll("canvas"))
    .filter((canvas) => canvas.id !== "timeline-ruler")
    .filter((canvas) => {
      const style = getComputedStyle(canvas);
      return style.display !== "none" && style.visibility !== "hidden" && canvas.width > 0 && canvas.height > 0;
    });

  if (canvases.length) {
    const baseCanvas = canvases.reduce((largest, current) => {
      const largestArea = largest.width * largest.height;
      const currentArea = current.width * current.height;
      return currentArea > largestArea ? current : largest;
    });

    const width = baseCanvas.width || baseCanvas.clientWidth || 1;
    const height = baseCanvas.height || baseCanvas.clientHeight || 1;
    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const ctx = output.getContext("2d");
    if (!ctx) return null;

    const layers = canvases.filter((canvas) => canvas.width === width && canvas.height === height);
    layers.forEach((canvas) => {
      ctx.drawImage(canvas, 0, 0);
    });

    return output;
  }

  const svgCandidates = Array.from(timelineContainer.querySelectorAll(".timeline-scroll svg, svg"))
    .filter((svgEl) => {
      if (svgEl.classList.contains("icons")) return false;
      const style = getComputedStyle(svgEl);
      if (style.display === "none" || style.visibility === "hidden") return false;

      const viewBox = svgEl.viewBox && svgEl.viewBox.baseVal ? svgEl.viewBox.baseVal : null;
      const viewArea = viewBox && viewBox.width > 0 && viewBox.height > 0 ? viewBox.width * viewBox.height : 0;
      const clientArea = Math.max(1, svgEl.clientWidth) * Math.max(1, svgEl.clientHeight);
      return viewArea > 0 || clientArea > (32 * 32);
    });

  if (!svgCandidates.length) return null;

  const svg = svgCandidates.reduce((largest, current) => {
    const largestBox = largest.viewBox && largest.viewBox.baseVal ? largest.viewBox.baseVal : null;
    const currentBox = current.viewBox && current.viewBox.baseVal ? current.viewBox.baseVal : null;
    const largestArea = largestBox && largestBox.width > 0 && largestBox.height > 0
      ? largestBox.width * largestBox.height
      : Math.max(1, largest.clientWidth) * Math.max(1, largest.clientHeight);
    const currentArea = currentBox && currentBox.width > 0 && currentBox.height > 0
      ? currentBox.width * currentBox.height
      : Math.max(1, current.clientWidth) * Math.max(1, current.clientHeight);
    return currentArea > largestArea ? current : largest;
  });

  const box = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
  const width = Math.max(1, Math.round(box && box.width ? box.width : (svg.clientWidth || 800)));
  const height = Math.max(1, Math.round(box && box.height ? box.height : (svg.clientHeight || 256)));
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;

  const cloned = svg.cloneNode(true);
  if (!cloned.getAttribute("xmlns")) {
    cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  cloned.setAttribute("width", String(width));
  cloned.setAttribute("height", String(height));

  const data = new XMLSerializer().serializeToString(cloned);
  const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ctx = output.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
      URL.revokeObjectURL(url);
      resolve(output);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function setupTimelineSaveButton() {
  const timelineContainer = document.getElementById("timeline-container");
  if (!timelineContainer) return;

  const footer = timelineContainer.querySelector(".module-footer");
  if (!footer || footer.querySelector(".timeline-save-button")) return;

  const hasCanvas = !!timelineContainer.querySelector("canvas");
  const hasSvg = !!timelineContainer.querySelector("svg");
  if (!hasCanvas && !hasSvg) return;

  const saveButton = document.createElement("button");
  saveButton.className = "square timeline-save-button";
  saveButton.title = "Save bitmap";
  saveButton.innerHTML = `
    <svg class="icons"><use href="/icons.svg#photo" /></svg>
    <span class="button-text">Save</span>`;

  saveButton.addEventListener("click", async () => {
    const release = getReleaseFromPath();
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const filename = `${release}_timeline_${day}-${month}-${year}_${hours}-${minutes}-${seconds}.png`;
    const bitmap = await buildTimelineBitmap(timelineContainer);
    if (!bitmap) return;
    triggerDownloadFromCanvas(bitmap, filename);
  });

  footer.appendChild(saveButton);
}

function getStatusAssociatedLabel(target) {
  if (!target) return null;

  if (target.id) {
    const associated = Array.from(document.querySelectorAll('label')).find((label) => label.htmlFor === target.id);
    if (associated) return associated;
  }

  return target.closest('.pair')?.querySelector('label') || null;
}

function getStatusElementName(target, associatedLabel = getStatusAssociatedLabel(target)) {
  const labelName = associatedLabel?.textContent?.trim().replace(/:\s*$/, '');
  if (labelName) return labelName;

  const buttonText = target.querySelector?.('.button-text')?.textContent?.trim();
  const ariaLabel = target.getAttribute?.('aria-label')?.trim();
  const idText = target.id
    ? target.id.replace(/-(button|slider|input|field|select|knob)$/i, '').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : '';
  const fallback = (target.textContent || '').trim().split(/\s+/).slice(0, 2).join(' ');
  return String(buttonText || ariaLabel || idText || fallback || 'Help');
}

function getStatusDescriptor(target) {
  if (!target) return null;

  const tagName = target.tagName?.toLowerCase();
  const associatedLabel = getStatusAssociatedLabel(target);
  const iconFromButton = target.querySelector?.('use')?.getAttribute('href')?.split('#')[1];
  const range = target.closest('.range-input-wrapper')?.querySelector('input[type="range"]');
  let kind = 'button';
  let icon = iconFromButton || 'square';
  let entryTarget = target;

  if (tagName === 'label') {
    kind = 'label';
    icon = 'label';
  } else if (target.classList.contains('knob-control')) {
    kind = 'knob';
    icon = 'knob';
  } else if (tagName === 'select') {
    kind = 'menu';
    icon = 'menu';
  } else if (tagName === 'input' && target.type === 'range') {
    kind = 'slider';
    icon = 'slider';
  } else if (tagName === 'input') {
    kind = 'field';
    icon = 'field';
  } else if (range) {
    kind = 'slider';
    entryTarget = range;
  }

  const name = getStatusElementName(entryTarget, associatedLabel);
  const tooltip = target.getAttribute('title')?.trim()
    || associatedLabel?.getAttribute('title')?.trim()
    || target.getAttribute('aria-label')?.trim();
  const sentenceTooltip = tooltip && (/[.!?]$/.test(tooltip) ? tooltip : `${tooltip}.`);

  return {
    icon,
    entry: name,
    kind,
    label: sentenceTooltip ? `${name}: ${sentenceTooltip}` : name,
  };
}

function getCurrentHelpRelease() {
  const path = (window.location.pathname || '').replace(/\/$/, '');
  const slug = path.split('/').pop()?.replace(/\.php$/i, '') || 'index';
  if (slug === 'help') {
    const parameters = new URLSearchParams(window.location.search);
    return parameters.get('t')?.toLocaleLowerCase() || 'index';
  }
  return slug.toLocaleLowerCase();
}

function getStatusHelpHref(descriptor) {
  const parameters = new URLSearchParams({ t: getCurrentHelpRelease() });
  if (descriptor?.entry) {
    parameters.set('e', descriptor.entry.toLocaleLowerCase());
    parameters.set('k', descriptor.kind.toLocaleLowerCase());
  }
  return `/help.php?${parameters.toString()}`;
}

function scrollToRequestedHelpEntry() {
  const parameters = new URLSearchParams(window.location.search);
  const entry = parameters.get('e');
  const kind = parameters.get('k')?.replace(/s$/, '').toLocaleLowerCase();
  const path = window.location.pathname.replace(/\/$/, '');
  if (!entry || !/\/help(?:\.php)?$/.test(path)) return;

  const normalizedEntry = entry.trim().replace(/:\s*$/, '').toLocaleLowerCase();
  const headings = Array.from(document.querySelectorAll('.feature-row h1')).filter((element) => {
    const headingName = (element.childNodes[0]?.textContent || element.textContent || '').trim().replace(/:\s*$/, '').toLocaleLowerCase();
    return headingName.split('/').map((name) => name.trim()).includes(normalizedEntry);
  });
  const heading = headings.find((element) => element.querySelector('.object')?.textContent?.trim().replace(/s$/, '').toLocaleLowerCase() === kind)
    || headings[0];
  heading?.closest('.feature-row')?.scrollIntoView({ block: 'start' });
}

function createControlsFooter() {
  const footer = document.createElement('div');
  footer.className = 'module-footer wrapper colored';
  return footer;
}

function ensureControlsFooters() {
  const controlsContainers = document.querySelectorAll('#controls-container.container');
  if (!controlsContainers.length) return;

  controlsContainers.forEach((container) => {
    const hasFooter = container.querySelector(':scope > .module-footer');
    if (hasFooter) return;

    container.appendChild(createControlsFooter());
  });
}

function setupStatusBars() {
  const bars = document.querySelectorAll('[data-statusbar]');
  if (!bars.length) return;

  const statusTargetSelector = 'button[title]:not([data-status-back]), a[title], label[title], input:not([type="file"]), select';

  bars.forEach((bar) => {
    const textNode = bar.querySelector('[data-status-text]');
    const helpLink = bar.querySelector('[data-status-help]');
    const iconNode = bar.querySelector('[data-status-icon]');
    const backButton = bar.querySelector('[data-status-back]');
    if (!textNode || !helpLink || !iconNode || !backButton) return;

    const ready = bar.getAttribute('data-status-ready') || 'READY';
    const root = document;
    let tapTimer = null;

    const isMovingToStatusHelp = (relatedTarget) => relatedTarget?.closest?.('[data-status-help]') === helpLink;

    const setReady = () => {
      textNode.textContent = ready;
      iconNode.setAttribute('href', '/icons.svg#about');
      helpLink.href = getStatusHelpHref();
      helpLink.hidden = true;
      backButton.hidden = false;
      backButton.disabled = window.history.length <= 1;
    };

    const showFromTarget = (target) => {
      const descriptor = getStatusDescriptor(target);
      if (!descriptor) return;
      textNode.textContent = descriptor.label;
      iconNode.setAttribute('href', `/icons.svg#${descriptor.icon}`);
      helpLink.href = getStatusHelpHref(descriptor);
      helpLink.setAttribute('aria-label', `Open Help for ${descriptor.entry}`);
      helpLink.hidden = false;
      backButton.hidden = true;
    };

    const showBackStatus = () => {
      textNode.textContent = 'Back: Previous page.';
    };

    backButton.addEventListener('click', () => {
      if (backButton.disabled) return;
      stopSitePlay();
      window.history.back();
    });
    backButton.addEventListener('mouseover', showBackStatus);
    backButton.addEventListener('mouseout', setReady);
    backButton.addEventListener('focusin', showBackStatus);
    backButton.addEventListener('focusout', setReady);
    backButton.addEventListener('pointerdown', showBackStatus);

    setReady();

    root.addEventListener('mouseover', (event) => {
      const target = event.target.closest(statusTargetSelector);
      if (!target) return;
      if (tapTimer) {
        clearTimeout(tapTimer);
        tapTimer = null;
      }
      showFromTarget(target);
    });

    root.addEventListener('mouseout', (event) => {
      const fromButton = event.target.closest(statusTargetSelector);
      if (!fromButton) return;
      const toButton = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(statusTargetSelector) : null;
      if (toButton === fromButton) return;
      if (isMovingToStatusHelp(event.relatedTarget)) return;
      setReady();
    });

    root.addEventListener('focusin', (event) => {
      const target = event.target.closest(statusTargetSelector);
      if (!target) return;
      if (tapTimer) {
        clearTimeout(tapTimer);
        tapTimer = null;
      }
      showFromTarget(target);
    });

    root.addEventListener('focusout', (event) => {
      const fromButton = event.target.closest(statusTargetSelector);
      if (!fromButton) return;
      const toButton = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(statusTargetSelector) : null;
      if (toButton === fromButton) return;
      if (isMovingToStatusHelp(event.relatedTarget)) return;
      setReady();
    });

    root.addEventListener('click', (event) => {
      const target = event.target.closest(statusTargetSelector);
      if (!target) return;

      if (event.ctrlKey || event.metaKey) {
        const descriptor = getStatusDescriptor(target);
        if (!descriptor) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.assign(getStatusHelpHref(descriptor));
        return;
      }

      showFromTarget(target);
      if (tapTimer) clearTimeout(tapTimer);
      tapTimer = window.setTimeout(() => {
        setReady();
        tapTimer = null;
      }, 1200);
    }, true);

    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey)) return;
      const target = event.target.closest(statusTargetSelector);
      if (!target) return;

      const descriptor = getStatusDescriptor(target);
      if (!descriptor) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(getStatusHelpHref(descriptor));
    }, true);

    root.addEventListener('pointerdown', (event) => {
      const target = event.target.closest(statusTargetSelector);
      if (!target) return;
      showFromTarget(target);
    });
  });
}

const SITE_PLAY_STORAGE_KEY = 'global.site_play_active';
const SITE_PLAY_TIMER_MS = 2500;
const SITE_PLAY_SEQUENCE = [
  '/index.php',
  '/tap_pad',
  '/bpm_calculator',
  '/metronome',
  '/turntable',
  '/help.php?t=index',
  '/help.php?t=tap_pad',
  '/help.php?t=bpm_calculator',
  '/help.php?t=metronome',
  '/help.php?t=turntable',
  '/history.php?t=index',
  '/history.php?t=tap_pad',
  '/history.php?t=bpm_calculator',
  '/history.php?t=metronome',
  '/history.php?t=turntable',
  '/about.php?t=index',
  '/about.php?t=tap_pad',
  '/about.php?t=bpm_calculator',
  '/about.php?t=metronome',
  '/about.php?t=turntable',
  '/bitcoin.php'
];

let sitePlayTimer = null;

function normalizePageRef(ref) {
  const url = new URL(ref, window.location.origin);
  let path = url.pathname.replace(/\/$/, '');
  if (!path) path = '/index.php';
  const query = url.searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function getCurrentPageRef() {
  const current = normalizePageRef(window.location.pathname + window.location.search);
  if (SITE_PLAY_SEQUENCE.includes(current)) return current;

  const currentPath = normalizePageRef(window.location.pathname);
  return SITE_PLAY_SEQUENCE.includes(currentPath) ? currentPath : current;
}

function isSitePlayActive() {
  return localStorage.getItem(SITE_PLAY_STORAGE_KEY) === 'true';
}

function setSitePlayActive(active) {
  if (active) {
    localStorage.setItem(SITE_PLAY_STORAGE_KEY, 'true');
  } else {
    localStorage.removeItem(SITE_PLAY_STORAGE_KEY);
  }
}

function getNextSitePlayHref() {
  const current = getCurrentPageRef();
  const currentIndex = SITE_PLAY_SEQUENCE.indexOf(current);
  if (currentIndex < 0) return SITE_PLAY_SEQUENCE[0];
  if (currentIndex >= SITE_PLAY_SEQUENCE.length - 1) return SITE_PLAY_SEQUENCE[0];
  return SITE_PLAY_SEQUENCE[currentIndex + 1];
}

function updatePlayButtonState() {
  const button = document.getElementById('play-site-button');
  if (!button) return;

  const active = isSitePlayActive();
  button.classList.toggle('button-on', active);
}

function stopSitePlay() {
  if (sitePlayTimer) {
    clearTimeout(sitePlayTimer);
    sitePlayTimer = null;
  }
  setSitePlayActive(false);
  updatePlayButtonState();
}

function startSitePlay() {
  setSitePlayActive(true);
  updatePlayButtonState();
  const first = SITE_PLAY_SEQUENCE[0];
  if (getCurrentPageRef() !== first) {
    window.location.href = first;
    return;
  }
  window.location.href = getNextSitePlayHref();
}

function scheduleSitePlayAdvance() {
  if (!isSitePlayActive()) return;

  const next = getNextSitePlayHref();
  if (!next) return;

  if (sitePlayTimer) {
    clearTimeout(sitePlayTimer);
  }

  sitePlayTimer = window.setTimeout(() => {
    window.location.href = next;
  }, SITE_PLAY_TIMER_MS);
}

function setupSitePlayMode() {
  const button = document.getElementById('play-site-button');

  const shouldIgnoreInteractionTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return !!target.closest('#play-site-button');
  };

  const isNavigationTarget = (target) => {
    if (!(target instanceof Element)) return false;

    const link = target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) {
        return false;
      }
      return true;
    }

    const navButton = target.closest('button[data-href]');
    if (navButton) return true;

    return false;
  };

  const stopOnNavigationIntent = (event) => {
    if (!isSitePlayActive()) return;
    if (shouldIgnoreInteractionTarget(event.target)) return;
    if (!isNavigationTarget(event.target)) return;
    stopSitePlay();
  };

  const stopOnFormSubmit = (event) => {
    if (!isSitePlayActive()) return;
    if (!(event.target instanceof HTMLFormElement)) return;
    stopSitePlay();
  };

  if (button) {
    button.addEventListener('click', () => {
      if (isSitePlayActive()) {
        stopSitePlay();
      } else {
        startSitePlay();
      }
    });
  }

  document.addEventListener('click', stopOnNavigationIntent, true);
  document.addEventListener('submit', stopOnFormSubmit, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!isSitePlayActive()) return;
    stopSitePlay();
  });

  updatePlayButtonState();
  scheduleSitePlayAdvance();
}

window.addEventListener('pageshow', updatePlayButtonState);

// Check for mode preference on page load
document.addEventListener('DOMContentLoaded', function () {
  const toggleMenuButton = document.getElementById('toggle-menu-button');
  const toggleMenuCloseButton = document.getElementById('toggle-menu-close-button');
  const toggleSettingsPanelButton = document.getElementById('toggle-settings-panel-button');
  const toggleSettingsPanelCloseButton = document.getElementById('toggle-settings-panel-close-button');
  const toggleModeButton = document.getElementById('toggle-mode-button');
  const toggleFullscreenButton = document.getElementById('toggle-fullscreen-button');
  const toggleFooterButton = document.getElementById('toggle-footer-button');

  if (toggleMenuButton) {
    toggleMenuButton.addEventListener('click', toggleMenu);
  }

  if (toggleMenuCloseButton) {
    toggleMenuCloseButton.addEventListener('click', toggleMenu);
  }

  if (toggleSettingsPanelButton) {
    toggleSettingsPanelButton.addEventListener('click', toggleSettingsPanel);
  }

  if (toggleSettingsPanelCloseButton) {
    toggleSettingsPanelCloseButton.addEventListener('click', toggleSettingsPanel);
  }

  if (toggleModeButton) {
    toggleModeButton.addEventListener('click', toggleMode);
  }

  if (toggleFullscreenButton) {
    toggleFullscreenButton.addEventListener('click', toggleFullscreen);
  }

  if (toggleFooterButton) {
    toggleFooterButton.addEventListener('click', toggleFooterVisibility);
  }

  applyColorTheme(getColorTheme());

  updateModeButtonState();
  updateFullscreenButtonState();
  initializeGlobalSoundSetting();
  initializeGlobalHapticsSetting();
  restoreDesktopSidebarState();
  syncSidebarState();

  markActiveFooterLink();
  markActiveTocButton();
  updateFooterVisibility();
  setupTimelineSaveButton();
  ensureControlsFooters();
  setupStatusBars();
  scrollToRequestedHelpEntry();
  const alignRequestedHelpEntry = () => window.setTimeout(scrollToRequestedHelpEntry, 0);
  window.addEventListener('load', alignRequestedHelpEntry, { once: true });
  window.addEventListener('pageshow', alignRequestedHelpEntry, { once: true });
  setupSitePlayMode();
});

window.addEventListener('resize', () => {
  syncSidebarFooterHeight();
});
window.addEventListener('resize', restoreDesktopSidebarState);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    syncSidebarFooterHeight();
  });
}

// Function to toggle fullscreen mode

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener('fullscreenchange', updateFullscreenButtonState);

async function shareCurrentPage() {
  const shareUrl = window.location.href;
  const shareTitle = document.title || 'Pekosoft';

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareTitle,
        url: shareUrl
      });
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') return;
    }
  }

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return;
    } catch (error) {
      console.warn('Unable to copy share URL', error);
    }
  }

  window.prompt('Copy this link:', shareUrl);
}

// Function to attach main TOC commands

document.addEventListener("DOMContentLoaded", () => {
  const toc = document.getElementById("toc");
  const shareTocButton = document.getElementById("share-toc-button");

  if (shareTocButton) {
    shareTocButton.addEventListener("click", async () => {
      await shareCurrentPage();
      toc?.classList.remove('toc-open');
    });
  }

  document.querySelectorAll(".toc-button[data-href]").forEach(btn => {
    btn.addEventListener("click", () => {
      location.href = btn.dataset.href;
    });
  });
});

// END OF FILE
