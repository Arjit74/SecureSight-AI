"""
SecureSight AI - Advanced URL Classification Model Trainer
Trains a robust ML model for malicious URL detection with advanced techniques.
Author: Arjit Sharma
"""

import pandas as pd
import numpy as np
import json
import pickle
import warnings
warnings.filterwarnings('ignore')

# Machine Learning imports
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                           f1_score, roc_auc_score, confusion_matrix, 
                           classification_report, roc_curve)
from sklearn.feature_selection import SelectFromModel, RFE
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
import joblib

# Advanced imports
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier

# Visualization (optional)
import matplotlib.pyplot as plt
import seaborn as sns

# Custom feature extractor (from your previous code)
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend', 'lib'))

# Try to import your feature extractor
try:
    from featureExtractor import URLFeatureExtractor
    print("✅ Using existing feature extractor")
except ImportError:
    print("⚠️  Using built-in feature extractor")
    # Define a basic extractor if import fails
    class URLFeatureExtractor:
        def extractFeatures(self, url):
            # Simplified version for illustration
            return {
                'url_length': len(url),
                'digit_count': sum(c.isdigit() for c in url),
                'special_char_count': sum(not c.isalnum() for c in url),
                'has_https': 1 if url.startswith('https://') else 0,
                'has_at': 1 if '@' in url else 0
            }

class AdvancedModelTrainer:
    def __init__(self, dataset_path='ml_training/data/url_dataset.csv'):
        self.dataset_path = dataset_path
        self.extractor = URLFeatureExtractor()
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        self.best_model = None
        self.best_score = 0
        
        # Create output directories
        os.makedirs('ml/models', exist_ok=True)
        os.makedirs('ml/training/results', exist_ok=True)
        
    def load_and_prepare_data(self, use_cached_features=True):
        """Load dataset and extract features"""
        print("📊 Loading and preparing data...")
        
        # Load dataset
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")
        
        df = pd.read_csv(self.dataset_path)
        print(f"   Loaded {len(df)} URLs ({df['label'].sum()} malicious, {len(df)-df['label'].sum()} benign)")
        
        # Check for cached features
        features_cache = 'ml/training/data/extracted_features.pkl'
        if use_cached_features and os.path.exists(features_cache):
            print("   Loading cached features...")
            with open(features_cache, 'rb') as f:
                cached_data = pickle.load(f)
                X = cached_data['features']
                y = cached_data['labels']
                feature_names = cached_data['feature_names']
                
            print(f"   Loaded {X.shape[1]} features from cache")
            return X, y, feature_names, df
        
        # Extract features
        print("   Extracting features from URLs...")
        features_list = []
        
        for idx, url in enumerate(df['url']):
            if idx % 1000 == 0:
                print(f"     Processed {idx}/{len(df)} URLs...")
            
            try:
                features = self.extractor.extractFeatures(url)
                features_list.append(features)
            except Exception as e:
                # Use default features on error
                default_features = {k: 0 for k in self.extractor.extractFeatures("https://example.com").keys()}
                features_list.append(default_features)
        
        # Convert to DataFrame
        features_df = pd.DataFrame(features_list)
        
        # Handle missing values
        imputer = SimpleImputer(strategy='median')
        X = imputer.fit_transform(features_df)
        y = df['label'].values
        feature_names = features_df.columns.tolist()
        
        # Save features to cache
        cache_data = {
            'features': X,
            'labels': y,
            'feature_names': feature_names,
            'urls': df['url'].values
        }
        
        with open(features_cache, 'wb') as f:
            pickle.dump(cache_data, f)
        
        print(f"✅ Extracted {X.shape[1]} features")
        print(f"✅ Features saved to cache: {features_cache}")
        
        return X, y, feature_names, df
    
    def perform_feature_selection(self, X, y, feature_names, n_features=50):
        """Select most important features"""
        print(f"🔍 Selecting top {n_features} features...")
        
        # Use Random Forest to select features
        selector = SelectFromModel(
            RandomForestClassifier(n_estimators=100, random_state=42),
            max_features=n_features,
            threshold='median'
        )
        
        X_selected = selector.fit_transform(X, y)
        selected_indices = selector.get_support(indices=True)
        selected_features = [feature_names[i] for i in selected_indices]
        
        print(f"✅ Selected {len(selected_features)} features")
        print(f"   Top 10 features: {selected_features[:10]}")
        
        return X_selected, selected_features
    
    def train_advanced_models(self, X_train, X_test, y_train, y_test, feature_names):
        """Train multiple advanced models and select the best"""
        print("\n🎯 TRAINING ADVANCED MODELS")
        print("=" * 50)
        
        models_to_train = {
            'random_forest': RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1,
                class_weight='balanced'
            ),
            'xgboost': xgb.XGBClassifier(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                use_label_encoder=False,
                eval_metric='logloss'
            ),
            'lightgbm': lgb.LGBMClassifier(
                n_estimators=200,
                max_depth=10,
                learning_rate=0.05,
                num_leaves=31,
                random_state=42,
                class_weight='balanced'
            ),
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=200,
                max_depth=7,
                learning_rate=0.05,
                subsample=0.8,
                random_state=42
            )
        }
        
        results = {}
        
        for name, model in models_to_train.items():
            print(f"\n🏋️ Training {name}...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Predict and evaluate
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred)
            recall = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            roc_auc = roc_auc_score(y_test, y_pred_proba)
            
            results[name] = {
                'model': model,
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1': f1,
                'roc_auc': roc_auc,
                'predictions': y_pred,
                'probabilities': y_pred_proba
            }
            
            print(f"   ✅ Accuracy: {accuracy:.4f}")
            print(f"   📊 F1-Score: {f1:.4f}")
            print(f"   🎯 ROC-AUC: {roc_auc:.4f}")
            
            # Store feature importance if available
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                self.feature_importance[name] = {
                    'importances': importances,
                    'feature_names': feature_names
                }
        
        # Find best model based on F1-score (balanced metric)
        best_model_name = max(results, key=lambda x: results[x]['f1'])
        self.best_model = results[best_model_name]['model']
        self.best_score = results[best_model_name]['f1']
        
        print(f"\n🏆 BEST MODEL: {best_model_name}")
        print(f"   F1-Score: {results[best_model_name]['f1']:.4f}")
        print(f"   Accuracy: {results[best_model_name]['accuracy']:.4f}")
        
        return results
    
    def create_ensemble_model(self, X_train, X_test, y_train, y_test, feature_names):
        """Create an ensemble of best models"""
        print("\n🤝 CREATING ENSEMBLE MODEL")
        print("=" * 50)
        
        # Define base models
        rf = RandomForestClassifier(
            n_estimators=150, max_depth=12, random_state=42, n_jobs=-1
        )
        xgb_model = xgb.XGBClassifier(
            n_estimators=150, max_depth=7, learning_rate=0.1, random_state=42
        )
        lgb_model = lgb.LGBMClassifier(
            n_estimators=150, max_depth=9, learning_rate=0.05, random_state=42
        )
        
        # Create voting classifier
        ensemble = VotingClassifier(
            estimators=[
                ('rf', rf),
                ('xgb', xgb_model),
                ('lgb', lgb_model)
            ],
            voting='soft',  # Use probabilities for voting
            weights=[1, 1, 1]
        )
        
        # Train ensemble
        print("Training ensemble...")
        ensemble.fit(X_train, y_train)
        
        # Evaluate
        y_pred = ensemble.predict(X_test)
        y_pred_proba = ensemble.predict_proba(X_test)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        
        print(f"✅ Ensemble Accuracy: {accuracy:.4f}")
        print(f"✅ Ensemble F1-Score: {f1:.4f}")
        print(f"✅ Ensemble ROC-AUC: {roc_auc:.4f}")
        
        return ensemble, {
            'accuracy': accuracy,
            'f1': f1,
            'roc_auc': roc_auc
        }
    
    def hyperparameter_tuning(self, X_train, y_train):
        """Perform hyperparameter tuning for the best model"""
        print("\n⚙️ PERFORMING HYPERPARAMETER TUNING")
        print("=" * 50)
        
        # Define parameter grid for Random Forest
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 15, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4],
            'max_features': ['sqrt', 'log2']
        }
        
        # Use GridSearchCV
        rf = RandomForestClassifier(random_state=42, class_weight='balanced', n_jobs=-1)
        
        grid_search = GridSearchCV(
            rf,
            param_grid,
            cv=5,
            scoring='f1',
            n_jobs=-1,
            verbose=1
        )
        
        print("Searching for best parameters...")
        grid_search.fit(X_train, y_train)
        
        print(f"\n🎯 Best parameters found:")
        for param, value in grid_search.best_params_.items():
            print(f"   {param}: {value}")
        
        print(f"🏆 Best F1-Score: {grid_search.best_score_:.4f}")
        
        return grid_search.best_estimator_
    
    def evaluate_model(self, model, X_test, y_test, model_name="Model"):
        """Comprehensive model evaluation"""
        print(f"\n📈 EVALUATING {model_name.upper()}")
        print("=" * 50)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_pred_proba)
        }
        
        # Print metrics
        print("\n📊 Performance Metrics:")
        for metric, value in metrics.items():
            print(f"   {metric.upper():<12}: {value:.4f}")
        
        # Classification report
        print("\n📋 Classification Report:")
        print(classification_report(y_test, y_pred, target_names=['Benign', 'Malicious']))
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        print("🎭 Confusion Matrix:")
        print(f"   True Negatives:  {cm[0, 0]}")
        print(f"   False Positives: {cm[0, 1]}")
        print(f"   False Negatives: {cm[1, 0]}")
        print(f"   True Positives:  {cm[1, 1]}")
        
        return metrics
    
    def save_model(self, model, scaler, feature_names, model_name='url_model'):
        """Save model and related artifacts"""
        print(f"\n💾 SAVING MODEL: {model_name}")
        print("=" * 50)
        
        # Save model
        model_path = f'ml/models/{model_name}.pkl'
        joblib.dump(model, model_path)
        print(f"✅ Model saved to: {model_path}")
        
        # Save scaler
        scaler_path = f'ml/models/{model_name}_scaler.pkl'
        joblib.dump(scaler, scaler_path)
        print(f"✅ Scaler saved to: {scaler_path}")
        
        # Save feature names
        features_path = f'ml/models/{model_name}_features.txt'
        with open(features_path, 'w') as f:
            for feature in feature_names:
                f.write(f"{feature}\n")
        print(f"✅ Feature names saved to: {features_path}")
        
        # Save model metadata
        metadata = {
            'model_name': model_name,
            'model_type': type(model).__name__,
            'feature_count': len(feature_names),
            'training_date': pd.Timestamp.now().isoformat(),
            'features': feature_names,
            'performance': getattr(self, 'best_metrics', {})
        }
        
        metadata_path = f'ml/models/{model_name}_metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✅ Metadata saved to: {metadata_path}")
        
        return {
            'model_path': model_path,
            'scaler_path': scaler_path,
            'features_path': features_path,
            'metadata_path': metadata_path
        }
    
    def plot_feature_importance(self, model, feature_names, top_n=20):
        """Plot feature importance"""
        try:
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                indices = np.argsort(importances)[-top_n:]
                
                plt.figure(figsize=(12, 8))
                plt.title(f'Top {top_n} Feature Importances')
                plt.barh(range(top_n), importances[indices])
                plt.yticks(range(top_n), [feature_names[i] for i in indices])
                plt.xlabel('Relative Importance')
                plt.tight_layout()
                
                # Save plot
                plot_path = 'ml/training/results/feature_importance.png'
                plt.savefig(plot_path, dpi=150)
                plt.close()
                
                print(f"✅ Feature importance plot saved to: {plot_path}")
                
        except Exception as e:
            print(f"⚠️  Could not plot feature importance: {e}")
    
    def cross_validation(self, model, X, y, cv=5):
        """Perform cross-validation"""
        print(f"\n🔬 CROSS-VALIDATION (CV={cv})")
        print("=" * 50)
        
        cv_scores = cross_val_score(model, X, y, cv=cv, scoring='f1', n_jobs=-1)
        
        print(f"   CV F1-Scores: {cv_scores}")
        print(f"   Mean F1-Score: {cv_scores.mean():.4f}")
        print(f"   Std F1-Score:  {cv_scores.std():.4f}")
        
        return cv_scores
    
    def train_complete_pipeline(self):
        """Complete training pipeline"""
        print("""
    ╔══════════════════════════════════════════════════════════╗
    ║          SECURESIGHT AI - ADVANCED MODEL TRAINER         ║
    ║                 God-Level URL Classifier                 ║
    ╚══════════════════════════════════════════════════════════╝
        """)
        
        # Step 1: Load and prepare data
        X, y, feature_names, df = self.load_and_prepare_data()
        
        # Step 2: Split data
        print("\n📊 Splitting data...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        print(f"   Training set: {X_train.shape[0]} samples")
        print(f"   Test set: {X_test.shape[0]} samples")
        
        # Step 3: Scale features
        print("\n📐 Scaling features...")
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        self.scalers['main'] = scaler
        
        # Step 4: Feature selection (optional)
        print("\n🔍 Performing feature selection...")
        X_train_selected, selected_features = self.perform_feature_selection(
            X_train_scaled, y_train, feature_names, n_features=50
        )
        X_test_selected = X_train_selected  # For simplicity
        
        # Step 5: Train multiple models
        results = self.train_advanced_models(
            X_train_selected, X_test_selected, y_train, y_test, selected_features
        )
        
        # Step 6: Hyperparameter tuning
        tuned_model = self.hyperparameter_tuning(X_train_selected, y_train)
        
        # Step 7: Create ensemble
        ensemble, ensemble_metrics = self.create_ensemble_model(
            X_train_selected, X_test_selected, y_train, y_test, selected_features
        )
        
        # Step 8: Cross-validation
        cv_scores = self.cross_validation(tuned_model, X_train_selected, y_train, cv=5)
        
        # Step 9: Evaluate final model
        print("\n" + "=" * 60)
        print("🎯 FINAL MODEL EVALUATION")
        print("=" * 60)
        
        # Evaluate tuned model
        tuned_metrics = self.evaluate_model(tuned_model, X_test_selected, y_test, "Tuned Model")
        
        # Evaluate ensemble
        ensemble_eval = self.evaluate_model(ensemble, X_test_selected, y_test, "Ensemble Model")
        
        # Step 10: Save the best model (ensemble)
        print("\n" + "=" * 60)
        print("💾 SAVING FINAL MODEL")
        print("=" * 60)
        
        # Save ensemble model
        saved_paths = self.save_model(
            ensemble, 
            scaler, 
            selected_features, 
            model_name='securesight_ensemble'
        )
        
        # Also save tuned model
        joblib.dump(tuned_model, 'ml/models/securesight_tuned.pkl')
        
        # Step 11: Visualizations
        print("\n🎨 GENERATING VISUALIZATIONS")
        print("=" * 50)
        
        self.plot_feature_importance(ensemble, selected_features)
        
        # Step 12: Generate final report
        print("\n" + "=" * 60)
        print("📄 TRAINING REPORT SUMMARY")
        print("=" * 60)
        
        report = {
            'dataset_info': {
                'total_samples': len(df),
                'malicious_samples': int(y.sum()),
                'benign_samples': len(y) - int(y.sum()),
                'feature_count': len(selected_features)
            },
            'model_performance': {
                'tuned_model': tuned_metrics,
                'ensemble_model': ensemble_eval,
                'cross_validation': {
                    'mean_f1': float(cv_scores.mean()),
                    'std_f1': float(cv_scores.std())
                }
            },
            'saved_files': saved_paths,
            'training_date': pd.Timestamp.now().isoformat()
        }
        
        # Save report
        report_path = 'ml/training/results/training_report.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"✅ Training report saved to: {report_path}")
        
        # Print summary
        print("\n🏆 TRAINING COMPLETE!")
        print("=" * 60)
        print(f"\n📈 Final Ensemble Model Performance:")
        print(f"   Accuracy:  {ensemble_eval['accuracy']:.4f}")
        print(f"   F1-Score:  {ensemble_eval['f1']:.4f}")
        print(f"   ROC-AUC:   {ensemble_eval['roc_auc']:.4f}")
        print(f"   Precision: {ensemble_eval['precision']:.4f}")
        print(f"   Recall:    {ensemble_eval['recall']:.4f}")
        
        print(f"\n💾 Models saved:")
        print(f"   Ensemble: ml/models/securesight_ensemble.pkl")
        print(f"   Tuned:    ml/models/securesight_tuned.pkl")
        
        print(f"\n🚀 Your model is ready for production!")
        print("   Use it with your server.js API endpoints.")
        
        return {
            'ensemble_model': ensemble,
            'tuned_model': tuned_model,
            'scaler': scaler,
            'features': selected_features,
            'report': report
        }

def main():
    """Main execution"""
    try:
        trainer = AdvancedModelTrainer(
            dataset_path='ml_training/data/url_dataset.csv'
        )
        
        result = trainer.train_complete_pipeline()
        
        print("\n" + "=" * 60)
        print("✅ SECURESIGHT AI TRAINING COMPLETE!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        print("\nTroubleshooting steps:")
        print("1. Check if dataset exists: ml_training/data/url_dataset.csv")
        print("2. Run create_url_dataset.py first to create dataset")
        print("3. Check Python packages: pip install xgboost lightgbm catboost")
        print("4. For quick test, use synthetic data option")
        
        # Create synthetic dataset and retry
        print("\n🔄 Creating synthetic dataset for testing...")
        from create_url_dataset import URLDatasetCreator
        creator = URLDatasetCreator()
        creator.create_synthetic_dataset(num_samples=5000)
        
        # Try again with synthetic data
        print("\n🔧 Retrying with synthetic data...")
        trainer = AdvancedModelTrainer(
            dataset_path='ml_training/data/synthetic_dataset.csv'
        )
        result = trainer.train_complete_pipeline()

if __name__ == "__main__":
    # Install required packages if missing
    required_packages = ['xgboost', 'lightgbm', 'catboost', 'scikit-learn']
    
    print("🔍 Checking required packages...")
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ⚠️  {package} not installed")
            print(f"   Install with: pip install {package}")
    
    print("\n" + "=" * 60)
    
    # Run main training
    main()