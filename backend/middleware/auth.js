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

// Populates `req.user` when a valid Bearer header is present but never
// rejects — used on public routes (rice list/detail) so an admin or the owner
// can be granted wider visibility while anonymous traffic is unaffected.
// An absent or invalid token simply leaves `req.user` undefined.
export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      req.user = { id: payload.id, handle: payload.handle, role: payload.role }
    } catch {
      // Stay anonymous — a bad token is not an error on a public route.
    }
  }

  next()
}

// Admin gate. Always chain after `authMiddleware`, which has already turned a
// missing/invalid token into 401 — this only distinguishes roles.
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' })
  }
  next()
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
