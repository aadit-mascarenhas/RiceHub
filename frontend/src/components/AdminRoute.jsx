import { Navigate, useLocation, Link } from 'react-router'
import Layout from './Layout'
import useAuth from '../hooks/useAuth'

// Gates /admin. Unauthenticated users get sent to login (same contract as
// ProtectedRoute); a logged-in non-admin sees an explicit 403 instead of a
// silent redirect, so the role check is visible rather than mysterious.
export default function AdminRoute({ children }) {
  const { user, token } = useAuth()
  const location = useLocation()

  if (!user || !token) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (user.role !== 'admin') {
    return (
      <Layout>
        <div className="px-4 py-24 lg:px-12">
          <div className="mx-auto max-w-2xl border-2 border-error bg-surface-container p-8 shadow-hard">
            <div className="mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-error">
                lock
              </span>
              <h1 className="font-display text-2xl font-bold uppercase text-on-surface">
                Access denied
              </h1>
            </div>
            <p className="font-mono text-sm text-error">&gt; ERR: 403 ADMIN_ACCESS_REQUIRED</p>
            <p className="mt-4 text-sm text-on-surface-variant">
              This account ({user.handle}) does not hold the admin role. Ask an
              existing admin to promote you, then sign in again — the role is
              read from your session token, so a fresh login is required.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-block border-2 border-outline bg-surface-container px-4 py-2 font-mono text-xs uppercase tracking-widest text-on-surface transition-colors hover:border-terminal-green hover:text-terminal-green"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return children
}
