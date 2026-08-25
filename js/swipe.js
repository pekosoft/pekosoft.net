// Swipe Pages Functionality
// pekosoft.net/js/swipe.js

const fallbackSwipePages = [
  "index",
  "tap_pad",
  "bpm_calculator",
  "metronome",
  "turntable"
];

// Determine current page name
const params = new URLSearchParams(window.location.search);
let current = params.get("r");

if (!current) {
  const pathPage = pageFromPathname(window.location.pathname);
  if (pathPage) {
    current = pathPage;
  } else if (window.location.pathname === "/" || window.location.pathname === "/index.php") {
    current = "index";
  }
}

function pageFromHref(href) {
  if (!href) return null;

  try {
    const url = new URL(href, window.location.origin);
    const pathPage = pageFromPathname(url.pathname);

    // For context pages, the release lives in ?r=...
    if (pathPage === "about" || pathPage === "help" || pathPage === "history") {
      const release = url.searchParams.get("r");
      return release || null;
    }

    return pathPage;
  } catch {
    const match = href.match(/([\w]+)\.php(?:\?|#|$)/);
    return match ? match[1] : null;
  }
}

function pageFromPathname(pathname) {
  const phpMatch = pathname.match(/\/([\w]+)\.php$/);
  if (phpMatch) return phpMatch[1];

  const cleanMatch = pathname.match(/^\/([\w]+)\/?$/);
  return cleanMatch ? cleanMatch[1] : null;
}

function getNavPages() {
  const footerLinks = Array.from(document.querySelectorAll(".footer a[href]"));
  const pages = [];
  footerLinks.forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === "#") return;
    const page = pageFromHref(href);
    if (page && !pages.includes(page)) pages.push(page);
  });
  return pages.length > 0 ? pages : fallbackSwipePages;
}

const swipePages = getNavPages();

function getCurrentPage() {
  if (current && swipePages.includes(current)) return current;
  const pathPage = pageFromPathname(window.location.pathname);
  if (pathPage && swipePages.includes(pathPage)) return pathPage;
  return null;
}

function getCurrentIndex() {
  const currentPage = getCurrentPage();
  return currentPage ? swipePages.indexOf(currentPage) : -1;
}

const currentIndex = getCurrentIndex();

// === NEW: scope swipe area ===
const isToolPage = swipePages.includes(current);
const headerScope = document.querySelector(".top-heading"); // header only
// For tool pages: use header only if it exists; otherwise disable swipe entirely.
// For non-tool pages: fall back to whole document as before.
const scopeEl = isToolPage ? headerScope : document;

let startX = null;
let startY = null;
let pointerId = null;
let swipeLocked = false;
let swipeHorizontal = false;

const swipeLockThreshold = 16;
const swipeCommitThreshold = 75;

function resetSwipe() {
  startX = null;
  startY = null;
  pointerId = null;
  swipeLocked = false;
  swipeHorizontal = false;
}

function buildPageUrl(page) {
  const path = window.location.pathname;
  const toolPages = [
    "tap_pad",
    "bpm_calculator",
    "metronome",
    "turntable",
    "bpm_circle",
    "bpm_curve",
    "circle_of_fifths",
    "drum_machine",
    "player",
    "piano",
    "audio_calculator",
    "blockchain",
    "icons",
    "tuner",
    "visualizer",
    "reference",
    "notepad"
  ];

  if (path.includes("about.php")) return `/about.php?r=${page}`;
  if (path.includes("help.php")) return `/help.php?r=${page}`;
  if (path.includes("history.php")) return `/history.php?r=${page}`;
  if (path.includes("js.php")) return `/js.php?r=${page}`;
  if (path.includes("css.php")) return `/css.php?r=${page}`;
  return toolPages.includes(page) ? `/${page}` : `/${page}.php`;
}

function getTargetPage(direction) {
  const idx = getCurrentIndex();
  if (swipePages.length === 0 || idx < 0) return null;

  if (direction === "forward") {
    return swipePages[(idx + 1) % swipePages.length];
  }

  return swipePages[(idx - 1 + swipePages.length) % swipePages.length];
}

function navigateByDirection(direction) {
  const page = getTargetPage(direction);
  if (!page) return;

  window.location.href = buildPageUrl(page);
}

// Disable swipe in areas marked with .no-swipe (inside scopeEl)
(scopeEl || document).querySelectorAll?.(".no-swipe").forEach(el => {
  el.addEventListener("pointerdown", (e) => { e.stopPropagation(); });
  el.addEventListener("pointerup", (e) => { e.stopPropagation(); });
});

// Only attach listeners if we have a scope (on tool pages without header, swipe is disabled)
if (scopeEl) {
  if (scopeEl !== document) {
    scopeEl.style.touchAction = "pan-y";
  }

  scopeEl.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target;
    const noSwipeSelector = "a, button, input, textarea, select, canvas, table";
    const isEditable = target.isContentEditable;
    const hasNoSwipeTarget = target.closest(noSwipeSelector);
    const hasNoSwipeClass = target.closest(".no-swipe");

    if (hasNoSwipeTarget || isEditable || hasNoSwipeClass) {
      resetSwipe(); // disable swipe
      return;
    }

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;

    if (typeof scopeEl.setPointerCapture === "function") {
      try {
        scopeEl.setPointerCapture(pointerId);
      } catch (_) {
        // Document-scoped swipes continue through normal bubbling.
      }
    }
  });

  scopeEl.addEventListener("pointermove", (e) => {
    if (startX === null || startY === null) return;
    if (pointerId !== null && e.pointerId !== pointerId) return;

    const moveX = e.clientX;
    const moveY = e.clientY;
    const deltaX = moveX - startX;
    const deltaY = moveY - startY;

    if (!swipeLocked) {
      if (Math.abs(deltaX) < swipeLockThreshold && Math.abs(deltaY) < swipeLockThreshold) {
        return;
      }
      swipeLocked = true;
      swipeHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (!swipeHorizontal) return;

    e.preventDefault();
  });

  scopeEl.addEventListener("pointerup", (e) => {
    if (startX === null || startY === null) return; // no valid start => ignore
    if (pointerId !== null && e.pointerId !== pointerId) return;

    const endX = e.clientX;
    const endY = e.clientY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Horizontal swipe with threshold
    if (swipeHorizontal && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeCommitThreshold) {
      deltaX > 0 ? navigateByDirection("backward") : navigateByDirection("forward");
      return;
    }

    resetSwipe();
  });

  scopeEl.addEventListener("pointercancel", (e) => {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    resetSwipe();
  });
}

function goToNextPage() {
  navigateByDirection("forward");
}

function goToPreviousPage() {
  navigateByDirection("backward");
}

function redirectToPage(page) {
  window.location.href = buildPageUrl(page);
}

// END OF FILE
