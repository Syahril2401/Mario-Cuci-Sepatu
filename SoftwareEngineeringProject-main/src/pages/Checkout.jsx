import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MapPicker from '../components/MapPicker';
import './Profile.css';
import { orderService } from '../services/orderService';
import { promoService } from '../services/promoService';
import { userService } from '../services/userService';
import useAuthStore from '../store/authStore';
import {
  AlertCircle, UploadCloud, X, MapPin,
  Calendar, Info, ShoppingBag, Truck,
  User, CreditCard, ChevronRight, Check,
  ChevronLeft
} from 'lucide-react';
import './Pages.css';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const service = location.state?.service;

  // Form State
  const [quantity, setQuantity] = useState(1);
  const today = new Date().toISOString().split("T")[0];
  const [pickupDate, setPickupDate] = useState(today);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [minDeliveryDate, setMinDeliveryDate] = useState(today);
  const [remainingQuota, setRemainingQuota] = useState(20);
  const [quotaInfo, setQuotaInfo] = useState({ isFull: false, message: 'Checking availability...' });
  const [promos, setPromos] = useState([]);
  const [activePromo, setActivePromo] = useState(null);

  // Find First Available Date on Mount
  useEffect(() => {
    const initQuota = async () => {
      try {
        const statsToday = await orderService.getDailyStats(today);
        if (statsToday.isFull) {
          // If full, we default to the current day but show error, or let user pick another.
          // Since findNextAvailableDate is missing from orderService, we just inform the user.
          setPickupDate(today);
          setRemainingQuota(0);
          setQuantity(1); // will be validated later
          setQuotaInfo({
            isFull: true,
            message: "Kuota pemesanan hari ini sudah penuh. Silakan pilih tanggal lain."
          });
        } else {
          setPickupDate(today);
          setRemainingQuota(statsToday.remaining || 20);
          setQuotaInfo({
            isFull: false,
            message: `Sisa slot hari ini: ${statsToday.remaining || 20} pesanan`
          });
        }
      } catch (err) {
        setRemainingQuota(20);
      }
    };
    initQuota();
  }, [today]);

  // Handle Manual Date Change & Quota Validation
  const handleDateChange = async (newDate) => {
    if (newDate < today) return;
    
    try {
      const stats = await orderService.getDailyStats(newDate);
      if (stats.isFull) {
        setPickupDate(newDate);
        setRemainingQuota(0);
        setQuotaInfo({
          isFull: true,
          message: `Kuota pemesanan tanggal ${newDate} sudah penuh.`
        });
        
        setError(`Kuota tanggal ${newDate} penuh. Harap pilih tanggal lain.`);
        setTimeout(() => setError(''), 3000);
      } else {
        setPickupDate(newDate);
        setRemainingQuota(stats.remaining || 20);
        setQuotaInfo({
          isFull: false,
          message: `Sisa slot tanggal ini: ${stats.remaining || 20} pesanan`
        });
        if (quantity > (stats.remaining || 20)) {
           setQuantity(stats.remaining || 20);
        }
      }
    } catch (err) {
      setPickupDate(newDate);
      setRemainingQuota(20);
    }
  };

  // Handle Default Delivery Date based on duration
  useEffect(() => {
    if (service && pickupDate) {
      let durationDays = 0;
      const duration = service.duration?.toString() || "0";

      if (duration.includes("-")) {
        const parts = duration.split("-");
        durationDays = parseInt(parts[parts.length - 1]);
      } else {
        durationDays = parseInt(duration);
      }

      const date = new Date(pickupDate);
      date.setDate(date.getDate() + durationDays);
      const minDateStr = date.toISOString().split("T")[0];
      setMinDeliveryDate(minDateStr);
      setDeliveryDate(minDateStr);
    }
  }, [service, pickupDate]);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');

  const [photos, setPhotos] = useState([]);

  // Delivery & Address State
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', detail: '', latitude: null, longitude: null });
  const [pickupMethod, setPickupMethod] = useState('Ambil Sendiri');
  const [returnMethod, setReturnMethod] = useState('Ambil Sendiri');
  const [notes, setNotes] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStorageModal, setShowStorageModal] = useState(false);

  // Dynamic Labels and Placeholders
  const pickupLabel = pickupMethod === 'Ambil Sendiri' ? 'Drop Date' : 'Pickup Date';
  const pickupPlaceholder = pickupMethod === 'Ambil Sendiri' ? 'Pilih tanggal kamu akan mengantar sepatu' : 'Pilih tanggal penjemputan';
  
  const returnLabel = returnMethod === 'Ambil Sendiri' ? 'Pickup Date' : 'Delivery Date';
  const returnPlaceholder = returnMethod === 'Ambil Sendiri' ? 'Pilih tanggal pengambilan' : 'Pilih tanggal pengantaran';

  // Initial Guard & Setup
  useEffect(() => {
    if (!service) {
      navigate('/home');
      return;
    }

    // Set Default Address from Profile
    userService.getProfile().then(res => {
      const profile = res.data;
      if (profile && profile.addresses && profile.addresses.length > 0) {
        setAddresses(profile.addresses);
        const def = profile.addresses.find(a => a.isDefault) || profile.addresses[0];
        setSelectedAddress(def);
      } else if (user && user.addresses && user.addresses.length > 0) {
        setAddresses(user.addresses);
        const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setSelectedAddress(def);
      }
    }).catch(err => {
      console.error(err);
      if (user && user.addresses && user.addresses.length > 0) {
        setAddresses(user.addresses);
        const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setSelectedAddress(def);
      }
    });

    // Load Promos
    promoService.getPromos().then(res => {
      const allPromos = res.data || [];
      setPromos(allPromos);
      const active = promoService.getActivePromoForService(service, allPromos);
      setActivePromo(active);
    });
  }, [service, navigate, user]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setError('');
    setIsLoading(true);

    const newPhotos = [];

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        continue;
      }

      const compressedBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max_size = 800; // Resize to max 800px

            if (width > height) {
              if (width > max_size) {
                height *= max_size / width;
                width = max_size;
              }
            } else {
              if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
      
      newPhotos.push(compressedBase64);
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setIsLoading(false);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const originalPricePerItem = service?.price || 0;
  const discountedPricePerItem = promoService.calculateDiscountedPrice(originalPricePerItem, activePromo);
  const totalOriginalPrice = originalPricePerItem * quantity;
  const totalDiscountedPrice = discountedPricePerItem * quantity;
  const savings = totalOriginalPrice - totalDiscountedPrice;

  const STORE_LOCATION = {
    lat: -7.257472,
    lng: 112.610535
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const handleLocationSelect = (location) => {
    setNewAddress(a => ({ ...a, latitude: location.latitude, longitude: location.longitude, detail: location.address }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.label || !newAddress.detail) return;
    
    let profileData = null;
    try {
      const res = await userService.getProfile();
      profileData = res.data;
    } catch (err) {
      console.error("Gagal mendapatkan profil", err);
      return;
    }
    
    const isFirst = !profileData.addresses || profileData.addresses.length === 0;
    const addedAddress = { ...newAddress, id: `ADDR-${Date.now()}`, isDefault: isFirst };
    const updatedAddresses = [...(profileData.addresses || []), addedAddress];
    
    const updatedProfile = { ...profileData, addresses: updatedAddresses };
    
    try {
      await userService.updateProfile(updatedProfile);
      setAddresses(updatedAddresses);
      setSelectedAddress(addedAddress);
      setNewAddress({ label: '', detail: '', latitude: null, longitude: null });
      setShowAddAddressForm(false);
      setShowAddressModal(false);
    } catch (error) {
      console.error("Gagal menambahkan alamat", error);
    }
  };

  const validateForm = () => {
    if (!selectedAddress) return 'Please add an address in your profile first.';

    // Radius Validation
    if (pickupMethod === 'Dijemput Admin' || returnMethod === 'Diantar Admin') {
      if (!selectedAddress.latitude || !selectedAddress.longitude) {
        return 'Lokasi alamat Anda tidak memiliki koordinat peta. Silakan perbarui alamat Anda di profil menggunakan peta.';
      }

      const distance = getDistance(
        STORE_LOCATION.lat,
        STORE_LOCATION.lng,
        selectedAddress.latitude,
        selectedAddress.longitude
      );

      if (distance > 15) {
        return `Maaf, layanan pickup/delivery hanya tersedia dalam radius 15 KM dari toko. Jarak Anda saat ini: ${distance.toFixed(1)} KM.`;
      }
    }

    if (quantity < 1) return 'Quantity must be at least 1.';
    if (remainingQuota === 0) return `Maaf, kuota tanggal ${pickupDate} sudah penuh (Max 20 pesanan/hari). Silakan pilih tanggal lain.`;
    if (quantity > remainingQuota) return `Kuota sisa untuk tanggal ${pickupDate} hanya ${remainingQuota} pesanan. Silakan kurangi jumlah barang.`;
    if (!pickupDate) return 'Please select a pickup date.';
    if (pickupDate < today) return 'Pickup date cannot be in the past.';
    if (!deliveryDate) return 'Please select a delivery date.';
    if (photos.length === 0) return 'Please upload at least 1 photo of your shoes.';
    return null;
  };

  const handleBuyNow = async () => {
    const err = validateForm();
    if (err) {
      setError(err);
      setTimeout(() => {
        const errBox = document.getElementById('error-box');
        if (errBox) {
          errBox.classList.remove('shake-anim');
          void errBox.offsetWidth; // trigger reflow
          errBox.classList.add('shake-anim');
          errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const orderData = {
        order_id: null, 
        user_id: user?.id || 1,
        customerName: user?.name || 'Customer',
        customerPhone: user?.phone || 'N/A',
        service: service.serviceName,
        service_type_id: service.service_id,
        quantity: quantity,
        pickup_date: pickupDate,
        delivery_date: deliveryDate,
        photos: photos,
        photo: photos[0], // Keep for backward compatibility with older components
        totalPrice: totalDiscountedPrice,
        originalPrice: totalOriginalPrice,
        discountAmount: savings,
        promoName: activePromo?.name,
        address: selectedAddress,
        pickupMethod: pickupMethod === 'Ambil Sendiri' ? 'SELF_DROP' : 'COURIER_PICKUP',
        returnMethod: returnMethod === 'Ambil Sendiri' ? 'SELF_PICKUP' : 'COURIER_DELIVERY',
        notes,
        status: "PENDING",
        createdAt: new Date().toISOString()
      };

      const response = await orderService.createOrder(orderData);
      const newOrderId = response.data.order_id;

      setIsLoading(false);
      navigate(`/payment/${newOrderId}`, {
        state: {
          service,
          order_id: newOrderId,
          total: totalDiscountedPrice
        }
      });

    } catch (error) {
      console.error(error);
      if (error.message === 'STORAGE_FULL') {
        setShowStorageModal(true);
      } else {
        setError('Failed to create order. Please try again.');
      }
      setIsLoading(false);
    }
  };

  if (!service) return null;

  return (
    <div className="checkout-container page-container" style={{ paddingBottom: '120px', backgroundColor: '#F8FAFC' }}>

      {/* Page Header */}
      <div className="fade-in delay-1" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px',
            padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <ChevronLeft size={20} color="#064058" />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Checkout Details</h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '2px' }}>Please complete your order details</p>
        </div>
      </div>

      {/* Selected Service Section */}
      <section className="fade-in delay-2" style={{ marginBottom: '12px' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: 'none' }}>
          <div style={{ width: '100%', height: '110px', backgroundColor: '#E2E8F0', position: 'relative' }}>
            <img
              src={service.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"}
              alt={service.serviceName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
              <span className="service-badge" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Sepatu</span>
            </div>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', marginBottom: '2px' }}>{service.serviceName}</h3>
                <p style={{ color: '#64748B', fontSize: '0.8rem', marginBottom: '8px', lineHeight: 1.3 }}>{service.description}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F1F5F9', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Estimate Duration:</span>
              <span style={{ fontSize: '0.75rem', color: '#064058', fontWeight: 700 }}>{service.duration} Days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Service Type:</span>
              <span style={{ fontSize: '0.75rem', color: '#064058', fontWeight: 700 }}>{service.type?.toUpperCase() || 'GENERAL'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Address Section */}
      <section className="fade-in delay-3" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
            <MapPin size={16} color="#064058" /> Delivery Address
          </h4>
          {addresses.length > 0 && (
            <button
              onClick={() => setShowAddressModal(true)}
              style={{
                background: 'none', border: 'none', color: '#064058',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                padding: '2px 6px', borderRadius: '4px', backgroundColor: '#E8F7FC'
              }}
            >
              Change
            </button>
          )}
        </div>

        <div className="card" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}>
          {selectedAddress ? (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 800 }}>{selectedAddress.label.toUpperCase()}</span>
                {selectedAddress.isDefault && <span style={{ backgroundColor: '#10B981', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>(DEFAULT)</span>}
              </div>
              <p style={{ fontWeight: 700, color: '#1E293B', margin: '0 0 2px 0', fontSize: '0.9rem' }}>{user.name}</p>
              <p style={{ color: '#64748B', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>{selectedAddress.detail}</p>

              {/* Distance Warning */}
              {(pickupMethod === 'Dijemput Admin' || returnMethod === 'Diantar Admin') && selectedAddress.latitude && (
                <div style={{
                  marginTop: '8px', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px',
                  backgroundColor: getDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, selectedAddress.latitude, selectedAddress.longitude) > 15 ? '#FEF2F2' : '#F0FDF4',
                  color: getDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, selectedAddress.latitude, selectedAddress.longitude) > 15 ? '#991B1B' : '#166534',
                  border: `1px solid ${getDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, selectedAddress.latitude, selectedAddress.longitude) > 15 ? '#FCA5A5' : '#BBF7D0'}`
                }}>
                  <AlertCircle size={12} />
                  <span style={{ fontWeight: 600 }}>
                    {getDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, selectedAddress.latitude, selectedAddress.longitude).toFixed(1)} KM
                    {getDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, selectedAddress.latitude, selectedAddress.longitude) > 15 ? ' (Outside Radius, Maks Radius 15KM)' : ' (Inside Radius)'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <p style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '8px' }}>Please add an address first.</p>
              <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => navigate('/profile')}>Go to Profile</button>
            </div>
          )}
        </div>
      </section>

      {/* Delivery Options */}
      <section className="fade-in delay-4" style={{ marginBottom: '12px' }}>
        <h4 style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Truck size={16} color="#064058" /> Delivery Options
        </h4>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Pickup Method</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div
              className={`selectable-card ${pickupMethod === 'Ambil Sendiri' ? 'active' : ''}`}
              style={{ padding: '10px', borderRadius: '10px' }}
              onClick={() => setPickupMethod('Ambil Sendiri')}
            >
              <div style={{ fontSize: '1.1rem' }}>🧍</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Self Drop</div>
              {pickupMethod === 'Ambil Sendiri' && <Check size={14} color="#064058" style={{ marginLeft: 'auto' }} />}
            </div>
            <div
              className={`selectable-card ${pickupMethod === 'Dijemput Admin' ? 'active' : ''}`}
              style={{ padding: '10px', borderRadius: '10px' }}
              onClick={() => setPickupMethod('Dijemput Admin')}
            >
              <div style={{ fontSize: '1.1rem' }}>🚚</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Pickup</div>
              {pickupMethod === 'Dijemput Admin' && <Check size={14} color="#064058" style={{ marginLeft: 'auto' }} />}
            </div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Return Method</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div
              className={`selectable-card ${returnMethod === 'Ambil Sendiri' ? 'active' : ''}`}
              style={{ padding: '10px', borderRadius: '10px' }}
              onClick={() => setReturnMethod('Ambil Sendiri')}
            >
              <div style={{ fontSize: '1.1rem' }}>🧍</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Self Pickup</div>
              {returnMethod === 'Ambil Sendiri' && <Check size={14} color="#064058" style={{ marginLeft: 'auto' }} />}
            </div>
            <div
              className={`selectable-card ${returnMethod === 'Diantar Admin' ? 'active' : ''}`}
              style={{ padding: '10px', borderRadius: '10px' }}
              onClick={() => setReturnMethod('Diantar Admin')}
            >
              <div style={{ fontSize: '1.1rem' }}>🚚</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Delivery</div>
              {returnMethod === 'Diantar Admin' && <Check size={14} color="#064058" style={{ marginLeft: 'auto' }} />}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule & Quantity Grouped */}
      <section className="fade-in delay-5" style={{ marginBottom: '12px' }}>
        <h4 style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={16} color="#064058" /> Schedule & Quantity
        </h4>

        <div className="card" style={{ padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}>
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', margin: 0 }}>Quantity (Pairs)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ width: '32px', height: '32px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#064058', fontWeight: 600, fontSize: '20px' }}
              >
                -
              </button>
              <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: '#1E293B' }}>{quantity}</span>
              <button
                onClick={() => {
                  if (quantity < remainingQuota) {
                     setQuantity(quantity + 1);
                  } else {
                     setError(`Sisa kuota harian hanya ${remainingQuota} pesanan.`);
                     setTimeout(() => {
                       const errBox = document.getElementById('error-box');
                       if (errBox) {
                         errBox.classList.remove('shake-anim');
                         void errBox.offsetWidth;
                         errBox.classList.add('shake-anim');
                         errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                       }
                     }, 50);
                     setTimeout(() => setError(''), 3000);
                  }
                }}
                style={{ width: '32px', height: '32px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#064058', fontWeight: 600, fontSize: '18px' }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '6px', display: 'block', transition: 'all 0.3s ease' }}>{pickupLabel}</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#064058', pointerEvents: 'none', zIndex: 1 }} />
                <input
                  type="date"
                  className="form-input date-input-clean"
                  style={{
                    padding: '10px 8px 10px 34px', fontSize: '0.85rem', borderRadius: '12px',
                    border: '1px solid #E2E8F0', width: '100%', height: '40px'
                  }}
                  placeholder={pickupPlaceholder}
                  value={pickupDate}
                  min={today}
                  onChange={e => handleDateChange(e.target.value)}
                />
              </div>
              {/* Quota Info Display */}
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ 
                  width: '6px', height: '64px', // hidden height
                  display: 'none'
                }}></div>
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 600, 
                  color: quotaInfo.isFull ? '#EF4444' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Info size={10} /> {quotaInfo.message}
                </span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '6px', display: 'block', transition: 'all 0.3s ease' }}>{returnLabel}</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#064058', pointerEvents: 'none', zIndex: 1 }} />
                <input
                  type="date"
                  className="form-input date-input-clean"
                  style={{
                    padding: '10px 8px 10px 34px', fontSize: '0.85rem', borderRadius: '12px',
                    border: '1px solid #E2E8F0', width: '100%', height: '40px'
                  }}
                  placeholder={returnPlaceholder}
                  value={deliveryDate}
                  min={minDeliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notes Section */}
      <section className="fade-in delay-6" style={{ marginBottom: '12px' }}>
        <h4 style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={16} color="#064058" /> Notes
        </h4>
        <textarea
          className="form-textarea"
          style={{
            borderRadius: '12px', border: '1px solid #E2E8F0', padding: '10px 12px',
            backgroundColor: '#F9FAFB', minHeight: '80px', fontSize: '0.85rem', marginTop: '4px'
          }}
          placeholder="Contoh: Sepatu ada noda minyak..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      {/* Upload Photo Section */}
      <section className="fade-in delay-7" style={{ marginBottom: '12px' }}>
        <h4 style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UploadCloud size={16} color="#064058" /> Upload Item Photo
        </h4>

        {photos.length === 0 ? (
          <label className="upload-box" style={{
            border: '2px dashed #CBD5E1', borderRadius: '14px', padding: '20px',
            backgroundColor: 'white', transition: 'all 0.3s ease', display: 'flex',
            flexDirection: 'column', alignItems: 'center', cursor: 'pointer', height: '110px', justifyContent: 'center'
          }}>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
            <UploadCloud size={24} color="#064058" style={{ marginBottom: '6px' }} />
            <p style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>Tap to upload images</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#9CA3AF' }}>Minimal 1 gambar, bisa lebih</p>
          </label>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px',
              scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}>
              {photos.map((p, idx) => (
                <div key={idx} style={{ 
                  position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0', 
                  flexShrink: 0, width: '120px', height: '120px' 
                }}>
                  <img src={p} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removePhoto(idx)}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '50%',
                      width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', cursor: 'pointer', padding: 0
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              <label style={{ 
                flexShrink: 0, width: '120px', height: '120px', borderRadius: '14px', border: '2px dashed #CBD5E1',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                backgroundColor: 'white'
              }}>
                <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                <UploadCloud size={20} color="#64748B" style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Add More</span>
              </label>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>{photos.length} item photo(s) selected</span>
              <span style={{ color: '#EF4444', cursor: 'pointer', fontWeight: 600 }} onClick={() => setPhotos([])}>Clear All</span>
            </p>
          </div>
        )}
      </section>

      {/* Payment Section */}
      <section className="fade-in delay-7" style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CreditCard size={16} color="#064058" /> Payment Method
        </h4>
        <div
          className="selectable-card active"
          style={{ padding: '12px 14px', borderRadius: '14px' }}
        >
          <div style={{ backgroundColor: '#064058', padding: '6px', borderRadius: '8px' }}>
            <ShoppingBag size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>QRIS</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Instant & Secure</div>
          </div>
          <Check size={16} color="#064058" />
        </div>
      </section>

      {error && (
        <div id="error-box" className="auth-error fade-in" style={{ marginBottom: '16px', borderRadius: '8px' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.8rem' }}>{error}</span>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="bottom-bar" style={{
        boxShadow: '0 -8px 16px rgba(0,0,0,0.04)', borderTop: '1px solid #F1F5F9',
        height: '80px', padding: '10px 20px', borderRadius: '20px 20px 0 0'
      }}>
        <div className="action-price">
          {savings > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 700 }}>You save Rp {savings.toLocaleString('id-ID')}!</span>
              <span style={{ fontSize: '0.65rem', color: '#9CA3AF', textDecoration: 'line-through' }}>Rp {totalOriginalPrice.toLocaleString('id-ID')}</span>
            </div>
          )}
          {savings <= 0 && <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Total Price</span>}
          <span style={{ fontWeight: 800, color: '#064058', fontSize: '1.25rem' }}>
            Rp {totalDiscountedPrice.toLocaleString('id-ID')}
          </span>
        </div>
        <button
          className="btn-primary"
          style={{
            width: 'auto', padding: '10px 24px', borderRadius: '12px',
            fontSize: '0.9rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(6, 64, 88, 0.2)',
            transition: 'all 0.2s ease'
          }}
          onClick={handleBuyNow}
          disabled={isLoading}
        >
          {isLoading ? "Wait..." : "Buy Now"}
        </button>
      </div>

      {/* Address Selector Modal */}
      {showAddressModal && (
        <div className="modal-overlay open" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" style={{ borderRadius: '24px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 800 }}>Select Address</h3>
              <button className="close-btn" onClick={() => setShowAddressModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  className={`selectable-card ${selectedAddress?.id === addr.id ? 'active' : ''}`}
                  style={{ marginBottom: '12px', padding: '20px' }}
                  onClick={() => {
                    setSelectedAddress(addr);
                    setShowAddressModal(false);
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 800 }}>{addr.label.toUpperCase()}</span>
                      {addr.isDefault && <span style={{ backgroundColor: '#10B981', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>(DEFAULT)</span>}
                    </div>
                    <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>{addr.detail}</p>
                  </div>
                  {selectedAddress?.id === addr.id && <Check size={20} color="#064058" />}
                </div>
              ))}
            </div>
            <button
              className="btn-primary mt-4"
              onClick={() => setShowAddAddressForm(true)}
              style={{ borderRadius: '16px' }}
            >
              Add New Address
            </button>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddAddressForm && (
        <div className="addr-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddAddressForm(false); }} style={{zIndex: 3000}}>
          <div className="addr-modal-sheet">
            <div className="addr-modal-handle" />
            <h2 className="addr-modal-title">Tambah Alamat Baru</h2>

            <form onSubmit={handleAddAddress}>
              <div className="addr-modal-field">
                <label className="addr-modal-label">Label Alamat</label>
                <input
                  type="text"
                  className="addr-modal-input"
                  placeholder="Contoh: Rumah, Kantor, Kampus"
                  value={newAddress.label}
                  onChange={e => setNewAddress(a => ({ ...a, label: e.target.value }))}
                  required
                />
              </div>

              <div className="addr-modal-field">
                <label className="addr-modal-label">Pilih Lokasi di Peta</label>
                <MapPicker
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              <div className="addr-modal-field">
                <label className="addr-modal-label">Detail Alamat Lengkap</label>
                <textarea
                  className="addr-modal-textarea"
                  rows="3"
                  placeholder="Pilih di peta atau ketik manual..."
                  value={newAddress.detail}
                  onChange={e => setNewAddress(a => ({ ...a, detail: e.target.value }))}
                  required
                />
              </div>

              <div className="addr-modal-actions">
                <button type="submit" className="addr-modal-submit">Simpan Alamat</button>
                <button type="button" className="addr-modal-cancel" onClick={() => setShowAddAddressForm(false)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Storage Full Modal */}
      {showStorageModal && (
        <div className="modal-overlay open" style={{ backdropFilter: 'blur(4px)', zIndex: 2000 }}>
          <div className="modal-content" style={{ borderRadius: '24px', padding: '32px', textAlign: 'center' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF2F2', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
              color: '#EF4444'
            }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1E293B', marginBottom: '12px' }}>Storage is Full!</h3>
            <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Penyimpanan lokal penuh. Silakan hapus beberapa pesanan lama di riwayat atau bersihkan cache browser Anda untuk melanjutkan.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn-primary" 
                onClick={() => setShowStorageModal(false)}
                style={{ borderRadius: '14px', padding: '12px', width: '100%', fontWeight: 700 }}
              >
                Mengerti
              </button>
              <button 
                onClick={() => {
                  if (window.confirm("Hapus semua data (pesanan, alamat, dll)?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                style={{ 
                  backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', 
                  borderRadius: '14px', padding: '12px', width: '100%', fontWeight: 700,
                  fontSize: '0.875rem', cursor: 'pointer'
                }}
              >
                Hapus Semua Data & Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .selectable-card:active {
          transform: scale(0.96);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .shake-anim {
          animation: shake 0.3s ease-in-out;
        }
        .btn-primary:active {
          transform: scale(0.96);
        }
        input:focus {
          border-color: #064058 !important;
          box-shadow: 0 0 0 3px rgba(6, 64, 88, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Checkout;
