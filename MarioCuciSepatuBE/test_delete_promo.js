const db = require('./src/config/db');

async function testDelete() {
  try {
    const [rows] = await db.execute('SELECT * FROM promos LIMIT 1');
    if (rows.length > 0) {
      console.log('Found promo:', rows[0].id);
      const [result] = await db.execute('DELETE FROM promos WHERE id=?', [rows[0].id]);
      console.log('Delete result:', result);
    } else {
      console.log('No promos to delete');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
testDelete();
