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

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res
    .json()
    .catch(() => ({ success: false, error: 'Unexpected server response' }))
  if (!json.success) throw new Error(json.error || 'Request failed')
  return json.data
}

export async function createRice(payload) {
  return request('/rices', { method: 'POST', body: payload })
}

export async function updateRice(id, payload) {
  return request(`/rices/${id}`, { method: 'PUT', body: payload })
}

export async function deleteRice(id) {
  return request(`/rices/${id}`, { method: 'DELETE' })
}
