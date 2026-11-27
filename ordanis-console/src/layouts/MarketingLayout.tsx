import { useEffect, useState } from 'react'
import { Github, Menu, X } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { ThemeToggle } from '../components/ThemeToggle'

export default function MarketingLayout() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return <div className="marketing-root retrace-direction">
    <header className={`glass-nav ${scrolled ? 'scrolled' : ''}`}>
      <Brand />
      <nav id="public-navigation" className={open ? 'open' : ''} aria-label="Public navigation">
        <a href="#product" onClick={() => setOpen(false)}>Product</a>
        <a href="#engineering" onClick={() => setOpen(false)}>Engineering</a>
        <a href="#story" onClick={() => setOpen(false)}>Story</a>
        <a href="https://github.com/nomaanmunshi/ordanis" target="_blank" rel="noreferrer"><Github size={15} />GitHub</a>
        <ThemeToggle compact />
        <Link className="nav-launch" to="/console" onClick={() => setOpen(false)}>Launch console</Link>
      </nav>
      <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="public-navigation">{open ? <X /> : <Menu />}</button>
    </header>
    <a className="marketing-skip" href="#main-content">Skip to content</a>
    <main id="main-content"><Outlet /></main>
    <footer
      className="marketing-footer"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--footer-x', `${event.clientX - rect.left}px`)
        event.currentTarget.style.setProperty('--footer-y', `${event.clientY - rect.top}px`)
        event.currentTarget.style.setProperty('--footer-spot-opacity', '1')
      }}
      onPointerLeave={(event) => event.currentTarget.style.setProperty('--footer-spot-opacity', '0')}
    >
      <div className="footer-wordmark" aria-hidden="true">
        <span className="footer-wordmark-outline">ORDANIS</span>
        <span className="footer-wordmark-light">ORDANIS</span>
      </div>
      <div className="footer-content">
        <div className="footer-identity">
          <Brand />
          <p>Distributed workflow infrastructure for reliable background execution.</p>
        </div>
        <div className="footer-links">
          <a href="#product">Product</a>
          <a href="#architecture">Architecture</a>
          <a href="#engineering">Engineering</a>
          <a href="https://github.com/nomaanmunshi/ordanis" target="_blank" rel="noreferrer"><Github size={14} />Source</a>
        </div>
      </div>
    </footer>
  </div>
}
