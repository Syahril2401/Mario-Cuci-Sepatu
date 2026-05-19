const Order = require('../models/orderModel');

const DAILY_LIMIT = 20; // as specified in frontend

const parseOrderJSON = (order) => {
  if (order.address && typeof order.address === 'string') {
    try { order.address = JSON.parse(order.address); } catch(e){}
  }
  if (order.photos && typeof order.photos === 'string') {
    try { order.photos = JSON.parse(order.photos); } catch(e){}
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
        count: count,
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
    const orderData = req.body;

    // Validasi jarak maksimal 15KM untuk penjemputan/pengantaran
    const distance = parseFloat(orderData.distance) || 0;
    if (distance > 15 && (orderData.pickupMethod === 'HOME_PICKUP' || orderData.returnMethod === 'HOME_DELIVERY')) {
      return res.status(400).json({ 
        message: 'Jarak terlalu jauh (Maksimal 15KM). Silakan pilih metode antar dan ambil sendiri (Self Drop / Self Pickup).' 
      });
    }

    const requestedDate = orderData.pickup_date;
    const count = await Order.getDailyCount(requestedDate);
    
    let is_overflow_order = false;
    let auto_shifted = false;
    let finalPickupDate = requestedDate;
    
    // Simplification of "find next available date"
    if (count >= DAILY_LIMIT) {
      is_overflow_order = true;
      auto_shifted = true;
      // In a real scenario, loop to find the next date. Here just adding 1 day for mock logic
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
      order_id: null, // Let DB generate it
      user_id: req.user.id, // from verifyToken middleware
      service_id: orderData.service_id || orderData.service_type_id,
      pickup_date: finalPickupDate,
      delivery_date: orderData.delivery_date,
      status: 'PENDING',
      pickupMethod: orderData.pickupMethod,
      returnMethod: orderData.returnMethod,
      address: typeof orderData.address === 'object' ? JSON.stringify(orderData.address) : orderData.address,
      total_price: orderData.total_price || orderData.totalPrice || 0,
      is_overflow_order,
      auto_shifted,
      payment_method: orderData.payment?.method || null,
      payment_status: orderData.payment?.status || 'PENDING',
      notes: orderData.notes || '',
      quantity: orderData.quantity || 1,
      photos: orderData.photos ? JSON.stringify(orderData.photos) : '[]',
      originalPrice: orderData.originalPrice || null,
      discountAmount: orderData.discountAmount || null,
      promo_id: orderData.promo_id || null
    };

    const result = await Order.create(newOrder);
    const orderId = result.insertId;

    try {
      await Order.insertDetail({
        order_id: orderId,
        service_type_id: newOrder.service_id,
        quantity: newOrder.quantity,
        subtotal: newOrder.total_price,
        alamat: newOrder.address,
        pickup_method_id: newOrder.pickupMethod === 'SELF_DROP' ? 1 : 2,
        return_method_id: newOrder.returnMethod === 'SELF_PICKUP' ? 1 : 2,
        dropDate: newOrder.pickup_date,
        pickupDate: newOrder.delivery_date,
        notes: newOrder.notes,
        photoCust: newOrder.photos
      });
    } catch (err) {
      console.error('Failed to insert order details:', err);
    }

    res.status(201).json({ message: 'Order created', data: { ...newOrder, order_id: orderId } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const orderData = req.body;
    // We pass the whole body, the model will pick what it needs
    await Order.update(req.params.id, orderData);
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
