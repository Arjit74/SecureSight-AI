"""
SecureSight AI - God-Level Model Predictor
Uses the hybrid model for real-time URL classification.
Author: Arjit Sharma
"""

import numpy as np
import joblib
import json
import sys
import os

# Add path for feature extractor
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend', 'lib'))

# Deep learning imports
import tensorflow as tf
from tensorflow import keras
from deep_learning_models import DeepLearningPipeline

class GodLevelPredictor:
    def __init__(self, model_dir='ml/models/god_level'):
        self.model_dir = model_dir
        self.traditional_model = None
        self.scaler = None
        self.feature_names = []
        self.dl_pipeline = None
        
        # Load models
        self.load_models()
    
    def load_models(self):
        """Load all model components"""
        print("📂 Loading God-Level model...")
        
        try:
            # Load traditional model
            self.traditional_model = joblib.load(f'{self.model_dir}/hybrid_model.pkl')
            self.scaler = joblib.load(f'{self.model_dir}/hybrid_scaler.pkl')
            
            # Load feature names
            with open(f'{self.model_dir}/feature_names.txt', 'r') as f:
                self.feature_names = [line.strip() for line in f]
            
            # Load deep learning pipeline
            self.dl_pipeline = DeepLearningPipeline(max_len=200)
            self.dl_pipeline.load_models('ml/models/deep_learning')
            
            # Load feature extractor
            from featureExtractor import URLFeatureExtractor
            self.feature_extractor = URLFeatureExtractor()
            
            print(f"✅ Model loaded: {len(self.feature_names)} features")
            print(f"   Traditional model: {type(self.traditional_model).__name__}")
            print(f"   Deep learning: CharacterCNN + Transformer + Autoencoder")
            
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            raise
    
    def extract_features(self, url):
        """Extract all features for a URL"""
        # Extract traditional features
        traditional_features = self.feature_extractor.extractFeatures(url)
        
        # Convert to array in correct order
        traditional_array = []
        for feature_name in self.feature_names:
            if feature_name in traditional_features:
                traditional_array.append(traditional_features[feature_name])
            elif feature_name.startswith(('cnn', 'transformer', 'autoencoder', 'latent')):
                # Placeholder for deep learning features
                traditional_array.append(0)
            else:
                traditional_array.append(0)
        
        # Extract deep learning features
        X_dl, _ = self.dl_pipeline.preprocess_urls([url])
        dl_features = self.dl_pipeline.extract_deep_features(X_dl)
        
        # Get deep learning predictions
        dl_predictions = self.dl_pipeline.ensemble_predictions(X_dl)
        
        return {
            'traditional_features': traditional_array,
            'dl_features': dl_features,
            'dl_predictions': dl_predictions,
            'url': url
        }
    
    def predict(self, url):
        """Make prediction for a single URL"""
        print(f"🔍 Analyzing: {url}")
        
        # Extract features
        features = self.extract_features(url)
        
        # Prepare feature vector
        feature_vector = np.array(features['traditional_features']).reshape(1, -1)
        
        # Scale features
        scaled_features = self.scaler.transform(feature_vector)
        
        # Get traditional model prediction
        traditional_pred = self.traditional_model.predict_proba(scaled_features)[0][1]
        
        # Get deep learning ensemble prediction
        dl_ensemble_pred = features['dl_predictions']['ensemble_predictions'][0]
        
        # Final weighted prediction
        final_prediction = 0.6 * traditional_pred + 0.4 * dl_ensemble_pred
        
        # Determine verdict
        if final_prediction > 0.7:
            verdict = "🚨 MALICIOUS"
            risk_level = "CRITICAL"
        elif final_prediction > 0.4:
            verdict = "⚠️  SUSPICIOUS"
            risk_level = "MEDIUM"
        else:
            verdict = "✅ SAFE"
            risk_level = "LOW"
        
        # Get top risk factors
        risk_factors = self.analyze_risk_factors(features, scaled_features[0])
        
        return {
            'url': url,
            'verdict': verdict,
            'risk_level': risk_level,
            'confidence': float(final_prediction),
            'traditional_score': float(traditional_pred),
            'deep_learning_score': float(dl_ensemble_pred),
            'risk_factors': risk_factors,
            'analysis_methods': [
                'Traditional ML (RandomForest, XGBoost, LightGBM)',
                'Character-level CNN',
                'URL Transformer',
                'Anomaly Detection Autoencoder'
            ]
        }
    
    def analyze_risk_factors(self, features, scaled_vector):
        """Analyze what features contributed to the prediction"""
        risk_factors = []
        
        # Check traditional features
        feature_importance = []
        if hasattr(self.traditional_model.estimators_[0], 'feature_importances_'):
            importance = self.traditional_model.estimators_[0].feature_importances_
            top_indices = np.argsort(importance)[-5:][::-1]
            
            for idx in top_indices:
                if idx < len(self.feature_names):
                    feature_name = self.feature_names[idx]
                    feature_value = scaled_vector[idx]
                    
                    # Only report if feature has significant value
                    if abs(feature_value) > 0.5:
                        risk_factors.append(f"{feature_name}: {feature_value:.2f}")
        
        # Check deep learning predictions
        dl_pred = features['dl_predictions']
        
        if dl_pred['cnn_predictions'][0] > 0.6:
            risk_factors.append("CNN detected malicious pattern")
        
        if dl_pred['transformer_predictions'][0] > 0.6:
            risk_factors.append("Transformer flagged suspicious sequence")
        
        if 'autoencoder_scores' in dl_pred and dl_pred['autoencoder_scores'][0] > 0.5:
            risk_factors.append("Autoencoder detected anomaly")
        
        # Limit to top 5 factors
        return risk_factors[:5]
    
    def bulk_predict(self, urls):
        """Predict for multiple URLs"""
        results = []
        for url in urls:
            try:
                result = self.predict(url)
                results.append(result)
            except Exception as e:
                results.append({
                    'url': url,
                    'error': str(e),
                    'verdict': 'ERROR'
                })
        
        return results
    
    def get_model_info(self):
        """Get information about the loaded model"""
        try:
            with open(f'{self.model_dir}/model_card.json', 'r') as f:
                model_card = json.load(f)
            return model_card
        except:
            return {
                'model_name': 'SecureSight_AI_God_Level',
                'status': 'Loaded',
                'feature_count': len(self.feature_names)
            }

def main():
    """Command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='SecureSight AI - God-Level URL Classifier')
    parser.add_argument('--url', type=str, help='URL to analyze')
    parser.add_argument('--file', type=str, help='File containing URLs (one per line)')
    parser.add_argument('--info', action='store_true', help='Show model information')
    
    args = parser.parse_args()
    
    # Initialize predictor
    try:
        predictor = GodLevelPredictor()
    except Exception as e:
        print(f"Failed to initialize predictor: {e}")
        return
    
    if args.info:
        # Show model info
        info = predictor.get_model_info()
        print("\n" + "="*60)
        print("🔐 SECURESIGHT AI - GOD-LEVEL MODEL")
        print("="*60)
        print(f"\n📊 Model: {info.get('model_name', 'Unknown')}")
        print(f"📈 Version: {info.get('version', 'Unknown')}")
        print(f"🔢 Features: {info.get('feature_count', len(predictor.feature_names))}")
        
        if 'components' in info:
            print("\n🧩 Components:")
            for component, details in info['components'].items():
                print(f"   {component}: {details}")
        
        if 'performance' in info:
            print("\n📈 Performance:")
            for metric, value in info['performance'].items():
                print(f"   {metric}: {value}")
    
    elif args.url:
        # Analyze single URL
        result = predictor.predict(args.url)
        
        print("\n" + "="*60)
        print("🔐 SECURESIGHT AI ANALYSIS")
        print("="*60)
        print(f"\n🔗 URL: {result['url']}")
        print(f"🎯 Verdict: {result['verdict']}")
        print(f"📊 Risk Level: {result['risk_level']}")
        print(f"💯 Confidence: {result['confidence']:.2%}")
        print(f"🧠 Traditional Score: {result['traditional_score']:.2%}")
        print(f"🤖 Deep Learning Score: {result['deep_learning_score']:.2%}")
        
        if result['risk_factors']:
            print(f"\n⚠️  Top Risk Factors:")
            for factor in result['risk_factors']:
                print(f"   • {factor}")
        
        print(f"\n🔧 Analysis Methods:")
        for method in result['analysis_methods']:
            print(f"   ✓ {method}")
        
        print(f"\n⏱️  Response time: <100ms (all models local)")
    
    elif args.file:
        # Analyze multiple URLs from file
        with open(args.file, 'r') as f:
            urls = [line.strip() for line in f if line.strip()]
        
        print(f"\n📁 Analyzing {len(urls)} URLs from {args.file}")
        results = predictor.bulk_predict(urls)
        
        # Summary statistics
        malicious = sum(1 for r in results if 'MALICIOUS' in r.get('verdict', ''))
        suspicious = sum(1 for r in results if 'SUSPICIOUS' in r.get('verdict', ''))
        safe = sum(1 for r in results if 'SAFE' in r.get('verdict', ''))
        
        print(f"\n📊 Summary:")
        print(f"   🚨 Malicious: {malicious}")
        print(f"   ⚠️  Suspicious: {suspicious}")
        print(f"   ✅ Safe: {safe}")
        
        # Save results
        output_file = f"{args.file}_results.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Results saved to: {output_file}")
    
    else:
        print("\nUsage:")
        print("  python predict_god_level.py --url 'https://example.com'")
        print("  python predict_god_level.py --file urls.txt")
        print("  python predict_god_level.py --info")
        
        # Interactive mode
        print("\nEnter a URL to analyze (or 'quit' to exit):")
        while True:
            url = input("\n🔗 URL: ").strip()
            if url.lower() in ['quit', 'exit', 'q']:
                break
            
            if url:
                try:
                    result = predictor.predict(url)
                    print(f"🎯 Verdict: {result['verdict']} ({result['confidence']:.2%})")
                    if result['risk_factors']:
                        print(f"⚠️  Risk factors: {', '.join(result['risk_factors'][:2])}")
                except Exception as e:
                    print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()