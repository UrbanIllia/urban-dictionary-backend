const pool = require('../db');
// GET /api/words — get all words .................................................................
const getAllWords = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM words WHERE user_id = $1 ORDER BY id',
      [req.session.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching words:', error);

    res.status(500).json({
      message: 'Failed to fetch words',
    });
  }
};

// POST /api/words — post word .................................................................
const createWord = async (req, res) => {
  const { word, translation, learned, it } = req.body;

  if (
    typeof word !== 'string' ||
    typeof translation !== 'string' ||
    !word.trim() ||
    !translation.trim() ||
    (learned !== undefined && typeof learned !== 'boolean') ||
    (it !== undefined && typeof it !== 'boolean')
  ) {
    return res.status(400).json({
      message: 'Invalid word data',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO words (word, translation, learned, it, user_id)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING *`,
      [
        word.trim(),
        translation.trim(),
        learned ?? false,
        it ?? false,
        req.session.userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating word:', error);

    res.status(500).json({
      message: 'Failed to create word',
    });
  }
};

// PUT /api/words/:id — edit word by id.................................................................
const updateWord = async (req, res) => {
  const id = Number(req.params.id);
  const { word, translation, learned, it } = req.body;

  // Проверяем ID
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'Invalid word id',
    });
  }

  // Проверяем данные
  if (
    typeof word !== 'string' ||
    typeof translation !== 'string' ||
    !word.trim() ||
    !translation.trim() ||
    typeof learned !== 'boolean' ||
    typeof it !== 'boolean'
  ) {
    return res.status(400).json({
      message: 'Invalid word data',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE words
   SET word = $1, translation = $2, learned = $3, it = $4
   WHERE id = $5 AND user_id = $6
   RETURNING *`,
      [word.trim(), translation.trim(), learned, it, id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Word not found',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating word:', error);

    res.status(500).json({
      message: 'Failed to update word',
    });
  }
};

// DELETE /api/words/:id — delete word by id.................................................................
const deleteWord = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'Invalid word id',
    });
  }

  try {
    const result = await pool.query(
      'DELETE FROM words WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Word not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting word:', error);

    res.status(500).json({
      message: 'Failed to delete word',
    });
  }
};

module.exports = {
  getAllWords,
  createWord,
  updateWord,
  deleteWord,
};
