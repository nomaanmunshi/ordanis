import { CalendarClock, Clock, LockKeyhole } from 'lucide-react'
import { PageHeader, Panel } from '../components/Page'

export default function SchedulesPage() {
  return <><PageHeader eyebrow="Triggers" title="Schedules" description="Cron, delayed, and recurring triggers belong here once the scheduler contract supports them." />
    <div className="capability-page"><Panel><div className="capability-hero"><CalendarClock/><span>Backend capability not implemented</span><h2>Schedules are intentionally disabled.</h2><p>The current engine starts workflows through the REST API. Adding a decorative cron form would create a control that cannot execute anything.</p></div><div className="capability-roadmap"><div><Clock/><span><strong>Required backend work</strong><small>Persisted schedules, timezone handling, next-run calculation, scheduler ownership, and misfire policy.</small></span></div><div><LockKeyhole/><span><strong>Safety requirements</strong><small>Optimistic locking, duplicate-trigger protection, and auditable enable/disable operations.</small></span></div></div></Panel></div>
  </>
}
