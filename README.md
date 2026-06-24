<p align="center">
  <img src="GhostView/Main-Logo/GhostView.png" width="128" height="128" alt="GhostView Logo">
</p>

<h1 align="center">GhostView - Anti Drift</h1>

A lightweight Manifest V3 Chrome Extension designed to fix mouse drift and accidental UI popups on streaming sites (like **Netflix** and **HBO Max**) by force-hiding the cursor, playback controls, and overlays, while maintaining clean subtitle support.

---

## ✨ Features

* **Anti-Drift Shield (Ghost Mode):** Intercepts and blocks mouse, scroll, pointer, and touch events when active. This stops player interfaces from popping up due to minor cursor drift or vibrations.
* **Invisible UI & Cursor:** Forcefully hides the mouse cursor and playback menus on Netflix, HBO Max, YouTube, and generic HTML5 players.
* **Smart Subtitle Lock:** Automatically adjusts subtitle container positioning so that subtitles remain visible and positioned correctly when player controls are hidden.
* **Subtitle Drag Mode (HBO Max):** Lets you press a hotkey to unlock, grab, drag, and reposition subtitles anywhere on your screen. The offset persists across player re-renders.
* **Emergency Kill Switch:** A single keypress disables Ghost Mode instantly and returns control of the page in case you need to interact with player elements.
* **Master Power Switch:** Toggle the extension on or off globally from the extension popup.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`Alt + O`** | Toggle Ghost Mode | Hides cursor and streaming controls, activates event shield. |
| **`Alt + S`** | Subtitle Drag Mode | (Ghost Mode must be ON) Unlocks subtitles for dragging. Press again to lock. |
| **`Alt + G`** | Global Toggle | Browser-wide hotkey to toggle Ghost Mode on the active tab. |
| **`K`** | Emergency Reset | Instantly deactivates Ghost Mode and event shielding (Kill Switch). |
| **`Arrow Left / Right`** | Video Seek | Seeks 10 seconds back/forward direct on the video player when Ghost Mode is active. |

---

## 🚀 Installation (Load Unpacked)

Since this extension is optimized for manual installation:

1. Download or clone this repository to your local machine.
2. Open Google Chrome (or any Chromium-based browser) and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle switch in the top right corner).
4. Click on the **Load unpacked** button in the top left corner.
5. Select the folder containing these extension files (the directory with `manifest.json`).
6. Pin **GhostView** to your extensions bar for easy access to the help menu and power toggle.

---

## 📁 File Structure

* `manifest.json` — Extension configuration, permissions, and command bindings.
* `background.js` — Service worker that handles global state storage and command routing.
* `content.js` — Injectable script executing the event shield, UI hiding, and subtitle dragging logic.
* `popup.html` / `popup.js` — Modern, dark-themed popup showing shortcut references and the master switch.
* `icons/` — Properly scaled icons (16, 48, 128) used by Chrome for the toolbar and extensions manager.
* `Main-Logo/` — Contains the high-resolution original source logos (`GhostView.png` and `icon.png`).
* `MAIN-UI-LOGO/` — Contains the layered assets for the animated popup menu.
