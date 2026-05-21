import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import Background from '../components/Background'
import Sidebar from '../components/Sidebar'

const card: React.CSSProperties = {
  background:     'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  border:         '1px solid rgba(255,255,255,0.06)',
  borderRadius:   '16px',
  padding:        '1.5rem',
  marginBottom:   '1.5rem',
}

export default function UserStats() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <Background />
      <Sidebar />

      <main style={{ marginLeft: '224px', flex: 1, padding: '2rem',
        overflowY: 'auto', position: 'relative', zIndex: 1, minWidth: 0 }}>

        <div style={{ maxWidth: '600px' }}>
          <button onClick={() => navigate('/settings')} style={{
            background: 'none', border: 'none', color: '#6366F1',
            fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
            padding: 0, marginBottom: '1rem', display: 'block',
          }}>← Back to Settings</button>

          <h1 style={{ color: '#F1F5F9', fontSize: '1.75rem', fontWeight: 700,
            margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>User Stats</h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0 0 2rem' }}>
            Account overview and activity
          </p>

          {/* User info */}
          <div style={card}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem',
              paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1, #00B4D8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '1.4rem', flexShrink: 0,
              }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                  {user?.username}
                </p>
                <p style={{ color: '#6366F1', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                  {user?.role}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Total Analyses', value: '—', color: '#6366F1' },
                { label: 'Last Analysis',  value: '—', color: '#00B4D8' },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: '1rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>
                    {stat.label}
                  </p>
                  <p style={{ color: stat.color, fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity — placeholder */}
          <div style={card}>
            <h2 style={{ color: '#F1F5F9', fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem' }}>
              Recent Activity
            </h2>
            <div style={{
              padding: '2rem', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>
                Activity tracking available after database migration
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}