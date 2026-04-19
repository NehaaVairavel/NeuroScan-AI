import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend, PolarRadiusAxis
} from 'recharts'
import { FiRefreshCw, FiDownload, FiInfo, FiCheckCircle,
  FiAlertTriangle, FiActivity, FiBarChart2, FiZap, FiUser,
  FiClock, FiCpu, FiUpload, FiMic
} from 'react-icons/fi'
import { HiOutlineBeaker } from 'react-icons/hi'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { convertToWav } from '../utils/audioConverter'

// ── Feature Metadata ───────────────────────────────────────────────────────
const FEATURES = [
  { key: 'fo',       label: 'MDVP:Fo(Hz)',      placeholder: '154.229', tooltip: 'Average vocal fundamental frequency — average pitch of voice', min: 50,   max: 300  },
  { key: 'fhi',      label: 'MDVP:Fhi(Hz)',     placeholder: '197.105', tooltip: 'Maximum vocal fundamental frequency recorded', min: 50,   max: 600  },
  { key: 'flo',      label: 'MDVP:Flo(Hz)',     placeholder: '116.325', tooltip: 'Minimum vocal fundamental frequency recorded', min: 50,   max: 300  },
  { key: 'jitter',   label: 'MDVP:Jitter(%)',   placeholder: '0.00784', tooltip: 'Variation in F0 as a percentage — cycle-to-cycle instability', min: 0,    max: 0.1  },
  { key: 'jitterAbs',label: 'MDVP:Jitter(Abs)', placeholder: '0.000054',tooltip: 'Absolute measure of jitter in microseconds', min: 0,    max: 0.001},
  { key: 'rap',      label: 'MDVP:RAP',         placeholder: '0.00370', tooltip: 'Relative Average Perturbation — 3-period jitter measure', min: 0,    max: 0.05 },
  { key: 'ppq',      label: 'MDVP:PPQ',         placeholder: '0.00432', tooltip: 'Five-point Period Perturbation Quotient', min: 0,    max: 0.05 },
  { key: 'ddp',      label: 'Jitter:DDP',       placeholder: '0.01109', tooltip: 'Average difference of differences between F0 periods', min: 0,    max: 0.1  },
  { key: 'shimmer',  label: 'MDVP:Shimmer',     placeholder: '0.02971', tooltip: 'Amplitude perturbation — variation in amplitude of vocal signal', min: 0,    max: 0.2  },
  { key: 'shimmerDb',label: 'MDVP:Shimmer(dB)', placeholder: '0.28800', tooltip: 'Shimmer expressed in decibels', min: 0,    max: 2    },
  { key: 'apq3',     label: 'Shimmer:APQ3',     placeholder: '0.01500', tooltip: 'Three-point Amplitude Perturbation Quotient', min: 0,    max: 0.1  },
  { key: 'apq5',     label: 'Shimmer:APQ5',     placeholder: '0.02263', tooltip: 'Five-point Amplitude Perturbation Quotient', min: 0,    max: 0.15 },
  { key: 'apq',      label: 'MDVP:APQ',         placeholder: '0.02971', tooltip: 'Amplitude Perturbation Quotient (11-point)', min: 0,    max: 0.15 },
  { key: 'dda',      label: 'Shimmer:DDA',       placeholder: '0.04500', tooltip: 'Average absolute difference between consecutive differences of amplitude', min: 0,    max: 0.3  },
  { key: 'nhr',      label: 'NHR',              placeholder: '0.01140', tooltip: 'Noise-to-Harmonics Ratio — measure of noise in voice', min: 0,    max: 0.35 },
  { key: 'hnr',      label: 'HNR',              placeholder: '21.640',  tooltip: 'Harmonics-to-Noise Ratio — measure of voice quality', min: 0,    max: 33   },
  { key: 'rpde',     label: 'RPDE',             placeholder: '0.41457', tooltip: 'Recurrence Period Density Entropy — nonlinear voice complexity measure', min: 0,    max: 1    },
  { key: 'dfa',      label: 'DFA',              placeholder: '0.71575', tooltip: 'Detrended Fluctuation Analysis — signal fractal scaling exponent', min: 0.5,  max: 1    },
  { key: 'spread1',  label: 'spread1',          placeholder: '-5.6840', tooltip: 'Nonlinear measure of fundamental frequency variation (spread1)', min: -8,   max: 0    },
  { key: 'spread2',  label: 'spread2',          placeholder: '0.22680', tooltip: 'Nonlinear measure of fundamental frequency variation (spread2)', min: 0,    max: 0.5  },
  { key: 'd2',       label: 'D2',              placeholder: '2.30100', tooltip: 'Correlation dimension — measure of strange attractor complexity', min: 1,    max: 4    },
  { key: 'ppe',      label: 'PPE',             placeholder: '0.28400', tooltip: 'Pitch Period Entropy — impaired pitch control measure', min: 0,    max: 0.6  },
]

// ── Preset Values ──────────────────────────────────────────────────────────
const HEALTHY_PRESET = {
  fo: 197.076, fhi: 206.896, flo: 192.055,
  jitter: 0.00289, jitterAbs: 0.00001, rap: 0.00166, ppq: 0.00168, ddp: 0.00498,
  shimmer: 0.01098, shimmerDb: 0.097, apq3: 0.00563, apq5: 0.00680, apq: 0.00802, dda: 0.01689,
  nhr: 0.00339, hnr: 26.775,
  rpde: 0.422229, dfa: 0.741367, spread1: -7.348, spread2: 0.177551, d2: 1.743, ppe: 0.085569
}

const PARKINSON_PRESET = {
  fo: 119.992, fhi: 157.302, flo: 74.997,
  jitter: 0.00784, jitterAbs: 0.000070, rap: 0.00370, ppq: 0.006500, ddp: 0.01230,
  shimmer: 0.04374, shimmerDb: 0.426, apq3: 0.02182, apq5: 0.03130, apq: 0.02971, dda: 0.06546,
  nhr: 0.02211, hnr: 21.640,
  rpde: 0.536, dfa: 0.751, spread1: -4.813, spread2: 0.311, d2: 2.486, ppe: 0.365
}

// ── Healthy Averages for Chart Comparison ──────────────────────────────────
const HEALTHY_AVERAGES = FEATURES.map((f, i) => {
  const healthyVals = Object.values(HEALTHY_PRESET)
  return healthyVals[i]
})

// ── Helper: build feature array ────────────────────────────────────────────
const buildFeatureArray = (vals) =>
  FEATURES.map(f => parseFloat(vals[f.key] ?? 0))

// ── Removed: deriveConfidence (now managed by backend) ──────────────────────

// ── Toast Component ────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`toast toast-${t.type}`}
            onClick={() => remove(t.id)}
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Custom Recharts Tooltip ────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(12,26,58,0.95)',
      border: '1px solid rgba(59,130,246,0.3)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12
    }}>
      <p style={{ color: '#93c5fd', fontWeight: 700, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(5) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ParkinsonDetector({ mode = 'manual' }) {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [patientName, setPatientName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(null)
  const [result, setResult] = useState(null) // { detected, confidence, risk, raw, features }
  const [chartTab, setChartTab] = useState('bar')
  const [toasts, setToasts] = useState([])
  const [audioFile, setAudioFile] = useState(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const resultRef = useRef(null)
  const toastId = useRef(0)

  // ── Toast helpers ──────────────────────────────────────────────────────
  const addToast = useCallback((msg, type = 'info') => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])
  const removeToast = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), [])

  // ── Scroll to result ───────────────────────────────────────────────────
  useEffect(() => {
    if (result) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [result])

  // ── Reset when mode changes ────────────────────────────────────────────
  useEffect(() => {
    setResult(null)
    setLoading(false)
    if(mode === 'audio') {
      setValues({})
    }
  }, [mode])

  // ── Audio Recording ────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([audioBlob], "recorded_voice.webm", { type: 'audio/webm' })
        setAudioFile(file)
        setAudioPreviewUrl(URL.createObjectURL(file))
        audioChunksRef.current = [] // reset
        addToast('Audio recorded successfully', 'success')
      }
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setAudioFile(null)
      setAudioPreviewUrl(null)
      addToast('Recording started...', 'info')
    } catch (err) {
      console.error(err)
      addToast('Microphone access denied or not available', 'error')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  // ── Handle input change ────────────────────────────────────────────────
  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }

  // ── Validate ───────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    FEATURES.forEach(f => {
      const v = values[f.key]
      if (v === '' || v === undefined || v === null) {
        errs[f.key] = 'Required'
      } else {
        const n = parseFloat(v)
        if (isNaN(n)) {
          errs[f.key] = 'Must be a number'
        } else if (n < f.min || n > f.max) {
          errs[f.key] = `Range: ${f.min} – ${f.max}`
        }
      }
    })
    return errs
  }

  // ── Load Preset ────────────────────────────────────────────────────────
  const loadPreset = (preset, label) => {
    const mapped = {}
    FEATURES.forEach(f => { mapped[f.key] = String(preset[f.key] ?? '') })
    setValues(mapped)
    setErrors({})
    setResult(null)
    addToast(`${label} sample loaded into form`, 'info')
  }

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    setValues({})
    setErrors({})
    setResult(null)
    setPatientName('')
    addToast('Form cleared', 'info')
  }

  const handlePredict = async () => {
    let hasError = false
    const errs = validate()
    
    if (!patientName || patientName.trim() === '') {
      errs.patientName = 'Patient name is required.'
      hasError = true
    }

    if (mode === 'manual') {
      if (Object.keys(errs).length > 0) hasError = true
    } else {
      if (!audioFile) {
        addToast('Please upload an audio file first', 'error')
        hasError = true
      }
    }

    if (hasError) {
      setErrors(errs)
      if (errs.patientName) {
        addToast('Patient name is required.', 'error')
        document.getElementById('patientName')?.focus()
      } else if (mode === 'manual') {
        addToast(`Please fix field error(s) before predicting`, 'error')
      }
      return
    }

    setLoading(true)
    setLoadingStep(mode === 'manual' ? 'Analyzing features...' : 'Uploading audio...')
    setResult(null)

    try {
      let res;
      if (mode === 'manual') {
        const features = buildFeatureArray(values)
        res = await fetch('http://localhost:5000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features }),
        })
      } else {
        await new Promise(resolve => setTimeout(resolve, 600))
        setLoadingStep('Connecting to AI server...')
        
        let fileToSend = audioFile;
        const isWav = audioFile.name?.toLowerCase().endsWith('.wav') || audioFile.type === 'audio/wav';
        if (!isWav) {
          setLoadingStep('Converting format to WAV...')
          const wavBlob = await convertToWav(audioFile);
          fileToSend = new File([wavBlob], "converted_audio.wav", { type: "audio/wav" });
        }
        
        const formData = new FormData()
        formData.append('audio', fileToSend)
        
        const fetchPromise = fetch('http://localhost:5000/predict-audio', {
          method: 'POST',
          body: formData,
        })
        
        await new Promise(resolve => setTimeout(resolve, 800))
        setLoadingStep('Extracting biomarkers...')
        
        res = await fetchPromise;
        
        await new Promise(resolve => setTimeout(resolve, 600))
        setLoadingStep('Generating result...')
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      if (!res.ok) {
        // Try to parse JSON error first (quality validation returns JSON)
        let errMsg = 'Server returned error'
        try {
          const errData = await res.json()
          if (errData.error) errMsg = errData.error
        } catch {
          const errText = await res.text()
          if (errText.toLowerCase().includes('not an audio file')) {
            errMsg = 'Unsupported audio format. Please upload a valid audio file.'
          }
        }
        throw new Error(errMsg)
      }

      const data = await res.json()
      
      if (data.error) {
        let msg = data.error
        if (msg.toLowerCase().includes('unsupported') || msg.includes('System error') || msg.toLowerCase().includes('not an audio file')) msg = 'Unsupported audio format.'
        if (msg.includes('Insufficient voiced audio') || msg.toLowerCase().includes('speech')) msg = 'No clear speech detected. Please record again.'
        throw new Error(msg)
      }

      const detected = !data.prediction.toLowerCase().includes('no parkinson')
      const cleanPrediction = detected ? 'Parkinson Detected' : 'No Parkinson Detected'

      setResult({
        detected,
        confidence: data.confidence,
        risk: data.risk_level,
        raw: cleanPrediction,
        features: data.features
      })

      // Update values if audio mode to reflect extracted features in charts
      if (mode === 'audio' && data.features) {
        const mapped = {}
        FEATURES.forEach((f, i) => { mapped[f.key] = String(data.features[i] ?? '') })
        setValues(mapped)
      }

      addToast(detected ? '⚠ Potential markers found' : '✓ No markers detected', detected ? 'error' : 'success')
    } catch (err) {
      console.error('API Error:', err)
      let msg = err.message || 'Unable to connect to backend. Please start Flask server on port 5000.'
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        msg = 'Unable to connect to backend. Please start Flask server on port 5000.'
      }
      addToast(msg, 'error')
    } finally {
      setLoading(false)
      setLoadingStep(null)
    }
  }

  // ── Download PDF ───────────────────────────────────────────────────────
  const downloadPDF = () => {
    if (!result) { addToast('Run a prediction first', 'error'); return }

    const doc = new jsPDF()
    const blue = [2, 132, 199] // matches light theme accent
    const dark = [15, 23, 42]

    // ==== PAGE 1: Summary Report ====
    // Header background
    doc.setFillColor(...blue)
    doc.rect(0, 0, 210, 45, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text("Parkinson Disease Screening Report", 105, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('NeuroScan AI', 105, 28, { align: 'center' })
    doc.setFontSize(9)
    doc.text('FOR CLINICAL USE ONLY — NOT A SUBSTITUTE FOR MEDICAL DIAGNOSIS', 105, 38, { align: 'center' })

    // Body
    doc.setTextColor(...dark)
    let y = 58

    const field = (label, value, color) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(label, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      if (color) doc.setTextColor(...color)
      else doc.setTextColor(...dark)
      doc.text(String(value), 14, y + 7)
      y += 18
    }

    const reportId = 'REP-' + Date.now().toString().slice(-6)
    
    // Patient Details
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...blue)
    doc.text('Patient Details', 14, y - 5)
    y += 5
    
    field('Patient Name', patientName || 'Not Provided')
    field('Date & Time', new Date().toLocaleString())
    field('Detection Method', mode === 'manual' ? 'Manual — 22 Biomedical Voice Features' : 'Audio — Auto Extracted Features')
    field('Report ID', reportId)

    // Prediction Summary Card (Filled Rect)
    y += 5
    doc.setFillColor(result.detected ? 254 : 240, result.detected ? 242 : 253, result.detected ? 242 : 244) // #fef2f2 / #f0fdf4
    doc.setDrawColor(result.detected ? 254 : 167, result.detected ? 202 : 243, result.detected ? 202 : 208) // Border colors
    doc.roundedRect(12, y, 185, 38, 4, 4, 'FD')
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text('Prediction Result', 18, y + 8)
    
    doc.setFontSize(16)
    doc.setTextColor(result.detected ? 220 : 16, result.detected ? 38 : 185, result.detected ? 38 : 129)
    doc.text(result.raw, 18, y + 16)
    
    doc.setFontSize(11)
    doc.setTextColor(...dark)
    doc.text(`Confidence: ${result.confidence}%`, 18, y + 25)
    doc.text(`Risk Level: ${result.risk}`, 18, y + 32)
    y += 48

    // Recommendation
    y += 4
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(12, y, 185, 28, 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...blue)
    doc.text('Recommendation', 18, y + 9)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...dark)
    const recoText = result.detected
      ? 'Medical consultation recommended.'
      : 'No abnormal biomarkers detected.'
    const split = doc.splitTextToSize(recoText, 175)
    doc.text(split, 18, y + 17)
    
    // Disclaimer
    y += 42
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Disclaimer:', 14, y)
    doc.setFont('helvetica', 'italic')
    doc.text('This AI tool is for screening support only.', 14, y + 5)
    doc.text('Not a final medical diagnosis.', 14, y + 10)

    // ==== PAGE 2: Full Feature Analysis ====
    doc.addPage()
    
    // Page 2 Header
    doc.setFillColor(...blue)
    doc.rect(0, 0, 210, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Biomedical Voice Feature Analysis', 105, 16, { align: 'center' })

    const tableData = FEATURES.map((f) => {
      const val = parseFloat(values[f.key] ?? 0);
      let status = 'Normal';
      
      const healthyVal = HEALTHY_PRESET[f.key];
      const parkinsonVal = PARKINSON_PRESET[f.key];
      
      if (healthyVal !== undefined && parkinsonVal !== undefined) {
         const diffHealthy = Math.abs(val - healthyVal);
         const diffParkinson = Math.abs(val - parkinsonVal);
         const totalDiff = Math.abs(healthyVal - parkinsonVal);
         // If it's leaning heavily towards Parkinson's threshold
         if (diffParkinson < diffHealthy && diffParkinson < totalDiff * 0.4) {
            status = 'Elevated';
         } else if (diffParkinson < diffHealthy) {
            status = 'Moderate';
         }
      }
      return [f.label, val.toFixed(5), status]
    })

    autoTable(doc, {
      startY: 35,
      head: [['Feature Name', 'Value', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: blue, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6, textColor: dark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 2) {
           const status = data.cell.raw;
           if (status === 'Elevated') {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fontStyle = 'bold';
           } else if (status === 'Moderate') {
              data.cell.styles.textColor = [245, 158, 11];
              data.cell.styles.fontStyle = 'bold';
           } else {
              data.cell.styles.textColor = [16, 185, 129];
              data.cell.styles.fontStyle = 'bold';
           }
        }
      }
    })

    // ==== Footer on Every Page ====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
       doc.setPage(i);
       const pageH = doc.internal.pageSize.height;
       doc.setFillColor(...blue);
       doc.rect(0, pageH - 12, 210, 12, 'F');
       doc.setTextColor(255, 255, 255);
       doc.setFontSize(8);
       doc.setFont('helvetica', 'normal')
       doc.text('Generated by NeuroScan AI | Confidential Medical Report', 14, pageH - 4);
       doc.text(`Page ${i} of ${pageCount}`, 196, pageH - 4, { align: 'right' });
    }

    const safeName = (patientName || 'Patient').replace(/\s+/g, '_')
    doc.save(`${safeName}_Parkinson_Report.pdf`)
    addToast('PDF report downloaded!', 'success')
  }

  // ── Chart Data ─────────────────────────────────────────────────────────
  const chartData = FEATURES.map((f, i) => ({
    name:    f.label,
    Patient: parseFloat(values[f.key] ?? 0) || 0,
    Healthy: HEALTHY_AVERAGES[i],
  }))

  const radarData = FEATURES.slice(14).map((f, i) => ({
    subject: f.label,
    Patient: parseFloat(values[f.key] ?? 0) || 0,
    Healthy: HEALTHY_AVERAGES[14 + i],
    fullMark: f.max,
  }))

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Toast */}
      <Toast toasts={toasts} remove={removeToast} />

      {/* ── PAGE CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 36, textAlign: 'center' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(37,99,235,0.12)',
            border: '1px solid rgba(37,99,235,0.3)',
            color: 'var(--blue-300)', fontSize: 13, fontWeight: 600,
            marginBottom: 16
          }}>
            <FiActivity size={14} /> AI-Powered Voice Biomarker Analysis
          </div>
          <h1 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Parkinson&apos;s Disease{' '}
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6, #10b981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Detection System
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', fontSize: 16, lineHeight: 1.7 }}>
            {mode === 'manual' 
              ? 'Enter 22 biomedical voice features extracted from acoustic measurements. Our model analyzes voice instability patterns associated with Parkinson\'s.'
              : 'Upload a voice recording (Vite sample A-E) to automatically extract 22 biomarkers and predict risk markers.'
            }
          </p>
        </motion.div>

        {/* ── PATIENT INFO + PRESETS ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
          style={{ padding: 28, marginBottom: 24 }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {/* Patient name */}
            <div style={{ flex: '1 1 220px', minWidth: 180 }}>
              <label htmlFor="patientName" className="field-label" style={{ marginBottom: 8, display: 'flex', gap: 4 }}>
                <FiUser size={14} /> Patient Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="patientName"
                className={`form-input ${errors.patientName ? 'error' : ''}`}
                type="text"
                placeholder="e.g. Dr. John Smith"
                value={patientName}
                onChange={e => {
                  setPatientName(e.target.value)
                  if(errors.patientName) setErrors(prev => {const e={...prev}; delete e.patientName; return e})
                }}
              />
              {errors.patientName && (
                <span className="field-error" style={{ display: 'block', marginTop: 4 }}>⚠ {errors.patientName}</span>
              )}
            </div>

            {/* Preset buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 24 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>LOAD SAMPLE:</span>
              <button
                id="loadHealthy"
                className="btn-preset btn-healthy"
                onClick={() => loadPreset(HEALTHY_PRESET, '✓ Healthy')}
              >
                <FiCheckCircle size={14} /> Load Healthy
              </button>
              <button
                id="loadParkinson"
                className="btn-preset btn-parkinson"
                onClick={() => loadPreset(PARKINSON_PRESET, '⚠ Parkinson')}
              >
                <FiAlertTriangle size={14} /> Load Parkinson
              </button>
            </div>
          </div>
        </motion.div>

        {mode === 'manual' ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card"
            style={{ padding: 32, marginBottom: 24 }}
          >
            <div className="section-title">
              <HiOutlineBeaker size={18} /> 22 Biomedical Voice Features
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 18
            }}>
              {FEATURES.map((f) => (
                <div key={f.key} className="field-group">
                  <label className="field-label" htmlFor={`field-${f.key}`}>
                    {f.label}
                    <div className="tooltip-wrapper">
                      <FiInfo size={12} style={{ cursor: 'help', color: 'var(--blue-400)' }} />
                      <span className="tooltip-text">{f.tooltip}</span>
                    </div>
                  </label>
                  <input
                    id={`field-${f.key}`}
                    className={`form-input ${errors[f.key] ? 'error' : ''}`}
                    type="number"
                    step="any"
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ''}
                    onChange={e => handleChange(f.key, e.target.value)}
                  />
                  {errors[f.key] && (
                    <span className="field-error">⚠ {errors[f.key]}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card"
            style={{ padding: 48, marginBottom: 24, textAlign: 'center' }}
          >
            {/* ── Instruction Banner ───────────────────────────────────────── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 16, padding: '16px 20px', marginBottom: 28,
              display: 'flex', gap: 14, alignItems: 'flex-start', textAlign: 'left'
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🎙️</span>
              <div>
                <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: 14, marginBottom: 4 }}>
                  Recording Instructions for Accurate Results
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                  For accurate screening, please record a <strong style={{ color: '#e2e8f0' }}>clear sustained "Aaaaa" sound</strong> for <strong style={{ color: '#e2e8f0' }}>3–5 seconds</strong> in a quiet room. 
                  Random voice notes, WhatsApp audio, or conversational speech <strong style={{ color: '#fca5a5' }}>will give incorrect results</strong> as the model is trained on controlled vowel biomarkers.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              
              {/* File Upload Box */}
              <div 
                style={{ 
                  border: `2px dashed ${dragActive ? '#60a5fa' : 'rgba(59,130,246,0.3)'}`, 
                  borderRadius: 24, padding: '40px 20px', 
                  background: dragActive ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.03)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  transition: 'all 0.3s'
                }} 
                onClick={() => document.getElementById('audioInput').click()}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0];
                    setAudioFile(file);
                    setAudioPreviewUrl(URL.createObjectURL(file));
                    addToast(`File selected: ${file.name}`, 'info');
                  }
                }}
              >
                <div style={{ 
                  width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                }}>
                  <FiUpload size={28} color="#3b82f6" />
                </div>
                <h3 style={{ marginBottom: 8 }}>{audioFile && mode === 'audio' && !isRecording ? audioFile.name : 'Drag & Drop or Upload Audio'}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
                  Supports WAV, MP3, OGG (Max 16MB)
                </p>
                {audioFile && mode === 'audio' && !isRecording && (
                  <span style={{ fontSize: 13, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '4px 12px', borderRadius: 99 }}>
                    Click to replace file
                  </span>
                )}
                <input 
                  id="audioInput" 
                  type="file" 
                  accept="audio/*" 
                  style={{ display: 'none' }} 
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setAudioFile(file);
                      setAudioPreviewUrl(URL.createObjectURL(file));
                      addToast(`File selected: ${file.name}`, 'info');
                    }
                  }}
                />
              </div>

              {/* Microphone Recording Box */}
              <div style={{ 
                border: '1px solid rgba(16,185,129,0.2)', 
                borderRadius: 24, padding: 40, background: 'var(--surface2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                  border: isRecording ? '2px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16,185,129,0.2)',
                }}>
                  
                  {isRecording ? (
                    <motion.div 
                      key="stop-recording"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                      onClick={stopRecording}
                    >
                      <div style={{ width: 18, height: 18, backgroundColor: '#ef4444', borderRadius: 4 }} />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="start-recording"
                      style={{
                        width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                      onClick={startRecording}
                      whileHover={{ scale: 1.05 }}
                    >
                      <FiMic size={24} color="#10b981" />
                    </motion.div>
                  )}
                </div>
                
                <h3 style={{ marginBottom: 8 }}>{isRecording ? 'Recording...' : 'Use Microphone'}</h3>
                {isRecording ? (
                  <div className="audio-waveform">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                    Record directly from your browser
                  </p>
                )}
              </div>

            </div>

            {/* Audio File Selected Status */}
            {audioFile && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                marginTop: 24, padding: '16px 20px', background: 'rgba(16,185,129,0.1)', 
                borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center',
                border: '1px solid rgba(16,185,129,0.3)'
              }}>
                <FiMic size={18} color="#10b981" />
                <span style={{ fontSize: 15, color: '#6ee7b7', fontWeight: 600 }}>{audioFile.name} (Ready for Analysis)</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── ACTION BUTTONS ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 32, alignItems: 'center' }}
        >
          <button
            id="predictBtn"
            className="btn-primary"
            onClick={handlePredict}
            disabled={loading}
            style={{ fontSize: 16, padding: '14px 36px' }}
          >
            {loading ? (
              <>
                <div className="pulse-dots"><span /><span /><span /></div>
                {loadingStep}
              </>
            ) : (
              <><FiZap size={18} /> Predict</>
            )}
          </button>

          <button id="resetBtn" className="btn-secondary" onClick={() => {
            handleReset();
            setAudioFile(null);
            setAudioPreviewUrl(null);
          }}>
            <FiRefreshCw size={15} /> Reset Form
          </button>

          <button id="downloadPdfBtn" className="btn-pdf" onClick={downloadPDF}>
            <FiDownload size={15} /> Download PDF Report
          </button>

          {/* Audio Preview Widget */}
          {audioPreviewUrl && mode === 'audio' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
               <audio controls src={audioPreviewUrl} style={{ height: 38, borderRadius: 19 }} />
            </div>
          )}
        </motion.div>

        {/* ── RESULT CARD ─────────────────────────────────────────────────── */}
        <div ref={resultRef}>
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className={`glass-card ${result.detected ? 'result-card-detected' : 'result-card-healthy'}`}
                style={{ padding: 36, marginBottom: 24 }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.1, stiffness: 280, damping: 18 }}
                    style={{
                      width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                      background: result.detected
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(16, 185, 129, 0.1)',
                      border: `1px solid ${result.detected ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {result.detected
                      ? <FiAlertTriangle size={32} color="#ef4444" />
                      : <FiCheckCircle size={32} color="#10b981" />
                    }
                  </motion.div>

                  {/* Main results */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                      Prediction Result
                    </div>
                    <div style={{
                      fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 900, lineHeight: 1.1,
                      color: result.detected ? '#ef4444' : '#059669',
                      marginBottom: 8
                    }}>
                      {result.detected ? "Parkinson's Detected" : "No Parkinson's Detected"}
                    </div>

                    {/* Confidence Bar */}
                    <div style={{ marginBottom: 12, maxWidth: 360 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Confidence</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{result.confidence}%</span>
                      </div>
                      <div className="confidence-bar-track">
                        <motion.div
                          className="confidence-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence}%` }}
                          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                          style={{
                            background: result.detected
                              ? 'linear-gradient(90deg, #f97316, #ef4444)'
                              : 'linear-gradient(90deg, #10b981, #34d399)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Risk Level:</span>
                      <span style={{
                        padding: '3px 12px', borderRadius: 99, fontWeight: 800, fontSize: 13,
                        background: result.risk === 'High' ? '#fee2e2' : result.risk === 'Moderate' ? '#fef3c7' : '#d1fae5',
                        color: result.risk === 'High' ? '#ef4444' : result.risk === 'Moderate' ? '#d97706' : '#059669',
                        border: `1px solid ${result.risk === 'High' ? '#fecaca' : result.risk === 'Moderate' ? '#fde68a' : '#a7f3d0'}`,
                      }}>
                        {result.risk}
                      </span>
                    </div>
                  </div>

                  {/* Date / time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, alignSelf: 'flex-end' }}>
                    <FiClock size={13} />
                    {new Date().toLocaleString()}
                  </div>
                </div>

                {/* ── Recommendation ────────────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`reco-box ${result.detected ? 'reco-positive' : 'reco-negative'}`}
                  style={{ marginTop: 28 }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: result.detected ? '#fee2e2' : '#d1fae5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {result.detected
                      ? <FiAlertTriangle size={18} color="#ef4444" />
                      : <FiCheckCircle size={18} color="#10b981" />
                    }
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: result.detected ? '#dc2626' : '#059669', fontSize: 14 }}>
                      {result.detected ? 'Medical Attention Recommended' : 'No Immediate Concern Detected'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                      {result.detected
                        ? 'Please consult neurologist for medical evaluation.'
                        : 'No abnormal voice biomarkers detected at this time. Maintain regular health monitoring and schedule follow-up assessments periodically.'
                      }
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── DATA VISUALIZATION ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card"
          style={{ padding: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div className="section-title" style={{ margin: 0 }}>
              <FiBarChart2 size={18} /> Feature Visualization
            </div>
            <div style={{
              display: 'flex', gap: 4, padding: 4,
              background: 'rgba(0,0,0,0.3)', borderRadius: 12,
              border: '1px solid var(--glass-border)'
            }}>
              <button id="barChartTab" className={`chart-tab ${chartTab === 'bar' ? 'active' : ''}`} onClick={() => setChartTab('bar')}>
                Bar Chart
              </button>
              <button id="radarChartTab" className={`chart-tab ${chartTab === 'radar' ? 'active' : ''}`} onClick={() => setChartTab('radar')}>
                Radar Chart
              </button>
            </div>
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#3b82f6', display: 'inline-block' }} />
              Patient Input
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981', display: 'inline-block' }} />
              Healthy Average
            </span>
          </div>

          <AnimatePresence mode="wait">
            {chartTab === 'bar' ? (
              <motion.div
                key="bar"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
              >
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <RechartTooltip content={<ChartTooltip />} />
                    <Bar dataKey="Patient" fill="#3b82f6" radius={[4,4,0,0]} />
                    <Bar dataKey="Healthy" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div
                key="radar"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(59,130,246,0.15)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                    <Radar name="Patient" dataKey="Patient" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                    <Radar name="Healthy" dataKey="Healthy" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                    <RechartTooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'rgba(37,99,235,0.06)',
            borderRadius: 10,
            border: '1px solid rgba(37,99,235,0.15)',
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.6
          }}>
            <strong style={{ color: 'var(--blue-300)' }}>ℹ️ Chart Guide:</strong>{' '}
            Blue bars/area = your patient&apos;s input values. Green = healthy population averages.
            Significant deviations in jitter, shimmer, NHR, and RPDE metrics are key Parkinson&apos;s indicators.
            Load presets above to see the difference visually.
          </div>
        </motion.div>

        {/* ── DISCLAIMER ──────────────────────────────────────────────────── */}
        <div style={{
          marginTop: 32, textAlign: 'center',
          color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.8
        }}>
          <strong style={{ color: 'var(--blue-300)' }}>Medical Disclaimer:</strong>{' '}
          NeuroScan AI is a research and clinical screening tool. Results must be interpreted by
          qualified medical professionals. This system does not provide clinical diagnoses.
          Always consult a licensed neurologist for medical advice.
        </div>
      </div>
    </div>
  )
}
