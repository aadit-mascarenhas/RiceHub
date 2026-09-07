import { useContext } from 'react'
import { SavedRicesContext } from '../context/SavedRicesContext'

export default function useSavedRices() {
  const context = useContext(SavedRicesContext)
  if (!context) {
    throw new Error('useSavedRices must be used within a SavedRicesProvider')
  }
  return context
}
