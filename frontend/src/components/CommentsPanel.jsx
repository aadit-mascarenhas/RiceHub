import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { io } from 'socket.io-client'
import useAuth from '../hooks/useAuth'
import useFetch from '../hooks/useFetch'
import { fetchComments, postComment } from '../data/mockApi'

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(
  /\/api\/?$/,
  '',
)

// Append/replace a comment, dedupe by _id, keep chronological order.
function mergeComment(list, comment) {
  const exists = list.some((c) => c._id === comment._id)
  const next = exists ? list.map((c) => (c._id === comment._id ? comment : c)) : [...list, comment]
  return [...next].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

export default function CommentsPanel({ riceId }) {
  const { user, token } = useAuth()
  const loadComments = useCallback(() => fetchComments(riceId), [riceId])
  const { data: history, loading, error } = useFetch(loadComments)

  // Live/optimistic additions layered over the REST history. Parent renders
  // this with a `key={riceId}` so the buffer never mixes rices.
  const [live, setLive] = useState([])
  // Comments deleted by an admin while this panel is open; the REST history
  // still contains them until the next mount.
  const [deletedIds, setDeletedIds] = useState([])
  const [connected, setConnected] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: token ? { token } : {} })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join', riceId)
    })
    socket.on('disconnect', () => setConnected(false))
    // An admin removed this comment (DELETE /api/admin/comments/:id). Drop it
    // from the live buffer; the next mount refetches the REST history.
    socket.on('comment:delete', ({ commentId }) => {
      setLive((prev) => prev.filter((c) => c._id !== commentId))
      setDeletedIds((prev) => (prev.includes(commentId) ? prev : [...prev, commentId]))
    })
    socket.on('comment:new', (comment) => {
      setLive((prev) => {
        // The sender already applied its optimistic row → swap it for the
        // real document; everyone else just appends.
        const pending = prev.find(
          (c) => c.pending && c.text === comment.text && c.authorHandle === comment.authorHandle,
        )
        if (pending) {
          return mergeComment(
            prev.filter((c) => c._id !== pending._id),
            comment,
          )
        }
        return prev.some((c) => c._id === comment._id) ? prev : mergeComment(prev, comment)
      })
    })

    return () => {
      socket.emit('leave', riceId)
      socket.disconnect()
      socketRef.current = null
    }
  }, [riceId, token])

  const comments = mergeAll(history, live).filter((c) => !deletedIds.includes(c._id))

  const handleSend = async (event) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending || !user) return

    setSending(true)
    setSendError(null)

    const temp = {
      _id: `tmp-${Date.now()}`,
      rice: riceId,
      authorHandle: user.handle,
      text: trimmed,
      createdAt: new Date().toISOString(),
      pending: true,
    }
    setLive((prev) => mergeComment(prev, temp))
    setText('')

    try {
      const socket = socketRef.current
      let saved
      if (socket?.connected) {
        const ack = await new Promise((resolve) => {
          socket.emit('comment:send', { riceId, text: trimmed }, resolve)
        })
        if (!ack?.success) throw new Error(ack?.error || 'SEND_FAILED')
        saved = ack.data
      } else {
        // REST fallback: works even when the socket is down, and the server
        // rebroadcasts it to everyone else in the room.
        saved = await postComment(riceId, trimmed, token)
      }
      setLive((prev) => prev.map((c) => (c._id === temp._id ? saved : c)))
    } catch (err) {
      // Roll back the optimistic row.
      setLive((prev) => prev.filter((c) => c._id !== temp._id))
      setSendError(err.message || 'SEND_FAILED')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b-2 border-outline-variant pb-2">
        <h3 className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
          Logs
        </h3>
        <span
          className={`font-mono text-xs ${connected ? 'text-terminal-green' : 'text-warning-orange'}`}
        >
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto border-2 border-outline-variant bg-surface-container p-4">
        {loading && <p className="font-mono text-xs text-on-surface-variant">&gt; LOADING_LOGS...</p>}
        {error && (
          <p className="font-mono text-xs text-error">&gt; ERR: {error}</p>
        )}
        {!loading && !error && comments.length === 0 && (
          <p className="border-2 border-dashed border-outline-variant p-6 text-center font-mono text-xs text-on-surface-variant">
            &gt; NO_LOGS_YET_
          </p>
        )}
        {comments.map((comment) => (
          <article key={comment._id} className="border-l-2 border-terminal-green pl-3">
            <header className="flex items-baseline justify-between gap-4">
              <span className="font-mono text-xs uppercase text-terminal-green">
                {comment.authorHandle}
              </span>
              <time className="font-mono text-[10px] text-on-surface-variant">
                {new Date(comment.createdAt).toLocaleString()}
              </time>
            </header>
            <p className="text-sm leading-relaxed text-on-surface">
              {comment.text}
              {comment.pending && (
                <span className="font-mono text-xs text-on-surface-variant"> (sending...)</span>
              )}
            </p>
          </article>
        ))}
      </div>

      {user ? (
        <form onSubmit={handleSend} className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="> append to logs..."
            className="w-full resize-none border-2 border-primary bg-surface-container p-3 font-mono text-sm text-on-surface placeholder:text-on-surface-variant focus:border-terminal-green focus:outline-none"
          />
          {sendError && <p className="font-mono text-xs text-error">&gt; ERR: {sendError}</p>}
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="self-end border-2 border-primary bg-surface-container px-4 py-2 font-mono text-xs uppercase text-on-surface shadow-hard-sm transition-all hover:border-terminal-green hover:text-terminal-green hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-50"
          >
            {sending ? 'SENDING...' : 'TRANSMIT'}
          </button>
        </form>
      ) : (
        <p className="border-2 border-dashed border-outline-variant p-4 text-center font-mono text-xs text-on-surface-variant">
          &gt;{' '}
          <Link
            to={`/login?next=${encodeURIComponent(`/rice/${riceId}`)}`}
            className="text-terminal-green hover:underline"
          >
            LOGIN
          </Link>{' '}
          TO_APPEND_LOGS
        </p>
      )}
    </section>
  )
}

function mergeAll(history, live) {
  const seen = new Map()
  for (const c of [...(history || []), ...live]) seen.set(c._id, c)
  return [...seen.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}
