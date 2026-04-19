import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCpu, FiMenu, FiX } from 'react-icons/fi'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
    setMobileMenuOpen(false) // Close mobile menu if open
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Manual Detection', path: '/manual' },
    { name: 'Audio Detection', path: '/audio' },
    { name: 'Information', path: '/information' },
  ]

  const navbarStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: '0 24px',
    transition: 'all 0.3s ease',
    background: isScrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
    borderBottom: isScrolled ? '1px solid var(--glass-border)' : '1px solid transparent',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  }

  return (
    <nav style={navbarStyle}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #1e4db7, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
          }}>
            <FiCpu size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              NeuroScan <span style={{ color: 'var(--blue-500)' }}>AI</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -2, fontWeight: 500 }}>
              Parkinson&apos;s Screening
            </div>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="desktop-menu" style={{ display: 'flex', gap: 8 }}>
          {navLinks.map(link => (
            <NavLink 
              key={link.path} 
              to={link.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={{ position: 'relative', textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <>
                  <span style={{ 
                    position: 'relative', zIndex: 1, 
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--blue-600)' : 'var(--text-muted)',
                    padding: '8px 16px',
                    display: 'block',
                    transition: 'color 0.2s'
                  }}>
                    {link.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(2, 132, 199, 0.1)',
                        border: '1px solid rgba(2, 132, 199, 0.2)',
                        borderRadius: 8,
                        zIndex: 0
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Mobile Hamburger Icon */}
        <div className="mobile-menu-btn" style={{ display: 'none' }}>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--text-primary)', 
              cursor: 'pointer', padding: 8 
            }}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', padding: '0 24px', background: 'rgba(255, 255, 255, 0.98)', borderBottom: '1px solid var(--glass-border)' }}
            className="mobile-menu-content"
          >
            <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {navLinks.map(link => (
                <NavLink 
                  key={link.path} 
                  to={link.path}
                  style={({ isActive }) => ({
                    textDecoration: 'none',
                    color: isActive ? 'var(--blue-600)' : 'var(--text-muted)',
                    fontWeight: isActive ? 600 : 500,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: isActive ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                  })}
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        .nav-link:hover span {
          color: var(--blue-600) !important;
        }
      `}</style>
    </nav>
  )
}
