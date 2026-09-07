import { useContext } from 'react'
import { FiltersContext } from '../context/FiltersContext'

export default function useFilters() {
  const context = useContext(FiltersContext)
  if (!context) {
    throw new Error('useFilters must be used within a FiltersProvider')
  }
  return context
}
