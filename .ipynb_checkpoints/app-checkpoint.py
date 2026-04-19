from flask import Flask, render_template, request
import joblib
import numpy as np

app = Flask(__name__)

# Load model AND scaler
model = joblib.load("parkinson_model.pkl")
scaler = joblib.load("scaler.pkl")

@app.route('/', methods=['GET', 'POST'])
def index():
    prediction = None

    if request.method == 'POST':
        try:
            # Read 22 inputs
            data = [float(request.form[f'feature{i}']) for i in range(1, 23)]
            data = np.array([data])

            # 🔥 SCALE INPUT (THIS WAS MISSING BEFORE)
            data_scaled = scaler.transform(data)

            result = model.predict(data_scaled)

            if result[0] == 1:
                prediction = "Parkinson’s Disease Detected"
            else:
                prediction = "Healthy"

        except Exception as e:
            prediction = f"Error: {e}"

    return render_template("index.html", prediction=prediction)

if __name__ == "__main__":
    app.run(debug=True)

