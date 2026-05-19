const db = require('../config/db');

const Promo = {
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM promos');
    return rows;
  },
  getById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM promos WHERE promo_id = ?', [id]);
    return rows[0];
  },
  getByCode: async (code) => {
    const [rows] = await db.execute('SELECT * FROM promos WHERE promoCode = ?', [code]);
    return rows[0];
  },
  create: async (data) => {
    const { promoCode, promoName, percentage, startDate, endDate, status, targetType, targetId } = data;
    const finalCode = promoCode || `PROMO-${Date.now()}`;
    const finalName = promoName || finalCode;
    const finalStatus = status || 'active';
    const [result] = await db.execute(
      'INSERT INTO promos (promoCode, promoName, percentage, startDate, endDate, status, targetType, targetId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [finalCode, finalName, percentage, startDate, endDate, finalStatus, targetType, targetId || null]
    );
    return result;
  },
  update: async (id, data) => {
    const { promoCode, promoName, percentage, startDate, endDate, status, targetType, targetId } = data;
    const [result] = await db.execute(
      'UPDATE promos SET promoCode=?, promoName=?, percentage=?, startDate=?, endDate=?, status=?, targetType=?, targetId=? WHERE promo_id=?',
      [promoCode, promoName, percentage, startDate, endDate, status || 'active', targetType, targetId || null, id]
    );
    return result;
  },
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM promos WHERE promo_id=?', [id]);
    return result;
  }
};

module.exports = Promo;
