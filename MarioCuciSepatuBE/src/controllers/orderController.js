const Order = require('../models/orderModel');
const User = require('../models/userModel');

const DAILY_LIMIT = 20;

// Parsing JSON field yang dikembalikan dari DB sebagai string
const parseOrderJSON = (order) => {
  if (!order) return order;
  if (order.address && typeof order.address === 'string') {
    try { order.address = JSON.parse(order.address); } catch(e) {}
  }
  if (order.photos && typeof order.photos === 'string') {
    try { order.photos = JSON.parse(order.photos); } catch(e) {}
  }
  return order;
};

exports.getAllOrders = async (req, res) => {
  try {
    let orders;
    if (req.user && req.user.role === 'admin') {
      orders = await Order.getAll();
    } else {
      orders = await Order.getByUserId(req.user.id);
    }
    res.json({ data: orders.map(parseOrderJSON) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveOrders = async (req, res) => {
  try {
    let orders;
    if (req.user && req.user.role === 'admin') {
      orders = await Order.getActive();
    } else {
      orders = await Order.getActiveByUserId(req.user.id);
    }
    res.json({ data: orders.map(parseOrderJSON) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.getById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ data: parseOrderJSON(order) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDailyStats = async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    const count = await Order.getDailyCount(targetDate);
    res.json({
      data: {
        count,
        limit: DAILY_LIMIT,
        remaining: Math.max(0, DAILY_LIMIT - count),
        isFull: count >= DAILY_LIMIT
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    // Block Admin from ordering
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admin tidak diperbolehkan untuk membuat pesanan.' });
    }

    // Verify user profile is complete
    const userProfile = await User.findById(req.user.id);
    if (!userProfile) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    let userAddresses = [];
    try {
      if (userProfile.address) {
        userAddresses = JSON.parse(userProfile.address);
      }
    } catch (e) {}

    if (!userProfile.nama || !userProfile.phone || !userAddresses || userAddresses.length === 0) {
      return res.status(400).json({
        message: 'Silakan lengkapi data diri Anda (Nama, Nomor Telepon, dan Alamat) di profil sebelum melakukan pemesanan.'
      });
    }

    const orderData = req.body;

    // Validasi jarak maksimal 15KM
    const distance = parseFloat(orderData.distance) || 0;
    const pickupMethod = orderData.pickupMethod;
    const returnMethod = orderData.returnMethod;

    if (distance > 15 && (pickupMethod === 'HOME_PICKUP' || pickupMethod === 'COURIER_PICKUP' ||
                          returnMethod === 'HOME_DELIVERY' || returnMethod === 'COURIER_DELIVERY')) {
      return res.status(400).json({
        message: 'Jarak terlalu jauh (Maksimal 15KM). Silakan pilih metode antar dan ambil sendiri (Self Drop / Self Pickup).'
      });
    }

    const requestedDate = orderData.pickup_date;
    const currentPairs = await Order.getDailyCount(requestedDate);
    const requestedQuantity = parseInt(orderData.quantity) || 1;

    let is_overflow_order = false;
    let auto_shifted = false;
    let finalPickupDate = requestedDate;

    if (currentPairs + requestedQuantity > DAILY_LIMIT) {
      is_overflow_order = true;
      auto_shifted = true;
      const nextDate = new Date(requestedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      finalPickupDate = nextDate.toISOString().split('T')[0];
      if (orderData.delivery_date) {
        const delDate = new Date(orderData.delivery_date);
        delDate.setDate(delDate.getDate() + 1);
        orderData.delivery_date = delDate.toISOString().split('T')[0];
      }
    }

    const newOrder = {
      user_id:       req.user.id,
      service_id:    orderData.service_id || orderData.service_type_id,
      pickup_date:   finalPickupDate,
      delivery_date: orderData.delivery_date || null,
      status:        'PENDING',
      pickupMethod:  pickupMethod,
      returnMethod:  returnMethod,
      address:       orderData.address,
      total_price:   orderData.total_price || orderData.totalPrice || 0,
      is_overflow_order,
      auto_shifted,
      payment_method: orderData.payment?.method || 'QRIS',
      payment_status: orderData.payment?.status || 'PENDING',
      notes:          orderData.notes || '',
      quantity:       orderData.quantity || 1,
      photos:         orderData.photos ? JSON.stringify(orderData.photos) : null,
      originalPrice:  orderData.originalPrice || null,
      discountAmount: orderData.discountAmount || null,
      promo_id:       orderData.promo_id || null,
      order_date:     orderData.order_date || null
    };

    const result = await Order.create(newOrder);
    const orderId = result.insertId;

    res.status(201).json({
      message: 'Order created',
      data: { ...newOrder, order_id: orderId }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const uploaderId = req.user?.id || null;
    await Order.update(req.params.id, orderData, uploaderId);
    res.json({ message: 'Order updated', data: { order_id: req.params.id, ...orderData } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.delete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
