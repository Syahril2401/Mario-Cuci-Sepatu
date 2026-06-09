const db = require('../config/db');

// =====================================================
// MAP metode pickup/return ke fulfillment_methods ID
// =====================================================
const PICKUP_METHOD_IDS = {
  'SELF_DROP':      1,
  'HOME_PICKUP':    2,
  'COURIER_PICKUP': 2, // alias dari frontend
};
const RETURN_METHOD_IDS = {
  'SELF_PICKUP':      3,
  'HOME_DELIVERY':    4,
  'COURIER_DELIVERY': 4, // alias dari frontend
};

// =====================================================
// Query SELECT lengkap yang digunakan oleh semua getter
// Alias field dijaga kompatibel dengan frontend yang sudah ada
// =====================================================
const ORDER_SELECT = `
  SELECT
    o.order_id, o.user_id, o.promo_id,
    o.pickup_date, o.delivery_date, o.order_date,
    o.shipping_address AS address,
    o.notes, o.total_price, o.originalPrice, o.discountAmount,
    o.is_overflow_order, o.auto_shifted,
    o.created_at, o.updated_at,

    -- Status
    os.status_code AS status,

    -- User / Customer
    u.name AS customerName,
    u.phone AS customerPhone,
    u.profileImage,

    -- Metode pengiriman (dari tabel fulfillment_methods)
    fm_pick.method_name  AS pickupMethod,
    fm_ret.method_name   AS returnMethod,

    -- Service & Quantity (dari order_details + services)
    s.service_id,
    s.serviceName AS service,
    od.quantity,
    od.subtotal,

    -- Promo
    p.promoCode,
    p.promoName,
    p.percentage AS promoPercentage,

    -- Pembayaran (dari tabel payments)
    pay.amount        AS payment_amount,
    pay.payment_method,
    pay.payment_status,

    -- Foto Customer
    op_cust.photo_data   AS photos,

    -- Foto Admin
    op_pick.photo_data   AS pickup_photo,
    op_pick.uploaded_at  AS pickup_photo_time,
    op_recv.photo_data   AS received_photo,
    op_recv.uploaded_at  AS received_photo_time,
    op_del.photo_data    AS delivery_photo,
    op_del.uploaded_at   AS delivery_photo_time,
    op_proof.photo_data  AS proof_image

  FROM orders o
  LEFT JOIN order_statuses    os      ON o.status_id        = os.status_id
  LEFT JOIN users             u       ON o.user_id           = u.user_id
  LEFT JOIN fulfillment_methods fm_pick ON o.pickup_method_id = fm_pick.method_id
  LEFT JOIN fulfillment_methods fm_ret  ON o.return_method_id = fm_ret.method_id
  LEFT JOIN promos            p       ON o.promo_id          = p.promo_id
  LEFT JOIN payments          pay     ON o.order_id          = pay.order_id
  LEFT JOIN order_details     od      ON o.order_id          = od.order_id
  LEFT JOIN services          s       ON od.service_id        = s.service_id
  LEFT JOIN order_photos op_cust   ON op_cust.order_id  = o.order_id AND op_cust.photo_type  = 'CHECKOUT'
  LEFT JOIN order_photos op_pick   ON op_pick.order_id  = o.order_id AND op_pick.photo_type  = 'PICKUP_PHOTO'
  LEFT JOIN order_photos op_recv   ON op_recv.order_id  = o.order_id AND op_recv.photo_type  = 'RECEIVED_PHOTO'
  LEFT JOIN order_photos op_del    ON op_del.order_id   = o.order_id AND op_del.photo_type   = 'DELIVERY_PHOTO'
  LEFT JOIN order_photos op_proof  ON op_proof.order_id = o.order_id AND op_proof.photo_type = 'PROOF_IMAGE'
`;

const Order = {

  // =====================================================
  // GET: Semua order (untuk admin)
  // =====================================================
  getAll: async () => {
    const [rows] = await db.execute(`${ORDER_SELECT} ORDER BY o.created_at DESC`);
    return rows;
  },

  // =====================================================
  // GET: Order berdasarkan user_id (untuk customer)
  // =====================================================
  getByUserId: async (userId) => {
    const [rows] = await db.execute(`${ORDER_SELECT} WHERE o.user_id = ? ORDER BY o.created_at DESC`, [userId]);
    return rows;
  },

  // =====================================================
  // GET: Order aktif (bukan FINISHED/CANCELLED)
  // =====================================================
  getActive: async () => {
    const [rows] = await db.execute(`${ORDER_SELECT} WHERE os.status_code NOT IN ('FINISHED', 'CANCELLED') ORDER BY o.created_at DESC`);
    return rows;
  },

  // =====================================================
  // GET: Order aktif milik user tertentu
  // =====================================================
  getActiveByUserId: async (userId) => {
    const [rows] = await db.execute(`${ORDER_SELECT} WHERE os.status_code NOT IN ('FINISHED', 'CANCELLED') AND o.user_id = ? ORDER BY o.created_at DESC`, [userId]);
    return rows;
  },

  // =====================================================
  // GET: Order berdasarkan ID
  // =====================================================
  getById: async (id) => {
    const [rows] = await db.execute(`${ORDER_SELECT} WHERE o.order_id = ?`, [id]);
    return rows[0];
  },

  // =====================================================
  // GET: Hitung jumlah order per tanggal (untuk kuota harian)
  // =====================================================
  getDailyCount: async (date) => {
    const [rows] = await db.execute(
      `SELECT COALESCE(SUM(od.quantity), 0) AS count
       FROM orders o
       LEFT JOIN order_statuses os ON o.status_id = os.status_id
       LEFT JOIN order_details od ON od.order_id = o.order_id
       WHERE o.pickup_date = ? AND os.status_code != 'CANCELLED'`,
      [date]
    );
    return Number(rows[0].count);
  },

  // =====================================================
  // CREATE: Buat order baru
  // Urutan insert: orders → order_details → payments → order_photos
  // =====================================================
  create: async (data) => {
    const {
      user_id, service_id, pickup_date, delivery_date, status,
      pickupMethod, returnMethod,
      address, total_price, is_overflow_order, auto_shifted,
      payment_method, payment_status,
      notes, quantity, photos,
      originalPrice, discountAmount, promo_id, order_date
    } = data;

    // Mapping metode ke FK ID
    const pickupMethodId = PICKUP_METHOD_IDS[pickupMethod] || 1;
    const returnMethodId = RETURN_METHOD_IDS[returnMethod] || 3;

    // 1. Insert ke tabel orders
    const [orderResult] = await db.execute(
      `INSERT INTO orders
         (user_id, status_id, promo_id, pickup_method_id, return_method_id,
          pickup_date, delivery_date, shipping_address, notes,
          total_price, originalPrice, discountAmount,
          is_overflow_order, auto_shifted, order_date)
       VALUES
         (?, (SELECT status_id FROM order_statuses WHERE status_code = ? LIMIT 1),
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [
        user_id,
        status || 'PENDING',
        promo_id || null,
        pickupMethodId,
        returnMethodId,
        pickup_date,
        delivery_date || null,
        address ? (typeof address === 'object' ? JSON.stringify(address) : address) : null,
        notes || '',
        total_price,
        originalPrice || null,
        discountAmount || null,
        is_overflow_order || false,
        auto_shifted || false,
        order_date || null
      ]
    );

    const newOrderId = orderResult.insertId;

    // 2. Insert ke order_details (service + quantity)
    if (service_id) {
      await db.execute(
        `INSERT INTO order_details (order_id, service_id, quantity, subtotal)
         VALUES (?, ?, ?, ?)`,
        [newOrderId, service_id, quantity || 1, total_price || 0]
      );
    }

    // 3. Insert ke payments
    await db.execute(
      `INSERT INTO payments (order_id, amount, payment_method, payment_status)
       VALUES (?, ?, ?, ?)`,
      [newOrderId, total_price || 0, payment_method || 'QRIS', payment_status || 'PENDING']
    );

    // 4. Insert foto customer ke order_photos (jika ada)
    if (photos && photos !== '[]') {
      // Simpan foto customer — jika multiple, simpan sebagai JSON array di satu baris
      const photoDataStr = Array.isArray(photos) ? JSON.stringify(photos) : photos;
      await db.execute(
        `INSERT INTO order_photos (order_id, user_id, photo_type, photo_data)
         VALUES (?, ?, 'CHECKOUT', ?)
         ON DUPLICATE KEY UPDATE photo_data = VALUES(photo_data), uploaded_at = CURRENT_TIMESTAMP`,
        [newOrderId, user_id, photoDataStr]
      );
    }

    return { insertId: newOrderId };
  },

  // =====================================================
  // UPDATE: Update order (status, payment, foto admin, notes)
  // =====================================================
  update: async (id, data, uploaderId = null) => {
    const orderFields = [];
    const orderValues = [];

    // --- Update status ---
    if (data.status) {
      orderFields.push('status_id = (SELECT status_id FROM order_statuses WHERE status_code = ? LIMIT 1)');
      orderValues.push(data.status);
    }

    // --- Update notes ---
    if (data.notes !== undefined) {
      orderFields.push('notes = ?');
      orderValues.push(data.notes);
    }

    // --- Update orders table jika ada field yang berubah ---
    if (orderFields.length > 0) {
      orderValues.push(id);
      await db.execute(
        `UPDATE orders SET ${orderFields.join(', ')} WHERE order_id = ?`,
        orderValues
      );
    }

    // --- Update payments (payment_method / payment_status) ---
    const paymentFields = [];
    const paymentValues = [];

    const payMethod = data.payment_method || (data.payment && data.payment.method);
    const payStatus = data.payment_status || (data.payment && data.payment.status);

    if (payMethod) {
      paymentFields.push('payment_method = ?');
      paymentValues.push(payMethod);
    }
    if (payStatus) {
      paymentFields.push('payment_status = ?');
      paymentValues.push(payStatus);
    }

    if (paymentFields.length > 0) {
      // Build params: [order_id, amount, pay_method, pay_status, ...update_values]
      // Selalu sediakan kedua kolom agar INSERT tidak gagal
      const payMethod = data.payment_method || (data.payment && data.payment.method) || 'QRIS';
      const payStatus = data.payment_status || (data.payment && data.payment.status) || 'PENDING';
      const updateClause = paymentFields.join(', ');
      const updateParams = paymentValues.slice(0, paymentFields.length); // tanpa id di akhir
      await db.execute(
        `INSERT INTO payments (order_id, amount, payment_method, payment_status)
         VALUES (?, 0, ?, ?)
         ON DUPLICATE KEY UPDATE ${updateClause}`,
        [id, payMethod, payStatus, ...updateParams]
      );
    }

    // --- Update foto admin ke order_photos ---
    const adminPhotoMap = [
      { field: 'pickup_photo',   type: 'PICKUP_PHOTO' },
      { field: 'received_photo', type: 'RECEIVED_PHOTO' },
      { field: 'delivery_photo', type: 'DELIVERY_PHOTO' },
      { field: 'proof_image',    type: 'PROOF_IMAGE' },
    ];

    for (const p of adminPhotoMap) {
      if (data[p.field] !== undefined && data[p.field] !== null) {
        const uploader = uploaderId || 1; // default ke admin pertama jika tidak ada
        await db.execute(
          `INSERT INTO order_photos (order_id, user_id, photo_type, photo_data)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE photo_data = VALUES(photo_data), uploaded_at = CURRENT_TIMESTAMP`,
          [id, uploader, p.type, data[p.field]]
        );
      }
    }

    // --- Update promo / diskon ---
    const promoFields = [];
    const promoValues = [];
    if (data.promo_id !== undefined) { promoFields.push('promo_id = ?'); promoValues.push(data.promo_id || null); }
    if (data.discountAmount !== undefined) { promoFields.push('discountAmount = ?'); promoValues.push(data.discountAmount || null); }
    if (data.originalPrice !== undefined) { promoFields.push('originalPrice = ?'); promoValues.push(data.originalPrice || null); }

    if (promoFields.length > 0) {
      promoValues.push(id);
      await db.execute(`UPDATE orders SET ${promoFields.join(', ')} WHERE order_id = ?`, promoValues);
    }

    return { affectedRows: 1 };
  },

  // =====================================================
  // UPDATE STATUS saja (shorthand)
  // =====================================================
  updateStatus: async (id, status) => {
    const [result] = await db.execute(
      `UPDATE orders SET status_id = (SELECT status_id FROM order_statuses WHERE status_code = ? LIMIT 1) WHERE order_id = ?`,
      [status, id]
    );
    return result;
  },

  // =====================================================
  // DELETE order
  // =====================================================
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM orders WHERE order_id = ?', [id]);
    return result;
  }
};

module.exports = Order;
