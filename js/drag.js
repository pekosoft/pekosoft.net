// Module Drag And Reorder
// pekosoft.net/js/drag.js

function setupModuleDrag(container, header, id) {
  const interactiveSelector = "button, a, input, select, textarea, label";
  const touchHoldDelayMs = 260;
  const contactMoveCancelThreshold = 10;
  let isPointerDown = false;
  let isDragging = false;
  let isTouchPointer = false;
  let touchHoldReady = true;
  let holdTimerId = null;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let pointerId = null;
  let touchId = null;
  let activeInputType = null;
  let moveHandler = null;
  let endHandler = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let placeholder = null;
  let dragFrameId = null;
  let pendingTargetKey = null;
  let twoColumnDragSlots = null;

  const isDragDisabled = () => {
    return container.classList.contains("module-maximized");
  };

  const updateHeaderCursor = () => {
    header.style.cursor = isDragDisabled() ? "default" : "move";
  };

  updateHeaderCursor();

  const cursorObserver = new MutationObserver(updateHeaderCursor);
  cursorObserver.observe(container, { attributes: true, attributeFilter: ["class"] });

  const getContainersInDomOrder = () => {
    return moduleIds
      .map((moduleId) => document.getElementById(moduleId + "-container"))
      .filter(Boolean)
      .sort((left, right) => {
        const position = left.compareDocumentPosition(right);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
  };

  const resetFloatingStyles = () => {
    container.style.left = "";
    container.style.top = "";
    container.style.width = "";
    container.style.maxWidth = "";
    container.style.flex = "";
    container.style.margin = "";
    container.style.order = "";
    container.style.transform = "";
    container.style.pointerEvents = "";
  };

  const isTwoColumnLayout = () => {
    return (document.documentElement.classList.contains("layout-two-columns") || document.body.classList.contains("layout-two-columns")) && window.innerWidth >= 800;
  };

  const updatePlaceholderLayoutClass = () => {
    if (!placeholder) return;
    placeholder.classList.remove("layout-full-row");
  };

  const ensurePlaceholder = () => {
    if (placeholder) return;

    const rect = container.getBoundingClientRect();
    twoColumnDragSlots = isTwoColumnLayout() ? getContainersInDomOrder()
      .filter((candidate) => {
        if (candidate.classList.contains("hidden")) return false;
        const candidateRect = candidate.getBoundingClientRect();
        return candidateRect.width > 0 && candidateRect.height > 0;
      })
      .map((candidate) => candidate.getBoundingClientRect())
      .sort((left, right) => {
        const yDelta = left.top - right.top;
        if (Math.abs(yDelta) > 8) return yDelta;
        return left.left - right.left;
      }) : null;

    placeholder = document.createElement("div");
    placeholder.className = "module-drag-placeholder";
    placeholder.style.height = `${rect.height}px`;

    container.parentNode?.insertBefore(placeholder, container);
    updatePlaceholderLayoutClass();

    dragOffsetX = startX - rect.left;
    dragOffsetY = startY - rect.top;
    container.style.width = `${rect.width}px`;
    if (isTwoColumnLayout()) {
      container.style.flex = "0 0 0px";
      container.style.maxWidth = "none";
      container.style.margin = "0";
      container.style.order = "9999";
    }
    container.style.left = `${rect.left}px`;
    container.style.top = `${rect.top}px`;
  };

  const clearHoldTimer = () => {
    if (holdTimerId !== null) {
      window.clearTimeout(holdTimerId);
      holdTimerId = null;
    }
  };

  const releasePointer = () => {
    if (typeof header.releasePointerCapture === "function" && pointerId !== null) {
      try {
        header.releasePointerCapture(pointerId);
      } catch (_) {
        // Ignore if capture was never acquired.
      }
    }
  };

  const beginDrag = () => {
    if (isDragging || isDragDisabled()) return;
    isDragging = true;
    ensurePlaceholder();
    container.classList.add("module-dragging");
    // Let elementFromPoint detect modules under the dragged container.
    container.style.pointerEvents = "none";
    document.body.classList.add("module-order-dragging");
    header.style.cursor = "move";
  };

  const removeDragListeners = () => {
    if (activeInputType === "pointer") {
      document.removeEventListener("pointermove", moveHandler, true);
      document.removeEventListener("pointerup", endHandler, true);
      document.removeEventListener("pointercancel", endHandler, true);
    } else if (activeInputType === "touch") {
      document.removeEventListener("touchmove", moveHandler, true);
      document.removeEventListener("touchend", endHandler, true);
      document.removeEventListener("touchcancel", endHandler, true);
    }
  };

  const clearDragState = () => {
    if (dragFrameId !== null) {
      window.cancelAnimationFrame(dragFrameId);
      dragFrameId = null;
    }

    if (placeholder) {
      placeholder.remove();
      placeholder = null;
    }

    resetFloatingStyles();
    pointerId = null;
    touchId = null;
    activeInputType = null;
    isTouchPointer = false;
    touchHoldReady = true;
    moveHandler = null;
    endHandler = null;
    pendingTargetKey = null;
    twoColumnDragSlots = null;
  };

  const applyPlaceholderTarget = (parent, targetNode) => {
    const targetKey = targetNode ? targetNode.id : "__END__";

    if (pendingTargetKey === targetKey) {
      return;
    }

    pendingTargetKey = targetKey;

    if (targetNode) {
      if (placeholder.nextElementSibling !== targetNode) {
        parent.insertBefore(placeholder, targetNode);
        updatePlaceholderLayoutClass();
      }
      return;
    }

    if (parent.lastElementChild !== placeholder) {
      parent.appendChild(placeholder);
      updatePlaceholderLayoutClass();
    }
  };

  const cancelPendingDragAttempt = () => {
    isPointerDown = false;
    clearHoldTimer();
    removeDragListeners();
    releasePointer();
    clearDragState();
  };

  const finishDrag = () => {
    isPointerDown = false;
    clearHoldTimer();
    removeDragListeners();
    releasePointer();

    if (isDragging) {
      const parent = container.parentNode;

      if (parent && placeholder) {
        parent.insertBefore(container, placeholder);
      }

      isDragging = false;
      container.classList.remove("module-dragging");
      document.body.classList.remove("module-order-dragging");
      updateHeaderCursor();
      resetFloatingStyles();
      const currentOrder = getCurrentModuleOrder();
      saveModuleOrder(currentOrder);
      applyModuleOrder(currentOrder);
    }

    clearDragState();
  };

  const movePlaceholder = () => {
    if (!placeholder) return;

    const parent = container.parentNode;
    const entries = getContainersInDomOrder()
      .filter((candidate) => {
        if (candidate === container) return false;
        if (candidate.classList.contains("hidden")) return false;
        const rect = candidate.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((candidate) => ({ candidate, rect: candidate.getBoundingClientRect() }));

    if (!parent || !entries.length) return;

    const draggedRect = container.getBoundingClientRect();
    const twoColumnLayout = isTwoColumnLayout();
    const targetX = twoColumnLayout ? currentX : draggedRect.left + (draggedRect.width / 2);
    const targetY = twoColumnLayout ? currentY : draggedRect.top + (draggedRect.height / 2);

    if (twoColumnLayout) {
      const flowSlots = twoColumnDragSlots || entries
        .map((entry) => entry.rect)
        .concat(placeholder.getBoundingClientRect());

      const containingSlotIndex = flowSlots.findIndex((slot) => {
        return targetX >= slot.left
          && targetX <= slot.right
          && targetY >= slot.top
          && targetY <= slot.bottom;
      });

      const targetSlotIndex = containingSlotIndex >= 0 ? containingSlotIndex : flowSlots
        .map((slot, index) => {
          const centerX = slot.left + (slot.width / 2);
          const centerY = slot.top + (slot.height / 2);
          return { index, distance: Math.hypot(targetX - centerX, targetY - centerY) };
        })
        .sort((a, b) => a.distance - b.distance)[0]?.index;

      if (targetSlotIndex === undefined) {
        return;
      }

      const targetNode = entries[targetSlotIndex]?.candidate || null;
      applyPlaceholderTarget(parent, targetNode);
      return;
    }

    const overlapThreshold = 8;
    const overlapEntry = entries
      .map((entry) => {
        const overlapWidth = Math.min(draggedRect.right, entry.rect.right) - Math.max(draggedRect.left, entry.rect.left);
        const overlapHeight = Math.min(draggedRect.bottom, entry.rect.bottom) - Math.max(draggedRect.top, entry.rect.top);
        const overlapArea = Math.max(0, overlapWidth) * Math.max(0, overlapHeight);
        return { ...entry, overlapWidth, overlapHeight, overlapArea };
      })
      .filter((entry) => entry.overlapWidth >= overlapThreshold && entry.overlapHeight >= overlapThreshold)
      .sort((a, b) => b.overlapArea - a.overlapArea)[0] || null;

    const containingEntry = entries.find((entry) => {
      return targetX >= entry.rect.left
        && targetX <= entry.rect.right
        && targetY >= entry.rect.top
        && targetY <= entry.rect.bottom;
    }) || null;

    const nearestEntry = entries
      .map((entry) => {
        const cx = entry.rect.left + (entry.rect.width / 2);
        const cy = entry.rect.top + (entry.rect.height / 2);
        return { ...entry, distance: Math.hypot(targetX - cx, targetY - cy) };
      })
      .sort((a, b) => a.distance - b.distance)[0] || null;

    const targetEntry = overlapEntry || containingEntry || nearestEntry;

    if (targetEntry) {
      const rect = targetEntry.rect;
      let insertAfter = false;

      if (!twoColumnLayout) {
        insertAfter = targetY >= (rect.top + rect.height / 2);
      } else {
        const aboveRow = targetY < rect.top;
        const belowRow = targetY > rect.bottom;
        if (aboveRow) {
          insertAfter = false;
        } else if (belowRow) {
          insertAfter = true;
        } else {
          insertAfter = targetX >= (rect.left + rect.width / 2);
        }
      }

      const targetNode = insertAfter ? targetEntry.candidate.nextElementSibling : targetEntry.candidate;
      applyPlaceholderTarget(parent, targetNode || null);
      return;
    }

    const orderedByVisualPosition = entries
      .sort((a, b) => {
        const yDelta = a.rect.top - b.rect.top;
        if (Math.abs(yDelta) > 8) return yDelta;
        return a.rect.left - b.rect.left;
      });

    let insertBeforeCandidate = null;

    for (const entry of orderedByVisualPosition) {
      if (targetY < entry.rect.top) {
        insertBeforeCandidate = entry.candidate;
        break;
      }

      if (targetY <= entry.rect.bottom && targetX < (entry.rect.left + entry.rect.width / 2)) {
        insertBeforeCandidate = entry.candidate;
        break;
      }
    }

    if (insertBeforeCandidate) {
      applyPlaceholderTarget(parent, insertBeforeCandidate);
    } else {
      applyPlaceholderTarget(parent, null);
    }
  };

  const scheduleDragFrame = () => {
    if (!isDragging || dragFrameId !== null) return;
    dragFrameId = window.requestAnimationFrame(() => {
      dragFrameId = null;
      if (!isDragging) return;
      container.style.left = `${currentX - dragOffsetX}px`;
      container.style.top = `${currentY - dragOffsetY}px`;
      movePlaceholder();
    });
  };

  const startPointerDrag = (event) => {
    if (isDragDisabled()) return;
    if (event.pointerType === "touch") return;
    if (event.button !== 0) return;
    if (event.target.closest(interactiveSelector)) return;
    if (isPointerDown) return;

    isPointerDown = true;
    isDragging = false;
    isTouchPointer = event.pointerType === "touch";
    touchHoldReady = !isTouchPointer;
    activeInputType = "pointer";
    startX = event.clientX;
    startY = event.clientY;
    currentX = event.clientX;
    currentY = event.clientY;
    pointerId = event.pointerId;

    clearHoldTimer();

    if (typeof header.setPointerCapture === "function") {
      try {
        header.setPointerCapture(pointerId);
      } catch (_) {
        // Ignore capture failures; document listeners still handle the drag.
      }
    }

    if (isTouchPointer) {
      holdTimerId = window.setTimeout(() => {
        holdTimerId = null;
        touchHoldReady = true;
      }, touchHoldDelayMs);
    }

    moveHandler = (moveEvent) => {
      if (!isPointerDown || moveEvent.pointerId !== pointerId) return;

      currentX = moveEvent.clientX;
      currentY = moveEvent.clientY;

      if (!isDragging) {
        const dx = currentX - startX;
        const dy = currentY - startY;
        const movedDistance = Math.hypot(dx, dy);

        if (isTouchPointer && !touchHoldReady) {
          if (movedDistance >= contactMoveCancelThreshold) {
            cancelPendingDragAttempt();
          }
          return;
        }

        if (movedDistance >= 8) {
          beginDrag();
        }
      }

      if (isDragging) {
        moveEvent.preventDefault();
        scheduleDragFrame();
      }
    };

    endHandler = (endEvent) => {
      if (!isPointerDown || endEvent.pointerId !== pointerId) return;
      finishDrag();
    };

    document.addEventListener("pointermove", moveHandler, true);
    document.addEventListener("pointerup", endHandler, true);
    document.addEventListener("pointercancel", endHandler, true);
  };

  const startTouchDrag = (event) => {
    if (isDragDisabled()) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    if (event.target.closest(interactiveSelector)) return;
    if (isPointerDown) return;

    isPointerDown = true;
    isDragging = false;
    isTouchPointer = true;
    touchHoldReady = false;
    activeInputType = "touch";
    startX = touch.clientX;
    startY = touch.clientY;
    currentX = touch.clientX;
    currentY = touch.clientY;
    touchId = touch.identifier;
    pointerId = null;

    clearHoldTimer();
    holdTimerId = window.setTimeout(() => {
      holdTimerId = null;
      touchHoldReady = true;
    }, touchHoldDelayMs);

    moveHandler = (moveEvent) => {
      if (!isPointerDown) return;

      const activeTouch = Array.from(moveEvent.touches || []).find((item) => item.identifier === touchId);
      if (!activeTouch) return;

      currentX = activeTouch.clientX;
      currentY = activeTouch.clientY;
      const dx = currentX - startX;
      const dy = currentY - startY;
      const movedDistance = Math.hypot(dx, dy);

      if (!isDragging) {
        if (!touchHoldReady) {
          if (movedDistance >= contactMoveCancelThreshold) {
            cancelPendingDragAttempt();
          }
          return;
        }

        if (!moveEvent.cancelable) {
          cancelPendingDragAttempt();
          return;
        }

        moveEvent.preventDefault();

        if (movedDistance >= 8) {
          beginDrag();
        }
      }

      if (isDragging) {
        if (moveEvent.cancelable) moveEvent.preventDefault();
        scheduleDragFrame();
      }
    };

    endHandler = (endEvent) => {
      const changed = Array.from(endEvent.changedTouches || []);
      if (!isPointerDown || !changed.some((item) => item.identifier === touchId)) return;
      finishDrag();
    };

    document.addEventListener("touchmove", moveHandler, { capture: true, passive: false });
    document.addEventListener("touchend", endHandler, true);
    document.addEventListener("touchcancel", endHandler, true);
  };

  header.addEventListener("pointerdown", startPointerDrag);
  header.addEventListener("touchstart", startTouchDrag, { passive: true });
}

// END OF FILE
