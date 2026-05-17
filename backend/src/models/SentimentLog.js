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

// High-speed compound indexes for sentiment history trends and manager filtering
sentimentLogSchema.index({ customerId: 1, analyzedAt: -1 });
sentimentLogSchema.index({ analyzedAt: -1 });

module.exports = mongoose.model('SentimentLog', sentimentLogSchema);