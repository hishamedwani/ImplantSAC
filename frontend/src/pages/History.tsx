import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { deleteCase, getAllCases } from '../api/client'
import type { CaseSummary } from '../api/client'
import Background from '../components/Background'
import Sidebar from '../components/Sidebar'

const CLASS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  Straightforward: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  Advanced:        { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  Complex:         { color: '#F43F5E', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.3)'  },
}

const card: React.CSSProperties = {
  background:     'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  border:         '1px solid rgba(255,255,255,0.08)',
  borderRadius:   '16px',
  boxShadow:      '0 0 30px rgba(99,102,241,0.06)',
}

const FILTER_BUTTONS = [
  { label: 'All',             color: '#A78BFA', bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.4)'  },
  { label: 'Straightforward', color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)'  },
  { label: 'Advanced',        color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)'  },
  { label: 'Complex',         color: '#F43F5E', bg: 'rgba(244,63,94,0.15)',  border: 'rgba(244,63,94,0.4)'   },
]

export default function History() {
  const navigate                        = useNavigate()
  const [cases, setCases]               = useState<CaseSummary[]>([])
  const [filtered, setFiltered]         = useState<CaseSummary[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filter, setFilter]             = useState('All')
  const [sortDesc, setSortDesc]         = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => {
    getAllCases()
      .then(data => { setCases(data); setFiltered(data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = [...cases]
    if (filter !== 'All') result = result.filter(c => c.classification === filter)
    if (search.trim()) result = result.filter(c =>
      c.patient_id.toLowerCase().includes(search.toLowerCase()) ||
      c.case_id.toLowerCase().includes(search.toLowerCase())
    )
    result.sort((a, b) => sortDesc
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    setFiltered(result)
  }, [search, filter, cases, sortDesc])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCase(deleteTarget)
      setCases(prev => prev.filter(c => c.case_id !== deleteTarget))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

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
              Are you sure you want to delete this case? This will permanently remove the case,
              CBCT scan, and segmentation files. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{
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
          alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#F1F5F9', fontSize: '1.75rem', fontWeight: 700,
              margin: 0, letterSpacing: '-0.02em' }}>History</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              All analyzed cases
            </p>
          </div>
          <button onClick={() => navigate('/upload')} style={{
            padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #6366F1 0%, #00B4D8 100%)',
            color: 'white', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
          }}>+ New Case</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient ID or case ID..."
            style={{
              flex: 1, minWidth: '240px', padding: '0.7rem 1rem', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#F1F5F9', fontSize: '0.875rem', outline: 'none',
              colorScheme: 'dark', fontFamily: 'inherit',
            }}
          />
          {FILTER_BUTTONS.map(f => (
            <button key={f.label} onClick={() => setFilter(f.label)} style={{
              padding: '0.7rem 1rem', borderRadius: '10px', fontSize: '0.8rem',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border:      `1px solid ${filter === f.label ? f.border : 'rgba(255,255,255,0.08)'}`,
              background:  filter === f.label ? f.bg    : 'rgba(255,255,255,0.03)',
              color:       filter === f.label ? f.color : '#94A3B8',
              transition: 'all 0.2s',
            }}>{f.label}</button>
          ))}
          <button onClick={() => setSortDesc(!sortDesc)} style={{
            padding: '0.7rem 1rem', borderRadius: '10px', fontSize: '0.8rem',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)', color: '#94A3B8',
          }}>{sortDesc ? '↓ Newest' : '↑ Oldest'}</button>
        </div>

        {/* Table */}
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 160px 120px',
            padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {['Patient ID', 'File', 'Classification', 'Date', ''].map(h => (
              <span key={h} style={{ color: '#64748B', fontSize: '0.68rem',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <p style={{ color: '#94A3B8', marginBottom: '1rem' }}>
                {cases.length === 0 ? 'No cases yet.' : 'No cases match your filter.'}
              </p>
              {cases.length === 0 && (
                <button onClick={() => navigate('/upload')} style={{
                  padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #6366F1 0%, #00B4D8 100%)',
                  color: 'white', fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Upload your first scan</button>
              )}
            </div>
          ) : (
            filtered.map((c, i) => {
              const cls = CLASS_COLORS[c.classification] || CLASS_COLORS.Complex
              return (
                <div
                  key={c.case_id}
                  onClick={() => navigate(`/history/${c.case_id}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 160px 160px 120px',
                    padding: '1rem 1.5rem', alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                    transition: 'background 0.15s', cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                >
                  <span style={{ color: '#F1F5F9', fontSize: '0.875rem', fontWeight: 500 }}>
                    {c.patient_id}
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
                    {c.filename}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem',
                      fontWeight: 600, color: cls.color, background: cls.bg,
                      border: `1px solid ${cls.border}`, width: 'fit-content',
                    }}>● {c.classification}</span>
                    {c.is_overridden && (
                      <span style={{ color: '#F59E0B', fontSize: '0.65rem', fontWeight: 600 }}>
                        ✎ Overridden from {c.ai_classification}
                      </span>
                    )}
                  </div>
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                    {formatDate(c.created_at)}
                  </span>
                  <div
                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate(`/history/${c.case_id}`)}
                      style={{ background: 'none', border: 'none', color: '#6366F1',
                        fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                    >View →</button>
                    <button
                      onClick={() => setDeleteTarget(c.case_id)}
                      style={{
                        padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer',
                        border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)',
                        color: '#F43F5E', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit',
                      }}
                    >Delete</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <p style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '1rem' }}>
          {filtered.length} case{filtered.length !== 1 ? 's' : ''} shown
        </p>
      </main>
    </div>
  )
}