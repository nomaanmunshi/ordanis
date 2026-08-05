import type { HTMLAttributes, ReactNode } from 'react'

export function InteractiveSurface({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    event.currentTarget.style.setProperty('--pointer-x', `${x * 100}%`)
    event.currentTarget.style.setProperty('--pointer-y', `${y * 100}%`)
    event.currentTarget.style.setProperty('--rotate-x', `${(0.5 - y) * 3.5}deg`)
    event.currentTarget.style.setProperty('--rotate-y', `${(x - 0.5) * 4.5}deg`)
  }

  const reset = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--rotate-x', '0deg')
    event.currentTarget.style.setProperty('--rotate-y', '0deg')
  }

  return <div {...props} className={`interactive-surface ${className}`} onPointerMove={move} onPointerLeave={reset}>{children}</div>
}
