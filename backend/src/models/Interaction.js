const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note'],
      required: [true, 'Interaction type is required'],
    },
    content: {
      type: String,
      required: [true, 'Interaction content is required'],
      trim: true,
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
      default: null,
    },
    sentimentLabel: {
      type: String,
      enum: ['positive', 'neutral', 'negative', null],
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
  },
  { timestamps: true }
);

// High-speed compound index for chronologically sorted customer timelines
interactionSchema.index({ customerId: 1, date: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);