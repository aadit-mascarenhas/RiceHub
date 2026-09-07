import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'

const STORAGE_KEY = 'ricehub.user'

function readStoredUser() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  useEffect(() => {
    if (user) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      login: (nextUser) => setUser(nextUser),
      logout: () => setUser(null),
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
