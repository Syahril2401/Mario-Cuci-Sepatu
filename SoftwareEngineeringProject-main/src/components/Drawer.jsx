import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, User, Clock, History, Mail, LogOut, X,
  Settings, ShoppingBag, BarChart2, Package, Tag,
  ChevronRight
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import './Drawer.css';

import { InstagramIcon, WhatsappIcon } from '../components/Icons';

// ─── Nav Config ─────────────────────────────────────────────
const CUSTOMER_GROUPS = [
  {
    label: 'Menu Utama',
    items: [
      { name: 'Beranda', path: '/home', icon: <Home size={20} />, iconBg: '#e0f2fe', sub: 'Halaman utama' },
      { name: 'Status Pesanan', path: '/order-status', icon: <History size={20} />, iconBg: '#fef3c7', sub: 'Lacak pesanan aktif' },
      { name: 'Riwayat', path: '/order-history', icon: <Clock size={20} />, iconBg: '#f0fdf4', sub: 'Semua riwayat pesanan' },
    ],
  },
  {
    label: 'Akun',
    items: [
      { name: 'Profil Saya', path: '/profile', icon: <User size={20} />, iconBg: '#f5f3ff', sub: 'Kelola akun & alamat' },
      { name: 'Hubungi Kami', path: '/contact', icon: <WhatsappIcon size={20} />, iconBg: '#dcfce7', sub: 'Bantuan & dukungan' },
    ],
  },
];

const ADMIN_GROUPS = [
  {
    label: 'Admin Panel',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: '📊', iconBg: '#e0f2fe', sub: 'Ringkasan bisnis' },
      { name: 'Kelola Layanan', path: '/admin/services', icon: '⚙️', iconBg: '#fef3c7', sub: 'Manajemen layanan' },
      { name: 'Kelola Pesanan', path: '/admin/orders', icon: '📦', iconBg: '#f0fdf4', sub: 'Semua pesanan' },
      { name: 'Promo', path: '/admin/promos', icon: '🏷️', iconBg: '#fdf4ff', sub: 'Manajemen promo' },
      { name: 'Laporan', path: '/admin/report', icon: '📈', iconBg: '#fff7ed', sub: 'Laporan & statistik' },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────
const Drawer = ({ isOpen, toggleDrawer }) => {
  const { logout, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const groups = user?.role === 'admin' ? ADMIN_GROUPS : CUSTOMER_GROUPS;
  const firstName = user?.name?.split(' ')[0] || 'Pengguna';

  const handleNavClick = (path) => {
    toggleDrawer();
    navigate(path);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    logout();
    toggleDrawer();
    navigate('/');
  };

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className={`drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={toggleDrawer}
      />

      {/* ── Drawer Panel ── */}
      <div className={`app-drawer ${isOpen ? 'open' : ''}`}>

        {/* ══════════════════════════════
            PROFILE HEADER
        ══════════════════════════════ */}
        <div className="drawer-profile-header">
          {/* Close button */}
          <button className="drawer-close-btn" onClick={toggleDrawer} aria-label="Tutup menu">
            <X size={16} color="white" />
          </button>

          {isAuthenticated ? (
            <>
              {/* Avatar + name */}
              <div className="drawer-avatar-row">
                <div className="drawer-avatar">
                  {user?.profileImage
                    ? <img src={user.profileImage} alt="Foto profil" />
                    : <User size={24} color="#9ca3af" />
                  }
                </div>
                <div className="drawer-user-info">
                  <p className="drawer-user-name">{user?.name || 'Pengguna'}</p>
                  <p className="drawer-user-email">{user?.email || ''}</p>
                </div>
              </div>

              {/* Member badge */}
              <div className="drawer-member-badge">
                ⭐ {user?.role === 'admin' ? 'Admin Panel' : 'Mario Member'}
              </div>

              {/* View profile CTA */}
              {user?.role !== 'admin' && (
                <button
                  className="drawer-profile-btn"
                  onClick={() => handleNavClick('/profile')}
                >
                  <User size={13} />
                  Lihat Profil Saya
                  <ChevronRight size={13} />
                </button>
              )}
            </>
          ) : (
            <div style={{ paddingTop: 32 }}>
              <p className="drawer-user-name">Selamat Datang!</p>
              <p className="drawer-user-email">Login untuk akses penuh</p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════
            SCROLLABLE BODY
        ══════════════════════════════ */}
        <div className="drawer-body">
          {isAuthenticated ? (
            <>
              {groups.map((group, gi) => (
                <div key={gi} className="drawer-group">
                  <div className="drawer-group-label">{group.label}</div>
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        className={`drawer-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleNavClick(item.path)}
                      >
                        <div className="drawer-nav-item-inner">
                          <div className="drawer-item-icon" style={{ background: item.iconBg }}>
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                          </div>
                          <div className="drawer-item-text">
                            <span className="drawer-item-label">{item.name}</span>
                            <span className="drawer-item-sub">{item.sub}</span>
                          </div>
                          <ChevronRight size={15} className="drawer-item-arrow" />
                        </div>
                      </button>
                    );
                  })}
                  {gi < groups.length - 1 && <div className="drawer-divider" />}
                </div>
              ))}
            </>
          ) : (
            <div className="drawer-group">
              <div className="drawer-group-label">Mulai</div>
              <button className="drawer-nav-item" onClick={() => handleNavClick('/login')}>
                <div className="drawer-nav-item-inner">
                  <div className="drawer-item-icon" style={{ background: '#e0f2fe' }}>🔑</div>
                  <div className="drawer-item-text">
                    <span className="drawer-item-label">Login</span>
                    <span className="drawer-item-sub">Masuk ke akun Anda</span>
                  </div>
                  <ChevronRight size={15} className="drawer-item-arrow" />
                </div>
              </button>
              <button className="drawer-nav-item" onClick={() => handleNavClick('/register')}>
                <div className="drawer-nav-item-inner">
                  <div className="drawer-item-icon" style={{ background: '#dcfce7' }}>✨</div>
                  <div className="drawer-item-text">
                    <span className="drawer-item-label">Daftar</span>
                    <span className="drawer-item-sub">Buat akun baru</span>
                  </div>
                  <ChevronRight size={15} className="drawer-item-arrow" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════
            LOGOUT BUTTON
        ══════════════════════════════ */}
        {isAuthenticated && (
          <div className="drawer-logout-area">
            <button className="drawer-logout-btn" onClick={() => setShowLogoutConfirm(true)}>
              <div className="drawer-logout-icon">
                <LogOut size={16} color="#ef4444" />
              </div>
              <span className="drawer-logout-label">Keluar</span>
              <ChevronRight size={15} className="drawer-logout-arrow" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════
            FOOTER
        ══════════════════════════════ */}
        <div className="drawer-footer">
          <div className="drawer-footer-brand">👟 Mario Cuci Sepatu</div>
          <div className="drawer-footer-version">Versi 1.0 · © {new Date().getFullYear()}</div>
          <div className="drawer-footer-socials">
            <button
              className="drawer-social-btn"
              onClick={() => window.open('https://wa.me/6281233981688', '_blank')}
            >
              <WhatsappIcon size={20} />WhatsApp
            </button>
            <button
              className="drawer-social-btn"
              onClick={() => window.open('https://instagram.com/mariocucisepatu', '_blank')}
            >
              <InstagramIcon size={20} /> Instagram
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          LOGOUT CONFIRM MODAL
      ══════════════════════════════ */}
      {showLogoutConfirm && (
        <div
          className="logout-confirm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div className="logout-confirm-card">
            <div className="logout-confirm-icon">🚪</div>
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
    </>
  );
};

export default Drawer;
