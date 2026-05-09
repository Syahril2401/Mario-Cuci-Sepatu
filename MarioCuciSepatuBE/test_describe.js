const db = require('./src/config/db');

async function describe() {
  try {
    const [rows] = await db.execute('DESCRIBE orders');
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
describe();
