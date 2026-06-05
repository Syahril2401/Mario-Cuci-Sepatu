import React from 'react';

const PageLoader = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#F8FAFC',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <div className="loading-spinner" style={{ 
        width: '40px', 
        height: '40px', 
        border: '3px solid rgba(6, 64, 88, 0.1)', 
        borderTopColor: '#064058', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
