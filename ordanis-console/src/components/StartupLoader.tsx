import { motion } from 'framer-motion'
import { OrdanisMark } from './Brand'

export function StartupLoader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`ordanis-loader ${compact ? 'compact' : ''}`} role="status" aria-live="polite" aria-label="Preparing Ordanis">
      <motion.div
        className="loader-mark-wrap"
        initial={{ opacity: 0, scale: .92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: .38, ease: [0.22, 1, 0.36, 1] }}
      >
        <OrdanisMark className="loader-mark" />
        <motion.span
          className="loader-route loader-route-a"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="loader-route loader-route-b"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.2, delay: .18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      {!compact && (
        <div className="loader-copy">
          <strong>Ordanis</strong>
          <span>Preparing the execution fabric</span>
          <div className="loader-track" aria-hidden="true"><motion.i animate={{ x: ['-110%', '230%'] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} /></div>
        </div>
      )}
    </div>
  )
}
