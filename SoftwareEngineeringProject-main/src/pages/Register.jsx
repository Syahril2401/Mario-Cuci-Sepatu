import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Nama tidak boleh kosong";
    if (!email.trim()) errors.email = "Email tidak boleh kosong";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Format email tidak valid";
    if (!password) errors.password = "Password tidak boleh kosong";
    else if (password.length < 6) errors.password = "Password minimal 6 karakter";
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({ name: name.trim(), email: email.trim(), password });
      
      // DO NOT auto-login. Show success state then redirect to login.
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-success-state">
            <div className="auth-success-icon">
              <CheckCircle size={40} />
            </div>
            <h2>Akun Berhasil Dibuat!</h2>
            <p>Silakan login menggunakan akun Anda.</p>
            <div className="auth-success-loader">
              <div className="auth-success-bar"></div>
            </div>
            <p className="auth-success-hint">Mengalihkan ke halaman login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ position: 'relative' }}>
        <button onClick={() => navigate('/')} className="auth-back-btn">
          <ArrowLeft size={18} /> Kembali
        </button>

        <div className="auth-header">
          <div className="auth-logo-icon">👟</div>
          <h2>Buat Akun</h2>
          <p className="auth-subtitle">Bergabung dengan Mario Cuci Sepatu</p>
        </div>
        
        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleRegister} className="auth-form" noValidate>
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({...p, name: ''})); }}
              placeholder="Masukkan nama lengkap"
              className={fieldErrors.name ? 'input-error' : ''}
              autoComplete="name"
            />
            {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: ''})); }}
              placeholder="Masukkan email"
              className={fieldErrors.email ? 'input-error' : ''}
              autoComplete="off"
            />
            {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-password-wrap">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: ''})); }}
                placeholder="Buat password (min. 6 karakter)"
                className={fieldErrors.password ? 'input-error' : ''}
                autoComplete="new-password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <span className="field-error-msg">{fieldErrors.password}</span>}
          </div>
          <button type="submit" className="btn-auth-primary" disabled={isLoading}>
            {isLoading ? (
              <span className="auth-loading-state">
                <span className="auth-spinner"></span> Membuat Akun...
              </span>
            ) : 'Daftar Sekarang'}
          </button>
        </form>
        
        <p className="auth-footer">
          Sudah punya akun? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
