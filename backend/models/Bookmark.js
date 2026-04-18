const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['publication', 'trial', 'ai_response'],
    required: true
  },
  itemId: {
    type: String,
    required: true
  },
  title: { type: String, required: true },
  authors: [String],
  abstract: String,
  source: String,
  url: String,
  publishedDate: String,
  journal: String,
  status: String,
  phase: String,
  conditions: [String],
  notes: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookmarkSchema.index({ user: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
