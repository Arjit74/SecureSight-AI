# ui Directory

## Folder Path

- extension/ui

## Purpose

Extension dashboard/scanner/report/warning UI pages and scripts.

## Subfolders

- No direct subfolders.

## Files Overview

| File | Type | Size | Lines | Notes |
|---|---|---:|---:|---|
| dashboard.html | HTML template | 21.14 KB | 785 | Template/view markup. |
| dashboard.js | JavaScript source | 21.55 KB | 654 | Executable logic/module code. |
| report.css | Stylesheet | 24.8 KB | 998 | Presentation and visual styling. |
| report.html | HTML template | 50.05 KB | 1291 | Template/view markup. |
| report.js | JavaScript source | 41.76 KB | 1078 | Executable logic/module code. |
| report1.html | HTML template | 43.14 KB | 1056 | Template/view markup. |
| scanner.html | HTML template | 14.87 KB | 465 | Template/view markup. |
| scanner.js | JavaScript source | 15.71 KB | 444 | Executable logic/module code. |
| TEST_REPORT.md | Documentation | 1.51 KB | 30 | Documentation content. |
| warning.html | HTML template | 19.45 KB | 572 | Template/view markup. |
| warning.js | JavaScript source | 21.79 KB | 610 | Executable logic/module code. |

## Function and Class Reference

### dashboard.js

- function injectModalIconStyles() (line 7)
- function setupEventListeners() (line 44)
- function setupFilterListener() (line 76)
- function setupStorageListener() (line 87)
- async function loadLogs() (line 97)
- function updateUI(logs) (line 128)
- function displayLogs(logs) (line 163)
- function createLogRowElement(log) (line 202)
- function showLogDetails(log) (line 295)
- function createDetailRow(label, value) (line 507)
- function closeDetailModal() (line 530)
- function clearAllLogs() (line 538)
- function exportLogs() (line 548)
- async function generateSecurityReport() (line 564)
- function extractDomain(url) (line 599)
- function getScoreColor(safetyScore, verdict) (line 609)
- function getContrastColor(hexColor) (line 622)
- function adjustColorBrightness(hex, percent) (line 635)
- function formatTime(timestamp) (line 650)
- function formatDateTime(timestamp) (line 666)

### report.js

- function setupModalListeners() (line 44)
- async function initializeReport() (line 57)
- function showLibraryError() (line 85)
- function showError(message) (line 103)
- function setupEventListeners() (line 119)
- async function loadReportData() (line 139)
- async function renderReport() (line 179)
- function getReportPeriod() (line 199)
- function updateExecutiveSummary() (line 211)
- function animateCounter(element, target, duration, suffix = '') (line 244)
- function updateStatistics() (line 264)
- function renderCharts() (line 305)
- function renderTimelineChart() (line 339)
- function renderVerdictChart() (line 458)
- function renderRiskChart() (line 570)
- function getTimelineData() (line 660)
- function renderThreats() (line 693)
- function updateAnalysisCards() (line 776)
- async function exportToPDF() (line 813)
- async function exportWithHtml2Canvas() (line 853)
- async function exportWithTextOnly() (line 892)
- function showAIAnalysis() (line 947)
- function performDeepAnalysis() (line 982)
- function displayAnalysisResults(analysis) (line 1005)
- function closeAIAnalysis() (line 1043)
- function showEmptyState() (line 1053)
- function extractDomain(url) (line 1075)
- function getScore(log) (line 1083)
- function generateDemoData() (line 1089)

### scanner.js

- function escapeHTML(text) (line 7)
- function calculateRiskLevel(safetyScore) (line 19)
- async function initializeScanner() (line 35)
- function initializePhases() (line 83)
- function setProgressTo(percentage) (line 118)
- function updateProgressLabel() (line 127)
- function addThreat(severity, category, description, impact) (line 137)
- function displayThreats() (line 148)
- function showEducationalWarning(verdict, threats) (line 173)
- function setupProceedButton(url, tabId) (line 228)
- function startProgressAnimation() (line 283)
- function updatePhase(phaseId, status, message = '') (line 299)
- function simulateInitialPhases() (line 328)
- function setupMessageListener(tabId, url) (line 350)
- function handleScanUpdate(request) (line 373)
- function handleScanComplete(request) (line 404)

### warning.js

- function debugLog(...args) (line 7)
- async function detectAPI() (line 23)
- function calculateRiskLevel(safetyScore) (line 45)
- function getColorFromVerdict(verdict, safetyScore) (line 58)
- function getRiskIndicatorClass(verdict) (line 73)
- function getCheckIcon(checkName, status) (line 87)
- function formatCheckName(checkName) (line 104)
- function createSecurityCheckCard(checkName, checkData) (line 121)
- function createThreatBreakdownItem(threat, index) (line 191)
- function displaySecurityChecks(phases) (line 214)
- async function initWarning() (line 264)
- function setupEventListeners() (line 282)
- async function fetchDecisionData() (line 300)
- async function fetchCompleteScanDetails() (line 416)
- async function displayWarning() (line 456)
- function adjustColorBrightness(hex, percent) (line 596)
- function handleGoBack(e) (line 617)
- function handleProceed(e) (line 635)


## Integration Notes

- Keep this README updated whenever files are added/removed or function signatures change.
- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.
- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.