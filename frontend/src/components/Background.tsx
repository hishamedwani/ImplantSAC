export default function Background() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      background: '#06060f',
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>

      {/* Indigo orb — top center */}
      <div style={{
        position: 'absolute', top: '-100px', left: '40%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 65%)',
        filter: 'blur(60px)',
        animation: 'float1 20s ease-in-out infinite',
      }} />

      {/* Cyan orb — bottom right */}
      <div style={{
        position: 'absolute', bottom: '-100px', right: '10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,180,216,0.2) 0%, transparent 65%)',
        filter: 'blur(60px)',
        animation: 'float2 25s ease-in-out infinite',
      }} />

      {/* Purple orb — middle left */}
      <div style={{
        position: 'absolute', top: '50%', left: '35%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 65%)',
        filter: 'blur(70px)',
        animation: 'float3 30s ease-in-out infinite',
      }} />

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0)        }
          33%       { transform: translate(40px, 30px)  }
          66%       { transform: translate(-20px, 40px) }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0)         }
          33%       { transform: translate(-40px, -30px) }
          66%       { transform: translate(30px, -40px)  }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0)        }
          50%       { transform: translate(-30px, 30px) }
        }
      `}</style>
    </div>
  )
}