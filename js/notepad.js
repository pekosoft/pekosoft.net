// Pekosoft Notepad
// pekosoft.net/js/notepad.js

function clearTextarea() {
  var textarea = document.getElementById("Textarea");
  textarea.value = "";
  localStorage.removeItem('notepad.text');
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function copyToClipboard() {
  var textarea = document.getElementById("Textarea");
  textarea.select();
  document.execCommand("copy");
}

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
  const pasteButton = document.getElementById('notepad-paste-button');
  const textarea = document.getElementById('Textarea');
  const STORAGE_KEY = 'notepad.text';
  let currentUtterance = null;
  let isSpeaking = false;

  function updateTextActionButtonStates() {
    const isEmpty = !textarea.value;
    [
      { button: downloadButton, isDisabled: isEmpty },
      { button: clearButton, isDisabled: isEmpty },
      { button: copyButton, isDisabled: isEmpty },
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

    textarea.addEventListener('input', function () {
      localStorage.setItem(STORAGE_KEY, textarea.value);
      updateTextActionButtonStates();
    });
  }

  async function pasteFromClipboard() {
    if (!textarea || !navigator.clipboard || typeof navigator.clipboard.readText !== 'function') return;

    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
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
    clearButton.addEventListener('click', clearTextarea);
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

  if (pasteButton) {
    pasteButton.addEventListener('click', pasteFromClipboard);
  }

  window.addEventListener('beforeunload', function () {
    stopSpeech();
  });
});

// END OF FILE
