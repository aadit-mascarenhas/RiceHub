import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    rice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rice',
      required: [true, 'Rice is required'],
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Denormalized so the live feed can render without a join/populate.
    authorHandle: {
      type: String,
      required: [true, 'Author handle is required'],
    },
    text: {
      type: String,
      required: [true, 'Text is required'],
      trim: true,
      maxlength: [500, 'Text must be at most 500 characters'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

commentSchema.index({ rice: 1, createdAt: -1 })

const Comment = mongoose.model('Comment', commentSchema)

export default Comment
