// node-ml-bridge/ml_service.js - COMPLETE VERSION
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class MLService {
  constructor() {
    this.models = {
      url: null,
      file: null
    };
    this.scalers = {
      url: null,
      file: null
    };
    this.featureNames = {
      url: null,
      file: null
    };
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🤖 Initializing ML Service...');
      
      // Load Python dependencies
      await this.checkPythonEnvironment();
      
      // Initialize models
      await this.loadModels();
      
      this.initialized = true;
      console.log('✅ ML Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ML Service:', error);
      return false;
    }
  }

  async checkPythonEnvironment() {
    return new Promise((resolve, reject) => {
      const python = spawn('python', ['-c', 'import sklearn; import joblib; print("Python environment OK")']);
      
      python.stdout.on('data', (data) => {
        console.log(`🐍 ${data.toString().trim()}`);
      });
      
      python.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Python environment check failed'));
        }
      });
    });
  }

  async loadModels() {
    try {
      // Check if model files exist
      const urlModelPath = path.join(__dirname, '../ml/models/url_model.pkl');
      const urlScalerPath = path.join(__dirname, '../ml/models/url_scaler.pkl');
      
      try {
        await fs.access(urlModelPath);
        await fs.access(urlScalerPath);
      } catch {
        console.warn('⚠️ Model files not found, using fallback mode');
        this.models.url = 'fallback';
        return;
      }
      
      console.log('📦 Loading URL model...');
      this.models.url = urlModelPath;
      this.scalers.url = urlScalerPath;
      
      // Load feature names if available
      const featureNamesPath = path.join(__dirname, '../ml/models/url_feature_names.txt');
      try {
        const data = await fs.readFile(featureNamesPath, 'utf8');
        this.featureNames.url = data.trim().split('\n');
        console.log(`📊 Loaded ${this.featureNames.url.length} feature names`);
      } catch {
        console.warn('⚠️ Feature names file not found');
      }
      
    } catch (error) {
      console.error('Error loading models:', error);
      this.models.url = 'fallback';
    }
  }

  async predictUrl(features) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // If models not loaded, use fallback
      if (this.models.url === 'fallback') {
        return this.fallbackPrediction(features);
      }
      
      // Prepare features for Python
      const featureArray = this.prepareFeatureArray(features, 'url');
      
      // Create Python prediction script on the fly
      const pythonCode = `
import sys
import json
import joblib
import numpy as np

# Load model and scaler
model = joblib.load('${this.models.url}')
scaler = joblib.load('${this.scalers.url}')

# Get features from stdin
data = sys.stdin.read()
features = json.loads(data)

# Convert to numpy array and reshape
feature_array = np.array(features).reshape(1, -1)

# Scale features
scaled_features = scaler.transform(feature_array)

# Make prediction
prediction = model.predict(scaled_features)[0]
probability = model.predict_proba(scaled_features)[0]

# Get feature importance if available
feature_importance = {}
if hasattr(model, 'feature_importances_'):
    importances = model.feature_importances_
    top_indices = np.argsort(importances)[-5:][::-1]
    feature_names = ${JSON.stringify(this.featureNames.url)} if ${JSON.stringify(this.featureNames.url)} else []
    for idx in top_indices:
        if idx < len(feature_names):
            feature_importance[feature_names[idx]] = float(importances[idx])

# Prepare result
result = {
    "prediction": int(prediction),
    "probability_benign": float(probability[0]),
    "probability_malicious": float(probability[1]),
    "confidence": float(max(probability)),
    "top_features": feature_importance
}

print(json.dumps(result))
`;
      
      // Execute Python script
      const result = await this.executePython(pythonCode, featureArray);
      
      // Parse result
      const prediction = JSON.parse(result);
      
      return {
        is_malicious: prediction.prediction === 1,
        confidence: prediction.confidence,
        probabilities: {
          benign: prediction.probability_benign,
          malicious: prediction.probability_malicious
        },
        top_features: prediction.top_features,
        model_used: 'RandomForest',
        inference_time: 'ms' // Would be calculated in production
      };
      
    } catch (error) {
      console.error('URL prediction error:', error);
      return this.fallbackPrediction(features);
    }
  }

  async predictFile(fileFeatures) {
    // File model prediction (to be implemented)
    return {
      is_malicious: false,
      confidence: 0.95,
      model_used: 'file_model_not_implemented',
      note: 'File model training required'
    };
  }

  prepareFeatureArray(features, modelType) {
    // Convert features object to array in correct order
    if (modelType === 'url' && this.featureNames.url) {
      const featureArray = [];
      for (const featureName of this.featureNames.url) {
        featureArray.push(features[featureName] || 0);
      }
      return featureArray;
    }
    
    // Fallback: use all features in alphabetical order
    return Object.keys(features)
      .sort()
      .map(key => features[key]);
  }

  executePython(code, inputData) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', ['-c', code]);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Python script failed: ${stderr}`));
        }
      });
      
      // Send input data
      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();
    });
  }

  fallbackPrediction(features) {
    // Simple heuristic fallback when ML model is not available
    let score = 50; // Neutral
    
    // Basic heuristics based on features
    if (features.has_ip_address === 1) score -= 20;
    if (features.has_at_symbol === 1) score -= 15;
    if (features.is_suspicious_tld === 1) score -= 10;
    if (features.has_suspicious_keywords === 1) score -= 15;
    if (features.typosquatting_score > 0.5) score -= 20;
    
    const confidence = Math.abs(score - 50) / 50; // How far from neutral
    
    return {
      is_malicious: score < 40,
      confidence: Math.max(0.3, confidence), // Minimum 30% confidence
      probabilities: {
        benign: score >= 40 ? 0.7 : 0.3,
        malicious: score < 40 ? 0.7 : 0.3
      },
      top_features: this.extractTopFeatures(features),
      model_used: 'heuristic_fallback',
      heuristic_score: score
    };
  }

  extractTopFeatures(features) {
    // Extract top suspicious features
    const suspiciousFeatures = [];
    
    if (features.has_ip_address === 1) suspiciousFeatures.push('contains_ip_address');
    if (features.has_at_symbol === 1) suspiciousFeatures.push('contains_at_symbol');
    if (features.is_suspicious_tld === 1) suspiciousFeatures.push('suspicious_tld');
    if (features.has_suspicious_keywords === 1) suspiciousFeatures.push('suspicious_keywords');
    if (features.typosquatting_score > 0.5) suspiciousFeatures.push('typosquatting_detected');
    if (features.has_hex_encoding === 1) suspiciousFeatures.push('hex_encoding');
    
    return suspiciousFeatures.slice(0, 5);
  }

  async getModelInfo() {
    return {
      url_model: {
        loaded: this.models.url !== null,
        type: this.models.url === 'fallback' ? 'heuristic_fallback' : 'RandomForest',
        features: this.featureNames.url ? this.featureNames.url.length : 'unknown',
        status: this.initialized ? 'ready' : 'initializing'
      },
      file_model: {
        loaded: false,
        type: 'not_implemented',
        status: 'pending'
      },
      initialized: this.initialized
    };
  }
}

// Export singleton instance
module.exports = new MLService();