const db = require('./src/config/db');

async function alterOrders() {
  try {
    console.log("Altering orders table with FK checks off...");
    
    await db.execute("SET FOREIGN_KEY_CHECKS=0;");
    
    // Modify columns
    await db.execute("ALTER TABLE orders MODIFY COLUMN order_id VARCHAR(50)");
    await db.execute("ALTER TABLE order_details MODIFY COLUMN order_id VARCHAR(50)").catch(()=>console.log("No order_details"));
    await db.execute("ALTER TABLE payments MODIFY COLUMN order_id VARCHAR(50)").catch(()=>console.log("No payments"));
    await db.execute("ALTER TABLE photo_admins MODIFY COLUMN order_id VARCHAR(50)").catch(()=>console.log("No photo_admins"));
    
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

    await db.execute("SET FOREIGN_KEY_CHECKS=1;");
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
alterOrders();
