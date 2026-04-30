# Model Training Directory

## Folder Path

- Model Training

## Purpose

Standalone/legacy model training workspace and related scripts.

## Subfolders

- data/ (Model Training/data)

## Files Overview

| File | Type | Size | Lines | Notes |
|---|---|---:|---:|---|
| gitignore |  file | 0.37 KB | - | Project artifact file. |
| train_malware_model.py | Python source | 15.36 KB | 374 | Python implementation script. |

## Function and Class Reference

### train_malware_model.py

Dependencies/imports detected:
- from __future__ import annotations
- from dataclasses import dataclass
- from lightgbm import LGBMClassifier
- from pathlib import Path
- from sklearn.ensemble import RandomForestClassifier
- from sklearn.metrics import (
- from sklearn.preprocessing import StandardScaler
- from xgboost import XGBClassifier
- import joblib
- import numpy as np
- import time

- class WeightedEnsembleModel (line 30)


## Integration Notes

- Keep this README updated whenever files are added/removed or function signatures change.
- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.
- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.