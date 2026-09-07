import mongoose from 'mongoose'

const riceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
  },
  images: {
    type: [String],
    default: [],
  },
  distro: {
    type: String,
    required: [true, 'Distro is required'],
    enum: ['Arch', 'Debian', 'Ubuntu', 'Fedora', 'NixOS', 'Other'],
  },
  wm: {
    type: String,
    required: [true, 'Window manager is required'],
    trim: true,
  },
  bar: {
    type: String,
    default: '',
  },
  launcher: {
    type: String,
    default: '',
  },
  colorScheme: {
    type: String,
    default: '',
  },
  terminal: {
    type: String,
    default: '',
  },
  dotfilesUrl: {
    type: String,
    required: [true, 'Dotfiles URL is required'],
  },
  tags: {
    type: [String],
    default: [],
  },
  likes: {
    type: [String],
    default: [],
  },
  views: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
})

riceSchema.index({ title: 'text', tags: 'text' })
riceSchema.index({ distro: 1, wm: 1, colorScheme: 1 })
riceSchema.index({ createdAt: -1 })

riceSchema.pre('validate', function normalizeTags(next) {
  if (Array.isArray(this.tags)) {
    this.tags = this.tags.map((t) => t.trim().toUpperCase())
  }
  next()
})

const Rice = mongoose.model('Rice', riceSchema)

export default Rice
