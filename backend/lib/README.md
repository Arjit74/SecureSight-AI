# lib Directory

## Folder Path

- backend/lib

## Purpose

Core backend modules for feature extraction, heuristics, score fusion, and decision logic.

## Subfolders

- No direct subfolders.

## Files Overview

| File | Type | Size | Lines | Notes |
|---|---|---:|---:|---|
| cacheManager.js | JavaScript source | 0 KB | 0 | Executable logic/module code. |
| decisionEngine.js | JavaScript source | 6.73 KB | 227 | Executable logic/module code. |
| featureExtractor.js | JavaScript source | 12.31 KB | 285 | Executable logic/module code. |
| heuristicsManager.js | JavaScript source | 7.71 KB | 198 | Executable logic/module code. |

## Function and Class Reference

### cacheManager.js

- No function/class signatures were detected in this file.

### decisionEngine.js

- class DecisionEngine (line 6)

### featureExtractor.js

- class URLFeatureExtractor (line 2)
- method extractFeatures(url) (line 3)
- method extractFeaturesFromString(url) (line 117)
- method calculateEntropy(str) (line 146)
- method calculateAvgEntropy(str) (line 163)
- method isCommonTLD(domain) (line 177)
- method isSuspiciousTLD(domain) (line 183)
- method getTLDType(domain) (line 189)
- method hasSuspiciousKeywords(url) (line 200)
- method containsBrandName(hostname) (line 211)
- method detectTyposquatting(domain) (line 221)
- method maxConsecutiveConsonants(str) (line 249)
- method maxConsecutiveDigits(str) (line 254)
- method hasRepeatedChars(str) (line 259)
- method charFrequencyStd(str) (line 263)
- method digitFrequencyStd(str) (line 275)
- method specialCharFrequencyStd(str) (line 288)

### heuristicsManager.js

Dependencies/imports detected:
- require 'fs'
- require 'path'

- function load() (line 8)
- function getAll() (line 24)
- function levenshtein(a = '', b = '') (line 29)
- function _isIp(hostname) (line 44)
- function evaluate(url, context = {}) (line 48)
- function validate() (line 199)


## Integration Notes

- Keep this README updated whenever files are added/removed or function signatures change.
- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.
- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.