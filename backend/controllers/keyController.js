const { validationResult } = require('express-validator');
const ApiKey = require('../models/ApiKey');
const Log = require('../models/Log');
const TIERS = require('../config/tiers');
const crypto = require('crypto');

// @desc    Get all API keys for user
// @route   GET /api/keys
const getKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ owner: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: keys.length, data: keys });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Generate new API key
// @route   POST /api/keys
const generateKey = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, expiresInDays, ipWhitelist } = req.body;
    const userTier = req.user.tier;
    const tierConfig = TIERS[userTier];

    // Check max keys
    const existingCount = await ApiKey.countDocuments({
      owner: req.user._id,
      status: { $ne: 'revoked' },
    });

    if (existingCount >= tierConfig.maxKeys) {
      return res.status(403).json({
        success: false,
        message: `${tierConfig.name} tier allows max ${tierConfig.maxKeys} active API keys`,
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 30));

    const apiKey = await ApiKey.create({
      name,
      owner: req.user._id,
      tier: userTier,
      requestLimit: tierConfig.requestLimit,
      expiresAt,
      ipWhitelist: ipWhitelist ? ipWhitelist.split(',').map((ip) => ip.trim()) : [],
    });

    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: apiKey,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Regenerate (rotate) API key
// @route   PUT /api/keys/:id/regenerate
const regenerateKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({ _id: req.params.id, owner: req.user._id });
    if (!apiKey) return res.status(404).json({ success: false, message: 'API key not found' });

    apiKey.key = 'azp_' + crypto.randomBytes(32).toString('hex');
    apiKey.usageCount = 0;
    await apiKey.save();

    res.json({ success: true, message: 'API key rotated successfully', data: apiKey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Revoke API key
// @route   PUT /api/keys/:id/revoke
const revokeKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status: 'revoked' },
      { new: true }
    );
    if (!apiKey) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, message: 'API key revoked', data: apiKey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete API key
// @route   DELETE /api/keys/:id
const deleteKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!apiKey) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, message: 'API key deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update API key (name, ipWhitelist)
// @route   PUT /api/keys/:id
const updateKey = async (req, res) => {
  try {
    const { name, ipWhitelist } = req.body;
    const update = {};
    if (name) update.name = name;
    if (ipWhitelist !== undefined) {
      update.ipWhitelist = ipWhitelist ? ipWhitelist.split(',').map((ip) => ip.trim()) : [];
    }

    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      update,
      { new: true }
    );
    if (!apiKey) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, message: 'API key updated', data: apiKey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get usage stats for user
// @route   GET /api/keys/stats
const getStats = async (req, res) => {
  try {
    const keys = await ApiKey.find({ owner: req.user._id });
    const totalUsage = keys.reduce((sum, k) => sum + k.usageCount, 0);
    const totalLimit = keys.reduce((sum, k) => sum + k.requestLimit, 0);
    const activeKeys = keys.filter((k) => k.status === 'active').length;

    // Usage over last 7 days from logs
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logs = await Log.aggregate([
      { $match: { owner: req.user._id, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsage,
        totalLimit,
        activeKeys,
        totalKeys: keys.length,
        usageChart: logs,
        tier: req.user.tier,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get logs for user
// @route   GET /api/keys/logs
const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await Log.find({ owner: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Log.countDocuments({ owner: req.user._id });

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getKeys, generateKey, regenerateKey, revokeKey, deleteKey, updateKey, getStats, getLogs };
