import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  {
    path: '/dashboard', label: 'Dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  },
  {
    path: '/upload', label: 'New Case',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  },
  {
    path: '/history', label: 'History',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    path: '/settings', label: 'Settings',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  },
]

export default function Sidebar() {
  const navigate         = useNavigate()
  const location         = useLocation()
  const { user, logout } = useAuth()

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0,
      height: '100vh', width: '224px',
      display: 'flex', flexDirection: 'column',
      zIndex: 50,
      background:          'rgba(20,8,45,0.85)',
      backdropFilter:      'blur(24px)',
      WebkitBackdropFilter:'blur(24px)',
      borderRight:         '1px solid rgba(139,92,246,0.15)',
      boxShadow:           '4px 0 24px rgba(99,102,241,0.08)',
    }}>

      {/* Logo */}
      <div style={{ padding: '1.5rem 1.5rem 1.25rem', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
          <span style={{ color: '#F1F5F9' }}>Implant</span>
          <span style={{ color: '#00B4D8', textShadow: '0 0 20px rgba(0,180,216,0.5)' }}>SAC</span>
        </h1>
        <p style={{ margin: '0.3rem 0 0', color: '#6D5A8A', fontSize: '0.65rem',
          textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Dental AI Platform
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '12px', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                transition: 'all 0.2s',
                background:  active ? 'rgba(99,102,241,0.2)'  : 'transparent',
                color:       active ? '#A78BFA'                : '#94A3B8',
                boxShadow:   active ? 'inset 0 0 0 1px rgba(99,102,241,0.3), 0 0 12px rgba(99,102,241,0.15)' : 'none',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
                  e.currentTarget.style.color      = '#A78BFA'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color      = '#94A3B8'
                }
              }}
            >
              <span style={{ color: active ? '#A78BFA' : '#64748B', flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <div style={{
          padding: '0.75rem 1rem', marginBottom: '0.5rem',
          background: 'rgba(99,102,241,0.06)', borderRadius: '12px',
          border: '1px solid rgba(99,102,241,0.1)',
        }}>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.7rem',
            textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Logged in as
          </p>
          <p style={{ margin: '0.2rem 0 0', color: '#F1F5F9', fontSize: '0.875rem', fontWeight: 600 }}>
            {user?.username}
          </p>
          <p style={{ margin: '0.1rem 0 0', color: '#6366F1', fontSize: '0.72rem', fontWeight: 500 }}>
            {user?.role}
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', borderRadius: '12px', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem',
            color: '#94A3B8', background: 'transparent', transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(244,63,94,0.08)'
            e.currentTarget.style.color      = '#F43F5E'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color      = '#94A3B8'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  )
}