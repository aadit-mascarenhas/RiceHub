import { useState } from 'react'
import MetaChip from './MetaChip'
import StatusBadge from './StatusBadge'
import { formatCount } from '../utils/format'

export default function DashboardCard({ rice, canEdit = false, onDelete, onUpdate }) {
  const approved = rice.status === 'APPROVED'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: rice.title, description: rice.description })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${rice.title}"? This cannot be undone.`)) return
    setBusy(true)
    setError(null)
    try {
      await onDelete(rice)
    } catch (err) {
      setError(err.message || 'DELETE_FAILED')
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async () => {
    if (!draft.title.trim()) {
      setError('TITLE_REQUIRED')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onUpdate(rice._id, { title: draft.title.trim(), description: draft.description })
      setEditing(false)
    } catch (err) {
      setError(err.message || 'UPDATE_FAILED')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="group card-lift-green relative flex h-[420px] flex-col border-2 border-outline bg-surface-container">
      {/* Status + actions */}
      <div className="absolute top-4 left-4 z-10 bg-surface-container">
        <StatusBadge status={rice.status} />
      </div>
      {canEdit && !editing && (
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <button
            type="button"
            title="Edit"
            onClick={() => setEditing(true)}
            className="flex h-8 w-8 items-center justify-center border border-outline bg-surface-container transition-colors hover:bg-primary hover:text-on-primary"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            type="button"
            title="Delete"
            onClick={handleDelete}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center border border-outline bg-surface-container transition-colors hover:bg-error hover:text-on-error disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden border-b-2 border-outline">
        <img
          src={rice.images?.[0]}
          alt={rice.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-surface/50 transition-colors duration-300 group-hover:bg-transparent" />
      </div>

      {/* Content */}
      {editing ? (
        <div className="flex flex-1 flex-col gap-3 p-6">
          <input
            name="title"
            value={draft.title}
            onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full border-2 border-outline bg-surface p-2 font-mono text-sm text-on-surface focus:border-terminal-green focus:outline-none"
          />
          <textarea
            name="description"
            value={draft.description}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            rows={4}
            className="flex-1 resize-none border-2 border-outline bg-surface p-2 font-mono text-xs text-on-surface focus:border-terminal-green focus:outline-none"
          />
          {error && (
            <p className="font-mono text-xs text-error">&gt; ERR: {error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="flex-1 border-2 border-terminal-green bg-surface-container px-3 py-2 font-mono text-xs uppercase text-terminal-green transition-colors hover:bg-terminal-green hover:text-background disabled:opacity-60"
            >
              {busy ? 'SAVING...' : 'SAVE'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setError(null)
                setDraft({ title: rice.title, description: rice.description })
              }}
              disabled={busy}
              className="flex-1 border-2 border-outline px-3 py-2 font-mono text-xs uppercase text-on-surface-variant transition-colors hover:border-on-surface hover:text-on-surface disabled:opacity-60"
            >
              CANCEL
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex gap-2">
            {rice.tags.map((tag) => (
              <MetaChip key={tag} text={tag} />
            ))}
          </div>
          <h3 className="mb-2 truncate font-display text-lg font-semibold text-on-surface">
            {rice.title}
          </h3>
          <p className="mb-4 flex-1 line-clamp-2 text-sm text-on-surface-variant">
            {rice.description}
          </p>
          {error && (
            <p className="mb-2 font-mono text-xs text-error">&gt; ERR: {error}</p>
          )}
          <div
            className={`mt-auto flex items-center justify-between border-t border-outline-variant pt-4 ${
              approved ? '' : 'opacity-50'
            }`}
          >
            <span className="flex items-center gap-1 font-mono text-sm text-on-surface">
              <span className="material-symbols-outlined text-sm">visibility</span>
              {formatCount(rice.views)}
            </span>
            <span className="flex items-center gap-1 font-mono text-sm text-on-surface">
              <span className="material-symbols-outlined text-sm">favorite</span>
              {formatCount(rice.likes?.length || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
