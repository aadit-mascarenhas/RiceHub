import jwt from 'jsonwebtoken'
import Comment from '../models/Comment.js'
import Rice from '../models/Rice.js'

const MAX_TEXT = 500
const SEND_INTERVAL_MS = 1000

// Socket contract (all events on a single namespace):
//   client → server:  "join" (riceId) / "leave" (riceId)
//                     "comment:send" ({ riceId, text }, ack)
//   server → client:  "comment:new" (saved Comment document)
// Handshake auth: `io(url, { auth: { token } })`. A missing token connects
// anonymously (read-only live feed); an *invalid* token disconnects the
// socket. Sending requires a verified user from the handshake JWT.
export function attachComments(io) {
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        socket.user = { id: payload.id, handle: payload.handle, role: payload.role }
      } catch {
        socket.disconnect(true)
        return
      }
    }

    let lastSentAt = 0

    socket.on('join', (riceId) => {
      if (typeof riceId === 'string' && /^[a-f0-9]{24}$/i.test(riceId)) {
        socket.join(`rice:${riceId}`)
      }
    })

    socket.on('leave', (riceId) => {
      socket.leave(`rice:${riceId}`)
    })

    socket.on('comment:send', async (payload, ack) => {
      const done = typeof ack === 'function' ? ack : () => {}

      if (!socket.user) {
        return done({ success: false, error: 'Authentication required' })
      }

      const now = Date.now()
      if (now - lastSentAt < SEND_INTERVAL_MS) {
        return done({ success: false, error: 'Slow down — one comment per second' })
      }
      lastSentAt = now

      const riceId = payload?.riceId
      const text = typeof payload?.text === 'string' ? payload.text.trim() : ''

      if (typeof riceId !== 'string' || !/^[a-f0-9]{24}$/i.test(riceId)) {
        return done({ success: false, error: 'Valid riceId required' })
      }
      if (!text || text.length > MAX_TEXT) {
        return done({ success: false, error: `text must be 1-${MAX_TEXT} characters` })
      }

      try {
        const rice = await Rice.findById(riceId).select('_id')
        if (!rice) {
          return done({ success: false, error: 'Rice not found' })
        }

        const comment = await Comment.create({
          rice: rice._id,
          authorId: socket.user.id,
          authorHandle: socket.user.handle,
          text,
        })

        // Render exactly one copy everywhere, including the sender (the
        // client dedupes its optimistic row against this broadcast).
        io.to(`rice:${riceId}`).emit('comment:new', comment)
        done({ success: true, data: comment })
      } catch {
        done({ success: false, error: 'Failed to save comment' })
      }
    })
  })
}
