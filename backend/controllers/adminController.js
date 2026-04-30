const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const Log = require('../models/Log');
const TIERS = require('../config/tiers');

// @desc    Get all users
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find().sort('-createdAt').skip(skip).limit(limit);
    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Ban / unban user
// @route   PUT /api/admin/users/:id/ban
const banUser = async (req, res) => {
  try {
    const { ban, reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: ban, banReason: reason || '' },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      message: ban ? `User ${user.username} banned` : `User ${user.username} unbanned`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Change user tier
// @route   PUT /api/admin/users/:id/tier
const setUserTier = async (req, res) => {
  try {
    const { tier } = req.body;
    if (!TIERS[tier]) {
      return res.status(400).json({ success: false, message: 'Invalid tier' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { tier }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `Tier updated to ${tier}`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all API keys
// @route   GET /api/admin/keys
const getAllKeys = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const keys = await ApiKey.find()
      .populate('owner', 'username email tier')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await ApiKey.countDocuments();

    res.json({
      success: true,
      data: keys,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Admin dashboard stats
// @route   GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalKeys = await ApiKey.countDocuments();
    const activeKeys = await ApiKey.countDocuments({ status: 'active' });
    const totalRequests = await Log.countDocuments();

    const tierBreakdown = await User.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 } } },
    ]);

    const recentLogs = await Log.find().sort('-createdAt').limit(10);

    res.json({
      success: true,
      data: {
        totalUsers,
        bannedUsers,
        totalKeys,
        activeKeys,
        totalRequests,
        tierBreakdown,
        recentLogs,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update key limit (admin override)
// @route   PUT /api/admin/keys/:id
const updateKeyAdmin = async (req, res) => {
  try {
    const { requestLimit, status, tier } = req.body;
    const update = {};
    if (requestLimit) update.requestLimit = requestLimit;
    if (status) update.status = status;
    if (tier) update.tier = tier;

    const apiKey = await ApiKey.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!apiKey) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, message: 'API key updated', data: apiKey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, banUser, setUserTier, getAllKeys, getAdminStats, updateKeyAdmin };
