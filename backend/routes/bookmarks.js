const express = require('express');
const router = express.Router();
const Bookmark = require('../models/Bookmark');
const { protect } = require('../middleware/auth');

// GET /api/bookmarks
router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    
    const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 });
    res.json({ bookmarks, total: bookmarks.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bookmarks
router.post('/', protect, async (req, res) => {
  try {
    const { type, itemId, title, authors, abstract, source, url, publishedDate, journal, status, phase, conditions, notes, tags } = req.body;

    const existing = await Bookmark.findOne({ user: req.user._id, itemId });
    if (existing) {
      return res.status(400).json({ error: 'Already bookmarked' });
    }

    const bookmark = await Bookmark.create({
      user: req.user._id,
      type, itemId, title, authors, abstract, source, url, publishedDate, journal, status, phase, conditions, notes, tags
    });

    res.status(201).json({ success: true, bookmark });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/bookmarks/:itemId
router.delete('/:itemId', protect, async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({ user: req.user._id, itemId: req.params.itemId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/bookmarks/:id/notes
router.put('/:id/notes', protect, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { notes: req.body.notes, tags: req.body.tags },
      { new: true }
    );
    res.json({ success: true, bookmark });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
