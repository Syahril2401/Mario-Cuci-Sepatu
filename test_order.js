const db = require('./MarioCuciSepatuBE/src/config/db');
const Order = require('./MarioCuciSepatuBE/src/models/orderModel');

async function test() {
  try {
    const data = {
      user_id: 1,
      service_id: 1,
      pickup_date: '2026-06-10',
      delivery_date: '2026-06-13',
      status: 'PENDING',
      pickupMethod: 'COURIER_PICKUP',
      returnMethod: 'COURIER_DELIVERY',
      address: 'Test Address',
      total_price: 30000,
      is_overflow_order: false,
      auto_shifted: false,
      payment_method: 'QRIS',
      payment_status: 'PENDING',
      notes: 'test',
      quantity: 1,
      photos: JSON.stringify(['dummy']),
      originalPrice: 30000,
      discountAmount: 0,
      promo_id: null,
      order_date: '2026-06-09'
    };
    
    console.log("Trying to insert order...");
    const result = await Order.create(data);
    console.log("Success:", result);
  } catch (err) {
    console.error("DB ERROR:", err);
  } finally {
    process.exit();
  }
}

test();
