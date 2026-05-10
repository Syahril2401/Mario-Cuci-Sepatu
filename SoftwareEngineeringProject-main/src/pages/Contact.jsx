import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Clock,
  ChevronRight, Send,
  Map, Calendar, ArrowLeft
} from 'lucide-react';
import './Pages.css';
import { WhatsappIcon } from '../components/Icons';

const Contact = () => {
  const navigate = useNavigate();

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/6281233981688", "_blank");
  };

  const handleEmailClick = () => {
    window.location.href = "mailto:hello@mariocucisepatu.com";
  };

  const handleMapsClick = (e) => {
    if (e) e.stopPropagation();
    window.open("https://www.openstreetmap.org/?mlat=-7.257472&mlon=112.610535#map=17/-7.257472/112.610535", "_blank");
  };

  return (
    <div className="page-container fade-in" style={{ paddingTop: '1rem', maxWidth: '480px', margin: '0 auto', gap: '0' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
          animation: fadeInUp 0.5s ease-out forwards;
        }

        .contact-card-modern {
          background: white;
          border-radius: 16px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid #f1f5f9;
        }

        .contact-card-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
          border-color: #e2e8f0;
        }

        .contact-card-modern:active {
          transform: scale(0.98);
        }

        .icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #f0f9ff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0369a1;
          flex-shrink: 0;
        }

        .cta-box {
          background: linear-gradient(135deg, #064058 0%, #0c6a91 100%);
          border-radius: 20px;
          padding: 24px;
          margin-top: 24px;
          margin-bottom: 40px;
          color: white;
          text-align: center;
          box-shadow: 0 10px 25px rgba(6, 64, 88, 0.2);
        }

        .btn-cta-white {
          background: white;
          color: #064058;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 1rem;
          width: 100%;
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .btn-cta-white:active {
          transform: scale(0.97);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes scrollRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .marquee-container {
          display: flex;
          white-space: nowrap;
          width: 200%; /* Lebar ekstra untuk looping yang mulus */
        }
      `}</style>

      {/* Back button + Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/home')}
          style={{ width: 36, height: 36, borderRadius: 12, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', flexShrink: 0 }}
        >
          <ArrowLeft size={18} color="#064058" />
        </button>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#064058', margin: 0, letterSpacing: '-0.3px' }}>Hubungi Kami</h1>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Kami siap membantu Anda</p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="contact-card-modern" onClick={handleWhatsAppClick}>
        <div className="icon-circle">
          <WhatsappIcon size={22} color="#064058" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>WhatsApp</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>+62 812 3398 1688</p>
        </div>
        <ChevronRight size={18} color="#cbd5e1" />
      </div>

      <div className="contact-card-modern" onClick={handleEmailClick}>
        <div className="icon-circle" style={{ color: '#0891b2', backgroundColor: '#ecfeff' }}>
          <Mail size={22} color="#064058" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Email Support</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>hello@mariocucisepatu.com</p>
        </div>
        <ChevronRight size={18} color="#cbd5e1" />
      </div>

      <div className="contact-card-modern" onClick={handleMapsClick}>
        <div className="icon-circle" style={{ color: '#4f46e5', backgroundColor: '#eef2ff' }}>
          <MapPin size={22} color="#064058" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Studio Northwest</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>Northwest lake NG18-31</p>
          <div style={{ marginTop: '8px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Map size={12} /> Buka Maps
            </span>
          </div>
        </div>
        <ChevronRight size={18} color="#cbd5e1" />
      </div>

      {/* Operating Hours Card */}
      <div className="contact-card-modern" style={{ cursor: 'default' }}>
        <div className="icon-circle" style={{ color: '#064058', backgroundColor: '#faf5ff' }}>
          <Clock size={22} color="#064058" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Jam Operasional</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Senin – Jumat</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>09:00 – 20:00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Sabtu – Minggu</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>10:00 – 18:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="cta-box" style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#005473',
        zIndex: 1,
        padding: '24px' // Pastikan ada padding agar konten tidak mepet
      }}>

        {/* Background Pattern Layer */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          right: '-10%',
          bottom: '-10%',
          opacity: 0.08,
          zIndex: -1,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          transform: 'rotate(-10deg)', // Miringkan sedikit agar lebih estetik
        }}>
          {/* Baris 1: Gerak ke Kiri */}
          <div style={{
            display: 'flex',
            gap: '40px',
            animation: 'scrollLeft 20s linear infinite',
            width: 'max-content'
          }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <WhatsappIcon key={`row1-${i}`} size={45} />
            ))}
          </div>

          {/* Baris 2: Gerak ke Kanan */}
          <div style={{
            display: 'flex',
            gap: '40px',
            animation: 'scrollRight 25s linear infinite',
            width: 'max-content'
          }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <WhatsappIcon key={`row2-${i}`} size={45} />
            ))}
          </div>

          {/* Baris 3: Gerak ke Kiri */}
          <div style={{
            display: 'flex',
            gap: '40px',
            animation: 'scrollLeft 22s linear infinite',
            width: 'max-content'
          }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <WhatsappIcon key={`row3-${i}`} size={45} />
            ))}
          </div>
        </div>

        {/* Konten Utama (Tetap Sama) */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div style={{ marginBottom: '4px' }}>
            <WhatsappIcon size={32} style={{ opacity: 0.8, marginBottom: '8px', color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
            Butuh bantuan cepat?
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            Admin kami tersedia untuk konsultasi gratis
          </p>
          <button className="btn-cta-white" onClick={handleWhatsAppClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <WhatsappIcon size={20} /> Chat via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contact;
