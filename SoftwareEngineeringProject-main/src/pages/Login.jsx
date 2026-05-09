import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = "Email tidak boleh kosong";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Format email tidak valid";
    if (!password) errors.password = "Password tidak boleh kosong";
    return errors;
  };

  const handleLogin = async (e) => {
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
      const response = await authService.login({ email: email.trim(), password });
      
      const token = response.token || response.access_token;
      const user = response.user || response;
      
      if (!token) {
        throw new Error("Login gagal. Tidak ada token yang diterima.");
      }

      login(user, token);
      
      if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ position: 'relative' }}>
        <button onClick={() => navigate('/')} className="auth-back-btn">
          <ArrowLeft size={18} /> Kembali
        </button>

        <div className="auth-header">
          <div className="auth-logo-icon">👟</div>
          <h2>Selamat Datang</h2>
          <p className="auth-subtitle">Login ke akun Anda</p>
        </div>
        
        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="auth-form" noValidate>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: ''})); }}
              placeholder="Masukkan email"
              className={fieldErrors.email ? 'input-error' : ''}
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
                placeholder="Masukkan password"
                className={fieldErrors.password ? 'input-error' : ''}
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
                <span className="auth-spinner"></span> Masuk...
              </span>
            ) : 'Login'}
          </button>
        </form>
        
        <p className="auth-footer">
          Belum punya akun? <Link to="/register">Daftar</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
