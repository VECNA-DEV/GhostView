// background.js - State Manager

let ghostviewEnabled = false; // Master toggle (default: OFF)

// Load state on startup
chrome.storage.local.get('ghostviewEnabled', (data) => {
  if (data.ghostviewEnabled !== undefined) {
    ghostviewEnabled = data.ghostviewEnabled;
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getState') {
    sendResponse({ enabled: ghostviewEnabled });
  }
  else if (msg.type === 'setState') {
    ghostviewEnabled = msg.enabled;
    chrome.storage.local.set({ ghostviewEnabled: msg.enabled });

    // Broadcast to all content scripts
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'stateChanged',
          enabled: ghostviewEnabled
        }).catch(() => { });
      });
    });

    sendResponse({ success: true, enabled: ghostviewEnabled });
  }
  return true; // keep channel open for async response
});

// Also handle the Alt+G command
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-ghost") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggle_ghost" })
        .catch(err => console.log("GhostView: Could not send message."));
    });
  }
});