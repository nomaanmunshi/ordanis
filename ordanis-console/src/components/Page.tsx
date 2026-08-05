import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>
}

export function Panel({ title, description, action, children, className = '' }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{(title || action) && <div className="panel-head"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action}</div>}{children}</section>
}

export function MetricCard({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: ReactNode }) {
  return <article className="metric-card"><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-orbit" aria-hidden="true"><span /></div><h3>{title}</h3><p>{description}</p>{action}</div>
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : 'The request could not be completed.'
  return <div className="error-state"><OctagonXIcon /><div><h3>Request failed</h3><p>{message}</p>{retry && <button className="button secondary" onClick={retry}>Try again</button>}</div></div>
}

function OctagonXIcon() { return <span className="error-symbol">!</span> }
