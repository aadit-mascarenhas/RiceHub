import { Router } from 'express'
import mongoose from 'mongoose'
import { body, query, matchedData } from 'express-validator'
import Rice from '../models/Rice.js'
import validate from '../middleware/validate.js'

const router = Router()

const DISTROS = ['Arch', 'Debian', 'Ubuntu', 'Fedora', 'NixOS', 'Other']
const SORTS = ['NEWEST', 'TRENDING', 'TOP_ALL_TIME']
const MAX_BATCH_IDS = 50
const HTTP_URL = /^https?:\/\/\S+$/

// --- sanitizer helpers -----------------------------------------------------

const clampInt = (value, { min, max, fallback }) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

const csvList = (value) =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

// --- validation chains -----------------------------------------------------

const listRules = [
  query('page')
    .optional()
    .customSanitizer((value) => clampInt(value, { min: 1, max: Number.MAX_SAFE_INTEGER, fallback: 1 })),
  query('limit')
    .optional()
    .customSanitizer((value) => clampInt(value, { min: 1, max: 50, fallback: 12 })),
  query('sort')
    .optional()
    .isIn(SORTS)
    .withMessage(`sort must be one of ${SORTS.join(', ')}`),
  query('search').optional().trim(),
  query('distro').optional().customSanitizer(csvList),
  query('wm').optional().customSanitizer(csvList),
  query('colorScheme').optional().customSanitizer(csvList),
]

const batchRules = [
  query('ids')
    .exists()
    .withMessage('ids parameter required')
    .bail()
    .customSanitizer((value) => (Array.isArray(value) ? value : String(value).split(',')))
    .customSanitizer((value) => value.filter(Boolean))
    .custom((value) => value.length > 0)
    .withMessage('ids parameter required')
    .custom((value) => value.length <= MAX_BATCH_IDS)
    .withMessage(`ids may contain at most ${MAX_BATCH_IDS} entries`)
    .custom((value) => value.every((id) => mongoose.isValidObjectId(id)))
    .withMessage('ids contains an invalid id'),
]

// Rice body rules shared by POST (required) and PUT (all optional).
// Only fields listed here survive into `matchedData()` — likes, views, status
// and createdAt sent by clients are stripped.
const riceRules = (required) => {
  const optionalUnlessRequired = (field) => (required ? field : field.optional())

  return [
    optionalUnlessRequired(body('title'))
      .trim()
      .notEmpty()
      .withMessage('title is required'),
    optionalUnlessRequired(body('wm'))
      .trim()
      .notEmpty()
      .withMessage('wm is required'),
    optionalUnlessRequired(body('distro'))
      .isIn(DISTROS)
      .withMessage(`distro must be one of ${DISTROS.join(', ')}`),
    optionalUnlessRequired(body('dotfilesUrl'))
      .trim()
      .matches(HTTP_URL)
      .withMessage('dotfilesUrl must be an http(s) url'),
    body('author')
      .optional()
      .trim()
      .isLength({ min: 1, max: 40 })
      .withMessage('author must be between 1 and 40 characters'),
    body('description').optional().trim(),
    body('bar').optional().trim(),
    body('launcher').optional().trim(),
    body('colorScheme').optional().trim(),
    body('terminal').optional().trim(),
    body('images')
      .optional()
      .isArray({ max: 10 })
      .withMessage('images must be a list of at most 10 urls'),
    body('images.*')
      .matches(HTTP_URL)
      .withMessage('each image must be an http(s) url'),
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('tags must be a list of at most 10 tags'),
    body('tags.*')
      .trim()
      .toUpperCase()
      .isLength({ max: 32 })
      .withMessage('each tag must be at most 32 characters'),
  ]
}

// --- routes ----------------------------------------------------------------

router.get('/', validate(listRules), async (req, res, next) => {
  try {
    const { search, distro, wm, colorScheme, sort, page = 1, limit = 12 } = req.query

    const filter = {}

    if (search) {
      filter.$text = { $search: search }
    }

    if (distro?.length) {
      filter.distro = { $in: distro }
    }

    if (wm?.length) {
      filter.wm = { $in: wm }
    }

    if (colorScheme?.length) {
      filter.colorScheme = { $in: colorScheme }
    }

    const skip = (page - 1) * limit

    let rices
    let total

    if (sort === 'TRENDING' || sort === 'TOP_ALL_TIME') {
      // Array length is not sortable in Mongo — compute likesCount first.
      const [result] = await Rice.aggregate([
        { $match: filter },
        { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
        {
          $sort:
            sort === 'TRENDING'
              ? { likesCount: -1, views: -1, createdAt: -1 }
              : { likesCount: -1, createdAt: -1 },
        },
        {
          $facet: {
            rices: [{ $skip: skip }, { $limit: limit }],
            count: [{ $count: 'total' }],
          },
        },
      ])
      rices = result.rices
      total = result.count[0]?.total ?? 0
    } else {
      ;[rices, total] = await Promise.all([
        Rice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Rice.countDocuments(filter),
      ])
    }

    res.json({
      success: true,
      data: {
        rices,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/batch', validate(batchRules), async (req, res, next) => {
  try {
    const rices = await Rice.find({ _id: { $in: req.query.ids } })
    res.json({ success: true, data: rices })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const rice = await Rice.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    )

    if (!rice) {
      return res.status(404).json({ success: false, error: 'Rice not found' })
    }

    res.json({ success: true, data: rice })
  } catch (err) {
    next(err)
  }
})

router.post('/', validate(riceRules(true)), async (req, res, next) => {
  try {
    const payload = matchedData(req, { locations: ['body'] })
    const rice = await Rice.create(payload)
    res.status(201).json({ success: true, data: rice })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', validate(riceRules(false)), async (req, res, next) => {
  try {
    const payload = matchedData(req, { locations: ['body'] })
    const rice = await Rice.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    })

    if (!rice) {
      return res.status(404).json({ success: false, error: 'Rice not found' })
    }

    res.json({ success: true, data: rice })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const rice = await Rice.findByIdAndDelete(req.params.id)

    if (!rice) {
      return res.status(404).json({ success: false, error: 'Rice not found' })
    }

    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
})

export default router
