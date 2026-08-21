export function formatCount(n) {
  if (!n) return '--'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}