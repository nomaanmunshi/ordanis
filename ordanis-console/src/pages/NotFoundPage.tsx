import { Link } from 'react-router-dom'
export default function NotFoundPage() { return <div className="not-found"><span>404</span><h1>This route is not part of the workflow.</h1><p>The page may have moved, or the execution ID is invalid.</p><Link className="button primary" to="/console">Return to overview</Link></div> }
