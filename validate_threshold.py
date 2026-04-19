"""
Final validation: tests current model with all UCI healthy + parkinson samples.
Shows what threshold gives best balance.
"""
import warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd, joblib

model  = joblib.load('parkinson_model.pkl')
scaler = joblib.load('scaler.pkl')

COLS = [
    'MDVP:Fo(Hz)','MDVP:Fhi(Hz)','MDVP:Flo(Hz)',
    'MDVP:Jitter(%)','MDVP:Jitter(Abs)','MDVP:RAP','MDVP:PPQ','Jitter:DDP',
    'MDVP:Shimmer','MDVP:Shimmer(dB)','Shimmer:APQ3','Shimmer:APQ5',
    'MDVP:APQ','Shimmer:DDA','NHR','HNR',
    'RPDE','DFA','spread1','spread2','D2','PPE'
]

df = pd.read_csv('parkinsons.data')
healthy   = df[df['status'] == 0]
parkinson = df[df['status'] == 1]

def evaluate_threshold(t):
    h_probs = model.predict_proba(scaler.transform(healthy[COLS].values))[:,1]
    p_probs = model.predict_proba(scaler.transform(parkinson[COLS].values))[:,1]
    h_correct = (h_probs < t).sum()
    p_correct = (p_probs >= t).sum()
    return h_correct, len(healthy), p_correct, len(parkinson)

print("Threshold | Healthy Correct | Parkinson Correct")
print("-" * 52)
for t in [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]:
    hc, ht, pc, pt = evaluate_threshold(t)
    print(f"  {t:.2f}    |   {hc:2d}/{ht} ({hc/ht*100:.0f}%)     |   {pc:3d}/{pt} ({pc/pt*100:.0f}%)")

print()
print("Current app.py uses threshold = 0.75")
hc, ht, pc, pt = evaluate_threshold(0.75)
print(f"  Healthy correctly identified: {hc}/{ht} ({hc/ht*100:.0f}%)")
print(f"  Parkinson correctly identified: {pc}/{pt} ({pc/pt*100:.0f}%)")
