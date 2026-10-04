import { Navigate, useLocation } from 'react-router'
import useAuth from '../hooks/useAuth'

// Gates /dashboard and /submit (Exp 6). Public routes stay open.
export default function ProtectedRoute({ children }) {
  const { user, token } = useAuth()
  const location = useLocation()

  if (!user || !token) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return children
}
