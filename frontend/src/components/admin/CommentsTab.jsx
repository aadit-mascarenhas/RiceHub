import { useState } from 'react'
import { Link } from 'react-router'

export default function CommentsTab({ comments, onDelete }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const handleDelete = async (comment) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return
    setBusyId(comment._id)
    setError(null)
    try {
      await onDelete(comment)
    } catch (err) {
      setError(err.message || 'DELETE_FAILED')
    } finally {
      setBusyId(null)
    }
  }

  if (comments.length === 0) {
    return (
      <p className="border-2 border-dashed border-outline-variant p-10 text-center font-mono text-sm text-on-surface-variant">
        &gt; NO_COMMENTS_FOUND_
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      {error && (
        <p className="border-2 border-error bg-surface-container p-4 font-mono text-sm text-error">
          &gt; ERR: {error}
        </p>
      )}
      <div className="flex flex-col border-2 border-outline">
        {comments.map((comment) => (
          <article
            key={comment._id}
            className="flex flex-col gap-2 border-b-2 border-outline-variant bg-surface-container p-5 last:border-b-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="font-mono text-xs uppercase text-terminal-green">
                {comment.authorHandle}
              </span>
              <time className="font-mono text-[10px] text-on-surface-variant">
                {new Date(comment.createdAt).toLocaleString()}
              </time>
            </div>

            <p className="text-sm leading-relaxed text-on-surface">{comment.text}</p>

            <div className="mt-1 flex items-center justify-between gap-3">
              {comment.rice ? (
                <Link
                  to={`/rice/${comment.rice._id || comment.rice}`}
                  className="truncate font-mono text-[10px] uppercase text-on-surface-variant hover:text-terminal-green"
                >
                  on: {comment.rice.title || comment.rice}
                </Link>
              ) : (
                <span className="font-mono text-[10px] text-on-surface-variant">
                  on: (deleted rice)
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(comment)}
                disabled={busyId === comment._id}
                className="shrink-0 border-2 border-outline px-3 py-1 font-mono text-[10px] uppercase text-on-surface transition-colors hover:border-error hover:text-error disabled:opacity-60"
              >
                {busyId === comment._id ? '...' : 'DELETE'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
