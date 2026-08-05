import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import MarketingLayout from '../layouts/MarketingLayout'
import ConsoleLayout from '../layouts/ConsoleLayout'

const LandingPage = lazy(() => import('../pages/LandingPage'))
const OverviewPage = lazy(() => import('../pages/OverviewPage'))
const WorkflowsPage = lazy(() => import('../pages/WorkflowsPage'))
const WorkflowBuilderPage = lazy(() => import('../pages/WorkflowBuilderPage'))
const WorkflowDetailPage = lazy(() => import('../pages/WorkflowDetailPage'))
const ExecutionsPage = lazy(() => import('../pages/ExecutionsPage'))
const ExecutionDetailPage = lazy(() => import('../pages/ExecutionDetailPage'))
const WorkersPage = lazy(() => import('../pages/WorkersPage'))
const SchedulesPage = lazy(() => import('../pages/SchedulesPage'))
const FailuresPage = lazy(() => import('../pages/FailuresPage'))
const AuditPage = lazy(() => import('../pages/AuditPage'))
const CredentialsPage = lazy(() => import('../pages/CredentialsPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export default function App() {
  return <Suspense fallback={<div className="app-loading"><div className="brand-mark"><i/><i/><i/></div><span>Loading Ordanis…</span></div>}><Routes>
    <Route element={<MarketingLayout/>}><Route index element={<LandingPage/>}/></Route>
    <Route path="/console" element={<ConsoleLayout/>}>
      <Route index element={<OverviewPage/>}/>
      <Route path="workflows" element={<WorkflowsPage/>}/>
      <Route path="workflows/new" element={<WorkflowBuilderPage/>}/>
      <Route path="workflows/:workflowId" element={<WorkflowDetailPage/>}/>
      <Route path="executions" element={<ExecutionsPage/>}/>
      <Route path="executions/:runId" element={<ExecutionDetailPage/>}/>
      <Route path="workers" element={<WorkersPage/>}/>
      <Route path="schedules" element={<SchedulesPage/>}/>
      <Route path="failures" element={<FailuresPage/>}/>
      <Route path="audit" element={<AuditPage/>}/>
      <Route path="credentials" element={<CredentialsPage/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
    </Route>
    <Route path="/dashboard" element={<Navigate to="/console" replace/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Routes></Suspense>
}
