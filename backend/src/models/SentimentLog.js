const mongoose = require('mongoose');

const sentimentLogSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    interactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
    },
    sentimentScore: {
      type: Number,
      required: true,
    },
    sentimentLabel: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true,
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model('SentimentLog', sentimentLogSchema);