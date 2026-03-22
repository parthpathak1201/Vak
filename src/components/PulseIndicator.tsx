import { useState } from 'react'

type Props = {
  accent?: string
  onClick?: () => void
}

function PulseIndicator({ accent = '99,153,34', onClick }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ display: 'block', cursor: onClick ? 'pointer' : 'default', transition: 'opacity 0.2s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <style>{`
        @keyframes vak-spin { to { stroke-dashoffset: -31.4; } }
        @keyframes vak-breathe { 0%,100% { opacity: 0.3; } 50% { opacity: 0.9; } }
        .vak-arc { animation: vak-spin 1.8s linear infinite; transform-origin: 7px 7px; }
        .vak-dot { animation: vak-breathe 1.8s ease-in-out infinite; }
      `}</style>

      {!hovered ? (
        <>
          <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
          <circle
            cx="7" cy="7" r="5"
            stroke={`rgba(${accent},0.5)`}
            strokeWidth="1"
            strokeDasharray="8 23.4"
            strokeLinecap="round"
            className="vak-arc"
          />
          <circle
            className="vak-dot"
            cx="7" cy="7" r="1.5"
            fill={`rgba(${accent},0.8)`}
          />
        </>
      ) : (
        <>
          <line x1="4" y1="4" x2="10" y2="10" stroke="rgba(210,100,100,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="10" y1="4" x2="4" y2="10" stroke="rgba(210,100,100,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
        </>
      )}
    </svg>
  )
}

export default PulseIndicator