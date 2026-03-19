# training Directory

## Folder Path

- ml/training

## Purpose

Training scripts and data preparation for model development.

## Subfolders

- ml_training/ (ml/training/ml_training)

## Files Overview

| File | Type | Size | Lines | Notes |
|---|---|---:|---:|---|
| create_url_dataset.py | Python source | 22.04 KB | 525 | Python implementation script. |
| deep_learning_models.py | Python source | 24.1 KB | 636 | Python implementation script. |
| predict_god_level.py | Python source | 11.83 KB | 311 | Python implementation script. |
| requirements.txt | Text data | 0.3 KB | 15 | Project artifact file. |
| train_god_level_model.py | Python source | 21.69 KB | 531 | Python implementation script. |
| train_model.py | Python source | 24.09 KB | 636 | Python implementation script. |

## Function and Class Reference

### create_url_dataset.py

Dependencies/imports detected:
- from datetime import datetime, timedelta
- from urllib.parse import urlparse
- import io
- import json
- import numpy as np
- import os
- import pandas as pd
- import random
- import re
- import requests
- import time
- import warnings
- import zipfile

- class URLDatasetCreator (line 20)
- function __init__(self, output_dir='E:\gardian_link\SecureSight\datasets') (line 21)
- function fetch_phish_tank(self, limit=50000) (line 29)
- function fetch_urlhaus(self, limit=30000) (line 62)
- function fetch_openphish(self, limit=20000) (line 90)
- function fetch_malware_traffic_analysis(self, limit=10000) (line 111)
- function fetch_malware_domains(self, limit=20000) (line 135)
- function load_benign_urls(self, sources=None, limit=100000) (line 151)
- function validate_url(self, url) (line 204)
- function clean_url(self, url) (line 212)
- function augment_dataset(self, urls, label, augmentation_factor=2) (line 228)
- function extract_basic_features(self, url) (line 268)
- function create_dataset(self, malicious_limit=100000, benign_limit=100000) (line 288)
- function create_synthetic_dataset(self, num_samples=10000) (line 428)
- function main() (line 490)

### deep_learning_models.py

Dependencies/imports detected:
- from tensorflow import keras
- from tensorflow.keras import layers, Model
- import numpy as np
- import os
- import pickle
- import tensorflow as tf

- class CharCNN (line 14)
- function __init__(self, max_len=200, vocab_size=100, embedding_dim=32) (line 17)
- function build_vocabulary(self) (line 28)
- function text_to_sequence(self, urls) (line 47)
- function build_model(self) (line 65)
- function train(self, X_train, y_train, X_val, y_val, epochs=10, batch_size=32) (line 128)
- function predict(self, X) (line 157)
- function extract_features(self, X) (line 161)
- class URLTransformer (line 170)
- function __init__(self, max_len=200, vocab_size=100, embed_dim=64) (line 173)
- function build_model(self) (line 179)
- function positional_encoding(self, length, depth) (line 248)
- function train(self, X_train, y_train, X_val, y_val, epochs=15, batch_size=32) (line 265)
- function predict(self, X) (line 294)
- function extract_attention_weights(self, X, layer_name='attention_0') (line 298)
- class URLAutoencoder (line 307)
- function __init__(self, max_len=200, vocab_size=100, latent_dim=32) (line 310)
- function build_model(self) (line 319)
- function train_on_benign(self, X_benign, validation_split=0.1, epochs=20, batch_size=32) (line 391)
- function detect_anomalies(self, X) (line 426)
- function get_latent_features(self, X) (line 441)
- class DeepLearningPipeline (line 445)
- function __init__(self, max_len=200) (line 448)
- function preprocess_urls(self, urls) (line 455)
- function initialize_models(self, vocab_size) (line 490)
- function train_all_models(self, X_train, y_train, X_val, y_val, X_benign=None) (line 505)
- function extract_deep_features(self, X) (line 540)
- function ensemble_predictions(self, X) (line 562)
- function save_models(self, save_dir='ml/models/deep_learning') (line 588)
- function load_models(self, load_dir='ml/models/deep_learning') (line 614)

### predict_god_level.py

Dependencies/imports detected:
- from deep_learning_models import DeepLearningPipeline
- from featureExtractor import URLFeatureExtractor
- from tensorflow import keras
- import argparse
- import joblib
- import json
- import numpy as np
- import os
- import sys
- import tensorflow as tf

- class GodLevelPredictor (line 21)
- function __init__(self, model_dir='ml/models/god_level') (line 22)
- function load_models(self) (line 32)
- function extract_features(self, url) (line 61)
- function predict(self, url) (line 91)
- function analyze_risk_factors(self, features, scaled_vector) (line 143)
- function bulk_predict(self, urls) (line 177)
- function get_model_info(self) (line 193)
- function main() (line 206)

### train_god_level_model.py

Dependencies/imports detected:
- from deep_learning_models import DeepLearningPipeline
- from feature_extractor import URLFeatureExtractor
- from lightgbm import LGBMClassifier
- from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
- from sklearn.ensemble import RandomForestClassifier, VotingClassifier
- from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report
- from sklearn.model_selection import train_test_split, cross_val_score
- from sklearn.preprocessing import StandardScaler
- from xgboost import XGBClassifier
- import io
- import joblib
- import json
- import matplotlib.pyplot as plt
- import numpy as np
- import os
- import pandas as pd
- import pickle
- import shap
- import sys
- import tensorflow as tf
- import warnings

- class GodLevelTrainer (line 37)
- function __init__(self) (line 38)
- function load_data(self) (line 49)
- function extract_traditional_features(self, urls) (line 74)
- function extract_deep_learning_features(self, urls, y=None) (line 97)
- function combine_all_features(self, traditional_features, deep_features, urls) (line 144)
- function train_hybrid_model(self, X_combined, y) (line 185)
- function explain_predictions(self, model, X_sample, feature_names, n_samples=5) (line 314)
- function save_god_level_model(self, model, scaler, feature_names) (line 342)
- function run_training_pipeline(self) (line 391)
- function main() (line 506)

### train_model.py

Dependencies/imports detected:
- from catboost import CatBoostClassifier
- from create_url_dataset import URLDatasetCreator
- from featureExtractor import URLFeatureExtractor
- from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
- from sklearn.feature_selection import SelectFromModel, RFE
- from sklearn.impute import SimpleImputer
- from sklearn.metrics import (accuracy_score, precision_score, recall_score,
- from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, StratifiedKFold
- from sklearn.pipeline import Pipeline
- from sklearn.preprocessing import StandardScaler, LabelEncoder
- import joblib
- import json
- import lightgbm as lgb
- import matplotlib.pyplot as plt
- import numpy as np
- import os
- import pandas as pd
- import pickle
- import seaborn as sns
- import sys
- import warnings
- import xgboost as xgb

- class URLFeatureExtractor (line 47)
- function extractFeatures(self, url) (line 48)
- class AdvancedModelTrainer (line 58)
- function __init__(self, dataset_path='ml_training/data/url_dataset.csv') (line 59)
- function load_and_prepare_data(self, use_cached_features=True) (line 72)
- function perform_feature_selection(self, X, y, feature_names, n_features=50) (line 137)
- function train_advanced_models(self, X_train, X_test, y_train, y_test, feature_names) (line 157)
- function create_ensemble_model(self, X_train, X_test, y_train, y_test, feature_names) (line 252)
- function hyperparameter_tuning(self, X_train, y_train) (line 301)
- function evaluate_model(self, model, X_test, y_test, model_name="Model") (line 338)
- function save_model(self, model, scaler, feature_names, model_name='url_model') (line 375)
- function plot_feature_importance(self, model, feature_names, top_n=20) (line 419)
- function cross_validation(self, model, X, y, cv=5) (line 443)
- function train_complete_pipeline(self) (line 456)
- function main() (line 595)


## Integration Notes

- Keep this README updated whenever files are added/removed or function signatures change.
- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.
- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.