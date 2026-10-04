import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    handle: {
      type: String,
      required: [true, 'Handle is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true },
)

// Never leak the hash to clients.
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    handle: this.handle,
    email: this.email,
    role: this.role,
  }
}

const User = mongoose.model('User', userSchema)

export default User
