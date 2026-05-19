const db = require('./src/config/db');

async function test() {
  try {
    const [rows] = await db.execute(
      'SELECT o.order_id, o.promo_id, o.discountAmount, o.originalPrice, p.promoCode, p.promoName FROM orders o LEFT JOIN promos p ON o.promo_id = p.promo_id LIMIT 5'
    );
    console.log('Orders with promo join:');
    console.table(rows);

    const [promos] = await db.execute('SELECT * FROM promos LIMIT 5');
    console.log('Promos table:');
    console.table(promos);

    const [fks] = await db.execute(
      `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
       FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = 'mario_laundry_db' AND TABLE_NAME = 'orders' AND REFERENCED_TABLE_NAME IS NOT NULL`
    );
    console.log('FK Constraints on orders:');
    console.table(fks);
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

test();
