import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, formatOrderId } from '../services/orderService';
import { CheckCircle, ChevronLeft, CreditCard, Smartphone, Check, ShieldCheck, Clock, Info, AlertCircle, X } from 'lucide-react';
import qrisImage from '../assets/qris.png';
import './Pages.css';

const Payment = () => {
  const { order_id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);

  useEffect(() => {
    if (!order_id) {
      navigate('/home');
      return;
    }

    orderService.getOrderById(order_id)
      .then(res => {
        if (res.data) {
          setOrder(res.data);
        } else {
          setError('Order not found.');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to retrieve order.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [order_id, navigate]);

  const handleConfirm = async () => {
    setIsProcessing(true);

    try {
      const updatedOrder = {
        ...order,
        status: 'MENUNGGU_VERIFIKASI',
        payment: {
          method: 'QRIS',
          status: 'PENDING_VERIFICATION',
          confirmedAt: new Date().toISOString()
        }
      };

      await orderService.updateOrder(updatedOrder);
      setOrder(updatedOrder);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      if (err.message === 'STORAGE_FULL') {
        setShowStorageModal(true);
      } else {
        setError('Failed to process payment. Please try again or contact support.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><div className="loading-spinner"></div></div>;
  if (!order && error) return <div className="page-container"><p style={{ color: '#EF4444', textAlign: 'center', marginTop: '2rem' }}>{error}</p></div>;
  if (!order) return <div className="page-container"><p style={{ color: '#EF4444', textAlign: 'center', marginTop: '2rem' }}>Order not found.</p></div>;

  if (isSuccess) {
    return (
      <div className="payment-page" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px' }}>
        {/* Header Navbar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white',
          padding: '16px 20px', display: 'flex', alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: '20px'
        }}>
          <button
            onClick={() => navigate('/home')}
            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={24} color="#1E293B" />
          </button>
          <h3 style={{ margin: '0 auto', fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', transform: 'translateX(-12px)' }}>Payment</h3>
        </div>

        {/* Success Pop-up Modal */}
        <div className="modal-overlay open" style={{ backdropFilter: 'blur(6px)', zIndex: 100 }}>
          <div className="modal-content fade-in" style={{
            borderRadius: '28px', padding: '32px 24px', maxWidth: '340px', textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ backgroundColor: '#F0FDF4', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <ShieldCheck size={48} color="#22C55E" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Konfirmasi Terkirim!</h3>
            <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Terima kasih! Bukti pembayaran Anda telah kami terima dan sedang <strong>menunggu verifikasi oleh Admin</strong>.
            </p>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '24px', border: '1px solid #E2E8F0', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Order ID:</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>{formatOrderId(order)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Status:</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Menunggu Verifikasi</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', borderRadius: '14px', padding: '14px', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#25D366', color: 'white', border: 'none' }}
                onClick={() => {
                  const text = `Halo Admin, saya sudah melakukan pembayaran untuk pesanan dengan Order ID: ${formatOrderId(order)}. Mohon segera diverifikasi.`;
                  window.open(`https://wa.me/6281233981688?text=${encodeURIComponent(text)}`, '_blank');
                  navigate('/home');
                }}
              >
                Konfirmasi via WhatsApp
              </button>

              <button
                style={{ width: '100%', borderRadius: '14px', padding: '14px', fontWeight: 700, fontSize: '0.95rem', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', cursor: 'pointer' }}
                onClick={() => navigate('/home')}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px', position: 'relative', overflow: 'hidden' }}>

      {/* Header Navbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white',
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: '20px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </button>
        <h3 style={{ margin: '0 auto', fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', transform: 'translateX(-12px)' }}>Payment</h3>
      </div>

      <div className="page-container" style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Error Modal */}
        {error && !isSuccess && (
          <div className="modal-overlay open" style={{
            position: 'absolute',
            backdropFilter: 'blur(6px)', zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }}>
            <div className="modal-content fade-in" style={{
              borderRadius: '28px', padding: '32px 24px', maxWidth: '340px', textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              backgroundColor: 'white'
            }}>
              <div style={{ backgroundColor: '#FEF2F2', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <AlertCircle size={48} color="#EF4444" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Terjadi Kesalahan</h3>
              <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                {error}
              </p>
              <button
                className="btn-primary"
                style={{ width: '100%', borderRadius: '14px', padding: '14px', fontWeight: 800, fontSize: '1rem' }}
                onClick={() => setError('')}
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* Title Section */}
        <div className="fade-in delay-1" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>QRIS Payment</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Scan QR untuk menyelesaikan pembayaran</p>
        </div>

        {/* Order Summary Card */}
        <div className="card fade-in delay-2" style={{ padding: '16px', borderRadius: '16px', marginBottom: '16px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '2px' }}>{formatOrderId(order)}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>{order.service || 'Service Layanan'}</h4>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064058' }}>Rp {Number(order.total_price || order.totalPrice || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* QRIS Section */}
        <div className="card fade-in delay-3" style={{ padding: '24px', borderRadius: '16px', textAlign: 'center', marginBottom: '20px', backgroundColor: 'white', border: '1px solid #E2E8F0' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scan QR Code</h4>
          <div className="scale-in" style={{
            backgroundColor: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #F1F5F9',
            display: 'inline-block', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <img
              src={qrisImage}
              alt="QRIS Code"
              style={{ width: '100%', maxWidth: '220px', display: 'block' }}
            />
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', border: '1px solid #E2E8F0' }}>GOPAY</span>
            <span style={{ backgroundColor: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', border: '1px solid #E2E8F0' }}>OVO</span>
            <span style={{ backgroundColor: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', border: '1px solid #E2E8F0' }}>DANA</span>
            <span style={{ backgroundColor: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', border: '1px solid #E2E8F0' }}>LINKAJA</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="fade-in delay-4" style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} color="#064058" /> Petunjuk Pembayaran
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>1</div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>Buka aplikasi e-wallet (GoPay, OVO, dll) atau mobile banking.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>2</div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>Pilih menu <strong>Scan / Bayar</strong> dan arahkan ke QR Code di atas.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>3</div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>Masukkan nominal sesuai total tagihan dan selesaikan pembayaran.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="fade-in delay-5">
          <button
            className="btn-primary btn-click-effect"
            style={{
              width: '100%', height: '52px', borderRadius: '14px',
              fontSize: '1rem', fontWeight: 800,
              boxShadow: '0 6px 20px rgba(6, 64, 88, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="loading-spinner" style={{ margin: 0, width: '18px', height: '18px', borderTopColor: 'white' }}></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>Saya Sudah Bayar</span>
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#059669', fontSize: '0.75rem', fontWeight: 700 }}>
              <ShieldCheck size={14} />
              <span>Pembayaran akan diverifikasi oleh admin</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748B', fontSize: '0.75rem' }}>
              <Clock size={14} />
              <span>Estimasi verifikasi: 1 – 5 menit</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Payment;
