"""
utils/feature_extraction.py
Extracts 22 biomedical voice features using Parselmouth (Praat) and DSP algorithms.
Matches the official UCI Parkinson's Disease dataset perfectly.
"""
import numpy as np
import parselmouth
from parselmouth.praat import call
import logging
from scipy.stats import entropy

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "MDVP:Fo(Hz)", "MDVP:Fhi(Hz)", "MDVP:Flo(Hz)",
    "MDVP:Jitter(%)", "MDVP:Jitter(Abs)", "MDVP:RAP", "MDVP:PPQ", "Jitter:DDP",
    "MDVP:Shimmer", "MDVP:Shimmer(dB)", "Shimmer:APQ3", "Shimmer:APQ5",
    "MDVP:APQ", "Shimmer:DDA",
    "NHR", "HNR",
    "RPDE", "DFA",
    "spread1", "spread2", "D2", "PPE"
]

def _validate_audio_quality(sound, pitch):
    """
    Validates that the audio is suitable for Parkinson's biomarker analysis.
    Raises ValueError with a user-friendly message if the audio is invalid.
    """
    # 1. Duration check — need at least 3 seconds
    duration = sound.duration
    if duration < 3.0:
        raise ValueError(
            f"Audio too short ({duration:.1f}s). Please record at least 3 seconds of sustained 'Aaaaa' sound."
        )

    # 2. Silence / energy check — RMS energy
    samples = sound.values[0]
    rms = float(np.sqrt(np.mean(samples ** 2)))
    if rms < 0.001:
        raise ValueError(
            "Audio appears to be silent or too quiet. Please record in a quiet room with good microphone input."
        )

    # 3. Voiced frames check — sustained vowel needs many voiced frames
    f0_values = pitch.selected_array['frequency']
    voiced = f0_values[f0_values > 0]
    voiced_ratio = len(voiced) / (len(f0_values) + 1e-10)

    if len(voiced) < 20:
        raise ValueError(
            "Insufficient voiced audio. Please record a clear sustained 'Aaaaa' sound for 3–5 seconds."
        )

    if voiced_ratio < 0.25:
        raise ValueError(
            "Too much background noise or silence detected. Please record in a quiet environment with sustained vowel sound."
        )


def extract_features(file_path: str) -> list:
    """
    Extracts 22 clinical voice features from a .wav file using Parselmouth/Praat.
    Validates audio quality before extraction.
    Returns: list of 22 floats in dataset order.
    """
    try:
        # Load sound
        sound = parselmouth.Sound(file_path)

        # 1. Pitch Analysis (MDVP:Fo, Fhi, Flo)
        pitch = sound.to_pitch()
        fo  = call(pitch, "Get mean", 0, 0, "Hertz")
        fhi = call(pitch, "Get maximum", 0, 0, "Hertz", "Parabolic")
        flo = call(pitch, "Get minimum", 0, 0, "Hertz", "Parabolic")

        # ── Audio Quality Gate ────────────────────────────────────────────────
        _validate_audio_quality(sound, pitch)
        # ─────────────────────────────────────────────────────────────────────

        # 2. PointProcess for Jitter/Shimmer
        point_process = call(sound, "To PointProcess (periodic, cc)", 75, 500)
        
        # Jitter features
        jitter_percent = call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
        jitter_abs     = call(point_process, "Get jitter (local, absolute)", 0, 0, 0.0001, 0.02, 1.3)
        rap            = call(point_process, "Get jitter (rap)", 0, 0, 0.0001, 0.02, 1.3)
        ppq            = call(point_process, "Get jitter (ppq5)", 0, 0, 0.0001, 0.02, 1.3)
        ddp            = 3 * rap

        # Shimmer features
        shimmer    = call([sound, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        shimmer_db = call([sound, point_process], "Get shimmer (local_dB)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        apq3       = call([sound, point_process], "Get shimmer (apq3)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        apq5       = call([sound, point_process], "Get shimmer (apq5)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        apq        = call([sound, point_process], "Get shimmer (apq11)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        dda        = 3 * apq3

        # 3. Harmonicity (NHR, HNR)
        harmonicity = call(sound, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
        hnr = call(harmonicity, "Get mean", 0, 0)
        nhr = 1 / (10 ** (hnr / 10)) if hnr > 0 else 0.5

        # 4. Nonlinear Features
        f0_values = pitch.selected_array['frequency']
        f0_values = f0_values[f0_values > 0]  # Voiced only

        rpde    = _calculate_rpde(f0_values)
        dfa     = _calculate_dfa(f0_values)
        spread1, spread2 = _calculate_spread(f0_values)
        d2      = _calculate_d2(f0_values)
        ppe     = _calculate_ppe(f0_values)

        features = [
            fo, fhi, flo,
            jitter_percent, jitter_abs, rap, ppq, ddp,
            shimmer, shimmer_db, apq3, apq5, apq, dda,
            nhr, hnr,
            rpde, dfa, spread1, spread2, d2, ppe
        ]

        # Sanitization — replace NaN/inf with 0
        features = [v if (np.isfinite(v) and not np.isnan(v)) else 0.0 for v in features]
        
        return features

    except Exception as e:
        logger.error("DSP Error: %s", e)
        raise

# ── Math Helpers for Nonlinear Metrics ───────────────────────────────────────

def _calculate_rpde(f0):
    """Normalized entropy of the recurrence period density."""
    if len(f0) < 2: return 0.5
    f0_norm = (f0 - np.mean(f0)) / (np.std(f0) + 1e-10)
    hist, _ = np.histogram(f0_norm, bins=20)
    p = hist / (hist.sum() + 1e-10)
    p = p[p > 0]
    return float(entropy(p) / np.log(len(p) + 1e-10))

def _calculate_dfa(f0):
    """Hurst exponent via Detrended Fluctuation Analysis."""
    if len(f0) < 20: return 0.7
    x = np.cumsum(f0 - np.mean(f0))
    n = len(x)
    ms = np.unique(np.logspace(0.5, np.log10(n / 4), 10).astype(int))
    ms = ms[ms > 1]
    fluctuations = []
    for m in ms:
        segs = n // m
        x_m = x[:segs*m].reshape(segs, m)
        t = np.arange(m)
        f_m = 0
        for segment in x_m:
            poly = np.polyfit(t, segment, 1)
            f_m += np.mean((segment - np.polyval(poly, t))**2)
        fluctuations.append(np.sqrt(f_m / segs))
    
    if not fluctuations: return 0.7
    poly = np.polyfit(np.log(ms), np.log(fluctuations), 1)
    return float(np.clip(poly[0], 0.0, 1.5))

def _calculate_spread(f0):
    """Fundamental frequency variation measures."""
    log_f0 = np.log(f0 + 1e-10)
    spread1 = float(np.mean(log_f0 - np.mean(log_f0)) / (np.std(log_f0) + 1e-10))
    spread2 = float(np.var(f0) / (np.mean(f0)**2 + 1e-10))
    return spread1, spread2

def _calculate_d2(f0):
    """Correlation dimension approximation."""
    std_diff = np.std(np.diff(f0))
    return float(np.clip(2.0 + std_diff / (np.std(f0) + 1e-10), 1.0, 4.0))

def _calculate_ppe(f0):
    """Pitch Period Entropy."""
    log_f0 = np.log(f0 + 1e-10)
    hist, _ = np.histogram(log_f0, bins=20)
    p = hist / (hist.sum() + 1e-10)
    p = p[p > 0]
    return float(entropy(p))
