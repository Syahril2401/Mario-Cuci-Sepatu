import React, { useEffect, useState } from 'react';
import { promoService } from '../../services/promoService';
import { serviceService } from '../../services/serviceService';
import { X, Plus, Tag, Calendar, Edit2, Trash2, ToggleLeft, ToggleRight, Package, XCircle } from 'lucide-react';
import './Admin.css';

const AdminPromoManagement = () => {
  const [promos, setPromos]       = useState([]);
  const [services, setServices]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData]   = useState({
    name:'', percentage:'', targetType:'all', targetId:'', categories:[],
    startDate: new Date().toISOString().split('T')[0], endDate:'', status:'active'
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [p, s] = await Promise.all([promoService.getPromos(), serviceService.getServicesList()]);
    setPromos(p.data || []);
    setServices(s.data || []);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormError('');
    setFormData({ name:'', percentage:'', targetType:'all', targetId:'', categories:[],
      startDate: new Date().toISOString().split('T')[0], endDate:'', status:'active' });
    setShowModal(true);
  };

  const getLocalDateStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const openEdit = (promo) => { 
    setEditingId(promo.promo_id || promo.id); 
    setFormError('');
    setFormData({
      ...promo,
      name: promo.promoCode || promo.name || '',
      startDate: getLocalDateStr(promo.startDate),
      endDate: getLocalDateStr(promo.endDate)
    }); 
    setShowModal(true); 
  };

  const handleDelete = async (id) => {
    try {
      await promoService.deletePromo(id); 
      setDeleteConfirmId(null);
      loadData(); 
    } catch (err) {
      alert('Gagal menghapus promo: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggle = async (promo) => {
    const payload = {
      ...promo,
      name: promo.promoCode || promo.name || '',
      startDate: getLocalDateStr(promo.startDate),
      endDate: getLocalDateStr(promo.endDate),
      status: promo.status === 'active' ? 'inactive' : 'active'
    };
    await promoService.updatePromo(promo.promo_id || promo.id, payload);
    loadData();
  };

  // Get active (non-expired, status=active) promos excluding the one being edited
  const getActiveNonExpiredPromos = () => {
    return promos.filter(p => {
      if (editingId && (p.promo_id || p.id) === editingId) return false;
      if (p.status !== 'active') return false;
      if (isExpired(p)) return false;
      return true;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate percentage is a number 1-90
    const pct = parseInt(formData.percentage);
    if (isNaN(pct) || pct < 1 || pct > 90) { setFormError('Diskon harus berupa angka antara 1% – 90%'); return; }

    // Validate end date is not before start date
    if (new Date(formData.endDate) < new Date(formData.startDate)) { setFormError('Tanggal akhir tidak boleh sebelum tanggal mulai'); return; }

    const activePromos = getActiveNonExpiredPromos();

    // Validation: only 1 promo for "all" at a time
    if (formData.targetType === 'all') {
      const existingAll = activePromos.find(p => p.targetType === 'all');
      if (existingAll) {
        setFormError('Sudah ada promo aktif untuk semua layanan ("' + (existingAll.promoCode || existingAll.name) + '"). Nonaktifkan terlebih dahulu sebelum membuat promo baru.');
        return;
      }
      // Also block if any category promo exists
      const existingCat = activePromos.find(p => p.targetType === 'category');
      if (existingCat) {
        setFormError('Sudah ada promo aktif per kategori ("' + (existingCat.promoCode || existingCat.name) + '"). Nonaktifkan terlebih dahulu sebelum membuat promo untuk semua layanan.');
        return;
      }
      // Also block if any service promo exists
      const existingSvc = activePromos.find(p => p.targetType === 'service');
      if (existingSvc) {
        setFormError('Sudah ada promo aktif per layanan ("' + (existingSvc.promoCode || existingSvc.name) + '"). Nonaktifkan terlebih dahulu sebelum membuat promo untuk semua layanan.');
        return;
      }
    }

    // Validation: only 1 promo per category
    if (formData.targetType === 'category') {
      const selectedCats = formData.categories || [];
      for (const cat of selectedCats) {
        const existingAll = activePromos.find(p => p.targetType === 'all');
        if (existingAll) {
          setFormError('Sudah ada promo aktif untuk semua layanan ("' + (existingAll.promoCode || existingAll.name) + '") yang mencakup kategori ' + cat + '. Nonaktifkan terlebih dahulu.');
          return;
        }
        const existingCat = activePromos.find(p => 
          p.targetType === 'category' && (p.categories || []).some(c => c.toLowerCase() === cat.toLowerCase())
        );
        if (existingCat) {
          setFormError('Sudah ada promo aktif untuk kategori ' + cat + ' ("' + (existingCat.promoCode || existingCat.name) + '"). Nonaktifkan terlebih dahulu.');
          return;
        }
      }
    }

    // Validation: only 1 promo per specific service
    if (formData.targetType === 'service') {
      const existingAll = activePromos.find(p => p.targetType === 'all');
      if (existingAll) {
        setFormError('Sudah ada promo aktif untuk semua layanan ("' + (existingAll.promoCode || existingAll.name) + '"). Nonaktifkan terlebih dahulu.');
        return;
      }
      const svc = services.find(s => String(s.service_id || s.id) === String(formData.targetId));
      const svcType = (svc?.type || '').toLowerCase();
      const existingCat = activePromos.find(p => 
        p.targetType === 'category' && (p.categories || []).some(c => c.toLowerCase() === svcType)
      );
      if (existingCat) {
        setFormError('Sudah ada promo aktif untuk kategori ' + (svc?.type || '') + ' ("' + (existingCat.promoCode || existingCat.name) + '") yang mencakup layanan ini. Nonaktifkan terlebih dahulu.');
        return;
      }
      const existingSvc = activePromos.find(p => 
        p.targetType === 'service' && String(p.targetId) === String(formData.targetId)
      );
      if (existingSvc) {
        setFormError('Sudah ada promo aktif untuk layanan ini ("' + (existingSvc.promoCode || existingSvc.name) + '"). Nonaktifkan terlebih dahulu.');
        return;
      }
    }

    if (editingId) await promoService.updatePromo(editingId, formData);
    else           await promoService.addPromo(formData);
    setShowModal(false); loadData();
  };

  const getPromoName = (p) => p.promoCode || p.name || 'Promo';

  const getTargetLabel = (p) => {
    if (p.targetType === 'all') return '🌐 Semua Layanan';
    if (p.targetType === 'category') return `📂 ${(p.categories||[]).join(', ')}`;
    const svc = services.find(s => String(s.service_id||s.id) === String(p.targetId));
    return `📦 ${svc?.serviceName || 'Layanan Tertentu'}`;
  };

  const isExpired = (p) => {
    if (!p.endDate) return false;
    const dateString = getLocalDateStr(p.endDate);
    const [y, m, d] = dateString.split('-');
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    return end < new Date();
  };
  const cardClass = (p) => p.status !== 'active' ? 'inactive' : isExpired(p) ? 'expired' : 'active';

  const getTimeLeft = (endDate) => {
    if (!endDate) return '';
    const dateString = getLocalDateStr(endDate);
    const [y, m, d] = dateString.split('-');
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    const msLeft = end - new Date();
    
    if (msLeft <= 0) return '';
    
    const dLeft = Math.floor(msLeft / (1000*60*60*24));
    const hLeft = Math.floor((msLeft % (1000*60*60*24)) / (1000*60*60));
    
    if (dLeft > 0) {
      return hLeft > 0 ? `${dLeft} hari ${hLeft} jam lagi` : `${dLeft} hari lagi`;
    } else {
      return hLeft > 0 ? `${hLeft} jam lagi` : `< 1 jam lagi`;
    }
  };

  return (
    <div className="admin-root">

      {/* Header */}
      <div className="adm-header adm-fadeUp">
        <div>
          <h2 className="adm-header-title">Promo Manager</h2>
          <p className="adm-header-sub">{promos.length} promo terdaftar</p>
        </div>
        <button className="adm-btn-primary" onClick={openAdd}>
          <Plus size={15} /> Buat Promo
        </button>
      </div>

      {/* Summary Pills */}
      {promos.length > 0 && (
        <div className="adm-fade2" style={{ display:'flex', gap:8, marginBottom:16, overflow:'hidden' }}>
          {[
            { label:'Aktif',    val: promos.filter(p=>p.status==='active'&&!isExpired(p)).length, color:'#dcfce7', text:'#15803d' },
            { label:'Expired',  val: promos.filter(p=>isExpired(p)).length,                       color:'#fee2e2', text:'#b91c1c' },
            { label:'Inactive', val: promos.filter(p=>p.status!=='active').length,                 color:'#f1f5f9', text:'#475569' },
          ].map(s => (
            <div key={s.label} style={{ flex:1, background:s.color, borderRadius:12, padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:900, color:s.text }}>{s.val}</div>
              <div style={{ fontSize:10, fontWeight:700, color:s.text, opacity:0.75 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Promo List */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {promos.length === 0
          ? <div className="adm-empty adm-fade2">
              <div className="adm-empty-icon"><Tag size={26} color="#0a7da8" /></div>
              <p className="adm-empty-title">Belum ada promo</p>
              <p className="adm-empty-sub">Buat promo pertama Anda untuk menarik lebih banyak pelanggan</p>
              <button className="adm-btn-primary" onClick={openAdd} style={{ marginTop:4 }}><Plus size={14} /> Buat Promo</button>
            </div>
          : promos.map(promo => {
              const cls     = cardClass(promo);
              const expired = isExpired(promo);
              const active  = promo.status === 'active' && !expired;
              const leftStr = getTimeLeft(promo.endDate);
              return (
                <div key={promo.promo_id || promo.id} className={`adm-promo-card ${cls} adm-fade2`}>
                  {/* Top row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20,
                          background: active ? '#dcfce7' : expired ? '#fee2e2' : '#f1f5f9',
                          color:      active ? '#15803d' : expired ? '#b91c1c' : '#64748b' }}>
                          {active ? '● Aktif' : expired ? '✕ Expired' : '○ Inactive'}
                        </span>
                        {active && leftStr && (
                          <span style={{ fontSize:10, color:'#64748b', fontWeight:600 }}>{leftStr}</span>
                        )}
                      </div>
                      <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>{getPromoName(promo)}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:22, fontWeight:900, color: active ? '#064058' : '#94a3b8' }}>
                        {promo.percentage}%
                      </div>
                      <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>DISKON</div>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12, padding:'10px 12px', background:'#f8fafc', borderRadius:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:11.5, color:'#475569', fontWeight:600 }}>
                      <Package size={13} /> {getTargetLabel(promo)}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:11.5, color:'#475569', fontWeight:600 }}>
                      <Calendar size={13} /> {getLocalDateStr(promo.startDate)} – {getLocalDateStr(promo.endDate)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <button onClick={() => handleToggle(promo)} style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px', borderRadius:9, border:'none',
                      background: active ? '#dcfce7' : '#f1f5f9', color: active ? '#15803d' : '#64748b', fontWeight:700, fontSize:11.5, cursor:'pointer' }}>
                      {active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {active ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button onClick={() => openEdit(promo)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'white', color:'#374151', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => setDeleteConfirmId(promo.promo_id || promo.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:9, border:'none', background:'#fee2e2', color:'#b91c1c', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* FAB */}
      <button className="adm-fab" onClick={openAdd}><Plus size={22} /></button>

      {/* Modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>{editingId ? 'Edit Promo' : 'Buat Promo Baru'}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>Atur diskon untuk layanan Anda</div>
              </div>
              <button className="adm-icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display:'contents' }}>
              <div className="adm-modal-body">

                {formError && (
                  <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:8 }}>
                    <XCircle size={16} color="#DC2626" style={{ flexShrink:0, marginTop:1 }} />
                    <span style={{ fontSize:12.5, color:'#991B1B', fontWeight:600, lineHeight:1.4 }}>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="adm-field-label">Nama Promo</label>
                  <input className="adm-field-input" placeholder="e.g. Ramadhan Sale" required
                    value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} />
                </div>

                <div>
                  <label className="adm-field-label">Diskon (%)</label>
                  <input className="adm-field-input" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 20" required
                    value={formData.percentage} 
                    onInput={e => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }}
                    onChange={e => setFormData({...formData, percentage: e.target.value.replace(/[^0-9]/g, '')})} />
                </div>

                <div>
                  <label className="adm-field-label">Berlaku Untuk</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {['all','category','service'].map(t => (
                      <button key={t} type="button"
                        onClick={() => setFormData({...formData, targetType:t})}
                        style={{ padding:'8px 14px', borderRadius:20, border:'1.5px solid',
                          borderColor: formData.targetType === t ? '#064058' : '#e2e8f0',
                          background:  formData.targetType === t ? '#064058' : 'white',
                          color:       formData.targetType === t ? 'white' : '#374151',
                          fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {t === 'all' ? 'Semua' : t === 'category' ? 'Kategori' : 'Layanan Tertentu'}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.targetType === 'category' && (
                  <div>
                    <label className="adm-field-label">Pilih Kategori</label>
                    <div style={{ display:'flex', gap:10 }}>
                      {['Sepatu','Tas'].map(cat => (
                        <label key={cat} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                          <input type="checkbox" checked={formData.categories?.includes(cat)}
                            onChange={e => {
                              const nc = e.target.checked ? [...(formData.categories||[]), cat] : (formData.categories||[]).filter(c=>c!==cat);
                              setFormData({...formData, categories:nc});
                            }} />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.targetType === 'service' && (
                  <div>
                    <label className="adm-field-label">Pilih Layanan</label>
                    <select className="adm-field-select" required value={formData.targetId}
                      onChange={e => setFormData({...formData, targetId:e.target.value})}>
                      <option value="">-- Pilih Layanan --</option>
                      {services.map(s => <option key={s.service_id||s.id} value={s.service_id||s.id}>{s.serviceName}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label className="adm-field-label">Mulai</label>
                    <input className="adm-field-input" type="date" required value={formData.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setFormData({...formData, startDate:e.target.value})} />
                  </div>
                  <div>
                    <label className="adm-field-label">Berakhir</label>
                    <input className="adm-field-input" type="date" required value={formData.endDate}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      onChange={e => setFormData({...formData, endDate:e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="submit" className="adm-btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:14, borderRadius:12 }}>
                  {editingId ? 'Update Promo' : 'Simpan Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deleteConfirmId && (
        <div className="adm-modal-overlay" style={{ zIndex: 2000, alignItems: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '25px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={24} color="#EF4444" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Hapus Promo?</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: '#6B7280' }}>
              Tindakan ini tidak dapat dibatalkan. Promo akan dihapus secara permanen.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => handleDelete(deleteConfirmId)} 
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                Hapus
              </button>
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#F3F4F6', color: '#4B5563', fontWeight: 700, cursor: 'pointer' }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromoManagement;
