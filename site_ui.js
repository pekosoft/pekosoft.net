'use strict';

(() => {
  const options = { ...document.currentScript.dataset };
  const backgroundKey = 'global.background_enabled';
  const playbackKey = 'global.site_play_active';

  function createIcon(name, className = 'icons') {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', className);
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `/icons.svg#${name}`);
    icon.append(use);
    return icon;
  }

  function createButton(id, label, title, icon) {
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.className = 'settings-toggle';
    button.setAttribute('aria-label', label);
    button.title = title;
    button.append(createIcon(icon));
    return button;
  }

  function setupBackground() {
    const controls = document.querySelector('#settings-panel .settings-panel-scroll');
    // The Tree page shares Settings actions directly, without a sidebar.
    const mode = document.getElementById('toggle-mode-button');
    if (!controls && !mode) return;
    const button = createButton('toggle-background-button', 'Background', 'Toggle background', 'photo');
    button.className = 'toc-button';
    button.dataset.helpRelease = 'index';
    button.dataset.helpEntry = 'Background';
    button.dataset.helpKind = 'option';
    const label = document.createElement('span');
    label.textContent = 'Background';
    if (controls) button.append(label);
    const reset = document.getElementById('reset-settings-button');
    if (reset) reset.parentElement.insertBefore(button, reset);
    else if (controls) controls.insertBefore(button, controls.firstChild);
    else mode.after(button);

    const isGradient = options.background === 'gradient';
    const backgroundImage = isGradient
      ? 'linear-gradient(135deg, var(--color2), var(--color1))'
      : `url("${options.background}")`;
    const background = document.createElement('div');
    background.className = `site-background${!isGradient && options.rootInversion === 'true' ? ' bitmap' : ''}`;
    background.setAttribute('aria-hidden', 'true');
    document.body.prepend(background);
    const apply = () => {
      const enabled = localStorage.getItem(backgroundKey) === 'true';
      button.classList.toggle('button-on', enabled);
      button.setAttribute('aria-pressed', String(enabled));
      document.documentElement.classList.toggle('site-background-enabled', enabled);
      background.style.backgroundImage = enabled ? backgroundImage : 'none';
    };
    button.addEventListener('click', () => {
      localStorage.setItem(backgroundKey, String(localStorage.getItem(backgroundKey) !== 'true'));
      apply();
    });
    document.getElementById('background-image')?.addEventListener('change', event => {
      if (!event.target.files.length) return;
      localStorage.setItem(backgroundKey, 'true');
      apply();
    });
    window.addEventListener('storage', event => {
      if (event.key === backgroundKey || event.key === null) apply();
    });
    window.addEventListener('pageshow', apply);
    apply();
  }

  function setupNavigation() {
    const toc = document.getElementById('toc');
    if (!toc) return;
    const nativePlay = document.getElementById('play-site-button');
    const nativePrevious = document.getElementById('prev-site-button');
    const nativeNext = document.getElementById('next-site-button');
    const toolbar = toc.querySelector('.toc-controls') || document.createElement('div');
    toolbar.className = 'toc-controls';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Page navigation');
    const listedHome = toc.querySelector('li a[href="/"]') ||
      toc.querySelector('.toc-content .toc-column:first-child > .toc-button[data-href]');
    const home = toolbar.querySelector('a[href="/"]') || listedHome ||
      createButton('home-site-button', 'Home', 'Show front page', 'home');
    if (listedHome) {
      const item = listedHome.closest('li') || listedHome.parentElement;
      listedHome.replaceChildren(createIcon('home'));
      listedHome.setAttribute('aria-label', 'Home');
      listedHome.title = 'Show front page';
      item.remove();
    }
    const previous = nativePrevious ||
      createButton('prev-site-button', 'Previous page', 'Show previous page', 'skip_prev');
    const play = nativePlay ||
      createButton('play-site-button', 'Play all pages', 'Play all pages', 'play');
    const next = nativeNext ||
      createButton('next-site-button', 'Next page', 'Show next page', 'skip_next');
    for (const [control, entry] of [[home, 'Home'], [previous, 'Previous page'], [play, 'Play'], [next, 'Next page']]) {
      Object.assign(control.dataset, { helpRelease: 'index', helpEntry: entry, helpKind: 'button' });
    }
    // Move existing controls, retaining their handlers and playback sequence.
    play.replaceChildren(createIcon('play'));
    play.setAttribute('aria-label', 'Play all pages');
    play.title = 'Play all pages';
    toolbar.replaceChildren(home, previous, play, next);
    toc.prepend(toolbar);

    const normalize = ref => {
      const url = new URL(ref, window.location.href);
      const path = url.pathname.replace(/\/index(?:\.php)?\/?$/, '/').replace(/\.php$/, '').replace(/\/$/, '') || '/';
      return path + url.search;
    };
    const getSequence = () => {
      if (typeof window.getSitePlaySequence === 'function') return window.getSitePlaySequence();
      const links = Array.from(toc.querySelectorAll('a[href]')).filter(link =>
        !link.closest('.toc-controls') && link.dataset.playSkip !== 'true' &&
        link.origin === window.location.origin);
      const refs = [...new Set(links.map(link => link.href))];
      if (!refs.some(ref => normalize(ref) === '/')) refs.unshift('/');
      return refs;
    };
    const getIndex = sequence => {
      const current = typeof window.getCurrentPageRef === 'function'
        ? window.getCurrentPageRef() : window.location.href;
      const exact = sequence.findIndex(ref => normalize(ref) === normalize(current));
      if (exact >= 0) return exact;
      const selected = toc.querySelector('li a[aria-current="page"]');
      if (selected) return sequence.findIndex(ref => normalize(ref) === normalize(selected.href));
      return sequence.findIndex(ref => normalize(ref) === normalize(window.location.pathname));
    };
    let timer;
    const active = () => localStorage.getItem(playbackKey) === 'true';
    const update = () => {
      play.classList.toggle('button-on', active());
      play.setAttribute('aria-pressed', String(active()));
    };
    const stop = () => {
      clearTimeout(timer);
      if (nativePlay && active()) {
        if (typeof window.stopSitePlay === 'function') window.stopSitePlay();
        else nativePlay.click();
      } else {
        localStorage.removeItem(playbackKey);
      }
      update();
    };
    const navigate = direction => {
      const sequence = getSequence();
      const index = getIndex(sequence);
      window.location.assign(sequence[(Math.max(0, index) + direction + sequence.length) % sequence.length]);
    };
    if (home.tagName === 'BUTTON' && !home.dataset.href) home.addEventListener('click', () => {
      stop();
      window.location.assign('/');
    });
    if (!nativePrevious) previous.addEventListener('click', () => { stop(); navigate(-1); });
    if (!nativeNext) next.addEventListener('click', () => { stop(); navigate(1); });
    if (nativePlay) {
      new MutationObserver(() => {
        play.setAttribute('aria-pressed', String(play.classList.contains('button-on')));
      }).observe(play, { attributes: true, attributeFilter: ['class'] });
      play.setAttribute('aria-pressed', String(play.classList.contains('button-on')));
      return;
    }

    const schedule = () => {
      clearTimeout(timer);
      if (active() && !document.hidden) timer = setTimeout(() => navigate(1), 2500);
    };
    play.addEventListener('click', () => {
      if (active()) stop();
      else {
        localStorage.setItem(playbackKey, 'true');
        update();
        schedule();
      }
    });
    document.addEventListener('click', event => {
      if (active() && event.target.closest('a[href], button[data-href]')) stop();
    }, true);
    document.addEventListener('submit', stop, true);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') stop(); });
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('storage', event => {
      if (event.key === playbackKey || event.key === null) { update(); schedule(); }
    });
    window.addEventListener('pagehide', () => clearTimeout(timer));
    window.addEventListener('pageshow', () => { update(); schedule(); });
    update();
    schedule();
  }

  function markExternalLinks(root) {
    const internalHosts = new Set([window.location.hostname]);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) internalHosts.add(new URL(canonical.href).hostname);
    const links = Array.from(root.querySelectorAll('a[href]'));
    if (root.matches?.('a[href]')) links.unshift(root);
    for (const link of links) {
      const url = new URL(link.href, window.location.href);
      if (!/^https?:$/.test(url.protocol) || internalHosts.has(url.hostname) ||
          !link.textContent.trim() || link.querySelector('img, .external-link-icon, use[href$="#external"]')) continue;
      link.append(createIcon('external', 'external-link-icon'));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupBackground();
    setupNavigation();
    markExternalLinks(document);
    new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) markExternalLinks(node);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
