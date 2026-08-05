import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Activity, Braces, CalendarClock, ChevronLeft, CircleAlert, FileKey2, Gauge, Menu, ScrollText, Search, Server, Settings, Workflow, X } from 'lucide-react'
import { Brand } from '../components/Brand'
import { CommandPalette } from '../components/CommandPalette'
import { ThemeToggle } from '../components/ThemeToggle'
import { dataMode } from '../api/client'

const nav = [
  { to: '/console', label: 'Overview', icon: Gauge, end: true },
  { to: '/console/workflows', label: 'Workflows', icon: Workflow },
  { to: '/console/executions', label: 'Executions', icon: Activity },
  { to: '/console/schedules', label: 'Schedules', icon: CalendarClock },
  { to: '/console/workers', label: 'Workers', icon: Server },
  { to: '/console/failures', label: 'Failures', icon: CircleAlert },
  { to: '/console/audit', label: 'Audit logs', icon: ScrollText },
  { to: '/console/credentials', label: 'API and secrets', icon: FileKey2 },
  { to: '/console/settings', label: 'Settings', icon: Settings },
]

export default function ConsoleLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [palette, setPalette] = useState(false)
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPalette(true) }
      if (event.key === 'Escape') { setPalette(false); setMobile(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const workspace = dataMode === 'live' ? ['Ordanis control plane', 'live API'] : dataMode === 'showcase' ? ['Showcase workspace', 'live and sample'] : ['Development workspace', 'sample data']

  return <div className={`console-shell ${collapsed ? 'collapsed' : ''}`}>
    <aside className={mobile ? 'mobile-open' : ''}>
      <div className="sidebar-brand"><Brand compact={collapsed} /><button className="sidebar-close" onClick={() => setMobile(false)} aria-label="Close navigation"><X /></button></div>
      <nav>{nav.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobile(false)}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><button onClick={() => setCollapsed((value) => !value)}><ChevronLeft size={17} /><span>Collapse</span></button><a className="author-chip" href="https://github.com/nomaanmunshi" target="_blank" rel="noreferrer"><span>NM</span><div><strong>Nomaan Munshi</strong><small>GitHub profile</small></div></a></div>
    </aside>
    {mobile && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMobile(false)} />}
    <section className="console-main">
      <header className="console-topbar">
        <button className="mobile-menu" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu /></button>
        <div className="workspace"><span className="workspace-dot" />{workspace[0]}<small>{workspace[1]}</small></div>
        <div className="top-actions">
          {dataMode !== 'live' && <span className="fixture-pill">{dataMode === 'showcase' ? 'Sample overlay' : 'Sample dataset'}</span>}
          <ThemeToggle compact />
          <button className="search-trigger" onClick={() => setPalette(true)}><Search size={16} /><span>Search</span><kbd>⌘K</kbd></button>
          <button className="icon-button" aria-label="API status"><Braces size={17} /></button>
        </div>
      </header>
      {dataMode !== 'live' && <div className="fixture-banner"><strong>{dataMode === 'showcase' ? 'Showcase mode:' : 'Development mode:'}</strong> {dataMode === 'showcase' ? 'sample workflows and telemetry are displayed beside live backend records. Actions on new records still use the Java API.' : 'workflows, executions, and workers use local sample records.'}</div>}
      <main className="console-content"><Outlet /></main>
    </section>
    <CommandPalette open={palette} onClose={() => setPalette(false)} />
  </div>
}
