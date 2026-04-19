"""
Retrain with a better calibrated model - using cross-validation and higher threshold.
"""
import warnings; warnings.filterwarnings('ignore')
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.calibration import CalibratedClassifierCV
import joblib

# Load dataset
df = pd.read_csv('parkinsons.data')

FEATURE_COLS = [
    'MDVP:Fo(Hz)', 'MDVP:Fhi(Hz)', 'MDVP:Flo(Hz)',
    'MDVP:Jitter(%)', 'MDVP:Jitter(Abs)', 'MDVP:RAP', 'MDVP:PPQ', 'Jitter:DDP',
    'MDVP:Shimmer', 'MDVP:Shimmer(dB)', 'Shimmer:APQ3', 'Shimmer:APQ5',
    'MDVP:APQ', 'Shimmer:DDA', 'NHR', 'HNR',
    'RPDE', 'DFA', 'spread1', 'spread2', 'D2', 'PPE'
]

X = df[FEATURE_COLS].values
y = df['status'].values

print(f"Dataset: {X.shape}, Classes: {np.bincount(y)} (0=healthy, 1=parkinson)")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)

# Use SVM with Platt calibration - better probability estimates than RF for imbalanced data
base = SVC(kernel='rbf', C=10, gamma='scale', probability=True, class_weight='balanced', random_state=42)
base.fit(X_train_sc, y_train)

y_pred = base.predict(X_test_sc)
print(f"\nSVM Accuracy: {accuracy_score(y_test, y_pred)*100:.1f}%")
print(classification_report(y_test, y_pred, target_names=['Healthy','Parkinson']))

# Cross-validation
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(base, X_train_sc, y_train, cv=cv, scoring='accuracy')
print(f"5-Fold CV accuracy: {cv_scores.mean()*100:.1f}% +/- {cv_scores.std()*100:.1f}%")

# Check on known healthy samples
healthy_samples = [
    [119.992,157.302,74.997,0.00784,0.00007,0.0037,0.00432,0.01109,0.04374,0.426,0.02182,0.0313,0.02971,0.06545,0.02211,21.033,0.414783,0.81509,-4.813031,0.266482,2.301442,0.284654],
    [122.400,148.650,113.819,0.00968,0.00008,0.00465,0.00696,0.01394,0.06134,0.626,0.03134,0.04518,0.04368,0.09403,0.01929,19.085,0.458359,0.819521,-4.075192,0.335590,2.486855,0.368674],
    [197.076,206.896,192.055,0.00289,0.00001,0.00166,0.00168,0.00498,0.01098,0.097,0.00563,0.00680,0.00802,0.01689,0.00339,26.775,0.422229,0.741367,-7.348300,0.177551,1.743867,0.085569],
]

print("\n=== SANITY CHECK - KNOWN HEALTHY UCI SAMPLES ===")
for i, s in enumerate(healthy_samples):
    prob = base.predict_proba(scaler.transform([s]))[0]
    label = 'Parkinson' if prob[1] >= 0.6 else 'Healthy'
    print(f"Sample {i+1}: p_healthy={prob[0]:.3f}, p_parkinson={prob[1]:.3f} -> {label}")

# Save
joblib.dump(base, 'parkinson_model.pkl')
joblib.dump(scaler, 'scaler.pkl')
print("\nSVM model saved as parkinson_model.pkl")
