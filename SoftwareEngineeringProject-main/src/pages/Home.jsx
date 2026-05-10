import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../services/serviceService';
import { promoService } from '../services/promoService';
import { orderService, STATUS_LABELS, getStatusFlow } from '../services/orderService';
import MapViewer from '../components/MapViewer';
import useAuthStore from '../store/authStore';
import {
  AlertCircle, MapPin, Navigation, Clock, Phone,
  ChevronRight, Star,
  Sparkles, ShoppingBag, Package, ArrowRight,
  CheckCircle, Circle, Loader,
  Search, History, Tag, MessageCircle,
  Handbag, SportShoe, LayoutGrid, ShoppingCart
} from 'lucide-react';
import './Home.css';

import { InstagramIcon, WhatsappIcon } from '../components/Icons';
import logo from '../assets/logo.png';

// ─── Static Data ──────────────────────────────────────────────
const TESTIMONIALS = [
  { id: 1, initials: 'A', name: 'Andi Setiawan', role: 'Pelanggan Tetap', text: 'Sepatu lama jadi kinclong banget! Prosesnya cepet dan hasilnya beyond expectation.', stars: 5 },
  { id: 2, initials: 'R', name: 'Rina Kusuma', role: 'Customer Baru', text: 'Pertama kali coba dan langsung jatuh cinta. Staff ramah, sepatu bersih sempurna!', stars: 5 },
  { id: 3, initials: 'B', name: 'Budi Santoso', role: 'Pelanggan Setia', text: 'Sudah 3x pakai jasa ini. Konsisten bagus dan pengiriman selalu on time. Recommended!', stars: 5 },
  { id: 4, initials: 'D', name: 'Dewi Lestari', role: 'Pelanggan', text: 'Tas kesayangan ku kembali bersih dan harum. Terima kasih Mario Cuci Sepatu!', stars: 5 },
];

const QUICK_ACTIONS = [
  { label: 'Order', icon: <ShoppingCart size={22} color="#064058" />, bg: 'rgba(6, 64, 88, 0.08)', action: 'order' },
  { label: 'Status', icon: <Package size={20} color="#064058" />, bg: 'rgba(6, 64, 88, 0.08)', action: 'status' },
  { label: 'Riwayat', icon: <Clock size={22} color="#064058" />, bg: 'rgba(6, 64, 88, 0.08)', action: 'history' },
  { label: 'Kontak', icon: <Phone size={22} color="#064058" />, bg: 'rgba(6, 64, 88, 0.08)', action: 'contact' },
];

const PROMO_SLIDES = [
  { id: 1, title: 'Gratis Pickup!', sub: 'Untuk order pertama Anda', badge: '🎁 NEW', bg: 'linear-gradient(135deg,#0f4c75,#1b85c0)', emoji: '🚗' },
  { id: 2, title: 'Diskon 20%', sub: 'Khusus cuci premium shoes', badge: '🔥 HOT', bg: 'linear-gradient(135deg,#7c2d12,#c2410c)', emoji: '👟' },
  { id: 3, title: 'Express 1 Hari', sub: 'Hasil kilat tanpa antre', badge: '⚡ CEPAT', bg: 'linear-gradient(135deg,#14532d,#16a34a)', emoji: '✨' },
];

const AVATAR_COLORS = ['#064058', '#6d28d9', '#0369a1', '#be185d', '#0f766e'];

// ─── Active Order Mini Tracker ───────────────────────────────
const ActiveOrderCard = ({ order, onViewStatus }) => {
  const flow = getStatusFlow(order);
  const current = (order.status || '').toUpperCase();
  const idx = flow.indexOf(current);
  const pct = flow.length > 1 ? Math.round((idx / (flow.length - 1)) * 100) : 0;
  // show max 4 steps for display
  const displaySteps = flow.length <= 4 ? flow : [flow[0], flow[Math.floor(flow.length / 3)], flow[Math.floor(2 * flow.length / 3)], flow[flow.length - 1]];

  return (
    <div className="active-order-card">
      <div className="aoc-header">
        <div className="aoc-header-left">
          <div className="aoc-pulse" />
          <span className="aoc-label">Pesanan Aktif</span>
        </div>
        <span className="aoc-id">{order.order_id}</span>
      </div>

      <div className="aoc-status-badge">
        <Loader size={13} className="aoc-spin" />
        {STATUS_LABELS[order.status] || order.status}
      </div>

      {/* Progress bar */}
      <div className="aoc-progress-wrap">
        <div className="aoc-progress-bar" style={{ width: `${pct}%` }} />
      </div>

      {/* Step icons */}
      <div className="aoc-steps">
        {displaySteps.map((step, i) => {
          const stepIdx = flow.indexOf(step);
          const done = stepIdx < idx;
          const active = stepIdx === idx;
          return (
            <div key={step} className={`aoc-step ${done ? 'done' : active ? 'active' : ''}`}>
              <div className="aoc-step-dot">
                {done ? <CheckCircle size={14} /> : active ? <div className="aoc-dot-pulse" /> : <Circle size={14} />}
              </div>
              <span className="aoc-step-label">{STATUS_LABELS[step]?.split(' ').slice(-1)[0] || step}</span>
            </div>
          );
        })}
      </div>

      <div className="aoc-footer">
        <span className="aoc-est">🗓 Est: {order.delivery_date || 'N/A'}</span>
        <button className="aoc-btn" onClick={onViewStatus}>
          Lihat Status <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Promo Slider ────────────────────────────────────────────
const PromoSlider = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const next = useCallback(() => setCurrent(c => (c + 1) % PROMO_SLIDES.length), []);

  useEffect(() => {
    timerRef.current = setInterval(next, 3500);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const goTo = (i) => {
    clearInterval(timerRef.current);
    setCurrent(i);
    timerRef.current = setInterval(next, 3500);
  };

  const slide = PROMO_SLIDES[current];

  return (
    <div className="promo-slider-wrap">
      <div className="promo-slide" style={{ background: slide.bg }}>
        <div className="promo-slide-text">
          <span className="promo-slide-badge">{slide.badge}</span>
          <div className="promo-slide-title">{slide.title}</div>
          <div className="promo-slide-sub">{slide.sub}</div>
        </div>
        <div className="promo-slide-emoji">{slide.emoji}</div>
      </div>
      <div className="promo-dots">
        {PROMO_SLIDES.map((_, i) => (
          <button
            key={i}
            className={`promo-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const Home = () => {
  const [services, setServices] = useState([]);
  const [promos, setPromos] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [servicesRes, promosRes, ordersRes] = await Promise.all([
          serviceService.getServicesList(),
          promoService.getPromos(),
          orderService.getActiveStatus(),
        ]);
        setServices(servicesRes.data?.data || servicesRes.data || []);
        setPromos(promosRes.data || []);
        setActiveOrders((ordersRes.data || []).filter(o =>
          o.status !== 'FINISHED' && o.status !== 'CANCELLED' && o.status !== 'RECEIVED' && o.status !== 'SUDAH_DIAMBIL'
        ));
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Gagal memuat layanan. Coba refresh halaman.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleOrderClick = () => {
    const section = document.getElementById('services-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickAction = (action) => {
    if (action === 'order') {
      handleOrderClick();
      return;
    }
    const map = { history: '/order-status', status: '/order-status', contact: '/contact', promo: null };
    if (map[action]) {
      if (action === 'history') {
        navigate(map[action], { state: { tab: 'Selesai' } });
      } else {
        navigate(map[action]);
      }
    }
  };

  const filteredServices = services.filter(s => selectedType === 'all' || s.type === selectedType);
  const firstName = user?.name?.split(' ')[0] || 'Pengguna';
  const latestActiveOrder = activeOrders[0] || null;

  return (
    <div className="home-root">

      {/* ══ 1. HERO ══════════════════════════════════════ */}
      <div className="home-hero anim-hero">
        <div className="hero-inner">
          <div className="hero-top-row">
            <div>
              <div className="hero-badge"><Sparkles size={10} /> Premium Shoe Care</div>
              <p className="hero-greeting">Halo, {firstName} 👋</p>
              <h1 className="hero-title">
                Sepatu Kinclong,<br />
                <span>Percaya Diri Naik!</span>
              </h1>
            </div>
            <div className="hero-shoe-icon">👟</div>
          </div>
          <button className="hero-cta-btn" onClick={handleOrderClick}>
            <ShoppingCart size={14} /> Order Sekarang
          </button>
          <div className="hero-stats-row">
            <div className="hero-stat"><span className="hero-stat-val">100+</span><span className="hero-stat-label">Pelanggan</span></div>
            <div className="hero-stat-sep" />
            <div className="hero-stat"><span className="hero-stat-val">2–3 hr</span><span className="hero-stat-label">Proses</span></div>
            <div className="hero-stat-sep" />
            <div className="hero-stat"><span className="hero-stat-val"><Star size={12} fill="white" /> 4.9</span><span className="hero-stat-label">Rating</span></div>
          </div>
        </div>
      </div>

      {/* ══ 2. ACTIVE ORDER TRACKER ══════════════════════ */}
      {latestActiveOrder && (
        <div className="home-px anim-section">
          <ActiveOrderCard order={latestActiveOrder} onViewStatus={() => navigate('/order-status')} />
        </div>
      )}

      {/* ══ 3. QUICK ACTIONS ═════════════════════════════ */}
      <div className="quick-actions-wrap anim-section">
        <div className="quick-actions">
          {QUICK_ACTIONS.map((qa) => (
            <button key={qa.action} className="quick-action-chip" onClick={() => handleQuickAction(qa.action)}>
              <div className="chip-icon" style={{ background: qa.bg }}>{qa.icon}</div>
              <span className="chip-label">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ 4. PROMO SLIDER ══════════════════════════════ */}
      <div className="home-px anim-section">
        <PromoSlider />
      </div>

      {/* ══ 5. SERVICES ══════════════════════════════════ */}
      <div id="services-section" className="home-section anim-section2">
        <div className="section-top">
          <div>
            <div className="section-title">Layanan Kami</div>
            <div className="section-subtitle">Pilih layanan terbaik untuk sepatu Anda</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="home-filter-tabs">
        {[{ key: 'all', label: <><LayoutGrid size={14} />  Semua</> }, { key: 'sepatu', label: <><SportShoe size={14} />  Sepatu</> }, { key: 'tas', label: <><Handbag size={14} />  Tas</> }].map(tab => (
          <button key={tab.key} className={`filter-tab ${selectedType === tab.key ? 'active' : ''}`} onClick={() => setSelectedType(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Service Grid */}
      <div className="services-2col-grid">
        {isLoading && [1, 2, 3, 4].map(n => <div key={n} className="skeleton" style={{ borderRadius: 16, height: 210 }} />)}
        {error && <div className="services-error"><AlertCircle size={16} /><span>{error}</span></div>}
        {!isLoading && !error && filteredServices.length === 0 && (
          <p className="services-loading">Tidak ada layanan untuk kategori ini.</p>
        )}
        {!isLoading && !error && filteredServices.map((service, idx) => {
          const activePromo = promoService.getActivePromoForService(service, promos);
          const discountedPrice = promoService.calculateDiscountedPrice(service.price, activePromo);
          const isBestSeller = idx === 0;
          const isNew = idx === 2;

          return (
            <div key={service.service_id} className="svc-card" onClick={() => navigate('/checkout', { state: { service } })}>
              <div className="svc-img-wrap">
                {service.image
                  ? <img src={service.image} alt={service.serviceName} className="svc-img" />
                  : <div className="svc-img-placeholder"><span>👟</span></div>
                }
                {activePromo && <div className="svc-badge promo">🔥 {activePromo.percentage}% OFF</div>}
                {isBestSeller && !activePromo && <div className="svc-badge bestseller">⭐ Terlaris</div>}
                {isNew && !activePromo && <div className="svc-badge new-badge">✨ Baru</div>}
              </div>

              <div className="svc-info">
                <p className="svc-name">{service.serviceName}</p>

                <div className="svc-meta-row">
                  {service.type && <span className={`svc-type-tag ${service.type}`}>{service.type}</span>}
                </div>

                {service.duration && (
                  <div className="svc-duration"><Clock size={9} /> {service.duration} hari</div>
                )}

                <div className="svc-price-block">
                  {activePromo && (
                    <span className="svc-price-original">Rp {service.price?.toLocaleString('id-ID')}</span>
                  )}
                  <span className={`svc-price-final ${activePromo ? 'promo' : 'normal'}`}>
                    Rp {discountedPrice?.toLocaleString('id-ID')}
                  </span>
                </div>

                <button className="svc-order-btn" onClick={e => { e.stopPropagation(); navigate('/checkout', { state: { service } }); }}>
                  Order
                </button>
              </div>
            </div>
          );
        })}
        <br />
      </div>

      {/* ══ 8. LOCATION ══════════════════════════════════ */}
      <div className="location-section">
        <div className="section-top" style={{ marginBottom: 12 }}>
          <div className="section-title">Lokasi Kami</div>
        </div>
        <div className="location-card">
          <div className="location-header">
            <div className="location-icon-badge"><MapPin size={18} color="#064058" /></div>
            <div>
              <div className="location-name">Mario Cuci Sepatu</div>
              <div className="location-address">Northwest Lake NG18-31, Babat Jerawat,<br />Kec. Pakal, Surabaya</div>
            </div>
          </div>
          <div className="location-hours-row"><Clock size={12} /> Buka Senin–Sabtu · 09.00–18.00</div>
          <div className="location-map-wrap"><MapViewer latitude={-7.259870} longitude={112.624012} height="180px" /></div>
          <div className="location-cta">
            <button className="btn-nav-primary" onClick={() => window.open('https://www.openstreetmap.org/search?query=-7.259870%2C112.624012&zoom=17&minlon=112.60023951530458&minlat=-7.26245734649342&maxlon=112.62083888053895&maxlat=-7.252495609228964#map=17/-7.259871/112.624015', '_blank', '_blank')}>
              <Navigation size={14} /> Get Direction
            </button>
          </div>
        </div>
      </div>

      {/* ══ 10. FOOTER ═══════════════════════════════════ */}
      <div className="home-footer">
        <div className="footer-content">
          {/* Logo centered */}
          <div className="footer-logo-center">
            <img src={logo} alt="Mario Cuci Sepatu" className="footer-logo-img" />
          </div>

          <h3 className="footer-brand-title">Mario Cuci Sepatu</h3>
          <p className="footer-tagline">Premium Shoe Care Specialist</p>

          <div className="footer-divider" />

          <div className="footer-info-row">
            <div className="footer-info-item">
              <MapPin size={13} className="footer-icon-accent" />
              <span className="footer-info-text">Northwest Lake, Babat Jerawat, Surabaya</span>
            </div>
            <div className="footer-info-item">
              <Clock size={13} className="footer-icon-accent" />
              <span className="footer-info-text">Senin–Sabtu · 09.00–18.00 WIB</span>
            </div>
            <div className="footer-info-item">
              <Phone size={13} className="footer-icon-accent" />
              <span className="footer-info-text">+62 812 3398 1688</span>
            </div>
          </div>

          <div className="footer-social-row">
            <button className="footer-social-btn" onClick={() => window.open('https://wa.me/6281233981688', '_blank')}>
              <WhatsappIcon size={15} /> WhatsApp
            </button>
            <button className="footer-social-btn" onClick={() => window.open('https://instagram.com/mariocucisepatu', '_blank')}>
              <InstagramIcon size={15} /> Instagram
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">© {new Date().getFullYear()} Mario Cuci Sepatu · Based in Surabaya</div>
        </div>
      </div>

    </div>
  );
};

export default Home;
