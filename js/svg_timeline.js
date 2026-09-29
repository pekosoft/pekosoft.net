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
    getHeight,
    resolveHeight: getHeight,
    syncViewBox,
    setViewBox: syncViewBox,
    observeResize
  };
})();

// END OF FILE
