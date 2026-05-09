const db = require('./src/config/db');

async function alterImageColumn() {
  try {
    console.log("Altering image column in services table...");
    await db.execute("ALTER TABLE services MODIFY COLUMN image LONGTEXT");
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
alterImageColumn();
