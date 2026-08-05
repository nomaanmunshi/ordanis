import { Check, Database, Radio, Server, Settings2 } from 'lucide-react'
import { dataMode } from '../api/client'
import { PageHeader, Panel } from '../components/Page'

export default function SettingsPage() {
  return <><PageHeader eyebrow="Workspace" title="Settings" description="Runtime configuration visible to the console. Sensitive server configuration is not editable from the browser." />
    <div className="settings-layout"><Panel title="Console configuration"><div className="settings-form"><label>Data source<input value={dataMode === 'live' ? 'Live Java backend' : dataMode === 'showcase' ? 'Live backend with sample overlay' : 'Development sample data'} readOnly/></label><label>API base URL<input value={import.meta.env.VITE_API_BASE_URL ?? '/api'} readOnly/></label><label>Workspace<input value={dataMode === 'showcase' ? 'Recruiter showcase' : 'Local workspace'} readOnly/></label><label>Region<input value="eu-central" readOnly/></label></div></Panel><Panel title="Platform profile"><div className="platform-profile"><div><Server/><span><strong>Control plane</strong><small>Java 21 · Spring Boot</small></span><Check/></div><div><Database/><span><strong>Durable state</strong><small>PostgreSQL · Flyway</small></span><Check/></div><div><Radio/><span><strong>Worker protocol</strong><small>gRPC · task leasing</small></span><Check/></div><div><Settings2/><span><strong>Delivery</strong><small>At least once</small></span><Check/></div></div></Panel></div>
  </>
}
