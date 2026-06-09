import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { orderService, getStatusFlow, getStatusColor, canUpdateStatus, STATUS_LABELS, formatOrderId } from '../../services/orderService';
import { Search, Filter, Package, Clock, Check, X, MapPin, Calendar, Smartphone, User, MessageCircle, FileText, Truck, UserCheck, Camera, CheckCircle2, ArrowUpRight, AlertCircle, Plus } from 'lucide-react';
import './Admin.css';
import '../Pages.css';

// Cross-flow status normalization (handles data inconsistency between status & pickupMethod)
const CROSS_FLOW_MAP = {
  'WAITING_PICKUP':     'WAITING_DROP_OFF',
  'WAITING_DROP_OFF':   'WAITING_PICKUP',
  'PICKED_UP_BY_ADMIN': 'STORE_RECEIVED',
  'STORE_RECEIVED':     'PICKED_UP_BY_ADMIN',
  'PENDING':            'WAITING_VERIFICATION',
};
const normalizeStatusForFlow = (rawStatus, flow) => {
  if (flow.includes(rawStatus)) return rawStatus;
  const alt = CROSS_FLOW_MAP[rawStatus];
  if (alt && flow.includes(alt)) return alt;
  return flow[0] || rawStatus;
};

// Pickup/Return method label helpers — handles both old and new data formats
const getPickupLabel = (method) => {
  if (!method) return { label: 'Drop Off', icon: '🚶', color: '#6B7280', bg: '#F3F4F6' };
  const m = method.toUpperCase();
  if (m === 'SELF_DROP' || m === 'AMBIL SENDIRI') 
    return { label: 'Self Drop', icon: '🚶', color: '#0369a1', bg: '#E0F2FE' };
  return { label: 'Pickup Admin', icon: '🏍', color: '#7C3AED', bg: '#EDE9FE' };
};
const getReturnLabel = (method) => {
  if (!method) return { label: 'Ambil di Toko', icon: '🏪', color: '#6B7280', bg: '#F3F4F6' };
  const m = method.toUpperCase();
  if (m === 'SELF_PICKUP' || m === 'DIAMBIL SENDIRI' || m === 'AMBIL SENDIRI') 
    return { label: 'Ambil di Toko', icon: '🏪', color: '#0369a1', bg: '#E0F2FE' };
  return { label: 'Diantar Admin', icon: '🚚', color: '#7C3AED', bg: '#EDE9FE' };
};

const AdminOrderManagement = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(location.state?.filter || 'All');
  const [updatingId, setUpdatingId] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tempProofs, setTempProofs] = useState({ pickup_photo: [], received_photo: [], delivery_photo: [], proof_image: [] });
  const [tempNote, setTempNote] = useState('');
  const [isSavingProof, setIsSavingProof] = useState(false);
  const [confirmPopup, setConfirmPopup] = useState(null);

  const handleImageClick = (src) => {
    if (!src) return;
    if (src.startsWith('data:image')) {
      const w = window.open('');
      w.document.write(`<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;"><img src="${src}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body>`);
    } else {
      window.open(src, '_blank');
    }
  };

  // Unified helper: covers ALL status transitions (photo + non-photo)
  const getNextAction = (order) => {
    if (!order) return null;
    const { status, pickupMethod, returnMethod } = order;
    const isSelfDrop = pickupMethod === 'SELF_DROP';
    const isSelfPickup = returnMethod === 'SELF_PICKUP';

    switch (status) {
      case 'PENDING':
      case 'WAITING_VERIFICATION':
      case 'MENUNGGU_VERIFIKASI':
        return { title: 'Konfirmasi Pembayaran', buttonLabel: 'Konfirmasi Pembayaran ✓', nextStatus: isSelfDrop ? 'WAITING_DROP_OFF' : 'WAITING_PICKUP', requiresPhoto: false, description: 'Verifikasi bahwa pembayaran customer sudah diterima dan pesanan sedang diproses.' };
      case 'WAITING_DROP_OFF':
      case 'MENUNGGU_PENGANTARAN':
        return { title: 'Terima Barang', buttonLabel: 'Konfirmasi Barang Diterima', nextStatus: 'STORE_RECEIVED', requiresPhoto: true, photoField: 'received_photo', icon: <Camera size={24} color="#064058" />, description: 'Upload foto sepatu saat diterima dari customer.' };
      case 'WAITING_PICKUP':
        return { title: 'Jemput Barang', buttonLabel: 'Konfirmasi Penjemputan', nextStatus: 'PICKED_UP_BY_ADMIN', requiresPhoto: true, photoField: 'pickup_photo', icon: <Camera size={24} color="#064058" />, description: 'Upload foto barang saat dijemput dari customer.' };
      case 'STORE_RECEIVED':
      case 'BARANG_DITERIMA':
      case 'PICKED_UP_BY_ADMIN':
      case 'BARANG_DIAMBIL':
        return { title: 'Mulai Proses Cuci', buttonLabel: 'Proses Pesanan', nextStatus: 'PROCESSING', requiresPhoto: false, description: 'Tandai bahwa sepatu sedang dibersihkan/diproses.' };
      case 'PROCESSING':
        return { 
          title: isSelfPickup ? 'Tandai Siap Diambil' : 'Tandai Siap Dikirim', 
          buttonLabel: isSelfPickup ? 'Tandai Siap Diambil ✓' : 'Tandai Siap Dikirim ✓', 
          nextStatus: isSelfPickup ? 'READY_PICKUP' : 'READY_DELIVERY', 
          requiresPhoto: true, 
          photoField: 'proof_image', 
          icon: <Camera size={24} color="#064058" />, 
          description: isSelfPickup ? 'Upload foto sepatu yang sudah selesai diproses (siap diambil).' : 'Upload foto sepatu yang sudah selesai (siap dikirim).' 
        };
      case 'READY_PICKUP':
        return { title: 'Konfirmasi Pengambilan', buttonLabel: 'Konfirmasi Barang Diambil', nextStatus: 'CUSTOMER_PICKED_UP', requiresPhoto: false, description: 'Konfirmasi bahwa sepatu sudah diambil oleh customer.' };
      case 'READY_DELIVERY':
        return { title: 'Mulai Pengiriman', buttonLabel: 'Mulai Antar Sekarang 🚚', nextStatus: 'ON_DELIVERY', requiresPhoto: false, description: 'Tandai bahwa sepatu sudah dalam perjalanan ke customer.' };
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderService.getHistory();
        const dbOrders = response.data || [];
        setOrders([...dbOrders].reverse());
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };
    fetchOrders();
  }, []);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" terlalu besar! Maksimal 5MB.`);
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = () => resolve(null);
        img.src = reader.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e, field) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    // Reset input so same files can be re-selected
    e.target.value = '';
    const compressed = await Promise.all(files.map(compressImage));
    const valid = compressed.filter(Boolean);
    if (!valid.length) return;
    setTempProofs(prev => ({ ...prev, [field]: [...(prev[field] || []), ...valid] }));
  };

  const handleRemoveTempPhoto = (field, idx) => {
    setTempProofs(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  };

  const handleMultiplePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedOrder) return;

    const readAndCompress = (file) => {
      return new Promise((resolve) => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} terlalu besar! Maksimal 5MB.`);
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 800;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(compressedDataUrl);
          };
          img.onerror = () => resolve(null);
          img.src = reader.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    };

    const compressedImages = await Promise.all(files.map(readAndCompress));
    const validImages = compressedImages.filter(Boolean);

    if (validImages.length === 0) return;

    let currentPhotos = [];
    if (selectedOrder.photos) {
      try {
        currentPhotos = typeof selectedOrder.photos === 'string' ? JSON.parse(selectedOrder.photos) : selectedOrder.photos;
      } catch (_) {
        currentPhotos = [];
      }
    }
    if (!Array.isArray(currentPhotos)) {
      currentPhotos = [];
    }
    if (currentPhotos.length === 0 && selectedOrder.photo) {
      currentPhotos = [selectedOrder.photo];
    }

    const updatedPhotos = [...currentPhotos, ...validImages];
    const updatedOrder = { 
      ...selectedOrder, 
      photos: updatedPhotos,
      photo: updatedPhotos[0] || null
    };

    try {
      await orderService.updateOrder(updatedOrder);
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => o.order_id === updatedOrder.order_id ? updatedOrder : o));
    } catch (err) {
      alert('Gagal mengunggah foto: ' + err.message);
    }
  };

  const handleDeletePhoto = async (indexToDelete) => {
    if (!selectedOrder) return;
    let currentPhotos = [];
    if (selectedOrder.photos) {
      try {
        currentPhotos = typeof selectedOrder.photos === 'string' ? JSON.parse(selectedOrder.photos) : selectedOrder.photos;
      } catch (_) {
        currentPhotos = [];
      }
    }
    if (!Array.isArray(currentPhotos)) {
      currentPhotos = [];
    }
    if (currentPhotos.length === 0 && selectedOrder.photo) {
      currentPhotos = [selectedOrder.photo];
    }

    const updatedPhotos = currentPhotos.filter((_, idx) => idx !== indexToDelete);
    const updatedOrder = { 
      ...selectedOrder, 
      photos: updatedPhotos,
      photo: updatedPhotos[0] || null
    };

    try {
      await orderService.updateOrder(updatedOrder);
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => o.order_id === updatedOrder.order_id ? updatedOrder : o));
    } catch (err) {
      alert('Gagal menghapus foto: ' + err.message);
    }
  };

  // Unified handler for all order actions (photo + non-photo)
  const handleOrderAction = async (action) => {
    if (!selectedOrder) return;
    const { nextStatus, requiresPhoto, photoField } = action;

    if (requiresPhoto) {
      if (!tempProofs[photoField] || tempProofs[photoField].length === 0) {
        alert('Mohon upload foto bukti terlebih dahulu!');
        return;
      }
      setIsSavingProof(true);
      const now = new Date().toISOString();
      const photos = tempProofs[photoField]; // always an array
      const updatedOrder = {
        ...selectedOrder,
        status: nextStatus,
        // Store first photo in the original field for backward compat, plus full array
        [photoField]: photos[0] || null,
        [`${photoField}_all`]: photos,
        [`${photoField}_time`]: now,
        note: tempNote || undefined
      };
      try {
        await orderService.updateOrder(updatedOrder);
        setSelectedOrder(updatedOrder);
        setOrders(prev => prev.map(o => o.order_id === updatedOrder.order_id ? updatedOrder : o));
        setTempNote('');
        setSuccessId(updatedOrder.order_id);
        setTimeout(() => setSuccessId(null), 3000);
      } catch (err) {
        alert('Gagal memperbarui pesanan: ' + err.message);
      } finally {
        setIsSavingProof(false);
      }
    } else {
      // No photo needed — direct status update via confirm popup
      setConfirmPopup({
        orderId: selectedOrder.order_id,
        nextStatus,
        title: action.title,
        message: `${action.description}\n\nLanjutkan?`,
        isCancel: false
      });
    }
  };

  // Legacy alias (kept for card-list buttons)
  const handleActionConfirm = async (field, nextStatus) => {
    const action = { nextStatus, requiresPhoto: true, photoField: field };
    await handleOrderAction(action);
  };

  const handleUpdateProof = async (field, value) => {
    // Legacy function used for deletion
    if (!selectedOrder) return;
    
    const updatedOrder = { ...selectedOrder, [field]: value };
    try {
      await orderService.updateOrder(updatedOrder);
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => o.order_id === updatedOrder.order_id ? updatedOrder : o));
    } catch (error) {
      console.error("Proof update failed:", error);
      alert("Gagal mengupdate bukti: " + error.message);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const response = await orderService.getHistory();
      const allOrders = response.data || [];
      const order = allOrders.find(o => o.order_id === orderId);
      if (order) {
        const updatedOrder = { ...order, status: newStatus };
        await orderService.updateOrder(updatedOrder);
        setOrders(prev => prev.map(o => o.order_id === orderId ? updatedOrder : o));
        // Also update selectedOrder so modal reflects new status immediately
        if (selectedOrder?.order_id === orderId) {
          setSelectedOrder(updatedOrder);
        }
        setSuccessId(orderId);
        setTimeout(() => setSuccessId(null), 2500);
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const FILTER_OPTIONS = [
    { value: 'All', label: 'Semua' },
    { value: 'WAITING_VERIFICATION', label: 'Menunggu Verifikasi Pembayaran' },
    { value: 'WAITING_DROP_OFF', label: 'Menunggu Pengantaran Barang' },
    { value: 'STORE_RECEIVED', label: 'Barang Sudah Diterima' },
    { value: 'PROCESSING', label: 'Sedang Diproses' },
    { value: 'READY_PICKUP', label: 'Siap Dikirim/Ambil' },
    { value: 'CUSTOMER_PICKED_UP', label: 'Sudah Dikirim/Diambil' }, 
    { value: 'FINISHED', label: 'Selesai' },
    { value: 'CANCELLED', label: 'Dibatalkan' }
  ];

  const filteredOrders = orders.filter(order => {
    const searchString = `${order.order_id} ${order.customerName}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterStatus === 'All') return true;

    if (filterStatus === 'WAITING_VERIFICATION') return ['WAITING_VERIFICATION', 'MENUNGGU_VERIFIKASI', 'PENDING'].includes(order.status);
    if (filterStatus === 'WAITING_DROP_OFF') return ['WAITING_DROP_OFF', 'MENUNGGU_PENGANTARAN', 'WAITING_PICKUP', 'AWAITING_DROP_OFF', 'ANTRI'].includes(order.status);
    if (filterStatus === 'STORE_RECEIVED') return ['STORE_RECEIVED', 'BARANG_DITERIMA', 'PICKED_UP_BY_ADMIN', 'BARANG_DIAMBIL'].includes(order.status);
    if (filterStatus === 'PROCESSING') return ['PROCESSING'].includes(order.status);
    if (filterStatus === 'READY_PICKUP') return ['READY_PICKUP', 'READY_DELIVERY', 'READY'].includes(order.status);
    if (filterStatus === 'CUSTOMER_PICKED_UP') return ['CUSTOMER_PICKED_UP', 'SUDAH_DIAMBIL', 'RECEIVED', 'ON_DELIVERY', 'DELIVERED'].includes(order.status);
    if (filterStatus === 'FINISHED') return ['FINISHED', 'COMPLETED'].includes(order.status);
    if (filterStatus === 'CANCELLED') return ['CANCELLED'].includes(order.status);
    return order.status === filterStatus;
  }).sort((a, b) => {
    let dateA = 0;
    if (a.order_date) dateA = new Date(a.order_date).getTime();
    else if (a.created_at) dateA = new Date(a.created_at).getTime();
    if (isNaN(dateA)) dateA = 0;

    let dateB = 0;
    if (b.order_date) dateB = new Date(b.order_date).getTime();
    else if (b.created_at) dateB = new Date(b.created_at).getTime();
    if (isNaN(dateB)) dateB = 0;

    if (dateB !== dateA) return dateB - dateA;
    
    const idA = a.order_id || '';
    const idB = b.order_id || '';
    return idB.toString().localeCompare(idA.toString());
  });

  const handleCardClick = (order) => {
    setSelectedOrder(order);
    setTempProofs({ 
      pickup_photo: [], 
      received_photo: [],
      delivery_photo: [],
      proof_image: []
    });
    setTempNote('');
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setTempProofs({ pickup_photo: [], received_photo: [], delivery_photo: [], proof_image: [] });
  };

  return (
    <div className="admin-root">

      {/* Header */}
      <div className="adm-header adm-fadeUp">
        <div>
          <h2 className="adm-header-title">Manage Orders</h2>
          <p className="adm-header-sub">{orders.length} pesanan total</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="adm-fade2" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '4px 8px', width: '100%' }}>
          <Search size={16} color="#9CA3AF" style={{ marginLeft: '4px' }} />
          <input 
            placeholder="Cari order ID atau nama..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ border: 'none', outline: 'none', background: 'transparent', padding: '8px', width: '100%', fontSize: '0.9rem' }}
          />
          <button style={{ background: '#064058', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 16px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            Cari
          </button>
        </div>
        
        {/* Horizontal Button Filters */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scroll">
          <button
            onClick={() => setFilterStatus('All')}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: '1px solid', whiteSpace: 'nowrap',
              borderColor: filterStatus === 'All' ? '#064058' : '#E5E7EB',
              backgroundColor: filterStatus === 'All' ? '#064058' : 'white',
              color: filterStatus === 'All' ? 'white' : '#4B5563',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Semua
          </button>
          {FILTER_OPTIONS.filter(opt => opt.value !== 'All').map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: '1px solid', whiteSpace: 'nowrap',
                borderColor: filterStatus === opt.value ? '#064058' : '#E5E7EB',
                backgroundColor: filterStatus === opt.value ? '#064058' : 'white',
                color: filterStatus === opt.value ? 'white' : '#4B5563',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #D1D5DB' }}>
            <Package size={48} color="#9CA3AF" />
            <h3 style={{ margin: 0, color: '#111827', fontSize: '1.1rem', fontWeight: 'bold' }}>No orders yet</h3>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>Orders will appear here once customers make a purchase</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const colors = getStatusColor(order.status);
            const isUpdating = updatingId === order.order_id;
            const isSuccess = successId === order.order_id;
            const flow = getStatusFlow(order);
            const rawStatus = (order.status || '').toUpperCase();
            const normalizedStatus = normalizeStatusForFlow(rawStatus, flow);
            const currentIdx = flow.indexOf(normalizedStatus);
            const safeIdx = currentIdx === -1 ? 0 : currentIdx;
            const progressPct = flow.length > 1 ? Math.round((safeIdx / (flow.length - 1)) * 100) : 0;
            const p = getPickupLabel(order.pickupMethod);
            const r = getReturnLabel(order.returnMethod);
            const isDone = ['FINISHED', 'CANCELLED', 'CUSTOMER_PICKED_UP', 'RECEIVED'].includes(order.status);
            const config = getNextAction(order);

            return (
              <div
                key={order.order_id}
                onClick={() => handleCardClick(order)}
                className="order-card-admin"
                style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(6,64,88,0.08)',
                  border: '1px solid #F0F4F8',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(6,64,88,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(6,64,88,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Coloured accent bar */}
                <div style={{ height: '4px', background: `linear-gradient(90deg, ${colors.bg}, ${colors.border})` }} />

                {/* Card Body */}
                <div style={{ padding: '16px 18px 14px' }}>

                  {/* ── Row 1: Order ID + Status badge ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                        {formatOrderId(order)}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.service || 'Cuci Sepatu'}
                        {order.type ? <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginLeft: '6px' }}>({order.type})</span> : null}
                      </span>
                      {!!order.is_overflow_order && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#D97706', backgroundColor: '#FFFBEB', padding: '1px 7px', borderRadius: '4px', border: '1px solid #FEF3C7', width: 'fit-content' }}>
                          📅 Besok
                        </span>
                      )}
                    </div>
                    <span style={{
                      flexShrink: 0,
                      padding: '5px 11px',
                      borderRadius: '999px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      backgroundColor: colors.bg,
                      color: colors.text,
                      lineHeight: 1.35,
                      textAlign: 'center'
                    }}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  {/* ── Row 2: Pickup + Return chips ── */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem',
                      fontWeight: 700, background: p.bg, color: p.color,
                      border: `1px solid ${p.color}30`
                    }}>{p.icon} {p.label}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem',
                      fontWeight: 700, background: r.bg, color: r.color,
                      border: `1px solid ${r.color}30`
                    }}>{r.icon} {r.label}</span>
                  </div>

                  {/* ── Row 3: Price + Date ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 800, color: '#064058', fontSize: '1.1rem' }}>
                      Rp {Number(order.total_price || order.totalPrice || 0).toLocaleString('id-ID')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🗓 Est. {order.delivery_date
                        ? new Date(order.delivery_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        : (order.order_date || order.created_at
                          ? new Date(order.order_date || order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'N/A')}
                    </span>
                  </div>

                  {/* ── Progress bar (single clean bar) ── */}
                  {!isDone && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: colors.border }}>{progressPct}%</span>
                      </div>
                      <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${progressPct}%`,
                          backgroundColor: colors.border,
                          borderRadius: '999px',
                          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)'
                        }} />
                      </div>
                    </div>
                  )}

                  {/* ── Divider ── */}
                  <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #E2E8F0, transparent)', margin: '0 -18px 14px -18px' }} />

                  {/* ── Action buttons ── */}
                  <div onClick={e => e.stopPropagation()}>
                    {isSuccess && (
                      <div style={{
                        backgroundColor: '#ECFDF5', color: '#059669', padding: '8px 12px',
                        borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px'
                      }}>
                        <CheckCircle2 size={14} /> Status berhasil diperbarui!
                      </div>
                    )}

                    {isDone ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '10px 16px', borderRadius: '12px',
                        backgroundColor: order.status === 'CANCELLED' ? '#FFF1F2' : '#F0FDF4',
                        color: order.status === 'CANCELLED' ? '#E11D48' : '#059669',
                        fontSize: '0.82rem', fontWeight: 800, gap: '6px',
                        border: `1px solid ${order.status === 'CANCELLED' ? '#FECDD3' : '#BBF7D0'}`
                      }}>
                        {order.status === 'CANCELLED' ? '✕ Order Dibatalkan' : '✓ Order Selesai'}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {config && (
                          <button
                            disabled={isUpdating}
                            onClick={() => {
                              if (config.requiresPhoto) {
                                handleCardClick(order);
                              } else {
                                setConfirmPopup({
                                  orderId: order.order_id,
                                  nextStatus: config.nextStatus,
                                  title: config.title,
                                  message: `Ganti status ke "${STATUS_LABELS[config.nextStatus] || config.nextStatus}"?`,
                                  isCancel: false
                                });
                              }
                            }}
                            style={{
                              flex: 1, padding: '11px 14px', borderRadius: '12px', border: 'none',
                              background: isUpdating ? '#94A3B8' : `linear-gradient(135deg, #064058, #0a6a8a)`,
                              color: 'white', fontWeight: 800, fontSize: '0.82rem',
                              cursor: isUpdating ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              gap: '6px', boxShadow: '0 2px 8px rgba(6,64,88,0.25)',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isUpdating ? <span className="spinner-small" style={{ borderTopColor: 'white' }} /> : (config.requiresPhoto ? <Camera size={15} /> : <CheckCircle2 size={15} />)}
                            {isUpdating ? 'Memproses...' : config.buttonLabel}
                          </button>
                        )}
                        <button
                          onClick={() => handleCardClick(order)}
                          style={{
                            padding: '11px 14px', borderRadius: '12px',
                            border: '1.5px solid #E2E8F0',
                            backgroundColor: 'white', color: '#475569',
                            fontWeight: 700, fontSize: '0.82rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#064058'; e.currentTarget.style.color = '#064058'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                        >
                          <FileText size={15} /> Detail
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, 
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={closeModal}>
          <div 
            style={{ 
              backgroundColor: 'white', width: '100%', maxWidth: '480px', 
              borderTopLeftRadius: '24px', borderTopRightRadius: '24px', 
              padding: '24px 20px', maxHeight: '90vh', overflowY: 'auto',
              animation: 'slideUp 0.3s ease-out'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Order Details</h3>
                <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{formatOrderId(selectedOrder)}</span>
              </div>
              <button onClick={closeModal} style={{ border: 'none', background: '#F3F4F6', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={20} color="#6B7280" />
              </button>
            </div>

            {/* Status Badge in Details */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'inline-block', padding: '8px 16px', borderRadius: '12px', 
                backgroundColor: getStatusColor(selectedOrder.status).bg, 
                color: getStatusColor(selectedOrder.status).text,
                fontWeight: 700, fontSize: '0.85rem'
              }}>
                {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
              </div>
            </div>

            {/* Order Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Photo Section */}
              {(() => {
                let photosArray = [];
                if (selectedOrder.photos) {
                  try {
                    photosArray = typeof selectedOrder.photos === 'string' ? JSON.parse(selectedOrder.photos) : selectedOrder.photos;
                  } catch(e) {
                    // fallback
                  }
                }
                const hasPhotosArray = Array.isArray(photosArray) && photosArray.length > 0;
                const hasSinglePhoto = !hasPhotosArray && !!selectedOrder.photo;
                const displayPhotos = hasPhotosArray ? photosArray : (hasSinglePhoto ? [selectedOrder.photo] : []);

                return (
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Item Photo(s)</label>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px',
                      scrollbarWidth: 'none', msOverflowStyle: 'none'
                    }} className="hide-scroll">
                      {displayPhotos.length === 0 ? (
                        <div style={{ color: '#9CA3AF', fontSize: '0.85rem', fontStyle: 'italic', padding: '12px 0' }}>
                          Tidak ada foto item dari customer.
                        </div>
                      ) : (
                        displayPhotos.map((p, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                            <img 
                              src={p} 
                              alt={`Order Item ${idx + 1}`} 
                              onClick={() => handleImageClick(p)}
                              style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover', border: '1px solid #E5E7EB', cursor: 'pointer' }} 
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Customer Info */}
              <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <User size={18} color="#064058" />
                  <span style={{ fontWeight: 600, color: '#111827' }}>Customer Information</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Name:</strong> <span>{selectedOrder.customerName || 'N/A'}</span>
                  </p>
                  <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Phone:</strong> <span>{selectedOrder.customerPhone || 'N/A'}</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0', padding: '8px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <strong style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Delivery Address</strong>
                    <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{selectedOrder.address?.label || 'Home'}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{selectedOrder.address?.detail || 'No address provided'}</p>
                  </div>
                  <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Pickup Method:</strong> <span>{selectedOrder.pickupMethod === 'SELF_DROP' ? 'Antar Sendiri' : 'Dijemput Admin'}</span>
                  </p>
                  <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Delivery Method:</strong> <span>{selectedOrder.returnMethod === 'SELF_PICKUP' ? 'Ambil Sendiri' : 'Diantar Admin'}</span>
                  </p>
                  <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Notes:</strong> <span>{selectedOrder.notes || '-'}</span>
                  </p>
                </div>
              </div>

              {/* ─── ORDER ACTIONS SECTION ─────────────────────────────── */}
              {(() => {
                const action = getNextAction(selectedOrder);
                const isFinished = selectedOrder.status === 'FINISHED' || selectedOrder.status === 'CANCELLED';
                const isThisUpdating = isSavingProof || updatingId === selectedOrder.order_id;
                const isThisSuccess = successId === selectedOrder.order_id;

                if (isFinished) {
                  return (
                    <div style={{ background: selectedOrder.status === 'FINISHED' ? '#ECFDF5' : '#FEF2F2', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{selectedOrder.status === 'FINISHED' ? '✅' : '❌'}</div>
                      <p style={{ margin: 0, fontWeight: 800, color: selectedOrder.status === 'FINISHED' ? '#065F46' : '#991B1B', fontSize: '1rem' }}>
                        {selectedOrder.status === 'FINISHED' ? 'Pesanan Selesai' : 'Pesanan Dibatalkan'}
                      </p>
                    </div>
                  );
                }



                if (!action) return null;

                return (
                  <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', padding: '20px', borderRadius: '20px', border: '1.5px solid #BAE6FD' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0369A1', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontWeight: 800, color: '#0C4A6E', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Tindakan Selanjutnya</span>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#0C4A6E' }}>{action.title}</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#0369A1' }}>{action.description}</p>

                    {isThisSuccess && (
                      <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <CheckCircle2 size={14} /> Status berhasil diperbarui!
                      </div>
                    )}

                    {action.requiresPhoto && (
                      <div style={{ marginBottom: '14px' }}>
                        {/* Grid preview of selected photos */}
                        {(tempProofs[action.photoField] || []).length > 0 && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '8px',
                            marginBottom: '10px'
                          }}>
                            {tempProofs[action.photoField].map((src, idx) => (
                              <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '2px solid #BAE6FD', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                <img
                                  src={src}
                                  alt={`Foto ${idx + 1}`}
                                  onClick={() => handleImageClick(src)}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                />
                                <button
                                  onClick={() => handleRemoveTempPhoto(action.photoField, idx)}
                                  style={{
                                    position: 'absolute', top: '4px', right: '4px',
                                    background: 'rgba(0,0,0,0.6)', border: 'none',
                                    borderRadius: '50%', width: '22px', height: '22px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', cursor: 'pointer', padding: 0
                                  }}
                                >
                                  <X size={12} />
                                </button>
                                <div style={{
                                  position: 'absolute', bottom: '4px', left: '4px',
                                  background: 'rgba(0,0,0,0.5)', borderRadius: '6px',
                                  padding: '1px 5px', fontSize: '0.6rem', color: 'white', fontWeight: 700
                                }}>{idx + 1}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Upload area — always shown so more photos can be added */}
                        <label style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          height: (tempProofs[action.photoField] || []).length > 0 ? '70px' : '130px',
                          border: '2px dashed #7DD3FC', borderRadius: '14px', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.7)', transition: 'height 0.2s'
                        }}>
                          {(tempProofs[action.photoField] || []).length > 0
                            ? <><Plus size={20} color="#0369A1" /><span style={{ fontSize: '0.75rem', color: '#0369A1', fontWeight: 700, marginTop: '4px' }}>Tambah Foto Lagi</span></>
                            : <>{action.icon || <Camera size={28} color="#0369A1" />}<span style={{ fontSize: '0.82rem', color: '#0369A1', fontWeight: 700, marginTop: '8px' }}>Tap untuk upload foto bukti</span><span style={{ fontSize: '0.7rem', color: '#7DD3FC' }}>Bisa pilih banyak foto · Maks. 5MB/foto</span></>
                          }
                          <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, action.photoField)} />
                        </label>
                      </div>
                    )}

                    {action.requiresPhoto && (
                      <textarea placeholder="Catatan (opsional)..." value={tempNote} onChange={e => setTempNote(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BAE6FD', outline: 'none', fontSize: '0.82rem', resize: 'none', minHeight: '54px', marginBottom: '12px', boxSizing: 'border-box' }} />
                    )}

                    <button
                      onClick={() => handleOrderAction(action)}
                      disabled={isThisUpdating || (action.requiresPhoto && (!tempProofs[action.photoField] || tempProofs[action.photoField].length === 0))}
                      style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: (action.requiresPhoto && (!tempProofs[action.photoField] || tempProofs[action.photoField].length === 0)) ? '#CBD5E1' : '#064058', color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: isThisUpdating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(6,64,88,0.2)' }}
                    >
                      {isThisUpdating ? <Clock size={18} className="spin" /> : <CheckCircle2 size={18} />}
                      {isThisUpdating ? 'Memproses...' : action.buttonLabel}
                    </button>


                  </div>
                );
              })()}

              {/* Status History / Proof Photos */}
              {(selectedOrder.pickup_photo || selectedOrder.received_photo || selectedOrder.proof_image || selectedOrder.delivery_photo) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '12px' }}>Foto Bukti Proses</label>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {selectedOrder.pickup_photo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <img src={selectedOrder.pickup_photo} alt="Pickup" onClick={() => handleImageClick(selectedOrder.pickup_photo)} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #E5E7EB', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600 }}>Pickup</span>
                      </div>
                    )}
                    {selectedOrder.received_photo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <img src={selectedOrder.received_photo} alt="Received" onClick={() => handleImageClick(selectedOrder.received_photo)} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #E5E7EB', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600 }}>Diterima</span>
                      </div>
                    )}
                    {selectedOrder.proof_image && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <img src={selectedOrder.proof_image} alt="Proof" onClick={() => handleImageClick(selectedOrder.proof_image)} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #E5E7EB', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600 }}>Selesai Cuci</span>
                      </div>
                    )}
                    {selectedOrder.delivery_photo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <img src={selectedOrder.delivery_photo} alt="Delivery" onClick={() => handleImageClick(selectedOrder.delivery_photo)} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #E5E7EB', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600 }}>Diserahkan</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Service Details */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '12px' }}>Service Summary</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ backgroundColor: '#E8F7FC', padding: '10px', borderRadius: '12px' }}>
                    <Package size={20} color="#064058" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{selectedOrder.service}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>Quantity: {selectedOrder.quantity || 1} Pair(s)</p>
                  </div>
                </div>
              </div>

              {/* Price Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '20px', borderTop: '2px solid #F3F4F6' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#6B7280' }}>Total Payment</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#064058' }}>Rp {Number(selectedOrder.total_price || selectedOrder.totalPrice || 0).toLocaleString('id-ID')}</span>
              </div>

              <button 
                onClick={closeModal}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '16px', 
                  backgroundColor: '#064058', color: 'white', border: 'none', 
                  fontWeight: 700, fontSize: '1rem', marginTop: '10px', cursor: 'pointer'
                }}
              >
                Close Details
              </button>

            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .order-card-admin:active {
          transform: scale(0.98);
        }
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {confirmPopup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setConfirmPopup(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '360px', animation: 'fadeIn 0.2s ease-out', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: confirmPopup.isCancel ? '#FEE2E2' : '#E8F7FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {confirmPopup.isCancel ? <AlertCircle size={20} color="#EF4444" /> : <CheckCircle2 size={20} color="#064058" />}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{confirmPopup.title}</h3>
            </div>
            <p style={{ margin: '0 0 24px 0', color: '#4B5563', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{confirmPopup.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmPopup(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: '#F3F4F6', color: '#4B5563', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
              <button
                onClick={async () => {
                  const { orderId, nextStatus } = confirmPopup;
                  setConfirmPopup(null);
                  await updateStatus(orderId, nextStatus);
                }}
                disabled={updatingId !== null}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: confirmPopup.isCancel ? '#EF4444' : '#064058', color: 'white', border: 'none', fontWeight: 700, cursor: updatingId !== null ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {updatingId !== null ? <Clock size={16} className="spin" /> : 'Ya, Lanjut'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderManagement;
