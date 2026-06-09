import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, getStatusColor, STATUS_LABELS, getStatusFlow, STATUS_DESCRIPTIONS, formatOrderId } from '../services/orderService';
import {
  Check, Package, ChevronDown, ChevronUp,
  MapPin, User, Smartphone, CreditCard,
  Clock, Camera, FileText, Info, Truck,
  Calendar, ShoppingBag, X, ArrowLeft
} from 'lucide-react';
import './Pages.css';

const StatusTimeline = ({ currentStatus, history, orderFlow }) => {
  const steps = orderFlow || ["PENDING", "AWAITING_DROP_OFF", "WAITING_PICKUP", "PROCESSING", "DELIVERED", "FINISHED"];

  const currentIdx = steps.indexOf(currentStatus.toUpperCase());

  return (
    <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '16px' }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={16} /> Tracking Status
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {steps.map((step, index) => {
          const isCompleted = index <= currentIdx;
          const isLast = index === steps.length - 1;
          const isActive = index === currentIdx;

          const historyItem = history?.find(h => h.status === step);
          const timeLabel = historyItem ? new Date(historyItem.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null;
          const dateLabel = historyItem ? new Date(historyItem.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : null;

          return (
            <div key={step} style={{ display: 'flex', gap: '12px', minHeight: '50px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  backgroundColor: isCompleted ? '#064058' : '#E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2, border: isActive ? '4px solid #E8F7FC' : 'none'
                }}>
                  {isCompleted ? <Check size={14} color="white" strokeWidth={3} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#CBD5E1' }} />}
                </div>
                {!isLast && (
                  <div style={{
                    width: '2px', flex: 1,
                    backgroundColor: index < currentIdx ? '#064058' : '#E2E8F0',
                    margin: '4px 0'
                  }} />
                )}
              </div>
              <div style={{ paddingBottom: isLast ? 0 : '20px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.875rem', fontWeight: isCompleted ? 700 : 500,
                    color: isCompleted ? '#1E293B' : '#94A3B8'
                  }}>
                    {STATUS_LABELS[step] || step}
                  </span>
                  {historyItem && (
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      {dateLabel}, {timeLabel}
                    </span>
                  )}
                </div>
                {isActive && <span style={{ fontSize: '0.75rem', color: '#064058', fontWeight: 600 }}>Current Status</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrderHistory = () => {
  const [history, setHistory] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    orderService.getHistory().then(res => {
      // Only show FINISHED and CANCELLED orders in history
      const filtered = res.data.filter(order =>
        order.status === 'FINISHED' || order.status === 'CANCELLED'
      );
      setHistory([...filtered].reverse());
    });
  }, []);

  const groupedOrders = history.reduce((groups, order) => {
    const dateStr = order.created_at || order.createdAt || new Date().toISOString();
    const dateObj = new Date(dateStr);
    const monthYear = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(order);
    return groups;
  }, {});

  const toggleOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const openFullDetail = (e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
  };

  const closeDetail = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="page-container" style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px 100px 16px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <style>{`
        .history-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .history-card:active {
          transform: scale(0.98);
        }
        .detail-section {
          animation: slideDown 0.3s ease-out forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem', paddingTop: '1.5rem' }}>
        <button
          onClick={() => navigate('/home')}
          style={{ width: 36, height: 36, borderRadius: 12, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', flexShrink: 0 }}
        >
          <ArrowLeft size={18} color="#064058" />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0, flex: 1 }}>Riwayat Pesanan</h2>
      </div>

      {history.length === 0 ? (
        <div className="empty-state" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#E8F7FC', padding: '24px', borderRadius: '50%', marginBottom: '8px' }}>
            <ShoppingBag size={48} color="#064058" />
          </div>
          <h3 style={{ margin: 0, color: '#1E293B', fontSize: '1.25rem', fontWeight: 800 }}>No Orders Found</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>Start your laundry journey today!</p>
        </div>
      ) : (
        <div className="order-history-groups" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(groupedOrders).map(([monthYear, orders]) => (
            <div key={monthYear} className="history-group">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#475569', marginBottom: '16px', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {monthYear}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => {
                  const isExpanded = expandedOrderId === order.order_id;
                  const colors = getStatusColor(order.status);

                  return (
                    <div
                      key={order.order_id}
                      className="history-card card"
                      onClick={() => toggleOrder(order.order_id)}
                      style={{
                        padding: '16px',
                        boxShadow: isExpanded ? '0 10px 25px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.04)',
                        border: isExpanded ? '1px solid #E2E8F0' : '1px solid transparent',
                        borderRadius: '20px',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Header: ID & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>{formatOrderId(order)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: '8px',
                            fontSize: '0.7rem'
                          }}>
                            {STATUS_LABELS[order.status?.toUpperCase()] || order.status}
                          </span>
                          <div style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                          }}>
                            <ChevronDown size={18} color="#94A3B8" />
                          </div>
                        </div>
                      </div>

                      {/* Main Service Row */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <div style={{
                          width: '60px', height: '60px', borderRadius: '12px',
                          backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0
                        }}>
                          {order.photo ? (
                            <img src={order.photo} alt="Shoes" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                          ) : (
                            <Package size={24} color="#94A3B8" />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                            {order.service || 'Service Layanan'}
                          </p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                            {order.quantity || 1} Pair(s) • {order.type || 'Standard'}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                            <span style={{ fontWeight: 800, color: '#064058', fontSize: '1rem' }}>
                              Rp {Number(order.total_price || order.totalPrice || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Section */}
                      {isExpanded && (
                        <div className="detail-section" style={{ borderTop: '1px solid #F1F5F9', marginTop: '16px', paddingTop: '16px' }}>

                          {/* Detailed Status Timeline */}
                          <StatusTimeline
                            currentStatus={order.status}
                            history={order.history}
                            orderFlow={getStatusFlow(order)}
                          />

                          {/* Quick Info Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                            <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px' }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>PICKUP</p>
                              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{order.pickupMethod === 'SELF_DROP' ? 'Self Drop' : 'Courier Pickup'}</p>
                            </div>
                            <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px' }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>DELIVERY</p>
                              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{order.returnMethod === 'SELF_PICKUP' ? 'Self Pickup' : 'Courier Delivery'}</p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={(e) => openFullDetail(e, order)}
                            style={{
                              width: '100%', marginTop: '20px', padding: '12px',
                              borderRadius: '12px', border: '1px solid #064058',
                              backgroundColor: 'white', color: '#064058',
                              fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay open" style={{ zIndex: 1000, padding: '16px', alignItems: 'center' }}>
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: '24px', backgroundColor: 'white' }}>
            {/* Shopee-style Modal Header */}
            <div style={{
              backgroundColor: getStatusColor(selectedOrder.status).bg,
              margin: '-24px -24px 24px -24px',
              padding: '32px 24px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  backgroundColor: 'white', padding: '10px', borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Package size={28} color={getStatusColor(selectedOrder.status).text} />
                </div>
                <button onClick={closeDetail} style={{ border: 'none', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} color="#111827" />
                </button>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: getStatusColor(selectedOrder.status).text }}>
                  {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: getStatusColor(selectedOrder.status).text, opacity: 0.8, lineHeight: 1.4 }}>
                  {STATUS_DESCRIPTIONS[selectedOrder.status] || "Status sedang diperbarui..."}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>

              {/* Vertical Tracking Stepper */}
              <section>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#064058" /> Lacak Pesanan
                </h4>
                <div style={{ position: 'relative', paddingLeft: '32px' }}>
                  {/* Vertical Line */}
                  <div style={{
                    position: 'absolute', left: '11px', top: '10px', bottom: '10px',
                    width: '2px', backgroundColor: '#E2E8F0'
                  }}></div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {getStatusFlow(selectedOrder).map((status, idx) => {
                      const flow = getStatusFlow(selectedOrder);
                      const currentIndex = flow.indexOf(selectedOrder.status);
                      const isCompleted = idx < currentIndex;
                      const isCurrent = idx === currentIndex;

                      return (
                        <div key={status} style={{ position: 'relative' }}>
                          {/* Step Indicator */}
                          <div style={{
                            position: 'absolute', left: '-27px', top: '2px',
                            width: '12px', height: '12px', borderRadius: '50%',
                            backgroundColor: isCurrent ? getStatusColor(status).text : (isCompleted ? '#064058' : '#CBD5E1'),
                            border: isCurrent ? `4px solid ${getStatusColor(status).bg}` : '2px solid white',
                            zIndex: 2,
                            boxShadow: isCurrent ? `0 0 0 4px ${getStatusColor(status).bg}` : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isCompleted && <Check size={8} color="white" strokeWidth={4} />}
                          </div>

                          <div style={{ opacity: (isCompleted || isCurrent) ? 1 : 0.5 }}>
                            <p style={{
                              margin: 0, fontSize: '0.875rem', fontWeight: isCurrent ? 800 : 600,
                              color: isCurrent ? getStatusColor(status).text : '#1E293B'
                            }}>
                              {STATUS_LABELS[status]}
                            </p>
                            {isCurrent && (
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
                                {STATUS_DESCRIPTIONS[status]}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Logistic Info Card */}
              <section style={{ backgroundColor: '#F8FAFC', borderRadius: '20px', padding: '20px', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: '#64748B' }}><Truck size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Informasi Pengiriman</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                        {selectedOrder.pickupMethod === 'SELF_DROP' ? 'Drop Off Sendiri' : 'Dijemput Admin'} • {selectedOrder.returnMethod === 'SELF_PICKUP' ? 'Ambil Sendiri' : 'Diantar Admin'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: '#64748B' }}><MapPin size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Alamat Tujuan</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>{selectedOrder.customerName}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.875rem', color: '#64748B', lineHeight: 1.5 }}>
                        {selectedOrder.address?.detail || 'Alamat tidak tersedia'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Admin Proof Images Section */}
              {(selectedOrder.pickup_photo || selectedOrder.received_photo || selectedOrder.delivery_photo) && (
                <section>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={18} color="#064058" /> Bukti Foto Layanan
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedOrder.pickup_photo && (
                      <div style={{ border: '1px solid #F1F5F9', padding: '12px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#064058' }}>📸 Bukti Penjemputan</p>
                          {selectedOrder.pickup_photo_time && <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(selectedOrder.pickup_photo_time).toLocaleString('id-ID')}</span>}
                        </div>
                        <img src={selectedOrder.pickup_photo} alt="Pickup Proof" style={{ width: '100%', borderRadius: '12px', height: '180px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(selectedOrder.pickup_photo, '_blank')} />
                      </div>
                    )}
                    {selectedOrder.received_photo && (
                      <div style={{ border: '1px solid #F1F5F9', padding: '12px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#064058' }}>📸 Bukti Terima di Toko</p>
                          {selectedOrder.received_photo_time && <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(selectedOrder.received_photo_time).toLocaleString('id-ID')}</span>}
                        </div>
                        <img src={selectedOrder.received_photo} alt="Received Proof" style={{ width: '100%', borderRadius: '12px', height: '180px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(selectedOrder.received_photo, '_blank')} />
                      </div>
                    )}
                    {selectedOrder.delivery_photo && (
                      <div style={{ border: '1px solid #F1F5F9', padding: '12px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#064058' }}>{selectedOrder.returnMethod === 'SELF_PICKUP' ? '📸 Bukti Pengambilan' : '📸 Bukti Pengantaran'}</p>
                          {selectedOrder.delivery_photo_time && <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(selectedOrder.delivery_photo_time).toLocaleString('id-ID')}</span>}
                        </div>
                        <img src={selectedOrder.delivery_photo} alt="Delivery Proof" style={{ width: '100%', borderRadius: '12px', height: '180px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(selectedOrder.delivery_photo, '_blank')} />
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Notes Section */}
              {selectedOrder.notes && (
                <section>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#064058" /> Catatan untuk Admin
                  </h4>
                  <div style={{ backgroundColor: '#F1F5F9', padding: '16px', borderRadius: '16px' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>{selectedOrder.notes}</p>
                  </div>
                </section>
              )}

              {/* Service Summary */}
              <section style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Ringkasan Layanan</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '1rem', fontWeight: 800, color: '#064058' }}>{selectedOrder.service}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>{selectedOrder.quantity || 1} Pasang • {selectedOrder.type}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>TOTAL BAYAR</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#064058' }}>Rp {Number(selectedOrder.total_price || selectedOrder.totalPrice || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </section>

              <button
                onClick={closeDetail}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px',
                  backgroundColor: '#064058', color: 'white', border: 'none',
                  fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(6, 64, 88, 0.2)'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
