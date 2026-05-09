const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const register = async (req, res) => {
  try {
    const { nama, name, email, password, role } = req.body;
    
    // Gunakan 'nama' jika ada, atau 'name' dari frontend
    const finalNama = nama || name;

    // Validasi input dasar
    if (!finalNama || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Siapkan data user baru
    // Kita cek jika role 'admin' dikirimkan (untuk keperluan testing Anda)
    const roleId = (role === 'admin') ? 1 : 2;

    const newUser = {
      nama: finalNama,
      email,
      password: hashedPassword,
      role_id: roleId
    };

    // Simpan ke database
    const result = await User.create(newUser);

    res.status(201).json({
      message: 'Registrasi berhasil',
      user: {
        id: result.insertId,
        nama: finalNama,
        email,
        role: roleId === 1 ? 'admin' : 'customer'
      }
    });

  } catch (error) {
    console.error('Error saat registrasi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input dasar
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    // Cari user berdasarkan email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Mapping role_id ke string untuk frontend
    const roleString = user.role_id === 1 ? 'admin' : 'customer';

    // Buat JWT Token
    const payload = {
      id: user.user_id,
      email: user.email,
      role: roleString
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });

    // Parse addresses from the address column
    let parsedAddresses = [];
    try {
      if (user.address) parsedAddresses = JSON.parse(user.address);
    } catch(e) {}

    res.status(200).json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: roleString,
        profileImage: user.profileImage || '',
        phone: user.phone || '',
        addresses: parsedAddresses
      }
    });

  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  register,
  login
};
