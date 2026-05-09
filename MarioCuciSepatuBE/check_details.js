const db = require('./src/config/db');
async function check() {
  const [cols] = await db.execute('DESCRIBE order_details');
  console.log("Order Details columns:");
  console.log(cols.map(c => c.Field).join(', '));
  process.exit(0);
}
check();
