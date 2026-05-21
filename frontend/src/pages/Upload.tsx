import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Background from '../components/Background'
import Sidebar from '../components/Sidebar'

const ALLOWED = ['.nii', '.nii.gz', '.mha']

const validateFile = (f: File): boolean =>
  ALLOWED.some(ext => f.name.toLowerCase().endsWith(ext))

export default function Upload() {
  const navigate                    = useNavigate()
  const [file, setFile]             = useState<File | null>(null)
  const [patientId, setPatientId]   = useState('')
  const [dragging, setDragging]     = useState(false)
  const [error, setError]           = useState('')

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (!f) return
    if (!validateFile(f)) { setError('Unsupported file type. Please upload .nii, .nii.gz, or .mha'); return }
    setError('')
    setFile(f)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!validateFile(f)) { setError('Unsupported file type. Please upload .nii, .nii.gz, or .mha'); return }
    setError('')
    setFile(f)
  }

  const handleSubmit = () => {
    if (!file) { setError('Please select a file'); return }
    navigate('/processing', { state: { file, patientId } })
  }

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
            New Case
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0 0 2rem' }}>
            Upload a CBCT scan to begin automated analysis
          </p>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => document.getElementById('file-input')?.click()}
            style={{
              border: `2px dashed ${dragging ? '#6366F1' : file ? '#10B981' : 'rgba(99,102,241,0.3)'}`,
              borderRadius: '16px', padding: '3rem 2rem',
              textAlign: 'center', cursor: 'pointer', marginBottom: '1.5rem',
              transition: 'all 0.2s',
              background:  dragging ? 'rgba(99,102,241,0.08)' : file ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
              boxShadow:   dragging ? '0 0 30px rgba(99,102,241,0.2)' : file ? '0 0 20px rgba(16,185,129,0.1)' : 'none',
            }}
          >
            <input id="file-input" type="file" accept=".nii,.mha"
              onChange={handleFileInput} style={{ display: 'none' }} />

            {file ? (
              <>
                <div style={{ color: '#10B981', fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
                <p style={{ color: '#10B981', fontWeight: 600, margin: '0 0 0.25rem' }}>{file.name}</p>
                <p style={{ color: '#64748B', fontSize: '0.8rem', margin: 0 }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB — Click to change
                </p>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                    stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p style={{ color: '#F1F5F9', fontWeight: 600, margin: '0 0 0.5rem' }}>
                  Drag and drop your CBCT scan
                </p>
                <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 1rem' }}>or click to browse</p>
                <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>.nii · .nii.gz · .mha</p>
              </>
            )}
          </div>

          {/* Patient ID */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
            padding: '1.25rem', marginBottom: '1.5rem',
          }}>
            <label style={{
              display: 'block', color: '#94A3B8', fontSize: '0.7rem',
              fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: '0.75rem',
            }}>
              Patient ID{' '}
              <span style={{ color: '#475569', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              type="text" value={patientId}
              onChange={e => setPatientId(e.target.value)}
              placeholder="e.g. PT-2024-001"
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)',
                color: '#F1F5F9', fontSize: '0.875rem', outline: 'none',
                boxSizing: 'border-box', colorScheme: 'dark', fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(99,102,241,0.2)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem',
              fontSize: '0.875rem', color: '#F43F5E',
              background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!file}
            style={{
              width: '100%', padding: '0.9rem', borderRadius: '12px',
              border: 'none', fontWeight: 700, fontSize: '0.95rem',
              color: 'white', fontFamily: 'inherit',
              cursor:     !file ? 'not-allowed' : 'pointer',
              background: !file ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg, #6366F1 0%, #00B4D8 100%)',
              boxShadow:  !file ? 'none'                 : '0 0 20px rgba(99,102,241,0.3)',
            }}
          >
            Analyze Scan
          </button>

          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.75rem', marginTop: '1rem' }}>
            Processing takes approximately 3-5 minutes
          </p>
        </div>
      </main>
    </div>
  )
}