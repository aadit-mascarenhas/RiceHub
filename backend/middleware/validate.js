import { validationResult } from 'express-validator'

const validate = (rules = []) => async (req, res, next) => {
  await Promise.all(rules.map((rule) => rule.run(req)))

  const errors = validationResult(req)
  if (errors.isEmpty()) return next()

  const message = errors
    .array()
    .map((error) => error.msg)
    .join(', ')

  res.status(400).json({ success: false, error: message })
}

export default validate
