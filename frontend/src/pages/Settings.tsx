import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import Background from '../components/Background'
import Sidebar from '../components/Sidebar'

const card: React.CSSProperties = {
  background:     'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  border:         '1px solid rgba(255,255,255,0.08)',
  borderRadius:   '16px',
  boxShadow:      '0 0 30px rgba(99,102,241,0.06)',
  padding:        '1.5rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#F1F5F9', fontSize: '0.875rem', outline: 'none',
  boxSizing: 'border-box', colorScheme: 'dark', fontFamily: 'inherit',
  marginBottom: '1rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block', color: '#94A3B8', fontSize: '0.7rem',
  fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: '0.5rem',
}

const sectionLabel: React.CSSProperties = {
  color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.25rem',
}

export default function Settings() {
  const navigate     = useNavigate()
  const { user }     = useAuth()

  const [currentPass, setCurrentPass]   = useState('')
  const [newPass, setNewPass]           = useState('')
  const [confirmPass, setConfirmPass]   = useState('')
  const [passError, setPassError]       = useState('')
  const [passSaved, setPassSaved]       = useState(false)
  const [clinicName, setClinicName]     = useState('')
  const [clinicSaved, setClinicSaved]   = useState(false)

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPassError('')
    if (newPass.length < 6) { setPassError('Password must be at least 6 characters'); return }
    if (newPass !== confirmPass) { setPassError('Passwords do not match'); return }
    setPassSaved(true)
    setCurrentPass(''); setNewPass(''); setConfirmPass('')
    setTimeout(() => setPassSaved(false), 3000)
  }

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    e.target.style.borderColor = 'rgba(99,102,241,0.6)'
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) =>
    e.target.style.borderColor = 'rgba(255,255,255,0.1)'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <Background />
      <Sidebar />

      <main style={{ marginLeft: '224px', flex: 1, padding: '2rem',
        overflowY: 'auto', position: 'relative', zIndex: 1, minWidth: 0 }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#F1F5F9', fontSize: '1.75rem', fontWeight: 700,
            margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            Manage your account and clinic preferences
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minWidth: 0 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Account */}
            <div style={card}>
              <p style={sectionLabel}>Account</p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem', borderRadius: '12px',
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.12)',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366F1, #00B4D8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '1.2rem', flexShrink: 0,
                }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ color: '#F1F5F9', fontWeight: 600, margin: 0, fontSize: '1rem' }}>
                    {user?.username}
                  </p>
                  <p style={{ color: '#6366F1', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Clinic profile */}
            <div style={card}>
              <p style={sectionLabel}>Clinic Profile</p>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0 0 1.25rem' }}>
                Customize your clinic information for PDF reports
              </p>
              <label style={labelStyle}>Clinic Name</label>
              <input
                type="text" value={clinicName}
                onChange={e => { setClinicName(e.target.value); setClinicSaved(false) }}
                placeholder="e.g. Dubai Dental Center"
                style={inputStyle}
                onFocus={onFocus} onBlur={onBlur}
              />
              <button onClick={() => setClinicSaved(true)} style={{
                padding: '0.7rem 1.5rem', borderRadius: '10px',
                border:      `1px solid ${clinicSaved ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
                background:  clinicSaved ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                color:       clinicSaved ? '#10B981' : '#A78BFA',
                fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {clinicSaved ? '✓ Saved' : 'Save Profile'}
              </button>
            </div>

            {/* User management — admin only */}
            {user?.role === 'admin' && (
              <div style={card}>
                <p style={sectionLabel}>User Management</p>
                <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0 0 1.25rem' }}>
                  Create and manage clinic user accounts
                </p>
                <button onClick={() => navigate('/settings/users/new')} style={{
                  padding: '0.7rem 1.5rem', borderRadius: '10px',
                  border: '1px solid rgba(99,102,241,0.3)',
                  background: 'rgba(99,102,241,0.08)', color: '#A78BFA',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                }}>+ Create New User</button>
              </div>
            )}
          </div>

          {/* Right column — Security */}
          <div style={card}>
            <p style={sectionLabel}>Security</p>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0 0 1.5rem' }}>
              Update your login password
            </p>
            <form onSubmit={handlePasswordChange}>
              <label style={labelStyle}>Current Password</label>
              <input type="password" value={currentPass} required
                onChange={e => setCurrentPass(e.target.value)}
                placeholder="Enter current password"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
              <label style={labelStyle}>New Password</label>
              <input type="password" value={newPass} required
                onChange={e => setNewPass(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" value={confirmPass} required
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Confirm new password"
                style={{ ...inputStyle, marginBottom: passError ? '0.5rem' : '1.25rem' }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {passError && (
                <p style={{ color: '#F43F5E', fontSize: '0.8rem', margin: '0 0 1rem' }}>{passError}</p>
              )}
              {passSaved && (
                <p style={{ color: '#10B981', fontSize: '0.8rem', margin: '0 0 1rem' }}>
                  ✓ Password updated successfully
                </p>
              )}
              <button type="submit" style={{
                padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #6366F1 0%, #00B4D8 100%)',
                color: 'white', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 0 15px rgba(99,102,241,0.25)',
              }}>Update Password</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}