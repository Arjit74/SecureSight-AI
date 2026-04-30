# js Directory

## Folder Path

- AI_Agent_Bot/static/js

## Purpose

Client-side JavaScript for UI interactions and real-time updates.

## Subfolders

- No direct subfolders.

## Files Overview

| File | Type | Size | Lines | Notes |
|---|---|---:|---:|---|
| animations.js | JavaScript source | 9.82 KB | 334 | Executable logic/module code. |
| app.js | JavaScript source | 49.03 KB | 1261 | Executable logic/module code. |
| app-realtime.js | JavaScript source | 20.57 KB | 492 | Executable logic/module code. |

## Function and Class Reference

### animations.js

- function updateParallax() (line 29)
- function animateCounter(element, target, duration = 2000) (line 49)
- function createRipple(event) (line 95)
- function createParticle(x, y) (line 150)
- function pulseItem(itemId) (line 188)
- function showModal() (line 204)
- function hideModal() (line 214)
- function typeEffect(element, text, speed = 100) (line 253)
- function type() (line 257)
- function showNotification(message, type = 'info') (line 316)

### app.js

- function showToast(message, duration = 3000) (line 34)
- function applyTheme(theme) (line 42)
- function animateThemeSwitch() (line 52)
- function buildClientReport(item) (line 60)
- function downloadBlob(blob, filename) (line 97)
- async function exportReport(item) (line 108)
- async function pollData() (line 142)
- function stopPolling() (line 200)
- function startPolling() (line 207)
- function setLiveMode(isRunning) (line 213)
- function applyReloadInterval(seconds) (line 229)
- function updateFeedItems(items) (line 248)
- function createItemElement(item) (line 273)
- function updateItemElement(itemElement, item) (line 353)
- function updateModalContent(item) (line 442)
- function updateClock() (line 447)
- function getRiskLevel(stats) (line 452)
- function generateFinalVerdict(stats) (line 462)
- function getVTStatusDescription(status) (line 509)
- function getAnalysisNarrative(status, stats) (line 522)
- function formatBytes(bytes) (line 549)
- function buildPlainReport(item, vtStats) (line 565)
- function openModal(item) (line 624)
- function updateStats(items) (line 858)
- function initExistingItemClicks() (line 893)
- function animateValue(id, newValue) (line 906)
- function filterItems() (line 935)
- async function uploadFile() (line 1049)
- function hideSuggestions() (line 1273)
- function renderSuggestions(list) (line 1279)
- function scheduleSuggestions(query) (line 1307)

### app-realtime.js

- async function pollData() (line 18)
- function updateFeedItems(items) (line 42)
- function createItemElement(item) (line 64)
- function updateItemElement(itemElement, item) (line 119)
- function updateModalContent(item) (line 162)
- function updateClock() (line 167)
- function getRiskLevel(stats) (line 172)
- function getVTStatusDescription(status) (line 182)
- function openModal(item) (line 195)
- function updateStats(items) (line 360)
- async function uploadFile() (line 418)


## Integration Notes

- Keep this README updated whenever files are added/removed or function signatures change.
- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.
- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.