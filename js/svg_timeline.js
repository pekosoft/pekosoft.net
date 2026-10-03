// Shared SVG timeline helpers
// pekosoft.net/js/svg_timeline.js

(function () {
  function isOptionsObject(value) {
    return !!value && typeof value === "object" && !("nodeType" in value);
  }

  function getHeight(svgOrOptions, minHeightArg) {
    const options = isOptionsObject(svgOrOptions) ? svgOrOptions : null;
    const svg = options && "svg" in options
      ? svgOrOptions.svg
      : svgOrOptions;
    const minHeight = options && "minHeight" in options
      ? options.minHeight
      : minHeightArg;
    if (!svg) return minHeight;
    const measured = Math.round(svg.clientHeight || minHeight);
    return Math.max(minHeight, measured);
  }

  function syncViewBox(svgOrOptions, widthArg, heightArg) {
    const options = isOptionsObject(svgOrOptions) ? svgOrOptions : null;
    const svg = options && "svg" in options
      ? svgOrOptions.svg
      : svgOrOptions;
    const width = options && "width" in options
      ? options.width
      : widthArg;
    const height = options && "height" in options
      ? options.height
      : heightArg;
    if (!svg) return;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  function createRulerLayout(options) {
    const {
      container,
      scrollElement,
      cornerRuler,
      verticalRuler,
      horizontalRuler,
      button,
      storageKey,
      axisWidth = 48,
      horizontalHeight = 24,
      defaultVisible = true,
      onVisibilityChange
    } = options || {};

    const layout = container?.querySelector('.timeline-ruler-layout');
    if (!layout || !scrollElement || !cornerRuler || !verticalRuler || !horizontalRuler) return null;

    const storedVisibility = storageKey ? localStorage.getItem(storageKey) : null;
    let isVisible = storedVisibility === null
      ? (window.PekoRulers?.getGlobal?.() ?? defaultVisible)
      : storedVisibility !== 'false';

    function syncHorizontalRuler() {
      horizontalRuler.style.transform = `translateX(${-scrollElement.scrollLeft}px)`;
    }

    function updateButton() {
      if (!button) return;
      button.classList.toggle('button-on', isVisible);
      button.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
    }

    function setVisible(value, persist = true) {
      isVisible = Boolean(value);
      layout.classList.toggle('timeline-rulers-hidden', !isVisible);
      updateButton();
      if (persist && storageKey) {
        localStorage.setItem(storageKey, isVisible ? 'true' : 'false');
      }
      if (typeof onVisibilityChange === 'function') {
        onVisibilityChange(isVisible);
      }
    }

    function render({ width, height, color, bright = false, drawVertical, drawHorizontal }) {
      if (!isVisible) return;

      layout.style.setProperty('--timeline-axis-width', `${axisWidth}px`);
      layout.style.setProperty('--timeline-ruler-height', `${horizontalHeight}px`);
      syncViewBox(cornerRuler, axisWidth, horizontalHeight);
      syncViewBox(verticalRuler, axisWidth, height);
      syncViewBox(horizontalRuler, width, horizontalHeight);
      horizontalRuler.style.width = `${width}px`;
      drawRulerCorner(cornerRuler, { width: axisWidth, height: horizontalHeight, color, bright });

      if (typeof drawVertical === 'function') {
        drawVertical(verticalRuler, { width: axisWidth, height, bright });
      }
      if (typeof drawHorizontal === 'function') {
        drawHorizontal(horizontalRuler, { width, height: horizontalHeight, bright });
      }
      syncHorizontalRuler();
    }

    scrollElement.addEventListener('scroll', syncHorizontalRuler, { passive: true });
    button?.addEventListener('click', () => setVisible(!isVisible));
    window.addEventListener('pekosoft:rulers-global-change', (event) => {
      setVisible(Boolean(event.detail?.enabled), false);
    });
    layout.classList.toggle('timeline-rulers-hidden', !isVisible);
    updateButton();
    syncHorizontalRuler();

    return {
      getVisible: () => isVisible,
      render,
      setVisible,
      syncHorizontalRuler
    };
  }

  function createRulerElement(name, attributes, text = '') {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    const lineAttributes = name === 'line'
      ? {
          'stroke-width': 1,
          'shape-rendering': 'crispEdges',
          'vector-effect': 'non-scaling-stroke',
          'stroke-linecap': 'butt',
          ...attributes
        }
      : attributes;
    Object.entries(lineAttributes).forEach(([attribute, value]) => {
      element.setAttribute(attribute, String(value));
    });
    element.textContent = text;
    return element;
  }

  function drawVerticalRuler(svg, options) {
    if (!svg) return;
    const { width, height, title = '', titleY = 24, ticks = [], color, bright = false } = options || {};
    const axisX = Math.max(0, width);
    svg.replaceChildren();
    if (bright) {
      svg.appendChild(createRulerElement('line', {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: height,
        stroke: color
      }));
      svg.appendChild(createRulerElement('line', {
        x1: 0,
        y1: height,
        x2: width,
        y2: height,
        stroke: color
      }));
    }
    svg.appendChild(createRulerElement('line', {
      x1: axisX,
      y1: 0,
      x2: axisX,
      y2: height,
      stroke: color
    }));

    if (title) {
      svg.appendChild(createRulerElement('text', {
        x: Math.max(0, width - 8),
        y: Math.max(10, Math.min(height - 8, titleY)),
        fill: color,
        'font-size': 12,
        'font-family': 'Arial, sans-serif',
        'text-anchor': 'end'
      }, title));
    }

    ticks.forEach(({ position, label, labelPosition = 'above' }) => {
      const y = Math.max(0.5, Math.min(height + 0.5, Math.floor(position) + 0.5));
      svg.appendChild(createRulerElement('line', {
        x1: 0,
        y1: y,
        x2: width,
        y2: y,
        stroke: color
      }));
      if (label === undefined || label === null || label === '') return;
      const labelY = labelPosition === 'below'
        ? Math.min(height - 5, y + 24)
        : Math.max(10, y - 5);
      svg.appendChild(createRulerElement('text', {
        x: Math.max(0, width - 8),
        y: labelY,
        fill: color,
        'font-size': 12,
        'font-family': 'Arial, sans-serif',
        'text-anchor': 'end'
      }, label));
    });
  }

  function drawRulerCorner(svg, options) {
    if (!svg) return;
    const { width, height, color, bright = false } = options || {};
    const axisX = Math.max(0, width);
    const axisY = Math.max(0, height);
    svg.replaceChildren();
    if (bright) {
      svg.appendChild(createRulerElement('line', {
        x1: 0,
        y1: 0,
        x2: width,
        y2: 0,
        stroke: color
      }));
      svg.appendChild(createRulerElement('line', {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: height,
        stroke: color
      }));
    }
    svg.appendChild(createRulerElement('line', {
      x1: 0,
      y1: axisY,
      x2: width,
      y2: axisY,
      stroke: color
    }));
    svg.appendChild(createRulerElement('line', {
      x1: axisX,
      y1: 0,
      x2: axisX,
      y2: height,
      stroke: color
    }));
  }

  function drawHorizontalRuler(svg, options) {
    if (!svg) return;
    const { width, height, ticks = [], color, bright = false } = options || {};
    const axisY = Math.max(0, height);
    svg.replaceChildren();
    if (bright) {
      svg.appendChild(createRulerElement('line', {
        x1: 0,
        y1: 0,
        x2: width,
        y2: 0,
        stroke: color
      }));
    }
    svg.appendChild(createRulerElement('line', {
      x1: 0,
      y1: axisY,
      x2: width,
      y2: axisY,
      stroke: color
    }));

    ticks.forEach(({ position, label }) => {
      if (Number(position) <= 0) return;
      const x = Math.max(0.5, Math.min(width - 0.5, Math.round(position) + 0.5));
      svg.appendChild(createRulerElement('line', {
        x1: x,
        y1: axisY,
        x2: x,
        y2: Math.min(axisY, Math.floor(height * 0.45)),
        stroke: color
      }));
      if (label === undefined || label === null || label === '') return;
      svg.appendChild(createRulerElement('text', {
        x: x + 3,
        y: Math.max(10, height - 3),
        fill: color,
        'font-size': 12,
        'font-family': 'Arial, sans-serif',
        'text-anchor': 'start'
      }, label));
    });
  }

  function createRafScheduler(callback) {
    let rafId = null;
    return function schedule() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        rafId = null;
        callback();
      });
    };
  }

  function observeResize(options) {
    const {
      svg,
      container,
      onResize,
      includeWindowResize = true,
      includeSvgResize = true,
      includeContainerClassResize = true
    } = options || {};

    if (!svg || typeof onResize !== "function") {
      return () => {};
    }

    const scheduleResize = createRafScheduler(onResize);
    const cleanups = [];

    if (includeWindowResize) {
      window.addEventListener("resize", scheduleResize);
      cleanups.push(() => window.removeEventListener("resize", scheduleResize));
    }

    if (includeSvgResize && typeof ResizeObserver === "function") {
      const svgObserver = new ResizeObserver(() => scheduleResize());
      svgObserver.observe(svg);
      cleanups.push(() => svgObserver.disconnect());
    }

    if (includeContainerClassResize && container && typeof MutationObserver === "function") {
      const classObserver = new MutationObserver(() => scheduleResize());
      classObserver.observe(container, { attributes: true, attributeFilter: ["class"] });
      cleanups.push(() => classObserver.disconnect());
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  function createFollowController(options) {
    const {
      scrollElement,
      onEnabledChange,
      reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    } = options || {};

    if (!scrollElement) {
      return {
        destroy() {},
        followRatio() {},
        centerRatio() {},
        reset() {},
        setEnabled() {}
      };
    }

    let enabled = false;
    let previousRatio = null;
    let pointerStart = null;
    const reducedMotionBoundary = 0.90;
    const pointerThreshold = 8;

    const suspend = () => {
      if (!enabled) return;
      enabled = false;
      if (typeof onEnabledChange === "function") {
        onEnabledChange(false);
      }
    };

    const handleKeydown = (event) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
        suspend();
      }
    };

    const handleWheel = (event) => {
      const horizontalWheel = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const shiftedVerticalWheel = event.shiftKey && event.deltaY !== 0;
      if (horizontalWheel || shiftedVerticalWheel) {
        suspend();
      }
    };

    const handlePointerDown = (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointerStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY
      };
    };

    const handlePointerMove = (event) => {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      const deltaX = Math.abs(event.clientX - pointerStart.x);
      const deltaY = Math.abs(event.clientY - pointerStart.y);
      if (deltaX >= pointerThreshold && deltaX > deltaY) {
        pointerStart = null;
        suspend();
      }
    };

    const clearPointer = () => {
      pointerStart = null;
    };

    scrollElement.addEventListener("wheel", handleWheel, { passive: true });
    scrollElement.addEventListener("pointerdown", handlePointerDown);
    scrollElement.addEventListener("pointermove", handlePointerMove, { passive: true });
    scrollElement.addEventListener("pointerup", clearPointer);
    scrollElement.addEventListener("pointercancel", clearPointer);
    scrollElement.addEventListener("keydown", handleKeydown);

    return {
      destroy() {
        scrollElement.removeEventListener("wheel", handleWheel);
        scrollElement.removeEventListener("pointerdown", handlePointerDown);
        scrollElement.removeEventListener("pointermove", handlePointerMove);
        scrollElement.removeEventListener("pointerup", clearPointer);
        scrollElement.removeEventListener("pointercancel", clearPointer);
        scrollElement.removeEventListener("keydown", handleKeydown);
      },

      followRatio(value) {
        if (!enabled) return;
        const ratio = Math.max(0, Math.min(1, Number(value) || 0));
        const loopWrapped = previousRatio !== null && previousRatio >= 0.75 && ratio <= 0.25;
        previousRatio = ratio;

        if (loopWrapped) {
          scrollElement.scrollLeft = 0;
          return;
        }

        const viewportWidth = scrollElement.clientWidth;
        const contentWidth = scrollElement.scrollWidth;
        const maxScroll = Math.max(0, contentWidth - viewportWidth);
        if (maxScroll <= 0 || viewportWidth <= 0) return;

        const targetX = ratio * contentWidth;
        const viewportStart = scrollElement.scrollLeft;
        if (targetX < viewportStart) {
          const nextScroll = targetX - viewportWidth * 0.50;
          scrollElement.scrollLeft = Math.max(0, Math.min(maxScroll, nextScroll));
          return;
        }

        const maximumX = viewportStart + viewportWidth * (reducedMotion ? reducedMotionBoundary : 0.50);
        if (targetX <= maximumX) return;

        const nextScroll = targetX - viewportWidth * 0.50;
        scrollElement.scrollLeft = Math.max(0, Math.min(maxScroll, nextScroll));
      },

      centerRatio(value) {
        if (!enabled) return;
        const ratio = Math.max(0, Math.min(1, Number(value) || 0));
        previousRatio = ratio;

        const viewportWidth = scrollElement.clientWidth;
        const contentWidth = scrollElement.scrollWidth;
        const maxScroll = Math.max(0, contentWidth - viewportWidth);
        if (maxScroll <= 0 || viewportWidth <= 0) return;

        const targetX = ratio * contentWidth;
        const nextScroll = targetX - viewportWidth * 0.50;
        scrollElement.scrollLeft = Math.max(0, Math.min(maxScroll, nextScroll));
      },

      reset() {
        previousRatio = null;
        scrollElement.scrollLeft = 0;
      },

      setEnabled(value) {
        const nextEnabled = Boolean(value);
        if (enabled !== nextEnabled) {
          previousRatio = null;
        }
        enabled = nextEnabled;
      }
    };
  }

  window.PekoSvgTimeline = {
    createFollowController,
    createRulerLayout,
    drawHorizontalRuler,
    drawRulerCorner,
    drawVerticalRuler,
    getHeight,
    resolveHeight: getHeight,
    syncViewBox,
    setViewBox: syncViewBox,
    observeResize
  };
})();

// END OF FILE
