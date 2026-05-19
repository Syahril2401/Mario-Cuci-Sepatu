const db = require('./src/config/db');

async function fix() {
  try {
    console.log("Clearing corrupted images...");
    await db.execute("UPDATE services SET image = NULL");
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
fix();
