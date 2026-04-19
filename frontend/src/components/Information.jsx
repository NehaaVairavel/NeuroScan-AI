import { motion } from 'framer-motion'
import { FiInfo, FiActivity, FiAlertCircle, FiHeart, FiBookOpen, FiShield } from 'react-icons/fi'

export default function Information() {
  const sections = [
    {
      id: 'what-is',
      title: 'What is Parkinson Disease?',
      icon: <FiBookOpen size={20} className="text-blue-400" />,
      content: 'Parkinson’s disease is a progressive neurological disorder affecting movement, speech, and coordination. It typically develops gradually, sometimes starting with a barely noticeable tremor in just one hand. While a tremor may be the most well-known sign of Parkinson’s disease, the disorder also commonly causes stiffness or slowing of movement.'
    },
    {
      id: 'symptoms',
      title: 'Common Symptoms',
      icon: <FiActivity size={20} className="text-blue-400" />,
      content: (
        <ul style={{ paddingLeft: 20, listStyleType: 'circle', lineHeight: 1.8 }}>
          <li>Tremors or rhythmic shaking</li>
          <li>Slow movement (bradykinesia)</li>
          <li>Muscle stiffness and rigidity</li>
          <li>Balance and posture problems</li>
          <li>Soft voice or speech changes</li>
          <li>Handwriting changes (micrographia)</li>
        </ul>
      )
    },
    {
      id: 'causes',
      title: 'Causes',
      icon: <FiAlertCircle size={20} className="text-blue-400" />,
      content: (
        <ul style={{ paddingLeft: 20, listStyleType: 'circle', lineHeight: 1.8 }}>
          <li>Dopamine-producing neuron loss in the brain</li>
          <li>Genetic factors and specific gene mutations</li>
          <li>Environmental triggers and toxin exposure</li>
        </ul>
      )
    },
    {
      id: 'early-detection',
      title: 'Importance of Early Detection',
      icon: <FiShield size={20} className="text-blue-400" />,
      content: 'Early diagnosis of Parkinson\'s disease significantly improves the effectiveness of treatment and management strategies. By identifying symptoms early, patients can access therapies, medications, and lifestyle modifications that can help preserve function, slow symptom progression, and maintain a higher quality of life for a much longer period.'
    },
    {
      id: 'prevention',
      title: 'Prevention & Care Tips',
      icon: <FiHeart size={20} className="text-blue-400" />,
      content: (
        <ul style={{ paddingLeft: 20, listStyleType: 'circle', lineHeight: 1.8 }}>
          <li>Engage in regular aerobic exercise</li>
          <li>Maintain a balanced, healthy diet</li>
          <li>Prioritize healthy sleep management</li>
          <li>Ensure regular medical consultation</li>
          <li>Practice stress reduction techniques</li>
        </ul>
      )
    }
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: 48 }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 18px', borderRadius: 99,
          background: 'rgba(2, 132, 199, 0.1)',
          border: '1px solid rgba(2, 132, 199, 0.2)',
          color: 'var(--blue-600)', fontSize: 14, fontWeight: 600,
          marginBottom: 16
        }}>
          <FiInfo size={16} /> Educational Resources
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2 }}>
           Understanding{' '}
          <span style={{
            background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Parkinson&apos;s Disease
          </span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, maxWidth: 650, margin: '0 auto' }}>
          Learn about the symptoms, causes, and the critical importance of early detection and sustained management.
        </p>
      </motion.div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gap: 24 }}>
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="glass-card"
            style={{ padding: 32 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(37,99,235,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {section.icon}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {section.title}
              </h2>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7 }}>
              {section.content}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{
          marginTop: 48,
          padding: 24,
          borderRadius: 'var(--radius-lg)',
          background: '#fef3c7',
          border: '1px solid #fde68a',
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start'
        }}
      >
        <FiAlertCircle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h3 style={{ margin: '0 0 8px', color: '#b45309', fontSize: 16, fontWeight: 700 }}>Medical Disclaimer</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            This AI tool and its provided educational content are intended for screening and informational purposes only and do not constitute a medical diagnosis. Always consult with a qualified healthcare professional or neurologist for clinical evaluation and medical advice.
          </p>
        </div>
      </motion.div>
      
    </div>
  )
}
