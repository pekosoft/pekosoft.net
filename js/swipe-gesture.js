function attachSwipeNavigation(scope, navigate) {
  let startX = null;
  let startY = null;
  let pointerId = null;
  let swipeLocked = false;
  let swipeHorizontal = false;

  const lockThreshold = 16;
  const commitThreshold = 75;

  function resetSwipe() {
    startX = null;
    startY = null;
    pointerId = null;
    swipeLocked = false;
    swipeHorizontal = false;
  }

  if (scope !== document) {
    scope.style.touchAction = "pan-y";
  }

  scope.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target;
    const excluded = "a, button, input, textarea, select, canvas, table, [onclick], [role='button'], .no-swipe";
    if (target.isContentEditable || target.closest(excluded)) {
      resetSwipe();
      return;
    }

    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;

    if (typeof scope.setPointerCapture === "function") {
      try {
        scope.setPointerCapture(pointerId);
      } catch (error) {
        // A pointer may have ended before capture was requested.
        if (error.name !== "NotFoundError") throw error;
      }
    }
  });

  scope.addEventListener("pointermove", (event) => {
    if (startX === null || startY === null) return;
    if (event.pointerId !== pointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!swipeLocked) {
      if (Math.abs(deltaX) < lockThreshold && Math.abs(deltaY) < lockThreshold) return;
      swipeLocked = true;
      swipeHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (swipeHorizontal) event.preventDefault();
  });

  scope.addEventListener("pointerup", (event) => {
    if (startX === null || startY === null) return;
    if (event.pointerId !== pointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    const committed = swipeHorizontal
      && Math.abs(deltaX) > Math.abs(deltaY)
      && Math.abs(deltaX) > commitThreshold;
    resetSwipe();

    if (committed) navigate(deltaX > 0 ? "backward" : "forward");
  });

  scope.addEventListener("pointercancel", (event) => {
    if (event.pointerId === pointerId) resetSwipe();
  });

  scope.addEventListener("lostpointercapture", (event) => {
    if (event.pointerId === pointerId) resetSwipe();
  });
}

// END OF FILE
