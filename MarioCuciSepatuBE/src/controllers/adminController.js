const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Orders (dikecualikan PENDING & WAITING_VERIFICATION)
    const [ordersCount] = await db.execute(
      `SELECT COUNT(*) AS count FROM orders o
       LEFT JOIN order_statuses os ON o.status_id = os.status_id
       WHERE os.status_code NOT IN ('PENDING', 'WAITING_VERIFICATION', 'CANCELLED')`
    );

    // 2. Total Customers (role_id = 2)
    const [usersCount] = await db.execute(
      `SELECT COUNT(*) AS count FROM users WHERE role_id = 2`
    );

    // 3. Total Services
    const [servicesCount] = await db.execute(
      `SELECT COUNT(*) AS count FROM services`
    );

    // 4. Orders Today
    const [ordersToday] = await db.execute(
      `SELECT COUNT(*) AS count FROM orders o
       LEFT JOIN order_statuses os ON o.status_id = os.status_id
       WHERE DATE(o.created_at) = CURDATE()
         AND os.status_code NOT IN ('PENDING', 'WAITING_VERIFICATION', 'CANCELLED')`
    );

    // 5. Revenue Today (dari tabel payments)
    const [revenueToday] = await db.execute(
      `SELECT COALESCE(SUM(pay.amount), 0) AS total
       FROM orders o
       LEFT JOIN order_statuses os ON o.status_id = os.status_id
       LEFT JOIN payments pay ON o.order_id = pay.order_id
       WHERE DATE(o.created_at) = CURDATE()
         AND os.status_code IN ('FINISHED', 'COMPLETED')`
    );

    // 6. Pending Orders
    const [pendingOrders] = await db.execute(
      `SELECT COUNT(*) AS count FROM orders o
       LEFT JOIN order_statuses os ON o.status_id = os.status_id
       WHERE os.status_code IN ('PENDING', 'WAITING_VERIFICATION', 'AWAITING_DROP_OFF')`
    );

    // 7. Recent Orders (FINISHED) — JOIN order_details + services
    const [recentOrders] = await db.execute(
      `SELECT o.order_id, o.total_price, o.created_at,
              u.name AS customerName, u.phone AS customerPhone, u.profileImage,
              s.serviceName AS service,
              os.status_code AS status
       FROM orders o
       LEFT JOIN order_statuses os ON o.status_id = os.status_id
       LEFT JOIN users u           ON o.user_id    = u.user_id
       LEFT JOIN order_details od  ON o.order_id   = od.order_id
       LEFT JOIN services s        ON od.service_id = s.service_id
       WHERE os.status_code IN ('FINISHED', 'COMPLETED')
       ORDER BY o.created_at DESC
       LIMIT 3`
    );

    // 8. Needs Attention Orders
    const [needsAttention] = await db.execute(
      `SELECT o.order_id, o.total_price, o.created_at,
              u.name AS customerName, u.phone AS customerPhone, u.profileImage,
              s.serviceName AS service,
              os.status_code AS status
       FROM orders o
       LEFT JOIN order_statuses os ON o.status_id = os.status_id
       LEFT JOIN users u           ON o.user_id    = u.user_id
       LEFT JOIN order_details od  ON o.order_id   = od.order_id
       LEFT JOIN services s        ON od.service_id = s.service_id
       WHERE os.status_code IN ('PENDING', 'WAITING_VERIFICATION', 'AWAITING_DROP_OFF')
       LIMIT 5`
    );

    res.json({
      data: {
        stats: {
          totalOrders:   ordersCount[0].count,
          totalUsers:    usersCount[0].count,
          totalServices: servicesCount[0].count,
          ordersToday:   ordersToday[0].count,
          revenueToday:  revenueToday[0].total || 0,
          pendingOrders: pendingOrders[0].count
        },
        recentOrders,
        needsAttention
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message });
  }
};
