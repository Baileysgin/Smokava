const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['delete_post', 'hide_post', 'unhide_post', 'delete_comment', 'hide_comment', 'unhide_comment']
  },
  targetType: {
    type: String,
    required: true,
    enum: ['post', 'comment']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ModerationLog', moderationLogSchema);

