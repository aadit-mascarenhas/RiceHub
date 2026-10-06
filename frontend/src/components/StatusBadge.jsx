// Shared PENDING / APPROVED / REJECTED pill. Used by DashboardCard (owner view)
// and the admin moderation queue so the status vocabulary stays in one place.
const STATUS_STYLES = {
  APPROVED: 'border-terminal-green text-terminal-green',
  PENDING: 'border-warning-orange text-warning-orange',
  REJECTED: 'border-error text-error',
}

export default function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || 'border-outline text-on-surface-variant'

  return (
    <span
      className={`inline-block border px-3 py-1 font-mono text-xs uppercase ${style} ${className}`}
    >
      {status || 'UNKNOWN'}
    </span>
  )
}
