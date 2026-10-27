const {
  getAllWords,
  createWord,
  deleteWord,
  updateWord,
} = require('../controllers/wordsController');
const requireAuth = require('../middleware/requireAuth');
const express = require('express');
const router = express.Router();

const pool = require('../db');

// GET /api/words — получить все слова   ...................................................................
router.get('/', requireAuth, getAllWords);
// POST /api/words — создать слово  ...................................................................
router.post('/', requireAuth, createWord);
// PUT /api/words/:id — обновить слово  ...................................................................
router.put('/:id', requireAuth, updateWord);
// DELETE /api/words/:id — удалить слово  ...................................................................
router.delete('/:id', requireAuth, deleteWord);

module.exports = router;
