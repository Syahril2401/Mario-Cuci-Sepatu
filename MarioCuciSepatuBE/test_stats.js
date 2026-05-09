const db = require('./src/config/db');

async function test() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log("Checking ordersCount...");
    const [ordersCount] = await db.execute('SELECT COUNT(*) as count FROM orders');
    console.log("ordersCount:", ordersCount);

    console.log("Checking usersCount...");
    const [usersCount] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role_id = 2');
    console.log("usersCount:", usersCount);

    console.log("Checking servicesCount...");
    const [servicesCount] = await db.execute('SELECT COUNT(*) as count FROM services');
    console.log("servicesCount:", servicesCount);

    console.log("Checking ordersToday...");
    const [ordersToday] = await db.execute('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?', [today]);
    console.log("ordersToday:", ordersToday);

    console.log("Checking revenueToday...");
    const [revenueToday] = await db.execute('SELECT SUM(total_price) as total FROM orders WHERE DATE(created_at) = ? AND status != "CANCELLED"', [today]);
    console.log("revenueToday:", revenueToday);

    console.log("Checking pendingOrders...");
    const [pendingOrders] = await db.execute('SELECT COUNT(*) as count FROM orders WHERE status IN ("PENDING", "MENUNGGU_VERIFIKASI", "ANTRI")');
    console.log("pendingOrders:", pendingOrders);

    console.log("Success!");
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    process.exit(0);
  }
}

test();
