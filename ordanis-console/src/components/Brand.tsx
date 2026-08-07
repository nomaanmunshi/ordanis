import { Link } from 'react-router-dom'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`brand ${compact ? 'compact' : ''}`} aria-label="Ordanis home">
      {compact ? (
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" focusable="false">
            <path d="M24 5 40 14v20L24 43 8 34V14L24 5Z" />
            <path d="M24 12 33 17v14l-9 5-9-5V17l9-5Z" />
            <path d="M8 24h7M33 24h7" />
          </svg>
        </span>
      ) : (
        <span className="brand-logo-shell">
          <img className="brand-logo-image" src={`${import.meta.env.BASE_URL}ordanis-logo.png`} alt="Ordanis" />
        </span>
      )}
    </Link>
  )
}
