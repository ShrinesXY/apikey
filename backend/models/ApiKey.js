const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Key name is required'],
    trim: true,
    maxlength: 50,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tier: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free',
  },
  requestLimit: {
    type: Number,
    required: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active',
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
  ipWhitelist: {
    type: [String],
    default: [],
  },
  lastUsed: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate unique API key before saving
apiKeySchema.pre('save', function (next) {
  if (!this.key) {
    this.key = 'azp_' + crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Virtual: usage percentage
apiKeySchema.virtual('usagePercent').get(function () {
  return Math.round((this.usageCount / this.requestLimit) * 100);
});

// Virtual: remaining requests
apiKeySchema.virtual('remaining').get(function () {
  return Math.max(0, this.requestLimit - this.usageCount);
});

// Check if key is valid
apiKeySchema.methods.isValid = function () {
  if (this.status !== 'active') return false;
  if (new Date() > this.expiresAt) return false;
  if (this.usageCount >= this.requestLimit) return false;
  return true;
};

apiKeySchema.set('toJSON', { virtuals: true });
apiKeySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ApiKey', apiKeySchema);
