import React, { useEffect, useState, useRef } from 'react';
import { serviceService } from '../../services/serviceService';
import { promoService } from '../../services/promoService';
import { X, Image as ImageIcon, Edit2, Trash2, Plus, Search, Filter, Clock, Star, Tag } from 'lucide-react';
import './Admin.css';
import Notification from '../../components/Notification';

const AdminServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [promos, setPromos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ serviceName: '', description: '', price: '', duration: '', image: '', type: 'sepatu' });
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoData, setPromoData] = useState({ name: '', percentage: '', startDate: new Date().toISOString().split('T')[0], endDate: '', targetType: 'service', targetId: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [sRes, pRes] = await Promise.all([serviceService.getServicesList(), promoService.getPromos()]);
    setServices(sRes.data || []);
    setPromos(pRes.data || []);
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ serviceName: '', description: '', price: '', duration: '', image: '', type: 'sepatu' });
    setShowModal(true);
  };

  const openEdit = (svc) => {
    setEditingId(svc.service_id || svc.id);
    setFormData({ serviceName: svc.serviceName, description: svc.description, price: Number(svc.price) || 0, duration: svc.duration || '', image: svc.image || '', type: svc.type || 'sepatu' });
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, image: reader.result });
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData, price: parseInt(formData.price) || 0 };
    if (editingId) {
      await serviceService.updateService(editingId, payload);
    } else {
      const newId = Date.now();
      await serviceService.addService({ service_id: newId, id: newId, ...payload });
    }
    setShowModal(false);
    loadData();
  };

  const filteredServices = services.filter(s => {
    const matchSearch = s.serviceName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All' || s.type?.toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  const getActivePromo = (svc) => {
    const now = new Date();
    const svcType = (svc.type || '').toLowerCase();
    return promos.find(p => {
      if (p.status !== 'active') return false;
      const end = new Date(p.endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(p.startDate) > now || end < now) return false;
      if (p.targetType === 'all') return true;
      if (p.targetType === 'category') return (p.categories || []).some(c => c.toLowerCase() === svcType);
      if (p.targetType === 'service') return String(p.targetId) === String(svc.service_id || svc.id);
      return false;
    }) || null;
  };

  const calcDiscount = (price, promo) => promo ? Math.round(price * (1 - promo.percentage / 100)) : price;

  return (
    <div className="admin-root">

      {/* Header */}
      <div className="adm-header adm-fadeUp">
        <div>
          <h2 className="adm-header-title">Manage Services</h2>
          <p className="adm-header-sub">{services.length} layanan terdaftar</p>
        </div>
        <button className="adm-btn-primary" onClick={openAdd}>
          <Plus size={15} /> Tambah
        </button>
      </div>

      {/* Search & Filter */}
      <div className="adm-fade2" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '4px 8px', width: '100%' }}>
          <Search size={16} color="#9CA3AF" style={{ marginLeft: '4px' }} />
          <input 
            placeholder="Cari layanan..." 
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
          {[
            { value: 'All', label: 'Semua' },
            { value: 'sepatu', label: 'Sepatu' },
            { value: 'tas', label: 'Tas' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: '1px solid', whiteSpace: 'nowrap',
                borderColor: filterType === opt.value ? '#064058' : '#E5E7EB',
                backgroundColor: filterType === opt.value ? '#064058' : 'white',
                color: filterType === opt.value ? 'white' : '#4B5563',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Service List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredServices.length === 0
          ? <div className="adm-empty adm-fade2">
            <div className="adm-empty-icon" style={{ background: '#e8f4fb' }}>👟</div>
            <p className="adm-empty-title">Belum ada layanan</p>
            <p className="adm-empty-sub">Mulai tambahkan layanan cuci sepatu</p>
            <button className="adm-btn-primary" onClick={openAdd}><Plus size={14} /> Tambah Layanan</button>
          </div>
          : filteredServices.map(svc => {
            const activePromo = getActivePromo(svc);
            const discountedPrice = calcDiscount(svc.price, activePromo);
            return (
              <div key={svc.service_id || svc.id} className="adm-svc-card adm-fade2">
                {/* Image */}
                <div style={{ position: 'relative' }}>
                  {svc.image && typeof svc.image === 'string' && (svc.image.startsWith('http') || svc.image.startsWith('data:'))
                    ? <img src={svc.image} alt={svc.serviceName} className="adm-svc-img" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'; }} />
                    : <div className="adm-svc-img-placeholder">👟</div>
                  }
                  {activePromo && (
                    <div style={{
                      position: 'absolute', top: 10, left: 10, background: '#ef4444', color: 'white',
                      fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.3px'
                    }}>
                      🔥 {activePromo.percentage}% OFF
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(4px)', color: 'white', fontSize: 10, fontWeight: 700,
                    padding: '3px 8px', borderRadius: 20
                  }}>
                    {svc.type}
                  </div>
                </div>

                {/* Body */}
                <div className="adm-svc-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{svc.serviceName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                          <Clock size={11} /> {svc.duration || '?'} hari
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>
                          <Star size={10} fill="#f59e0b" /> 4.9
                        </span>
                      </div>
                    </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {activePromo && (
                          <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>
                            Rp {Number(svc.price || 0).toLocaleString('id-ID')}
                          </span>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 800, color: activePromo ? '#f59e0b' : '#064058' }}>
                          Rp {Number(discountedPrice || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                  </div>

                  {svc.description && (
                    <p style={{
                      fontSize: 12, color: '#64748b', lineHeight: 1.55, margin: '0 0 10px', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {svc.description}
                    </p>
                  )}

                  {activePromo && (
                    <div style={{
                      background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 9, padding: '7px 10px',
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10
                    }}>
                      <Tag size={12} color="#ea580c" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#c2410c' }}>
                        {activePromo.name} · s/d {activePromo.endDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="adm-svc-actions">
                  <button className="adm-svc-btn edit" onClick={() => openEdit(svc)}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button className="adm-svc-btn del" onClick={() => handleDelete(svc.service_id || svc.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        }
      </div>

      <button className="adm-fab" onClick={openAdd}><Plus size={22} /></button>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{editingId ? 'Edit Layanan' : 'Tambah Layanan'}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Isi detail layanan cuci</div>
              </div>
              <button className="adm-icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'contents' }}>
              <div className="adm-modal-body">

                {/* Image Upload */}
                <div>
                  <label className="adm-field-label">Foto Layanan</label>
                  <div style={{ position: 'relative' }}>
                    {/* Preview area */}
                    {formData.image && (formData.image.startsWith('data:') || formData.image.startsWith('http')) ? (
                      <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                        <img
                          src={formData.image}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'rgba(0,0,0,0.5)', padding: '8px 12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>
                            {formData.image.startsWith('data:') ? '✅ Foto baru dipilih' : '📷 Foto saat ini'}
                          </span>
                          <label style={{ color: '#93c5fd', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Ganti Foto
                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          style={{
                            position: 'absolute', top: 8, right: 8, background: '#ef4444', color: 'white',
                            border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                          title="Hapus Foto"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        width: '100%', height: 130, border: '2px dashed #e2e8f0', borderRadius: 12, cursor: 'pointer',
                        background: '#f8fafc', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 6
                      }}>
                        <ImageIcon size={28} color="#94a3b8" />
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Tap untuk upload foto</span>
                        <span style={{ fontSize: 10, color: '#cbd5e1' }}>JPG, PNG, WEBP</span>
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="adm-field-label">Tipe Layanan</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['sepatu', 'tas'].map(t => (
                      <button key={t} type="button" onClick={() => setFormData({ ...formData, type: t })}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid',
                          borderColor: formData.type === t ? '#064058' : '#e2e8f0',
                          background: formData.type === t ? '#064058' : 'white',
                          color: formData.type === t ? 'white' : '#374151',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize'
                        }}>
                        {t === 'sepatu' ? '👟 Sepatu' : '👜 Tas'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="adm-field-label">Nama Layanan</label>
                  <input className="adm-field-input" placeholder="e.g. Deep Cleaning Premium" required
                    value={formData.serviceName} onChange={e => setFormData({ ...formData, serviceName: e.target.value })} />
                </div>

                <div>
                  <label className="adm-field-label">Deskripsi</label>
                  <textarea className="adm-field-textarea" rows="3" placeholder="Deskripsi layanan..." required
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="adm-field-label">Durasi (Hari)</label>
                    <input className="adm-field-input" placeholder="e.g. 2-3" required
                      value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-field-label">Harga (Rp)</label>
                    <input className="adm-field-input" type="number" min="0" placeholder="30000" required
                      value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="submit" className="adm-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, borderRadius: 12 }}>
                  {editingId ? 'Update Layanan' : 'Simpan Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Promo Modal */}
      {showPromoModal && (
        <div className="adm-modal-overlay" onClick={() => setShowPromoModal(false)}>
          <div className="adm-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Buat Promo</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Diskon khusus untuk layanan ini</div>
              </div>
              <button className="adm-icon-btn" onClick={() => setShowPromoModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              const { promoService: ps } = await import('../../services/promoService');
              await ps.addPromo(promoData);
              setShowPromoModal(false);
              loadData();
            }} style={{ display: 'contents' }}>
              <div className="adm-modal-body">
                <div>
                  <label className="adm-field-label">Nama Promo</label>
                  <input className="adm-field-input" required value={promoData.name}
                    onChange={e => setPromoData({ ...promoData, name: e.target.value })} />
                </div>
                <div>
                  <label className="adm-field-label">Diskon (%)</label>
                  <input className="adm-field-input" type="number" min="1" max="90" required value={promoData.percentage}
                    onChange={e => setPromoData({ ...promoData, percentage: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="adm-field-label">Mulai</label>
                    <input className="adm-field-input" type="date" required value={promoData.startDate}
                      onChange={e => setPromoData({ ...promoData, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-field-label">Berakhir</label>
                    <input className="adm-field-input" type="date" required value={promoData.endDate}
                      onChange={e => setPromoData({ ...promoData, endDate: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="submit" className="adm-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, borderRadius: 12, background: '#f59e0b' }}>
                  Simpan Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="adm-modal-overlay" style={{ alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setConfirmDeleteId(null)}>
          <div className="adm-modal-sheet" style={{ maxWidth: 360, width: '100%', borderRadius: '24px', textAlign: 'center', padding: '24px 20px', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Hapus Layanan</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#4b5563', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={async () => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  try {
                    await serviceService.deleteService(id);
                    setNotification({ show: true, message: 'Layanan berhasil dihapus!', type: 'success' });
                    loadData();
                  } catch (err) {
                    setNotification({ show: true, message: 'Gagal menghapus layanan.', type: 'error' });
                  }
                }}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Component */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />

      <style>{`
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default AdminServiceManagement;
