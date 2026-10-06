import { useEffect, useState } from 'react'

/**
 * Runs `fetcher` and exposes { data, loading, error }.
 *
 * `refreshKey` is an optional counter: bump it to force a refetch without
 * changing the fetcher's identity. React Compiler memoises on the values a
 * callback actually *reads* in its body and silently drops deps it cannot see
 * being used, so a fetcher that closes over `refreshKey` without reading it
 * keeps a stable identity and never refetches. Passing the key in here and
 * handing it to the fetcher keeps it a real, observable dependency.
 *
 * The key is passed as an argument purely as a refetch signal; fetchers are
 * free to ignore it.
 */
export default function useFetch(fetcher, refreshKey = 0) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const result = await fetcher(refreshKey)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err.message || 'SOMETHING_WENT_WRONG')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [fetcher, refreshKey])

  return { data, loading, error }
}
