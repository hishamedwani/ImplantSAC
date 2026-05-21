import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { uploadCase } from '../api/client'
import Background from '../components/Background'
import Sidebar from '../components/Sidebar'

const STAGES = [
  { label: 'Loading Scan',   desc: 'Reading CBCT volume and extracting spacing', duration:  5 },
  { label: 'Detecting Site', desc: 'YOLO model localizing missing tooth',         duration: 25 },
  { label: 'Segmenting',     desc: 'ToothSeg extracting teeth and bone anatomy',  duration: 45 },
  { label: 'Measuring',      desc: 'Computing 5 clinical factors in mm',          duration: 15 },
  { label: 'Classifying',    desc: 'Applying ITI SAC classification thresholds',  duration: 10 },
]

const TOTAL = STAGES.reduce((a, s) => a + s.duration, 0)

export default function Processing() {
  const navigate              = useNavigate()
  const location              = useLocation()
  const { file, patientId }   = location.state || {}

  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress]         = useState(3)
  const [error, setError]               = useState('')
  const uploadDone  = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef  = useRef(0)

  useEffect(() => {
    if (!file) { navigate('/upload'); return }
    if (uploadDone.current) return
    uploadDone.current = true

    // Animate progress bar independently of actual upload duration
    intervalRef.current = setInterval(() => {
      elapsedRef.current += 0.5
      const overall = Math.min(3 + (elapsedRef.current / 240) * 92, 95)
      setProgress(overall)
      let cum = 0
      for (let i = 0; i < STAGES.length; i++) {
        cum += (STAGES[i].duration / TOTAL) * 100
        if (overall < cum) { setCurrentStage(i); break }
      }
    }, 500)

    // Run the actual pipeline
    uploadCase(file, patientId || 'anonymous')
      .then(result => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setProgress(100)
        setCurrentStage(STAGES.length - 1)
        setTimeout(() => navigate(`/results/${result.case_id}`, { state: { result } }), 800)
      })
      .catch(err => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setError(err?.response?.data?.detail || 'Processing failed. Please try again.')
      })

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <Background />
      <Sidebar />

      <main style={{
        marginLeft: '224px', flex: 1, padding: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>

          <h1 style={{ color: '#F1F5F9', fontSize: '1.75rem', fontWeight: 700,
            margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            Analyzing Scan
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0 0 2.5rem' }}>
            {file?.name} · ~3-5 minutes
          </p>

          {error ? (
            /* Error state */
            <div style={{
              padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem',
              background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)',
            }}>
              <p style={{ color: '#F43F5E', fontWeight: 600, margin: '0 0 0.5rem' }}>Processing Failed</p>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0 0 1rem' }}>{error}</p>
              <button onClick={() => navigate('/upload')} style={{
                padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none',
                background: 'rgba(244,63,94,0.15)', color: '#F43F5E',
                fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>← Try Again</button>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '100px',
                height: '6px', marginBottom: '2.5rem', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '100px',
                  background: 'linear-gradient(90deg, #6366F1, #00B4D8)',
                  width: `${progress}%`, transition: 'width 0.5s ease',
                  boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                }} />
              </div>

              {/* Pipeline stages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {STAGES.map((stage, i) => {
                  const done   = i < currentStage
                  const active = i === currentStage
                  return (
                    <div key={stage.label} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem 1.25rem', borderRadius: '14px', transition: 'all 0.3s',
                      background:  active ? 'rgba(99,102,241,0.1)'  : done ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow:   active ? '0 0 20px rgba(99,102,241,0.1)' : 'none',
                    }}>
                      {/* Stage number / checkmark */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.3s',
                        background:  done ? '#10B981' : active ? 'linear-gradient(135deg, #6366F1, #00B4D8)' : 'rgba(255,255,255,0.06)',
                        color:       done || active ? 'white' : '#64748B',
                        boxShadow:   active ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
                      }}>
                        {done ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : i + 1}
                      </div>

                      {/* Stage label + description */}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.3s',
                          color: done ? '#10B981' : active ? '#F1F5F9' : '#64748B' }}>
                          {stage.label}
                          {active && (
                            <span style={{ marginLeft: '0.5rem', animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }}>●</span>
                          )}
                        </p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', transition: 'color 0.3s',
                          color: active ? '#94A3B8' : '#374151' }}>
                          {stage.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.75rem', marginTop: '1.5rem' }}>
                {Math.round(progress)}% complete — Please do not close this page
              </p>
            </>
          )}
        </div>
      </main>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
    </div>
  )
}