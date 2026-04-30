const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  apiKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    index: true,
  },
  keyString: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
  statusCode: Number,
  ip: String,
  userAgent: String,
  responseTime: Number, // ms
  error: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Auto-delete logs older than 30 days
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Log', logSchema);
