"""
app.py  —  Parkinson's Disease Detection  (Production Flask Backend)
"""
import os
import uuid
import logging
import traceback

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── App setup ────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB upload limit
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg", "webm", "m4a", "flac"}


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ── Model loading ─────────────────────────────────────────────────────────────
def _find(primary: str, fallback: str) -> str:
    """Return first path that exists."""
    return primary if os.path.exists(primary) else fallback

MODEL_PATH  = _find(os.path.join("models", "parkinson_model.pkl"), "parkinson_model.pkl")
SCALER_PATH = _find(os.path.join("models", "scaler.pkl"),          "scaler.pkl")

try:
    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    logger.info("Model loaded from  : %s", MODEL_PATH)
    logger.info("Scaler loaded from : %s", SCALER_PATH)
except Exception as exc:
    logger.critical("Failed to load model/scaler: %s", exc)
    raise


# ── Core prediction helper ───────────────────────────────────────────────────
def _run_prediction(features: list) -> dict:
    """Run model prediction and return binary result string."""
    try:
        if features is None or len(features) != 22:
            return {
                "prediction": "No Parkinson’s Detected",
                "confidence": 0,
                "risk_level": "Low",
                "features": features or []
            }

        data = np.array([features], dtype=float)
        data = np.nan_to_num(data, nan=0.0)

        # 1. Scaling
        data_scaled = scaler.transform(data)
        data_scaled = np.nan_to_num(data_scaled, nan=0.0)

        # 2. Extract Probability
        probs = model.predict_proba(data_scaled)[0]
        prob = float(probs[1]) # Probability of class 1 (Parkinson's)

        # 3. Decision Logic — threshold raised to 0.75 to reduce false positives
        # (UCI dataset has 75% Parkinson bias, so a higher bar is needed for healthy classification)
        detected = prob >= 0.75
        confidence = prob if detected else (1 - prob)
        confidence_pct = round(confidence * 100, 2)

        # 4. Risk Level
        if not detected:
            risk = "Low"
        else:
            if confidence >= 0.8:
                risk = "High"
            else:
                risk = "Moderate"

        return {
            "prediction": "Parkinson’s Detected" if detected else "No Parkinson’s Detected",
            "confidence": confidence_pct,
            "risk_level": risk,
            "features": features
        }

    except Exception as exc:
        logger.error("Prediction error: %s", exc)
        return {
            "prediction": "No Parkinson’s Detected",
            "confidence": 0,
            "risk_level": "Low",
            "error": str(exc)
        }




# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({"status": "healthy", "message": "Parkinson's Prediction API is running"}), 200


@app.route('/predict-audio', methods=['POST'])
def predict_audio():
    """REST endpoint — returns detailed JSON."""
    if "audio" not in request.files or request.files["audio"].filename == "":
        return jsonify({"error": "No audio file provided"}), 400

    file     = request.files["audio"]
    if not _allowed(file.filename):
        return jsonify({"error": "Unsupported file format"}), 400

    ext      = (file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else "wav")
    tmp_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}.{ext}")
    file.save(tmp_path)

    try:
        from utils.feature_extraction import extract_features
        features = extract_features(tmp_path)

        # ── Log extracted features for debugging ─────────────────────────────
        NAMES = ['Fo','Fhi','Flo','Jitter%','JitterAbs','RAP','PPQ','DDP',
                 'Shimmer','ShimDB','APQ3','APQ5','APQ','DDA',
                 'NHR','HNR','RPDE','DFA','spread1','spread2','D2','PPE']
        logger.info("Extracted features: %s",
                    {n: round(v, 5) for n, v in zip(NAMES, features)})

        # ── UCI dataset reasonable ranges ─────────────────────────────────────
        UCI_RANGES = [
            (80, 270), (100, 600), (65, 240),
            (0.0, 0.04), (0.0, 0.0003), (0.0, 0.02), (0.0, 0.02), (0.0, 0.07),
            (0.0, 0.12), (0.0, 1.3), (0.0, 0.06), (0.0, 0.08), (0.0, 0.14), (0.0, 0.17),
            (0.0, 0.31), (8.0, 34.0),
            (0.2, 0.69), (0.57, 0.97), (-8.5, -1.5), (0.006, 0.53), (1.4, 3.7), (0.0, 0.53),
        ]
        out_of_range = [
            NAMES[i] for i, (val, (lo, hi)) in enumerate(zip(features, UCI_RANGES))
            if not (lo * 0.3 <= val <= hi * 3.0)
        ]
        if len(out_of_range) > 10:
            logger.warning("Too many out-of-range features (%d): %s", len(out_of_range), out_of_range)
            return jsonify({
                "error": (
                    f"{len(out_of_range)} extracted features are outside expected voice biomarker ranges. "
                    "Please record a clear sustained 'Aaaaa' vowel (3-5 seconds) in a quiet room."
                )
            }), 422

        return jsonify(_run_prediction(features))
    except ValueError as e:
        logger.warning("Audio quality rejected: %s", e)
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        logger.error("Audio processing failed: %s", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.route("/predict", methods=["POST"])
@app.route("/manual-predict", methods=["POST"])
def predict_json():
    """REST endpoint — accepts JSON {features: [22 values]}, returns prediction."""
    try:
        body = request.get_json(force=True, silent=True)
        if not body or "features" not in body:
            return jsonify({"error": "Request body must contain a 'features' key."}), 400

        features = body["features"]
        if len(features) != 22:
            return jsonify({"error": f"Expected 22 features, got {len(features)}."}), 400

        features = [float(v) for v in features]
        logger.info("JSON API — features received: %s", features)
        return jsonify(_run_prediction(features))

    except ValueError as exc:
        return jsonify({"error": f"Invalid feature values: {exc}"}), 400
    except Exception as exc:
        logger.error(traceback.format_exc())
        return jsonify({"error": str(exc)}), 500


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
