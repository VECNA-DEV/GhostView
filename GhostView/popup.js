const toggle = document.getElementById('masterToggle');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Ask background for current state
chrome.runtime.sendMessage({ type: 'getState' }, (response) => {
    if (response) {
        toggle.checked = response.enabled;
        updateUI(response.enabled);
    }
});

// Toggle handler — tell background to save
toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.runtime.sendMessage({ type: 'setState', enabled: enabled }, (response) => {
        if (response && response.success) {
            updateUI(response.enabled);
        }
    });
});

function updateUI(enabled) {
    statusDot.style.backgroundColor = enabled ? '#22c55e' : '#ef4444';
    statusDot.style.boxShadow = enabled ? '0 0 8px #22c55e' : '0 0 8px #ef4444';
    statusText.textContent = enabled ? 'Extension Active' : 'Extension Disabled';
}

const resetSubsBtn = document.getElementById('resetSubsBtn');
resetSubsBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'reset_subtitles' })
                .catch(err => console.log("GhostView: Could not send reset message."));
        }
    });
});
