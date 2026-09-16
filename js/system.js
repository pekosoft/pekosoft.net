// Pekosoft System
// pekosoft.net/js/system.js

const systemPage = document.getElementById("system-page");
const systemUpdateButton = document.getElementById("system-update-button");
const systemCopyButton = document.getElementById("system-copy-button");

function getSystemElement(id) {
  return document.getElementById(`system-${id}`);
}

function setSystemValue(id, value) {
  const element = getSystemElement(id);
  if (!element) return;
  element.textContent = value || "Unavailable";
}

function formatBoolean(value) {
  return value ? "Yes" : "No";
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Unavailable";
  return value.toFixed(3);
}

function getOperatingSystem() {
  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  if (/Windows NT 10\.0/i.test(userAgent)) return "Windows 10 / 11";
  if (/Windows NT 6\.3/i.test(userAgent)) return "Windows 8.1";
  if (/Windows NT 6\.2/i.test(userAgent)) return "Windows 8";
  if (/Windows NT 6\.1/i.test(userAgent)) return "Windows 7";
  if (/Mac OS X/i.test(userAgent)) return `macOS ${userAgent.match(/Mac OS X ([\d_]+)/i)?.[1]?.replace(/_/g, ".") || ""}`.trim();
  if (/Android/i.test(userAgent)) return `Android ${userAgent.match(/Android ([\d.]+)/i)?.[1] || ""}`.trim();
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS / iPadOS";
  if (/Linux/i.test(platform) || /Linux/i.test(userAgent)) return "Linux";

  return platform || "Unavailable";
}

function getBrowser() {
  const userAgent = navigator.userAgent || "";
  const matchers = [
    ["Edge", /Edg\/([\d.]+)/],
    ["Chrome", /Chrome\/([\d.]+)/],
    ["Firefox", /Firefox\/([\d.]+)/],
    ["Safari", /Version\/([\d.]+).*Safari/]
  ];

  for (const [name, regex] of matchers) {
    const match = userAgent.match(regex);
    if (match) return `${name} ${match[1]}`;
  }

  return navigator.appName || "Unavailable";
}

function getCpu() {
  const platform = navigator.platform || "";
  const userAgent = navigator.userAgent || "";
  const cpuSource = `${platform} ${userAgent}`;
  const architecture = /Win64|x64|x86_64|amd64/i.test(cpuSource) ? "x64" : platform;

  if (architecture) return `CPU vendor/model unavailable (${architecture})`;
  return "CPU vendor/model unavailable";
}

function getCpuCores() {
  return navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} logical cores` : "Unavailable";
}

function collectSystemInfo() {
  const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB or more` : "Unavailable";
  const cpu = getCpu();
  const cores = getCpuCores();
  const screenSize = window.screen ? `${screen.width} x ${screen.height}` : "Unavailable";
  const viewport = `${window.innerWidth} x ${window.innerHeight}`;
  const color = window.screen ? `${screen.colorDepth}-bit` : "Unavailable";
  const languages = navigator.languages && navigator.languages.length ? navigator.languages.join(", ") : navigator.language;
  const touchPoints = navigator.maxTouchPoints || 0;

  return {
    cpu,
    cores,
    ram: memory,
    os: getOperatingSystem(),
    browser: getBrowser(),
    ip: systemPage?.dataset.clientIp || "Unavailable",
    screen: screenSize,
    viewport,
    "pixel-ratio": formatNumber(window.devicePixelRatio || 1),
    color,
    language: languages,
    online: formatBoolean(navigator.onLine),
    cookies: formatBoolean(navigator.cookieEnabled),
    touch: touchPoints ? `${touchPoints} touch points` : "No",
    "user-agent": navigator.userAgent || "Unavailable"
  };
}

function renderSystemInfo() {
  const info = collectSystemInfo();
  Object.keys(info).forEach((key) => setSystemValue(key, info[key]));
}

function getSystemInfoText() {
  const rows = Array.from(document.querySelectorAll(".system-row"));
  return rows.map((row) => {
    const label = row.querySelector("span")?.textContent.trim() || "";
    const value = row.querySelector("strong")?.textContent.trim() || "";
    return `${label} ${value}`;
  }).join("\n");
}

function copySystemInfo() {
  const text = getSystemInfoText();
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text);
}

function copySystemRow(event) {
  const row = event.currentTarget.closest(".system-row");
  const label = row?.querySelector("span")?.textContent.trim() || "";
  const value = row?.querySelector("strong")?.textContent.trim() || "";
  if (!label || !value || !navigator.clipboard?.writeText) return;
  navigator.clipboard.writeText(`${label} ${value}`);
}

document.querySelectorAll(".system-row-icon").forEach((button) => {
  button.addEventListener("click", copySystemRow);
});
renderSystemInfo();
window.addEventListener("resize", renderSystemInfo);
window.addEventListener("online", renderSystemInfo);
window.addEventListener("offline", renderSystemInfo);
systemUpdateButton?.addEventListener("click", renderSystemInfo);
systemCopyButton?.addEventListener("click", copySystemInfo);

// END OF FILE
