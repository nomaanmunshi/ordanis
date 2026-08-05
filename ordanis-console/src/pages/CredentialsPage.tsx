import { FileKey2, KeyRound, ShieldCheck } from 'lucide-react'
import { PageHeader, Panel } from '../components/Page'

export default function CredentialsPage() {
  return <><PageHeader eyebrow="Security" title="API keys & secrets" description="Credential management remains locked until authentication, authorization, and encrypted secret storage exist." />
    <div className="security-grid"><Panel><div className="capability-hero compact"><FileKey2/><span>Secure by omission</span><h2>No secret values are stored by this frontend.</h2><p>The backend has no authentication or secret vault in version one. Ordanis therefore exposes no fake key creation or rotation controls.</p></div></Panel><Panel title="Required before enabling"><div className="requirements-list"><div><ShieldCheck/><span><strong>Authentication and RBAC</strong><small>Identify the actor and authorize scopes.</small></span></div><div><KeyRound/><span><strong>Encrypted secret storage</strong><small>One-time reveal, masking, rotation, and revocation.</small></span></div><div><FileKey2/><span><strong>Immutable audit trail</strong><small>Record creation, use, rotation, and deletion.</small></span></div></div></Panel></div>
  </>
}
