const notFound = (_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
}

export default notFound
