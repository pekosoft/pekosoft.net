// Pekosoft Clock
// pekosoft.net/js/clock.js

const clockHour = document.getElementById("clock-hour");
const clockMinute = document.getElementById("clock-minute");
const clockSecond = document.getElementById("clock-second");
const calendarGrid = document.getElementById("calendar-grid");
const clockUpdateButton = document.getElementById("clock-update-button");
const clockSoundButton = document.getElementById("clock-sound-button");
const clockHapticButton = document.getElementById("clock-haptic-button");
let renderedCalendarMonth = "";
let lastTickSecond = null;
let tickAudioContext = null;
let isSoundOn = localStorage.getItem("clock.sound_on") === "true";
let isHapticOn = localStorage.getItem("clock.haptic") === "true";

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
  return `${date.toLocaleString("en-US", { weekday: "long" })} ${formatLocalDate(date)}`;
}

function getIsoWeek(date) {
  const weekDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = weekDate.getUTCDay() || 7;
  weekDate.setUTCDate(weekDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(weekDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((weekDate - yearStart) / 86400000) + 1) / 7);
}

function renderCalendarMonth(date) {
  if (!calendarGrid) return;

  const year = date.getFullYear();
  const month = date.getMonth();
  const monthKey = `${year}-${month}`;

  if (renderedCalendarMonth !== monthKey) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows = Math.ceil(daysInMonth / 7);
    calendarGrid.textContent = "";

    for (let row = 0; row < rows; row++) {
      const rowStartDay = (row * 7) + 1;
      const weekCell = document.createElement("div");
      weekCell.className = "calendar-week";
      weekCell.textContent = padDatePart(getIsoWeek(new Date(year, month, rowStartDay)));
      calendarGrid.appendChild(weekCell);

      const spacerCell = document.createElement("div");
      spacerCell.className = "calendar-spacer";
      calendarGrid.appendChild(spacerCell);

      for (let column = 0; column < 7; column++) {
        const day = rowStartDay + column;
        const cell = document.createElement("div");
        cell.className = day <= daysInMonth ? "calendar-day" : "calendar-day calendar-empty";

        if (day <= daysInMonth) {
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
  if (!isSoundOn || localStorage.getItem("global.sound") === "false") return;

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
  playSecondTick();
  if (isHapticOn && "vibrate" in navigator) navigator.vibrate(10);
}

function syncFeedbackButtonState() {
  clockSoundButton?.classList.toggle("button-on", isSoundOn);
  clockHapticButton?.classList.toggle("button-on", isHapticOn);
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
clockUpdateButton?.addEventListener("click", renderClock);
clockSoundButton?.addEventListener("click", () => {
  isSoundOn = !isSoundOn;
  localStorage.setItem("clock.sound_on", String(isSoundOn));
  if (isSoundOn) ensureTickAudioContext();
  syncFeedbackButtonState();
});
clockHapticButton?.addEventListener("click", () => {
  isHapticOn = !isHapticOn;
  localStorage.setItem("clock.haptic", String(isHapticOn));
  syncFeedbackButtonState();
});
setInterval(renderClock, 1000);

// END OF FILE