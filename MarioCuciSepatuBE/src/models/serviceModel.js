const db = require('../config/db');

const Service = {
  getAll: async () => {
    const [services] = await db.execute('SELECT * FROM services');
    const [promos] = await db.execute('SELECT * FROM promos WHERE status = "active" AND startDate <= CURDATE() AND endDate >= CURDATE()');
    
    return services.map(service => {
      let promo = promos.find(p => p.targetType === 'service' && p.targetId === service.service_id);
      if (!promo) promo = promos.find(p => p.targetType === 'all');

      let discountedPrice = service.price;
      if (promo) {
        const discountAmount = (service.price * promo.percentage) / 100;
        discountedPrice = Math.max(0, service.price - discountAmount);
      }

      return {
        ...service,
        discountedPrice,
        promoInfo: promo || null
      };
    });
  },
  getById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM services WHERE service_id = ?', [id]);
    const service = rows[0];
    if (!service) return null;

    const [promos] = await db.execute('SELECT * FROM promos WHERE status = "active" AND startDate <= CURDATE() AND endDate >= CURDATE()');
    let promo = promos.find(p => p.targetType === 'service' && p.targetId === service.service_id);
    if (!promo) promo = promos.find(p => p.targetType === 'all');

    let discountedPrice = service.price;
    if (promo) {
      const discountAmount = (service.price * promo.percentage) / 100;
      discountedPrice = Math.max(0, service.price - discountAmount);
    }

    return {
      ...service,
      discountedPrice,
      promoInfo: promo || null
    };
  },
  create: async (data) => {
    const { serviceName, description, duration, price, image, type } = data;
    const [result] = await db.execute(
      'INSERT INTO services (serviceName, description, duration, price, image, type) VALUES (?, ?, ?, ?, ?, ?)',
      [serviceName, description, duration, price, image, type || 'sepatu']
    );
    return result;
  },
  update: async (id, data) => {
    const { serviceName, description, duration, price, image, type } = data;
    const [result] = await db.execute(
      'UPDATE services SET serviceName=?, description=?, duration=?, price=?, image=?, type=? WHERE service_id=?',
      [serviceName, description, duration, price, image, type || 'sepatu', id]
    );
    return result;
  },
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM services WHERE service_id=?', [id]);
    return result;
  }
};

module.exports = Service;
