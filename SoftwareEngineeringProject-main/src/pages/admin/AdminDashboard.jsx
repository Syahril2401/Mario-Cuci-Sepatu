import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { getStatusFlow, getStatusColor, STATUS_LABELS } from '../../services/orderService';
import {
  Package, Users, Wrench, PlusCircle, ListOrdered,
  Clock, ShoppingBag, DollarSign, Bell, Activity,
  ChevronRight, TrendingUp, X, AlertCircle, ArrowRight
} from 'lucide-react';
import './Admin.css';

const AVATAR_BG = ['#064058','#7c3aed','#0369a1','#be185d','#0f766e','#b45309'];
const initials = (name = '') => name.split(' ').slice(0,2).map(w => w[0]?.toUpperCase()).join('') || '?';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalOrders:0, totalUsers:0, totalServices:0, ordersToday:0, revenueToday:0, pendingOrders:0 });
  const [needsAttention, setNeedsAttention] = useState([]);
  const [recentOrders, setRecentOrders]     = useState([]);
  const [showNotif, setShowNotif]           = useState(false);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const response = await adminService.getDashboardStats();
      const data = response.data;
      setStats(data.stats);
      setNeedsAttention(data.needsAttention || []);
      setRecentOrders(data.recentOrders || []);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleStatusAction = async (orderId, currentStatus) => {
    try {
      // Dapatkan data order dari API (opsional: jika kita bisa ambil langsung)
      // Tapi kita butuh order untuk getStatusFlow.
      const res = await adminService.getDashboardStats();
      const allOrders = [...(res.data.needsAttention || []), ...(res.data.recentOrders || [])];
      let order = allOrders.find(o => o.order_id === orderId);
      
      // Jika tidak ada di daftar stats, fetch order by id
      if (!order) {
        const orderRes = await import('../../services/orderService').then(m => m.orderService.getOrderById(orderId));
        order = orderRes.data;
      }
      if (!order) return;

      const flow   = getStatusFlow(order);
      const norm   = currentStatus === 'PENDING' ? 'MENUNGGU_VERIFIKASI' : currentStatus;
      const ci     = flow.indexOf(norm);
      const next   = ci !== -1 && ci < flow.length-1 ? flow[ci+1] : null;

      if (next && next !== 'FINISHED') {
        const { orderService } = await import('../../services/orderService');
        await orderService.updateOrder({ order_id: orderId, status: next });
        fetchStats();
      }
    } catch (error) {
      console.error("Gagal update status:", error);
    }
  };

  const QUICK = [
    { label:'Add Service', icon:<PlusCircle size={20}/>, bg:'#e8f4fb', path:'/admin/services', primary:true },
    { label:'Orders',      icon:<ListOrdered size={18}/>,bg:'#f3f0ff', path:'/admin/orders'  },
    { label:'Promos',      icon:<Package size={18}/>,    bg:'#fff7ed', path:'/admin/promos'   },
    { label:'Reports',     icon:<Activity size={18}/>,   bg:'#f0fdf4', path:'/admin/report'   },
  ];

  return (
    <div className="admin-root">

      {/* ── Header ── */}
      <div className="adm-header adm-fadeUp">
        <div>
          <h2 className="adm-header-title">Dashboard</h2>
          <p className="adm-header-sub">Control Center · Mario Cuci Sepatu</p>
        </div>
        <div style={{ position:'relative' }}>
          <button className="adm-icon-btn" onClick={() => setShowNotif(!showNotif)}>
            <Bell size={18} />
            {needsAttention.length > 0 && (
              <span style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%', background:'#ef4444', border:'2px solid white' }} />
            )}
          </button>
          {showNotif && (
            <div className="adm-notif-dropdown">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>Notifikasi</span>
                <button onClick={() => setShowNotif(false)} style={{ border:'none', background:'#f1f5f9', borderRadius:'50%', padding:4, cursor:'pointer' }}>
                  <X size={13} color="#64748b" />
                </button>
              </div>
              {needsAttention.length === 0
                ? <p style={{ textAlign:'center', color:'#94a3b8', fontSize:12, padding:'12px 0' }}>Tidak ada notifikasi baru</p>
                : needsAttention.map(o => (
                  <div key={o.order_id} onClick={() => { navigate('/admin/orders'); setShowNotif(false); }}
                    style={{ display:'flex', gap:10, alignItems:'center', padding:'9px 10px', borderRadius:10, background:'#f8fafc', marginBottom:6, cursor:'pointer' }}>
                    <div style={{ background:'#fff7ed', padding:7, borderRadius:9 }}><Clock size={14} color="#d97706" /></div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#0f172a' }}>{o.customerName}</p>
                      <p style={{ margin:0, fontSize:11, color:'#64748b' }}>{STATUS_LABELS[o.status] || o.status}</p>
                    </div>
                  </div>
                ))
              }
              {needsAttention.length > 0 && (
                <button onClick={() => { navigate('/admin/orders'); setShowNotif(false); }}
                  style={{ width:'100%', marginTop:8, padding:'9px', border:'none', background:'#f1f5f9', borderRadius:9, fontSize:11.5, fontWeight:700, color:'#475569', cursor:'pointer' }}>
                  Lihat Semua Order
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Needs Attention ── */}
      {needsAttention.length > 0 && (
        <section className="adm-fade2" style={{ marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span className="adm-section-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ animation:'adm-pulse 2s infinite', display:'inline-block' }}>🚨</span> Perlu Diproses
            </span>
            <span style={{ fontSize:11, color:'#d97706', fontWeight:700 }}>{needsAttention.length} pesanan</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {needsAttention.map((o, i) => {
              const isVerifikasi = o.status === 'MENUNGGU_VERIFIKASI';
              const isPending = o.status === 'PENDING';
              return (
                <div key={o.order_id} className={`adm-attention-card ${isVerifikasi ? '' : 'blue'}`}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <span style={{ fontSize:10, color:'#92400e', fontWeight:700 }}>{o.order_id}</span>
                      <p style={{ margin:'2px 0 0', fontSize:14, fontWeight:800, color:'#0f172a' }}>{o.customerName}</p>
                      <p style={{ margin:'2px 0 0', fontSize:11, color:'#64748b' }}>{o.service || 'N/A'}</p>
                    </div>
                    <span className="adm-badge" style={{ background: getStatusColor(o.status).bg, color: getStatusColor(o.status).text }}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    {isPending ? (
                      <div style={{ flex:2, padding:'9px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc',
                        fontSize:12, fontWeight:700, textAlign:'center', color:'#94a3b8' }}>
                        ⏳ Menunggu User Bayar
                      </div>
                    ) : (
                      <button onClick={() => handleStatusAction(o.order_id, o.status)}
                        style={{ flex:2, padding:'9px', borderRadius:10, border:'none', background: isVerifikasi ? '#d97706' : '#2563eb',
                          color:'white', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {isVerifikasi ? '✓ Verifikasi' : '▶ Proses'}
                      </button>
                    )}
                    <button onClick={() => navigate('/admin/orders')}
                      style={{ flex:1, padding:'9px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', fontSize:12, fontWeight:700, cursor:'pointer', color:'#374151' }}>
                      Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Today's Stats Scroll ── */}
      <section className="adm-fade2" style={{ marginBottom:18 }}>
        <div className="adm-section-label">Ringkasan Hari Ini</div>
        <div className="adm-stats-scroll">
          <div className="adm-stat-card navy-grad" style={{ minWidth:150 }}>
            <div className="adm-stat-icon"><ShoppingBag size={16} color="white" /></div>
            <div className="adm-stat-label">Orders Hari Ini</div>
            <div className="adm-stat-val">{stats.ordersToday}</div>
          </div>
          <div className="adm-stat-card" style={{ minWidth:155 }}>
            <div className="adm-stat-icon" style={{ background:'#dcfce7' }}><DollarSign size={16} color="#15803d" /></div>
            <div className="adm-stat-label">Revenue Hari Ini</div>
            <div className="adm-stat-val" style={{ fontSize:15 }}>Rp {stats.revenueToday.toLocaleString('id-ID')}</div>
          </div>
          <div className="adm-stat-card" style={{ minWidth:130 }}>
            <div className="adm-stat-icon" style={{ background:'#fee2e2' }}><Clock size={16} color="#b91c1c" /></div>
            <div className="adm-stat-label">Antrian Aktif</div>
            <div className="adm-stat-val">{stats.pendingOrders}</div>
          </div>
        </div>
      </section>

      {/* ── Big Stats Grid ── */}
      <section className="adm-fade3" style={{ marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div className="adm-card" style={{ padding:16, position:'relative', overflow:'hidden' }}>
            <Package size={56} style={{ position:'absolute', right:-10, bottom:-10, opacity:0.05, color:'#064058' }} />
            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px' }}>TOTAL ORDER</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#0f172a', lineHeight:1.1, marginTop:4 }}>{stats.totalOrders}</div>
            <div className="adm-stat-trend up">↑ +{stats.ordersToday} hari ini</div>
          </div>
          <div className="adm-card" style={{ padding:16, position:'relative', overflow:'hidden' }}>
            <Users size={56} style={{ position:'absolute', right:-10, bottom:-10, opacity:0.05, color:'#064058' }} />
            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px' }}>CUSTOMERS</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#0f172a', lineHeight:1.1, marginTop:4 }}>{stats.totalUsers}</div>
            <div className="adm-stat-trend up"><TrendingUp size={9} /> Growing</div>
          </div>
          <div className="adm-card" style={{ gridColumn:'1/-1', padding:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px' }}>LAYANAN AKTIF</div>
              <div style={{ fontSize:28, fontWeight:900, color:'#0f172a', lineHeight:1.1, marginTop:4 }}>{stats.totalServices}</div>
            </div>
            <div style={{ width:48, height:48, borderRadius:14, background:'#e8f4fb', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Wrench size={22} color="#064058" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Control ── */}
      <section className="adm-fade3" style={{ marginBottom:18 }}>
        <div className="adm-section-label">Quick Actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button className="adm-quick-btn primary span2" style={{ flexDirection:'row', justifyContent:'center', gridColumn:'1/-1' }}
            onClick={() => navigate('/admin/services')}>
            <div className="adm-quick-icon"><PlusCircle size={20} color="white" /></div>
            Tambah Layanan Baru
          </button>
          {[
            { label:'Manage Orders', icon:<ListOrdered size={18}/>, bg:'#f3f0ff', path:'/admin/orders', color:'#6d28d9' },
            { label:'View Reports',  icon:<Activity size={18}/>,    bg:'#f0fdf4', path:'/admin/report',  color:'#15803d' },
            { label:'Promo Manager', icon:<Package size={18}/>,     bg:'#fff7ed', path:'/admin/promos',  color:'#b45309' },
            { label:'All Services',  icon:<Wrench size={18}/>,      bg:'#eff6ff', path:'/admin/services',color:'#1d4ed8' },
          ].map(q => (
            <button key={q.path} className="adm-quick-btn" onClick={() => navigate(q.path)}>
              <div className="adm-quick-icon" style={{ background: q.bg }}>{React.cloneElement(q.icon, { color: q.color })}</div>
              <span style={{ fontSize:11 }}>{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div className="adm-section-label" style={{ marginBottom:0 }}>Aktivitas Terbaru</div>
          <button onClick={() => navigate('/admin/orders')}
            style={{ background:'none', border:'none', color:'#064058', fontSize:11.5, fontWeight:700, display:'flex', alignItems:'center', gap:2, cursor:'pointer' }}>
            Lihat Semua <ChevronRight size={13} />
          </button>
        </div>
        {recentOrders.length === 0
          ? <div className="adm-empty"><div className="adm-empty-icon"><ShoppingBag size={24} color="#0a7da8" /></div><p className="adm-empty-title">Belum ada pesanan</p><p className="adm-empty-sub">Pesanan akan muncul di sini</p></div>
          : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {recentOrders.map((o, i) => {
                const sc = getStatusColor(o.status);
                return (
                  <div key={o.order_id} className="adm-activity-item" onClick={() => navigate('/admin/orders')}>
                    <div className="adm-avatar" style={{ background: AVATAR_BG[i % AVATAR_BG.length], overflow: 'hidden' }}>
                      {o.profileImage ? (
                        <img src={o.profileImage} alt={o.customerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initials(o.customerName)
                      )}
                    </div>
                    <div className="adm-activity-info">
                      <div className="adm-activity-name">{o.customerName || 'Customer'}</div>
                      <div className="adm-activity-id">{o.order_id} · {o.service || 'Service'}</div>
                    </div>
                    <div className="adm-activity-right">
                      <span className="adm-badge" style={{ background:sc.bg, color:sc.text }}>{STATUS_LABELS[o.status] || o.status}</span>
                      <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>
                        {o.created_at||o.createdAt ? new Date(o.created_at||o.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        }
      </section>

      <style>{`
        @keyframes adm-pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.15)} }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
