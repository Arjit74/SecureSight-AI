# SecureSight AI Model Details

## Current Model Scope

The production API currently performs URL threat classification using:

- Feature extraction in Node.js
- Model inference through Python subprocess calls
- Heuristic fallback when trained artifacts are unavailable

## Feature Set

The URL extractor computes 65+ features grouped by category:

- URL structure: length, path depth, query metrics, protocol flags
- Character distribution: digit/special ratios, punctuation counts
- Entropy/randomness: URL/domain/path/query entropy
- Domain signals: TLD type, token lengths, consonant clusters
- Suspicious patterns: IP usage, redirects, phishing keywords, typosquatting
- Query semantics: presence of redirect/auth/session indicators

Source: `backend/lib/featureExtractor.js`

## Inference Pipeline

Source: `node-ml-bridge/ml_service.js`

1. Validate Python environment (`sklearn`, `joblib`)
2. Load model and scaler artifacts
3. Build ordered feature vector
4. Predict class and probabilities
5. Return confidence + top feature importances

If artifacts are not found, the service automatically falls back to heuristic prediction so the API remains available.

## Risk Fusion Logic

Source: `backend/server.js`

The final risk score combines ML and heuristic risk:

- ML weight: 75%
- Heuristic weight: 25%

`final_risk = (ml_risk * 0.75) + (heuristic_risk * 0.25)`

Verdict mapping:

- `BLOCK`: high risk and high confidence
- `WARN`: moderate risk or uncertain confidence
- `ALLOW`: low risk with low threat confidence

## Output Schema (Simplified)

```json
{
	"scan_id": "uuid",
	"verdict": "ALLOW|WARN|BLOCK",
	"confidence": 0.87,
	"risk_score": 64.2,
	"model_used": "RandomForest",
	"detailed_analysis": {
		"ml_prediction": {},
		"heuristics": {}
	}
}
```

## Model Quality Improvement Plan

1. Expand phishing and benign URL datasets to reduce overfitting.
2. Track precision/recall by threshold and calibrate confidence.
3. Add drift detection using rolling feature distributions.
4. Version model artifacts with semantic tags and rollback support.
5. Automate periodic retraining using validated feedback samples.

## File Model Status

File-based malware model is not yet integrated into API routes.

Recommended next steps:

1. Implement static file feature extraction in backend.
2. Train with EMBER-like labeled malware corpus.
3. Add `POST /api/scan/file` inference pipeline.
4. Track file-model metrics in `model_performance` table.

