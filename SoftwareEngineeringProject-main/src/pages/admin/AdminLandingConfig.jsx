import React, { useState, useEffect } from 'react';
import { landingService } from '../../services/landingService';
import { serviceService } from '../../services/serviceService';
import { Save, Image as ImageIcon, MapPin, Type, Edit3, ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const AdminLandingConfig = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [imageToDelete, setImageToDelete] = useState(null);

  // States to hold the two lines of the hero title without exposing HTML tags to the admin
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

          // Split the existing title by <br /> or <br> to separate into two lines
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
      // Re-assemble the title using <br /> tag before saving it back
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
    <div className="admin-root">
      {/* HEADER */}
      <div className="adm-header adm-fadeUp" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="adm-header-title">Edit Landing Page</h2>
          <p className="adm-header-sub">Kustomisasi konten halaman utama</p>
        </div>
        <button 
          onClick={() => navigate('/admin/dashboard')} 
          className="adm-quick-btn" 
          style={{ padding: '8px 12px', flexDirection: 'row', gap: 6, background: 'white', color: 'var(--text-primary)', fontFamily: 'inherit' }}
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
      </div>

      {message && (
        <div style={{ 
          padding: '12px 16px', 
          background: '#dcfce7', 
          color: '#15803d', 
          borderRadius: '12px', 
          marginBottom: 20, 
          fontSize: '13.5px',
          fontWeight: 700,
          border: '1px solid #bbf7d0',
          animation: 'adm-fadeUp 0.3s ease'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 100 }} className="adm-fade2">
        
        {/* 1. HERO SECTION */}
        <div className="adm-card" style={{ padding: 20 }}>
          <div className="adm-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', marginBottom: 16 }}>
            <Type size={18} color="var(--navy)" /> 1. Hero Section (Header Utama)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="adm-field-label">Judul Utama - Baris Pertama</label>
              <input 
                className="adm-field-input" 
                value={heroTitle1} 
                onChange={e => setHeroTitle1(e.target.value)} 
                placeholder="Contoh: Sepatu Kinclong," 
              />
            </div>
            <div>
              <label className="adm-field-label">Judul Utama - Baris Kedua</label>
              <input 
                className="adm-field-input" 
                value={heroTitle2} 
                onChange={e => setHeroTitle2(e.target.value)} 
                placeholder="Contoh: Percaya Diri Maksimal 👟" 
              />
            </div>
            <div>
              <label className="adm-field-label">Sub-judul / Deskripsi Singkat</label>
              <textarea 
                className="adm-field-textarea" 
                value={config.hero.subtitle} 
                onChange={e => handleChange('hero', 'subtitle', e.target.value)} 
                placeholder="Tulis deskripsi singkat penawaran Anda..." 
                rows={3} 
              />
            </div>
            <div>
              <label className="adm-field-label">Teks Tombol Aksi</label>
              <input 
                className="adm-field-input" 
                value={config.hero.buttonText} 
                onChange={e => handleChange('hero', 'buttonText', e.target.value)} 
                placeholder="Contoh: Mulai Order / Order Sekarang" 
              />
            </div>
          </div>
        </div>

        {/* 2. HERO CAROUSEL PHOTOS */}
        <div className="adm-card" style={{ padding: 20 }}>
          <div className="adm-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', marginBottom: 16 }}>
            <ImageIcon size={18} color="var(--navy)" /> 2. Hero Carousel (Foto Slider)
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: -8, marginBottom: 16 }}>
            Silakan pilih file gambar dari perangkat Anda atau masukkan URL gambar secara manual.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {config.carousel.map((item, i) => (
              <div key={i} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '12px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Slide {i + 1} - {item.label}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {item.img ? (
                    <div style={{ position: 'relative', width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={item.img} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '80px', borderRadius: '8px', border: '1.5px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Belum ada gambar</span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        className="adm-field-input" 
                        value={item.img} 
                        onChange={e => handleCarouselChange(i, 'img', e.target.value)} 
                        placeholder="Masukkan URL Gambar..." 
                        style={{ fontSize: '12px' }}
                      />
                    </div>
                    <label style={{ 
                      padding: '10px 12px', 
                      background: 'white', 
                      border: '1.5px solid #e2e8f0', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <Upload size={14} color="var(--text-secondary)" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => handleCarouselFileChange(i, e.target.files[0])} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    {item.img && (
                      <button 
                        type="button"
                        onClick={() => setImageToDelete({ type: 'carousel', index: i })}
                        style={{
                          padding: '10px',
                          background: '#fee2e2',
                          border: '1.5px solid #fecaca',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ef4444'
                        }}
                        title="Hapus Gambar"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. LAYANAN UNGGULAN */}
        <div className="adm-card" style={{ padding: 20 }}>
          <div className="adm-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', marginBottom: 16 }}>
            <Edit3 size={18} color="var(--navy)" /> 3. Layanan Pilihan
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: -8, marginBottom: 16 }}>
            Pilih maksimal 3 layanan utama yang ingin langsung ditampilkan pada Landing Page.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {services.map(s => {
              const isChecked = (config.services.selectedIds || []).includes(s.service_id);
              return (
                <label 
                  key={s.service_id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    padding: '12px 14px', 
                    border: isChecked ? '1.5px solid var(--navy)' : '1.5px solid #e2e8f0', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    background: isChecked ? 'var(--navy-light)' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={() => handleServiceSelect(s.service_id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{s.serviceName}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Rp {s.price?.toLocaleString('id-ID')}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* 4. HASIL NYATA SECTION */}
        <div className="adm-card" style={{ padding: 20 }}>
          <div className="adm-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', marginBottom: 16 }}>
            <ImageIcon size={18} color="var(--navy)" /> 4. Hasil Nyata (Before - After)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="adm-field-label">Judul Section</label>
              <input 
                className="adm-field-input" 
                value={config.hasilNyata.title} 
                onChange={e => handleChange('hasilNyata', 'title', e.target.value)} 
                placeholder="Contoh: Hasil Nyata" 
              />
            </div>
            <div>
              <label className="adm-field-label">Deskripsi / Subtitle</label>
              <input 
                className="adm-field-input" 
                value={config.hasilNyata.subtitle} 
                onChange={e => handleChange('hasilNyata', 'subtitle', e.target.value)} 
                placeholder="Contoh: Bukan sekedar bersih, tapi kembali seperti baru." 
              />
            </div>
            <div>
              <label className="adm-field-label">Gambar Sebelum & Sesudah</label>
              {config.hasilNyata.img ? (
                <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 10 }}>
                  <img src={config.hasilNyata.img} alt="Sebelum Sesudah Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f1f5f9' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '140px', borderRadius: '10px', border: '1.5px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', marginBottom: 10 }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Belum ada gambar</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <input 
                    className="adm-field-input" 
                    value={config.hasilNyata.img} 
                    onChange={e => handleChange('hasilNyata', 'img', e.target.value)} 
                    placeholder="URL Gambar Before-After..." 
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <label style={{ 
                  padding: '10px 12px', 
                  background: 'white', 
                  border: '1.5px solid #e2e8f0', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Upload size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Upload</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => handleFileChange('hasilNyata', 'img', e.target.files[0])} 
                    style={{ display: 'none' }} 
                  />
                </label>
                {config.hasilNyata.img && (
                  <button 
                    type="button"
                    onClick={() => setImageToDelete({ type: 'hasilNyata' })}
                    style={{
                      padding: '10px',
                      background: '#fee2e2',
                      border: '1.5px solid #fecaca',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444'
                    }}
                    title="Hapus Gambar"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. ABOUT US SECTION */}
        <div className="adm-card" style={{ padding: 20 }}>
          <div className="adm-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', marginBottom: 16 }}>
            <Type size={18} color="var(--navy)" /> 5. Tentang Kami (About Us)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="adm-field-label">Judul Section</label>
              <input 
                className="adm-field-input" 
                value={config.aboutUs.title} 
                onChange={e => handleChange('aboutUs', 'title', e.target.value)} 
                placeholder="Contoh: ABOUT US" 
              />
            </div>
            <div>
              <label className="adm-field-label">Deskripsi Cerita / Profil Toko</label>
              <textarea 
                className="adm-field-textarea" 
                value={config.aboutUs.description} 
                onChange={e => handleChange('aboutUs', 'description', e.target.value)} 
                placeholder="Tulis sejarah/visi misi Mario Cuci Sepatu..." 
                rows={4} 
              />
            </div>
          </div>
        </div>

        {/* 6. OUR LOCATION SECTION */}
        <div className="adm-card" style={{ padding: 20 }}>
          <div className="adm-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', marginBottom: 16 }}>
            <MapPin size={18} color="var(--navy)" /> 6. Lokasi Peta (Leaflet Map)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="adm-field-label">Judul Section</label>
                <input 
                  className="adm-field-input" 
                  value={config.location.title} 
                  onChange={e => handleChange('location', 'title', e.target.value)} 
                />
              </div>
              <div>
                <label className="adm-field-label">Subtitle Section</label>
                <input 
                  className="adm-field-input" 
                  value={config.location.subtitle} 
                  onChange={e => handleChange('location', 'subtitle', e.target.value)} 
                />
              </div>
            </div>
            <div>
              <label className="adm-field-label">Nama Tempat/Studio</label>
              <input 
                className="adm-field-input" 
                value={config.location.addressName} 
                onChange={e => handleChange('location', 'addressName', e.target.value)} 
              />
            </div>
            <div>
              <label className="adm-field-label">Alamat Lengkap (Teks)</label>
              <textarea 
                className="adm-field-textarea" 
                value={config.location.addressText} 
                onChange={e => handleChange('location', 'addressText', e.target.value)} 
                rows={2} 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="adm-field-label">Latitude Peta</label>
                <input 
                  className="adm-field-input" 
                  type="number" 
                  step="any"
                  value={config.location.latitude} 
                  onChange={e => handleChange('location', 'latitude', parseFloat(e.target.value))} 
                />
              </div>
              <div>
                <label className="adm-field-label">Longitude Peta</label>
                <input 
                  className="adm-field-input" 
                  type="number" 
                  step="any"
                  value={config.location.longitude} 
                  onChange={e => handleChange('location', 'longitude', parseFloat(e.target.value))} 
                />
              </div>
            </div>
            <div>
              <label className="adm-field-label">Link Navigasi Peta (OpenStreetMap/Google Maps)</label>
              <input 
                className="adm-field-input" 
                value={config.location.mapLink} 
                onChange={e => handleChange('location', 'mapLink', e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* 7. FOOTER SECTION */}
        <div className="adm-card" style={{ padding: 20 }}>
          <div className="adm-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', marginBottom: 16 }}>
            <Type size={18} color="var(--navy)" /> 7. Footer Informasi & Kontak
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="adm-field-label">Deskripsi Singkat Footer</label>
              <textarea 
                className="adm-field-textarea" 
                value={config.footer.description} 
                onChange={e => handleChange('footer', 'description', e.target.value)} 
                rows={3} 
              />
            </div>
            <div>
              <label className="adm-field-label">Alamat Footer</label>
              <input 
                className="adm-field-input" 
                value={config.footer.address} 
                onChange={e => handleChange('footer', 'address', e.target.value)} 
              />
            </div>
            <div>
              <label className="adm-field-label">Jadwal Jam Buka</label>
              <input 
                className="adm-field-input" 
                value={config.footer.schedule} 
                onChange={e => handleChange('footer', 'schedule', e.target.value)} 
              />
            </div>
            <div>
              <label className="adm-field-label">No. Telepon Kontak</label>
              <input 
                className="adm-field-input" 
                value={config.footer.phone} 
                onChange={e => handleChange('footer', 'phone', e.target.value)} 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="adm-field-label">Link WhatsApp</label>
                <input 
                  className="adm-field-input" 
                  value={config.footer.whatsappLink} 
                  onChange={e => handleChange('footer', 'whatsappLink', e.target.value)} 
                />
              </div>
              <div>
                <label className="adm-field-label">Link Instagram</label>
                <input 
                  className="adm-field-input" 
                  value={config.footer.instagramLink} 
                  onChange={e => handleChange('footer', 'instagramLink', e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FLOAT SAVE BUTTON */}
      <div style={{ 
        position: 'fixed', 
        bottom: 24, 
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '448px',
        padding: '0 16px',
        boxSizing: 'border-box',
        zIndex: 100 
      }}>
        <button 
          className="adm-btn-primary" 
          style={{ 
            width: '100%', 
            padding: '14px', 
            borderRadius: '14px', 
            justifyContent: 'center', 
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(6, 64, 88, 0.3)',
            fontFamily: 'inherit'
          }} 
          onClick={handleSave} 
          disabled={isSaving}
        >
          <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </button>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {imageToDelete && (
        <div 
          className="adm-confirm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setImageToDelete(null); }}
        >
          <div className="adm-confirm-card">
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#ef4444' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 6px 0' }}>Hapus Gambar?</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Gambar ini akan dihapus dari draf. Pastikan Anda menekan tombol Simpan Konfigurasi untuk memperbarui secara permanen.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => {
                  if (imageToDelete.type === 'carousel') {
                    handleCarouselChange(imageToDelete.index, 'img', '');
                  } else if (imageToDelete.type === 'hasilNyata') {
                    handleChange('hasilNyata', 'img', '');
                  }
                  setImageToDelete(null);
                }}
                style={{ flex: 1, padding: 12, background: '#ef4444', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Ya, Hapus
              </button>
              <button 
                onClick={() => setImageToDelete(null)}
                style={{ flex: 1, padding: 12, background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLandingConfig;
