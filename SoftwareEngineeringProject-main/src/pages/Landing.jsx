import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, Clock, ShieldCheck, Phone, Mail, MapPin,
  Sparkles, Truck, Timer, Camera,
  Zap, ChevronLeft, ChevronRight, ChevronUp, Navigation,
  Home, SportShoe, Info, Tag, LogIn, UserPlus, LayoutDashboard
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { serviceService } from '../services/serviceService';
import { promoService } from '../services/promoService';
import MapViewer from '../components/MapViewer';
import { landingService } from '../services/landingService';
import './Landing.css';
import logo from '../assets/logo.png';

// Import Carousel Images
import imgAfter from '../assets/carousel/after.webp';
import imgBefore from '../assets/carousel/before.webp';
import imgProcess from '../assets/carousel/process.webp';
import imgDetail from '../assets/carousel/detail.webp';
import imgPackaging from '../assets/carousel/packaging.webp';
import beforeAfterImg from '../assets/before_after.webp';

const CAROUSEL_ITEMS = [
  { img: imgAfter, label: "Hasil Maksimal", icon: <Sparkles size={14} /> },
  { img: imgBefore, label: "Pembersihan Total", icon: <Zap size={14} /> },
  { img: imgProcess, label: "Proses Profesional", icon: <Timer size={14} /> },
  { img: imgDetail, label: "Detail Terjaga", icon: <ShieldCheck size={14} /> },
  { img: imgPackaging, label: "Packaging Aman", icon: <Truck size={14} /> },
];

import { WhatsappIcon, InstagramIcon } from '../components/Icons';

const getIcon = (name) => {
  switch (name) {
    case 'Sparkles': return <Sparkles size={14} />;
    case 'Zap': return <Zap size={14} />;
    case 'Timer': return <Timer size={14} />;
    case 'ShieldCheck': return <ShieldCheck size={14} />;
    case 'Truck': return <Truck size={14} />;
    default: return <Sparkles size={14} />;
  }
};

const HeroCarousel = ({ items }) => {
  const carouselItems = items && items.length > 0 && items[0].img !== "" ? items : CAROUSEL_ITEMS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const timerRef = useRef(null);
  const pauseTimerRef = useRef(null);

  const minSwipeDistance = 50;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  }, [carouselItems.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    handleUserInteraction();
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    handleUserInteraction();
  };

  const handleUserInteraction = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);

    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  };

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(nextSlide, 3000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
      handleUserInteraction();
    } else if (isRightSwipe) {
      prevSlide();
      handleUserInteraction();
    }
  };

  return (
    <div className="hero-carousel-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="carousel-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {carouselItems.map((item, idx) => (
          <div key={idx} className={`carousel-slide ${idx === currentIndex ? 'active' : ''}`}>
            <div className="carousel-label">
              {item.icon || getIcon(item.iconName)} {item.label}
            </div>
            <img src={item.img} alt={item.label} className="carousel-img" fetchpriority={idx === 0 ? "high" : "auto"} loading={idx === 0 ? "eager" : "lazy"} decoding="async" />
          </div>
        ))}
      </div>

      <div className="carousel-arrows">
        <button className="carousel-arrow" onClick={prevSlide}><ChevronLeft size={20} /></button>
        <button className="carousel-arrow" onClick={nextSlide}><ChevronRight size={20} /></button>
      </div>

      <div className="carousel-dots">
        {carouselItems.map((_, idx) => (
          <div
            key={idx}
            className={`dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Landing Navbar ────────────────────────────────────────────────────────────
const LandingNavbar = ({ onMenuOpen, scrolled }) => {
  return (
    <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
      <button className="landing-hamburger" onClick={onMenuOpen} aria-label="Open menu">
        <Menu size={24} />
      </button>
      <div className="landing-logo">
        <img src={logo} alt="Mario Cuci Sepatu" width="40" height="40" />
        <span className="landing-brand-name">Mario Cuci Sepatu</span>
      </div>
    </nav>
  );
};

// ─── Mobile Drawer ─────────────────────────────────────────────────────────────
const MobileDrawer = ({ isOpen, onClose, isAuthenticated, onNavigate }) => {
  const publicMenuItems = [
    { icon: <Home size={20} />, label: 'Beranda', id: 'home', action: 'scroll' },
    { icon: <SportShoe size={20} />, label: 'Layanan', id: 'services', action: 'scroll' },
    { icon: <Info size={20} />, label: 'Tentang Kami', id: 'about', action: 'scroll' },
    { icon: <MapPin size={20} />, label: 'Lokasi', id: 'location', action: 'scroll' },
  ];

  const authItems = isAuthenticated
    ? [{ icon: <LayoutDashboard size={20} />, label: 'Dashboard', id: '/home', action: 'route' }]
    : [
      { icon: <LogIn size={20} />, label: 'Login', id: '/login', action: 'route', highlight: false },
      { icon: <UserPlus size={20} />, label: 'Daftar', id: '/register', action: 'route', highlight: true },
    ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`landing-drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`landing-mobile-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <img src={logo} alt="Mario Cuci Sepatu" className="drawer-logo" />
            <div>
              <p className="drawer-brand-name">Mario Cuci Sepatu</p>
              <p className="drawer-brand-sub">Premium Shoe Care ✨</p>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="drawer-divider" />

        <nav className="drawer-nav">
          <p className="drawer-section-label">Menu</p>
          {publicMenuItems.map((item) => (
            <button
              key={item.id}
              className="drawer-nav-item"
              onClick={() => onNavigate(item)}
            >
              <span className="drawer-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <p className="drawer-section-label" style={{ marginTop: 16 }}>Akun</p>
          {authItems.map((item) => (
            <button
              key={item.id}
              className={`drawer-nav-item ${item.highlight ? 'highlighted' : ''}`}
              onClick={() => onNavigate(item)}
            >
              <span className="drawer-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="drawer-footer">
          <p>© {new Date().getFullYear()} Mario Cuci Sepatu</p>
          <p>Made with ❤️ in Surabaya</p>
        </div>
      </div>
    </>
  );
};

// ─── Main Landing Component ────────────────────────────────────────────────────
const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [services, setServices] = useState([]);
  const [promos, setPromos] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [config, setConfig] = useState(null);

  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    serviceService.getServicesList().then(res => {
      setServices(res.data || []);
    });
    promoService.getPromos().then(res => {
      setPromos(res.data || []);
    });
    landingService.getLandingConfig().then(res => {
      if (res.data && res.data.data) setConfig(res.data.data);
    }).catch(err => console.error("Failed to load landing config", err));
  }, []);

  const handleNavItemClick = (item) => {
    setIsMenuOpen(false);
    if (item.action === 'scroll') {
      const el = document.getElementById(item.id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(item.id);
    }
  };

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setScrolled(scrollTop > 10);

    const hasilNyataSection = document.getElementById('hasil-nyata');
    if (hasilNyataSection && scrollTop > hasilNyataSection.offsetTop - 200) {
      setShowBackToTop(true);
    } else {
      setShowBackToTop(false);
    }
  };

  const scrollToTop = () => {
    const container = document.querySelector('.app-content');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/6281233981688", "_blank");
  };

  const handleInstagramClick = () => {
    window.open("https://instagram.com/mariocucisepatu", "_blank");
  };

  return (
    <>
      <LandingNavbar onMenuOpen={() => setIsMenuOpen(true)} scrolled={scrolled} />

      <MobileDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        onNavigate={handleNavItemClick}
      />

      <div className="app-content" style={{ padding: 0, position: 'relative' }} onScroll={handleScroll}>

        {/* HERO SECTION */}
        <section id="home" className="hero-section">
          <HeroCarousel items={config?.carousel} />

          <div className="hero-content">
            <h1 dangerouslySetInnerHTML={{ __html: config?.hero?.title || 'Sepatu Kinclong,<br />Percaya Diri Maksimal 👟' }} />
            <p>{config?.hero?.subtitle || 'Cuci sepatu profesional dengan teknik terbaik untuk hasil bersih maksimal sampai ke detail terkecil.'}</p>

            <button className="btn-premium" onClick={() => navigate(isAuthenticated ? '/checkout' : '/register')}>
              {config?.hero?.buttonText || (isAuthenticated ? 'Order Sekarang' : 'Mulai Order')}
            </button>

            <div className="hero-stats">
              {(config?.hero?.stats || [
                { val: "⭐ 100+", label: "Happy Users" },
                { val: "⚡ 2-3 Hari", label: "Proses Kilat" }
              ]).map((stat, i) => (
                <div key={i} className="stat-item">
                  <span className="stat-val">{stat.val}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US SECTION */}
        <section id="why-us" className="landing-section">
          <h2 className="section-title-premium">{config?.whyUs?.title || 'Kenapa Pilih Kami?'}</h2>
          <p className="section-subtitle-premium">{config?.whyUs?.subtitle || 'Kualitas premium dengan pelayanan setulus hati.'}</p>

          <div className="why-grid">
            <div className="why-card premium-card">
              <div className="why-icon"><Sparkles size={20} /></div>
              <h3>Deep Cleaning</h3>
            </div>
            <div className="why-card premium-card">
              <div className="why-icon"><Truck size={20} /></div>
              <h3>Pick &amp; Drop</h3>
            </div>
            <div className="why-card premium-card">
              <div className="why-icon"><Timer size={20} /></div>
              <h3>Fast Service</h3>
            </div>
            <div className="why-card premium-card">
              <div className="why-icon"><Camera size={20} /></div>
              <h3>Foto Bukti</h3>
            </div>
          </div>
        </section>

        {/* SERVICES PREVIEW */}
        <section id="services" className="landing-section bg-light">
          <h2 className="section-title-premium">{config?.services?.title || 'Layanan Kami'}</h2>
          <p className="section-subtitle-premium">{config?.services?.subtitle || 'Solusi tepat untuk setiap jenis sepatu Anda.'}</p>

          <div className="services-grid">
            {services.filter(s => config?.services?.selectedIds ? config.services.selectedIds.includes(s.service_id) : true).slice(0, 3).map((service, index) => {
              const activePromo = promoService.getActivePromoForService(service, promos);
              const discountedPrice = promoService.calculateDiscountedPrice(service.price, activePromo);

              return (
                <div key={service.service_id} className="service-card-premium premium-card" onClick={() => navigate('/login')}>
                  <div className="card-img-wrapper">
                    <img src={service.image} alt={service.serviceName} className="card-img" loading="lazy" decoding="async" />
                    {activePromo ? (
                      <div className="card-badge" style={{ backgroundColor: '#F59E0B' }}>PROMO {activePromo.percentage}%</div>
                    ) : (
                      index === 0 && <div className="card-badge">Favorite</div>
                    )}
                  </div>

                  <div className="card-body">
                    <h3>{service.serviceName}</h3>
                    <p className="desc">{service.description}</p>

                    <div className="card-footer">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {activePromo && (
                          <span style={{ fontSize: '0.8rem', color: '#9CA3AF', textDecoration: 'line-through' }}>
                            Rp {service.price?.toLocaleString('id-ID')}
                          </span>
                        )}
                        <span className="price-value" style={{ color: activePromo ? '#F59E0B' : 'var(--primary)' }}>
                          Rp {discountedPrice?.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <button className="btn-premium" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Pesan</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* BEFORE AFTER SECTION */}
        <section id="hasil-nyata" className="landing-section">
          <h2 className="section-title-premium">{config?.hasilNyata?.title || 'Hasil Nyata'}</h2>
          <p className="section-subtitle-premium">{config?.hasilNyata?.subtitle || 'Bukan sekedar bersih, tapi kembali seperti baru.'}</p>

          <div className="comparison-container">
            <img src={config?.hasilNyata?.img || beforeAfterImg} alt="Before After" style={{ width: '100%', display: 'block' }} loading="lazy" decoding="async" />
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="landing-section bg-soft-blue">
          <h2 className="section-title-premium">{config?.aboutUs?.title || 'ABOUT US'}</h2>
          <p className="about-text">
            {config?.aboutUs?.description || 'Mario Cuci Sepatu hadir sebagai solusi perawatan sepatu premium di Surabaya. Kami menggunakan bahan pembersih ramah lingkungan dan teknik khusus untuk menjaga kualitas sepatu Anda tetap awet.'}
          </p>

          <div className="hero-stats">
            {(config?.aboutUs?.stats || [
              { val: "2+", label: "Tahun Pengalaman" },
              { val: "200+", label: "Sepatu Selesai" }
            ]).map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-val">{stat.val}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* LOCATION SECTION */}
        <section id="location" className="landing-section">
          <h2 className="section-title-premium">{config?.location?.title || 'OUR LOCATION'}</h2>
          <p className="section-subtitle-premium">{config?.location?.subtitle || 'Kunjungi studio kami di Surabaya Barat.'}</p>

          <div className="premium-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'var(--secondary)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                <MapPin size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>{config?.location?.addressName || 'Mario Cuci Sepatu'}</h4>
                <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {config?.location?.addressText || 'Northwest Lake NG18-31, Babat Jerawat,\nKec. Pakal, Surabaya, Jawa Timur'}
                </p>
              </div>
            </div>

            <div style={{ width: '100%', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              <MapViewer latitude={config?.location?.latitude || -7.259870} longitude={config?.location?.longitude || 112.624012} height="200px" />
            </div>

            <button
              className="btn-premium"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
              onClick={() => window.open(config?.location?.mapLink || 'https://www.openstreetmap.org/search?query=-7.259870%2C112.624012', '_blank')}
            >
              <Navigation size={16} />
              Buka di Peta
            </button>
          </div>
        </section>

        {/* PROFESSIONAL FOOTER */}
        <footer className="professional-footer">
          <div className="footer-container">
            <div className="footer-brand">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--accent)" />
                <h3 className="footer-brand-name">Mario Cuci Sepatu</h3>
              </div>
              <div className="footer-badge">Trusted Shoe Care Since 2020</div>
            </div>

            <p className="footer-description">
              {config?.footer?.description || 'Premium Shoe Care Specialists di Surabaya. Kami mengembalikan kilau dan kebersihan sepatu kesayangan Anda dengan teknik profesional dan bahan ramah lingkungan.'}
            </p>

            <div className="footer-contact-list">
              <div className="contact-row">
                <MapPin size={18} className="contact-icon" />
                <span>{config?.footer?.address || 'Northwest Lake NG18-31, Babat Jerawat, Surabaya'}</span>
              </div>
              <div className="contact-row">
                <Clock size={18} className="contact-icon" />
                <span>{config?.footer?.schedule || 'Senin - Sabtu • 09.00 - 18.00'}</span>
              </div>
              <div className="contact-row">
                <Phone size={18} className="contact-icon" />
                <span>{config?.footer?.phone || '+62 812 3398 1688'}</span>
              </div>
            </div>

            <div className="footer-social-group">
              <div className="social-pill" onClick={handleWhatsAppClick}>
                <WhatsappIcon size={18} />
                <span>WhatsApp</span>
              </div>
              <div className="social-pill" onClick={handleInstagramClick}>
                <InstagramIcon size={18} />
                <span>Instagram</span>
              </div>
            </div>

            <div className="footer-divider"></div>
          </div>
        </footer>
      </div>

      <div className="wa-floating" onClick={handleWhatsAppClick}>
        <WhatsappIcon size={30} color="white" />
      </div>

      {showBackToTop && (
        <button className="back-to-top-btn" onClick={scrollToTop}>
          <ChevronUp size={24} />
        </button>
      )}
    </>
  );
};

export default Landing;
