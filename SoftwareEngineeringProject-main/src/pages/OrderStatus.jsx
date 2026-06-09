import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  orderService, getStatusFlow, getStatusColor,
  STATUS_LABELS, STATUS_DESCRIPTIONS, formatOrderId
} from '../services/orderService';
import {
  Package, Clock, ChevronDown, Truck, UserCheck,
  CheckCircle, Check, MapPin, Camera, X,
  ArrowLeft, ShoppingCart, Navigation, AlertCircle
} from 'lucide-react';
import './Pages.css';

// ─── Helpers ────────────────────────────────────────────────
const pickupMethodLabel = (m) => m === 'SELF_DROP' ? '🚶 Diantar Sendiri' : '🏍 Dijemput Admin';
const returnMethodLabel = (m) => m === 'SELF_PICKUP' ? '🏪 Ambil di Toko' : '🚚 Diantar ke Rumah';

const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  : null;
const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Timeline Component ──────────────────────────────────────
const CROSS_FLOW_MAP = {
  'WAITING_PICKUP':    'WAITING_DROP_OFF',
  'WAITING_DROP_OFF':  'WAITING_PICKUP',
  'PICKED_UP_BY_ADMIN':'STORE_RECEIVED',
  'STORE_RECEIVED':    'PICKED_UP_BY_ADMIN',
};

const normalizeStatusForFlow = (rawStatus, flow) => {
  let s = rawStatus === 'PENDING' ? 'WAITING_VERIFICATION' : rawStatus;
  if (!flow.includes(s)) {
    const alt = CROSS_FLOW_MAP[s];
    if (alt && flow.includes(alt)) s = alt;
  }
  return s;
};

const StatusTimeline = ({ currentStatus, history, orderFlow, onImageClick, createdAt }) => {
  const steps = orderFlow || [];
  const raw = (currentStatus || '').toUpperCase();
  const current = normalizeStatusForFlow(raw, steps);
  const currentIdx = steps.indexOf(current);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === steps.length - 1;
        const histItem = history?.find(h => h.status === step);
        const timeToShow = histItem ? histItem.time : (step === 'PENDING' ? createdAt : null);

        return (
          <div key={step} style={{ display: 'flex', gap: 12, minHeight: 48 }}>
            {/* Dot + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 24 }}>
              <div style={{
                width: isCurrent ? 22 : 18,
                height: isCurrent ? 22 : 18,
                borderRadius: '50%',
                backgroundColor: isCompleted ? '#064058' : isCurrent ? '#064058' : '#e2e8f0',
                border: isCurrent ? '3px solid #c7e8f5' : '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isCurrent ? '0 0 0 4px rgba(6,64,88,0.12)' : 'none',
                zIndex: 2, flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                {(isCompleted || isCurrent) && <Check size={10} color="white" strokeWidth={3} />}
              </div>
              {!isLast && (
                <div style={{
                  width: 2, flex: 1,
                  background: idx < currentIdx ? '#064058' : '#e2e8f0',
                  margin: '3px 0',
                  minHeight: 20,
                }} />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1, paddingTop: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: isCurrent ? 800 : isCompleted ? 600 : 500,
                  color: isCurrent ? '#064058' : isCompleted ? '#1e293b' : '#94a3b8',
                  lineHeight: 1.3,
                }}>
                  {STATUS_LABELS[step] || step}
                </span>
                {timeToShow && (
                  <span style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                    🕒 {fmtDate(timeToShow)}, {fmtTime(timeToShow)}
                  </span>
                )}
              </div>
              {isCurrent && (
                <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#6b7280', lineHeight: 1.5 }}>
                  {STATUS_DESCRIPTIONS[step]}
                </p>
              )}
              {histItem && histItem.note && (
                <div style={{ marginTop: 6, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #064058' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#475569', fontStyle: 'italic' }}>"{histItem.note}"</p>
                </div>
              )}
              {histItem && histItem.proof_image && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onImageClick) onImageClick(histItem.proof_image);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(6,64,88,0.06)', border: '1px solid rgba(6,64,88,0.15)', color: '#064058',
                      padding: '4px 10px', borderRadius: 14, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    <Camera size={12} /> Lihat Foto Bukti
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Detail Bottom Sheet ─────────────────────────────────────
const DetailSheet = ({ order, onClose, onImageClick, onUploadProof, onFinish }) => {
  const [isUploading, setIsUploading] = useState(false);

  if (!order) return null;
  const colors = getStatusColor(order.status);
  const flow = getStatusFlow(order);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('Maksimal 5MB');

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > 800 || height > 800) {
          if (width > height) { height *= 800 / width; width = 800; }
          else { width *= 800 / height; height = 800; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        onUploadProof(order.order_id, base64).finally(() => setIsUploading(false));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 200,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'white',
        width: '100%', maxWidth: 480,
        borderRadius: '24px 24px 0 0',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)',
      }}>
        {/* ── Sticky header ── */}
        <div style={{
          background: colors.bg,
          padding: '16px 20px 14px',
          borderRadius: '24px 24px 0 0',
          flexShrink: 0,
        }}>
          <div style={{ width: 40, height: 4, background: 'rgba(0,0,0,0.12)', borderRadius: 2, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: colors.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Status Pesanan
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 16, fontWeight: 800, color: colors.text }}>
                {STATUS_LABELS[order.status] || order.status}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11.5, color: colors.text, opacity: 0.75, lineHeight: 1.4 }}>
                {STATUS_DESCRIPTIONS[order.status]}
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.08)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              flexShrink: 0, marginLeft: 12,
            }}>
              <X size={16} color={colors.text} />
            </button>
          </div>
          {/* Method chips */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, background: 'rgba(0,0,0,0.08)', color: colors.text, padding: '3px 10px', borderRadius: 20 }}>
              {pickupMethodLabel(order.pickupMethod)}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, background: 'rgba(0,0,0,0.08)', color: colors.text, padding: '3px 10px', borderRadius: 20 }}>
              {returnMethodLabel(order.returnMethod)}
            </span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px 0' }}>

          {/* Activity Timeline with Timestamps */}
          <section style={{ marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color="#064058" /> Riwayat Aktivitas
            </h4>
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 12px', border: '1px solid #f0f0f0' }}>
              {/* Order created */}
              {(order.order_date || order.created_at) && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#064058', marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#111827' }}>Pesanan Dibuat</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>{new Date(order.order_date || order.created_at).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )}
              {/* History entries */}
              {order.history?.filter(h => h.time).map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < (order.history?.filter(h2 => h2.time).length - 1) ? 10 : 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0a7da8', marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#111827' }}>{STATUS_LABELS[h.status] || h.status}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>{new Date(h.time).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    {h.note && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#475569', fontStyle: 'italic' }}>📝 {h.note}</p>}
                  </div>
                </div>
              ))}
              {(!order.history || order.history.filter(h => h.time).length === 0) && !order.created_at && (
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Belum ada riwayat aktivitas</p>
              )}
            </div>
          </section>

          {/* Tracking Timeline */}
          <section style={{ marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="#064058" /> Lacak Pesanan
            </h4>
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: '16px 14px', border: '1px solid #f0f0f0' }}>
              <StatusTimeline currentStatus={order.status} history={order.history} orderFlow={flow} onImageClick={onImageClick} createdAt={order.created_at} />
            </div>
          </section>

          {/* Logistics Info */}
          <section style={{ background: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 20, border: '1px solid #f0f0f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={15} color="#064058" /> Info Pengiriman
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Metode Antar</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{pickupMethodLabel(order.pickupMethod)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Metode Kembali</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{returnMethodLabel(order.returnMethod)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Est. Selesai</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#064058' }}>{fmtDate(order.delivery_date) || 'N/A'}</span>
              </div>
              {order.address?.detail && (
                <div style={{ paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                  <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.3 }}>Alamat</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>{order.address.detail}</p>
                </div>
              )}
            </div>
          </section>

          {/* All Proof Photos */}
          {(order.photo || order.pickup_photo || order.received_photo || order.proof_image || order.delivery_photo) && (
            <section style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Camera size={15} color="#064058" /> Bukti Foto
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { photo: order.photo, time: order.created_at || order.updated_at, label: '📸 Saat Checkout' },
                  { photo: order.pickup_photo, time: order.pickup_photo_time || order.updated_at, label: '📸 Bukti Penjemputan' },
                  { photo: order.received_photo, time: order.received_photo_time || order.updated_at, label: '📸 Diterima di Toko' },
                  { photo: order.proof_image, time: order.proof_image_time || order.updated_at, label: '📸 Bukti Selesai Cuci' },
                  { photo: order.delivery_photo, time: order.delivery_photo_time || order.updated_at, label: order.returnMethod === 'SELF_PICKUP' ? '📸 Bukti Pengambilan' : '📸 Bukti Pengantaran' },
                ].filter(p => p.photo).map((p, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #f0f0f0', borderRadius: 14, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#064058' }}>{p.label}</span>
                      {p.time && <span style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(p.time).toLocaleString('id-ID')}</span>}
                    </div>
                    <img
                      src={p.photo} alt={p.label}
                      onClick={() => { if (onImageClick) onImageClick(p.photo); }}
                      style={{ width: '100%', borderRadius: 10, height: 160, objectFit: 'cover', cursor: 'pointer' }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Service Summary */}
          <section style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.3 }}>Layanan</p>
                <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 800, color: '#064058' }}>{order.service || 'Service Layanan'}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{order.quantity || 1} Pasang · {order.type}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Total</p>
                <p style={{ margin: '3px 0 0', fontSize: 16, fontWeight: 900, color: '#064058' }}>
                  Rp {Number(order.total_price || order.totalPrice || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ── Sticky footer ── */}
        <div style={{ padding: '12px 20px 24px', flexShrink: 0, borderTop: '1px solid #f3f4f6' }}>
          {(order.status === 'READY_PICKUP' || order.status === 'ON_DELIVERY') ? (
            <label style={{
              display: 'flex', width: '100%', height: 50, borderRadius: 14,
              background: '#059669', color: 'white', border: 'none',
              fontWeight: 800, fontSize: 14, cursor: isUploading ? 'not-allowed' : 'pointer',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: isUploading ? 0.7 : 1
            }}>
              {isUploading ? <span className="spinner-small" style={{ borderTopColor: 'white' }}></span> : <Camera size={18} />}
              {isUploading ? 'Mengupload...' : (order.status === 'READY_PICKUP' ? 'Upload Bukti Pengambilan' : 'Upload Bukti Diterima')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} disabled={isUploading} />
            </label>
          ) : (order.status === 'RECEIVED' || order.status === 'CUSTOMER_PICKED_UP' || order.status === 'DELIVERED') ? (
            <button onClick={(e) => { if (onFinish) onFinish(e); }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', height: 50, borderRadius: 14,
              background: '#10b981', color: 'white', border: 'none',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}>
              <CheckCircle size={18} /> Selesaikan Pesanan
            </button>
          ) : (
            <button onClick={onClose} style={{
              width: '100%', height: 50, borderRadius: 14,
              background: '#064058', color: 'white', border: 'none',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}>
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const OrderStatus = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [showFinishModal, setShowFinishModal] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [filterTab, setFilterTab] = useState(location.state?.tab || 'Semua');

  const [isUpdating, setIsUpdating] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = () => {
    orderService.getHistory().then(res => setActiveOrders(res.data));
  };

  const handleUploadProof = async (orderId, base64) => {
    try {
      const order = activeOrders.find(o => o.order_id === orderId);
      if (!order) return;
      const nextStatus = order.status === 'ON_DELIVERY' ? 'RECEIVED' : 'CUSTOMER_PICKED_UP';
      const updatedOrder = { ...order, delivery_photo: base64, status: nextStatus };
      await orderService.updateOrder(updatedOrder);
      fetchOrders();
      setSelectedOrder(null);
    } catch (e) {
      alert('Gagal mengupload bukti: ' + e.message);
    }
  };

  const handleConfirmReceived = (order, e) => {
    if (e) e.stopPropagation();
    setShowFinishModal(order);
  };

  const confirmFinishOrder = async () => {
    if (!showFinishModal) return;
    setIsUpdating(true);
    try {
      await orderService.updateOrder({ ...showFinishModal, status: 'FINISHED', customer_confirmed: true });
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
      setShowFinishModal(null);
    }
  };

  const confirmCancelOrder = async () => {
    if (!showCancelModal) return;
    setIsUpdating(true);
    try {
      await orderService.deleteOrder(showCancelModal);
      fetchOrders();
    } catch (err) {
      alert('Gagal membatalkan pesanan');
    } finally {
      setIsUpdating(false);
      setShowCancelModal(null);
    }
  };

  const TAB_FILTERS = {
    'Semua': () => true,
    'Pending': o => o.status === 'PENDING' || o.status === 'WAITING_VERIFICATION',
    'Proses': o => ['PROCESSING', 'AWAITING_DROP_OFF', 'ANTRI', 'WAITING_PICKUP', 'PICKED_UP_BY_ADMIN', 'WAITING_DROP_OFF', 'STORE_RECEIVED', 'READY_PICKUP', 'CUSTOMER_PICKED_UP', 'ON_DELIVERY'].includes(o.status),
    'Selesai': o => ['RECEIVED', 'READY_DELIVERY', 'FINISHED', 'COMPLETED'].includes(o.status),
    'Dibatalkan': o => o.status === 'CANCELLED'
  };

  const STATUS_PRIORITY = {
    'PENDING': 1,
    'WAITING_VERIFICATION': 2,
    'MENUNGGU_VERIFIKASI': 2,

    'WAITING_PICKUP': 3,
    'PICKED_UP_BY_ADMIN': 4,
    'BARANG_DIAMBIL': 4,
    'AWAITING_DROP_OFF': 5,
    'ANTRI': 5,
    'PROCESSING': 6,
    'STORE_RECEIVED': 7,
    'BARANG_DITERIMA': 7,
    'WAITING_DROP_OFF': 8,
    'MENUNGGU_PENGANTARAN': 8,

    'READY_PICKUP': 9,
    'READY_DELIVERY': 10,
    'ON_DELIVERY': 11,
    'CUSTOMER_PICKED_UP': 12,
    'SUDAH_DIAMBIL': 12,
    'RECEIVED': 13,
    'FINISHED': 14,
    'COMPLETED': 15,

    'CANCELLED': 99
  };

  const filteredOrders = activeOrders.filter(TAB_FILTERS[filterTab] || (() => true)).sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.status] || 50;
    const priorityB = STATUS_PRIORITY[b.status] || 50;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Sort by order_id descending if priority is the same
    return b.order_id - a.order_id;
  });

  return (
    <>
      {/* Inject slideUpSheet keyframe and hover effects */}
      <style>{`
        @keyframes slideUpSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .cancel-order-btn:hover { background: #FEE2E2 !important; transform: scale(0.98); }
        .cancel-modal-btn-no:hover { background: #E5E7EB !important; transform: scale(0.96); }
        .cancel-modal-btn-yes:hover { background: #DC2626 !important; transform: scale(0.96); }
      `}</style>

      <div className="page-container" style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 80px', backgroundColor: '#f4f7fb', minHeight: '100vh' }}>

        {/* ── Page Header with back button ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, paddingBottom: 4, marginBottom: 16 }}>
          <button
            onClick={() => navigate('/home')}
            style={{ width: 36, height: 36, borderRadius: 12, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color="#064058" />
          </button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#064058', flex: 1 }}>Status Pesanan</h2>
        </div>

        {/* ── Filter Tabs ── */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, scrollbarWidth: 'none' }}>
          {Object.keys(TAB_FILTERS).map(tab => (
            <button key={tab} onClick={() => setFilterTab(tab)} style={{
              padding: '7px 16px', borderRadius: 20, border: 'none',
              fontSize: 12.5, fontWeight: filterTab === tab ? 700 : 500,
              background: filterTab === tab ? '#064058' : 'white',
              color: filterTab === tab ? 'white' : '#6b7280',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              flexShrink: 0,
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Empty state ── */}
        {filteredOrders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 16px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#e8f4fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={30} color="#064058" />
            </div>
            <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: 15 }}>Tidak ada pesanan</p>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>Belum ada pesanan aktif untuk tab ini.</p>
            <button onClick={() => navigate('/checkout')} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, background: '#064058', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <ShoppingCart size={15} /> Order Sekarang
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredOrders.map(order => {
              const isExpanded = expandedId === order.order_id;
              const colors = getStatusColor(order.status);
              const flow = getStatusFlow(order);
              const rawStatus = (order.status || '').toUpperCase();
              const normalizedStatus = normalizeStatusForFlow(rawStatus, flow);
              const currentIdx = flow.indexOf(normalizedStatus);
              const safeIdx = currentIdx === -1 ? 0 : currentIdx;
              const progress = flow.length > 1 ? Math.round((safeIdx / (flow.length - 1)) * 100) : 0;

              return (
                <div key={order.order_id}
                  style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {formatOrderId(order)}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                        {order.service || 'Service Layanan'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: colors.bg, color: colors.text }}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>
                        <ChevronDown size={18} color="#9ca3af" />
                      </div>
                    </div>
                  </div>

                  {/* Method row */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#6b7280', background: '#f4f7fb', padding: '3px 8px', borderRadius: 20 }}>
                      {pickupMethodLabel(order.pickupMethod)}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#6b7280', background: '#f4f7fb', padding: '3px 8px', borderRadius: 20 }}>
                      {returnMethodLabel(order.returnMethod)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #064058, #0a7da8)', transition: 'width 0.5s ease', borderRadius: 3 }} />
                  </div>

                  {/* Date + confirm */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 11.5 }}>
                      <Clock size={12} /> Est. Selesai: <strong style={{ color: '#374151' }}>{fmtDate(order.delivery_date) || 'N/A'}</strong>
                    </div>
                  </div>

                  {/* Selesaikan Pesanan — always visible for actionable statuses */}
                  {(['RECEIVED', 'CUSTOMER_PICKED_UP', 'DELIVERED'].includes(order.status)) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleConfirmReceived(order, e); }}
                      style={{
                        width: '100%', marginTop: 10, padding: '11px 0', borderRadius: 12,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', border: 'none',
                        fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                      }}
                    >
                      <CheckCircle size={16} /> Selesaikan Pesanan
                    </button>
                  )}

                  {/* Expanded timeline */}
                  {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 12px', marginBottom: 12 }}>
                        <StatusTimeline currentStatus={order.status} history={order.history} orderFlow={flow} onImageClick={setLightboxImage} createdAt={order.created_at} />
                      </div>

                      {/* Timestamps info */}
                      {(order.order_date || order.created_at) && (
                        <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '10px 12px', marginBottom: 10, border: '1px solid #bae6fd' }}>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>Waktu Pesanan</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#374151' }}>
                            📅 Dibuat: <strong>{new Date(order.order_date || order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                          </p>
                          {order.history?.filter(h => h.time).map((h, i) => (
                            <p key={i} style={{ margin: '3px 0 0', fontSize: 12, color: '#374151' }}>
                              🔄 {STATUS_LABELS[h.status] || h.status}: <strong>{new Date(h.time).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                            </p>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                        style={{ width: '100%', padding: 12, borderRadius: 12, border: '1.5px solid #064058', background: 'white', color: '#064058', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Lihat Detail Lengkap
                      </button>

                      {(['RECEIVED', 'CUSTOMER_PICKED_UP', 'DELIVERED'].includes(order.status)) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleConfirmReceived(order, e); }}
                          style={{
                            width: '100%', marginTop: 8, padding: 12, borderRadius: 12,
                            background: '#10b981', color: 'white', border: 'none',
                            fontSize: 13, fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                        >
                          <CheckCircle size={16} /> Selesaikan Pesanan
                        </button>
                      )}

                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/payment/${order.order_id}`); }}
                            style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, background: '#064058', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Bayar Sekarang
                          </button>
                          <button
                            className="cancel-order-btn"
                            onClick={(e) => { e.stopPropagation(); setShowCancelModal(order.order_id); }}
                            style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FEE2E2', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            Batalkan Pesanan
                          </button>
                        </>
                      )}
                      {(order.status === 'WAITING_VERIFICATION' || order.status === 'MENUNGGU_VERIFIKASI') && (
                        <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 12, background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: 12, color: '#92400E', fontWeight: 600, textAlign: 'center' }}>
                          ⏳ Pembayaran sedang diverifikasi oleh admin
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      {selectedOrder && (
        <DetailSheet
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onImageClick={setLightboxImage}
          onUploadProof={handleUploadProof}
          onFinish={(e) => {
            handleConfirmReceived(selectedOrder, e);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImage}
            alt="Fullscreen Proof"
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          onClick={() => setShowCancelModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 24, padding: 24,
              width: '100%', maxWidth: 320, textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              animation: 'slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)'
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle size={32} color="#EF4444" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#111827' }}>Batalkan Pesanan?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
              Pesanan yang sudah dibatalkan tidak dapat dikembalikan lagi. Anda yakin ingin melanjutkan?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="cancel-modal-btn-no"
                onClick={() => setShowCancelModal(null)}
                style={{ flex: 1, padding: 12, borderRadius: 12, background: '#F3F4F6', color: '#374151', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Tidak
              </button>
              <button
                className="cancel-modal-btn-yes"
                onClick={confirmCancelOrder}
                disabled={isUpdating}
                style={{ flex: 1, padding: 12, borderRadius: 12, background: '#EF4444', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: isUpdating ? 0.7 : 1 }}
              >
                {isUpdating ? 'Memproses...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Finish Confirmation Modal */}
      {showFinishModal && (
        <div
          onClick={() => setShowFinishModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 24, padding: 24,
              width: '100%', maxWidth: 320, textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              animation: 'slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)'
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#111827' }}>Selesaikan Pesanan?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
              Apakah Anda sudah menerima barang dengan baik? Status pesanan akan diubah menjadi Selesai.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowFinishModal(null)}
                style={{ flex: 1, padding: 12, borderRadius: 12, background: '#F3F4F6', color: '#374151', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Batal
              </button>
              <button
                onClick={confirmFinishOrder}
                disabled={isUpdating}
                style={{ flex: 1, padding: 12, borderRadius: 12, background: '#10b981', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: isUpdating ? 0.7 : 1 }}
              >
                {isUpdating ? 'Memproses...' : 'Ya, Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderStatus;
