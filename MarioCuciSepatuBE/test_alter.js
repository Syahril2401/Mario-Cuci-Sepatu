const db = require('./src/config/db');

async function alterTable() {
  try {
    console.log("Altering orders table...");
    
    // Add missing columns if they don't exist
    const queries = [
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING'",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_id INT",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickupMethod VARCHAR(50)",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS returnMethod VARCHAR(50)",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_overflow_order BOOLEAN DEFAULT FALSE",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_shifted BOOLEAN DEFAULT FALSE",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING'"
    ];

    for (let q of queries) {
      try {
        await db.execute(q);
        console.log("Executed:", q);
      } catch (e) {
        console.log("Error on query (might already exist):", e.message);
      }
    }

    // Since adminController used total_price, we can add it or just modify adminController
    // I will change totalPrice to total_price to match the backend controllers.
    try {
      await db.execute("ALTER TABLE orders CHANGE totalPrice total_price DECIMAL(12,2) DEFAULT 0.00");
    } catch (e) {
      console.log("Could not rename totalPrice (might already be total_price):", e.message);
    }
    
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
alterTable();
