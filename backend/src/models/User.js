const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'admin2', 'sales_manager'],
      required: [true, 'Role is required'],
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      widgetOrder: {
        type: [String],
        default: ['sentimentAlerts', 'customerList', 'churnRisk', 'trendGraph'],
      },
    },
    usageLog: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Auto-hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Method to compare entered password with hashed one
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);