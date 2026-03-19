# extension Directory

## Folder Path

- extension

## Purpose

Browser extension source for background logic, UI pages, and manifest utilities.

## Subfolders

- ui/ (extension/ui)
- utils/ (extension/utils)

## Files Overview

| File | Type | Size | Lines | Notes |
|---|---|---:|---:|---|
| background.js | JavaScript source | 39.54 KB | 1170 | Executable logic/module code. |

## Function and Class Reference

### background.js

- async function detectAndSetAPI() (line 21)
- function normalizeUrl(url) (line 46)
- async function tabExists(tabId) (line 59)
- async function initializeExtension() (line 124)
- async function performManualScan(url, tabId) (line 177)
- async function clearAllBlockingRules() (line 204)
- async function redirectToScannerPage(tabId, originalUrl) (line 310)
- async function startURLScan(url, tabId) (line 373)
- async function pollForScanResults(scanId, url, tabId, attempt = 1) (line 469)
- async function showScanNotification(url, verdict, score, result) (line 574)
- async function testNotification(verdict = 'ALLOW') (line 616)
- async function getCompleteScanDetails(scanId) (line 639)
- async function completeScan(tabId, url, result) (line 681)
- async function redirectToWarningPage(tabId, url, verdict, score, result) (line 756)
- async function handleGoBack(tabId) (line 885)
- async function handleProceedWithUrl(request, sender, sendResponse) (line 926)
- function handleBypassCheck(request, sendResponse) (line 991)
- async function handleProceedAnyway(request, sender, sendResponse) (line 1053)
- function calculateRiskLevel(safetyScore) (line 1086)
- function logDecision(url, verdict, score, details) (line 1099)
- function getColorByVerdictAndScore(verdict, safetyScore) (line 1142)
- function logBypass(url) (line 1156)
- async function testBackendConnection() (line 1191)


## Integration Notes

- Keep this README updated whenever files are added/removed or function signatures change.
- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.
- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.