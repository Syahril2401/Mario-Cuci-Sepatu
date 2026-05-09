const db = require('./src/config/db');
async function check() {
  const [rows] = await db.execute('SELECT order_id FROM orders');
  console.log(rows);
  process.exit(0);
}
check();
