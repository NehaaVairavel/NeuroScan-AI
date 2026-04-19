import joblib, numpy as np, os, warnings
warnings.filterwarnings('ignore')

model_path = 'parkinson_model.pkl'
scaler_path = 'scaler.pkl'

print('parkinson_model.pkl exists:', os.path.exists(model_path))
print('parkinson_model.pkl size:', os.path.getsize(model_path), 'bytes')

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)

print()
print('=== MODEL INFO ===')
print('Type:', type(model).__name__)
print('n_features_in_:', getattr(model, 'n_features_in_', 'N/A'))
print('classes_:', model.classes_)

# Known healthy UCI samples
healthy_samples = [
    [119.992,157.302,74.997,0.00784,0.00007,0.0037,0.00432,0.01109,0.04374,0.426,0.02182,0.0313,0.02971,0.06545,0.02211,21.033,0.414783,0.81509,-4.813031,0.266482,2.301442,0.284654],
    [122.400,148.650,113.819,0.00968,0.00008,0.00465,0.00696,0.01394,0.06134,0.626,0.03134,0.04518,0.04368,0.09403,0.01929,19.085,0.458359,0.819521,-4.075192,0.335590,2.486855,0.368674],
    [197.076,206.896,192.055,0.00289,0.00001,0.00166,0.00168,0.00498,0.01098,0.097,0.00563,0.00680,0.00802,0.01689,0.00339,26.775,0.422229,0.741367,-7.348300,0.177551,1.743867,0.085569],
]

# Known Parkinson UCI samples
park_samples = [
    [162.568,198.346,77.630,0.00502,0.00003,0.00280,0.00253,0.00841,0.01791,0.168,0.00793,0.01057,0.01799,0.02379,0.01140,24.444,0.444310,0.849020,-5.148120,0.310294,2.038703,0.243473],
]

print()
print('=== HEALTHY SAMPLES ===')
for i, s in enumerate(healthy_samples):
    d = np.array([s])
    d_scaled = scaler.transform(d)
    prob = model.predict_proba(d_scaled)[0]
    label = 'Parkinson' if prob[1] >= 0.6 else 'Healthy'
    print(f'Sample {i+1}: p_healthy={prob[0]:.3f}, p_parkinson={prob[1]:.3f} -> {label}')

print()
print('=== PARKINSON SAMPLES ===')
for i, s in enumerate(park_samples):
    d = np.array([s])
    d_scaled = scaler.transform(d)
    prob = model.predict_proba(d_scaled)[0]
    label = 'Parkinson' if prob[1] >= 0.6 else 'Healthy'
    print(f'Sample {i+1}: p_healthy={prob[0]:.3f}, p_parkinson={prob[1]:.3f} -> {label}')
