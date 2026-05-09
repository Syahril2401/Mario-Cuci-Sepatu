const db = require('./src/config/db');

async function addColumns() {
  try {
    console.log("Adding columns to orders table...");
    
    const queries = [
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS photos LONGTEXT",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS originalPrice DECIMAL(12,2)",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discountAmount DECIMAL(12,2)",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS promoName VARCHAR(100)"
    ];

    for (let q of queries) {
      try {
        await db.execute(q);
        console.log("Executed:", q);
      } catch (e) {
        console.log("Error on query:", e.message);
      }
    }

    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
addColumns();
