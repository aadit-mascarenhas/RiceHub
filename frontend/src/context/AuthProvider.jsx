import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'
import { loginUser, registerUser } from '../data/mockApi'

const STORAGE_KEY = 'ricehub.user'

// Exp 3 stored a bare mock user object; Exp 6 stores { user, token }.
// Legacy entries have no token and cannot authenticate → treated as logged out.
function readStoredSession() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.user && parsed.token) return parsed
    return null
  } catch {
    return null
  }
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)

  useEffect(() => {
    if (session) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [session])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      login: async (identifier, password) => {
        const data = await loginUser(identifier, password)
        setSession(data)
        return data.user
      },
      register: async (handle, email, password) => {
        const data = await registerUser(handle, email, password)
        setSession(data)
        return data.user
      },
      logout: () => setSession(null),
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
