# node-ml-bridge Directory

## Folder Path

- node-ml-bridge

## Purpose

Bridge service connecting Node backend requests to Python ML inference logic.

## Subfolders

- No direct subfolders.

## Files Overview

| File | Type | Size | Lines | Notes |
|---|---|---:|---:|---|
| feature_bridge.js | JavaScript source | 0 KB | 0 | Executable logic/module code. |
| ml_service.js | JavaScript source | 8.86 KB | 278 | Executable logic/module code. |
| package.json | JSON data/config | 0 KB | 0 | Configuration or structured data. |

## Function and Class Reference

### feature_bridge.js

- No function/class signatures were detected in this file.

### ml_service.js

Dependencies/imports detected:
- require 'child_process'
- require 'fs'
- require 'path'

- class MLService (line 6)
- async method initialize() (line 23)
- async method checkPythonEnvironment() (line 42)
- async method loadModels() (line 64)
- async method predictUrl(features) (line 99)
- async method predictFile(fileFeatures) (line 184)
- method prepareFeatureArray(features, modelType) (line 194)
- method executePython(code, inputData) (line 210)
- method fallbackPrediction(features) (line 239)
- method extractTopFeatures(features) (line 265)
- async method getModelInfo() (line 279)


## Integration Notes

- Keep this README updated whenever files are added/removed or function signatures change.
- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.
- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.