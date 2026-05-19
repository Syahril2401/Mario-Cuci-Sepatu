const db = require('./src/config/db');

async function alterUsers() {
  try {
    console.log("Adding phone to users table...");
    await db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)");
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
alterUsers();
