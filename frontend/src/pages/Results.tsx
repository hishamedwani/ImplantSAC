import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { getCase } from '../api/client'
import type { UploadResponse } from '../api/client'
import Background from '../components/Background'
import MPRViewer from '../components/MPRViewer'
import Sidebar from '../components/Sidebar'

const RISK_COLORS = {
  Green:  { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  glow: 'rgba(16,185,129,0.2)'  },
  Yellow: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  glow: 'rgba(245,158,11,0.2)'  },
  Red:    { color: '#F43F5E', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.25)',   glow: 'rgba(244,63,94,0.2)'   },
  'N/A':  { color: '#475569', bg: 'rgba(71,85,105,0.1)',   border: 'rgba(71,85,105,0.25)',   glow: 'transparent'           },
}

const CLASS_STYLE: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  Straightforward: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: '0 0 40px rgba(16,185,129,0.2)' },
  Advanced:        { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', glow: '0 0 40px rgba(245,158,11,0.2)' },
  Complex:         { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.3)',  glow: '0 0 40px rgba(244,63,94,0.2)'  },
}

const FACTORS = [
  { key: 'apical_bone',       label: 'Apical Bone' },
  { key: 'buccal_wall',       label: 'Buccal Wall' },
  { key: 'ridge_width',       label: 'Ridge Width' },
  { key: 'septum_width',      label: 'Septum'      },
  { key: 'periapical_lesion', label: 'Lesion'       },
]

const card: React.CSSProperties = {
  background:     'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  border:         '1px solid rgba(255,255,255,0.08)',
  borderRadius:   '16px',
  boxShadow:      '0 0 30px rgba(99,102,241,0.08), 0 0 0 1px rgba(99,102,241,0.04)',
}

export default function Results() {
  const { caseId }   = useParams()
  const location     = useLocation()
  const navigate     = useNavigate()
  const [data, setData]         = useState<UploadResponse | null>(location.state?.result || null)
  const [loading, setLoading]   = useState(!location.state?.result)
  const [revealed, setRevealed] = useState<number[]>([])

  useEffect(() => {
    if (!data && caseId) {
      getCase(caseId).then(setData).finally(() => setLoading(false))
    }
  }, [caseId])

  // Stagger-reveal factor pills and measurement rows
  useEffect(() => {
    if (!data) return
    FACTORS.forEach((_, i) => {
      setTimeout(() => setRevealed(prev => [...prev, i]), 300 + i * 250)
    })
  }, [data])

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <Background /><Sidebar />
      <main style={{ marginLeft: '224px', flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ color: '#94A3B8' }}>Loading results...</p>
      </main>
    </div>
  )

  if (!data) return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <Background /><Sidebar />
      <main style={{ marginLeft: '224px', flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ color: '#F43F5E' }}>Case not found.</p>
      </main>
    </div>
  )

  const { result, yolo } = data
  const cls = CLASS_STYLE[result.classification] || CLASS_STYLE.Complex

  const getMeasurement = (key: string) => {
    const f = result.factors as any
    if (key === 'periapical_lesion') return f.periapical_lesion.lesion_detected ? 'Present' : 'Absent'
    const val = f[key]?.measurement_mm
    return val !== null && val !== undefined ? `${val} mm` : 'N/A'
  }

  const getRisk = (key: string): string => {
    const f = result.factors as any
    if (key === 'periapical_lesion') return f.periapical_lesion.risk
    return f[key]?.risk || 'N/A'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <Background />
      <Sidebar />

      <main style={{ marginLeft: '224px', flex: 1, padding: '2rem',
        overflowY: 'auto', position: 'relative', zIndex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ color: '#F1F5F9', fontSize: '1.75rem', fontWeight: 700,
              margin: 0, letterSpacing: '-0.02em' }}>Results</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
              Patient: {data.patient_id} · Case: {data.case_id.slice(0, 8)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate('/upload')} style={{
              padding: '0.6rem 1.25rem', borderRadius: '10px',
              border: '1px solid rgba(99,102,241,0.3)',
              background: 'rgba(99,102,241,0.08)', color: '#A78BFA',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
            }}>+ New Case</button>
            <button onClick={() => navigate('/history')} style={{
              padding: '0.6rem 1.25rem', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: '#F1F5F9',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
            }}>History</button>
          </div>
        </div>

        {/* Classification badge */}
        <div style={{
          ...card, padding: '1.5rem 2rem', marginBottom: '1.5rem',
          border: `1px solid ${cls.border}`, boxShadow: cls.glow,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 0.4rem' }}>
              Final Classification
            </p>
            <h2 style={{ color: cls.color, fontSize: '2.5rem', fontWeight: 900,
              margin: 0, letterSpacing: '0.05em', textShadow: `0 0 30px ${cls.color}60` }}>
              {result.classification.toUpperCase()}
            </h2>
          </div>

          {/* Factor pills — stagger-revealed */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {FACTORS.map((factor, i) => {
              const risk   = getRisk(factor.key) as keyof typeof RISK_COLORS
              const colors = RISK_COLORS[risk] || RISK_COLORS['N/A']
              const shown  = revealed.includes(i)
              return (
                <span key={factor.key} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.35rem 0.85rem', borderRadius: '20px',
                  fontSize: '0.72rem', fontWeight: 700,
                  color:      shown ? colors.color   : 'transparent',
                  background: shown ? colors.bg      : 'transparent',
                  border:     `1px solid ${shown ? colors.border : 'transparent'}`,
                  boxShadow:  shown ? `0 0 8px ${colors.glow}` : 'none',
                  transition: 'all 0.4s ease',
                }}>● {factor.label}</span>
              )
            })}
          </div>
        </div>

        {/* MPR Viewer */}
        <div style={{
          ...card, padding: '1.5rem', marginBottom: '1.5rem',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 0 30px rgba(99,102,241,0.08)',
        }}>
          <p style={{ color: '#F1F5F9', fontSize: '0.85rem', fontWeight: 600,
            margin: '0 0 1rem', letterSpacing: '0.02em' }}>
            CBCT Viewer — Axial · Coronal · Sagittal
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <MPRViewer caseId={data.case_id} layout="horizontal" />
          </div>
        </div>

        {/* Bottom three cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', minWidth: 0 }}>

          {/* Measurements */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ color: '#F1F5F9', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                Measurements
              </h3>
            </div>
            {FACTORS.map((factor, i) => {
              const risk   = getRisk(factor.key) as keyof typeof RISK_COLORS
              const colors = RISK_COLORS[risk] || RISK_COLORS['N/A']
              const shown  = revealed.includes(i)
              return (
                <div key={factor.key} style={{
                  padding: '0.75rem 1.25rem',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  opacity:   shown ? 1 : 0,
                  transform: shown ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'all 0.4s ease',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#F1F5F9', fontSize: '0.8rem', fontWeight: 500 }}>
                      {factor.label}
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.68rem',
                      fontWeight: 700, color: colors.color, background: colors.bg,
                      border: `1px solid ${colors.border}`,
                    }}>● {risk}</span>
                  </div>
                  <p style={{ color: '#00B4D8', fontSize: '0.8rem', fontFamily: 'monospace', margin: '0.2rem 0 0' }}>
                    {shown ? getMeasurement(factor.key) : ''}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Reasoning Chain + Disclaimer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ ...card, padding: '1.25rem', flex: 1 }}>
              <h3 style={{ color: '#F1F5F9', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 1rem' }}>
                Reasoning Chain
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {result.reasoning.map((line, i) => (
                  <p key={i} style={{
                    color:      i === result.reasoning.length - 1 ? '#A78BFA' : '#F1F5F9',
                    fontWeight: i === result.reasoning.length - 1 ? 600 : 400,
                    fontSize: '0.75rem', margin: 0, lineHeight: 1.6,
                    paddingBottom: '0.6rem',
                    borderBottom: i < result.reasoning.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>{line}</p>
                ))}
              </div>
            </div>
            <div style={{ ...card, padding: '1.25rem',
              border: '1px solid rgba(245,158,11,0.25)',
              boxShadow: '0 0 20px rgba(245,158,11,0.08)' }}>
              <p style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                ⚠ Clinical Disclaimer
              </p>
              <p style={{ color: '#E2E8F0', fontSize: '0.82rem', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                {result.disclaimer}
              </p>
            </div>
          </div>

          {/* Detection Details */}
          <div style={{ ...card, padding: '1.25rem' }}>
            <h3 style={{ color: '#F1F5F9', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 1rem' }}>
              Detection Details
            </h3>
            {[
              { label: 'Scanner',    value: yolo.scanner },
              { label: 'Confidence', value: `${(yolo.conf * 100).toFixed(1)}%` },
              { label: 'Site Type',  value: yolo.is_molar ? 'Molar' : 'Anterior' },
              { label: 'Z Range',    value: `${yolo.z_range[0]}–${yolo.z_range[1]}` },
              { label: 'Case ID',    value: data.case_id.slice(0, 8) },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{item.label}</span>
                <span style={{ color: '#F1F5F9', fontSize: '0.8rem', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}