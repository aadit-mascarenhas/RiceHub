import { Router } from 'express'
import { body, param, query, matchedData } from 'express-validator'
import Rice from '../models/Rice.js'
import User from '../models/User.js'
import Comment from '../models/Comment.js'
import validate from '../middleware/validate.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'

const router = Router()

const RICE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']
const ROLES = ['user', 'admin']
const DEFAULT_RICE_LIMIT = 25
const DEFAULT_COMMENT_LIMIT = 50
const MAX_LIMIT = 100

// Deliberately duplicated from routes/rices.js: this router is additive and
// extracting a shared util would mean editing a verified file for no
// behavioural gain.
const clampInt = (value, { min, max, fallback }) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

const pageLimit = (fallback) => [
  query('page')
    .optional()
    .customSanitizer((value) => clampInt(value, { min: 1, max: Number.MAX_SAFE_INTEGER, fallback: 1 })),
  query('limit')
    .optional()
    .customSanitizer((value) => clampInt(value, { min: 1, max: MAX_LIMIT, fallback })),
]

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// One guard for the whole router — no admin route can ship unauthenticated or
// unguarded by role. authMiddleware answers 401 first; requireAdmin answers 403.
router.use(authMiddleware, requireAdmin)

// --- validation chains -----------------------------------------------------

// `ALL` is an admin-only sentinel for "every status" — the public rices router
// keeps treating a missing status as APPROVED only.
const RICE_STATUS_FILTERS = [...RICE_STATUSES, 'ALL']

const riceListRules = [
  query('status')
    .optional()
    .isIn(RICE_STATUS_FILTERS)
    .withMessage(`status must be one of ${RICE_STATUS_FILTERS.join(', ')}`),
  query('search').optional().trim(),
  ...pageLimit(DEFAULT_RICE_LIMIT),
]

const riceStatusRules = [
  param('id').isMongoId().withMessage('invalid rice id'),
  body('status')
    .isIn(RICE_STATUSES)
    .withMessage(`status must be one of ${RICE_STATUSES.join(', ')}`),
]

const userListRules = [
  query('search').optional().trim(),
  query('role')
    .optional()
    .isIn(ROLES)
    .withMessage(`role must be one of ${ROLES.join(', ')}`),
  ...pageLimit(MAX_LIMIT),
]

const userRoleRules = [
  param('id').isMongoId().withMessage('invalid user id'),
  body('role')
    .isIn(ROLES)
    .withMessage(`role must be one of ${ROLES.join(', ')}`),
]

const commentListRules = [
  query('riceId')
    .optional()
    .isMongoId()
    .withMessage('riceId must be a valid rice id'),
  ...pageLimit(DEFAULT_COMMENT_LIMIT),
]

const commentIdRules = [param('id').isMongoId().withMessage('invalid comment id')]

// --- routes ----------------------------------------------------------------

// Counts that back the admin stat row.
router.get('/stats', async (_req, res, next) => {
  try {
    const [total, pending, approved, rejected, users, admins, comments] = await Promise.all([
      Rice.countDocuments({}),
      Rice.countDocuments({ status: 'PENDING' }),
      Rice.countDocuments({ status: 'APPROVED' }),
      Rice.countDocuments({ status: 'REJECTED' }),
      User.countDocuments({}),
      User.countDocuments({ role: 'admin' }),
      Comment.countDocuments({}),
    ])

    res.json({
      success: true,
      data: {
        rices: { total, pending, approved, rejected },
        users: { total: users, admins },
        comments: { total: comments },
      },
    })
  } catch (err) {
    next(err)
  }
})

// Moderation queue. Defaults to PENDING so the admin's landing view is the work
// waiting on them; `?status=ALL` widens it to every status.
router.get('/rices', validate(riceListRules), async (req, res, next) => {
  try {
    const { search, page = 1, limit = DEFAULT_RICE_LIMIT } = req.query
    const status = req.query.status || 'PENDING'

    const filter = status === 'ALL' ? {} : { status }
    if (search) filter.$text = { $search: search }

    const skip = (page - 1) * limit
    const [rices, total] = await Promise.all([
      Rice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Rice.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: { rices, total, page, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
})

// The only route that writes `status` — POST/PUT /api/rices strip it from the
// client body on purpose (see routes/rices.js).
router.patch('/rices/:id/status', validate(riceStatusRules), async (req, res, next) => {
  try {
    const { status } = matchedData(req, { locations: ['body'] })
    const rice = await Rice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    )

    if (!rice) {
      return res.status(404).json({ success: false, error: 'Rice not found' })
    }

    res.json({ success: true, data: rice })
  } catch (err) {
    next(err)
  }
})

// toSafeJSON() omits passwordHash — this response must never contain one.
router.get('/users', validate(userListRules), async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = MAX_LIMIT } = req.query

    const filter = {}
    if (role) filter.role = role
    if (search) {
      const pattern = escapeRegExp(search)
      filter.$or = [{ handle: { $regex: pattern, $options: 'i' } }, { email: { $regex: pattern, $options: 'i' } }]
    }

    const skip = (page - 1) * limit
    const [docs, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: {
        // createdAt rides along for the admin table; toSafeJSON() alone has no
        // timestamps and never includes passwordHash.
        users: docs.map((user) => ({ ...user.toSafeJSON(), createdAt: user.createdAt })),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
})

// Promote/demote. The self-demotion guard is the one that actually fires;
// the last-admin check is defence in depth, since requireAdmin upstream means
// the only admin is by definition you (already blocked by the guard above).
router.patch('/users/:id/role', validate(userRoleRules), async (req, res, next) => {
  try {
    const { role } = matchedData(req, { locations: ['body'] })
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    if (user.role === role) {
      return res.json({ success: true, data: user.toSafeJSON() })
    }

    const isSelf = String(user._id) === String(req.user.id)

    if (isSelf && role !== 'admin') {
      return res.status(400).json({ success: false, error: 'You cannot demote your own account' })
    }

    if (user.role === 'admin' && role === 'user') {
      const otherAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: user._id } })
      if (otherAdmins === 0) {
        return res.status(400).json({ success: false, error: 'Cannot demote the last admin' })
      }
    }

    user.role = role
    await user.save()

    res.json({ success: true, data: user.toSafeJSON() })
  } catch (err) {
    next(err)
  }
})

router.get('/comments', validate(commentListRules), async (req, res, next) => {
  try {
    const { riceId, limit = DEFAULT_COMMENT_LIMIT } = req.query
    const filter = riceId ? { rice: riceId } : {}

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('rice', 'title'),
      Comment.countDocuments(filter),
    ])

    res.json({ success: true, data: { comments, total } })
  } catch (err) {
    next(err)
  }
})

router.delete('/comments/:id', validate(commentIdRules), async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id)

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' })
    }

    // Drop it from live rice rooms too — open comment panels would otherwise
    // keep rendering a deleted comment until they refresh.
    req.app.get('io')?.to(`rice:${comment.rice}`).emit('comment:delete', {
      commentId: comment._id,
      riceId: comment.rice,
    })

    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
})

export default router
