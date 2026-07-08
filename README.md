# NeuroScan-AI

A machine learning-powered web application for early detection of Parkinson's Disease through voice/audio analysis. Users upload an audio sample, and the system extracts relevant acoustic features to predict the likelihood of Parkinson's Disease, served through a Flask web interface.

---

## Overview

NeuroScan-AI analyzes voice recordings for biomarkers associated with Parkinson's Disease — a condition known to affect speech patterns, pitch, and vocal stability. The system uses a trained machine learning model to classify uploaded audio samples and returns a diagnostic prediction through a simple web interface, aiming to support early, non-invasive screening.

---

## Features

- **Audio-based Parkinson's detection** — upload a voice sample and receive a prediction
- **Trained ML classification model** (`parkinson_model.pkl`) with feature scaling (`scaler.pkl`)
- **Web-based interface** built with Flask, HTML templates, and static assets
- **Model retraining pipeline** to update the model as new data becomes available
- **Model verification & validation tools** to check prediction thresholds and result accuracy
- **Jupyter notebook** documenting the model development and experimentation process

---

## Tech Stack

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Jupyter](https://img.shields.io/badge/Jupyter-F37626?style=flat-square&logo=jupyter&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

- **Backend:** Python, Flask
- **Machine Learning:** scikit-learn (classification model + feature scaling)
- **Frontend:** HTML templates, CSS, JavaScript
- **Development & Experimentation:** Jupyter Notebook

---

## Project Structure

```
NeuroScan-AI/
├── ML_Models/                          # Trained/experimental model files
├── frontend/                           # Frontend interface code
├── static/assets/                      # Static assets (CSS, JS, images)
├── templates/                          # Flask HTML templates
├── uploads/                            # Uploaded audio files for diagnosis
├── utils/                              # Helper/utility scripts
├── venv/                               # Python virtual environment (excluded from Git)
├── Parkinson_Disease_Detection.ipynb   # Model development & experimentation notebook
├── app.py                              # Flask application entry point
├── diagnose_model.py                   # Runs diagnosis/prediction on input audio
├── train_model.py                      # Trains the Parkinson's detection model
├── retrain_model.py                    # Retrains the model with updated data
├── validate_threshold.py               # Validates prediction threshold settings
├── verify_model.py                     # Verifies trained model integrity/performance
├── verify_results.txt                  # Logged verification results
├── parkinson_model.pkl                 # Serialized trained classification model
├── scaler.pkl                          # Serialized feature scaler
├── parkinsons.data                     # Dataset used for training/evaluation
├── requirements.txt                    # Python dependencies
└── README.md
```

---

## How It Works

1. **Data & Training** — `train_model.py` uses the `parkinsons.data` dataset to train a classification model, saving the trained model and scaler as `parkinson_model.pkl` and `scaler.pkl`.
2. **Diagnosis** — A user uploads an audio file through the Flask web interface; `diagnose_model.py` extracts relevant features and generates a prediction via `app.py`.
3. **Validation** — `validate_threshold.py` and `verify_model.py` are used to check prediction thresholds and confirm model reliability, with results logged in `verify_results.txt`.
4. **Retraining** — `retrain_model.py` allows the model to be updated as new data becomes available, keeping predictions current.

---

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NehaaVairavel/NeuroScan-AI.git
   cd NeuroScan-AI
   ```

2. **Create a virtual environment and install dependencies**
   ```bash
   python -m venv venv
   source venv/bin/activate      # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Run the app**
   ```bash
   python app.py
   ```
   Visit `http://127.0.0.1:5000` in your browser to upload an audio sample and get a prediction.

4. **(Optional) Retrain the model**
   ```bash
   python retrain_model.py
   ```

---

## Disclaimer

This project is intended for educational and research purposes only. It is **not** a certified medical diagnostic tool and should not be used as a substitute for professional medical evaluation. Any predictions made by this system should be verified by a qualified healthcare provider.

---

## Future Improvements

- Expand the training dataset for improved generalization across diverse voice samples
- Add confidence scores alongside predictions
- Support additional biomarkers (e.g., tremor-based input) for multi-modal detection
- Deploy the application to a live hosting platform for public access

---

## Author

**Nehaa Vairavel**
📧 nehaaselvi2005@gmail.com
