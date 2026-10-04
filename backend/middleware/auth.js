import jwt from 'jsonwebtoken'

// Verifies `Authorization: Bearer <jwt>` and attaches { id, handle, role }.
// Missing/invalid/expired tokens → 401 envelope (JWT errors also mapped in
// errorHandler for tokens verified elsewhere).
export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.id, handle: payload.handle, role: payload.role }
    next()
  } catch (err) {
    next(err)
  }
}

// Loads the rice for :id routes and enforces ownership before the handler
// runs. Admins may modify any rice; everyone else must match `rice.author`.
// Attaches the loaded document as `req.rice` so handlers skip a second fetch.
export const requireOwnerOrAdmin = (loadRice) => async (req, res, next) => {
  try {
    const rice = await loadRice(req)

    if (!rice) {
      return res.status(404).json({ success: false, error: 'Rice not found' })
    }

    if (req.user.role === 'admin' || rice.author === req.user.handle) {
      req.rice = rice
      return next()
    }

    res.status(403).json({ success: false, error: 'You do not own this rice' })
  } catch (err) {
    next(err)
  }
}
