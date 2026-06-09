const db = require('./src/config/db');

async function alterTable() {
  try {
    await db.query('ALTER TABLE services MODIFY COLUMN image LONGTEXT');
    console.log('Successfully altered services table');
  } catch (error) {
    console.error('Error altering table:', error);
  } finally {
    process.exit();
  }
}

alterTable();
