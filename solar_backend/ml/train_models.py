"""
Solar Energy Model Training Script
Trains 5 deep learning models on the synthetic solar energy dataset:
1. BiLSTM
2. Attention-LSTM
3. CNN-BiLSTM
4. GRU-Attention
5. Transformer

Saves models, scalers, feature columns, and evaluation metrics.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import joblib
import os
import json

# Suppress TF info logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input, LSTM, Bidirectional, Dense, Dropout,
    BatchNormalization, Conv1D, GRU,
    MultiHeadAttention, LayerNormalization, GlobalAveragePooling1D
)
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam

print(f"TensorFlow version: {tf.__version__}")
print(f"GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")

# ─── DATA LOADING & PREPROCESSING ───────────────────────────
print("\n--- Loading dataset ---")
df = pd.read_csv("ml/data/solar_dataset.csv")
print(f"Dataset shape: {df.shape}")

# Feature columns - ORDER IS CRITICAL (must match ml_loader.py)
FEATURE_COLS = [
    "latitude", "longitude", "solar_zone",
    "hour", "day_of_year", "month", "season",
    "size_kw", "panel_wattage", "panel_count", "area_m2",
    "temperature", "humidity", "solar_irradiance",
    "wind_speed", "cloud_cover", "uv_index",
    "efficiency", "performance_ratio"
]
TARGET_COL = "produced_kwh"

X = df[FEATURE_COLS].values
y = df[TARGET_COL].values.reshape(-1, 1)

# Scale features and target separately
scaler_X = MinMaxScaler()
scaler_y = MinMaxScaler()
X_scaled = scaler_X.fit_transform(X)
y_scaled = scaler_y.fit_transform(y)

# Reshape for sequence models: (samples, timesteps=1, features)
X_seq = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))

# Train/val/test split: 70/15/15
X_train, X_temp, y_train, y_temp = train_test_split(
    X_seq, y_scaled, test_size=0.30, random_state=42
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42
)

# Save scalers and feature columns
os.makedirs("ml/saved_models", exist_ok=True)
joblib.dump(scaler_X, "ml/saved_models/scaler_X.pkl")
joblib.dump(scaler_y, "ml/saved_models/scaler_y.pkl")
joblib.dump(FEATURE_COLS, "ml/saved_models/feature_cols.pkl")
print(f"Train: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")
print("Scalers and feature_cols saved.")

# ─── COMMON CALLBACKS ───────────────────────────────────────
callbacks = [
    EarlyStopping(patience=10, restore_best_weights=True, monitor='val_loss'),
    ReduceLROnPlateau(factor=0.5, patience=5, min_lr=1e-6)
]

input_shape = (1, len(FEATURE_COLS))


# ─── MODEL 1: BiLSTM ────────────────────────────────────────
def build_bilstm(input_shape):
    inp = Input(shape=input_shape)
    x = Bidirectional(LSTM(128, return_sequences=True))(inp)
    x = Dropout(0.2)(x)
    x = Bidirectional(LSTM(64, return_sequences=False))(x)
    x = Dropout(0.2)(x)
    x = Dense(64, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dense(32, activation='relu')(x)
    out = Dense(1, activation='linear')(x)
    model = Model(inp, out)
    model.compile(optimizer=Adam(0.001), loss='mse', metrics=['mae'])
    return model


print("\n" + "=" * 50)
print("Training Model 1/5: BiLSTM")
print("=" * 50)
m1 = build_bilstm(input_shape)
m1.fit(X_train, y_train, validation_data=(X_val, y_val),
       epochs=100, batch_size=256, callbacks=callbacks, verbose=1)
m1.save("ml/saved_models/bilstm.h5")
print("BiLSTM saved.")


# ─── MODEL 2: Attention-LSTM ────────────────────────────────
def build_attention_lstm(input_shape):
    inp = Input(shape=input_shape)
    x = LSTM(128, return_sequences=True)(inp)
    x = Dropout(0.2)(x)
    # Self-attention
    attn = MultiHeadAttention(num_heads=4, key_dim=32)(x, x)
    x = LayerNormalization()(attn + x)
    x = LSTM(64, return_sequences=False)(x)
    x = Dropout(0.2)(x)
    x = Dense(64, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dense(32, activation='relu')(x)
    out = Dense(1, activation='linear')(x)
    model = Model(inp, out)
    model.compile(optimizer=Adam(0.001), loss='mse', metrics=['mae'])
    return model


print("\n" + "=" * 50)
print("Training Model 2/5: Attention-LSTM")
print("=" * 50)
m2 = build_attention_lstm(input_shape)
m2.fit(X_train, y_train, validation_data=(X_val, y_val),
       epochs=100, batch_size=256, callbacks=callbacks, verbose=1)
m2.save("ml/saved_models/attention_lstm.h5")
print("Attention-LSTM saved.")


# ─── MODEL 3: CNN-BiLSTM ────────────────────────────────────
def build_cnn_bilstm(input_shape):
    inp = Input(shape=input_shape)
    x = Conv1D(filters=64, kernel_size=1, activation='relu', padding='same')(inp)
    x = Conv1D(filters=128, kernel_size=1, activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = Bidirectional(LSTM(64, return_sequences=True))(x)
    x = Dropout(0.2)(x)
    x = Bidirectional(LSTM(32, return_sequences=False))(x)
    x = Dropout(0.2)(x)
    x = Dense(64, activation='relu')(x)
    x = Dense(32, activation='relu')(x)
    out = Dense(1, activation='linear')(x)
    model = Model(inp, out)
    model.compile(optimizer=Adam(0.001), loss='mse', metrics=['mae'])
    return model


print("\n" + "=" * 50)
print("Training Model 3/5: CNN-BiLSTM")
print("=" * 50)
m3 = build_cnn_bilstm(input_shape)
m3.fit(X_train, y_train, validation_data=(X_val, y_val),
       epochs=100, batch_size=256, callbacks=callbacks, verbose=1)
m3.save("ml/saved_models/cnn_bilstm.h5")
print("CNN-BiLSTM saved.")


# ─── MODEL 4: GRU-Attention ─────────────────────────────────
def build_gru_attention(input_shape):
    inp = Input(shape=input_shape)
    x = GRU(128, return_sequences=True)(inp)
    x = Dropout(0.2)(x)
    # Multi-head attention over GRU output
    attn = MultiHeadAttention(num_heads=4, key_dim=32)(x, x)
    x = LayerNormalization()(attn + x)
    x = GRU(64, return_sequences=False)(x)
    x = Dropout(0.2)(x)
    x = Dense(64, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dense(32, activation='relu')(x)
    out = Dense(1, activation='linear')(x)
    model = Model(inp, out)
    model.compile(optimizer=Adam(0.001), loss='mse', metrics=['mae'])
    return model


print("\n" + "=" * 50)
print("Training Model 4/5: GRU-Attention")
print("=" * 50)
m4 = build_gru_attention(input_shape)
m4.fit(X_train, y_train, validation_data=(X_val, y_val),
       epochs=100, batch_size=256, callbacks=callbacks, verbose=1)
m4.save("ml/saved_models/gru_attention.h5")
print("GRU-Attention saved.")


# ─── MODEL 5: Transformer ───────────────────────────────────
def build_transformer(input_shape):
    inp = Input(shape=input_shape)
    # Positional encoding via Dense projection
    x = Dense(128)(inp)
    # Transformer encoder block 1
    attn1 = MultiHeadAttention(num_heads=8, key_dim=16)(x, x)
    x = LayerNormalization()(attn1 + x)
    ffn1 = Dense(256, activation='relu')(x)
    ffn1 = Dense(128)(ffn1)
    x = LayerNormalization()(ffn1 + x)
    # Transformer encoder block 2
    attn2 = MultiHeadAttention(num_heads=8, key_dim=16)(x, x)
    x = LayerNormalization()(attn2 + x)
    ffn2 = Dense(256, activation='relu')(x)
    ffn2 = Dense(128)(ffn2)
    x = LayerNormalization()(ffn2 + x)
    # Output head
    x = GlobalAveragePooling1D()(x)
    x = Dropout(0.2)(x)
    x = Dense(64, activation='relu')(x)
    x = Dense(32, activation='relu')(x)
    out = Dense(1, activation='linear')(x)
    model = Model(inp, out)
    model.compile(optimizer=Adam(0.0005), loss='mse', metrics=['mae'])
    return model


print("\n" + "=" * 50)
print("Training Model 5/5: Transformer")
print("=" * 50)
m5 = build_transformer(input_shape)
m5.fit(X_train, y_train, validation_data=(X_val, y_val),
       epochs=100, batch_size=256, callbacks=callbacks, verbose=1)
m5.save("ml/saved_models/transformer.h5")
print("Transformer saved.")


# ─── EVALUATION ──────────────────────────────────────────────
def mape(y_true, y_pred):
    """Mean Absolute Percentage Error"""
    mask = y_true != 0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def evaluate_model(model, X_test, y_test, scaler_y, name):
    """Evaluate a trained model and return metrics dict."""
    y_pred_scaled = model.predict(X_test, verbose=0)
    y_pred = scaler_y.inverse_transform(y_pred_scaled)
    y_true = scaler_y.inverse_transform(y_test)
    r2 = float(r2_score(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae_val = float(mean_absolute_error(y_true, y_pred))
    mape_val = mape(y_true.flatten(), y_pred.flatten())
    print(f"\n{name}: R2={r2:.4f} RMSE={rmse:.4f} MAE={mae_val:.4f} MAPE={mape_val:.2f}%")
    return {"model": name, "r2": r2, "rmse": rmse, "mae": mae_val, "mape": mape_val}


print("\n" + "=" * 50)
print("EVALUATING ALL MODELS")
print("=" * 50)

all_metrics = []
models_list = [
    (m1, "BiLSTM"),
    (m2, "Attention-LSTM"),
    (m3, "CNN-BiLSTM"),
    (m4, "GRU-Attention"),
    (m5, "Transformer"),
]
for model, name in models_list:
    metrics = evaluate_model(model, X_test, y_test, scaler_y, name)
    all_metrics.append(metrics)

with open("ml/saved_models/training_metrics.json", "w") as f:
    json.dump(all_metrics, f, indent=2)

print("\n" + "=" * 50)
print("ALL 5 MODELS TRAINED AND SAVED")
print("=" * 50)
print("\nFiles saved in ml/saved_models/:")
for fname in sorted(os.listdir("ml/saved_models/")):
    fpath = os.path.join("ml/saved_models/", fname)
    size_mb = os.path.getsize(fpath) / (1024 * 1024)
    print(f"  - {fname} ({size_mb:.2f} MB)")
