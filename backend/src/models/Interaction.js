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
    externalMessageId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    emailSubject: {
      type: String,
      trim: true,
    },
    emailFrom: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interaction', interactionSchema);