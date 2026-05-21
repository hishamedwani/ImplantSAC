import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { login } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate        = useNavigate()
  const { setUser }     = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      setUser(user)
      navigate('/dashboard')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.8rem 1rem', borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(99,102,241,0.2)',
    color: '#F1F5F9', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', colorScheme: 'dark', fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#94A3B8', fontSize: '0.7rem',
    fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.1em', marginBottom: '0.5rem',
  }

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(99,102,241,0.6)'
    e.target.style.boxShadow   = '0 0 0 3px rgba(99,102,241,0.1)'
  }

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(99,102,241,0.2)'
    e.target.style.boxShadow   = 'none'
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#06060f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0,
            letterSpacing: '-0.03em', lineHeight: 1.5, paddingTop: '0.2rem' }}>
            <span style={{ color: '#ffffff' }}>Implant</span>
            <span style={{ color: '#00B4D8', textShadow: '0 0 20px rgba(0,180,216,0.5)', marginLeft: '2px' }}>SAC</span>
          </h1>
          <p style={{ color: '#64748B', marginTop: '0.6rem', fontSize: '0.85rem', letterSpacing: '0.02em' }}>
            Automated Dental Implant Planning
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(15,15,30,0.7)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: `
            0 0 30px rgba(99,102,241,0.2),
            0 0 80px rgba(99,102,241,0.1),
            0 0 120px rgba(0,180,216,0.08),
            inset 0 1px 0 rgba(255,255,255,0.08)
          `,
        }}>
          <h2 style={{ color: '#F1F5F9', fontSize: '1.4rem', fontWeight: 700,
            margin: '0 0 0.3rem', letterSpacing: '-0.01em' }}>
            Welcome back
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0 0 2rem' }}>
            Sign in to your clinic account
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Username */}
            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text" value={username} required
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password} required
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, padding: '0.8rem 3rem 0.8rem 1rem' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: '#64748B',
                    padding: 0, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '12px',
                fontSize: '0.875rem', color: '#F43F5E',
                background: 'rgba(244,63,94,0.08)',
                border: '1px solid rgba(244,63,94,0.3)',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.9rem', borderRadius: '12px',
                border: 'none', fontWeight: 700, fontSize: '0.95rem',
                color: 'white', marginTop: '0.5rem', fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                background:  loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366F1 0%, #00B4D8 100%)',
                boxShadow:   loading ? 'none' : '0 0 20px rgba(99,102,241,0.4), 0 0 40px rgba(0,180,216,0.2)',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Contact your administrator to create an account
        </p>
      </div>
    </div>
  )
}