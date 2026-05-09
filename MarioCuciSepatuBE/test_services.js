const db = require('./src/config/db');

async function test() {
  try {
    const [rows] = await db.execute('SELECT service_id, serviceName, image FROM services');
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();
