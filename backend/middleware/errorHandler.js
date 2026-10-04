const errorHandler = (err, req, res, _next) => {
  console.error(err.stack)

  // Malformed JSON body (body-parser SyntaxError) — client error, not a crash.
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' })
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ success: false, error: messages.join(', ') })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' })
  }

  const status = err.statusCode || err.status || 500

  // Never expose stacks or internal messages for server-side failures.
  if (status >= 500) {
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }

  res.status(status).json({
    success: false,
    error: err.message || 'Request failed',
  })
}

export default errorHandler
