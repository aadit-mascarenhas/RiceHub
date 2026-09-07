import { useCallback, useMemo, useState } from 'react'
import { SavedRicesContext } from './SavedRicesContext'

export default function SavedRicesProvider({ children }) {
  const [savedIds, setSavedIds] = useState([])

  const toggleSave = useCallback((riceId) => {
    setSavedIds((prev) =>
      prev.includes(riceId)
        ? prev.filter((id) => id !== riceId)
        : [...prev, riceId]
    )
  }, [])

  const isSaved = useCallback(
    (riceId) => savedIds.includes(riceId),
    [savedIds]
  )

  const value = useMemo(
    () => ({ savedIds, isSaved, toggleSave }),
    [savedIds, isSaved, toggleSave]
  )

  return (
    <SavedRicesContext.Provider value={value}>
      {children}
    </SavedRicesContext.Provider>
  )
}
