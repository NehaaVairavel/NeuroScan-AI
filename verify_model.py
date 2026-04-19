import pandas as pd
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, classification_report

# 1. LOAD MODEL AND SCALER
print("--- Loading Model and Scaler ---")
try:
    model = joblib.load("parkinson_model.pkl")
    scaler = joblib.load("scaler.pkl")
    print("Success: Model and Scaler loaded.\n")
except Exception as e:
    print(f"Error loading model/scaler: {e}")
    exit()

# 2. PREPROCESS DATA
print("--- Loading and Preprocessing Dataset ---")
try:
    data = pd.read_csv("parkinsons.data")
    
    # Check for NaN values
    if data.isnull().values.any():
        print("Warning: NaN values found. Filling with 0.")
        data = data.fillna(0)
    
    # Remove 'name' and define y
    X = data.drop(["name", "status"], axis=1)
    y = data["status"]
    
    print(f"Dataset Loaded: {data.shape[0]} samples, {X.shape[1]} features selected.")
    if X.shape[1] != 22:
        print(f"Warning: Expected 22 features, but found {X.shape[1]}. Check feature order.")
    
except Exception as e:
    print(f"Error processing data: {e}")
    exit()

# 7. FULL DATASET EVALUATION (Splitting)
# Using random_state=42 to ensure consistency with common training patterns
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Split completed: {len(X_test)} samples in test set.\n")

# 3. MAKE PREDICTIONS
# Apply Scaler to X_test
X_test_scaled = scaler.transform(X_test)

# Predict
predictions = model.predict(X_test_scaled)
probabilities = model.predict_proba(X_test_scaled)

# 6. PRINT RESULTS FOR EACH SAMPLE
print("--- Individual Sample Comparisons ---")
for i in range(len(y_test)):
    actual_status = y_test.iloc[i]
    prediction = predictions[i]
    prob = probabilities[i][1]
    print(f"Sample {i+1}: Actual: {actual_status} | Predicted: {prediction} | Prob(P): {prob:.4f}")

# 5. CALCULATE METRICS
print("\n--- Final Evaluation Metrics ---")
accuracy = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions)
recall = recall_score(y_test, predictions)
cm = confusion_matrix(y_test, predictions)

print(f"Accuracy  : {accuracy * 100:.2f}%")
print(f"Precision : {precision * 100:.2f}%")
print(f"Recall    : {recall * 100:.2f}%")
print("\nConfusion Matrix:")
print(cm)

print("\n--- Detailed Classification Report ---")
print(classification_report(y_test, predictions))

# 8. EXPLANATION
print("\n--- Model Verification Conclusion ---")
if accuracy > 0.85:
    print("STATUS: Model is working correctly and shows strong predictive power on the dataset.")
elif accuracy > 0.70:
    print("STATUS: Model is performing moderately. Check for data imbalances or feature variance.")
else:
    print("STATUS: Model performance is low. Re-verify feature extraction and training process.")
