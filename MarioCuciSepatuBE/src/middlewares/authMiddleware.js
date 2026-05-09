const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Ambil token dari header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan atau format salah.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Menyimpan data payload user ke dalam request object
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
};

// Middleware opsional untuk mengecek role admin
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Akses ditolak. Anda bukan admin.' });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin
};
