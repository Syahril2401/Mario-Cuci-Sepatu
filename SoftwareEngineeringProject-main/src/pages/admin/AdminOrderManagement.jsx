import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { orderService, getStatusFlow, getStatusColor, canUpdateStatus, STATUS_LABELS, formatOrderId } from '../../services/orderService';
import { Search, Filter, Package, Clock, Check, X, MapPin, Calendar, Smartphone, User, MessageCircle, FileText, Truck, UserCheck, Camera, CheckCircle2, ArrowUpRight, AlertCircle } from 'lucide-react';
import './Admin.css';
import '../Pages.css';

const AdminOrderManagement = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(location.state?.filter || 'All');
  const [updatingId, setUpdatingId] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tempProofs, setTempProofs] = useState({ pickup_photo: null, received_photo: null, delivery_photo: null, proof_image: null });
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
      case 'MENUNGGU_VERIFIKASI':
        return { title: 'Konfirmasi Pembayaran', buttonLabel: 'Konfirmasi Pembayaran ✓', nextStatus: isSelfDrop ? 'MENUNGGU_PENGANTARAN' : 'WAITING_PICKUP', requiresPhoto: false, description: 'Verifikasi bahwa pembayaran customer sudah diterima dan pesanan sedang diproses.' };
      case 'MENUNGGU_PENGANTARAN':
        return { title: 'Terima Barang', buttonLabel: 'Konfirmasi Barang Diterima', nextStatus: 'BARANG_DITERIMA', requiresPhoto: true, photoField: 'received_photo', icon: <Camera size={24} color="#064058" />, description: 'Upload foto sepatu saat diterima dari customer.' };
      case 'WAITING_PICKUP':
        return { title: 'Jemput Barang', buttonLabel: 'Konfirmasi Penjemputan', nextStatus: 'BARANG_DIAMBIL', requiresPhoto: true, photoField: 'pickup_photo', icon: <Camera size={24} color="#064058" />, description: 'Upload foto barang saat dijemput dari customer.' };
      case 'BARANG_DITERIMA':
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
        return { title: 'Konfirmasi Pengambilan', buttonLabel: 'Konfirmasi Barang Diambil', nextStatus: 'SUDAH_DIAMBIL', requiresPhoto: false, description: 'Konfirmasi bahwa sepatu sudah diambil oleh customer.' };
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

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // 5MB initial validation before compression
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Compress image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800; // Resize to max 800px

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

        // Compress to 0.6 quality WebP or JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setTempProofs(prev => ({ ...prev, [field]: compressedDataUrl }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // Unified handler for all order actions (photo + non-photo)
  const handleOrderAction = async (action) => {
    if (!selectedOrder) return;
    const { nextStatus, requiresPhoto, photoField } = action;

    if (requiresPhoto) {
      if (!tempProofs[photoField]) {
        alert('Mohon upload foto bukti terlebih dahulu!');
        return;
      }
      setIsSavingProof(true);
      const now = new Date().toISOString();
      const updatedOrder = {
        ...selectedOrder,
        status: nextStatus,
        [photoField]: tempProofs[photoField],
        [`${photoField}_time`]: now,
        proof_image: tempProofs[photoField],
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
    { value: 'MENUNGGU_VERIFIKASI', label: 'Menunggu Verifikasi Pembayaran' },
    { value: 'MENUNGGU_PENGANTARAN', label: 'Menunggu Pengantaran Barang' },
    { value: 'BARANG_DITERIMA', label: 'Barang Sudah Diterima' },
    { value: 'PROCESSING', label: 'Sedang Diproses' },
    { value: 'READY_PICKUP', label: 'Siap Dikirim/Ambil' },
    { value: 'SUDAH_DIAMBIL', label: 'Sudah Dikirim/Diambil' }, 
    { value: 'FINISHED', label: 'Selesai' },
    { value: 'CANCELLED', label: 'Dibatalkan' }
  ];

  const filteredOrders = orders.filter(order => {
    const searchString = `${order.order_id} ${order.customerName}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterStatus === 'All') return true;

    if (filterStatus === 'MENUNGGU_VERIFIKASI') return ['MENUNGGU_VERIFIKASI', 'PENDING'].includes(order.status);
    if (filterStatus === 'MENUNGGU_PENGANTARAN') return ['MENUNGGU_PENGANTARAN', 'WAITING_PICKUP', 'ANTRI'].includes(order.status);
    if (filterStatus === 'BARANG_DITERIMA') return ['BARANG_DITERIMA', 'BARANG_DIAMBIL'].includes(order.status);
    if (filterStatus === 'PROCESSING') return ['PROCESSING'].includes(order.status);
    if (filterStatus === 'READY_PICKUP') return ['READY_PICKUP', 'READY_DELIVERY', 'READY'].includes(order.status);
    if (filterStatus === 'SUDAH_DIAMBIL') return ['SUDAH_DIAMBIL', 'RECEIVED', 'ON_DELIVERY', 'DELIVERED'].includes(order.status);
    if (filterStatus === 'FINISHED') return ['FINISHED', 'COMPLETED'].includes(order.status);
    if (filterStatus === 'CANCELLED') return ['CANCELLED'].includes(order.status);
    
    return order.status === filterStatus;
  });

  const handleCardClick = (order) => {
    setSelectedOrder(order);
    setTempProofs({ 
      pickup_photo: order.pickup_photo || null, 
      received_photo: order.received_photo || null,
      delivery_photo: order.delivery_photo || null 
    });
    setTempNote('');
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setTempProofs({ pickup_photo: null, received_photo: null, delivery_photo: null, proof_image: null });
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

            // Determine valid next status from dynamic flow
            const flow = getStatusFlow(order);
            const currentIndex = flow.indexOf(order.status.toUpperCase());
            const nextStatus = currentIndex !== -1 && currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
            
            // Admin cannot set FINISHED
            const finalNextStatus = nextStatus === 'FINISHED' ? null : nextStatus;

            return (
              <div 
                key={order.order_id} 
                onClick={() => handleCardClick(order)}
                style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  borderLeft: `4px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.1s active',
                }}
                className="order-card-admin"
              >
                {/* Top Row: ID & Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{formatOrderId(order)}</h4>
                    {!!order.is_overflow_order && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#D97706', backgroundColor: '#FFFBEB', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FEF3C7', width: 'fit-content' }}>
                        📅 Scheduled for Tomorrow
                      </span>
                    )}
                  </div>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '999px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    backgroundColor: colors.bg,
                    color: colors.text,
                    letterSpacing: '0.5px'
                  }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                {/* Pickup Method Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#6B7280', fontSize: '0.8rem' }}>
                  {order.pickupMethod === 'SELF_DROP' ? <UserCheck size={14} /> : <Truck size={14} />}
                  <span>{order.pickupMethod === 'SELF_DROP' ? 'Diantar Sendiri' : 'Dijemput Admin'}</span>
                </div>

                {/* Service Name */}
                <p style={{ margin: '0 0 12px 0', color: '#4B5563', fontSize: '0.9rem', fontWeight: 500 }}>
                  {order.service || 'Cuci Sepatu Reguler'} {order.type ? `(${order.type})` : ''}
                </p>

                {/* Price & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold', color: '#064058', fontSize: '1.15rem' }}>
                    Rp {Number(order.total_price || order.totalPrice || 0).toLocaleString('id-ID')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>

                <div style={{ borderTop: '1px dashed #E5E7EB', margin: '0 -16px 16px -16px' }}></div>

                {/* Status Progress & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Actions Required
                  </label>
                  
                  {isSuccess && (
                    <div style={{ 
                      backgroundColor: '#DCFCE7', color: '#166534', padding: '8px 12px', 
                      borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.3s'
                    }}>
                      <CheckCircle2 size={14} /> Status updated successfully!
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(() => {
                      const config = getNextAction(order);
                      const targetStatus = config ? config.nextStatus : null;

                      if (order.status === 'FINISHED' || order.status === 'CANCELLED') {
                        return (
                          <div style={{ 
                            padding: '10px 16px', borderRadius: '12px', backgroundColor: '#F3F4F6', 
                            color: '#9CA3AF', fontSize: '0.85rem', fontWeight: 700, width: '100%', textAlign: 'center' 
                          }}>
                            {order.status === 'FINISHED' ? 'Order Completed' : 'Order Cancelled'}
                          </div>
                        );
                      }

                      return (
                        <>
                          {config && (
                            <button
                              disabled={isUpdating}
                              onClick={() => {
                                if (config.requiresPhoto) {
                                  handleCardClick(order); // Force open modal for proof upload
                                } else {
                                  setConfirmPopup({
                                    orderId: order.order_id,
                                    nextStatus: targetStatus,
                                    title: config.title,
                                    message: `Ganti status ke "${STATUS_LABELS[targetStatus] || targetStatus}"?`,
                                    isCancel: false
                                  });
                                }
                              }}
                              style={{ 
                                flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                                backgroundColor: '#064058', color: 'white', fontWeight: 700, fontSize: '0.85rem',
                                cursor: isUpdating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', gap: '6px', transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0a5b7d'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#064058'}
                            >
                              {isUpdating ? <span className="spinner-small" style={{ borderTopColor: 'white' }} /> : (config.requiresPhoto ? <Camera size={16} /> : <CheckCircle2 size={16} />)}
                              {isUpdating ? 'Updating...' : config.buttonLabel}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Tiny Progress Indicator */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {getStatusFlow(order).map((s, idx) => (
                      <div 
                        key={s} 
                        style={{ 
                          flex: 1, height: '4px', borderRadius: '2px',
                          backgroundColor: idx <= getStatusFlow(order).indexOf(order.status.toUpperCase()) ? '#064058' : '#E5E7EB'
                        }}
                      ></div>
                    ))}
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
                const hasSinglePhoto = !!selectedOrder.photo;

                if (!hasPhotosArray && !hasSinglePhoto) return null;

                return (
                  <div style={{ width: '100%' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>Item Photo(s)</label>
                    {hasPhotosArray ? (
                      <div style={{ 
                        display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px',
                        scrollbarWidth: 'none', msOverflowStyle: 'none'
                      }}>
                        {photosArray.map((p, idx) => (
                          <img 
                            key={idx}
                            src={p} 
                            alt={`Order Item ${idx + 1}`} 
                            onClick={() => handleImageClick(p)}
                            style={{ width: '140px', height: '140px', borderRadius: '16px', objectFit: 'cover', border: '1px solid #E5E7EB', flexShrink: 0, cursor: 'pointer' }} 
                          />
                        ))}
                      </div>
                    ) : (
                      <img 
                        src={selectedOrder.photo} 
                        alt="Order Item" 
                        onClick={() => handleImageClick(selectedOrder.photo)}
                        style={{ width: '100%', borderRadius: '16px', objectFit: 'cover', border: '1px solid #E5E7EB', cursor: 'pointer' }} 
                      />
                    )}
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
                        {tempProofs[action.photoField] ? (
                          <div style={{ position: 'relative' }}>
                            <img src={tempProofs[action.photoField]} alt="Preview" style={{ width: '100%', borderRadius: '14px', height: '180px', objectFit: 'cover', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <button onClick={() => setTempProofs(prev => ({ ...prev, [action.photoField]: null }))} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', padding: '6px', color: 'white', cursor: 'pointer' }}>
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '130px', border: '2px dashed #7DD3FC', borderRadius: '14px', cursor: 'pointer', background: 'rgba(255,255,255,0.7)' }}>
                            {action.icon || <Camera size={28} color="#0369A1" />}
                            <span style={{ fontSize: '0.82rem', color: '#0369A1', fontWeight: 700, marginTop: '8px' }}>Tap untuk upload foto bukti</span>
                            <span style={{ fontSize: '0.7rem', color: '#7DD3FC' }}>Maks. 5MB</span>
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, action.photoField)} />
                          </label>
                        )}
                      </div>
                    )}

                    {action.requiresPhoto && (
                      <textarea placeholder="Catatan (opsional)..." value={tempNote} onChange={e => setTempNote(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BAE6FD', outline: 'none', fontSize: '0.82rem', resize: 'none', minHeight: '54px', marginBottom: '12px', boxSizing: 'border-box' }} />
                    )}

                    <button
                      onClick={() => handleOrderAction(action)}
                      disabled={isThisUpdating || (action.requiresPhoto && !tempProofs[action.photoField])}
                      style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: (action.requiresPhoto && !tempProofs[action.photoField]) ? '#CBD5E1' : '#064058', color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: isThisUpdating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(6,64,88,0.2)' }}
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
