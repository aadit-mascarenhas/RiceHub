import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body } from 'express-validator'
import User from '../models/User.js'
import validate from '../middleware/validate.js'

const router = Router()

const SALT_ROUNDS = 10

const normalizeHandle = (value) =>
  String(value)
    .trim()
    .replace(/^@/, '')
    .toLowerCase()

const signToken = (user) =>
  jwt.sign(
    { id: user._id, handle: user.handle, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )

const registerRules = [
  body('handle')
    .trim()
    .customSanitizer(normalizeHandle)
    .matches(/^[a-z0-9_]{3,30}$/)
    .withMessage('handle must be 3-30 chars: letters, numbers, underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('email must be valid')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('password must be between 8 and 100 characters'),
]

const loginRules = [
  body('identifier').trim().notEmpty().withMessage('identifier is required'),
  body('password').notEmpty().withMessage('password is required'),
]

// POST /api/auth/register { handle, email, password } → { token, user }
router.post('/register', validate(registerRules), async (req, res, next) => {
  try {
    const { handle, email, password } = req.body
    const storedHandle = `@${normalizeHandle(handle)}`

    const existing = await User.findOne({
      $or: [{ handle: storedHandle }, { email }],
    })
    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: 'handle or email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({
      handle: storedHandle,
      email,
      passwordHash,
    })

    res.status(201).json({
      success: true,
      data: { token: signToken(user), user: user.toSafeJSON() },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login { identifier, password } → { token, user }
// identifier = handle (with or without @) or email; failures never reveal
// which field was wrong.
router.post('/login', validate(loginRules), async (req, res, next) => {
  try {
    const { identifier, password } = req.body
    const idLower = identifier.toLowerCase()
    const handleCandidate = idLower.startsWith('@') ? idLower : `@${idLower}`

    const user = await User.findOne({
      $or: [{ handle: handleCandidate }, { email: idLower }],
    })

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    res.json({
      success: true,
      data: { token: signToken(user), user: user.toSafeJSON() },
    })
  } catch (err) {
    next(err)
  }
})

export default router
