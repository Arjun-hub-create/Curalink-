const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// GET /api/users/history
router.get('/history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('searchHistory');
    res.json({ history: user.searchHistory.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/history
router.delete('/history', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { searchHistory: [] });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
