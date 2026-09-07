import { useCallback, useMemo, useState } from 'react'
import { EMPTY_FILTERS } from '../data/filterOptions'
import { FiltersContext } from './FiltersContext'

export default function FiltersProvider({ children }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('TRENDING')
  const [selectedFilters, setSelectedFilters] = useState(EMPTY_FILTERS)

  const toggleFilter = useCallback((field, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }))
  }, [])

  const clearFilters = useCallback(() => setSelectedFilters(EMPTY_FILTERS), [])

  const value = useMemo(
    () => ({
      search,
      setSearch,
      sort,
      setSort,
      selectedFilters,
      toggleFilter,
      clearFilters,
    }),
    [search, sort, selectedFilters, toggleFilter, clearFilters]
  )

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  )
}
