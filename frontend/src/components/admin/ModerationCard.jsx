import { useState } from 'react'
import { Link } from 'react-router'
import MetaChip from '../MetaChip'
import StatusBadge from '../StatusBadge'
import { formatCount } from '../../utils/format'

// Moderation affordances (approve / reject / delete) — deliberately separate
// from DashboardCard, which shows owner-style edit affordances.
export default function ModerationCard({ rice, onSetStatus, onDelete }) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const run = async (action) => {
    setBusy(action)
    setError(null)
    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete "${rice.title}"? This cannot be undone.`)) {
          setBusy(null)
          return
        }
        await onDelete(rice)
      } else {
        await onSetStatus(rice, action === 'approve' ? 'APPROVED' : 'REJECTED')
      }
    } catch (err) {
      setError(err.message || 'ACTION_FAILED')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col border-2 border-outline bg-surface-container">
      <div className="relative h-40 w-full overflow-hidden border-b-2 border-outline">
        {rice.images?.[0] ? (
          <img
            src={rice.images[0]}
            alt={rice.title}
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <span className="material-symbols-outlined text-4xl text-outline-variant">
              image_not_supported
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 bg-surface-container">
          <StatusBadge status={rice.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-xs text-terminal-green">{rice.author}</span>
          <time className="font-mono text-[10px] text-on-surface-variant">
            {new Date(rice.createdAt).toLocaleDateString()}
          </time>
        </div>

        <Link
          to={`/rice/${rice._id}`}
          className="font-display text-base font-semibold text-on-surface hover:text-terminal-green"
        >
          {rice.title}
        </Link>

        <p className="line-clamp-3 text-sm text-on-surface-variant">{rice.description}</p>

        <div className="flex flex-wrap gap-2">
          {rice.tags?.map((tag) => <MetaChip key={tag} text={tag} />)}
        </div>

        <div className="flex items-center gap-4 border-t border-outline-variant pt-3 font-mono text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">visibility</span>
            {formatCount(rice.views)}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">favorite</span>
            {formatCount(rice.likes?.length || 0)}
          </span>
          {rice.distro && <span className="ml-auto truncate">{rice.distro}</span>}
        </div>

        {error && <p className="font-mono text-xs text-error">&gt; ERR: {error}</p>}

        <div className="mt-1 flex gap-2">
          {rice.status !== 'APPROVED' && (
            <button
              type="button"
              onClick={() => run('approve')}
              disabled={busy !== null}
              className="flex-1 border-2 border-terminal-green bg-surface-container px-3 py-2 font-mono text-xs uppercase text-terminal-green transition-colors hover:bg-terminal-green hover:text-background disabled:opacity-60"
            >
              {busy === 'approve' ? 'WORKING...' : 'APPROVE'}
            </button>
          )}
          {rice.status !== 'REJECTED' && (
            <button
              type="button"
              onClick={() => run('reject')}
              disabled={busy !== null}
              className="flex-1 border-2 border-warning-orange px-3 py-2 font-mono text-xs uppercase text-warning-orange transition-colors hover:bg-warning-orange hover:text-background disabled:opacity-60"
            >
              {busy === 'reject' ? 'WORKING...' : 'REJECT'}
            </button>
          )}
          <button
            type="button"
            onClick={() => run('delete')}
            disabled={busy !== null}
            title="Delete permanently"
            className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-outline transition-colors hover:border-error hover:bg-error hover:text-on-error disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
