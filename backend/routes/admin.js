const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getUsers,
  banUser,
  setUserTier,
  getAllKeys,
  getAdminStats,
  updateKeyAdmin,
} = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/tier', setUserTier);
router.get('/keys', getAllKeys);
router.put('/keys/:id', updateKeyAdmin);

module.exports = router;
