import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { deleteCase, getCase, updateCase } from '../api/client'
import type { UploadResponse } from '../api/client'
import Background from '../components/Background'
import MPRViewer from '../components/MPRViewer'
import Sidebar from '../components/Sidebar'

const RISK_COLORS = {
  Green:  { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  glow: 'rgba(16,185,129,0.2)'  },
  Yellow: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  glow: 'rgba(245,158,11,0.2)'  },
  Red:    { color: '#F43F5E', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.25)',   glow: 'rgba(244,63,94,0.2)'   },
  'N/A':  { color: '#94A3B8', bg: 'rgba(71,85,105,0.1)',   border: 'rgba(71,85,105,0.25)',   glow: 'transparent'           },
}

const CLASS_STYLE: Record<string, { color: string; border: string; glow: string }> = {
  Straightforward: { color: '#10B981', border: 'rgba(16,185,129,0.3)', glow: '0 0 30px rgba(16,185,129,0.15)' },
  Advanced:        { color: '#F59E0B', border: 'rgba(245,158,11,0.3)', glow: '0 0 30px rgba(245,158,11,0.15)' },
  Complex:         { color: '#F43F5E', border: 'rgba(244,63,94,0.3)',  glow: '0 0 30px rgba(244,63,94,0.15)'  },
}

const CLASS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  Straightforward: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  Advanced:        { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  Complex:         { color: '#F43F5E', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.3)'  },
}

const FACTORS = [
  { key: 'apical_bone',       label: 'Apical Bone Availability' },
  { key: 'buccal_wall',       label: 'Buccal Wall Thickness'    },
  { key: 'ridge_width',       label: 'Buccolingual Ridge Width'  },
  { key: 'septum_width',      label: 'Interradicular Septum'    },
  { key: 'periapical_lesion', label: 'Periapical Lesion Status' },
]

const card: React.CSSProperties = {
  background:     'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  border:         '1px solid rgba(255,255,255,0.08)',
  borderRadius:   '16px',
  boxShadow:      '0 0 30px rgba(99,102,241,0.06)',
}

export default function HistoryDetail() {
  const { caseId }  = useParams()
  const navigate    = useNavigate()
  const [data, setData]                 = useState<UploadResponse | null>(null)
  const [loading, setLoading]           = useState(true)
  const [notes, setNotes]               = useState('')
  const [notesSaved, setNotesSaved]     = useState(false)
  const [notesLoading, setNotesLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(false)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => {
    if (caseId) {
      getCase(caseId).then(d => {
        setData(d)
        setNotes(d.clinician_notes || '')
      }).finally(() => setLoading(false))
    }
  }, [caseId])

  const getMeasurement = (key: string) => {
    if (!data) return ''
    const f = data.result.factors as any
    if (key === 'periapical_lesion') return f.periapical_lesion.lesion_detected ? 'Present' : 'Absent'
    const val = f[key]?.measurement_mm
    return val !== null && val !== undefined ? `${val} mm` : 'N/A'
  }

  const getRisk = (key: string): string => {
    if (!data) return 'N/A'
    const f = data.result.factors as any
    if (key === 'periapical_lesion') return f.periapical_lesion.risk
    return f[key]?.risk || 'N/A'
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCase(caseId!)
      navigate('/history')
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveNotes = async () => {
    setNotesLoading(true)
    try {
      await updateCase(caseId!, { clinician_notes: notes })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 3000)
    } finally {
      setNotesLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <Background /><Sidebar />
      <main style={{ marginLeft: '224px', flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ color: '#94A3B8' }}>Loading case...</p>
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

  const effectiveCls = data.override_classification || data.result.classification
  const cls          = CLASS_STYLE[effectiveCls] || CLASS_STYLE.Complex
  const isOverridden = !!(data.override_classification && data.override_classification !== data.result.classification)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <Background />
      <Sidebar />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#0f0f23', border: '1px solid rgba(244,63,94,0.3)',
            borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%',
            boxShadow: '0 0 40px rgba(244,63,94,0.15)',
          }}>
            <h3 style={{ color: '#F1F5F9', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              Delete Case
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              Are you sure you want to delete this case? This will permanently remove all files.
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(false)} style={{
                padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: '#94A3B8', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem',
              }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{
                padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer',
                border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.15)',
                color: '#F43F5E', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem',
              }}>{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <main style={{ marginLeft: '224px', flex: 1, padding: '2rem',
        overflowY: 'auto', position: 'relative', zIndex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <button onClick={() => navigate('/history')} style={{
              background: 'none', border: 'none', color: '#6366F1',
              fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
              padding: 0, marginBottom: '0.5rem', display: 'block',
            }}>← Back to History</button>
            <h1 style={{ color: '#F1F5F9', fontSize: '1.75rem', fontWeight: 700,
              margin: 0, letterSpacing: '-0.02em' }}>Case Detail</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
              Patient: {data.patient_id} · Case: {caseId?.slice(0, 8)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => setDeleteTarget(true)} style={{
              padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer',
              border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)',
              color: '#F43F5E', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8rem',
            }}>Delete Case</button>
            <div style={{ padding: '0.5rem 1.25rem', borderRadius: '10px',
              border: `1px solid ${cls.border}`, boxShadow: cls.glow }}>
              <span style={{ color: cls.color, fontWeight: 700, fontSize: '1rem' }}>{effectiveCls}</span>
              {isOverridden && (
                <span style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 400, marginLeft: '0.5rem' }}>
                  (overridden)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Classification badge + override controls */}
        <div style={{
          ...card, padding: '1.5rem 2rem', marginBottom: '1.5rem',
          border: `1px solid ${cls.border}`, boxShadow: cls.glow,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 0.4rem' }}>
              {isOverridden ? 'Overridden Classification' : 'AI Classification'}
            </p>
            <h2 style={{ color: cls.color, fontSize: '2.5rem', fontWeight: 900,
              margin: 0, letterSpacing: '0.05em', textShadow: `0 0 30px ${cls.color}60` }}>
              {effectiveCls.toUpperCase()}
            </h2>
            {isOverridden && (
              <p style={{
                color: data.result.classification === 'Complex' ? '#F43F5E'
                  : data.result.classification === 'Advanced' ? '#F59E0B' : '#10B981',
                fontSize: '0.75rem', margin: '0.5rem 0 0', fontWeight: 600,
              }}>
                AI Classification: {data.result.classification}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Override</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['Straightforward', 'Advanced', 'Complex'].map(c => {
                const cc       = CLASS_COLORS[c]
                const isActive = effectiveCls === c
                return (
                  <button key={c} onClick={async () => {
                    await updateCase(caseId!, { override_classification: c })
                    setData(prev => prev ? { ...prev, override_classification: c } : prev)
                  }} style={{
                    padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600,
                    border:     `1px solid ${isActive ? cc.border : 'rgba(255,255,255,0.1)'}`,
                    background: isActive ? cc.bg        : 'transparent',
                    color:      isActive ? cc.color     : '#94A3B8',
                    boxShadow:  isActive ? `0 0 10px ${cc.border}` : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {c === 'Straightforward' ? 'S' : c === 'Advanced' ? 'A' : 'C'}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* MPR Viewer */}
        <div style={{ ...card, padding: '1.5rem', marginBottom: '1.5rem',
          border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 0 30px rgba(99,102,241,0.08)' }}>
          <p style={{ color: '#F1F5F9', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 1rem' }}>
            CBCT Viewer — Axial · Coronal · Sagittal
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <MPRViewer caseId={caseId!} layout="horizontal" />
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
              return (
                <div key={factor.key} style={{
                  padding: '0.75rem 1.25rem',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
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
                    {getMeasurement(factor.key)}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.result.reasoning.map((line, i) => (
                  <p key={i} style={{
                    color:      i === data.result.reasoning.length - 1 ? '#A78BFA' : '#F1F5F9',
                    fontWeight: i === data.result.reasoning.length - 1 ? 600 : 400,
                    fontSize: '0.75rem', margin: 0, lineHeight: 1.6,
                    paddingBottom: '0.5rem',
                    borderBottom: i < data.result.reasoning.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
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
                {data.result.disclaimer}
              </p>
            </div>
          </div>

          {/* Detection Details + Clinician Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ ...card, padding: '1.25rem' }}>
              <h3 style={{ color: '#F1F5F9', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 1rem' }}>
                Detection Details
              </h3>
              {[
                { label: 'Case ID',    value: caseId?.slice(0, 8) },
                { label: 'Patient',    value: data.patient_id },
                { label: 'Scanner',    value: data.yolo?.scanner || 'N/A' },
                { label: 'Confidence', value: data.yolo?.conf ? `${(data.yolo.conf * 100).toFixed(1)}%` : 'N/A' },
                { label: 'Z Range',    value: (data.yolo?.z_range && data.yolo.z_range[1] > 0) ? `${data.yolo.z_range[0]}–${data.yolo.z_range[1]}` : 'N/A' },
                { label: 'Site',       value: data.yolo?.is_molar ? 'Molar' : 'Anterior' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{item.label}</span>
                  <span style={{ color: '#F1F5F9', fontSize: '0.8rem', fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Clinician Notes */}
            <div style={{ ...card, padding: '1.25rem', flex: 1 }}>
              <h3 style={{ color: '#F1F5F9', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
                Clinician Notes
              </h3>
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); setNotesSaved(false) }}
                placeholder="Add clinical notes..."
                rows={4}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)',
                  color: '#F1F5F9', fontSize: '0.8rem', outline: 'none',
                  boxSizing: 'border-box', colorScheme: 'dark', fontFamily: 'inherit',
                  resize: 'vertical', lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  onClick={handleSaveNotes}
                  disabled={notesLoading}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600,
                    border:     `1px solid ${notesSaved ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
                    background: notesSaved ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                    color:      notesSaved ? '#10B981'              : '#A78BFA',
                  }}
                >
                  {notesLoading ? 'Saving...' : notesSaved ? '✓ Saved' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}