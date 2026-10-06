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

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res
    .json()
    .catch(() => ({ success: false, error: 'Unexpected server response' }))
  if (!json.success) throw new Error(json.error || 'Request failed')
  return json.data
}

// --- auth (Exp 6) ----------------------------------------------------------

export async function loginUser(identifier, password) {
  return request('/auth/login', { method: 'POST', body: { identifier, password } })
}

export async function registerUser(handle, email, password) {
  return request('/auth/register', { method: 'POST', body: { handle, email, password } })
}

// --- rice writes (auth-gated from Exp 6) -----------------------------------

export async function createRice(payload, token) {
  return request('/rices', { method: 'POST', body: payload, token })
}

export async function updateRice(id, payload, token) {
  return request(`/rices/${id}`, { method: 'PUT', body: payload, token })
}

export async function deleteRice(id, token) {
  return request(`/rices/${id}`, { method: 'DELETE', token })
}

export async function toggleLike(id, token) {
  return request(`/rices/${id}/like`, { method: 'POST', token })
}

export async function fetchMyRices(token) {
  return request('/rices/mine', { token })
}

// --- comments (Exp 8) --------------------------------------------------------

export async function fetchComments(riceId, { limit = 50, before } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (before) params.set('before', before)
  const res = await fetch(`${API_BASE}/rices/${riceId}/comments?${params}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data
}

export async function postComment(riceId, text, token) {
  return request(`/rices/${riceId}/comments`, { method: 'POST', body: { text }, token })
}

// --- admin (moderation panel) -----------------------------------------------
// Every call below needs an admin JWT; the router rejects anyone else with 403.
// Note user ids are the safe-JSON `id` field, never `_id`.

export async function fetchAdminStats(token) {
  return request('/admin/stats', { token })
}

export async function fetchAdminRices({ status, search = '', page, limit } = {}, token) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))
  return request(`/admin/rices?${params}`, { token })
}

export async function setRiceStatus(id, status, token) {
  return request(`/admin/rices/${id}/status`, { method: 'PATCH', body: { status }, token })
}

export async function fetchAdminUsers({ search = '', role, page, limit } = {}, token) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (role) params.set('role', role)
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))
  return request(`/admin/users?${params}`, { token })
}

export async function setUserRole(id, role, token) {
  return request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role }, token })
}

export async function fetchAdminComments({ riceId, limit } = {}, token) {
  const params = new URLSearchParams()
  if (riceId) params.set('riceId', riceId)
  if (limit) params.set('limit', String(limit))
  return request(`/admin/comments?${params}`, { token })
}

export async function deleteComment(id, token) {
  return request(`/admin/comments/${id}`, { method: 'DELETE', token })
}
