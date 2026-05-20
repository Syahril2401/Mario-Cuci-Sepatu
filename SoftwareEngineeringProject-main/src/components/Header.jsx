import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { userService } from '../services/userService';
import './Header.css';
import logo from '../assets/logo.png';

const Header = ({ toggleDrawer }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch latest profile to ensure profileImage is loaded
    if (user && typeof user.profileImage === 'undefined') {
      userService.getProfile().then(res => {
        if (res.data) {
          useAuthStore.getState().login(res.data, useAuthStore.getState().token);
        }
      }).catch(err => console.error("Failed to fetch profile in header", err));
    }
  }, [user]);

  const handleSettings = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const firstName = user?.name?.split(' ')[0] || 'Pengguna';

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  return (
    <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', height: '56px', backgroundColor: 'white', borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button 
          className="menu-btn" 
          onClick={toggleDrawer} 
          aria-label="Open Menu" 
          style={{ 
            background: 'none',
            border: 'none', 
            borderRadius: '12px',
            cursor: 'pointer', 
            width: '40px',
            height: '40px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#064058'
          }}
        >
          <Menu size={24} />
        </button>
      </div>
      
      {/* Profile Dropdown Wrapper */}
      <div className="profile-dropdown-wrapper" ref={dropdownRef}>
        <button
          className="header-avatar-btn"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label="Profile Menu"
        >
          <div className="header-avatar-circle">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={18} color="#9ca3af" />
            )}
          </div>
          <ChevronDown size={14} color="#9ca3af" className={`chevron-icon ${dropdownOpen ? 'open' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="profile-dropdown-menu">
            <div className="dropdown-user-info">
              <div className="dropdown-avatar-small">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <User size={16} color="white" />
                )}
              </div>
              <div>
                <p className="dropdown-name">{user?.name || 'User'}</p>
                <p className="dropdown-email">{user?.email || ''}</p>
              </div>
            </div>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={handleSettings}>
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button className="dropdown-item logout" onClick={() => { setDropdownOpen(false); setShowLogoutConfirm(true); }}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════
          LOGOUT CONFIRM MODAL
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
    </header>
  );
};

export default Header;
