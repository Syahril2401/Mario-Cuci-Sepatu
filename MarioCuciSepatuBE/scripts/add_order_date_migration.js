const db = require('../src/config/db');

async function run() {
  try {
    console.log("Checking and adding order_date column to orders table...");
    await db.execute("ALTER TABLE orders ADD COLUMN order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    console.log("Column order_date successfully added.");
  } catch (err) {
    if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column order_date already exists. No action needed.");
    } else {
      console.error("Migration failed:", err);
      process.exit(1);
    }
  } finally {
    process.exit(0);
  }
}

run();
