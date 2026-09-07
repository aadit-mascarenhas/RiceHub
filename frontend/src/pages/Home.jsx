import { useCallback } from 'react'
import Layout from '../components/Layout'
import RiceCard from '../components/RiceCard'
import RiceCardSkeleton from '../components/RiceCardSkeleton'
import FilterSidebar from '../components/FilterSidebar'
import Pagination from '../components/Pagination'
import useFetch from '../hooks/useFetch'
import useDebounce from '../hooks/useDebounce'
import useFilters from '../hooks/useFilters'
import { fetchRices } from '../data/mockApi'

export default function Home() {
  const { search, setSearch, sort, setSort, selectedFilters } = useFilters()

  const debouncedSearch = useDebounce(search, 300)

  const loadRices = useCallback(
    () => fetchRices({ query: debouncedSearch, filters: selectedFilters }),
    [debouncedSearch, selectedFilters]
  )

  const { data: rices, loading, error } = useFetch(loadRices)

  return (
    <Layout>
      <div className="mx-auto flex max-w-page flex-col gap-6 px-4 lg:flex-row lg:px-12">
        <FilterSidebar />

        {/* Main content */}
        <div className="flex w-full min-w-0 flex-col pb-20">
          <div className="mb-8 flex flex-col gap-4 border-b-2 border-outline-variant pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-display text-3xl font-bold uppercase text-on-surface lg:text-5xl">
              Browse Rices
            </h1>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-56">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-terminal-green">
                  $
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="SEARCH_RICES..."
                  className="w-full border-2 border-outline bg-surface-container py-2 pl-8 pr-3 font-mono text-sm text-on-surface placeholder:text-surface-bright focus:border-terminal-green focus:outline-none"
                />
              </div>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="border-2 border-outline bg-surface-container px-3 py-2 font-mono text-sm text-on-surface focus:border-terminal-green focus:outline-none"
              >
                <option>TRENDING</option>
                <option>LATEST</option>
                <option>TOP_ALL_TIME</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="border-2 border-error bg-surface-container p-6 font-mono text-sm text-error">
              &gt; ERR: {error}
            </p>
          )}

          {loading && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {[1, 2, 3, 4].map((key) => (
                <RiceCardSkeleton key={key} />
              ))}
            </div>
          )}

          {!loading && !error && rices.length === 0 && (
            <p className="border-2 border-dashed border-outline-variant p-10 text-center font-mono text-sm text-on-surface-variant">
              &gt; NO_RICES_FOUND — TRY_A_DIFFERENT_QUERY_
            </p>
          )}

          {!loading && !error && rices.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {rices.map((rice) => (
                  <RiceCard key={rice._id} rice={rice} />
                ))}
              </div>
              <Pagination />
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
