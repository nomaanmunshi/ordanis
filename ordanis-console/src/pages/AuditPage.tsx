import { Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { dataMode } from '../api/client'
import { fixtureAudit } from '../data/fixtures'
import { PageHeader, Panel } from '../components/Page'

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const records = dataMode !== 'live' ? fixtureAudit.filter((record) => JSON.stringify(record).toLowerCase().includes(search.toLowerCase())) : []
  return <><PageHeader eyebrow="Governance" title="Audit logs" description="Immutable records of control-plane actions and security-sensitive changes." />
    <Panel className="toolbar-panel"><div className="list-toolbar"><label className="search-box"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actor, action, or resource"/></label>{dataMode !== 'live' && <span className="fixture-pill">Sample records</span>}</div></Panel>
    <Panel>{dataMode === 'live' ? <div className="inline-unavailable"><ShieldCheck/><div><strong>Audit endpoint not available</strong><p>The frontend will not fabricate immutable records. Add a persisted audit API before enabling this table in live mode.</p></div></div> : <div className="table-wrap"><table><thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Resource</th><th>Outcome</th><th>Correlation ID</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{new Date(record.timestamp).toLocaleString()}</td><td><strong>{record.actor}</strong></td><td><code>{record.action}</code></td><td>{record.resource}<small className="mono">{record.resourceId.slice(0,12)}</small></td><td><span className={`outcome ${record.outcome.toLowerCase()}`}>{record.outcome}</span></td><td className="mono">{record.correlationId}</td></tr>)}</tbody></table></div>}</Panel>
  </>
}
