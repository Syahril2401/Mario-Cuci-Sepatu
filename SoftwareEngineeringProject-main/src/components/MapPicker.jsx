import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, AlertCircle } from 'lucide-react';

const MapPicker = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimerRef = useRef(null);

  // Default to Jakarta
  const defaultCenter = { lat: -6.200000, lng: 106.816666 };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

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
      const initialCenter = initialLocation?.lat && initialLocation?.lng 
        ? [initialLocation.lat, initialLocation.lng] 
        : [defaultCenter.lat, defaultCenter.lng];

      const lMap = window.L.map(mapRef.current).setView(initialCenter, 15);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(lMap);

      const lMarker = window.L.marker(initialCenter, { draggable: true }).addTo(lMap);

      lMap.on('click', (e) => {
        const { lat, lng } = e.latlng;
        lMarker.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });

      lMarker.on('dragend', () => {
        const { lat, lng } = lMarker.getLatLng();
        reverseGeocode(lat, lng);
      });

      setMap(lMap);
      setMarker(lMarker);
      
      if (initialLocation?.lat) {
        reverseGeocode(initialLocation.lat, initialLocation.lng);
      }
    };

    initLeaflet();
  }, []);

  const reverseGeocode = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        handleLocationChange({ lat, lng }, data.display_name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      searchLocation(val);
    }, 600);
  };

  const searchLocation = async (query) => {
    setSearchLoading(true);
    setShowResults(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const location = { lat, lng };
    
    if (map && marker) {
      map.setView([lat, lng], 17);
      marker.setLatLng([lat, lng]);
    }
    
    handleLocationChange(location, result.display_name);
    setShowResults(false);
  };

  const handleLocationChange = (latLng, formattedAddress) => {
    setAddress(formattedAddress);
    onLocationSelect({
      latitude: latLng.lat,
      longitude: latLng.lng,
      address: formattedAddress
    });
  };

  const useCurrentLocation = () => {
    if (!map || !marker) return;
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          map.setView([lat, lng], 17);
          marker.setLatLng([lat, lng]);
          reverseGeocode(lat, lng);
        },
        () => { setLoading(false); alert("Gagal mendapatkan lokasi."); }
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          type="text"
          placeholder="Cari lokasi atau alamat..."
          onChange={handleSearchChange}
          onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
          style={{
            width: '100%', height: '44px', padding: '0 12px 0 38px', borderRadius: '10px',
            border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
          }}
        />
        
        {showResults && (
          <div style={{ 
            position: 'absolute', top: '48px', left: 0, right: 0, backgroundColor: 'white', 
            borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 2000, maxHeight: '200px', overflowY: 'auto'
          }}>
            {searchLoading ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>Mencari...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((res, i) => (
                <div 
                  key={i} 
                  onClick={() => handleSelectResult(res)}
                  style={{ padding: '10px 12px', borderBottom: i < searchResults.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', gap: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0, color: '#9CA3AF' }} />
                  <span style={{ color: '#374151', lineHeight: '1.4' }}>{res.display_name}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>Lokasi tidak ditemukan</div>
            )}
          </div>
        )}
      </div>

      {showResults && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }} onClick={() => setShowResults(false)}></div>}

      <div style={{ position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '240px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#F3F4F6', zIndex: 1 }}></div>
        
        {!loading && (
          <button
            type="button"
            onClick={useCurrentLocation}
            style={{
              position: 'absolute', bottom: '16px', right: '16px', width: '40px', height: '40px',
              borderRadius: '50%', backgroundColor: 'white', border: 'none', display: 'flex',
              alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              cursor: 'pointer', zIndex: 1000
            }}
          >
            <Navigation size={20} color="#064058" />
          </button>
        )}

        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', zIndex: 2 }}>
            <div className="spinner-small"></div>
          </div>
        )}
      </div>

      <div style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <AlertCircle size={12} />
        <span>Menggunakan OpenStreetMap (Gratis & Tanpa API Key)</span>
      </div>

      {address && (
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '10px', border: '1px solid #DCFCE7' }}>
          <MapPin size={18} color="#166534" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: '1.4' }}>{address}</p>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner-small { border: 3px solid #f3f3f3; border-top: 3px solid #064058; borderRadius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; }
        .leaflet-container { z-index: 1 !important; }
      `}</style>
    </div>
  );
};

export default MapPicker;
