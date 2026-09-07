import { Router } from 'express'
import Rice from '../models/Rice.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { search, distro, wm, colorScheme, sort, page = 1, limit = 12 } = req.query

    const filter = {}

    if (search) {
      filter.$text = { $search: search }
    }

    if (distro) {
      filter.distro = { $in: distro.split(',') }
    }

    if (wm) {
      filter.wm = { $in: wm.split(',') }
    }

    if (colorScheme) {
      filter.colorScheme = { $in: colorScheme.split(',') }
    }

    let sortObj = { createdAt: -1 }
    if (sort === 'TRENDING') {
      sortObj = { 'likes.length': -1, views: -1 }
    } else if (sort === 'TOP_ALL_TIME') {
      sortObj = { 'likes.length': -1 }
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [rices, total] = await Promise.all([
      Rice.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Rice.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: {
        rices,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/batch', async (req, res, next) => {
  try {
    const { ids } = req.query
    if (!ids) {
      return res.status(400).json({ success: false, error: 'ids parameter required' })
    }

    const idArray = ids.split(',').filter(Boolean)
    const rices = await Rice.find({ _id: { $in: idArray } })

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

router.post('/', async (req, res, next) => {
  try {
    const rice = await Rice.create(req.body)
    res.status(201).json({ success: true, data: rice })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const rice = await Rice.findByIdAndUpdate(req.params.id, req.body, {
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
