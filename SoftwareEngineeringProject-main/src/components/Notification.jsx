import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import '../pages/Pages.css';

const Notification = ({ show, message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (show && type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, type, duration, onClose]);

  if (!show) return null;

  return (
    <div className="notification-overlay" onClick={() => type !== 'loading' && onClose()}>
      <div className="notification-card" onClick={e => e.stopPropagation()}>
        {type === 'loading' ? (
          <div className="loading-spinner"></div>
        ) : type === 'success' ? (
          <div className="notification-icon-container success">
            <CheckCircle size={32} />
          </div>
        ) : (
          <div className="notification-icon-container">
            <AlertCircle size={32} />
          </div>
        )}
        
        <h4>{type === 'loading' ? 'Please Wait' : type === 'success' ? 'Success' : 'Notification'}</h4>
        <p>{message}</p>
        
        {type !== 'loading' && (
          <button 
            onClick={onClose}
            style={{ 
              marginTop: '16px', 
              padding: '8px 24px', 
              backgroundColor: '#064058', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;
