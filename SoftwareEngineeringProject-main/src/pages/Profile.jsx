import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { orderService } from '../services/orderService';
import useAuthStore from '../store/authStore';
import {
  Camera, User, MapPin, Phone, Mail, Edit2, Trash2, Plus,
  Navigation, Map as MapIcon, ChevronRight, History,
  Shield, HelpCircle, LogOut, CheckCircle, AlertCircle,
  Star, Package, Clock, ArrowLeft, House
} from 'lucide-react';
import Notification from '../components/Notification';
import MapPicker from '../components/MapPicker';
import './Profile.css';
import { WhatsappIcon } from '../components/Icons';

// ─── Helper ─────────────────────────────────────────────────
const getAddressEmoji = (label = '') => {
  const l = label.toLowerCase();
  if (l.includes('home') || l.includes('rumah')) return '🏠';
  if (l.includes('office') || l.includes('kantor')) return '🏢';
  if (l.includes('campus') || l.includes('kampus')) return '🏫';
  return '📍';
};

const calcCompletion = (profile) => {
  const checks = [
    !!profile.name,
    !!profile.phone,
    !!profile.email,
    !!profile.profileImage,
    !!(profile.addresses && profile.addresses.length > 0),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

// ─── Main Component ─────────────────────────────────────────
const Profile = () => {
  const { user, login, logout } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: '', phone: '', email: '', profileImage: '', addresses: []
  });
  const [orderStats, setOrderStats] = useState({ total: 0, active: 0, completed: 0 });
  const [newAddress, setNewAddress] = useState({ label: '', detail: '', latitude: null, longitude: null });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    userService.getProfile().then(res => {
      const data = res.data;
      setProfile(data);
      // Try to derive order stats from profile if available
      if (data.orders) {
        const completedStatuses = ['RECEIVED', 'READY_DELIVERY', 'READY_PICKUP', 'ON_DELIVERY', 'SUDAH_DIAMBIL', 'FINISHED', 'COMPLETED'];
        const cancelledStatuses = ['CANCELLED'];
        const total = data.orders.length;
        const active = data.orders.filter(o => !completedStatuses.includes(o.status?.toUpperCase()) && !cancelledStatuses.includes(o.status?.toUpperCase())).length;
        const completed = data.orders.filter(o => completedStatuses.includes(o.status?.toUpperCase())).length;
        setOrderStats({ total, active, completed });
      } else {
        // Fallback to fetch from order history
        orderService.getHistory().then(historyRes => {
          const orders = historyRes.data || [];
          const completedStatuses = ['RECEIVED', 'READY_DELIVERY', 'READY_PICKUP', 'ON_DELIVERY', 'SUDAH_DIAMBIL', 'FINISHED', 'COMPLETED'];
          const cancelledStatuses = ['CANCELLED'];
          const total = orders.length;
          const active = orders.filter(o => !completedStatuses.includes(o.status?.toUpperCase()) && !cancelledStatuses.includes(o.status?.toUpperCase())).length;
          const completed = orders.filter(o => completedStatuses.includes(o.status?.toUpperCase())).length;
          setOrderStats({ total, active, completed });
        }).catch(() => {});
      }
    }).catch(() => { });
  }, []);

  /* ─── Handlers ─── */
  const handleUpdate = (e) => {
    e.preventDefault();
    if (profile.phone && !profile.phone.startsWith('08') && !profile.phone.startsWith('+62')) {
      setNotification({ show: true, message: 'Nomor telepon harus diawali dengan 08 atau +62', type: 'error' });
      return;
    }
    setNotification({ show: true, message: 'Menyimpan perubahan...', type: 'loading' });
    userService.updateProfile(profile).then((res) => {
      const currentToken = localStorage.getItem('token');
      if (res.data && currentToken) login(res.data, currentToken);
      setNotification({ show: true, message: 'Profil berhasil diperbarui!', type: 'success' });
    }).catch(() => {
      setNotification({ show: true, message: 'Gagal memperbarui profil.', type: 'error' });
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfile(p => ({ ...p, profileImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleLocationSelect = (location) => {
    setNewAddress(a => ({ ...a, latitude: location.latitude, longitude: location.longitude, detail: location.address }));
  };

  const openAddAddress = () => {
    setNewAddress({ label: '', detail: '', latitude: null, longitude: null });
    setEditingAddressId(null);
    setShowAddAddress(true);
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddress.label || !newAddress.detail) return;
    let updatedAddresses;
    if (editingAddressId) {
      updatedAddresses = profile.addresses.map(a => a.id === editingAddressId ? { ...a, ...newAddress } : a);
    } else {
      const isFirst = !profile.addresses || profile.addresses.length === 0;
      updatedAddresses = [...(profile.addresses || []), { ...newAddress, id: `ADDR-${Date.now()}`, isDefault: isFirst }];
    }
    const updated = { ...profile, addresses: updatedAddresses };
    setProfile(updated);
    setNewAddress({ label: '', detail: '', latitude: null, longitude: null });
    setEditingAddressId(null);
    setShowAddAddress(false);
    userService.updateProfile(updated).then(res => {
      const t = localStorage.getItem('token');
      if (res.data && t) login(res.data, t);
    });
  };

  const handleEditAddress = (addr) => {
    setNewAddress({ label: addr.label, detail: addr.detail, latitude: addr.latitude, longitude: addr.longitude });
    setEditingAddressId(addr.id);
    setShowAddAddress(true);
  };

  const setAsDefault = (id) => {
    const updated = { ...profile, addresses: profile.addresses.map(a => ({ ...a, isDefault: a.id === id })) };
    setProfile(updated);
    userService.updateProfile(updated).then(res => {
      const t = localStorage.getItem('token');
      if (res.data && t) login(res.data, t);
    });
  };

  const deleteAddress = (id) => {
    if (!window.confirm('Hapus alamat ini?')) return;
    const updated = { ...profile, addresses: profile.addresses.filter(a => a.id !== id) };
    setProfile(updated);
    userService.updateProfile(updated).then(res => {
      const t = localStorage.getItem('token');
      if (res.data && t) login(res.data, t);
    });
  };

  const openInMaps = (lat, lng) => {
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`, '_blank');
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  /* ─── Computed ─── */
  const completion = calcCompletion(profile);
  const firstName = profile.name?.split(' ')[0] || 'Pengguna';

  const QUICK_MENU = [
    { icon: <History size={20} color="#0284c7" />, bg: '#e0f2fe', title: 'Riwayat Pesanan', sub: 'Lihat semua pesanan Anda', action: () => navigate('/order-history') },
    { icon: <Package size={20} color="#d97706" />, bg: '#fef3c7', title: 'Status Pesanan', sub: 'Lacak pesanan aktif', action: () => navigate('/order-status') },
    { icon: <WhatsappIcon size={20} />, bg: '#dcfce7', title: 'Hubungi Kami', sub: 'Bantuan & dukungan pelanggan', action: () => navigate('/contact') },
  ];

  /* ─── Render ─── */
  return (
    <div className="profile-root">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(n => ({ ...n, show: false }))}
      />

      {/* ══════════════════════════════════
          1. HERO HEADER
      ══════════════════════════════════ */}
      <div className="profile-hero anim-fade">
        {/* Back button */}
        <button
          className="profile-back-btn"
          onClick={() => navigate('/home')}
        >
          <ArrowLeft size={16} color="white" />
        </button>
        <div className="profile-hero-content">
          {/* Avatar */}
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-ring" onClick={() => fileInputRef.current?.click()}>
              <div className="profile-avatar-inner">
                {profile.profileImage
                  ? <img src={profile.profileImage} alt="Foto Profil" />
                  : <User size={38} color="#9ca3af" />
                }
              </div>
            </div>
            <button className="profile-camera-btn" onClick={() => fileInputRef.current?.click()}>
              <Camera size={13} color="#064058" />
            </button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
          </div>

          <h1 className="profile-hero-name">{profile.name || 'Nama Pengguna'}</h1>
          <p className="profile-hero-email">{profile.email || 'email@contoh.com'}</p>

          <div className="profile-member-badge">
            ⭐ Mario Member
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          2. STATS CARD (overlapping)
      ══════════════════════════════════ */}
      <div className="profile-stats-card anim-fade-2">
        <div className="profile-stat-item">
          <div className="profile-stat-icon-wrap">
            <Package size={18} color="#064058" />
          </div>
          <span className="profile-stat-val">{orderStats.total}</span>
          <span className="profile-stat-label">Total Pesanan</span>
        </div>
        <div className="profile-stat-item">
          <div className="profile-stat-icon-wrap">
            <History size={18} color="#064058" />
          </div>
          <span className="profile-stat-val">{orderStats.active}</span>
          <span className="profile-stat-label">Sedang Proses</span>
        </div>
        <div className="profile-stat-item">
          <div className="profile-stat-icon-wrap">
            <CheckCircle size={18} color="#064058" />
          </div>
          <span className="profile-stat-val">{orderStats.completed}</span>
          <span className="profile-stat-label">Selesai</span>
        </div>
      </div>

      {/* ══════════════════════════════════
          3. PROFILE COMPLETION
      ══════════════════════════════════ */}
      <div className="profile-completion-card anim-fade-3">
        <div className="profile-completion-header">
          <span className="profile-completion-label">Kelengkapan Profil</span>
          <span className="profile-completion-pct">{completion}%</span>
        </div>
        <div className="profile-progress-track">
          <div className="profile-progress-fill" style={{ width: `${completion}%` }} />
        </div>
        <div className="profile-completion-hints">
          <span className={`profile-hint-chip ${profile.name ? 'done' : 'missing'}`}>
            {profile.name ? '✓' : '!'} Nama
          </span>
          <span className={`profile-hint-chip ${profile.phone ? 'done' : 'missing'}`}>
            {profile.phone ? '✓' : '!'} Telepon
          </span>
          <span className={`profile-hint-chip ${profile.profileImage ? 'done' : 'missing'}`}>
            {profile.profileImage ? '✓' : '!'} Foto
          </span>
          <span className={`profile-hint-chip ${profile.addresses?.length > 0 ? 'done' : 'missing'}`}>
            {profile.addresses?.length > 0 ? '✓' : '!'} Alamat
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════
          4. PERSONAL INFORMATION
      ══════════════════════════════════ */}
      <div className="profile-section-card anim-fade-3">
        <div className="profile-section-header">
          <div className="profile-section-icon" style={{ background: 'rgba(6, 64, 88, 0.08)' }}>
            <User size={18} color="#064058" />
          </div>
          <span className="profile-section-title">Informasi Pribadi</span>
        </div>

        <form onSubmit={handleUpdate}>
          <div className="profile-form-body">
            {/* Name */}
            <div className="profile-field">
              <label className="profile-field-label">Nama Lengkap</label>
              <div className="profile-input-wrap">
                <User size={16} className="profile-input-icon" />
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="profile-field">
              <label className="profile-field-label">Nomor Telepon</label>
              <div className="profile-input-wrap">
                <Phone size={16} className="profile-input-icon" />
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={profile.phone || ''}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div className="profile-field">
              <label className="profile-field-label">Email</label>
              <div className="profile-input-wrap" style={{ opacity: 0.75 }}>
                <Mail size={16} className="profile-input-icon" />
                <span className="profile-input-readonly">{profile.email || '-'}</span>
              </div>
            </div>

            <button type="submit" className="profile-save-btn">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>

      {/* ══════════════════════════════════
          5. ADDRESSES
      ══════════════════════════════════ */}
      <div className="profile-section-card anim-fade-3">
        <div className="profile-section-header">
          <div className="profile-section-icon" style={{ background: 'rgba(6, 64, 88, 0.08)' }}>
            <MapPin size={18} color="#064058" />
          </div>
          <span className="profile-section-title">Alamat Saya</span>
          <button className="profile-section-action-btn" onClick={openAddAddress}>
            <Plus size={13} /> Tambah
          </button>
        </div>

        {(!profile.addresses || profile.addresses.length === 0) ? (
          <div className="address-empty-state">
            <span className="address-empty-icon">📍</span>
            <div className="address-empty-title">Belum Ada Alamat</div>
            <p className="address-empty-sub">
              Tambahkan alamat untuk mempercepat proses pemesanan Anda.
            </p>
            <button className="address-empty-btn" onClick={openAddAddress}>
              <Plus size={14} /> Tambah Alamat
            </button>
          </div>
        ) : (
          <div className="address-list">
            {profile.addresses.map(addr => (
              <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                <div className="address-card-top">
                  <div className="address-card-label-row">
                    <House size={14} color="#064058" />
                    <span className="address-label-text">{addr.label}</span>
                    {addr.isDefault && <span className="address-default-badge">UTAMA</span>}
                  </div>
                  <div className="address-action-btns">
                    <button className="addr-icon-btn" onClick={() => handleEditAddress(addr)} title="Edit">
                      <Edit2 size={13} color="#6b7280" />
                    </button>
                    <button className="addr-icon-btn danger" onClick={() => deleteAddress(addr.id)} title="Hapus">
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                </div>

                <p className="address-detail-text">{addr.detail}</p>

                <div className="address-card-footer">
                  {!addr.isDefault && (
                    <button className="addr-text-btn primary" onClick={() => setAsDefault(addr.id)}>
                      <CheckCircle size={12} /> Jadikan Utama
                    </button>
                  )}
                  {addr.latitude && addr.longitude && (
                    <button className="addr-text-btn blue" onClick={() => openInMaps(addr.latitude, addr.longitude)}>
                      <MapIcon size={12} /> Lihat Peta
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Removed Quick Menu Section */}

      {/* ══════════════════════════════════
          7. ACCOUNT / LOGOUT
      ══════════════════════════════════ */}
      <div className="profile-section-card anim-fade-3" style={{ marginTop: 12 }}>
        <div className="profile-section-header">
          <div className="profile-section-icon" style={{ background: 'rgba(6, 64, 88, 0.08)' }}>
            <Shield size={18} color="#064058" />
          </div>
          <span className="profile-section-title">Akun</span>
        </div>
        <div className="profile-menu-list">
          <button className="profile-menu-item logout-item" onClick={() => setShowLogoutConfirm(true)}>
            <div className="menu-item-icon" style={{ background: 'rgba(6, 64, 88, 0.08)' }}>
              <LogOut size={16} color="#064058" />
            </div>
            <div className="menu-item-text">
              <div className="menu-item-title">Keluar</div>
              <div className="menu-item-sub">Logout dari akun ini</div>
            </div>
            <ChevronRight size={16} className="menu-item-arrow" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════
          8. ADD/EDIT ADDRESS BOTTOM SHEET
      ══════════════════════════════════ */}
      {showAddAddress && (
        <div className="addr-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddAddress(false); }}>
          <div className="addr-modal-sheet">
            <div className="addr-modal-handle" />
            <h2 className="addr-modal-title">
              {editingAddressId ? 'Edit Alamat' : 'Tambah Alamat Baru'}
            </h2>

            <form onSubmit={handleAddAddress}>
              <div className="addr-modal-field">
                <label className="addr-modal-label">Label Alamat</label>
                <input
                  type="text"
                  className="addr-modal-input"
                  placeholder="Contoh: Rumah, Kantor, Kampus"
                  value={newAddress.label}
                  onChange={e => setNewAddress(a => ({ ...a, label: e.target.value }))}
                  required
                />
              </div>

              <div className="addr-modal-field">
                <label className="addr-modal-label">Pilih Lokasi di Peta</label>
                <MapPicker
                  onLocationSelect={handleLocationSelect}
                  initialLocation={editingAddressId ? { lat: newAddress.latitude, lng: newAddress.longitude } : null}
                />
              </div>

              <div className="addr-modal-field">
                <label className="addr-modal-label">Detail Alamat Lengkap</label>
                <textarea
                  className="addr-modal-textarea"
                  rows="3"
                  placeholder="Pilih di peta atau ketik manual..."
                  value={newAddress.detail}
                  onChange={e => setNewAddress(a => ({ ...a, detail: e.target.value }))}
                  required
                />
              </div>

              <div className="addr-modal-actions">
                <button type="submit" className="addr-modal-submit">
                  {editingAddressId ? 'Perbarui' : 'Simpan Alamat'}
                </button>
                <button type="button" className="addr-modal-cancel" onClick={() => setShowAddAddress(false)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          8. LOGOUT CONFIRM MODAL
      ══════════════════════════════════ */}
      {showLogoutConfirm && (
        <div
          className="logout-confirm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div className="logout-confirm-card">
            <div className="logout-confirm-icon">
              <LogOut size={32} color="#ef4444" />
            </div>
            <div className="logout-confirm-title">Keluar dari Akun?</div>
            <p className="logout-confirm-sub">
              Kamu akan logout dari akun <strong>{firstName}</strong>.
              Pastikan sudah menyimpan semua yang diperlukan.
            </p>
            <div className="logout-confirm-actions">
              <button className="logout-confirm-yes" onClick={handleLogoutConfirm}>
                Ya, Keluar
              </button>
              <button className="logout-confirm-no" onClick={() => setShowLogoutConfirm(false)}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
