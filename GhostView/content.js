// content.js - V17 (Master Toggle)

let isExtensionEnabled = false; // Master on/off (controlled from popup)
let isGhostActive = false;
let isKillSwitchEngaged = false;
let isSubDragMode = false;
let isDragging = false;
let subOffset = null;
let styleSheet = document.createElement("style");

// Load master toggle state — use chrome.storage directly (most reliable)
chrome.storage.local.get('ghostviewEnabled', (data) => {
    isExtensionEnabled = data.ghostviewEnabled === true;
});

// Listen for real-time toggle changes (two methods for max reliability)

// Method 1: storage change events
chrome.storage.onChanged.addListener((changes) => {
    if (changes.ghostviewEnabled) {
        isExtensionEnabled = changes.ghostviewEnabled.newValue;
        if (!isExtensionEnabled && isGhostActive) {
            isGhostActive = false;
            disableGhost();
        }
        if (!isExtensionEnabled && isSubDragMode) {
            exitSubDragMode();
        }
    }
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'stateChanged') {
        isExtensionEnabled = msg.enabled;
        if (!isExtensionEnabled && isGhostActive) {
            isGhostActive = false;
            disableGhost();
        }
        if (!isExtensionEnabled && isSubDragMode) {
            exitSubDragMode();
        }
    }
    if (msg.action === 'reset_subtitles') {
        resetSubtitles();
    }
});

// 1. THE VISUAL BLINDERS (CSS)
styleSheet.innerHTML = `
    /* HIDE CURSOR GLOBAL */
    html, body, video, iframe, div, span {
        cursor: none !important;
    }

    /* --- 1. BOTTOM CONTROLS --- */
    
    /* COMMON BACKGROUND BLENDS (Global overlays) */
    [class*="overlay"],

    /* NETFLIX */
    [data-uia*="controls"],
    [data-uia="player-scrubber"],
    [data-uia="control-nav-back"],
    .watch-video--bottom-controls-container,
    .watch-video--back-container,
    .watch-video--flag-container,
    [data-uia="player-back-to-browsing"],
    [data-uia="flag-container"],

    /* HBO MAX */
    [data-testid="playback_controls"],
    [class*="AutohiderContainer"],
    [class*="ControlsContainer"],
    [data-testid="control_footer"],
    [class*="ControlsFooter"],

    /* YOUTUBE & GENERIC PLAYERS */
    [class*="controls"], [class*="Controls"],
    [class*="control-bar"], [class*="ControlBar"],
    [class*="ytp-chrome"], 
    [class*="PlayerControls"], 
    [class*="bottom-controls"],
    button[aria-label="Back to Browse"],
    .top-left-controls,
    .top-right-controls {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
    }

    /* --- 2. SUBTITLE FIX (The Sweet Spot) --- */
    
    /* NETFLIX */
    .player-timedtext {
        inset: 0px !important;
        top: 0px !important;
        bottom: 0px !important;
        left: 0px !important;
        right: 0px !important;
        height: 100% !important;
        width: 100% !important;
    }
    .player-timedtext-text-container {
        bottom: 75px !important;
        top: auto !important;     
    }
    .image-based-timed-text-container {
        bottom: 75px !important;
        top: auto !important;
    }

    /* HBO MAX — HARD-LOCK SUBTITLE POSITION */
    /* position: fixed = completely detached from HBO's layout flow. */
    /* No layout shifts from hiding the playback bar can move these. */

    [class*="CaptionWindow"] {
        position: fixed !important;
        bottom: 60px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        top: auto !important;
        right: auto !important;
        margin: 0 !important;
        z-index: 2147483646 !important;
    }

    /* PROTECT SUBTITLES from the [class*="overlay"] hide rule */
    [data-testid="caption_renderer_overlay"],
    [data-testid="caption_renderer_overlay"] *,
    [class*="CaptionWindow"],
    [class*="CaptionWindow"] * {
        opacity: 1 !important;
        visibility: visible !important;
    }
`;

// 2. THE EVENT SHIELD
const killEvent = (e) => {
    if (!isGhostActive || isKillSwitchEngaged) return;
    if (e.type.startsWith("key")) return;
    if (isSubDragMode) return;

    e.stopImmediatePropagation();
    e.stopPropagation();
};

const eventTypes = [
    'mousemove', 'mouseover', 'mouseenter', 'mouseout',
    'mousedown', 'mouseup', 'wheel',
    'pointermove', 'pointerover', 'pointerenter',
    'touchmove', 'touchstart'
];

// 3. KEYBOARD LISTENER
document.addEventListener('keydown', function (e) {
    // Master kill — if extension is disabled, do nothing
    if (!isExtensionEnabled) return;

    const activeTag = document.activeElement.tagName.toLowerCase();
    const isEditable = document.activeElement.isContentEditable;
    if (activeTag === 'input' || activeTag === 'textarea' || isEditable) return;

    // ARROW KEYS (Forward/Backward)
    if (isGhostActive) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const video = document.querySelector('video');
            if (video) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (e.key === 'ArrowRight') {
                    video.currentTime += 10;
                } else if (e.key === 'ArrowLeft') {
                    video.currentTime -= 10;
                }
            }
        }
    }

    // TOGGLE (Alt + O)
    if (e.altKey && (e.key === 'o' || e.key === 'O')) {
        if (isKillSwitchEngaged) {
            showNotification("❌ Kill Switch Active. Refresh page to reset.");
            return;
        }
        isGhostActive = !isGhostActive;
        if (isGhostActive) enableGhost();
        else disableGhost();
    }

    // KILL SWITCH (K)
    if (e.key === 'k' || e.key === 'K') {
        if (!isGhostActive) return;
        isKillSwitchEngaged = true;
        isGhostActive = false;
        disableGhost();
        showNotification("💀 KILL SWITCH ACTIVATED.");
    }

    // SUBTITLE DRAG MODE (Alt + S)
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
        if (!isGhostActive) {
            showNotification("⚠️ Enable Ghost Mode first (Alt+O)");
            return;
        }
        if (isSubDragMode) {
            exitSubDragMode();
        } else {
            enterSubDragMode();
        }
    }
});

function enableGhost() {
    document.head.appendChild(styleSheet);
    eventTypes.forEach(type => window.addEventListener(type, killEvent, true));
    showNotification("👻 Ghost Mode: ON");
}

function disableGhost() {
    if (document.head.contains(styleSheet)) document.head.removeChild(styleSheet);
    eventTypes.forEach(type => window.removeEventListener(type, killEvent, true));
    if (!isKillSwitchEngaged) showNotification("Ghost Mode: OFF");
}

function showNotification(text) {
    const div = document.createElement("div");
    div.innerText = text;
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.left = "10px";
    div.style.zIndex = "2147483647";
    div.style.padding = "10px 20px";
    div.style.background = text.includes("KILL") ? "rgba(200, 0, 0, 0.9)" : "rgba(0,0,0,0.9)";
    div.style.color = "#fff";
    div.style.fontFamily = "monospace";
    div.style.borderRadius = "5px";
    div.style.fontSize = "16px";
    div.style.pointerEvents = "none";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

// ============================================================
// 4. SUBTITLE DRAG SYSTEM (HBO Max)
// ============================================================
// Target: [class*="CaptionWindow"] — the ACTUAL subtitle box
// NOT [data-testid="caption_renderer_overlay"] (that's a full-
// screen transparent overlay with display:inline — transforms
// have no effect on inline elements).
// ============================================================

const SUB_SELECTOR = '[class*="CaptionWindow"]';

// Drag-mode stylesheet
const dragModeStyle = document.createElement("style");
dragModeStyle.innerHTML = `
    /* Show cursor during subtitle drag mode */
    html, body, video, iframe, div, span {
        cursor: default !important;
    }
    /* Keep HBO Max controls hidden during drag */
    [data-testid="playback_controls"],
    [class*="AutohiderContainer"],
    [class*="ControlsContainer"],
    [data-testid="control_footer"],
    [class*="ControlsFooter"] {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
    }
    /* Make the CaptionWindow AND its children grabbable */
    ${SUB_SELECTOR},
    ${SUB_SELECTOR} * {
        cursor: grab !important;
        pointer-events: auto !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        opacity: 1 !important;
        visibility: visible !important;
    }
    ${SUB_SELECTOR}:active,
    ${SUB_SELECTOR} *:active {
        cursor: grabbing !important;
    }
    /* Visual indicator */
    ${SUB_SELECTOR} {
        outline: 2px dashed rgba(45, 212, 191, 0.6) !important;
        outline-offset: 4px !important;
        border-radius: 8px !important;
    }
    /* Ensure the overlay container allows pointer events through */
    [data-testid="caption_renderer_overlay"],
    [data-testid="caption_renderer_overlay"] * {
        pointer-events: auto !important;
    }
`;

// Dynamic position stylesheet — survives React re-renders
const subPositionStyle = document.createElement("style");
subPositionStyle.id = "ghostview-sub-position";

function updateSubPosition(x, y) {
    // Use fixed top/left instead of transform — immune to layout shifts
    subPositionStyle.innerHTML = `
        ${SUB_SELECTOR} {
            position: fixed !important;
            top: ${y}px !important;
            left: ${x}px !important;
            bottom: auto !important;
            right: auto !important;
            transform: none !important;
        }
    `;
    if (!document.head.contains(subPositionStyle)) {
        document.head.appendChild(subPositionStyle);
    }
    subOffset = { x, y };
}

function enterSubDragMode() {
    isSubDragMode = true;
    document.head.appendChild(dragModeStyle);
    attachDragListeners();
    showNotification("🎯 Subtitle Drag Mode: ON — Grab & move subtitles");
}

function exitSubDragMode() {
    isSubDragMode = false;
    isDragging = false;
    if (document.head.contains(dragModeStyle)) document.head.removeChild(dragModeStyle);
    detachDragListeners();
    showNotification("🔒 Subtitles locked in place");
}

// --- Drag handlers ---
let dragStartX = 0, dragStartY = 0;
let dragStartOffsetX = 0, dragStartOffsetY = 0;

function onDragMouseDown(e) {
    let sub = e.target.closest(SUB_SELECTOR);
    if (!sub) {
        sub = document.querySelector(SUB_SELECTOR);
        if (sub) {
            const rect = sub.getBoundingClientRect();
            const inBounds = e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom;
            if (!inBounds) sub = null;
        }
    }
    if (!sub) return;

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    // For fixed positioning, read current viewport position
    if (subOffset) {
        dragStartOffsetX = subOffset.x;
        dragStartOffsetY = subOffset.y;
    } else {
        // First drag — read from current bounding rect (viewport coords)
        const rect = sub.getBoundingClientRect();
        dragStartOffsetX = rect.left;
        dragStartOffsetY = rect.top;
    }

    e.preventDefault();
    e.stopImmediatePropagation();
}

function onDragMouseMove(e) {
    if (!isDragging) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    // Direct viewport coordinates for position: fixed
    const newLeft = dragStartOffsetX + dx;
    const newTop = dragStartOffsetY + dy;

    updateSubPosition(newLeft, newTop);

    e.preventDefault();
    e.stopImmediatePropagation();
}

function onDragMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;

    exitSubDragMode();

    e.preventDefault();
    e.stopImmediatePropagation();
}

function attachDragListeners() {
    window.addEventListener('mousedown', onDragMouseDown, true);
    window.addEventListener('mousemove', onDragMouseMove, true);
    window.addEventListener('mouseup', onDragMouseUp, true);
}

function detachDragListeners() {
    window.removeEventListener('mousedown', onDragMouseDown, true);
    window.removeEventListener('mousemove', onDragMouseMove, true);
    window.removeEventListener('mouseup', onDragMouseUp, true);
}

function resetSubtitles() {
    if (document.head.contains(subPositionStyle)) {
        document.head.removeChild(subPositionStyle);
    }
    subOffset = null;
    showNotification("🔄 Subtitles reset to default position");
}