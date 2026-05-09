import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
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

  const handleLogout = () => {
    setDropdownOpen(false);
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
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <img src={logo} alt="Mario Cuci Sepatu" style={{ height: '40px', objectFit: 'contain' }} />
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
            <button className="dropdown-item logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
