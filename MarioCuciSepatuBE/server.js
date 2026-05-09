require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const promoRoutes = require('./src/routes/promoRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Parsing application/json dengan limit besar untuk gambar base64
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Parsing application/x-www-form-urlencoded

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Route dasar untuk cek status server
app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang di API Mario Booth Cuci Sepatu' });
});

// Middleware penanganan route tidak ditemukan
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Menjalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
