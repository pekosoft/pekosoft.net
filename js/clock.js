// Pekosoft Clock
// pekosoft.net/js/clock.js

const clockHour = document.getElementById("clock-hour");
const clockMinute = document.getElementById("clock-minute");
const clockSecond = document.getElementById("clock-second");
const calendarGrid = document.getElementById("calendar-grid");
const calendarMonthName = document.getElementById("calendar-month-name");
const resetButton = document.getElementById("reset-button");
const clockSoundButton = document.getElementById("clock-sound-button");
const clockHapticButton = document.getElementById("clock-haptic-button");
const clockModeView = document.getElementById("clock-mode-view");
const calendarModeView = document.getElementById("calendar-mode-view");
const timerModeView = document.getElementById("timer-mode-view");
const countdownModeView = document.getElementById("countdown-mode-view");
const countdownAlarmButton = document.getElementById("countdown-alarm-button");
const countdownMsButton = document.getElementById("countdown-ms-button");
const timerDisplay = document.getElementById("timer-display");
const countdownDisplay = document.getElementById("countdown-display");
const countdownHours = document.getElementById("countdown-hours");
const countdownMinutes = document.getElementById("countdown-minutes");
const countdownSeconds = document.getElementById("countdown-seconds");
const countdownKnobs = [
  { knob: document.getElementById("countdown-hours-knob"), field: countdownHours, max: 99, defaultValue: 0 },
  { knob: document.getElementById("countdown-minutes-knob"), field: countdownMinutes, max: 59, defaultValue: 1 },
  { knob: document.getElementById("countdown-seconds-knob"), field: countdownSeconds, max: 59, defaultValue: 0 }
];
const clockModeButton = document.getElementById("clock-mode-button");
const calendarModeButton = document.getElementById("calendar-mode-button");
const timerModeButton = document.getElementById("timer-mode-button");
const countdownModeButton = document.getElementById("countdown-mode-button");
const timeStartButton = document.getElementById("time-start-button");
const timeStartText = document.getElementById("time-start-text");
const modes = {
  clock: { button: clockModeButton, view: clockModeView },
  calendar: { button: calendarModeButton, view: calendarModeView },
  timer: { button: timerModeButton, view: timerModeView },
  countdown: { button: countdownModeButton, view: countdownModeView }
};
const countdownFields = [countdownHours, countdownMinutes, countdownSeconds];
let renderedCalendarMonth = "";
let lastTickSecond = null;
let tickAudioContext = null;
const feedbackModes = ["clock", "timer", "countdown"];
const feedbackSettings = Object.fromEntries(feedbackModes.map((mode) => [mode, {
  sound: (localStorage.getItem(`clock.${mode}_sound`) ?? localStorage.getItem("clock.sound_on")) === "true",
  haptic: (localStorage.getItem(`clock.${mode}_haptic`) ?? localStorage.getItem("clock.haptic")) === "true"
}]));
let activeMode = ["clock", "calendar", "timer", "countdown"].includes(localStorage.getItem("clock.mode"))
  ? localStorage.getItem("clock.mode")
  : "clock";
let timerElapsedMs = 0;
let timerStartedAt = 0;
let timerRunning = false;
let countdownRemainingMs = readCountdownDuration();
let countdownStartedAt = 0;
let countdownRunning = false;
let isCountdownAlarmOn = localStorage.getItem("clock.countdown_alarm") === "true";
let showCountdownMs = localStorage.getItem("clock.countdown_ms") !== "false";
let countdownAlarmInterval = null;
let animationFrame = null;

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function formatLocalTime(date) {
  return `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`;
}

function formatLocalDate(date) {
  return `${padDatePart(date.getDate())}-${padDatePart(date.getMonth() + 1)}-${date.getFullYear()}`;
}

function formatHeroDate(date) {
  const weekday = date.toLocaleString("en-US", { weekday: "long" });
  return `${weekday} ${formatLocalDate(date)}`;
}

function formatMonthName(date) {
  return date.toLocaleString("en-US", { month: "long" });
}

function formatDuration(milliseconds, showMilliseconds = true) {
  const duration = Math.max(0, showMilliseconds ? Math.floor(milliseconds) : Math.ceil(milliseconds / 1000) * 1000);
  const hours = Math.floor(duration / 3600000);
  const minutes = Math.floor((duration % 3600000) / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  const millis = duration % 1000;
  const time = `${padDatePart(hours)}:${padDatePart(minutes)}:${padDatePart(seconds)}`;
  return showMilliseconds ? `${time}.${String(millis).padStart(3, "0")}` : time;
}

function clampNumberField(field, min, max) {
  const value = Number.parseInt(field?.value, 10);
  const normalized = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  if (field) field.value = String(normalized);
  return normalized;
}

function readStoredDurationPart(key, fallback, min, max) {
  const stored = Number.parseInt(localStorage.getItem(key), 10);
  return Number.isFinite(stored) ? Math.min(max, Math.max(min, stored)) : fallback;
}

function readCountdownDuration() {
  const hours = readStoredDurationPart("clock.countdown_hours", 0, 0, 99);
  const minutes = readStoredDurationPart("clock.countdown_minutes", 1, 0, 59);
  const seconds = readStoredDurationPart("clock.countdown_seconds", 0, 0, 59);
  return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
}

function loadCountdownFields() {
  if (countdownHours) countdownHours.value = String(readStoredDurationPart("clock.countdown_hours", 0, 0, 99));
  if (countdownMinutes) countdownMinutes.value = String(readStoredDurationPart("clock.countdown_minutes", 1, 0, 59));
  if (countdownSeconds) countdownSeconds.value = String(readStoredDurationPart("clock.countdown_seconds", 0, 0, 59));
}

function getIsoWeek(date) {
  const weekDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = weekDate.getUTCDay() || 7;
  weekDate.setUTCDate(weekDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(weekDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((weekDate - yearStart) / 86400000) + 1) / 7);
}

const ISO_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function renderCalendarMonth(date) {
  if (!calendarGrid) return;

  const year = date.getFullYear();
  const month = date.getMonth();
  const monthKey = `${year}-${month}`;

  if (calendarMonthName) calendarMonthName.textContent = formatMonthName(date);

  if (renderedCalendarMonth !== monthKey) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // ISO 8601 weeks start on Monday, so shift Sunday (0) to the end of the week.
    const firstWeekdayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalCells = firstWeekdayIndex + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    calendarGrid.textContent = "";

    const cornerCell = document.createElement("div");
    cornerCell.className = "calendar-corner";
    calendarGrid.appendChild(cornerCell);

    const headerSpacer = document.createElement("div");
    headerSpacer.className = "calendar-spacer";
    calendarGrid.appendChild(headerSpacer);

    ISO_WEEKDAY_LABELS.forEach((label) => {
      const headerCell = document.createElement("div");
      headerCell.className = "calendar-weekday-label";
      headerCell.textContent = label;
      calendarGrid.appendChild(headerCell);
    });

    for (let row = 0; row < rows; row++) {
      const rowFirstDay = (row * 7) - firstWeekdayIndex + 1;
      // Date() normalizes out-of-range days, so this still resolves to the
      // correct ISO week even when the row spans into an adjacent month.
      const weekCell = document.createElement("div");
      weekCell.className = "calendar-week";
      weekCell.textContent = padDatePart(getIsoWeek(new Date(year, month, rowFirstDay)));
      calendarGrid.appendChild(weekCell);

      const spacerCell = document.createElement("div");
      spacerCell.className = "calendar-spacer";
      calendarGrid.appendChild(spacerCell);

      for (let column = 0; column < 7; column++) {
        const day = rowFirstDay + column;
        const cell = document.createElement("div");
        const inMonth = day >= 1 && day <= daysInMonth;
        cell.className = inMonth ? "calendar-day" : "calendar-day calendar-empty";

        if (inMonth) {
          const dayNumber = document.createElement("div");
          dayNumber.className = "calendar-daynum";
          dayNumber.textContent = padDatePart(day);
          cell.dataset.day = day;
          cell.appendChild(dayNumber);
        }

        calendarGrid.appendChild(cell);
      }
    }

    renderedCalendarMonth = monthKey;
  }

  calendarGrid.querySelectorAll(".calendar-today").forEach((cell) => {
    cell.classList.remove("calendar-today");
  });

  const todayCell = calendarGrid.querySelector(`.calendar-day[data-day="${date.getDate()}"]`);
  if (todayCell) todayCell.classList.add("calendar-today");
}

function ensureTickAudioContext() {
  if (!tickAudioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    tickAudioContext = new AudioContextClass();
  }

  if (tickAudioContext.state === "suspended") {
    tickAudioContext.resume().catch(() => {
      // Resume is best-effort; the next second can retry.
    });
  }

  return tickAudioContext;
}

function playSecondTick() {
  if (!feedbackSettings[activeMode]?.sound || localStorage.getItem("global.sound") === "false") return;

  const audioContext = ensureTickAudioContext();
  if (!audioContext || typeof window.playTransientSound !== "function") return;

  window.playTransientSound({
    audioContext,
    tone: "click",
    gain: 0.35,
    durationSec: 0.05
  });
}

function triggerSecondFeedback(date) {
  const secondKey = Math.floor(date.getTime() / 1000);
  if (lastTickSecond === null) {
    lastTickSecond = secondKey;
    return;
  }
  if (lastTickSecond === secondKey) return;

  lastTickSecond = secondKey;
  if (activeMode === "calendar" || (activeMode === "timer" && !timerRunning)
      || (activeMode === "countdown" && !countdownRunning)) return;
  playSecondTick();
  if (feedbackSettings[activeMode].haptic && "vibrate" in navigator) navigator.vibrate(10);
}

function syncFeedbackButtonState() {
  const settings = feedbackSettings[activeMode];
  if (clockSoundButton) clockSoundButton.disabled = !settings;
  if (clockHapticButton) clockHapticButton.disabled = !settings;
  clockSoundButton?.classList.toggle("button-on", !!settings?.sound);
  clockHapticButton?.classList.toggle("button-on", !!settings?.haptic);
  clockSoundButton?.setAttribute("aria-pressed", String(!!settings?.sound));
  clockHapticButton?.setAttribute("aria-pressed", String(!!settings?.haptic));
}

function saveFeedback(kind) {
  feedbackModes.forEach((mode) => {
    localStorage.setItem(`clock.${mode}_${kind}`, String(feedbackSettings[mode][kind]));
  });
}

function setAllFeedback(kind, enabled) {
  feedbackModes.forEach((mode) => {
    feedbackSettings[mode][kind] = enabled;
  });
  saveFeedback(kind);
  if (kind === "sound" && enabled) ensureTickAudioContext();
  syncFeedbackButtonState();
}

function restoreFeedback(kind, enabled) {
  if (feedbackModes.some((mode) => localStorage.getItem(`clock.${mode}_${kind}`) !== null)) return;
  feedbackModes.forEach((mode) => { feedbackSettings[mode][kind] = enabled; });
  syncFeedbackButtonState();
}

window.clockFeedback = {
  anyEnabled: (kind) => feedbackModes.some((mode) => feedbackSettings[mode][kind]),
  setAll: setAllFeedback,
  restore: restoreFeedback
};

function getRunningState() {
  return activeMode === "timer" ? timerRunning : activeMode === "countdown" && countdownRunning;
}

function getConfiguredCountdownDuration() {
  const hours = Number.parseInt(countdownHours?.value, 10);
  const minutes = Number.parseInt(countdownMinutes?.value, 10);
  const seconds = Number.parseInt(countdownSeconds?.value, 10);
  return (((Number.isFinite(hours) ? hours : 0) * 3600)
    + ((Number.isFinite(minutes) ? minutes : 0) * 60)
    + (Number.isFinite(seconds) ? seconds : 0)) * 1000;
}

function syncStartButton() {
  if (!timeStartButton) return;
  const hasActiveTimer = activeMode === "timer" || activeMode === "countdown";
  const running = getRunningState();
  timeStartButton.disabled = !hasActiveTimer
    || (activeMode === "countdown" && !running && getConfiguredCountdownDuration() <= 0);
  timeStartButton.classList.toggle("button-on", running);
  timeStartButton.setAttribute("aria-pressed", running ? "true" : "false");
  timeStartText.textContent = running ? "Pause" : "Start";
  const modeName = activeMode === "countdown" ? "countdown" : "timer";
  timeStartButton.title = `${running ? "Pause" : "Start"} ${modeName}`;
  timeStartButton.dataset.helpEntry = activeMode === "countdown" ? "Countdown" : "Timer";
  syncCountdownKnobs();
}

function syncCountdownKnobs() {
  countdownKnobs.forEach(({ knob, field, max }) => {
    if (!knob || !field) return;
    const value = Number(field.value);
    knob.disabled = countdownRunning;
    knob.style.setProperty("--knob-angle", `${-135 + (value / max) * 270}deg`);
    knob.setAttribute("aria-valuenow", String(value));
  });
}

function initCountdownKnobs() {
  countdownKnobs.forEach(({ knob, field, max, defaultValue }) => {
    if (!knob || !field) return;
    const setValue = (value) => {
      if (countdownRunning) return;
      field.value = String(Math.min(max, Math.max(0, Math.round(value))));
      setCountdownDuration();
    };
    knob.setAttribute("role", "slider");
    knob.setAttribute("aria-orientation", "vertical");
    knob.setAttribute("aria-valuemin", "0");
    knob.setAttribute("aria-valuemax", String(max));
    bindKnobControl(knob, {
      get: () => Number(field.value),
      nudge: (direction) => setValue(Number(field.value) + direction),
      drag: (start, delta) => setValue(start + delta * max / 270),
      home: () => setValue(0),
      end: () => setValue(max),
      reset: () => setValue(defaultValue)
    });
  });
  syncCountdownKnobs();
}

function syncMode() {
  Object.entries(modes).forEach(([mode, config]) => {
    const active = mode === activeMode;
    config.button?.classList.toggle("button-on", active);
    config.button?.setAttribute("aria-pressed", active ? "true" : "false");
    if (config.view) config.view.hidden = !active;
  });
  if (countdownAlarmButton) countdownAlarmButton.hidden = activeMode !== "countdown";
  if (countdownMsButton) countdownMsButton.hidden = activeMode !== "countdown";
  syncFeedbackButtonState();
  syncStartButton();
}

function syncCountdownOptions() {
  countdownAlarmButton?.classList.toggle("button-on", isCountdownAlarmOn);
  countdownAlarmButton?.setAttribute("aria-pressed", String(isCountdownAlarmOn));
  countdownMsButton?.classList.toggle("button-on", showCountdownMs);
  countdownMsButton?.setAttribute("aria-pressed", String(showCountdownMs));
}

function stopCountdownAlarm() {
  if (countdownAlarmInterval !== null) clearInterval(countdownAlarmInterval);
  countdownAlarmInterval = null;
  countdownModeView?.classList.remove("countdown-alarm");
}

function updateTimeDisplays() {
  const now = Date.now();
  if (timerRunning) timerDisplay.textContent = formatDuration(timerElapsedMs + now - timerStartedAt);
  else timerDisplay.textContent = formatDuration(timerElapsedMs);

  const remaining = countdownRunning
    ? Math.max(0, countdownRemainingMs - (now - countdownStartedAt))
    : countdownRemainingMs;
  countdownDisplay.textContent = formatDuration(remaining, showCountdownMs);
  countdownDisplay.classList.toggle("countdown-complete", countdownRemainingMs === 0 && !countdownRunning);
  if (countdownRunning && remaining <= 0) finishCountdown();
}

function animateTimers() {
  updateTimeDisplays();
  if (timerRunning || countdownRunning) {
    animationFrame = requestAnimationFrame(animateTimers);
  } else {
    animationFrame = null;
  }
}

function ensureAnimation() {
  if (animationFrame === null) animationFrame = requestAnimationFrame(animateTimers);
}

function startTimer() {
  timerStartedAt = Date.now();
  timerRunning = true;
  syncStartButton();
  ensureAnimation();
}

function pauseTimer() {
  timerElapsedMs += Date.now() - timerStartedAt;
  timerRunning = false;
  updateTimeDisplays();
  syncStartButton();
}

function setCountdownDuration() {
  stopCountdownAlarm();
  const hours = clampNumberField(countdownHours, 0, 99);
  const minutes = clampNumberField(countdownMinutes, 0, 59);
  const seconds = clampNumberField(countdownSeconds, 0, 59);
  countdownRunning = false;
  countdownRemainingMs = ((hours * 3600) + (minutes * 60) + seconds) * 1000;
  countdownDisplay.classList.remove("countdown-complete");
  localStorage.setItem("clock.countdown_hours", String(hours));
  localStorage.setItem("clock.countdown_minutes", String(minutes));
  localStorage.setItem("clock.countdown_seconds", String(seconds));
  updateTimeDisplays();
  syncStartButton();
}

function startCountdown() {
  stopCountdownAlarm();
  if (countdownRemainingMs <= 0) setCountdownDuration();
  if (countdownRemainingMs <= 0) return;
  if (feedbackSettings.countdown.sound && localStorage.getItem("global.sound") !== "false") ensureTickAudioContext();
  countdownStartedAt = Date.now();
  countdownRunning = true;
  countdownFields.forEach((field) => {
    if (field) field.disabled = true;
  });
  syncStartButton();
  ensureAnimation();
}

function pauseCountdown() {
  const elapsed = Date.now() - countdownStartedAt;
  if (elapsed >= countdownRemainingMs) {
    finishCountdown();
    return;
  }
  countdownRemainingMs = Math.max(0, countdownRemainingMs - elapsed);
  countdownRunning = false;
  countdownFields.forEach((field) => {
    if (field) field.disabled = false;
  });
  updateTimeDisplays();
  syncStartButton();
}

function playCountdownComplete() {
  if (!feedbackSettings.countdown.sound || localStorage.getItem("global.sound") === "false") return;
  const audioContext = ensureTickAudioContext();
  if (!audioContext || typeof window.playTransientSound !== "function") return;
  for (let index = 0; index < 3; index++) {
    window.playTransientSound({
      audioContext,
      tone: "sine",
      when: audioContext.currentTime + (index * 0.18),
      gain: 0.35,
      durationSec: 0.12
    });
  }
}

function finishCountdown() {
  countdownRemainingMs = 0;
  countdownRunning = false;
  countdownFields.forEach((field) => {
    if (field) field.disabled = false;
  });
  updateTimeDisplays();
  syncStartButton();
  playCountdownComplete();
  if (isCountdownAlarmOn) {
    countdownModeView?.classList.add("countdown-alarm");
    countdownAlarmInterval = setInterval(playCountdownComplete, 1000);
  }
  if (feedbackSettings.countdown.haptic && "vibrate" in navigator) navigator.vibrate([120, 80, 120]);
}

function toggleActiveTimer() {
  if (activeMode === "timer") {
    if (timerRunning) pauseTimer();
    else startTimer();
  } else if (activeMode === "countdown") {
    if (countdownRunning) pauseCountdown();
    else startCountdown();
  }
}

function resetClockTool() {
  stopCountdownAlarm();
  feedbackModes.forEach((mode) => {
    feedbackSettings[mode].sound = false;
    feedbackSettings[mode].haptic = false;
    localStorage.removeItem(`clock.${mode}_sound`);
    localStorage.removeItem(`clock.${mode}_haptic`);
  });
  isCountdownAlarmOn = false;
  showCountdownMs = true;
  activeMode = "clock";
  timerElapsedMs = 0;
  timerStartedAt = 0;
  timerRunning = false;
  countdownRunning = false;
  if (countdownHours) countdownHours.value = "0";
  if (countdownMinutes) countdownMinutes.value = "1";
  if (countdownSeconds) countdownSeconds.value = "0";
  countdownRemainingMs = 60000;
  countdownFields.forEach((field) => {
    if (field) field.disabled = false;
  });
  ["clock.sound_on", "clock.haptic", "clock.mode", "clock.countdown_hours", "clock.countdown_minutes", "clock.countdown_seconds", "clock.countdown_alarm", "clock.countdown_ms"]
    .forEach((key) => localStorage.removeItem(key));
  syncFeedbackButtonState();
  syncCountdownOptions();
  syncMode();
  updateTimeDisplays();
  window.PekoSound?.syncFromTools();
  window.PekoHaptics?.syncFromTools();
  renderClock();
}

function renderClock() {
  const date = new Date();
  const hours = date.getHours() % 12;
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unavailable";

  document.getElementById("clock-local-time").textContent = formatLocalTime(date);
  document.getElementById("clock-time-zone").textContent = timeZone;
  document.getElementById("clock-local-date").textContent = formatHeroDate(date);
  renderCalendarMonth(date);

  if (clockHour) clockHour.style.transform = `rotate(${(hours * 30) + (minutes * 0.5)}deg)`;
  if (clockMinute) clockMinute.style.transform = `rotate(${(minutes * 6) + (seconds * 0.1)}deg)`;
  if (clockSecond) clockSecond.style.transform = `rotate(${seconds * 6}deg)`;
  triggerSecondFeedback(date);
}

renderClock();
syncFeedbackButtonState();
syncCountdownOptions();
loadCountdownFields();
syncMode();
updateTimeDisplays();
resetButton?.addEventListener("click", () => {
  resetClockTool();
});
Object.keys(modes).forEach((mode) => {
  modes[mode].button?.addEventListener("click", () => {
    activeMode = mode;
    localStorage.setItem("clock.mode", activeMode);
    syncMode();
  });
});
timeStartButton?.addEventListener("click", toggleActiveTimer);
countdownAlarmButton?.addEventListener("click", () => {
  isCountdownAlarmOn = !isCountdownAlarmOn;
  localStorage.setItem("clock.countdown_alarm", String(isCountdownAlarmOn));
  if (!isCountdownAlarmOn) stopCountdownAlarm();
  if (isCountdownAlarmOn && feedbackSettings.countdown.sound && localStorage.getItem("global.sound") !== "false") ensureTickAudioContext();
  syncCountdownOptions();
});
countdownMsButton?.addEventListener("click", () => {
  showCountdownMs = !showCountdownMs;
  localStorage.setItem("clock.countdown_ms", String(showCountdownMs));
  syncCountdownOptions();
  updateTimeDisplays();
});
countdownFields.forEach((field) => {
  field?.addEventListener("input", setCountdownDuration);
});
clockSoundButton?.addEventListener("click", () => {
  if (!feedbackSettings[activeMode]) return;
  feedbackSettings[activeMode].sound = !feedbackSettings[activeMode].sound;
  saveFeedback("sound");
  if (feedbackSettings[activeMode].sound) ensureTickAudioContext();
  syncFeedbackButtonState();
});
clockHapticButton?.addEventListener("click", () => {
  if (!feedbackSettings[activeMode]) return;
  feedbackSettings[activeMode].haptic = !feedbackSettings[activeMode].haptic;
  saveFeedback("haptic");
  syncFeedbackButtonState();
});
window.addEventListener("storage", (event) => {
  feedbackModes.forEach((mode) => {
    ["sound", "haptic"].forEach((kind) => {
      if (event.key === `clock.${mode}_${kind}`) {
        feedbackSettings[mode][kind] = event.newValue === "true";
        syncFeedbackButtonState();
      }
    });
  });
});
setInterval(renderClock, 1000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") updateTimeDisplays();
});
document.addEventListener("DOMContentLoaded", initCountdownKnobs);

// END OF FILE