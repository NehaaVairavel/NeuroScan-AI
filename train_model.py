import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load dataset
data = pd.read_csv("parkinsons.data")

# Remove name column
data = data.drop(["name"], axis=1)

# Split features and target
X = data.drop(["status"], axis=1)
y = data["status"]

# Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Scaling
scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Model
model = RandomForestClassifier(n_estimators=200)

model.fit(X_train_scaled, y_train)

# Accuracy
pred = model.predict(X_test_scaled)

print("Accuracy:", accuracy_score(y_test, pred))

# Save model
joblib.dump(model, "parkinson_model.pkl")
joblib.dump(scaler, "scaler.pkl")

print("Model saved successfully!")
