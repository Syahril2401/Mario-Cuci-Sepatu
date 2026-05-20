const db = require('../config/db');

const Order = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, 
             s.serviceName as service,
             p.promoCode, p.promoName, p.percentage as promoPercentage,
             pc.photoCustomer as photos,
             pa1.photoAdmin as pickup_photo,
             pa2.photoAdmin as received_photo,
             pa3.photoAdmin as delivery_photo,
             pa4.photoAdmin as proof_image,
             os.status_code as status
      FROM orders o 
      LEFT JOIN order_statuses os ON o.status_id = os.status_id
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id
      LEFT JOIN promos p ON o.promo_id = p.promo_id
      LEFT JOIN photo_customers pc ON o.photo_customer_id = pc.photoCustomerId
      LEFT JOIN photo_admins pa1 ON o.photo_admin_pickup_id = pa1.photoAdminId
      LEFT JOIN photo_admins pa2 ON o.photo_admin_received_id = pa2.photoAdminId
      LEFT JOIN photo_admins pa3 ON o.photo_admin_delivery_id = pa3.photoAdminId
      LEFT JOIN photo_admins pa4 ON o.photo_admin_proof_id = pa4.photoAdminId
    `);
    return rows;
  },
  getByUserId: async (userId) => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, 
             s.serviceName as service,
             p.promoCode, p.promoName, p.percentage as promoPercentage,
             pc.photoCustomer as photos,
             pa1.photoAdmin as pickup_photo,
             pa2.photoAdmin as received_photo,
             pa3.photoAdmin as delivery_photo,
             pa4.photoAdmin as proof_image,
             os.status_code as status
      FROM orders o 
      LEFT JOIN order_statuses os ON o.status_id = os.status_id
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id
      LEFT JOIN promos p ON o.promo_id = p.promo_id
      LEFT JOIN photo_customers pc ON o.photo_customer_id = pc.photoCustomerId
      LEFT JOIN photo_admins pa1 ON o.photo_admin_pickup_id = pa1.photoAdminId
      LEFT JOIN photo_admins pa2 ON o.photo_admin_received_id = pa2.photoAdminId
      LEFT JOIN photo_admins pa3 ON o.photo_admin_delivery_id = pa3.photoAdminId
      LEFT JOIN photo_admins pa4 ON o.photo_admin_proof_id = pa4.photoAdminId
      WHERE o.user_id = ?
    `, [userId]);
    return rows;
  },
  getActive: async () => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, 
             s.serviceName as service,
             p.promoCode, p.promoName, p.percentage as promoPercentage,
             pc.photoCustomer as photos,
             pa1.photoAdmin as pickup_photo,
             pa2.photoAdmin as received_photo,
             pa3.photoAdmin as delivery_photo,
             pa4.photoAdmin as proof_image,
             os.status_code as status
      FROM orders o 
      LEFT JOIN order_statuses os ON o.status_id = os.status_id
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id
      LEFT JOIN promos p ON o.promo_id = p.promo_id
      LEFT JOIN photo_customers pc ON o.photo_customer_id = pc.photoCustomerId
      LEFT JOIN photo_admins pa1 ON o.photo_admin_pickup_id = pa1.photoAdminId
      LEFT JOIN photo_admins pa2 ON o.photo_admin_received_id = pa2.photoAdminId
      LEFT JOIN photo_admins pa3 ON o.photo_admin_delivery_id = pa3.photoAdminId
      LEFT JOIN photo_admins pa4 ON o.photo_admin_proof_id = pa4.photoAdminId
      WHERE os.status_code NOT IN ("FINISHED", "CANCELLED")
    `);
    return rows;
  },
  getActiveByUserId: async (userId) => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, 
             s.serviceName as service,
             p.promoCode, p.promoName, p.percentage as promoPercentage,
             pc.photoCustomer as photos,
             pa1.photoAdmin as pickup_photo,
             pa2.photoAdmin as received_photo,
             pa3.photoAdmin as delivery_photo,
             pa4.photoAdmin as proof_image,
             os.status_code as status
      FROM orders o 
      LEFT JOIN order_statuses os ON o.status_id = os.status_id
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id
      LEFT JOIN promos p ON o.promo_id = p.promo_id
      LEFT JOIN photo_customers pc ON o.photo_customer_id = pc.photoCustomerId
      LEFT JOIN photo_admins pa1 ON o.photo_admin_pickup_id = pa1.photoAdminId
      LEFT JOIN photo_admins pa2 ON o.photo_admin_received_id = pa2.photoAdminId
      LEFT JOIN photo_admins pa3 ON o.photo_admin_delivery_id = pa3.photoAdminId
      LEFT JOIN photo_admins pa4 ON o.photo_admin_proof_id = pa4.photoAdminId
      WHERE os.status_code NOT IN ("FINISHED", "CANCELLED") AND o.user_id = ?
    `, [userId]);
    return rows;
  },
  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, u.profileImage, 
             s.serviceName as service,
             p.promoCode, p.promoName, p.percentage as promoPercentage,
             pc.photoCustomer as photos,
             pa1.photoAdmin as pickup_photo,
             pa2.photoAdmin as received_photo,
             pa3.photoAdmin as delivery_photo,
             pa4.photoAdmin as proof_image,
             os.status_code as status
      FROM orders o 
      LEFT JOIN order_statuses os ON o.status_id = os.status_id
      LEFT JOIN users u ON o.user_id = u.user_id 
      LEFT JOIN services s ON o.service_id = s.service_id
      LEFT JOIN promos p ON o.promo_id = p.promo_id
      LEFT JOIN photo_customers pc ON o.photo_customer_id = pc.photoCustomerId
      LEFT JOIN photo_admins pa1 ON o.photo_admin_pickup_id = pa1.photoAdminId
      LEFT JOIN photo_admins pa2 ON o.photo_admin_received_id = pa2.photoAdminId
      LEFT JOIN photo_admins pa3 ON o.photo_admin_delivery_id = pa3.photoAdminId
      LEFT JOIN photo_admins pa4 ON o.photo_admin_proof_id = pa4.photoAdminId
      WHERE o.order_id = ?
    `, [id]);
    return rows[0];
  },
  getDailyCount: async (date) => {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM orders o LEFT JOIN order_statuses os ON o.status_id = os.status_id WHERE o.pickup_date = ? AND os.status_code != "CANCELLED"', [date]);
    return rows[0].count;
  },
  create: async (data) => {
    const { order_id, user_id, service_id, pickup_date, delivery_date, status, pickupMethod, returnMethod, address, total_price, is_overflow_order, auto_shifted, payment_method, payment_status, notes, quantity, photos, originalPrice, discountAmount, promo_id } = data;
    const [result] = await db.execute(
      `INSERT INTO orders (order_id, user_id, service_id, pickup_date, delivery_date, status_id, pickupMethod, returnMethod, address, total_price, is_overflow_order, auto_shifted, payment_method, payment_status, notes, quantity, originalPrice, discountAmount, promo_id) 
       VALUES (?, ?, ?, ?, ?, (SELECT status_id FROM order_statuses WHERE status_code = ? LIMIT 1), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, user_id, service_id, pickup_date, delivery_date || null, status || 'PENDING', pickupMethod, returnMethod, address, total_price, is_overflow_order || false, auto_shifted || false, payment_method || null, payment_status || 'PENDING', notes, quantity, originalPrice || null, discountAmount || null, promo_id || null]
    );

    const newOrderId = result.insertId || order_id;

    if (photos && photos !== '[]') {
      const [pcResult] = await db.execute('INSERT INTO photo_customers (order_id, photoCustomer) VALUES (?, ?)', [newOrderId, photos]);
      await db.execute('UPDATE orders SET photo_customer_id = ? WHERE order_id = ?', [pcResult.insertId, newOrderId]);
    }

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
      fields.push('status_id = (SELECT status_id FROM order_statuses WHERE status_code = ? LIMIT 1)');
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

    // Support promo_id update (bisa di-set NULL jika promo dihapus)
    if (data.promo_id !== undefined) {
      fields.push('promo_id = ?');
      values.push(data.promo_id || null);
    }

    if (data.discountAmount !== undefined) {
      fields.push('discountAmount = ?');
      values.push(data.discountAmount || null);
    }

    if (data.originalPrice !== undefined) {
      fields.push('originalPrice = ?');
      values.push(data.originalPrice || null);
    }
    
    // Support photo fields -> insert to photo_admins
    const possibleAdminPhotos = [
      { field: 'pickup_photo', idCol: 'photo_admin_pickup_id' },
      { field: 'received_photo', idCol: 'photo_admin_received_id' },
      { field: 'delivery_photo', idCol: 'photo_admin_delivery_id' },
      { field: 'proof_image', idCol: 'photo_admin_proof_id' }
    ];

    for (let p of possibleAdminPhotos) {
      if (data[p.field] !== undefined) {
        if (data[p.field] === null) {
          fields.push(`${p.idCol} = NULL`);
        } else {
          const [res] = await db.execute('INSERT INTO photo_admins (order_id, photoAdmin) VALUES (?, ?)', [id, data[p.field]]);
          fields.push(`${p.idCol} = ?`);
          values.push(res.insertId);
        }
      }
    }
    
    // Support timestamps if needed
    const possibleTimestamps = ['pickup_photo_time', 'received_photo_time', 'delivery_photo_time', 'notes'];
    possibleTimestamps.forEach(field => {
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
    const [result] = await db.execute('UPDATE orders SET status_id=(SELECT status_id FROM order_statuses WHERE status_code=? LIMIT 1) WHERE order_id=?', [status, id]);
    return result;
  },
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM orders WHERE order_id=?', [id]);
    return result;
  }
};

module.exports = Order;
