const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function fetchRices({ query = '', filters = {} } = {}) {
  const params = new URLSearchParams()
  if (query) params.set('search', query)
  if (filters.distro?.length) params.set('distro', filters.distro.join(','))
  if (filters.wm?.length) params.set('wm', filters.wm.join(','))
  if (filters.colorScheme?.length) params.set('colorScheme', filters.colorScheme.join(','))

  const res = await fetch(`${API_BASE}/rices?${params}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data.rices
}

export async function fetchRiceById(id) {
  const res = await fetch(`${API_BASE}/rices/${id}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data
}

export async function fetchRicesByIds(ids) {
  if (!ids || ids.length === 0) return []
  const res = await fetch(`${API_BASE}/rices/batch?ids=${ids.join(',')}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data
}
