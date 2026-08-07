import { Link } from 'react-router-dom'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="Ordanis home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <path d="M24 5 40 14v20L24 43 8 34V14L24 5Z" />
          <path d="M24 12 33 17v14l-9 5-9-5V17l9-5Z" />
          <path d="M8 24h7M33 24h7" />
        </svg>
      </span>
      {!compact && <span className="brand-copy"><strong>Ordanis</strong><small>by Nomaan Munshi</small></span>}
    </Link>
  )
}
