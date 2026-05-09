const db = require('../config/db');

const User = {
  // Mencari user berdasarkan email
  findByEmail: async (email) => {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Mencari user berdasarkan id
  findById: async (id) => {
    try {
      // Menggunakan user_id sesuai skema database asli
      const [rows] = await db.execute('SELECT user_id as id, name as nama, email, address, phone, profileImage, role_id, created_at, updated_at FROM users WHERE user_id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Membuat user baru
  create: async (userData) => {
    const { nama, email, password, role_id } = userData;
    try {
      // user_id adalah auto_increment, jadi tidak perlu dimasukkan manual
      // Menggunakan nama kolom sesuai database: name, email, password, role_id
      const [result] = await db.execute(
        'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
        [nama, email, password, role_id]
      );
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Update profil user (termasuk alamat)
  updateProfile: async (id, data) => {
    const { name, address, phone, profileImage } = data;
    try {
      const [result] = await db.execute(
        'UPDATE users SET name = ?, address = ?, phone = ?, profileImage = ? WHERE user_id = ?',
        [name, address, phone, profileImage, id]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = User;
