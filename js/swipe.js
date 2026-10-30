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
let current = params.get("t");

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

    // For context pages, the tool lives in ?t=...
    if (pathPage === "about" || pathPage === "help" || pathPage === "history") {
      const tool = url.searchParams.get("t");
      return tool || null;
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
  // Nav links moved from footer to TOC buttons (data-href, not href)
  const tocButtons = Array.from(document.querySelectorAll("#toc .toc-button[data-href]"));
  const excludedPages = ["bitcoin", "contact", "updates"];
  const pages = [];
  tocButtons.forEach((btn) => {
    const href = btn.getAttribute("data-href") || "";
    if (href === "#") return;
    const page = pageFromHref(href);
    if (page && !excludedPages.includes(page) && !pages.includes(page)) pages.push(page);
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

function buildPageUrl(page) {
  const path = window.location.pathname;
  const toolPages = [
    "tap_pad",
    "bpm_calculator",
    "metronome",
    "turntable",
    "clock",
    "system",
    "bpm_circle",
    "bpm_curve",
    "circle_of_fifths",
    "drum_machine",
    "player",
    "piano",
    "audio_calculator",
    "icons",
    "tuner",
    "visualizer",
    "reference",
    "notepad"
  ];

  if (path.includes("about.php")) return `/about.php?t=${page}`;
  if (path.includes("help.php")) return `/help.php?t=${page}`;
  if (path.includes("history.php")) return `/history.php?t=${page}`;
  if (path.includes("js.php")) return `/js.php?t=${page}`;
  if (path.includes("css.php")) return `/css.php?t=${page}`;
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

if (scopeEl) {
  attachSwipeNavigation(scopeEl, navigateByDirection);
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
