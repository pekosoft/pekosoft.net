// Pekosoft Icons
// pekosoft.net/js/icons.js

// ELEMENT DECLARATIONS

const panel = document.getElementById("icons-text");
const gridIcons = document.querySelectorAll(".grid-icon");
const previewIcon = document.getElementById("preview-icon");
const previewGridOverlay = document.getElementById("preview-grid-overlay");
const previewWrapper = document.querySelector(".preview-wrapper");
const previewStage = document.querySelector(".preview-stage");
const previewRulers = document.getElementById("preview-rulers");
const previewRulerTop = document.querySelector(".preview-ruler-top");
const previewRulerLeft = document.querySelector(".preview-ruler-left");
const previewRulerRight = document.querySelector(".preview-ruler-right");
const previewRulerBottom = document.querySelector(".preview-ruler-bottom");
const playButton = document.getElementById("play-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const gridSizeKnob = document.getElementById("icons-grid-size-knob");
const speedKnob = document.getElementById("speed-knob");
const reverseButton = document.getElementById("reverse-button");
const openButton = document.getElementById("open-button");
const openFileInput = document.getElementById("open-file-input");
const saveButton = document.getElementById("save-button");
const savePngButton = document.getElementById("save-png-button");
const resetButton = document.getElementById("reset-button");
const undoButton = document.getElementById("undo-button");
const redoButton = document.getElementById("redo-button");
const rotateButton = document.getElementById("rotate-button");
const centerButton = document.getElementById("center-button");
const selectAllButton = document.getElementById("select-all-button");
const selectNoneButton = document.getElementById("select-none-button");
const resizeButton = document.getElementById("resize-button");
const drawButton = document.getElementById("draw-button");
const rectangleButton = document.getElementById("rectangle-button");
const rectangleOutlineButton = document.getElementById("rectangle-outline-button");
const circleButton = document.getElementById("circle-button");
const circleOutlineButton = document.getElementById("circle-outline-button");
const selectButton = document.getElementById("select-button");
const deleteButton = document.getElementById("delete-button");
const flattenButton = document.getElementById("flatten-button");
const editCopyButton = document.getElementById("edit-copy-button");
const editCutButton = document.getElementById("edit-cut-button");
const editPasteButton = document.getElementById("edit-paste-button");
const copyButton = document.getElementById("copy-button");
const panelCurrentButton = document.getElementById("panel-current-button");
const panelAllButton = document.getElementById("panel-all-button");
const rulersButton = document.getElementById("rulers-button");
const gridButton = document.getElementById("grid-button");
const radiusButton = document.getElementById("radius-button");
const timelineGridButton = document.getElementById("timeline-grid-button");
const sizeButton = document.getElementById("size-button");
const iconsField = document.getElementById("icons-field");
const bytesField = document.getElementById("bytes-field");
const nameField = document.getElementById("name-field");
const gridSizeField = document.getElementById("grid-size-field");
const speedField = document.getElementById("speed-field");
const searchField = document.getElementById("search-field");
const timelineIcons = document.querySelectorAll("#timeline-container .icon-grid .icons");
const timelineIconGrid = document.querySelector("#timeline-container .icon-grid");

// STATE

let svgText = null;
let iconIds = [];
let currentIconIndex = 0;
let playInterval = null;
let filteredIds = [];
let editorTool = "select";
let editorPointer = null;
const editedSymbolCodes = new Map();
const selectedElements = new Set();

const previewGridStorageKey = "icons.preview_grid";
const previewRadiusStorageKey = "icons.preview_radius";
const previewRulersStorageKey = "icons.preview_rulers";
const previewGridSizeStorageKey = "icons.preview_grid_size";
const timelineGridStorageKey = "icons.timeline_grid";
const timelineSizeStorageKey = "icons.timeline_small";
const legacyPlaySpeedStorageKey = "icons.play_speed";
const playSpeedStorageKey = "icons.play_speed_percent";
const playDirectionStorageKey = "icons.play_direction";
const searchStorageKey = "icons.search";
const panelModeStorageKey = "icons.panel_mode";

const gridSizeSteps = [8, 16, 32, 64, 128, 256];
const defaultGridSize = 16;
const minPlaySpeed = 25;
const maxPlaySpeed = 200;
const speedSteps = Array.from({ length: maxPlaySpeed - minPlaySpeed + 1 }, (_, index) => minPlaySpeed + index);
const defaultPlaySpeed = 100;
const defaultIconsPerMinute = 60;
const knobDragPixelsDefault = 14;
const knobDragPixelsSensitive = 2;
let previewGridSize = defaultGridSize;
let playSpeed = defaultPlaySpeed;
let playDirection = 1;
let panelMode = "current";
let editorClipboard = [];
const editUndoStack = [];
const editRedoStack = [];
const maxEditHistory = 100;

// FUNCTIONS

function extractSymbol(id) {
  const symbolRegex = new RegExp(`<symbol[^>]*id="${id}"[^>]*>([\\s\\S]*?)</symbol>`, "i");
  const match = svgText.match(symbolRegex);
  if (match) {
    const openTag = svgText.match(new RegExp(`<symbol[^>]*id="${id}"[^>]*>`, "i"))[0];
    return openTag + match[1] + "</symbol>";
  }
  return null;
}

function getCurrentIconId() {
  return iconIds[currentIconIndex] ?? null;
}

function getSymbolCodeForId(id) {
  return editedSymbolCodes.get(id) || extractSymbol(id);
}

function renderTimelineIcon(id) {
  const gridIcon = Array.from(gridIcons).find((icon) => icon.dataset.id === id);
  const iconSvg = gridIcon?.querySelector("svg");
  if (!iconSvg) return;

  const symbolCode = editedSymbolCodes.get(id);
  if (!symbolCode) {
    iconSvg.removeAttribute("viewBox");
    iconSvg.innerHTML = `<use href="/icons.svg#${id}" />`;
    return;
  }

  const parsed = parseSymbolCode(symbolCode);
  if (!parsed) return;
  iconSvg.setAttribute("viewBox", parsed.viewBox);
  iconSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  iconSvg.innerHTML = parsed.content;
}

function renderAllTimelineIcons() {
  iconIds.forEach((id) => renderTimelineIcon(id));
}

function buildStandaloneSvg(id) {
  const symbolCode = getSymbolCodeForId(id);
  if (!symbolCode) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${symbolCode}</svg>`,
    "image/svg+xml"
  );
  const symbol = doc.querySelector("symbol");
  if (!symbol) return null;

  // Keep xmlns only on the root <svg> we generate; remove redundant child namespaces.
  symbol.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) {
        el.removeAttribute(attr.name);
      }
    });
  });

  const viewBox = symbol.getAttribute("viewBox") || "0 0 512 512";
  const content = symbol.innerHTML
    .trim()
    .replace(/\sxmlns(?:\:[\w-]+)?="[^"]*"/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n${content}\n</svg>\n`;
}

function formatDownloadTimestamp(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
}

function getIconDownloadFilename(extension) {
  return `icons_icon_${formatDownloadTimestamp()}.${extension}`;
}

function parseSymbolCode(symbolCode) {
  if (!symbolCode) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${symbolCode}</svg>`,
    "image/svg+xml"
  );

  if (doc.querySelector("parsererror")) return null;

  const symbol = doc.querySelector("symbol");
  if (!symbol) return null;

  return {
    id: symbol.getAttribute("id") || "",
    viewBox: symbol.getAttribute("viewBox") || "0 0 512 512",
    content: symbol.innerHTML
  };
}

function normalizeSvgToSymbolCode(fileText) {
  if (!fileText) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(fileText, "image/svg+xml");
  if (doc.querySelector("parsererror")) return null;

  const currentId = getCurrentIconId();
  if (!currentId) return null;

  const symbol = doc.querySelector("symbol");
  const rootSvg = doc.querySelector("svg");
  const fallbackViewBox = "0 0 512 512";
  const imported = symbol || rootSvg;

  if (!imported) return null;

  const importedViewBox = (symbol?.getAttribute("viewBox") || rootSvg?.getAttribute("viewBox") || fallbackViewBox)
    .trim()
    .split(/\s+/)
    .map(Number);
  const sourceX = Number.isFinite(importedViewBox[0]) ? importedViewBox[0] : 0;
  const sourceY = Number.isFinite(importedViewBox[1]) ? importedViewBox[1] : 0;
  const sourceWidth = Number.isFinite(importedViewBox[2]) && importedViewBox[2] > 0 ? importedViewBox[2] : 512;
  const sourceHeight = Number.isFinite(importedViewBox[3]) && importedViewBox[3] > 0 ? importedViewBox[3] : 512;
  const scale = Math.min(512 / sourceWidth, 512 / sourceHeight);
  const offsetX = ((512 - (sourceWidth * scale)) / 2) - (sourceX * scale);
  const offsetY = ((512 - (sourceHeight * scale)) / 2) - (sourceY * scale);
  const transform = `matrix(${formatNumber(scale)} 0 0 ${formatNumber(scale)} ${formatNumber(offsetX)} ${formatNumber(offsetY)})`;

  if (symbol) {
    const importedId = symbol.getAttribute("id") || "";
    const targetId = iconIds.includes(importedId) ? importedId : currentId;
    return `<symbol id="${targetId}" viewBox="${fallbackViewBox}">\n<g transform="${transform}">\n${symbol.innerHTML}\n</g>\n</symbol>`;
  }

  return `<symbol id="${currentId}" viewBox="${fallbackViewBox}">\n<g transform="${transform}">\n${rootSvg.innerHTML}\n</g>\n</symbol>`;
}

function renderPreviewFromSymbolCode(symbolCode) {
  const parsed = parseSymbolCode(symbolCode);

  if (!parsed) {
    previewIcon.removeAttribute("viewBox");
    previewIcon.innerHTML = "";
    clearEditorSelection();
    return false;
  }

  previewIcon.setAttribute("viewBox", parsed.viewBox);
  previewIcon.setAttribute("preserveAspectRatio", "xMidYMid meet");
  previewIcon.innerHTML = parsed.content;
  clearEditorSelection();
  return true;
}

function getViewBoxParts() {
  const parts = (previewIcon.getAttribute("viewBox") || "0 0 512 512").split(/\s+/).map(Number);
  return {
    x: Number.isFinite(parts[0]) ? parts[0] : 0,
    y: Number.isFinite(parts[1]) ? parts[1] : 0,
    width: Number.isFinite(parts[2]) && parts[2] > 0 ? parts[2] : 512,
    height: Number.isFinite(parts[3]) && parts[3] > 0 ? parts[3] : 512
  };
}

function isPreviewGridOn() {
  return localStorage.getItem(previewGridStorageKey) === "true";
}

function clampCoordinate(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function snapCoordinate(value) {
  if (!isPreviewGridOn()) return value;
  return Math.round(value / previewGridSize) * previewGridSize;
}

function getPreviewPoint(event) {
  const rect = previewIcon.getBoundingClientRect();
  const viewBox = getViewBoxParts();
  const rawX = viewBox.x + ((event.clientX - rect.left) / Math.max(1, rect.width)) * viewBox.width;
  const rawY = viewBox.y + ((event.clientY - rect.top) / Math.max(1, rect.height)) * viewBox.height;
  return {
    x: clampCoordinate(snapCoordinate(rawX), viewBox.x, viewBox.x + viewBox.width),
    y: clampCoordinate(snapCoordinate(rawY), viewBox.y, viewBox.y + viewBox.height),
    rawX: clampCoordinate(rawX, viewBox.x, viewBox.x + viewBox.width),
    rawY: clampCoordinate(rawY, viewBox.y, viewBox.y + viewBox.height)
  };
}

function formatNumber(value) {
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function getEditorShapeFromTarget(target) {
  if (!target || target === previewIcon || !previewIcon.contains(target)) return null;
  let element = target;
  while (element.parentElement && element.parentElement !== previewIcon) {
    element = element.parentElement;
  }
  return element.parentElement === previewIcon ? element : null;
}

function getEditableElements() {
  return Array.from(previewIcon.children).filter((element) => element instanceof SVGGraphicsElement);
}

function clearEditorSelection() {
  selectedElements.forEach((element) => {
    element.classList.remove("editor-selected");
    element.removeAttribute("data-editor-selected");
    if (!element.getAttribute("class")) element.removeAttribute("class");
  });
  selectedElements.clear();
}

function selectElement(element, additive = false) {
  if (!element) {
    if (!additive) clearEditorSelection();
    return;
  }
  if (!additive) clearEditorSelection();
  if (additive && selectedElements.has(element)) {
    selectedElements.delete(element);
    element.classList.remove("editor-selected");
    element.removeAttribute("data-editor-selected");
    if (!element.getAttribute("class")) element.removeAttribute("class");
    return;
  }
  selectedElements.add(element);
  element.classList.add("editor-selected");
  element.setAttribute("data-editor-selected", "true");
}

function selectAllElements() {
  clearEditorSelection();
  getEditableElements().forEach((element) => selectElement(element, true));
}

function getSelectionElementsOrAll() {
  const selected = Array.from(selectedElements).filter((element) => previewIcon.contains(element));
  return selected.length ? selected : getEditableElements();
}

function getSelectedEditableElements() {
  return Array.from(selectedElements).filter((element) => previewIcon.contains(element));
}

function cleanEditorClone(element) {
  element.querySelectorAll(".editor-selected, [data-editor-selected]").forEach((child) => {
    child.classList.remove("editor-selected");
    child.removeAttribute("data-editor-selected");
    if (!child.getAttribute("class")) child.removeAttribute("class");
  });
  element.classList.remove("editor-selected");
  element.removeAttribute("data-editor-selected");
  if (!element.getAttribute("class")) element.removeAttribute("class");
  return element;
}

function copySelection() {
  const elements = getSelectedEditableElements();
  if (!elements.length) return false;
  editorClipboard = elements.map((element) => cleanEditorClone(element.cloneNode(true)));
  return true;
}

function cutSelection() {
  const beforeSnapshot = getEditSnapshot();
  const elements = getSelectedEditableElements();
  if (!elements.length) return false;
  editorClipboard = elements.map((element) => cleanEditorClone(element.cloneNode(true)));
  elements.forEach((element) => element.remove());
  clearEditorSelection();
  updateCurrentPanelFromPreview();
  rememberEditFromSnapshot(beforeSnapshot);
  return true;
}

function pasteSelection() {
  if (!editorClipboard.length) return false;
  const beforeSnapshot = getEditSnapshot();
  clearEditorSelection();
  editorClipboard.forEach((element) => {
    const clone = cleanEditorClone(element.cloneNode(true));
    previewIcon.appendChild(clone);
    selectElement(clone, true);
  });
  updateCurrentPanelFromPreview();
  rememberEditFromSnapshot(beforeSnapshot);
  return true;
}

function getSelectionBox(elements) {
  const boxes = elements.map((element) => {
    try {
      return element.getBBox();
    } catch (_) {
      return null;
    }
  }).filter(Boolean);
  if (!boxes.length) return null;
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getRenderedSelectionBox(elements) {
  const points = elements.flatMap((element) => {
    try {
      const box = element.getBBox();
      const matrix = getElementToPreviewMatrix(element);
      return [
        new DOMPoint(box.x, box.y),
        new DOMPoint(box.x + box.width, box.y),
        new DOMPoint(box.x, box.y + box.height),
        new DOMPoint(box.x + box.width, box.y + box.height)
      ].map((point) => point.matrixTransform(matrix));
    } catch (_) {
      return [];
    }
  });
  if (!points.length) return null;
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function serializeCurrentSymbol() {
  const id = getCurrentIconId();
  if (!id) return null;
  const clone = previewIcon.cloneNode(true);
  clone.querySelectorAll(".editor-selected, [data-editor-selected]").forEach((element) => {
    element.classList.remove("editor-selected");
    element.removeAttribute("data-editor-selected");
    if (!element.getAttribute("class")) element.removeAttribute("class");
  });
  clone.querySelectorAll("*").forEach((element) => {
    element.removeAttribute("xmlns");
    if (!element.getAttribute("class")) element.removeAttribute("class");
  });
  const viewBox = previewIcon.getAttribute("viewBox") || "0 0 512 512";
  const content = clone.innerHTML.trim();
  return `<symbol id="${id}" viewBox="${viewBox}">\n${content}\n</symbol>`;
}

function getEditSnapshot() {
  return {
    currentId: getCurrentIconId(),
    editedSymbols: Array.from(editedSymbolCodes.entries())
  };
}

function getEditSnapshotKey(snapshot) {
  return JSON.stringify(snapshot);
}

function syncEditHistoryButtons() {
  const states = [
    { button: undoButton, canUse: editUndoStack.length > 0 },
    { button: redoButton, canUse: editRedoStack.length > 0 }
  ];
  states.forEach(({ button, canUse }) => {
    if (!button) return;
    button.classList.toggle("grey", !canUse);
    button.setAttribute("aria-disabled", canUse ? "false" : "true");
  });
}

function rememberEditFromSnapshot(beforeSnapshot) {
  if (!beforeSnapshot) return;
  const beforeKey = getEditSnapshotKey(beforeSnapshot);
  const afterKey = getEditSnapshotKey(getEditSnapshot());
  if (beforeKey === afterKey) {
    syncEditHistoryButtons();
    return;
  }

  const lastSnapshot = editUndoStack[editUndoStack.length - 1];
  if (!lastSnapshot || getEditSnapshotKey(lastSnapshot) !== beforeKey) {
    editUndoStack.push(beforeSnapshot);
    if (editUndoStack.length > maxEditHistory) {
      editUndoStack.shift();
    }
  }
  editRedoStack.length = 0;
  syncEditHistoryButtons();
}

function restoreEditSnapshot(snapshot) {
  editedSymbolCodes.clear();
  snapshot.editedSymbols.forEach(([id, symbolCode]) => {
    editedSymbolCodes.set(id, symbolCode);
  });

  if (snapshot.currentId) {
    const nextIndex = iconIds.indexOf(snapshot.currentId);
    if (nextIndex >= 0) {
      currentIconIndex = nextIndex;
    }
  }

  clearEditorSelection();
  renderAllTimelineIcons();
  updateDisplay();
  syncEditHistoryButtons();
}

function undoEdit() {
  if (!editUndoStack.length) return;
  const currentSnapshot = getEditSnapshot();
  const previousSnapshot = editUndoStack.pop();
  editRedoStack.push(currentSnapshot);
  restoreEditSnapshot(previousSnapshot);
}

function redoEdit() {
  if (!editRedoStack.length) return;
  const currentSnapshot = getEditSnapshot();
  const nextSnapshot = editRedoStack.pop();
  editUndoStack.push(currentSnapshot);
  restoreEditSnapshot(nextSnapshot);
}

function updateCurrentPanelFromPreview(markEdited = true) {
  const id = getCurrentIconId();
  const symbolCode = serializeCurrentSymbol();
  if (!id || !symbolCode) return;
  if (markEdited) {
    editedSymbolCodes.set(id, symbolCode);
    if (nameField) {
      nameField.value = "";
    }
    renderTimelineIcon(id);
  }
  if (panelMode === "current") {
    panel.value = symbolCode;
  }
}

function setEditorTool(tool) {
  editorTool = ["select", "resize", "draw", "rectangle", "rectangle-outline", "circle", "circle-outline"].includes(tool) ? tool : "select";
  [selectButton, resizeButton, drawButton, rectangleButton, rectangleOutlineButton, circleButton, circleOutlineButton].forEach((button) => {
    button?.classList.remove("button-on");
  });
  const activeButton = {
    select: selectButton,
    resize: resizeButton,
    draw: drawButton,
    rectangle: rectangleButton,
    "rectangle-outline": rectangleOutlineButton,
    circle: circleButton,
    "circle-outline": circleOutlineButton
  }[editorTool];
  activeButton?.classList.add("button-on");
  if (previewStage) {
    previewStage.dataset.editorTool = editorTool;
  }
}

function rotateSelectionLeft() {
  const beforeSnapshot = getEditSnapshot();
  const hadSelection = selectedElements.size > 0;
  const elements = getSelectionElementsOrAll();
  const box = getSelectionBox(elements);
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  elements.forEach((element) => {
    const existing = element.getAttribute("transform") || "";
    element.setAttribute("transform", `${existing} rotate(-90 ${formatNumber(cx)} ${formatNumber(cy)})`.trim());
  });
  if (!hadSelection) {
    clearEditorSelection();
    elements.forEach((element) => selectElement(element, true));
  }
  updateCurrentPanelFromPreview();
  rememberEditFromSnapshot(beforeSnapshot);
}

function centerSelection() {
  const elements = getSelectedEditableElements();
  const box = getRenderedSelectionBox(elements);
  if (!box) return;

  const beforeSnapshot = getEditSnapshot();
  const offsetX = 256 - (box.x + box.width / 2);
  const offsetY = 256 - (box.y + box.height / 2);
  elements.forEach((element) => {
    const existing = element.getAttribute("transform") || "";
    element.setAttribute("transform", `${existing} translate(${formatNumber(offsetX)} ${formatNumber(offsetY)})`.trim());
  });
  updateCurrentPanelFromPreview();
  rememberEditFromSnapshot(beforeSnapshot);
}

function deleteSelection() {
  const beforeSnapshot = getEditSnapshot();
  const elements = Array.from(selectedElements).filter((element) => previewIcon.contains(element));
  if (!elements.length) return;
  elements.forEach((element) => element.remove());
  clearEditorSelection();
  updateCurrentPanelFromPreview();
  rememberEditFromSnapshot(beforeSnapshot);
}

function getElementToPreviewMatrix(element) {
  const previewMatrix = previewIcon.getScreenCTM();
  const elementMatrix = element.getScreenCTM();
  if (!previewMatrix || !elementMatrix) return new DOMMatrix();
  return previewMatrix.inverse().multiply(elementMatrix);
}

function isIdentityMatrix(matrix) {
  return Math.abs(matrix.a - 1) < 0.0001
    && Math.abs(matrix.b) < 0.0001
    && Math.abs(matrix.c) < 0.0001
    && Math.abs(matrix.d - 1) < 0.0001
    && Math.abs(matrix.e) < 0.0001
    && Math.abs(matrix.f) < 0.0001;
}

function transformSvgPoint(matrix, x, y) {
  const point = new DOMPoint(x, y).matrixTransform(matrix);
  return `${formatNumber(point.x)} ${formatNumber(point.y)}`;
}

function pathFromPointList(points, matrix, closePath = false) {
  if (points.length < 2) return "";
  const commands = [`M ${transformSvgPoint(matrix, points[0].x, points[0].y)}`];
  points.slice(1).forEach((point) => {
    commands.push(`L ${transformSvgPoint(matrix, point.x, point.y)}`);
  });
  if (closePath) commands.push("Z");
  return commands.join(" ");
}

function getGridCellFromPoint(point) {
  const viewBox = getViewBoxParts();
  const cellSize = previewGridSize;
  const maxX = viewBox.x + viewBox.width - cellSize;
  const maxY = viewBox.y + viewBox.height - cellSize;
  const x = viewBox.x + Math.floor((point.rawX - viewBox.x) / cellSize) * cellSize;
  const y = viewBox.y + Math.floor((point.rawY - viewBox.y) / cellSize) * cellSize;
  return {
    x: clampCoordinate(x, viewBox.x, maxX),
    y: clampCoordinate(y, viewBox.y, maxY)
  };
}

function getGridCellKey(cell) {
  return `${formatNumber(cell.x)},${formatNumber(cell.y)}`;
}

function getDrawCellsPath(cells) {
  return Array.from(cells.values()).map((cell) => {
    const x1 = formatNumber(cell.x);
    const y1 = formatNumber(cell.y);
    const x2 = formatNumber(cell.x + previewGridSize);
    const y2 = formatNumber(cell.y + previewGridSize);
    return `M ${x1} ${y1} H ${x2} V ${y2} H ${x1} Z`;
  }).join(" ");
}

function getRectangleOutlinePath(x, y, width, height) {
  if (width <= 0 || height <= 0) return "";
  const thickness = Math.max(1, Math.min(previewGridSize, width / 2, height / 2));
  const x2 = x + width;
  const y2 = y + height;
  const innerX = x + thickness;
  const innerY = y + thickness;
  const innerX2 = x2 - thickness;
  const innerY2 = y2 - thickness;
  const outerPath = `M ${formatNumber(x)} ${formatNumber(y)} H ${formatNumber(x2)} V ${formatNumber(y2)} H ${formatNumber(x)} Z`;
  if (innerX2 <= innerX || innerY2 <= innerY) return outerPath;
  const innerPath = `M ${formatNumber(innerX)} ${formatNumber(innerY)} H ${formatNumber(innerX2)} V ${formatNumber(innerY2)} H ${formatNumber(innerX)} Z`;
  return `${outerPath} ${innerPath}`;
}

function getCirclePath(cx, cy, radius) {
  if (radius <= 0) return "";
  return `M ${formatNumber(cx - radius)} ${formatNumber(cy)} A ${formatNumber(radius)} ${formatNumber(radius)} 0 1 0 ${formatNumber(cx + radius)} ${formatNumber(cy)} A ${formatNumber(radius)} ${formatNumber(radius)} 0 1 0 ${formatNumber(cx - radius)} ${formatNumber(cy)} Z`;
}

function getCircleOutlinePath(cx, cy, radius) {
  if (radius <= 0) return "";
  const thickness = Math.max(1, Math.min(previewGridSize, radius));
  const outerPath = getCirclePath(cx, cy, radius);
  const innerRadius = radius - thickness;
  return innerRadius > 0 ? `${outerPath} ${getCirclePath(cx, cy, innerRadius)}` : outerPath;
}

function addDrawCell(editorState, cell) {
  editorState.cells.set(getGridCellKey(cell), cell);
}

function addDrawCellsBetween(editorState, fromCell, toCell) {
  const cellSize = previewGridSize;
  const deltaX = Math.round((toCell.x - fromCell.x) / cellSize);
  const deltaY = Math.round((toCell.y - fromCell.y) / cellSize);
  const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY), 1);
  for (let index = 0; index <= steps; index++) {
    const x = fromCell.x + Math.round((deltaX * index) / steps) * cellSize;
    const y = fromCell.y + Math.round((deltaY * index) / steps) * cellSize;
    addDrawCell(editorState, { x, y });
  }
}

function getNumberAttribute(element, name, fallback = 0) {
  const value = parseFloat(element.getAttribute(name) || "");
  return Number.isFinite(value) ? value : fallback;
}

function getPointAttributeList(element) {
  const values = (element.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
  const points = [];
  for (let index = 0; index < values.length - 1; index += 2) {
    if (Number.isFinite(values[index]) && Number.isFinite(values[index + 1])) {
      points.push({ x: values[index], y: values[index + 1] });
    }
  }
  return points;
}

function pathFromEllipse(element, matrix) {
  const cx = getNumberAttribute(element, "cx");
  const cy = getNumberAttribute(element, "cy");
  const rx = element.tagName.toLowerCase() === "circle"
    ? getNumberAttribute(element, "r")
    : getNumberAttribute(element, "rx");
  const ry = element.tagName.toLowerCase() === "circle"
    ? rx
    : getNumberAttribute(element, "ry");
  if (rx <= 0 || ry <= 0) return "";
  const points = Array.from({ length: 64 }, (_, index) => {
    const angle = (index / 64) * Math.PI * 2;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });
  return pathFromPointList(points, matrix, true);
}

function splitPathDataSubpaths(pathData) {
  const starts = [];
  const matcher = /M/g;
  let match;
  while ((match = matcher.exec(pathData)) !== null) {
    starts.push(match.index);
  }
  if (!starts.length) return [pathData];
  return starts.map((start, index) => {
    const end = starts[index + 1] ?? pathData.length;
    return pathData.slice(start, end).trim();
  }).filter(Boolean);
}

function samplePathData(pathData, matrix) {
  const commands = [];
  splitPathDataSubpaths(pathData).forEach((subpathData) => {
    const samplePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    samplePath.setAttribute("d", subpathData);
    samplePath.style.visibility = "hidden";
    samplePath.style.pointerEvents = "none";
    previewIcon.appendChild(samplePath);
    let length = 0;
    try {
      length = samplePath.getTotalLength();
    } catch (_) {
      samplePath.remove();
      return;
    }
    if (!Number.isFinite(length) || length <= 0) {
      samplePath.remove();
      return;
    }
    const segments = Math.min(256, Math.max(4, Math.ceil(length / 4)));
    const points = Array.from({ length: segments + 1 }, (_, index) => {
      const point = samplePath.getPointAtLength((length * index) / segments);
      return { x: point.x, y: point.y };
    });
    commands.push(pathFromPointList(points, matrix, /[Zz]\s*$/.test(subpathData)));
    samplePath.remove();
  });
  return commands.join(" ");
}

function flattenElementToPathData(element) {
  const tagName = element.tagName.toLowerCase();
  const matrix = getElementToPreviewMatrix(element);
  if (tagName === "path") {
    const pathData = (element.getAttribute("d") || "").trim();
    if (!pathData) return "";
    return isIdentityMatrix(matrix) ? pathData : samplePathData(pathData, matrix);
  }
  if (tagName === "rect") {
    const x = getNumberAttribute(element, "x");
    const y = getNumberAttribute(element, "y");
    const width = getNumberAttribute(element, "width");
    const height = getNumberAttribute(element, "height");
    if (width <= 0 || height <= 0) return "";
    return pathFromPointList([
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ], matrix, true);
  }
  if (tagName === "circle" || tagName === "ellipse") {
    return pathFromEllipse(element, matrix);
  }
  if (tagName === "line") {
    return pathFromPointList([
      { x: getNumberAttribute(element, "x1"), y: getNumberAttribute(element, "y1") },
      { x: getNumberAttribute(element, "x2"), y: getNumberAttribute(element, "y2") }
    ], matrix, false);
  }
  if (tagName === "polyline" || tagName === "polygon") {
    return pathFromPointList(getPointAttributeList(element), matrix, tagName === "polygon");
  }
  return "";
}

function flattenElementsToPath() {
  const beforeSnapshot = getEditSnapshot();
  const elements = Array.from(previewIcon.querySelectorAll("path, rect, circle, ellipse, line, polyline, polygon"));
  if (!elements.length) return;
  const pathData = elements.map(flattenElementToPathData).filter(Boolean).join(" ").trim();
  if (!pathData) return;

  const needsStroke = elements.some((element) => {
    const fill = element.getAttribute("fill");
    const stroke = element.getAttribute("stroke");
    return fill === "none" || (stroke && stroke !== "none");
  });
  const allStrokeOnly = elements.every((element) => element.getAttribute("fill") === "none");
  const fillRule = elements.map((element) => element.getAttribute("fill-rule")).find(Boolean);
  const strokeWidths = elements.map((element) => parseFloat(element.getAttribute("stroke-width") || "")).filter(Number.isFinite);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  if (allStrokeOnly) {
    path.setAttribute("fill", "none");
  }
  if (fillRule) {
    path.setAttribute("fill-rule", fillRule);
  }
  if (needsStroke) {
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", formatNumber(Math.max(1, ...strokeWidths)));
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
  }

  previewIcon.innerHTML = "";
  previewIcon.appendChild(path);
  clearEditorSelection();
  selectElement(path);
  updateCurrentPanelFromPreview();
  rememberEditFromSnapshot(beforeSnapshot);
}

function fitPreviewContentToCanvas() {
  const elements = Array.from(previewIcon.querySelectorAll("path, rect, circle, ellipse, line, polyline, polygon"));
  const box = getSelectionBox(elements);
  if (!box || box.width <= 0 || box.height <= 0) return false;

  const scale = 512 / Math.max(box.width, box.height);
  const offsetX = ((512 - (box.width * scale)) / 2) - (box.x * scale);
  const offsetY = ((512 - (box.height * scale)) / 2) - (box.y * scale);
  elements.forEach((element) => {
    const existing = element.getAttribute("transform") || "";
    element.setAttribute("transform", `${existing} matrix(${formatNumber(scale)} 0 0 ${formatNumber(scale)} ${formatNumber(offsetX)} ${formatNumber(offsetY)})`.trim());
  });
  return true;
}

function startDrawing(event, point) {
  const historyBefore = getEditSnapshot();
  const elementTag = editorTool === "circle" ? "circle" : editorTool === "rectangle" ? "rect" : "path";
  const element = document.createElementNS("http://www.w3.org/2000/svg", elementTag);
  const firstCell = editorTool === "draw" ? getGridCellFromPoint(point) : null;
  const firstCells = editorTool === "draw" ? new Map([[getGridCellKey(firstCell), firstCell]]) : null;
  if (editorTool === "draw") {
    element.setAttribute("d", getDrawCellsPath(firstCells));
  } else if (editorTool === "rectangle-outline" || editorTool === "circle-outline") {
    element.setAttribute("fill-rule", "evenodd");
    element.setAttribute("d", "");
  } else if (editorTool === "rectangle") {
    element.setAttribute("x", formatNumber(point.x));
    element.setAttribute("y", formatNumber(point.y));
    element.setAttribute("width", "0");
    element.setAttribute("height", "0");
  } else {
    element.setAttribute("cx", formatNumber(point.x));
    element.setAttribute("cy", formatNumber(point.y));
    element.setAttribute("r", "0");
  }
  previewIcon.appendChild(element);
  selectElement(element);
  editorPointer = {
    type: editorTool,
    element,
    start: point,
    cells: firstCells,
    lastCell: firstCell,
    historyBefore
  };
  if (typeof previewIcon.setPointerCapture === "function") {
    try {
      previewIcon.setPointerCapture(event.pointerId);
    } catch (_) {}
  }
}

function updateDrawing(point) {
  if (!editorPointer?.element) return;
  const { element, start, type } = editorPointer;
  if (type === "draw") {
    const cell = getGridCellFromPoint(point);
    if (!editorPointer.lastCell || getGridCellKey(editorPointer.lastCell) !== getGridCellKey(cell)) {
      addDrawCellsBetween(editorPointer, editorPointer.lastCell || cell, cell);
      editorPointer.lastCell = cell;
      element.setAttribute("d", getDrawCellsPath(editorPointer.cells));
    }
  } else if (type === "rectangle") {
    const x = Math.min(start.x, point.x);
    const y = Math.min(start.y, point.y);
    element.setAttribute("x", formatNumber(x));
    element.setAttribute("y", formatNumber(y));
    element.setAttribute("width", formatNumber(Math.abs(point.x - start.x)));
    element.setAttribute("height", formatNumber(Math.abs(point.y - start.y)));
  } else if (type === "rectangle-outline") {
    const x = Math.min(start.x, point.x);
    const y = Math.min(start.y, point.y);
    const width = Math.abs(point.x - start.x);
    const height = Math.abs(point.y - start.y);
    element.setAttribute("d", getRectangleOutlinePath(x, y, width, height));
  } else if (type === "circle") {
    const diameter = Math.min(Math.abs(point.x - start.x), Math.abs(point.y - start.y));
    const cx = start.x + Math.sign(point.x - start.x || 1) * diameter / 2;
    const cy = start.y + Math.sign(point.y - start.y || 1) * diameter / 2;
    element.setAttribute("cx", formatNumber(cx));
    element.setAttribute("cy", formatNumber(cy));
    element.setAttribute("r", formatNumber(diameter / 2));
  } else if (type === "circle-outline") {
    const diameter = Math.min(Math.abs(point.x - start.x), Math.abs(point.y - start.y));
    const cx = start.x + Math.sign(point.x - start.x || 1) * diameter / 2;
    const cy = start.y + Math.sign(point.y - start.y || 1) * diameter / 2;
    element.setAttribute("d", getCircleOutlinePath(cx, cy, diameter / 2));
  }
}

function startResize(event, point, targetElement) {
  if (!selectedElements.size && targetElement) selectElement(targetElement);
  const elements = Array.from(selectedElements).filter((element) => previewIcon.contains(element));
  const box = getSelectionBox(elements);
  if (!box) return;
  const historyBefore = getEditSnapshot();
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const startDistance = Math.max(1, Math.hypot(point.x - center.x, point.y - center.y));
  editorPointer = {
    type: "resize",
    elements,
    center,
    startDistance,
    startTransforms: elements.map((element) => element.getAttribute("transform") || ""),
    historyBefore
  };
  if (typeof previewIcon.setPointerCapture === "function") {
    try {
      previewIcon.setPointerCapture(event.pointerId);
    } catch (_) {}
  }
}

function updateResize(point) {
  if (!editorPointer || editorPointer.type !== "resize") return;
  const distance = Math.max(1, Math.hypot(point.x - editorPointer.center.x, point.y - editorPointer.center.y));
  const scale = Math.max(0.05, Math.min(8, distance / editorPointer.startDistance));
  editorPointer.elements.forEach((element, index) => {
    const existing = editorPointer.startTransforms[index];
    element.setAttribute("transform", `${existing} translate(${formatNumber(editorPointer.center.x)} ${formatNumber(editorPointer.center.y)}) scale(${formatNumber(scale)}) translate(${formatNumber(-editorPointer.center.x)} ${formatNumber(-editorPointer.center.y)})`.trim());
  });
}

function startMove(event, point, targetElement, additive = false) {
  if (!targetElement) {
    if (!additive) clearEditorSelection();
    updateCurrentPanelFromPreview(false);
    return;
  }

  if (additive) {
    selectElement(targetElement, true);
  } else if (!selectedElements.has(targetElement)) {
    selectElement(targetElement);
  }

  updateCurrentPanelFromPreview(false);

  if (!selectedElements.has(targetElement)) return;
  const elements = Array.from(selectedElements).filter((element) => previewIcon.contains(element));
  if (!elements.length) return;

  editorPointer = {
    type: "move",
    elements,
    start: point,
    startTransforms: elements.map((element) => element.getAttribute("transform") || ""),
    historyBefore: getEditSnapshot(),
    moved: false
  };

  if (typeof previewIcon.setPointerCapture === "function") {
    try {
      previewIcon.setPointerCapture(event.pointerId);
    } catch (_) {}
  }
}

function updateMove(point) {
  if (!editorPointer || editorPointer.type !== "move") return;
  const dx = point.x - editorPointer.start.x;
  const dy = point.y - editorPointer.start.y;
  if (dx === 0 && dy === 0) return;
  editorPointer.moved = true;
  editorPointer.elements.forEach((element, index) => {
    const existing = editorPointer.startTransforms[index];
    element.setAttribute("transform", `${existing} translate(${formatNumber(dx)} ${formatNumber(dy)})`.trim());
  });
}

function finishEditorPointer(event) {
  if (!editorPointer) return;
  const historyBefore = editorPointer.historyBefore;
  const shouldCommitEdit = editorPointer.type !== "move" || editorPointer.moved;
  if (["rectangle", "rectangle-outline", "circle", "circle-outline"].includes(editorPointer.type)) {
    const box = getSelectionBox([editorPointer.element]);
    if (!box || box.width < 1 || box.height < 1) {
      editorPointer.element.remove();
      clearEditorSelection();
    }
  }
  editorPointer = null;
  if (typeof previewIcon.releasePointerCapture === "function") {
    try {
      previewIcon.releasePointerCapture(event.pointerId);
    } catch (_) {}
  }
  updateCurrentPanelFromPreview(shouldCommitEdit);
  if (shouldCommitEdit) {
    rememberEditFromSnapshot(historyBefore);
  }
}

function getPreviewRulerValues() {
  const divisions = Math.max(1, Math.round(512 / previewGridSize));
  return Array.from({ length: divisions }, (_, index) => (index + 1) * previewGridSize);
}

function clampPlaySpeed(value) {
  return Math.max(minPlaySpeed, Math.min(maxPlaySpeed, value));
}

function getIconsPerMinute() {
  return defaultIconsPerMinute * (playSpeed / 100);
}

function getNearestGridSize(value) {
  if (!Number.isFinite(value)) return previewGridSize;
  return gridSizeSteps.reduce((nearest, step) => {
    const nearestDistance = Math.abs(value - nearest);
    const stepDistance = Math.abs(value - step);
    return stepDistance < nearestDistance ? step : nearest;
  }, gridSizeSteps[0]);
}

function syncGridSizeKnobAngle() {
  if (gridSizeField) {
    gridSizeField.value = String(previewGridSize);
  }

  if (!gridSizeKnob) return;

  const index = gridSizeSteps.indexOf(previewGridSize);
  const safeIndex = index >= 0 ? index : gridSizeSteps.indexOf(defaultGridSize);
  const ratio = safeIndex / (gridSizeSteps.length - 1);
  const angle = -135 + ratio * 270;
  gridSizeKnob.style.setProperty("--knob-angle", `${angle}deg`);
  gridSizeKnob.title = `Grid size: ${previewGridSize} px`;
  gridSizeKnob.setAttribute("aria-label", `Grid size ${previewGridSize} pixels`);
}

function setPreviewGridSize(value) {
  const nextGridSize = getNearestGridSize(Number(value));
  if (nextGridSize === previewGridSize) {
    syncGridSizeKnobAngle();
    return;
  }

  previewGridSize = nextGridSize;
  applyPreviewGridSize();
}

function applyPreviewGridSize() {
  if (!previewStage) return;

  const divisions = Math.max(1, Math.round(512 / previewGridSize));
  previewStage.style.setProperty("--grid-divisions", String(divisions));
  localStorage.setItem(previewGridSizeStorageKey, String(previewGridSize));
  syncGridSizeKnobAngle();
  buildPreviewGridOverlay();
  buildPreviewRulers();
}

function buildPreviewGridOverlay() {
  if (!previewGridOverlay) return;

  const max = 512;
  const positions = [];
  for (let value = 0; value <= max; value += previewGridSize) {
    const aligned = value === max ? max - 0.5 : value + 0.5;
    positions.push({ value, aligned });
  }

  const lines = [];
  positions.forEach(({ value, aligned }) => {
    const edgeClass = (value === 0 || value === max) ? " grid-line-edge" : "";
    lines.push(`<line x1="${aligned}" y1="0.5" x2="${aligned}" y2="511.5" class="grid-line${edgeClass}" />`);
    lines.push(`<line x1="0.5" y1="${aligned}" x2="511.5" y2="${aligned}" class="grid-line${edgeClass}" />`);
  });

  previewGridOverlay.innerHTML = lines.join("");
}

function syncSpeedKnobAngle() {
  if (!speedKnob) return;

  const index = speedSteps.indexOf(playSpeed);
  const safeIndex = index >= 0 ? index : speedSteps.indexOf(defaultPlaySpeed);
  const ratio = safeIndex / Math.max(1, speedSteps.length - 1);
  const angle = -135 + ratio * 270;
  speedKnob.style.setProperty("--knob-angle", `${angle}deg`);
  speedKnob.title = `Speed: ${playSpeed}%`;
  speedKnob.setAttribute("aria-label", `Playback speed ${playSpeed} percent`);

  if (speedField) {
    speedField.value = String(playSpeed);
  }
}

function setPlaySpeed(value) {
  const nextSpeed = clampPlaySpeed(Math.round(value));
  if (nextSpeed === playSpeed) {
    syncSpeedKnobAngle();
    return;
  }

  playSpeed = nextSpeed;
  localStorage.setItem(playSpeedStorageKey, String(playSpeed));
  syncSpeedKnobAngle();

  if (playInterval) {
    restartPlaying(false);
  }
}

function setPlayDirection(direction) {
  playDirection = direction === -1 ? -1 : 1;
  localStorage.setItem(playDirectionStorageKey, String(playDirection));
  applyPlayDirection();
}

function applyPlayDirection() {
  if (reverseButton) {
    reverseButton.classList.toggle("button-on", playDirection === -1);
  }
}

function getNavigationList() {
  return filteredIds.length > 0 ? filteredIds : iconIds;
}

function stepPlayback() {
  const navList = getNavigationList();
  if (navList.length === 0) return;

  const currentId = iconIds[currentIconIndex];
  const currentIdx = navList.indexOf(currentId);
  const safeIndex = currentIdx >= 0 ? currentIdx : 0;
  const nextIdx = (safeIndex + playDirection + navList.length) % navList.length;
  currentIconIndex = iconIds.indexOf(navList[nextIdx]);
  updateDisplay();
}

function restartPlaying(advanceImmediately = false) {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }

  const navList = getNavigationList();
  if (navList.length === 0) {
    playButton.classList.remove("button-on");
    return;
  }

  if (advanceImmediately) {
    stepPlayback();
  }

  playInterval = setInterval(() => {
    stepPlayback();
  }, Math.max(50, Math.round(60000 / getIconsPerMinute())));

  playButton.classList.add("button-on");
}

function buildPreviewRulers() {
  if (!previewRulerTop || !previewRulerLeft || !previewRulerRight || !previewRulerBottom) {
    return;
  }

  previewRulerTop.innerHTML = "";
  previewRulerLeft.innerHTML = "";
  previewRulerRight.innerHTML = "";
  previewRulerBottom.innerHTML = "";

  const labelStep = Math.max(64, previewGridSize);
  const values = Array.from({ length: Math.round(512 / labelStep) }, (_, index) => (index + 1) * labelStep);

  values.forEach((value) => {
    const centeredValue = value - (labelStep / 2);
    const rulerPosition = `${(centeredValue / 512) * 100}%`;

    const topLabel = document.createElement("span");
    topLabel.className = "preview-ruler-label";
    topLabel.textContent = value;
    topLabel.style.setProperty("--ruler-pos", rulerPosition);
    previewRulerTop.appendChild(topLabel);

    const leftLabel = document.createElement("span");
    leftLabel.className = "preview-ruler-label";
    leftLabel.textContent = value;
    leftLabel.style.setProperty("--ruler-pos", rulerPosition);
    previewRulerLeft.appendChild(leftLabel);

    const rightLabel = document.createElement("span");
    rightLabel.className = "preview-ruler-label";
    rightLabel.textContent = value;
    rightLabel.style.setProperty("--ruler-pos", rulerPosition);
    previewRulerRight.appendChild(rightLabel);

    const bottomLabel = document.createElement("span");
    bottomLabel.className = "preview-ruler-label";
    bottomLabel.textContent = value;
    bottomLabel.style.setProperty("--ruler-pos", rulerPosition);
    previewRulerBottom.appendChild(bottomLabel);
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
  let clickTimer = null;

  knob.addEventListener("click", () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    clickTimer = setTimeout(() => {
      handlers.onWheel(1);
      clickTimer = null;
    }, 320);
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
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
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

function updateDisplay() {
  const id = iconIds[currentIconIndex];
  const symbolCode = getSymbolCodeForId(id);
  renderPreviewFromSymbolCode(symbolCode);
  if (panelMode === "all") {
    panel.value = svgText ?? "";
  } else {
    panel.value = symbolCode ?? "Symbol not found.";
  }

  // Update name field with current symbol id
  if (nameField) {
    const isEdited = editedSymbolCodes.has(id);
    nameField.value = isEdited ? "" : id;
  }

  // Color active icon
  gridIcons.forEach((icon, index) => {
    icon.classList.toggle("active", index === currentIconIndex);
  });

  panelCurrentButton?.classList.toggle("button-on", panelMode === "current");
  panelAllButton?.classList.toggle("button-on", panelMode === "all");
  setEditorTool(editorTool);
  syncEditHistoryButtons();
}

function setPanelMode(nextMode) {
  panelMode = nextMode === "all" ? "all" : "current";
  localStorage.setItem(panelModeStorageKey, panelMode);
  updateDisplay();
}

function stopPlaying() {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
    playButton.classList.remove("button-on");
  }
}

function filterIcons(searchTerm) {
  const lowerSearch = searchTerm.toLowerCase();
  filteredIds = iconIds.filter(id => id.toLowerCase().includes(lowerSearch));
  
  // Update grid visibility
  gridIcons.forEach((icon, index) => {
    const id = iconIds[index];
    icon.style.display = id.toLowerCase().includes(lowerSearch) ? "" : "none";
  });
  
  // If current icon is filtered out, move to first visible icon
  if (!filteredIds.includes(iconIds[currentIconIndex])) {
    if (filteredIds.length > 0) {
      currentIconIndex = iconIds.indexOf(filteredIds[0]);
    }
  }
  
  updateDisplay();
  iconsField.value = filteredIds.length;
}

function applyPreviewToggles() {
  const showGrid = localStorage.getItem(previewGridStorageKey) === "true";
  const showRadius = localStorage.getItem(previewRadiusStorageKey) === "true";
  const showRulers = localStorage.getItem(previewRulersStorageKey) === "true";

  if (previewStage) {
    previewStage.classList.toggle("preview-grid-on", showGrid);
    previewStage.classList.toggle("preview-rulers-on", showRulers);
  }

  if (previewWrapper) {
    previewWrapper.classList.toggle("preview-radius-on", showRadius);
  }

  if (gridButton) {
    gridButton.classList.toggle("button-on", showGrid);
  }

  if (radiusButton) {
    radiusButton.classList.toggle("button-on", showRadius);
  }

  if (rulersButton) {
    rulersButton.classList.toggle("button-on", showRulers);
  }
}

function applyTimelineSizeToggle() {
  const showSmall = localStorage.getItem(timelineSizeStorageKey) === "true";

  timelineIcons.forEach((icon) => {
    icon.classList.toggle("icons-small", showSmall);
  });

  if (sizeButton) {
    sizeButton.classList.toggle("button-on", showSmall);
  }
}

function applyTimelineGridToggle() {
  const showGrid = localStorage.getItem(timelineGridStorageKey) === "true";

  if (timelineIconGrid) {
    timelineIconGrid.classList.toggle("timeline-grid-on", showGrid);
  }

  if (timelineGridButton) {
    timelineGridButton.classList.toggle("button-on", showGrid);
  }
}

// FETCH / INITIALIZE

fetch("/icons.svg")
  .then(response => {
    // Set bytesField using Content-Length if available
    const bytes = response.headers.get("Content-Length");
    if (bytes) {
      const kb = (parseInt(bytes, 10) / 1024).toFixed(3);
      bytesField.value = kb;
    }

    return response.text();
  })
  .then(text => {
    svgText = text;
    const storedGridSize = parseInt(localStorage.getItem(previewGridSizeStorageKey) || "", 10);
    const storedSpeed = parseInt(localStorage.getItem(playSpeedStorageKey) || "", 10);
    const legacyStoredSpeed = parseInt(localStorage.getItem(legacyPlaySpeedStorageKey) || "", 10);
    const storedDirection = parseInt(localStorage.getItem(playDirectionStorageKey) || "", 10);
    const storedSearchTerm = localStorage.getItem(searchStorageKey) || "";
    const storedPanelMode = localStorage.getItem(panelModeStorageKey) || "current";
    previewGridSize = gridSizeSteps.includes(storedGridSize) ? storedGridSize : defaultGridSize;
    playSpeed = Number.isFinite(storedSpeed)
      ? clampPlaySpeed(storedSpeed)
      : Number.isFinite(legacyStoredSpeed)
        ? clampPlaySpeed(Math.round((legacyStoredSpeed / defaultIconsPerMinute) * 100))
        : defaultPlaySpeed;
    localStorage.removeItem(legacyPlaySpeedStorageKey);
    playDirection = storedDirection === -1 ? -1 : 1;
    panelMode = storedPanelMode === "all" ? "all" : "current";
    applyPreviewGridSize();
    buildPreviewRulers();

    // Collect all icon IDs into array and add click handlers
    gridIcons.forEach((icon, index) => {
      const id = icon.getAttribute("data-id");
      iconIds.push(id);

      icon.tabIndex = 0;

      icon.addEventListener("click", () => {
        stopPlaying();
        currentIconIndex = index;
        updateDisplay();
      });

      icon.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          stopPlaying();
          currentIconIndex = index;
          updateDisplay();
          e.preventDefault(); // Prevent page scroll on space
        }
      });
    });

    // Show total number of icons
    iconsField.value = iconIds.length;

    // Initialize filtered list with all icons
    filteredIds = [...iconIds];

    // Initialize with first icon
    updateDisplay();

    // Restore footer toggle states
    applyPreviewToggles();
    applyTimelineGridToggle();
    applyTimelineSizeToggle();

    initDiscreteKnob(gridSizeKnob, {
      values: gridSizeSteps,
      getValue: () => previewGridSize,
      setValue: (value) => {
        setPreviewGridSize(value);
      },
      defaultValue: defaultGridSize,
    });

    initDiscreteKnob(speedKnob, {
      values: speedSteps,
      getValue: () => playSpeed,
      setValue: (value) => {
        setPlaySpeed(value);
      },
      defaultValue: defaultPlaySpeed,
      dragPixelsPerStep: knobDragPixelsSensitive,
    });

    localStorage.setItem(playSpeedStorageKey, String(playSpeed));
    localStorage.setItem(playDirectionStorageKey, String(playDirection));
    syncSpeedKnobAngle();
    applyPlayDirection();

    if (searchField && storedSearchTerm) {
      searchField.value = storedSearchTerm;
      filterIcons(storedSearchTerm);
    }
  });

// EVENT LISTENERS

prevButton.addEventListener("click", () => {
  stopPlaying();
  const navList = getNavigationList();
  const currentId = iconIds[currentIconIndex];
  const currentIdx = navList.indexOf(currentId);
  const safeIndex = currentIdx >= 0 ? currentIdx : 0;
  const nextIdx = (safeIndex - 1 + navList.length) % navList.length;
  currentIconIndex = iconIds.indexOf(navList[nextIdx]);
  updateDisplay();
});

nextButton.addEventListener("click", () => {
  stopPlaying();
  const navList = getNavigationList();
  const currentId = iconIds[currentIconIndex];
  const currentIdx = navList.indexOf(currentId);
  const safeIndex = currentIdx >= 0 ? currentIdx : 0;
  const nextIdx = (safeIndex + 1) % navList.length;
  currentIconIndex = iconIds.indexOf(navList[nextIdx]);
  updateDisplay();
});

resetButton.addEventListener("click", () => {
  const beforeSnapshot = editedSymbolCodes.size ? getEditSnapshot() : null;
  stopPlaying();
  currentIconIndex = 0;
  editedSymbolCodes.clear();
  clearEditorSelection();
  renderAllTimelineIcons();
  setPlaySpeed(defaultPlaySpeed);
  setPlayDirection(1);
  syncSpeedKnobAngle();
  if (searchField) {
    searchField.value = "";
    localStorage.removeItem(searchStorageKey);
    filterIcons("");
  }
  updateDisplay();
  rememberEditFromSnapshot(beforeSnapshot);
});

playButton.addEventListener("click", () => {
  if (playInterval) {
    stopPlaying();
  } else {
    restartPlaying(true);
  }
});

if (reverseButton) {
  reverseButton.addEventListener("click", () => {
    setPlayDirection(playDirection * -1);
  });
}

if (gridSizeField) {
  const commitGridSizeFieldValue = () => {
    const nextValue = parseInt(gridSizeField.value, 10);
    if (Number.isNaN(nextValue)) {
      syncGridSizeKnobAngle();
      return;
    }

    setPreviewGridSize(nextValue);
  };

  gridSizeField.addEventListener("change", commitGridSizeFieldValue);
  gridSizeField.addEventListener("blur", commitGridSizeFieldValue);
  gridSizeField.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    commitGridSizeFieldValue();
  });
}

if (speedField) {
  const commitSpeedFieldValue = () => {
    const nextValue = parseInt(speedField.value, 10);
    if (Number.isNaN(nextValue)) {
      syncSpeedKnobAngle();
      return;
    }

    setPlaySpeed(nextValue);
  };

  speedField.addEventListener("change", commitSpeedFieldValue);
  speedField.addEventListener("blur", commitSpeedFieldValue);
  speedField.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    commitSpeedFieldValue();
  });
}

if (saveButton) {
  saveButton.addEventListener("click", () => {
    const id = getCurrentIconId();
    if (!id || !svgText) return;

    const standaloneSvg = buildStandaloneSvg(id);
    if (!standaloneSvg) return;

    const blob = new Blob([standaloneSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = getIconDownloadFilename("svg");
    link.download = typeof window.ensurePekosoftFilename === 'function'
      ? window.ensurePekosoftFilename(filename)
      : `pekosoft_${filename}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

if (openButton && openFileInput) {
  openButton.addEventListener("click", () => {
    openFileInput.click();
  });

  openFileInput.addEventListener("change", (event) => {
    const target = event.target;
    const file = target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileText = typeof reader.result === "string" ? reader.result : "";
      const normalized = normalizeSvgToSymbolCode(fileText);
      if (!normalized) {
        openFileInput.value = "";
        return;
      }

      const parsed = parseSymbolCode(normalized);
      if (!parsed) {
        openFileInput.value = "";
        return;
      }

      const beforeSnapshot = getEditSnapshot();
      const nextIndex = iconIds.indexOf(parsed.id);
      if (nextIndex >= 0) {
        currentIconIndex = nextIndex;
      }

      editedSymbolCodes.set(parsed.id, normalized);
      renderPreviewFromSymbolCode(normalized);
      flattenElementsToPath();
      if (fitPreviewContentToCanvas()) {
        flattenElementsToPath();
      }
      renderTimelineIcon(parsed.id);
      stopPlaying();
      setPanelMode("current");
      updateDisplay();
      rememberEditFromSnapshot(beforeSnapshot);
      openFileInput.value = "";
    };

    reader.onerror = () => {
      openFileInput.value = "";
    };

    reader.readAsText(file);
  });
}

if (savePngButton) {
  savePngButton.addEventListener("click", () => {
    const id = getCurrentIconId();
    if (!id || !svgText) return;

    const standaloneSvg = buildStandaloneSvg(id);
    if (!standaloneSvg) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(standaloneSvg, "image/svg+xml");
    const svgNode = doc.querySelector("svg");
    const viewBox = svgNode?.getAttribute("viewBox") || "0 0 512 512";
    const parts = viewBox.split(/\s+/).map(Number);
    const width = Math.max(1, Math.round(parts[2] || 512));
    const height = Math.max(1, Math.round(parts[3] || 512));

    const blob = new Blob([standaloneSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      const filename = getIconDownloadFilename("png");
      link.download = typeof window.ensurePekosoftFilename === 'function'
        ? window.ensurePekosoftFilename(filename)
        : `pekosoft_${filename}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
    };

    image.src = url;
  });
}

copyButton.addEventListener("click", () => {
  navigator.clipboard.writeText(panel.value);
});

searchField.addEventListener("input", (e) => {
  const nextSearchTerm = e.target.value;
  localStorage.setItem(searchStorageKey, nextSearchTerm);
  filterIcons(nextSearchTerm);
});

panel.addEventListener("input", (e) => {
  const beforeSnapshot = getEditSnapshot();
  const panelText = e.target.value;
  const parsed = parseSymbolCode(panelText);
  if (panelMode === "current" && nameField) {
    nameField.value = "";
  }
  if (panelMode === "current" && parsed) {
    editedSymbolCodes.set(parsed.id, panelText);
    renderTimelineIcon(parsed.id);
  }
  renderPreviewFromSymbolCode(panelText);

  if (parsed && nameField) {
    nameField.value = "";
  }
  rememberEditFromSnapshot(beforeSnapshot);
});

undoButton?.addEventListener("click", () => {
  undoEdit();
});

redoButton?.addEventListener("click", () => {
  redoEdit();
});

selectButton?.addEventListener("click", () => setEditorTool("select"));
resizeButton?.addEventListener("click", () => setEditorTool("resize"));
drawButton?.addEventListener("click", () => setEditorTool("draw"));
rectangleButton?.addEventListener("click", () => setEditorTool("rectangle"));
rectangleOutlineButton?.addEventListener("click", () => setEditorTool("rectangle-outline"));
circleButton?.addEventListener("click", () => setEditorTool("circle"));
circleOutlineButton?.addEventListener("click", () => setEditorTool("circle-outline"));

rotateButton?.addEventListener("click", () => {
  rotateSelectionLeft();
});

centerButton?.addEventListener("click", () => {
  centerSelection();
});

selectAllButton?.addEventListener("click", () => {
  selectAllElements();
  updateCurrentPanelFromPreview(false);
});

selectNoneButton?.addEventListener("click", () => {
  clearEditorSelection();
  updateCurrentPanelFromPreview(false);
});

deleteButton?.addEventListener("click", () => {
  deleteSelection();
});

flattenButton?.addEventListener("click", () => {
  flattenElementsToPath();
});

editCopyButton?.addEventListener("click", () => {
  copySelection();
});

editCutButton?.addEventListener("click", () => {
  cutSelection();
});

editPasteButton?.addEventListener("click", () => {
  pasteSelection();
});

if (previewIcon) {
  previewIcon.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType !== "touch" && event.pointerType !== "pen") return;
    event.preventDefault();
    stopPlaying();
    const point = getPreviewPoint(event);
    const targetElement = getEditorShapeFromTarget(event.target);
    if (editorTool === "select") {
      startMove(event, point, targetElement, event.shiftKey || event.ctrlKey || event.metaKey);
      return;
    }
    if (editorTool === "resize") {
      startResize(event, point, targetElement);
      return;
    }
    startDrawing(event, point);
  });

  previewIcon.addEventListener("pointermove", (event) => {
    if (!editorPointer) return;
    event.preventDefault();
    const point = getPreviewPoint(event);
    if (editorPointer.type === "resize") {
      updateResize(point);
    } else if (editorPointer.type === "move") {
      updateMove(point);
    } else {
      updateDrawing(point);
    }
  });

  previewIcon.addEventListener("pointerup", finishEditorPointer);
  previewIcon.addEventListener("pointercancel", finishEditorPointer);
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const target = event.target;
  const isTextInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
  if (isTextInput) return;

  if ((event.ctrlKey || event.metaKey) && key === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      redoEdit();
    } else {
      undoEdit();
    }
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    if (key === "c") {
      if (copySelection()) event.preventDefault();
      return;
    }
    if (key === "x") {
      if (cutSelection()) event.preventDefault();
      return;
    }
    if (key === "v") {
      if (pasteSelection()) event.preventDefault();
      return;
    }
  }

  if (event.key !== "Delete" && event.key !== "Backspace") return;
  if (!selectedElements.size) return;
  event.preventDefault();
  deleteSelection();
});

if (gridButton) {
  gridButton.addEventListener("click", () => {
    const nextState = !(localStorage.getItem(previewGridStorageKey) === "true");
    localStorage.setItem(previewGridStorageKey, nextState ? "true" : "false");
    applyPreviewToggles();
  });
}

if (radiusButton) {
  radiusButton.addEventListener("click", () => {
    const nextState = !(localStorage.getItem(previewRadiusStorageKey) === "true");
    localStorage.setItem(previewRadiusStorageKey, nextState ? "true" : "false");
    applyPreviewToggles();
  });
}

if (rulersButton) {
  rulersButton.addEventListener("click", () => {
    const nextState = !(localStorage.getItem(previewRulersStorageKey) === "true");
    localStorage.setItem(previewRulersStorageKey, nextState ? "true" : "false");
    applyPreviewToggles();
  });
}

if (sizeButton) {
  sizeButton.addEventListener("click", () => {
    const nextState = !(localStorage.getItem(timelineSizeStorageKey) === "true");
    localStorage.setItem(timelineSizeStorageKey, nextState ? "true" : "false");
    applyTimelineSizeToggle();
  });
}

if (timelineGridButton) {
  timelineGridButton.addEventListener("click", () => {
    const nextState = !(localStorage.getItem(timelineGridStorageKey) === "true");
    localStorage.setItem(timelineGridStorageKey, nextState ? "true" : "false");
    applyTimelineGridToggle();
  });
}

panelCurrentButton?.addEventListener("click", () => {
  setPanelMode("current");
});

panelAllButton?.addEventListener("click", () => {
  setPanelMode("all");
});

// END OF FILE
