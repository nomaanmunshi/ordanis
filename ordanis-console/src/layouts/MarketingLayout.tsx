import { useEffect, useRef, useState } from 'react'
import { Github, Menu, X } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { ThemeToggle } from '../components/ThemeToggle'

export default function MarketingLayout() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const previousY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
      setScrolled(y > 18)
      setProgress(Math.min(y / max, 1))
      const ratio = Math.min(y / max, 1)
      setHidden(y > 150 && y > previousY.current + 7)
      if (y < previousY.current - 5) setHidden(false)
      previousY.current = y
      document.documentElement.style.setProperty('--page-scroll', String(ratio))
      document.documentElement.style.setProperty('--scroll-down-shift', `${ratio * 120}px`)
      document.documentElement.style.setProperty('--scroll-up-shift', `${ratio * -100}px`)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return <div className="marketing-root">
    <div className="scroll-atmosphere" aria-hidden="true"><i /><i /><i /></div>
    <div className="page-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
    <header className={`glass-nav ${scrolled ? 'scrolled' : ''} ${hidden && !open ? 'nav-hidden' : ''}`}>
      <Brand />
      <nav className={open ? 'open' : ''} aria-label="Public navigation">
        <a href="#product" onClick={() => setOpen(false)}>Product</a>
        <a href="#architecture" onClick={() => setOpen(false)}>Architecture</a>
        <a href="#engineering" onClick={() => setOpen(false)}>Engineering</a>
        <a href="#use-cases" onClick={() => setOpen(false)}>Use cases</a>
        <a href="https://github.com/nomaanmunshi/ordanis" target="_blank" rel="noreferrer"><Github size={15} />GitHub</a>
        <ThemeToggle compact />
        <Link className="nav-launch" to="/console" onClick={() => setOpen(false)}>Launch console</Link>
      </nav>
      <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
    </header>
    <main><Outlet /></main>
    <footer className="marketing-footer">
      <Brand />
      <p>Distributed execution built for failure. Designed and engineered by Nomaan Munshi.</p>
      <a href="https://github.com/nomaanmunshi/ordanis" target="_blank" rel="noreferrer"><Github size={14} />GitHub</a>
    </footer>
  </div>
}
