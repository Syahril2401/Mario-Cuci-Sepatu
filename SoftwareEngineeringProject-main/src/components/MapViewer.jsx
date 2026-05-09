import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

const MapViewer = ({ latitude, longitude, height = '200px' }) => {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initLeaflet = () => {
      // Load Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (window.L) {
        setupLeaflet();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = setupLeaflet;
      document.head.appendChild(script);
    };

    const setupLeaflet = () => {
      if (!mapRef.current || !window.L) return;
      
      setLoading(false);
      const center = [latitude, longitude];

      const lMap = window.L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true
      }).setView(center, 15);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(lMap);

      window.L.marker(center).addTo(lMap);
      
      // Add zoom control to bottom right
      window.L.control.zoom({ position: 'bottomright' }).addTo(lMap);
    };

    initLeaflet();
  }, [latitude, longitude]);

  const openInMaps = () => {
    window.open(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`, '_blank');
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: height, 
          borderRadius: '12px', 
          border: '1px solid #E2E8F0', 
          backgroundColor: '#F8FAFC',
          zIndex: 1
        }} 
      />
      
      {loading && (
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', borderRadius: '12px', zIndex: 2 
        }}>
          <div className="map-spinner"></div>
        </div>
      )}

      <button
        onClick={openInMaps}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          backgroundColor: 'white', border: 'none', borderRadius: '8px',
          padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700,
          color: '#064058', display: 'flex', alignItems: 'center', gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', zIndex: 10
        }}
      >
        <Navigation size={14} /> Open Maps
      </button>

      <style>{`
        @keyframes map-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .map-spinner { border: 2px solid #E2E8F0; border-top: 2px solid #064058; borderRadius: 50%; width: 20px; height: 20px; animation: map-spin 1s linear infinite; }
        .leaflet-container { z-index: 1 !important; font-family: inherit; }
      `}</style>
    </div>
  );
};

export default MapViewer;
