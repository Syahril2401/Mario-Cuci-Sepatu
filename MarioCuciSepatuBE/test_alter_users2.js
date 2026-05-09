const db = require('./src/config/db');

async function alterUsersAgain() {
  try {
    console.log("Adding profileImage to users table...");
    await db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS profileImage LONGTEXT");
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
alterUsersAgain();
