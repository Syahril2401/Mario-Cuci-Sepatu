import React, { useState, useEffect } from 'react';
import { landingService } from '../../services/landingService';
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft, Upload, Trash2, Camera, MapPin, Truck, Timer, Sparkles, Navigation, Clock, Phone, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MapViewer from '../../components/MapViewer';
import { WhatsappIcon, InstagramIcon } from '../../components/Icons';

import '../Landing.css';
import './Admin.css';

const InlineInput = ({ value, onChange, placeholder, style, type = "text", step }) => (
  <input
    type={type}
    step={step}
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      background: 'rgba(255,255,255,0.4)',
      border: '1px dashed rgba(0,0,0,0.3)',
      borderRadius: '6px',
      padding: '4px 8px',
      color: 'inherit',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      textAlign: 'inherit',
      width: '100%',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'all 0.2s',
      ...style
    }}
    onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.9)'; e.target.style.border = '1px solid var(--primary)'; }}
    onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.4)'; e.target.style.border = '1px dashed rgba(0,0,0,0.3)'; }}
  />
);

const InlineTextarea = ({ value, onChange, placeholder, style, rows = 3 }) => (
  <textarea
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      background: 'rgba(255,255,255,0.4)',
      border: '1px dashed rgba(0,0,0,0.3)',
      borderRadius: '6px',
      padding: '8px',
      color: 'inherit',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      textAlign: 'inherit',
      width: '100%',
      boxSizing: 'border-box',
      outline: 'none',
      resize: 'vertical',
      transition: 'all 0.2s',
      ...style
    }}
    onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.9)'; e.target.style.border = '1px solid var(--primary)'; }}
    onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.4)'; e.target.style.border = '1px dashed rgba(0,0,0,0.3)'; }}
  />
);

const AdminLandingConfig = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // States to hold the two lines of the hero title
  const [heroTitle1, setHeroTitle1] = useState('');
  const [heroTitle2, setHeroTitle2] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const configRes = await landingService.getLandingConfig();
        const serviceRes = await serviceService.getServicesList();
        
        if (configRes.data && configRes.data.data) {
          const configData = configRes.data.data;
          setConfig(configData);

          const titleParts = (configData.hero?.title || '').split(/<br\s*\/?>/i);
          setHeroTitle1(titleParts[0] || '');
          setHeroTitle2(titleParts[1] || '');
        }
        setServices(serviceRes.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleCarouselChange = (index, field, value) => {
    const newCarousel = [...config.carousel];
    newCarousel[index][field] = value;
    setConfig(prev => ({ ...prev, carousel: newCarousel }));
  };

  const handleServiceSelect = (serviceId) => {
    setConfig(prev => {
      const selected = prev.services.selectedIds || [];
      if (selected.includes(serviceId)) {
        return { ...prev, services: { ...prev.services, selectedIds: selected.filter(id => id !== serviceId) } };
      } else {
        if (selected.length >= 3) return prev; // Limit to 3 max
        return { ...prev, services: { ...prev.services, selectedIds: [...selected, serviceId] } };
      }
    });
  };

  const handleFileChange = (section, field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange(section, field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCarouselFileChange = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleCarouselChange(index, 'img', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const assembledTitle = heroTitle2.trim()
        ? `${heroTitle1.trim()}<br />${heroTitle2.trim()}`
        : heroTitle1.trim();

      const updatedConfig = {
        ...config,
        hero: {
          ...config.hero,
          title: assembledTitle
        }
      };

      await landingService.updateLandingConfig(updatedConfig);
      setMessage('Konfigurasi berhasil disimpan!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Gagal menyimpan konfigurasi.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="admin-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Loading Konfigurasi...</p>
      </div>
    );
  }

  return (
    <div className="admin-root" style={{ padding: 0, overflowX: 'hidden' }}>
      
      {/* TOAST NOTIFICATION */}
      <div style={{
        position: 'fixed',
        top: message ? '20px' : '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        background: '#dcfce7',
        color: '#15803d',
        padding: '12px 24px',
        borderRadius: '12px',
        fontWeight: 700,
        fontSize: '14px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Save size={18} />
        {message}
      </div>

      {/* HEADER STICKY */}
      <div className="adm-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', margin: 0, borderRadius: 0 }}>
        <div>
          <h2 className="adm-header-title">Live Editor Landing Page</h2>
          <p className="adm-header-sub">Edit teks dan gambar langsung pada tampilan asli</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
          <button onClick={() => navigate('/admin/dashboard')} className="adm-btn" style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={16} /> Batal
          </button>
        </div>
      </div>

      <div className="app-content" style={{ padding: 0 }}>

        {/* HERO SECTION */}
        <section className="hero-section">
          {/* Carousel Editor */}
          <div style={{ background: 'rgba(255,255,255,0.5)', padding: 16, borderRadius: 16, maxWidth: 800, margin: '0 auto 30px auto' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--primary)' }}>Edit Carousel Images:</h4>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
              {config.carousel.map((item, i) => (
                <div key={i} style={{ minWidth: 120, background: 'white', borderRadius: 8, padding: 8, border: '1px solid #e2e8f0', position: 'relative' }}>
                  <button onClick={() => {
                    const newCarousel = config.carousel.filter((_, idx) => idx !== i);
                    setConfig(prev => ({ ...prev, carousel: newCarousel }));
                  }} style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, padding: 0 }}>
                    <Trash2 size={12} />
                  </button>
                  <div style={{ width: '100%', height: 70, background: '#f1f5f9', borderRadius: 6, marginBottom: 8, overflow: 'hidden', position: 'relative' }}>
                    {item.img ? <img src={item.img} alt="slide" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#94a3b8' }} />}
                  </div>
                  <InlineInput value={item.label} onChange={val => handleCarouselChange(i, 'label', val)} style={{ fontSize: 11, padding: 4, marginBottom: 6, background: '#f8fafc' }} />
                  <label style={{ display: 'block', textAlign: 'center', background: 'var(--primary)', color: 'white', fontSize: 10, padding: 4, borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                    Upload Image
                    <input type="file" accept="image/*" onChange={e => handleCarouselFileChange(i, e.target.files[0])} style={{ display: 'none' }} />
                  </label>
                  <InlineInput value={item.img} onChange={val => handleCarouselChange(i, 'img', val)} placeholder="URL" style={{ fontSize: 10, padding: 4, marginTop: 4, background: '#f8fafc' }} />
                </div>
              ))}
              <div style={{ minWidth: 120, background: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: 8, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => {
                setConfig(prev => ({ ...prev, carousel: [...prev.carousel, { label: 'Label Baru', img: '', iconName: 'Sparkles' }] }));
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>+ Tambah</span>
              </div>
            </div>
          </div>

          <div className="hero-content">
            <h1 style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <InlineInput value={heroTitle1} onChange={setHeroTitle1} placeholder="Baris 1..." style={{ color: 'var(--primary)', fontSize: '2.25rem', fontWeight: 900 }} />
              <InlineInput value={heroTitle2} onChange={setHeroTitle2} placeholder="Baris 2..." style={{ color: 'var(--primary)', fontSize: '2.25rem', fontWeight: 900 }} />
            </h1>
            <p>
              <InlineTextarea value={config.hero.subtitle} onChange={val => handleChange('hero', 'subtitle', val)} placeholder="Deskripsi..." />
            </p>
            <div style={{ display: 'inline-block', background: 'var(--primary)', borderRadius: 12, padding: 2 }}>
              <InlineInput value={config.hero.buttonText} onChange={val => handleChange('hero', 'buttonText', val)} style={{ color: 'white', fontWeight: 800, textAlign: 'center', background: 'transparent', border: 'none' }} />
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US SECTION */}
        <section className="landing-section">
          <h2 className="section-title-premium">
            <InlineInput value={config.whyUs?.title || 'Kenapa Pilih Kami?'} onChange={val => handleChange('whyUs', 'title', val)} style={{ textAlign: 'center' }} />
          </h2>
          <p className="section-subtitle-premium">
            <InlineTextarea value={config.whyUs?.subtitle || 'Kualitas premium dengan pelayanan setulus hati.'} onChange={val => handleChange('whyUs', 'subtitle', val)} style={{ textAlign: 'center' }} />
          </p>

          <div className="why-grid">
            <div className="why-card premium-card"><div className="why-icon"><Sparkles size={20} /></div><h3>Deep Cleaning</h3></div>
            <div className="why-card premium-card"><div className="why-icon"><Truck size={20} /></div><h3>Pick &amp; Drop</h3></div>
            <div className="why-card premium-card"><div className="why-icon"><Timer size={20} /></div><h3>Fast Service</h3></div>
            <div className="why-card premium-card"><div className="why-icon"><Camera size={20} /></div><h3>Foto Bukti</h3></div>
          </div>
        </section>

        {/* SERVICES PREVIEW */}
        <section className="landing-section bg-light">
          <h2 className="section-title-premium">
            <InlineInput value={config.services.title || 'Layanan Kami'} onChange={val => handleChange('services', 'title', val)} style={{ textAlign: 'center' }} />
          </h2>
          <p className="section-subtitle-premium">
            <InlineTextarea value={config.services.subtitle || 'Solusi tepat untuk setiap jenis sepatu Anda.'} onChange={val => handleChange('services', 'subtitle', val)} style={{ textAlign: 'center' }} />
          </p>

          <div style={{ background: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, border: '1px solid #e2e8f0', maxWidth: 600, margin: '0 auto 20px auto' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#475569' }}>Pilih Maksimal 3 Layanan untuk Ditampilkan:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {services.map(s => {
                const isChecked = (config.services.selectedIds || []).includes(s.service_id);
                return (
                  <label key={s.service_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: isChecked ? 'var(--secondary)' : '#f8fafc', borderRadius: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isChecked} onChange={() => handleServiceSelect(s.service_id)} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{s.serviceName}</span>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>Rp {s.price?.toLocaleString('id-ID')}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="services-grid">
            {services.filter(s => (config.services.selectedIds || []).includes(s.service_id)).map(service => (
              <div key={service.service_id} className="service-card-premium premium-card" style={{ opacity: 0.8, pointerEvents: 'none' }}>
                <div className="card-img-wrapper"><img src={service.image} alt={service.serviceName} className="card-img" /></div>
                <div className="card-body">
                  <h3>{service.serviceName}</h3>
                  <p className="desc">{service.description}</p>
                  <div className="card-footer">
                    <span className="price-value" style={{ color: 'var(--primary)' }}>Rp {service.price?.toLocaleString('id-ID')}</span>
                    <button className="btn-premium" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Pesan</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BEFORE AFTER SECTION */}
        <section className="landing-section">
          <h2 className="section-title-premium">
            <InlineInput value={config.hasilNyata.title} onChange={val => handleChange('hasilNyata', 'title', val)} style={{ textAlign: 'center' }} />
          </h2>
          <p className="section-subtitle-premium">
            <InlineTextarea value={config.hasilNyata.subtitle} onChange={val => handleChange('hasilNyata', 'subtitle', val)} style={{ textAlign: 'center' }} />
          </p>

          <div className="comparison-container" style={{ position: 'relative' }}>
            <img src={config.hasilNyata.img} alt="Before After Preview" style={{ width: '100%', display: 'block', minHeight: 200, background: '#f1f5f9' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8 }}>
              <label style={{ background: 'white', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                Upload Baru
                <input type="file" accept="image/*" onChange={e => handleFileChange('hasilNyata', 'img', e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ padding: 8, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
               <InlineInput value={config.hasilNyata.img} onChange={val => handleChange('hasilNyata', 'img', val)} placeholder="URL Gambar..." style={{ fontSize: 11 }} />
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="landing-section bg-soft-blue">
          <h2 className="section-title-premium">
            <InlineInput value={config.aboutUs.title} onChange={val => handleChange('aboutUs', 'title', val)} style={{ textAlign: 'center' }} />
          </h2>
          <p className="about-text">
            <InlineTextarea value={config.aboutUs.description} onChange={val => handleChange('aboutUs', 'description', val)} style={{ textAlign: 'center' }} rows={4} />
          </p>

          <div className="hero-stats" style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24 }}>
            {(config.aboutUs.stats || [
              { val: "2+", label: "Tahun Pengalaman" },
              { val: "200+", label: "Sepatu Selesai" }
            ]).map((stat, i) => (
              <div key={i} className="stat-item" style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 20px', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <InlineInput value={stat.val} onChange={val => {
                  const newStats = [...(config.aboutUs.stats || [{val:"2+",label:"Tahun Pengalaman"},{val:"200+",label:"Sepatu Selesai"}])];
                  newStats[i] = { ...newStats[i], val };
                  handleChange('aboutUs', 'stats', newStats);
                }} style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.25rem', textAlign: 'center', background: 'transparent' }} />
                <InlineInput value={stat.label} onChange={val => {
                  const newStats = [...(config.aboutUs.stats || [{val:"2+",label:"Tahun Pengalaman"},{val:"200+",label:"Sepatu Selesai"}])];
                  newStats[i] = { ...newStats[i], label: val };
                  handleChange('aboutUs', 'stats', newStats);
                }} style={{ fontSize: '0.75rem', color: 'var(--text-gray)', fontWeight: 600, textAlign: 'center', background: 'transparent' }} />
              </div>
            ))}
          </div>
        </section>

        {/* LOCATION SECTION */}
        <section className="landing-section">
          <h2 className="section-title-premium">
            <InlineInput value={config.location.title} onChange={val => handleChange('location', 'title', val)} style={{ textAlign: 'center' }} />
          </h2>
          <p className="section-subtitle-premium">
            <InlineTextarea value={config.location.subtitle} onChange={val => handleChange('location', 'subtitle', val)} style={{ textAlign: 'center' }} />
          </p>

          <div className="premium-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'var(--secondary)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}><MapPin size={20} /></div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>
                  <InlineInput value={config.location.addressName} onChange={val => handleChange('location', 'addressName', val)} />
                </h4>
                <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  <InlineTextarea value={config.location.addressText} onChange={val => handleChange('location', 'addressText', val)} rows={2} />
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <InlineInput type="number" step="any" value={config.location.latitude} onChange={val => handleChange('location', 'latitude', parseFloat(val))} placeholder="Latitude" style={{ fontSize: 12 }} />
              <InlineInput type="number" step="any" value={config.location.longitude} onChange={val => handleChange('location', 'longitude', parseFloat(val))} placeholder="Longitude" style={{ fontSize: 12 }} />
            </div>
            <div style={{ width: '100%', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              <MapViewer latitude={config.location.latitude} longitude={config.location.longitude} height="200px" />
            </div>
            <InlineInput value={config.location.mapLink} onChange={val => handleChange('location', 'mapLink', val)} placeholder="Map Link URL" style={{ fontSize: 12, textAlign: 'center' }} />
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
            </div>

            <p className="footer-description">
              <InlineTextarea value={config.footer.description} onChange={val => handleChange('footer', 'description', val)} style={{ textAlign: 'center' }} />
            </p>

            <div className="footer-contact-list" style={{ width: '100%', maxWidth: 300 }}>
              <div className="contact-row" style={{ width: '100%' }}>
                <MapPin size={18} className="contact-icon" />
                <InlineInput value={config.footer.address} onChange={val => handleChange('footer', 'address', val)} style={{ flex: 1 }} />
              </div>
              <div className="contact-row" style={{ width: '100%' }}>
                <Clock size={18} className="contact-icon" />
                <InlineInput value={config.footer.schedule} onChange={val => handleChange('footer', 'schedule', val)} style={{ flex: 1 }} />
              </div>
              <div className="contact-row" style={{ width: '100%' }}>
                <Phone size={18} className="contact-icon" />
                <InlineInput value={config.footer.phone} onChange={val => handleChange('footer', 'phone', val)} style={{ flex: 1 }} />
              </div>
            </div>

            <div className="footer-social-group">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <div className="social-pill"><WhatsappIcon size={18} /><span>WhatsApp</span></div>
                <InlineInput value={config.footer.whatsappLink} onChange={val => handleChange('footer', 'whatsappLink', val)} placeholder="WA Link" style={{ fontSize: 10, textAlign: 'center', width: 120 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <div className="social-pill"><InstagramIcon size={18} /><span>Instagram</span></div>
                <InlineInput value={config.footer.instagramLink} onChange={val => handleChange('footer', 'instagramLink', val)} placeholder="IG Link" style={{ fontSize: 10, textAlign: 'center', width: 120 }} />
              </div>
            </div>
            
            <div className="footer-divider"></div>
          </div>
        </footer>

      </div>

      <button 
        onClick={handleSave} 
        disabled={isSaving}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '20px',
          width: '56px',
          height: '56px',
          background: 'var(--primary)',
          border: 'none',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 8px 24px rgba(6, 64, 88, 0.4)',
          zIndex: 2000,
          cursor: isSaving ? 'not-allowed' : 'pointer',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          opacity: isSaving ? 0.7 : 1
        }}
        onMouseEnter={e => !isSaving && (e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)')}
        onMouseLeave={e => !isSaving && (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
      >
        <Save size={24} />
      </button>
    </div>
  );
};

export default AdminLandingConfig;
