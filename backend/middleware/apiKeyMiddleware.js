const ApiKey = require('../models/ApiKey');
const Log = require('../models/Log');
const rateLimit = require('express-rate-limit');

// Per-key rate limiting storage (in-memory, use Redis in production)
const keyRateLimitMap = new Map();

const validateApiKey = async (req, res, next) => {
  const startTime = Date.now();
  const key = req.headers['x-api-key'];

  if (!key) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      hint: 'Include your API key in the x-api-key header',
    });
  }

  try {
    const apiKey = await ApiKey.findOne({ key }).populate('owner', 'username email isBanned');

    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'Invalid API key' });
    }

    if (!apiKey.owner || apiKey.owner.isBanned) {
      return res.status(403).json({ success: false, error: 'Account is banned' });
    }

    if (apiKey.status === 'revoked') {
      return res.status(403).json({ success: false, error: 'API key has been revoked' });
    }

    if (new Date() > apiKey.expiresAt) {
      apiKey.status = 'expired';
      await apiKey.save();
      return res.status(403).json({ success: false, error: 'API key has expired' });
    }

    if (apiKey.usageCount >= apiKey.requestLimit) {
      return res.status(429).json({
        success: false,
        error: 'Request limit exceeded',
        limit: apiKey.requestLimit,
        used: apiKey.usageCount,
        hint: 'Upgrade your tier or contact support',
      });
    }

    // IP whitelist check
    if (apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      const normalizedIP = clientIP.replace('::ffff:', '');
      if (!apiKey.ipWhitelist.includes(normalizedIP)) {
        return res.status(403).json({
          success: false,
          error: 'IP address not whitelisted',
          ip: normalizedIP,
        });
      }
    }

    // Per-key rate limiting
    const TIERS = require('../config/tiers');
    const tierConfig = TIERS[apiKey.tier] || TIERS.free;
    const now = Date.now();
    const windowMs = 1000; // 1 second

    if (!keyRateLimitMap.has(key)) {
      keyRateLimitMap.set(key, { count: 0, windowStart: now });
    }

    const keyLimit = keyRateLimitMap.get(key);
    if (now - keyLimit.windowStart > windowMs) {
      keyLimit.count = 0;
      keyLimit.windowStart = now;
    }

    keyLimit.count++;
    if (keyLimit.count > tierConfig.rateLimit) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        limit: `${tierConfig.rateLimit} requests/second`,
        retryAfter: Math.ceil((keyLimit.windowStart + windowMs - now) / 1000),
      });
    }

    // Increment usage
    apiKey.usageCount += 1;
    apiKey.lastUsed = new Date();
    await apiKey.save();

    // Attach to request
    req.apiKey = apiKey;

    // Log after response
    res.on('finish', async () => {
      try {
        await Log.create({
          apiKey: apiKey._id,
          keyString: key.substring(0, 12) + '...',
          owner: apiKey.owner._id,
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          responseTime: Date.now() - startTime,
        });
      } catch (e) { /* silent */ }
    });

    next();
  } catch (err) {
    console.error('API Key validation error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Global rate limiter
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints rate limiter
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many auth attempts, please try again later' },
});

module.exports = { validateApiKey, globalRateLimit, authRateLimit };
