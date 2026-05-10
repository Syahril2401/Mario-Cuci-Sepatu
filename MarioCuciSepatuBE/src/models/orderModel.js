const db = require('../config/db');

const Order = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, s.serviceName as service 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id
    `);
    return rows;
  },
  getByUserId: async (userId) => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, s.serviceName as service 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id 
      WHERE o.user_id = ?
    `, [userId]);
    return rows;
  },
  getActive: async () => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, s.serviceName as service 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id 
      WHERE o.status NOT IN ("FINISHED", "CANCELLED")
    `);
    return rows;
  },
  getActiveByUserId: async (userId) => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, s.serviceName as service 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id 
      WHERE o.status NOT IN ("FINISHED", "CANCELLED") AND o.user_id = ?
    `, [userId]);
    return rows;
  },
  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, s.serviceName as service 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id 
      WHERE o.order_id = ?
    `, [id]);
    return rows[0];
  },
  getDailyCount: async (date) => {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM orders WHERE pickup_date = ? AND status != "CANCELLED"', [date]);
    return rows[0].count;
  },
  create: async (data) => {
    const { order_id, user_id, service_id, pickup_date, delivery_date, status, pickupMethod, returnMethod, address, total_price, is_overflow_order, auto_shifted, payment_method, payment_status, notes, quantity, photos, originalPrice, discountAmount, promoName } = data;
    const [result] = await db.execute(
      `INSERT INTO orders (order_id, user_id, service_id, pickup_date, delivery_date, status, pickupMethod, returnMethod, address, total_price, is_overflow_order, auto_shifted, payment_method, payment_status, notes, quantity, photos, originalPrice, discountAmount, promoName) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, user_id, service_id, pickup_date, delivery_date || null, status || 'PENDING', pickupMethod, returnMethod, address, total_price, is_overflow_order || false, auto_shifted || false, payment_method || null, payment_status || 'PENDING', notes, quantity, photos, originalPrice, discountAmount, promoName]
    );
    return result;
  },
  insertDetail: async (data) => {
    const { order_id, service_type_id, quantity, subtotal, alamat, pickup_method_id, return_method_id, dropDate, pickupDate, notes, photoCust } = data;
    const [result] = await db.execute(
      `INSERT INTO order_details (order_id, service_type_id, quantity, subtotal, alamat, pickup_method_id, return_method_id, dropDate, pickupDate, notes, photoCust) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, service_type_id, quantity, subtotal, alamat, pickup_method_id, return_method_id, dropDate, pickupDate, notes, photoCust]
    );
    return result;
  },
  update: async (id, data) => {
    const fields = [];
    const values = [];

    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (data.payment_method || (data.payment && data.payment.method)) {
      fields.push('payment_method = ?');
      values.push(data.payment_method || data.payment.method);
    }

    if (data.payment_status || (data.payment && data.payment.status)) {
      fields.push('payment_status = ?');
      values.push(data.payment_status || data.payment.status);
    }
    
    // Support photo fields if they exist in DB
    const possiblePhotos = ['pickup_photo', 'received_photo', 'delivery_photo', 'proof_image', 'notes'];
    possiblePhotos.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.execute(
      `UPDATE orders SET ${fields.join(', ')} WHERE order_id = ?`,
      values
    );
    return result;
  },
  updateStatus: async (id, status) => {
    const [result] = await db.execute('UPDATE orders SET status=? WHERE order_id=?', [status, id]);
    return result;
  },
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM orders WHERE order_id=?', [id]);
    return result;
  }
};

module.exports = Order;
