// Modules Toggles
// pekosoft.net/js/modules.js

const moduleIds = ["tool", "controls", "timeline", "playlist", "history", "panel", "meters"];
const legacyModuleIds = ["tool", "meters", "controls", "timeline", "playlist", "panel"];
const moduleOrderStorageKey = "global.module_order";

const moduleConfig = {
  tool:     { icon: "tool",     title: "Instrument" },
  meters:   { icon: "meter",    title: "Meters" },
  controls: { icon: "controls", title: "Controls" },
  timeline: { icon: "timeline", title: "Timeline" },
  playlist: { icon: "view_list", title: "Playlist" },
  history:  { icon: "undo",     title: "History" },
  panel:    { icon: "panel",    title: "Panel" }
};

function syncModuleMoreButtonState(container) {
  const moreBtn = container?.querySelector(".module-more-btn");
  if (!moreBtn) return;

  const disabled = container.classList.contains("module-minimized");
  moreBtn.disabled = disabled;
  moreBtn.classList.toggle("grey", disabled);
  moreBtn.setAttribute("aria-disabled", String(disabled));
}

window.syncModuleMoreButtonState = syncModuleMoreButtonState;

function resetModuleLayout() {
  document.querySelectorAll(".container").forEach((container) => {
    const id = container.id.replace(/-container$/, "");
    const pageButton = document.getElementById(id + "-toggle");
    const tocButton = document.getElementById(id + "-toggle-toc-button");

    container.classList.remove("hidden", "module-minimized", "module-maximized", "module-icon-panel-open");
    container.querySelector(".module-minimize-btn")?.classList.remove("button-on");
    container.querySelector(".module-maximize-btn")?.classList.remove("button-on");
    container.querySelector(".module-icon-btn")?.classList.remove("button-on");
    container.querySelector(".module-icon-btn")?.setAttribute("aria-expanded", "false");
    container.querySelector(".module-more-btn")?.classList.remove("button-on");
    container.querySelector(".module-more-btn")?.setAttribute("aria-expanded", "false");
    container.querySelector(".module-header-actions")?.setAttribute("hidden", "");
    container.querySelector(".module-title")?.removeAttribute("hidden");
    container.querySelector(".module-icon-panel")?.setAttribute("hidden", "");
    pageButton?.classList.add("button-on");
    tocButton?.classList.add("button-on");
    syncModuleMoreButtonState(container);
  });

  syncFirstModule();
  syncMaximizedModuleState();
}

window.resetModuleLayout = resetModuleLayout;

function toggleModule(id) {
  const container = document.getElementById(id + "-container");
  const pageButton = document.getElementById(id + "-toggle");
  const tocButton = document.getElementById(id + "-toggle-toc-button");

  if (!container) return;

  const isNowHidden = container.classList.toggle("hidden");
  const stateKey = "module_" + id + "_state";
  const savedState = localStorage.getItem(stateKey);
  const hasModuleViewState =
    container.classList.contains("module-minimized") ||
    container.classList.contains("module-maximized") ||
    savedState === "minimized" ||
    savedState === "maximized";

  if (isNowHidden || hasModuleViewState) {
    container.classList.remove("module-minimized", "module-maximized");
    container.querySelector(".module-minimize-btn")?.classList.remove("button-on");
    container.querySelector(".module-maximize-btn")?.classList.remove("button-on");
    syncModuleMoreButtonState(container);
    localStorage.setItem(stateKey, "normal");
  }

  if (pageButton) {
    pageButton.classList.toggle("button-on", !isNowHidden);
  }
  if (tocButton) {
    tocButton.classList.toggle("button-on", !isNowHidden);
  }

  localStorage.setItem("module_" + id, isNowHidden ? "hidden" : "visible");
  syncFirstModule();
  syncMaximizedModuleState();
}

function normalizeModuleOrder(order) {
  const seen = new Set();
  const normalized = [];

  (Array.isArray(order) ? order : []).forEach((id) => {
    if (moduleIds.includes(id) && !seen.has(id)) {
      seen.add(id);
      normalized.push(id);
    }
  });

  if (!seen.has("history")) {
    const playlistIndex = normalized.indexOf("playlist");
    const panelIndex = normalized.indexOf("panel");
    const insertIndex = playlistIndex >= 0
      ? playlistIndex + 1
      : panelIndex >= 0 ? panelIndex : normalized.length;
    normalized.splice(insertIndex, 0, "history");
    seen.add("history");
  }

  moduleIds.forEach((id) => {
    if (!seen.has(id)) {
      seen.add(id);
      normalized.push(id);
    }
  });

  return normalized;
}

function isLegacyModuleOrder(order) {
  return Array.isArray(order) &&
    order.length === legacyModuleIds.length &&
    order.every((id, index) => id === legacyModuleIds[index]);
}

function loadModuleOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(moduleOrderStorageKey) || "null");
    if (isLegacyModuleOrder(saved)) {
      saveModuleOrder(moduleIds);
      return normalizeModuleOrder(moduleIds);
    }
    const normalized = normalizeModuleOrder(saved);
    if (Array.isArray(saved) && JSON.stringify(saved) !== JSON.stringify(normalized)) {
      saveModuleOrder(normalized);
    }
    return normalized;
  } catch (_) {
    return normalizeModuleOrder(moduleIds);
  }
}

function saveModuleOrder(order) {
  localStorage.setItem(moduleOrderStorageKey, JSON.stringify(normalizeModuleOrder(order)));
}

function isTwoColumnLayoutEnabled() {
  return localStorage.getItem("global.layout") !== "false";
}

function isTwoColumnLayoutActive() {
  return isTwoColumnLayoutEnabled() && window.matchMedia("(min-width: 800px)").matches;
}

function syncModuleViewportHeight() {
  if (typeof window.syncPekosoftViewport === "function") {
    window.syncPekosoftViewport();
    return;
  }

  const viewport = window.visualViewport;
  const height = viewport ? viewport.height : window.innerHeight;
  const offsetTop = viewport ? viewport.offsetTop : 0;
  const bottomGap = viewport ? window.innerHeight - viewport.offsetTop - viewport.height : 0;
  if (!Number.isFinite(height) || height <= 0) return;
  const root = document.documentElement;
  const roundedHeight = Math.round(height);
  root.style.setProperty("--visual-viewport-height", `${roundedHeight}px`);
  root.style.setProperty("--module-viewport-height", `${roundedHeight}px`);
  if (Number.isFinite(offsetTop) && offsetTop >= 0) {
    root.style.setProperty("--visual-viewport-offset-top", `${Math.round(offsetTop)}px`);
  }
  if (Number.isFinite(bottomGap)) {
    root.style.setProperty("--visual-viewport-bottom-gap", `${Math.max(0, Math.round(bottomGap))}px`);
  }
}

function syncMaximizedModuleState() {
  const hasMaximizedModule = !!document.querySelector(".container.module-maximized");
  document.documentElement.classList.toggle("module-view-maximized", hasMaximizedModule);
}

function exitMaximizedModule() {
  const container = document.querySelector(".container.module-maximized");
  if (!container) return;

  const id = container.id.replace(/-container$/, "");
  container.classList.remove("module-maximized");
  container.querySelector(".module-maximize-btn")?.classList.remove("button-on");
  localStorage.setItem("module_" + id + "_state", "normal");
  syncMaximizedModuleState();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") exitMaximizedModule();
});

function disableMinimizeForTwoColumnLayout() {
  if (!isTwoColumnLayoutActive()) return;

  moduleIds.forEach((id) => {
    const container = document.getElementById(id + "-container");
    if (!container) return;

    container.classList.remove("module-minimized");
    const minimizeBtn = container.querySelector(".module-minimize-btn");
    if (minimizeBtn) {
      minimizeBtn.classList.remove("button-on");
      minimizeBtn.classList.add("grey");
      minimizeBtn.disabled = true;
      minimizeBtn.setAttribute("aria-disabled", "true");
      minimizeBtn.title = "Minimize";
    }
    syncModuleMoreButtonState(container);
    localStorage.setItem("module_" + id + "_state", "normal");
  });
}

function getCurrentModuleOrder() {
  return moduleIds
    .map((id) => document.getElementById(id + "-container"))
    .filter(Boolean)
    .sort((left, right) => {
      const position = left.compareDocumentPosition(right);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    })
    .map((container) => container.id.replace(/-container$/, ""));
}

function syncFirstModule() {
  const containers = Array.from(document.body.children)
    .filter((element) => element.classList?.contains("container"));

  containers.forEach((container) => container.classList.remove("first-module"));
  containers.find((container) => !container.classList.contains("hidden"))?.classList.add("first-module");
}

function applyModuleOrder(order) {
  const normalized = normalizeModuleOrder(order);
  const body = document.body;
  const bodyAnchor = document.querySelector(".footer-spacer") || document.querySelector(".footer") || null;

  normalized.forEach((id) => {
    const container = document.getElementById(id + "-container");
    if (container && container.parentNode === body) {
      body.insertBefore(container, bodyAnchor);
    }
  });

  syncFirstModule();

  const tocModuleItems = document.getElementById("toc-module-items");
  if (!tocModuleItems) return;

  normalized.forEach((id) => {
    const button = document.getElementById(id + "-toggle-toc-button");
    if (button && tocModuleItems.contains(button)) {
      tocModuleItems.appendChild(button);
    }
  });
}

function restoreModuleStates() {
  moduleIds.forEach((id) => {
    const container = document.getElementById(id + "-container");
    const pageButton = document.getElementById(id + "-toggle");
    const tocButton = document.getElementById(id + "-toggle-toc-button");
    const state = localStorage.getItem("module_" + id);

    const isVisible = state !== "hidden";

    if (container) container.classList.toggle("hidden", !isVisible);
    if (pageButton) pageButton.classList.toggle("button-on", isVisible);
    if (tocButton) tocButton.classList.toggle("button-on", isVisible);
  });
}

function createModuleHeader(id) {
  const cfg = moduleConfig[id] || { icon: "tool", title: id };
  const header = document.createElement("div");
  header.className = "module-header";
  header.innerHTML = `
    <div class="module-header-left">
      <button class="module-icon-btn square icon-only" title="Module options" aria-label="Module options" aria-expanded="false">
        <svg class="icons" aria-hidden="true"><use href="/icons.svg#${cfg.icon}" /></svg>
      </button>
      <span class="module-title">${cfg.title}</span>
      <div class="module-header-actions" hidden>
        <button class="module-minimize-btn square icon-only" title="Minimize">
          <svg class="icons"><use href="/icons.svg#triangle_down" /></svg>
        </button>
        <button class="module-maximize-btn square icon-only" title="Maximize">
          <svg class="icons"><use href="/icons.svg#maximize" /></svg>
        </button>
        <button class="module-fullscreen-btn square icon-only" title="Fullscreen">
          <svg class="icons"><use href="/icons.svg#full_screen" /></svg>
        </button>
        <button class="module-close-btn square icon-only" title="Close">
          <svg class="icons"><use href="/icons.svg#close" /></svg>
        </button>
      </div>
    </div>
    <div class="module-header-right">
      <button class="module-more-btn square icon-only" title="More" aria-expanded="false">
        <svg class="icons"><use href="/icons.svg#more" /></svg>
      </button>
    </div>`;
  return header;
}

function createModuleIconPanel(id) {
  const cfg = moduleConfig[id] || { icon: "tool" };
  const panel = document.createElement("div");
  panel.className = "module-icon-panel";
  panel.id = id + "-icon-panel";
  panel.innerHTML = `
    <svg class="module-icon-panel-background" viewBox="0 0 512 512" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <use href="/icons.svg#${cfg.icon}" width="512" height="512" />
    </svg>`;
  panel.hidden = true;
  return panel;
}

function setupModuleHeader(id) {
  const container = document.getElementById(id + "-container");
  if (!container) return;

  const header = createModuleHeader(id);
  container.prepend(header);
  const iconPanel = createModuleIconPanel(id);
  header.insertAdjacentElement("afterend", iconPanel);

  if (typeof setupModuleDrag === "function") {
    setupModuleDrag(container, header, id);
  }

  const iconBtn = header.querySelector(".module-icon-btn");
  const titleEl = header.querySelector(".module-title");
  const actions = header.querySelector(".module-header-actions");
  const moreBtn = header.querySelector(".module-more-btn");
  const minimizeBtn = header.querySelector(".module-minimize-btn");
  const maximizeBtn = header.querySelector(".module-maximize-btn");
  const fullscreenBtn = header.querySelector(".module-fullscreen-btn");
  const closeBtn = header.querySelector(".module-close-btn");

  actions.id = id + "-module-actions";
  iconBtn.setAttribute("aria-controls", actions.id);
  moreBtn.setAttribute("aria-controls", iconPanel.id);

  function updateIconPanelInset() {
    const body = container.querySelector(":scope > .module-body");
    if (!body) return;

    const containerRect = container.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    const bodyStyle = getComputedStyle(body);
    const borderTop = parseFloat(bodyStyle.borderTopWidth) || 0;
    const borderRight = parseFloat(bodyStyle.borderRightWidth) || 0;
    const borderBottom = parseFloat(bodyStyle.borderBottomWidth) || 0;
    const borderLeft = parseFloat(bodyStyle.borderLeftWidth) || 0;
    const topInset = Math.max(0, bodyRect.top - containerRect.top + borderTop);
    const rightInset = Math.max(0, containerRect.right - bodyRect.right + borderRight);
    const bottomInset = Math.max(0, containerRect.bottom - bodyRect.bottom + borderBottom);
    const leftInset = Math.max(0, bodyRect.left - containerRect.left + borderLeft);

    iconPanel.style.setProperty("--module-panel-top", `${topInset}px`);
    iconPanel.style.setProperty("--module-panel-right", `${rightInset}px`);
    iconPanel.style.setProperty("--module-panel-bottom", `${bottomInset}px`);
    iconPanel.style.setProperty("--module-panel-left", `${leftInset}px`);
  }

  function updateMinimizeButtonState() {
    const disabled = isTwoColumnLayoutActive();
    minimizeBtn.classList.toggle("grey", disabled);
    minimizeBtn.disabled = disabled;
    minimizeBtn.setAttribute("aria-disabled", disabled ? "true" : "false");
    minimizeBtn.title = disabled ? "Minimize" : "Minimize";
  }

  function collapseMore() {
    actions.hidden = true;
    titleEl.hidden = false;
    iconBtn.classList.remove("button-on");
    iconBtn.setAttribute("aria-expanded", "false");
  }

  function collapseIconPanel() {
    iconPanel.hidden = true;
    container.classList.remove("module-icon-panel-open");
    moreBtn.classList.remove("button-on");
    moreBtn.setAttribute("aria-expanded", "false");
  }

  function expandIconPanel() {
    if (container.classList.contains("module-minimized")) return;
    updateIconPanelInset();
    iconPanel.hidden = false;
    container.classList.add("module-icon-panel-open");
    moreBtn.classList.add("button-on");
    moreBtn.setAttribute("aria-expanded", "true");
  }

  iconBtn.addEventListener("click", () => {
    const isOpen = !actions.hidden;
    actions.hidden = isOpen;
    titleEl.hidden = !isOpen;
    iconBtn.classList.toggle("button-on", !isOpen);
    iconBtn.setAttribute("aria-expanded", !isOpen ? "true" : "false");
    updateMinimizeButtonState();
  });

  moreBtn.addEventListener("click", () => {
    if (iconPanel.hidden) {
      expandIconPanel();
    } else {
      collapseIconPanel();
    }
  });

  header.addEventListener("dblclick", (event) => {
    if (event.target.closest("button, a, input, select, textarea, label")) return;
    if (minimizeBtn.disabled) return;
    event.preventDefault();
    minimizeBtn.click();
  });

  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (container.contains(target)) return;

    collapseIconPanel();
    collapseMore();
  });

  minimizeBtn.addEventListener("click", () => {
    if (isTwoColumnLayoutActive()) return;
    const isMinimized = container.classList.toggle("module-minimized");
    container.classList.remove("module-maximized");
    minimizeBtn.classList.toggle("button-on", isMinimized);
    maximizeBtn.classList.remove("button-on");
    collapseIconPanel();
    localStorage.setItem("module_" + id + "_state", isMinimized ? "minimized" : "normal");
    collapseMore();
    syncModuleMoreButtonState(container);
    syncMaximizedModuleState();
  });

  maximizeBtn.addEventListener("click", () => {
    const isMaximized = container.classList.toggle("module-maximized");
    container.classList.remove("module-minimized");
    maximizeBtn.classList.toggle("button-on", isMaximized);
    minimizeBtn.classList.remove("button-on");
    collapseIconPanel();
    localStorage.setItem("module_" + id + "_state", isMaximized ? "maximized" : "normal");
    collapseMore();
    syncModuleMoreButtonState(container);
    syncMaximizedModuleState();
  });

  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen error:", err);
    }

    fullscreenBtn.classList.toggle("button-on", document.fullscreenElement === container);
    collapseMore();
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenBtn.classList.toggle("button-on", document.fullscreenElement === container);
  });

  closeBtn.addEventListener("click", () => {
    toggleModule(id);
    collapseIconPanel();
    collapseMore();
  });

  window.addEventListener("resize", () => {
    updateMinimizeButtonState();
    if (!iconPanel.hidden) updateIconPanelInset();
  });

  const savedState = localStorage.getItem("module_" + id + "_state");
  if (savedState === "minimized" && !isTwoColumnLayoutActive()) {
    container.classList.add("module-minimized");
    minimizeBtn.classList.add("button-on");
  } else if (savedState === "maximized") {
    container.classList.add("module-maximized");
    maximizeBtn.classList.add("button-on");
  }

  updateMinimizeButtonState();
  syncModuleMoreButtonState(container);
  syncMaximizedModuleState();
}

function getReleaseFromPath() {
  const path = window.location.pathname || "/";
  if (path === "/" || path.endsWith("/")) return "index";
  const last = path.split("/").pop() || "index.php";
  return last.replace(/\.php$/i, "") || "index";
}

function applyPanelWrap(textareas, enabled) {
  textareas.forEach((textarea) => {
    const preview = textarea.parentElement?.querySelector(".panel-syntax-preview");
    if (enabled) {
      textarea.wrap = "soft";
      textarea.style.whiteSpace = "pre-wrap";
      textarea.style.overflowX = "hidden";
      if (preview) preview.style.whiteSpace = "pre-wrap";
    } else {
      textarea.wrap = "off";
      textarea.style.whiteSpace = "pre";
      textarea.style.overflowX = "hidden";
      if (preview) preview.style.whiteSpace = "pre";
    }
  });
}

const panelWrapRegistryKey = "global.wrap.modules";
const panelWrapControlKeys = [
  "audio_calculator:panel-wrap-button",
  "blockchain:panel-wrap-button",
  "bpm_calculator:panel-wrap-button",
  "bpm_circle:panel-wrap-button",
  "bpm_curve:panel-wrap-button",
  "circle_of_fifths:panel-wrap-button",
  "drum_machine:panel-wrap-button",
  "icons:panel-wrap-button",
  "metronome:panel-wrap-button",
  "piano:panel-wrap-button",
  "player:panel-wrap-button",
  "tap_pad:panel-wrap-button",
  "tuner:panel-wrap-button",
  "turntable:panel-wrap-button"
];

function setGlobalPanelWrap(enabled) {
  const nextState = !!enabled;
  window.PekoLocalToggleRegistry?.setAll(panelWrapRegistryKey, panelWrapControlKeys, nextState);
  localStorage.setItem("global.wrap", String(nextState));

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.endsWith(".panel_wrap")) localStorage.removeItem(key);
  }

  const panelContainer = document.getElementById("panel-container");
  if (panelContainer) {
    applyPanelWrap(Array.from(panelContainer.querySelectorAll("textarea")), nextState);
    panelContainer.querySelectorAll(".panel-wrap-button").forEach((button) => {
      button.classList.toggle("button-on", nextState);
    });
  }

  window.dispatchEvent(new CustomEvent("pekosoft:wrap-global-change", {
    detail: { enabled: nextState }
  }));
}

function syncGlobalPanelWrapFromTools() {
  const buttons = [...document.querySelectorAll(".panel-wrap-button")];
  if (!buttons.length) return;
  const registry = window.PekoLocalToggleRegistry;
  const enabled = registry
    ? registry.syncButtons(panelWrapRegistryKey, panelWrapControlKeys, localStorage.getItem("global.wrap") === "true", buttons)
    : buttons.some((button) => button.classList.contains("button-on"));
  localStorage.setItem("global.wrap", String(enabled));

  const input = document.getElementById("toggle-wrap");
  const settingsButton = document.querySelector('[data-setting-toggle="toggle-wrap"]');
  if (input) input.checked = enabled;
  if (settingsButton) {
    settingsButton.classList.toggle("button-on", enabled);
    settingsButton.setAttribute("aria-pressed", String(enabled));
  }
}

window.PekoWrap = {
  setGlobal: setGlobalPanelWrap,
  syncFromTools: syncGlobalPanelWrapFromTools
};

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightMarkup(rawText) {
  const escaped = escapeHtml(rawText);

  return escaped.replace(/&lt;!--[\s\S]*?--&gt;|&lt;\/?[\w:-]+[\s\S]*?&gt;/g, (token) => {
    if (token.startsWith("&lt;!--")) {
      return `<span class="panel-syntax-token-comment">${token}</span>`;
    }

    const tagMatch = token.match(/^(&lt;\/?)([\w:-]+)([\s\S]*?)(\/??&gt;)$/);
    if (!tagMatch) return token;

    const open = `<span class="panel-syntax-token-punc">${tagMatch[1]}</span>`;
    const tagName = `<span class="panel-syntax-token-tag">${tagMatch[2]}</span>`;
    const close = `<span class="panel-syntax-token-punc">${tagMatch[4]}</span>`;

    const attrs = tagMatch[3].replace(
      /([\w:-]+)(\s*=\s*)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
      (_, name, eq, value) => `<span class="panel-syntax-token-attr">${name}</span><span class="panel-syntax-token-eq">${eq}</span><span class="panel-syntax-token-string">${value}</span>`
    );

    return `${open}${tagName}${attrs}${close}`;
  });
}

function highlightPlainTail(rawText) {
  const tokenRegex = /(\b\d+(?:\.\d+)?(?:ms|hz|bpm|kb|mb|gb|%)?\b|\{[^}\n]*\}|\[[^\]\n]*\]|\|)/gi;
  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(rawText)) !== null) {
    result += escapeHtml(rawText.slice(lastIndex, match.index));

    if (match[0] === "|") {
      result += `<span class="panel-syntax-token-punc">${escapeHtml(match[0])}</span>`;
    } else if (match[0].startsWith("[")) {
      const timestampMatch = match[0].match(/^\[(\d{2})(:\d{2}:\d{2}(?:\.\d{3})?)\]$/);
      if (timestampMatch) {
        const [, hour, rest] = timestampMatch;
        result += `<span class="panel-syntax-token-punc">[</span><span class="panel-syntax-token-hour">${escapeHtml(hour)}</span><span class="panel-syntax-token-tag">${escapeHtml(rest)}</span><span class="panel-syntax-token-punc">]</span>`;
      } else {
        result += `<span class="panel-syntax-token-tag">${escapeHtml(match[0])}</span>`;
      }
    } else if (match[0].startsWith("{")) {
      result += `<span class="panel-syntax-token-tag">${escapeHtml(match[0])}</span>`;
    } else {
      result += `<span class="panel-syntax-token-string">${escapeHtml(match[0])}</span>`;
    }

    lastIndex = tokenRegex.lastIndex;
  }

  result += escapeHtml(rawText.slice(lastIndex));
  return result;
}

function highlightPianoRecordingLine(line) {
  const match = line.match(/^(\d+(?:\.\d+)?ms)(:\s+)(start|stop)(\s+)([A-G](?:#|b)?\d+)$/i);
  if (!match) {
    return highlightPlainTail(line);
  }

  const [, msValue, separator, action, spacing, noteValue] = match;
  return `${
    `<span class="panel-syntax-token-ms">${escapeHtml(msValue)}</span>` +
    `<span class="panel-syntax-token-punc">${escapeHtml(separator)}</span>` +
    `${escapeHtml(action)}` +
    `${escapeHtml(spacing)}` +
    `<span class="panel-syntax-token-note">${escapeHtml(noteValue)}</span>`
  }`;
}

function highlightPlainText(rawText) {
  return rawText
    .split("\n")
    .map((line) => {
      if (/^\d+(?:\.\d+)?ms:\s+(?:start|stop)\s+[A-G](?:#|b)?\d+$/i.test(line)) {
        return highlightPianoRecordingLine(line);
      }

      if (/^\[\d{2}:\d{2}:\d{2}(?:\.\d{3})?\]/.test(line)) {
        return highlightPlainTail(line);
      }

      const keyMatch = line.match(/^(\s*[^:\n]{1,80})(:\s*)(.*)$/);
      if (!keyMatch) {
        return highlightPlainTail(line);
      }

      const key = `<span class="panel-syntax-token-attr">${escapeHtml(keyMatch[1])}</span>`;
      const sep = `<span class="panel-syntax-token-punc">${escapeHtml(keyMatch[2])}</span>`;
      const tail = highlightPlainTail(keyMatch[3]);
      return `${key}${sep}${tail}`;
    })
    .join("\n");
}

function preservePanelTrailingLine(rawText, highlightedText) {
  return rawText.endsWith("\n")
    ? `${highlightedText}<span class="panel-syntax-trailing-line">&#8203;</span>`
    : highlightedText;
}

function setupPanelSyntaxHighlighting() {
  const panelContainer = document.getElementById("panel-container");
  if (!panelContainer) return;

  const textareas = Array.from(panelContainer.querySelectorAll("textarea"));
  if (!textareas.length) return;

  textareas.forEach((textarea) => {
    if (textarea.parentElement?.classList.contains("panel-syntax-editor")) return;

    const editor = document.createElement("div");
    editor.className = "panel-syntax-editor";

    const preview = document.createElement("pre");
    preview.className = "panel-syntax-preview";
    preview.setAttribute("aria-hidden", "true");

    textarea.classList.add("panel-syntax-textarea");
    textarea.parentNode.insertBefore(editor, textarea);
    editor.appendChild(preview);
    editor.appendChild(textarea);

    const syncPreviewScroll = () => {
      preview.scrollTop = textarea.scrollTop;
      preview.scrollLeft = textarea.scrollLeft;
    };

    const syncPreview = () => {
      const value = textarea.value || "";
      const looksLikeMarkup = /<[\w!/?]/.test(value);
      const highlighted = looksLikeMarkup ? highlightMarkup(value) : highlightPlainText(value);
      preview.innerHTML = preservePanelTrailingLine(value, highlighted);
      syncPreviewScroll();
      requestAnimationFrame(syncPreviewScroll);
      textarea.dataset.panelSyntaxLastValue = value;      updatePanelDownloadButtonState(panelContainer);    };

    textarea.addEventListener("input", syncPreview);
    textarea.addEventListener("scroll", syncPreviewScroll);
    textarea.addEventListener("select", () => requestAnimationFrame(syncPreviewScroll));

    // Some pages update panel textareas programmatically (no input event);
    // keep the syntax overlay synced with those updates.
    window.setInterval(() => {
      if (!textarea.isConnected) return;
      const currentValue = textarea.value || "";
      if (textarea.dataset.panelSyntaxLastValue !== currentValue) {
        syncPreview();
        return;
      }

      if (preview.scrollTop !== textarea.scrollTop || preview.scrollLeft !== textarea.scrollLeft) {
        syncPreviewScroll();
      }
    }, 200);

    syncPreview();
  });
}

function updatePanelDownloadButtonState(panelContainer) {
  if (!panelContainer) return;

  const textareas = Array.from(panelContainer.querySelectorAll("textarea"));
  const hasContent = textareas.some((textarea) => {
    const value = (textarea.value || "").trim();
    const placeholder = (textarea.getAttribute("placeholder") || "").trim();
    return value.length > 0 && value !== placeholder;
  });
  const buttons = panelContainer.querySelectorAll("#copy-button, .panel-download-button, .panel-speech-button");

  buttons.forEach((button) => {
    const isDisabled = !hasContent;
    button.disabled = isDisabled;
    button.classList.toggle("grey", isDisabled);
    button.setAttribute("aria-disabled", String(isDisabled));
    if (isDisabled && button.classList.contains("panel-speech-button")) {
      button.classList.remove("button-on");
      button.setAttribute("aria-pressed", "false");
      button.title = "Speak panel text";
    }
  });
}

function setupPanelWrapToggle() {
  const panelContainer = document.getElementById("panel-container");
  if (!panelContainer) return;

  const textareas = Array.from(panelContainer.querySelectorAll("textarea"));
  if (!textareas.length) return;

  const footers = Array.from(panelContainer.querySelectorAll(":scope > .module-footer"));
  if (!footers.length) return;

  textareas.forEach((textarea) => {
    textarea.addEventListener("input", () => updatePanelDownloadButtonState(panelContainer));
  });

  const release = getReleaseFromPath();
  const wrapStorageKey = `${release}.panel_wrap`;
  const syntaxColorStorageKey = `${release}.panel_syntax_color`;
  const savedWrapSetting = localStorage.getItem(wrapStorageKey);
  const savedSyntaxColorSetting = localStorage.getItem(syntaxColorStorageKey);
  const globalWrapDefault = localStorage.getItem("global.wrap") === "true";
  const isWrapOn = savedWrapSetting === null ? globalWrapDefault : savedWrapSetting === "true";
  const isSyntaxColorOn = savedSyntaxColorSetting !== "false";

  applyPanelWrap(textareas, isWrapOn);
  panelContainer.classList.toggle("panel-syntax-color-off", !isSyntaxColorOn);

  let currentUtterance = null;
  let isSpeaking = false;

  const setSpeechState = (active) => {
    isSpeaking = active;
    footers.forEach((footer) => {
      const button = footer.querySelector(".panel-speech-button");
      if (!button) return;
      button.classList.toggle("button-on", active);
      button.setAttribute("aria-pressed", String(active));
      button.title = active ? "Stop speaking" : "Speak panel text";
    });
  };

  const stopSpeech = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    currentUtterance = null;
    setSpeechState(false);
  };

  const startSpeech = () => {
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;
    const text = textareas.map((textarea) => textarea.value.trim()).filter(Boolean).join("\n\n");
    if (!text) {
      setSpeechState(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    utterance.onend = utterance.onerror = () => {
      if (currentUtterance !== utterance) return;
      currentUtterance = null;
      setSpeechState(false);
    };

    window.speechSynthesis.speak(utterance);
    setSpeechState(true);
  };

  footers.forEach((footer, index) => {
    const copyButton = footer.querySelector("#copy-button");

    const placePanelFooterButton = (button) => {
      if (copyButton && copyButton.parentElement === footer) {
        footer.insertBefore(button, copyButton);
        return;
      }
      footer.appendChild(button);
    };

    let speechButton = footer.querySelector(".panel-speech-button");
    if (!speechButton) {
      speechButton = document.createElement("button");
      speechButton.className = "square panel-speech-button";
      speechButton.id = index === 0 ? "panel-speech-button" : `panel-speech-button-${index + 1}`;
      speechButton.title = "Speak panel text";
      speechButton.innerHTML = `
      <svg class="icons"><use href="/icons.svg#speech" /></svg>
      <span class="button-text">Speech</span>`;

      speechButton.addEventListener("click", () => {
        if (isSpeaking) {
          stopSpeech();
        } else {
          startSpeech();
        }
      });
    }
    speechButton.setAttribute("aria-pressed", "false");
    placePanelFooterButton(speechButton);

    let downloadButton = footer.querySelector(".panel-download-button");
    if (!downloadButton) {
      downloadButton = document.createElement("button");
      downloadButton.className = "square panel-download-button";
      downloadButton.id = index === 0 ? "panel-download-button" : `panel-download-button-${index + 1}`;
      downloadButton.title = "Download panel data";
      downloadButton.innerHTML = `
      <svg class="icons"><use href="/icons.svg#download" /></svg>
      <span class="button-text">Download</span>`;

      downloadButton.addEventListener("click", () => {
        const values = Array.from(footer.closest(".container")?.querySelectorAll("textarea") || [])
          .map((textarea) => textarea.value || "")
          .filter((value) => value.length > 0);

        if (!values.length) return;

        const payload = values.length > 1 ? values.join("\n\n") : values[0];
        const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = String(now.getFullYear());
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const timestamp = `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
        const pageSlug = (release || "panel").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "panel";
        const filename = `pekosoft_${pageSlug}_${timestamp}.txt`;
        link.href = url;
        link.download = typeof window.ensurePekosoftFilename === "function"
          ? window.ensurePekosoftFilename(filename)
          : (filename.toLowerCase().startsWith("pekosoft_") ? filename : `pekosoft_${filename}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      });
    }
    placePanelFooterButton(downloadButton);

    let wrapButton = footer.querySelector(".panel-wrap-button");
    if (!wrapButton) {
      wrapButton = document.createElement("button");
      wrapButton.className = "square panel-wrap-button";
      wrapButton.id = index === 0 ? "panel-wrap-button" : `panel-wrap-button-${index + 1}`;
      wrapButton.title = "Toggle text wrap";
      wrapButton.innerHTML = `
      <svg class="icons"><use href="/icons.svg#wrap_text" /></svg>
      <span class="button-text">Wrap</span>`;

      wrapButton.addEventListener("click", () => {
        const nextState = !wrapButton.classList.contains("button-on");
        localStorage.setItem(wrapStorageKey, nextState ? "true" : "false");
        applyPanelWrap(textareas, nextState);
        footers.forEach((f) => {
          const btn = f.querySelector(".panel-wrap-button");
          if (btn) btn.classList.toggle("button-on", nextState);
        });
        syncGlobalPanelWrapFromTools();
      });
    }
    wrapButton.classList.toggle("button-on", isWrapOn);
    placePanelFooterButton(wrapButton);

    let colorButton = footer.querySelector(".panel-syntax-color-button");
    if (!colorButton) {
      colorButton = document.createElement("button");
      colorButton.className = "square panel-syntax-color-button";
      colorButton.id = index === 0 ? "panel-syntax-color-button" : `panel-syntax-color-button-${index + 1}`;
      colorButton.title = "Toggle syntax color";
      colorButton.innerHTML = `
      <svg class="icons"><use href="/icons.svg#alpha" /></svg>
      <span class="button-text">Color</span>`;

      colorButton.addEventListener("click", () => {
        const nextState = !colorButton.classList.contains("button-on");
        localStorage.setItem(syntaxColorStorageKey, nextState ? "true" : "false");
        panelContainer.classList.toggle("panel-syntax-color-off", !nextState);
        footers.forEach((f) => {
          const btn = f.querySelector(".panel-syntax-color-button");
          if (btn) btn.classList.toggle("button-on", nextState);
        });
      });
    }
    colorButton.classList.toggle("button-on", isSyntaxColorOn);
    placePanelFooterButton(colorButton);
  });

  window.addEventListener("pekosoft:wrap-global-change", (event) => {
    const enabled = !!event.detail?.enabled;
    applyPanelWrap(textareas, enabled);
    footers.forEach((footer) => {
      footer.querySelector(".panel-wrap-button")?.classList.toggle("button-on", enabled);
    });
  });

  window.addEventListener("beforeunload", stopSpeech, { once: true });

  updatePanelDownloadButtonState(panelContainer);
}

async function copyTimelineCanvasToClipboard(timelineContainer) {
  const bitmapBuilder = typeof window.buildTimelineBitmap === "function" ? window.buildTimelineBitmap : null;
  if (!bitmapBuilder) return;
  const canvas = await bitmapBuilder(timelineContainer);
  if (!canvas) return;
  if (!navigator.clipboard || typeof navigator.clipboard.write !== "function" || typeof ClipboardItem === "undefined") return;

  const blob = await new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png");
  });
  if (!blob) return;

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob })
  ]);
}

function setupTimelineCopyButton() {
  const timelineContainer = document.getElementById("timeline-container");
  if (!timelineContainer) return;
  const currentPath = (window.location.pathname || "").toLowerCase();
  const isPlayerTimeline = currentPath.endsWith("/player.php") || currentPath === "/player.php";

  const hasCanvas = timelineContainer.querySelector("canvas");
  const hasSvg = timelineContainer.querySelector("svg");
  if (!hasCanvas && !hasSvg) return;

  const footers = Array.from(timelineContainer.querySelectorAll(":scope > .module-footer"));
  if (!footers.length) return;

  footers.forEach((footer, index) => {
    if (footer.querySelector(".timeline-copy-button")) return;

    const copyButton = document.createElement("button");
    copyButton.className = "square timeline-copy-button";
    copyButton.id = index === 0 ? "timeline-copy-button" : `timeline-copy-button-${index + 1}`;
    copyButton.title = isPlayerTimeline ? "Copy to clipboard" : "Copy bitmap";
    copyButton.innerHTML = `
      <svg class="icons"><use href="/icons.svg#copy" /></svg>
      <span class="button-text">Copy</span>`;

    copyButton.addEventListener("click", async () => {
      try {
        if (isPlayerTimeline && typeof window.copyTimelineAudioToClipboard === "function") {
          await window.copyTimelineAudioToClipboard();
          return;
        }
        await copyTimelineCanvasToClipboard(timelineContainer);
      } catch (error) {
        console.warn("Timeline canvas copy failed:", error);
      }
    });

    footer.appendChild(copyButton);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  syncModuleViewportHeight();
  moduleIds.forEach(id => setupModuleHeader(id));
  applyModuleOrder(loadModuleOrder());
  restoreModuleStates();
  syncFirstModule();
  disableMinimizeForTwoColumnLayout();
  syncMaximizedModuleState();
  document.documentElement.classList.remove("modules-loading");

  requestAnimationFrame(() => {
    setupPanelSyntaxHighlighting();
    setupPanelWrapToggle();
    setupTimelineCopyButton();
  });

  const map = {
    "tool-toggle-toc-button": () => toggleModule("tool"),
    "meters-toggle-toc-button": () => toggleModule("meters"),
    "controls-toggle-toc-button": () => toggleModule("controls"),
    "timeline-toggle-toc-button": () => toggleModule("timeline"),
    "playlist-toggle-toc-button": () => toggleModule("playlist"),
    "history-toggle-toc-button": () => toggleModule("history"),
    "panel-toggle-toc-button": () => toggleModule("panel")
  };

  Object.entries(map).forEach(([id, handler]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handler);
  });
});

window.addEventListener("resize", syncModuleViewportHeight);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", syncModuleViewportHeight);
  window.visualViewport.addEventListener("scroll", syncModuleViewportHeight);
}

// END OF FILE
