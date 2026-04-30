const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getKeys,
  generateKey,
  regenerateKey,
  revokeKey,
  deleteKey,
  updateKey,
  getStats,
  getLogs,
} = require('../controllers/keyController');

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/keys:
 *   get:
 *     summary: Get all API keys for current user
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.get('/', getKeys);

/**
 * @swagger
 * /api/keys:
 *   post:
 *     summary: Generate a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Production Key
 *               expiresInDays:
 *                 type: number
 *                 example: 30
 *               ipWhitelist:
 *                 type: string
 *                 example: "192.168.1.1, 10.0.0.1"
 *     responses:
 *       201:
 *         description: API key generated
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().isLength({ max: 50 }),
    body('expiresInDays').optional().isInt({ min: 1, max: 365 }),
  ],
  generateKey
);

router.get('/stats', getStats);
router.get('/logs', getLogs);

router.put('/:id', updateKey);
router.put('/:id/regenerate', regenerateKey);
router.put('/:id/revoke', revokeKey);
router.delete('/:id', deleteKey);

module.exports = router;
