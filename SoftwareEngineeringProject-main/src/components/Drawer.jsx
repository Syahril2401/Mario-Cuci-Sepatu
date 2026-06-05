import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, User, Clock, History, Mail, LogOut, X, Phone,
  Settings, ShoppingBag, BarChart2, Package, Tag,
  ChevronRight, TrendingUp, FileText, Wrench, Edit3
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import './Drawer.css';

import { InstagramIcon, WhatsappIcon } from '../components/Icons';

// ─── Nav Config ─────────────────────────────────────────────
const CUSTOMER_GROUPS = [
  {
    label: 'Menu Utama',
    items: [
      { name: 'Beranda', path: '/home', icon: <Home size={20} color="#064058" />, sub: 'Halaman utama' },
      { name: 'Status Pesanan', path: '/order-status', icon: <History size={20} color="#064058" />, sub: 'Lacak pesanan aktif' },
    ],
  },
  {
    label: 'Akun',
    items: [
      { name: 'Profil Saya', path: '/profile', icon: <User size={20} color="#064058" />, sub: 'Kelola akun & alamat' },
      { name: 'Hubungi Kami', path: '/contact', icon: <Phone size={20} color="#064058" />, sub: 'Bantuan & dukungan' },
    ],
  },
];

const ADMIN_GROUPS = [
  {
    label: 'Admin Panel',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: <BarChart2 size={20} color="#064058" />, sub: 'Ringkasan bisnis' },
      { name: 'Kelola Layanan', path: '/admin/services', icon: <Wrench size={20} color="#064058" />, sub: 'Manajemen layanan' },
      { name: 'Kelola Pesanan', path: '/admin/orders', icon: <Package size={20} color="#064058" />, sub: 'Semua pesanan' },
      { name: 'Promo', path: '/admin/promos', icon: <Tag size={20} color="#064058" />, sub: 'Manajemen promo' },
      { name: 'Laporan', path: '/admin/report', icon: <FileText size={20} color="#064058" />, sub: 'Laporan & statistik' },
      { name: 'Edit Landing', path: '/admin/landing', icon: <Edit3 size={20} color="#064058" />, sub: 'Pengaturan halaman utama' },
      { name: 'Pengaturan', path: '/admin/settings', icon: <Settings size={20} color="#064058" />, sub: 'Preferensi & akun' },
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
          <button
            className="drawer-close-btn"
            onClick={toggleDrawer}
            aria-label="Tutup menu"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
            }}
          >
            <X size={18} color="white" />
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
                          <div className="drawer-item-icon" style={{ background: 'rgba(6, 64, 88, 0.08)' }}>
                            {item.icon}
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
                  <div className="drawer-item-icon" style={{ background: 'transparent' }}>🔑</div>
                  <div className="drawer-item-text">
                    <span className="drawer-item-label">Login</span>
                    <span className="drawer-item-sub">Masuk ke akun Anda</span>
                  </div>
                  <ChevronRight size={15} className="drawer-item-arrow" />
                </div>
              </button>
              <button className="drawer-nav-item" onClick={() => handleNavClick('/register')}>
                <div className="drawer-nav-item-inner">
                  <div className="drawer-item-icon" style={{ background: 'transparent' }}>✨</div>
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
            <div className="logout-confirm-icon">
              <LogOut size={32} color="#ef4444" />
            </div>
            <div className="logout-confirm-title">Keluar dari Akun?</div>
            <p className="logout-confirm-sub">
              Kamu akan logout dari akun <strong>{firstName}</strong>.
              Pastikan sudah menyimpan semua yang diperlukan.
            </p>
            <div className="logout-confirm-actions">
              <button className="logout-confirm-no" onClick={() => setShowLogoutConfirm(false)}>
                Batal
              </button>
              <button className="logout-confirm-yes" onClick={handleLogoutConfirm}>
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Drawer;
