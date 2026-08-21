import { mockRices } from './mockRices'

const NETWORK_DELAY_MS = 500

export function fetchRices({ query = '', filters = {} } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(filterRices(query, filters))
    }, NETWORK_DELAY_MS)
  })
}

function filterRices(query, filters) {
  const text = query.trim().toLowerCase()

  return mockRices.filter((rice) => {
    const matchesQuery =
      !text ||
      rice.title.toLowerCase().includes(text) ||
      rice.tags.some((tag) => tag.toLowerCase().includes(text))

    const matchesFilters = Object.entries(filters).every(
      ([field, selected]) =>
        !selected || selected.length === 0 || selected.includes(rice[field])
    )

    return matchesQuery && matchesFilters
  })
}