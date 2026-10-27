const fs = require('fs');
const path = require('path');
const pool = require('./db');

const USER_ID = 2;

async function importWords() {
  const filePath = path.join(__dirname, 'words.json');
  const words = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const client = await pool.connect();

  let imported = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    for (const item of words) {
      const result = await client.query(
        `INSERT INTO words (word, translation, learned, it, user_id)
   SELECT $1::varchar, $2::varchar, $3::boolean, $4::boolean, $5::integer
   WHERE NOT EXISTS (
     SELECT 1
     FROM words
     WHERE user_id = $5::integer
       AND word = $1::varchar
       AND translation = $2::varchar
   )
   RETURNING id`,
        [
          item.word.trim(),
          item.translation.trim(),
          item.learned ?? false,
          item.it ?? false,
          USER_ID,
        ]
      );

      if (result.rowCount > 0) {
        imported++;
      } else {
        skipped++;
      }
    }

    await client.query('COMMIT');

    console.log('Import completed!');
    console.log(`Total in file: ${words.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped (already exist): ${skipped}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import failed. Changes rolled back:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

importWords();
