const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mario_laundry_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Cek koneksi ke database saat aplikasi berjalan
pool.getConnection()
  .then(connection => {
    console.log('Berhasil terhubung ke database MySQL');
    connection.release();
  })
  .catch(err => {
    console.error('Gagal terhubung ke database:', err.message);
  });

module.exports = pool;
