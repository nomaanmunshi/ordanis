import { Link } from 'react-router-dom'

export function OrdanisMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <path d="M11 15.5 24 8l13 7.5v17L24 40l-13-7.5v-17Z" className="mark-frame" />
      <path d="M16 18h10.5L32 23.5 26.5 29H16" className="mark-flow" />
      <path d="M21 14.5 15.5 23.5 21 33.5" className="mark-flow mark-flow-secondary" />
    </svg>
  )
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`brand ${compact ? 'compact' : ''}`} aria-label="Ordanis home">
      <span className="brand-symbol"><OrdanisMark /></span>
      {!compact && <span className="brand-word">Ordanis</span>}
    </Link>
  )
}
