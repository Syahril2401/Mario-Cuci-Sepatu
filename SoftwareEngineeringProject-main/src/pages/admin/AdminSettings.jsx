import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import { User, Settings, Lock, Bell, ChevronRight, Save, Eye, EyeOff } from 'lucide-react';
import './Admin.css';

const AdminSettings = () => {
  const { user } = useAuthStore();
  
  // Local state for settings form
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Validate password if user entered one
      if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
        const errors = {};
        if (!formData.currentPassword) errors.currentPassword = 'Password saat ini harus diisi';
        if (!formData.newPassword) errors.newPassword = 'Password baru harus diisi';
        else if (formData.newPassword.length < 8) errors.newPassword = 'Password baru minimal 8 karakter';
        if (formData.newPassword !== formData.confirmPassword) errors.confirmPassword = 'Konfirmasi password tidak cocok';
        
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setIsLoading(false);
          return;
        }

        // Coba ganti password
        const { userService } = await import('../../services/userService');
        await userService.updatePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
      }

      // Update Profile
      const { userService } = await import('../../services/userService');
      const updatedProfile = await userService.updateProfile({
        name: formData.name
      });

      // Update state in store if necessary, or just local state
      // (user store is assumed to re-fetch on reload or we could update it manually)

      setSuccessMsg('Pengaturan berhasil disimpan!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-root">
      {/* Header */}
      <div className="adm-header adm-fadeUp">
        <div>
          <h2 className="adm-header-title">Pengaturan</h2>
          <p className="adm-header-sub">Kelola akun dan preferensi admin</p>
        </div>
      </div>

      <div className="adm-fade2" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Profile Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <User size={32} color="#94A3B8" />
              )}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#111827', fontWeight: 800 }}>{user?.name || 'Administrator'}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>{user?.email || 'admin@mario.com'}</p>
            <div style={{ marginTop: '8px', display: 'inline-block', background: '#DBEAFE', color: '#1E40AF', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
              Admin Panel
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB' }}>
          {errorMsg && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span> {successMsg}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Section 1: Profil */}
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#064058" /> Data Profil
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="adm-field-label">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="adm-field-input" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="adm-field-label">Email</label>
                  <input 
                    type="email" 
                    className="adm-field-input" 
                    value={formData.email}
                    readOnly
                    style={{ background: '#F9FAFB', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: '#E5E7EB' }}></div>

            {/* Section 2: Keamanan */}
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="#064058" /> Keamanan Akun
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="adm-field-label">Password Saat Ini</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPwd.current ? 'text' : 'password'}
                      className="adm-field-input" 
                      placeholder="Masukkan password saat ini untuk mengubah"
                      value={formData.currentPassword}
                      onChange={(e) => {
                        setFormData({...formData, currentPassword: e.target.value});
                        setFieldErrors(p => ({...p, currentPassword: ''}));
                      }}
                      style={{ paddingRight: '42px', ...(fieldErrors.currentPassword ? { borderColor: '#ef4444' } : {}) }}
                    />
                    <button type="button" onClick={() => setShowPwd(p => ({...p, current: !p.current}))}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex' }}>
                      {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.currentPassword && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.currentPassword}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="adm-field-label">Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPwd.new ? 'text' : 'password'}
                        className="adm-field-input" 
                        placeholder="Minimal 8 karakter"
                        value={formData.newPassword}
                        onChange={(e) => {
                          setFormData({...formData, newPassword: e.target.value});
                          setFieldErrors(p => ({...p, newPassword: ''}));
                        }}
                        style={{ paddingRight: '42px', ...(fieldErrors.newPassword ? { borderColor: '#ef4444' } : {}) }}
                      />
                      <button type="button" onClick={() => setShowPwd(p => ({...p, new: !p.new}))}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex' }}>
                        {showPwd.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.newPassword && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.newPassword}</span>}
                  </div>
                  <div>
                    <label className="adm-field-label">Konfirmasi Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPwd.confirm ? 'text' : 'password'}
                        className="adm-field-input" 
                        placeholder="Ketik ulang password baru"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({...formData, confirmPassword: e.target.value});
                          setFieldErrors(p => ({...p, confirmPassword: ''}));
                        }}
                        style={{ paddingRight: '42px', ...(fieldErrors.confirmPassword ? { borderColor: '#ef4444' } : {}) }}
                      />
                      <button type="button" onClick={() => setShowPwd(p => ({...p, confirm: !p.confirm}))}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex' }}>
                        {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.confirmPassword}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: '#E5E7EB' }}></div>

            {/* Section 3: Notifikasi */}
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="#064058" /> Preferensi Notifikasi
              </h4>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>Notifikasi Pesanan Baru</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Dapatkan peringatan saat ada pesanan masuk</div>
                </div>
                <div style={{ position: 'relative', width: '44px', height: '24px', background: formData.notifications ? '#059669' : '#CBD5E1', borderRadius: '12px', transition: '0.3s' }}>
                  <div style={{ position: 'absolute', top: '2px', left: formData.notifications ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
                  <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={formData.notifications} onChange={() => setFormData({...formData, notifications: !formData.notifications})} />
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="adm-btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem', borderRadius: '10px' }} disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
