(() => {
  "use strict";

  // =========================
  // CONFIG
  // =========================

  const SCAN_INTERVAL = 500;
  const INACTIVITY_TIME = 1500;
  const FINAL_DELAY = 100;

  // =========================
  // STATE
  // =========================

  let enabled = false;

  let scanTimer = null;
  let finalDelayTimer = null;

  let lastUserActionTime = 0;

  // =========================
  // LOAD INITIAL STATE
  // =========================

  chrome.storage.local.get("enabled", (result) => {
    enabled = result.enabled ?? true;

    if (enabled) {
      start();
    }
  });

  // =========================
  // ON / OFF MESSAGE
  // =========================

  chrome.runtime.onMessage.addListener((message) => {
    if (!message) return;

    if (message.type !== "AUTO_SUBMIT_STATE_CHANGED") {
      return;
    }

    if (message.enabled) {
      start();
    } else {
      stop();
    }
  });

  // =========================
  // START
  // =========================

  function start() {
    // Make sure we don't create
    // duplicate intervals/listeners.
    stop();

    enabled = true;

    // Don't immediately submit an already-existing message.
    lastUserActionTime = performance.now();

    document.addEventListener("input", handleUserActivity, true);

    document.addEventListener("paste", handleUserActivity, true);

    document.addEventListener("keydown", handleUserActivity, true);

    // Scan every 500ms.
    scanTimer = setInterval(scan, SCAN_INTERVAL);
  }

  // =========================
  // STOP
  // =========================

  function stop() {
    enabled = false;

    if (scanTimer !== null) {
      clearInterval(scanTimer);

      scanTimer = null;
    }

    if (finalDelayTimer !== null) {
      clearTimeout(finalDelayTimer);

      finalDelayTimer = null;
    }

    document.removeEventListener("input", handleUserActivity, true);

    document.removeEventListener("paste", handleUserActivity, true);

    document.removeEventListener("keydown", handleUserActivity, true);
  }

  // =========================
  // USER ACTIVITY
  // =========================

  function handleUserActivity(event) {
    if (!enabled) {
      return;
    }

    // Ignore clicks/keyboard activity outside
    // the ChatGPT composer.
    if (!isComposer(event.target)) {
      return;
    }

    // Store ONLY the time.
    //
    // We do not inspect:
    // value
    // innerText
    // textContent
    // message contents
    lastUserActionTime = performance.now();

    // User started interacting again,
    // so cancel pending final click.
    if (finalDelayTimer !== null) {
      clearTimeout(finalDelayTimer);

      finalDelayTimer = null;
    }
  }

  // =========================
  // 500ms SCANNER
  // =========================

  function scan() {
    if (!enabled) {
      return;
    }

    // Search for the current Send button.
    const button = findSubmitButton();

    if (!button) {
      return;
    }

    // How long since the user last acted?
    const inactiveFor = performance.now() - lastUserActionTime;

    // Need at least 800ms inactivity.
    if (inactiveFor < INACTIVITY_TIME) {
      return;
    }

    // Don't create multiple 100ms timers.
    if (finalDelayTimer !== null) {
      return;
    }

    // Final 100ms delay.
    finalDelayTimer = setTimeout(() => {
      finalDelayTimer = null;

      if (!enabled) {
        return;
      }

      // Check inactivity one more time.
      if (performance.now() - lastUserActionTime < INACTIVITY_TIME) {
        return;
      }

      // IMPORTANT:
      //
      // ChatGPT is an SPA.
      // The original button may have been
      // replaced during those 100ms.
      //
      // Therefore search again.
      const currentButton = findSubmitButton();

      if (!currentButton) {
        return;
      }

      if (currentButton.disabled) {
        return;
      }

      if (currentButton.getAttribute("aria-disabled") === "true") {
        return;
      }

      // Finally click.
      currentButton.click();
    }, FINAL_DELAY);
  }

  // =========================
  // FIND SEND BUTTON
  // =========================

  function findSubmitButton() {
    const buttons = document.querySelectorAll("button");

    for (const button of buttons) {
      // Ignore hidden buttons.
      if (!isVisible(button)) {
        continue;
      }

      // Ignore disabled buttons.
      if (button.disabled) {
        continue;
      }

      if (button.getAttribute("aria-disabled") === "true") {
        continue;
      }

      /*
       * IMPORTANT FOR SPA:
       *
       * We intentionally DON'T depend on:
       *
       * .some-generated-class
       * #some-generated-id
       * React internal structure
       *
       * Those can change after a ChatGPT update.
       *
       * aria-label/title are semantic attributes
       * and are much more appropriate here.
       */

      const ariaLabel = (button.getAttribute("aria-label") || "").toLowerCase();

      const title = (button.getAttribute("title") || "").toLowerCase();

      if (
        ariaLabel.includes("send") ||
        ariaLabel.includes("submit") ||
        title.includes("send") ||
        title.includes("submit")
      ) {
        return button;
      }
    }

    return null;
  }

  // =========================
  // VISIBILITY
  // =========================

  function isVisible(element) {
    const style = window.getComputedStyle(element);

    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      return false;
    }

    const rect = element.getBoundingClientRect();

    return rect.width > 0 && rect.height > 0;
  }

  // =========================
  // COMPOSER DETECTION
  // =========================

  function isComposer(element) {
    if (!element) {
      return false;
    }

    // Textarea
    if (element instanceof HTMLTextAreaElement) {
      return true;
    }

    // Contenteditable
    if (element instanceof HTMLElement && element.isContentEditable) {
      return true;
    }

    return false;
  }
})();
