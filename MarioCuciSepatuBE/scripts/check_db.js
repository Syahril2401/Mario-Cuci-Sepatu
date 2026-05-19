const db = require('./src/config/db');
async function check() {
  try {
    const [tables] = await db.execute('SHOW TABLES');
    console.log("Tables:");
    console.log(tables);

    const [cols] = await db.execute('DESCRIBE orders');
    console.log("\nOrders columns:");
    console.log(cols.map(c => c.Field).join(', '));
  } catch(e) {
    console.log(e);
  }
  process.exit(0);
}
check();
