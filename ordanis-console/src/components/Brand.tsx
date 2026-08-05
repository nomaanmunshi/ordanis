import { Link } from 'react-router-dom'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="Ordanis home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <circle cx="23" cy="24" r="10.5" />
          <path d="M33.5 24H40" />
          <path d="M10 16h5.5" />
          <path d="M10 32h5.5" />
          <circle cx="8.5" cy="16" r="2.5" />
          <circle cx="8.5" cy="32" r="2.5" />
          <circle cx="41.5" cy="24" r="2.5" />
        </svg>
      </span>
      {!compact && <span className="brand-copy"><strong>Ordanis</strong><small>by Nomaan Munshi</small></span>}
    </Link>
  )
}
