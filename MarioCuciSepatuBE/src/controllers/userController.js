const User = require('../models/userModel');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let parsedAddresses = [];
    try {
      if (user.address) parsedAddresses = JSON.parse(user.address);
    } catch (e) {
      // ignore
    }

    // Kembalikan data user tanpa password atau info sensitif lain (karena password sudah tidak ikut di select query)
    res.json({
      data: {
        id: user.id,
        nama: user.nama,
        name: user.nama, // alias untuk frontend
        email: user.email,
        phone: user.phone || '',
        profileImage: user.profileImage || '',
        addresses: parsedAddresses,
        role_id: user.role_id
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, addresses, profileImage } = req.body;
    
    // Data yang dikirim dari frontend bisa berupa 'nama' atau 'name'
    const finalName = name || req.body.nama;
    
    await User.updateProfile(req.user.id, {
      name: finalName,
      phone: phone || '',
      profileImage: profileImage || '',
      address: addresses ? JSON.stringify(addresses) : '[]'
    });

    res.json({
      message: 'Profile updated successfully',
      data: {
        name: finalName,
        phone: phone || '',
        profileImage: profileImage || '',
        addresses: addresses || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
