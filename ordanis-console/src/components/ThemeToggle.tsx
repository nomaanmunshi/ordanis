import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ordanis-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1A1614' : '#FAF9F7')
  }, [theme])

  const next = theme === 'light' ? 'dark' : 'light'
  return (
    <button className={`theme-toggle ${compact ? 'compact' : ''}`} onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      {!compact && <span>{theme === 'light' ? 'Dark' : 'Light'} mode</span>}
    </button>
  )
}
