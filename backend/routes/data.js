const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../middleware/apiKeyMiddleware');

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Example protected endpoint
 *     tags: [Protected API]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Your AZPKEY API key
 *     responses:
 *       200:
 *         description: Protected data returned successfully
 *       401:
 *         description: Missing or invalid API key
 *       403:
 *         description: Key revoked, expired, or IP blocked
 *       429:
 *         description: Rate limit or request limit exceeded
 */
router.get('/', validateApiKey, (req, res) => {
  res.json({
    success: true,
    message: 'Access granted',
    data: {
      timestamp: new Date().toISOString(),
      keyOwner: req.apiKey.owner.username,
      tier: req.apiKey.tier,
      remaining: req.apiKey.remaining,
      usageCount: req.apiKey.usageCount,
      requestLimit: req.apiKey.requestLimit,
      sample: {
        users: 1500,
        activeToday: 342,
        revenue: '$48,210',
        growth: '+12.4%',
      },
    },
  });
});

/**
 * @swagger
 * /api/data/ping:
 *   get:
 *     summary: Quick ping to verify API key works
 *     tags: [Protected API]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/ping', validateApiKey, (req, res) => {
  res.json({
    success: true,
    pong: true,
    latency: '< 1ms',
    keyValid: true,
    tier: req.apiKey.tier,
  });
});

module.exports = router;
