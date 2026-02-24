"""
SecureSight AI - God-Level Model Trainer
Combines traditional ML with deep learning for ultimate performance.
Author: Arjit Sharma
"""

import sys
import os
# Set UTF-8 encoding for terminal output
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np
import json
import pickle
import warnings
warnings.filterwarnings('ignore')

# Traditional ML imports
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report
import joblib

# Deep learning imports
import tensorflow as tf
from deep_learning_models import DeepLearningPipeline

# Feature extractor
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from feature_extractor import URLFeatureExtractor

class GodLevelTrainer:
    def __init__(self):
        self.extractor = URLFeatureExtractor()
        self.dl_pipeline = DeepLearningPipeline(max_len=200)
        self.models = {}
        self.feature_names = []
        self.results = {}
        
        # Create directories
        os.makedirs('ml/models/god_level', exist_ok=True)
        os.makedirs('ml/training/god_level_results', exist_ok=True)
        
    def load_data(self):
        """Load and prepare all data"""
        print("📊 Loading data...")
        
        # Load dataset - try multiple possible paths
        possible_paths = [
            'ml_training/data/url_dataset.csv',
            './ml_training/data/url_dataset.csv',
            'ml_training/ml_training/data/url_dataset.csv',
        ]
        
        dataset_path = None
        for path in possible_paths:
            if os.path.exists(path):
                dataset_path = path
                break
        
        if dataset_path is None:
            raise FileNotFoundError(f"Dataset not found. Tried: {possible_paths}")
        
        df = pd.read_csv(dataset_path)
        print(f"   Loaded {len(df)} URLs")
        
        return df
    
    def extract_traditional_features(self, urls):
        """Extract traditional ML features"""
        print("🔍 Extracting traditional features...")
        
        features_list = []
        for idx, url in enumerate(urls):
            if idx % 1000 == 0:
                print(f"     Processed {idx}/{len(urls)} URLs...")
            
            try:
                features = self.extractor.extractFeatures(url)
                features_list.append(features)
            except:
                # Use default features
                default_features = {k: 0 for k in self.extractor.extractFeatures("https://example.com").keys()}
                features_list.append(default_features)
        
        features_df = pd.DataFrame(features_list)
        self.feature_names = features_df.columns.tolist()
        
        print(f"✅ Extracted {len(self.feature_names)} traditional features")
        return features_df.values
    
    def extract_deep_learning_features(self, urls, y=None):
        """Extract deep learning features"""
        print("🧠 Extracting deep learning features...")
        
        # Preprocess URLs for deep learning
        X_dl, vocab_size = self.dl_pipeline.preprocess_urls(urls)
        
        # Initialize deep learning models
        self.dl_pipeline.initialize_models(vocab_size)
        
        # Split data if labels available
        if y is not None:
            X_train_dl, X_val_dl, y_train_dl, y_val_dl = train_test_split(
                X_dl, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Get benign data for autoencoder
            benign_indices = np.where(y_train_dl == 0)[0]
            X_benign_dl = X_train_dl[benign_indices]
            
            # Train deep learning models
            dl_results = self.dl_pipeline.train_all_models(
                X_train_dl, y_train_dl, X_val_dl, y_val_dl, X_benign_dl
            )
            self.results['deep_learning'] = dl_results
            
            # Extract features from trained models
            dl_features = self.dl_pipeline.extract_deep_features(X_dl)
            
            # Save deep learning models
            self.dl_pipeline.save_models()
            
        else:
            # Load pre-trained models and extract features
            try:
                self.dl_pipeline.load_models()
                dl_features = self.dl_pipeline.extract_deep_features(X_dl)
            except:
                print("⚠️ Could not load deep learning models, using placeholder features")
                dl_features = {
                    'cnn_predictions': np.zeros(len(urls)),
                    'transformer_predictions': np.zeros(len(urls)),
                    'autoencoder_anomaly_score': np.zeros(len(urls))
                }
        
        return dl_features
    
    def combine_all_features(self, traditional_features, deep_features, urls):
        """Combine traditional and deep learning features"""
        print("🤝 Combining all features...")
        
        # Start with traditional features
        combined_features = traditional_features
        
        # Add CNN predictions
        if 'cnn_predictions' in deep_features:
            combined_features = np.column_stack([
                combined_features,
                deep_features['cnn_predictions'].reshape(-1, 1)
            ])
            self.feature_names.append('cnn_prediction')
        
        # Add Transformer predictions
        if 'transformer_predictions' in deep_features:
            combined_features = np.column_stack([
                combined_features,
                deep_features['transformer_predictions'].reshape(-1, 1)
            ])
            self.feature_names.append('transformer_prediction')
        
        # Add Autoencoder anomaly scores
        if 'autoencoder_anomaly_score' in deep_features:
            combined_features = np.column_stack([
                combined_features,
                deep_features['autoencoder_anomaly_score'].reshape(-1, 1)
            ])
            self.feature_names.append('autoencoder_anomaly_score')
        
        # Add latent features if available
        if 'latent_features' in deep_features and deep_features['latent_features'].size > 0:
            latent_features = deep_features['latent_features']
            combined_features = np.column_stack([combined_features, latent_features])
            for i in range(latent_features.shape[1]):
                self.feature_names.append(f'latent_feature_{i}')
        
        print(f"✅ Combined features: {combined_features.shape[1]} total")
        return combined_features
    
    def train_hybrid_model(self, X_combined, y):
        """Train hybrid model combining all features"""
        print("\n🤖 TRAINING HYBRID GOD-LEVEL MODEL")
        print("=" * 60)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_combined, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Define models for ensemble
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
        from xgboost import XGBClassifier
        from lightgbm import LGBMClassifier
        
        models = {
            'random_forest': RandomForestClassifier(
                n_estimators=200, max_depth=15, random_state=42, n_jobs=-1,
                class_weight='balanced'
            ),
            'xgboost': XGBClassifier(
                n_estimators=200, max_depth=8, learning_rate=0.1,
                random_state=42, use_label_encoder=False
            ),
            'lightgbm': LGBMClassifier(
                n_estimators=200, max_depth=10, learning_rate=0.05,
                random_state=42, class_weight='balanced'
            ),
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=200, max_depth=7, learning_rate=0.05,
                random_state=42
            )
        }
        
        # Train individual models
        results = {}
        for name, model in models.items():
            print(f"🏋️ Training {name}...")
            model.fit(X_train_scaled, y_train)
            
            # Predict
            y_pred = model.predict(X_test_scaled)
            y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
            
            # Evaluate
            accuracy = accuracy_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            roc_auc = roc_auc_score(y_test, y_pred_proba)
            
            results[name] = {
                'model': model,
                'accuracy': accuracy,
                'f1': f1,
                'roc_auc': roc_auc
            }
            
            print(f"   ✅ {name}: Accuracy={accuracy:.4f}, F1={f1:.4f}, ROC-AUC={roc_auc:.4f}")
        
        # Create voting ensemble
        print("\n🤝 Creating voting ensemble...")
        voting_clf = VotingClassifier(
            estimators=[
                ('rf', results['random_forest']['model']),
                ('xgb', results['xgboost']['model']),
                ('lgb', results['lightgbm']['model'])
            ],
            voting='soft',
            weights=[1, 1, 1]
        )
        
        voting_clf.fit(X_train_scaled, y_train)
        
        # Evaluate ensemble
        y_pred_ensemble = voting_clf.predict(X_test_scaled)
        y_pred_proba_ensemble = voting_clf.predict_proba(X_test_scaled)[:, 1]
        
        ensemble_accuracy = accuracy_score(y_test, y_pred_ensemble)
        ensemble_f1 = f1_score(y_test, y_pred_ensemble)
        ensemble_roc_auc = roc_auc_score(y_test, y_pred_proba_ensemble)
        
        results['ensemble'] = {
            'model': voting_clf,
            'accuracy': ensemble_accuracy,
            'f1': ensemble_f1,
            'roc_auc': ensemble_roc_auc
        }
        
        print(f"🎯 ENSEMBLE: Accuracy={ensemble_accuracy:.4f}, F1={ensemble_f1:.4f}, ROC-AUC={ensemble_roc_auc:.4f}")
        
        # Deep learning ensemble predictions
        print("\n🧠 Adding deep learning ensemble predictions...")
        
        # Get deep learning predictions
        dl_predictions = self.dl_pipeline.ensemble_predictions(
            self.dl_pipeline.preprocess_urls(
                [url for url in self.df['url'].iloc[X_test.index]]
            )[0]
        )
        
        # Combine with traditional ensemble
        final_predictions = (
            0.6 * y_pred_proba_ensemble +  # Traditional ensemble weight
            0.4 * dl_predictions['ensemble_predictions']  # Deep learning weight
        )
        
        final_accuracy = accuracy_score(y_test, final_predictions > 0.5)
        final_f1 = f1_score(y_test, final_predictions > 0.5)
        final_roc_auc = roc_auc_score(y_test, final_predictions)
        
        print(f"🏆 FINAL HYBRID: Accuracy={final_accuracy:.4f}, F1={final_f1:.4f}, ROC-AUC={final_roc_auc:.4f}")
        
        # Save results
        self.results['hybrid'] = {
            'ensemble': results['ensemble'],
            'final': {
                'accuracy': final_accuracy,
                'f1': final_f1,
                'roc_auc': final_roc_auc
            },
            'individual_models': {k: v for k, v in results.items() if k != 'ensemble'}
        }
        
        return voting_clf, scaler, final_predictions
    
    def explain_predictions(self, model, X_sample, feature_names, n_samples=5):
        """Generate explanations for predictions"""
        print("\n🔍 Generating prediction explanations...")
        
        # Use SHAP for explainability if available
        try:
            import shap
            
            # Create explainer
            explainer = shap.TreeExplainer(model.estimators_[0])  # Use first estimator
            
            # Calculate SHAP values
            shap_values = explainer.shap_values(X_sample)
            
            # Plot summary
            shap.summary_plot(shap_values, X_sample, feature_names=feature_names)
            
            # Save plot
            import matplotlib.pyplot as plt
            plt.savefig('ml/training/god_level_results/shap_summary.png', dpi=150, bbox_inches='tight')
            plt.close()
            
            print("✅ SHAP explanation saved")
            
        except ImportError:
            print("⚠️ SHAP not installed, skipping explanations")
            print("   Install with: pip install shap")
    
    def save_god_level_model(self, model, scaler, feature_names):
        """Save the complete god-level model"""
        print("\n💾 SAVING GOD-LEVEL MODEL")
        print("=" * 60)
        
        # Save traditional model components
        joblib.dump(model, 'ml/models/god_level/hybrid_model.pkl')
        joblib.dump(scaler, 'ml/models/god_level/hybrid_scaler.pkl')
        
        # Save feature names
        with open('ml/models/god_level/feature_names.txt', 'w') as f:
            for name in feature_names:
                f.write(f"{name}\n")
        
        # Save deep learning models (already saved in their pipeline)
        
        # Create model card
        model_card = {
            'model_name': 'SecureSight_AI_God_Level',
            'version': '3.0.0',
            'description': 'Hybrid model combining traditional ML with deep learning',
            'components': {
                'traditional_ml': {
                    'algorithms': ['RandomForest', 'XGBoost', 'LightGBM', 'VotingEnsemble'],
                    'feature_count': len([f for f in feature_names if not f.startswith(('cnn', 'transformer', 'autoencoder', 'latent'))])
                },
                'deep_learning': {
                    'models': ['CharacterCNN', 'URLTransformer', 'Autoencoder'],
                    'input_type': 'Character sequences',
                    'max_sequence_length': 200
                },
                'ensemble_method': 'Weighted voting (60% traditional, 40% deep learning)'
            },
            'performance': self.results.get('hybrid', {}).get('final', {}),
            'training_date': pd.Timestamp.now().isoformat(),
            'features': feature_names[:20] + ['...'] if len(feature_names) > 20 else feature_names
        }
        
        with open('ml/models/god_level/model_card.json', 'w') as f:
            json.dump(model_card, f, indent=2)
        
        print("✅ God-level model saved successfully!")
        print(f"   Model: ml/models/god_level/hybrid_model.pkl")
        print(f"   Scaler: ml/models/god_level/hybrid_scaler.pkl")
        print(f"   Deep learning: ml/models/deep_learning/")
        print(f"   Model card: ml/models/god_level/model_card.json")
        
        return model_card
    
    def run_training_pipeline(self):
        """Complete training pipeline"""
        print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║              SECURESIGHT AI - GOD-LEVEL TRAINER              ║
    ║         Traditional ML + Deep Learning = Ultimate Power      ║
    ╚══════════════════════════════════════════════════════════════╝
        """)
        
        # Step 1: Load data
        self.df = self.load_data()
        urls = self.df['url'].values
        y = self.df['label'].values
        
        print(f"📊 Dataset: {len(urls)} URLs ({sum(y)} malicious, {len(y)-sum(y)} benign)")
        
        # Step 2: Extract traditional features
        X_traditional = self.extract_traditional_features(urls)
        
        # Step 3: Extract deep learning features (and train DL models)
        print("\n" + "="*60)
        print("🧠 DEEP LEARNING PHASE")
        print("="*60)
        
        dl_features = self.extract_deep_learning_features(urls, y)
        
        # Step 4: Combine all features
        print("\n" + "="*60)
        print("🤝 FEATURE FUSION PHASE")
        print("="*60)
        
        X_combined = self.combine_all_features(X_traditional, dl_features, urls)
        
        # Step 5: Train hybrid model
        print("\n" + "="*60)
        print("🤖 HYBRID TRAINING PHASE")
        print("="*60)
        
        hybrid_model, scaler, final_predictions = self.train_hybrid_model(X_combined, y)
        
        # Step 6: Generate explanations
        print("\n" + "="*60)
        print("🔍 EXPLAINABILITY PHASE")
        print("="*60)
        
        # Sample data for explanations
        sample_indices = np.random.choice(len(X_combined), min(100, len(X_combined)), replace=False)
        X_sample = X_combined[sample_indices]
        
        self.explain_predictions(hybrid_model, X_sample, self.feature_names)
        
        # Step 7: Save complete model
        print("\n" + "="*60)
        print("💾 DEPLOYMENT PHASE")
        print("="*60)
        
        model_card = self.save_god_level_model(hybrid_model, scaler, self.feature_names)
        
        # Step 8: Generate final report
        print("\n" + "="*60)
        print("📊 FINAL PERFORMANCE REPORT")
        print("="*60)
        
        final_report = {
            'dataset_statistics': {
                'total_samples': len(self.df),
                'malicious_count': int(y.sum()),
                'benign_count': len(y) - int(y.sum()),
                'class_balance': f"{y.sum()/len(y)*100:.1f}% malicious"
            },
            'feature_engineering': {
                'traditional_features': len([f for f in self.feature_names if not f.startswith(('cnn', 'transformer', 'autoencoder', 'latent'))]),
                'deep_learning_features': len([f for f in self.feature_names if f.startswith(('cnn', 'transformer', 'autoencoder', 'latent'))]),
                'total_features': len(self.feature_names)
            },
            'model_performance': self.results.get('hybrid', {}).get('final', {}),
            'deep_learning_performance': {
                'cnn_val_accuracy': self.results.get('deep_learning', {}).get('cnn', {}).get('val_accuracy', 'N/A'),
                'transformer_val_accuracy': self.results.get('deep_learning', {}).get('transformer', {}).get('val_accuracy', 'N/A'),
                'autoencoder_threshold': self.results.get('deep_learning', {}).get('autoencoder', {}).get('threshold', 'N/A')
            },
            'recommendations': [
                "Model is ready for production deployment",
                "Monitor false positive rate in real-world usage",
                "Retrain monthly with new phishing URLs",
                "Consider adding SSL/TLS features if performance needs improvement"
            ]
        }
        
        # Save report
        report_path = 'ml/training/god_level_results/final_report.json'
        with open(report_path, 'w') as f:
            json.dump(final_report, f, indent=2)
        
        print(f"✅ Final report saved: {report_path}")
        
        print("\n" + "="*60)
        print("🏆 GOD-LEVEL TRAINING COMPLETE! 🏆")
        print("="*60)
        
        print(f"\n📈 Final Model Performance:")
        print(f"   Accuracy:  {final_report['model_performance'].get('accuracy', 0):.4f}")
        print(f"   F1-Score:  {final_report['model_performance'].get('f1', 0):.4f}")
        print(f"   ROC-AUC:   {final_report['model_performance'].get('roc_auc', 0):.4f}")
        
        print(f"\n🔧 Features Used:")
        print(f"   Traditional ML: {final_report['feature_engineering']['traditional_features']}")
        print(f"   Deep Learning:  {final_report['feature_engineering']['deep_learning_features']}")
        print(f"   Total:          {final_report['feature_engineering']['total_features']}")
        
        print(f"\n🚀 Your God-Level model is ready!")
        print(f"   Use it with: python predict_god_level.py --url 'https://example.com'")
        
        return final_report

def main():
    """Main execution"""
    print("🚀 Starting God-Level Model Training...")
    
    # Check dependencies
    try:
        import tensorflow as tf
        print(f"✅ TensorFlow {tf.__version__} installed")
    except ImportError:
        print("❌ TensorFlow not installed")
        print("   Install with: pip install tensorflow")
        return
    
    try:
        import shap
        print("✅ SHAP installed for explainability")
    except ImportError:
        print("⚠️ SHAP not installed (optional for explanations)")
    
    # Run training
    trainer = GodLevelTrainer()
    
    try:
        report = trainer.run_training_pipeline()
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        print("\nTroubleshooting:")
        print("1. Ensure dataset exists: ml_training/ml_training/data/url_dataset.csv")
        print("2. Install dependencies: pip install tensorflow shap xgboost lightgbm")
        print("3. For GPU acceleration: pip install tensorflow-gpu")
        print("4. Check memory: Deep learning models require significant RAM")

if __name__ == "__main__":
    main()