# ml Directory

## Folder Path

- ml

## Purpose

Python ML package root with extraction, inference, and training components.

## Subfolders

- inference/ (ml/inference)
- training/ (ml/training)

## Files Overview

| File | Type | Size | Lines | Notes |
|---|---|---:|---:|---|
| feature_extractor.py | Python source | 3.89 KB | 101 | Python implementation script. |

## Function and Class Reference

### feature_extractor.py

Dependencies/imports detected:
- from urllib.parse import urlparse
- import numpy as np
- import re

- class URLFeatureExtractor (line 10)
- function __init__(self) (line 13)
- function extractFeatures(self, url) (line 16)
- function _is_ip(self, domain) (line 100)


## Integration Notes

- Keep this README updated whenever files are added/removed or function signatures change.
- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.
- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.