"""
SecureSight AI - Deep Learning Models for URL Analysis
Character-level CNN, Transformer, and Autoencoder implementations.
Author: Arjit Sharma
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
import pickle
import os

class CharCNN:
    """Character-level CNN for URL pattern recognition"""
    
    def __init__(self, max_len=200, vocab_size=100, embedding_dim=32):
        self.max_len = max_len
        self.vocab_size = vocab_size
        self.embedding_dim = embedding_dim
        self.model = None
        
        # Character vocabulary (printable ASCII minus control chars)
        self.char_to_idx = {}
        self.idx_to_char = {}
        self.build_vocabulary()
    
    def build_vocabulary(self):
        """Build character vocabulary from printable ASCII"""
        chars = []
        # Add digits
        chars.extend([str(i) for i in range(10)])
        # Add lowercase letters
        chars.extend([chr(i) for i in range(ord('a'), ord('z') + 1)])
        # Add uppercase letters
        chars.extend([chr(i) for i in range(ord('A'), ord('Z') + 1)])
        # Add special characters commonly in URLs
        chars.extend(['.', '-', '_', '/', ':', '?', '=', '&', '%', '@'])
        
        # Create mapping
        for i, char in enumerate(chars):
            self.char_to_idx[char] = i + 1  # 0 is reserved for padding
            self.idx_to_char[i + 1] = char
        
        print(f"📚 Character vocabulary size: {len(self.char_to_idx)}")
    
    def text_to_sequence(self, urls):
        """Convert URLs to character sequences"""
        sequences = []
        for url in urls:
            seq = []
            for char in str(url)[:self.max_len]:
                seq.append(self.char_to_idx.get(char, 0))  # 0 for unknown chars
            
            # Pad sequences
            if len(seq) < self.max_len:
                seq.extend([0] * (self.max_len - len(seq)))
            else:
                seq = seq[:self.max_len]
            
            sequences.append(seq)
        
        return np.array(sequences)
    
    def build_model(self):
        """Build character-level CNN model"""
        print("🧠 Building Character-level CNN...")
        
        inputs = layers.Input(shape=(self.max_len,), name='char_input')
        
        # Embedding layer
        embedding = layers.Embedding(
            input_dim=self.vocab_size + 1,  # +1 for padding
            output_dim=self.embedding_dim,
            input_length=self.max_len,
            name='char_embedding'
        )(inputs)
        
        # Multiple convolution branches for different n-grams
        conv_branches = []
        
        # Branch 1: Character 3-grams
        conv1 = layers.Conv1D(64, 3, activation='relu', padding='same')(embedding)
        conv1 = layers.BatchNormalization()(conv1)
        conv1 = layers.MaxPooling1D(2)(conv1)
        
        # Branch 2: Character 5-grams
        conv2 = layers.Conv1D(64, 5, activation='relu', padding='same')(embedding)
        conv2 = layers.BatchNormalization()(conv2)
        conv2 = layers.MaxPooling1D(2)(conv2)
        
        # Branch 3: Character 7-grams
        conv3 = layers.Conv1D(64, 7, activation='relu', padding='same')(embedding)
        conv3 = layers.BatchNormalization()(conv3)
        conv3 = layers.MaxPooling1D(2)(conv3)
        
        # Concatenate all branches
        merged = layers.Concatenate(axis=-1)([conv1, conv2, conv3])
        
        # Additional convolutions
        conv4 = layers.Conv1D(128, 3, activation='relu', padding='same')(merged)
        conv4 = layers.BatchNormalization()(conv4)
        conv4 = layers.GlobalMaxPooling1D()(conv4)
        
        # Dense layers
        dense1 = layers.Dense(128, activation='relu')(conv4)
        dense1 = layers.Dropout(0.3)(dense1)
        dense1 = layers.BatchNormalization()(dense1)
        
        dense2 = layers.Dense(64, activation='relu')(dense1)
        dense2 = layers.Dropout(0.3)(dense2)
        
        # Output layer
        outputs = layers.Dense(1, activation='sigmoid', name='prediction')(dense2)
        
        # Build model
        self.model = Model(inputs=inputs, outputs=outputs, name='CharCNN')
        
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
        )
        
        print("✅ Character-level CNN built")
        return self.model
    
    def train(self, X_train, y_train, X_val, y_val, epochs=10, batch_size=32):
        """Train the CNN model"""
        print(f"🏋️‍♂️ Training Character CNN for {epochs} epochs...")
        
        callbacks = [
            keras.callbacks.EarlyStopping(
                patience=3,
                restore_best_weights=True,
                monitor='val_loss'
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=2,
                min_lr=0.00001
            )
        ]
        
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        return history
    
    def predict(self, X):
        """Make predictions"""
        return self.model.predict(X, verbose=0)
    
    def extract_features(self, X):
        """Extract CNN features (for ensemble)"""
        # Get features from the last dense layer
        feature_extractor = Model(
            inputs=self.model.input,
            outputs=self.model.get_layer('dense_1').output
        )
        return feature_extractor.predict(X, verbose=0)

class URLTransformer:
    """Transformer model for URL sequence analysis"""
    
    def __init__(self, max_len=200, vocab_size=100, embed_dim=64):
        self.max_len = max_len
        self.vocab_size = vocab_size
        self.embed_dim = embed_dim
        self.model = None
    
    def build_model(self):
        """Build Transformer model for URLs"""
        print("🧠 Building URL Transformer...")
        
        inputs = layers.Input(shape=(self.max_len,), name='transformer_input')
        
        # Embedding with positional encoding
        embedding = layers.Embedding(
            input_dim=self.vocab_size + 1,
            output_dim=self.embed_dim,
            input_length=self.max_len,
            name='transformer_embedding'
        )(inputs)
        
        # Add positional encoding
        positions = tf.range(start=0, limit=self.max_len, delta=1)
        positions = tf.expand_dims(positions, 0)
        positional_encoding = self.positional_encoding(self.max_len, self.embed_dim)
        embedding = embedding + positional_encoding
        
        # Transformer encoder block
        for i in range(2):  # 2 transformer blocks
            # Multi-head attention
            attention_output = layers.MultiHeadAttention(
                num_heads=4,
                key_dim=self.embed_dim // 4,
                dropout=0.1,
                name=f'attention_{i}'
            )(embedding, embedding)
            
            # Add & Norm
            attention_output = layers.Add()([embedding, attention_output])
            attention_output = layers.LayerNormalization(epsilon=1e-6)(attention_output)
            
            # Feed forward network
            ffn_output = layers.Dense(self.embed_dim * 2, activation='relu')(attention_output)
            ffn_output = layers.Dense(self.embed_dim)(ffn_output)
            ffn_output = layers.Dropout(0.1)(ffn_output)
            
            # Add & Norm
            ffn_output = layers.Add()([attention_output, ffn_output])
            embedding = layers.LayerNormalization(epsilon=1e-6)(ffn_output)
        
        # Global pooling
        pooled = layers.GlobalAveragePooling1D()(embedding)
        
        # Dense layers
        dense1 = layers.Dense(128, activation='relu')(pooled)
        dense1 = layers.Dropout(0.3)(dense1)
        dense1 = layers.BatchNormalization()(dense1)
        
        dense2 = layers.Dense(64, activation='relu')(dense1)
        dense2 = layers.Dropout(0.2)(dense2)
        
        # Output layer
        outputs = layers.Dense(1, activation='sigmoid', name='transformer_output')(dense2)
        
        # Build model
        self.model = Model(inputs=inputs, outputs=outputs, name='URLTransformer')
        
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0005),
            loss='binary_crossentropy',
            metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
        )
        
        print("✅ Transformer model built")
        return self.model
    
    def positional_encoding(self, length, depth):
        """Generate positional encoding"""
        depth = depth / 2
        
        positions = np.arange(length)[:, np.newaxis]  # (seq, 1)
        depths = np.arange(depth)[np.newaxis, :] / depth  # (1, depth)
        
        angle_rates = 1 / (10000**depths)  # (1, depth)
        angle_rads = positions * angle_rates  # (pos, depth)
        
        pos_encoding = np.concatenate(
            [np.sin(angle_rads), np.cos(angle_rads)],
            axis=-1
        )
        
        return tf.cast(pos_encoding, dtype=tf.float32)
    
    def train(self, X_train, y_train, X_val, y_val, epochs=15, batch_size=32):
        """Train the Transformer model"""
        print(f"🏋️‍♂️ Training Transformer for {epochs} epochs...")
        
        callbacks = [
            keras.callbacks.EarlyStopping(
                patience=4,
                restore_best_weights=True,
                monitor='val_loss'
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=2,
                min_lr=0.00001
            )
        ]
        
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        return history
    
    def predict(self, X):
        """Make predictions"""
        return self.model.predict(X, verbose=0)
    
    def extract_attention_weights(self, X, layer_name='attention_0'):
        """Extract attention weights for interpretability"""
        attention_layer = self.model.get_layer(layer_name)
        attention_model = Model(
            inputs=self.model.input,
            outputs=attention_layer.output[1]  # attention weights
        )
        return attention_model.predict(X, verbose=0)

class URLAutoencoder:
    """Autoencoder for anomaly detection in URLs"""
    
    def __init__(self, max_len=200, vocab_size=100, latent_dim=32):
        self.max_len = max_len
        self.vocab_size = vocab_size
        self.latent_dim = latent_dim
        self.encoder = None
        self.decoder = None
        self.autoencoder = None
        self.threshold = None
    
    def build_model(self):
        """Build autoencoder for anomaly detection"""
        print("🧠 Building URL Autoencoder...")
        
        # Encoder
        encoder_inputs = layers.Input(shape=(self.max_len,), name='encoder_input')
        
        embedding = layers.Embedding(
            input_dim=self.vocab_size + 1,
            output_dim=64,
            input_length=self.max_len,
            name='autoencoder_embedding'
        )(encoder_inputs)
        
        # Convolutional encoder
        x = layers.Conv1D(128, 3, activation='relu', padding='same')(embedding)
        x = layers.BatchNormalization()(x)
        x = layers.MaxPooling1D(2)(x)
        
        x = layers.Conv1D(64, 3, activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.MaxPooling1D(2)(x)
        
        x = layers.Conv1D(32, 3, activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.GlobalMaxPooling1D()(x)
        
        # Latent space
        latent = layers.Dense(self.latent_dim, activation='relu', name='latent')(x)
        
        # Build encoder
        self.encoder = Model(encoder_inputs, latent, name='encoder')
        
        # Decoder
        decoder_inputs = layers.Input(shape=(self.latent_dim,), name='decoder_input')
        
        x = layers.Dense(50, activation='relu')(decoder_inputs)
        x = layers.Dense(100, activation='relu')(x)
        x = layers.Reshape((25, 4))(x)  # Reshape for upsampling
        
        # Convolutional decoder
        x = layers.UpSampling1D(2)(x)
        x = layers.Conv1D(32, 3, activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)
        
        x = layers.UpSampling1D(2)(x)
        x = layers.Conv1D(64, 3, activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)
        
        x = layers.Conv1D(128, 3, activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)
        
        # Output layer
        decoder_outputs = layers.Conv1D(64, 3, activation='relu', padding='same')(x)
        decoder_outputs = layers.GlobalMaxPooling1D()(decoder_outputs)
        decoder_outputs = layers.Dense(self.max_len, activation='linear')(decoder_outputs)
        
        # Build decoder
        self.decoder = Model(decoder_inputs, decoder_outputs, name='decoder')
        
        # Autoencoder (encoder + decoder)
        autoencoder_outputs = self.decoder(self.encoder(encoder_inputs))
        self.autoencoder = Model(encoder_inputs, autoencoder_outputs, name='autoencoder')
        
        self.autoencoder.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse'  # Mean squared error for reconstruction
        )
        
        print("✅ Autoencoder model built")
        return self.autoencoder
    
    def train_on_benign(self, X_benign, validation_split=0.1, epochs=20, batch_size=32):
        """Train autoencoder only on benign URLs"""
        print("🏋️‍♂️ Training Autoencoder on benign URLs...")
        
        callbacks = [
            keras.callbacks.EarlyStopping(
                patience=5,
                restore_best_weights=True,
                monitor='val_loss'
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=0.00001
            )
        ]
        
        history = self.autoencoder.fit(
            X_benign, X_benign,  # Autoencoder learns to reconstruct input
            validation_split=validation_split,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        # Calculate reconstruction error threshold (for anomaly detection)
        reconstructions = self.autoencoder.predict(X_benign, verbose=0)
        mse_loss = np.mean(np.square(X_benign - reconstructions), axis=1)
        self.threshold = np.percentile(mse_loss, 95)  # 95th percentile as threshold
        
        print(f"📊 Autoencoder threshold: {self.threshold:.4f}")
        return history
    
    def detect_anomalies(self, X):
        """Detect anomalies based on reconstruction error"""
        reconstructions = self.autoencoder.predict(X, verbose=0)
        mse_loss = np.mean(np.square(X - reconstructions), axis=1)
        
        # Anomaly score (0 = normal, 1 = anomalous)
        anomaly_scores = np.minimum(mse_loss / self.threshold, 1.0)
        is_anomaly = mse_loss > self.threshold
        
        return {
            'reconstruction_error': mse_loss,
            'anomaly_score': anomaly_scores,
            'is_anomaly': is_anomaly.astype(int)
        }
    
    def get_latent_features(self, X):
        """Extract latent space features"""
        return self.encoder.predict(X, verbose=0)

class DeepLearningPipeline:
    """Orchestrates all deep learning models"""
    
    def __init__(self, max_len=200):
        self.max_len = max_len
        self.char_cnn = None
        self.transformer = None
        self.autoencoder = None
        self.char_vocab = None
        
    def preprocess_urls(self, urls):
        """Preprocess URLs for deep learning models"""
        print("🔧 Preprocessing URLs for deep learning...")
        
        # Build character vocabulary from all URLs
        all_chars = set()
        for url in urls:
            all_chars.update(str(url))
        
        # Create char to index mapping
        self.char_vocab = {}
        for i, char in enumerate(sorted(all_chars)):
            if char.isprintable():  # Only printable characters
                self.char_vocab[char] = i + 1  # 0 is for padding
        
        vocab_size = len(self.char_vocab)
        print(f"📚 Unique characters in dataset: {vocab_size}")
        
        # Convert URLs to sequences
        sequences = []
        for url in urls:
            seq = []
            for char in str(url)[:self.max_len]:
                seq.append(self.char_vocab.get(char, 0))
            
            # Pad sequences
            if len(seq) < self.max_len:
                seq.extend([0] * (self.max_len - len(seq)))
            else:
                seq = seq[:self.max_len]
            
            sequences.append(seq)
        
        return np.array(sequences), vocab_size
    
    def initialize_models(self, vocab_size):
        """Initialize all deep learning models"""
        print("🚀 Initializing Deep Learning Models...")
        
        self.char_cnn = CharCNN(max_len=self.max_len, vocab_size=vocab_size)
        self.char_cnn.build_model()
        
        self.transformer = URLTransformer(max_len=self.max_len, vocab_size=vocab_size)
        self.transformer.build_model()
        
        self.autoencoder = URLAutoencoder(max_len=self.max_len, vocab_size=vocab_size)
        self.autoencoder.build_model()
        
        print("✅ All deep learning models initialized")
    
    def train_all_models(self, X_train, y_train, X_val, y_val, X_benign=None):
        """Train all deep learning models"""
        print("\n" + "="*60)
        print("🧠 TRAINING DEEP LEARNING MODELS")
        print("="*60)
        
        results = {}
        
        # Train Character CNN
        print("\n1️⃣ Training Character CNN...")
        cnn_history = self.char_cnn.train(X_train, y_train, X_val, y_val, epochs=12)
        results['cnn'] = {
            'history': cnn_history,
            'val_accuracy': max(cnn_history.history['val_accuracy'])
        }
        
        # Train Transformer
        print("\n2️⃣ Training Transformer...")
        transformer_history = self.transformer.train(X_train, y_train, X_val, y_val, epochs=15)
        results['transformer'] = {
            'history': transformer_history,
            'val_accuracy': max(transformer_history.history['val_accuracy'])
        }
        
        # Train Autoencoder (only on benign if provided)
        if X_benign is not None:
            print("\n3️⃣ Training Autoencoder on benign data...")
            autoencoder_history = self.autoencoder.train_on_benign(X_benign, epochs=20)
            results['autoencoder'] = {
                'history': autoencoder_history,
                'threshold': self.autoencoder.threshold
            }
        
        return results
    
    def extract_deep_features(self, X):
        """Extract features from all deep learning models"""
        print("🔍 Extracting deep learning features...")
        
        features = {}
        
        # CNN features
        features['cnn_predictions'] = self.char_cnn.predict(X).flatten()
        features['cnn_features'] = self.char_cnn.extract_features(X)
        
        # Transformer features
        features['transformer_predictions'] = self.transformer.predict(X).flatten()
        
        # Autoencoder features
        if self.autoencoder and self.autoencoder.threshold is not None:
            anomalies = self.autoencoder.detect_anomalies(X)
            features['autoencoder_anomaly_score'] = anomalies['anomaly_score']
            features['autoencoder_reconstruction_error'] = anomalies['reconstruction_error']
            features['latent_features'] = self.autoencoder.get_latent_features(X)
        
        return features
    
    def ensemble_predictions(self, X):
        """Combine predictions from all models"""
        cnn_preds = self.char_cnn.predict(X).flatten()
        transformer_preds = self.transformer.predict(X).flatten()
        
        if self.autoencoder and self.autoencoder.threshold is not None:
            anomalies = self.autoencoder.detect_anomalies(X)
            autoencoder_scores = anomalies['anomaly_score']
        else:
            autoencoder_scores = np.zeros(len(X))
        
        # Weighted ensemble (adjust weights based on validation performance)
        ensemble_preds = (
            0.4 * cnn_preds +      # CNN weight
            0.4 * transformer_preds +  # Transformer weight
            0.2 * autoencoder_scores   # Autoencoder weight
        )
        
        return {
            'ensemble_predictions': ensemble_preds,
            'cnn_predictions': cnn_preds,
            'transformer_predictions': transformer_preds,
            'autoencoder_scores': autoencoder_scores if 'autoencoder_scores' in locals() else None,
            'final_verdict': (ensemble_preds > 0.5).astype(int)
        }
    
    def save_models(self, save_dir='ml/models/deep_learning'):
        """Save all deep learning models"""
        os.makedirs(save_dir, exist_ok=True)
        
        # Save CNN
        self.char_cnn.model.save(f'{save_dir}/char_cnn.h5')
        
        # Save Transformer
        self.transformer.model.save(f'{save_dir}/transformer.h5')
        
        # Save Autoencoder
        if self.autoencoder:
            self.autoencoder.autoencoder.save(f'{save_dir}/autoencoder.h5')
            self.autoencoder.encoder.save(f'{save_dir}/encoder.h5')
            self.autoencoder.decoder.save(f'{save_dir}/decoder.h5')
        
        # Save vocabulary
        with open(f'{save_dir}/char_vocab.pkl', 'wb') as f:
            pickle.dump(self.char_vocab, f)
        
        # Save autoencoder threshold
        if self.autoencoder and self.autoencoder.threshold:
            np.save(f'{save_dir}/autoencoder_threshold.npy', self.autoencoder.threshold)
        
        print(f"💾 Deep learning models saved to: {save_dir}")
    
    def load_models(self, load_dir='ml/models/deep_learning'):
        """Load pre-trained deep learning models"""
        print(f"📂 Loading deep learning models from {load_dir}...")
        
        # Load vocabulary
        with open(f'{load_dir}/char_vocab.pkl', 'rb') as f:
            self.char_vocab = pickle.load(f)
        
        vocab_size = len(self.char_vocab)
        
        # Initialize models
        self.initialize_models(vocab_size)
        
        # Load weights
        self.char_cnn.model = keras.models.load_model(f'{load_dir}/char_cnn.h5')
        self.transformer.model = keras.models.load_model(f'{load_dir}/transformer.h5')
        
        if os.path.exists(f'{load_dir}/autoencoder.h5'):
            self.autoencoder.autoencoder = keras.models.load_model(f'{load_dir}/autoencoder.h5')
            self.autoencoder.encoder = keras.models.load_model(f'{load_dir}/encoder.h5')
            self.autoencoder.decoder = keras.models.load_model(f'{load_dir}/decoder.h5')
            
            # Load threshold
            threshold_path = f'{load_dir}/autoencoder_threshold.npy'
            if os.path.exists(threshold_path):
                self.autoencoder.threshold = np.load(threshold_path)
        
        print("✅ Deep learning models loaded")