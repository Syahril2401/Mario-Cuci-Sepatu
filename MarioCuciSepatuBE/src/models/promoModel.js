const db = require('../config/db');

const Promo = {
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM promos');
    return rows;
  },
  getById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM promos WHERE id = ?', [id]);
    return rows[0];
  },
  create: async (data) => {
    const { name, promoCode, percentage, startDate, endDate, status, targetType, targetId } = data;
    const finalCode = name || promoCode || `PROMO-${Date.now()}`;
    const finalStatus = status || 'active';
    const [result] = await db.execute(
      'INSERT INTO promos (promoCode, percentage, startDate, endDate, status, targetType, targetId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [finalCode, percentage, startDate, endDate, finalStatus, targetType, targetId || null]
    );
    return result;
  },
  update: async (id, data) => {
    const { name, promoCode, percentage, startDate, endDate, status, targetType, targetId } = data;
    const finalCode = name || promoCode;
    const [result] = await db.execute(
      'UPDATE promos SET promoCode=?, percentage=?, startDate=?, endDate=?, status=?, targetType=?, targetId=? WHERE id=?',
      [finalCode, percentage, startDate, endDate, status || 'active', targetType, targetId || null, id]
    );
    return result;
  },
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM promos WHERE id=?', [id]);
    return result;
  }
};

module.exports = Promo;
