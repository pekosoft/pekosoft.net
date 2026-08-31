// Pekosoft Notepad
// pekosoft.net/js/notepad.js

function downloadText() {
  var textarea = document.getElementById("Textarea");
  var text = textarea.value;
  if (!text) return;

  var now = new Date();
  var day = String(now.getDate()).padStart(2, "0");
  var month = String(now.getMonth() + 1).padStart(2, "0");
  var year = String(now.getFullYear());
  var hours = String(now.getHours()).padStart(2, "0");
  var minutes = String(now.getMinutes()).padStart(2, "0");
  var seconds = String(now.getSeconds()).padStart(2, "0");
  var filename = `pekosoft_notepad_${day}-${month}-${year}_${hours}-${minutes}-${seconds}.txt`;
  var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");

  link.href = url;
  link.download = typeof window.ensurePekosoftFilename === "function"
    ? window.ensurePekosoftFilename(filename)
    : filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', function () {
  const clearButton = document.getElementById('notepad-clear-button');
  const speechButton = document.getElementById('notepad-speech-button');
  const downloadButton = document.getElementById('notepad-download-button');
  const copyButton = document.getElementById('notepad-copy-button');
  const cutButton = document.getElementById('notepad-cut-button');
  const pasteButton = document.getElementById('notepad-paste-button');
  const undoButton = document.getElementById('notepad-undo-button');
  const redoButton = document.getElementById('notepad-redo-button');
  const selectAllButton = document.getElementById('notepad-select-all-button');
  const selectNoneButton = document.getElementById('notepad-select-none-button');
  const textarea = document.getElementById('Textarea');
  const STORAGE_KEY = 'notepad.text';
  const MAX_HISTORY_ENTRIES = 100;
  let currentUtterance = null;
  let isSpeaking = false;
  let beforeInputSnapshot = null;
  let isRestoringHistory = false;
  const undoStack = [];
  const redoStack = [];

  function getTextSnapshot() {
    return {
      value: textarea.value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd
    };
  }

  function snapshotsMatch(first, second) {
    return first.value === second.value
      && first.selectionStart === second.selectionStart
      && first.selectionEnd === second.selectionEnd;
  }

  function updateButtonState(button, isDisabled) {
    if (!button) return;
    button.disabled = isDisabled;
    button.classList.toggle('grey', isDisabled);
    button.setAttribute('aria-disabled', String(isDisabled));
  }

  function updateHistoryButtonStates() {
    updateButtonState(undoButton, undoStack.length === 0);
    updateButtonState(redoButton, redoStack.length === 0);
  }

  function updateSelectionButtonStates() {
    const hasText = textarea.value.length > 0;
    const hasSelection = textarea.selectionStart !== textarea.selectionEnd;
    updateButtonState(selectAllButton, !hasText);
    updateButtonState(selectNoneButton, !hasSelection);
  }

  function persistTextAndUpdateButtons() {
    localStorage.setItem(STORAGE_KEY, textarea.value);
    updateTextActionButtonStates();
    updateSelectionButtonStates();
    updateHistoryButtonStates();
  }

  function rememberTextChange(beforeSnapshot) {
    const afterSnapshot = getTextSnapshot();
    if (!beforeSnapshot || snapshotsMatch(beforeSnapshot, afterSnapshot)) {
      persistTextAndUpdateButtons();
      return;
    }
    undoStack.push(beforeSnapshot);
    if (undoStack.length > MAX_HISTORY_ENTRIES) undoStack.shift();
    redoStack.length = 0;
    persistTextAndUpdateButtons();
  }

  function restoreTextSnapshot(snapshot) {
    isRestoringHistory = true;
    textarea.value = snapshot.value;
    textarea.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
    textarea.focus();
    isRestoringHistory = false;
    persistTextAndUpdateButtons();
  }

  function undoTextChange() {
    if (!undoStack.length) return;
    redoStack.push(getTextSnapshot());
    restoreTextSnapshot(undoStack.pop());
  }

  function redoTextChange() {
    if (!redoStack.length) return;
    undoStack.push(getTextSnapshot());
    restoreTextSnapshot(redoStack.pop());
  }

  function getSelectedOrAllText() {
    const { selectionStart, selectionEnd, value } = textarea;
    return selectionStart === selectionEnd ? value : value.slice(selectionStart, selectionEnd);
  }

  function replaceSelectedOrAllText(text) {
    const beforeSnapshot = getTextSnapshot();
    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart === selectionEnd) {
      textarea.value = text;
    } else {
      textarea.setRangeText(text, selectionStart, selectionEnd, 'end');
    }
    textarea.focus();
    rememberTextChange(beforeSnapshot);
  }

  function replaceAllText(text) {
    const beforeSnapshot = getTextSnapshot();
    textarea.value = text;
    textarea.setSelectionRange(text.length, text.length);
    textarea.focus();
    rememberTextChange(beforeSnapshot);
  }

  async function copyToClipboard() {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(getSelectedOrAllText());
    } catch {
      // Clipboard permission is controlled by the browser.
    }
  }

  async function cutToClipboard() {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(getSelectedOrAllText());
      replaceSelectedOrAllText('');
    } catch {
      // Clipboard permission is controlled by the browser.
    }
  }

  function updateTextActionButtonStates() {
    const isEmpty = !textarea.value;
    [
      { button: downloadButton, isDisabled: isEmpty },
      { button: clearButton, isDisabled: isEmpty },
      { button: copyButton, isDisabled: isEmpty },
      { button: cutButton, isDisabled: isEmpty },
      { button: speechButton, isDisabled: isEmpty && !isSpeaking }
    ].forEach(({ button, isDisabled }) => {
      if (!button) return;
      button.disabled = isDisabled;
      button.classList.toggle('grey', isDisabled);
      button.setAttribute('aria-disabled', String(isDisabled));
    });
  }

  if (textarea) {
    const savedText = localStorage.getItem(STORAGE_KEY);
    if (savedText !== null) {
      textarea.value = savedText;
    }
    updateTextActionButtonStates();
    updateSelectionButtonStates();
    updateHistoryButtonStates();

    textarea.addEventListener('beforeinput', function () {
      if (!isRestoringHistory) beforeInputSnapshot = getTextSnapshot();
    });

    textarea.addEventListener('input', function () {
      if (!isRestoringHistory) rememberTextChange(beforeInputSnapshot);
      beforeInputSnapshot = null;
    });

    textarea.addEventListener('select', updateSelectionButtonStates);
    textarea.addEventListener('keyup', updateSelectionButtonStates);
    textarea.addEventListener('click', updateSelectionButtonStates);
  }

  async function pasteFromClipboard() {
    if (!textarea || !navigator.clipboard || typeof navigator.clipboard.readText !== 'function') return;

    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      replaceSelectedOrAllText(text);
    } catch {
      // Clipboard permission is controlled by the browser.
    }
  }

  function setSpeechState(active) {
    isSpeaking = active;
    if (!speechButton) return;
    speechButton.classList.toggle('button-on', active);
    speechButton.setAttribute('aria-pressed', active ? 'true' : 'false');
    speechButton.title = active ? 'Stop speaking' : 'Speak text';
    updateTextActionButtonStates();
  }

  function stopSpeech() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    currentUtterance = null;
    setSpeechState(false);
  }

  function startSpeech() {
    if (!window.speechSynthesis || !textarea) return;

    const textInput = textarea.value.trim();
    if (!textInput) {
      setSpeechState(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textInput);
    currentUtterance = utterance;

    utterance.onend = function () {
      if (currentUtterance !== utterance) return;
      currentUtterance = null;
      setSpeechState(false);
    };

    utterance.onerror = function () {
      if (currentUtterance !== utterance) return;
      currentUtterance = null;
      setSpeechState(false);
    };

    window.speechSynthesis.speak(utterance);
    setSpeechState(true);
  }

  if (clearButton) {
    clearButton.addEventListener('click', function () {
      replaceAllText('');
    });
  }

  if (speechButton) {
    speechButton.setAttribute('aria-pressed', 'false');
    speechButton.addEventListener('click', function () {
      if (isSpeaking) {
        stopSpeech();
      } else {
        startSpeech();
      }
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener('click', downloadText);
  }

  if (copyButton) {
    copyButton.addEventListener('click', copyToClipboard);
  }

  if (cutButton) {
    cutButton.addEventListener('click', cutToClipboard);
  }

  if (pasteButton) {
    pasteButton.addEventListener('click', pasteFromClipboard);
  }

  if (undoButton) {
    undoButton.addEventListener('click', undoTextChange);
  }

  if (redoButton) {
    redoButton.addEventListener('click', redoTextChange);
  }

  if (selectAllButton) {
    selectAllButton.addEventListener('click', function () {
      textarea.focus();
      textarea.select();
      updateSelectionButtonStates();
    });
  }

  if (selectNoneButton) {
    selectNoneButton.addEventListener('click', function () {
      textarea.focus();
      textarea.setSelectionRange(textarea.selectionEnd, textarea.selectionEnd);
      updateSelectionButtonStates();
    });
  }

  window.addEventListener('beforeunload', function () {
    stopSpeech();
  });
});

// END OF FILE
