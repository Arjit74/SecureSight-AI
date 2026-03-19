🔥 EMBER Dataset Integration (ml/ / datasets/)
📌 Overview

The EMBER (Endgame Malware Benchmark for Research) dataset is a widely used dataset for malware detection using machine learning.

In SecureSight-AI, EMBER is used for:

Training malicious file detection models

Feature-based classification of PE (Portable Executable) files

Experimentation with ML pipelines for file scanning

📦 What is EMBER?

Open-source dataset for malware detection

Contains:

Extracted features from PE files (no raw binaries)

Labels: benign / malicious

Designed for:

Fast ML training

Security research

📊 Dataset Structure

Typical EMBER dataset includes:

ember/
│
├── train_features.jsonl
├── train_labels.jsonl
├── test_features.jsonl
├── test_labels.jsonl
├── metadata.csv
Data Format

JSON Lines (.jsonl)

Each row = one file sample

Example:

{
  "label": 1,
  "features": {
    "byte_histogram": [...],
    "imports": [...],
    "header": {...}
  }
}
🧠 Feature Categories

EMBER provides structured features instead of raw files:

Feature Type	Description
Byte Histogram	Distribution of byte values
Byte Entropy	Entropy of file sections
PE Header	Metadata (size, timestamp, etc.)
Imports	DLL + API calls
Strings	Extracted printable strings
Section Info	Section names, sizes
📥 Setup Instructions
1. Install Dependencies
pip install ember numpy pandas scikit-learn lightgbm
2. Download Dataset
git clone https://github.com/elastic/ember.git
cd ember
python -m ember

Or manually download from:

https://github.com/elastic/ember

3. Place Dataset in Project

Recommended structure:

SecureSight-AI/
│
├── datasets/
│   └── ember/
│       ├── train_features.jsonl
│       ├── train_labels.jsonl
│       ├── test_features.jsonl
│       └── test_labels.jsonl
⚙️ Integration in SecureSight-AI
📍 Location

Training scripts → ml/training/

Dataset → datasets/ember/

🔹 Loading Data
import ember

X_train, y_train, X_test, y_test = ember.read_vectorized_features("datasets/ember/")
🔹 Training Example
from lightgbm import LGBMClassifier

model = LGBMClassifier(n_estimators=1000)
model.fit(X_train, y_train)
🔹 Evaluation
from sklearn.metrics import accuracy_score

preds = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, preds))
🔹 Save Model
import joblib
joblib.dump(model, "ml/models/ember_model.pkl")
🔗 Integration with ML Bridge

Export trained model (.pkl)

Load in Python inference script

Connect via node-ml-bridge

Flow:

Node Backend → ML Bridge → Python Model → Prediction
📈 Model Use Cases in Project

File malware classification (future /api/scan/file)

Feature experimentation

Hybrid scoring (ML + heuristics)

⚠️ Important Notes

EMBER does NOT include raw files → safe to use

Dataset is large (~GBs) → ensure storage

Training may require:

8GB+ RAM

GPU optional (not required)