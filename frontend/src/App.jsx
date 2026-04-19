import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar'
import ParkinsonDetector from './components/ParkinsonDetector'
import Information from './components/Information'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/manual" replace />} />
            <Route path="/manual" element={<ParkinsonDetector mode="manual" />} />
            <Route path="/audio" element={<ParkinsonDetector mode="audio" />} />
            <Route path="/information" element={<Information />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
