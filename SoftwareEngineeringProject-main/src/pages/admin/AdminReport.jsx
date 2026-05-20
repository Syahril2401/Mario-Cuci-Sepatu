import React, { useEffect, useState, useMemo } from 'react';
import { orderService, STATUS_LABELS, getStatusColor } from '../../services/orderService';
import { serviceService } from '../../services/serviceService';
import { TrendingUp, Calendar, Download, FileText, Wallet, Package, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import Notification from '../../components/Notification';
import './Admin.css';

// ─── Constants ──────────────────────────────────────────────────────────────
const RANGE_FILTERS = [
  { key: 'daily', label: 'Harian' },
  { key: 'weekly', label: 'Mingguan' },
  { key: 'monthly', label: 'Bulanan' },
  { key: 'yearly', label: 'Tahunan' },
];

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_NAMES_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getPrice = (o) => {
  const p = o.total_price || o.totalPrice || 0;
  if (typeof p === 'string') return parseFloat(p.replace(/[^0-9.-]+/g, '')) || 0;
  return p || 0;
};

const isCounted = (o) =>
  ['FINISHED', 'COMPLETED'].includes(o.status);

// ─── Component ───────────────────────────────────────────────────────────────
const AdminReport = () => {
  const [orders, setOrders] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [range, setRange] = useState('monthly');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'loading' });
  // For daily view: start of the selected week (Monday). Default = this week's Monday.
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const offset = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - offset);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderRes, svcRes] = await Promise.all([
          orderService.getHistory(),
          serviceService.getServicesList()
        ]);
        setOrders(orderRes.data || []);
        setAllServices(svcRes.data || []);
      } catch (err) {
        setOrders([]);
        setAllServices([]);
      }
    };
    fetchData();
  }, []);

  const now = new Date();

  // ── Date-range boundaries based on selected filter ─────────────────────────
  const { startDate, endDate, chartLabels, chartGetter, rangeLabel } = useMemo(() => {
    const s = new Date(now);
    const e = new Date(now);

    // ── HARIAN: Senin–Minggu (pekan yang dipilih) ────────────────────────────
    if (range === 'daily') {
      const monday = new Date(selectedWeekStart + 'T00:00:00');
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      const getter = (order) => {
        const d = order.created_at || order.createdAt;
        if (!d) return null;
        const day = new Date(d).getDay(); // 0=Sun
        return day === 0 ? 6 : day - 1;  // Mon=0 … Sun=6
      };
      return {
        startDate: monday, endDate: sunday, chartLabels: labels, chartGetter: getter,
        rangeLabel: `${monday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      };
    }

    // ── MINGGUAN: Mgg 1–4 bulan ini ───────────────────────────────────────
    if (range === 'weekly') {
      s.setDate(1); s.setHours(0, 0, 0, 0);
      e.setMonth(e.getMonth() + 1); e.setDate(0); e.setHours(23, 59, 59, 999);
      const labels = ['Mgg 1', 'Mgg 2', 'Mgg 3', 'Mgg 4'];
      const getter = (order) => {
        const d = order.created_at || order.createdAt;
        if (!d) return null;
        const weekIdx = Math.floor((new Date(d).getDate() - 1) / 7);
        return Math.min(weekIdx, 3); // clamp to 0–3
      };
      return {
        startDate: s, endDate: e, chartLabels: labels, chartGetter: getter,
        rangeLabel: `${MONTH_NAMES_FULL[now.getMonth()]} ${now.getFullYear()} · Per Minggu`
      };
    }

    // ── BULANAN: Jan–Des tahun ini ─────────────────────────────────────────
    if (range === 'monthly') {
      s.setMonth(0); s.setDate(1); s.setHours(0, 0, 0, 0);
      e.setMonth(11); e.setDate(31); e.setHours(23, 59, 59, 999);
      const labels = MONTH_NAMES_SHORT;
      const getter = (order) => {
        const d = order.created_at || order.createdAt;
        return d ? new Date(d).getMonth() : null; // 0=Jan … 11=Des
      };
      return {
        startDate: s, endDate: e, chartLabels: labels, chartGetter: getter,
        rangeLabel: `Tahun ${now.getFullYear()} · Per Bulan`
      };
    }

    // ── TAHUNAN: 10 tahun terakhir ─────────────────────────────────────────
    const currentYear = now.getFullYear();
    const startYear = currentYear - 9;
    s.setFullYear(startYear, 0, 1); s.setHours(0, 0, 0, 0);
    e.setFullYear(currentYear, 11, 31); e.setHours(23, 59, 59, 999);
    const labels = Array.from({ length: 10 }, (_, i) => String(startYear + i));
    const getter = (order) => {
      const d = order.created_at || order.createdAt;
      if (!d) return null;
      const yr = new Date(d).getFullYear();
      const idx = yr - startYear;
      return idx >= 0 && idx < 10 ? idx : null;
    };
    return {
      startDate: s, endDate: e, chartLabels: labels, chartGetter: getter,
      rangeLabel: `${startYear} – ${currentYear} · Per Tahun`
    };
  }, [range, selectedWeekStart]);

  // ── Filter orders to selected time range ────────────────────────────────────
  const filteredOrders = useMemo(() =>
    orders.filter(o => {
      const d = o.created_at || o.createdAt;
      if (!d) return false;
      const t = new Date(d);
      return t >= startDate && t <= endDate;
    }), [orders, startDate, endDate]);

  const revenueOrders = filteredOrders.filter(isCounted);
  const totalRevenue = revenueOrders.reduce((s, o) => s + getPrice(o), 0);
  const totalOrders = revenueOrders.length;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const completedCount = revenueOrders.filter(o => o.status === 'FINISHED' || o.status === 'RECEIVED' || o.status === 'SUDAH_DIAMBIL').length;
  const cancelledCount = filteredOrders.filter(o => o.status === 'CANCELLED').length;

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = useMemo(() =>
    chartLabels.map((_, idx) =>
      revenueOrders.filter(o => chartGetter(o) === idx).reduce((s, o) => s + getPrice(o), 0)
    )
    , [revenueOrders, chartLabels, chartGetter]);

  const maxChart = Math.max(...chartData, 1);

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    setNotification({ show: true, message: 'Mengekspor laporan...', type: 'loading' });
    setTimeout(() => {
      // Build CSV
      const rows = [
        ['Order ID', 'Service', 'Customer', 'Status', 'Total Price', 'Date'],
        ...revenueOrders.map(o => [
          o.order_id,
          o.service || '',
          o.customerName || '',
          STATUS_LABELS[o.status] || o.status,
          getPrice(o),
          new Date(o.created_at || o.createdAt).toLocaleDateString('id-ID'),
        ])
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const rangeStr = range === 'monthly' ? `bulanan-${MONTH_NAMES_SHORT[now.getMonth()].toLowerCase()}-${now.getFullYear()}` : `${range}-${now.getFullYear()}`;
      a.download = `revenue-${rangeStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setNotification({ show: true, message: 'Laporan berhasil diekspor!', type: 'success' });
    }, 800);
  };

  return (
    <div className="admin-root">
      <Notification show={notification.show} message={notification.message} type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="adm-header adm-fadeUp">
        <div>
          <h2 className="adm-header-title">Financial Report</h2>
          <p className="adm-header-sub">{rangeLabel}</p>
        </div>
        <button className="adm-icon-btn" onClick={handleExport} title="Export CSV">
          <Download size={17} />
        </button>
      </div>

      {/* ── Segmented Filter ───────────────────────────────────── */}
      <div className="adm-fade1" style={{
        display: 'flex', background: 'white', borderRadius: '14px', padding: '4px',
        marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9'
      }}>
        {RANGE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setRange(f.key)}
            style={{
              flex: 1, padding: '9px 4px', border: 'none', borderRadius: '10px', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.2s ease',
              background: range === f.key ? '#064058' : 'transparent',
              color: range === f.key ? 'white' : '#64748B',
              boxShadow: range === f.key ? '0 2px 8px rgba(6,64,88,0.25)' : 'none',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Revenue Hero Card ──────────────────────────────────── */}
      <div className="adm-report-hero adm-fade2" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
          Total Pendapatan
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>
          Rp {totalRevenue.toLocaleString('id-ID')}
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
            ↑ {totalOrders} transaksi valid
          </span>
          <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
            {rangeLabel}
          </span>
        </div>
        <Wallet size={64} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.08 }} />
      </div>

      {/* ── Stats + Donut (2-col layout) ─────────────────────────── */}
      {(() => {
        const svcTypeMap = {};
        allServices.forEach(s => {
          svcTypeMap[String(s.service_id || s.id)] = (s.type || 'lainnya').toLowerCase();
        });

        const catRevenue = {};
        revenueOrders.forEach(o => {
          const svcId = String(o.service_id || '');
          const cat = svcTypeMap[svcId] || 'lainnya';
          const label = cat.charAt(0).toUpperCase() + cat.slice(1);
          catRevenue[label] = (catRevenue[label] || 0) + getPrice(o);
        });

        const categories = Object.keys(catRevenue);
        const values = categories.map(c => catRevenue[c]);
        const total = values.reduce((a, b) => a + b, 0);
        const COLORS = ['#0EA5E9', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444'];

        let cumulativePercent = 0;
        const segments = categories.map((cat, i) => {
          const pct = total > 0 ? values[i] / total : 0;
          const startAngle = cumulativePercent * 360;
          const endAngle = (cumulativePercent + pct) * 360;
          cumulativePercent += pct;
          return { cat, value: values[i], pct, startAngle, endAngle, color: COLORS[i % COLORS.length] };
        });

        const describeArc = (cx, cy, r, startAngle, endAngle) => {
          const rad = (a) => (a - 90) * Math.PI / 180;
          const x1 = cx + r * Math.cos(rad(startAngle));
          const y1 = cy + r * Math.sin(rad(startAngle));
          const x2 = cx + r * Math.cos(rad(endAngle));
          const y2 = cy + r * Math.sin(rad(endAngle));
          const largeArc = endAngle - startAngle > 180 ? 1 : 0;
          return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
        };

        const avgPerCat = categories.length > 0 ? Math.round(total / categories.length) : 0;

        return (
          <div className="adm-fade2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {/* Left: 3 stacked stat cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total Orders', val: totalOrders, icon: <Package size={16} color="#2563eb" />, bg: '#eff6ff' },
                { label: 'Selesai', val: completedCount, icon: <CheckCircle2 size={16} color="#15803d" />, bg: '#dcfce7' },
                { label: 'Dibatalkan', val: cancelledCount, icon: <XCircle size={16} color="#b91c1c" />, bg: '#fee2e2' },
              ].map(s => (
                <div key={s.label} className="adm-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Donut chart card */}
            <div className="adm-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 10 }}>
                <svg viewBox="0 0 100 100" width="100" height="100">
                  {total === 0 ? (
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                  ) : segments.length === 1 ? (
                    <circle cx="50" cy="50" r="38" fill="none" stroke={segments[0].color} strokeWidth="12" />
                  ) : (
                    segments.map((seg, i) => (
                      <path key={i} d={describeArc(50, 50, 38, seg.startAngle, seg.endAngle)} fill="none" stroke={seg.color} strokeWidth="12" strokeLinecap="round" />
                    ))
                  )}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    Rp {avgPerCat >= 1000 ? (avgPerCat / 1000).toFixed(0) + 'K' : avgPerCat.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: 7, color: '#94a3b8', fontWeight: 600 }}>rata-rata</div>
                </div>
              </div>
              {/* Legend */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {segments.length === 0 ? (
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>Belum ada data</div>
                ) : segments.map((seg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a', flex: 1 }}>{seg.cat}</span>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Rp {seg.value.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Dynamic Bar Chart ──────────────────────────────────── */}
      <div className="adm-card adm-fade3" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Grafik Pendapatan</span>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
              {{
                daily: 'per hari (Sen–Min)',
                weekly: 'per minggu (Mgg 1–4)',
                monthly: 'per bulan (Jan–Des)',
                yearly: 'per tahun (10 thn)'
              }[range]}
            </span>
          </div>
          {/* Inline mini filter inside chart card */}
          {/* Date picker: only show for Harian */}
          {range === 'daily' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 12px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
              <Calendar size={14} color="#0369a1" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap' }}>Pilih pekan:</span>
              <input
                type="week"
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 11, fontWeight: 600, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                value={(() => {
                  // Convert YYYY-MM-DD (monday) to YYYY-Www format for <input type="week">
                  const d = new Date(selectedWeekStart + 'T00:00:00');
                  // ISO week number
                  const startOfYear = new Date(d.getFullYear(), 0, 1);
                  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
                  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
                })()}
                onChange={e => {
                  // Parse YYYY-Www back to Monday date
                  const [yearStr, weekStr] = e.target.value.split('-W');
                  const year = parseInt(yearStr);
                  const week = parseInt(weekStr);
                  // ISO week: Jan 4 is always in week 1
                  const jan4 = new Date(year, 0, 4);
                  const startOfWeek1 = new Date(jan4);
                  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() === 0 ? 6 : jan4.getDay() - 1));
                  const monday = new Date(startOfWeek1);
                  monday.setDate(startOfWeek1.getDate() + (week - 1) * 7);
                  setSelectedWeekStart(monday.toISOString().split('T')[0]);
                }}
              />
              <span style={{ fontSize: 10, color: '#0369a1', fontWeight: 600, whiteSpace: 'nowrap' }}>{rangeLabel}</span>
            </div>
          )}
        </div>

        {/* Chart bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: range === 'yearly' ? 5 : 8, height: 120, paddingBottom: 4, marginTop: 20 }}>
          {chartData.map((val, i) => {
            const heightPct = Math.max(4, (val / maxChart) * 88);
            const isMax = val === maxChart && val > 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                {isMax && val > 0 && (
                  <div style={{
                    position: 'absolute', top: `${100 - heightPct - 20}px`,
                    background: '#064058', color: 'white', fontSize: '7px', fontWeight: 700,
                    padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap'
                  }}>
                    ★ Tertinggi
                  </div>
                )}
                <div style={{
                  width: '100%', borderRadius: '5px 5px 0 0', height: `${heightPct}px`,
                  background: val > 0
                    ? (isMax ? 'linear-gradient(180deg,#0ea5e9,#064058)' : 'linear-gradient(180deg,#7dd3fc,#0369a1)')
                    : '#e2e8f0',
                  transition: 'height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: val > 0 ? '0 2px 6px rgba(6,64,88,0.2)' : 'none',
                }} />
                <span style={{ fontSize: range === 'yearly' ? 7.5 : 8.5, color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {chartLabels[i]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {totalRevenue === 0 && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', fontWeight: 600, marginTop: 8, marginBottom: 0 }}>
            Belum ada data untuk periode ini
          </p>
        )}
      </div>

      {/* ── Revenue Breakdown ─────────────────────────────────── */}
      <section className="adm-fade3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="adm-section-label" style={{ marginBottom: 0 }}>Revenue Breakdown</div>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{revenueOrders.length} transaksi</span>
        </div>

        {revenueOrders.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><FileText size={24} color="#0a7da8" /></div>
            <p className="adm-empty-title">Tidak ada transaksi</p>
            <p className="adm-empty-sub">Tidak ada data pada periode {rangeLabel}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {revenueOrders.slice(0, 15).map(o => {
              const sc = getStatusColor(o.status);
              const dateStr = new Date(o.created_at || o.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: range === 'yearly' ? 'numeric' : undefined });
              return (
                <div key={o.order_id} className="adm-activity-item">
                  <div className="adm-avatar" style={{ background: '#e8f4fb', borderRadius: 12 }}>
                    <Package size={16} color="#064058" />
                  </div>
                  <div className="adm-activity-info">
                    <div className="adm-activity-name">{o.order_id}</div>
                    <div className="adm-activity-id">{o.service || 'Service'} · {o.customerName || 'N/A'} · {dateStr}</div>
                  </div>
                  <div className="adm-activity-right">
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#064058' }}>
                      +Rp {getPrice(o).toLocaleString('id-ID')}
                    </div>
                    <span className="adm-badge" style={{ background: sc.bg, color: sc.text, marginTop: 3, display: 'block' }}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {revenueOrders.length > 15 && (
              <p style={{ textAlign: 'center', fontSize: 11.5, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>
                Menampilkan 15 dari {revenueOrders.length} transaksi
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminReport;
