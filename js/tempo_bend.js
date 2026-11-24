(function () {
  function createTempoBend({ slider, getValue, restoreValue }) {
    let enabled = false;
    let original = null;
    let pointerId = null;
    const keys = new Set();
    const cancelHolds = [];
    let finishing = false;

    function finish() {
      if (finishing) return;
      finishing = true;
      for (const cancel of cancelHolds) cancel();
      const value = original;
      original = null;
      pointerId = null;
      keys.clear();
      finishing = false;
      if (value !== null) restoreValue(value);
    }

    function begin() {
      if (original !== null) finish();
      original = getValue();
    }

    slider.addEventListener('pointerdown', (event) => {
      if (!enabled || event.button !== 0 || pointerId !== null) return;
      begin();
      pointerId = event.pointerId;
    });
    const finishPointer = (event) => {
      if (pointerId !== null && event.pointerId === pointerId) finish();
    };
    window.addEventListener('pointerup', finishPointer);
    window.addEventListener('pointercancel', finishPointer);
    slider.addEventListener('lostpointercapture', finishPointer);
    slider.addEventListener('keydown', (event) => {
      if (!enabled || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
      if (pointerId !== null) return;
      if (original === null) begin();
      keys.add(event.key);
    });
    slider.addEventListener('keyup', (event) => {
      if (keys.delete(event.key) && keys.size === 0) finish();
    });
    slider.addEventListener('blur', finish);
    window.addEventListener('blur', finish);

    function bindHold(start, stop, activate, element) {
      let activePointerId = null;
      const activeKeys = new Set();
      let bending = false;

      const beginHold = () => {
        if (!enabled) return;
        begin();
        bending = true;
      };
      const endHold = () => {
        if (!bending) return;
        bending = false;
        finish();
      };
      const stopPointer = (event) => {
        if (activePointerId === null || (event && event.pointerId !== activePointerId)) return;
        const id = activePointerId;
        activePointerId = null;
        stop();
        endHold();
        if (event && typeof element.releasePointerCapture === 'function') {
          try {
            element.releasePointerCapture(id);
          } catch (_) {}
        }
      };
      element.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || activePointerId !== null || activeKeys.size) return;
        event.preventDefault();
        beginHold();
        activePointerId = event.pointerId;
        if (typeof element.setPointerCapture === 'function') {
          try {
            element.setPointerCapture(activePointerId);
          } catch (_) {}
        }
        start();
      });
      element.addEventListener('pointerup', stopPointer);
      element.addEventListener('pointercancel', stopPointer);
      element.addEventListener('lostpointercapture', stopPointer);
      element.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (activePointerId !== null) return;
        if (activeKeys.size === 0) beginHold();
        activeKeys.add(event.key);
        activate();
      });
      element.addEventListener('keyup', (event) => {
        if (activeKeys.delete(event.key) && activeKeys.size === 0) endHold();
      });
      const cancel = () => {
        stopPointer();
        if (activeKeys.size) {
          activeKeys.clear();
          endHold();
        }
      };
      element.addEventListener('blur', cancel);
      window.addEventListener('blur', cancel);
      cancelHolds.push(cancel);
    }

    return {
      bindHold,
      finish,
      getOriginal: () => original,
      setEnabled(value) {
        if (!value) finish();
        enabled = value;
      }
    };
  }

  window.createTempoBend = createTempoBend;
})();
