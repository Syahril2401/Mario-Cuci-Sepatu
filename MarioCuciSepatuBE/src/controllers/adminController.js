const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Total Orders
    const [ordersCount] = await db.execute('SELECT COUNT(*) as count FROM orders WHERE status NOT IN ("PENDING", "MENUNGGU_VERIFIKASI", "CANCELLED")');
    
    // 2. Total Customers (role_id = 2)
    const [usersCount] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role_id = 2');
    
    // 3. Total Services
    const [servicesCount] = await db.execute('SELECT COUNT(*) as count FROM services');
    
    // 4. Orders Today
    const [ordersToday] = await db.execute('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ? AND status NOT IN ("PENDING", "MENUNGGU_VERIFIKASI", "CANCELLED")', [today]);
    
    // 5. Revenue Today
    const [revenueToday] = await db.execute('SELECT SUM(total_price) as total FROM orders WHERE DATE(created_at) = ? AND status NOT IN ("PENDING", "MENUNGGU_VERIFIKASI", "CANCELLED")', [today]);
    
    // 6. Pending Orders (Attention needed)
    const [pendingOrders] = await db.execute('SELECT COUNT(*) as count FROM orders WHERE status IN ("PENDING", "MENUNGGU_VERIFIKASI", "ANTRI")');

    // 7. Recent Orders (Last 5)
    const [recentOrders] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, s.serviceName as service 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id 
      ORDER BY o.created_at DESC LIMIT 5
    `);

    // 8. Needs Attention Orders
    const [needsAttention] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, s.serviceName as service 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id 
      WHERE o.status IN ("PENDING", "MENUNGGU_VERIFIKASI", "ANTRI") LIMIT 5
    `);

    res.json({
      data: {
        stats: {
          totalOrders: ordersCount[0].count,
          totalUsers: usersCount[0].count,
          totalServices: servicesCount[0].count,
          ordersToday: ordersToday[0].count,
          revenueToday: revenueToday[0].total || 0,
          pendingOrders: pendingOrders[0].count
        },
        recentOrders,
        needsAttention
      }
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: error.message });
  }
};
