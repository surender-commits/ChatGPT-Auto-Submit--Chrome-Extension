const DEFAULT_ENABLED = true;

// ================================
// INITIAL SETUP
// ================================

chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get("enabled");

  const enabled = result.enabled ?? DEFAULT_ENABLED;

  await chrome.storage.local.set({
    enabled,
  });

  updateIcon(enabled);
});

// ================================
// TOOLBAR ICON CLICK
// ================================

chrome.action.onClicked.addListener(async () => {
  const result = await chrome.storage.local.get("enabled");

  const currentState = result.enabled ?? DEFAULT_ENABLED;

  const newState = !currentState;

  // Save ON/OFF state
  await chrome.storage.local.set({
    enabled: newState,
  });

  // Change toolbar icon
  updateIcon(newState);

  // Tell all currently open ChatGPT tabs
  const tabs = await chrome.tabs.query({
    url: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  });

  for (const tab of tabs) {
    chrome.tabs
      .sendMessage(tab.id, {
        type: "AUTO_SUBMIT_STATE_CHANGED",
        enabled: newState,
      })
      .catch(() => {});
  }
});

// ================================
// UPDATE ICON
// ================================

function updateIcon(enabled) {
  chrome.action.setTitle({
    title: enabled ? "ChatGPT Auto Submit — ON" : "ChatGPT Auto Submit — OFF",
  });

  const iconPath = enabled ? "on.png" : "off.png";

  chrome.action.setIcon({
    path: iconPath,
  });
}
